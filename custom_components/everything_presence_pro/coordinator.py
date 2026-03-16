"""Coordinator for Everything Presence Pro device connection and state."""

from __future__ import annotations

import logging
import time
from statistics import median
from typing import Any

from aioesphomeapi import (
    APIClient,
    BinarySensorInfo,
    BinarySensorState,
    ReconnectLogic,
    SensorInfo,
    SensorState,
)

from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .calibration import SensorTransform
from .const import CELL_ROOM_INSIDE, DEFAULT_PORT, DOMAIN, MAX_TARGETS, SMOOTH_WINDOW_S
from .zone_engine import Grid, ProcessingResult, Zone, ZoneEngine

_LOGGER = logging.getLogger(__name__)

SIGNAL_ZONES_UPDATED = f"{DOMAIN}_zones_updated"
SIGNAL_TARGETS_UPDATED = f"{DOMAIN}_targets_updated"
SIGNAL_SENSORS_UPDATED = f"{DOMAIN}_sensors_updated"


class TargetSmoother:
    """Rolling median filter on raw sensor coordinates.

    Maintains a time-windowed buffer per target and returns the
    median x and y over the window.
    """

    def __init__(self, window_s: float = SMOOTH_WINDOW_S) -> None:
        """Initialize the smoother."""
        self._window_s = window_s
        self._buffers: list[list[tuple[float, float, float]]] = [
            [] for _ in range(MAX_TARGETS)
        ]

    def update(self, idx: int, x: float, y: float) -> tuple[float, float]:
        """Add a reading and return the smoothed (median) position."""
        now = time.monotonic()
        buf = self._buffers[idx]
        buf.append((x, y, now))
        # Prune old entries
        cutoff = now - self._window_s
        while buf and buf[0][2] < cutoff:
            buf.pop(0)
        # Compute median
        xs = sorted(s[0] for s in buf)
        ys = sorted(s[1] for s in buf)
        return median(xs), median(ys)

    def clear(self, idx: int) -> None:
        """Clear the buffer for a target."""
        self._buffers[idx].clear()

    def clear_all(self) -> None:
        """Clear all buffers."""
        for buf in self._buffers:
            buf.clear()


class EverythingPresenceProCoordinator:
    """Manage connection to an Everything Presence Pro device."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: Any,
    ) -> None:
        """Initialize the coordinator."""
        self.hass = hass
        self.entry = entry

        self._host: str = entry.data.get("host", "")
        self._noise_psk: str = entry.data.get("noise_psk", "")
        self._port: int = entry.data.get("port", DEFAULT_PORT)

        self._client: APIClient | None = None
        self._reconnect_logic: ReconnectLogic | None = None
        self._connected: bool = False

        # Zone engine
        self._zone_engine = ZoneEngine()
        self._zones: list[Zone] = []

        # Calibration
        self._sensor_transform = SensorTransform()
        self._smoother = TargetSmoother()

        # Room layout
        self._room_layout: dict[str, Any] = {}

        # Target state: list of (x, y, active) tuples
        self._targets: list[tuple[float, float, bool]] = [
            (0.0, 0.0, False) for _ in range(MAX_TARGETS)
        ]
        self._target_x: list[float] = [0.0] * MAX_TARGETS
        self._target_y: list[float] = [0.0] * MAX_TARGETS
        self._target_active: list[bool] = [False] * MAX_TARGETS

        # Sensor states
        self._static_present: bool = False
        self._pir_motion: bool = False
        self._illuminance: float | None = None
        self._temperature: float | None = None
        self._humidity: float | None = None
        self._co2: float | None = None

        # Processing result
        self._last_result: ProcessingResult = ProcessingResult()
        self._rebuild_scheduled: bool = False

        # ESPHome entity key mapping (populated during subscription)
        self._sensor_key_map: dict[int, str] = {}
        self._binary_sensor_key_map: dict[int, str] = {}

    # -- Public properties --

    @property
    def zones(self) -> list[Zone]:
        """Return configured zones."""
        return self._zones

    @property
    def last_result(self) -> ProcessingResult:
        """Return the last processing result."""
        return self._last_result

    @property
    def static_present(self) -> bool:
        """Return whether static presence is detected."""
        return self._static_present

    @property
    def pir_motion(self) -> bool:
        """Return whether PIR motion is detected."""
        return self._pir_motion

    @property
    def illuminance(self) -> float | None:
        """Return the illuminance value."""
        return self._illuminance

    @property
    def temperature(self) -> float | None:
        """Return the temperature value."""
        return self._temperature

    @property
    def humidity(self) -> float | None:
        """Return the humidity value."""
        return self._humidity

    @property
    def co2(self) -> float | None:
        """Return the CO2 value."""
        return self._co2

    @property
    def device_occupied(self) -> bool:
        """Return whether any target is actively detected."""
        return self._last_result.device_tracking_present

    @property
    def connected(self) -> bool:
        """Return whether the device is connected."""
        return self._connected

    @property
    def targets(self) -> list[tuple[float, float, bool]]:
        """Return the current target positions."""
        return list(self._targets)

    @property
    def raw_targets(self) -> list[tuple[float, float, bool]]:
        """Return the raw (untransformed) target positions."""
        return [
            (self._target_x[i], self._target_y[i], self._target_active[i])
            for i in range(MAX_TARGETS)
        ]

    @property
    def sensor_transform(self) -> SensorTransform:
        """Return the sensor transform."""
        return self._sensor_transform

    @property
    def zone_engine(self) -> ZoneEngine:
        """Return the zone engine."""
        return self._zone_engine

    # -- Configuration methods --

    def set_zones(self, zones: list[Zone]) -> None:
        """Set the zone configuration."""
        self._zones = zones
        self._zone_engine.set_zones(zones)

    def set_sensor_transform(self, transform: SensorTransform) -> None:
        """Set the sensor transform, rebuild grid, and reset smoothing."""
        self._sensor_transform = transform
        self._smoother.clear_all()
        self._rebuild_grid()

    def set_room_layout(self, layout: dict[str, Any]) -> None:
        """Set the room layout configuration."""
        self._room_layout = layout

    def _rebuild_grid(self) -> None:
        """Compute grid dimensions from perspective + room size and set on zone engine."""
        t = self._sensor_transform
        if t.perspective is None:
            return
        origin_x, origin_y, cols, rows = Grid.compute_extent(
            t.perspective, t.room_width, t.room_depth
        )
        grid = Grid(origin_x=origin_x, origin_y=origin_y, cols=cols, rows=rows)
        # Mark cells inside the room rectangle as room
        for r in range(rows):
            for c in range(cols):
                cx = origin_x + (c + 0.5) * grid.cell_size
                cy = origin_y + (r + 0.5) * grid.cell_size
                if 0 <= cx < t.room_width and 0 <= cy < t.room_depth:
                    grid.cells[r * cols + c] = CELL_ROOM_INSIDE
        self._zone_engine.set_grid(grid)

    # -- Connection management --

    async def async_connect(self) -> None:
        """Connect to the ESPHome device with automatic reconnection."""
        self._client = APIClient(
            self._host,
            self._port,
            "",
            noise_psk=self._noise_psk,
        )

        self._reconnect_logic = ReconnectLogic(
            client=self._client,
            on_connect=self._on_connect,
            on_disconnect=self._on_disconnect,
            zeroconf_instance=None,
            name=self._host,
            on_connect_error=self._on_connect_error,
        )
        await self._reconnect_logic.start()

    async def _on_connect(self) -> None:
        """Handle successful connection."""
        self._connected = True
        _LOGGER.debug("Connected to %s", self._host)
        self._sensor_key_map.clear()
        self._binary_sensor_key_map.clear()
        await self.subscribe_targets()

    async def _on_disconnect(self, expected_disconnect: bool) -> None:
        """Handle disconnection — ReconnectLogic will auto-retry."""
        self._connected = False
        if not expected_disconnect:
            _LOGGER.warning("Disconnected from %s, will retry", self._host)
        else:
            _LOGGER.debug("Disconnected from %s (expected)", self._host)

    async def _on_connect_error(self, error: Exception) -> None:
        """Handle connection error during reconnection attempt."""
        _LOGGER.debug("Connection error for %s: %s", self._host, error)

    async def async_disconnect(self) -> None:
        """Disconnect from the device and stop reconnection."""
        if self._reconnect_logic is not None:
            await self._reconnect_logic.stop()
            self._reconnect_logic = None
        if self._client is not None:
            try:
                await self._client.disconnect()
            except Exception:
                _LOGGER.debug("Error disconnecting from %s", self._host)
        self._connected = False
        self._client = None

    async def subscribe_targets(self) -> None:
        """Subscribe to ESPHome state updates."""
        if self._client is None:
            return

        entities, _ = await self._client.list_entities_services()

        # Build key maps from entity list
        for entity_info in entities:
            object_id = getattr(entity_info, "object_id", "")
            key = getattr(entity_info, "key", None)
            if key is None:
                continue

            name = self._classify_entity(object_id)
            if name is None:
                continue

            if isinstance(entity_info, BinarySensorInfo):
                self._binary_sensor_key_map[key] = name
                _LOGGER.debug(
                    "Mapped binary sensor %s (key=%s) -> %s",
                    object_id, key, name,
                )
            elif isinstance(entity_info, SensorInfo):
                self._sensor_key_map[key] = name
                _LOGGER.debug(
                    "Mapped sensor %s (key=%s) -> %s",
                    object_id, key, name,
                )

        self._client.subscribe_states(self._on_state)

    def _classify_entity(self, object_id: str) -> str | None:
        """Classify an ESPHome entity object_id to an internal name.

        EP Pro object_ids are often prefixed with the device name, e.g.
        'everything_presence_pro_abc123_target_1_x', so we use suffix/substring
        matching rather than exact matching.
        """
        lower = object_id.lower()

        # Target sensors: *target_1_x, *target_1_y, *target_1_active, etc.
        for n in range(1, MAX_TARGETS + 1):
            if lower.endswith(f"target_{n}_x"):
                return f"target_{n}_x"
            if lower.endswith(f"target_{n}_y"):
                return f"target_{n}_y"
            if lower.endswith(f"target_{n}_active"):
                return f"target_{n}_active"

        # Presence sensors
        if "mmwave" in lower or "static_presence" in lower:
            return "static_presence"
        if "pir" in lower or "motion" in lower:
            return "pir_motion"

        # Environment sensors
        if "illuminance" in lower or "illumination" in lower:
            return "illuminance"
        if "temperature" in lower:
            return "temperature"
        if "humidity" in lower:
            return "humidity"
        if "co2" in lower:
            return "co2"

        return None

    def _on_state(self, state: Any) -> None:
        """Handle an incoming state update from ESPHome."""
        key = getattr(state, "key", None)
        if key is None:
            return

        # Look up in both key maps
        name = self._sensor_key_map.get(key) or self._binary_sensor_key_map.get(key)
        if name is None:
            return

        if isinstance(state, BinarySensorState):
            self._handle_binary_sensor(name, state.state)
        elif isinstance(state, SensorState):
            self._handle_sensor(name, state.state)

    def _handle_binary_sensor(self, name: str, value: bool) -> None:
        """Handle a binary sensor state update."""
        if name == "static_presence":
            self._static_present = value
            self._dispatch_sensor_update()
        elif name == "pir_motion":
            self._pir_motion = value
            self._dispatch_sensor_update()
        elif name.startswith("target_") and name.endswith("_active"):
            idx = self._target_index(name)
            if idx is not None:
                self._target_active[idx] = value
                self._schedule_rebuild()

    def _handle_sensor(self, name: str, value: float) -> None:
        """Handle a sensor state update."""
        if name == "illuminance":
            self._illuminance = value
            self._dispatch_sensor_update()
        elif name == "temperature":
            self._temperature = value
            self._dispatch_sensor_update()
        elif name == "humidity":
            self._humidity = value
            self._dispatch_sensor_update()
        elif name == "co2":
            self._co2 = value
            self._dispatch_sensor_update()
        elif name.startswith("target_") and name.endswith("_x"):
            idx = self._target_index(name)
            if idx is not None:
                self._target_x[idx] = value
                self._schedule_rebuild()
        elif name.startswith("target_") and name.endswith("_y"):
            idx = self._target_index(name)
            if idx is not None:
                self._target_y[idx] = value
                self._schedule_rebuild()

    def _dispatch_sensor_update(self) -> None:
        """Dispatch a signal for environment sensor updates only."""
        async_dispatcher_send(
            self.hass, f"{SIGNAL_SENSORS_UPDATED}_{self.entry.entry_id}"
        )

    def _schedule_rebuild(self) -> None:
        """Schedule a target rebuild on the next event loop iteration.

        Batches multiple x/y/active updates from the same ESPHome message
        into a single rebuild + dispatch cycle.
        """
        if self._rebuild_scheduled:
            return
        self._rebuild_scheduled = True
        self.hass.loop.call_soon(self._do_rebuild)

    def _target_index(self, name: str) -> int | None:
        """Extract the 0-based target index from a name like target_1_x."""
        parts = name.split("_")
        if len(parts) >= 2:
            try:
                n = int(parts[1])
                if 1 <= n <= MAX_TARGETS:
                    return n - 1
            except ValueError:
                pass
        return None

    def _do_rebuild(self) -> None:
        """Rebuild target list, apply smoothing + calibration, run zone engine, dispatch."""
        self._rebuild_scheduled = False
        calibrated: list[tuple[float, float, bool]] = []
        for i in range(MAX_TARGETS):
            if self._target_active[i]:
                # Smooth raw coordinates
                sx, sy = self._smoother.update(
                    i, self._target_x[i], self._target_y[i]
                )
                # Apply perspective transform + clamp
                cx, cy = self._sensor_transform.apply(sx, sy)
                calibrated.append((cx, cy, True))
            else:
                self._smoother.clear(i)
                calibrated.append((self._target_x[i], self._target_y[i], False))

        self._targets = calibrated
        self._last_result = self._zone_engine.process_targets(calibrated)

        async_dispatcher_send(
            self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}"
        )
        async_dispatcher_send(
            self.hass, f"{SIGNAL_ZONES_UPDATED}_{self.entry.entry_id}"
        )

    # -- Config serialization --

    def get_config_data(self) -> dict[str, Any]:
        """Serialize the current configuration to a dictionary."""
        grid = self._zone_engine.grid
        return {
            "zones": [
                {
                    "id": z.id,
                    "name": z.name,
                    "sensitivity": z.sensitivity,
                    "color": z.color,
                }
                for z in self._zones
            ],
            "calibration": self._sensor_transform.to_dict(),
            "grid": grid.to_base64(),
            "grid_origin_x": grid.origin_x,
            "grid_origin_y": grid.origin_y,
            "grid_cols": grid.cols,
            "grid_rows": grid.rows,
            "room_layout": self._room_layout,
        }

    def load_config_data(self, data: dict[str, Any]) -> None:
        """Load configuration from a dictionary."""
        if not data:
            return

        # Load calibration
        cal_data = data.get("calibration")
        if cal_data:
            self._sensor_transform = SensorTransform.from_dict(cal_data)

        # Load grid
        grid_data = data.get("grid")
        if grid_data and data.get("grid_cols"):
            grid = Grid.from_base64(
                grid_data,
                cols=data["grid_cols"],
                rows=data["grid_rows"],
                origin_x=data.get("grid_origin_x", 0.0),
                origin_y=data.get("grid_origin_y", 0.0),
            )
            self._zone_engine.set_grid(grid)
        elif cal_data and cal_data.get("perspective"):
            # No saved grid — compute from perspective
            self._rebuild_grid()

        # Load zones
        zone_list = data.get("zones", [])
        zones = [
            Zone(
                id=z["id"],
                name=z["name"],
                sensitivity=z.get("sensitivity", "normal"),
                color=z.get("color", ""),
            )
            for z in zone_list
        ]
        self.set_zones(zones)

        # Load room layout
        self._room_layout = data.get("room_layout", {})

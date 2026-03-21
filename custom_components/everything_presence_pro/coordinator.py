"""Coordinator for Everything Presence Pro device connection and state."""

from __future__ import annotations

import logging
import math
import time
from typing import Any

from aioesphomeapi import APIClient
from aioesphomeapi import BinarySensorInfo
from aioesphomeapi import BinarySensorState
from aioesphomeapi import ReconnectLogic
from aioesphomeapi import SensorInfo
from aioesphomeapi import SensorState
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .calibration import SensorTransform
from .const import CELL_ROOM_BIT
from .const import DEFAULT_PORT
from .const import DOMAIN
from .const import GRID_CELL_SIZE_MM
from .const import GRID_COLS
from .const import GRID_ROWS
from .const import MAX_TARGETS
from .const import ZONE_TYPE_DEFAULTS
from .const import ZONE_TYPE_NORMAL
from .zone_engine import Grid
from .zone_engine import ProcessingResult
from .zone_engine import TargetResult
from .zone_engine import TargetStatus
from .zone_engine import Zone
from .zone_engine import ZoneEngine

_LOGGER = logging.getLogger(__name__)

SIGNAL_ZONES_UPDATED = f"{DOMAIN}_zones_updated"
SIGNAL_TARGETS_UPDATED = f"{DOMAIN}_targets_updated"
SIGNAL_SENSORS_UPDATED = f"{DOMAIN}_sensors_updated"


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

        # Room layout
        self._room_layout: dict[str, Any] = {}

        # Target state
        self._target_x: list[float] = [0.0] * MAX_TARGETS
        self._target_y: list[float] = [0.0] * MAX_TARGETS
        self._target_speed: list[float] = [0.0] * MAX_TARGETS
        self._target_resolution: list[float] = [0.0] * MAX_TARGETS
        self._target_active: list[bool] = [False] * MAX_TARGETS

        # Sensor states
        self._static_present: bool = False
        self._pir_motion: bool = False
        self._illuminance: float | None = None
        self._temperature: float | None = None
        self._humidity: float | None = None
        self._co2: float | None = None

        # Environmental offsets (loaded from config entry options)
        offsets = entry.options.get("config", {}).get("offsets", {})
        self._illuminance_offset: float = offsets.get("illuminance", 0.0)
        self._temperature_offset: float = offsets.get("temperature", 0.0)
        self._humidity_offset: float = offsets.get("humidity", 0.0)

        # Processing result
        self._last_result: ProcessingResult = ProcessingResult()
        self._window_timer: object | None = None
        self._stale_timer: object | None = None

        # ESPHome entity key mapping (populated during subscription)
        self._sensor_key_map: dict[int, str] = {}
        self._binary_sensor_key_map: dict[int, str] = {}

    # -- Public properties --

    @property
    def zones(self) -> list[Zone]:
        """Return configured zones."""
        return self._zones

    def get_zone_by_slot(self, slot: int) -> Zone | None:
        """Return the zone configured in a slot, or None if empty."""
        for zone in self._zones:
            if zone.id == slot:
                return zone
        return None

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
        """Return the illuminance value with offset applied."""
        if self._illuminance is None:
            return None
        return max(0.0, self._illuminance + self._illuminance_offset)

    @property
    def temperature(self) -> float | None:
        """Return the temperature value with offset applied."""
        if self._temperature is None:
            return None
        return self._temperature + self._temperature_offset

    @property
    def humidity(self) -> float | None:
        """Return the humidity value with offset applied."""
        if self._humidity is None:
            return None
        return self._humidity + self._humidity_offset

    @property
    def co2(self) -> float | None:
        """Return the CO2 value."""
        return self._co2

    @property
    def device_occupied(self) -> bool:
        """Return whether the room is occupied (PIR or static or tracking)."""
        return self._pir_motion or self._static_present or self._last_result.device_tracking_present

    @property
    def target_present(self) -> bool:
        """Return whether any target is actively tracked."""
        return any(t.status == TargetStatus.ACTIVE for t in self.targets)

    @property
    def target_count(self) -> int:
        """Return the number of active targets."""
        return sum(1 for t in self.targets if t.status == TargetStatus.ACTIVE)

    def target_distance(self, index: int) -> float | None:
        """Return the distance from sensor to a target in mm."""
        targets = self.targets
        if index >= len(targets) or targets[index].status != TargetStatus.ACTIVE:
            return None
        t = targets[index]
        return (t.x * t.x + t.y * t.y) ** 0.5

    def target_speed(self, index: int) -> float | None:
        """Return the speed of a target in mm/s."""
        if index >= MAX_TARGETS or not self._target_active[index]:
            return None
        return self._target_speed[index] * 10  # ESPHome reports cm/s

    def target_resolution(self, index: int) -> float | None:
        """Return the resolution of a target in mm."""
        if index >= MAX_TARGETS or not self._target_active[index]:
            return None
        return self._target_resolution[index]

    def target_angle(self, index: int) -> float | None:
        """Return the angle from sensor to a target in degrees."""
        targets = self.targets
        if index >= len(targets) or targets[index].status != TargetStatus.ACTIVE:
            return None
        t = targets[index]
        if t.x == 0 and t.y == 0:
            return None
        import math

        return math.degrees(math.atan2(t.x, t.y))

    @property
    def connected(self) -> bool:
        """Return whether the device is connected."""
        return self._connected

    @property
    def targets(self) -> list[TargetResult]:
        """Return the current target results from zone engine."""
        return list(self._last_result.targets) if self._last_result else []

    @property
    def raw_targets(self) -> list[tuple[float, float, bool]]:
        """Return the raw (untransformed) target positions."""
        return [(self._target_x[i], self._target_y[i], self._target_active[i]) for i in range(MAX_TARGETS)]

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
        """Set the sensor transform and rebuild grid."""
        self._sensor_transform = transform
        self._rebuild_grid()

    def set_offsets(self, offsets: dict[str, float]) -> None:
        """Update environmental sensor offsets."""
        self._illuminance_offset = offsets.get("illuminance", 0.0)
        self._temperature_offset = offsets.get("temperature", 0.0)
        self._humidity_offset = offsets.get("humidity", 0.0)
        self._dispatch_sensor_update()

    def set_room_layout(self, layout: dict[str, Any]) -> None:
        """Set the room layout configuration and update the zone engine grid."""
        self._room_layout = layout
        grid_bytes = layout.get("grid_bytes")
        if grid_bytes and isinstance(grid_bytes, list):
            self._load_frontend_grid(grid_bytes)

    def _load_frontend_grid(self, grid_bytes: list[int]) -> None:
        """Create a grid matching the frontend layout and load cell bytes.

        The frontend uses a fixed grid (300mm cells) with the room
        centered horizontally. We compute the grid origin so that room
        coordinate (0, 0) maps to the correct cell.
        """
        cols = GRID_COLS
        rows = GRID_ROWS
        cell_size = GRID_CELL_SIZE_MM
        # Room is centered horizontally in the 20-col grid
        t = self._sensor_transform
        room_cols = max(1, math.ceil(t.room_width / cell_size)) if t.room_width > 0 else cols
        start_col = (cols - room_cols) // 2
        # Grid origin: room x=0 is at start_col, room y=0 is at row 0
        origin_x = -start_col * cell_size
        origin_y = 0.0
        grid = Grid(
            origin_x=origin_x,
            origin_y=origin_y,
            cols=cols,
            rows=rows,
            cell_size=cell_size,
        )
        grid.load_from_bytes(bytes(grid_bytes))
        _LOGGER.debug(
            "Loaded frontend grid: %dx%d, origin=(%.0f, %.0f), room_width=%.0f, start_col=%d",
            cols,
            rows,
            origin_x,
            origin_y,
            t.room_width,
            start_col,
        )
        self._zone_engine.set_grid(grid)

    def _rebuild_grid(self) -> None:
        """Compute grid dimensions from perspective + room size and set on zone engine."""
        t = self._sensor_transform
        if t.perspective is None:
            return
        origin_x, origin_y, cols, rows = Grid.compute_extent(t.perspective, t.room_width, t.room_depth)
        grid = Grid(origin_x=origin_x, origin_y=origin_y, cols=cols, rows=rows)
        # Mark cells inside the room rectangle as room
        for r in range(rows):
            for c in range(cols):
                cx = origin_x + (c + 0.5) * grid.cell_size
                cy = origin_y + (r + 0.5) * grid.cell_size
                if 0 <= cx < t.room_width and 0 <= cy < t.room_depth:
                    grid.cells[r * cols + c] = CELL_ROOM_BIT
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
                    object_id,
                    key,
                    name,
                )
            elif isinstance(entity_info, SensorInfo):
                self._sensor_key_map[key] = name
                _LOGGER.debug(
                    "Mapped sensor %s (key=%s) -> %s",
                    object_id,
                    key,
                    name,
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
            if lower.endswith(f"target_{n}_speed"):
                return f"target_{n}_speed"
            if lower.endswith(f"target_{n}_resolution"):
                return f"target_{n}_resolution"
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
        elif name.startswith("target_") and name.endswith("_speed"):
            idx = self._target_index(name)
            if idx is not None:
                self._target_speed[idx] = value
                self._schedule_rebuild()
        elif name.startswith("target_") and name.endswith("_resolution"):
            idx = self._target_index(name)
            if idx is not None:
                self._target_resolution[idx] = value
                self._schedule_rebuild()

    def _dispatch_sensor_update(self) -> None:
        """Dispatch a signal for environment sensor updates only."""
        async_dispatcher_send(self.hass, f"{SIGNAL_SENSORS_UPDATED}_{self.entry.entry_id}")

    def _schedule_rebuild(self) -> None:
        """Feed raw target data to the zone engine on each state update."""
        now = time.monotonic()
        calibrated = self._build_calibrated_targets()

        result = self._zone_engine.feed_raw(calibrated, now)

        if result is not None:
            # Window ticked — update state and dispatch
            self._last_result = result
            async_dispatcher_send(self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}")

        # Schedule a single callback at the soonest pending zone expiry
        self._schedule_expiry_tick()

        # Safety: if sensor updates stop (unchanged values = no callbacks),
        # _last_result would go stale.  Schedule a fallback tick so the zone
        # engine still processes the "no targets" transition.
        if self._stale_timer is not None:
            self._stale_timer.cancel()
        self._stale_timer = self.hass.loop.call_later(1.5, self._stale_tick)

    def _stale_tick(self) -> None:
        """Feed current sensor state after sensor updates stopped flowing."""
        self._stale_timer = None
        self._schedule_rebuild()

    def _schedule_expiry_tick(self) -> None:
        """Schedule a single callback when the next pending zone should expire."""
        if self._window_timer is not None:
            self._window_timer.cancel()
            self._window_timer = None

        expiry = self._zone_engine.next_expiry()
        if expiry is None:
            return

        delay = max(0.1, expiry - time.monotonic())
        self._window_timer = self.hass.loop.call_later(delay, self._expiry_tick)

    def _expiry_tick(self) -> None:
        """Feed empty targets at timeout expiry to clear zone entity states."""
        self._window_timer = None
        now = time.monotonic()
        empty = [(0.0, 0.0, False)] * MAX_TARGETS
        result = self._zone_engine.feed_raw(empty, now)
        if result is not None:
            self._last_result = result
            async_dispatcher_send(self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}")
        # If more zones are still pending, schedule the next expiry
        self._schedule_expiry_tick()

    def _build_calibrated_targets(self) -> list[tuple[float, float, bool]]:
        """Build calibrated target list from current raw state."""
        grid = self._zone_engine.grid
        calibrated: list[tuple[float, float, bool]] = []
        for i in range(MAX_TARGETS):
            if self._target_active[i]:
                cx, cy = self._sensor_transform.apply(self._target_x[i], self._target_y[i])
                cell = grid.xy_to_cell(cx, cy)
                inside = cell is not None and grid.cell_is_room(cell)
                calibrated.append((cx, cy, inside))
            else:
                calibrated.append((self._target_x[i], self._target_y[i], False))
        return calibrated

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

    # -- Config serialization --

    def get_config_data(self) -> dict[str, Any]:
        """Serialize the current configuration to a dictionary."""
        grid = self._zone_engine.grid
        return {
            "zones": [
                {
                    "id": z.id,
                    "name": z.name,
                    "type": z.type,
                    "color": z.color,
                    "trigger": z.trigger,
                    "renew": z.renew,
                    "timeout": z.timeout,
                    "handoff_timeout": z.handoff_timeout,
                    "entry_point": z.entry_point,
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
            "reporting": self.entry.options.get("config", {}).get("reporting", {}),
            "offsets": {
                "illuminance": self._illuminance_offset,
                "temperature": self._temperature_offset,
                "humidity": self._humidity_offset,
            },
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

        # Load room layout
        self._room_layout = data.get("room_layout", {})

        # Load grid bytes from room layout (overrides base64 grid if present)
        grid_bytes = self._room_layout.get("grid_bytes")
        if grid_bytes and isinstance(grid_bytes, list):
            self._load_frontend_grid(grid_bytes)

        # Load zones from room_layout.zone_slots (new format) or data.zones (legacy)
        zone_slots = self._room_layout.get("zone_slots")
        if zone_slots:
            zones = [
                Zone(
                    id=i + 1,
                    name=z["name"],
                    type=z.get("type", ZONE_TYPE_NORMAL),
                    color=z.get("color", ""),
                    trigger=z.get("trigger", ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL]["trigger"]),
                    renew=z.get("renew", ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL]["renew"]),
                    timeout=z.get("timeout", ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL]["timeout"]),
                    handoff_timeout=z.get("handoff_timeout", ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL]["handoff_timeout"]),
                    entry_point=z.get("entry_point", False),
                )
                for i, z in enumerate(zone_slots)
                if z is not None
            ]
        else:
            zone_list = data.get("zones", [])
            zones = [
                Zone(
                    id=z["id"],
                    name=z["name"],
                    type=z.get("type", ZONE_TYPE_NORMAL),
                    color=z.get("color", ""),
                    trigger=z.get("trigger", ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL]["trigger"]),
                    renew=z.get("renew", ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL]["renew"]),
                    timeout=z.get("timeout", ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL]["timeout"]),
                    handoff_timeout=z.get("handoff_timeout", ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL]["handoff_timeout"]),
                    entry_point=z.get("entry_point", False),
                )
                for z in zone_list
            ]
        self.set_zones(zones)

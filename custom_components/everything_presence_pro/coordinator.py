"""Coordinator for Everything Presence Pro device connection and state."""

from __future__ import annotations

import logging
from typing import Any

from aioesphomeapi import (
    APIClient,
    BinarySensorInfo,
    BinarySensorState,
    SensorInfo,
    SensorState,
)

from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .calibration import SensorTransform
from .const import DEFAULT_PORT, DOMAIN, MAX_TARGETS
from .zone_engine import ProcessingResult, Zone, ZoneEngine

_LOGGER = logging.getLogger(__name__)

SIGNAL_ZONES_UPDATED = f"{DOMAIN}_zones_updated"
SIGNAL_TARGETS_UPDATED = f"{DOMAIN}_targets_updated"


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
        self._connected: bool = False

        # Zone engine
        self._zone_engine = ZoneEngine()
        self._zones: list[Zone] = []

        # Calibration
        self._sensor_transform = SensorTransform()

        # Room layout
        self._room_layout: dict[str, Any] = {}

        # Setup config
        self._room_name: str = ""
        self._placement: str = ""  # "wall" | "left_corner" | "right_corner"
        self._mirrored: bool = False  # X axis flipped (sensor upside down)
        self._room_bounds: dict[str, float] = {}  # far_y, left_x, right_x

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
    def room_name(self) -> str:
        """Return the room name."""
        return self._room_name

    @property
    def placement(self) -> str:
        """Return the sensor placement."""
        return self._placement

    @property
    def mirrored(self) -> bool:
        """Return whether the X axis is mirrored."""
        return self._mirrored

    @property
    def room_bounds(self) -> dict[str, float]:
        """Return the room bounds in sensor mm coordinates."""
        return self._room_bounds

    @property
    def connected(self) -> bool:
        """Return whether the device is connected."""
        return self._connected

    @property
    def targets(self) -> list[tuple[float, float, bool]]:
        """Return the current target positions."""
        return list(self._targets)

    @property
    def sensor_transform(self) -> SensorTransform:
        """Return the sensor transform."""
        return self._sensor_transform

    # -- Configuration methods --

    def set_zones(self, zones: list[Zone]) -> None:
        """Set the zone configuration."""
        self._zones = zones
        self._zone_engine.set_zones(zones)

    def set_sensor_transform(self, transform: SensorTransform) -> None:
        """Set the sensor transform."""
        self._sensor_transform = transform

    def set_room_layout(self, layout: dict[str, Any]) -> None:
        """Set the room layout configuration."""
        self._room_layout = layout

    # -- Connection management --

    async def async_connect(self) -> None:
        """Connect to the ESPHome device and subscribe to states."""
        self._client = APIClient(
            self._host,
            self._port,
            "",
            noise_psk=self._noise_psk,
        )

        try:
            await self._client.connect(login=True)
        except Exception:
            _LOGGER.error("Failed to connect to %s", self._host)
            raise

        self._connected = True
        _LOGGER.debug("Connected to %s", self._host)

        await self.subscribe_targets()

    async def async_disconnect(self) -> None:
        """Disconnect from the device."""
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
            self._dispatch_update()
        elif name == "pir_motion":
            self._pir_motion = value
            self._dispatch_update()
        elif name.startswith("target_") and name.endswith("_active"):
            idx = self._target_index(name)
            if idx is not None:
                self._target_active[idx] = value
                self._rebuild_targets()

    def _handle_sensor(self, name: str, value: float) -> None:
        """Handle a sensor state update."""
        if name == "illuminance":
            self._illuminance = value
            self._dispatch_update()
        elif name == "temperature":
            self._temperature = value
            self._dispatch_update()
        elif name == "humidity":
            self._humidity = value
            self._dispatch_update()
        elif name == "co2":
            self._co2 = value
            self._dispatch_update()
        elif name.startswith("target_") and name.endswith("_x"):
            idx = self._target_index(name)
            if idx is not None:
                self._target_x[idx] = value
                self._rebuild_targets()
        elif name.startswith("target_") and name.endswith("_y"):
            idx = self._target_index(name)
            if idx is not None:
                self._target_y[idx] = value
                self._rebuild_targets()

    def _dispatch_update(self) -> None:
        """Dispatch a signal to update HA entities."""
        async_dispatcher_send(
            self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}"
        )

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

    def _rebuild_targets(self) -> None:
        """Rebuild target list, apply calibration, run zone engine, dispatch."""
        calibrated: list[tuple[float, float, bool]] = []
        for i in range(MAX_TARGETS):
            if self._target_active[i]:
                cx, cy = self._sensor_transform.apply(
                    self._target_x[i], self._target_y[i]
                )
                calibrated.append((cx, cy, True))
            else:
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
        return {
            "zones": [
                {
                    "id": z.id,
                    "name": z.name,
                    "sensitivity": z.sensitivity,
                    "cells": z.cells,
                }
                for z in self._zones
            ],
            "calibration": self._sensor_transform.to_dict(),
            "room_layout": self._room_layout,
            "room_name": self._room_name,
            "placement": self._placement,
            "mirrored": self._mirrored,
            "room_bounds": self._room_bounds,
        }

    def load_config_data(self, data: dict[str, Any]) -> None:
        """Load configuration from a dictionary."""
        if not data:
            return

        # Load zones
        zone_list = data.get("zones", [])
        zones = [
            Zone(
                id=z["id"],
                name=z["name"],
                sensitivity=z["sensitivity"],
                cells=z["cells"],
            )
            for z in zone_list
        ]
        self.set_zones(zones)

        # Load calibration
        cal_data = data.get("calibration")
        if cal_data:
            self._sensor_transform = SensorTransform.from_dict(cal_data)

        # Load room layout
        self._room_layout = data.get("room_layout", {})

        # Load setup config
        self._room_name = data.get("room_name", "")
        self._placement = data.get("placement", "")
        self._mirrored = data.get("mirrored", False)
        self._room_bounds = data.get("room_bounds", {})

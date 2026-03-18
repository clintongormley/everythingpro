"""Sensor entities for Everything Presence Pro."""

from __future__ import annotations

from math import isfinite

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import (
    LIGHT_LUX,
    PERCENTAGE,
    CONCENTRATION_PARTS_PER_MILLION,
    UnitOfLength,
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import EverythingPresenceProConfigEntry
from .const import DOMAIN, MAX_TARGETS, MAX_ZONES
from .coordinator import (
    EverythingPresenceProCoordinator,
    SIGNAL_SENSORS_UPDATED,
    SIGNAL_TARGETS_UPDATED,
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EverythingPresenceProConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up sensor entities from a config entry."""
    coordinator: EverythingPresenceProCoordinator = entry.runtime_data

    entities: list[SensorEntity] = [
        EverythingPresenceProIlluminanceSensor(coordinator),
        EverythingPresenceProTemperatureSensor(coordinator),
        EverythingPresenceProHumiditySensor(coordinator),
    ]

    # CO2 sensor is optional (SCD40 module)
    if coordinator.co2 is not None:
        entities.append(EverythingPresenceProCO2Sensor(coordinator))

    # Room-level target count (disabled by default)
    entities.append(EverythingPresenceProRoomTargetCountSensor(coordinator))

    # Per-target sensors (disabled by default)
    for idx in range(MAX_TARGETS):
        entities.append(EverythingPresenceProTargetXYSensorSensor(coordinator, idx))
        entities.append(EverythingPresenceProTargetXYGridSensor(coordinator, idx))
        entities.append(EverythingPresenceProTargetDistanceSensor(coordinator, idx))
        entities.append(EverythingPresenceProTargetAngleSensor(coordinator, idx))
        entities.append(EverythingPresenceProTargetSpeedSensor(coordinator, idx))
        entities.append(EverythingPresenceProTargetResolutionSensor(coordinator, idx))

    # Zone 0 = "rest of room" target count (disabled by default)
    entities.append(
        EverythingPresenceProZoneTargetCountSensor(coordinator, 0)
    )

    # Pre-create all 7 zone target count entities (disabled by default)
    for slot in range(1, MAX_ZONES + 1):
        entities.append(
            EverythingPresenceProZoneTargetCountSensor(coordinator, slot)
        )

    async_add_entities(entities)


class EverythingPresenceProIlluminanceSensor(SensorEntity):
    """BH1750 illuminance sensor."""

    _attr_has_entity_name = True
    _attr_device_class = SensorDeviceClass.ILLUMINANCE
    _attr_native_unit_of_measurement = LIGHT_LUX
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 1
    _attr_translation_key = "illuminance"

    def __init__(self, coordinator: EverythingPresenceProCoordinator) -> None:
        """Initialize the illuminance sensor."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_illuminance"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def native_value(self) -> float | None:
        """Return the illuminance value."""
        value = self._coordinator.illuminance
        if value is None or not isfinite(value):
            return None
        return value

    async def async_added_to_hass(self) -> None:
        """Subscribe to sensor updates when added to hass."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_SENSORS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )

    @callback
    def _on_update(self) -> None:
        """Handle update."""
        self.async_write_ha_state()


class EverythingPresenceProTemperatureSensor(SensorEntity):
    """SHTC3 temperature sensor."""

    _attr_has_entity_name = True
    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_translation_key = "temperature"

    def __init__(self, coordinator: EverythingPresenceProCoordinator) -> None:
        """Initialize the temperature sensor."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_temperature"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def native_value(self) -> float | None:
        """Return the temperature value."""
        return self._coordinator.temperature

    async def async_added_to_hass(self) -> None:
        """Subscribe to sensor updates when added to hass."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_SENSORS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )

    @callback
    def _on_update(self) -> None:
        """Handle update."""
        self.async_write_ha_state()


class EverythingPresenceProHumiditySensor(SensorEntity):
    """SHTC3 humidity sensor."""

    _attr_has_entity_name = True
    _attr_device_class = SensorDeviceClass.HUMIDITY
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 1
    _attr_translation_key = "humidity"

    def __init__(self, coordinator: EverythingPresenceProCoordinator) -> None:
        """Initialize the humidity sensor."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_humidity"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def native_value(self) -> float | None:
        """Return the humidity value."""
        return self._coordinator.humidity

    async def async_added_to_hass(self) -> None:
        """Subscribe to sensor updates when added to hass."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_SENSORS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )

    @callback
    def _on_update(self) -> None:
        """Handle update."""
        self.async_write_ha_state()


class EverythingPresenceProCO2Sensor(SensorEntity):
    """Optional SCD40 CO2 sensor."""

    _attr_has_entity_name = True
    _attr_device_class = SensorDeviceClass.CO2
    _attr_native_unit_of_measurement = CONCENTRATION_PARTS_PER_MILLION
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_translation_key = "co2"

    def __init__(self, coordinator: EverythingPresenceProCoordinator) -> None:
        """Initialize the CO2 sensor."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_co2"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def native_value(self) -> float | None:
        """Return the CO2 value."""
        return self._coordinator.co2

    async def async_added_to_hass(self) -> None:
        """Subscribe to sensor updates when added to hass."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_SENSORS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )

    @callback
    def _on_update(self) -> None:
        """Handle update."""
        self.async_write_ha_state()


class EverythingPresenceProRoomTargetCountSensor(SensorEntity):
    """Room-level target count sensor."""

    _attr_has_entity_name = True
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_translation_key = "target_count"
    _attr_entity_registry_enabled_default = False

    def __init__(self, coordinator: EverythingPresenceProCoordinator) -> None:
        """Initialize the room target count sensor."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_target_count"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def native_value(self) -> int:
        """Return the number of active targets."""
        return self._coordinator.target_count

    async def async_added_to_hass(self) -> None:
        """Subscribe to target updates."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_TARGETS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )

    @callback
    def _on_update(self) -> None:
        """Handle update."""
        self.async_write_ha_state()


class _PerTargetSensor(SensorEntity):
    """Base class for per-target sensors. Pre-created disabled."""

    _attr_has_entity_name = True
    _attr_entity_registry_enabled_default = False

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, index: int, key: str
    ) -> None:
        """Initialize the per-target sensor."""
        self._coordinator = coordinator
        self._index = index
        self._attr_unique_id = (
            f"{coordinator.entry.entry_id}_target_{index + 1}_{key}"
        )
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    async def async_added_to_hass(self) -> None:
        """Subscribe to target updates."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_TARGETS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )

    @callback
    def _on_update(self) -> None:
        """Handle update."""
        self.async_write_ha_state()


class EverythingPresenceProTargetXYSensorSensor(_PerTargetSensor):
    """Per-target XY position relative to sensor (mm)."""

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, index: int
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, index, "xy_sensor")

    @property
    def name(self) -> str:
        """Return the sensor name."""
        return f"Target {self._index + 1} XY sensor"

    @property
    def native_value(self) -> str | None:
        """Return X,Y as a string value."""
        targets = self._coordinator.raw_targets
        if self._index >= len(targets) or not targets[self._index][2]:
            return None
        x, y, _ = targets[self._index]
        return f"{x:.0f},{y:.0f}"

    @property
    def extra_state_attributes(self) -> dict[str, float] | None:
        """Return x and y as separate attributes."""
        targets = self._coordinator.raw_targets
        if self._index >= len(targets) or not targets[self._index][2]:
            return None
        x, y, _ = targets[self._index]
        return {"x_mm": round(x), "y_mm": round(y)}


class EverythingPresenceProTargetXYGridSensor(_PerTargetSensor):
    """Per-target XY position relative to grid (mm)."""

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, index: int
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, index, "xy_grid")

    @property
    def name(self) -> str:
        """Return the sensor name."""
        return f"Target {self._index + 1} XY grid"

    @property
    def native_value(self) -> str | None:
        """Return calibrated X,Y as a string value."""
        targets = self._coordinator.targets
        if self._index >= len(targets) or not targets[self._index][2]:
            return None
        x, y, _ = targets[self._index]
        return f"{x:.0f},{y:.0f}"

    @property
    def extra_state_attributes(self) -> dict[str, float] | None:
        """Return x and y as separate attributes."""
        targets = self._coordinator.targets
        if self._index >= len(targets) or not targets[self._index][2]:
            return None
        x, y, _ = targets[self._index]
        return {"x_mm": round(x), "y_mm": round(y)}


class EverythingPresenceProTargetDistanceSensor(_PerTargetSensor):
    """Per-target distance from sensor (mm)."""

    _attr_device_class = SensorDeviceClass.DISTANCE
    _attr_native_unit_of_measurement = UnitOfLength.MILLIMETERS
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 0

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, index: int
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, index, "distance")

    @property
    def name(self) -> str:
        """Return the sensor name."""
        return f"Target {self._index + 1} distance"

    @property
    def native_value(self) -> float | None:
        """Return the distance in mm."""
        return self._coordinator.target_distance(self._index)


class EverythingPresenceProTargetAngleSensor(_PerTargetSensor):
    """Per-target angle from sensor (degrees)."""

    _attr_native_unit_of_measurement = "°"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 1

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, index: int
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, index, "angle")

    @property
    def name(self) -> str:
        """Return the sensor name."""
        return f"Target {self._index + 1} angle"

    @property
    def native_value(self) -> float | None:
        """Return the angle in degrees."""
        return self._coordinator.target_angle(self._index)


class EverythingPresenceProTargetSpeedSensor(_PerTargetSensor):
    """Per-target speed from LD2450."""

    _attr_device_class = SensorDeviceClass.SPEED
    _attr_native_unit_of_measurement = "mm/s"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 0

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, index: int
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, index, "speed")

    @property
    def name(self) -> str:
        """Return the sensor name."""
        return f"Target {self._index + 1} speed"

    @property
    def native_value(self) -> float | None:
        """Return the speed value."""
        return self._coordinator.target_speed(self._index)


class EverythingPresenceProTargetResolutionSensor(_PerTargetSensor):
    """Per-target resolution from LD2450."""

    _attr_native_unit_of_measurement = UnitOfLength.MILLIMETERS
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 0

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, index: int
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, index, "resolution")

    @property
    def name(self) -> str:
        """Return the sensor name."""
        return f"Target {self._index + 1} resolution"

    @property
    def native_value(self) -> float | None:
        """Return the resolution value."""
        return self._coordinator.target_resolution(self._index)


class EverythingPresenceProZoneTargetCountSensor(SensorEntity):
    """Per-zone target count sensor. One per slot (0-7), pre-created disabled."""

    _attr_has_entity_name = True
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_registry_enabled_default = False

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, slot: int
    ) -> None:
        """Initialize the zone target count sensor."""
        self._coordinator = coordinator
        self._slot = slot
        suffix = "rest_of_room_count" if slot == 0 else f"zone_{slot}_count"
        self._attr_unique_id = f"{coordinator.entry.entry_id}_{suffix}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def name(self) -> str:
        """Return the sensor name."""
        if self._slot == 0:
            return "Rest of room target count"
        zone = self._coordinator.get_zone_by_slot(self._slot)
        if zone is not None:
            return f"{zone.name} target count"
        return f"Zone {self._slot} target count"

    @property
    def native_value(self) -> int:
        """Return the target count for this zone."""
        return self._coordinator.last_result.zone_target_counts.get(
            self._slot, 0
        )

    async def async_added_to_hass(self) -> None:
        """Subscribe to target updates when added to hass."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_TARGETS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )

    @callback
    def _on_update(self) -> None:
        """Handle update."""
        self.async_write_ha_state()

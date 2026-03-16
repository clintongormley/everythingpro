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
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import EverythingPresenceProConfigEntry
from .const import DOMAIN, MAX_ZONES
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


class EverythingPresenceProZoneTargetCountSensor(SensorEntity):
    """Per-zone target count sensor. One per slot (1-7), pre-created disabled."""

    _attr_has_entity_name = True
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_registry_enabled_default = False

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, slot: int
    ) -> None:
        """Initialize the zone target count sensor."""
        self._coordinator = coordinator
        self._slot = slot
        self._attr_unique_id = (
            f"{coordinator.entry.entry_id}_zone_{slot}_count"
        )
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def name(self) -> str:
        """Return the sensor name."""
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

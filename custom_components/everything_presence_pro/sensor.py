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
from .const import DOMAIN
from .coordinator import (
    EverythingPresenceProCoordinator,
    SIGNAL_SENSORS_UPDATED,
    SIGNAL_TARGETS_UPDATED,
    SIGNAL_ZONES_UPDATED,
)
from .zone_engine import Zone


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

    # Zone target count sensors
    tracked_zone_ids: set[str] = set()
    for zone in coordinator.zones:
        entities.append(
            EverythingPresenceProZoneTargetCountSensor(coordinator, zone)
        )
        tracked_zone_ids.add(zone.id)

    async_add_entities(entities)

    @callback
    def _on_zones_updated() -> None:
        """Add entities for newly created zones."""
        new_entities: list[SensorEntity] = []
        for zone in coordinator.zones:
            if zone.id not in tracked_zone_ids:
                new_entities.append(
                    EverythingPresenceProZoneTargetCountSensor(coordinator, zone)
                )
                tracked_zone_ids.add(zone.id)
        if new_entities:
            async_add_entities(new_entities)

    entry.async_on_unload(
        async_dispatcher_connect(
            hass,
            f"{SIGNAL_ZONES_UPDATED}_{entry.entry_id}",
            _on_zones_updated,
        )
    )


class EverythingPresenceProIlluminanceSensor(SensorEntity):
    """BH1750 illuminance sensor."""

    _attr_has_entity_name = True
    _attr_device_class = SensorDeviceClass.ILLUMINANCE
    _attr_native_unit_of_measurement = LIGHT_LUX
    _attr_state_class = SensorStateClass.MEASUREMENT
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
    """Per-zone target count sensor."""

    _attr_has_entity_name = True
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, zone: Zone
    ) -> None:
        """Initialize the zone target count sensor."""
        self._coordinator = coordinator
        self._zone = zone
        self._attr_unique_id = (
            f"{coordinator.entry.entry_id}_zone_{zone.id}_count"
        )
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def name(self) -> str:
        """Return the sensor name."""
        return f"{self._zone.name} target count"

    @property
    def native_value(self) -> int:
        """Return the target count for this zone."""
        return self._coordinator.last_result.zone_target_counts.get(
            self._zone.id, 0
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

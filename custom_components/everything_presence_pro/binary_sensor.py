"""Binary sensor entities for Everything Presence Pro."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
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
    """Set up binary sensor entities from a config entry."""
    coordinator: EverythingPresenceProCoordinator = entry.runtime_data

    entities: list[BinarySensorEntity] = [
        EverythingPresenceProOccupancySensor(coordinator),
        EverythingPresenceProMotionSensor(coordinator),
        EverythingPresenceProStaticPresenceSensor(coordinator),
    ]

    # Pre-create all 7 zone occupancy entities (disabled by default)
    for slot in range(1, MAX_ZONES + 1):
        entities.append(
            EverythingPresenceProZoneOccupancySensor(coordinator, slot)
        )

    async_add_entities(entities)


class EverythingPresenceProOccupancySensor(BinarySensorEntity):
    """Combined device occupancy sensor (PIR + static + tracking)."""

    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_translation_key = "occupancy"

    def __init__(self, coordinator: EverythingPresenceProCoordinator) -> None:
        """Initialize the occupancy sensor."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_occupancy"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def is_on(self) -> bool:
        """Return true if device is occupied."""
        return self._coordinator.device_occupied

    async def async_added_to_hass(self) -> None:
        """Subscribe to both target and sensor updates for combined occupancy."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_TARGETS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )
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


class EverythingPresenceProMotionSensor(BinarySensorEntity):
    """PIR motion sensor."""

    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.MOTION
    _attr_translation_key = "motion"

    def __init__(self, coordinator: EverythingPresenceProCoordinator) -> None:
        """Initialize the motion sensor."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_motion"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def is_on(self) -> bool:
        """Return true if PIR motion is detected."""
        return self._coordinator.pir_motion

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
        """Handle sensor update."""
        self.async_write_ha_state()


class EverythingPresenceProStaticPresenceSensor(BinarySensorEntity):
    """Static mmWave presence sensor."""

    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_translation_key = "static_presence"

    def __init__(self, coordinator: EverythingPresenceProCoordinator) -> None:
        """Initialize the static presence sensor."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_static_presence"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def is_on(self) -> bool:
        """Return true if static presence is detected."""
        return self._coordinator.static_present

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
        """Handle sensor update."""
        self.async_write_ha_state()


class EverythingPresenceProZoneOccupancySensor(BinarySensorEntity):
    """Per-zone occupancy sensor. One per slot (1-7), pre-created disabled."""

    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_entity_registry_enabled_default = False

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, slot: int
    ) -> None:
        """Initialize the zone occupancy sensor."""
        self._coordinator = coordinator
        self._slot = slot
        self._attr_unique_id = f"{coordinator.entry.entry_id}_zone_{slot}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def name(self) -> str:
        """Return the zone name from the coordinator's slot map."""
        zone = self._coordinator.get_zone_by_slot(self._slot)
        if zone is not None:
            return f"{zone.name} occupancy"
        return f"Zone {self._slot} occupancy"

    @property
    def is_on(self) -> bool:
        """Return true if zone is occupied."""
        return self._coordinator.last_result.zone_occupancy.get(
            self._slot, False
        )

    @property
    def extra_state_attributes(self) -> dict[str, int]:
        """Return extra state attributes including target count."""
        return {
            "target_count": self._coordinator.last_result.zone_target_counts.get(
                self._slot, 0
            )
        }

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
        """Handle target update."""
        self.async_write_ha_state()

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
from .const import DOMAIN
from .coordinator import (
    EverythingPresenceProCoordinator,
    SIGNAL_TARGETS_UPDATED,
    SIGNAL_ZONES_UPDATED,
)
from .zone_engine import Zone


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EverythingPresenceProConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up binary sensor entities from a config entry."""
    coordinator: EverythingPresenceProCoordinator = entry.runtime_data

    # Static entities
    entities: list[BinarySensorEntity] = [
        EverythingPresenceProOccupancySensor(coordinator),
        EverythingPresenceProMotionSensor(coordinator),
        EverythingPresenceProStaticPresenceSensor(coordinator),
    ]

    # Zone entities for existing zones
    tracked_zone_ids: set[str] = set()
    for zone in coordinator.zones:
        entities.append(
            EverythingPresenceProZoneOccupancySensor(coordinator, zone)
        )
        tracked_zone_ids.add(zone.id)

    async_add_entities(entities)

    @callback
    def _on_zones_updated() -> None:
        """Add entities for newly created zones."""
        new_entities: list[BinarySensorEntity] = []
        for zone in coordinator.zones:
            if zone.id not in tracked_zone_ids:
                new_entities.append(
                    EverythingPresenceProZoneOccupancySensor(coordinator, zone)
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


class EverythingPresenceProZoneOccupancySensor(BinarySensorEntity):
    """Per-zone occupancy sensor."""

    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, zone: Zone
    ) -> None:
        """Initialize the zone occupancy sensor."""
        self._coordinator = coordinator
        self._zone = zone
        self._attr_unique_id = (
            f"{coordinator.entry.entry_id}_zone_{zone.id}"
        )
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def name(self) -> str:
        """Return the zone name."""
        return self._zone.name

    @property
    def is_on(self) -> bool:
        """Return true if zone is occupied."""
        return self._coordinator.last_result.zone_occupancy.get(
            self._zone.id, False
        )

    @property
    def extra_state_attributes(self) -> dict[str, int]:
        """Return extra state attributes including target count."""
        return {
            "target_count": self._coordinator.last_result.zone_target_counts.get(
                self._zone.id, 0
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

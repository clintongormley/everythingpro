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
    """Set up binary sensor entities from a config entry."""
    coordinator: EverythingPresenceProCoordinator = entry.runtime_data

    entities: list[BinarySensorEntity] = [
        EverythingPresenceProOccupancySensor(coordinator),
        EverythingPresenceProMotionSensor(coordinator),
        EverythingPresenceProStaticPresenceSensor(coordinator),
        EverythingPresenceProTargetPresenceSensor(coordinator),
    ]

    # Pre-create per-target active sensors (disabled by default)
    for idx in range(MAX_TARGETS):
        entities.append(
            EverythingPresenceProTargetActiveSensor(coordinator, idx)
        )

    # Zone 0 = "rest of room" occupancy (disabled by default)
    entities.append(
        EverythingPresenceProZoneOccupancySensor(coordinator, 0)
    )

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
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.device_name,
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
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.device_name,
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
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.device_name,
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


class EverythingPresenceProTargetPresenceSensor(BinarySensorEntity):
    """Whether any target is actively tracked."""

    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_translation_key = "target_presence"
    _attr_entity_registry_enabled_default = False

    def __init__(self, coordinator: EverythingPresenceProCoordinator) -> None:
        """Initialize the target presence sensor."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_target_presence"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.device_name,
        )

    @property
    def is_on(self) -> bool:
        """Return true if any target is active."""
        return self._coordinator.target_present

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


class EverythingPresenceProTargetActiveSensor(BinarySensorEntity):
    """Per-target active binary sensor. Pre-created disabled."""

    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_entity_registry_enabled_default = False

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, index: int
    ) -> None:
        """Initialize the per-target active sensor."""
        self._coordinator = coordinator
        self._index = index
        self._attr_unique_id = (
            f"{coordinator.entry.entry_id}_target_{index + 1}_active"
        )
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.device_name,
        )
        self._attr_translation_key = f"target_{index + 1}_active"

    @property
    def name(self) -> str:
        """Return the sensor name."""
        return f"Target {self._index + 1} active"

    @property
    def is_on(self) -> bool:
        """Return true if this target is active."""
        targets = self._coordinator.targets
        if self._index >= len(targets):
            return False
        return targets[self._index][2]

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
        suffix = "rest_of_room" if slot == 0 else f"zone_{slot}"
        self._attr_unique_id = f"{coordinator.entry.entry_id}_{suffix}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.device_name,
        )

    @property
    def name(self) -> str:
        """Return the zone name from the coordinator's slot map."""
        if self._slot == 0:
            return "Rest of room occupancy"
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

"""Integration for Everything Presence Pro."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import EverythingPresenceProCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.BINARY_SENSOR, Platform.SENSOR]

type EverythingPresenceProConfigEntry = ConfigEntry[
    EverythingPresenceProCoordinator
]


async def async_setup_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Set up Everything Presence Pro from a config entry."""
    coordinator = EverythingPresenceProCoordinator(hass, entry)
    coordinator.load_config_data(entry.options.get("config", {}))
    await coordinator.async_connect()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        coordinator: EverythingPresenceProCoordinator = entry.runtime_data
        await coordinator.async_disconnect()
    return unload_ok

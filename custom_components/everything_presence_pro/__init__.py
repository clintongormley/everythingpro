"""Integration for Everything Presence Pro."""

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN

type EverythingPresenceProConfigEntry = ConfigEntry[None]


async def async_setup_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Set up Everything Presence Pro from a config entry."""
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Unload a config entry."""
    return True

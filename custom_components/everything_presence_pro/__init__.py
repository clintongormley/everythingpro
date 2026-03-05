"""Integration for Everything Presence Pro."""

from __future__ import annotations

import logging
import os

from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import EverythingPresenceProCoordinator
from .websocket_api import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")

PLATFORMS = [Platform.BINARY_SENSOR, Platform.SENSOR]

type EverythingPresenceProConfigEntry = ConfigEntry[
    EverythingPresenceProCoordinator
]


async def async_setup_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Set up Everything Presence Pro from a config entry."""
    async_register_websocket_commands(hass)

    # Register frontend panel
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path=f"/{DOMAIN}_static",
            path=FRONTEND_DIR,
            cache_headers=True,
        )
    ])
    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=DOMAIN,
        webcomponent_name="everything-presence-pro-panel",
        module_url=f"/{DOMAIN}_static/everything-presence-pro-panel.js",
        sidebar_title="EP Pro",
        sidebar_icon="mdi:radar",
        require_admin=False,
        config={"entry_id": entry.entry_id},
    )

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

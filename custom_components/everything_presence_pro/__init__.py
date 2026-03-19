"""Integration for Everything Presence Pro."""

from __future__ import annotations

import hashlib
import logging
import os

from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr

from .const import DOMAIN
from .coordinator import EverythingPresenceProCoordinator
from .websocket_api import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")

PLATFORMS = [Platform.BINARY_SENSOR, Platform.SENSOR]


def _hash_file(path: str) -> str:
    """Read a file and return its MD5 hash prefix."""
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:8]

type EverythingPresenceProConfigEntry = ConfigEntry[
    EverythingPresenceProCoordinator
]


async def async_setup_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Set up Everything Presence Pro from a config entry."""
    async_register_websocket_commands(hass)

    # Register frontend panel once (shared across all entries)
    if not hass.data.get(f"{DOMAIN}_panel_registered"):
        await hass.http.async_register_static_paths([
            StaticPathConfig(
                url_path=f"/{DOMAIN}_static",
                path=FRONTEND_DIR,
                cache_headers=False,
            )
        ])
        # Cache-bust: hash the JS file so browser reloads on rebuild
        js_path = os.path.join(FRONTEND_DIR, "everything-presence-pro-panel.js")
        try:
            js_hash = await hass.async_add_executor_job(
                _hash_file, js_path
            )
        except OSError:
            js_hash = "0"
        await panel_custom.async_register_panel(
            hass=hass,
            frontend_url_path=DOMAIN,
            webcomponent_name="everything-presence-pro-panel",
            module_url=f"/{DOMAIN}_static/everything-presence-pro-panel.js?v={js_hash}",
            sidebar_title="EP Pro",
            sidebar_icon="mdi:radar",
            require_admin=False,
            config={},
        )
        hass.data[f"{DOMAIN}_panel_registered"] = True

    # Create the device explicitly before entity platforms are set up.
    # This follows ESPHome's pattern: the device exists with its name before
    # any entities register. Entity DeviceInfo only references by identifier,
    # never sets name — so entity registration won't fight with user renames.
    device_name = entry.data.get("device_name", entry.title)
    dev_reg = dr.async_get(hass)
    dev_reg.async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, entry.entry_id)},
        name=device_name,
        manufacturer="Everything Smart Technology",
        model="Everything Presence Pro",
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

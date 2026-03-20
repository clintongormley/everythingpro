"""Tests for integration setup and teardown."""

from __future__ import annotations

from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.everything_presence_pro.const import DOMAIN
from custom_components.everything_presence_pro.coordinator import EverythingPresenceProCoordinator


@pytest.fixture(autouse=True)
def _patch_frontend(hass: HomeAssistant):
    """Patch hass.http and panel_custom so setup_entry doesn't fail on frontend registration."""
    mock_http = MagicMock()
    mock_http.async_register_static_paths = AsyncMock()
    hass.http = mock_http

    with patch(
        "custom_components.everything_presence_pro.panel_custom.async_register_panel",
        new_callable=AsyncMock,
    ):
        yield


async def test_setup_creates_coordinator(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """Setting up the entry creates a coordinator stored in runtime_data."""
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert mock_config_entry.runtime_data is not None
    assert isinstance(mock_config_entry.runtime_data, EverythingPresenceProCoordinator)


async def test_setup_forwards_platforms(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """Setup forwards binary_sensor and sensor platforms."""
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    entity_ids = [e.entity_id for e in hass.states.async_all()]
    has_binary = any(eid.startswith("binary_sensor.") for eid in entity_ids)
    has_sensor = any(eid.startswith("sensor.") for eid in entity_ids)
    assert has_binary, f"Expected binary_sensor entities, got: {entity_ids}"
    assert has_sensor, f"Expected sensor entities, got: {entity_ids}"


async def test_setup_registers_panel(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """Setup registers the frontend panel and sets the registration flag."""
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert hass.data.get(f"{DOMAIN}_panel_registered") is True


async def test_setup_panel_registered_only_once(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """If panel is already registered, skip re-registration."""
    # Pre-set the flag to simulate panel already registered
    hass.data[f"{DOMAIN}_panel_registered"] = True
    # Replace hass.http with a fresh mock to track calls
    mock_http = MagicMock()
    mock_http.async_register_static_paths = AsyncMock()
    hass.http = mock_http

    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    # Should NOT have called static paths since panel was already registered
    mock_http.async_register_static_paths.assert_not_called()


async def test_setup_creates_device(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """Setup creates a device in the device registry."""
    from homeassistant.helpers import device_registry as dr

    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    dev_reg = dr.async_get(hass)
    device = dev_reg.async_get_device(identifiers={(DOMAIN, mock_config_entry.entry_id)})
    assert device is not None
    assert device.name == "Test EP Pro"
    assert device.manufacturer == "Everything Smart Technology"
    assert device.model == "Everything Presence Pro"


async def test_unload_entry(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """Unloading the entry disconnects the coordinator."""
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    coordinator = mock_config_entry.runtime_data
    with patch.object(coordinator, "async_disconnect", new_callable=AsyncMock) as mock_disconnect:
        result = await hass.config_entries.async_unload(mock_config_entry.entry_id)
        await hass.async_block_till_done()

    assert result is True
    mock_disconnect.assert_called_once()


async def test_setup_loads_config_data(
    hass: HomeAssistant,
    mock_esphome_client,
):
    """Setup calls load_config_data with config from entry options."""
    from pytest_homeassistant_custom_component.common import MockConfigEntry

    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Test EP Pro",
        data={
            "host": "192.168.1.100",
            "mac": "AA:BB:CC:DD:EE:FF",
            "device_name": "Test EP Pro",
        },
        options={
            "config": {
                "zones": [
                    {"id": 1, "name": "Desk", "type": "normal"},
                ],
            }
        },
    )
    entry.add_to_hass(hass)

    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    coordinator = entry.runtime_data
    assert len(coordinator.zones) == 1
    assert coordinator.zones[0].name == "Desk"

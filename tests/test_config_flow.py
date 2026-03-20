"""Tests for the config flow."""

from __future__ import annotations

from unittest.mock import AsyncMock
from unittest.mock import MagicMock

import pytest
from aioesphomeapi import APIConnectionError
from aioesphomeapi import InvalidAuthAPIError
from homeassistant.core import HomeAssistant

from custom_components.everything_presence_pro.const import DOMAIN


@pytest.fixture
def mock_device_info():
    """Create mock device info for an EP Pro."""
    info = MagicMock()
    info.name = "everything-presence-pro-abc123"
    info.friendly_name = "Everything Presence Pro"
    info.mac_address = "AA:BB:CC:DD:EE:FF"
    return info


# ---------------------------------------------------------------------------
# User step
# ---------------------------------------------------------------------------


async def test_user_step_shows_form(hass: HomeAssistant):
    """First call to async_step_user shows the host form."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == "form"
    assert result["step_id"] == "user"


async def test_user_step_success_goes_to_name_step(
    hass: HomeAssistant,
    mock_config_flow_client,
    mock_device_info,
):
    """Valid host connects, fetches device info, and advances to name step."""
    mock_config_flow_client.device_info = AsyncMock(return_value=mock_device_info)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"host": "192.168.1.100"},
    )
    assert result["type"] == "form"
    assert result["step_id"] == "name"


async def test_user_step_cannot_connect(
    hass: HomeAssistant,
    mock_config_flow_client,
):
    """Connection error returns the form with 'cannot_connect' error."""
    mock_config_flow_client.connect = AsyncMock(side_effect=APIConnectionError("timeout"))

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"host": "192.168.1.100"},
    )
    assert result["type"] == "form"
    assert result["errors"]["base"] == "cannot_connect"


async def test_user_step_invalid_auth(
    hass: HomeAssistant,
    mock_config_flow_client,
):
    """Auth error returns the form with 'invalid_auth' error."""
    mock_config_flow_client.connect = AsyncMock(side_effect=InvalidAuthAPIError("bad key"))

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"host": "192.168.1.100"},
    )
    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_auth"


async def test_user_step_unexpected_error(
    hass: HomeAssistant,
    mock_config_flow_client,
):
    """Unexpected exception returns 'cannot_connect'."""
    mock_config_flow_client.connect = AsyncMock(side_effect=RuntimeError("boom"))

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"host": "192.168.1.100"},
    )
    assert result["type"] == "form"
    assert result["errors"]["base"] == "cannot_connect"


# ---------------------------------------------------------------------------
# Name step
# ---------------------------------------------------------------------------


async def test_name_step_creates_entry(
    hass: HomeAssistant,
    mock_config_flow_client,
    mock_device_info,
):
    """Providing a name on the name step creates the config entry."""
    mock_config_flow_client.device_info = AsyncMock(return_value=mock_device_info)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"host": "192.168.1.100"},
    )
    assert result["step_id"] == "name"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"name": "My Sensor"},
    )
    assert result["type"] == "create_entry"
    assert result["title"] == "My Sensor"
    assert result["data"]["host"] == "192.168.1.100"
    assert result["data"]["mac"] == "AA:BB:CC:DD:EE:FF"
    assert result["data"]["device_name"] == "My Sensor"


async def test_name_step_empty_name_uses_esphome_name(
    hass: HomeAssistant,
    mock_config_flow_client,
    mock_device_info,
):
    """Empty name falls back to the ESPHome friendly_name."""
    mock_config_flow_client.device_info = AsyncMock(return_value=mock_device_info)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"host": "192.168.1.100"},
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"name": "   "},
    )
    assert result["type"] == "create_entry"
    assert result["title"] == "Everything Presence Pro"


# ---------------------------------------------------------------------------
# Duplicate detection
# ---------------------------------------------------------------------------


async def test_duplicate_mac_aborts(
    hass: HomeAssistant,
    mock_config_flow_client,
    mock_device_info,
):
    """Second flow with the same MAC address is aborted."""
    mock_config_flow_client.device_info = AsyncMock(return_value=mock_device_info)

    # First flow: complete successfully
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], user_input={"host": "192.168.1.100"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], user_input={"name": "First"})
    assert result["type"] == "create_entry"

    # Second flow with the same MAC: should abort
    result2 = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result2 = await hass.config_entries.flow.async_configure(result2["flow_id"], user_input={"host": "192.168.1.101"})
    assert result2["type"] == "abort"
    assert result2["reason"] == "already_configured"

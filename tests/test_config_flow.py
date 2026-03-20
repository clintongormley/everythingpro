"""Tests for the config flow."""

from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from aioesphomeapi import APIConnectionError
from aioesphomeapi import DeviceInfo
from aioesphomeapi import InvalidAuthAPIError

from custom_components.everything_presence_pro.const import DOMAIN


@pytest.fixture
def mock_device_info():
    """Create mock device info for an EP Pro."""
    info = MagicMock(spec=DeviceInfo)
    info.name = "everything-presence-pro-abc123"
    info.friendly_name = "Everything Presence Pro"
    info.mac_address = "AA:BB:CC:DD:EE:FF"
    info.model = "Everything Presence Pro"
    info.manufacturer = "Everything Smart Technology"
    return info


async def test_user_flow_success(hass, mock_device_info):
    """Test successful manual setup flow."""
    with patch("custom_components.everything_presence_pro.config_flow.APIClient") as mock_client_cls:
        client = AsyncMock()
        client.connect = AsyncMock()
        client.device_info = AsyncMock(return_value=mock_device_info)
        client.disconnect = AsyncMock()
        mock_client_cls.return_value = client

        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
        assert result["type"] == "form"
        assert result["step_id"] == "user"

        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            user_input={"host": "192.168.1.100", "noise_psk": "test_key"},
        )
        assert result["type"] == "create_entry"
        assert result["title"] == "Everything Presence Pro"
        assert result["data"]["host"] == "192.168.1.100"


async def test_user_flow_cannot_connect(hass):
    """Test manual setup with connection failure."""
    with patch("custom_components.everything_presence_pro.config_flow.APIClient") as mock_client_cls:
        client = AsyncMock()
        client.connect = AsyncMock(side_effect=APIConnectionError("timeout"))
        client.disconnect = AsyncMock()
        mock_client_cls.return_value = client

        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            user_input={"host": "192.168.1.100", "noise_psk": "test_key"},
        )
        assert result["type"] == "form"
        assert result["errors"]["base"] == "cannot_connect"


async def test_user_flow_invalid_auth(hass, mock_device_info):
    """Test manual setup with invalid auth."""
    with patch("custom_components.everything_presence_pro.config_flow.APIClient") as mock_client_cls:
        client = AsyncMock()
        client.connect = AsyncMock(side_effect=InvalidAuthAPIError("bad key"))
        client.disconnect = AsyncMock()
        mock_client_cls.return_value = client

        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            user_input={"host": "192.168.1.100", "noise_psk": "bad_key"},
        )
        assert result["type"] == "form"
        assert result["errors"]["base"] == "invalid_auth"

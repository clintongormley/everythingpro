"""Fixtures for Everything Presence Pro tests."""

from __future__ import annotations

from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.everything_presence_pro.const import DOMAIN


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for all tests that use the hass fixture."""
    yield


@pytest.fixture
def mock_config_entry(hass: HomeAssistant) -> MockConfigEntry:
    """Create and register a MockConfigEntry for the integration."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Test EP Pro",
        data={
            "host": "192.168.1.100",
            "mac": "AA:BB:CC:DD:EE:FF",
            "device_name": "Test EP Pro",
        },
        options={},
    )
    entry.add_to_hass(hass)
    return entry


@pytest.fixture
def mock_esphome_client():
    """Patch coordinator's APIClient and ReconnectLogic so setup doesn't hit the network."""
    with (
        patch(
            "custom_components.everything_presence_pro.coordinator.APIClient",
        ) as mock_client_cls,
        patch(
            "custom_components.everything_presence_pro.coordinator.ReconnectLogic",
        ) as mock_rl_cls,
    ):
        client = AsyncMock()
        client.connect = AsyncMock()
        client.device_info = AsyncMock()
        client.list_entities_services = AsyncMock(return_value=([], []))
        client.subscribe_states = MagicMock()
        client.disconnect = AsyncMock()
        mock_client_cls.return_value = client

        rl = AsyncMock()
        rl.start = AsyncMock()
        rl.stop = AsyncMock()
        mock_rl_cls.return_value = rl

        yield client


@pytest.fixture
def mock_config_flow_client():
    """Patch config_flow's APIClient for flow tests."""
    with patch(
        "custom_components.everything_presence_pro.config_flow.APIClient",
    ) as mock_client_cls:
        client = AsyncMock()
        client.connect = AsyncMock()
        client.disconnect = AsyncMock()
        mock_client_cls.return_value = client
        yield client

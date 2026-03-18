"""Tests for the data coordinator."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.everything_presence_pro.coordinator import (
    EverythingPresenceProCoordinator,
)
from custom_components.everything_presence_pro.zone_engine import Zone


@pytest.fixture
def mock_entry():
    """Create a mock config entry."""
    entry = MagicMock()
    entry.entry_id = "test_entry_id"
    entry.data = {
        "host": "192.168.1.100",
        "noise_psk": "test_key",
    }
    entry.options = {}
    return entry


@pytest.fixture
def mock_hass():
    """Create a mock hass."""
    hass = MagicMock()
    hass.bus = MagicMock()
    return hass


def test_coordinator_creation(mock_hass, mock_entry):
    """Test coordinator can be created."""
    coordinator = EverythingPresenceProCoordinator(mock_hass, mock_entry)
    assert coordinator is not None
    assert coordinator.zones == []
    assert coordinator.connected is False


def test_coordinator_set_zones(mock_hass, mock_entry):
    """Test setting zones on coordinator."""
    coordinator = EverythingPresenceProCoordinator(mock_hass, mock_entry)
    zones = [
        Zone(id=1, name="Desk", type="normal", trigger=5, sustain=7, timeout=10.0),
    ]
    coordinator.set_zones(zones)
    assert len(coordinator.zones) == 1
    assert coordinator.zones[0].name == "Desk"


def test_coordinator_config_roundtrip(mock_hass, mock_entry):
    """Test config data serialization roundtrip."""
    coordinator = EverythingPresenceProCoordinator(mock_hass, mock_entry)
    zones = [
        Zone(id=1, name="Desk", type="normal", trigger=5, sustain=7, timeout=10.0),
    ]
    coordinator.set_zones(zones)

    data = coordinator.get_config_data()
    assert len(data["zones"]) == 1
    assert data["zones"][0]["name"] == "Desk"
    assert data["zones"][0]["type"] == "normal"

    # Load into fresh coordinator
    coordinator2 = EverythingPresenceProCoordinator(mock_hass, mock_entry)
    coordinator2.load_config_data(data)
    assert len(coordinator2.zones) == 1
    assert coordinator2.zones[0].name == "Desk"


def test_coordinator_device_occupied_default(mock_hass, mock_entry):
    """Test device_occupied is False by default."""
    coordinator = EverythingPresenceProCoordinator(mock_hass, mock_entry)
    assert coordinator.device_occupied is False


def test_coordinator_environment_sensors_default(mock_hass, mock_entry):
    """Test environment sensors are None by default."""
    coordinator = EverythingPresenceProCoordinator(mock_hass, mock_entry)
    assert coordinator.illuminance is None
    assert coordinator.temperature is None
    assert coordinator.humidity is None
    assert coordinator.co2 is None

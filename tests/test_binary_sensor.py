"""Tests for binary sensor entities."""

from unittest.mock import MagicMock

import pytest

from custom_components.everything_presence_pro.binary_sensor import (
    EverythingPresenceProOccupancySensor,
    EverythingPresenceProMotionSensor,
    EverythingPresenceProStaticPresenceSensor,
    EverythingPresenceProZoneOccupancySensor,
)
from custom_components.everything_presence_pro.zone_engine import (
    Zone,
    ProcessingResult,
)


@pytest.fixture
def mock_coordinator():
    """Create a mock coordinator."""
    coordinator = MagicMock()
    coordinator.entry = MagicMock()
    coordinator.entry.entry_id = "test_entry"
    coordinator.device_occupied = True
    coordinator.pir_motion = False
    coordinator.static_present = True
    coordinator.last_result = ProcessingResult(
        device_tracking_present=True,
        zone_occupancy={"z1": True, "z2": False},
        zone_target_counts={"z1": 1, "z2": 0},
    )
    return coordinator


def test_occupancy_sensor_is_on(mock_coordinator):
    """Test device occupancy sensor reflects coordinator state."""
    sensor = EverythingPresenceProOccupancySensor(mock_coordinator)
    assert sensor.is_on is True


def test_motion_sensor_is_off(mock_coordinator):
    """Test motion sensor reflects PIR state."""
    sensor = EverythingPresenceProMotionSensor(mock_coordinator)
    assert sensor.is_on is False


def test_static_presence_sensor(mock_coordinator):
    """Test static presence sensor reflects SEN0609 state."""
    sensor = EverythingPresenceProStaticPresenceSensor(mock_coordinator)
    assert sensor.is_on is True


def test_zone_occupancy_sensor_on(mock_coordinator):
    """Test zone occupancy sensor when zone is occupied."""
    zone = Zone(id="z1", name="Desk", sensitivity="normal", cells=[10])
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, zone)
    assert sensor.is_on is True
    assert sensor.name == "Desk"


def test_zone_occupancy_sensor_off(mock_coordinator):
    """Test zone occupancy sensor when zone is empty."""
    zone = Zone(id="z2", name="Sofa", sensitivity="normal", cells=[20])
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, zone)
    assert sensor.is_on is False


def test_zone_occupancy_extra_attributes(mock_coordinator):
    """Test zone occupancy sensor has target_count attribute."""
    zone = Zone(id="z1", name="Desk", sensitivity="normal", cells=[10])
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, zone)
    assert sensor.extra_state_attributes["target_count"] == 1


def test_occupancy_sensor_unique_id(mock_coordinator):
    """Test unique ID format."""
    sensor = EverythingPresenceProOccupancySensor(mock_coordinator)
    assert sensor.unique_id == "test_entry_occupancy"


def test_zone_sensor_unique_id(mock_coordinator):
    """Test zone sensor unique ID format."""
    zone = Zone(id="z1", name="Desk", sensitivity="normal", cells=[10])
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, zone)
    assert sensor.unique_id == "test_entry_zone_z1"

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
        zone_occupancy={1: True, 2: False},
        zone_target_counts={1: 1, 2: 0},
    )
    # Slot 1 has a zone, slot 2 has a zone, others empty
    coordinator.get_zone_by_slot = lambda slot: (
        Zone(id=1, name="Desk", type="normal") if slot == 1
        else Zone(id=2, name="Sofa", type="normal") if slot == 2
        else None
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
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=1)
    assert sensor.is_on is True
    assert sensor.name == "Desk occupancy"


def test_zone_occupancy_sensor_off(mock_coordinator):
    """Test zone occupancy sensor when zone is empty."""
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=2)
    assert sensor.is_on is False


def test_zone_occupancy_extra_attributes(mock_coordinator):
    """Test zone occupancy sensor has target_count attribute."""
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=1)
    assert sensor.extra_state_attributes["target_count"] == 1


def test_occupancy_sensor_unique_id(mock_coordinator):
    """Test unique ID format."""
    sensor = EverythingPresenceProOccupancySensor(mock_coordinator)
    assert sensor.unique_id == "test_entry_occupancy"


def test_zone_sensor_unique_id(mock_coordinator):
    """Test zone sensor unique ID format."""
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=1)
    assert sensor.unique_id == "test_entry_zone_1"


def test_zone_sensor_disabled_by_default(mock_coordinator):
    """Test all 7 zone occupancy entities are pre-created and disabled."""
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=5)
    assert sensor.entity_registry_enabled_default is False
    # Empty slot gets default name
    assert sensor.name == "Zone 5 occupancy"

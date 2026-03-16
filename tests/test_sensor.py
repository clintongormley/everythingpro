"""Tests for sensor entities."""

from unittest.mock import MagicMock

import pytest

from custom_components.everything_presence_pro.sensor import (
    EverythingPresenceProIlluminanceSensor,
    EverythingPresenceProTemperatureSensor,
    EverythingPresenceProHumiditySensor,
    EverythingPresenceProCO2Sensor,
    EverythingPresenceProZoneTargetCountSensor,
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
    coordinator.illuminance = 350.0
    coordinator.temperature = 22.5
    coordinator.humidity = 45.0
    coordinator.co2 = 420.0
    coordinator.last_result = ProcessingResult(
        device_tracking_present=True,
        zone_occupancy={1: True},
        zone_target_counts={1: 2},
    )
    coordinator.get_zone_by_slot = lambda slot: (
        Zone(id=1, name="Desk", sensitivity="normal") if slot == 1
        else None
    )
    return coordinator


def test_illuminance_sensor(mock_coordinator):
    """Test illuminance sensor value."""
    sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
    assert sensor.native_value == 350.0


def test_temperature_sensor(mock_coordinator):
    """Test temperature sensor value."""
    sensor = EverythingPresenceProTemperatureSensor(mock_coordinator)
    assert sensor.native_value == 22.5


def test_humidity_sensor(mock_coordinator):
    """Test humidity sensor value."""
    sensor = EverythingPresenceProHumiditySensor(mock_coordinator)
    assert sensor.native_value == 45.0


def test_co2_sensor(mock_coordinator):
    """Test CO2 sensor value."""
    sensor = EverythingPresenceProCO2Sensor(mock_coordinator)
    assert sensor.native_value == 420.0


def test_zone_target_count_sensor(mock_coordinator):
    """Test zone target count sensor."""
    sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=1)
    assert sensor.native_value == 2
    assert sensor.name == "Desk target count"


def test_illuminance_sensor_unique_id(mock_coordinator):
    """Test illuminance sensor unique ID."""
    sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
    assert sensor.unique_id == "test_entry_illuminance"


def test_zone_target_count_unique_id(mock_coordinator):
    """Test zone target count sensor unique ID."""
    sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=1)
    assert sensor.unique_id == "test_entry_zone_1_count"


def test_zone_target_count_disabled_by_default(mock_coordinator):
    """Test zone target count entities are disabled by default."""
    sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=5)
    assert sensor.entity_registry_enabled_default is False
    assert sensor.name == "Zone 5 target count"

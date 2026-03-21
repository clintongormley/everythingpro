"""Tests for binary sensor entities."""

from __future__ import annotations

from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from homeassistant.components.binary_sensor import BinarySensorDeviceClass
from homeassistant.core import HomeAssistant

from custom_components.everything_presence_pro.binary_sensor import EverythingPresenceProMotionSensor
from custom_components.everything_presence_pro.binary_sensor import EverythingPresenceProOccupancySensor
from custom_components.everything_presence_pro.binary_sensor import EverythingPresenceProStaticPresenceSensor
from custom_components.everything_presence_pro.binary_sensor import EverythingPresenceProTargetActiveSensor
from custom_components.everything_presence_pro.binary_sensor import EverythingPresenceProTargetPresenceSensor
from custom_components.everything_presence_pro.binary_sensor import EverythingPresenceProZoneOccupancySensor
from custom_components.everything_presence_pro.zone_engine import ProcessingResult
from custom_components.everything_presence_pro.zone_engine import TargetResult
from custom_components.everything_presence_pro.zone_engine import TargetStatus
from custom_components.everything_presence_pro.zone_engine import Zone


@pytest.fixture
def mock_coordinator():
    """Create a mock coordinator for unit testing sensor classes directly."""
    coordinator = MagicMock()
    coordinator.entry = MagicMock()
    coordinator.entry.entry_id = "test_entry"
    coordinator.device_occupied = True
    coordinator.pir_motion = False
    coordinator.static_present = True
    coordinator.target_present = True
    coordinator.targets = [
        TargetResult(x=100, y=200, status=TargetStatus.ACTIVE, signal=5),
        TargetResult(),
        TargetResult(),
    ]
    coordinator.last_result = ProcessingResult(
        device_tracking_present=True,
        zone_occupancy={0: True, 1: True, 2: False},
        zone_target_counts={0: 1, 1: 1, 2: 0},
    )
    coordinator.get_zone_by_slot = lambda slot: (
        Zone(id=1, name="Desk", type="normal")
        if slot == 1
        else Zone(id=2, name="Sofa", type="normal")
        if slot == 2
        else None
    )
    return coordinator


# ---------------------------------------------------------------------------
# Occupancy sensor
# ---------------------------------------------------------------------------


class TestOccupancySensor:
    """Tests for the combined occupancy binary sensor."""

    def test_is_on(self, mock_coordinator):
        sensor = EverythingPresenceProOccupancySensor(mock_coordinator)
        assert sensor.is_on is True

    def test_is_off(self, mock_coordinator):
        mock_coordinator.device_occupied = False
        sensor = EverythingPresenceProOccupancySensor(mock_coordinator)
        assert sensor.is_on is False

    def test_device_class(self, mock_coordinator):
        sensor = EverythingPresenceProOccupancySensor(mock_coordinator)
        assert sensor.device_class == BinarySensorDeviceClass.OCCUPANCY

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProOccupancySensor(mock_coordinator)
        assert sensor.unique_id == "test_entry_occupancy"


# ---------------------------------------------------------------------------
# Motion sensor
# ---------------------------------------------------------------------------


class TestMotionSensor:
    """Tests for the PIR motion binary sensor."""

    def test_is_off(self, mock_coordinator):
        sensor = EverythingPresenceProMotionSensor(mock_coordinator)
        assert sensor.is_on is False

    def test_is_on(self, mock_coordinator):
        mock_coordinator.pir_motion = True
        sensor = EverythingPresenceProMotionSensor(mock_coordinator)
        assert sensor.is_on is True

    def test_device_class(self, mock_coordinator):
        sensor = EverythingPresenceProMotionSensor(mock_coordinator)
        assert sensor.device_class == BinarySensorDeviceClass.MOTION

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProMotionSensor(mock_coordinator)
        assert sensor.unique_id == "test_entry_motion"


# ---------------------------------------------------------------------------
# Static presence sensor
# ---------------------------------------------------------------------------


class TestStaticPresenceSensor:
    """Tests for the static mmWave presence sensor."""

    def test_is_on(self, mock_coordinator):
        sensor = EverythingPresenceProStaticPresenceSensor(mock_coordinator)
        assert sensor.is_on is True

    def test_is_off(self, mock_coordinator):
        mock_coordinator.static_present = False
        sensor = EverythingPresenceProStaticPresenceSensor(mock_coordinator)
        assert sensor.is_on is False

    def test_device_class(self, mock_coordinator):
        sensor = EverythingPresenceProStaticPresenceSensor(mock_coordinator)
        assert sensor.device_class == BinarySensorDeviceClass.OCCUPANCY

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProStaticPresenceSensor(mock_coordinator)
        assert sensor.unique_id == "test_entry_static_presence"


# ---------------------------------------------------------------------------
# Target presence sensor
# ---------------------------------------------------------------------------


class TestTargetPresenceSensor:
    """Tests for the target presence binary sensor."""

    def test_is_on(self, mock_coordinator):
        sensor = EverythingPresenceProTargetPresenceSensor(mock_coordinator)
        assert sensor.is_on is True

    def test_is_off(self, mock_coordinator):
        mock_coordinator.target_present = False
        sensor = EverythingPresenceProTargetPresenceSensor(mock_coordinator)
        assert sensor.is_on is False

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProTargetPresenceSensor(mock_coordinator)
        assert sensor.unique_id == "test_entry_target_presence"

    def test_disabled_by_default(self, mock_coordinator):
        sensor = EverythingPresenceProTargetPresenceSensor(mock_coordinator)
        assert sensor.entity_registry_enabled_default is False


# ---------------------------------------------------------------------------
# Per-target active sensor
# ---------------------------------------------------------------------------


class TestTargetActiveSensor:
    """Tests for per-target active binary sensors."""

    def test_is_on_for_active_target(self, mock_coordinator):
        sensor = EverythingPresenceProTargetActiveSensor(mock_coordinator, 0)
        assert sensor.is_on is True

    def test_is_off_for_inactive_target(self, mock_coordinator):
        sensor = EverythingPresenceProTargetActiveSensor(mock_coordinator, 1)
        assert sensor.is_on is False

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProTargetActiveSensor(mock_coordinator, 0)
        assert sensor.unique_id == "test_entry_target_1_active"

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetActiveSensor(mock_coordinator, 2)
        assert sensor.name == "Target 3 active"

    def test_disabled_by_default(self, mock_coordinator):
        sensor = EverythingPresenceProTargetActiveSensor(mock_coordinator, 0)
        assert sensor.entity_registry_enabled_default is False


# ---------------------------------------------------------------------------
# Zone occupancy sensor
# ---------------------------------------------------------------------------


class TestZoneOccupancySensor:
    """Tests for per-zone occupancy binary sensors."""

    def test_is_on_for_occupied_zone(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=1)
        assert sensor.is_on is True

    def test_is_off_for_empty_zone(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=2)
        assert sensor.is_on is False

    def test_name_with_configured_zone(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=1)
        assert sensor.name == "Desk occupancy"

    def test_name_without_configured_zone(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=5)
        assert sensor.name == "Zone 5 occupancy"

    def test_rest_of_room_name(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=0)
        assert sensor.name == "Rest of room occupancy"

    def test_unique_id_named_zone(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=1)
        assert sensor.unique_id == "test_entry_zone_1"

    def test_unique_id_rest_of_room(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=0)
        assert sensor.unique_id == "test_entry_rest_of_room"

    def test_extra_state_attributes(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=1)
        assert sensor.extra_state_attributes["target_count"] == 1

    def test_disabled_by_default(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=5)
        assert sensor.entity_registry_enabled_default is False

    def test_device_class(self, mock_coordinator):
        sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, slot=1)
        assert sensor.device_class == BinarySensorDeviceClass.OCCUPANCY


# ---------------------------------------------------------------------------
# Integration test: entities created via async_setup_entry
# ---------------------------------------------------------------------------


async def test_async_setup_entry_creates_entities(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """async_setup_entry creates all expected binary sensor entities."""
    mock_http = MagicMock()
    mock_http.async_register_static_paths = AsyncMock()
    hass.http = mock_http

    with patch(
        "custom_components.everything_presence_pro.panel_custom.async_register_panel",
        new_callable=AsyncMock,
    ):
        await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()

    entity_ids = [e.entity_id for e in hass.states.async_all()]
    binary_ids = [eid for eid in entity_ids if eid.startswith("binary_sensor.")]

    # 3 enabled by default: occupancy, motion, static_presence
    # target_presence, per-target active, and zone occupancy are disabled by default
    assert len(binary_ids) >= 3, f"Expected >=3 binary_sensor entities, got {len(binary_ids)}: {binary_ids}"
    assert any("occupancy" in eid for eid in binary_ids)
    assert any("motion" in eid for eid in binary_ids)
    assert any("static_presence" in eid for eid in binary_ids)

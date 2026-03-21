"""Tests for sensor entities."""

from __future__ import annotations

from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.components.sensor import SensorStateClass
from homeassistant.const import CONCENTRATION_PARTS_PER_MILLION
from homeassistant.const import LIGHT_LUX
from homeassistant.const import PERCENTAGE
from homeassistant.const import UnitOfLength
from homeassistant.const import UnitOfTemperature
from homeassistant.core import HomeAssistant

from custom_components.everything_presence_pro.sensor import EverythingPresenceProCO2Sensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProHumiditySensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProIlluminanceSensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProRoomTargetCountSensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProTargetAngleSensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProTargetDistanceSensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProTargetResolutionSensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProTargetSpeedSensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProTargetXYGridSensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProTargetXYSensorSensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProTemperatureSensor
from custom_components.everything_presence_pro.sensor import EverythingPresenceProZoneTargetCountSensor
from custom_components.everything_presence_pro.zone_engine import ProcessingResult
from custom_components.everything_presence_pro.zone_engine import Zone


@pytest.fixture
def mock_coordinator():
    """Create a mock coordinator for unit testing sensor classes directly."""
    coordinator = MagicMock()
    coordinator.entry = MagicMock()
    coordinator.entry.entry_id = "test_entry"
    coordinator.illuminance = 350.0
    coordinator.temperature = 22.5
    coordinator.humidity = 45.0
    coordinator.co2 = 420.0
    coordinator.target_count = 2
    coordinator.target_distance = lambda idx: 5000.0 if idx == 0 else None
    coordinator.target_speed = lambda idx: 100.0 if idx == 0 else None
    coordinator.target_angle = lambda idx: 45.0 if idx == 0 else None
    coordinator.target_resolution = lambda idx: 75.0 if idx == 0 else None
    coordinator.targets = [(3000, 4000, True), (0, 0, False), (0, 0, False)]
    coordinator.raw_targets = [(3000, 4000, True), (0, 0, False), (0, 0, False)]
    coordinator.last_result = ProcessingResult(
        device_tracking_present=True,
        zone_occupancy={1: True},
        zone_target_counts={1: 2, 0: 1},
    )
    coordinator.get_zone_by_slot = lambda slot: Zone(id=1, name="Desk", type="normal") if slot == 1 else None
    return coordinator


# ---------------------------------------------------------------------------
# Illuminance sensor
# ---------------------------------------------------------------------------


class TestIlluminanceSensor:
    """Tests for the illuminance sensor."""

    def test_value(self, mock_coordinator):
        sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
        assert sensor.native_value == 350.0

    def test_none_value(self, mock_coordinator):
        mock_coordinator.illuminance = None
        sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
        assert sensor.native_value is None

    def test_nan_value(self, mock_coordinator):
        mock_coordinator.illuminance = float("nan")
        sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
        assert sensor.native_value is None

    def test_inf_value(self, mock_coordinator):
        mock_coordinator.illuminance = float("inf")
        sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
        assert sensor.native_value is None

    def test_device_class(self, mock_coordinator):
        sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
        assert sensor.device_class == SensorDeviceClass.ILLUMINANCE

    def test_unit(self, mock_coordinator):
        sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
        assert sensor.native_unit_of_measurement == LIGHT_LUX

    def test_state_class(self, mock_coordinator):
        sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
        assert sensor.state_class == SensorStateClass.MEASUREMENT

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
        assert sensor.unique_id == "test_entry_illuminance"


# ---------------------------------------------------------------------------
# Temperature sensor
# ---------------------------------------------------------------------------


class TestTemperatureSensor:
    """Tests for the temperature sensor."""

    def test_value(self, mock_coordinator):
        sensor = EverythingPresenceProTemperatureSensor(mock_coordinator)
        assert sensor.native_value == 22.5

    def test_none_value(self, mock_coordinator):
        mock_coordinator.temperature = None
        sensor = EverythingPresenceProTemperatureSensor(mock_coordinator)
        assert sensor.native_value is None

    def test_device_class(self, mock_coordinator):
        sensor = EverythingPresenceProTemperatureSensor(mock_coordinator)
        assert sensor.device_class == SensorDeviceClass.TEMPERATURE

    def test_unit(self, mock_coordinator):
        sensor = EverythingPresenceProTemperatureSensor(mock_coordinator)
        assert sensor.native_unit_of_measurement == UnitOfTemperature.CELSIUS

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProTemperatureSensor(mock_coordinator)
        assert sensor.unique_id == "test_entry_temperature"


# ---------------------------------------------------------------------------
# Humidity sensor
# ---------------------------------------------------------------------------


class TestHumiditySensor:
    """Tests for the humidity sensor."""

    def test_value(self, mock_coordinator):
        sensor = EverythingPresenceProHumiditySensor(mock_coordinator)
        assert sensor.native_value == 45.0

    def test_none_value(self, mock_coordinator):
        mock_coordinator.humidity = None
        sensor = EverythingPresenceProHumiditySensor(mock_coordinator)
        assert sensor.native_value is None

    def test_device_class(self, mock_coordinator):
        sensor = EverythingPresenceProHumiditySensor(mock_coordinator)
        assert sensor.device_class == SensorDeviceClass.HUMIDITY

    def test_unit(self, mock_coordinator):
        sensor = EverythingPresenceProHumiditySensor(mock_coordinator)
        assert sensor.native_unit_of_measurement == PERCENTAGE

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProHumiditySensor(mock_coordinator)
        assert sensor.unique_id == "test_entry_humidity"


# ---------------------------------------------------------------------------
# CO2 sensor
# ---------------------------------------------------------------------------


class TestCO2Sensor:
    """Tests for the CO2 sensor."""

    def test_value(self, mock_coordinator):
        sensor = EverythingPresenceProCO2Sensor(mock_coordinator)
        assert sensor.native_value == 420.0

    def test_none_value(self, mock_coordinator):
        mock_coordinator.co2 = None
        sensor = EverythingPresenceProCO2Sensor(mock_coordinator)
        assert sensor.native_value is None

    def test_device_class(self, mock_coordinator):
        sensor = EverythingPresenceProCO2Sensor(mock_coordinator)
        assert sensor.device_class == SensorDeviceClass.CO2

    def test_unit(self, mock_coordinator):
        sensor = EverythingPresenceProCO2Sensor(mock_coordinator)
        assert sensor.native_unit_of_measurement == CONCENTRATION_PARTS_PER_MILLION

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProCO2Sensor(mock_coordinator)
        assert sensor.unique_id == "test_entry_co2"


# ---------------------------------------------------------------------------
# Room target count sensor
# ---------------------------------------------------------------------------


class TestRoomTargetCountSensor:
    """Tests for the room-level target count sensor."""

    def test_value(self, mock_coordinator):
        sensor = EverythingPresenceProRoomTargetCountSensor(mock_coordinator)
        assert sensor.native_value == 2

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProRoomTargetCountSensor(mock_coordinator)
        assert sensor.unique_id == "test_entry_target_count"

    def test_disabled_by_default(self, mock_coordinator):
        sensor = EverythingPresenceProRoomTargetCountSensor(mock_coordinator)
        assert sensor.entity_registry_enabled_default is False


# ---------------------------------------------------------------------------
# Target distance sensor
# ---------------------------------------------------------------------------


class TestTargetDistanceSensor:
    """Tests for per-target distance sensor."""

    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetDistanceSensor(mock_coordinator, 0)
        assert sensor.native_value == 5000.0

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetDistanceSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_device_class(self, mock_coordinator):
        sensor = EverythingPresenceProTargetDistanceSensor(mock_coordinator, 0)
        assert sensor.device_class == SensorDeviceClass.DISTANCE

    def test_unit(self, mock_coordinator):
        sensor = EverythingPresenceProTargetDistanceSensor(mock_coordinator, 0)
        assert sensor.native_unit_of_measurement == UnitOfLength.MILLIMETERS

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProTargetDistanceSensor(mock_coordinator, 0)
        assert sensor.unique_id == "test_entry_target_1_distance"

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetDistanceSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 distance"

    def test_disabled_by_default(self, mock_coordinator):
        sensor = EverythingPresenceProTargetDistanceSensor(mock_coordinator, 0)
        assert sensor.entity_registry_enabled_default is False


# ---------------------------------------------------------------------------
# Zone target count sensor
# ---------------------------------------------------------------------------


class TestZoneTargetCountSensor:
    """Tests for per-zone target count sensors."""

    def test_value(self, mock_coordinator):
        sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=1)
        assert sensor.native_value == 2

    def test_name_with_zone(self, mock_coordinator):
        sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=1)
        assert sensor.name == "Desk target count"

    def test_name_without_zone(self, mock_coordinator):
        sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=5)
        assert sensor.name == "Zone 5 target count"

    def test_rest_of_room_name(self, mock_coordinator):
        sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=0)
        assert sensor.name == "Rest of room target count"

    def test_unique_id_named(self, mock_coordinator):
        sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=1)
        assert sensor.unique_id == "test_entry_zone_1_count"

    def test_unique_id_rest_of_room(self, mock_coordinator):
        sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=0)
        assert sensor.unique_id == "test_entry_rest_of_room_count"

    def test_disabled_by_default(self, mock_coordinator):
        sensor = EverythingPresenceProZoneTargetCountSensor(mock_coordinator, slot=5)
        assert sensor.entity_registry_enabled_default is False


# ---------------------------------------------------------------------------
# Integration test: entities created via async_setup_entry
# ---------------------------------------------------------------------------


async def test_async_setup_entry_creates_sensor_entities(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """async_setup_entry creates expected sensor entities."""
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
    sensor_ids = [eid for eid in entity_ids if eid.startswith("sensor.")]

    # 3 enabled by default: illuminance, temperature, humidity
    # CO2 only if co2 is not None (it's None by default in our mock)
    assert len(sensor_ids) >= 3, f"Expected >=3 sensor entities, got {len(sensor_ids)}: {sensor_ids}"
    assert any("illuminance" in eid for eid in sensor_ids)
    assert any("temperature" in eid for eid in sensor_ids)
    assert any("humidity" in eid for eid in sensor_ids)


async def test_async_setup_entry_with_co2(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """async_setup_entry creates CO2 sensor when co2 value is not None."""
    mock_http = MagicMock()
    mock_http.async_register_static_paths = AsyncMock()
    hass.http = mock_http

    with patch(
        "custom_components.everything_presence_pro.panel_custom.async_register_panel",
        new_callable=AsyncMock,
    ):
        await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()

    coordinator = mock_config_entry.runtime_data
    coordinator._co2 = 420.0
    assert mock_config_entry.state.name == "LOADED"


# ---------------------------------------------------------------------------
# Per-target XY sensor (raw coordinates)
# ---------------------------------------------------------------------------


class TestTargetXYSensorSensor:
    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 0)
        assert sensor.native_value == "3000,4000"

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_extra_attributes_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 0)
        attrs = sensor.extra_state_attributes
        assert attrs["x_mm"] == 3000
        assert attrs["y_mm"] == 4000

    def test_extra_attributes_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 1)
        assert sensor.extra_state_attributes is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 XY sensor"

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 0)
        assert sensor.unique_id == "test_entry_target_1_xy_sensor"


# ---------------------------------------------------------------------------
# Per-target XY grid sensor (calibrated coordinates)
# ---------------------------------------------------------------------------


class TestTargetXYGridSensor:
    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 0)
        assert sensor.native_value == "3000,4000"

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_extra_attributes_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 0)
        attrs = sensor.extra_state_attributes
        assert attrs["x_mm"] == 3000
        assert attrs["y_mm"] == 4000

    def test_extra_attributes_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 1)
        assert sensor.extra_state_attributes is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 XY grid"


# ---------------------------------------------------------------------------
# Per-target angle sensor
# ---------------------------------------------------------------------------


class TestTargetAngleSensor:
    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetAngleSensor(mock_coordinator, 0)
        assert sensor.native_value == 45.0

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetAngleSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetAngleSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 angle"


# ---------------------------------------------------------------------------
# Per-target speed sensor
# ---------------------------------------------------------------------------


class TestTargetSpeedSensor:
    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetSpeedSensor(mock_coordinator, 0)
        assert sensor.native_value == 100.0

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetSpeedSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetSpeedSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 speed"


# ---------------------------------------------------------------------------
# Per-target resolution sensor
# ---------------------------------------------------------------------------


class TestTargetResolutionSensor:
    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetResolutionSensor(mock_coordinator, 0)
        assert sensor.native_value == 75.0

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetResolutionSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetResolutionSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 resolution"

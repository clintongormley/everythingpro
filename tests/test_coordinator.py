"""Tests for the data coordinator."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.everything_presence_pro.calibration import SensorTransform
from custom_components.everything_presence_pro.coordinator import EverythingPresenceProCoordinator
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


@pytest.fixture
def coordinator(mock_hass, mock_entry):
    """Create a coordinator instance for testing."""
    return EverythingPresenceProCoordinator(mock_hass, mock_entry)


# ---------------------------------------------------------------------------
# Initialization
# ---------------------------------------------------------------------------


class TestCoordinatorInit:
    """Tests for coordinator construction and defaults."""

    def test_creation(self, coordinator):
        """Coordinator can be created."""
        assert coordinator is not None
        assert coordinator.zones == []
        assert coordinator.connected is False

    def test_default_sensor_values(self, coordinator):
        """All environment sensors are None by default."""
        assert coordinator.illuminance is None
        assert coordinator.temperature is None
        assert coordinator.humidity is None
        assert coordinator.co2 is None

    def test_default_device_occupied(self, coordinator):
        """device_occupied is False by default."""
        assert coordinator.device_occupied is False

    def test_default_target_state(self, coordinator):
        """Target state is all inactive by default."""
        assert coordinator.target_present is False
        assert coordinator.target_count == 0
        for i in range(3):
            assert coordinator.target_distance(i) is None
            assert coordinator.target_speed(i) is None
            assert coordinator.target_angle(i) is None
            assert coordinator.target_resolution(i) is None

    def test_default_pending_targets(self, coordinator):
        """No pending targets by default."""
        assert coordinator.pending_targets == []


# ---------------------------------------------------------------------------
# Config load / get
# ---------------------------------------------------------------------------


class TestCoordinatorConfig:
    """Tests for config serialization and deserialization."""

    def test_set_zones(self, coordinator):
        """Setting zones on coordinator stores them."""
        zones = [
            Zone(id=1, name="Desk", type="normal", trigger=5, renew=7, timeout=10.0),
        ]
        coordinator.set_zones(zones)
        assert len(coordinator.zones) == 1
        assert coordinator.zones[0].name == "Desk"

    def test_get_zone_by_slot(self, coordinator):
        """get_zone_by_slot returns the right zone or None."""
        zones = [
            Zone(id=1, name="Desk", type="normal"),
            Zone(id=3, name="Bed", type="rest"),
        ]
        coordinator.set_zones(zones)
        assert coordinator.get_zone_by_slot(1).name == "Desk"
        assert coordinator.get_zone_by_slot(3).name == "Bed"
        assert coordinator.get_zone_by_slot(2) is None

    def test_config_roundtrip(self, mock_hass, mock_entry):
        """Config data serialization roundtrip preserves zones."""
        coordinator = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        zones = [
            Zone(id=1, name="Desk", type="normal", trigger=5, renew=7, timeout=10.0),
        ]
        coordinator.set_zones(zones)

        data = coordinator.get_config_data()
        assert len(data["zones"]) == 1
        assert data["zones"][0]["name"] == "Desk"
        assert data["zones"][0]["type"] == "normal"

        coordinator2 = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coordinator2.load_config_data(data)
        assert len(coordinator2.zones) == 1
        assert coordinator2.zones[0].name == "Desk"

    def test_load_config_data_empty(self, coordinator):
        """load_config_data with empty dict is a no-op."""
        coordinator.load_config_data({})
        assert coordinator.zones == []

    def test_load_config_data_with_calibration(self, mock_hass, mock_entry):
        """load_config_data restores calibration transform."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        transform = SensorTransform(
            perspective=[1, 0, 100, 0, 1, 200, 0, 0],
            room_width=3000,
            room_depth=4000,
        )
        coord.set_sensor_transform(transform)
        data = coord.get_config_data()

        coord2 = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coord2.load_config_data(data)
        assert coord2.sensor_transform.perspective == [1, 0, 100, 0, 1, 200, 0, 0]
        assert coord2.sensor_transform.room_width == 3000

    def test_get_config_data_structure(self, coordinator):
        """get_config_data returns expected keys."""
        data = coordinator.get_config_data()
        assert "zones" in data
        assert "calibration" in data
        assert "grid" in data
        assert "room_layout" in data
        assert "offsets" in data


# ---------------------------------------------------------------------------
# classify_entity
# ---------------------------------------------------------------------------


class TestClassifyEntity:
    """Tests for _classify_entity."""

    def test_target_x(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_target_1_x") == "target_1_x"

    def test_target_y(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_target_2_y") == "target_2_y"

    def test_target_speed(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_target_3_speed") == "target_3_speed"

    def test_target_active(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_target_1_active") == "target_1_active"

    def test_target_resolution(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_target_2_resolution") == "target_2_resolution"

    def test_static_presence(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_mmwave") == "static_presence"
        assert coordinator._classify_entity("static_presence") == "static_presence"

    def test_pir_motion(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_pir") == "pir_motion"
        assert coordinator._classify_entity("ep_pro_abc_motion") == "pir_motion"

    def test_illuminance(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_illuminance") == "illuminance"
        assert coordinator._classify_entity("illumination") == "illuminance"

    def test_temperature(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_temperature") == "temperature"

    def test_humidity(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_humidity") == "humidity"

    def test_co2(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_co2") == "co2"

    def test_unknown_entity(self, coordinator):
        assert coordinator._classify_entity("ep_pro_abc_unknown") is None
        assert coordinator._classify_entity("firmware_version") is None


# ---------------------------------------------------------------------------
# Properties with values
# ---------------------------------------------------------------------------


class TestCoordinatorProperties:
    """Tests for computed properties."""

    def test_illuminance_with_offset(self, coordinator):
        """Illuminance applies offset and clamps to zero."""
        coordinator._illuminance = 100.0
        coordinator._illuminance_offset = -50.0
        assert coordinator.illuminance == 50.0

        coordinator._illuminance_offset = -200.0
        assert coordinator.illuminance == 0.0  # clamped

    def test_temperature_with_offset(self, coordinator):
        """Temperature applies offset."""
        coordinator._temperature = 22.5
        coordinator._temperature_offset = -2.0
        assert coordinator.temperature == 20.5

    def test_humidity_with_offset(self, coordinator):
        """Humidity applies offset."""
        coordinator._humidity = 45.0
        coordinator._humidity_offset = 5.0
        assert coordinator.humidity == 50.0

    def test_device_occupied_pir(self, coordinator):
        """device_occupied is True when PIR is active."""
        coordinator._pir_motion = True
        assert coordinator.device_occupied is True

    def test_device_occupied_static(self, coordinator):
        """device_occupied is True when static presence is active."""
        coordinator._static_present = True
        assert coordinator.device_occupied is True

    def test_target_present_and_count(self, coordinator):
        """target_present and target_count track active targets."""
        coordinator._targets = [(100, 200, True), (0, 0, False), (300, 400, True)]
        assert coordinator.target_present is True
        assert coordinator.target_count == 2

    def test_target_distance(self, coordinator):
        """target_distance computes Euclidean distance from sensor."""
        coordinator._targets = [(3000, 4000, True), (0, 0, False), (0, 0, False)]
        assert coordinator.target_distance(0) == pytest.approx(5000.0)
        assert coordinator.target_distance(1) is None  # inactive

    def test_target_angle(self, coordinator):
        """target_angle computes atan2(x, y) in degrees."""
        coordinator._targets = [(1000, 1000, True), (0, 0, False), (0, 0, False)]
        assert coordinator.target_angle(0) == pytest.approx(45.0)
        assert coordinator.target_angle(1) is None

    def test_target_speed(self, coordinator):
        """target_speed converts from cm/s to mm/s."""
        coordinator._target_active = [True, False, False]
        coordinator._target_speed = [10.0, 0.0, 0.0]
        assert coordinator.target_speed(0) == 100.0  # 10 * 10
        assert coordinator.target_speed(1) is None

    def test_target_resolution(self, coordinator):
        """target_resolution returns the raw value."""
        coordinator._target_active = [True, False, False]
        coordinator._target_resolution = [75.0, 0.0, 0.0]
        assert coordinator.target_resolution(0) == 75.0
        assert coordinator.target_resolution(1) is None

    def test_raw_targets(self, coordinator):
        """raw_targets returns untransformed positions."""
        coordinator._target_x = [100.0, 200.0, 300.0]
        coordinator._target_y = [400.0, 500.0, 600.0]
        coordinator._target_active = [True, False, True]
        raw = coordinator.raw_targets
        assert raw[0] == (100.0, 400.0, True)
        assert raw[1] == (200.0, 500.0, False)
        assert raw[2] == (300.0, 600.0, True)


# ---------------------------------------------------------------------------
# Offsets
# ---------------------------------------------------------------------------


class TestOffsets:
    """Tests for environmental sensor offsets."""

    def test_set_offsets(self, coordinator):
        """set_offsets updates the offset values."""
        coordinator.set_offsets({"illuminance": 10.0, "temperature": -1.5, "humidity": 3.0})
        assert coordinator._illuminance_offset == 10.0
        assert coordinator._temperature_offset == -1.5
        assert coordinator._humidity_offset == 3.0

    def test_offsets_loaded_from_entry_options(self):
        """Offsets are loaded from entry.options at construction time."""
        entry = MagicMock()
        entry.entry_id = "test"
        entry.data = {"host": "192.168.1.1"}
        entry.options = {
            "config": {
                "offsets": {
                    "illuminance": 5.0,
                    "temperature": -2.0,
                    "humidity": 1.5,
                }
            }
        }
        hass = MagicMock()
        coord = EverythingPresenceProCoordinator(hass, entry)
        assert coord._illuminance_offset == 5.0
        assert coord._temperature_offset == -2.0
        assert coord._humidity_offset == 1.5

    def test_target_index_extraction(self, coordinator):
        """_target_index extracts 0-based index from 'target_N_*' names."""
        assert coordinator._target_index("target_1_x") == 0
        assert coordinator._target_index("target_2_y") == 1
        assert coordinator._target_index("target_3_speed") == 2
        assert coordinator._target_index("target_0_x") is None  # out of range
        assert coordinator._target_index("target_4_x") is None  # out of range
        assert coordinator._target_index("bad_name") is None

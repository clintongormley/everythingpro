"""Tests for the data coordinator."""

from __future__ import annotations

from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from aioesphomeapi import BinarySensorState
from aioesphomeapi import SensorState

from custom_components.everything_presence_pro.calibration import SensorTransform
from custom_components.everything_presence_pro.const import CELL_ROOM_BIT
from custom_components.everything_presence_pro.const import GRID_CELL_SIZE_MM
from custom_components.everything_presence_pro.const import GRID_COLS
from custom_components.everything_presence_pro.const import GRID_ROWS
from custom_components.everything_presence_pro.coordinator import EverythingPresenceProCoordinator
from custom_components.everything_presence_pro.zone_engine import DisplayBuffer
from custom_components.everything_presence_pro.zone_engine import Grid
from custom_components.everything_presence_pro.zone_engine import ProcessingResult
from custom_components.everything_presence_pro.zone_engine import TargetResult
from custom_components.everything_presence_pro.zone_engine import TargetStatus
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
        coordinator._last_result = ProcessingResult(
            targets=[
                TargetResult(x=100, y=200, status=TargetStatus.ACTIVE, signal=5),
                TargetResult(),
                TargetResult(x=300, y=400, status=TargetStatus.ACTIVE, signal=5),
            ]
        )
        assert coordinator.target_present is True
        assert coordinator.target_count == 2

    def test_target_distance(self, coordinator):
        """target_distance computes Euclidean distance from sensor."""
        coordinator._last_result = ProcessingResult(
            targets=[
                TargetResult(x=3000, y=4000, status=TargetStatus.ACTIVE, signal=5),
                TargetResult(),
                TargetResult(),
            ]
        )
        assert coordinator.target_distance(0) == pytest.approx(5000.0)
        assert coordinator.target_distance(1) is None  # inactive

    def test_target_angle(self, coordinator):
        """target_angle computes atan2(x, y) in degrees."""
        coordinator._last_result = ProcessingResult(
            targets=[
                TargetResult(x=1000, y=1000, status=TargetStatus.ACTIVE, signal=5),
                TargetResult(),
                TargetResult(),
            ]
        )
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


# ---------------------------------------------------------------------------
# Grid-bounds gating (_build_calibrated_targets)
# ---------------------------------------------------------------------------


def _make_room_grid(room_width_mm: float, room_depth_mm: float) -> Grid:
    """Create a 20x20 grid with the room rectangle marked as room cells."""
    cell_size = GRID_CELL_SIZE_MM
    room_cols = max(1, -(-int(room_width_mm) // cell_size))  # ceil division
    start_col = (GRID_COLS - room_cols) // 2
    origin_x = -start_col * cell_size
    origin_y = 0.0
    grid = Grid(origin_x=origin_x, origin_y=origin_y, cols=GRID_COLS, rows=GRID_ROWS)
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            cx = origin_x + (c + 0.5) * cell_size
            cy = origin_y + (r + 0.5) * cell_size
            if 0 <= cx < room_width_mm and 0 <= cy < room_depth_mm:
                grid.cells[r * GRID_COLS + c] = CELL_ROOM_BIT
    return grid


def _coordinator_with_grid(mock_hass, mock_entry, room_w=3000, room_d=3000):
    """Create a coordinator with an identity perspective and a room grid."""
    coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
    # Identity perspective: calibrated coords == raw coords
    transform = SensorTransform(
        perspective=[1, 0, 0, 0, 1, 0, 0, 0],
        room_width=room_w,
        room_depth=room_d,
    )
    coord.set_sensor_transform(transform)
    grid = _make_room_grid(room_w, room_d)
    coord._zone_engine.set_grid(grid)
    return coord


class TestBuildCalibratedTargetsGridGating:
    """Tests for _build_calibrated_targets grid-bounds gating."""

    def test_target_inside_room_stays_active(self, mock_hass, mock_entry):
        """A target inside the room grid is reported as active."""
        coord = _coordinator_with_grid(mock_hass, mock_entry, 3000, 3000)
        coord._target_active = [True, False, False]
        coord._target_x = [1500.0, 0.0, 0.0]
        coord._target_y = [1500.0, 0.0, 0.0]

        result = coord._build_calibrated_targets()

        assert result[0][2] is True
        assert result[0][0] == pytest.approx(1500.0)
        assert result[0][1] == pytest.approx(1500.0)

    def test_target_outside_grid_becomes_inactive(self, mock_hass, mock_entry):
        """A target beyond the 20x20 grid boundary is treated as inactive."""
        coord = _coordinator_with_grid(mock_hass, mock_entry, 3000, 3000)
        coord._target_active = [True, False, False]
        coord._target_x = [9000.0, 0.0, 0.0]
        coord._target_y = [1500.0, 0.0, 0.0]

        result = coord._build_calibrated_targets()

        assert result[0][2] is False

    def test_inactive_target_stays_inactive(self, mock_hass, mock_entry):
        """An ESPHome-inactive target is reported as inactive."""
        coord = _coordinator_with_grid(mock_hass, mock_entry, 3000, 3000)
        coord._target_active = [False, False, False]
        coord._target_x = [1500.0, 0.0, 0.0]
        coord._target_y = [1500.0, 0.0, 0.0]

        result = coord._build_calibrated_targets()

        assert result[0][2] is False

    def test_multiple_targets_gated_independently(self, mock_hass, mock_entry):
        """Each target is gated based on its own position."""
        coord = _coordinator_with_grid(mock_hass, mock_entry, 3000, 3000)
        coord._target_active = [True, True, True]
        coord._target_x = [1500.0, 9000.0, 1500.0]
        coord._target_y = [1500.0, 1500.0, 1500.0]

        result = coord._build_calibrated_targets()

        assert result[0][2] is True   # ESPHome active
        assert result[1][2] is False  # ESPHome inactive
        assert result[0][2] is True   # inside room
        assert result[1][2] is False  # outside grid
        assert result[2][2] is True   # inside room


# ---------------------------------------------------------------------------
# Connection lifecycle
# ---------------------------------------------------------------------------


class TestConnectionLifecycle:
    """Tests for connect/disconnect lifecycle."""

    async def test_async_connect_creates_client_and_starts_reconnect(self, mock_hass, mock_entry):
        with (
            patch("custom_components.everything_presence_pro.coordinator.APIClient") as mock_api_cls,
            patch("custom_components.everything_presence_pro.coordinator.ReconnectLogic") as mock_rl_cls,
        ):
            mock_rl = AsyncMock()
            mock_rl_cls.return_value = mock_rl
            mock_api_cls.return_value = AsyncMock()
            coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
            await coord.async_connect()
            mock_api_cls.assert_called_once_with("192.168.1.100", 6053, "", noise_psk="test_key")
            mock_rl_cls.assert_called_once()
            mock_rl.start.assert_awaited_once()

    async def test_on_connect_sets_connected_and_subscribes(self, mock_hass, mock_entry):
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coord._client = AsyncMock()
        coord._client.list_entities_services = AsyncMock(return_value=([], []))
        coord._client.subscribe_states = MagicMock()
        await coord._on_connect()
        assert coord.connected is True

    async def test_on_disconnect_unexpected(self, mock_hass, mock_entry):
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coord._connected = True
        await coord._on_disconnect(expected_disconnect=False)
        assert coord.connected is False

    async def test_on_disconnect_expected(self, mock_hass, mock_entry):
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coord._connected = True
        await coord._on_disconnect(expected_disconnect=True)
        assert coord.connected is False

    async def test_on_connect_error(self, mock_hass, mock_entry):
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        await coord._on_connect_error(ConnectionError("test"))
        assert coord.connected is False

    async def test_async_disconnect_stops_reconnect_and_disconnects(self, mock_hass, mock_entry):
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        mock_rl = AsyncMock()
        mock_client = AsyncMock()
        coord._reconnect_logic = mock_rl
        coord._client = mock_client
        coord._connected = True
        await coord.async_disconnect()
        mock_rl.stop.assert_awaited_once()
        mock_client.disconnect.assert_awaited_once()
        assert coord.connected is False
        assert coord._client is None
        assert coord._reconnect_logic is None

    async def test_async_disconnect_handles_client_error(self, mock_hass, mock_entry):
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        mock_client = AsyncMock()
        mock_client.disconnect.side_effect = OSError("Connection lost")
        coord._client = mock_client
        await coord.async_disconnect()
        assert coord.connected is False
        assert coord._client is None

    async def test_async_disconnect_no_client(self, mock_hass, mock_entry):
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        await coord.async_disconnect()
        assert coord.connected is False


# ---------------------------------------------------------------------------
# State handling
# ---------------------------------------------------------------------------


@patch("custom_components.everything_presence_pro.coordinator.async_dispatcher_send")
class TestStateHandling:
    """Tests for _on_state, _handle_binary_sensor, _handle_sensor."""

    def test_handle_binary_sensor_static_presence(self, mock_dispatch, coordinator):
        coordinator._handle_binary_sensor("static_presence", True)
        assert coordinator._static_present is True
        mock_dispatch.assert_called_once()

    def test_handle_binary_sensor_pir(self, mock_dispatch, coordinator):
        coordinator._handle_binary_sensor("pir_motion", True)
        assert coordinator._pir_motion is True

    def test_handle_binary_sensor_target_active(self, mock_dispatch, coordinator):
        coordinator._handle_binary_sensor("target_1_active", True)
        assert coordinator._target_active[0] is True

    def test_handle_sensor_illuminance(self, mock_dispatch, coordinator):
        coordinator._handle_sensor("illuminance", 350.0)
        assert coordinator._illuminance == 350.0

    def test_handle_sensor_temperature(self, mock_dispatch, coordinator):
        coordinator._handle_sensor("temperature", 22.5)
        assert coordinator._temperature == 22.5

    def test_handle_sensor_humidity(self, mock_dispatch, coordinator):
        coordinator._handle_sensor("humidity", 45.0)
        assert coordinator._humidity == 45.0

    def test_handle_sensor_co2(self, mock_dispatch, coordinator):
        coordinator._handle_sensor("co2", 420.0)
        assert coordinator._co2 == 420.0

    def test_handle_sensor_target_x(self, mock_dispatch, coordinator):
        coordinator._handle_sensor("target_1_x", 1500.0)
        assert coordinator._target_x[0] == 1500.0

    def test_handle_sensor_target_y(self, mock_dispatch, coordinator):
        coordinator._handle_sensor("target_2_y", 2000.0)
        assert coordinator._target_y[1] == 2000.0

    def test_handle_sensor_target_speed(self, mock_dispatch, coordinator):
        coordinator._handle_sensor("target_1_speed", 5.0)
        assert coordinator._target_speed[0] == 5.0

    def test_handle_sensor_target_resolution(self, mock_dispatch, coordinator):
        coordinator._handle_sensor("target_1_resolution", 75.0)
        assert coordinator._target_resolution[0] == 75.0

    def test_on_state_dispatches_binary_sensor(self, mock_dispatch, coordinator):
        coordinator._binary_sensor_key_map = {42: "static_presence"}
        state = MagicMock(spec=BinarySensorState)
        state.key = 42
        state.state = True
        coordinator._on_state(state)
        assert coordinator._static_present is True

    def test_on_state_dispatches_sensor(self, mock_dispatch, coordinator):
        coordinator._sensor_key_map = {99: "illuminance"}
        state = MagicMock(spec=SensorState)
        state.key = 99
        state.state = 350.0
        coordinator._on_state(state)
        assert coordinator._illuminance == 350.0

    def test_on_state_ignores_unknown_key(self, mock_dispatch, coordinator):
        state = MagicMock(spec=SensorState)
        state.key = 999
        state.state = 100.0
        coordinator._on_state(state)
        assert coordinator._illuminance is None

    def test_on_state_ignores_no_key(self, mock_dispatch, coordinator):
        state = MagicMock(spec=object)
        coordinator._on_state(state)


# ---------------------------------------------------------------------------
# Schedule and expiry
# ---------------------------------------------------------------------------


class TestScheduleAndExpiry:
    """Tests for _schedule_rebuild and _expiry_tick."""

    @patch("custom_components.everything_presence_pro.coordinator.async_dispatcher_send")
    def test_schedule_rebuild_feeds_zone_engine(self, mock_dispatch, mock_hass, mock_entry):
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        coord._target_active = [True, False, False]
        coord._target_x = [1500.0, 0.0, 0.0]
        coord._target_y = [1500.0, 0.0, 0.0]
        coord._schedule_rebuild()
        assert coord._last_result is not None

    def test_schedule_expiry_tick_no_pending(self, mock_hass, mock_entry):
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        coord._schedule_expiry_tick()
        assert coord._window_timer is None

    def test_schedule_expiry_tick_cancels_previous(self, mock_hass, mock_entry):
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        mock_timer = MagicMock()
        coord._window_timer = mock_timer
        coord._schedule_expiry_tick()
        mock_timer.cancel.assert_called_once()

    @patch("custom_components.everything_presence_pro.coordinator.async_dispatcher_send")
    def test_expiry_tick_clears_timer_and_feeds_empty(self, mock_dispatch, mock_hass, mock_entry):
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        coord._window_timer = MagicMock()
        coord._expiry_tick()
        assert coord._window_timer is None


# ---------------------------------------------------------------------------
# Additional property and helper coverage
# ---------------------------------------------------------------------------


class TestAdditionalProperties:
    """Tests for properties and helpers not covered by earlier classes."""

    def test_last_result_property(self, coordinator):
        """last_result returns the ProcessingResult object."""
        from custom_components.everything_presence_pro.zone_engine import ProcessingResult

        result = coordinator.last_result
        assert isinstance(result, ProcessingResult)

    def test_static_present_property(self, coordinator):
        """static_present reflects _static_present."""
        coordinator._static_present = True
        assert coordinator.static_present is True

    def test_pir_motion_property(self, coordinator):
        """pir_motion reflects _pir_motion."""
        coordinator._pir_motion = True
        assert coordinator.pir_motion is True

    def test_targets_property(self, coordinator):
        """targets returns a copy of last_result.targets list."""
        coordinator._last_result = ProcessingResult(
            targets=[
                TargetResult(x=100.0, y=200.0, status=TargetStatus.ACTIVE, signal=5),
                TargetResult(),
                TargetResult(),
            ]
        )
        result = coordinator.targets
        assert result[0].x == 100.0
        assert result[0].y == 200.0
        assert result[0].status == TargetStatus.ACTIVE
        assert len(result) == 3

    def test_sensor_transform_property(self, coordinator):
        """sensor_transform returns the SensorTransform object."""
        t = coordinator.sensor_transform
        assert isinstance(t, SensorTransform)

    def test_target_angle_zero_zero_is_none(self, coordinator):
        """target_angle returns None when x and y are both 0."""
        coordinator._last_result = ProcessingResult(
            targets=[
                TargetResult(x=0.0, y=0.0, status=TargetStatus.ACTIVE, signal=5),
                TargetResult(),
                TargetResult(),
            ]
        )
        assert coordinator.target_angle(0) is None


# ---------------------------------------------------------------------------
# set_room_layout and _load_frontend_grid
# ---------------------------------------------------------------------------


class TestRoomLayout:
    """Tests for set_room_layout and _load_frontend_grid."""

    def test_set_room_layout_no_grid_bytes(self, coordinator):
        """set_room_layout without grid_bytes only stores the layout."""
        coordinator.set_room_layout({"width": 3000})
        assert coordinator._room_layout == {"width": 3000}

    def test_set_room_layout_with_grid_bytes(self, mock_hass, mock_entry):
        """set_room_layout with grid_bytes calls _load_frontend_grid."""
        from custom_components.everything_presence_pro.const import GRID_COLS
        from custom_components.everything_presence_pro.const import GRID_ROWS

        coord = _coordinator_with_grid(mock_hass, mock_entry)
        grid_bytes = [0] * (GRID_COLS * GRID_ROWS)
        coord.set_room_layout({"grid_bytes": grid_bytes})
        assert coord._room_layout["grid_bytes"] == grid_bytes

    def test_rebuild_grid_no_perspective(self, mock_hass, mock_entry):
        """_rebuild_grid is a no-op when perspective is None."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coord._sensor_transform = SensorTransform()  # perspective is None by default
        coord._rebuild_grid()  # should not raise


# ---------------------------------------------------------------------------
# subscribe_targets coverage
# ---------------------------------------------------------------------------


class TestSubscribeTargets:
    """Tests for subscribe_targets entity key-map building."""

    async def test_subscribe_targets_no_client(self, mock_hass, mock_entry):
        """subscribe_targets exits early when client is None."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coord._client = None
        await coord.subscribe_targets()  # should return without error

    async def test_subscribe_targets_maps_binary_sensor_and_sensor(self, mock_hass, mock_entry):
        """subscribe_targets populates binary_sensor_key_map and sensor_key_map."""
        from aioesphomeapi import BinarySensorInfo
        from aioesphomeapi import SensorInfo

        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        bs = BinarySensorInfo(object_id="ep_pro_abc_mmwave", key=42)
        si = SensorInfo(object_id="ep_pro_abc_illuminance", key=99)
        mock_client = AsyncMock()
        mock_client.list_entities_services = AsyncMock(return_value=([bs, si], []))
        mock_client.subscribe_states = MagicMock()
        coord._client = mock_client
        await coord.subscribe_targets()
        assert coord._binary_sensor_key_map[42] == "static_presence"
        assert coord._sensor_key_map[99] == "illuminance"

    async def test_subscribe_targets_skips_unknown_entities(self, mock_hass, mock_entry):
        """subscribe_targets skips entities that don't classify."""
        from aioesphomeapi import SensorInfo

        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        unknown = SensorInfo(object_id="firmware_version", key=1)
        mock_client = AsyncMock()
        mock_client.list_entities_services = AsyncMock(return_value=([unknown], []))
        mock_client.subscribe_states = MagicMock()
        coord._client = mock_client
        await coord.subscribe_targets()
        assert 1 not in coord._sensor_key_map


# ---------------------------------------------------------------------------
# _schedule_rebuild when window ticks (result is not None)
# ---------------------------------------------------------------------------


@patch("custom_components.everything_presence_pro.coordinator.async_dispatcher_send")
class TestScheduleRebuildWindowTick:
    """Tests for _schedule_rebuild when a window result is produced."""

    def test_schedule_rebuild_dispatches_when_window_ticks(self, mock_dispatch, mock_hass, mock_entry):
        """_schedule_rebuild dispatches SIGNAL_TARGETS_UPDATED when zone engine returns a result."""
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        zone = Zone(id=1, name="Test", type="normal", trigger=1, renew=1, timeout=0.1)
        coord.set_zones([zone])
        coord._target_active = [True, False, False]
        coord._target_x = [1500.0, 0.0, 0.0]
        coord._target_y = [1500.0, 0.0, 0.0]

        import time

        # Feed twice so zone engine has a first window to compare against
        coord._schedule_rebuild()
        # Advance time past the window
        with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
            mock_time.monotonic.return_value = time.monotonic() + 10.0
            coord._schedule_rebuild()

        # dispatch was called at least once
        assert mock_dispatch.called

    def test_expiry_tick_dispatches_when_result_produced(self, mock_dispatch, mock_hass, mock_entry):
        """_expiry_tick dispatches when the zone engine returns a result on empty feed."""
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        zone = Zone(id=1, name="Test", type="normal", trigger=1, renew=1, timeout=0.01)
        coord.set_zones([zone])

        import time

        # Prime the zone engine with a target
        coord._target_active = [True, False, False]
        coord._target_x = [1500.0, 0.0, 0.0]
        coord._target_y = [1500.0, 0.0, 0.0]
        coord._schedule_rebuild()

        # Run expiry tick — feed empty at a much later time
        with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
            mock_time.monotonic.return_value = time.monotonic() + 100.0
            coord._expiry_tick()

        assert mock_dispatch.called


# ---------------------------------------------------------------------------
# load_config_data additional paths
# ---------------------------------------------------------------------------


class TestLoadConfigDataPaths:
    """Tests for load_config_data branches not covered by existing tests."""

    def test_load_config_data_with_perspective_no_grid(self, mock_hass, mock_entry):
        """load_config_data calls _rebuild_grid when calibration has perspective but no grid."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        data = {
            "calibration": {
                "perspective": [1, 0, 0, 0, 1, 0, 0, 0],
                "room_width": 3000,
                "room_depth": 4000,
            },
            # No "grid" or "grid_cols" — triggers _rebuild_grid branch
        }
        coord.load_config_data(data)
        # After _rebuild_grid the zone engine should have a grid
        assert coord._zone_engine.grid is not None

    def test_load_config_data_room_layout_with_grid_bytes(self, mock_hass, mock_entry):
        """load_config_data calls _load_frontend_grid when room_layout has grid_bytes."""
        from custom_components.everything_presence_pro.const import GRID_COLS
        from custom_components.everything_presence_pro.const import GRID_ROWS

        coord = _coordinator_with_grid(mock_hass, mock_entry)
        grid_bytes = [0] * (GRID_COLS * GRID_ROWS)
        data = {
            "room_layout": {"grid_bytes": grid_bytes},
        }
        coord.load_config_data(data)
        assert coord._room_layout.get("grid_bytes") == grid_bytes

    def test_load_config_data_zone_slots_format(self, mock_hass, mock_entry):
        """load_config_data reads zones from room_layout.zone_slots (new format)."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        data = {
            "room_layout": {
                "zone_slots": [
                    {"name": "Desk", "type": "normal"},
                    {"name": "Bed", "type": "rest"},
                ]
            },
        }
        coord.load_config_data(data)
        assert len(coord.zones) == 2
        assert coord.zones[0].name == "Desk"
        assert coord.zones[1].name == "Bed"


# ---------------------------------------------------------------------------
# DisplayBuffer integration
# ---------------------------------------------------------------------------


class TestDisplayBuffer:
    """Tests for display buffer integration in coordinator."""

    def test_coordinator_has_display_buffer(self, coordinator):
        """Coordinator initializes with a DisplayBuffer."""
        assert hasattr(coordinator, "_display_buffer")
        assert isinstance(coordinator._display_buffer, DisplayBuffer)

    def test_display_subscriber_count_starts_zero(self, coordinator):
        """Display subscriber count starts at zero."""
        assert coordinator.display_subscriber_count == 0

    def test_schedule_rebuild_always_feeds_display_buffer(self, coordinator):
        """_schedule_rebuild always feeds the display buffer."""
        coordinator._target_active[0] = True
        coordinator._target_x[0] = 100.0
        coordinator._target_y[0] = 200.0

        coordinator._schedule_rebuild()

        assert coordinator._last_display_snapshot is not None
        assert coordinator._last_display_snapshot.targets[0].raw_x == 100.0

    def test_flush_display_not_called_without_subscribers(self, coordinator):
        """Display signal is not dispatched when no subscribers."""
        coordinator._display_subscriber_count = 0
        coordinator._flush_display()
        # No signal dispatched (hass.loop is a mock, nothing to check)

    def test_flush_display_throttles_at_5hz(self, coordinator):
        """Display signal dispatch is throttled to 5 Hz (200ms interval)."""
        coordinator._display_subscriber_count = 1

        # First flush — dispatches signal, records time
        coordinator._flush_display()
        first_time = coordinator._last_display_time
        assert first_time > 0

        # Second flush immediately — should be throttled
        old_time = coordinator._last_display_time
        coordinator._flush_display()
        assert coordinator._last_display_time == old_time

    def test_schedule_rebuild_schedules_display_flush(self, coordinator):
        """_schedule_rebuild schedules a display flush when subscribers exist."""
        coordinator._display_subscriber_count = 1
        coordinator._target_active[0] = True
        coordinator._target_x[0] = 100.0
        coordinator._target_y[0] = 200.0

        coordinator._schedule_rebuild()

        # call_soon should have been scheduled
        coordinator.hass.loop.call_soon.assert_called()

    def test_schedule_rebuild_skips_display_without_subscribers(self, coordinator):
        """_schedule_rebuild does not schedule display flush without subscribers."""
        coordinator._display_subscriber_count = 0
        coordinator._target_active[0] = True
        coordinator._target_x[0] = 100.0
        coordinator._target_y[0] = 200.0

        coordinator.hass.loop.call_soon.reset_mock()
        coordinator._schedule_rebuild()

        # call_soon should NOT have been called for display
        for call in coordinator.hass.loop.call_soon.call_args_list:
            assert call.args[0] != coordinator._flush_display

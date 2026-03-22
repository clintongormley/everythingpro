"""End-to-end tests for the Everything Presence Pro signal pipeline.

These tests exercise the full flow from simulated ESPHome state updates
through the real coordinator, zone engine, display buffer, and websocket
subscriptions:

    ESPHome state -> coordinator._on_state -> _schedule_rebuild
      -> _build_calibrated_targets -> zone_engine.feed_raw -> TumblingWindow
      -> _tick -> ProcessingResult
      -> display_buffer.feed -> DisplaySnapshot
      -> SIGNAL_DISPLAY_UPDATED -> websocket handlers
"""

from __future__ import annotations

from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from aioesphomeapi import BinarySensorState
from aioesphomeapi import SensorState
from homeassistant.core import HomeAssistant

from custom_components.everything_presence_pro.calibration import SensorTransform
from custom_components.everything_presence_pro.const import CELL_ROOM_BIT
from custom_components.everything_presence_pro.const import CELL_ZONE_SHIFT
from custom_components.everything_presence_pro.const import DOMAIN
from custom_components.everything_presence_pro.const import GRID_COLS
from custom_components.everything_presence_pro.const import GRID_ROWS
from custom_components.everything_presence_pro.zone_engine import Zone

# ---------------------------------------------------------------------------
# ESPHome entity key constants (arbitrary, consistent within tests)
# ---------------------------------------------------------------------------
KEY_T1_X, KEY_T1_Y = 1, 2
KEY_T2_X, KEY_T2_Y = 3, 4
KEY_T3_X, KEY_T3_Y = 5, 6
KEY_T1_ACTIVE = 101
KEY_T2_ACTIVE = 102
KEY_T3_ACTIVE = 103
KEY_ILLUMINANCE = 20
KEY_TEMPERATURE = 21
KEY_HUMIDITY = 22
KEY_CO2 = 23
KEY_STATIC = 110
KEY_PIR = 111

_SENSOR_KEY_MAP = {
    KEY_T1_X: "target_1_x",
    KEY_T1_Y: "target_1_y",
    KEY_T2_X: "target_2_x",
    KEY_T2_Y: "target_2_y",
    KEY_T3_X: "target_3_x",
    KEY_T3_Y: "target_3_y",
    KEY_ILLUMINANCE: "illuminance",
    KEY_TEMPERATURE: "temperature",
    KEY_HUMIDITY: "humidity",
    KEY_CO2: "co2",
}

_BINARY_SENSOR_KEY_MAP = {
    KEY_T1_ACTIVE: "target_1_active",
    KEY_T2_ACTIVE: "target_2_active",
    KEY_T3_ACTIVE: "target_3_active",
    KEY_STATIC: "static_presence",
    KEY_PIR: "pir_motion",
}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_ws_registered():
    """Reset WS registration guard between tests."""
    from custom_components.everything_presence_pro import websocket_api

    websocket_api._REGISTERED.discard(DOMAIN)
    yield
    websocket_api._REGISTERED.discard(DOMAIN)


def _build_zone_grid() -> list[int]:
    """Build a 20x20 grid with two zones.

    Zone 1: rows 0-9, cols 0-9   (room coords x 0-3000, y 0-3000)
    Zone 2: rows 0-9, cols 10-19  (room coords x 3000-6000, y 0-3000)
    Zone 0: rows 10-19            (rest of room, y 3000-6000)
           — implicit: no zone bits set, cell_zone() returns 0
    All cells marked as room.
    """
    half_row = GRID_ROWS // 2
    half_col = GRID_COLS // 2
    grid_bytes: list[int] = []
    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            byte = CELL_ROOM_BIT
            if row < half_row and col < half_col:
                byte |= 1 << CELL_ZONE_SHIFT  # Zone 1
            elif row < half_row and col >= half_col:
                byte |= 2 << CELL_ZONE_SHIFT  # Zone 2
            grid_bytes.append(byte)
    return grid_bytes


async def _setup_base(hass, mock_config_entry, mock_esphome_client):
    """Common integration setup shared by E2E fixtures."""
    mock_http = MagicMock()
    mock_http.async_register_static_paths = AsyncMock()
    hass.http = mock_http

    with patch(
        "custom_components.everything_presence_pro.panel_custom.async_register_panel",
        new_callable=AsyncMock,
    ):
        await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()

    return mock_config_entry


@pytest.fixture
async def setup_e2e(hass: HomeAssistant, mock_config_entry, mock_esphome_client):
    """Set up integration with identity calibration, zone grid, and key maps.

    Room: 6000x6000 mm, identity perspective (raw == room coords).
    Grid: 20x20, 300 mm cells, origin (0,0).
    Zone 1 "Desk" (entrance): upper-left quadrant.
    Zone 2 "Bed"  (entrance): upper-right quadrant.
    Zone 0 (rest of room): lower half.
    """
    entry = await _setup_base(hass, mock_config_entry, mock_esphome_client)
    coordinator = entry.runtime_data

    # Identity perspective: raw coords = room coords
    coordinator.set_sensor_transform(
        SensorTransform(
            perspective=[1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
            room_width=6000.0,
            room_depth=6000.0,
        )
    )

    # Room layout with zones
    coordinator.set_room_layout({"grid_bytes": _build_zone_grid()})

    # Both zones are entrance type (no gating) with trigger=3
    coordinator.set_zones(
        [
            Zone(id=1, name="Desk", type="entrance", trigger=3, renew=2, timeout=5.0, handoff_timeout=2.0),
            Zone(id=2, name="Bed", type="entrance", trigger=3, renew=2, timeout=5.0, handoff_timeout=2.0),
        ]
    )

    # Populate ESPHome key maps so _on_state routes updates
    coordinator._sensor_key_map = dict(_SENSOR_KEY_MAP)
    coordinator._binary_sensor_key_map = dict(_BINARY_SENSOR_KEY_MAP)

    return entry


@pytest.fixture
async def setup_e2e_no_calibration(hass: HomeAssistant, mock_config_entry, mock_esphome_client):
    """Set up integration WITHOUT calibration — no perspective, no grid.

    subscribe_raw_targets should still show targets.
    subscribe_grid_targets should show positions but status=inactive.
    """
    entry = await _setup_base(hass, mock_config_entry, mock_esphome_client)
    coordinator = entry.runtime_data

    # No calibration — default SensorTransform with perspective=None
    coordinator._sensor_key_map = {
        KEY_T1_X: "target_1_x",
        KEY_T1_Y: "target_1_y",
    }
    coordinator._binary_sensor_key_map = {
        KEY_T1_ACTIVE: "target_1_active",
    }

    return entry


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_X_KEYS = {0: KEY_T1_X, 1: KEY_T2_X, 2: KEY_T3_X}
_Y_KEYS = {0: KEY_T1_Y, 1: KEY_T2_Y, 2: KEY_T3_Y}
_ACTIVE_KEYS = {0: KEY_T1_ACTIVE, 1: KEY_T2_ACTIVE, 2: KEY_T3_ACTIVE}


def _feed_target(coordinator, index: int, x: float, y: float, *, active: bool = True) -> None:
    """Set position and active state for a target via simulated ESPHome updates.

    Each call triggers _on_state -> _schedule_rebuild for each field change.
    When activating: set x/y before active so the first active frame has
    the correct position.
    When deactivating: set active=False FIRST to avoid stale active frames
    at the new position (each x/y update triggers a rebuild while the target
    is still flagged active from the previous state).
    """
    if active:
        coordinator._on_state(SensorState(key=_X_KEYS[index], state=float(x)))
        coordinator._on_state(SensorState(key=_Y_KEYS[index], state=float(y)))
        coordinator._on_state(BinarySensorState(key=_ACTIVE_KEYS[index], state=True))
    else:
        coordinator._on_state(BinarySensorState(key=_ACTIVE_KEYS[index], state=False))
        coordinator._on_state(SensorState(key=_X_KEYS[index], state=float(x)))
        coordinator._on_state(SensorState(key=_Y_KEYS[index], state=float(y)))


def _pulse_target(coordinator, index: int, n: int = 1) -> None:
    """Send n redundant x-updates to accumulate frames without changing position."""
    current_x = coordinator._target_x[index]
    for _ in range(n):
        coordinator._on_state(SensorState(key=_X_KEYS[index], state=current_x))


async def _subscribe_raw(ws_client, entry_id: str, msg_id: int = 1):
    """Subscribe to raw targets and consume the result + initial event."""
    await ws_client.send_json(
        {
            "id": msg_id,
            "type": "everything_presence_pro/subscribe_raw_targets",
            "entry_id": entry_id,
        }
    )
    result = await ws_client.receive_json()
    assert result["success"] is True
    initial = await ws_client.receive_json()
    assert initial["type"] == "event"
    return initial["event"]


async def _subscribe_grid(ws_client, entry_id: str, msg_id: int = 1):
    """Subscribe to grid targets and consume the result + initial event."""
    await ws_client.send_json(
        {
            "id": msg_id,
            "type": "everything_presence_pro/subscribe_grid_targets",
            "entry_id": entry_id,
        }
    )
    result = await ws_client.receive_json()
    assert result["success"] is True
    initial = await ws_client.receive_json()
    assert initial["type"] == "event"
    return initial["event"]


# ---------------------------------------------------------------------------
# Tests: target appears in subscriptions
# ---------------------------------------------------------------------------


async def test_raw_subscription_shows_target(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Target appears -> subscribe_raw_targets delivers smoothed raw positions."""
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    # Subscribe (increments display_subscriber_count)
    initial = await _subscribe_raw(ws_client, entry.entry_id)
    assert initial["target_count"] == 0

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 100.0

        # Activate target 1 at (1500, 2000)
        _feed_target(coordinator, 0, 1500, 2000)
        _pulse_target(coordinator, 0, n=3)

        await hass.async_block_till_done()

    msg = await ws_client.receive_json()
    event = msg["event"]

    assert event["target_count"] == 1
    assert event["targets"][0]["raw_x"] == pytest.approx(1500.0, abs=1)
    assert event["targets"][0]["raw_y"] == pytest.approx(2000.0, abs=1)
    # Other targets are null (inactive)
    assert event["targets"][1]["raw_x"] is None
    assert event["targets"][2]["raw_x"] is None


async def test_grid_subscription_shows_target_after_tick(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Target in zone 1 -> window ticks -> grid subscription shows active status."""
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    await _subscribe_grid(ws_client, entry.entry_id)

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 100.0

        # Feed target 1 at (1500, 1500) — inside zone 1
        _feed_target(coordinator, 0, 1500, 1500)
        _pulse_target(coordinator, 0, n=5)  # accumulate frames

        # Tick the window (>1s later)
        mock_time.monotonic.return_value = 101.5

        _pulse_target(coordinator, 0, n=1)

        await hass.async_block_till_done()

    # Consume the display update(s) — we want the one after the tick
    msg = await ws_client.receive_json()
    event = msg["event"]

    # Position should be at (1500, 1500) (identity perspective)
    assert event["targets"][0]["x"] == pytest.approx(1500.0, abs=50)
    assert event["targets"][0]["y"] == pytest.approx(1500.0, abs=50)
    assert event["targets"][0]["status"] == "active"
    assert event["targets"][0]["signal"] > 0

    # Zone 1 should be occupied
    assert event["zones"]["occupancy"].get(1) is True or event["zones"]["occupancy"].get("1") is True


# ---------------------------------------------------------------------------
# Tests: no calibration
# ---------------------------------------------------------------------------


async def test_no_calibration_raw_still_visible(hass: HomeAssistant, hass_ws_client, setup_e2e_no_calibration):
    """Without calibration, raw targets are still visible via subscribe_raw_targets."""
    entry = setup_e2e_no_calibration
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    await _subscribe_raw(ws_client, entry.entry_id)

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 100.0

        _feed_target(coordinator, 0, 2000, 3000)
        _pulse_target(coordinator, 0, n=3)

        await hass.async_block_till_done()

    msg = await ws_client.receive_json()
    event = msg["event"]

    # Raw positions visible even without calibration
    assert event["target_count"] == 1
    assert event["targets"][0]["raw_x"] == pytest.approx(2000.0, abs=1)
    assert event["targets"][0]["raw_y"] == pytest.approx(3000.0, abs=1)


async def test_no_calibration_grid_shows_inactive(hass: HomeAssistant, hass_ws_client, setup_e2e_no_calibration):
    """Without calibration, grid subscription shows positions but status=inactive."""
    entry = setup_e2e_no_calibration
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    await _subscribe_grid(ws_client, entry.entry_id)

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 100.0

        _feed_target(coordinator, 0, 2000, 3000)
        _pulse_target(coordinator, 0, n=5)

        # Tick the window
        mock_time.monotonic.return_value = 101.5

        _pulse_target(coordinator, 0, n=1)

        await hass.async_block_till_done()

    msg = await ws_client.receive_json()
    event = msg["event"]

    # Positions populated (from display buffer) but status inactive (no room grid)
    assert event["targets"][0]["x"] == pytest.approx(2000.0, abs=50)
    assert event["targets"][0]["y"] == pytest.approx(3000.0, abs=50)
    assert event["targets"][0]["status"] == "inactive"


# ---------------------------------------------------------------------------
# Tests: room gating
# ---------------------------------------------------------------------------


async def test_room_gating_inside_vs_outside(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Target inside room -> active; target outside room -> inactive."""
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    await _subscribe_grid(ws_client, entry.entry_id)

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 100.0

        # Target 1 inside zone 1 at (1500, 1500)
        _feed_target(coordinator, 0, 1500, 1500)
        _pulse_target(coordinator, 0, n=5)

        # Target 2 outside room at (-500, 1500)
        _feed_target(coordinator, 1, -500, 1500)
        _pulse_target(coordinator, 1, n=5)

        # Tick the window
        mock_time.monotonic.return_value = 101.5

        _pulse_target(coordinator, 0, n=1)

        await hass.async_block_till_done()

    msg = await ws_client.receive_json()
    event = msg["event"]

    # Target 1: inside room, should be active
    assert event["targets"][0]["status"] == "active"
    assert event["targets"][0]["x"] == pytest.approx(1500.0, abs=50)

    # Target 2: outside room, should be inactive (but position still populated)
    assert event["targets"][1]["status"] == "inactive"
    assert event["targets"][1]["x"] == pytest.approx(-500.0, abs=50)


# ---------------------------------------------------------------------------
# Tests: zone occupancy
# ---------------------------------------------------------------------------


async def test_zone_becomes_occupied(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Target enters zone 1 for >1 window -> zone 1 is occupied."""
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    await _subscribe_grid(ws_client, entry.entry_id)

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 100.0

        # Target 1 at (1500, 1500) — zone 1
        _feed_target(coordinator, 0, 1500, 1500)
        _pulse_target(coordinator, 0, n=8)  # 9 total frames with target

        # Tick window
        mock_time.monotonic.return_value = 101.5

        _pulse_target(coordinator, 0, n=1)

        await hass.async_block_till_done()

    msg = await ws_client.receive_json()
    event = msg["event"]

    # Zone 1 should be occupied, zone 2 should not
    zones = event["zones"]
    occ = zones["occupancy"]
    assert occ["1"] is True
    assert occ.get("2") is not True


async def test_zone_target_count_reflects_signal(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Zone target_counts reflects the best signal strength in each zone."""
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    await _subscribe_grid(ws_client, entry.entry_id)

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 100.0

        # Target 1 in zone 1 with many frames (high signal)
        _feed_target(coordinator, 0, 1500, 1500)
        _pulse_target(coordinator, 0, n=7)  # ~8 frames

        # Target 2 in zone 2 with fewer frames (lower signal)
        _feed_target(coordinator, 1, 4500, 1500)
        _pulse_target(coordinator, 1, n=2)  # ~3 frames

        # Tick
        mock_time.monotonic.return_value = 101.5

        _pulse_target(coordinator, 0, n=1)

        await hass.async_block_till_done()

    msg = await ws_client.receive_json()
    event = msg["event"]

    counts = event["zones"]["target_counts"]
    zone1_count = counts.get("1", 0)
    zone2_count = counts.get("2", 0)

    assert zone1_count > 0
    assert zone2_count > 0
    # Zone 1 should have higher signal (more frames)
    assert zone1_count >= zone2_count


# ---------------------------------------------------------------------------
# Tests: zone handoff
# ---------------------------------------------------------------------------


async def test_zone_handoff(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Target moves from zone 1 to zone 2 -> zone 1 transitions to pending."""
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    await _subscribe_grid(ws_client, entry.entry_id)

    t = [100.0]

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.side_effect = lambda: t[0]

        # --- Window 1: target in zone 1 ---
        _feed_target(coordinator, 0, 1500, 1500)  # zone 1
        _pulse_target(coordinator, 0, n=8)

        t[0] = 101.5

        _pulse_target(coordinator, 0, n=1)
        await hass.async_block_till_done()

        msg1 = await ws_client.receive_json()
        occ1 = msg1["event"]["zones"]["occupancy"]
        assert occ1["1"] is True

        # --- Window 2: target moves to zone 2 ---
        t[0] = 102.0
        _feed_target(coordinator, 0, 4500, 1500)  # zone 2
        _pulse_target(coordinator, 0, n=8)

        t[0] = 103.5

        _pulse_target(coordinator, 0, n=1)
        await hass.async_block_till_done()

        msg2 = await ws_client.receive_json()
        occ2 = msg2["event"]["zones"]["occupancy"]

        # Zone 2 should now be occupied
        assert occ2["2"] is True

        # Zone 1 should still show as occupied (PENDING state counts as occupied
        # in zone_occupancy — state != CLEAR). It will clear after timeout.
        assert occ2["1"] is True


# ---------------------------------------------------------------------------
# Tests: target disappears
# ---------------------------------------------------------------------------


async def test_target_disappears(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Active target goes inactive -> zone enters PENDING, eventually CLEAR."""
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    await _subscribe_grid(ws_client, entry.entry_id)

    t = [100.0]

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.side_effect = lambda: t[0]

        # --- Window 1: target present in zone 1 ---
        _feed_target(coordinator, 0, 1500, 1500)
        _pulse_target(coordinator, 0, n=8)

        t[0] = 101.5

        _pulse_target(coordinator, 0, n=1)
        await hass.async_block_till_done()

        msg1 = await ws_client.receive_json()
        occ1 = msg1["event"]["zones"]["occupancy"]
        assert occ1["1"] is True

        # --- Window 2: target goes inactive ---
        t[0] = 102.0
        _feed_target(coordinator, 0, 0, 0, active=False)
        _pulse_target(coordinator, 0, n=5)

        t[0] = 103.5

        _pulse_target(coordinator, 0, n=1)
        await hass.async_block_till_done()

        msg2 = await ws_client.receive_json()
        occ2 = msg2["event"]["zones"]["occupancy"]

        # Zone 1 enters PENDING (still counts as occupied in the occupancy dict)
        assert occ2["1"] is True

        # --- Window 3: after timeout (5s), zone should clear ---
        t[0] = 109.0

        _pulse_target(coordinator, 0, n=5)

        t[0] = 110.5

        _pulse_target(coordinator, 0, n=1)
        await hass.async_block_till_done()

        msg3 = await ws_client.receive_json()
        occ3 = msg3["event"]["zones"]["occupancy"]

        # Zone 1 should now be clear
        assert occ3["1"] is not True


# ---------------------------------------------------------------------------
# Tests: sensor updates
# ---------------------------------------------------------------------------


async def test_sensor_updates_in_grid_subscription(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Environmental sensor changes are reflected in grid subscription sensors."""
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    initial = await _subscribe_grid(ws_client, entry.entry_id)

    # Initial sensors should have null values
    assert initial["sensors"]["illuminance"] is None
    assert initial["sensors"]["temperature"] is None

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 100.0

        # Feed environment sensor values
        coordinator._on_state(SensorState(key=KEY_ILLUMINANCE, state=350.0))
        coordinator._on_state(SensorState(key=KEY_TEMPERATURE, state=22.5))
        coordinator._on_state(SensorState(key=KEY_HUMIDITY, state=45.0))
        coordinator._on_state(SensorState(key=KEY_CO2, state=800.0))

        # Feed a target to trigger a display update (sensors alone
        # only dispatch SIGNAL_SENSORS_UPDATED, not SIGNAL_DISPLAY_UPDATED)
        _feed_target(coordinator, 0, 1500, 1500)

        await hass.async_block_till_done()

    msg = await ws_client.receive_json()
    sensors = msg["event"]["sensors"]

    assert sensors["illuminance"] == pytest.approx(350.0, abs=1)
    assert sensors["temperature"] == pytest.approx(22.5, abs=0.1)
    assert sensors["humidity"] == pytest.approx(45.0, abs=1)
    assert sensors["co2"] == pytest.approx(800.0, abs=1)


async def test_binary_sensor_updates_in_grid_subscription(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Binary sensor changes (PIR, static) are reflected in grid subscription."""
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    initial = await _subscribe_grid(ws_client, entry.entry_id)
    assert initial["sensors"]["static_presence"] is False
    assert initial["sensors"]["motion_presence"] is False

    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 100.0

        coordinator._on_state(BinarySensorState(key=KEY_STATIC, state=True))
        coordinator._on_state(BinarySensorState(key=KEY_PIR, state=True))

        # Need a target update to trigger display signal
        _feed_target(coordinator, 0, 1500, 1500)

        await hass.async_block_till_done()

    msg = await ws_client.receive_json()
    sensors = msg["event"]["sensors"]

    assert sensors["static_presence"] is True
    assert sensors["motion_presence"] is True
    assert sensors["occupancy"] is True  # PIR OR static OR tracking


# ---------------------------------------------------------------------------
# Tests: full pipeline integration
# ---------------------------------------------------------------------------


async def test_full_pipeline_target_lifecycle(hass: HomeAssistant, hass_ws_client, setup_e2e):
    """Target appears and triggers a zone; raw and grid subscriptions receive updates.

    Tests subscribe_raw_targets and subscribe_grid_targets in parallel
    for the initial activation phase.
    """
    entry = setup_e2e
    coordinator = entry.runtime_data
    ws_client = await hass_ws_client(hass)

    # Subscribe to both raw and grid
    await _subscribe_raw(ws_client, entry.entry_id, msg_id=1)
    await _subscribe_grid(ws_client, entry.entry_id, msg_id=2)

    # --- Phase 1: target appears in zone 1 ---
    with patch("custom_components.everything_presence_pro.coordinator.time") as mock_time:
        mock_time.monotonic.return_value = 200.0
        _feed_target(coordinator, 0, 1500, 1500)
        _pulse_target(coordinator, 0, n=8)

        mock_time.monotonic.return_value = 201.5

        _pulse_target(coordinator, 0, n=1)
        await hass.async_block_till_done()

    # Both subscriptions should receive events
    raw_msg = await ws_client.receive_json()
    grid_msg = await ws_client.receive_json()

    # Identify which is raw vs grid by checking event structure
    if "target_count" in raw_msg["event"]:
        raw_event = raw_msg["event"]
        grid_event = grid_msg["event"]
    else:
        raw_event = grid_msg["event"]
        grid_event = raw_msg["event"]

    # Raw subscription: target visible with raw coords
    assert raw_event["target_count"] == 1
    assert raw_event["targets"][0]["raw_x"] == pytest.approx(1500.0, abs=50)

    # Grid subscription: target active in zone 1
    assert grid_event["targets"][0]["status"] == "active"
    assert grid_event["targets"][0]["signal"] > 0
    occ = grid_event["zones"]["occupancy"]
    assert occ["1"] is True

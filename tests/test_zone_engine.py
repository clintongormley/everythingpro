"""Tests for the zone engine."""

import time
from unittest.mock import patch

from custom_components.everything_presence_pro.const import (
    CELL_ROOM_BIT,
    CELL_ZONE_SHIFT,
    RAW_FPS,
    ZONE_TYPE_DEFAULTS,
    ZONE_TYPE_ENTRANCE,
    ZONE_TYPE_NORMAL,
    ZONE_TYPE_REST,
    threshold_to_frame_count,
)
from custom_components.everything_presence_pro.zone_engine import (
    Grid,
    TumblingWindow,
    WindowOutput,
    Zone,
    ZoneEngine,
    ZoneState,
)


# --- Grid tests (new bit encoding) ---


def _make_grid(cols: int = 20, rows: int = 20) -> Grid:
    """Create a grid with all cells marked as inside room."""
    grid = Grid(origin_x=0.0, origin_y=0.0, cols=cols, rows=rows)
    for i in range(grid.cell_count):
        grid.cells[i] = CELL_ROOM_BIT
    return grid


def test_grid_cell_is_room_new_encoding():
    """Test bit 0 = room flag."""
    grid = Grid(cols=4, rows=4)
    grid.cells[0] = 0x00  # outside
    assert grid.cell_is_room(0) is False

    grid.cells[0] = CELL_ROOM_BIT  # inside
    assert grid.cell_is_room(0) is True

    grid.cells[0] = CELL_ROOM_BIT | (3 << CELL_ZONE_SHIFT)  # inside + zone 3
    assert grid.cell_is_room(0) is True


def test_grid_cell_zone_new_encoding():
    """Test bits 1-3 = zone field."""
    grid = Grid(cols=4, rows=4)
    grid.cells[0] = CELL_ROOM_BIT | (5 << CELL_ZONE_SHIFT)
    assert grid.cell_zone(0) == 5
    assert grid.cell_is_room(0) is True


def test_grid_base64_roundtrip():
    """Test grid serialization preserves new encoding."""
    grid = _make_grid(cols=4, rows=4)
    grid.cells[0] = CELL_ROOM_BIT | (2 << CELL_ZONE_SHIFT)
    b64 = grid.to_base64()

    grid2 = Grid.from_base64(b64, cols=4, rows=4, origin_x=0.0, origin_y=0.0)
    assert grid2.cell_zone(0) == 2
    assert grid2.cell_is_room(0) is True
    assert list(grid2.cells) == list(grid.cells)


# --- Sensitivity conversion ---


def test_threshold_to_frame_count():
    """Test threshold maps to frame count needed."""
    assert threshold_to_frame_count(1) == 1
    assert threshold_to_frame_count(5) == 5
    assert threshold_to_frame_count(9) == 9
    assert threshold_to_frame_count(0) == 1  # floor to 1


# --- Tumbling window ---


def test_tumbling_window_emits_after_interval():
    """Test window collects frames and emits per-target results after 1 second."""
    grid = _make_grid(cols=4, rows=4)
    grid.cells[0] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
    window = TumblingWindow(grid=grid, interval_s=1.0)

    t = 100.0
    # Feed 33 frames over 0.99 seconds — no output yet
    for i in range(32):
        result = window.feed([(150, 150, True)], t + i * 0.03)
        assert result is None

    # 33rd frame at t+0.99 still in window
    result = window.feed([(150, 150, True)], t + 0.99)
    assert result is None

    # First frame of next window triggers output of previous
    result = window.feed([(150, 150, True)], t + 1.01)
    assert result is not None
    assert result.total_frames == 33
    assert result.targets[0].active is True
    assert result.targets[0].frame_count == 33
    assert result.targets[0].median_x == 150
    assert result.targets[0].median_y == 150


def test_tumbling_window_inactive_target():
    """Test inactive targets produce empty TargetWindow."""
    grid = _make_grid(cols=4, rows=4)
    window = TumblingWindow(grid=grid, interval_s=1.0)

    t = 100.0
    for i in range(10):
        window.feed([(0, 0, False)], t + i * 0.03)

    result = window.feed([(0, 0, False)], t + 1.01)
    assert result is not None
    assert result.targets[0].active is False
    assert result.targets[0].frame_count == 0


# --- State machine ---


def _make_engine_with_zone(
    zone_type: str = ZONE_TYPE_NORMAL,
    trigger: int | None = None,
    sustain: int | None = None,
    timeout: float | None = None,
) -> tuple[ZoneEngine, Grid]:
    """Create a zone engine with one zone on cell (150,150)."""
    grid = _make_grid(cols=4, rows=4)
    cell_idx = grid.xy_to_cell(150, 150)
    grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

    defaults = ZONE_TYPE_DEFAULTS[zone_type]
    zone = Zone(
        id=1,
        name="Test",
        type=zone_type,
        color="",
        trigger=trigger if trigger is not None else defaults["trigger"],
        sustain=sustain if sustain is not None else defaults["sustain"],
        timeout=timeout if timeout is not None else defaults["timeout"],
    )
    engine = ZoneEngine(grid=grid, zones=[zone])
    return engine, grid


def test_state_machine_clear_to_occupied():
    """Test CLEAR -> OCCUPIED when target frame count meets trigger threshold."""
    engine, _ = _make_engine_with_zone(trigger=5, sustain=3, timeout=5.0)
    # trigger=5 => need 5 frames

    t = 100.0
    # 10 frames with target active — 10 >= 5 threshold
    for i in range(10):
        engine.feed_raw([(150, 150, True)], t + i * 0.03)

    # Tick the window
    result = engine.feed_raw([(150, 150, True)], t + 1.01)
    assert result is not None
    assert result.zone_occupancy[1] is True


def test_state_machine_clear_stays_clear_below_threshold():
    """Test CLEAR stays CLEAR when target frame count below trigger threshold."""
    engine, _ = _make_engine_with_zone(trigger=5, sustain=1, timeout=5.0)
    # trigger=5 => need 5 frames

    t = 100.0
    # Target only active for 3 frames out of 10
    for i in range(3):
        engine.feed_raw([(150, 150, True)], t + i * 0.03)
    for i in range(7):
        engine.feed_raw([(0, 0, False)], t + 0.09 + i * 0.03)

    result = engine.feed_raw([(0, 0, False)], t + 1.01)
    assert result is not None
    assert result.zone_occupancy[1] is False


def test_state_machine_occupied_to_pending():
    """Test OCCUPIED -> PENDING when no target confirmed in zone."""
    engine, _ = _make_engine_with_zone(trigger=3, sustain=3, timeout=5.0)

    t = 100.0
    # Window 1: 10 frames with target -> triggers OCCUPIED
    for i in range(10):
        engine.feed_raw([(150, 150, True)], t + i * 0.03)
    result = engine.feed_raw([(0, 0, False)], t + 1.01)
    assert result is not None
    assert result.zone_occupancy[1] is True

    # Window 2: no target -> PENDING (still reports occupied, timeout hasn't expired)
    for i in range(10):
        engine.feed_raw([(0, 0, False)], t + 1.01 + i * 0.03)
    result = engine.feed_raw([(0, 0, False)], t + 2.02)
    assert result is not None
    assert result.zone_occupancy[1] is True


def test_state_machine_pending_to_clear():
    """Test PENDING -> CLEAR when timeout expires."""
    engine, _ = _make_engine_with_zone(trigger=3, sustain=3, timeout=2.0)

    t = 100.0
    # Window 1: trigger
    for i in range(10):
        engine.feed_raw([(150, 150, True)], t + i * 0.1)
    engine.feed_raw([(0, 0, False)], t + 1.01)

    # Windows 2-4: empty (3 seconds, exceeds 2s timeout)
    for w in range(3):
        wt = t + 1.01 + w * 1.0
        for i in range(10):
            engine.feed_raw([(0, 0, False)], wt + i * 0.1)
        result = engine.feed_raw([(0, 0, False)], wt + 1.01)

    assert result is not None
    assert result.zone_occupancy[1] is False


def test_state_machine_pending_to_occupied():
    """Test PENDING -> OCCUPIED when sustain threshold met during timeout."""
    engine, _ = _make_engine_with_zone(trigger=3, sustain=3, timeout=10.0)

    t = 100.0
    # Window 1: trigger
    for i in range(10):
        engine.feed_raw([(150, 150, True)], t + i * 0.1)
    engine.feed_raw([(0, 0, False)], t + 1.01)

    # Window 2: empty -> PENDING
    for i in range(10):
        engine.feed_raw([(0, 0, False)], t + 1.01 + i * 0.1)
    engine.feed_raw([(0, 0, False)], t + 2.02)

    # Window 3: target back -> sustain met -> OCCUPIED
    for i in range(10):
        engine.feed_raw([(150, 150, True)], t + 2.02 + i * 0.1)
    result = engine.feed_raw([(150, 150, True)], t + 3.03)
    assert result is not None
    assert result.zone_occupancy[1] is True


def test_state_machine_sparse_zone_ids():
    """Test engine works with non-contiguous zone IDs (1 and 3, skip 2)."""
    grid = _make_grid(cols=4, rows=4)
    cell1 = grid.xy_to_cell(150, 150)
    grid.cells[cell1] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
    cell3 = grid.xy_to_cell(450, 450)
    grid.cells[cell3] = CELL_ROOM_BIT | (3 << CELL_ZONE_SHIFT)

    zone1 = Zone(id=1, name="Desk", type=ZONE_TYPE_NORMAL, color="", trigger=3, sustain=3, timeout=10.0)
    zone3 = Zone(id=3, name="Bed", type=ZONE_TYPE_NORMAL, color="", trigger=3, sustain=3, timeout=10.0)
    engine = ZoneEngine(grid=grid, zones=[zone1, zone3])

    t = 100.0
    for i in range(10):
        engine.feed_raw([(150, 150, True)], t + i * 0.1)
    result = engine.feed_raw([(150, 150, True)], t + 1.01)

    assert result is not None
    assert result.zone_occupancy[1] is True
    assert result.zone_occupancy[3] is False


def test_device_tracking_present():
    """Test device_tracking_present when target is in room but not in named zone."""
    grid = _make_grid(cols=4, rows=4)
    zone = Zone(id=1, name="Z", type=ZONE_TYPE_NORMAL, color="", trigger=3, sustain=3, timeout=10.0)
    grid.cells[0] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
    engine = ZoneEngine(grid=grid, zones=[zone])

    t = 100.0
    # Target in room cell (zone 0), not in zone 1
    for i in range(10):
        engine.feed_raw([(450, 150, True)], t + i * 0.1)
    result = engine.feed_raw([(450, 150, True)], t + 1.01)

    assert result is not None
    assert result.device_tracking_present is True
    assert result.zone_occupancy[1] is False

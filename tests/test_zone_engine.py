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
    sensitivity_to_threshold,
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


def test_sensitivity_to_threshold():
    """Test 0-9 sensitivity maps to correct hit-count thresholds."""
    assert sensitivity_to_threshold(0) == 33  # (33*10 + 5) // 10 = 33
    assert sensitivity_to_threshold(5) == 17  # (33*5 + 5) // 10 = 17
    assert sensitivity_to_threshold(9) == 3   # (33*1 + 5) // 10 = 3


# --- Tumbling window ---


def test_tumbling_window_emits_after_interval():
    """Test window collects frames and emits after 1 second."""
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
    assert result.zone_hit_counts[1] == 33  # all 33 frames hit zone 1


def test_tumbling_window_multiple_targets_in_zone():
    """Test that hit counts from multiple targets sum."""
    grid = _make_grid(cols=4, rows=4)
    # Zone 1 covers cell at (150,150)
    cell_idx = grid.xy_to_cell(150, 150)
    grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
    window = TumblingWindow(grid=grid, interval_s=1.0)

    t = 100.0
    # Feed 10 frames with 2 targets both in zone 1
    for i in range(10):
        window.feed([(150, 150, True), (150, 150, True)], t + i * 0.03)

    # Trigger window emit
    result = window.feed([(150, 150, True)], t + 1.01)
    assert result is not None
    # Each frame contributes 2 hits, so 10 frames * 2 = 20
    assert result.zone_hit_counts[1] == 20


def test_tumbling_window_outside_cells_ignored():
    """Test targets in outside cells are not counted."""
    grid = Grid(cols=4, rows=4)  # all outside by default
    grid.cells[0] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
    window = TumblingWindow(grid=grid, interval_s=1.0)

    t = 100.0
    # Target at (450, 450) — outside cell
    for i in range(33):
        window.feed([(450, 450, True)], t + i * 0.03)

    result = window.feed([(450, 450, True)], t + 1.01)
    assert result is not None
    assert result.zone_hit_counts.get(1, 0) == 0


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
    """Test CLEAR -> OCCUPIED when hit count meets trigger threshold."""
    engine, _ = _make_engine_with_zone(trigger=9, sustain=9, timeout=5.0)
    # trigger=9 => threshold = 3

    t = 100.0
    # Window with all 33 frames hitting zone 1 — well above threshold of 3
    for i in range(33):
        engine.feed_raw([(150, 150, True)], t + i * 0.03)

    # Tick the window
    result = engine.feed_raw([(150, 150, True)], t + 1.01)
    assert result is not None
    assert result.zone_occupancy[1] is True


def test_state_machine_clear_stays_clear_below_threshold():
    """Test CLEAR stays CLEAR when hit count below trigger threshold."""
    engine, _ = _make_engine_with_zone(trigger=0, sustain=9, timeout=5.0)
    # trigger=0 => threshold = 33, need every frame

    t = 100.0
    # Only 10 of 33 frames have target in zone
    for i in range(10):
        engine.feed_raw([(150, 150, True)], t + i * 0.03)
    for i in range(23):
        engine.feed_raw([(0, 0, False)], t + 0.3 + i * 0.03)

    result = engine.feed_raw([(0, 0, False)], t + 1.01)
    assert result is not None
    assert result.zone_occupancy[1] is False


def test_state_machine_occupied_to_pending():
    """Test OCCUPIED -> PENDING when zone misses sustain threshold."""
    engine, _ = _make_engine_with_zone(trigger=9, sustain=9, timeout=5.0)
    # trigger=9 -> thresh=3, sustain=9 -> thresh=3

    t = 100.0
    # Window 1: 33 hits -> triggers OCCUPIED
    for i in range(33):
        engine.feed_raw([(150, 150, True)], t + i * 0.03)
    result = engine.feed_raw([(0, 0, False)], t + 1.01)
    assert result is not None
    assert result.zone_occupancy[1] is True

    # Window 2: 0 hits -> PENDING (but still reports occupied because timeout hasn't expired)
    for i in range(33):
        engine.feed_raw([(0, 0, False)], t + 1.01 + i * 0.03)
    result = engine.feed_raw([(0, 0, False)], t + 2.02)
    assert result is not None
    # Zone is PENDING but timeout hasn't expired (5s), so still occupied
    assert result.zone_occupancy[1] is True


def test_state_machine_pending_to_clear():
    """Test PENDING -> CLEAR when timeout expires."""
    engine, _ = _make_engine_with_zone(trigger=9, sustain=9, timeout=2.0)

    t = 100.0
    # Window 1: trigger
    for i in range(33):
        engine.feed_raw([(150, 150, True)], t + i * 0.03)
    engine.feed_raw([(0, 0, False)], t + 1.01)

    # Windows 2-4: empty (3 seconds, exceeds 2s timeout)
    for w in range(3):
        wt = t + 1.01 + w * 1.0
        for i in range(33):
            engine.feed_raw([(0, 0, False)], wt + i * 0.03)
        result = engine.feed_raw([(0, 0, False)], wt + 1.01)

    assert result is not None
    assert result.zone_occupancy[1] is False


def test_state_machine_pending_to_occupied():
    """Test PENDING -> OCCUPIED when sustain threshold met during timeout."""
    engine, _ = _make_engine_with_zone(trigger=9, sustain=9, timeout=10.0)
    # sustain=9 -> thresh=3

    t = 100.0
    # Window 1: trigger
    for i in range(33):
        engine.feed_raw([(150, 150, True)], t + i * 0.03)
    engine.feed_raw([(0, 0, False)], t + 1.01)

    # Window 2: empty -> PENDING
    for i in range(33):
        engine.feed_raw([(0, 0, False)], t + 1.01 + i * 0.03)
    engine.feed_raw([(0, 0, False)], t + 2.02)

    # Window 3: target back -> sustain met -> OCCUPIED
    for i in range(33):
        engine.feed_raw([(150, 150, True)], t + 2.02 + i * 0.03)
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

    zone1 = Zone(id=1, name="Desk", type=ZONE_TYPE_NORMAL, color="", trigger=9, sustain=9, timeout=10.0)
    zone3 = Zone(id=3, name="Bed", type=ZONE_TYPE_NORMAL, color="", trigger=9, sustain=9, timeout=10.0)
    engine = ZoneEngine(grid=grid, zones=[zone1, zone3])

    t = 100.0
    for i in range(33):
        engine.feed_raw([(150, 150, True)], t + i * 0.03)
    result = engine.feed_raw([(150, 150, True)], t + 1.01)

    assert result is not None
    assert result.zone_occupancy[1] is True
    assert result.zone_occupancy[3] is False


def test_device_tracking_present():
    """Test device_tracking_present is set when any target is in any room cell."""
    grid = _make_grid(cols=4, rows=4)
    zone = Zone(id=1, name="Z", type=ZONE_TYPE_NORMAL, color="", trigger=9, sustain=9, timeout=10.0)
    # Zone only on cell 0 but target in cell 5 (still room)
    grid.cells[0] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
    engine = ZoneEngine(grid=grid, zones=[zone])

    t = 100.0
    for i in range(33):
        engine.feed_raw([(450, 150, True)], t + i * 0.03)  # in room, not in zone 1
    result = engine.feed_raw([(450, 150, True)], t + 1.01)

    assert result is not None
    assert result.device_tracking_present is True
    assert result.zone_occupancy[1] is False

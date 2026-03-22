"""Tests for the zone engine."""

from __future__ import annotations

import pytest

from custom_components.everything_presence_pro.const import CELL_ROOM_BIT
from custom_components.everything_presence_pro.const import CELL_ZONE_SHIFT
from custom_components.everything_presence_pro.const import RAW_FPS
from custom_components.everything_presence_pro.const import ZONE_TYPE_DEFAULTS
from custom_components.everything_presence_pro.const import ZONE_TYPE_ENTRANCE
from custom_components.everything_presence_pro.const import ZONE_TYPE_NORMAL
from custom_components.everything_presence_pro.const import threshold_to_frame_count
from custom_components.everything_presence_pro.zone_engine import DisplayBuffer
from custom_components.everything_presence_pro.zone_engine import DisplaySnapshot
from custom_components.everything_presence_pro.zone_engine import Grid
from custom_components.everything_presence_pro.zone_engine import TargetStatus
from custom_components.everything_presence_pro.zone_engine import TargetWindow
from custom_components.everything_presence_pro.zone_engine import TumblingWindow
from custom_components.everything_presence_pro.zone_engine import WindowOutput
from custom_components.everything_presence_pro.zone_engine import Zone
from custom_components.everything_presence_pro.zone_engine import ZoneEngine
from custom_components.everything_presence_pro.zone_engine import ZoneState

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_grid(cols: int = 20, rows: int = 20) -> Grid:
    """Create a grid with all cells marked as inside room."""
    grid = Grid(origin_x=0.0, origin_y=0.0, cols=cols, rows=rows)
    for i in range(grid.cell_count):
        grid.cells[i] = CELL_ROOM_BIT
    return grid


def _make_window(
    targets: list[tuple[float, float, int]],
    total_frames: int = RAW_FPS,
) -> WindowOutput:
    """Build a WindowOutput from (x, y, frame_count) tuples."""
    tw_list: list[TargetWindow] = []
    for x, y, fc in targets:
        tw_list.append(
            TargetWindow(
                median_x=x,
                median_y=y,
                frame_count=fc,
                active=fc > 0,
            )
        )
    return WindowOutput(targets=tw_list, total_frames=total_frames)


def _make_engine_with_zone(
    zone_type: str = ZONE_TYPE_NORMAL,
    trigger: int | None = None,
    renew: int | None = None,
    timeout: float | None = None,
    handoff_timeout: float | None = None,
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
        renew=renew if renew is not None else defaults["renew"],
        timeout=timeout if timeout is not None else defaults["timeout"],
        handoff_timeout=handoff_timeout if handoff_timeout is not None else defaults["handoff_timeout"],
    )
    engine = ZoneEngine(grid=grid, zones=[zone])
    return engine, grid


# ===================================================================
# Grid tests
# ===================================================================


class TestGrid:
    """Tests for the Grid class."""

    def test_cell_is_room_flag(self):
        """Bit 0 = room flag."""
        grid = Grid(cols=4, rows=4)
        grid.cells[0] = 0x00
        assert grid.cell_is_room(0) is False

        grid.cells[0] = CELL_ROOM_BIT
        assert grid.cell_is_room(0) is True

        grid.cells[0] = CELL_ROOM_BIT | (3 << CELL_ZONE_SHIFT)
        assert grid.cell_is_room(0) is True

    def test_cell_zone_encoding(self):
        """Bits 1-3 = zone field."""
        grid = Grid(cols=4, rows=4)
        grid.cells[0] = CELL_ROOM_BIT | (5 << CELL_ZONE_SHIFT)
        assert grid.cell_zone(0) == 5
        assert grid.cell_is_room(0) is True

    def test_xy_to_cell_basic(self):
        """Coordinates inside the grid map to correct cell index."""
        grid = Grid(origin_x=0.0, origin_y=0.0, cols=4, rows=4, cell_size=300)
        assert grid.xy_to_cell(150, 150) == 0  # col=0, row=0
        assert grid.xy_to_cell(450, 150) == 1  # col=1, row=0
        assert grid.xy_to_cell(150, 450) == 4  # col=0, row=1

    def test_xy_to_cell_out_of_bounds(self):
        """Coordinates outside the grid return None."""
        grid = Grid(origin_x=0.0, origin_y=0.0, cols=4, rows=4, cell_size=300)
        # int() truncates toward zero, so -1/300 -> 0 which is in-bounds.
        # Use values clearly outside: negative by a full cell or past the end.
        assert grid.xy_to_cell(-300, 0) is None
        assert grid.xy_to_cell(0, -300) is None
        assert grid.xy_to_cell(1200, 0) is None
        assert grid.xy_to_cell(0, 1200) is None

    def test_base64_roundtrip(self):
        """Grid serialization to/from base64 preserves data."""
        grid = _make_grid(cols=4, rows=4)
        grid.cells[0] = CELL_ROOM_BIT | (2 << CELL_ZONE_SHIFT)
        b64 = grid.to_base64()

        grid2 = Grid.from_base64(b64, cols=4, rows=4, origin_x=0.0, origin_y=0.0)
        assert grid2.cell_zone(0) == 2
        assert grid2.cell_is_room(0) is True
        assert list(grid2.cells) == list(grid.cells)

    def test_from_base64_preserves_origin(self):
        """from_base64 sets origin correctly."""
        grid = _make_grid(cols=2, rows=2)
        b64 = grid.to_base64()
        restored = Grid.from_base64(b64, cols=2, rows=2, origin_x=-300.0, origin_y=-600.0)
        assert restored.origin_x == -300.0
        assert restored.origin_y == -600.0

    def test_load_from_bytes_truncates(self):
        """load_from_bytes only loads up to cell_count bytes."""
        grid = Grid(cols=2, rows=2)
        grid.load_from_bytes(bytes([CELL_ROOM_BIT] * 10))
        assert len(grid.cells) == 4
        assert grid.cell_is_room(0) is True

    def test_compute_extent_no_perspective(self):
        """compute_extent without perspective uses room dimensions directly."""
        ox, oy, cols, rows = Grid.compute_extent(
            perspective=[],
            room_width=3000,
            room_depth=6000,
            cell_size=300,
        )
        assert ox == 0.0
        assert oy == 0.0
        assert cols == 10
        assert rows == 20

    def test_compute_extent_with_identity_perspective(self):
        """compute_extent with identity perspective computes from FOV projection."""
        persp = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0]
        ox, _oy, cols, rows = Grid.compute_extent(
            perspective=persp,
            room_width=3000,
            room_depth=6000,
            cell_size=300,
        )
        # With identity perspective, the FOV fan maps raw coords directly
        assert cols >= 1
        assert rows >= 1
        # Origin should be negative (left edge of FOV fan)
        assert ox <= 0

    def test_compute_extent_wrong_length_perspective(self):
        """compute_extent with wrong-length perspective falls back to room-based calc."""
        _ox, _oy, cols, rows = Grid.compute_extent(
            perspective=[1.0, 2.0],
            room_width=1200,
            room_depth=2400,
            cell_size=300,
        )
        assert cols == 4
        assert rows == 8


# ===================================================================
# Threshold conversion
# ===================================================================


class TestThreshold:
    """Tests for threshold_to_frame_count."""

    def test_values(self):
        assert threshold_to_frame_count(1) == 1
        assert threshold_to_frame_count(5) == 5
        assert threshold_to_frame_count(9) == 9

    def test_floor_to_one(self):
        assert threshold_to_frame_count(0) == 1
        assert threshold_to_frame_count(-1) == 1


# ===================================================================
# TumblingWindow
# ===================================================================


class TestTumblingWindow:
    """Tests for TumblingWindow."""

    def test_emits_after_interval(self):
        """Window collects frames and emits per-target results after 1 second."""
        grid = _make_grid(cols=4, rows=4)
        window = TumblingWindow(grid=grid, interval_s=1.0)

        t = 100.0
        for i in range(32):
            result = window.feed([(150, 150, True)], t + i * 0.03)
            assert result is None

        result = window.feed([(150, 150, True)], t + 0.99)
        assert result is None

        result = window.feed([(150, 150, True)], t + 1.01)
        assert result is not None
        assert result.total_frames == 33
        assert result.targets[0].active is True
        assert result.targets[0].frame_count == 33
        assert result.targets[0].median_x == 150
        assert result.targets[0].median_y == 150

    def test_inactive_target(self):
        """Inactive targets produce empty TargetWindow."""
        grid = _make_grid(cols=4, rows=4)
        window = TumblingWindow(grid=grid, interval_s=1.0)

        t = 100.0
        for i in range(10):
            window.feed([(0, 0, False)], t + i * 0.03)

        result = window.feed([(0, 0, False)], t + 1.01)
        assert result is not None
        assert result.targets[0].active is False
        assert result.targets[0].frame_count == 0

    def test_reset_clears_state(self):
        """Calling reset() clears accumulated frames."""
        grid = _make_grid(cols=4, rows=4)
        window = TumblingWindow(grid=grid, interval_s=1.0)

        t = 100.0
        for i in range(5):
            window.feed([(150, 150, True)], t + i * 0.1)

        window.reset()

        # After reset, feed again from scratch
        for i in range(10):
            window.feed([(300, 300, True)], t + 5.0 + i * 0.1)

        result = window.feed([(300, 300, True)], t + 6.01)
        assert result is not None
        assert result.targets[0].median_x == 300

    def test_grid_setter_resets_window(self):
        """Setting a new grid resets the window state."""
        grid1 = _make_grid(cols=4, rows=4)
        window = TumblingWindow(grid=grid1, interval_s=1.0)

        t = 100.0
        for i in range(5):
            window.feed([(150, 150, True)], t + i * 0.1)

        grid2 = _make_grid(cols=8, rows=8)
        window.grid = grid2
        assert window.grid is grid2

        # After grid setter, window is reset; feed should start fresh
        for i in range(10):
            window.feed([(200, 200, True)], t + 5.0 + i * 0.1)
        result = window.feed([(200, 200, True)], t + 6.01)
        assert result is not None
        assert result.targets[0].median_x == 200

    def test_multiple_targets(self):
        """Window tracks multiple targets independently."""
        grid = _make_grid(cols=4, rows=4)
        window = TumblingWindow(grid=grid, interval_s=1.0)

        t = 100.0
        for i in range(10):
            window.feed(
                [(150, 150, True), (450, 450, True), (0, 0, False)],
                t + i * 0.1,
            )

        result = window.feed(
            [(150, 150, True), (450, 450, True), (0, 0, False)],
            t + 1.01,
        )
        assert result is not None
        assert result.targets[0].active is True
        assert result.targets[0].median_x == 150
        assert result.targets[1].active is True
        assert result.targets[1].median_x == 450
        assert result.targets[2].active is False


# ===================================================================
# State machine (via ZoneEngine)
# ===================================================================


class TestStateMachine:
    """Tests for the CLEAR -> OCCUPIED -> PENDING -> CLEAR state machine."""

    def test_clear_to_occupied(self):
        """CLEAR -> OCCUPIED when target frame count meets trigger in an entry-point zone."""
        engine, _ = _make_engine_with_zone(
            zone_type=ZONE_TYPE_ENTRANCE,
            trigger=5,
            renew=3,
            timeout=5.0,
        )
        t = 100.0
        for i in range(10):
            engine.feed_raw([(150, 150, True)], t + i * 0.03)
        result = engine.feed_raw([(150, 150, True)], t + 1.01)
        assert result is not None
        assert result.zone_occupancy[1] is True

    def test_clear_stays_clear_below_threshold(self):
        """CLEAR stays CLEAR when target frame count below trigger threshold."""
        engine, _ = _make_engine_with_zone(trigger=5, renew=1, timeout=5.0)
        t = 100.0
        for i in range(3):
            engine.feed_raw([(150, 150, True)], t + i * 0.03)
        for i in range(7):
            engine.feed_raw([(0, 0, False)], t + 0.09 + i * 0.03)
        result = engine.feed_raw([(0, 0, False)], t + 1.01)
        assert result is not None
        assert result.zone_occupancy[1] is False

    def test_occupied_to_pending(self):
        """OCCUPIED -> PENDING when no target confirmed."""
        engine, _ = _make_engine_with_zone(
            zone_type=ZONE_TYPE_ENTRANCE,
            trigger=3,
            renew=3,
            timeout=5.0,
        )
        t = 100.0
        for i in range(10):
            engine.feed_raw([(150, 150, True)], t + i * 0.03)
        result = engine.feed_raw([(0, 0, False)], t + 1.01)
        assert result is not None
        assert result.zone_occupancy[1] is True

        for i in range(10):
            engine.feed_raw([(0, 0, False)], t + 1.01 + i * 0.03)
        result = engine.feed_raw([(0, 0, False)], t + 2.02)
        assert result is not None
        # Still true because in PENDING (not yet timed out)
        assert result.zone_occupancy[1] is True

    def test_pending_to_clear(self):
        """PENDING -> CLEAR when timeout expires."""
        engine, _ = _make_engine_with_zone(
            zone_type=ZONE_TYPE_ENTRANCE,
            trigger=3,
            renew=3,
            timeout=2.0,
        )
        t = 100.0
        for i in range(10):
            engine.feed_raw([(150, 150, True)], t + i * 0.1)
        engine.feed_raw([(0, 0, False)], t + 1.01)

        for w in range(3):
            wt = t + 1.01 + w * 1.0
            for i in range(10):
                engine.feed_raw([(0, 0, False)], wt + i * 0.1)
            result = engine.feed_raw([(0, 0, False)], wt + 1.01)

        assert result is not None
        assert result.zone_occupancy[1] is False

    def test_pending_to_occupied(self):
        """PENDING -> OCCUPIED when renew threshold met during timeout."""
        engine, _ = _make_engine_with_zone(
            zone_type=ZONE_TYPE_ENTRANCE,
            trigger=3,
            renew=3,
            timeout=10.0,
        )
        t = 100.0
        for i in range(10):
            engine.feed_raw([(150, 150, True)], t + i * 0.1)
        engine.feed_raw([(0, 0, False)], t + 1.01)

        for i in range(10):
            engine.feed_raw([(0, 0, False)], t + 1.01 + i * 0.1)
        engine.feed_raw([(0, 0, False)], t + 2.02)

        for i in range(10):
            engine.feed_raw([(150, 150, True)], t + 2.02 + i * 0.1)
        result = engine.feed_raw([(150, 150, True)], t + 3.03)
        assert result is not None
        assert result.zone_occupancy[1] is True

    def test_sparse_zone_ids(self):
        """Engine works with non-contiguous zone IDs (1 and 3, skip 2)."""
        grid = _make_grid(cols=4, rows=4)
        cell1 = grid.xy_to_cell(150, 150)
        grid.cells[cell1] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
        cell3 = grid.xy_to_cell(450, 450)
        grid.cells[cell3] = CELL_ROOM_BIT | (3 << CELL_ZONE_SHIFT)

        zone1 = Zone(id=1, name="Desk", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        zone3 = Zone(id=3, name="Bed", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone1, zone3])

        t = 100.0
        for i in range(10):
            engine.feed_raw([(150, 150, True)], t + i * 0.1)
        result = engine.feed_raw([(150, 150, True)], t + 1.01)
        assert result is not None
        assert result.zone_occupancy[1] is True
        assert result.zone_occupancy[3] is False

    def test_device_tracking_present(self):
        """device_tracking_present tracks zone 0 (room) occupancy with gating."""
        grid = _make_grid(cols=4, rows=4)
        zone = Zone(id=1, name="Z", type=ZONE_TYPE_NORMAL, trigger=3, renew=3, timeout=10.0)
        grid.cells[0] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
        engine = ZoneEngine(grid=grid, zones=[zone])

        t = 100.0
        # Window 1: gate_count goes to 1 (gating in zone 0, thresh=min(5+2,8)=7)
        for i in range(10):
            engine.feed_raw([(450, 150, True)], t + i * 0.1)
        result = engine.feed_raw([(450, 150, True)], t + 1.01)
        assert result is not None
        assert result.device_tracking_present is False

        # Window 2: continuous from window 1, bypasses gating → confirmed
        for i in range(10):
            engine.feed_raw([(450, 150, True)], t + 1.01 + i * 0.1)
        result = engine.feed_raw([(450, 150, True)], t + 2.02)
        assert result is not None
        assert result.device_tracking_present is True
        assert result.zone_occupancy[1] is False


# ===================================================================
# Entry point gating
# ===================================================================


class TestEntryPointGating:
    """Tests for entry point gating and continuity."""

    def test_non_entry_point_needs_gating(self):
        """New target in normal zone needs 2 qualifying ticks with gated threshold."""
        grid = _make_grid(cols=4, rows=4)
        cell_idx = grid.xy_to_cell(150, 150)
        grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

        zone = Zone(id=1, name="Normal", type=ZONE_TYPE_NORMAL, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone])

        t = 100.0

        # Tick 1: 4 frames below gated threshold (min(3+2,8)=5), not confirmed
        w1 = _make_window([(150, 150, 4)])
        r1 = engine._tick(w1, t)
        assert r1.zone_occupancy[1] is False

        # Tick 2: 5 frames at gated threshold, gate_count=1, not confirmed yet
        w2 = _make_window([(150, 150, 5)])
        r2 = engine._tick(w2, t + 1.0)
        assert r2.zone_occupancy[1] is False

        # Tick 3: continuous from tick 2, bypasses gating, frame_count >= trigger → confirmed
        w3 = _make_window([(150, 150, 5)])
        r3 = engine._tick(w3, t + 2.0)
        assert r3.zone_occupancy[1] is True

    def test_entry_point_zone_confirms_immediately(self):
        """New target in entrance zone confirms in one tick."""
        grid = _make_grid(cols=4, rows=4)
        cell_idx = grid.xy_to_cell(150, 150)
        grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

        zone = Zone(id=1, name="Entrance", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone])

        w1 = _make_window([(150, 150, 5)])
        r1 = engine._tick(w1, 100.0)
        assert r1.zone_occupancy[1] is True

    def test_continuous_movement_bypasses_gating(self):
        """Target entering via entry point then moving to normal zone is accepted."""
        grid = _make_grid(cols=4, rows=4)
        cell1 = grid.xy_to_cell(150, 150)
        grid.cells[cell1] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
        cell2 = grid.xy_to_cell(450, 150)
        grid.cells[cell2] = CELL_ROOM_BIT | (2 << CELL_ZONE_SHIFT)

        zone1 = Zone(id=1, name="Entrance", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        zone2 = Zone(id=2, name="Normal", type=ZONE_TYPE_NORMAL, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone1, zone2])

        t = 100.0
        w1 = _make_window([(150, 150, 8)])
        r1 = engine._tick(w1, t)
        assert r1.zone_occupancy[1] is True
        assert r1.zone_occupancy[2] is False

        w2 = _make_window([(450, 150, 8)])
        r2 = engine._tick(w2, t + 1.0)
        assert r2.zone_occupancy[2] is True


# ===================================================================
# Handoff
# ===================================================================


class TestHandoff:
    """Tests for target handoff between zones."""

    def test_handoff_accelerates_timeout(self):
        """Source zone clears after handoff_timeout, not the full timeout."""
        grid = _make_grid(cols=4, rows=4)
        cell1 = grid.xy_to_cell(150, 150)
        grid.cells[cell1] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
        cell2 = grid.xy_to_cell(450, 150)
        grid.cells[cell2] = CELL_ROOM_BIT | (2 << CELL_ZONE_SHIFT)

        zone1 = Zone(
            id=1,
            name="Entrance",
            type=ZONE_TYPE_ENTRANCE,
            trigger=3,
            renew=3,
            timeout=10.0,
            handoff_timeout=2.0,
        )
        zone2 = Zone(
            id=2,
            name="Normal",
            type=ZONE_TYPE_NORMAL,
            trigger=3,
            renew=3,
            timeout=10.0,
        )
        engine = ZoneEngine(grid=grid, zones=[zone1, zone2])

        t = 100.0
        w1 = _make_window([(150, 150, 8)])
        r1 = engine._tick(w1, t)
        assert r1.zone_occupancy[1] is True

        w2 = _make_window([(450, 150, 8)])
        r2 = engine._tick(w2, t + 1.0)
        assert r2.zone_occupancy[1] is True  # Still pending

        # After handoff_timeout (2s) zone 1 should clear
        w3 = _make_window([(450, 150, 8)])
        r3 = engine._tick(w3, t + 4.0)
        assert r3.zone_occupancy[1] is False

    def test_no_pending_target_for_handoff(self):
        """No faded dot when target hands off (removed from confirmed_targets)."""
        grid = _make_grid(cols=4, rows=4)
        cell1 = grid.xy_to_cell(150, 150)
        grid.cells[cell1] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
        cell2 = grid.xy_to_cell(450, 150)
        grid.cells[cell2] = CELL_ROOM_BIT | (2 << CELL_ZONE_SHIFT)

        zone1 = Zone(
            id=1,
            name="Entrance",
            type=ZONE_TYPE_ENTRANCE,
            trigger=3,
            renew=3,
            timeout=10.0,
            handoff_timeout=2.0,
        )
        zone2 = Zone(
            id=2,
            name="Normal",
            type=ZONE_TYPE_NORMAL,
            trigger=3,
            renew=3,
            timeout=10.0,
        )
        engine = ZoneEngine(grid=grid, zones=[zone1, zone2])

        t = 100.0
        w1 = _make_window([(150, 150, 8)])
        engine._tick(w1, t)

        w2 = _make_window([(450, 150, 8)])
        r2 = engine._tick(w2, t + 1.0)

        assert r2.targets[0].status == TargetStatus.ACTIVE  # target moved, not pending


# ===================================================================
# Multi-target
# ===================================================================


class TestMultiTarget:
    """Tests for multiple simultaneous targets."""

    def test_two_targets_in_different_zones(self):
        """Two targets in separate zones both trigger occupancy."""
        grid = _make_grid(cols=4, rows=4)
        cell1 = grid.xy_to_cell(150, 150)
        grid.cells[cell1] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
        cell2 = grid.xy_to_cell(450, 450)
        grid.cells[cell2] = CELL_ROOM_BIT | (2 << CELL_ZONE_SHIFT)

        zone1 = Zone(id=1, name="Z1", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        zone2 = Zone(id=2, name="Z2", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone1, zone2])

        t = 100.0
        w = _make_window([(150, 150, 8), (450, 450, 8)])
        result = engine._tick(w, t)
        assert result.zone_occupancy[1] is True
        assert result.zone_occupancy[2] is True

    def test_two_targets_same_zone(self):
        """Two targets in the same zone confirm the zone."""
        grid = _make_grid(cols=4, rows=4)
        cell = grid.xy_to_cell(150, 150)
        grid.cells[cell] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
        # Adjacent cell also in same zone
        cell2 = grid.xy_to_cell(200, 150)
        if cell2 is not None and cell2 != cell:
            grid.cells[cell2] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

        zone1 = Zone(id=1, name="Z1", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone1])

        w = _make_window([(150, 150, 8), (200, 150, 8)])
        result = engine._tick(w, 100.0)
        assert result.zone_occupancy[1] is True


# ===================================================================
# next_expiry
# ===================================================================


class TestNextExpiry:
    """Tests for ZoneEngine.next_expiry."""

    def test_no_pending_returns_none(self):
        """No pending zones means next_expiry is None."""
        engine, _ = _make_engine_with_zone(zone_type=ZONE_TYPE_ENTRANCE, trigger=3, timeout=10.0)
        assert engine.next_expiry() is None

    def test_pending_returns_expiry(self):
        """When a zone is pending, next_expiry returns the expected time."""
        engine, _ = _make_engine_with_zone(
            zone_type=ZONE_TYPE_ENTRANCE,
            trigger=3,
            renew=3,
            timeout=5.0,
        )
        t = 100.0
        # Confirm the zone
        for i in range(10):
            engine.feed_raw([(150, 150, True)], t + i * 0.1)
        engine.feed_raw([(0, 0, False)], t + 1.01)

        # Make it go PENDING
        for i in range(10):
            engine.feed_raw([(0, 0, False)], t + 1.01 + i * 0.1)
        engine.feed_raw([(0, 0, False)], t + 2.02)

        expiry = engine.next_expiry()
        assert expiry is not None
        # Expiry should be pending_since + timeout
        assert expiry == pytest.approx(t + 2.02 + 5.0, abs=0.5)


# ===================================================================
# Pending targets (faded dots)
# ===================================================================


class TestTargetStatus:
    """Tests for per-target status in zone engine output."""

    def test_active_target_has_active_status(self):
        """Active confirmed target has ACTIVE status with signal."""
        grid = _make_grid(cols=4, rows=4)
        cell_idx = grid.xy_to_cell(150, 150)
        grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

        zone = Zone(id=1, name="Desk", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone])

        t = 100.0
        w1 = _make_window([(150, 150, 8)])
        r1 = engine._tick(w1, t)
        assert r1.targets[0].status == TargetStatus.ACTIVE
        assert r1.targets[0].signal == 8
        assert r1.targets[0].x == 150
        assert r1.targets[0].y == 150

    def test_pending_when_target_disappears(self):
        """Target becomes PENDING when it goes inactive but zone is still counting down."""
        grid = _make_grid(cols=4, rows=4)
        cell_idx = grid.xy_to_cell(150, 150)
        grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

        zone = Zone(id=1, name="Desk", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone])

        t = 100.0
        w1 = _make_window([(150, 150, 8)])
        r1 = engine._tick(w1, t)
        assert r1.targets[0].status == TargetStatus.ACTIVE

        w2 = _make_window([(0, 0, 0)])
        r2 = engine._tick(w2, t + 1.0)
        assert r2.zone_occupancy[1] is True
        assert r2.targets[0].status == TargetStatus.PENDING
        assert r2.targets[0].x == 150
        assert r2.targets[0].y == 150
        assert r2.targets[0].signal == 0

    def test_inactive_when_zone_clears(self):
        """Target becomes INACTIVE when zone timeout expires."""
        grid = _make_grid(cols=4, rows=4)
        cell_idx = grid.xy_to_cell(150, 150)
        grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

        zone = Zone(id=1, name="Desk", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=2.0)
        engine = ZoneEngine(grid=grid, zones=[zone])

        t = 100.0
        w1 = _make_window([(150, 150, 8)])
        engine._tick(w1, t)

        w2 = _make_window([(0, 0, 0)])
        engine._tick(w2, t + 1.0)

        w3 = _make_window([(0, 0, 0)])
        engine._tick(w3, t + 2.0)
        w4 = _make_window([(0, 0, 0)])
        r4 = engine._tick(w4, t + 3.5)
        assert r4.zone_occupancy[1] is False
        assert r4.targets[0].status == TargetStatus.INACTIVE

    def test_returns_to_active_when_target_reappears(self):
        """Target goes PENDING then back to ACTIVE when it returns."""
        grid = _make_grid(cols=4, rows=4)
        cell_idx = grid.xy_to_cell(150, 150)
        grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

        zone = Zone(id=1, name="Desk", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone])

        t = 100.0
        w1 = _make_window([(150, 150, 8)])
        engine._tick(w1, t)

        w2 = _make_window([(0, 0, 0)])
        r2 = engine._tick(w2, t + 1.0)
        assert r2.targets[0].status == TargetStatus.PENDING

        w3 = _make_window([(150, 150, 8)])
        r3 = engine._tick(w3, t + 2.0)
        assert r3.zone_occupancy[1] is True
        assert r3.targets[0].status == TargetStatus.ACTIVE

    def test_handoff_target_not_pending_in_source(self):
        """Handoff target is not PENDING — it moved to the new zone."""
        grid = _make_grid(cols=8, rows=4)
        cell1 = grid.xy_to_cell(150, 150)
        cell2 = grid.xy_to_cell(450, 150)
        grid.cells[cell1] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
        grid.cells[cell2] = CELL_ROOM_BIT | (2 << CELL_ZONE_SHIFT)

        zone1 = Zone(id=1, name="Z1", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        zone2 = Zone(id=2, name="Z2", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone1, zone2])

        t = 100.0
        w1 = _make_window([(150, 150, 8)])
        engine._tick(w1, t)

        w2 = _make_window([(450, 150, 8)])
        r2 = engine._tick(w2, t + 1.0)
        assert r2.targets[0].status == TargetStatus.ACTIVE

    def test_pending_persists_for_full_timeout(self):
        """Faded dot stays PENDING for the entire zone timeout, not just one tick."""
        grid = _make_grid(cols=4, rows=4)
        cell_idx = grid.xy_to_cell(150, 150)
        grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

        zone = Zone(id=1, name="Desk", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=5.0)
        engine = ZoneEngine(grid=grid, zones=[zone])

        t = 100.0
        w1 = _make_window([(150, 150, 8)])
        engine._tick(w1, t)

        # Target disappears — zone goes PENDING, target should be PENDING
        w2 = _make_window([(0, 0, 0)])
        r2 = engine._tick(w2, t + 1.0)
        assert r2.zone_occupancy[1] is True
        assert r2.targets[0].status == TargetStatus.PENDING

        # Several ticks later — still within timeout — target must stay PENDING
        for dt in [2.0, 3.0, 4.0, 5.0]:
            w = _make_window([(0, 0, 0)])
            r = engine._tick(w, t + dt)
            assert r.zone_occupancy[1] is True, f"zone should still be occupied at t+{dt}"
            assert r.targets[0].status == TargetStatus.PENDING, f"target should still be PENDING at t+{dt}"

        # After timeout expires — zone clears, target becomes INACTIVE
        w_final = _make_window([(0, 0, 0)])
        r_final = engine._tick(w_final, t + 6.5)
        assert r_final.zone_occupancy[1] is False
        assert r_final.targets[0].status == TargetStatus.INACTIVE

    def test_stale_confirmed_target_cleaned_from_occupied_zone(self):
        """When one of two targets disappears, the occupied zone count updates."""
        grid = _make_grid(cols=4, rows=4)
        cell_idx = grid.xy_to_cell(150, 150)
        grid.cells[cell_idx] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)

        zone = Zone(id=1, name="Desk", type=ZONE_TYPE_ENTRANCE, trigger=3, renew=3, timeout=10.0)
        engine = ZoneEngine(grid=grid, zones=[zone])

        t = 100.0
        # Two targets confirmed in zone
        w1 = _make_window([(150, 150, 8), (150, 150, 8)])
        engine._tick(w1, t)

        # T1 disappears, T0 stays — zone stays OCCUPIED
        w2 = _make_window([(150, 150, 8), (0, 0, 0)])
        r2 = engine._tick(w2, t + 1.0)
        assert r2.zone_occupancy[1] is True
        assert r2.targets[0].status == TargetStatus.ACTIVE
        # T1 should be INACTIVE (not PENDING) because zone is still OCCUPIED
        assert r2.targets[1].status == TargetStatus.INACTIVE

        # On next tick, confirmed_targets should not include stale T1
        w3 = _make_window([(150, 150, 8), (0, 0, 0)])
        r3 = engine._tick(w3, t + 2.0)
        assert r3.targets[0].status == TargetStatus.ACTIVE
        assert r3.targets[1].status == TargetStatus.INACTIVE


# ===================================================================
# Zone type defaults
# ===================================================================


class TestZoneDefaults:
    """Tests for Zone dataclass defaults and entry point derivation."""

    def test_entrance_zone_is_entry_point(self):
        z = Zone(id=1, name="Door", type=ZONE_TYPE_ENTRANCE)
        assert z.entry_point is True

    def test_normal_zone_is_not_entry_point(self):
        z = Zone(id=1, name="Desk", type=ZONE_TYPE_NORMAL)
        assert z.entry_point is False

    def test_custom_zone_keeps_explicit_entry_point(self):
        z = Zone(id=1, name="Custom", type="custom", entry_point=True)
        assert z.entry_point is True
        z2 = Zone(id=2, name="Custom2", type="custom", entry_point=False)
        assert z2.entry_point is False

    def test_zone_state_values(self):
        assert ZoneState.CLEAR.value == "clear"
        assert ZoneState.OCCUPIED.value == "occupied"
        assert ZoneState.PENDING.value == "pending"


class TestDisplayBuffer:
    """Tests for DisplayBuffer rolling median."""

    def test_single_feed_returns_snapshot(self):
        buf = DisplayBuffer(maxlen=10)
        snap = buf.feed(
            calibrated=[(100.0, 200.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(50.0, 100.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
        )
        assert isinstance(snap, DisplaySnapshot)
        assert len(snap.targets) == 3
        t = snap.targets[0]
        assert t.x == 100.0
        assert t.y == 200.0
        assert t.raw_x == 50.0
        assert t.raw_y == 100.0
        assert t.active is True
        assert t.frame_count == 1
        assert snap.targets[1].active is False

    def test_rolling_median_smooths(self):
        buf = DisplayBuffer(maxlen=10)
        positions = [100.0, 101.0, 100.0, 200.0, 99.0]
        for x in positions:
            snap = buf.feed(
                calibrated=[(x, 300.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
                raw=[(x, 300.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            )
        assert snap.targets[0].x == 100.0
        assert snap.targets[0].frame_count == 5

    def test_inactive_clears_history(self):
        buf = DisplayBuffer(maxlen=10)
        buf.feed(
            calibrated=[(100.0, 200.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(50.0, 100.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
        )
        snap = buf.feed(
            calibrated=[(0.0, 0.0, False), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(0.0, 0.0, False), (0.0, 0.0, False), (0.0, 0.0, False)],
        )
        assert snap.targets[0].active is False
        assert snap.targets[0].frame_count == 0

    def test_deque_maxlen(self):
        buf = DisplayBuffer(maxlen=3)
        for x in [10.0, 20.0, 30.0, 40.0, 50.0]:
            snap = buf.feed(
                calibrated=[(x, 0.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
                raw=[(x, 0.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            )
        assert snap.targets[0].x == 40.0
        assert snap.targets[0].frame_count == 3

    def test_reset(self):
        buf = DisplayBuffer(maxlen=10)
        buf.feed(
            calibrated=[(100.0, 200.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(50.0, 100.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
        )
        buf.reset()
        snap = buf.feed(
            calibrated=[(999.0, 888.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(999.0, 888.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
        )
        assert snap.targets[0].x == 999.0
        assert snap.targets[0].frame_count == 1

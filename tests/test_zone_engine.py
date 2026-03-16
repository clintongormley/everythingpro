"""Tests for the zone engine."""

from custom_components.everything_presence_pro.zone_engine import (
    Grid,
    Zone,
    ZoneEngine,
)
from custom_components.everything_presence_pro.const import (
    CELL_ROOM_INSIDE,
    CELL_ROOM_OUTSIDE,
    CELL_ZONE_SHIFT,
    ZONE_EXCLUSION,
    ZONE_HIGH,
    ZONE_LOW,
    ZONE_NORMAL,
)


def _make_grid(cols: int = 20, rows: int = 16) -> Grid:
    """Create a grid with all cells marked as inside room."""
    grid = Grid(origin_x=0.0, origin_y=0.0, cols=cols, rows=rows)
    for i in range(grid.cell_count):
        grid.cells[i] = CELL_ROOM_INSIDE
    return grid


def test_grid_creation():
    """Test grid initializes with correct dimensions."""
    grid = Grid(cols=20, rows=16)
    assert grid.cell_count == 320
    assert len(grid.cells) == 320
    assert all(c == 0 for c in grid.cells)


def test_grid_xy_to_cell():
    """Test mapping room coordinates to grid cell index."""
    grid = Grid(origin_x=0.0, origin_y=0.0, cols=20, rows=16, cell_size=300)
    # (150, 150) should be in cell (0, 0) = index 0
    cell = grid.xy_to_cell(150, 150)
    assert cell == 0

    # Out of bounds
    cell = grid.xy_to_cell(-300, 0)
    assert cell is None
    cell = grid.xy_to_cell(0, 5000)
    assert cell is None


def test_grid_cell_zone():
    """Test cell zone read with new encoding."""
    grid = Grid(cols=4, rows=4)
    # Set cell 0 to inside room + zone 3: bits 0-1 = 01 (inside), bits 2-4 = 011 (zone 3)
    grid.cells[0] = CELL_ROOM_INSIDE | (3 << CELL_ZONE_SHIFT)
    assert grid.cell_zone(0) == 3
    assert grid.cell_is_room(0) is True


def test_grid_cell_is_room():
    """Test cell room check with new encoding."""
    grid = Grid(cols=4, rows=4)
    grid.cells[0] = CELL_ROOM_OUTSIDE
    assert grid.cell_is_room(0) is False

    grid.cells[0] = CELL_ROOM_INSIDE
    assert grid.cell_is_room(0) is True

    # Entrance and interference are also "inside room"
    grid.cells[0] = 0x02  # entrance
    assert grid.cell_is_room(0) is True
    grid.cells[0] = 0x03  # interference
    assert grid.cell_is_room(0) is True


def test_grid_base64_roundtrip():
    """Test grid serialization to/from base64."""
    grid = _make_grid(cols=4, rows=4)
    grid.cells[0] = CELL_ROOM_INSIDE | (2 << CELL_ZONE_SHIFT)
    b64 = grid.to_base64()

    grid2 = Grid.from_base64(b64, cols=4, rows=4, origin_x=0.0, origin_y=0.0)
    assert grid2.cell_zone(0) == 2
    assert grid2.cell_is_room(0) is True
    assert list(grid2.cells) == list(grid.cells)


def test_zone_engine_no_zones():
    """Test zone engine with no zones defined."""
    engine = ZoneEngine()
    engine.set_grid(_make_grid())
    result = engine.process_targets([(150, 150, True)])
    assert result.device_tracking_present is True
    assert len(result.zone_occupancy) == 0


def test_zone_engine_target_in_zone():
    """Test zone engine detects target in a zone."""
    engine = ZoneEngine()
    grid = _make_grid()
    # Paint zone 1 onto cell at (150, 150)
    cell_idx = grid.xy_to_cell(150, 150)
    assert cell_idx is not None
    grid.cells[cell_idx] = CELL_ROOM_INSIDE | (1 << CELL_ZONE_SHIFT)
    engine.set_grid(grid)

    zone = Zone(id=1, name="Desk", sensitivity=ZONE_NORMAL)
    engine.set_zones([zone])

    # With SENSITIVITY_NORMAL=3, need 3 frames to confirm
    result = engine.process_targets([(150, 150, True)])
    assert result.zone_target_counts[1] == 1
    engine.process_targets([(150, 150, True)])
    result = engine.process_targets([(150, 150, True)])
    assert result.zone_occupancy[1] is True


def test_zone_engine_target_not_in_zone():
    """Test zone engine when target is outside all zones."""
    engine = ZoneEngine()
    grid = _make_grid()
    # Zone 1 only on cell 0
    grid.cells[0] = CELL_ROOM_INSIDE | (1 << CELL_ZONE_SHIFT)
    engine.set_grid(grid)

    zone = Zone(id=1, name="Desk", sensitivity=ZONE_NORMAL)
    engine.set_zones([zone])

    # Target in a different cell (far from cell 0)
    result = engine.process_targets([(3000, 3000, True)])
    assert result.zone_occupancy[1] is False
    assert result.zone_target_counts[1] == 0


def test_zone_engine_exclusion_zone():
    """Test exclusion zones ignore targets."""
    engine = ZoneEngine()
    grid = _make_grid()
    cell_idx = grid.xy_to_cell(150, 150)
    grid.cells[cell_idx] = CELL_ROOM_INSIDE | (1 << CELL_ZONE_SHIFT)
    engine.set_grid(grid)

    zone = Zone(id=1, name="Fan", sensitivity=ZONE_EXCLUSION)
    engine.set_zones([zone])

    result = engine.process_targets([(150, 150, True)])
    assert 1 not in result.zone_occupancy


def test_zone_engine_outside_cells_ignored():
    """Test targets in outside cells are ignored."""
    engine = ZoneEngine()
    grid = _make_grid()
    cell_idx = grid.xy_to_cell(150, 150)
    grid.cells[cell_idx] = CELL_ROOM_OUTSIDE  # mark as outside
    engine.set_grid(grid)

    result = engine.process_targets([(150, 150, True)])
    assert result.device_tracking_present is False


def test_zone_engine_high_sensitivity():
    """Test high sensitivity zones respond immediately."""
    engine = ZoneEngine()
    grid = _make_grid()
    cell_idx = grid.xy_to_cell(150, 150)
    grid.cells[cell_idx] = CELL_ROOM_INSIDE | (1 << CELL_ZONE_SHIFT)
    engine.set_grid(grid)

    zone = Zone(id=1, name="Bed", sensitivity=ZONE_HIGH)
    engine.set_zones([zone])

    # Single frame should trigger high sensitivity zone (threshold=1)
    result = engine.process_targets([(150, 150, True)])
    assert result.zone_occupancy[1] is True


def test_zone_engine_low_sensitivity():
    """Test low sensitivity zones require more frames."""
    engine = ZoneEngine()
    grid = _make_grid()
    cell_idx = grid.xy_to_cell(150, 150)
    grid.cells[cell_idx] = CELL_ROOM_INSIDE | (1 << CELL_ZONE_SHIFT)
    engine.set_grid(grid)

    zone = Zone(id=1, name="Hall", sensitivity=ZONE_LOW)
    engine.set_zones([zone])

    # SENSITIVITY_LOW=8, so 7 frames shouldn't trigger
    for _ in range(7):
        result = engine.process_targets([(150, 150, True)])
    assert result.zone_occupancy[1] is False

    # 8th frame should trigger
    result = engine.process_targets([(150, 150, True)])
    assert result.zone_occupancy[1] is True

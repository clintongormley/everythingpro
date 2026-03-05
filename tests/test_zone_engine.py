"""Tests for the zone engine."""

from custom_components.everything_presence_pro.zone_engine import (
    Grid,
    Zone,
    ZoneEngine,
)
from custom_components.everything_presence_pro.const import (
    CELL_OUTSIDE,
    CELL_ROOM,
    GRID_COLS,
    GRID_ROWS,
    ZONE_EXCLUSION,
    ZONE_HIGH,
    ZONE_LOW,
    ZONE_NORMAL,
)


def test_grid_creation():
    """Test grid initializes with correct dimensions."""
    grid = Grid(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    assert grid.cell_count == 320
    assert len(grid.cells) == 320
    assert all(c == CELL_ROOM for c in grid.cells)


def test_grid_xy_to_cell():
    """Test mapping raw coordinates to grid cell index."""
    grid = Grid(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    cell = grid.xy_to_cell(0, 100)
    assert cell is not None
    assert 0 <= cell < grid.cell_count

    cell = grid.xy_to_cell(0, 7000)
    assert cell is None


def test_grid_xy_outside_fov():
    """Test coordinates outside field of view return None."""
    grid = Grid(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    cell = grid.xy_to_cell(10000, 100)
    assert cell is None


def test_zone_engine_no_zones():
    """Test zone engine with no zones defined."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    result = engine.process_targets([(1000, 2000, True)])
    assert result.device_tracking_present is True
    assert len(result.zone_occupancy) == 0


def test_zone_engine_target_in_zone():
    """Test zone engine detects target in a zone."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    cell = engine.grid.xy_to_cell(1000, 2000)
    assert cell is not None

    zone = Zone(id="z1", name="Desk", sensitivity=ZONE_NORMAL, cells=[cell])
    engine.set_zones([zone])

    result = engine.process_targets([(1000, 2000, True)])
    # With SENSITIVITY_NORMAL=3, need 3 frames to confirm
    assert result.zone_target_counts["z1"] == 1
    # First frame won't be occupied yet (need 3 consecutive)
    engine.process_targets([(1000, 2000, True)])
    result = engine.process_targets([(1000, 2000, True)])
    assert result.zone_occupancy["z1"] is True


def test_zone_engine_target_not_in_zone():
    """Test zone engine when target is outside all zones."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    zone = Zone(id="z1", name="Desk", sensitivity=ZONE_NORMAL, cells=[0])
    engine.set_zones([zone])

    result = engine.process_targets([(3000, 5000, True)])
    assert result.zone_occupancy["z1"] is False
    assert result.zone_target_counts["z1"] == 0


def test_zone_engine_exclusion_zone():
    """Test exclusion zones ignore targets."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    cell = engine.grid.xy_to_cell(1000, 2000)
    zone = Zone(id="z1", name="Fan", sensitivity=ZONE_EXCLUSION, cells=[cell])
    engine.set_zones([zone])

    result = engine.process_targets([(1000, 2000, True)])
    assert "z1" not in result.zone_occupancy


def test_zone_engine_outside_cells_ignored():
    """Test targets in outside cells are ignored."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    cell = engine.grid.xy_to_cell(1000, 2000)
    engine.grid.cells[cell] = CELL_OUTSIDE

    result = engine.process_targets([(1000, 2000, True)])
    assert result.device_tracking_present is False


def test_zone_engine_multiple_targets_same_zone():
    """Test multiple targets in the same zone."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    cell1 = engine.grid.xy_to_cell(1000, 2000)
    cell2 = engine.grid.xy_to_cell(1050, 2050)
    cells = list({cell1, cell2}) if cell1 != cell2 else [cell1]
    zone = Zone(id="z1", name="Sofa", sensitivity=ZONE_NORMAL, cells=cells)
    engine.set_zones([zone])

    result = engine.process_targets([
        (1000, 2000, True),
        (1050, 2050, True),
    ])
    assert result.zone_target_counts["z1"] >= 1


def test_zone_noncontiguous_cells():
    """Test zones with non-contiguous cells work correctly."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    cell_a = engine.grid.xy_to_cell(-1000, 1000)
    cell_b = engine.grid.xy_to_cell(1000, 4000)
    assert cell_a != cell_b

    zone = Zone(id="z1", name="Split", sensitivity=ZONE_NORMAL, cells=[cell_a, cell_b])
    engine.set_zones([zone])

    result = engine.process_targets([(-1000, 1000, True)])
    assert result.zone_target_counts["z1"] == 1

    result = engine.process_targets([(1000, 4000, True)])
    assert result.zone_target_counts["z1"] == 1


def test_zone_high_sensitivity():
    """Test high sensitivity zones respond immediately."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    cell = engine.grid.xy_to_cell(0, 3000)
    zone = Zone(id="z1", name="Bed", sensitivity=ZONE_HIGH, cells=[cell])
    engine.set_zones([zone])

    # Single frame should trigger high sensitivity zone (threshold=1)
    result = engine.process_targets([(0, 3000, True)])
    assert result.zone_occupancy["z1"] is True

"""Zone engine for grid-based presence detection."""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from .const import (
    CELL_OUTSIDE,
    CELL_ROOM,
    GRID_COLS,
    GRID_ROWS,
    SENSITIVITY_HIGH,
    SENSITIVITY_LOW,
    SENSITIVITY_NORMAL,
    ZONE_EXCLUSION,
    ZONE_HIGH,
    ZONE_LOW,
    ZONE_NORMAL,
)


@dataclass
class Zone:
    """A named zone consisting of grid cells."""

    id: str
    name: str
    sensitivity: str
    cells: list[int]


@dataclass
class ProcessingResult:
    """Result of processing target positions."""

    device_tracking_present: bool = False
    zone_occupancy: dict[str, bool] = field(default_factory=dict)
    zone_target_counts: dict[str, int] = field(default_factory=dict)


class Grid:
    """Grid overlay on the sensor's detection area."""

    def __init__(
        self,
        cols: int = GRID_COLS,
        rows: int = GRID_ROWS,
        range_mm: int = 6000,
        fov_degrees: int = 120,
    ) -> None:
        """Initialize the grid."""
        self.cols = cols
        self.rows = rows
        self.cell_count = cols * rows
        self.range_mm = range_mm
        self.fov_degrees = fov_degrees
        self.fov_rad = math.radians(fov_degrees)
        self.cells: list[str] = [CELL_ROOM] * self.cell_count

        # Pre-compute grid boundaries
        half_fov = self.fov_rad / 2
        self.x_max = range_mm * math.sin(half_fov)
        self.x_min = -self.x_max
        self.y_min = 0
        self.y_max = range_mm

        self.cell_width = (self.x_max - self.x_min) / cols
        self.cell_height = (self.y_max - self.y_min) / rows

    def xy_to_cell(self, x: float, y: float) -> int | None:
        """Map sensor X,Y coordinates (mm) to a grid cell index.

        Returns None if the point is outside the detection area.
        """
        if y <= 0:
            return None
        angle = math.atan2(abs(x), y)
        if angle > self.fov_rad / 2:
            return None

        distance = math.sqrt(x * x + y * y)
        if distance > self.range_mm:
            return None

        col = int((x - self.x_min) / self.cell_width)
        row = int(y / self.cell_height)

        col = max(0, min(col, self.cols - 1))
        row = max(0, min(row, self.rows - 1))

        return row * self.cols + col

    def cell_to_center_xy(self, cell_index: int) -> tuple[float, float]:
        """Get the center X,Y coordinates of a cell."""
        row = cell_index // self.cols
        col = cell_index % self.cols

        x = self.x_min + (col + 0.5) * self.cell_width
        y = (row + 0.5) * self.cell_height

        return x, y


class ZoneEngine:
    """Computes zone occupancy from raw target positions."""

    def __init__(
        self,
        cols: int = GRID_COLS,
        rows: int = GRID_ROWS,
        range_mm: int = 6000,
        fov_degrees: int = 120,
    ) -> None:
        """Initialize the zone engine."""
        self.grid = Grid(cols, rows, range_mm, fov_degrees)
        self._zones: list[Zone] = []
        self._cell_to_zone: dict[int, str] = {}
        self._exclusion_cells: set[int] = set()
        self._zone_frame_counts: dict[str, int] = {}
        self._sensitivity_thresholds: dict[str, int] = {
            ZONE_NORMAL: SENSITIVITY_NORMAL,
            ZONE_HIGH: SENSITIVITY_HIGH,
            ZONE_LOW: SENSITIVITY_LOW,
        }

    def set_zones(self, zones: list[Zone]) -> None:
        """Set the zone configuration."""
        self._zones = zones
        self._cell_to_zone.clear()
        self._exclusion_cells.clear()
        self._zone_frame_counts.clear()

        for zone in zones:
            if zone.sensitivity == ZONE_EXCLUSION:
                self._exclusion_cells.update(zone.cells)
            else:
                for cell in zone.cells:
                    self._cell_to_zone[cell] = zone.id
                self._zone_frame_counts[zone.id] = 0

    def process_targets(
        self, targets: list[tuple[float, float, bool]]
    ) -> ProcessingResult:
        """Process target positions and return zone occupancy.

        Args:
            targets: List of (x_mm, y_mm, active) tuples for each target.

        Returns:
            ProcessingResult with device and zone occupancy states.
        """
        result = ProcessingResult()
        zone_counts: dict[str, int] = {
            z.id: 0 for z in self._zones if z.sensitivity != ZONE_EXCLUSION
        }

        for x, y, active in targets:
            if not active:
                continue

            cell = self.grid.xy_to_cell(x, y)
            if cell is None:
                continue

            if self.grid.cells[cell] == CELL_OUTSIDE:
                continue

            if cell in self._exclusion_cells:
                continue

            result.device_tracking_present = True

            zone_id = self._cell_to_zone.get(cell)
            if zone_id is not None:
                zone_counts[zone_id] += 1

        for zone in self._zones:
            if zone.sensitivity == ZONE_EXCLUSION:
                continue

            count = zone_counts.get(zone.id, 0)
            threshold = self._sensitivity_thresholds.get(
                zone.sensitivity, SENSITIVITY_NORMAL
            )

            if count > 0:
                self._zone_frame_counts[zone.id] = (
                    self._zone_frame_counts.get(zone.id, 0) + 1
                )
            else:
                self._zone_frame_counts[zone.id] = 0

            occupied = self._zone_frame_counts[zone.id] >= threshold
            result.zone_occupancy[zone.id] = occupied
            result.zone_target_counts[zone.id] = count

        return result

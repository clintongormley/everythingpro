"""Zone engine for grid-based presence detection.

Grid uses fixed 300mm cells in room coordinate space. Cell data is stored
as a byte array where each byte encodes room/exit/zone flags.
"""

from __future__ import annotations

import base64
import math
from dataclasses import dataclass, field

from .const import (
    CELL_ROOM_MASK,
    CELL_ROOM_OUTSIDE,
    CELL_ZONE_MASK,
    CELL_ZONE_SHIFT,
    FOV_DEGREES,
    GRID_CELL_SIZE_MM,
    MAX_RANGE_MM,
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
    """A named zone with metadata."""

    id: int  # 1-7
    name: str
    sensitivity: str
    color: str = ""


@dataclass
class ProcessingResult:
    """Result of processing target positions."""

    device_tracking_present: bool = False
    zone_occupancy: dict[int, bool] = field(default_factory=dict)
    zone_target_counts: dict[int, int] = field(default_factory=dict)


class Grid:
    """Room-space grid with fixed cell size.

    Grid origin and dimensions are computed from the sensor FOV
    projected through the perspective transform into room coordinates.
    """

    def __init__(
        self,
        origin_x: float = 0.0,
        origin_y: float = 0.0,
        cols: int = 1,
        rows: int = 1,
        cell_size: int = GRID_CELL_SIZE_MM,
    ) -> None:
        """Initialize the grid."""
        self.origin_x = origin_x
        self.origin_y = origin_y
        self.cols = cols
        self.rows = rows
        self.cell_size = cell_size
        self.cell_count = cols * rows
        # Byte array: one byte per cell
        self.cells = bytearray(self.cell_count)

    def xy_to_cell(self, x: float, y: float) -> int | None:
        """Map room coordinates to a grid cell index.

        Returns None if the point is outside the grid.
        """
        col = int((x - self.origin_x) / self.cell_size)
        row = int((y - self.origin_y) / self.cell_size)
        if col < 0 or col >= self.cols or row < 0 or row >= self.rows:
            return None
        return row * self.cols + col

    def cell_zone(self, cell_index: int) -> int:
        """Get the zone number for a cell (0 = no zone)."""
        return (self.cells[cell_index] & CELL_ZONE_MASK) >> CELL_ZONE_SHIFT

    def cell_is_room(self, cell_index: int) -> bool:
        """Check if a cell is inside the room."""
        return (self.cells[cell_index] & CELL_ROOM_MASK) != CELL_ROOM_OUTSIDE

    def load_from_bytes(self, data: bytes) -> None:
        """Load cell data from bytes."""
        count = min(len(data), self.cell_count)
        self.cells[:count] = data[:count]

    def to_base64(self) -> str:
        """Serialize cell data to base64."""
        return base64.b64encode(bytes(self.cells)).decode("ascii")

    @staticmethod
    def from_base64(
        data: str,
        cols: int,
        rows: int,
        origin_x: float,
        origin_y: float,
    ) -> Grid:
        """Deserialize grid from base64 cell data."""
        grid = Grid(origin_x=origin_x, origin_y=origin_y, cols=cols, rows=rows)
        raw = base64.b64decode(data)
        grid.load_from_bytes(raw)
        return grid

    @staticmethod
    def compute_extent(
        perspective: list[float],
        room_width: float,
        room_depth: float,
        cell_size: int = GRID_CELL_SIZE_MM,
    ) -> tuple[float, float, int, int]:
        """Compute grid origin and dimensions from FOV projected through perspective.

        Samples the 120 degree FOV boundary at 6m range, transforms through
        the perspective matrix, and computes the bounding box.

        Returns (origin_x, origin_y, cols, rows).
        """
        if not perspective or len(perspective) != 8:
            # No perspective — default to room size
            cols = max(1, int(math.ceil(room_width / cell_size)))
            rows = max(1, int(math.ceil(room_depth / cell_size)))
            return 0.0, 0.0, cols, rows

        a, b, c, d, e, f, g, h = perspective

        # Sample FOV boundary: every 2 degrees along the arc at max range, plus origin
        points: list[tuple[float, float]] = [(0.0, 0.0)]  # sensor origin
        for deg in range(-FOV_DEGREES // 2, FOV_DEGREES // 2 + 1, 2):
            angle = math.radians(deg)
            sx = MAX_RANGE_MM * math.sin(angle)
            sy = MAX_RANGE_MM * math.cos(angle)
            points.append((sx, sy))

        # Transform all points
        min_x = float("inf")
        min_y = float("inf")
        max_x = float("-inf")
        max_y = float("-inf")
        for sx, sy in points:
            denom = g * sx + h * sy + 1.0
            if abs(denom) < 1e-10:
                continue
            rx = (a * sx + b * sy + c) / denom
            ry = (d * sx + e * sy + f) / denom
            min_x = min(min_x, rx)
            min_y = min(min_y, ry)
            max_x = max(max_x, rx)
            max_y = max(max_y, ry)

        # Snap to cell boundaries
        origin_x = math.floor(min_x / cell_size) * cell_size
        origin_y = math.floor(min_y / cell_size) * cell_size
        end_x = math.ceil(max_x / cell_size) * cell_size
        end_y = math.ceil(max_y / cell_size) * cell_size

        cols = max(1, int((end_x - origin_x) / cell_size))
        rows = max(1, int((end_y - origin_y) / cell_size))

        return origin_x, origin_y, cols, rows


class ZoneEngine:
    """Computes zone occupancy from transformed target positions."""

    def __init__(self) -> None:
        """Initialize the zone engine."""
        self.grid = Grid()
        self._zones: list[Zone] = []
        self._zone_frame_counts: dict[int, int] = {}
        self._sensitivity_thresholds: dict[str, int] = {
            ZONE_NORMAL: SENSITIVITY_NORMAL,
            ZONE_HIGH: SENSITIVITY_HIGH,
            ZONE_LOW: SENSITIVITY_LOW,
        }

    def set_grid(self, grid: Grid) -> None:
        """Set the grid."""
        self.grid = grid

    def set_zones(self, zones: list[Zone]) -> None:
        """Set the zone configuration."""
        self._zones = zones
        self._zone_frame_counts.clear()
        for zone in zones:
            if zone.sensitivity != ZONE_EXCLUSION:
                self._zone_frame_counts[zone.id] = 0

    def process_targets(
        self, targets: list[tuple[float, float, bool]]
    ) -> ProcessingResult:
        """Process target positions and return zone occupancy.

        Args:
            targets: List of (room_x_mm, room_y_mm, active) tuples.

        Returns:
            ProcessingResult with device and zone occupancy states.
        """
        result = ProcessingResult()
        zone_counts: dict[int, int] = {
            z.id: 0 for z in self._zones if z.sensitivity != ZONE_EXCLUSION
        }

        for x, y, active in targets:
            if not active:
                continue

            cell = self.grid.xy_to_cell(x, y)
            if cell is None:
                continue

            if not self.grid.cell_is_room(cell):
                continue

            zone_id = self.grid.cell_zone(cell)

            result.device_tracking_present = True

            if zone_id > 0 and zone_id in zone_counts:
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

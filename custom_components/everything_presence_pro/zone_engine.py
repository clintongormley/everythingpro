"""Zone engine for grid-based presence detection.

Grid uses fixed 300mm cells in room coordinate space. Cell data is stored
as a byte array where each byte encodes room/zone flags. A 1-second
tumbling window converts raw frames into per-zone hit counts, which feed
a three-state occupancy machine (CLEAR/OCCUPIED/PENDING).
"""

from __future__ import annotations

import base64
import enum
import logging
import math
from dataclasses import dataclass, field
from statistics import median

_LOGGER = logging.getLogger(__name__)

from .const import (
    CELL_ROOM_BIT,
    CELL_ZONE_MASK,
    CELL_ZONE_SHIFT,
    FOV_DEGREES,
    GRID_CELL_SIZE_MM,
    MAX_RANGE_MM,
    MAX_TARGETS,
    RAW_FPS,
    ZONE_TYPE_DEFAULTS,
    ZONE_TYPE_NORMAL,
    threshold_to_frame_count,
)


@dataclass
class Zone:
    """A named zone with metadata."""

    id: int  # 1-7
    name: str
    type: str  # "normal" | "entrance" | "thoroughfare" | "rest"
    color: str = ""
    trigger: int = 5  # 0-9 threshold, 0=disabled, higher=harder
    sustain: int = 3  # 0-9 threshold, 0=disabled, higher=harder
    timeout: float = 10.0  # seconds


class ZoneState(enum.Enum):
    """Zone occupancy state."""

    CLEAR = "clear"
    OCCUPIED = "occupied"
    PENDING = "pending"


@dataclass
class ProcessingResult:
    """Result of processing a tumbling window."""

    device_tracking_present: bool = False
    zone_occupancy: dict[int, bool] = field(default_factory=dict)
    zone_target_counts: dict[int, int] = field(default_factory=dict)
    target_signals: list[int] = field(default_factory=list)  # per-target signal 0-9
    frame_count: int = 0


@dataclass
class TargetWindow:
    """Per-target result from one tumbling window."""

    median_x: float = 0.0
    median_y: float = 0.0
    frame_count: int = 0  # how many frames this target was active
    active: bool = False


@dataclass
class WindowOutput:
    """Output from one tumbling window tick."""

    targets: list[TargetWindow] = field(default_factory=list)
    total_frames: int = 0  # total frames in this window


class Grid:
    """Room-space grid with fixed cell size."""

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
        self.cells = bytearray(self.cell_count)

    def xy_to_cell(self, x: float, y: float) -> int | None:
        """Map room coordinates to a grid cell index."""
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
        return bool(self.cells[cell_index] & CELL_ROOM_BIT)

    def load_from_bytes(self, data: bytes) -> None:
        """Load cell data from bytes."""
        count = min(len(data), self.cell_count)
        self.cells[:count] = data[:count]

    def to_base64(self) -> str:
        """Serialize cell data to base64."""
        return base64.b64encode(bytes(self.cells)).decode("ascii")

    @staticmethod
    def from_base64(
        data: str, cols: int, rows: int, origin_x: float, origin_y: float,
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
        """Compute grid origin and dimensions from FOV projected through perspective."""
        if not perspective or len(perspective) != 8:
            cols = max(1, int(math.ceil(room_width / cell_size)))
            rows = max(1, int(math.ceil(room_depth / cell_size)))
            return 0.0, 0.0, cols, rows

        a, b, c, d, e, f, g, h = perspective
        points: list[tuple[float, float]] = [(0.0, 0.0)]
        for deg in range(-FOV_DEGREES // 2, FOV_DEGREES // 2 + 1, 2):
            angle = math.radians(deg)
            sx = MAX_RANGE_MM * math.sin(angle)
            sy = MAX_RANGE_MM * math.cos(angle)
            points.append((sx, sy))

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

        origin_x = math.floor(min_x / cell_size) * cell_size
        origin_y = math.floor(min_y / cell_size) * cell_size
        end_x = math.ceil(max_x / cell_size) * cell_size
        end_y = math.ceil(max_y / cell_size) * cell_size

        cols = max(1, int((end_x - origin_x) / cell_size))
        rows = max(1, int((end_y - origin_y) / cell_size))
        return origin_x, origin_y, cols, rows


class TumblingWindow:
    """1-second tumbling window that collects raw target positions."""

    def __init__(self, grid: Grid, interval_s: float = 1.0) -> None:
        """Initialize the tumbling window."""
        self._grid = grid
        self._interval_s = interval_s
        self._window_start: float | None = None
        self._frame_count = 0
        self._target_xs: list[list[float]] = [[] for _ in range(MAX_TARGETS)]
        self._target_ys: list[list[float]] = [[] for _ in range(MAX_TARGETS)]

    @property
    def grid(self) -> Grid:
        """Return the grid."""
        return self._grid

    @grid.setter
    def grid(self, grid: Grid) -> None:
        """Set the grid and reset the window."""
        self._grid = grid
        self.reset()

    def reset(self) -> None:
        """Reset the window state."""
        self._window_start = None
        self._frame_count = 0
        for i in range(MAX_TARGETS):
            self._target_xs[i].clear()
            self._target_ys[i].clear()

    def feed(
        self, targets: list[tuple[float, float, bool]], timestamp: float,
    ) -> WindowOutput | None:
        """Feed a raw frame. Returns WindowOutput when the window completes."""
        if self._window_start is None:
            self._window_start = timestamp

        # Check if this frame starts a new window
        if timestamp - self._window_start >= self._interval_s:
            output = self._emit()
            self._window_start = timestamp
            self._accumulate(targets)
            return output

        self._accumulate(targets)
        return None

    def _accumulate(self, targets: list[tuple[float, float, bool]]) -> None:
        """Accumulate one frame of target data."""
        self._frame_count += 1
        for i, (x, y, active) in enumerate(targets):
            if i >= MAX_TARGETS:
                break
            if not active:
                continue
            self._target_xs[i].append(x)
            self._target_ys[i].append(y)

    def _emit(self) -> WindowOutput:
        """Emit the completed window and reset accumulators."""
        targets: list[TargetWindow] = []
        for i in range(MAX_TARGETS):
            xs = self._target_xs[i]
            ys = self._target_ys[i]
            if xs:
                targets.append(TargetWindow(
                    median_x=median(xs),
                    median_y=median(ys),
                    frame_count=len(xs),
                    active=True,
                ))
            else:
                targets.append(TargetWindow())

        total = self._frame_count
        _LOGGER.debug(
            "Window emit: %d frames, targets: %s",
            total,
            [(t.frame_count, t.active) for t in targets],
        )

        output = WindowOutput(targets=targets, total_frames=total)

        # Reset accumulators
        self._frame_count = 0
        for i in range(MAX_TARGETS):
            self._target_xs[i].clear()
            self._target_ys[i].clear()

        return output


@dataclass
class _ZoneRuntime:
    """Runtime state for a single zone's state machine."""

    zone: Zone
    state: ZoneState = ZoneState.CLEAR
    pending_since: float | None = None


class ZoneEngine:
    """Computes zone occupancy from raw target positions via tumbling window."""

    def __init__(
        self,
        grid: Grid | None = None,
        zones: list[Zone] | None = None,
    ) -> None:
        """Initialize the zone engine."""
        self._window = TumblingWindow(grid=grid or Grid())
        self._zone_runtimes: dict[int, _ZoneRuntime] = {}
        if zones:
            self.set_zones(zones)

    @property
    def grid(self) -> Grid:
        """Return the grid."""
        return self._window.grid

    def set_grid(self, grid: Grid) -> None:
        """Set the grid."""
        self._window.grid = grid

    def set_zones(self, zones: list[Zone]) -> None:
        """Set the zone configuration and reset state machines.

        Always includes zone 0 (room-level) with normal type defaults.
        """
        defaults = ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL]
        room_zone = Zone(
            id=0, name="Room", type=ZONE_TYPE_NORMAL,
            trigger=defaults["trigger"],
            sustain=defaults["sustain"],
            timeout=defaults["timeout"],
        )
        self._zone_runtimes = {0: _ZoneRuntime(zone=room_zone)}
        for z in zones:
            self._zone_runtimes[z.id] = _ZoneRuntime(zone=z)

    def feed_raw(
        self, targets: list[tuple[float, float, bool]], timestamp: float,
    ) -> ProcessingResult | None:
        """Feed a raw frame. Returns ProcessingResult when the window ticks."""
        window_output = self._window.feed(targets, timestamp)
        if window_output is None:
            return None
        return self._tick(window_output, timestamp)

    def _tick(
        self, window: WindowOutput, timestamp: float,
    ) -> ProcessingResult:
        """Run one tick of the state machine for all zones.

        Per-target model:
        1. For each target, compute median position → cell → zone
        2. Compare target's frame count against zone threshold
        3. If passes → target is confirmed present in that zone
        4. Zone has a confirmed target → feed into state machine
        """
        frames = max(window.total_frames, RAW_FPS)
        result = ProcessingResult(frame_count=frames)
        grid = self._window.grid

        # Evaluate each target: is it confirmed present in a zone?
        zone_confirmed: dict[int, bool] = {}  # zone_id → has confirmed target
        zone_signal: dict[int, int] = {}  # zone_id → best signal strength
        target_signals: list[int] = []

        for tw in window.targets:
            if not tw.active:
                target_signals.append(0)
                continue
            signal = min(tw.frame_count, 9)
            cell = grid.xy_to_cell(tw.median_x, tw.median_y)
            if cell is None or not grid.cell_is_room(cell):
                target_signals.append(signal)
                continue

            target_signals.append(signal)
            zone_id = grid.cell_zone(cell)

            # Track best signal per zone for display
            zone_signal[zone_id] = max(zone_signal.get(zone_id, 0), signal)

            # Check against zone threshold
            if zone_id in self._zone_runtimes:
                rt = self._zone_runtimes[zone_id]
                trigger_thresh = threshold_to_frame_count(rt.zone.trigger)
                sustain_thresh = threshold_to_frame_count(rt.zone.sustain)

                match rt.state:
                    case ZoneState.CLEAR:
                        if tw.frame_count >= trigger_thresh:
                            zone_confirmed[zone_id] = True
                    case ZoneState.OCCUPIED | ZoneState.PENDING:
                        if tw.frame_count >= sustain_thresh:
                            zone_confirmed[zone_id] = True

        # Run state machine per zone
        for zone_id, rt in self._zone_runtimes.items():
            confirmed = zone_confirmed.get(zone_id, False)
            result.zone_target_counts[zone_id] = zone_signal.get(zone_id, 0)

            match rt.state:
                case ZoneState.CLEAR:
                    if confirmed:
                        rt.state = ZoneState.OCCUPIED
                        rt.pending_since = None

                case ZoneState.OCCUPIED:
                    if not confirmed:
                        rt.state = ZoneState.PENDING
                        rt.pending_since = timestamp

                case ZoneState.PENDING:
                    if confirmed:
                        rt.state = ZoneState.OCCUPIED
                        rt.pending_since = None
                    elif (
                        rt.pending_since is not None
                        and timestamp - rt.pending_since >= rt.zone.timeout
                    ):
                        rt.state = ZoneState.CLEAR
                        rt.pending_since = None

            result.zone_occupancy[zone_id] = rt.state != ZoneState.CLEAR

        result.target_signals = target_signals

        # Room is occupied if any zone (including zone 0) is occupied
        result.device_tracking_present = any(result.zone_occupancy.values())

        _LOGGER.debug(
            "Tick: frames=%d, confirmed=%s, signal=%s, occupancy=%s",
            frames,
            dict(zone_confirmed),
            dict(zone_signal),
            dict(result.zone_occupancy),
        )

        return result

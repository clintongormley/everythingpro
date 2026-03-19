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
    ENTRY_POINT_ZONE_TYPES,
    FOV_DEGREES,
    GRID_CELL_SIZE_MM,
    MAX_MOVEMENT_CELLS,
    MAX_RANGE_MM,
    MAX_TARGETS,
    RAW_FPS,
    ZONE_TYPE_CUSTOM,
    ZONE_TYPE_DEFAULTS,
    ZONE_TYPE_NORMAL,
    threshold_to_frame_count,
)


@dataclass
class Zone:
    """A named zone with metadata."""

    id: int  # 1-7
    name: str
    type: str  # "normal" | "entrance" | "thoroughfare" | "rest" | "custom"
    color: str = ""
    trigger: int = 5  # 1-9 threshold, higher=harder to trigger
    renew: int = 3  # 1-9 threshold, higher=harder
    timeout: float = 10.0  # seconds
    transfer_timeout: float = 3.0  # seconds, time for zone to clear after target leaves
    entry_point: bool = False  # derived from type, explicit for custom

    def __post_init__(self) -> None:
        """Derive entry point flag from type if not custom."""
        if self.type != ZONE_TYPE_CUSTOM:
            self.entry_point = self.type in ENTRY_POINT_ZONE_TYPES


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
    pending_targets: list[dict] = field(default_factory=list)


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
    confirmed_targets: set[int] = field(default_factory=set)


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
        self._target_prev: list[tuple[int, int] | None] = [None] * MAX_TARGETS
        self._target_prev_xy: list[tuple[float, float] | None] = [None] * MAX_TARGETS
        self._target_gate_count: list[int] = [0] * MAX_TARGETS
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
            renew=defaults["renew"],
            timeout=defaults["timeout"],
            transfer_timeout=defaults["transfer_timeout"],
        )
        self._zone_runtimes = {0: _ZoneRuntime(zone=room_zone)}
        for z in zones:
            self._zone_runtimes[z.id] = _ZoneRuntime(zone=z)
        self._target_prev = [None] * MAX_TARGETS
        self._target_prev_xy = [None] * MAX_TARGETS
        self._target_gate_count = [0] * MAX_TARGETS

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

        Per-target model with entry point gating, distance continuity, and handoff:
        1. For each target, compute median position → cell → zone
        2. Check continuity from previous tick (Chebyshev distance)
        3. Entry point gating: non-entry-point zones require 2 consecutive
           qualifying ticks at doubled threshold before confirming a new
           (non-continuous) target
        4. Target handoff: when a target moves between zones, the source zone
           clears after transfer_timeout seconds
        """
        frames = max(window.total_frames, RAW_FPS)
        result = ProcessingResult(frame_count=frames)
        grid = self._window.grid

        # Evaluate each target: is it confirmed present in a zone?
        zone_confirmed: dict[int, bool] = {}  # zone_id → has confirmed target
        zone_signal: dict[int, int] = {}  # zone_id → best signal strength
        target_signals: list[int] = []

        # Track per-target zone assignments for handoff detection
        target_zone_prev: list[int | None] = [None] * MAX_TARGETS
        target_zone_curr: list[int | None] = [None] * MAX_TARGETS

        for i, tw in enumerate(window.targets):
            if not tw.active:
                target_signals.append(0)
                # Target gone: clear its tracking state
                self._target_prev[i] = None
                self._target_gate_count[i] = 0
                continue

            signal = min(tw.frame_count, 9)
            cell = grid.xy_to_cell(tw.median_x, tw.median_y)
            if cell is None or not grid.cell_is_room(cell):
                target_signals.append(signal)
                self._target_prev[i] = None
                self._target_gate_count[i] = 0
                continue

            target_signals.append(signal)
            zone_id = grid.cell_zone(cell)
            target_zone_curr[i] = zone_id

            # Store actual x,y for faded-dot rendering
            self._target_prev_xy[i] = (tw.median_x, tw.median_y)

            # Compute current cell position as (col, row)
            col = int((tw.median_x - grid.origin_x) / grid.cell_size)
            row = int((tw.median_y - grid.origin_y) / grid.cell_size)
            current_pos = (col, row)

            # Determine previous zone from previous position
            prev = self._target_prev[i]
            if prev is not None:
                prev_cell = grid.xy_to_cell(
                    grid.origin_x + prev[0] * grid.cell_size + grid.cell_size / 2,
                    grid.origin_y + prev[1] * grid.cell_size + grid.cell_size / 2,
                )
                if prev_cell is not None:
                    target_zone_prev[i] = grid.cell_zone(prev_cell)

            # Continuity check: Chebyshev distance from previous position
            continuous = False
            if prev is not None:
                dist = max(abs(col - prev[0]), abs(row - prev[1]))
                continuous = dist <= MAX_MOVEMENT_CELLS

            # Track best signal per zone for display
            zone_signal[zone_id] = max(zone_signal.get(zone_id, 0), signal)

            # Determine if this target is confirmed in this zone
            if zone_id in self._zone_runtimes:
                rt = self._zone_runtimes[zone_id]
                trigger_thresh = threshold_to_frame_count(rt.zone.trigger)
                renew_thresh = threshold_to_frame_count(rt.zone.renew)

                # Determine effective threshold based on zone state
                match rt.state:
                    case ZoneState.CLEAR:
                        base_thresh = trigger_thresh
                    case ZoneState.OCCUPIED | ZoneState.PENDING:
                        base_thresh = renew_thresh

                entry_point = rt.zone.entry_point
                needs_gating = not entry_point and not continuous

                if needs_gating and rt.state == ZoneState.CLEAR:
                    # Entry point gating: double threshold, cap at 9
                    gated_thresh = min(base_thresh * 2, 9)
                    if tw.frame_count >= gated_thresh:
                        self._target_gate_count[i] += 1
                        if self._target_gate_count[i] >= 2:
                            # Confirmed after 2 qualifying ticks
                            zone_confirmed[zone_id] = True
                            rt.confirmed_targets.add(i)
                            self._target_prev[i] = current_pos
                            self._target_gate_count[i] = 0
                        else:
                            # gate_count == 1: record position for next
                            # tick's distance check but don't confirm
                            self._target_prev[i] = current_pos
                    else:
                        # Below gated threshold: reset tracking
                        self._target_prev[i] = None
                        self._target_gate_count[i] = 0
                else:
                    # Not gated: entry point zone, continuous movement,
                    # or already occupied/pending
                    if tw.frame_count >= base_thresh:
                        zone_confirmed[zone_id] = True
                        rt.confirmed_targets.add(i)
                        self._target_prev[i] = current_pos
                        self._target_gate_count[i] = 0
                    else:
                        self._target_prev[i] = current_pos
            else:
                # No runtime for this zone (e.g. zone 0 room default)
                # Still record position for continuity tracking
                self._target_prev[i] = current_pos

        # Target handoff: detect targets that moved between zones
        for i in range(len(window.targets)):
            prev_zid = target_zone_prev[i]
            curr_zid = target_zone_curr[i]
            if prev_zid is None or curr_zid is None or prev_zid == curr_zid:
                continue
            # Target i moved from prev_zid to curr_zid
            _LOGGER.debug(
                "Handoff: target %d moved zone %d→%d", i, prev_zid, curr_zid,
            )
            if prev_zid in self._zone_runtimes:
                src_rt = self._zone_runtimes[prev_zid]
                # Remove this target from the source zone's confirmed set
                src_rt.confirmed_targets.discard(i)
                # If this was the last confirmed target in the source zone
                # and the zone is occupied, accelerate its pending timeout
                if (
                    not src_rt.confirmed_targets
                    and src_rt.state == ZoneState.OCCUPIED
                ):
                    src_rt.state = ZoneState.PENDING
                    src_rt.pending_since = timestamp - (src_rt.zone.timeout - src_rt.zone.transfer_timeout)
                    _LOGGER.debug(
                        "Handoff: zone %d → PENDING, transfer_timeout=%.1f",
                        prev_zid, src_rt.zone.transfer_timeout,
                    )

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
                        rt.confirmed_targets.clear()

            result.zone_occupancy[zone_id] = rt.state != ZoneState.CLEAR

        result.target_signals = target_signals

        # Build pending targets list: targets that disappeared (inactive) but
        # are still in a zone's confirmed_targets while that zone is PENDING.
        # Handoff targets are already removed from confirmed_targets, so they
        # won't appear here.
        active_targets = {
            i for i, tw in enumerate(window.targets) if tw.active
        }
        for zone_id, rt in self._zone_runtimes.items():
            if rt.state != ZoneState.PENDING:
                continue
            for target_idx in rt.confirmed_targets:
                if target_idx in active_targets:
                    continue
                xy = self._target_prev_xy[target_idx]
                if xy is None:
                    continue
                result.pending_targets.append({
                    "x": xy[0],
                    "y": xy[1],
                    "target_index": target_idx,
                    "zone_id": zone_id,
                })

        # Room is occupied if any zone (including zone 0) is occupied
        result.device_tracking_present = any(result.zone_occupancy.values())

        _LOGGER.debug(
            "Tick: frames=%d, target_zones=%s, confirmed=%s, signal=%s, occupancy=%s",
            frames,
            {i: z for i, z in enumerate(target_zone_curr) if z is not None},
            dict(zone_confirmed),
            dict(zone_signal),
            dict(result.zone_occupancy),
        )

        return result

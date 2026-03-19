# Zone types and occupancy state machine implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current sensitivity string/int system with zone types (normal/entrance/thoroughfare/rest) that drive a three-state occupancy machine (CLEAR/OCCUPIED/PENDING) using per-zone hit counts from raw LD2450 frames.

**Architecture:** The LD2450 reports ~33 raw frames/second. A 1-second tumbling window collects raw frames and counts how many land in each zone. The zone engine state machine ticks once per window, comparing hit counts against sensitivity-derived thresholds to decide occupancy transitions. Zone types set default trigger/sustain/timeout values.

**Tech Stack:** Python 3.13+, ESPHome API (aioesphomeapi), Home Assistant custom integration

**Spec:** `docs/superpowers/specs/2026-03-18-zone-types-occupancy-state-machine-design.md`

---

## File structure

| File | Action | Responsibility |
|------|--------|---------------|
| `const.py` | Modify | New cell encoding constants, zone type definitions with defaults, sensitivity helpers |
| `zone_engine.py` | Modify | Zone dataclass (add type/trigger/sustain/timeout), OccupancyState enum, ZoneStateMachine, tumbling window hit counting, new Grid bit accessors |
| `coordinator.py` | Modify | Wire tumbling window into rebuild cycle, pass zone metadata, adapt config serialization |
| `websocket_api.py` | Modify | Update zone_slots schema (type/trigger/sustain/timeout instead of sensitivity int), update subscribe_targets to emit zone states |
| `binary_sensor.py` | Modify | Update `zone_target_counts` → `zone_hit_counts` reference |
| `sensor.py` | Modify | Update `zone_target_counts` → `zone_hit_counts` reference |
| `tests/test_zone_engine.py` | Create | Tests for all zone engine changes |
| `tests/test_coordinator.py` | Create | Tests for tumbling window and config serialization |

All paths relative to: `custom_components/everything_presence_pro/`

---

## Task 1: Update const.py — new cell encoding and zone type constants

**Files:**
- Modify: `const.py`
- Create: `tests/test_zone_engine.py`

- [ ] **Step 1: Write tests for new constants**

Create `tests/test_zone_engine.py`:

```python
"""Tests for zone engine constants and helpers."""

from custom_components.everything_presence_pro.const import (
    CELL_ROOM_BIT,
    CELL_ZONE_MASK,
    CELL_ZONE_SHIFT,
    CELL_TRAINING_MASK,
    CELL_TRAINING_SHIFT,
    MAX_ZONES,
    ZONE_TYPES,
    sensitivity_to_threshold,
)


def test_cell_encoding_no_overlap():
    """Verify bit fields don't overlap."""
    assert CELL_ROOM_BIT & CELL_ZONE_MASK == 0
    assert CELL_ROOM_BIT & CELL_TRAINING_MASK == 0
    assert CELL_ZONE_MASK & CELL_TRAINING_MASK == 0
    # All bits covered
    assert CELL_ROOM_BIT | CELL_ZONE_MASK | CELL_TRAINING_MASK == 0xFF


def test_zone_shift_extracts_correctly():
    """Verify zone extraction from a cell byte."""
    # Zone 5 in bits 1-3: 5 << 1 = 0x0A, plus room bit
    cell = 0x01 | (5 << CELL_ZONE_SHIFT)
    assert (cell & CELL_ZONE_MASK) >> CELL_ZONE_SHIFT == 5


def test_max_zone_fits_in_bits():
    """Verify MAX_ZONES fits in the 3-bit zone field."""
    assert MAX_ZONES <= (CELL_ZONE_MASK >> CELL_ZONE_SHIFT)


def test_zone_types_have_required_keys():
    """Each zone type must define trigger, sustain, timeout."""
    for type_name, defaults in ZONE_TYPES.items():
        assert "trigger" in defaults, f"{type_name} missing trigger"
        assert "sustain" in defaults, f"{type_name} missing sustain"
        assert "timeout" in defaults, f"{type_name} missing timeout"
        assert 0 <= defaults["trigger"] <= 9
        assert 0 <= defaults["sustain"] <= 9
        assert defaults["timeout"] > 0


def test_sensitivity_to_threshold():
    """Verify sensitivity-to-threshold conversion."""
    assert sensitivity_to_threshold(0) == 33  # least sensitive
    assert sensitivity_to_threshold(9) == 3   # most sensitive
    assert sensitivity_to_threshold(5) == 17  # mid
    # All values in valid range
    for s in range(10):
        t = sensitivity_to_threshold(s)
        assert 1 <= t <= 33
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_zone_engine.py -v`
Expected: ImportError — new constants don't exist yet.

- [ ] **Step 3: Update const.py**

Replace the cell encoding section and sensitivity section in `const.py`:

```python
# Sensitivity defaults — REMOVE these:
# SENSITIVITY_NORMAL = 3
# SENSITIVITY_HIGH = 1
# SENSITIVITY_LOW = 8

# Zone sensitivity types — REMOVE these:
# ZONE_NORMAL = "normal"
# ZONE_HIGH = "high"
# ZONE_LOW = "low"
# ZONE_EXCLUSION = "exclusion"

# Old cell encoding — REMOVE these:
# CELL_ROOM_MASK = 0x03
# CELL_ROOM_OUTSIDE = 0x00
# CELL_ROOM_INSIDE = 0x01
# CELL_ROOM_ENTRANCE = 0x02
# CELL_ROOM_INTERFERENCE = 0x03
# CELL_ZONE_MASK = 0x1C
# CELL_ZONE_SHIFT = 2
# CELL_TRAINING_MASK = 0xE0
# CELL_TRAINING_SHIFT = 5

# ADD — new cell encoding (spec: grid byte encoding revised):
# Bit 0: room flag (0=outside, 1=inside)
# Bits 1-3: zone number (0=room default, 1-7=named zone)
# Bits 4-7: per-cell training (reserved)
CELL_ROOM_BIT = 0x01
CELL_ZONE_MASK = 0x0E
CELL_ZONE_SHIFT = 1
CELL_TRAINING_MASK = 0xF0
CELL_TRAINING_SHIFT = 4

# ADD — raw LD2450 frame rate for hit-count calculation
RAW_FPS = 33

# ADD — zone types with default sensitivity values
ZONE_TYPES: dict[str, dict[str, int | float]] = {
    "normal": {"trigger": 5, "sustain": 7, "timeout": 10},
    "entrance": {"trigger": 7, "sustain": 8, "timeout": 5},
    "thoroughfare": {"trigger": 7, "sustain": 8, "timeout": 3},
    "rest": {"trigger": 3, "sustain": 9, "timeout": 30},
}


def sensitivity_to_threshold(sensitivity: int, raw_fps: int = RAW_FPS) -> int:
    """Convert 0-9 sensitivity to minimum hit-count threshold.

    Higher sensitivity = fewer frames needed = lower threshold.
    Uses integer arithmetic to avoid Python's banker's rounding.
    """
    return max(1, (raw_fps * (10 - sensitivity) + 5) // 10)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_zone_engine.py -v`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add const.py tests/test_zone_engine.py
git commit -m "feat: new cell encoding and zone type constants"
```

---

## Task 2: Update Zone dataclass and Grid bit accessors

**Files:**
- Modify: `zone_engine.py`
- Modify: `tests/test_zone_engine.py`

- [ ] **Step 1: Write tests for updated Zone and Grid**

Append to `tests/test_zone_engine.py`:

```python
from custom_components.everything_presence_pro.zone_engine import Grid, Zone
from custom_components.everything_presence_pro.const import (
    CELL_ROOM_BIT,
    CELL_ZONE_SHIFT,
    ZONE_TYPES,
)


def test_zone_from_type():
    """Zone created from a type gets correct defaults."""
    z = Zone(id=1, name="Door", type="entrance", color="#ff0000")
    assert z.trigger == 7
    assert z.sustain == 8
    assert z.timeout == 5


def test_zone_custom_overrides():
    """Zone with explicit trigger/sustain/timeout ignores type defaults."""
    z = Zone(id=1, name="Door", type="entrance", color="#ff0000",
             trigger=3, sustain=5, timeout=20)
    assert z.trigger == 3
    assert z.sustain == 5
    assert z.timeout == 20


def test_grid_cell_is_room_new_encoding():
    """Grid.cell_is_room uses bit 0."""
    grid = Grid(cols=2, rows=1)
    grid.cells[0] = CELL_ROOM_BIT  # inside
    grid.cells[1] = 0x00  # outside
    assert grid.cell_is_room(0) is True
    assert grid.cell_is_room(1) is False


def test_grid_cell_zone_new_encoding():
    """Grid.cell_zone uses bits 1-3."""
    grid = Grid(cols=1, rows=1)
    grid.cells[0] = CELL_ROOM_BIT | (3 << CELL_ZONE_SHIFT)
    assert grid.cell_zone(0) == 3
```

- [ ] **Step 2: Run tests to verify new tests fail**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_zone_engine.py -v`
Expected: New tests fail — Zone doesn't accept `type` parameter yet.

- [ ] **Step 3: Update Zone dataclass and Grid methods**

In `zone_engine.py`, update imports and Zone:

```python
# Update imports — remove old constants, add new ones:
from .const import (
    CELL_ROOM_BIT,
    CELL_ZONE_MASK,
    CELL_ZONE_SHIFT,
    FOV_DEGREES,
    GRID_CELL_SIZE_MM,
    MAX_RANGE_MM,
    ZONE_TYPES,
    sensitivity_to_threshold,
)


@dataclass
class Zone:
    """A named zone with type-driven sensitivity defaults."""

    id: int  # 1-7
    name: str
    type: str = "normal"  # normal | entrance | thoroughfare | rest
    color: str = ""
    trigger: int = -1  # 0-9, -1 = use type default
    sustain: int = -1  # 0-9, -1 = use type default
    timeout: float = -1  # seconds, -1 = use type default

    def __post_init__(self) -> None:
        """Fill in defaults from zone type if not explicitly set."""
        defaults = ZONE_TYPES.get(self.type, ZONE_TYPES["normal"])
        if self.trigger == -1:
            self.trigger = defaults["trigger"]
        if self.sustain == -1:
            self.sustain = defaults["sustain"]
        if self.timeout == -1:
            self.timeout = defaults["timeout"]
```

Update `Grid.cell_is_room` and `Grid.cell_zone`:

```python
def cell_zone(self, cell_index: int) -> int:
    """Get the zone number for a cell (0 = no zone)."""
    return (self.cells[cell_index] & CELL_ZONE_MASK) >> CELL_ZONE_SHIFT

def cell_is_room(self, cell_index: int) -> bool:
    """Check if a cell is inside the room."""
    return bool(self.cells[cell_index] & CELL_ROOM_BIT)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_zone_engine.py -v`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add zone_engine.py tests/test_zone_engine.py
git commit -m "feat: zone dataclass with type defaults, grid new bit encoding"
```

---

## Task 3: Occupancy state machine

**Files:**
- Modify: `zone_engine.py`
- Modify: `tests/test_zone_engine.py`

- [ ] **Step 1: Write tests for the state machine**

Append to `tests/test_zone_engine.py`:

```python
import time
from unittest.mock import patch

from custom_components.everything_presence_pro.zone_engine import (
    OccupancyState,
    ZoneStateMachine,
)
from custom_components.everything_presence_pro.const import sensitivity_to_threshold


def test_clear_to_occupied():
    """Zone transitions from CLEAR to OCCUPIED when hit count meets trigger threshold."""
    zone = Zone(id=1, name="Test", type="normal")  # trigger=5 → threshold=17
    sm = ZoneStateMachine(zone)
    assert sm.state == OccupancyState.CLEAR
    sm.tick(hit_count=20)  # 20 >= 17
    assert sm.state == OccupancyState.OCCUPIED


def test_clear_stays_clear_below_threshold():
    """Zone stays CLEAR when hit count is below trigger threshold."""
    zone = Zone(id=1, name="Test", type="normal")  # trigger=5 → threshold=17
    sm = ZoneStateMachine(zone)
    sm.tick(hit_count=10)  # 10 < 17
    assert sm.state == OccupancyState.CLEAR


def test_occupied_to_pending():
    """Zone transitions to PENDING when hit count drops below sustain threshold."""
    zone = Zone(id=1, name="Test", type="normal")  # sustain=7 → threshold=10
    sm = ZoneStateMachine(zone)
    sm.tick(hit_count=20)  # trigger
    assert sm.state == OccupancyState.OCCUPIED
    sm.tick(hit_count=5)  # 5 < 10 sustain threshold
    assert sm.state == OccupancyState.PENDING


def test_occupied_stays_occupied():
    """Zone stays OCCUPIED when hit count meets sustain threshold."""
    zone = Zone(id=1, name="Test", type="normal")  # sustain=7 → threshold=10
    sm = ZoneStateMachine(zone)
    sm.tick(hit_count=20)  # trigger
    sm.tick(hit_count=15)  # 15 >= 10 sustain threshold
    assert sm.state == OccupancyState.OCCUPIED


def test_pending_to_occupied():
    """Zone returns to OCCUPIED from PENDING when sustain threshold met."""
    zone = Zone(id=1, name="Test", type="normal")
    sm = ZoneStateMachine(zone)
    sm.tick(hit_count=20)  # trigger
    sm.tick(hit_count=0)   # → PENDING
    sm.tick(hit_count=15)  # sustain met → OCCUPIED
    assert sm.state == OccupancyState.OCCUPIED


def test_pending_to_clear_after_timeout():
    """Zone clears after timeout expires without sustain."""
    zone = Zone(id=1, name="Test", type="normal", timeout=2)  # 2s timeout
    sm = ZoneStateMachine(zone)

    now = 1000.0
    with patch("time.monotonic", return_value=now):
        sm.tick(hit_count=20)  # trigger
    with patch("time.monotonic", return_value=now + 0.5):
        sm.tick(hit_count=0)  # → PENDING at now+0.5
    with patch("time.monotonic", return_value=now + 1.5):
        sm.tick(hit_count=0)  # 1.0s elapsed, timeout=2 → still PENDING
    assert sm.state == OccupancyState.PENDING
    with patch("time.monotonic", return_value=now + 3.0):
        sm.tick(hit_count=0)  # 2.5s elapsed >= 2s timeout → CLEAR
    assert sm.state == OccupancyState.CLEAR


def test_pending_timeout_resets_on_reoccupy():
    """Returning to OCCUPIED from PENDING clears the timeout."""
    zone = Zone(id=1, name="Test", type="normal", timeout=5)
    sm = ZoneStateMachine(zone)

    now = 1000.0
    with patch("time.monotonic", return_value=now):
        sm.tick(hit_count=20)  # trigger
    with patch("time.monotonic", return_value=now + 1):
        sm.tick(hit_count=0)  # → PENDING
    with patch("time.monotonic", return_value=now + 2):
        sm.tick(hit_count=20)  # → back to OCCUPIED
    assert sm.state == OccupancyState.OCCUPIED
    assert sm.pending_since is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_zone_engine.py::test_clear_to_occupied -v`
Expected: ImportError — OccupancyState and ZoneStateMachine don't exist yet.

- [ ] **Step 3: Implement OccupancyState and ZoneStateMachine**

Add to `zone_engine.py` after the Zone dataclass:

```python
import enum
import time


class OccupancyState(enum.Enum):
    """Zone occupancy states."""

    CLEAR = "clear"
    OCCUPIED = "occupied"
    PENDING = "pending"


class ZoneStateMachine:
    """Three-state occupancy machine for a single zone."""

    def __init__(self, zone: Zone) -> None:
        """Initialize the state machine for a zone."""
        self.zone = zone
        self.state = OccupancyState.CLEAR
        self.pending_since: float | None = None
        self._trigger_threshold = sensitivity_to_threshold(zone.trigger)
        self._sustain_threshold = sensitivity_to_threshold(zone.sustain)

    def tick(self, hit_count: int) -> None:
        """Process one tumbling window tick with the zone's hit count."""
        match self.state:
            case OccupancyState.CLEAR:
                if hit_count >= self._trigger_threshold:
                    self.state = OccupancyState.OCCUPIED
            case OccupancyState.OCCUPIED:
                if hit_count < self._sustain_threshold:
                    self.state = OccupancyState.PENDING
                    self.pending_since = time.monotonic()
            case OccupancyState.PENDING:
                if hit_count >= self._sustain_threshold:
                    self.state = OccupancyState.OCCUPIED
                    self.pending_since = None
                elif (
                    self.pending_since is not None
                    and time.monotonic() - self.pending_since >= self.zone.timeout
                ):
                    self.state = OccupancyState.CLEAR
                    self.pending_since = None
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_zone_engine.py -v`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add zone_engine.py tests/test_zone_engine.py
git commit -m "feat: three-state occupancy state machine (CLEAR/OCCUPIED/PENDING)"
```

---

## Task 4: Rewrite ZoneEngine to use hit-count state machines

**Files:**
- Modify: `zone_engine.py`
- Modify: `tests/test_zone_engine.py`

- [ ] **Step 1: Write tests for the rewritten ZoneEngine**

Append to `tests/test_zone_engine.py`:

```python
from custom_components.everything_presence_pro.zone_engine import (
    ZoneEngine,
    ProcessingResult,
)
from custom_components.everything_presence_pro.const import CELL_ROOM_BIT, CELL_ZONE_SHIFT


def _make_grid_with_zones() -> Grid:
    """Create a 4x1 grid: cell 0=room(zone 0), cell 1=zone 1, cell 2=zone 2, cell 3=outside."""
    grid = Grid(origin_x=0, origin_y=0, cols=4, rows=1, cell_size=300)
    grid.cells[0] = CELL_ROOM_BIT  # room, no zone
    grid.cells[1] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)  # zone 1
    grid.cells[2] = CELL_ROOM_BIT | (2 << CELL_ZONE_SHIFT)  # zone 2
    grid.cells[3] = 0x00  # outside
    return grid


def test_zone_engine_accumulate_and_tick():
    """Zone engine accumulates raw frames and ticks state machines."""
    engine = ZoneEngine()
    engine.set_grid(_make_grid_with_zones())
    zones = [
        Zone(id=1, name="Z1", type="entrance"),   # trigger=7 → threshold≈10
        Zone(id=2, name="Z2", type="rest"),        # trigger=3 → threshold≈23
    ]
    engine.set_zones(zones)

    # Accumulate frames: target in zone 1 (x=450 → cell 1)
    for _ in range(33):
        engine.accumulate_raw_frame([(450.0, 150.0, True)])

    result = engine.tick()
    # Zone 1 should be occupied (33 hits >= 10 threshold)
    assert result.zone_occupancy[1] is True
    # Zone 2 should be clear (0 hits)
    assert result.zone_occupancy[2] is False


def test_zone_engine_hit_count_in_result():
    """ProcessingResult includes hit counts per zone."""
    engine = ZoneEngine()
    engine.set_grid(_make_grid_with_zones())
    zones = [Zone(id=1, name="Z1", type="normal")]
    engine.set_zones(zones)

    for _ in range(20):
        engine.accumulate_raw_frame([(450.0, 150.0, True)])
    for _ in range(13):
        engine.accumulate_raw_frame([(150.0, 150.0, True)])  # room, no zone

    result = engine.tick()
    assert result.zone_hit_counts[1] == 20


def test_zone_engine_multiple_targets_sum_hits():
    """Hit counts from multiple targets in the same zone are summed."""
    engine = ZoneEngine()
    engine.set_grid(_make_grid_with_zones())
    zones = [Zone(id=1, name="Z1", type="normal")]
    engine.set_zones(zones)

    # Two targets in zone 1
    for _ in range(33):
        engine.accumulate_raw_frame([
            (450.0, 150.0, True),
            (450.0, 150.0, True),
        ])

    result = engine.tick()
    assert result.zone_hit_counts[1] == 66  # 33 frames × 2 targets


def test_zone_engine_tick_resets_accumulator():
    """After tick(), the accumulator is empty for the next window."""
    engine = ZoneEngine()
    engine.set_grid(_make_grid_with_zones())
    zones = [Zone(id=1, name="Z1", type="entrance")]  # trigger threshold ≈ 10
    engine.set_zones(zones)

    for _ in range(33):
        engine.accumulate_raw_frame([(450.0, 150.0, True)])
    engine.tick()  # consumes accumulator

    # Next window: no frames accumulated
    result = engine.tick()
    assert result.zone_hit_counts[1] == 0


def test_zone_engine_device_tracking_present():
    """device_tracking_present reflects any active target in room."""
    engine = ZoneEngine()
    engine.set_grid(_make_grid_with_zones())
    engine.set_zones([Zone(id=1, name="Z1", type="normal")])

    engine.accumulate_raw_frame([(150.0, 150.0, True)])  # in room, zone 0
    result = engine.tick()
    assert result.device_tracking_present is True

    result = engine.tick()  # empty window
    assert result.device_tracking_present is False
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_zone_engine.py::test_zone_engine_accumulate_and_tick -v`
Expected: AttributeError — `accumulate_raw_frame` and `tick` don't exist.

- [ ] **Step 3: Rewrite ZoneEngine**

Replace the ZoneEngine class in `zone_engine.py`:

```python
@dataclass
class ProcessingResult:
    """Result of processing one tumbling window."""

    device_tracking_present: bool = False
    zone_occupancy: dict[int, bool] = field(default_factory=dict)
    zone_hit_counts: dict[int, int] = field(default_factory=dict)


class ZoneEngine:
    """Grid-based zone occupancy engine with hit-count state machines.

    Usage:
        1. Call accumulate_raw_frame() for each raw LD2450 frame (~33Hz).
        2. Call tick() once per tumbling window (1Hz) to evaluate state machines.
    """

    def __init__(self) -> None:
        """Initialize the zone engine."""
        self.grid = Grid()
        self._zones: list[Zone] = []
        self._state_machines: dict[int, ZoneStateMachine] = {}
        self._hit_counts: dict[int, int] = {}
        self._any_target_in_room: bool = False

    def set_grid(self, grid: Grid) -> None:
        """Set the grid."""
        self.grid = grid

    def set_zones(self, zones: list[Zone]) -> None:
        """Set the zone configuration and create state machines."""
        self._zones = zones
        self._state_machines = {z.id: ZoneStateMachine(z) for z in zones}
        self._reset_accumulator()

    def _reset_accumulator(self) -> None:
        """Reset per-window hit counters."""
        self._hit_counts = {z.id: 0 for z in self._zones}
        self._any_target_in_room = False

    def accumulate_raw_frame(
        self, targets: list[tuple[float, float, bool]]
    ) -> None:
        """Accumulate one raw LD2450 frame into hit counts.

        Args:
            targets: List of (room_x_mm, room_y_mm, active) tuples.
        """
        for x, y, active in targets:
            if not active:
                continue

            cell = self.grid.xy_to_cell(x, y)
            if cell is None:
                continue

            if not self.grid.cell_is_room(cell):
                continue

            self._any_target_in_room = True
            zone_id = self.grid.cell_zone(cell)

            if zone_id > 0 and zone_id in self._hit_counts:
                self._hit_counts[zone_id] += 1

    def tick(self) -> ProcessingResult:
        """Evaluate state machines with accumulated hit counts.

        Call once per tumbling window (1Hz). Resets the accumulator.
        """
        result = ProcessingResult()
        result.device_tracking_present = self._any_target_in_room

        for zone in self._zones:
            hit_count = self._hit_counts.get(zone.id, 0)
            sm = self._state_machines[zone.id]
            sm.tick(hit_count)
            result.zone_occupancy[zone.id] = sm.state == OccupancyState.OCCUPIED
            result.zone_hit_counts[zone.id] = hit_count

        self._reset_accumulator()
        return result
```

Note: `zone_target_counts` is renamed to `zone_hit_counts` in ProcessingResult to reflect the new semantics.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_zone_engine.py -v`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add zone_engine.py tests/test_zone_engine.py
git commit -m "feat: rewrite zone engine with hit-count accumulator and state machines"
```

---

## Task 5: Update coordinator — tumbling window and config serialization

**Files:**
- Modify: `coordinator.py`
- Create: `tests/test_coordinator.py`

The coordinator currently calls `process_targets()` on every rebuild (~5Hz). It needs to:
1. Call `accumulate_raw_frame()` on every rebuild instead (feeding raw frames).
2. Set up a 1-second periodic tick that calls `zone_engine.tick()`.
3. Update config serialization to use `type`/`trigger`/`sustain`/`timeout` instead of `sensitivity`.

- [ ] **Step 1: Write tests for config serialization**

Create `tests/test_coordinator.py`:

```python
"""Tests for coordinator config serialization with zone types."""

from custom_components.everything_presence_pro.zone_engine import Zone


def test_zone_serialization_round_trip():
    """Zone with type and custom overrides survives serialization."""
    zone = Zone(id=1, name="Door", type="entrance", color="#ff0000",
                trigger=4, sustain=6, timeout=8)
    data = {
        "id": zone.id,
        "name": zone.name,
        "type": zone.type,
        "color": zone.color,
        "trigger": zone.trigger,
        "sustain": zone.sustain,
        "timeout": zone.timeout,
    }
    restored = Zone(
        id=data["id"],
        name=data["name"],
        type=data.get("type", "normal"),
        color=data.get("color", ""),
        trigger=data.get("trigger", -1),
        sustain=data.get("sustain", -1),
        timeout=data.get("timeout", -1),
    )
    assert restored.type == "entrance"
    assert restored.trigger == 4
    assert restored.sustain == 6
    assert restored.timeout == 8


def test_zone_deserialization_type_only():
    """Zone with only type gets defaults filled in."""
    data = {"id": 2, "name": "Hall", "type": "thoroughfare", "color": ""}
    restored = Zone(
        id=data["id"],
        name=data["name"],
        type=data.get("type", "normal"),
        color=data.get("color", ""),
    )
    assert restored.trigger == 7  # thoroughfare default
    assert restored.sustain == 8
    assert restored.timeout == 3
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_coordinator.py -v`
Expected: PASS (Zone dataclass already supports this from task 2).

- [ ] **Step 3: Update coordinator.py**

Key changes in `coordinator.py`:

**Remove old imports, add new:**
```python
# Remove: CELL_ROOM_INSIDE
# Add: (no new const imports needed — zone engine handles it)
```

**Update `_do_rebuild`** — accumulate raw frames instead of calling `process_targets`:

```python
def _do_rebuild(self) -> None:
    """Rebuild target list, apply calibration, accumulate in zone engine."""
    self._rebuild_scheduled = False
    calibrated: list[tuple[float, float, bool]] = []
    for i in range(MAX_TARGETS):
        if self._target_active[i]:
            sx, sy = self._smoother.update(
                i, self._target_x[i], self._target_y[i]
            )
            cx, cy = self._sensor_transform.apply(sx, sy)
            calibrated.append((cx, cy, True))
        else:
            self._smoother.clear(i)
            calibrated.append((self._target_x[i], self._target_y[i], False))

    self._targets = calibrated
    # Accumulate into zone engine (raw frame for hit counting)
    self._zone_engine.accumulate_raw_frame(calibrated)

    async_dispatcher_send(
        self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}"
    )
```

**Add periodic tick** — 1-second interval calling `zone_engine.tick()`:

```python
def _start_tick_timer(self) -> None:
    """Start the 1-second zone engine tick timer."""
    self._tick_handle = self.hass.loop.call_later(1.0, self._on_tick)

def _on_tick(self) -> None:
    """Tick zone engine state machines and schedule next tick."""
    self._last_result = self._zone_engine.tick()
    async_dispatcher_send(
        self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}"
    )
    self._tick_handle = self.hass.loop.call_later(1.0, self._on_tick)

def _stop_tick_timer(self) -> None:
    """Cancel the tick timer."""
    if self._tick_handle is not None:
        self._tick_handle.cancel()
        self._tick_handle = None
```

Add `self._tick_handle: asyncio.TimerHandle | None = None` to `__init__`.

Call `_start_tick_timer()` at end of `_on_connect()` (not `async_connect()` — the device isn't connected yet when `async_connect` starts reconnect logic). Call `_stop_tick_timer()` at start of `_on_disconnect()` and `async_disconnect()`.

**Update `_rebuild_grid`** — use `CELL_ROOM_BIT` instead of `CELL_ROOM_INSIDE`:

```python
# In _rebuild_grid, change:
grid.cells[r * cols + c] = CELL_ROOM_INSIDE
# To:
grid.cells[r * cols + c] = CELL_ROOM_BIT
```

Update imports accordingly: replace `CELL_ROOM_INSIDE` with `CELL_ROOM_BIT`.

**Update config serialization** in `get_config_data` and `load_config_data`:

In `get_config_data`, serialize zones with type/trigger/sustain/timeout:
```python
"zones": [
    {
        "id": z.id,
        "name": z.name,
        "type": z.type,
        "color": z.color,
        "trigger": z.trigger,
        "sustain": z.sustain,
        "timeout": z.timeout,
    }
    for z in self._zones
],
```

In `load_config_data`, update zone deserialization from zone_slots:
```python
zones = [
    Zone(
        id=i + 1,
        name=z["name"],
        type=z.get("type", "normal"),
        color=z.get("color", ""),
        trigger=z.get("trigger", -1),
        sustain=z.get("sustain", -1),
        timeout=z.get("timeout", -1),
    )
    for i, z in enumerate(zone_slots)
    if z is not None
]
```

And the legacy zone format:
```python
zones = [
    Zone(
        id=z["id"],
        name=z["name"],
        type=z.get("type", "normal"),
        color=z.get("color", ""),
        trigger=z.get("trigger", -1),
        sustain=z.get("sustain", -1),
        timeout=z.get("timeout", -1),
    )
    for z in zone_list
]
```

- [ ] **Step 4: Run all tests**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/ -v`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add coordinator.py tests/test_coordinator.py
git commit -m "feat: coordinator tumbling window tick and zone type config serialization"
```

---

## Task 6: Update websocket API — zone type schema

**Files:**
- Modify: `websocket_api.py`

- [ ] **Step 1: Update set_room_layout schema**

In `websocket_set_room_layout`, replace the zone_slots schema:

```python
vol.Optional("zone_slots", default=[None] * MAX_ZONES): vol.All(
    [
        vol.Any(
            None,
            {
                vol.Required("name"): str,
                vol.Required("color"): str,
                vol.Required("type"): vol.In(["normal", "entrance", "thoroughfare", "rest"]),
                vol.Optional("trigger"): vol.All(int, vol.Range(min=0, max=9)),
                vol.Optional("sustain"): vol.All(int, vol.Range(min=0, max=9)),
                vol.Optional("timeout"): vol.All(vol.Coerce(float), vol.Range(min=0)),
            },
        )
    ],
    vol.Length(min=MAX_ZONES, max=MAX_ZONES),
),
```

Replace `room_sensitivity` with `room_type`:
```python
vol.Optional("room_type", default="normal"): vol.In(
    ["normal", "entrance", "thoroughfare", "rest"]
),
```

- [ ] **Step 2: Update zone building in handler**

In `websocket_set_room_layout` handler, update Zone construction:

```python
zones = [
    Zone(
        id=i + 1,
        name=z["name"],
        type=z.get("type", "normal"),
        color=z.get("color", ""),
        trigger=z.get("trigger", -1),
        sustain=z.get("sustain", -1),
        timeout=z.get("timeout", -1),
    )
    for i, z in enumerate(zone_slots)
    if z is not None
]
```

- [ ] **Step 3: Update set_zones schema**

In `websocket_set_zones`, update the zone schema:

```python
vol.Required("zones"): [
    {
        vol.Required("id"): vol.Coerce(int),
        vol.Required("name"): str,
        vol.Required("type"): vol.In(["normal", "entrance", "thoroughfare", "rest"]),
        vol.Optional("color", default=""): str,
        vol.Optional("trigger"): vol.All(int, vol.Range(min=0, max=9)),
        vol.Optional("sustain"): vol.All(int, vol.Range(min=0, max=9)),
        vol.Optional("timeout"): vol.All(vol.Coerce(float), vol.Range(min=0)),
    }
],
```

Update Zone construction in the handler:

```python
zones = [
    Zone(
        id=z["id"],
        name=z["name"],
        type=z.get("type", "normal"),
        color=z.get("color", ""),
        trigger=z.get("trigger", -1),
        sustain=z.get("sustain", -1),
        timeout=z.get("timeout", -1),
    )
    for z in msg["zones"]
]
```

Update serialization in the persist block:
```python
config["zones"] = [
    {
        "id": z.id,
        "name": z.name,
        "type": z.type,
        "color": z.color,
        "trigger": z.trigger,
        "sustain": z.sustain,
        "timeout": z.timeout,
    }
    for z in zones
]
```

- [ ] **Step 4: Update subscribe_targets event payload**

In `_forward_state` within `websocket_subscribe_targets`, rename `target_counts` to `hit_counts`:

```python
"zones": {
    "occupancy": result.zone_occupancy,
    "hit_counts": result.zone_hit_counts,
},
```

- [ ] **Step 5: Run all tests**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/ -v`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add websocket_api.py
git commit -m "feat: websocket API zone type schema with trigger/sustain/timeout"
```

---

## Task 7: Update binary_sensor.py and sensor.py references

**Files:**
- Modify: `binary_sensor.py`
- Modify: `sensor.py`

The `ProcessingResult` field was renamed from `zone_target_counts` to `zone_hit_counts`. Two files reference the old name and will break at runtime.

- [ ] **Step 1: Update binary_sensor.py**

In `binary_sensor.py` around line 292, change:
```python
# Old:
"target_count": self._coordinator.last_result.zone_target_counts.get(
    self._slot, 0
)
# New:
"target_count": self._coordinator.last_result.zone_hit_counts.get(
    self._slot, 0
)
```

- [ ] **Step 2: Update sensor.py**

In `sensor.py` around line 496, change:
```python
# Old:
return self._coordinator.last_result.zone_target_counts.get(
    self._slot, 0
)
# New:
return self._coordinator.last_result.zone_hit_counts.get(
    self._slot, 0
)
```

- [ ] **Step 3: Run all tests**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/ -v`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add binary_sensor.py sensor.py
git commit -m "fix: update zone_target_counts references to zone_hit_counts"
```

---

## Task 8: Expose zone states in websocket and ProcessingResult

**Files:**
- Modify: `zone_engine.py`
- Modify: `websocket_api.py`
- Modify: `tests/test_zone_engine.py`

PENDING and CLEAR both currently map to `zone_occupancy[id] = False`, making them indistinguishable to consumers. The frontend needs to know a zone is PENDING (e.g., to show a fading-out indicator).

- [ ] **Step 1: Add zone_states to ProcessingResult**

In `zone_engine.py`, add a `zone_states` field to `ProcessingResult`:

```python
@dataclass
class ProcessingResult:
    """Result of processing one tumbling window."""

    device_tracking_present: bool = False
    zone_occupancy: dict[int, bool] = field(default_factory=dict)
    zone_hit_counts: dict[int, int] = field(default_factory=dict)
    zone_states: dict[int, str] = field(default_factory=dict)
```

In `ZoneEngine.tick()`, populate it:
```python
result.zone_states[zone.id] = sm.state.value  # "clear", "occupied", "pending"
```

- [ ] **Step 2: Add zone_states to websocket event**

In `websocket_api.py`, `_forward_state`:
```python
"zones": {
    "occupancy": result.zone_occupancy,
    "hit_counts": result.zone_hit_counts,
    "states": result.zone_states,
},
```

- [ ] **Step 3: Add test**

Append to `tests/test_zone_engine.py`:

```python
def test_processing_result_includes_zone_states():
    """ProcessingResult exposes the raw state enum value per zone."""
    engine = ZoneEngine()
    grid = Grid(origin_x=0, origin_y=0, cols=1, rows=1, cell_size=300)
    grid.cells[0] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
    engine.set_grid(grid)
    engine.set_zones([Zone(id=1, name="Z1", type="normal")])

    r = engine.tick()
    assert r.zone_states[1] == "clear"

    for _ in range(20):
        engine.accumulate_raw_frame([(150.0, 150.0, True)])
    r = engine.tick()
    assert r.zone_states[1] == "occupied"

    r = engine.tick()  # empty window → pending
    assert r.zone_states[1] == "pending"
```

- [ ] **Step 4: Run tests**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/ -v`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add zone_engine.py websocket_api.py tests/test_zone_engine.py
git commit -m "feat: expose zone state (clear/occupied/pending) in results and websocket"
```

---

## Task 9: Frontend — zone type dropdown replacing sensitivity

**Files:**
- Modify: `frontend/everything-presence-pro-panel.js`

This task updates the frontend to send zone type instead of sensitivity int, and to show type-specific controls.

- [ ] **Step 1: Update zone config data model**

In the zone configuration section, replace the sensitivity dropdown with a zone type dropdown. Each zone slot should store `type` (string) instead of `sensitivity` (int). The options are: Normal, Entrance, Thoroughfare, Rest.

Find the sensitivity dropdown rendering (around the `_zoneConfigs` mapping) and replace:

```javascript
// Old: sensitivity dropdown with options Low(0), Medium(1), High(2)
// New: zone type dropdown
html`<select .value=${zone.type || "normal"}
      @change=${(e) => this._updateZoneConfig(idx, "type", e.target.value)}>
  <option value="normal">Normal</option>
  <option value="entrance">Entrance</option>
  <option value="thoroughfare">Thoroughfare</option>
  <option value="rest">Rest</option>
</select>`
```

- [ ] **Step 2: Update websocket payload**

In the save handler that calls `set_room_layout`, update the zone_slots payload to send `type` instead of `sensitivity`:

```javascript
zone_slots: this._zoneConfigs.map(z => z ? {
  name: z.name,
  color: z.color,
  type: z.type || "normal",
  // Only send trigger/sustain/timeout if user has customized them
  ...(z.trigger !== undefined && { trigger: z.trigger }),
  ...(z.sustain !== undefined && { sustain: z.sustain }),
  ...(z.timeout !== undefined && { timeout: z.timeout }),
} : null),
```

Replace `room_sensitivity` with `room_type`:
```javascript
room_type: this._roomType || "normal",
```

- [ ] **Step 3: Update zone info tooltip in live sidebar**

Replace the sensitivity-based tooltip with zone type info:

```javascript
// Old: "Sensitivity determines how many consecutive frames..."
// New: "Zone type: ${zone.type}. Trigger: ${zone.trigger}, Sustain: ${zone.sustain}, Timeout: ${zone.timeout}s"
```

- [ ] **Step 4: Remove overlay tools**

Remove the entrance/exit overlay tool (cyan, index -1) and interference source overlay tool (red, index -2) from the zone editor palette. These concepts are replaced by zone types and per-cell training respectively.

- [ ] **Step 5: Build frontend**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout/custom_components/everything_presence_pro/frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: frontend zone type dropdown, remove overlay tools"
```

---

## Task 10: Integration test — end-to-end zone type flow

**Files:**
- Modify: `tests/test_zone_engine.py`

- [ ] **Step 1: Write an end-to-end test**

Append to `tests/test_zone_engine.py`:

```python
from unittest.mock import patch


def test_end_to_end_rest_zone_hard_to_trigger_easy_to_sustain():
    """Rest zone requires many hits to trigger but few to sustain."""
    engine = ZoneEngine()
    grid = Grid(origin_x=0, origin_y=0, cols=2, rows=1, cell_size=300)
    grid.cells[0] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
    grid.cells[1] = CELL_ROOM_BIT
    engine.set_grid(grid)
    engine.set_zones([Zone(id=1, name="Sofa", type="rest")])
    # rest: trigger=3 → threshold=23, sustain=9 → threshold=3, timeout=30

    # Window 1: 15 hits — not enough to trigger (need 23)
    for _ in range(15):
        engine.accumulate_raw_frame([(150.0, 150.0, True)])
    r = engine.tick()
    assert r.zone_occupancy[1] is False

    # Window 2: 25 hits — triggers
    for _ in range(25):
        engine.accumulate_raw_frame([(150.0, 150.0, True)])
    r = engine.tick()
    assert r.zone_occupancy[1] is True

    # Window 3: only 5 hits — above sustain threshold (3), stays occupied
    for _ in range(5):
        engine.accumulate_raw_frame([(150.0, 150.0, True)])
    r = engine.tick()
    assert r.zone_occupancy[1] is True  # sustain keeps it

    # Window 4: 0 hits — drops to PENDING (below sustain threshold)
    now = 1000.0
    with patch("time.monotonic", return_value=now):
        r = engine.tick()
    # PENDING is not reported as occupied
    assert r.zone_occupancy[1] is False

    # Window 5: 5 hits within timeout — back to occupied
    with patch("time.monotonic", return_value=now + 1):
        for _ in range(5):
            engine.accumulate_raw_frame([(150.0, 150.0, True)])
        r = engine.tick()
    assert r.zone_occupancy[1] is True


def test_end_to_end_entrance_zone_triggers_fast():
    """Entrance zone triggers quickly with few hits."""
    engine = ZoneEngine()
    grid = Grid(origin_x=0, origin_y=0, cols=1, rows=1, cell_size=300)
    grid.cells[0] = CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
    engine.set_grid(grid)
    engine.set_zones([Zone(id=1, name="Door", type="entrance")])
    # entrance: trigger=7 → threshold=10

    for _ in range(12):
        engine.accumulate_raw_frame([(150.0, 150.0, True)])
    r = engine.tick()
    assert r.zone_occupancy[1] is True
```

- [ ] **Step 2: Run tests**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/ -v`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/
git commit -m "test: end-to-end zone type integration tests"
```

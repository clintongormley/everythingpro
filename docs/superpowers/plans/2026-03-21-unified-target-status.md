# Unified Target Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace separate `targets[]` + `pending_targets[]` data structures with a single `targets[]` list where each target carries a `status` field (`active`/`pending`/`inactive`), eliminating the visual glitch where targets disappear before reappearing faded.

**Architecture:** Add `TargetStatus` enum and `TargetResult` dataclass to zone engine. `ProcessingResult` gets `targets: list[TargetResult]` replacing `target_signals` and `pending_targets`. Coordinator removes `_targets` list and inter-tick display updates — only window tick dispatches. Websocket sends unified format. Frontend receives status directly with no merge step.

**Tech Stack:** Python 3.12, TypeScript/Lit, Vitest, pytest

**Spec:** `docs/superpowers/specs/2026-03-21-unified-target-status-design.md`

---

### Task 1: Add TargetStatus and TargetResult to zone engine

**Files:**
- Modify: `custom_components/everything_presence_pro/zone_engine.py:60-75`

- [ ] **Step 1: Add TargetStatus enum and TargetResult dataclass**

After the `ZoneState` enum (line 63), add:

```python
class TargetStatus(str, enum.Enum):
    """Status of a target in zone engine output."""

    ACTIVE = "active"
    PENDING = "pending"
    INACTIVE = "inactive"


@dataclass
class TargetResult:
    """Per-target result from zone engine processing."""

    x: float = 0.0
    y: float = 0.0
    status: TargetStatus = TargetStatus.INACTIVE
    signal: int = 0
```

- [ ] **Step 2: Update ProcessingResult**

Replace the current `ProcessingResult` (lines 65-75) with:

```python
@dataclass
class ProcessingResult:
    """Result of processing a tumbling window."""

    device_tracking_present: bool = False
    zone_occupancy: dict[int, bool] = field(default_factory=dict)
    zone_target_counts: dict[int, int] = field(default_factory=dict)
    frame_count: int = 0
    targets: list[TargetResult] = field(default_factory=list)
    debug_log: str = ""
```

- [ ] **Step 3: Verify imports compile**

Run: `python -c "from custom_components.everything_presence_pro.zone_engine import TargetStatus, TargetResult, ProcessingResult"`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add custom_components/everything_presence_pro/zone_engine.py
git commit -m "feat: add TargetStatus enum and TargetResult dataclass"
```

---

### Task 2: Update zone engine _tick() to build TargetResult list

**Files:**
- Modify: `custom_components/everything_presence_pro/zone_engine.py:390-581`

- [ ] **Step 1: Replace target_signals accumulation with TargetResult list**

In `_tick()`, replace `target_signals: list[int] = []` (line 400) with nothing — we'll build the targets list after the state machine.

In the per-target loop (lines 406-501), remove all `target_signals.append(...)` calls (lines 408, 417, 422). Instead, track signal per target in a local dict:

```python
target_signal: dict[int, int] = {}  # target_index → signal
```

In the loop body, where `target_signals.append(signal)` was called, do `target_signal[i] = signal` instead. Where `target_signals.append(0)` was called (inactive target), do nothing (dict defaults to 0 via `.get()`).

- [ ] **Step 2: Replace pending_targets construction with TargetResult list**

Remove the entire pending_targets block (lines 560-581) and the `result.target_signals = target_signals` line (line 558).

**Design note:** `status=ACTIVE` means the target is active in the window with a
signal — it represents "should render as a dot", not "confirmed in a zone's state
machine." Unconfirmed active targets (below trigger threshold) still show as dots.

Replace with:

```python
# Build per-target results
active_targets = {i for i, tw in enumerate(window.targets) if tw.active}
for i in range(len(window.targets)):
    if i in active_targets and target_signal.get(i, 0) > 0:
        tw = window.targets[i]
        result.targets.append(TargetResult(
            x=tw.median_x,
            y=tw.median_y,
            status=TargetStatus.ACTIVE,
            signal=target_signal.get(i, 0),
        ))
    else:
        # Check if this target is pending in any zone
        is_pending = False
        if i not in active_targets:
            for _zid, rt in self._zone_runtimes.items():
                if rt.state == ZoneState.PENDING and i in rt.confirmed_targets:
                    is_pending = True
                    break
        if is_pending:
            xy = self._target_prev_xy[i]
            result.targets.append(TargetResult(
                x=xy[0] if xy else 0.0,
                y=xy[1] if xy else 0.0,
                status=TargetStatus.PENDING,
                signal=0,
            ))
        else:
            result.targets.append(TargetResult(
                x=0.0,
                y=0.0,
                status=TargetStatus.INACTIVE,
                signal=0,
            ))
```

- [ ] **Step 3: Update debug log to use result.targets**

In the debug log section (lines 586-604), replace:

```python
zid = target_zone_curr[i]
```

with the same (no change needed — debug log reads `target_zone_curr` not `target_signals`).

For the signal value in the log, replace `zone_signal.get(zid, 0)` reference on line 594 — this already reads from `zone_signal` dict, not `target_signals`, so no change needed.

- [ ] **Step 4: Run existing tests to see what breaks**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && python -m pytest tests/test_zone_engine.py -x -q 2>&1 | tail -20`
Expected: `TestPendingTargets` tests fail (they assert on `result.pending_targets`)

- [ ] **Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/zone_engine.py
git commit -m "feat: zone engine _tick() builds TargetResult list"
```

---

### Task 3: Update zone engine tests

**Files:**
- Modify: `tests/test_zone_engine.py:700-776`

- [ ] **Step 1: Update TestPendingTargets to use result.targets**

Add import at top of file:

```python
from custom_components.everything_presence_pro.zone_engine import TargetStatus
```

Rewrite `TestPendingTargets` class. Rename to `TestTargetStatus`:

```python
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
```

- [ ] **Step 2: Update handoff test assertion (line 613)**

Find the handoff test that asserts `zone1_pending = [p for p in r2.pending_targets ...]` and replace with:

```python
assert r2.targets[0].status == TargetStatus.ACTIVE  # target moved, not pending
```

- [ ] **Step 3: Run zone engine tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && python -m pytest tests/test_zone_engine.py -x -q`
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add tests/test_zone_engine.py
git commit -m "test: update zone engine tests for TargetResult"
```

---

### Task 4: Update coordinator

**Files:**
- Modify: `custom_components/everything_presence_pro/coordinator.py`

- [ ] **Step 1: Add TargetStatus import**

Add to the zone_engine imports:

```python
from .zone_engine import TargetStatus
from .zone_engine import TargetResult
```

- [ ] **Step 2: Remove _targets field and _rebuild_scheduled**

Remove line 72:
```python
self._targets: list[tuple[float, float, bool]] = [(0.0, 0.0, False) for _ in range(MAX_TARGETS)]
```

Remove line 95:
```python
self._rebuild_scheduled: bool = False
```

- [ ] **Step 3: Update targets property**

Replace the `targets` property (lines 212-215) with:

```python
@property
def targets(self) -> list[TargetResult]:
    """Return the current target results from zone engine."""
    return list(self._last_result.targets) if self._last_result else []
```

- [ ] **Step 4: Update target_present and target_count**

Replace lines 167-175:

```python
@property
def target_present(self) -> bool:
    """Return whether any target is actively tracked."""
    return any(t.status == TargetStatus.ACTIVE for t in self.targets)

@property
def target_count(self) -> int:
    """Return the number of active targets."""
    return sum(1 for t in self.targets if t.status == TargetStatus.ACTIVE)
```

- [ ] **Step 5: Update target_distance and target_angle**

Replace `target_distance` (lines 177-182):

```python
def target_distance(self, index: int) -> float | None:
    """Return the distance from sensor to a target in mm."""
    targets = self.targets
    if index >= len(targets) or targets[index].status != TargetStatus.ACTIVE:
        return None
    t = targets[index]
    return (t.x * t.x + t.y * t.y) ** 0.5
```

Replace `target_angle` (lines 196-205):

```python
def target_angle(self, index: int) -> float | None:
    """Return the angle from sensor to a target in degrees."""
    targets = self.targets
    if index >= len(targets) or targets[index].status != TargetStatus.ACTIVE:
        return None
    t = targets[index]
    if t.x == 0 and t.y == 0:
        return None
    import math
    return math.degrees(math.atan2(t.x, t.y))
```

- [ ] **Step 6: Remove pending_targets property**

Delete lines 162-165 (the `pending_targets` property).

- [ ] **Step 7: Update _schedule_rebuild — remove inter-tick dispatch**

Replace `_schedule_rebuild` (lines 510-528) with:

```python
def _schedule_rebuild(self) -> None:
    """Feed raw target data to the zone engine on each state update."""
    now = time.monotonic()
    calibrated = self._build_calibrated_targets()

    result = self._zone_engine.feed_raw(calibrated, now)

    if result is not None:
        # Window ticked — update state and dispatch
        self._last_result = result
        async_dispatcher_send(self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}")

    # Schedule a single callback at the soonest pending zone expiry
    self._schedule_expiry_tick()
```

- [ ] **Step 8: Remove _do_display_update**

Delete the `_do_display_update` method (lines 570-574).

- [ ] **Step 9: Update _expiry_tick**

Replace `_expiry_tick` (lines 543-554) with:

```python
def _expiry_tick(self) -> None:
    """Feed empty targets at timeout expiry to clear zone entity states."""
    self._window_timer = None
    now = time.monotonic()
    empty = [(0.0, 0.0, False)] * MAX_TARGETS
    result = self._zone_engine.feed_raw(empty, now)
    if result is not None:
        self._last_result = result
        async_dispatcher_send(self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}")
    # If more zones are still pending, schedule the next expiry
    self._schedule_expiry_tick()
```

- [ ] **Step 10: Update _build_calibrated_targets reference in _handle_grid_update**

Search for any other `self._targets =` assignments. There's one at line 573 (`self._targets = self._build_calibrated_targets()`). This was in `_do_display_update` which is now deleted. Check if there are others — e.g., in `_handle_grid_update` or similar methods that set `self._targets`:

Run: `grep -n "self._targets" custom_components/everything_presence_pro/coordinator.py`

Fix any remaining references.

- [ ] **Step 11: Run coordinator tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && python -m pytest tests/test_coordinator.py -x -q 2>&1 | tail -20`
Expected: some failures from `test_default_pending_targets` and potentially others

- [ ] **Step 12: Commit**

```bash
git add custom_components/everything_presence_pro/coordinator.py
git commit -m "feat: coordinator uses TargetResult, remove inter-tick dispatch"
```

---

### Task 5: Update coordinator tests

**Files:**
- Modify: `tests/test_coordinator.py`

- [ ] **Step 1: Add imports**

```python
from custom_components.everything_presence_pro.zone_engine import TargetResult, TargetStatus, ProcessingResult
```

- [ ] **Step 2: Remove test_default_pending_targets**

Delete the test at lines 85-87 that asserts `coordinator.pending_targets == []`.

- [ ] **Step 3: Rewrite TestCoordinatorProperties tests that set _targets**

Tests at ~lines 255-270 directly set `coordinator._targets = [(x, y, active), ...]`.
Since `_targets` no longer exists, these tests must set up `coordinator._last_result`
with `TargetResult` objects instead. For each test:

Replace:
```python
coordinator._targets = [(100, 200, True), (0, 0, False), (0, 0, False)]
```

With:
```python
coordinator._last_result = ProcessingResult(targets=[
    TargetResult(x=100, y=200, status=TargetStatus.ACTIVE, signal=5),
    TargetResult(),
    TargetResult(),
])
```

Apply this pattern to all tests that set `coordinator._targets` directly.
The `target_present`, `target_count`, `target_distance`, and `target_angle`
assertions should continue to work with the new data source.

- [ ] **Step 4: Run coordinator tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && python -m pytest tests/test_coordinator.py -x -q`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add tests/test_coordinator.py
git commit -m "test: update coordinator tests for unified target status"
```

---

### Task 6: Update websocket API

**Files:**
- Modify: `custom_components/everything_presence_pro/websocket_api.py:446-493`

- [ ] **Step 1: Update _forward_state to use TargetResult**

Replace the targets and pending_targets sections in `_forward_state` (lines 448-490) with:

```python
result = coordinator.last_result
raw_targets = coordinator.raw_targets
# Pad targets to MAX_TARGETS if zone engine hasn't ticked yet
targets = list(result.targets) if result else []
while len(targets) < len(raw_targets):
    targets.append(TargetResult())
connection.send_message(
    websocket_api.event_message(
        msg["id"],
        {
            "targets": [
                {
                    "x": t.x,
                    "y": t.y,
                    "status": t.status.value,
                    "raw_x": r[0],
                    "raw_y": r[1],
                    "signal": t.signal,
                }
                for t, r in zip(targets, raw_targets, strict=False)
            ],
            "sensors": {
                ...  # unchanged
            },
            "zones": {
                ...  # unchanged
            },
        },
    )
)
```

Remove the `"pending_targets"` key entirely from the message dict.

- [ ] **Step 2: Move TargetResult/TargetStatus imports to top of file**

Add to the existing zone_engine imports at the top:

```python
from .zone_engine import TargetResult
from .zone_engine import TargetStatus
```

Remove the inline import added in step 1.

- [ ] **Step 3: Run websocket tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && python -m pytest tests/test_websocket_api.py -x -q`
Expected: failure on `assert "pending_targets" in event` and `assert "active" in t`

- [ ] **Step 4: Commit**

```bash
git add custom_components/everything_presence_pro/websocket_api.py
git commit -m "feat: websocket sends unified target status format"
```

---

### Task 7: Update websocket and remaining Python tests

**Files:**
- Modify: `tests/test_websocket_api.py`
- Modify: `tests/test_binary_sensor.py` (if needed)
- Modify: `tests/test_sensor.py` (if needed)

- [ ] **Step 1: Update websocket test assertions**

At line 252, replace `assert "pending_targets" in event` with:

```python
assert "pending_targets" not in event
```

At lines 256-262, update the target structure assertions:

```python
for t in event["targets"]:
    assert "x" in t
    assert "y" in t
    assert "status" in t
    assert "raw_x" in t
    assert "raw_y" in t
    assert "signal" in t
    assert t["status"] in ("active", "pending", "inactive")
```

- [ ] **Step 2: Fix binary_sensor and sensor tests if they construct ProcessingResult**

Search for `ProcessingResult(` in test files. If any pass `target_signals=` or `pending_targets=`, remove those arguments.

Run: `grep -n "target_signals\|pending_targets" tests/test_binary_sensor.py tests/test_sensor.py`

- [ ] **Step 3: Run all Python tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && python -m pytest tests/ -x -q`
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test: update websocket and entity tests for unified target status"
```

---

### Task 8: Update parity tests (Python side)

**Files:**
- Modify: `tests/test_zone_engine_parity.py`

- [ ] **Step 1: Add TargetStatus import**

```python
from custom_components.everything_presence_pro.zone_engine import TargetStatus
```

- [ ] **Step 2: Update parity assertions**

Any assertions that check `result.target_signals` should check `result.targets[i].signal` instead. Any that check `result.pending_targets` should check `result.targets[i].status`.

- [ ] **Step 3: Run parity tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && python -m pytest tests/test_zone_engine_parity.py -x -q`
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add tests/test_zone_engine_parity.py
git commit -m "test: update Python parity tests for TargetResult"
```

---

### Task 9: Update frontend Target interface and subscribe handler

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:70-79,674-708`

- [ ] **Step 1: Add TargetStatus type**

Near the top of the file, after the imports:

```typescript
type TargetStatus = "active" | "pending" | "inactive";
```

- [ ] **Step 2: Update Target interface**

Replace the `Target` interface (lines 70-79) with:

```typescript
interface Target {
	x: number;
	y: number;
	raw_x: number;
	raw_y: number;
	speed: number;
	status: TargetStatus;
	signal: number;
}
```

- [ ] **Step 3: Update _subscribeTargets mapping**

Replace the target mapping in `_subscribeTargets` (lines 683-708) with:

```typescript
const targets: Target[] = (event.targets || []).map((t: any) => ({
	x: t.x,
	y: t.y,
	raw_x: t.raw_x ?? t.x,
	raw_y: t.raw_y ?? t.y,
	speed: 0,
	status: (t.status as TargetStatus) ?? "inactive",
	signal: t.signal ?? 0,
}));
```

Remove the entire pending_targets merge loop (lines 694-708):
```typescript
// DELETE: Merge pending targets: replace inactive slots with faded versions
// for (const pt of event.pending_targets || []) { ... }
```

- [ ] **Step 4: Fix all t.active references**

Search for `t.active` and `\.active` in the panel file. Replace each with the appropriate status check:

- `t.active` (meaning "is this target visible/tracked") → `t.status === "active"`
- `!t.active` (meaning "skip inactive") → `t.status === "inactive"` or `t.status !== "active"` depending on context
- `t.pending` → `t.status === "pending"`
- `!t.active || t.pending` (in zone engine) → `t.status !== "active"`

Key locations:
- Rendering: `if (!t.active) return nothing;` → `if (t.status === "inactive") return nothing;`
- Opacity: `t.pending ? 0.3 : 1` → `t.status === "pending" ? 0.3 : 1`
- Signal label: `!t.pending && t.signal > 0` → `t.status === "active" && t.signal > 0`
- Zone engine skip: `!t.active || t.pending` → `t.status !== "active"`
- Wizard active target checks: `t.active` → `t.status === "active"`
- Debug log skip: `!t.active || t.pending` → `t.status !== "active"`

- [ ] **Step 5: Update _localZoneState — remove isHandoff field**

The `isHandoff` field is no longer used after the handoff fix. In the `_localZoneState` type (lines 433-441), remove `isHandoff`:

```typescript
private _localZoneState: Map<
	number,
	{
		occupied: boolean;
		pendingSince: number | null;
		confirmedTargets: Set<number>;
	}
> = new Map();
```

Remove all `isHandoff` assignments and reads throughout the local zone engine section.

- [ ] **Step 6: Build frontend**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npx tsc --noEmit`
Expected: no type errors

- [ ] **Step 7: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: frontend uses unified target status"
```

---

### Task 10: Update frontend tests

**Files:**
- Modify: `frontend/src/__tests__/panel-zone-engine-parity.test.ts`
- Modify: `frontend/src/__tests__/panel-inline-handlers.test.ts`
- Modify: `frontend/src/__tests__/panel-branch-coverage.test.ts`
- Modify: `frontend/src/__tests__/panel-targets.test.ts` — tests subscribe handler and pending merge
- Modify: `frontend/src/__tests__/panel-dom-events.test.ts` — target active/pending refs
- Modify: `frontend/src/__tests__/panel-coverage-gaps.test.ts` — target active/pending refs
- Modify: `frontend/src/__tests__/panel-wizard.test.ts` — target active refs
- Modify: `frontend/src/__tests__/panel-render-views.test.ts` — isHandoff ref
- Modify: `frontend/src/__tests__/panel-settings.test.ts` — if it has target refs

- [ ] **Step 1: Update parity test Target interface and makeTarget helper**

In `panel-zone-engine-parity.test.ts`, replace the local `Target` interface (lines 42-51) and `makeTarget` helper (lines 53-60):

```typescript
interface Target {
	x: number;
	y: number;
	raw_x: number;
	raw_y: number;
	status: "active" | "pending" | "inactive";
	signal: number;
	speed: number;
}

function makeTarget(
	x: number,
	y: number,
	signal: number,
	active = true,
): Target {
	return { x, y, raw_x: x, raw_y: y, status: active ? "active" : "inactive", signal, speed: 0 };
}
```

- [ ] **Step 2: Update inline-handlers test**

Replace all `active: true, pending: false` with `status: "active"`.
Replace all `active: true, pending: true` with `status: "pending"`.
Replace all `active: false` with `status: "inactive"`.
Remove `isHandoff` from any `_localZoneState` test setups.

- [ ] **Step 3: Update branch-coverage test**

Same pattern: replace `active`/`pending` booleans with `status` field.
Remove `isHandoff` from zone state objects.

- [ ] **Step 4: Update all other test files referencing Target**

Run: `grep -rn "active:.*true\|pending:.*true\|pending:.*false" frontend/src/__tests__/ | grep -v node_modules`

Fix all remaining references.

- [ ] **Step 5: Run all frontend tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npx vitest run`
Expected: all 763+ tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/__tests__/
git commit -m "test: update frontend tests for unified target status"
```

---

### Task 11: Update parity tests (TS side) and run full parity suite

**Files:**
- Modify: `frontend/src/__tests__/panel-zone-engine-parity.test.ts` (if not done in Task 10)

- [ ] **Step 1: Run Python + TS parity tests together**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && python -m pytest tests/test_zone_engine_parity.py -x -q && cd frontend && npx vitest run src/__tests__/panel-zone-engine-parity.test.ts`
Expected: both pass

- [ ] **Step 2: Commit if any changes needed**

---

### Task 12: Update docs

**Files:**
- Modify: `docs/backend-data-catalog.md:66-107`
- Modify: `docs/architecture.md`

- [ ] **Step 1: Update backend-data-catalog.md**

Replace the `targets[]`, `pending_targets[]`, and update cadence sections (lines 66-107) with:

```markdown
### `targets[]` (up to 3)

| Field | Type | Notes |
|-------|------|-------|
| `x` | float (mm) | calibrated room-space |
| `y` | float (mm) | calibrated room-space |
| `raw_x` | float (mm) | sensor-space (for FOV overlay) |
| `raw_y` | float (mm) | sensor-space |
| `status` | string | `"active"`, `"pending"`, or `"inactive"` |
| `signal` | int 0-9 | min(frames_in_window, 9) |

Update cadence: zone engine ticks every ~1s (tumbling window). No inter-tick display updates.
```

Remove the `### pending_targets[]` section entirely.

- [ ] **Step 2: Update architecture.md**

Find references to `pending_targets` and `ProcessingResult` in `docs/architecture.md` and update:
- `ProcessingResult` description: mention `targets: list[TargetResult]`
- Remove `pending_targets` from the websocket message format
- Update the data flow description

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: update data catalog and architecture for unified target status"
```

---

### Task 13: Build, full test suite, and verify

- [ ] **Step 1: Build frontend**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npm run build`
Expected: builds successfully

- [ ] **Step 2: Run full Python test suite**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && python -m pytest tests/ -q`
Expected: all pass

- [ ] **Step 3: Run full frontend test suite**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npx vitest run`
Expected: all pass

- [ ] **Step 4: Run ruff format and lint**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && ruff format custom_components/ tests/ && ruff check custom_components/ tests/ --fix`

- [ ] **Step 5: Final commit if formatting changed**

```bash
git add -A
git commit -m "style: ruff format"
```

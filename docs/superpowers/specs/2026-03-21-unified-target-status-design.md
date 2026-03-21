# Unified Target Status

**Date:** 2026-03-21
**Status:** Approved

## Problem

Targets and their pending status are sent as two separate data structures:
`targets[]` (positions + active flag) and `pending_targets[]` (last-known
positions for faded dots). The frontend merges them on arrival.

This causes a visual glitch: between zone engine window ticks (~1s), the
coordinator dispatches display updates with fresh target positions but stale
`pending_targets` from the last tick. When a target becomes inactive between
ticks, it disappears for up to one second before reappearing faded.

The data model also uses parallel arrays (`target_signals: list[int]` alongside
the target list) and two booleans (`active` + `pending`) for what is really a
three-state enum.

## Design

### Target status enum

Replace `active: bool` + `pending: bool` with a single status field.

**Python:**

```python
class TargetStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    INACTIVE = "inactive"
```

**TypeScript:**

```typescript
type TargetStatus = "active" | "pending" | "inactive";
```

### TargetResult dataclass

Each target carries all its properties in one object. List position is the
target slot index (0, 1, 2) — no separate `target_index` field needed.

```python
@dataclass
class TargetResult:
    x: float            # calibrated room-space (mm)
    y: float            # calibrated room-space (mm)
    status: TargetStatus
    signal: int         # 0-9 frames in window
```

Notes:
- `speed` is not included — it is not a zone engine concern and is only used
  by HA entities via `coordinator.target_speed()` which reads raw sensor state.
- `zone_id` is not included — the frontend does not use it and debug logging
  is handled separately.

### ProcessingResult changes

```python
@dataclass
class ProcessingResult:
    device_tracking_present: bool = False
    zone_occupancy: dict[int, bool] = field(default_factory=dict)
    zone_target_counts: dict[int, int] = field(default_factory=dict)
    frame_count: int = 0
    targets: list[TargetResult] = field(default_factory=list)
    debug_log: str = ""
```

**Removed fields:** `target_signals`, `pending_targets`.

**Initialization:** The coordinator initializes `_last_result = ProcessingResult()`
which produces an empty `targets` list. The websocket handler must handle this
by falling back to MAX_TARGETS inactive targets when `last_result.targets` is
empty (before the first window tick, ~1s after startup).

### Zone engine _tick() changes

After the state machine runs, build one `TargetResult` per target slot:

- Active + confirmed in a zone: `status=ACTIVE, signal=N, x/y from window median`
- Inactive but in a PENDING zone's confirmed_targets: `status=PENDING, signal=0, x/y = last known position`
- Otherwise: `status=INACTIVE, signal=0, x/y=0`

The `pending_targets` list construction is removed.

The TypeScript zone engine mirrors this exactly.

### Coordinator changes

- Remove `_targets: list[tuple[float, float, bool]]` — use `last_result.targets`
- Remove `_do_display_update()` and `_rebuild_scheduled` — only dispatch on window ticks
- `coordinator.targets` property returns `last_result.targets`
- `_build_calibrated_targets()` is still used to feed `zone_engine.feed_raw()` but is not stored separately
- `raw_targets` (sensor-space positions) retained for the websocket layer

**Properties that currently read `_targets`:**

- `target_present` — `any(t[2] for t in self._targets)` → read from
  `last_result.targets` using `any(t.status == TargetStatus.ACTIVE for t in ...)`
- `target_count` — same pattern, count ACTIVE targets
- `target_distance(index)` / `target_angle(index)` — currently use per-frame
  positions from `_targets`. Will now use window-median positions from
  `last_result.targets`. This is actually more stable for HA entity values.
  These only update on `SIGNAL_TARGETS_UPDATED` dispatch anyway, so tick-rate
  is sufficient.
- `_expiry_tick()` — currently sets `self._targets = empty`. Will instead
  just update `_last_result` from the zone engine result (which already returns
  all targets as INACTIVE when fed empty targets).

### Websocket message format

```json
{
  "targets": [
    {"x": 1200, "y": 800, "raw_x": 1100, "raw_y": 750, "status": "active", "signal": 7},
    {"x": 0, "y": 0, "raw_x": 0, "raw_y": 0, "status": "inactive", "signal": 0},
    {"x": 500, "y": 300, "raw_x": 500, "raw_y": 300, "status": "pending", "signal": 0}
  ],
  "sensors": { ... },
  "zones": { ... }
}
```

No more `pending_targets` key. The websocket handler zips `last_result.targets`
with `coordinator.raw_targets` to add `raw_x`/`raw_y`.

### Frontend changes

- `Target` interface: replace `active: boolean` + `pending?: boolean` with
  `status: TargetStatus`. The `speed` field remains (unused but harmless).
- `_subscribeTargets()`: map each target directly from the message — remove
  the `pending_targets` merge loop
- Rendering visibility: `t.status !== "inactive"` (both active and pending
  targets render). Opacity: `t.status === "pending" ? 0.3 : 1`.
- Local zone engine: `t.status !== "active"` skips non-active targets for
  zone confirmation (replaces `!t.active || t.pending`). Returns `status`
  field directly on each target instead of separate booleans.

### Update cadence

Only window tick dispatches (~1s). The inter-tick 200ms display update path
is removed. This eliminates the desync window entirely — targets and zone
state are always from the same tick. Target dot movement will be slightly
choppier (~1 FPS vs ~5 FPS) — this trade-off was explicitly chosen for
simplicity and can be revisited if needed.

## Files affected

**Python:**
- `zone_engine.py` — TargetStatus enum, TargetResult dataclass, ProcessingResult, _tick()
- `coordinator.py` — remove _targets, _do_display_update, update targets/target_present/target_count/target_distance/target_angle properties
- `websocket_api.py` — new message format, remove pending_targets
- `binary_sensor.py` / `sensor.py` — update any reads of ProcessingResult fields

**Frontend:**
- `frontend/src/everything-presence-pro-panel.ts` — Target interface, subscribe handler, local zone engine, rendering guards

**Tests:**
- `tests/test_zone_engine.py` — assertions on pending_targets, target_signals → targets
- `tests/test_zone_engine_parity.py` — parity assertions on new TargetResult format
- `tests/test_coordinator.py` — coordinator.pending_targets, _targets construction
- `tests/test_binary_sensor.py` — ProcessingResult construction
- `tests/test_sensor.py` — ProcessingResult construction
- `tests/test_websocket_api.py` — pending_targets assertions in message format
- `frontend/src/__tests__/panel-zone-engine-parity.test.ts` — TS parity tests
- `frontend/src/__tests__/panel-inline-handlers.test.ts` — pending target merge tests
- `frontend/src/__tests__/panel-branch-coverage.test.ts` — zone state with isHandoff/pending

**Docs:**
- `docs/backend-data-catalog.md` — update message format
- `docs/architecture.md` — update ProcessingResult references

# Baseline calibration: per-cell ghost heatmap

## Context

The LD2450 mmWave sensor in the Everything Presence Pro reports false "ghost" targets caused by static reflections from furniture, walls, pipes, and other objects. The Aqara FP2 solves this with an "AI configuration mode" that learns empty-room echoes. We're implementing a similar system that integrates with the existing 20x16 grid-based zone engine.

The system has two independently-enableable modes:
- **Manual calibration** — user clears the room, presses a button, system records ghost positions over 30-60s
- **Continuous learning** — system gradually learns ghost cells over time by correlating stationary LD2450 targets against PIR/SEN0609 activity

Both modes feed a shared per-cell ghost score array. Ghost scores raise the frame-count threshold for that cell, making ghost-heavy cells harder to trigger. Cells above a "definite ghost" threshold are effectively auto-excluded.

## Architecture

### Data model: `GhostMap`

A new class in a new file `ghost_map.py` holding:
- `scores: list[float]` — 320-element array (one per grid cell), values 0.0 to 1.0
- `manual_enabled: bool` — whether manual calibration data is active
- `continuous_enabled: bool` — whether continuous learning is active
- `calibrating: bool` — true during a manual calibration session
- `calibration_start: float | None` — timestamp when manual calibration began

Key methods:
- `start_calibration(duration_s: int = 60)` — begin manual calibration window
- `record_target(cell: int)` — called during calibration to record a ghost hit
- `finish_calibration()` — normalize calibration hits into ghost scores
- `continuous_update(cell: int, is_stationary: bool, corroborated: bool)` — called each frame during normal operation; increments score for stationary uncorroborated targets, decays score for corroborated or absent targets
- `get_threshold_boost(cell: int) -> int` — returns additional frame-count threshold for this cell based on ghost score (0 for clean cells, up to e.g. +10 for definite ghosts)
- `clear()` — reset all scores to zero
- `to_dict() / from_dict()` — serialization for config entry persistence

### Integration points

#### 1. `zone_engine.py` — `ZoneEngine.process_targets()`

Currently checks: outside cell → exclusion zone → zone membership → frame counting.

**Change:** After the exclusion zone check and before zone membership, consult the ghost map. The ghost map provides a per-cell threshold boost that gets added to the zone's base sensitivity threshold. This means ghost cells aren't hard-excluded — they just need more consecutive frames to confirm, proportional to how "ghosty" they are.

Specifically, in `process_targets()`:
- Pass ghost map reference (set via `set_ghost_map()`)
- When computing `occupied` for a zone, the effective threshold becomes: `base_threshold + max(ghost_boost for cells in zone with targets)`
- Alternative (simpler): apply ghost filtering at the cell level before zone aggregation — if a cell's ghost score exceeds a hard cutoff (e.g., 0.9), treat it like an exclusion cell

**Recommended approach:** Hybrid — cells with score >= 0.9 are hard-excluded (definite ghosts), cells with score 0.1-0.9 add proportional frame-count boost. This gives clean binary behavior for obvious ghosts while gracefully handling borderline cells.

#### 2. `coordinator.py` — target processing pipeline

**Changes needed:**
- Add `_ghost_map: GhostMap` field, initialized in `__init__`
- Subscribe to target speed data (add `target_{n}_speed` to `_classify_entity()` and `_handle_sensor()`, store in `_target_speed: list[float]`)
- In `_do_rebuild()`, after computing calibrated positions, feed each active target's cell into the ghost map:
  - During manual calibration: call `ghost_map.record_target(cell)`
  - During continuous learning: call `ghost_map.continuous_update(cell, is_stationary, corroborated)` where:
    - `is_stationary = abs(speed) < SPEED_THRESHOLD` (e.g., 5 cm/s)
    - `corroborated = self._pir_motion or self._static_present` (SEN0609 agrees someone is there)
- Pass `_ghost_map` to zone engine via `set_ghost_map()`
- Include ghost map data in `get_config_data()` / `load_config_data()`

#### 3. `websocket_api.py` — new commands

- `everything_presence_pro/start_calibration` — begins manual calibration (params: `entry_id`, optional `duration` defaulting to 60s)
- `everything_presence_pro/stop_calibration` — ends calibration early
- `everything_presence_pro/set_ghost_map_config` — enable/disable manual and continuous learning independently (params: `entry_id`, `manual_enabled`, `continuous_enabled`)
- `everything_presence_pro/clear_ghost_map` — reset all ghost scores to zero
- `everything_presence_pro/get_ghost_map` — return current ghost scores array (for frontend visualization)

#### 4. `const.py` — new constants

```python
# Ghost map defaults
GHOST_HARD_EXCLUDE_THRESHOLD = 0.9
GHOST_BOOST_SCALE = 10  # max additional frames at score=1.0
SPEED_STATIONARY_THRESHOLD = 5.0  # cm/s
CALIBRATION_DEFAULT_DURATION = 60  # seconds
CONTINUOUS_LEARNING_INCREMENT = 0.01
CONTINUOUS_LEARNING_DECAY = 0.001
```

#### 5. Frontend panel

- Add a "Calibration" section/tab to the panel with:
  - Toggle switches for manual calibration (enabled/disabled) and continuous learning (enabled/disabled)
  - "Calibrate now" button that starts manual calibration with a countdown timer
  - Ghost heatmap overlay on the room grid — cells colored by ghost score (transparent at 0, red at 1.0)
  - "Clear ghost data" button
- The ghost heatmap visualization uses the existing grid canvas — overlay cell colors with opacity proportional to ghost score

#### 6. Persistence

Ghost map data persisted in config entry options under `config.ghost_map`:
```python
{
    "scores": [0.0, 0.0, 0.85, ...],  # 320 floats
    "manual_enabled": True,
    "continuous_enabled": True,
}
```

Loaded in `coordinator.load_config_data()`, saved after calibration completes and periodically during continuous learning (e.g., every 5 minutes to avoid excessive writes).

## Key files to modify

| File | Change |
|------|--------|
| `ghost_map.py` (new) | `GhostMap` class with all ghost score logic |
| `zone_engine.py` | Accept ghost map, apply threshold boost / hard exclusion in `process_targets()` |
| `coordinator.py` | Subscribe to speed data, feed ghost map in `_do_rebuild()`, manage calibration lifecycle |
| `websocket_api.py` | 4 new WS commands for calibration control and ghost map access |
| `const.py` | Ghost map constants (thresholds, rates, defaults) |
| `frontend/src/everything-presence-pro-panel.ts` | Calibration UI section, ghost heatmap overlay |
| `tests/test_ghost_map.py` (new) | Unit tests for `GhostMap` |
| `tests/test_zone_engine.py` | Tests for ghost-boosted thresholds |

## Implementation order

1. **`ghost_map.py` + `test_ghost_map.py`** — core data model and logic, fully testable in isolation
2. **`const.py`** — add constants
3. **`zone_engine.py` + test updates** — integrate ghost map into target processing
4. **`coordinator.py`** — subscribe to speed, wire ghost map into rebuild pipeline
5. **`websocket_api.py`** — calibration and ghost map WS commands
6. **Frontend panel** — UI for calibration controls and ghost heatmap overlay

## Continuous learning algorithm detail

Each frame (~10Hz), for each active target mapped to a grid cell:

```
if target is stationary AND NOT corroborated by PIR/SEN0609:
    scores[cell] += CONTINUOUS_LEARNING_INCREMENT  # slow accumulation
elif target is moving OR corroborated:
    scores[cell] -= CONTINUOUS_LEARNING_DECAY * 10  # faster decay when proven real
else (no target in cell):
    scores[cell] -= CONTINUOUS_LEARNING_DECAY       # very slow natural decay

scores[cell] = clamp(scores[cell], 0.0, 1.0)
```

This means:
- A genuine ghost reflection (always present, never moves, never corroborated) reaches score 1.0 in ~100s
- A real person sitting still gets corroborated by PIR/SEN0609 and their cell score decays
- When nobody is in a cell, its score slowly drifts toward zero (self-healing if furniture moves)

## Manual calibration algorithm detail

1. User triggers "Calibrate" → `start_calibration(60)`
2. For 60 seconds, every frame: `record_target(cell)` increments a per-cell hit counter
3. At ~10Hz for 60s = ~600 frames total
4. `finish_calibration()`: normalize each cell's hit count by dividing by total frames. Cells that had targets in >50% of frames get score 0.9+. Cells with occasional hits get proportional scores.
5. Manual scores overwrite (not add to) the ghost map when manual calibration completes. Continuous learning scores resume accumulating on top.

## Verification

1. **Unit tests:** `pytest tests/test_ghost_map.py tests/test_zone_engine.py`
2. **Manual calibration flow:** Open panel → enable manual calibration → press "Calibrate now" → leave room → verify ghost cells appear red on heatmap → verify those cells no longer trigger zone occupancy
3. **Continuous learning:** Enable continuous learning → place a metal object in a zone → wait 2-3 minutes → verify its cell gradually turns red → remove object → verify score decays over time
4. **Persistence:** Restart HA → verify ghost scores survive restart
5. **Independence:** Enable only manual, only continuous, both, neither — verify each combination works correctly

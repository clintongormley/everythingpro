# WebSocket subscription redesign

Replace `subscribe_targets` and `subscribe_display` with two purpose-built subscriptions that cleanly separate coordinate spaces, update rates, and gating responsibilities.

## Problem

The current two subscriptions evolved organically and have confused responsibilities:

- `subscribe_targets` (1Hz): sends room-gated targets + sensors + zones, but also includes ungated `raw_x`/`raw_y` for the FOV overlay. The detection zone editor subscribes to it but can't preview zone changes because targets are gated by the backend's saved grid.
- `subscribe_display` (5Hz): was added for smooth animation but mixes calibrated and raw positions, and the calibration screen and zone editor need different subsets of its data.

Targets are invisible during room calibration because the backend's grid has no room cells before calibration is complete, and both subscriptions gate on the grid.

## Design

### `subscribe_raw_targets` (5Hz)

Sensor-space positions for the FOV overlay and room calibration wizard.

**Request:** `{ "type": "everything_presence_pro/subscribe_raw_targets", "entry_id": str }`

**Event payload:**

```json
{
  "target_count": 1,
  "targets": [
    { "raw_x": 1234.0, "raw_y": 2100.0 },
    { "raw_x": 0.0, "raw_y": 0.0 },
    { "raw_x": 0.0, "raw_y": 0.0 }
  ]
}
```

| Field | Type | Update rate | Notes |
|-------|------|-------------|-------|
| `target_count` | int 0-3 | 5Hz | count of targets with non-zero positions |
| `targets[].raw_x` | float (mm) | 5Hz | sensor-space, rolling median smoothed |
| `targets[].raw_y` | float (mm) | 5Hz | sensor-space, rolling median smoothed |

- No room gating, no zone logic.
- Always populated when ESPHome reports the target as active.
- Smoothed via DisplayBuffer rolling median (10-frame deque at ~10Hz input = ~1s window).
- Used by: room calibration wizard, FOV overlay on live overview.

### `subscribe_grid_targets` (5Hz positions, 1Hz state)

Calibrated room-space positions plus zone engine state for the grid view and detection zone editor.

**Request:** `{ "type": "everything_presence_pro/subscribe_grid_targets", "entry_id": str }`

**Event payload:**

```json
{
  "targets": [
    { "x": 1500.0, "y": 2000.0, "signal": 7, "status": "active" },
    { "x": 0.0, "y": 0.0, "signal": 0, "status": "inactive" },
    { "x": 0.0, "y": 0.0, "signal": 0, "status": "inactive" }
  ],
  "sensors": {
    "occupancy": true,
    "static_presence": false,
    "motion_presence": true,
    "target_presence": true,
    "illuminance": 250.5,
    "temperature": 21.5,
    "humidity": 45.0,
    "co2": 450.0
  },
  "zones": {
    "occupancy": { "0": true, "1": false },
    "target_counts": { "0": 1, "1": 0 },
    "frame_count": 10,
    "debug_log": "T0: signal=7 zone='Room' confirmed=Y | Room: occupied (1)"
  }
}
```

| Field | Type | Update rate | Notes |
|-------|------|-------------|-------|
| `targets[].x` | float (mm) | 5Hz | calibrated room-space, rolling median, NOT room-gated |
| `targets[].y` | float (mm) | 5Hz | calibrated room-space, rolling median, NOT room-gated |
| `targets[].signal` | int 0-9 | 1Hz (cached) | from zone engine tumbling window |
| `targets[].status` | string | 1Hz (cached) | `"active"`, `"pending"`, `"inactive"` — room-gated |
| `sensors.*` | various | 1Hz (cached) | environment + presence sensors |
| `zones.*` | various | 1Hz (cached) | zone occupancy and state |

- `x`/`y` update at 5Hz from the DisplayBuffer. Always populated when the sensor tracks a target, regardless of room grid. This is what the detection zone editor needs to run its local zone engine on unsaved grid configurations.
- `signal` and `status` are cached from the last zone engine tick (~1Hz). Up to 1s stale relative to position — acceptable since the tumbling window inherently operates on 1s boundaries.
- `status` is room-gated: targets outside the backend's saved room grid are `"inactive"`. The live overview uses this to filter. The detection zone editor ignores it and applies its own local grid.
- `sensors` and `zones` are cached from the last zone engine tick / sensor update. Small payload, not worth a separate subscription.
- Used by: live overview grid view, detection zone editor.

### Removed subscriptions

- `subscribe_targets`: replaced by `subscribe_grid_targets`.
- `subscribe_display`: replaced by `subscribe_raw_targets` (calibration) and `subscribe_grid_targets` (zone editor).

### Frontend screen -> API mapping

| Screen | Subscriptions | Fields used | Commands |
|--------|---------------|-------------|----------|
| Device picker | — | — | `list_entries` |
| Room calibration | `subscribe_raw_targets` | `target_count`, `raw_x`, `raw_y` | `set_setup` |
| Live overview (FOV) | `subscribe_raw_targets` | `target_count`, `raw_x`, `raw_y` | — |
| Live overview (grid) | `subscribe_grid_targets` | all fields | `get_config` |
| Detection zone editor | `subscribe_grid_targets` | `x`, `y`, `signal` (ignores `status`) | `set_room_layout`, `rename_zone_entities` |
| Reporting settings | — | — | `get_config`, `set_reporting` |

## Implementation

### Coordinator changes

- DisplayBuffer is already fed on every ESPHome frame in `_schedule_rebuild()`. No change needed.
- `_flush_display()` emits `SIGNAL_DISPLAY_UPDATED` at 5Hz (throttled to 200ms). No change needed.
- Add cached copies of the 1Hz fields (`_last_result` already serves this role for zone engine state, sensor properties already exist on coordinator).

### websocket_api.py changes

- Remove `websocket_subscribe_targets` and `websocket_subscribe_display`.
- Add `websocket_subscribe_raw_targets`:
  - Subscribes to `SIGNAL_DISPLAY_UPDATED`.
  - Reads `coordinator.last_display_snapshot` for smoothed raw positions.
  - Tracks subscriber count via `increment/decrement_display_subscribers()`.
- Add `websocket_subscribe_grid_targets`:
  - Subscribes to `SIGNAL_DISPLAY_UPDATED` (5Hz for positions).
  - Reads `coordinator.last_display_snapshot` for smoothed grid positions.
  - Caches sensors/zones/signal/status from coordinator properties (updated at 1Hz by zone engine tick and sensor updates).
  - Tracks subscriber count via `increment/decrement_display_subscribers()`.
- Update `async_register_websocket_commands` to register the new commands.

### DisplayBuffer changes

Already correct: feeds both calibrated and raw deques on every ESPHome-active frame, independent of room gating.

### Signal flow

```
ESPHome 10Hz frames
    → _on_state() → _schedule_rebuild()
        → _build_calibrated_targets()     (room-gated for zone engine)
        → zone_engine.feed_raw()          (1Hz tumbling window → ProcessingResult)
        → display_buffer.feed()           (always, ungated positions)
        → SIGNAL_TARGETS_UPDATED          (1Hz, on zone engine tick)
        → SIGNAL_DISPLAY_UPDATED          (5Hz, throttled)

subscribe_raw_targets ← SIGNAL_DISPLAY_UPDATED
    → reads display_buffer snapshot → sends raw_x/raw_y + target_count

subscribe_grid_targets ← SIGNAL_DISPLAY_UPDATED
    → reads display_buffer snapshot → sends x/y (5Hz)
    → reads cached zone engine result → sends signal/status/sensors/zones (1Hz values, cached)
```

### Test changes

- Remove tests for `subscribe_targets` and `subscribe_display`.
- Add tests for `subscribe_raw_targets`: verifies smoothed raw positions, target_count, subscriber tracking.
- Add tests for `subscribe_grid_targets`: verifies ungated grid positions at 5Hz, cached status/signal/sensors/zones from 1Hz tick.

### backend-data-catalog.md

Update sections 2, 3, and 5 to reflect the new subscription names and payloads.

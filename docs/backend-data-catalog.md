# Backend Data Catalog

Data required from the backend (today Python, future firmware) for each functional area.

## 1. HA Entities

All data comes from ESPHome API subscriptions via the coordinator.

### Environmental Sensors

| Data | Type | Source |
|------|------|--------|
| `illuminance` | float (lux) | BH1750 sensor + offset |
| `temperature` | float (°C) | SHTC3 sensor + offset |
| `humidity` | float (%) | SHTC3 sensor + offset |
| `co2` | float (ppm) | SCD40 sensor (optional) |

### Room-Level Presence

| Data | Type | Source |
|------|------|--------|
| `occupancy` | bool | PIR OR static OR tracking (combined) |
| `motion` | bool | PIR sensor |
| `static_presence` | bool | mmWave sensor |
| `target_presence` | bool | any active tracked target |
| `target_count` | int | count of active targets (0-3) |

### Per-Target (x3)

| Data | Type | Source |
|------|------|--------|
| `xy_sensor` | string "{x},{y}" (mm) | raw LD2450 coordinates |
| `xy_grid` | string "{x},{y}" (mm) | perspective-transformed coordinates |
| `distance` | float (mm) | Euclidean distance from sensor |
| `angle` | float (°) | bearing from sensor |
| `speed` | float (mm/s) | LD2450 velocity |
| `resolution` | float (mm) | LD2450 resolution quality |
| `active` | bool | target being tracked |

### Per-Zone (x8: zone 0 "rest of room" + zones 1-7)

| Data | Type | Source |
|------|------|--------|
| zone occupancy | bool | zone engine state machine |
| zone target count | int | zone engine |

### Reporting Toggles

18 boolean flags in `config.reporting` controlling which entities get created:

- Room level: `room_occupancy`, `room_static_presence`, `room_motion_presence`, `room_target_presence`, `room_target_count`
- Target level: `target_xy_sensor`, `target_xy_grid`, `target_active`, `target_distance`, `target_angle`, `target_speed`, `target_resolution`
- Zone level: `zone_presence`, `zone_target_count`
- Environmental: `env_illuminance`, `env_humidity`, `env_temperature`, `env_co2`

### Sensor Offsets

3 floats: `illuminance`, `temperature`, `humidity` — additive corrections.

---

## 2. Live Overview

Single websocket subscription (`subscribe_targets`) pushes this message structure.

### `targets[]` (up to 3)

| Field | Type | Notes |
|-------|------|-------|
| `x` | float (mm) | calibrated room-space |
| `y` | float (mm) | calibrated room-space |
| `raw_x` | float (mm) | sensor-space (for FOV overlay) |
| `raw_y` | float (mm) | sensor-space |
| `active` | bool | currently tracked |
| `signal` | int 0-9 | min(frames_in_window, 9) |

### `sensors`

| Field | Type | Notes |
|-------|------|-------|
| `occupancy` | bool | combined PIR OR static OR tracking |
| `static_presence` | bool | mmWave |
| `pir_motion` | bool | PIR |
| `target_presence` | bool | any target actively tracked |
| `illuminance` | float\|null | with offset, clamped >= 0 |
| `temperature` | float\|null | with offset |
| `humidity` | float\|null | with offset |
| `co2` | float\|null | optional sensor |

### `zones`

| Field | Type | Notes |
|-------|------|-------|
| `occupancy` | dict[zone_id -> bool] | state != CLEAR |
| `target_counts` | dict[zone_id -> int 0-9] | best signal in zone |
| `frame_count` | int | max(window_total, 10) |
| `debug_log` | string | human-readable tick summary for debug panel |

### `pending_targets[]`

| Field | Type | Notes |
|-------|------|-------|
| `x` | float (mm) | last known room-space position |
| `y` | float (mm) | last known room-space position |
| `target_index` | int 0-2 | which target slot |

Update cadence: zone engine ticks every ~1s (tumbling window); display throttled at 200ms between ticks.

---

## 3. Room Calibration

### From firmware (live during wizard)

| Data | Type | Notes |
|------|------|-------|
| `raw_x` | float (mm) | per-target, range +/-6000 |
| `raw_y` | float (mm) | per-target, range 0-6000 |
| `active` | bool | per-target |
| target count | int | must be exactly 1 for capture |

### Wizard captures (frontend-computed)

| Data | Type | Notes |
|------|------|-------|
| 4 corner positions | (raw_x, raw_y) per corner | median of ~2-5s samples |
| offset_side per corner | int (0.1mm units) | horizontal edge offset |
| offset_fb per corner | int (0.1mm units) | front-back edge offset |

### Outputs (saved via `set_setup`)

| Data | Type | Notes |
|------|------|-------|
| `perspective` | float[8] | homography coefficients [a,b,c,d,e,f,g,h] |
| `room_width` | float (mm) | computed from corner distances |
| `room_depth` | float (mm) | computed from corner distances |

The perspective transform is solved entirely in the frontend (`solvePerspective()`) and sent to the backend. The backend applies it at runtime: `rx = (a*sx + b*sy + c) / (g*sx + h*sy + 1)`.

---

## 4. Detection Zones

This area requires strict Python/JS sync. The frontend replicates the backend model for live preview before saving.

### Zone Config (per zone, up to 7)

| Field | Type | Notes |
|-------|------|-------|
| `id` | int 1-7 | slot index |
| `name` | str | user label |
| `type` | enum | normal, entrance, thoroughfare, rest, custom |
| `color` | str | hex color |
| `trigger` | int 0-9 | frames needed to confirm presence |
| `renew` | int 0-9 | frames needed to maintain presence |
| `timeout` | float (s) | PENDING -> CLEAR delay |
| `handoff_timeout` | float (s) | accelerated timeout when target moves zones |
| `entry_point` | bool | allows targets to appear without continuity |

### Grid (20x20 = 400 cells)

| Field | Type | Notes |
|-------|------|-------|
| cell byte | uint8 | bit 0: room flag, bits 1-3: zone ID (0-7) |
| `origin_x`, `origin_y` | float (mm) | grid origin in room-space |

### Zone Engine Logic (must match in both Python and JS)

| Algorithm | Key Parameters |
|-----------|---------------|
| Tumbling window | 1s window, median position per target |
| Target -> cell mapping | `xy_to_cell()` with origin offset |
| Continuity check | Chebyshev distance <= 5 cells |
| Entry point gating | 2 consecutive ticks at `min(threshold + 2, 8)` for non-entry zones |
| Threshold conversion | `max(1, threshold)` -> frame count |
| State machine | CLEAR/OCCUPIED/PENDING with trigger/renew/timeout |
| Handoff | pending_since adjusted by `timeout - handoff_timeout` |

### Room-Level Settings

| Field | Type | Notes |
|-------|------|-------|
| `room_type` | str | zone type for "rest of room" |
| `room_trigger` | int 0-9 | |
| `room_renew` | int 0-9 | |
| `room_timeout` | float | |
| `room_handoff_timeout` | float | |
| `room_entry_point` | bool | |

### Furniture (visual only)

| Field | Type |
|-------|------|
| `icon` | str (MDI or SVG key) |
| `label` | str |
| `x`, `y` | float (mm) |
| `width`, `height` | float (mm) |
| `rotation` | float (degrees) |
| `lockAspect` | bool |

---

## Cross-Cutting: Files That Must Stay in Sync

| Python | JS/TS | What |
|--------|-------|------|
| `zone_engine.py` | `everything-presence-pro-panel.ts` (~lines 4814-5050) | State machine, gating, handoff, continuity |
| `const.py` | `zone-defaults.ts` | Zone type defaults, bit masks |
| `calibration.py` | `perspective.ts` | Perspective transform |
| `zone_engine.py` Grid class | `grid.ts` | Cell encoding, bit ops |
| `zone_engine.py` `xy_to_cell` | `coordinates.ts` | Room -> grid mapping |

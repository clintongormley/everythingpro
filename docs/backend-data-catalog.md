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

Websocket subscription `subscribe_targets` (~1 Hz) pushes this message structure. See [section 5](#subscribe_targets--live-overview) for API details.

### `targets[]` (up to 3)

| Field | Type | Notes |
|-------|------|-------|
| `x` | float (mm) | calibrated room-space (1s tumbling window median), 0 if outside room |
| `y` | float (mm) | calibrated room-space, 0 if outside room |
| `raw_x` | float (mm) | sensor-space, rolling median smoothed (for FOV overlay), 0 if outside room |
| `raw_y` | float (mm) | sensor-space, rolling median smoothed, 0 if outside room |
| `status` | string | `"active"`, `"pending"`, or `"inactive"` — room-gated by backend grid |
| `signal` | int 0-9 | min(frames_in_window, 9) |

Targets outside the room grid are reported as `"inactive"` with zeroed positions. The backend fully owns room gating and zone assignment for this API.

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

Update cadence: zone engine ticks every ~1s (tumbling window).

---

## 3. Room Calibration

The calibration wizard uses `subscribe_display` (5 Hz) for smoothed raw target positions. See [section 5](#subscribe_display--calibration--smooth-display) for API details. Calibration results are saved via `set_setup`.

### From sensor (live during wizard, via `subscribe_display`)

| Data | Type | Notes |
|------|------|-------|
| `raw_x` | float (mm) | per-target, range +/-6000, rolling median smoothed |
| `raw_y` | float (mm) | per-target, range 0-6000, rolling median smoothed |
| `signal` | int 0-9 | 0 = no target, >0 = sensor is tracking |
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

## 5. WebSocket API

All frontend-backend communication uses HA websocket commands under the `everything_presence_pro/` namespace. Defined in `websocket_api.py`.

### Subscriptions (live data)

#### `subscribe_targets` — live overview

Used by the grid view / live overview screen. Pushes on zone engine tick (~1 Hz) and on sensor changes.

**Request:** `{ "type": "everything_presence_pro/subscribe_targets", "entry_id": str }`

**Event payload:** see [section 2 (Live Overview)](#2-live-overview) for full field listing.

Both subscriptions use the same DisplayBuffer rolling median for `raw_x`/`raw_y`, so raw positions are always smoothed and consistent. The `x`/`y` fields are calibrated room-space coordinates from the zone engine's 1s tumbling window median.

#### `subscribe_display` — calibration & smooth display

Used by the calibration wizard and any screen needing smooth target positions. Pushes at up to 5 Hz via the DisplayBuffer rolling median. Only active when at least one subscriber is connected (opt-in to avoid unnecessary work).

**Request:** `{ "type": "everything_presence_pro/subscribe_display", "entry_id": str }`

**Event payload:**

| Field | Type | Notes |
|-------|------|-------|
| `targets[].x` | float (mm) | calibrated room-space, rolling median (only when inside room grid) |
| `targets[].y` | float (mm) | calibrated room-space, rolling median |
| `targets[].raw_x` | float (mm) | sensor-space, rolling median (always available when sensor is tracking) |
| `targets[].raw_y` | float (mm) | sensor-space, rolling median |
| `targets[].signal` | int 0-9 | frame count in deque, capped at 9 |

The key difference from `subscribe_targets`: raw positions are smoothed with a rolling median and are always available when the sensor detects a target, even if the target falls outside the calibrated room grid. This is what makes room calibration work — targets are visible before/during calibration when no room grid exists yet.

### Commands (one-shot)

#### `list_entries`

Returns all configured EPP devices with setup status flags.

**Request:** `{ "type": "everything_presence_pro/list_entries" }`

**Response:**

| Field | Type | Notes |
|-------|------|-------|
| `[].entry_id` | str | config entry ID |
| `[].title` | str | device name (user-set or default) |
| `[].has_perspective` | bool | calibration completed |
| `[].has_layout` | bool | room layout saved |

#### `get_config`

Returns the full config for a device (calibration, zones, grid, layout, reporting, offsets).

**Request:** `{ "type": "everything_presence_pro/get_config", "entry_id": str }`

**Response:** the coordinator's `get_config_data()` dict — contains calibration, grid, zones, room_layout, reporting, and offsets.

#### `set_setup`

Saves perspective transform + room dimensions. Clears existing room layout and zones (grid dimensions change). Called at the end of the calibration wizard.

**Request:**

| Field | Type | Notes |
|-------|------|-------|
| `entry_id` | str | |
| `perspective` | float[8] | homography coefficients [a,b,c,d,e,f,g,h] |
| `room_width` | float (mm) | |
| `room_depth` | float (mm) | |

**Side effects:** clears room_layout, zones; rebuilds grid; persists to config entry options.

#### `set_room_layout`

Saves the grid cell painting, zone slot definitions, room-level settings, and furniture. This is the primary way zones are configured (replaces the older `set_zones`).

**Request:**

| Field | Type | Notes |
|-------|------|-------|
| `entry_id` | str | |
| `grid_bytes` | int[] | 400 cell bytes (20x20) |
| `zone_slots` | (object\|null)[8] | zone config per slot, null = empty |
| `room_type` | str | zone type for "rest of room" (default: "normal") |
| `room_trigger` | int 0-9 | optional |
| `room_renew` | int 0-9 | optional |
| `room_timeout` | float | optional |
| `room_handoff_timeout` | float | optional |
| `room_entry_point` | bool | optional |
| `furniture` | object[] | visual-only furniture stickers |

**Response:** `{ "entity_id_renames": [{ "old_entity_id", "new_entity_id" }] }` — suggested entity ID renames based on zone names.

**Side effects:** updates zone engine, persists layout, enables/disables zone entities based on slot occupancy and reporting toggles.

#### `set_zones`

Sets zone definitions directly (without grid painting). Simpler than `set_room_layout` but doesn't handle grid cells or entity management.

**Request:**

| Field | Type | Notes |
|-------|------|-------|
| `entry_id` | str | |
| `zones` | object[] | zone configs with id, name, type, thresholds |

#### `set_reporting`

Enables/disables reporting entities and saves sensor offsets.

**Request:**

| Field | Type | Notes |
|-------|------|-------|
| `entry_id` | str | |
| `reporting` | dict[str, bool] | 18 toggle keys (see [Reporting Toggles](#reporting-toggles)) |
| `offsets` | dict | optional: `illuminance`, `temperature`, `humidity` floats |

**Side effects:** enables/disables entities in the entity registry, applies offsets to coordinator immediately.

#### `rename_zone_entities`

Batch-renames zone entity IDs via the entity registry.

**Request:**

| Field | Type | Notes |
|-------|------|-------|
| `entry_id` | str | |
| `renames` | object[] | `[{ "old_entity_id": str, "new_entity_id": str }]` |

**Response:** `{ "errors": str[] }` — any rename failures.

### Frontend screen -> API mapping

| Screen | Subscriptions | Commands |
|--------|---------------|----------|
| Device picker | — | `list_entries` |
| Room calibration wizard | `subscribe_display` | `set_setup` |
| Live overview / grid view | `subscribe_targets` | `get_config` |
| Zone editor | `subscribe_targets` | `set_room_layout`, `rename_zone_entities` |
| Reporting settings | — | `get_config`, `set_reporting` |

---

## Cross-Cutting: Files That Must Stay in Sync

| Python | JS/TS | What |
|--------|-------|------|
| `zone_engine.py` | `everything-presence-pro-panel.ts` (~lines 4814-5050) | State machine, gating, handoff, continuity |
| `const.py` | `zone-defaults.ts` | Zone type defaults, bit masks |
| `calibration.py` | `perspective.ts` | Perspective transform |
| `zone_engine.py` Grid class | `grid.ts` | Cell encoding, bit ops |
| `zone_engine.py` `xy_to_cell` | `coordinates.ts` | Room -> grid mapping |

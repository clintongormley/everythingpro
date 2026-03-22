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

**Zero-range gating:** The LD2450 transiently reports `y=0` before it has a range fix. The coordinator gates these out — targets with `y=0` are treated as inactive in both `subscribe_grid_targets` and `subscribe_raw_targets`, preventing bogus initial positions.

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

The live overview uses two independent websocket subscriptions at 5 Hz, each writing to its own frontend array:

- `subscribe_grid_targets` → `_targets[]` — grid view with calibrated room-space positions and zone state
- `subscribe_raw_targets` → `_rawTargets[]` — FOV overlay and calibration wizard with smoothed sensor-space positions

These are never merged. Each subscription writes directly to its own array to avoid cross-subscription lag.

See [section 5](#subscriptions-live-data) for API details.

### `_targets[]` (up to 3, from `subscribe_grid_targets`)

| Field | Type | Notes |
|-------|------|-------|
| `x` | float (mm) | calibrated room-space, rolling median smoothed |
| `y` | float (mm) | calibrated room-space, rolling median smoothed |
| `signal` | int 0-9 | from zone engine (cached, updates at 1Hz) |
| `status` | string | `"active"`, `"pending"`, or `"inactive"` — room-gated (cached, 1Hz) |

### `_rawTargets[]` (up to 3, from `subscribe_raw_targets`)

| Field | Type | Notes |
|-------|------|-------|
| `raw_x` | float (mm) | sensor-space, rolling median smoothed |
| `raw_y` | float (mm) | sensor-space, rolling median smoothed |

Used by: FOV overlay (uncalibrated view), calibration wizard corner capture, mini sensor view.

### `sensors`

| Field | Type | Notes |
|-------|------|-------|
| `occupancy` | bool | combined PIR OR static OR tracking |
| `static_presence` | bool | mmWave |
| `motion_presence` | bool | PIR |
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

Update cadence: zone engine ticks every ~1s (tumbling window); `x`/`y` positions push at 5 Hz.

---

## 3. Room Calibration

The calibration wizard uses `subscribe_raw_targets` (5 Hz) for smoothed raw target positions. See [section 5](#subscriptions-live-data) for API details. Calibration results are saved via `set_setup`.

### From sensor (live during wizard, via `subscribe_raw_targets`)

| Data | Type | Notes |
|------|------|-------|
| `raw_x` | float (mm) | per-target, range +/-6000, rolling median smoothed; `null` when inactive |
| `raw_y` | float (mm) | per-target, range 0-6000, rolling median smoothed; `null` when inactive |

Target count is derived frontend-side by filtering for non-null positions (must be exactly 1 for capture).

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

#### `subscribe_raw_targets` — calibration & FOV overlay

Used by the room calibration wizard and the FOV overlay on the live overview screen. Pushes at up to 5 Hz via the DisplayBuffer rolling median. Only active when at least one subscriber is connected (opt-in to avoid unnecessary work).

**Request:** `{ "type": "everything_presence_pro/subscribe_raw_targets", "entry_id": str }`

**Event payload:**

| Field | Type | Notes |
|-------|------|-------|
| `targets[].raw_x` | float (mm) | sensor-space, rolling median smoothed; `null` when inactive |
| `targets[].raw_y` | float (mm) | sensor-space, rolling median smoothed; `null` when inactive |

No `target_count` field — the frontend derives the count by filtering for non-null positions. Raw positions are always available when the sensor detects a target, even if the target falls outside the calibrated room grid. This is what makes room calibration work — targets are visible before/during calibration when no room grid exists yet.

**Used by:** room calibration wizard, FOV overlay.

#### `subscribe_grid_targets` — live overview grid & zone editor

Used by the live overview grid view and the detection zone editor. Pushes positions at up to 5 Hz; zone state (`signal`, `status`) is cached from the zone engine and updates at ~1 Hz.

**Request:** `{ "type": "everything_presence_pro/subscribe_grid_targets", "entry_id": str }`

**Event payload:**

| Field | Type | Notes |
|-------|------|-------|
| `targets[].x` | float (mm) | calibrated room-space, rolling median smoothed — NOT room-gated (always populated when sensor tracks) |
| `targets[].y` | float (mm) | calibrated room-space, rolling median smoothed — NOT room-gated |
| `targets[].signal` | int 0-9 | from zone engine (cached, updates at 1 Hz) |
| `targets[].status` | string | `"active"`, `"pending"`, or `"inactive"` — room-gated by backend (cached, 1 Hz) |
| `sensors` | object | see [section 2 sensors table](#sensors) |
| `zones` | object | see [section 2 zones table](#zones) |

`x`/`y` are always populated when the sensor is tracking, regardless of room gating. `status` is room-gated by the backend zone engine.

**Used by:** live overview grid, detection zone editor.

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

| Screen | Subscriptions | Frontend array | Fields used | Commands |
|--------|---------------|----------------|-------------|----------|
| Device picker | — | — | — | `list_entries` |
| Room calibration | `subscribe_raw_targets` | `_rawTargets` | `raw_x`, `raw_y` | `set_setup` |
| Live overview (FOV) | `subscribe_raw_targets` | `_rawTargets` | `raw_x`, `raw_y` | — |
| Live overview (grid) | `subscribe_grid_targets` | `_targets` | all fields | `get_config` |
| Detection zone editor | `subscribe_grid_targets` | `_targets` | `x`, `y`, `signal` (ignores `status`) | `set_room_layout`, `rename_zone_entities` |
| Reporting settings | — | — | — | `get_config`, `set_reporting` |

---

## Cross-Cutting: Files That Must Stay in Sync

| Python | JS/TS | What |
|--------|-------|------|
| `zone_engine.py` | `everything-presence-pro-panel.ts` (~lines 4814-5050) | State machine, gating, handoff, continuity |
| `const.py` | `zone-defaults.ts` | Zone type defaults, bit masks |
| `calibration.py` | `perspective.ts` | Perspective transform |
| `zone_engine.py` Grid class | `grid.ts` | Cell encoding, bit ops |
| `zone_engine.py` `xy_to_cell` | `coordinates.ts` | Room -> grid mapping |

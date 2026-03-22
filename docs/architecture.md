# Architecture

Everything Presence Pro (EPP) is a Home Assistant custom integration for the
Everything Presence Pro mmWave radar sensor. It provides room-level and
zone-level occupancy detection, target tracking, and environmental sensing
through a Python backend connected to the device via ESPHome API, and a
Lit-based frontend panel for calibration, zone editing, and live visualization.

## System Overview

```
┌──────────────────────┐
│  EPP Device (ESP32)  │
│  LD2450 mmWave radar │
│  PIR, BH1750, SHTC3  │
└──────────┬───────────┘
           │ ESPHome API (TCP, noise PSK)
           │ ~10 Hz raw frames
           ▼
┌──────────────────────────────────────────────────┐
│  Python Backend (coordinator.py)                 │
│                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Calibration │  │ Zone Engine  │  │ Entities │ │
│  │ perspective │  │ grid, window │  │ sensors, │ │
│  │ transform   │  │ state machine│  │ binary   │ │
│  └──────┬─────┘  └──────┬───────┘  └────┬─────┘ │
│         │               │               │       │
│         └───────┬───────┘               │       │
│                 ▼                       ▼       │
│         dispatcher signals ──────► HA states    │
│                 │                               │
│                 ▼                               │
│         websocket API ──────────────────────┐   │
└─────────────────────────────────────────────┼───┘
                                              │
           WebSocket subscription             │
                                              ▼
┌──────────────────────────────────────────────────┐
│  TypeScript Frontend (Lit panel)                 │
│                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Calibration │  │ Zone Editor  │  │   Live   │ │
│  │   Wizard    │  │ grid paint,  │  │ Overview │ │
│  │ 4-corner    │  │ zone CRUD,   │  │ targets, │ │
│  │ capture     │  │ furniture    │  │ sensors  │ │
│  └────────────┘  └──────────────┘  └──────────┘ │
│                                                  │
│  Local zone engine replica (live preview)        │
└──────────────────────────────────────────────────┘
```

## Directory Layout

```
everything-presence-pro-grid/
├── custom_components/everything_presence_pro/
│   ├── __init__.py            # Entry point: setup, panel registration
│   ├── manifest.json          # Integration metadata
│   ├── const.py               # Constants, grid geometry, zone defaults
│   ├── coordinator.py         # ESPHome connection, state, processing pipeline
│   ├── calibration.py         # Perspective transform (8-coefficient homography)
│   ├── zone_engine.py         # Grid, TumblingWindow, ZoneEngine, state machine
│   ├── config_flow.py         # HA config UI (host → name)
│   ├── binary_sensor.py       # Occupancy, motion, presence, zone occupancy
│   ├── sensor.py              # Environment, target position/speed, zone counts
│   ├── websocket_api.py       # Frontend ↔ backend commands and subscriptions
│   └── frontend/
│       └── everything-presence-pro-panel.js   # Built JS bundle
├── frontend/
│   ├── src/
│   │   ├── everything-presence-pro-panel.ts   # Main Lit element
│   │   ├── index.ts                           # Export entry point
│   │   └── lib/
│   │       ├── perspective.ts     # Homography math
│   │       ├── grid.ts            # Cell encoding, room bounds
│   │       ├── coordinates.ts     # Target → grid mapping
│   │       └── zone-defaults.ts   # Zone types, thresholds, colors
│   ├── rollup.config.js       # Bundles TS → built JS
│   ├── biome.json             # TS linter/formatter config
│   └── vitest.config.ts       # Frontend test config
├── tests/                     # Python tests (pytest)
├── docs/
│   └── backend-data-catalog.md  # Data field inventory per functional area
├── pyproject.toml             # Python config (ruff, pytest)
└── .github/workflows/        # CI: tests, HACS, hassfest
```

## Python Backend

### Integration Lifecycle (`__init__.py`)

`async_setup_entry` creates the coordinator, loads config from
`entry.options`, connects to the device, registers a device in the device
registry, forwards setup to entity platforms (binary_sensor, sensor), and
registers the frontend panel (once per hass instance, with cache-busting
via MD5 hash of the JS bundle).

`async_unload_entry` unloads platforms and disconnects the coordinator.

### Coordinator (`coordinator.py`)

The coordinator is the central hub. It manages the ESPHome connection,
holds all runtime state, runs the processing pipeline, and dispatches
signals to entities and the websocket subscription.

**Connection lifecycle:**
1. `async_connect()` creates an `APIClient` wrapped in `ReconnectLogic`
2. On connect: `subscribe_targets()` lists entities, classifies them by
   name pattern (e.g. `target_1_x`, `mmwave`, `illuminance`), and
   subscribes to state updates
3. `_on_state()` routes each update to `_handle_binary_sensor()` or
   `_handle_sensor()`, which update internal state and trigger rebuilds

**Processing pipeline:**

```
ESPHome state callback
  → _handle_sensor() / _handle_binary_sensor()
    → _schedule_rebuild()
      → _build_calibrated_targets()    # perspective transform + grid gating
        → zone_engine.feed_raw()       # tumbling window + state machine
          → ProcessingResult           # targets: list[TargetResult], zone occupancy, signals
      → dispatch SIGNAL_TARGETS_UPDATED
      → dispatch SIGNAL_SENSORS_UPDATED
```

`_build_calibrated_targets()` applies the perspective transform and then
checks if the calibrated position falls inside a room cell on the grid.
Targets outside the grid are reported as inactive, preventing them from
escaping the grid visually or triggering ghost presence.

Between window ticks, display updates are throttled to 200ms via
`_do_display_update()` for smooth target dot animation.

**Dispatcher signals** (suffixed with `_{entry_id}`):
- `SIGNAL_TARGETS_UPDATED` — target positions, zone occupancy changed
- `SIGNAL_SENSORS_UPDATED` — environment sensor values changed
- `SIGNAL_ZONES_UPDATED` — zone configuration changed

### Calibration (`calibration.py`)

`SensorTransform` holds an 8-coefficient projective homography and room
dimensions. The `apply(x, y)` method maps raw sensor coordinates to
room-space coordinates:

```
rx = (a·sx + b·sy + c) / (g·sx + h·sy + 1)
ry = (d·sx + e·sy + f) / (g·sx + h·sy + 1)
```

The perspective coefficients are computed by the frontend wizard from
4 captured corners and sent to the backend via the `set_setup` websocket
command.

### Zone Engine (`zone_engine.py`)

The zone engine converts calibrated target positions into per-zone
occupancy state. It has three layers: Grid, TumblingWindow, and ZoneEngine.

**Grid** — A 20×20 grid of 300mm cells. Each cell is 1 byte:
- Bit 0: room flag (inside/outside)
- Bits 1-3: zone ID (0 = room boundary, 1-7 = named zones)
- Bits 4-7: reserved

`xy_to_cell(x, y)` maps room coordinates to a cell index (or None if
outside). The grid can be larger than the calibrated room rectangle
because `compute_extent()` projects the full 120° FOV through the
perspective transform.

**TumblingWindow** — Accumulates raw target frames over a 1-second window,
then emits per-target median positions and frame counts (signal strength
0-9).

**ZoneEngine** — Processes each window tick through:

1. **Target evaluation** — Map each target to a grid cell and zone. Check
   continuity (Chebyshev distance ≤ 5 cells from previous position).
   Apply entry-point gating: non-entry zones require 2 consecutive
   qualifying ticks at `min(threshold + 2, 8)` before confirming a
   discontinuous target.

2. **Handoff detection** — When a target moves between zones, the source
   zone transitions to PENDING with an accelerated timeout
   (`pending_since = now - (timeout - handoff_timeout)`).

3. **State machine** — Per-zone, 3-state:
   - CLEAR → OCCUPIED: when a target is confirmed (signal ≥ trigger)
   - OCCUPIED → PENDING: when all confirmed targets leave
   - PENDING → CLEAR: after timeout expires
   - PENDING → OCCUPIED: if a target re-enters before timeout

Output is a `ProcessingResult` with `targets: list[TargetResult]` (each
carrying `status` of `"active"`, `"pending"`, or `"inactive"`), zone
occupancy, and target signal strengths.

### Entity Platforms

**binary_sensor.py** — Room-level: occupancy (combined), motion (PIR),
static presence (mmWave), target presence. Per-target: active state (×3).
Per-zone: occupancy (×8, including rest-of-room). All subscribe to
dispatcher signals and call `async_write_ha_state()` on update.

**sensor.py** — Environment: illuminance, temperature, humidity, CO2
(with additive offsets). Per-target: XY sensor, XY grid, distance, angle,
speed, resolution (×3 each). Per-zone: target count (×8). Most target and
zone entities are disabled by default.

### WebSocket API (`websocket_api.py`)

Commands registered once per hass instance:

| Command | Purpose |
|---------|---------|
| `list_entries` | List configured devices with calibration/layout status |
| `get_config` | Retrieve full config (zones, calibration, grid, layout, reporting, offsets) |
| `set_setup` | Save perspective transform and room dimensions |
| `set_zones` | Update zone configuration |
| `set_room_layout` | Save grid bytes, zone slots, furniture; manages zone entity enable/disable |
| `subscribe_raw_targets` | 5 Hz smoothed sensor-space positions (calibration, FOV overlay) |
| `subscribe_grid_targets` | 5 Hz grid positions + cached 1 Hz zone/sensor state (grid view, zone editor) |
| `rename_zone_entities` | Batch-rename zone entity IDs |
| `set_reporting` | Toggle which entities are enabled; set sensor offsets |

Two live data subscriptions, both driven by the DisplayBuffer rolling median:

**`subscribe_raw_targets`** (5 Hz) — sensor-space positions for calibration and FOV overlay:
```json
{
  "target_count": 1,
  "targets": [{"raw_x": 1234.0, "raw_y": 2100.0}, ...]
}
```

**`subscribe_grid_targets`** (5 Hz positions, 1 Hz cached state) — calibrated grid positions plus zone engine state:
```json
{
  "targets": [{"x": 1500, "y": 2000, "signal": 7, "status": "active"}, ...],
  "sensors": {"occupancy", "static_presence", "motion_presence", "target_presence", "illuminance", "temperature", "humidity", "co2"},
  "zones": {"occupancy": {id: bool}, "target_counts": {id: int}, "frame_count": int, "debug_log": str}
}
```

### Config Entry Structure

```
entry.data:
  host, mac, device_name

entry.options.config:
  calibration:  {perspective, room_width, room_depth}
  grid:         base64-encoded cell bytes
  grid_origin_x, grid_origin_y, grid_cols, grid_rows
  zones:        [{id, name, type, trigger, renew, timeout, ...}]  (legacy)
  room_layout:  {grid_bytes, zone_slots, furniture, room_type, room_trigger, ...}
  reporting:    {room_occupancy: bool, target_xy_grid: bool, ...}
  offsets:      {illuminance, temperature, humidity}
```

## TypeScript Frontend

### Build System

Rollup bundles `src/index.ts` → minified ES module at
`custom_components/.../frontend/everything-presence-pro-panel.js`.
TypeScript with strict mode and experimental decorators for Lit.
Biome for linting/formatting.

### Main Panel (`everything-presence-pro-panel.ts`)

A Lit `LitElement` registered as `<everything-presence-pro-panel>`. It has
three views: live overview, editor, and settings.

**Initialization:** On connect, loads entries via `list_entries`, loads
config via `get_config`, and subscribes to live target data via
`subscribe_grid_targets` (grid positions + state) and `subscribe_raw_targets`
(sensor-space positions for FOV overlay).

**Live Overview** — Renders the calibrated grid with target dots, zone
occupancy overlays, environment sensor readouts, and presence status
(including target presence and motion presence). The sidebar shows
rest-of-room zone under detection zones. A collapsible "Detection events"
debug log panel below the grid shows backend zone engine tick summaries
(deduped, timestamped, 100-line cap).

**Editor** — Two tabs:
- *Zones:* Paint zone cells on the grid, add/remove zones, configure
  type/trigger/renew/timeout per zone. Room boundary is zone 0 (painted
  with the room bit). Zones with zero painted cells are auto-removed on
  save. A collapsible "Detection events" debug log panel below the grid
  shows local zone engine output (deduped, timestamped, 100-line cap).
- *Furniture:* Place, move, resize, rotate furniture items (MDI icons or
  SVG floor plans) for visual context. Drag handles for resize, rotation
  handle at top.

**Calibration Wizard** — Four-step flow:
1. Guide: instructions
2. Corners: capture 4 room corners (5-second median of raw sensor coords
   each, with wall offset inputs)
3. Auto-compute room dimensions from corner distances
4. Solve perspective via `solvePerspective()` (Gaussian elimination)
5. Save via `set_setup` websocket command

**Navigation protection:** Intercepts `beforeunload` and
`history.pushState/replaceState` when unsaved changes exist.

### Library Modules

**perspective.ts** — `solvePerspective(src, dst)` solves the 8-coefficient
homography from 4 point pairs via Gaussian elimination.
`applyPerspective(h, x, y)` applies the transform.
`getInversePerspective(h)` inverts via 3×3 matrix inversion.

**grid.ts** — Cell bit operations (`cellIsInside`, `cellZone`,
`cellSetZone`), room bounds calculation, grid initialization from room
dimensions. Constants: `GRID_COLS=20`, `GRID_ROWS=20`, `GRID_CELL_MM=300`.

**coordinates.ts** — `mapTargetToGridCell(x, y, roomWidth, roomDepth)`
maps room-space coordinates to fractional grid cell position (room
centered horizontally). `rawToFovPct()` maps raw sensor coords to FOV
percentages for the wizard. `getSmoothedValue()` provides 1-second rolling
median for capture smoothing.

**zone-defaults.ts** — `ZoneConfig` interface, `ZONE_TYPE_DEFAULTS` with
thresholds per zone type, color palette (7 colorblind-friendly colors),
`getZoneThresholds()` resolver.

### Local Zone Engine Replica

The frontend contains a replica of the backend's zone engine state machine
for live preview in the editor. It implements the same algorithms:

- Target → grid cell mapping
- Continuity check (Chebyshev ≤ 5 cells)
- Entry-point gating (2 consecutive qualifying ticks at doubled threshold)
- Trigger/renew threshold comparison
- CLEAR/OCCUPIED/PENDING state machine with timeouts
- Handoff detection with accelerated timeout

This allows the zone editor to show live occupancy changes as the user
paints zones, before saving. **Keeping the Python and TypeScript
implementations in sync is critical** — see the sync requirements section.

## Python ↔ TypeScript Sync Requirements

The detection zones functional area requires strict parity between the
Python backend and the TypeScript frontend. Both implement:

| Algorithm | Python | TypeScript |
|-----------|--------|------------|
| Cell encoding | `zone_engine.py` Grid | `grid.ts` |
| Target → cell | `zone_engine.py` `xy_to_cell` | `coordinates.ts` `mapTargetToGridCell` |
| Zone state machine | `zone_engine.py` `_tick` | `panel.ts` `_renderVisibleCells` |
| Entry-point gating | `zone_engine.py` lines ~460-500 | `panel.ts` lines ~4908-4937 |
| Handoff detection | `zone_engine.py` lines ~502-528 | `panel.ts` lines ~4940-4958 |
| Zone type defaults | `const.py` | `zone-defaults.ts` |
| Perspective transform | `calibration.py` | `perspective.ts` |

Any change to zone detection logic must be made in both languages
simultaneously.

## Testing

### Python (pytest)

Tests live in `tests/` with fixtures in `conftest.py`. ESPHome API calls
are mocked via `unittest.mock.patch`. Key fixture: `mock_esphome_client`
patches `APIClient` and `ReconnectLogic` to prevent network calls.

| File | Covers |
|------|--------|
| `test_init.py` | Setup, teardown, panel registration, config loading |
| `test_config_flow.py` | User/name steps, connection errors, duplicate detection |
| `test_coordinator.py` | State management, config roundtrip, entity classification, grid gating |
| `test_zone_engine.py` | Grid operations, tumbling window, state machine, thresholds, handoff |
| `test_sensor.py` | Environment sensors, offsets, target properties, zone counts |
| `test_binary_sensor.py` | Occupancy, motion, presence, per-target, per-zone |
| `test_calibration.py` | Transform application, serialization, edge cases |
| `test_websocket_api.py` | All websocket commands |

Config: `pyproject.toml` — ruff for lint/format, pytest-asyncio with
`asyncio_mode = "auto"`.

### TypeScript (vitest)

Tests live in `frontend/src/__tests__/` with happy-dom for DOM simulation.

| File | Covers |
|------|--------|
| `panel-render.test.ts` | Element creation, loading states |
| `panel-grid.test.ts` | Cell painting, boundary drawing |
| `panel-zones.test.ts` | Zone CRUD, color assignment |
| `panel-furniture.test.ts` | Furniture item management |
| `panel-navigation.test.ts` | View switching |
| `lib/coordinates.test.ts` | Target mapping, FOV, smoothing |
| `lib/grid.test.ts` | Cell bit operations, room bounds |
| `lib/perspective.test.ts` | Homography solve, apply, inverse |
| `lib/zone-defaults.test.ts` | Thresholds, colors |

### CI (.github/workflows/)

- **tests.yml** — Python tests against 3 HA versions (oldest supported,
  stable, dev) × 2 Python versions + frontend lint and vitest
- **hacs.yml** — HACS repository structure validation
- **hassfest.yml** — manifest.json schema validation

## Future Direction

The Python backend currently performs all processing (calibration, zone
detection, entity state). Over time, much of this will move to custom
firmware on the EPP device itself. The four functional areas (HA entities,
live overview, room calibration, detection zones) will transition from
Python-computed to firmware-provided data. See
[backend-data-catalog.md](backend-data-catalog.md) for the complete
inventory of data fields per functional area.

# CI & Testing Infrastructure Design

**Date**: 2026-03-20
**Status**: Approved
**Goal**: Convert to HACS-installable custom integration with comprehensive CI, linting, and test suite covering both Python backend and TypeScript frontend.

## 1. CI Pipeline (GitHub Actions)

### 1.1 `.github/workflows/tests.yml`

Triggered on push and PR to any branch.

**Python job** — matrix strategy:

| HA Version | Python | Install method |
|------------|--------|----------------|
| 2025.2.0   | 3.13   | `pip install homeassistant==2025.2.0` |
| stable     | 3.14   | `pip install homeassistant` |
| dev        | 3.14   | `pip install git+https://github.com/home-assistant/core.git` |

Steps per matrix entry:
1. Checkout repo
2. Set up Python (matrix version)
3. Install HA (matrix method)
4. `pip install -r requirements_test.txt`
5. `ruff check custom_components/ tests/`
6. `ruff format --check custom_components/ tests/`
7. `pytest tests/ --cov=custom_components/everything_presence_pro --cov-report=xml`

**Frontend job** (single runner, Node 20):
1. Checkout repo
2. `cd frontend && npm ci`
3. `npx biome check src/`
4. `npx vitest run --coverage`

### 1.2 `.github/workflows/hacs.yml`

Triggered on push and PR.

Uses `hacs/action@main` with `category: integration`.
Brands check disabled via the `ignore` input (set to `brands`).

### 1.3 `.github/workflows/hassfest.yml`

Triggered on push and PR.

Uses `home-assistant/actions/hassfest@master` pointed at `custom_components/everything_presence_pro`.

## 2. Python Tooling

### 2.1 `pyproject.toml` (repo root)

```toml
[tool.ruff]
target-version = "py313"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "W", "I", "UP", "B", "SIM", "RUF"]

[tool.ruff.lint.isort]
force-single-line = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

### 2.2 `requirements_test.txt`

```
pytest
pytest-asyncio
pytest-cov
pytest-homeassistant-custom-component
ruff
```

The `pytest-homeassistant-custom-component` package provides real HA fixtures (`hass`, `mock_config_entry`, etc.) matching the installed HA version.

## 3. Python Test Suite

### 3.1 Unit tests (pure logic, no HA dependency)

**`tests/test_calibration.py`** — perspective transform:
- Forward/inverse transform round-trips
- Identity transform (no distortion)
- Known coordinate mappings
- Degenerate inputs (collinear points, zero-area quads)
- Edge cases: negative coords, very large coords

**`tests/test_zone_engine.py`** — zone state machine & grid:
- State transitions: CLEAR → OCCUPIED → PENDING → CLEAR
- Target enters zone → occupancy triggers after threshold
- Target leaves zone → pending state → timeout → clear
- Multi-target: one leaves, one stays → stays occupied
- Handoff timeout behavior
- Entry point zone behavior
- Grid cell assignment and zone membership
- Edge cases: target at grid boundary, target outside grid

### 3.2 Integration tests (real HA fixtures)

**`tests/conftest.py`** — shared fixtures:
- `hass` from pytest-homeassistant-custom-component
- `mock_config_entry` with domain/data/entry_id
- `mock_esphome_client` (AsyncMock of aioesphomeapi.APIClient)
- Helper to set up integration with mocked ESPHome connection

**`tests/test_config_flow.py`**:
- Step 1: valid host → step 2
- Step 1: invalid host → error
- Step 1: connection failure → error
- Step 2: valid name → create entry
- Duplicate entry prevention

**`tests/test_init.py`**:
- `async_setup_entry` creates coordinator and platforms
- `async_unload_entry` cleans up
- Frontend panel registration
- Re-setup after unload

**`tests/test_coordinator.py`**:
- Coordinator connects to ESPHome API on setup
- State callback dispatches updates
- Reconnection on disconnect
- Target frame processing
- Zone engine integration (frames → occupancy state)

**`tests/test_binary_sensor.py`**:
- Entity creation for each zone (occupancy, motion, static, target_presence)
- State updates from coordinator dispatch
- Entity attributes (device_class, etc.)
- Entity unique_id stability

**`tests/test_sensor.py`**:
- Entity creation (illuminance, temperature, humidity, CO2, target_count)
- State updates from coordinator dispatch
- Unit of measurement, device_class
- Entity unique_id stability

**`tests/test_websocket_api.py`**:
- All WS commands register correctly
- `get_config` returns current state
- `save_zones` persists zone config
- `save_layout` persists room layout
- `start_calibration` / `save_calibration` lifecycle
- Error handling for invalid payloads

## 4. Frontend Test Suite

### 4.1 Extract pure functions into `lib/` modules

Move testable pure functions out of the 5,150-line panel into focused modules. The panel imports them — no behavior change, only testability and maintainability.

**`frontend/src/lib/grid.ts`**:
- `cellIsInside(v)`, `cellZone(v)`, `cellSetInside(v, inside)`, `cellSetZone(v, zone)`
- `getRoomBounds(grid, cols, rows)` — find min/max row/col of inside cells
- `initGridFromRoom(width, depth, cellMm, cols, rows)` — create grid from dimensions
- `updateRoomDimensionsFromGrid(grid, cols, rows, cellMm)` — derive dimensions from grid
- Constants: `CELL_ROOM_BIT`, `CELL_ZONE_MASK`, `CELL_ZONE_SHIFT`, `MAX_ZONES`, `GRID_COLS`, `GRID_ROWS`, `GRID_CELL_COUNT`, `GRID_CELL_MM`

**`frontend/src/lib/perspective.ts`**:
- `solvePerspective(srcCorners, dstCorners)` — compute 8-parameter transform
- `applyPerspective(h, x, y)` — apply transform to point
- `getInversePerspective(h)` — compute inverse transform

**`frontend/src/lib/coordinates.ts`**:
- `mapTargetToPercent(target, perspective, roomWidth, roomDepth)` — target → room %
- `mapTargetToGridCell(target, perspective, roomWidth, roomDepth, cols, rows, cellMm)` — target → grid cell
- `rawToFovPct(rawX, rawY, maxRange)` — raw coords → FoV percentage
- `isCellInSensorRange(col, row, ...)` — check if cell is in sensor FoV
- `getSmoothedRaw(buffer, now)` — temporal smoothing

**`frontend/src/lib/zone-defaults.ts`**:
- `ZONE_TYPE_DEFAULTS` constant
- `getZoneThresholds(zoneConfig, roomConfig)` — resolve thresholds with fallbacks
- `computeHeatmapColors(grid, zoneConfigs)` — cell → color mapping
- `autoDetectionRange(grid, cols, rows, cellMm)` — compute range from room bounds

### 4.2 Pure function unit tests (`frontend/src/lib/__tests__/`)

**`grid.test.ts`**:
- `cellIsInside`: bit 0 set → true, clear → false
- `cellZone`: extracts bits 1-3 correctly for zones 0-7
- `cellSetInside`/`cellSetZone`: sets without clobbering other bits
- Round-trip: set zone then read zone
- `getRoomBounds`: finds correct bounds for various grid patterns
- `initGridFromRoom`: correct cell count and dimensions
- Edge: empty grid, single cell, full grid

**`perspective.test.ts`**:
- Identity: unit square → unit square yields identity-like transform
- Known transform: manually computed corner mapping
- Round-trip: `applyPerspective(h, x, y)` then `applyPerspective(inverse, x', y')` ≈ original
- Degenerate: collinear points → handle gracefully
- Large coordinates: no overflow or precision loss

**`coordinates.test.ts`**:
- `mapTargetToPercent`: known target → expected room percentage
- `mapTargetToGridCell`: target at center → center cell
- `rawToFovPct`: sensor at origin, target at known angle → expected %
- `isCellInSensorRange`: cells inside/outside FoV cone
- `getSmoothedRaw`: buffer with timestamps → weighted average

**`zone-defaults.test.ts`**:
- Each zone type has expected default thresholds
- `getZoneThresholds`: explicit values override defaults
- `getZoneThresholds`: missing values fall back to type defaults
- `computeHeatmapColors`: zones get distinct colors
- `autoDetectionRange`: scales with room size

### 4.3 Component behavior tests (`frontend/src/__tests__/`)

These instantiate the Lit element in happy-dom and test interactions.

**`panel-zones.test.ts`**:
- `_addZone`: creates zone in first empty slot, marks dirty
- `_addZone` when all 7 slots full: no-op
- `_removeZone`: clears slot and grid cells, marks dirty
- Zone config update: type change updates thresholds
- Paint cells: mousedown + mouseenter sequence paints correct cells
- Clear cells: paint action "clear" removes zone from cells

**`panel-furniture.test.ts`**:
- `_addFurniture`: creates item with defaults from sticker catalog
- `_removeFurniture`: removes by id
- `_updateFurniture`: partial updates merge correctly
- Custom icon furniture: creates with custom icon value

**`panel-grid.test.ts`**:
- Grid painting sequence: down → enter → enter → up
- Paint action toggle: set vs clear
- Room dimensions update after grid change

**`panel-navigation.test.ts`**:
- `_guardNavigation` with dirty=false: executes immediately
- `_guardNavigation` with dirty=true: shows dialog
- `_discardAndNavigate`: resets dirty, executes pending
- View switching: live ↔ editor ↔ settings
- Unsaved changes dialog flow

**`panel-wizard.test.ts`**:
- Wizard step progression: guide → corners → preview
- Corner capture flow
- Room dimension auto-computation
- Wizard finish: saves calibration, transitions to editor

**`panel-render.test.ts`**:
- Each view (live, editor, settings) renders without error
- Wizard renders for each step
- Uncalibrated state shows calibration prompt
- Zone sidebar shows correct zone count

## 5. File Changes Summary

### New files
- `.github/workflows/tests.yml`
- `.github/workflows/hacs.yml`
- `.github/workflows/hassfest.yml`
- `pyproject.toml`
- `requirements_test.txt`
- `frontend/src/lib/grid.ts`
- `frontend/src/lib/perspective.ts`
- `frontend/src/lib/coordinates.ts`
- `frontend/src/lib/zone-defaults.ts`
- `frontend/src/lib/__tests__/grid.test.ts`
- `frontend/src/lib/__tests__/perspective.test.ts`
- `frontend/src/lib/__tests__/coordinates.test.ts`
- `frontend/src/lib/__tests__/zone-defaults.test.ts`
- `frontend/src/__tests__/panel-zones.test.ts`
- `frontend/src/__tests__/panel-furniture.test.ts`
- `frontend/src/__tests__/panel-grid.test.ts`
- `frontend/src/__tests__/panel-navigation.test.ts`
- `frontend/src/__tests__/panel-wizard.test.ts`
- `frontend/src/__tests__/panel-render.test.ts`

### Modified files
- `frontend/src/everything-presence-pro-panel.ts` — import from `lib/` instead of inline definitions
- `tests/conftest.py` — rewrite with pytest-homeassistant-custom-component fixtures
- `tests/test_*.py` — rewrite all 8 test files against real HA fixtures
- `frontend/vitest.config.ts` — update if needed for coverage
- `hacs.json` — no changes needed (already correct)

### No changes
- `custom_components/everything_presence_pro/manifest.json` — already HACS-compatible
- `frontend/biome.json` — already configured

# CI & Testing Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up HACS CI validation, comprehensive Python and TypeScript test suites, and linting/formatting infrastructure.

**Architecture:** Three GitHub Actions workflows (tests, HACS validation, hassfest). Python uses ruff + pytest with pytest-homeassistant-custom-component. Frontend extracts pure functions from the 5K-line panel into `lib/` modules for unit testing, with component tests using vitest + happy-dom.

**Tech Stack:** GitHub Actions, ruff, pytest, pytest-homeassistant-custom-component, vitest, biome, happy-dom

---

## File Structure

### New files
- `.github/workflows/tests.yml` — CI test matrix
- `.github/workflows/hacs.yml` — HACS validation
- `.github/workflows/hassfest.yml` — HA manifest validation
- `pyproject.toml` — ruff + pytest config
- `requirements_test.txt` — Python test dependencies
- `frontend/src/lib/grid.ts` — Extracted grid/cell pure functions
- `frontend/src/lib/perspective.ts` — Extracted perspective math
- `frontend/src/lib/coordinates.ts` — Extracted coordinate mapping functions
- `frontend/src/lib/zone-defaults.ts` — Extracted zone type defaults and threshold resolution
- `frontend/src/lib/__tests__/grid.test.ts` — Grid unit tests
- `frontend/src/lib/__tests__/perspective.test.ts` — Perspective math unit tests
- `frontend/src/lib/__tests__/coordinates.test.ts` — Coordinate mapping unit tests
- `frontend/src/lib/__tests__/zone-defaults.test.ts` — Zone defaults unit tests
- `frontend/src/__tests__/panel-zones.test.ts` — Panel zone CRUD tests
- `frontend/src/__tests__/panel-furniture.test.ts` — Panel furniture CRUD tests
- `frontend/src/__tests__/panel-grid.test.ts` — Panel grid painting tests
- `frontend/src/__tests__/panel-navigation.test.ts` — Navigation guard tests
- `frontend/src/__tests__/panel-render.test.ts` — Render smoke tests

### Modified files
- `frontend/src/everything-presence-pro-panel.ts` — Import from `lib/` instead of inline
- `tests/conftest.py` — Rewrite with real HA fixtures
- `tests/test_calibration.py` — Fix collection error, expand coverage
- `tests/test_zone_engine.py` — Expand with edge cases
- `tests/test_config_flow.py` — Rewrite against real HA
- `tests/test_init.py` — Rewrite against real HA
- `tests/test_coordinator.py` — Rewrite against real HA
- `tests/test_binary_sensor.py` — Rewrite against real HA
- `tests/test_sensor.py` — Rewrite against real HA
- `tests/test_websocket_api.py` — Rewrite against real HA

---

## Task 1: Python tooling — pyproject.toml, requirements_test.txt, ruff config

**Files:**
- Create: `pyproject.toml`
- Create: `requirements_test.txt`

- [ ] **Step 1: Create pyproject.toml**

```toml
[tool.ruff]
target-version = "py313"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "W", "I", "UP", "B", "SIM", "RUF"]

[tool.ruff.lint.isort]
force-single-line = true
known-first-party = ["custom_components.everything_presence_pro"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 2: Create requirements_test.txt**

```
pytest
pytest-asyncio
pytest-cov
pytest-homeassistant-custom-component
ruff
```

- [ ] **Step 3: Run ruff check to see current state**

Run: `ruff check custom_components/ tests/`
Expected: May show lint issues — note them but don't fix yet (separate task).

- [ ] **Step 4: Fix any ruff lint issues in source**

Run: `ruff check --fix custom_components/ tests/`
Then: `ruff format custom_components/ tests/`
Then: `ruff check custom_components/ tests/` and `ruff format --check custom_components/ tests/`
Expected: PASS (0 issues)

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml requirements_test.txt custom_components/ tests/
git commit -m "chore: add ruff config and fix lint issues"
```

---

## Task 2: GitHub Actions workflows

**Files:**
- Create: `.github/workflows/tests.yml`
- Create: `.github/workflows/hacs.yml`
- Create: `.github/workflows/hassfest.yml`

- [ ] **Step 1: Create .github/workflows/tests.yml**

```yaml
name: Tests

on:
  push:
  pull_request:

jobs:
  python:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        include:
          - ha-version: "2025.2.0"
            python-version: "3.13"
          - ha-version: "stable"
            python-version: "3.14"
          - ha-version: "dev"
            python-version: "3.14"
    name: "Python (HA ${{ matrix.ha-version }})"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - name: Install HA
        run: |
          if [ "${{ matrix.ha-version }}" = "dev" ]; then
            pip install git+https://github.com/home-assistant/core.git
          elif [ "${{ matrix.ha-version }}" = "stable" ]; then
            pip install homeassistant
          else
            pip install homeassistant==${{ matrix.ha-version }}
          fi
      - name: Install test dependencies
        run: pip install -r requirements_test.txt
      - name: Ruff lint
        run: ruff check custom_components/ tests/
      - name: Ruff format
        run: ruff format --check custom_components/ tests/
      - name: Pytest
        run: pytest tests/ --cov=custom_components/everything_presence_pro --cov-report=xml -v

  frontend:
    runs-on: ubuntu-latest
    name: Frontend
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - name: Biome lint
        run: npx biome check src/
      - name: Vitest
        run: npx vitest run
```

- [ ] **Step 2: Create .github/workflows/hacs.yml**

```yaml
name: HACS Validation

on:
  push:
  pull_request:

jobs:
  hacs:
    runs-on: ubuntu-latest
    name: HACS
    steps:
      - uses: actions/checkout@v4
      - uses: hacs/action@main
        with:
          category: integration
          ignore: brands
```

- [ ] **Step 3: Create .github/workflows/hassfest.yml**

```yaml
name: Hassfest

on:
  push:
  pull_request:

jobs:
  hassfest:
    runs-on: ubuntu-latest
    name: Hassfest
    steps:
      - uses: actions/checkout@v4
      - uses: home-assistant/actions/hassfest@master
```

- [ ] **Step 4: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions for tests, HACS validation, and hassfest"
```

---

## Task 3: Python test conftest — real HA fixtures

**Files:**
- Modify: `tests/conftest.py`

- [ ] **Step 1: Rewrite conftest.py with real HA fixtures**

Replace the manual mocks with `pytest-homeassistant-custom-component` fixtures. The `hass` fixture is provided automatically by the package. We need custom fixtures for the config entry and mocked ESPHome client.

```python
"""Fixtures for Everything Presence Pro tests."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry

from custom_components.everything_presence_pro.const import DOMAIN


@pytest.fixture
def mock_config_entry(hass: HomeAssistant) -> ConfigEntry:
    """Create a mock config entry."""
    entry = ConfigEntry(
        version=1,
        minor_version=1,
        domain=DOMAIN,
        title="Test EP Pro",
        data={
            "host": "192.168.1.100",
            "mac": "AA:BB:CC:DD:EE:FF",
            "device_name": "Test EP Pro",
        },
        source="user",
        unique_id="AA:BB:CC:DD:EE:FF",
    )
    entry.add_to_hass(hass)
    return entry


@pytest.fixture
def mock_esphome_client():
    """Create a mock ESPHome API client and patch its constructor."""
    with patch(
        "custom_components.everything_presence_pro.coordinator.APIClient"
    ) as mock_cls, patch(
        "custom_components.everything_presence_pro.coordinator.ReconnectLogic"
    ) as mock_reconnect_cls:
        client = AsyncMock()
        client.device_info = AsyncMock(
            return_value=MagicMock(
                mac_address="AA:BB:CC:DD:EE:FF",
                name="test-ep-pro",
                friendly_name="Test EP Pro",
            )
        )
        client.list_entities_services = AsyncMock(return_value=([], []))
        client.subscribe_states = MagicMock()
        client.disconnect = AsyncMock()
        mock_cls.return_value = client

        reconnect = AsyncMock()
        reconnect.start = AsyncMock()
        reconnect.stop = AsyncMock()
        mock_reconnect_cls.return_value = reconnect

        yield client


@pytest.fixture
def mock_config_flow_client():
    """Create a mock ESPHome client for config flow tests."""
    with patch(
        "custom_components.everything_presence_pro.config_flow.APIClient"
    ) as mock_cls:
        client = AsyncMock()
        client.connect = AsyncMock()
        client.device_info = AsyncMock(
            return_value=MagicMock(
                mac_address="AA:BB:CC:DD:EE:FF",
                name="test-ep-pro",
                friendly_name="Test EP Pro",
            )
        )
        client.disconnect = AsyncMock()
        mock_cls.return_value = client
        yield client
```

- [ ] **Step 2: Verify tests still collect**

Run: `python -m pytest --co -q 2>&1 | tail -5`
Expected: Tests collect without errors.

- [ ] **Step 3: Commit**

```bash
git add tests/conftest.py
git commit -m "test: rewrite conftest with real HA fixtures"
```

---

## Task 4: Python unit tests — calibration.py

**Files:**
- Modify: `tests/test_calibration.py`

- [ ] **Step 1: Write comprehensive calibration tests**

Read the existing `tests/test_calibration.py` first to understand what's already there, then rewrite to fix the collection error and add comprehensive coverage.

Test cases needed:
- `SensorTransform` init with defaults
- `SensorTransform` init with perspective params
- `apply()` with no perspective → returns input unchanged
- `apply()` with identity-like perspective → returns expected output
- `apply()` round-trip: known src corners → known dst corners
- `apply()` degenerate: denom near zero → returns input
- `apply()` with wrong-length perspective → returns input
- `to_dict()` / `from_dict()` round-trip
- `from_dict()` with empty data → default transform

- [ ] **Step 2: Run tests**

Run: `python -m pytest tests/test_calibration.py -v`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_calibration.py
git commit -m "test: comprehensive calibration unit tests"
```

---

## Task 5: Python unit tests — zone_engine.py

**Files:**
- Modify: `tests/test_zone_engine.py`

- [ ] **Step 1: Review existing tests and expand**

Read existing `tests/test_zone_engine.py` (623 lines). Keep what works, add missing coverage:

Additional test cases needed:
- `Grid.xy_to_cell` with out-of-bounds coordinates → None
- `Grid.from_base64` / `to_base64` round-trip
- `Grid.compute_extent` with no perspective → simple room grid
- `Grid.compute_extent` with perspective → FOV-based extent
- `TumblingWindow` reset behavior
- `TumblingWindow` window boundary timing
- `ZoneEngine` entry-point gating: non-entry-point zone requires 2 qualifying ticks
- `ZoneEngine` handoff: target moves zone A → zone B, A enters PENDING with handoff_timeout
- `ZoneEngine` handoff: target stays in zone B, zone A clears after handoff_timeout
- `ZoneEngine` multi-target: one target leaves, other stays → zone stays occupied
- `ZoneEngine.next_expiry` returns soonest pending timestamp
- `ZoneEngine` pending targets: disappeared target still in confirmed_targets while zone PENDING
- `Zone.__post_init__` entry_point derivation for different types
- `threshold_to_frame_count` edge cases (0, 1, 9)

- [ ] **Step 2: Run tests**

Run: `python -m pytest tests/test_zone_engine.py -v`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_zone_engine.py
git commit -m "test: expand zone engine unit tests with edge cases"
```

---

## Task 6: Python integration tests — config_flow

**Files:**
- Modify: `tests/test_config_flow.py`

- [ ] **Step 1: Rewrite config flow tests with real HA fixtures**

Use `hass` fixture from pytest-homeassistant-custom-component. Test cases:
- `test_step_user_shows_form` — no input → shows host form
- `test_step_user_valid_host` — valid host → advances to name step
- `test_step_user_connection_error` — APIConnectionError → shows "cannot_connect" error
- `test_step_user_invalid_auth` — InvalidAuthAPIError → shows "invalid_auth" error
- `test_step_user_unexpected_error` — Exception → shows "cannot_connect" error
- `test_step_name_creates_entry` — name input → creates config entry with correct data
- `test_step_name_empty_uses_esphome_name` — empty name → uses ESPHome device name
- `test_duplicate_device_aborts` — same MAC → aborts with "already_configured"

Each test should use `hass.config_entries.flow.async_init` and `hass.config_entries.flow.async_configure` with the `mock_config_flow_client` fixture.

- [ ] **Step 2: Run tests**

Run: `python -m pytest tests/test_config_flow.py -v`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_config_flow.py
git commit -m "test: rewrite config flow tests with real HA fixtures"
```

---

## Task 7: Python integration tests — __init__.py (setup/unload)

**Files:**
- Modify: `tests/test_init.py`

- [ ] **Step 1: Rewrite init tests with real HA fixtures**

Test cases:
- `test_setup_entry` — entry setup creates coordinator, forwards platforms, registers panel
- `test_setup_entry_creates_device` — device registry contains the device after setup
- `test_unload_entry` — unload disconnects coordinator and unloads platforms
- `test_panel_registered_once` — multiple entries don't duplicate panel registration
- `test_setup_loads_config` — entry with saved config loads it into coordinator

Use `mock_config_entry` and `mock_esphome_client` fixtures. Setup via `hass.config_entries.async_setup(entry.entry_id)` and `await hass.async_block_till_done()`.

Note: You'll need to patch `hass.http.async_register_static_paths` and `panel_custom.async_register_panel` since they require the HTTP server which isn't available in tests.

- [ ] **Step 2: Run tests**

Run: `python -m pytest tests/test_init.py -v`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_init.py
git commit -m "test: rewrite init tests with real HA fixtures"
```

---

## Task 8: Python integration tests — coordinator

**Files:**
- Modify: `tests/test_coordinator.py`

- [ ] **Step 1: Rewrite coordinator tests**

Test cases:
- `test_coordinator_init` — default state after init
- `test_load_config_data_empty` — empty config → no change
- `test_load_config_data_with_calibration` — loads sensor transform
- `test_load_config_data_with_zones` — loads zones into zone engine
- `test_load_config_data_with_grid` — loads grid from base64
- `test_load_config_data_with_room_layout` — loads frontend grid from layout
- `test_get_config_data_roundtrip` — load → get → matches
- `test_set_zones` — sets zones on coordinator and zone engine
- `test_set_sensor_transform` — sets transform and rebuilds grid
- `test_set_offsets` — updates offsets, dispatches sensor signal
- `test_classify_entity` — maps ESPHome object_ids to internal names
- `test_classify_entity_with_prefix` — prefixed names (e.g. "ep_pro_abc_target_1_x")
- `test_target_distance` — computes euclidean distance
- `test_target_angle` — computes atan2 angle
- `test_target_speed` — converts cm/s to mm/s
- `test_device_occupied` — PIR or static or tracking → True
- `test_connected_property` — reflects connection state
- `test_illuminance_with_offset` — applies offset
- `test_temperature_with_offset` — applies offset

- [ ] **Step 2: Run tests**

Run: `python -m pytest tests/test_coordinator.py -v`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_coordinator.py
git commit -m "test: rewrite coordinator tests with real HA fixtures"
```

---

## Task 9: Python integration tests — binary_sensor

**Files:**
- Modify: `tests/test_binary_sensor.py`

- [ ] **Step 1: Rewrite binary sensor tests**

Test cases:
- `test_occupancy_sensor_created` — entity exists after setup
- `test_occupancy_sensor_device_class` — OCCUPANCY
- `test_occupancy_sensor_state` — reflects coordinator.device_occupied
- `test_motion_sensor_created` — entity exists
- `test_motion_sensor_state` — reflects coordinator.pir_motion
- `test_static_presence_sensor_created` — entity exists
- `test_static_presence_sensor_state` — reflects coordinator.static_present
- `test_target_presence_sensor_created` — entity exists (disabled by default)
- `test_zone_occupancy_sensors_created` — 8 entities (zone 0-7)
- `test_zone_occupancy_name_with_zone` — uses zone name from coordinator
- `test_zone_occupancy_name_without_zone` — falls back to "Zone N occupancy"
- `test_unique_ids_stable` — unique_ids match expected pattern

Use `hass` + `mock_config_entry` + `mock_esphome_client`, set up the entry, then check entity states.

- [ ] **Step 2: Run tests**

Run: `python -m pytest tests/test_binary_sensor.py -v`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_binary_sensor.py
git commit -m "test: rewrite binary sensor tests with real HA fixtures"
```

---

## Task 10: Python integration tests — sensor

**Files:**
- Modify: `tests/test_sensor.py`

- [ ] **Step 1: Rewrite sensor tests**

Test cases:
- `test_illuminance_sensor_created` — entity exists, device_class=ILLUMINANCE
- `test_illuminance_sensor_unit` — LIGHT_LUX
- `test_temperature_sensor_created` — entity exists, device_class=TEMPERATURE
- `test_humidity_sensor_created` — entity exists, device_class=HUMIDITY
- `test_target_count_sensor_created` — entity exists (disabled by default)
- `test_per_target_sensors_created` — xy_sensor, xy_grid, distance, angle, speed, resolution × 3 targets
- `test_zone_target_count_sensors_created` — 8 entities (zone 0-7)
- `test_unique_ids_stable` — unique_ids match expected pattern
- `test_illuminance_nan_returns_none` — NaN/Inf value → None

- [ ] **Step 2: Run tests**

Run: `python -m pytest tests/test_sensor.py -v`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_sensor.py
git commit -m "test: rewrite sensor tests with real HA fixtures"
```

---

## Task 11: Python integration tests — websocket_api

**Files:**
- Modify: `tests/test_websocket_api.py`

- [ ] **Step 1: Rewrite websocket API tests**

Use `hass_ws_client` fixture from pytest-homeassistant-custom-component. Test cases:
- `test_list_entries` — returns configured entries
- `test_get_config` — returns coordinator config data
- `test_get_config_not_found` — bad entry_id → error
- `test_set_setup` — saves perspective + room dimensions
- `test_set_zones` — saves zone config to entry options
- `test_set_room_layout` — saves grid + zones + furniture
- `test_subscribe_targets` — subscribes and receives initial state
- `test_rename_zone_entities` — renames entity IDs in registry
- `test_rename_zone_entities_not_found` — bad entity → error in result
- `test_set_reporting` — enables/disables reporting entities

- [ ] **Step 2: Run tests**

Run: `python -m pytest tests/test_websocket_api.py -v`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_websocket_api.py
git commit -m "test: rewrite websocket API tests with real HA fixtures"
```

---

## Task 12: Frontend — extract grid.ts

**Files:**
- Create: `frontend/src/lib/grid.ts`
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Create frontend/src/lib/grid.ts**

Extract from `everything-presence-pro-panel.ts` lines 120-146 and 809-828, 979-1006, 588-596, 1157-1170. These are the cell bitmask constants, cell functions, and grid computation functions.

```typescript
// Cell byte encoding
export const CELL_ROOM_BIT = 0x01;
export const CELL_ZONE_MASK = 0x0e; // bits 1-3
export const CELL_ZONE_SHIFT = 1;
export const MAX_ZONES = 7;

// Grid dimensions
export const GRID_COLS = 20;
export const GRID_ROWS = 20;
export const GRID_CELL_COUNT = GRID_COLS * GRID_ROWS;
export const GRID_CELL_MM = 300;
export const MAX_RANGE = 6000;

// Cell accessors
export const cellIsInside = (v: number): boolean => (v & CELL_ROOM_BIT) !== 0;
export const cellZone = (v: number): number => (v >> CELL_ZONE_SHIFT) & 0x07;
export const cellSetInside = (v: number, inside: boolean): number =>
	inside ? v | CELL_ROOM_BIT : v & ~CELL_ROOM_BIT;
export const cellSetZone = (v: number, zone: number): number =>
	(v & ~CELL_ZONE_MASK) | ((zone & 0x07) << CELL_ZONE_SHIFT);

/** Compute the bounding box of inside-room cells with 1-cell padding */
export function getRoomBounds(grid: Uint8Array): {
	minCol: number;
	maxCol: number;
	minRow: number;
	maxRow: number;
} {
	let minCol = GRID_COLS;
	let maxCol = 0;
	let minRow = GRID_ROWS;
	let maxRow = 0;
	for (let i = 0; i < GRID_CELL_COUNT; i++) {
		if (cellIsInside(grid[i])) {
			const col = i % GRID_COLS;
			const row = Math.floor(i / GRID_COLS);
			if (col < minCol) minCol = col;
			if (col > maxCol) maxCol = col;
			if (row < minRow) minRow = row;
			if (row > maxRow) maxRow = row;
		}
	}
	return {
		minCol: Math.max(0, minCol - 1),
		maxCol: Math.min(GRID_COLS - 1, maxCol + 1),
		minRow: Math.max(0, minRow - 1),
		maxRow: Math.min(GRID_ROWS - 1, maxRow + 1),
	};
}

/** Get raw room bounds without padding */
export function getRawRoomBounds(grid: Uint8Array): {
	minCol: number;
	maxCol: number;
	minRow: number;
	maxRow: number;
} {
	let minCol = GRID_COLS;
	let maxCol = 0;
	let minRow = GRID_ROWS;
	let maxRow = 0;
	for (let i = 0; i < GRID_CELL_COUNT; i++) {
		if (cellIsInside(grid[i])) {
			const col = i % GRID_COLS;
			const row = Math.floor(i / GRID_COLS);
			if (col < minCol) minCol = col;
			if (col > maxCol) maxCol = col;
			if (row < minRow) minRow = row;
			if (row > maxRow) maxRow = row;
		}
	}
	return { minCol, maxCol, minRow, maxRow };
}

/** Initialize a grid with a room rectangle centered horizontally */
export function initGridFromRoom(
	roomWidth: number,
	roomDepth: number,
): Uint8Array {
	const grid = new Uint8Array(GRID_CELL_COUNT);
	const roomCols = Math.ceil(roomWidth / GRID_CELL_MM);
	const roomRows = Math.ceil(roomDepth / GRID_CELL_MM);
	const startCol = Math.floor((GRID_COLS - roomCols) / 2);
	const startRow = 0;

	for (let r = 0; r < GRID_ROWS; r++) {
		for (let c = 0; c < GRID_COLS; c++) {
			const idx = r * GRID_COLS + c;
			const inRoom =
				c >= startCol &&
				c < startCol + roomCols &&
				r >= startRow &&
				r < startRow + roomRows;
			if (inRoom) {
				grid[idx] = CELL_ROOM_BIT;
			}
		}
	}
	return grid;
}

/** Derive room width/depth from the raw room bounds in the grid */
export function updateRoomDimensionsFromGrid(grid: Uint8Array): {
	roomWidth: number;
	roomDepth: number;
} {
	const raw = getRawRoomBounds(grid);
	if (raw.minCol > raw.maxCol) {
		return { roomWidth: 0, roomDepth: 0 };
	}
	return {
		roomWidth: (raw.maxCol - raw.minCol + 1) * GRID_CELL_MM,
		roomDepth: (raw.maxRow - raw.minRow + 1) * GRID_CELL_MM,
	};
}
```

- [ ] **Step 2: Update panel to import from lib/grid.ts**

In `everything-presence-pro-panel.ts`, replace the inline constants and functions (lines ~120-146, plus the method bodies) with imports from `./lib/grid.ts`. Keep the private methods on the class but have them delegate to the imported functions.

Remove the module-level `const CELL_ROOM_BIT`, `CELL_ZONE_MASK`, `CELL_ZONE_SHIFT`, `MAX_ZONES`, `cellIsInside`, `cellZone`, `cellSetInside`, `cellSetZone`, `GRID_COLS`, `GRID_ROWS`, `GRID_CELL_COUNT`, `GRID_CELL_MM`, `MAX_RANGE` and replace with:

```typescript
import {
  CELL_ROOM_BIT, CELL_ZONE_MASK, CELL_ZONE_SHIFT, MAX_ZONES,
  GRID_COLS, GRID_ROWS, GRID_CELL_COUNT, GRID_CELL_MM, MAX_RANGE,
  cellIsInside, cellZone, cellSetInside, cellSetZone,
  getRoomBounds, getRawRoomBounds, initGridFromRoom, updateRoomDimensionsFromGrid,
} from "./lib/grid.js";
```

Update `_getRoomBounds()` to call `getRoomBounds(this._grid)`, `_getRawRoomBounds()` to call `getRawRoomBounds(this._grid)`, `_initGridFromRoom()` to call `this._grid = initGridFromRoom(this._roomWidth, this._roomDepth)`, and `_updateRoomDimensionsFromGrid()` to call `const dims = updateRoomDimensionsFromGrid(this._grid); this._roomWidth = dims.roomWidth; this._roomDepth = dims.roomDepth;`.

- [ ] **Step 3: Verify build still works**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/grid.ts frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: extract grid functions into lib/grid.ts"
```

---

## Task 13: Frontend — extract perspective.ts

**Files:**
- Create: `frontend/src/lib/perspective.ts`
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Create frontend/src/lib/perspective.ts**

Extract the perspective math from the panel (lines 1034-1063, 1345-1386).

```typescript
/** Solve for 8 perspective coefficients from 4 point pairs (src → dst).
 *  Uses Gaussian elimination with partial pivoting.
 *  Returns [a, b, c, d, e, f, g, h] or null if singular.
 */
export function solvePerspective(
	src: { x: number; y: number }[],
	dst: { x: number; y: number }[],
): number[] | null {
	const A: number[][] = [];
	const b: number[] = [];
	for (let i = 0; i < 4; i++) {
		const sx = src[i].x;
		const sy = src[i].y;
		const rx = dst[i].x;
		const ry = dst[i].y;
		A.push([sx, sy, 1, 0, 0, 0, -sx * rx, -sy * rx]);
		b.push(rx);
		A.push([0, 0, 0, sx, sy, 1, -sx * ry, -sy * ry]);
		b.push(ry);
	}
	const n = 8;
	const M = A.map((row, i) => [...row, b[i]]);
	for (let col = 0; col < n; col++) {
		let maxVal = Math.abs(M[col][col]);
		let maxRow = col;
		for (let row = col + 1; row < n; row++) {
			if (Math.abs(M[row][col]) > maxVal) {
				maxVal = Math.abs(M[row][col]);
				maxRow = row;
			}
		}
		if (maxVal < 1e-12) return null;
		[M[col], M[maxRow]] = [M[maxRow], M[col]];
		for (let row = col + 1; row < n; row++) {
			const factor = M[row][col] / M[col][col];
			for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
		}
	}
	const x = new Array(n);
	for (let i = n - 1; i >= 0; i--) {
		x[i] = M[i][n];
		for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
		x[i] /= M[i][i];
	}
	return x;
}

/** Apply a perspective transform (8 coefficients) to a point. */
export function applyPerspective(
	h: number[],
	x: number,
	y: number,
): { x: number; y: number } {
	const w = h[6] * x + h[7] * y + 1;
	return {
		x: (h[0] * x + h[1] * y + h[2]) / w,
		y: (h[3] * x + h[4] * y + h[5]) / w,
	};
}

/** Compute inverse perspective from forward transform coefficients.
 *  Returns 8-element array or null if singular.
 */
export function getInversePerspective(h: number[]): number[] | null {
	if (!h || h.length < 8) return null;
	const H = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
	const det =
		H[0] * (H[4] * H[8] - H[5] * H[7]) -
		H[1] * (H[3] * H[8] - H[5] * H[6]) +
		H[2] * (H[3] * H[7] - H[4] * H[6]);
	if (Math.abs(det) < 1e-10) return null;
	const inv = [
		(H[4] * H[8] - H[5] * H[7]) / det,
		(H[2] * H[7] - H[1] * H[8]) / det,
		(H[1] * H[5] - H[2] * H[4]) / det,
		(H[5] * H[6] - H[3] * H[8]) / det,
		(H[0] * H[8] - H[2] * H[6]) / det,
		(H[2] * H[3] - H[0] * H[5]) / det,
		(H[3] * H[7] - H[4] * H[6]) / det,
		(H[1] * H[6] - H[0] * H[7]) / det,
		(H[0] * H[4] - H[1] * H[3]) / det,
	];
	const s = inv[8];
	if (Math.abs(s) < 1e-10) return null;
	return [
		inv[0] / s,
		inv[1] / s,
		inv[2] / s,
		inv[3] / s,
		inv[4] / s,
		inv[5] / s,
		inv[6] / s,
		inv[7] / s,
	];
}
```

- [ ] **Step 2: Update panel to import from lib/perspective.ts**

Replace `_solvePerspective`, `_applyPerspective`, `_getInversePerspective` method bodies with calls to the imported functions. Methods become thin wrappers.

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/perspective.ts frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: extract perspective math into lib/perspective.ts"
```

---

## Task 14: Frontend — extract coordinates.ts

**Files:**
- Create: `frontend/src/lib/coordinates.ts`
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Create frontend/src/lib/coordinates.ts**

Extract coordinate mapping functions from the panel (lines 1016-1031, 1173-1188, 1437-1443, 1227-1250).

```typescript
import { GRID_CELL_MM, GRID_COLS, MAX_RANGE } from "./grid.js";

/** Map a target to percentage coordinates for the editor grid. */
export function mapTargetToPercent(
	targetX: number,
	targetY: number,
	roomWidth: number,
	roomDepth: number,
): { x: number; y: number } {
	if (roomWidth > 0 && roomDepth > 0) {
		const rx = Math.max(0, Math.min(targetX, roomWidth));
		const ry = Math.max(0, Math.min(targetY, roomDepth));
		return {
			x: (rx / roomWidth) * 100,
			y: (ry / roomDepth) * 100,
		};
	}
	return {
		x: (targetX / MAX_RANGE) * 100,
		y: (targetY / MAX_RANGE) * 100,
	};
}

/** Map a target to a fractional grid cell position (col, row) */
export function mapTargetToGridCell(
	targetX: number,
	targetY: number,
	roomWidth: number,
	roomDepth: number,
): { col: number; row: number } | null {
	if (roomWidth <= 0 || roomDepth <= 0) return null;
	const roomCols = Math.ceil(roomWidth / GRID_CELL_MM);
	const startCol = Math.floor((GRID_COLS - roomCols) / 2);
	return {
		col: startCol + targetX / GRID_CELL_MM,
		row: targetY / GRID_CELL_MM,
	};
}

/** Map raw sensor coords to percentage in the FOV view (120° wedge) */
export function rawToFovPct(
	rawX: number,
	rawY: number,
): { xPct: number; yPct: number } {
	const halfW = MAX_RANGE * Math.sin(Math.PI / 3);
	return {
		xPct: ((rawX + halfW) / (halfW * 2)) * 100,
		yPct: (rawY / MAX_RANGE) * 100,
	};
}

/** 1-second rolling median smoother */
export function getSmoothedValue(
	buffer: { x: number; y: number; t: number }[],
	newX: number,
	newY: number,
	now: number,
): { x: number; y: number; buffer: { x: number; y: number; t: number }[] } {
	const updated = [...buffer, { x: newX, y: newY, t: now }].filter(
		(s) => now - s.t <= 1000,
	);

	if (updated.length === 0) {
		return { x: newX, y: newY, buffer: updated };
	}

	const medianOf = (arr: number[]): number => {
		const sorted = arr.slice().sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2
			? sorted[mid]
			: (sorted[mid - 1] + sorted[mid]) / 2;
	};

	return {
		x: medianOf(updated.map((s) => s.x)),
		y: medianOf(updated.map((s) => s.y)),
		buffer: updated,
	};
}
```

- [ ] **Step 2: Update panel to import from lib/coordinates.ts**

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/coordinates.ts frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: extract coordinate functions into lib/coordinates.ts"
```

---

## Task 15: Frontend — extract zone-defaults.ts

**Files:**
- Create: `frontend/src/lib/zone-defaults.ts`
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Create frontend/src/lib/zone-defaults.ts**

Extract zone type defaults and threshold resolution from the panel (lines 27-32, 4604-4623).

```typescript
export interface ZoneConfig {
	name: string;
	color: string;
	type: "normal" | "entrance" | "thoroughfare" | "rest" | "custom";
	trigger?: number;
	renew?: number;
	timeout?: number;
	handoff_timeout?: number;
	entry_point?: boolean;
}

export const ZONE_TYPE_DEFAULTS: Record<
	string,
	{ trigger: number; renew: number; timeout: number; handoff_timeout: number }
> = {
	normal: { trigger: 5, renew: 3, timeout: 10, handoff_timeout: 3 },
	entrance: { trigger: 3, renew: 2, timeout: 5, handoff_timeout: 1 },
	thoroughfare: { trigger: 3, renew: 2, timeout: 3, handoff_timeout: 1 },
	rest: { trigger: 7, renew: 1, timeout: 30, handoff_timeout: 10 },
};

// Color-blind-friendly palette
export const ZONE_COLORS = [
	"#E69F00",
	"#56B4E9",
	"#009E73",
	"#F0E442",
	"#0072B2",
	"#D55E00",
	"#CC79A7",
];

/** Get trigger/renew/timeout for a zone, resolving type defaults */
export function getZoneThresholds(
	zoneConfig: ZoneConfig | null,
	zoneId: number,
	roomType: string,
	roomTrigger: number,
	roomRenew: number,
	roomTimeout: number,
	roomHandoffTimeout: number,
	roomEntryPoint: boolean,
): {
	trigger: number;
	renew: number;
	timeout: number;
	handoffTimeout: number;
	entryPoint: boolean;
} {
	if (zoneId === 0) {
		const d = ZONE_TYPE_DEFAULTS[roomType] || ZONE_TYPE_DEFAULTS.normal;
		const isCustom = roomType === "custom";
		return isCustom
			? {
					trigger: roomTrigger,
					renew: roomRenew,
					timeout: roomTimeout,
					handoffTimeout: roomHandoffTimeout,
					entryPoint: roomEntryPoint,
				}
			: {
					trigger: d.trigger,
					renew: d.renew,
					timeout: d.timeout,
					handoffTimeout: d.handoff_timeout,
					entryPoint: false,
				};
	}
	if (zoneConfig) {
		const d =
			ZONE_TYPE_DEFAULTS[zoneConfig.type] || ZONE_TYPE_DEFAULTS.normal;
		const isCustom = zoneConfig.type === "custom";
		return isCustom
			? {
					trigger: zoneConfig.trigger ?? d.trigger,
					renew: zoneConfig.renew ?? d.renew,
					timeout: zoneConfig.timeout ?? d.timeout,
					handoffTimeout: zoneConfig.handoff_timeout ?? d.handoff_timeout,
					entryPoint: zoneConfig.entry_point ?? false,
				}
			: {
					trigger: d.trigger,
					renew: d.renew,
					timeout: d.timeout,
					handoffTimeout: d.handoff_timeout,
					entryPoint: zoneConfig.type === "entrance",
				};
	}
	return {
		trigger: 5,
		renew: 3,
		timeout: 10,
		handoffTimeout: 3,
		entryPoint: false,
	};
}
```

- [ ] **Step 2: Update panel to import from lib/zone-defaults.ts**

Replace the inline `ZONE_TYPE_DEFAULTS`, `ZoneConfig` interface, and `ZONE_COLORS` with imports. Update `_getZoneThresholds` to delegate.

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/zone-defaults.ts frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: extract zone defaults into lib/zone-defaults.ts"
```

---

## Task 16: Frontend unit tests — grid.test.ts

**Files:**
- Create: `frontend/src/lib/__tests__/grid.test.ts`

- [ ] **Step 1: Write grid unit tests**

```typescript
import { describe, it, expect } from "vitest";
import {
  CELL_ROOM_BIT, CELL_ZONE_MASK, GRID_CELL_COUNT, GRID_CELL_MM,
  GRID_COLS, GRID_ROWS, MAX_ZONES,
  cellIsInside, cellZone, cellSetInside, cellSetZone,
  getRoomBounds, getRawRoomBounds, initGridFromRoom, updateRoomDimensionsFromGrid,
} from "../grid.js";

describe("cellIsInside", () => {
  it("returns true when room bit is set", () => {
    expect(cellIsInside(0x01)).toBe(true);
    expect(cellIsInside(0x0f)).toBe(true);
  });
  it("returns false when room bit is clear", () => {
    expect(cellIsInside(0x00)).toBe(false);
    expect(cellIsInside(0x0e)).toBe(false);
  });
});

describe("cellZone", () => {
  it("extracts zone 0 from bare room cell", () => {
    expect(cellZone(CELL_ROOM_BIT)).toBe(0);
  });
  it("extracts zones 1-7 correctly", () => {
    for (let z = 1; z <= MAX_ZONES; z++) {
      const cell = cellSetZone(CELL_ROOM_BIT, z);
      expect(cellZone(cell)).toBe(z);
    }
  });
});

describe("cellSetInside / cellSetZone round-trips", () => {
  it("setting inside preserves zone", () => {
    const cell = cellSetZone(0, 3);
    const withRoom = cellSetInside(cell, true);
    expect(cellIsInside(withRoom)).toBe(true);
    expect(cellZone(withRoom)).toBe(3);
  });
  it("clearing inside preserves zone", () => {
    const cell = cellSetZone(CELL_ROOM_BIT, 5);
    const cleared = cellSetInside(cell, false);
    expect(cellIsInside(cleared)).toBe(false);
    expect(cellZone(cleared)).toBe(5);
  });
  it("setting zone preserves inside bit", () => {
    const cell = CELL_ROOM_BIT;
    const withZone = cellSetZone(cell, 4);
    expect(cellIsInside(withZone)).toBe(true);
    expect(cellZone(withZone)).toBe(4);
  });
});

describe("getRoomBounds", () => {
  it("returns padded bounds for a room grid", () => {
    const grid = initGridFromRoom(1200, 900); // 4 cols × 3 rows
    const bounds = getRoomBounds(grid);
    expect(bounds.minCol).toBeGreaterThanOrEqual(0);
    expect(bounds.maxCol).toBeLessThan(GRID_COLS);
    expect(bounds.maxCol - bounds.minCol).toBeGreaterThanOrEqual(4);
  });
  it("handles empty grid", () => {
    const grid = new Uint8Array(GRID_CELL_COUNT);
    const bounds = getRoomBounds(grid);
    // No inside cells — bounds are inverted
    expect(bounds.minCol).toBeGreaterThan(bounds.maxCol);
  });
});

describe("getRawRoomBounds", () => {
  it("returns exact bounds without padding", () => {
    const grid = initGridFromRoom(600, 600); // 2 cols × 2 rows
    const raw = getRawRoomBounds(grid);
    const roomCols = Math.ceil(600 / GRID_CELL_MM);
    const startCol = Math.floor((GRID_COLS - roomCols) / 2);
    expect(raw.minCol).toBe(startCol);
    expect(raw.maxCol).toBe(startCol + roomCols - 1);
    expect(raw.minRow).toBe(0);
    expect(raw.maxRow).toBe(Math.ceil(600 / GRID_CELL_MM) - 1);
  });
});

describe("initGridFromRoom", () => {
  it("creates grid with correct room cells", () => {
    const grid = initGridFromRoom(3000, 6000); // 10 cols × 20 rows
    let insideCount = 0;
    for (let i = 0; i < GRID_CELL_COUNT; i++) {
      if (cellIsInside(grid[i])) insideCount++;
    }
    expect(insideCount).toBe(10 * 20);
  });
  it("centers room horizontally", () => {
    const grid = initGridFromRoom(1800, 600); // 6 cols × 2 rows
    const raw = getRawRoomBounds(grid);
    const startCol = Math.floor((GRID_COLS - 6) / 2);
    expect(raw.minCol).toBe(startCol);
    expect(raw.maxCol).toBe(startCol + 5);
  });
});

describe("updateRoomDimensionsFromGrid", () => {
  it("computes dimensions from grid", () => {
    const grid = initGridFromRoom(1200, 1800);
    const dims = updateRoomDimensionsFromGrid(grid);
    expect(dims.roomWidth).toBe(1200);
    expect(dims.roomDepth).toBe(1800);
  });
  it("returns zero for empty grid", () => {
    const grid = new Uint8Array(GRID_CELL_COUNT);
    const dims = updateRoomDimensionsFromGrid(grid);
    expect(dims.roomWidth).toBe(0);
    expect(dims.roomDepth).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run src/lib/__tests__/grid.test.ts`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/__tests__/grid.test.ts
git commit -m "test: add grid unit tests"
```

---

## Task 17: Frontend unit tests — perspective.test.ts

**Files:**
- Create: `frontend/src/lib/__tests__/perspective.test.ts`

- [ ] **Step 1: Write perspective unit tests**

Test cases:
- `solvePerspective` with identity mapping (unit square → unit square)
- `solvePerspective` with known transform (manually computed)
- `solvePerspective` with collinear points → null
- `applyPerspective` with identity-like coefficients
- `applyPerspective` known point through known transform
- `getInversePerspective` round-trip: forward then inverse ≈ original
- `getInversePerspective` with null/empty → null
- `getInversePerspective` with singular matrix → null
- Full round-trip: solve → apply → inverse → apply ≈ original points

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run src/lib/__tests__/perspective.test.ts`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/__tests__/perspective.test.ts
git commit -m "test: add perspective math unit tests"
```

---

## Task 18: Frontend unit tests — coordinates.test.ts

**Files:**
- Create: `frontend/src/lib/__tests__/coordinates.test.ts`

- [ ] **Step 1: Write coordinate unit tests**

Test cases:
- `mapTargetToPercent` with valid room: target at room center → 50%, 50%
- `mapTargetToPercent` with valid room: target clamped to bounds
- `mapTargetToPercent` with zero room: falls back to MAX_RANGE scaling
- `mapTargetToGridCell` with valid room: center target → center cell
- `mapTargetToGridCell` with zero room → null
- `rawToFovPct`: center (0, range) → 50%, 100%
- `rawToFovPct`: left edge → ~0%, right edge → ~100%
- `getSmoothedValue`: single point → same point
- `getSmoothedValue`: multiple points → median
- `getSmoothedValue`: old points pruned from buffer

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run src/lib/__tests__/coordinates.test.ts`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/__tests__/coordinates.test.ts
git commit -m "test: add coordinate mapping unit tests"
```

---

## Task 19: Frontend unit tests — zone-defaults.test.ts

**Files:**
- Create: `frontend/src/lib/__tests__/zone-defaults.test.ts`

- [ ] **Step 1: Write zone defaults unit tests**

Test cases:
- `ZONE_TYPE_DEFAULTS` has expected keys: normal, entrance, thoroughfare, rest
- Each type has trigger, renew, timeout, handoff_timeout
- `getZoneThresholds` for zone 0 with "normal" type → normal defaults
- `getZoneThresholds` for zone 0 with "custom" type → room-level custom values
- `getZoneThresholds` for named zone with type defaults → type defaults
- `getZoneThresholds` for named zone with "custom" → zone-level custom values
- `getZoneThresholds` for null config → fallback defaults
- `getZoneThresholds` entrance type → entryPoint=true
- `ZONE_COLORS` has 7 entries (one per zone)

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run src/lib/__tests__/zone-defaults.test.ts`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/__tests__/zone-defaults.test.ts
git commit -m "test: add zone defaults unit tests"
```

---

## Task 20: Frontend component tests — panel-zones.test.ts

**Files:**
- Create: `frontend/src/__tests__/panel-zones.test.ts`

- [ ] **Step 1: Write panel zone CRUD tests**

Instantiate the panel element, set minimal properties, and test zone operations. You'll need to create a mock `hass` object.

Test cases:
- `_addZone` creates zone in first empty slot with color from palette
- `_addZone` sets `_dirty = true`
- `_addZone` when all 7 full → no-op
- `_removeZone` nulls the slot and clears grid cells
- `_removeZone` invalid slot → no-op
- Zone config update: changing type updates defaults

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run src/__tests__/panel-zones.test.ts`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/__tests__/panel-zones.test.ts
git commit -m "test: add panel zone CRUD tests"
```

---

## Task 21: Frontend component tests — panel-furniture.test.ts

**Files:**
- Create: `frontend/src/__tests__/panel-furniture.test.ts`

- [ ] **Step 1: Write panel furniture CRUD tests**

Test cases:
- `_addFurniture` creates item with defaults from sticker
- `_addFurniture` sets `_dirty = true` and `_selectedFurnitureId`
- `_removeFurniture` removes by id, clears selection if was selected
- `_updateFurniture` merges partial updates
- `_addCustomFurniture` creates icon-type furniture

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run src/__tests__/panel-furniture.test.ts`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/__tests__/panel-furniture.test.ts
git commit -m "test: add panel furniture CRUD tests"
```

---

## Task 22: Frontend component tests — panel-grid.test.ts

**Files:**
- Create: `frontend/src/__tests__/panel-grid.test.ts`

- [ ] **Step 1: Write panel grid painting tests**

Test cases:
- Boundary painting: mousedown on outside cell with activeZone=0, paintAction="set" → cell becomes inside
- Boundary clearing: paintAction="clear" → cell becomes outside
- Zone painting: activeZone=2 on inside cell → cell gets zone 2
- Zone clearing: paintAction="clear" on zone cell → zone cleared to 0
- Zone painting on outside cell → no-op (only paints inside cells)
- Room dimensions update after boundary change

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run src/__tests__/panel-grid.test.ts`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/__tests__/panel-grid.test.ts
git commit -m "test: add panel grid painting tests"
```

---

## Task 23: Frontend component tests — panel-navigation.test.ts

**Files:**
- Create: `frontend/src/__tests__/panel-navigation.test.ts`

- [ ] **Step 1: Write navigation guard tests**

Test cases:
- `_guardNavigation` with `_dirty=false` → executes action immediately
- `_guardNavigation` with `_dirty=true` → stores action, shows dialog
- `_discardAndNavigate` → resets dirty, executes pending, clears pending
- `_discardAndNavigate` with no pending → no-op

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run src/__tests__/panel-navigation.test.ts`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/__tests__/panel-navigation.test.ts
git commit -m "test: add panel navigation guard tests"
```

---

## Task 24: Frontend component tests — panel-render.test.ts

**Files:**
- Create: `frontend/src/__tests__/panel-render.test.ts`

- [ ] **Step 1: Write render smoke tests**

These test that each view renders without throwing. Create the element, set required state, call `requestUpdate()` and check the shadow DOM.

Test cases:
- Panel renders with minimal state (loading spinner)
- Panel renders live view when entries loaded and calibrated
- Panel renders editor view
- Panel renders settings view
- Panel renders wizard guide step
- Panel renders uncalibrated prompt when no perspective

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run src/__tests__/panel-render.test.ts`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/__tests__/panel-render.test.ts
git commit -m "test: add panel render smoke tests"
```

---

## Task 25: Final verification

- [ ] **Step 1: Run all Python tests**

Run: `python -m pytest tests/ -v --tb=short`
Expected: All PASS, no collection errors.

- [ ] **Step 2: Run all frontend tests**

Run: `cd frontend && npx vitest run`
Expected: All PASS.

- [ ] **Step 3: Run all linting**

Run: `ruff check custom_components/ tests/ && ruff format --check custom_components/ tests/`
Run: `cd frontend && npx biome check src/`
Expected: All clean.

- [ ] **Step 4: Verify frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds, output file exists.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A && git commit -m "test: final cleanup and verification"
```

# Coverage Enforcement Design

**Date**: 2026-03-20
**Status**: Approved
**Goal**: Enforce 90% per-file test coverage for both Python and TypeScript, with CI failing on violations.

## Context

Current per-file coverage (measured 2026-03-20):

**Python** (82% aggregate):

| File | Coverage |
|------|----------|
| calibration.py | 100% |
| config_flow.py | 100% |
| const.py | 100% |
| \_\_init\_\_.py | 96% |
| zone_engine.py | 96% |
| binary_sensor.py | 93% |
| sensor.py | 87% |
| coordinator.py | 70% |
| websocket_api.py | 63% |

**TypeScript** (27% aggregate):

| File | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| grid.ts | 100% | 100% | 100% | 100% |
| zone-defaults.ts | 100% | 100% | 100% | 100% |
| perspective.ts | 96% | **83%** | 100% | 100% |
| coordinates.ts | 97% | **93%** | 100% | 96% |
| index.ts | 100% | 100% | 100% | 100% |
| everything-presence-pro-panel.ts | 18% | **7%** | 9% | 16% |

## 1. Python Coverage Enforcement

### 1.1 `pyproject.toml` additions

```toml
[tool.coverage.run]
source = ["custom_components/everything_presence_pro"]

[tool.coverage.report]
show_missing = true

[tool.coverage.json]
output = "coverage.json"
```

No `fail_under` in coverage config — per-file enforcement is handled by a custom script since `coverage.py` only supports aggregate thresholds natively.

### 1.2 `scripts/check_coverage.py`

A script that:
1. Reads `coverage.json` (produced by `pytest --cov-report=json`)
2. Iterates each source file: `for path, file_data in data["files"].items()` and reads `file_data["summary"]["percent_covered"]`
3. Exits non-zero if any file is below 90%, printing which files failed and their actual coverage
4. Prints a success message if all files pass

The threshold (90) is defined as a constant at the top of the script for easy adjustment.

### 1.3 CI changes in `tests.yml` (Python job)

Replace the current pytest line:
```yaml
# Before
- name: Pytest
  run: pytest tests/ --cov=custom_components/everything_presence_pro --cov-report=xml -v

# After
- name: Pytest
  run: pytest tests/ --cov=custom_components/everything_presence_pro --cov-report=term-missing --cov-report=json -v
- name: Check per-file coverage
  run: python scripts/check_coverage.py
```

This supersedes the pytest invocation in the CI infrastructure spec (section 1.1, step 7). The XML report is dropped (no external service to upload to). Term-missing provides human-readable output in CI logs. JSON provides machine-readable data for the check script.

### 1.4 `.gitignore` addition

Add `coverage.json` and `.coverage` to `.gitignore`.

## 2. TypeScript Coverage Enforcement

### 2.1 `vitest.config.ts` changes

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/__tests__/**", "src/index.ts"],
      thresholds: {
        perFile: true,
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
```

Vitest natively supports per-file thresholds. When `perFile: true` is set, the test run fails if any individual file drops below any of the four thresholds.

### 2.2 `package.json` changes

Add `@vitest/coverage-v8` to `devDependencies`.

Add script:
```json
"test:coverage": "vitest run --coverage"
```

### 2.3 CI changes in `tests.yml` (Frontend job)

```yaml
# Before
- name: Vitest
  run: npx vitest run

# After
- name: Vitest with coverage
  run: npm run test:coverage
```

### 2.4 `.gitignore` addition

Add `frontend/coverage/` to `.gitignore` (vitest coverage output directory).

## 3. Test Gaps to Fill

### 3.1 Python files below 90%

**coordinator.py (70% -> 90%)**

Missing coverage (~80 lines):
- `async_connect()` / `_on_connect()` / `async_disconnect()` — connection lifecycle
- `_build_calibrated_targets()` — target coordinate transformation pipeline
- `_expiry_tick()` / `_schedule_expiry_tick()` — periodic zone expiry processing
- `_schedule_rebuild()` — debounced zone engine rebuild
- `_do_display_update()` — frontend update dispatch
- `_on_disconnect()` / `_on_connect_error()` — error handling paths

**websocket_api.py (63% -> 90%)**

Missing coverage (~70 lines):
- `websocket_rename_zone_entities()` — entity renaming after zone config changes
- `websocket_set_reporting()` — reporting configuration command
- Error paths for existing commands (invalid entry IDs, malformed payloads)
- Lines 98-134: command handler registration/dispatch
- Lines 538-693: the two unexercised command handlers

**sensor.py (87% -> 90%)**

Missing coverage (~10 lines):
- `async_setup_entry()` platform setup function
- A few disabled-entity edge case paths
- Lines 310-354: per-target sensor setup paths

### 3.2 TypeScript files below 90%

**perspective.ts (83% branches -> 90%)**

Branch coverage is at 83% due to untested degenerate-input guards in `getInversePerspective` (lines 84-98 — the `if (Math.abs(...) < 1e-10) return null` paths). Add tests for near-singular matrices to cover these branches.

**everything-presence-pro-panel.ts (16% -> 90%)**

This 5,809-line monolith requires extraction before testing is practical. Logic to extract into new lib modules:

- **Target data processing** — smoothing buffers, frame parsing, active target determination
- **Calibration wizard state** — step progression, corner capture, dimension computation
- **Room layout serialization** — save/load format conversion, validation
- **SVG geometry helpers** — coordinate transforms for rendering, hit testing

After extraction, new lib modules get unit tests (following the pattern of existing grid.ts, coordinates.ts, etc.). The panel component retains rendering and event wiring — tested via component tests in happy-dom.

Estimated new panel component tests needed:
- Data loading / WebSocket integration (`_initialize`, `_loadEntries`, `_loadEntryConfig`)
- Calibration wizard flow (step progression, corner capture, save)
- SVG rendering (element creation, transform application)
- Target tracking (subscription lifecycle, frame processing)
- LocalStorage persistence (preferences, session state)
- History API interception (`_interceptNavigation`, `_beforeUnloadHandler`)

## 4. File Changes Summary

### New files
- `scripts/check_coverage.py` — per-file Python coverage enforcement script

### Modified files
- `pyproject.toml` — add `[tool.coverage.*]` sections
- `frontend/vitest.config.ts` — add coverage config with per-file thresholds
- `frontend/package.json` — add `@vitest/coverage-v8` dep, `test:coverage` script
- `.github/workflows/tests.yml` — update both jobs for coverage enforcement
- `.gitignore` — add coverage artifacts

### Test files (new or expanded)
- `tests/test_coordinator.py` — expand to cover connection lifecycle, private methods
- `tests/test_websocket_api.py` — expand to cover missing commands and error paths
- `tests/test_sensor.py` — expand to cover setup entry and edge cases
- `frontend/src/lib/*.ts` — new extracted modules (with corresponding `__tests__/*.test.ts`)
- `frontend/src/__tests__/panel-wizard.test.ts` — new: calibration wizard flow tests
- `frontend/src/__tests__/panel-*.test.ts` — expanded existing panel component tests
- `frontend/src/lib/__tests__/perspective.test.ts` — expand: degenerate-input branch coverage

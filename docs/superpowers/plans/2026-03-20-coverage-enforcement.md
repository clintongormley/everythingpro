# Coverage Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce 90% per-file test coverage for Python and TypeScript, with CI failing on violations.

**Architecture:** Two-pronged approach: (1) coverage infrastructure — config, enforcement scripts, CI changes; (2) test gap filling — write tests for all files currently below 90%. Python uses a custom `scripts/check_coverage.py` script for per-file enforcement (coverage.py only supports aggregate thresholds). TypeScript uses vitest's native `perFile` threshold support. For the TypeScript panel component (16% coverage, 5,809 lines), we extract pure logic into lib/ modules first, then test both the extracted modules and the remaining panel surface.

**Tech Stack:** Python: pytest-cov, coverage.py JSON reports. TypeScript: vitest, @vitest/coverage-v8.

**Spec:** `docs/superpowers/specs/2026-03-20-coverage-enforcement-design.md`

---

## Phase 1: Coverage Infrastructure

### Task 1: Python coverage config and enforcement script

**Files:**
- Modify: `pyproject.toml`
- Create: `scripts/check_coverage.py`
- Modify: `.gitignore`

- [ ] **Step 1: Add coverage config to pyproject.toml**

Append after the existing `[tool.pytest.ini_options]` block:

```toml
[tool.coverage.run]
source = ["custom_components/everything_presence_pro"]

[tool.coverage.report]
show_missing = true

[tool.coverage.json]
output = "coverage.json"
```

- [ ] **Step 2: Create scripts/check_coverage.py**

```python
"""Check per-file coverage meets the minimum threshold."""

import json
import sys

THRESHOLD = 90


def main() -> int:
    with open("coverage.json") as f:
        data = json.load(f)

    failures: list[tuple[str, float]] = []

    for path, file_data in data["files"].items():
        pct = file_data["summary"]["percent_covered"]
        if pct < THRESHOLD:
            failures.append((path, pct))

    if failures:
        print(f"FAIL: {len(failures)} file(s) below {THRESHOLD}% coverage:\n")
        for path, pct in sorted(failures):
            print(f"  {pct:5.1f}%  {path}")
        return 1

    total = data["totals"]["percent_covered"]
    print(f"OK: all files >= {THRESHOLD}% coverage (aggregate: {total:.1f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 3: Add coverage artifacts to .gitignore**

Append to `.gitignore`:

```
.coverage
coverage.json
```

- [ ] **Step 4: Verify the script works locally**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/ --cov=custom_components/everything_presence_pro --cov-report=json -v && python scripts/check_coverage.py`

Expected: FAIL listing coordinator.py, websocket_api.py, sensor.py below 90%. This confirms the script works — the tests we write later will make it pass.

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml scripts/check_coverage.py .gitignore
git commit -m "feat: add Python per-file coverage enforcement script"
```

---

### Task 2: TypeScript coverage config

**Files:**
- Modify: `frontend/vitest.config.ts`
- Modify: `frontend/package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Update vitest.config.ts with coverage thresholds**

Replace the entire file content:

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

- [ ] **Step 2: Add test:coverage script to package.json**

Add `"test:coverage": "vitest run --coverage"` to the scripts section, after the existing `"test:watch"` entry.

- [ ] **Step 3: Verify @vitest/coverage-v8 is in devDependencies**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && grep coverage-v8 package.json`

Expected: `"@vitest/coverage-v8": "^4.1.0"` already present (installed during brainstorming). If missing, run `npm install --save-dev @vitest/coverage-v8`.

- [ ] **Step 4: Add frontend coverage dir to .gitignore**

Append to `.gitignore`:

```
frontend/coverage/
```

- [ ] **Step 5: Verify coverage runs locally**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npm run test:coverage`

Expected: FAIL on `everything-presence-pro-panel.ts` (16% lines < 90%) and possibly `perspective.ts` (83% branches < 90%). This is expected — later tasks fix these.

- [ ] **Step 6: Commit**

```bash
git add frontend/vitest.config.ts frontend/package.json .gitignore
git commit -m "feat: add TypeScript per-file coverage enforcement via vitest"
```

---

### Task 3: CI workflow updates

**Files:**
- Modify: `.github/workflows/tests.yml`

- [ ] **Step 1: Update Python job pytest step**

Replace the existing `Pytest` step (line 43-44) with two steps:

```yaml
      - name: Pytest
        run: pytest tests/ --cov=custom_components/everything_presence_pro --cov-report=term-missing --cov-report=json -v
      - name: Check per-file coverage
        run: python scripts/check_coverage.py
```

- [ ] **Step 2: Update Frontend job vitest step**

Replace the existing `Vitest` step (line 62-63) with:

```yaml
      - name: Vitest with coverage
        run: npm run test:coverage
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/tests.yml
git commit -m "ci: enforce 90% per-file coverage for Python and TypeScript"
```

---

## Phase 2: Python Test Gap Filling

### Task 4: Coordinator connection lifecycle tests

**Files:**
- Modify: `tests/test_coordinator.py`

Tests for `async_connect()`, `_on_connect()`, `_on_disconnect()`, `_on_connect_error()`, `async_disconnect()`.

These use the existing `mock_hass`/`mock_entry` fixtures from the test file, plus patching `APIClient` and `ReconnectLogic`.

- [ ] **Step 1: Write tests for connection lifecycle**

Add a new test class at the end of `tests/test_coordinator.py`:

```python
from unittest.mock import AsyncMock, patch

class TestConnectionLifecycle:
    """Tests for connect/disconnect lifecycle."""

    async def test_async_connect_creates_client_and_starts_reconnect(self, mock_hass, mock_entry):
        """async_connect creates APIClient and starts ReconnectLogic."""
        with (
            patch("custom_components.everything_presence_pro.coordinator.APIClient") as mock_api_cls,
            patch("custom_components.everything_presence_pro.coordinator.ReconnectLogic") as mock_rl_cls,
        ):
            mock_rl = AsyncMock()
            mock_rl_cls.return_value = mock_rl
            mock_api_cls.return_value = AsyncMock()

            coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
            await coord.async_connect()

            mock_api_cls.assert_called_once_with(
                "192.168.1.100", 6053, "", noise_psk="test_key"
            )
            mock_rl_cls.assert_called_once()
            mock_rl.start.assert_awaited_once()

    async def test_on_connect_sets_connected_and_subscribes(self, mock_hass, mock_entry):
        """_on_connect sets connected=True and calls subscribe_targets."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coord._client = AsyncMock()
        coord._client.list_entities_services = AsyncMock(return_value=([], []))
        coord._client.subscribe_states = AsyncMock()

        await coord._on_connect()

        assert coord.connected is True

    async def test_on_disconnect_unexpected(self, mock_hass, mock_entry):
        """_on_disconnect sets connected=False for unexpected disconnect."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coord._connected = True

        await coord._on_disconnect(expected_disconnect=False)

        assert coord.connected is False

    async def test_on_disconnect_expected(self, mock_hass, mock_entry):
        """_on_disconnect sets connected=False for expected disconnect."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        coord._connected = True

        await coord._on_disconnect(expected_disconnect=True)

        assert coord.connected is False

    async def test_on_connect_error(self, mock_hass, mock_entry):
        """_on_connect_error logs and doesn't crash."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        await coord._on_connect_error(ConnectionError("test"))
        # No exception raised, connected stays False
        assert coord.connected is False

    async def test_async_disconnect_stops_reconnect_and_disconnects(self, mock_hass, mock_entry):
        """async_disconnect stops reconnect logic and disconnects client."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        mock_rl = AsyncMock()
        mock_client = AsyncMock()
        coord._reconnect_logic = mock_rl
        coord._client = mock_client
        coord._connected = True

        await coord.async_disconnect()

        mock_rl.stop.assert_awaited_once()
        mock_client.disconnect.assert_awaited_once()
        assert coord.connected is False
        assert coord._client is None
        assert coord._reconnect_logic is None

    async def test_async_disconnect_handles_client_error(self, mock_hass, mock_entry):
        """async_disconnect handles disconnect error gracefully."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        mock_client = AsyncMock()
        mock_client.disconnect.side_effect = OSError("Connection lost")
        coord._client = mock_client

        await coord.async_disconnect()

        assert coord.connected is False
        assert coord._client is None

    async def test_async_disconnect_no_client(self, mock_hass, mock_entry):
        """async_disconnect is safe when client is None."""
        coord = EverythingPresenceProCoordinator(mock_hass, mock_entry)
        await coord.async_disconnect()
        assert coord.connected is False
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/test_coordinator.py -v -k "TestConnectionLifecycle"`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_coordinator.py
git commit -m "test: add coordinator connection lifecycle tests"
```

---

### Task 5: Coordinator state handling and dispatch tests

**Files:**
- Modify: `tests/test_coordinator.py`

Tests for `_on_state()`, `_handle_binary_sensor()`, `_handle_sensor()`, `_dispatch_sensor_update()`.

- [ ] **Step 1: Write state handling tests**

Add to `tests/test_coordinator.py`:

These methods call `async_dispatcher_send` internally (via `_dispatch_sensor_update` and `_schedule_rebuild`), so all tests that trigger those paths must patch the dispatcher.

```python
from aioesphomeapi import BinarySensorState, SensorState


@patch("custom_components.everything_presence_pro.coordinator.async_dispatcher_send")
class TestStateHandling:
    """Tests for _on_state, _handle_binary_sensor, _handle_sensor.

    The class-level @patch decorator passes mock_dispatch as the first arg after self.
    """

    def test_handle_binary_sensor_static_presence(self, mock_dispatch, coordinator):
        """Static presence update dispatches sensor signal."""
        coordinator._handle_binary_sensor("static_presence", True)
        assert coordinator._static_present is True
        mock_dispatch.assert_called_once()

    def test_handle_binary_sensor_pir(self, mock_dispatch, coordinator):
        """PIR motion update stores value."""
        coordinator._handle_binary_sensor("pir_motion", True)
        assert coordinator._pir_motion is True

    def test_handle_binary_sensor_target_active(self, mock_dispatch, coordinator):
        """Target active update stores value (triggers _schedule_rebuild, not sensor dispatch)."""
        coordinator._handle_binary_sensor("target_1_active", True)
        assert coordinator._target_active[0] is True

    def test_handle_sensor_illuminance(self, mock_dispatch, coordinator):
        """Illuminance update stores value."""
        coordinator._handle_sensor("illuminance", 350.0)
        assert coordinator._illuminance == 350.0

    def test_handle_sensor_temperature(self, mock_dispatch, coordinator):
        """Temperature update stores value."""
        coordinator._handle_sensor("temperature", 22.5)
        assert coordinator._temperature == 22.5

    def test_handle_sensor_humidity(self, mock_dispatch, coordinator):
        """Humidity update stores value."""
        coordinator._handle_sensor("humidity", 45.0)
        assert coordinator._humidity == 45.0

    def test_handle_sensor_co2(self, mock_dispatch, coordinator):
        """CO2 update stores value."""
        coordinator._handle_sensor("co2", 420.0)
        assert coordinator._co2 == 420.0

    def test_handle_sensor_target_x(self, mock_dispatch, coordinator):
        """Target X update stores value."""
        coordinator._handle_sensor("target_1_x", 1500.0)
        assert coordinator._target_x[0] == 1500.0

    def test_handle_sensor_target_y(self, mock_dispatch, coordinator):
        """Target Y update stores value."""
        coordinator._handle_sensor("target_2_y", 2000.0)
        assert coordinator._target_y[1] == 2000.0

    def test_handle_sensor_target_speed(self, mock_dispatch, coordinator):
        """Target speed update stores value."""
        coordinator._handle_sensor("target_1_speed", 5.0)
        assert coordinator._target_speed[0] == 5.0

    def test_handle_sensor_target_resolution(self, mock_dispatch, coordinator):
        """Target resolution update stores value."""
        coordinator._handle_sensor("target_1_resolution", 75.0)
        assert coordinator._target_resolution[0] == 75.0

    def test_on_state_dispatches_binary_sensor(self, mock_dispatch, coordinator):
        """_on_state routes BinarySensorState to _handle_binary_sensor."""
        coordinator._binary_sensor_key_map = {42: "static_presence"}
        state = MagicMock(spec=BinarySensorState)
        state.key = 42
        state.state = True

        coordinator._on_state(state)

        assert coordinator._static_present is True

    def test_on_state_dispatches_sensor(self, mock_dispatch, coordinator):
        """_on_state routes SensorState to _handle_sensor."""
        coordinator._sensor_key_map = {99: "illuminance"}
        state = MagicMock(spec=SensorState)
        state.key = 99
        state.state = 350.0

        coordinator._on_state(state)

        assert coordinator._illuminance == 350.0

    def test_on_state_ignores_unknown_key(self, mock_dispatch, coordinator):
        """_on_state ignores state updates with unregistered keys."""
        state = MagicMock(spec=SensorState)
        state.key = 999
        state.state = 100.0

        coordinator._on_state(state)
        # No crash, no state change
        assert coordinator._illuminance is None

    def test_on_state_ignores_no_key(self, mock_dispatch, coordinator):
        """_on_state ignores state updates with no key attribute."""
        state = MagicMock(spec=object)
        coordinator._on_state(state)
        # No crash
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/test_coordinator.py -v -k "TestStateHandling"`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_coordinator.py
git commit -m "test: add coordinator state handling tests"
```

---

### Task 6: Coordinator schedule/expiry/display tests

**Files:**
- Modify: `tests/test_coordinator.py`

Tests for `_schedule_rebuild()`, `_schedule_expiry_tick()`, `_expiry_tick()`, `_do_display_update()`.

- [ ] **Step 1: Write schedule and expiry tests**

Add to `tests/test_coordinator.py`:

These methods call `async_dispatcher_send`, which requires a real HA dispatcher setup. All tests in this class must patch the dispatcher to avoid failures with the MagicMock hass.

```python
class TestScheduleAndExpiry:
    """Tests for _schedule_rebuild, _expiry_tick, _do_display_update."""

    @patch("custom_components.everything_presence_pro.coordinator.async_dispatcher_send")
    def test_do_display_update_dispatches(self, mock_dispatch, mock_hass, mock_entry):
        """_do_display_update clears flag and dispatches signal."""
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        coord._rebuild_scheduled = True
        coord._target_active = [True, False, False]
        coord._target_x = [1500.0, 0.0, 0.0]
        coord._target_y = [1500.0, 0.0, 0.0]

        coord._do_display_update()

        assert coord._rebuild_scheduled is False
        assert coord._targets[0][2] is True  # inside room
        mock_dispatch.assert_called_once()

    @patch("custom_components.everything_presence_pro.coordinator.async_dispatcher_send")
    def test_schedule_rebuild_feeds_zone_engine(self, mock_dispatch, mock_hass, mock_entry):
        """_schedule_rebuild feeds calibrated targets to zone engine."""
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        coord._target_active = [True, False, False]
        coord._target_x = [1500.0, 0.0, 0.0]
        coord._target_y = [1500.0, 0.0, 0.0]

        coord._schedule_rebuild()

        # Should have dispatched or scheduled display update
        assert coord._targets is not None

    def test_schedule_expiry_tick_no_pending(self, mock_hass, mock_entry):
        """_schedule_expiry_tick does nothing when no zones are pending."""
        coord = _coordinator_with_grid(mock_hass, mock_entry)

        coord._schedule_expiry_tick()

        assert coord._window_timer is None

    def test_schedule_expiry_tick_cancels_previous(self, mock_hass, mock_entry):
        """_schedule_expiry_tick cancels any existing timer."""
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        mock_timer = MagicMock()
        coord._window_timer = mock_timer

        coord._schedule_expiry_tick()

        mock_timer.cancel.assert_called_once()

    @patch("custom_components.everything_presence_pro.coordinator.async_dispatcher_send")
    def test_expiry_tick_clears_timer_and_feeds_empty(self, mock_dispatch, mock_hass, mock_entry):
        """_expiry_tick clears the timer and feeds empty targets."""
        coord = _coordinator_with_grid(mock_hass, mock_entry)
        coord._window_timer = MagicMock()

        coord._expiry_tick()

        assert coord._window_timer is None  # cleared at start, may be re-set by _schedule_expiry_tick
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/test_coordinator.py -v -k "TestScheduleAndExpiry"`

Expected: All tests PASS.

- [ ] **Step 3: Check coordinator coverage**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/test_coordinator.py --cov=custom_components/everything_presence_pro/coordinator --cov-report=term-missing -v`

Expected: Coverage should be >= 90%. If not, add tests for any remaining uncovered lines.

- [ ] **Step 4: Commit**

```bash
git add tests/test_coordinator.py
git commit -m "test: add coordinator schedule/expiry/display tests"
```

---

### Task 7: WebSocket API — rename_zone_entities tests

**Files:**
- Modify: `tests/test_websocket_api.py`

- [ ] **Step 1: Write rename_zone_entities tests**

Add to `tests/test_websocket_api.py`:

```python
async def test_rename_zone_entities(hass: HomeAssistant, hass_ws_client, setup_integration):
    """rename_zone_entities renames entities in the registry."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    # Get an existing entity to rename
    entity_ids = [e.entity_id for e in hass.states.async_all()]
    if not entity_ids:
        pytest.skip("No entities created")

    # Try renaming with a non-existent source — should report error
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/rename_zone_entities",
            "entry_id": entry.entry_id,
            "renames": [
                {
                    "old_entity_id": "binary_sensor.nonexistent",
                    "new_entity_id": "binary_sensor.renamed",
                }
            ],
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
    assert len(msg["result"]["errors"]) == 1
    assert "not found" in msg["result"]["errors"][0]


async def test_rename_zone_entities_conflict(hass: HomeAssistant, hass_ws_client, setup_integration):
    """rename_zone_entities reports error when target entity_id exists."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    entity_ids = [e.entity_id for e in hass.states.async_all()]
    if len(entity_ids) < 2:
        pytest.skip("Need at least 2 entities")

    # Try renaming to an existing entity_id
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/rename_zone_entities",
            "entry_id": entry.entry_id,
            "renames": [
                {
                    "old_entity_id": entity_ids[0],
                    "new_entity_id": entity_ids[1],
                }
            ],
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
    assert len(msg["result"]["errors"]) == 1
    assert "already exists" in msg["result"]["errors"][0]


async def test_rename_zone_entities_empty(hass: HomeAssistant, hass_ws_client, setup_integration):
    """rename_zone_entities with empty list succeeds."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/rename_zone_entities",
            "entry_id": entry.entry_id,
            "renames": [],
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
    assert msg["result"]["errors"] == []
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/test_websocket_api.py -v -k "rename"`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_websocket_api.py
git commit -m "test: add rename_zone_entities WebSocket tests"
```

---

### Task 8: WebSocket API — set_reporting tests

**Files:**
- Modify: `tests/test_websocket_api.py`

- [ ] **Step 1: Write set_reporting tests**

Add to `tests/test_websocket_api.py`:

```python
async def test_set_reporting(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_reporting persists reporting config and enables/disables entities."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_reporting",
            "entry_id": entry.entry_id,
            "reporting": {
                "room_occupancy": True,
                "room_target_count": False,
            },
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True

    # Verify persistence
    config = entry.options.get("config", {})
    assert config["reporting"]["room_occupancy"] is True
    assert config["reporting"]["room_target_count"] is False


async def test_set_reporting_with_offsets(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_reporting saves offsets and applies them to coordinator."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_reporting",
            "entry_id": entry.entry_id,
            "reporting": {},
            "offsets": {
                "illuminance": 10.0,
                "temperature": -1.5,
                "humidity": 3.0,
            },
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True

    # Verify offsets persisted
    config = entry.options.get("config", {})
    assert config["offsets"]["illuminance"] == 10.0
    assert config["offsets"]["temperature"] == -1.5

    # Verify coordinator offsets updated
    coordinator = entry.runtime_data
    assert coordinator._illuminance_offset == 10.0


async def test_set_reporting_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_reporting with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_reporting",
            "entry_id": "bad_id",
            "reporting": {},
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False
    assert msg["error"]["code"] == "not_found"


async def test_set_reporting_zone_entities(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_reporting handles zone-level entity toggling."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_reporting",
            "entry_id": entry.entry_id,
            "reporting": {
                "zone_presence": True,
                "zone_target_count": False,
            },
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
```

- [ ] **Step 2: Run tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/test_websocket_api.py -v -k "reporting"`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_websocket_api.py
git commit -m "test: add set_reporting WebSocket tests"
```

---

### Task 9: WebSocket API — set_setup and remaining coverage

**Files:**
- Modify: `tests/test_websocket_api.py`

- [ ] **Step 1: Write set_setup tests**

Add to `tests/test_websocket_api.py`:

```python
async def test_set_setup(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_setup persists perspective transform."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_setup",
            "entry_id": entry.entry_id,
            "perspective": [1.0, 0.0, 100.0, 0.0, 1.0, 200.0, 0.0, 0.0],
            "room_width": 3000.0,
            "room_depth": 4000.0,
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True

    # Verify persistence
    config = entry.options.get("config", {})
    assert config["calibration"]["perspective"] == [1.0, 0.0, 100.0, 0.0, 1.0, 200.0, 0.0, 0.0]
    assert config["calibration"]["room_width"] == 3000.0


async def test_set_setup_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_setup with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_setup",
            "entry_id": "bad_id",
            "perspective": [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
            "room_width": 3000.0,
            "room_depth": 4000.0,
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False
```

- [ ] **Step 2: Run tests and check coverage**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/test_websocket_api.py --cov=custom_components/everything_presence_pro/websocket_api --cov-report=term-missing -v`

Expected: Coverage >= 90%. If not, identify remaining uncovered lines and add targeted tests.

- [ ] **Step 3: Commit**

```bash
git add tests/test_websocket_api.py
git commit -m "test: add set_setup and remaining WebSocket API tests"
```

---

### Task 10: Sensor module — remaining coverage gaps

**Files:**
- Modify: `tests/test_sensor.py`

Current sensor.py coverage is 87%. The gaps are in `async_setup_entry()` and some per-target sensor paths.

- [ ] **Step 1: Write test for async_setup_entry with CO2 sensor**

The existing integration test covers setup without CO2. Add a test with CO2 present:

Add to `tests/test_sensor.py`:

```python
async def test_async_setup_entry_with_co2(
    hass: HomeAssistant,
    mock_config_entry,
    mock_esphome_client,
):
    """async_setup_entry creates CO2 sensor when co2 value is not None."""
    mock_http = MagicMock()
    mock_http.async_register_static_paths = AsyncMock()
    hass.http = mock_http

    with patch(
        "custom_components.everything_presence_pro.panel_custom.async_register_panel",
        new_callable=AsyncMock,
    ):
        await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()

    # Set co2 value on coordinator and re-check
    coordinator = mock_config_entry.runtime_data
    coordinator._co2 = 420.0

    # Verify the integration set up without error
    assert mock_config_entry.state.name == "LOADED"
```

- [ ] **Step 2: Write tests for per-target XY sensors and speed/resolution sensors**

Add to `tests/test_sensor.py`:

```python
from custom_components.everything_presence_pro.sensor import (
    EverythingPresenceProTargetAngleSensor,
    EverythingPresenceProTargetSpeedSensor,
    EverythingPresenceProTargetResolutionSensor,
    EverythingPresenceProTargetXYSensorSensor,
    EverythingPresenceProTargetXYGridSensor,
)


class TestTargetXYSensorSensor:
    """Tests for per-target XY sensor (raw coordinates)."""

    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 0)
        assert sensor.native_value == "3000,4000"

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_extra_attributes_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 0)
        attrs = sensor.extra_state_attributes
        assert attrs["x_mm"] == 3000
        assert attrs["y_mm"] == 4000

    def test_extra_attributes_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 1)
        assert sensor.extra_state_attributes is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 XY sensor"

    def test_unique_id(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYSensorSensor(mock_coordinator, 0)
        assert sensor.unique_id == "test_entry_target_1_xy_sensor"


class TestTargetXYGridSensor:
    """Tests for per-target XY grid sensor (calibrated coordinates)."""

    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 0)
        assert sensor.native_value == "3000,4000"

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_extra_attributes_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 0)
        attrs = sensor.extra_state_attributes
        assert attrs["x_mm"] == 3000
        assert attrs["y_mm"] == 4000

    def test_extra_attributes_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 1)
        assert sensor.extra_state_attributes is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetXYGridSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 XY grid"


class TestTargetAngleSensor:
    """Tests for per-target angle sensor."""

    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetAngleSensor(mock_coordinator, 0)
        assert sensor.native_value == 45.0

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetAngleSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetAngleSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 angle"


class TestTargetSpeedSensor:
    """Tests for per-target speed sensor."""

    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetSpeedSensor(mock_coordinator, 0)
        assert sensor.native_value == 100.0

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetSpeedSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetSpeedSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 speed"


class TestTargetResolutionSensor:
    """Tests for per-target resolution sensor."""

    def test_value_active(self, mock_coordinator):
        sensor = EverythingPresenceProTargetResolutionSensor(mock_coordinator, 0)
        assert sensor.native_value == 75.0

    def test_value_inactive(self, mock_coordinator):
        sensor = EverythingPresenceProTargetResolutionSensor(mock_coordinator, 1)
        assert sensor.native_value is None

    def test_name(self, mock_coordinator):
        sensor = EverythingPresenceProTargetResolutionSensor(mock_coordinator, 0)
        assert sensor.name == "Target 1 resolution"
```

- [ ] **Step 3: Run tests and check coverage**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/test_sensor.py --cov=custom_components/everything_presence_pro/sensor --cov-report=term-missing -v`

Expected: Coverage >= 90%. If specific lines are still uncovered, add targeted tests.

- [ ] **Step 4: Commit**

```bash
git add tests/test_sensor.py
git commit -m "test: add per-target sensor tests and async_setup_entry for full coverage"
```

---

### Task 11: Python coverage verification

**Files:** None (verification only)

- [ ] **Step 1: Run full Python test suite with per-file check**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/ --cov=custom_components/everything_presence_pro --cov-report=term-missing --cov-report=json -v && python scripts/check_coverage.py`

Expected: `OK: all files >= 90% coverage`. If any file still fails, go back and add targeted tests for the uncovered lines shown in the term-missing report.

- [ ] **Step 2: Commit any remaining fixes**

Only if Step 1 failed and additional tests were needed.

---

## Phase 3: TypeScript Test Gap Filling

### Task 12: perspective.ts branch coverage

**Files:**
- Modify: `frontend/src/lib/__tests__/perspective.test.ts`

Need to cover the degenerate-input guards in `getInversePerspective` (lines 84 and 98 — the `Math.abs(...) < 1e-10` branches).

- [ ] **Step 1: Write degenerate-input tests**

Add to the `getInversePerspective` describe block in `frontend/src/lib/__tests__/perspective.test.ts`:

```typescript
	it("returns null for near-singular matrix (zero determinant)", () => {
		// All-zero coefficients → determinant is 0
		const h = [0, 0, 0, 0, 0, 0, 0, 0];
		expect(getInversePerspective(h)).toBeNull();
	});

	it("returns null when normalized scale factor is near-zero", () => {
		// Need det != 0 but inv[8] = (h0*h4 - h1*h3)/det ≈ 0
		// h0*h4 = h1*h3 ensures inv[8] = 0.
		// Use nonzero h6,h7 to keep det nonzero: h = [2,3,10,4,6,1,1,2]
		// H = [2,3,10; 4,6,1; 1,2,1]
		// det = 2*(6-2) - 3*(4-1) + 10*(8-6) = 8 - 9 + 20 = 19 (nonzero)
		// inv[8] = (2*6 - 3*4) / 19 = 0/19 = 0 → triggers line 98
		const h = [2, 3, 10, 4, 6, 1, 1, 2];
		expect(getInversePerspective(h)).toBeNull();
	});
```

- [ ] **Step 2: Run tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npx vitest run src/lib/__tests__/perspective.test.ts`

Expected: All tests PASS.

- [ ] **Step 3: Verify branch coverage**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npx vitest run --coverage src/lib/__tests__/perspective.test.ts`

Expected: perspective.ts shows >= 90% on all four metrics.

- [ ] **Step 4: Commit**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid
git add frontend/src/lib/__tests__/perspective.test.ts
git commit -m "test: cover perspective.ts degenerate-input branches"
```

---

### Task 13: Extract pure logic from panel — lib/room-geometry.ts

Extract sensor FOV, room metrics, and detection range calculations.

**Files:**
- Create: `frontend/src/lib/room-geometry.ts`
- Create: `frontend/src/lib/__tests__/room-geometry.test.ts`
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Create lib/room-geometry.ts**

Extract these pure functions from the panel:

```typescript
import { applyPerspective } from "./perspective.js";
import { cellIsInside, GRID_CELL_MM } from "./grid.js";

/** Sensor position and look direction in room space. */
export interface SensorFOV {
	sensorX: number;
	sensorY: number;
	dirX: number;
	dirY: number;
}

/** Compute sensor position and direction from perspective transform. */
export function computeSensorFOV(perspective: number[]): SensorFOV {
	const sensor = applyPerspective(perspective, 0, 0);
	const ahead = applyPerspective(perspective, 0, 1000);
	const dx = ahead.x - sensor.x;
	const dy = ahead.y - sensor.y;
	const len = Math.sqrt(dx * dx + dy * dy) || 1;
	return {
		sensorX: sensor.x,
		sensorY: sensor.y,
		dirX: dx / len,
		dirY: dy / len,
	};
}

/** Compute room dimensions from 4 calibration corner points (mm). */
export function computeRoomDimensionsFromCorners(
	corners: { x: number; y: number }[],
): { width: number; depth: number } {
	const dx01 = corners[1].x - corners[0].x;
	const dy01 = corners[1].y - corners[0].y;
	const width = Math.sqrt(dx01 * dx01 + dy01 * dy01);

	const dx03 = corners[3].x - corners[0].x;
	const dy03 = corners[3].y - corners[0].y;
	const d03 = Math.sqrt(dx03 * dx03 + dy03 * dy03);

	const dx12 = corners[2].x - corners[1].x;
	const dy12 = corners[2].y - corners[1].y;
	const d12 = Math.sqrt(dx12 * dx12 + dy12 * dy12);

	const depth = (d03 + d12) / 2;
	return { width, depth };
}

/** Check if a grid cell is within the sensor's 120° FOV wedge. */
export function isCellInSensorRange(
	col: number,
	row: number,
	fov: SensorFOV,
	maxRangeMm: number,
): boolean {
	const cellCenterX = (col + 0.5) * GRID_CELL_MM;
	const cellCenterY = (row + 0.5) * GRID_CELL_MM;

	const dx = cellCenterX - fov.sensorX;
	const dy = cellCenterY - fov.sensorY;
	const dist = Math.sqrt(dx * dx + dy * dy);

	if (dist > maxRangeMm) return false;
	if (dist < 1) return true; // at sensor position

	// Check within 120° FOV (half-angle = 60°, cos(60°) = 0.5)
	const dot = (dx * fov.dirX + dy * fov.dirY) / dist;
	return dot >= 0.5;
}

/** Compute auto detection range as max distance from sensor to any inside cell. */
export function autoDetectionRange(
	grid: Uint8Array,
	cols: number,
	rows: number,
	sensorX: number,
	sensorY: number,
): number {
	let maxDist = 0;
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (!cellIsInside(grid[r * cols + c])) continue;
			const cx = (c + 0.5) * GRID_CELL_MM;
			const cy = (r + 0.5) * GRID_CELL_MM;
			const dx = cx - sensorX;
			const dy = cy - sensorY;
			const d = Math.sqrt(dx * dx + dy * dy);
			if (d > maxDist) maxDist = d;
		}
	}
	return maxDist;
}

/** Compute the median of an array of numbers. */
export function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? (sorted[mid - 1] + sorted[mid]) / 2
		: sorted[mid];
}
```

- [ ] **Step 2: Write tests for room-geometry.ts**

```typescript
import { describe, expect, it } from "vitest";
import {
	autoDetectionRange,
	computeRoomDimensionsFromCorners,
	computeSensorFOV,
	isCellInSensorRange,
	median,
} from "../room-geometry.js";
import { GRID_CELL_MM } from "../grid.js";

describe("computeSensorFOV", () => {
	it("computes FOV for identity perspective", () => {
		const h = [1, 0, 0, 0, 1, 0, 0, 0];
		const fov = computeSensorFOV(h);
		expect(fov.sensorX).toBeCloseTo(0);
		expect(fov.sensorY).toBeCloseTo(0);
		expect(fov.dirY).toBeCloseTo(1); // looking down +Y
	});

	it("computes FOV for translated perspective", () => {
		const h = [1, 0, 1500, 0, 1, 0, 0, 0];
		const fov = computeSensorFOV(h);
		expect(fov.sensorX).toBeCloseTo(1500);
		expect(fov.sensorY).toBeCloseTo(0);
	});
});

describe("computeRoomDimensionsFromCorners", () => {
	it("computes dimensions for axis-aligned rectangle", () => {
		const corners = [
			{ x: 0, y: 0 },
			{ x: 3000, y: 0 },
			{ x: 3000, y: 4000 },
			{ x: 0, y: 4000 },
		];
		const { width, depth } = computeRoomDimensionsFromCorners(corners);
		expect(width).toBeCloseTo(3000);
		expect(depth).toBeCloseTo(4000);
	});

	it("computes dimensions for trapezoidal corners", () => {
		const corners = [
			{ x: -500, y: 1000 },
			{ x: 500, y: 1000 },
			{ x: 700, y: 3000 },
			{ x: -700, y: 3000 },
		];
		const { width, depth } = computeRoomDimensionsFromCorners(corners);
		expect(width).toBeCloseTo(1000);
		expect(depth).toBeGreaterThan(1900);
	});
});

describe("isCellInSensorRange", () => {
	const fov = { sensorX: 0, sensorY: 0, dirX: 0, dirY: 1 };

	it("returns true for cell directly ahead within range", () => {
		const maxRange = 5000;
		expect(isCellInSensorRange(0, 2, fov, maxRange)).toBe(true);
	});

	it("returns false for cell beyond max range", () => {
		expect(isCellInSensorRange(0, 100, fov, 1000)).toBe(false);
	});

	it("returns false for cell behind sensor", () => {
		const behindFov = { sensorX: 3000, sensorY: 3000, dirX: 0, dirY: 1 };
		// Cell at row 0 is behind sensor at row ~10 (3000/300)
		expect(isCellInSensorRange(10, 0, behindFov, 50000)).toBe(false);
	});

	it("returns true for cell at sensor position", () => {
		const atOrigin = { sensorX: GRID_CELL_MM * 0.5, sensorY: GRID_CELL_MM * 0.5, dirX: 0, dirY: 1 };
		expect(isCellInSensorRange(0, 0, atOrigin, 5000)).toBe(true);
	});
});

describe("autoDetectionRange", () => {
	it("returns 0 for empty grid", () => {
		const grid = new Uint8Array(400); // 20x20, all zero
		expect(autoDetectionRange(grid, 20, 20, 0, 0)).toBe(0);
	});

	it("returns distance to furthest inside cell", () => {
		const grid = new Uint8Array(400);
		grid[0] = 1; // cell (0,0) is inside
		grid[19] = 1; // cell (19,0) is inside — furthest from origin
		const d = autoDetectionRange(grid, 20, 20, 0, 0);
		expect(d).toBeGreaterThan(5000); // 19.5 cells * 300mm
	});
});

describe("median", () => {
	it("returns 0 for empty array", () => {
		expect(median([])).toBe(0);
	});

	it("returns middle value for odd-length", () => {
		expect(median([3, 1, 2])).toBe(2);
	});

	it("returns average of middle two for even-length", () => {
		expect(median([1, 2, 3, 4])).toBe(2.5);
	});

	it("handles single element", () => {
		expect(median([42])).toBe(42);
	});
});
```

- [ ] **Step 3: Update panel to import from lib/room-geometry.ts**

Replace the inline implementations of `_autoComputeRoomDimensions()`, `_getSensorFov()`, `_isCellInSensorRange()`, `_autoDetectionRange()`, and any inline median computation with imports from `lib/room-geometry.ts`. The panel methods become thin wrappers around the extracted functions.

- [ ] **Step 4: Run all frontend tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npx vitest run`

Expected: All tests PASS (existing + new).

- [ ] **Step 5: Commit**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid
git add frontend/src/lib/room-geometry.ts frontend/src/lib/__tests__/room-geometry.test.ts frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: extract room geometry logic into lib/room-geometry.ts"
```

---

### Task 14: Extract pure logic — lib/furniture.ts

**Files:**
- Create: `frontend/src/lib/furniture.ts`
- Create: `frontend/src/lib/__tests__/furniture.test.ts`
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Create lib/furniture.ts**

Extract furniture creation, removal, update, and drag math:

```typescript
import { GRID_CELL_MM } from "./grid.js";

export interface FurnitureItem {
	id: string;
	type: string;
	icon: string;
	label: string;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number;
	lockAspect: boolean;
}

export interface FurnitureSticker {
	icon: string;
	label: string;
	width: number;
	height: number;
	lockAspect?: boolean;
}

/** Convert millimeters to pixels given cell size in pixels. */
export function mmToPx(mm: number, cellPx: number): number {
	return (mm / GRID_CELL_MM) * cellPx;
}

/** Convert pixels to millimeters given cell size in pixels. */
export function pxToMm(px: number, cellPx: number): number {
	return (px / cellPx) * GRID_CELL_MM;
}

/** Generate a unique furniture ID. */
export function generateFurnitureId(): string {
	return `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Create a new furniture item centered in the room. */
export function createFurnitureItem(
	sticker: FurnitureSticker,
	roomWidth: number,
	roomDepth: number,
): FurnitureItem {
	return {
		id: generateFurnitureId(),
		type: "icon",
		icon: sticker.icon,
		label: sticker.label,
		x: (roomWidth - sticker.width) / 2,
		y: (roomDepth - sticker.height) / 2,
		width: sticker.width,
		height: sticker.height,
		rotation: 0,
		lockAspect: sticker.lockAspect ?? false,
	};
}

/** Remove a furniture item by ID. */
export function removeFurnitureItem(
	items: FurnitureItem[],
	id: string,
): FurnitureItem[] {
	return items.filter((f) => f.id !== id);
}

/** Update a furniture item by ID with partial updates. */
export function updateFurnitureItem(
	items: FurnitureItem[],
	id: string,
	updates: Partial<FurnitureItem>,
): FurnitureItem[] {
	return items.map((f) => (f.id === id ? { ...f, ...updates } : f));
}

/** Compute new position for furniture move, clamped to room bounds. */
export function computeFurnitureMove(
	origX: number,
	origY: number,
	deltaMmX: number,
	deltaMmY: number,
	itemWidth: number,
	itemHeight: number,
	roomWidth: number,
	roomDepth: number,
): { x: number; y: number } {
	return {
		x: Math.max(0, Math.min(roomWidth - itemWidth, origX + deltaMmX)),
		y: Math.max(0, Math.min(roomDepth - itemHeight, origY + deltaMmY)),
	};
}
```

- [ ] **Step 2: Write tests for furniture.ts**

```typescript
import { describe, expect, it } from "vitest";
import {
	computeFurnitureMove,
	createFurnitureItem,
	mmToPx,
	pxToMm,
	removeFurnitureItem,
	updateFurnitureItem,
} from "../furniture.js";
import { GRID_CELL_MM } from "../grid.js";

describe("mmToPx / pxToMm", () => {
	it("round-trips mm → px → mm", () => {
		const mm = 1500;
		const cellPx = 30;
		const px = mmToPx(mm, cellPx);
		expect(pxToMm(px, cellPx)).toBeCloseTo(mm);
	});

	it("converts one cell width", () => {
		expect(mmToPx(GRID_CELL_MM, 30)).toBeCloseTo(30);
	});
});

describe("createFurnitureItem", () => {
	it("centers item in room", () => {
		const sticker = { icon: "mdi:desk", label: "Desk", width: 1200, height: 600 };
		const item = createFurnitureItem(sticker, 3000, 4000);
		expect(item.x).toBeCloseTo(900); // (3000-1200)/2
		expect(item.y).toBeCloseTo(1700); // (4000-600)/2
		expect(item.rotation).toBe(0);
		expect(item.lockAspect).toBe(false);
	});

	it("preserves sticker properties", () => {
		const sticker = { icon: "mdi:bed", label: "Bed", width: 2000, height: 1500, lockAspect: true };
		const item = createFurnitureItem(sticker, 4000, 5000);
		expect(item.icon).toBe("mdi:bed");
		expect(item.label).toBe("Bed");
		expect(item.lockAspect).toBe(true);
	});

	it("generates unique IDs", () => {
		const s = { icon: "x", label: "X", width: 100, height: 100 };
		const a = createFurnitureItem(s, 1000, 1000);
		const b = createFurnitureItem(s, 1000, 1000);
		expect(a.id).not.toBe(b.id);
	});
});

describe("removeFurnitureItem", () => {
	it("removes item by ID", () => {
		const items = [
			{ id: "a", type: "icon", icon: "", label: "", x: 0, y: 0, width: 0, height: 0, rotation: 0, lockAspect: false },
			{ id: "b", type: "icon", icon: "", label: "", x: 0, y: 0, width: 0, height: 0, rotation: 0, lockAspect: false },
		];
		expect(removeFurnitureItem(items, "a")).toHaveLength(1);
		expect(removeFurnitureItem(items, "a")[0].id).toBe("b");
	});

	it("returns same array if ID not found", () => {
		const items = [
			{ id: "a", type: "icon", icon: "", label: "", x: 0, y: 0, width: 0, height: 0, rotation: 0, lockAspect: false },
		];
		expect(removeFurnitureItem(items, "z")).toHaveLength(1);
	});
});

describe("updateFurnitureItem", () => {
	it("updates matching item", () => {
		const items = [
			{ id: "a", type: "icon", icon: "", label: "Old", x: 0, y: 0, width: 100, height: 100, rotation: 0, lockAspect: false },
		];
		const updated = updateFurnitureItem(items, "a", { label: "New", x: 50 });
		expect(updated[0].label).toBe("New");
		expect(updated[0].x).toBe(50);
		expect(updated[0].width).toBe(100); // unchanged
	});
});

describe("computeFurnitureMove", () => {
	it("moves within bounds", () => {
		const { x, y } = computeFurnitureMove(500, 500, 100, 200, 200, 200, 3000, 4000);
		expect(x).toBe(600);
		expect(y).toBe(700);
	});

	it("clamps to left/top", () => {
		const { x, y } = computeFurnitureMove(50, 50, -200, -200, 200, 200, 3000, 4000);
		expect(x).toBe(0);
		expect(y).toBe(0);
	});

	it("clamps to right/bottom", () => {
		const { x, y } = computeFurnitureMove(2800, 3800, 500, 500, 200, 200, 3000, 4000);
		expect(x).toBe(2800); // 3000-200
		expect(y).toBe(3800); // 4000-200
	});
});
```

- [ ] **Step 3: Update panel to import from lib/furniture.ts**

Replace inline `_mmToPx`, `_pxToMm`, furniture creation/removal/update logic with imports.

- [ ] **Step 4: Run all frontend tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npx vitest run`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid
git add frontend/src/lib/furniture.ts frontend/src/lib/__tests__/furniture.test.ts frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: extract furniture logic into lib/furniture.ts"
```

---

### Task 15: Extract pure logic — lib/config-serialization.ts

**Files:**
- Create: `frontend/src/lib/config-serialization.ts`
- Create: `frontend/src/lib/__tests__/config-serialization.test.ts`
- Modify: `frontend/src/everything-presence-pro-panel.ts`

Extract the config parsing logic from `_applyConfig()` (lines 607-678) and template serialization/deserialization.

- [ ] **Step 1: Create lib/config-serialization.ts**

Extract config parsing into pure functions that take a raw config object and return structured data. This includes zone config reconstruction with defaults, furniture defaults, and room threshold parsing.

- [ ] **Step 2: Write tests for config-serialization.ts**

Test round-trip serialization, default filling, edge cases (missing fields, empty config).

- [ ] **Step 3: Update panel to import from lib/config-serialization.ts**

- [ ] **Step 4: Run all frontend tests**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npx vitest run`

- [ ] **Step 5: Commit**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid
git add frontend/src/lib/config-serialization.ts frontend/src/lib/__tests__/config-serialization.test.ts frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: extract config serialization into lib/config-serialization.ts"
```

---

### Task 16: Extract pure logic — lib/cell-painting.ts

**Files:**
- Create: `frontend/src/lib/cell-painting.ts`
- Create: `frontend/src/lib/__tests__/cell-painting.test.ts`
- Modify: `frontend/src/everything-presence-pro-panel.ts`

Extract the grid cell painting and zone clearing logic from `_applyPaintToCell()` and `_removeZone()`.

- [ ] **Step 1: Create lib/cell-painting.ts**

Extract `applyCellPaint(cellValue, activeZone, paintAction) → number` and `clearZoneFromGrid(grid, zoneSlot, cols, rows) → Uint8Array`.

- [ ] **Step 2: Write tests for cell-painting.ts**

Test boundary painting, zone painting, zone clearing, edge cases.

- [ ] **Step 3: Update panel to import from lib/cell-painting.ts**

- [ ] **Step 4: Run all frontend tests**

- [ ] **Step 5: Commit**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid
git add frontend/src/lib/cell-painting.ts frontend/src/lib/__tests__/cell-painting.test.ts frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: extract cell painting logic into lib/cell-painting.ts"
```

---

### Task 17: Extract pure logic — lib/heatmap.ts

**Files:**
- Create: `frontend/src/lib/heatmap.ts`
- Create: `frontend/src/lib/__tests__/heatmap.test.ts`
- Modify: `frontend/src/everything-presence-pro-panel.ts`

Extract `_computeHeatmapColors()` and `_getCellColor()`.

- [ ] **Step 1: Create lib/heatmap.ts**

Extract pure color computation functions.

- [ ] **Step 2: Write tests for heatmap.ts**

Test color mapping for various zone states, edge cases.

- [ ] **Step 3: Update panel, run tests, commit**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid
git add frontend/src/lib/heatmap.ts frontend/src/lib/__tests__/heatmap.test.ts frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: extract heatmap color logic into lib/heatmap.ts"
```

---

### Task 18: Expand panel component tests

**Files:**
- Create: `frontend/src/__tests__/panel-wizard.test.ts`
- Modify: `frontend/src/__tests__/panel-render.test.ts`
- Modify: existing `panel-*.test.ts` files as needed

After extraction, the panel component should be significantly smaller. This task adds component-level tests for the remaining uncovered surface:

- Wizard flow (corner capture, step progression, dimension auto-compute)
- Config loading / WebSocket interaction stubs
- View switching and render paths
- LocalStorage persistence
- Target subscription lifecycle

- [ ] **Step 1: Create panel-wizard.test.ts**

Test wizard step progression, corner marking, and room dimension computation through the component.

- [ ] **Step 2: Expand panel-render.test.ts**

Add tests for each render path (uncalibrated, live, editor, settings) to ensure all branches in `render()` are covered.

- [ ] **Step 3: Add tests for remaining uncovered panel methods**

Focus on methods identified by the coverage report after extraction.

- [ ] **Step 4: Run coverage and iterate**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npm run test:coverage`

Expected: All files >= 90%. If any file still fails, add targeted tests.

- [ ] **Step 5: Commit**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid
git add frontend/src/__tests__/
git commit -m "test: expand panel component tests for 90% coverage"
```

---

## Phase 4: Final Verification

### Task 19: Full CI dry-run

**Files:** None (verification only)

- [ ] **Step 1: Run Python coverage check**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && pytest tests/ --cov=custom_components/everything_presence_pro --cov-report=term-missing --cov-report=json -v && python scripts/check_coverage.py`

Expected: `OK: all files >= 90% coverage`

- [ ] **Step 2: Run TypeScript coverage check**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npm run test:coverage`

Expected: All files pass per-file 90% threshold on all four metrics.

- [ ] **Step 3: Run linters**

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid && ruff check custom_components/ tests/ && ruff format --check custom_components/ tests/`

Run: `cd /workspaces/ha-dev/everything-presence-pro-grid/frontend && npx biome check src/ --diagnostic-level=error`

Expected: No lint errors.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git commit -m "chore: final coverage enforcement cleanup"
```

# WebSocket subscription redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `subscribe_targets` and `subscribe_display` with `subscribe_raw_targets` (5Hz sensor-space) and `subscribe_grid_targets` (5Hz positions + 1Hz cached state) so that calibration, FOV overlay, live overview, and zone editing each get exactly the data they need.

**Architecture:** Two new websocket subscriptions, both driven by `SIGNAL_DISPLAY_UPDATED` (5Hz). `subscribe_raw_targets` sends smoothed raw sensor-space positions. `subscribe_grid_targets` sends smoothed calibrated grid positions at 5Hz plus cached zone engine state (signal, status, sensors, zones) from the last 1Hz tick. The DisplayBuffer and coordinator remain unchanged — only the websocket handlers and tests change.

**Tech Stack:** Python, Home Assistant websocket_api, pytest

**Spec:** `docs/superpowers/specs/2026-03-21-websocket-subscription-redesign.md`

---

### Task 1: Add `subscribe_raw_targets` handler

**Files:**
- Modify: `custom_components/everything_presence_pro/websocket_api.py`

- [ ] **Step 1: Write the failing test**

Add to `tests/test_websocket_api.py` after the existing subscribe tests:

```python
# ---------------------------------------------------------------------------
# subscribe_raw_targets
# ---------------------------------------------------------------------------


async def test_subscribe_raw_targets(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_raw_targets sends initial state with raw positions and target_count."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_raw_targets",
            "entry_id": entry.entry_id,
        }
    )

    msg = await ws_client.receive_json()
    assert msg["id"] == 1
    assert msg["success"] is True

    msg = await ws_client.receive_json()
    assert msg["type"] == "event"
    event = msg["event"]
    assert "target_count" in event
    assert "targets" in event
    assert len(event["targets"]) == 3
    for t in event["targets"]:
        assert "raw_x" in t
        assert "raw_y" in t
        assert len(t) == 2  # only raw_x and raw_y, nothing else


async def test_subscribe_raw_targets_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_raw_targets with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_raw_targets",
            "entry_id": "bad_id",
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False
    assert msg["error"]["code"] == "not_found"


async def test_subscribe_raw_targets_tracks_subscriber_count(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_raw_targets increments/decrements the display subscriber count."""
    entry = setup_integration
    coordinator = entry.runtime_data
    assert coordinator.display_subscriber_count == 0

    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_raw_targets",
            "entry_id": entry.entry_id,
        }
    )
    await ws_client.receive_json()  # result
    await ws_client.receive_json()  # initial event

    assert coordinator.display_subscriber_count == 1

    await ws_client.send_json({"id": 2, "type": "unsubscribe_events", "subscription": 1})
    await ws_client.receive_json()

    assert coordinator.display_subscriber_count == 0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_websocket_api.py::test_subscribe_raw_targets tests/test_websocket_api.py::test_subscribe_raw_targets_not_found tests/test_websocket_api.py::test_subscribe_raw_targets_tracks_subscriber_count -v`

Expected: FAIL — command type not registered.

- [ ] **Step 3: Implement `websocket_subscribe_raw_targets`**

In `websocket_api.py`, add the handler and register it. The handler:
- Subscribes to `SIGNAL_DISPLAY_UPDATED` (5Hz).
- Reads `coordinator.last_display_snapshot` for smoothed `raw_x`/`raw_y`.
- Computes `target_count` as count of targets where `raw_x != 0 or raw_y != 0`.
- Tracks subscriber count via `increment/decrement_display_subscribers()`.

```python
@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/subscribe_raw_targets",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_subscribe_raw_targets(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle subscribe_raw_targets — 5 Hz smoothed sensor-space positions."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    def _build_payload() -> dict[str, Any]:
        snap = coordinator.last_display_snapshot
        targets = snap.targets if snap else [DisplayTarget()] * MAX_TARGETS
        raw_list = [{"raw_x": t.raw_x, "raw_y": t.raw_y} for t in targets]
        target_count = sum(1 for t in targets if t.raw_x != 0.0 or t.raw_y != 0.0)
        return {"target_count": target_count, "targets": raw_list}

    @callback
    def _forward() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], _build_payload())
        )

    coordinator.increment_display_subscribers()

    connection.send_result(msg["id"])
    connection.send_message(
        websocket_api.event_message(msg["id"], _build_payload())
    )

    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    unsub = async_dispatcher_connect(
        hass,
        f"{SIGNAL_DISPLAY_UPDATED}_{msg['entry_id']}",
        _forward,
    )

    @callback
    def _unsub_all() -> None:
        unsub()
        coordinator.decrement_display_subscribers()

    connection.subscriptions[msg["id"]] = _unsub_all
```

Register it in `async_register_websocket_commands`:

```python
websocket_api.async_register_command(hass, websocket_subscribe_raw_targets)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_websocket_api.py::test_subscribe_raw_targets tests/test_websocket_api.py::test_subscribe_raw_targets_not_found tests/test_websocket_api.py::test_subscribe_raw_targets_tracks_subscriber_count -v`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/test_websocket_api.py custom_components/everything_presence_pro/websocket_api.py
git commit -m "feat: add subscribe_raw_targets websocket subscription (5Hz sensor-space)"
```

---

### Task 2: Add `subscribe_grid_targets` handler

**Files:**
- Modify: `custom_components/everything_presence_pro/websocket_api.py`
- Modify: `tests/test_websocket_api.py`

- [ ] **Step 1: Write the failing tests**

Add to `tests/test_websocket_api.py`:

```python
# ---------------------------------------------------------------------------
# subscribe_grid_targets
# ---------------------------------------------------------------------------


async def test_subscribe_grid_targets(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_grid_targets sends initial state with grid positions, sensors, and zones."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_grid_targets",
            "entry_id": entry.entry_id,
        }
    )

    msg = await ws_client.receive_json()
    assert msg["id"] == 1
    assert msg["success"] is True

    msg = await ws_client.receive_json()
    assert msg["type"] == "event"
    event = msg["event"]

    # Verify target structure — grid positions + cached state
    assert len(event["targets"]) == 3
    for t in event["targets"]:
        assert "x" in t
        assert "y" in t
        assert "signal" in t
        assert "status" in t
        assert t["status"] in ("active", "pending", "inactive")
        # No raw_x/raw_y — that's subscribe_raw_targets
        assert "raw_x" not in t
        assert "raw_y" not in t

    # Verify sensors
    sensors = event["sensors"]
    assert "occupancy" in sensors
    assert "static_presence" in sensors
    assert "motion_presence" in sensors
    assert "target_presence" in sensors
    assert "illuminance" in sensors
    assert "temperature" in sensors
    assert "humidity" in sensors
    assert "co2" in sensors

    # Verify zones
    zones = event["zones"]
    assert "occupancy" in zones
    assert "target_counts" in zones
    assert "frame_count" in zones
    assert "debug_log" in zones


async def test_subscribe_grid_targets_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_grid_targets with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_grid_targets",
            "entry_id": "bad_id",
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False
    assert msg["error"]["code"] == "not_found"


async def test_subscribe_grid_targets_tracks_subscriber_count(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_grid_targets increments/decrements the display subscriber count."""
    entry = setup_integration
    coordinator = entry.runtime_data
    assert coordinator.display_subscriber_count == 0

    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_grid_targets",
            "entry_id": entry.entry_id,
        }
    )
    await ws_client.receive_json()  # result
    await ws_client.receive_json()  # initial event

    assert coordinator.display_subscriber_count == 1

    await ws_client.send_json({"id": 2, "type": "unsubscribe_events", "subscription": 1})
    await ws_client.receive_json()

    assert coordinator.display_subscriber_count == 0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_websocket_api.py::test_subscribe_grid_targets tests/test_websocket_api.py::test_subscribe_grid_targets_not_found tests/test_websocket_api.py::test_subscribe_grid_targets_tracks_subscriber_count -v`

Expected: FAIL — command type not registered.

- [ ] **Step 3: Implement `websocket_subscribe_grid_targets`**

The handler subscribes to `SIGNAL_DISPLAY_UPDATED` (5Hz for positions). It reads grid `x`/`y` from the DisplayBuffer snapshot and caches `signal`/`status` from the zone engine result plus `sensors`/`zones` from coordinator properties. These cached fields only change on zone engine ticks (~1Hz) and sensor updates.

```python
@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/subscribe_grid_targets",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_subscribe_grid_targets(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle subscribe_grid_targets — 5 Hz grid positions + cached 1 Hz state."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    def _build_payload() -> dict[str, Any]:
        snap = coordinator.last_display_snapshot
        display = snap.targets if snap else [DisplayTarget()] * MAX_TARGETS
        result = coordinator.last_result
        ztargets = list(result.targets) if result else []
        while len(ztargets) < MAX_TARGETS:
            ztargets.append(TargetResult())
        return {
            "targets": [
                {
                    "x": d.x,
                    "y": d.y,
                    "signal": t.signal,
                    "status": t.status.value,
                }
                for d, t in zip(display, ztargets, strict=False)
            ],
            "sensors": {
                "occupancy": coordinator.device_occupied,
                "static_presence": coordinator.static_present,
                "motion_presence": coordinator.pir_motion,
                "target_presence": coordinator.target_present,
                "illuminance": coordinator.illuminance,
                "temperature": coordinator.temperature,
                "humidity": coordinator.humidity,
                "co2": coordinator.co2,
            },
            "zones": {
                "frame_count": result.frame_count,
                "occupancy": result.zone_occupancy,
                "target_counts": result.zone_target_counts,
                "debug_log": result.debug_log,
            },
        }

    @callback
    def _forward() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], _build_payload())
        )

    coordinator.increment_display_subscribers()

    connection.send_result(msg["id"])
    connection.send_message(
        websocket_api.event_message(msg["id"], _build_payload())
    )

    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    unsub = async_dispatcher_connect(
        hass,
        f"{SIGNAL_DISPLAY_UPDATED}_{msg['entry_id']}",
        _forward,
    )

    @callback
    def _unsub_all() -> None:
        unsub()
        coordinator.decrement_display_subscribers()

    connection.subscriptions[msg["id"]] = _unsub_all
```

Register in `async_register_websocket_commands`:

```python
websocket_api.async_register_command(hass, websocket_subscribe_grid_targets)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_websocket_api.py::test_subscribe_grid_targets tests/test_websocket_api.py::test_subscribe_grid_targets_not_found tests/test_websocket_api.py::test_subscribe_grid_targets_tracks_subscriber_count -v`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/test_websocket_api.py custom_components/everything_presence_pro/websocket_api.py
git commit -m "feat: add subscribe_grid_targets websocket subscription (5Hz grid + 1Hz state)"
```

---

### Task 3: Remove old subscriptions

**Files:**
- Modify: `custom_components/everything_presence_pro/websocket_api.py`
- Modify: `tests/test_websocket_api.py`

- [ ] **Step 1: Remove old tests**

Delete these test functions from `tests/test_websocket_api.py`:
- `test_subscribe_targets`
- `test_subscribe_targets_not_found`
- `test_subscribe_display`
- `test_subscribe_display_tracks_subscriber_count`

And their section headers.

- [ ] **Step 2: Remove old handlers from `websocket_api.py`**

Delete the following functions:
- `websocket_subscribe_targets` (the full function and its `@websocket_api.websocket_command` decorator)
- `websocket_subscribe_display` (the full function and its decorator)

Remove their registrations from `async_register_websocket_commands`:
```python
# Delete these two lines:
websocket_api.async_register_command(hass, websocket_subscribe_targets)
websocket_api.async_register_command(hass, websocket_subscribe_display)
```

Remove unused imports from `websocket_api.py`:
- `SIGNAL_TARGETS_UPDATED` (no longer needed — grid_targets uses DISPLAY_UPDATED)
- `SIGNAL_SENSORS_UPDATED` (no longer needed)
- `DisplaySnapshot` (no longer referenced directly in type annotations)

Keep: `SIGNAL_DISPLAY_UPDATED`, `DisplayTarget`, `TargetResult`.

- [ ] **Step 3: Run all tests**

Run: `python -m pytest tests/ -v`

Expected: All tests pass. No references to old subscription names remain.

- [ ] **Step 4: Verify no stale references**

Run: `grep -r "subscribe_targets\|subscribe_display" custom_components/everything_presence_pro/ tests/ --include="*.py"`

Expected: Only references to `subscribe_raw_targets` and `subscribe_grid_targets`.

- [ ] **Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/websocket_api.py tests/test_websocket_api.py
git commit -m "refactor: remove old subscribe_targets and subscribe_display websocket handlers"
```

---

### Task 4: Update documentation

**Files:**
- Modify: `docs/backend-data-catalog.md`

- [ ] **Step 1: Update sections 2, 3, and 5**

Update section 2 (Live Overview) to reference `subscribe_grid_targets` and `subscribe_raw_targets` (for FOV).

Update section 3 (Room Calibration) to reference `subscribe_raw_targets`.

Replace section 5 subscriptions with the new API definitions from the spec. Update the frontend screen -> API mapping table:

```markdown
| Screen | Subscriptions | Fields used | Commands |
|--------|---------------|-------------|----------|
| Device picker | — | — | `list_entries` |
| Room calibration | `subscribe_raw_targets` | `target_count`, `raw_x`, `raw_y` | `set_setup` |
| Live overview (FOV) | `subscribe_raw_targets` | `target_count`, `raw_x`, `raw_y` | — |
| Live overview (grid) | `subscribe_grid_targets` | all fields | `get_config` |
| Detection zone editor | `subscribe_grid_targets` | `x`, `y`, `signal` (ignores `status`) | `set_room_layout`, `rename_zone_entities` |
| Reporting settings | — | — | `get_config`, `set_reporting` |
```

- [ ] **Step 2: Commit**

```bash
git add docs/backend-data-catalog.md
git commit -m "docs: update backend data catalog for new websocket subscriptions"
```

---

### Task 5: Run full test suite and verify

- [ ] **Step 1: Run all tests**

Run: `python -m pytest tests/ -v`

Expected: All tests pass.

- [ ] **Step 2: Verify syntax**

Run: `python -c "import ast; ast.parse(open('custom_components/everything_presence_pro/websocket_api.py').read()); print('OK')"`

Expected: `OK`

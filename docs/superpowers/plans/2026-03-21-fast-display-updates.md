# Fast Display Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Smooth target dot movement on live overview / detection zone screens by adding a 5 Hz rolling median display path, decoupled from the 1 Hz zone logic.

**Architecture:** A new `DisplayBuffer` class computes rolling medians over a sliding window of raw frames. The coordinator feeds it on each coalesced frame (debounced via `call_soon`) and fires a `SIGNAL_DISPLAY_UPDATED` signal at 5 Hz. A new `subscribe_display` websocket command delivers lightweight position-only updates. The frontend subscribes to both the existing 1 Hz stream (zone state) and the new 5 Hz stream (positions).

**Tech Stack:** Python 3.13, Home Assistant Core APIs, Lit (TypeScript), pytest, vitest

**Spec:** `docs/superpowers/specs/2026-03-21-fast-display-updates-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `custom_components/everything_presence_pro/zone_engine.py` | Add `DisplayTarget`, `DisplaySnapshot`, `DisplayBuffer` classes |
| Modify | `custom_components/everything_presence_pro/coordinator.py` | Add display buffer, coalescing, 5 Hz throttle, subscriber count |
| Modify | `custom_components/everything_presence_pro/websocket_api.py` | Add `subscribe_display` command |
| Modify | `frontend/src/everything-presence-pro-panel.ts` | Dual subscription, merge display + targets streams |
| Modify | `tests/test_zone_engine.py` | Tests for `DisplayBuffer` |
| Modify | `tests/test_coordinator.py` | Tests for display coalescing and throttle |
| Modify | `tests/test_websocket_api.py` | Tests for `subscribe_display` |
| Modify | `frontend/src/__tests__/panel-targets.test.ts` | Tests for dual subscription |

---

## Task 1: DisplayBuffer — dataclasses and class

**Files:**
- Modify: `custom_components/everything_presence_pro/zone_engine.py` (add after `TumblingWindow` class, ~line 312)
- Test: `tests/test_zone_engine.py`

### Step 1.1: Write failing test — DisplayBuffer returns snapshot on first feed

- [ ] Add test to `tests/test_zone_engine.py`:

```python
from custom_components.everything_presence_pro.zone_engine import DisplayBuffer
from custom_components.everything_presence_pro.zone_engine import DisplaySnapshot
from custom_components.everything_presence_pro.zone_engine import DisplayTarget


class TestDisplayBuffer:
    """Tests for DisplayBuffer rolling median."""

    def test_single_feed_returns_snapshot(self):
        """First feed returns a snapshot with the fed position."""
        buf = DisplayBuffer(maxlen=10)
        snap = buf.feed(
            calibrated=[(100.0, 200.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(50.0, 100.0), (0.0, 0.0), (0.0, 0.0)],
        )
        assert isinstance(snap, DisplaySnapshot)
        assert len(snap.targets) == 3
        t = snap.targets[0]
        assert t.x == 100.0
        assert t.y == 200.0
        assert t.raw_x == 50.0
        assert t.raw_y == 100.0
        assert t.active is True
        assert t.frame_count == 1
        # Inactive target
        assert snap.targets[1].active is False
```

- [ ] Run test to verify it fails:

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/faster_updates
python -m pytest tests/test_zone_engine.py::TestDisplayBuffer::test_single_feed_returns_snapshot -v
```

Expected: FAIL — `ImportError: cannot import name 'DisplayBuffer'`

### Step 1.2: Implement DisplayBuffer

- [ ] Add `from collections import deque` to `zone_engine.py` at the top, after `from statistics import median` (line 17).

- [ ] Add the following classes after the `TumblingWindow` class (after line 312), before `_ZoneRuntime`:

```python


@dataclass
class DisplayTarget:
    """A single target's display-only position data."""

    x: float = 0.0
    y: float = 0.0
    raw_x: float = 0.0
    raw_y: float = 0.0
    active: bool = False
    frame_count: int = 0


@dataclass
class DisplaySnapshot:
    """Snapshot of all targets for display purposes."""

    targets: list[DisplayTarget] = field(default_factory=list)


class DisplayBuffer:
    """Rolling median buffer for smooth display updates.

    Maintains a sliding window of recent calibrated positions per target
    and computes the median on each feed. Unlike TumblingWindow, this does
    not reset — the deque slides forward continuously.
    """

    def __init__(self, maxlen: int = 10) -> None:
        """Initialize with per-target deques."""
        self._maxlen = maxlen
        self._xs: list[deque[float]] = [deque(maxlen=maxlen) for _ in range(MAX_TARGETS)]
        self._ys: list[deque[float]] = [deque(maxlen=maxlen) for _ in range(MAX_TARGETS)]

    def feed(
        self,
        calibrated: list[tuple[float, float, bool]],
        raw: list[tuple[float, float]],
    ) -> DisplaySnapshot:
        """Feed one coalesced frame. Returns a snapshot with rolling medians."""
        targets: list[DisplayTarget] = []
        for i in range(MAX_TARGETS):
            if i < len(calibrated) and calibrated[i][2]:
                cx, cy, _ = calibrated[i]
                self._xs[i].append(cx)
                self._ys[i].append(cy)
                rx, ry = raw[i] if i < len(raw) else (0.0, 0.0)
                targets.append(
                    DisplayTarget(
                        x=median(self._xs[i]),
                        y=median(self._ys[i]),
                        raw_x=rx,
                        raw_y=ry,
                        active=True,
                        frame_count=len(self._xs[i]),
                    )
                )
            else:
                # Target inactive — clear its history
                self._xs[i].clear()
                self._ys[i].clear()
                targets.append(DisplayTarget())
        return DisplaySnapshot(targets=targets)

    def reset(self) -> None:
        """Clear all history."""
        for i in range(MAX_TARGETS):
            self._xs[i].clear()
            self._ys[i].clear()
```

Note: `median` is already imported at line 17. The `field` import is already at line 16.

- [ ] Run test to verify it passes:

```bash
python -m pytest tests/test_zone_engine.py::TestDisplayBuffer::test_single_feed_returns_snapshot -v
```

Expected: PASS

### Step 1.3: Write test — rolling median smooths noisy positions

- [ ] Add test:

```python
    def test_rolling_median_smooths(self):
        """Median over multiple feeds smooths out noise."""
        buf = DisplayBuffer(maxlen=10)
        # Feed 5 frames with a noisy outlier at frame 3
        positions = [100.0, 101.0, 100.0, 200.0, 99.0]
        for x in positions:
            snap = buf.feed(
                calibrated=[(x, 300.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
                raw=[(x, 300.0), (0.0, 0.0), (0.0, 0.0)],
            )
        # Median of [100, 101, 100, 200, 99] = 100.0
        assert snap.targets[0].x == 100.0
        assert snap.targets[0].frame_count == 5
```

- [ ] Run test to verify it passes:

```bash
python -m pytest tests/test_zone_engine.py::TestDisplayBuffer::test_rolling_median_smooths -v
```

Expected: PASS

### Step 1.4: Write test — inactive target clears deque

- [ ] Add test:

```python
    def test_inactive_clears_history(self):
        """When a target goes inactive, its deque is cleared."""
        buf = DisplayBuffer(maxlen=10)
        buf.feed(
            calibrated=[(100.0, 200.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(50.0, 100.0), (0.0, 0.0), (0.0, 0.0)],
        )
        snap = buf.feed(
            calibrated=[(0.0, 0.0, False), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(0.0, 0.0), (0.0, 0.0), (0.0, 0.0)],
        )
        assert snap.targets[0].active is False
        assert snap.targets[0].frame_count == 0
```

- [ ] Run test:

```bash
python -m pytest tests/test_zone_engine.py::TestDisplayBuffer::test_inactive_clears_history -v
```

Expected: PASS

### Step 1.5: Write test — deque maxlen caps history

- [ ] Add test:

```python
    def test_deque_maxlen(self):
        """Deque respects maxlen, old values drop off."""
        buf = DisplayBuffer(maxlen=3)
        for x in [10.0, 20.0, 30.0, 40.0, 50.0]:
            snap = buf.feed(
                calibrated=[(x, 0.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
                raw=[(x, 0.0), (0.0, 0.0), (0.0, 0.0)],
            )
        # Deque has [30, 40, 50], median = 40
        assert snap.targets[0].x == 40.0
        assert snap.targets[0].frame_count == 3
```

- [ ] Run test:

```bash
python -m pytest tests/test_zone_engine.py::TestDisplayBuffer::test_deque_maxlen -v
```

Expected: PASS

### Step 1.6: Write test — reset clears everything

- [ ] Add test:

```python
    def test_reset(self):
        """Reset clears all deques."""
        buf = DisplayBuffer(maxlen=10)
        buf.feed(
            calibrated=[(100.0, 200.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(50.0, 100.0), (0.0, 0.0), (0.0, 0.0)],
        )
        buf.reset()
        snap = buf.feed(
            calibrated=[(999.0, 888.0, True), (0.0, 0.0, False), (0.0, 0.0, False)],
            raw=[(999.0, 888.0), (0.0, 0.0), (0.0, 0.0)],
        )
        # After reset, only one frame in deque
        assert snap.targets[0].x == 999.0
        assert snap.targets[0].frame_count == 1
```

- [ ] Run test:

```bash
python -m pytest tests/test_zone_engine.py::TestDisplayBuffer::test_reset -v
```

Expected: PASS

### Step 1.7: Run all DisplayBuffer tests and commit

- [ ] Run all tests:

```bash
python -m pytest tests/test_zone_engine.py::TestDisplayBuffer -v
```

Expected: All PASS

- [ ] Commit:

```bash
git add custom_components/everything_presence_pro/zone_engine.py tests/test_zone_engine.py
git commit -m "feat: add DisplayBuffer rolling median for display updates"
```

---

## Task 2: Coordinator — display buffer, coalescing, and 5 Hz throttle

**Files:**
- Modify: `custom_components/everything_presence_pro/coordinator.py`
- Test: `tests/test_coordinator.py`

### Step 2.1: Write failing test — coordinator has display buffer

- [ ] Add test to `tests/test_coordinator.py`:

```python
from custom_components.everything_presence_pro.zone_engine import DisplayBuffer


class TestDisplayBuffer:
    """Tests for display buffer integration in coordinator."""

    def test_coordinator_has_display_buffer(self, coordinator):
        """Coordinator initializes with a DisplayBuffer."""
        assert hasattr(coordinator, '_display_buffer')
        assert isinstance(coordinator._display_buffer, DisplayBuffer)

    def test_display_subscriber_count_starts_zero(self, coordinator):
        """Display subscriber count starts at zero."""
        assert coordinator.display_subscriber_count == 0
```

- [ ] Run test to verify it fails:

```bash
python -m pytest tests/test_coordinator.py::TestDisplayBuffer::test_coordinator_has_display_buffer -v
```

Expected: FAIL — `AssertionError`

### Step 2.2: Add display buffer state to coordinator __init__

- [ ] Modify `coordinator.py`. Add import at top (after existing zone_engine imports):

```python
from .zone_engine import DisplayBuffer
from .zone_engine import DisplaySnapshot
```

- [ ] Add to `__init__` after `self._stale_timer` (line 97), before the ESPHome entity key mapping comment (line 100):

```python
        # Display buffer (5 Hz rolling median for live UI)
        self._display_buffer = DisplayBuffer()
        self._last_display_snapshot: DisplaySnapshot | None = None
        self._last_display_time: float = 0.0
        self._display_subscriber_count: int = 0
        self._display_flush_scheduled: bool = False
```

- [ ] Add new signal constant after `SIGNAL_SENSORS_UPDATED` (line 40):

```python
SIGNAL_DISPLAY_UPDATED = f"{DOMAIN}_display_updated"
```

- [ ] Add property and methods for subscriber count (after the `last_result` property, alongside other coordinator properties):

```python
    @property
    def display_subscriber_count(self) -> int:
        """Return the number of active display subscribers."""
        return self._display_subscriber_count

    def increment_display_subscribers(self) -> None:
        """Increment the display subscriber count."""
        self._display_subscriber_count += 1

    def decrement_display_subscribers(self) -> None:
        """Decrement the display subscriber count."""
        self._display_subscriber_count = max(0, self._display_subscriber_count - 1)
```

- [ ] Run test to verify it passes:

```bash
python -m pytest tests/test_coordinator.py::TestDisplayBuffer -v
```

Expected: PASS

### Step 2.3: Write failing test — display flush coalescing

Note: The coordinator's `_flush_display` calls `_build_calibrated_targets()`, which
applies the sensor transform and checks grid bounds. With the default 1x1 grid,
arbitrary coordinates fall outside the room and targets get marked inactive. To
isolate the display buffer logic, mock `_build_calibrated_targets` to return known
calibrated tuples.

- [ ] Add test:

```python
    def test_flush_display_not_called_without_subscribers(self, coordinator):
        """Display buffer is not fed when no subscribers."""
        coordinator._display_subscriber_count = 0
        coordinator._flush_display()
        assert coordinator._last_display_snapshot is None

    def test_flush_display_emits_snapshot(self, coordinator):
        """Display buffer emits snapshot when subscribers exist."""
        coordinator._display_subscriber_count = 1
        coordinator._target_x[0] = 100.0
        coordinator._target_y[0] = 200.0
        # Mock _build_calibrated_targets to return a known active target
        coordinator._build_calibrated_targets = lambda: [
            (100.0, 200.0, True),
            (0.0, 0.0, False),
            (0.0, 0.0, False),
        ]
        coordinator._flush_display()
        assert coordinator._last_display_snapshot is not None
        assert coordinator._last_display_snapshot.targets[0].active is True
```

- [ ] Run test to verify it fails:

```bash
python -m pytest tests/test_coordinator.py::TestDisplayBuffer::test_flush_display_emits_snapshot -v
```

Expected: FAIL — `AttributeError: '_flush_display'`

### Step 2.4: Implement _flush_display and coalescing in _schedule_rebuild

- [ ] Add `_flush_display` method to the coordinator (after `_schedule_rebuild`):

```python
    def _flush_display(self) -> None:
        """Feed display buffer and emit signal (coalesced, max 5 Hz)."""
        self._display_flush_scheduled = False
        if self._display_subscriber_count <= 0:
            return

        now = time.monotonic()
        if now - self._last_display_time < 0.2:
            return

        calibrated = self._build_calibrated_targets()
        raw = [(self._target_x[i], self._target_y[i]) for i in range(MAX_TARGETS)]
        self._last_display_snapshot = self._display_buffer.feed(calibrated, raw)
        self._last_display_time = now
        async_dispatcher_send(self.hass, f"{SIGNAL_DISPLAY_UPDATED}_{self.entry.entry_id}")
```

- [ ] Add coalescing call at the end of `_schedule_rebuild` (after the stale timer block):

```python
        # Coalesce display updates — schedule at most one per event-loop iteration
        if self._display_subscriber_count > 0 and not self._display_flush_scheduled:
            self._display_flush_scheduled = True
            self.hass.loop.call_soon(self._flush_display)
```

- [ ] Run test to verify it passes:

```bash
python -m pytest tests/test_coordinator.py::TestDisplayBuffer -v
```

Expected: PASS

### Step 2.5: Write test — 5 Hz throttle

- [ ] Add test:

```python
    def test_flush_display_throttles_at_5hz(self, coordinator):
        """Display updates are throttled to 5 Hz (200ms interval)."""
        coordinator._display_subscriber_count = 1
        coordinator._build_calibrated_targets = lambda: [
            (100.0, 200.0, True),
            (0.0, 0.0, False),
            (0.0, 0.0, False),
        ]

        # First flush — succeeds
        coordinator._flush_display()
        assert coordinator._last_display_snapshot is not None
        first_time = coordinator._last_display_time

        # Reset snapshot to detect second call
        coordinator._last_display_snapshot = None

        # Second flush immediately — should be throttled
        coordinator._flush_display()
        assert coordinator._last_display_snapshot is None
        assert coordinator._last_display_time == first_time
```

- [ ] Run test:

```bash
python -m pytest tests/test_coordinator.py::TestDisplayBuffer::test_flush_display_throttles_at_5hz -v
```

Expected: PASS

### Step 2.6: Write test — last_display_snapshot property

- [ ] Add test and property. Add a read-only property for the websocket handler:

```python
    @property
    def last_display_snapshot(self) -> DisplaySnapshot | None:
        """Return the last display snapshot."""
        return self._last_display_snapshot
```

- [ ] Run all coordinator display tests and commit:

```bash
python -m pytest tests/test_coordinator.py::TestDisplayBuffer -v
```

Expected: All PASS

- [ ] Commit:

```bash
git add custom_components/everything_presence_pro/coordinator.py tests/test_coordinator.py
git commit -m "feat: coordinator display buffer with coalescing and 5Hz throttle"
```

---

## Task 3: Websocket — subscribe_display command

**Files:**
- Modify: `custom_components/everything_presence_pro/websocket_api.py`
- Test: `tests/test_websocket_api.py`

### Step 3.1: Write failing test — subscribe_display returns initial state

- [ ] Add test to `tests/test_websocket_api.py`:

```python
async def test_subscribe_display(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_display sends initial state and lightweight updates."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json({
        "id": 1,
        "type": "everything_presence_pro/subscribe_display",
        "entry_id": entry.entry_id,
    })

    # First message: subscription acknowledgment
    msg = await ws_client.receive_json()
    assert msg["id"] == 1
    assert msg["success"] is True

    # Second message: initial state event
    msg = await ws_client.receive_json()
    assert msg["id"] == 1
    assert msg["type"] == "event"
    event = msg["event"]
    assert "targets" in event
    # Display messages have NO sensors or zones
    assert "sensors" not in event
    assert "zones" not in event
    # Verify target structure
    for t in event["targets"]:
        assert "x" in t
        assert "y" in t
        assert "raw_x" in t
        assert "raw_y" in t
        assert "signal" in t
```

- [ ] Run test to verify it fails:

```bash
python -m pytest tests/test_websocket_api.py::test_subscribe_display -v
```

Expected: FAIL — unknown command type

### Step 3.2: Implement subscribe_display handler

- [ ] Add imports to `websocket_api.py`. After the existing coordinator imports (line 20-22), add:

```python
from .coordinator import SIGNAL_DISPLAY_UPDATED
```

After the existing zone_engine imports (line 23-24), add:

```python
from .zone_engine import DisplaySnapshot
from .zone_engine import DisplayTarget
from .zone_engine import TargetStatus
```

Note: `TargetResult` is already imported at line 23.

- [ ] Register the command in `async_register_websocket_commands` (after the `subscribe_targets` registration, ~line 49):

```python
    websocket_api.async_register_command(hass, websocket_subscribe_display)
```

- [ ] Add the handler function (after the `websocket_subscribe_targets` function):

```python
@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/subscribe_display",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_subscribe_display(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle subscribe_display command — lightweight 5 Hz position updates."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    def _build_payload(snap: DisplaySnapshot | None) -> dict[str, Any]:
        """Build the display payload from a snapshot."""
        raw_targets = coordinator.raw_targets
        if snap is not None:
            targets = snap.targets
        else:
            # Fallback: use last zone engine result for initial state
            result = coordinator.last_result
            ztargets = list(result.targets) if result else []
            while len(ztargets) < len(raw_targets):
                ztargets.append(TargetResult())
            targets = [
                DisplayTarget(
                    x=t.x,
                    y=t.y,
                    raw_x=r[0],
                    raw_y=r[1],
                    active=t.status != TargetStatus.INACTIVE,
                    frame_count=t.signal,
                )
                for t, r in zip(ztargets, raw_targets, strict=False)
            ]
        return {
            "targets": [
                {
                    "x": t.x,
                    "y": t.y,
                    "raw_x": t.raw_x,
                    "raw_y": t.raw_y,
                    "signal": min(t.frame_count, 9),
                }
                for t in targets
            ],
        }

    @callback
    def _forward_display() -> None:
        """Forward display snapshot to subscriber."""
        connection.send_message(
            websocket_api.event_message(
                msg["id"],
                _build_payload(coordinator.last_display_snapshot),
            )
        )

    # Track subscriber
    coordinator.increment_display_subscribers()

    # Send initial state
    connection.send_result(msg["id"])
    connection.send_message(
        websocket_api.event_message(
            msg["id"],
            _build_payload(coordinator.last_display_snapshot),
        )
    )

    # Subscribe to display updates
    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    unsub = async_dispatcher_connect(
        hass,
        f"{SIGNAL_DISPLAY_UPDATED}_{msg['entry_id']}",
        _forward_display,
    )

    @callback
    def _unsub_all() -> None:
        unsub()
        coordinator.decrement_display_subscribers()

    connection.subscriptions[msg["id"]] = _unsub_all
```

- [ ] Run test to verify it passes:

```bash
python -m pytest tests/test_websocket_api.py::test_subscribe_display -v
```

Expected: PASS

### Step 3.3: Write test — subscriber count increments and decrements

- [ ] Add test:

```python
async def test_subscribe_display_tracks_subscriber_count(
    hass: HomeAssistant, hass_ws_client, setup_integration
):
    """subscribe_display increments/decrements the coordinator subscriber count."""
    entry = setup_integration
    coordinator = entry.runtime_data
    assert coordinator.display_subscriber_count == 0

    ws_client = await hass_ws_client(hass)

    await ws_client.send_json({
        "id": 1,
        "type": "everything_presence_pro/subscribe_display",
        "entry_id": entry.entry_id,
    })
    await ws_client.receive_json()  # result
    await ws_client.receive_json()  # initial event

    assert coordinator.display_subscriber_count == 1

    # Unsubscribe
    await ws_client.send_json({"id": 2, "type": "unsubscribe_events", "subscription": 1})
    await ws_client.receive_json()

    assert coordinator.display_subscriber_count == 0
```

- [ ] Run test:

```bash
python -m pytest tests/test_websocket_api.py::test_subscribe_display_tracks_subscriber_count -v
```

Expected: PASS

### Step 3.4: Run all websocket tests and commit

- [ ] Run all websocket tests:

```bash
python -m pytest tests/test_websocket_api.py -v
```

Expected: All PASS (existing tests unaffected)

- [ ] Commit:

```bash
git add custom_components/everything_presence_pro/websocket_api.py tests/test_websocket_api.py
git commit -m "feat: add subscribe_display websocket command for 5Hz position updates"
```

---

## Task 4: Frontend — dual subscription

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`
- Test: `frontend/src/__tests__/panel-targets.test.ts`

### Step 4.1: Write failing test — panel subscribes to display

- [ ] Add test to `frontend/src/__tests__/panel-targets.test.ts`:

```typescript
describe("_subscribeDisplay", () => {
    let el: EverythingPresenceProPanel;

    beforeEach(() => {
        el = createPanel();
    });

    it("subscribes to display when hass and entryId are provided", () => {
        const a = el as any;
        const unsubFn = vi.fn();
        el.hass = {
            callWS: vi.fn(),
            connection: {
                subscribeMessage: vi.fn().mockResolvedValue(unsubFn),
            },
        };

        a._subscribeDisplay("e1");

        expect(el.hass.connection.subscribeMessage).toHaveBeenCalledWith(
            expect.any(Function),
            {
                type: "everything_presence_pro/subscribe_display",
                entry_id: "e1",
            },
        );
    });

    it("does nothing when hass is not set", () => {
        const a = el as any;
        el.hass = null;
        a._subscribeDisplay("e1");
        expect(a._unsubDisplay).toBeUndefined();
    });
});
```

- [ ] Run test to verify it fails:

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/faster_updates/frontend
npx vitest run src/__tests__/panel-targets.test.ts
```

Expected: FAIL — `_subscribeDisplay is not a function`

### Step 4.2: Add _unsubDisplay field and _subscribeDisplay method

- [ ] Add field declaration after `_unsubTargets` (~line 505):

```typescript
	private _unsubDisplay?: () => void;
```

- [ ] Add `_subscribeDisplay` method after `_unsubscribeTargets` (~line 760):

```typescript
	private _subscribeDisplay(entryId: string): void {
		this._unsubscribeDisplay();
		if (!this.hass || !entryId) return;

		const conn = this.hass.connection;

		conn
			.subscribeMessage(
				(event: any) => {
					const displayTargets: Array<{
						x: number;
						y: number;
						raw_x: number;
						raw_y: number;
						signal: number;
					}> = event.targets || [];

					// Merge display positions into existing targets
					this._targets = this._targets.map((t, i) => {
						const d = displayTargets[i];
						if (!d) return t;
						return { ...t, x: d.x, y: d.y, raw_x: d.raw_x, raw_y: d.raw_y, signal: d.signal };
					});
				},
				{
					type: "everything_presence_pro/subscribe_display",
					entry_id: entryId,
				},
			)
			.then((unsub: () => void) => {
				this._unsubDisplay = unsub;
			});
	}

	private _unsubscribeDisplay(): void {
		if (this._unsubDisplay) {
			this._unsubDisplay();
			this._unsubDisplay = undefined;
		}
	}
```

- [ ] Run test to verify it passes:

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/faster_updates/frontend
npx vitest run src/__tests__/panel-targets.test.ts
```

Expected: PASS

### Step 4.3: Write test — display events merge into existing targets

- [ ] Add test:

```typescript
describe("display event merging", () => {
    it("merges display positions into existing targets preserving status", () => {
        const el = createPanel();
        const a = el as any;

        // Set up existing targets (as if from subscribe_targets)
        a._targets = [
            { x: 0, y: 0, raw_x: 0, raw_y: 0, speed: 0, status: "active", signal: 5 },
            { x: 0, y: 0, raw_x: 0, raw_y: 0, speed: 0, status: "pending", signal: 3 },
            { x: 0, y: 0, raw_x: 0, raw_y: 0, speed: 0, status: "inactive", signal: 0 },
        ];

        // Simulate display event callback
        let callback: Function;
        el.hass = {
            callWS: vi.fn(),
            connection: {
                subscribeMessage: vi.fn().mockImplementation((cb: Function) => {
                    callback = cb;
                    return Promise.resolve(vi.fn());
                }),
            },
        };
        a._subscribeDisplay("e1");

        // Fire display event
        callback!({
            targets: [
                { x: 100, y: 200, raw_x: 50, raw_y: 100, signal: 7 },
                { x: 300, y: 400, raw_x: 150, raw_y: 200, signal: 4 },
                { x: 0, y: 0, raw_x: 0, raw_y: 0, signal: 0 },
            ],
        });

        // Positions updated
        expect(a._targets[0].x).toBe(100);
        expect(a._targets[0].y).toBe(200);
        expect(a._targets[0].raw_x).toBe(50);
        expect(a._targets[0].signal).toBe(7);
        // Status preserved from subscribe_targets
        expect(a._targets[0].status).toBe("active");
        expect(a._targets[1].status).toBe("pending");
    });
});
```

- [ ] Run test:

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/faster_updates/frontend
npx vitest run src/__tests__/panel-targets.test.ts
```

Expected: PASS

### Step 4.4: Wire up _subscribeDisplay in _subscribeTargets and cleanup

- [ ] In `_subscribeTargets` (line 682), add a call to `_subscribeDisplay` after the `.then(...)` chain (after line 751, before the closing brace of the method):

```typescript
		this._subscribeDisplay(entryId);
```

- [ ] In `_unsubscribeTargets` (line 754), add `this._unsubscribeDisplay()` as the first line inside the method body. The updated method should be:

```typescript
	private _unsubscribeTargets(): void {
		this._unsubscribeDisplay();
		if (this._unsubTargets) {
			this._unsubTargets();
			this._unsubTargets = undefined;
		}
		this._targets = [];
	}
```

- [ ] In `disconnectedCallback` (~line 572) — no change needed, it already calls `_unsubscribeTargets` which now also cleans up display.

### Step 4.5: Run all frontend tests and commit

- [ ] Run all frontend tests:

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/faster_updates/frontend
npx vitest run
```

Expected: All PASS

- [ ] Commit:

```bash
git add frontend/src/everything-presence-pro-panel.ts frontend/src/__tests__/panel-targets.test.ts
git commit -m "feat: frontend dual subscription for 5Hz display updates"
```

---

## Task 5: Integration test — full pipeline

**Files:**
- Test: `tests/test_coordinator.py`

### Step 5.1: Write integration test — end-to-end display update

- [ ] Add test verifying the full flow from `_on_state` through display flush:

```python
    def test_schedule_rebuild_schedules_display_flush(self, coordinator):
        """_schedule_rebuild schedules a display flush when subscribers exist."""
        coordinator._display_subscriber_count = 1
        coordinator._target_active[0] = True
        coordinator._target_x[0] = 100.0
        coordinator._target_y[0] = 200.0

        coordinator._schedule_rebuild()

        # call_soon should have been scheduled
        coordinator.hass.loop.call_soon.assert_called()
```

- [ ] Run test:

```bash
python -m pytest tests/test_coordinator.py::TestDisplayBuffer::test_schedule_rebuild_schedules_display_flush -v
```

Expected: PASS

### Step 5.2: Write test — no scheduling without subscribers

- [ ] Add test:

```python
    def test_schedule_rebuild_skips_display_without_subscribers(self, coordinator):
        """_schedule_rebuild does not schedule display flush without subscribers."""
        coordinator._display_subscriber_count = 0
        coordinator._target_active[0] = True
        coordinator._target_x[0] = 100.0
        coordinator._target_y[0] = 200.0

        coordinator.hass.loop.call_soon.reset_mock()
        coordinator._schedule_rebuild()

        # call_soon should NOT have been called for display
        # (it may be called for other reasons, so check the args)
        for call in coordinator.hass.loop.call_soon.call_args_list:
            assert call.args[0] != coordinator._flush_display
```

- [ ] Run test:

```bash
python -m pytest tests/test_coordinator.py::TestDisplayBuffer::test_schedule_rebuild_skips_display_without_subscribers -v
```

Expected: PASS

### Step 5.3: Run full test suite and commit

- [ ] Run all Python tests:

```bash
python -m pytest tests/ -v
```

Expected: All PASS

- [ ] Run all frontend tests:

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/faster_updates/frontend
npx vitest run
```

Expected: All PASS

- [ ] Commit:

```bash
git add tests/test_coordinator.py
git commit -m "test: integration tests for display update pipeline"
```

---

## Task 6: Format and lint

- [ ] Run ruff:

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/faster_updates
python -m ruff check --fix custom_components/ tests/
python -m ruff format custom_components/ tests/
```

- [ ] Run frontend lint (if configured):

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/faster_updates/frontend
npm run lint --if-present
```

- [ ] Run full test suite one final time:

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/faster_updates
python -m pytest tests/ -v
cd frontend && npx vitest run && cd ..
```

Expected: All PASS, no lint errors

- [ ] Commit if any formatting changes:

```bash
git add -u
git commit -m "style: format and lint"
```

# Fast Display Updates Design

## Problem

After refactoring target data processing to use a 1-second tumbling window, the
live overview and detection zone screens update at 1 Hz. Target dots appear slow
and jumpy. The LD2450 sensor provides 10 Hz raw frames, but the zone engine only
emits results once per second after computing the median over ~10 frames.

The 1-second tumbling window is correct for zone occupancy decisions — the median
over ~10 frames provides noise rejection and reliable threshold evaluation. The
problem is purely visual: the display path is coupled to the zone logic path.

## Solution

Decouple display updates from zone logic by adding a **rolling median display
buffer** that emits smoothed XY positions at 5 Hz, opt-in only when a frontend
client is viewing the live overview or detection zone screen.

## Architecture

### Two independent data paths from the same frame stream

**Important context:** ESPHome dispatches each sensor entity independently. For 3
targets with x, y, speed, resolution, active (5 entities each), a single 10 Hz
sensor frame produces ~15 individual `_on_state` callbacks, each calling
`_schedule_rebuild()`. The `DisplayBuffer` must not be fed on every callback —
it must be fed once per coalesced frame.

```
ESPHome 10Hz frames → ~15 _on_state() callbacks per frame
        │
   coordinator._schedule_rebuild()
        │
        ├──► zone_engine.feed_raw() ──► TumblingWindow (1s) ──► _tick() ──► ProcessingResult
        │                                                                        │
        │                                                            SIGNAL_TARGETS_UPDATED (1 Hz)
        │                                                                        │
        │                                                              subscribe_targets WS
        │
        └──► coalesced display update (call_soon debounce)
                  │
                  └──► DisplayBuffer.feed() ──► rolling median (deque, 10 frames) ──► DisplaySnapshot
                                                        │
                                               throttle to 5 Hz (200ms)
                                                        │
                                             SIGNAL_DISPLAY_UPDATED (5 Hz)
                                                        │
                                              subscribe_display WS
```

### Component: DisplayBuffer

**Location:** `zone_engine.py`, alongside `TumblingWindow`.

A lightweight, side-effect-free rolling median calculator for display purposes
only. It is stateful (maintains per-target deques) but does not interact with the
zone engine state machine in any way.

- Maintains a `collections.deque(maxlen=10)` per target for X and Y coordinates
  (last ~1 second of frames at 10 Hz sensor rate)
- On every `feed()` call: appends the new calibrated position, computes
  `statistics.median()` over the deque
- Also accepts raw (untransformed) target coordinates so the websocket handler can
  include `raw_x`/`raw_y` in its payload without a separate lookup
- Returns a `DisplaySnapshot` on every call — no gating, no waiting for a window
  to fill
- Does not interact with the zone engine state machine in any way

```python
@dataclass
class DisplayTarget:
    x: float = 0.0        # calibrated rolling median
    y: float = 0.0        # calibrated rolling median
    raw_x: float = 0.0    # latest raw (untransformed) x
    raw_y: float = 0.0    # latest raw (untransformed) y
    active: bool = False
    frame_count: int = 0   # number of frames in the deque for this target

@dataclass
class DisplaySnapshot:
    targets: list[DisplayTarget]

class DisplayBuffer:
    def __init__(self, maxlen: int = 10) -> None: ...
    def feed(
        self,
        calibrated: list[tuple[float, float, bool]],
        raw: list[tuple[float, float]],
    ) -> DisplaySnapshot: ...
    def reset(self) -> None: ...
```

The websocket handler derives `signal` as `min(target.frame_count, 9)`, consistent
with how the zone engine computes signal from the tumbling window.

**Deque size 10** matches the tumbling window frame count, providing equivalent
noise rejection. The difference: the tumbling window resets every second and emits
once; the rolling median slides forward on every frame and can emit continuously.

### Component: Coordinator changes

**Frame coalescing:** Because `_schedule_rebuild()` fires per-entity-state (~15
times per sensor frame), the `DisplayBuffer` must not be fed on every call.
Instead, `_schedule_rebuild()` sets a flag and schedules a single
`hass.loop.call_soon(self._flush_display)` callback. Multiple `_schedule_rebuild()`
calls within the same event-loop iteration collapse into one `_flush_display()`
execution. This matches how the existing `TumblingWindow` tolerates per-entity
calls — it time-gates output to 1s boundaries — but `_flush_display` coalesces
at the event-loop level.

The `TumblingWindow` already gets the same per-entity calls and handles them
fine via its time boundary, so feeding it in `_schedule_rebuild()` is unchanged.

In `_flush_display()`:

1. Guard: skip if `self._display_subscriber_count == 0`
2. **Throttle to 5 Hz**: check `now - self._last_display_time >= 0.2`; skip if
   too soon
3. Feed the `DisplayBuffer` with the current calibrated targets and raw targets
4. Fire `SIGNAL_DISPLAY_UPDATED_{entry_id}`
5. Store snapshot as `self._last_display_snapshot`
6. Reset the pending flag

New coordinator state:
- `self._display_buffer: DisplayBuffer`
- `self._last_display_snapshot: DisplaySnapshot | None`
- `self._last_display_time: float = 0.0`
- `self._display_subscriber_count: int = 0`
- `self._display_flush_scheduled: bool = False`

New signal:
- `SIGNAL_DISPLAY_UPDATED = f"{DOMAIN}_display_updated"`

### Component: Websocket — new `subscribe_display` command

**Command:** `everything_presence_pro/subscribe_display`

Lightweight, display-only subscription. Sends only target positions at 5 Hz:

```json
{
  "targets": [
    {"x": 1234.5, "y": 567.8, "raw_x": 100.0, "raw_y": 200.0, "signal": 7},
    ...
  ]
}
```

Where `signal = min(target.frame_count, 9)`, derived by the handler from the
`DisplayTarget.frame_count` field.

- Subscribes to `SIGNAL_DISPLAY_UPDATED_{entry_id}`
- On connect: increments `coordinator._display_subscriber_count`
- On disconnect: decrements via `max(0, count - 1)` to guard against
  double-disconnect edge cases in the HA framework
- **Initial state:** sends an immediate snapshot on subscription. If the
  `DisplayBuffer` has no data yet (no frames received), sends the current
  `last_result` target positions from the zone engine as a fallback, so the
  frontend has something to render immediately
- No sensors, no zone occupancy, no debug log — just positions

The existing `subscribe_targets` command is unchanged. It continues to deliver
zone state, occupancy, sensors, and status at 1 Hz.

### Component: Frontend — dual subscription

The panel subscribes to both commands on mount, tears down both on unmount.

**From `subscribe_display` (5 Hz):**
- Updates `target.x`, `target.y`, `target.raw_x`, `target.raw_y`, `target.signal`
- Triggers re-render for dot positions only

**From `subscribe_targets` (1 Hz):**
- Updates `target.status` (active/pending/inactive)
- Updates zone occupancy, target counts, sensors, debug log
- Triggers re-render for zone overlays and status indicators

Merge strategy: on each display message, overwrite position fields in the
existing `_targets` array, preserving the last-known status from the 1 Hz stream.

No CSS interpolation or animation — 5 Hz should be visually smooth. A small CSS
transition (~100ms) could be added as a polish pass if needed, but is out of
scope for this design.

Both subscriptions are torn down on unmount. The `subscribe_display` teardown
decrements the coordinator's subscriber count.

## Data overhead

- **Normal operation (no UI open):** Zero additional overhead. The display buffer
  is not fed, no signals are fired, no websocket messages sent.
- **Live overview open:** ~5 messages/second, each containing 3 targets × 5
  fields (x, y, raw_x, raw_y, signal). Roughly 200-300 bytes/message = ~1.5 KB/s
  additional websocket traffic. Acceptable for a short-lived, single-sensor view.

## What does NOT change

- `TumblingWindow` — untouched, continues 1-second tumbling median for zone logic
- `ZoneEngine._tick()` — untouched, same thresholds, gating, handoff logic
- `subscribe_targets` websocket command — untouched, same 1 Hz payload
- Zone occupancy decisions — entirely driven by the 1 Hz path
- HA entity updates (distance, angle, speed sensors) — unchanged

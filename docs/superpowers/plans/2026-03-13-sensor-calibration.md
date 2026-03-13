# Sensor calibration system implementation plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing broken calibration system with a three-stage transform pipeline (LD2450 distortion correction → rotation → translation) that handles chip-level distortion and per-sensor angle calibration.

**Architecture:** Pure distortion correction function (`ld2450_correct`) applied first, then rotation by a discovered sensor angle, then translation to room origin. Existing `CalibrationTransform` (6-param affine) removed. One-click recalibration via single reference point. Frontend and backend both implement the same pipeline.

**Tech Stack:** Python 3.13+ (backend), TypeScript/Lit (frontend panel), pytest (tests)

**Spec:** `docs/superpowers/specs/2026-03-13-sensor-calibration-design.md`

---

## File structure

| File | Action | Responsibility |
|------|--------|---------------|
| `custom_components/everything_presence_pro/calibration.py` | Rewrite | `ld2450_correct()` pure function + `SensorTransform` class |
| `tests/test_calibration.py` | Rewrite | Tests for distortion correction, transform pipeline, recalibration |
| `custom_components/everything_presence_pro/coordinator.py` | Modify | Replace `CalibrationTransform` usage with `SensorTransform` |
| `custom_components/everything_presence_pro/websocket_api.py` | Modify | Replace `set_calibration` with `recalibrate`, update `set_setup` |
| `frontend/src/everything-presence-pro-panel.ts` | Modify | Replace `_sensorToRoom()` with pipeline, add recalibrate UI |

---

## Chunk 1: Backend transform pipeline

### Task 1: Derive the SCALE_FACTOR from diagnostic data

**Files:**
- Create: `tools/derive_scale_factor.py` (throwaway script)

This task computes the LD2450 angle correction scale factor from the diagnostic data captured earlier. The script is a one-time derivation tool, not production code.

- [ ] **Step 1: Write the derivation script**

```python
"""Derive LD2450 angle correction SCALE_FACTOR from diagnostic data.

Diagnostic data captured from a real sensor in a 3.5m x 4.45m room,
sensor in left corner.
"""
import math

# Raw sensor readings for 4 room corners
CORNERS = {
    "near_left":  {"sx": -79,   "sy": 243},
    "near_right": {"sx": 2250,  "sy": 1908},
    "far_right":  {"sx": 401,   "sy": 5012},
    "far_left":   {"sx": -2818, "sy": 2283},
}

ROOM_WIDTH = 3500   # mm
ROOM_DEPTH = 4450   # mm

def reported_angle(sx, sy):
    """Sensor-frame angle: atan2(x, y), 0 = straight ahead."""
    return math.atan2(sx, sy)

def main():
    # Step 1: Estimate sensor angle from far-right corner (minimal distortion)
    # Far-right is at room coords (ROOM_WIDTH, ROOM_DEPTH) for left-corner sensor
    expected_room_angle_fr = math.atan2(ROOM_WIDTH, ROOM_DEPTH)
    reported_angle_fr = reported_angle(
        CORNERS["far_right"]["sx"], CORNERS["far_right"]["sy"]
    )

    # Initial sensor angle estimate (iterative refinement)
    sensor_angle = reported_angle_fr - expected_room_angle_fr
    print(f"Initial sensor angle estimate: {math.degrees(sensor_angle):.1f}°")

    # Step 2: Compute expected sensor-frame angles for all corners
    # Room-frame positions (left-corner sensor at room origin 0,0)
    room_positions = {
        "near_left":  (0, 0),  # sensor corner — too close, skip
        "near_right": (ROOM_WIDTH, 0),
        "far_right":  (ROOM_WIDTH, ROOM_DEPTH),
        "far_left":   (0, ROOM_DEPTH),
    }

    # Step 3: Iteratively refine scale factor
    for iteration in range(5):
        ratios = []
        for name in ["near_right", "far_right", "far_left"]:
            rx, ry = room_positions[name]
            # Expected angle in sensor frame = room angle - sensor angle
            room_angle = math.atan2(rx, ry)
            expected_sensor_angle = room_angle - sensor_angle
            rep_angle = reported_angle(
                CORNERS[name]["sx"], CORNERS[name]["sy"]
            )
            if abs(expected_sensor_angle) > 0.01:
                ratio = rep_angle / expected_sensor_angle
                ratios.append(ratio)
                print(
                    f"  {name}: reported={math.degrees(rep_angle):.1f}°, "
                    f"expected={math.degrees(expected_sensor_angle):.1f}°, "
                    f"ratio={ratio:.4f}"
                )

        scale_factor = sum(ratios) / len(ratios)
        print(f"Iteration {iteration}: SCALE_FACTOR = {scale_factor:.4f}")

        # Re-estimate sensor angle using scale factor
        corrected_angle_fr = reported_angle_fr * scale_factor
        sensor_angle = corrected_angle_fr - expected_room_angle_fr
        print(f"  Refined sensor angle: {math.degrees(sensor_angle):.1f}°")

    print(f"\nFinal SCALE_FACTOR = {scale_factor:.4f}")

    # Step 4: Validate — correct all corners and check rectangle
    print("\nValidation (corrected corners in room frame):")
    cos_a = math.cos(sensor_angle)
    sin_a = math.sin(sensor_angle)
    for name, raw in CORNERS.items():
        if name == "near_left":
            continue
        sx, sy = raw["sx"], raw["sy"]
        dist = math.sqrt(sx**2 + sy**2)
        angle = math.atan2(sx, sy)
        corrected_angle = angle * scale_factor
        cx = dist * math.sin(corrected_angle)
        cy = dist * math.cos(corrected_angle)
        # Rotate by sensor_angle (clockwise)
        rx = cx * cos_a + cy * sin_a
        ry = -cx * sin_a + cy * cos_a
        expected_rx, expected_ry = room_positions[name]
        err = math.sqrt((rx - expected_rx)**2 + (ry - expected_ry)**2)
        print(
            f"  {name}: room=({rx:.0f}, {ry:.0f}), "
            f"expected=({expected_rx}, {expected_ry}), error={err:.0f}mm"
        )


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the script to derive the scale factor**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python tools/derive_scale_factor.py`

Expected: The script prints iterative refinements converging on a SCALE_FACTOR around 0.75-0.80, plus validation showing corrected corners much closer to their expected positions. Record the final SCALE_FACTOR value — it will be hardcoded in `ld2450_correct()`.

- [ ] **Step 3: Commit the derivation script**

```bash
git add tools/derive_scale_factor.py
git commit -m "tools: add LD2450 scale factor derivation script"
```

---

### Task 2: Write tests for `ld2450_correct()` and `SensorTransform`

**Files:**
- Rewrite: `tests/test_calibration.py`

- [ ] **Step 1: Write failing tests for `ld2450_correct()`**

Replace the entire contents of `tests/test_calibration.py` with:

```python
"""Tests for the sensor calibration pipeline."""

import math

from custom_components.everything_presence_pro.calibration import (
    ld2450_correct,
    SensorTransform,
)

# -- Diagnostic test vectors (from real sensor capture) --
# Room: 3500mm x 4450mm, sensor in left corner
# These are raw sensor readings for known room corners
DIAGNOSTIC_CORNERS = {
    "near_right": {"sx": 2250, "sy": 1908, "room_x": 3500, "room_y": 0},
    "far_right": {"sx": 401, "sy": 5012, "room_x": 3500, "room_y": 4450},
    "far_left": {"sx": -2818, "sy": 2283, "room_x": 0, "room_y": 4450},
}


def test_ld2450_correct_identity_near_center():
    """Points near the sensor centerline (small angles) should barely change."""
    cx, cy = ld2450_correct(0, 3000)
    # Straight ahead: angle = 0, correction is identity
    assert abs(cx - 0) < 1
    assert abs(cy - 3000) < 1


def test_ld2450_correct_preserves_distance():
    """Distortion correction changes angle but not distance."""
    for sx, sy in [(2250, 1908), (-2818, 2283), (401, 5012)]:
        cx, cy = ld2450_correct(sx, sy)
        original_dist = math.sqrt(sx**2 + sy**2)
        corrected_dist = math.sqrt(cx**2 + cy**2)
        assert abs(corrected_dist - original_dist) < 1, (
            f"Distance changed: {original_dist:.0f} -> {corrected_dist:.0f}"
        )


def test_ld2450_correct_reduces_angle():
    """Corrected angles should be smaller than reported angles (scale < 1)."""
    for sx, sy in [(2250, 1908), (-2818, 2283)]:
        cx, cy = ld2450_correct(sx, sy)
        reported = abs(math.atan2(sx, sy))
        corrected = abs(math.atan2(cx, cy))
        assert corrected < reported, (
            f"Corrected angle {math.degrees(corrected):.1f}° >= "
            f"reported {math.degrees(reported):.1f}°"
        )


def test_ld2450_correct_symmetric():
    """Correction should be symmetric: correct(x, y) mirrors correct(-x, y)."""
    cx1, cy1 = ld2450_correct(2000, 3000)
    cx2, cy2 = ld2450_correct(-2000, 3000)
    assert abs(cx1 + cx2) < 1  # X values should be negatives of each other
    assert abs(cy1 - cy2) < 1  # Y values should be the same


# -- SensorTransform tests --


def test_sensor_transform_identity():
    """Transform with angle=0 and no offset is distortion-correction only."""
    t = SensorTransform(sensor_angle=0.0, offset_x=0.0, offset_y=0.0)
    # Straight ahead point: correction is ~identity
    rx, ry = t.apply(0, 3000)
    assert abs(rx - 0) < 1
    assert abs(ry - 3000) < 1


def test_sensor_transform_rotation():
    """Transform applies rotation after distortion correction."""
    angle = math.pi / 4  # 45 degrees
    t = SensorTransform(sensor_angle=angle, offset_x=0.0, offset_y=0.0)
    # A point straight ahead at (0, 1000) after correction is still ~(0, 1000)
    # After 45° clockwise rotation: rx = 0*cos45 + 1000*sin45, ry = -0*sin45 + 1000*cos45
    rx, ry = t.apply(0, 1000)
    expected_rx = 1000 * math.sin(angle)
    expected_ry = 1000 * math.cos(angle)
    assert abs(rx - expected_rx) < 5
    assert abs(ry - expected_ry) < 5


def test_sensor_transform_translation():
    """Transform applies translation after rotation."""
    t = SensorTransform(sensor_angle=0.0, offset_x=500.0, offset_y=100.0)
    rx, ry = t.apply(0, 3000)
    assert abs(rx - 500) < 1
    assert abs(ry - 3100) < 1


def test_sensor_transform_serialization():
    """Transform can be serialized and deserialized."""
    t = SensorTransform(sensor_angle=0.785, offset_x=100.0, offset_y=200.0)
    data = t.to_dict()
    restored = SensorTransform.from_dict(data)

    x1, y1 = t.apply(1000, 2000)
    x2, y2 = restored.apply(1000, 2000)
    assert abs(x1 - x2) < 0.01
    assert abs(y1 - y2) < 0.01


def test_sensor_transform_recalibrate():
    """Recalibration updates only the angle from a single reference point."""
    t = SensorTransform(sensor_angle=0.5, offset_x=0.0, offset_y=0.0)
    original_offset_x = t.offset_x
    original_offset_y = t.offset_y

    # Recalibrate using a point at known room position
    # Use a point straight ahead in sensor: (0, 3000)
    # After correction it's still ~(0, 3000)
    # If expected room position is (2121, 2121) that implies ~45° rotation
    t.recalibrate(
        raw_sensor_x=0,
        raw_sensor_y=3000,
        expected_room_x=3000 * math.sin(math.pi / 4),
        expected_room_y=3000 * math.cos(math.pi / 4),
    )

    # Angle should have changed
    assert abs(t.sensor_angle - 0.5) > 0.1
    # Offsets should not have changed
    assert t.offset_x == original_offset_x
    assert t.offset_y == original_offset_y


def test_sensor_transform_default():
    """Default transform (no calibration) is identity + correction."""
    t = SensorTransform()
    rx, ry = t.apply(0, 3000)
    assert abs(rx - 0) < 1
    assert abs(ry - 3000) < 1
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_calibration.py -v`

Expected: ALL tests FAIL with `ImportError` because `ld2450_correct` and `SensorTransform` don't exist yet.

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/test_calibration.py
git commit -m "test: add failing tests for sensor calibration pipeline"
```

---

### Task 3: Implement `ld2450_correct()` and `SensorTransform`

**Files:**
- Rewrite: `custom_components/everything_presence_pro/calibration.py`

- [ ] **Step 1: Implement calibration.py**

Replace the entire contents of `calibration.py` with:

```python
"""Sensor calibration pipeline for LD2450 coordinate correction.

Three-stage transform:
  1. ld2450_correct() — built-in chip distortion correction (pure function)
  2. Rotation by sensor_angle — aligns sensor frame to room frame
  3. Translation by (offset_x, offset_y) — shifts origin to room corner

The ld2450_correct() function is intentionally written with no dependencies
so it can be ported to ESP32 firmware (C++) later.
"""

from __future__ import annotations

import math
from typing import Any

# LD2450 angle correction scale factor.
# Derived from diagnostic data: the LD2450 reports angles ~25% wider than
# reality at the edges of its 120° FOV. This factor compresses reported
# angles to match physical angles.
# Derivation: tools/derive_scale_factor.py
_SCALE_FACTOR: float = 0.0  # PLACEHOLDER — replaced in Step 2 with value from derive_scale_factor.py


def ld2450_correct(x: float, y: float) -> tuple[float, float]:
    """Apply built-in LD2450 distortion correction.

    Converts to polar, applies angle scale correction, converts back.
    Pure function — same correction for every unit.

    Note: uses atan2(x, y) not atan2(y, x) because sensor-frame angles
    are measured from the Y axis (forward), with X as lateral.
    """
    if x == 0.0 and y == 0.0:
        return 0.0, 0.0

    angle = math.atan2(x, y)
    distance = math.sqrt(x * x + y * y)

    corrected_angle = angle * _SCALE_FACTOR

    cx = distance * math.sin(corrected_angle)
    cy = distance * math.cos(corrected_angle)
    return cx, cy


class SensorTransform:
    """Three-stage sensor-to-room coordinate transform.

    Stage 1: ld2450_correct (chip distortion)
    Stage 2: rotate by sensor_angle (clockwise, positive = CW)
    Stage 3: translate by (offset_x, offset_y)
    """

    def __init__(
        self,
        sensor_angle: float = 0.0,
        offset_x: float = 0.0,
        offset_y: float = 0.0,
    ) -> None:
        """Initialize the transform."""
        self.sensor_angle = sensor_angle
        self.offset_x = offset_x
        self.offset_y = offset_y

    def apply(self, x: float, y: float) -> tuple[float, float]:
        """Apply the full transform pipeline: correct → rotate → translate."""
        # Stage 1: distortion correction
        cx, cy = ld2450_correct(x, y)

        # Stage 2: clockwise rotation by sensor_angle
        cos_a = math.cos(self.sensor_angle)
        sin_a = math.sin(self.sensor_angle)
        rx = cx * cos_a + cy * sin_a
        ry = -cx * sin_a + cy * cos_a

        # Stage 3: translation
        room_x = rx + self.offset_x
        room_y = ry + self.offset_y
        return room_x, room_y

    def recalibrate(
        self,
        raw_sensor_x: float,
        raw_sensor_y: float,
        expected_room_x: float,
        expected_room_y: float,
    ) -> None:
        """Recompute sensor_angle from a single reference point.

        The reference point has known room-frame coordinates.
        Only updates sensor_angle; offsets are unchanged.
        """
        # Apply distortion correction to get corrected sensor-frame coords
        cx, cy = ld2450_correct(raw_sensor_x, raw_sensor_y)

        # Angle from sensor to point in corrected sensor frame
        sensor_frame_angle = math.atan2(cx, cy)

        # Angle from sensor to point in room frame
        # (subtract offset to get sensor-origin room-aligned coords)
        room_frame_angle = math.atan2(
            expected_room_x - self.offset_x,
            expected_room_y - self.offset_y,
        )

        self.sensor_angle = sensor_frame_angle - room_frame_angle

    def to_dict(self) -> dict[str, Any]:
        """Serialize transform to a dictionary."""
        return {
            "sensor_angle": self.sensor_angle,
            "offset_x": self.offset_x,
            "offset_y": self.offset_y,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SensorTransform:
        """Deserialize transform from a dictionary."""
        if not data:
            return cls()
        return cls(
            sensor_angle=data.get("sensor_angle", 0.0),
            offset_x=data.get("offset_x", 0.0),
            offset_y=data.get("offset_y", 0.0),
        )
```

- [ ] **Step 2: Set the SCALE_FACTOR from the derivation script**

**CRITICAL:** The `_SCALE_FACTOR = 0.0` in Step 1 is a placeholder that will make all tests fail. Replace it with the actual value computed in Task 1 **before** running tests. For example:
```python
_SCALE_FACTOR: float = 0.78  # derived from tools/derive_scale_factor.py
```

Use the exact value from the script output. The value should be approximately 0.75-0.80.

- [ ] **Step 3: Run the tests**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/test_calibration.py -v`

Expected: ALL tests PASS. If any test fails, adjust the implementation. The `test_ld2450_correct_reduces_angle` and `test_ld2450_correct_symmetric` tests are the key validators.

- [ ] **Step 4: Commit**

```bash
git add custom_components/everything_presence_pro/calibration.py tests/test_calibration.py
git commit -m "feat: implement LD2450 distortion correction and SensorTransform pipeline"
```

---

### Task 4: Update coordinator to use SensorTransform

**Files:**
- Modify: `custom_components/everything_presence_pro/coordinator.py`

- [ ] **Step 1: Update the import**

In `coordinator.py`, find the import line:
```python
from .calibration import CalibrationPoint, CalibrationTransform
```
Replace with:
```python
from .calibration import SensorTransform
```

- [ ] **Step 2: Update `__init__`**

In `coordinator.py` line 53, replace:
```python
        self._calibration = CalibrationTransform()
```
with:
```python
        self._sensor_transform = SensorTransform()
```

- [ ] **Step 3: Update `set_calibration` → `set_sensor_transform`**

In `coordinator.py` lines 171-174, replace:
```python
    def set_calibration(self, points: list[CalibrationPoint]) -> None:
        """Set calibration from a list of calibration points."""
        self._calibration = CalibrationTransform()
        self._calibration.calibrate(points)
```
with:
```python
    def set_sensor_transform(self, transform: SensorTransform) -> None:
        """Set the sensor transform."""
        self._sensor_transform = transform
```

- [ ] **Step 4: Update `_rebuild_targets`**

In `coordinator.py` lines 354-374, replace:
```python
                cx, cy = self._calibration.apply(
                    self._target_x[i], self._target_y[i]
                )
```
with:
```python
                cx, cy = self._sensor_transform.apply(
                    self._target_x[i], self._target_y[i]
                )
```

- [ ] **Step 5: Update `get_config_data`**

In `coordinator.py` line 390, replace:
```python
            "calibration": self._calibration.to_dict(),
```
with:
```python
            "calibration": self._sensor_transform.to_dict(),
```

- [ ] **Step 6: Update `load_config_data`**

In `coordinator.py` lines 416-419, replace:
```python
        # Load calibration
        cal_data = data.get("calibration")
        if cal_data:
            self._calibration = CalibrationTransform.from_dict(cal_data)
```
with:
```python
        # Load calibration
        cal_data = data.get("calibration")
        if cal_data:
            self._sensor_transform = SensorTransform.from_dict(cal_data)
```

- [ ] **Step 7: Add `sensor_transform` property**

Add a public property after the `__init__` method (around line 87):
```python
    @property
    def sensor_transform(self) -> SensorTransform:
        """Return the sensor transform."""
        return self._sensor_transform
```

- [ ] **Step 8: Run tests to verify nothing is broken**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/ -v`

Expected: All tests pass (including the new calibration tests).

Note: The only files referencing `CalibrationTransform`/`CalibrationPoint`/`set_calibration` are:
- `calibration.py` — already rewritten in Task 3
- `coordinator.py` — updated in this task
- `websocket_api.py` — updated in Task 5
- `tests/test_calibration.py` — already rewritten in Task 2

No other files reference these names.

- [ ] **Step 9: Commit**

```bash
git add custom_components/everything_presence_pro/coordinator.py
git commit -m "refactor: replace CalibrationTransform with SensorTransform in coordinator"
```

---

### Task 5: Update websocket API

**Files:**
- Modify: `custom_components/everything_presence_pro/websocket_api.py`

- [ ] **Step 1: Update imports**

Find:
```python
from .calibration import CalibrationPoint
```
Replace with:
```python
from .calibration import SensorTransform
```

(If `CalibrationPoint` is imported alongside other things, remove only `CalibrationPoint`.)

- [ ] **Step 2: Replace `set_calibration` with `recalibrate`**

Replace the entire `websocket_set_calibration` function (lines 196-241) with:

```python
@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/recalibrate",
        vol.Required("entry_id"): str,
        vol.Required("sensor_x"): vol.Coerce(float),
        vol.Required("sensor_y"): vol.Coerce(float),
        vol.Required("expected_room_x"): vol.Coerce(float),
        vol.Required("expected_room_y"): vol.Coerce(float),
    }
)
@websocket_api.async_response
async def websocket_recalibrate(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle recalibrate command — recompute sensor angle from a reference point."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    coordinator.sensor_transform.recalibrate(
        raw_sensor_x=msg["sensor_x"],
        raw_sensor_y=msg["sensor_y"],
        expected_room_x=msg["expected_room_x"],
        expected_room_y=msg["expected_room_y"],
    )

    # Persist to config entry options
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is not None:
        config = dict(entry.options.get("config", {}))
        config["calibration"] = coordinator.sensor_transform.to_dict()
        hass.config_entries.async_update_entry(
            entry, options={**entry.options, "config": config}
        )

    connection.send_result(msg["id"])
```

- [ ] **Step 3: Update `set_setup` to compute calibration from bounds**

In the `websocket_set_setup` function, add calibration computation after the config is saved. The existing function already has `entry`, `config`, `coordinator`, and `msg` as local variables. Add these lines **before** `connection.send_result(msg["id"])`:

```python
    # Compute sensor transform from bounds + placement
    # Note: room_bounds from the frontend are already in room-frame coordinates
    # (the frontend computes the sensor_angle from raw points and transforms them
    # before sending). The sensor_angle itself is sent in msg["calibration"] if present.
    bounds = msg.get("room_bounds", {})
    placement = msg["placement"]
    if bounds.get("far_y") and bounds.get("left_x") is not None and bounds.get("right_x") is not None:
        room_width = bounds["right_x"] - bounds["left_x"]
        room_depth = bounds["far_y"]

        # Compute offsets from placement
        if placement == "left_corner":
            offset_x = 0.0
            offset_y = 0.0
        elif placement == "right_corner":
            offset_x = room_width
            offset_y = 0.0
        else:  # wall
            offset_x = room_width / 2
            offset_y = 0.0

        # sensor_angle is computed by the frontend from raw boundary points
        # and passed in the calibration dict
        cal_msg = msg.get("calibration", {})
        sensor_angle = cal_msg.get("sensor_angle", 0.0)

        transform = SensorTransform(
            sensor_angle=sensor_angle,
            offset_x=offset_x,
            offset_y=offset_y,
        )
        coordinator.set_sensor_transform(transform)
        config["calibration"] = transform.to_dict()
        hass.config_entries.async_update_entry(
            entry, options={**entry.options, "config": config}
        )
```

Also add `calibration` as an optional parameter to the `set_setup` WS command schema:
```python
        vol.Optional("calibration", default={}): {
            vol.Optional("sensor_angle"): vol.Coerce(float),
        },
```

- [ ] **Step 4: Register the new command**

Find where `websocket_set_calibration` is registered (look for `async_register_command(websocket_set_calibration)` in the `async_setup` function). Replace with:
```python
    websocket_api.async_register_command(hass, websocket_recalibrate)
```

- [ ] **Step 5: Run tests**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout && python -m pytest tests/ -v`

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add custom_components/everything_presence_pro/websocket_api.py
git commit -m "feat: replace set_calibration WS command with recalibrate"
```

---

## Chunk 2: Frontend pipeline and recalibration UI

### Task 6: Replace `_sensorToRoom()` with transform pipeline in frontend

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Replace `SIN45` constant and add distortion correction**

At the top of the file, find (line 51):
```typescript
const SIN45 = Math.SQRT2 / 2; // ~0.7071
```

Replace with:
```typescript
// LD2450 angle correction scale factor (must match Python calibration.py)
// MUST match _SCALE_FACTOR in calibration.py — copy the value from Task 1 output
const LD2450_SCALE_FACTOR = 0.0; // PLACEHOLDER — replace with value from derive_scale_factor.py

/**
 * Built-in LD2450 distortion correction — pure function, same for every unit.
 * Uses atan2(x, y) not atan2(y, x) because sensor angles are from Y axis.
 */
function ld2450Correct(x: number, y: number): { cx: number; cy: number } {
  if (x === 0 && y === 0) return { cx: 0, cy: 0 };
  const angle = Math.atan2(x, y);
  const distance = Math.sqrt(x * x + y * y);
  const correctedAngle = angle * LD2450_SCALE_FACTOR;
  return {
    cx: distance * Math.sin(correctedAngle),
    cy: distance * Math.cos(correctedAngle),
  };
}
```

Set `LD2450_SCALE_FACTOR` to the same value as the Python `_SCALE_FACTOR`.

- [ ] **Step 2: Replace `_sensorToRoom()` method**

Find the `_sensorToRoom()` method (lines 358-385) and replace entirely with:

```typescript
  /**
   * Three-stage sensor-to-room coordinate transform.
   * Stage 1: ld2450_correct (chip distortion)
   * Stage 2: rotate by sensor_angle
   * Stage 3: translate by offsets
   */
  private _sensorToRoom(
    tx: number,
    ty: number,
  ): { rx: number; ry: number } {
    // Stage 1: distortion correction
    const { cx, cy } = ld2450Correct(tx, ty);

    // Stage 2: clockwise rotation by sensor_angle
    const angle = this._sensorAngle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const rx = cx * cosA + cy * sinA;
    const ry = -cx * sinA + cy * cosA;

    // Stage 3: translation
    return {
      rx: rx + this._offsetX,
      ry: ry + this._offsetY,
    };
  }
```

- [ ] **Step 3: Add state properties for calibration**

Add these state properties alongside existing state declarations in the class:

```typescript
  @state() private _sensorAngle: number = 0;
  @state() private _offsetX: number = 0;
  @state() private _offsetY: number = 0;
```

- [ ] **Step 4: Update `_mapTargetToPercent` to use new signature**

The `_sensorToRoom()` signature changed (no longer takes `placement` and `bounds`). Update `_mapTargetToPercent()` to remove the `placement` parameter:

```typescript
  private _mapTargetToPercent(
    target: Target,
    mirrored: boolean,
    bounds: RoomBounds | null
  ): { x: number; y: number } {
    const tx = mirrored ? -target.x : target.x;
    const { rx, ry } = this._sensorToRoom(tx, target.y);

    if (bounds && bounds.far_y > 0 && bounds.right_x > bounds.left_x) {
      const xPercent =
        ((rx - bounds.left_x) / (bounds.right_x - bounds.left_x)) * 100;
      const yPercent = (ry / bounds.far_y) * 100;
      return { x: xPercent, y: yPercent };
    }

    const xPercent = (rx / 6000) * 100;
    const yPercent = (ry / 6000) * 100;
    return { x: xPercent, y: yPercent };
  }
```

Update all 3 call sites to remove the `placement` argument:
1. In `_getTargetStyle()`: change `this._mapTargetToPercent(target, this._mirrored, this._placement, this._roomBounds)` → `this._mapTargetToPercent(target, this._mirrored, this._roomBounds)`
2. In `_getWizardTargetStyle()`: change `this._mapTargetToPercent(target, this._wizardMirrored, this._wizardPlacement || "wall", null)` → `this._mapTargetToPercent(target, this._wizardMirrored, null)`
3. In the `.map()` call in the render method: change `this._mapTargetToPercent(t, this._wizardMirrored, this._wizardPlacement || "wall", this._wizardBounds)` → `this._mapTargetToPercent(t, this._wizardMirrored, this._wizardBounds)`

- [ ] **Step 5: Update `_markBoundsPoint` to capture raw coordinates**

Find `_markBoundsPoint()` (lines 447-496). The key change: capture raw sensor coordinates instead of pre-transformed ones. The bounds will be computed after all 3 points are captured.

Note: `_wizardMirrored` (line 86), `_setupStep` (line 82, type `SetupStep`), and `_wizardCapturedPoints` (line 88) are pre-existing properties. The existing `_wizardCapturedPoints` stores room-frame coords for mini-grid display and must continue to be maintained. Replace the method with:

```typescript
  private _markBoundsPoint(): void {
    const active = this._targets.find((t) => t.active);
    if (!active) return;

    const tx = this._wizardMirrored ? -active.x : active.x;

    switch (this._setupStep) {
      case "bounds_far":
        this._wizardRawPoints = [
          ...this._wizardRawPoints,
          { x: tx, y: active.y, label: "far" },
        ];
        this._setupStep = "bounds_left";
        break;
      case "bounds_left":
        this._wizardRawPoints = [
          ...this._wizardRawPoints,
          { x: tx, y: active.y, label: "left" },
        ];
        this._setupStep = "bounds_right";
        break;
      case "bounds_right": {
        this._wizardRawPoints = [
          ...this._wizardRawPoints,
          { x: tx, y: active.y, label: "right" },
        ];
        // All 3 points captured — compute calibration and bounds
        this._computeCalibrationFromBounds();
        this._setupStep = "preview";
        break;
      }
    }
  }
```

Note: The old code also populated `_wizardCapturedPoints` per step (for mini-grid display dots) and set `_wizardBounds` incrementally. The new approach computes everything in `_computeCalibrationFromBounds` after all 3 points are captured. The `_wizardCapturedPoints` display will only show all 3 dots at once (after the final step), which is acceptable since the preview step is when they matter most.

- [ ] **Step 6: Add `_computeCalibrationFromBounds` method**

Add a new method that computes the sensor angle and room bounds from the 3 captured raw points:

```typescript
  private _computeCalibrationFromBounds(): void {
    const farPt = this._wizardRawPoints.find((p) => p.label === "far");
    const leftPt = this._wizardRawPoints.find((p) => p.label === "left");
    const rightPt = this._wizardRawPoints.find((p) => p.label === "right");
    if (!farPt || !leftPt || !rightPt) return;

    // Apply distortion correction to all 3 raw points
    const far = ld2450Correct(farPt.x, farPt.y);
    const left = ld2450Correct(leftPt.x, leftPt.y);
    const right = ld2450Correct(rightPt.x, rightPt.y);

    // Compute sensor angle from the back wall (left-to-right line)
    const placement = this._wizardPlacement || "wall";
    let sensorAngle: number;
    if (placement === "left_corner" || placement === "right_corner") {
      // Back wall angle: atan2(dy, dx) where dy/dx is the wall direction
      sensorAngle = Math.atan2(
        right.cy - left.cy,
        right.cx - left.cx
      );
    } else {
      // Wall sensor: back point should be straight ahead
      sensorAngle = Math.atan2(far.cx, far.cy);
    }

    // Rotate all corrected points by the computed angle
    const cosA = Math.cos(sensorAngle);
    const sinA = Math.sin(sensorAngle);
    const rotate = (cx: number, cy: number) => ({
      rx: cx * cosA + cy * sinA,
      ry: -cx * sinA + cy * cosA,
    });

    const farR = rotate(far.cx, far.cy);
    const leftR = rotate(left.cx, left.cy);
    const rightR = rotate(right.cx, right.cy);

    // Derive room dimensions from rotated points
    const allX = [farR.rx, leftR.rx, rightR.rx];
    const allY = [farR.ry, leftR.ry, rightR.ry];
    let minX = Math.min(...allX);
    let maxX = Math.max(...allX);
    const roomWidth = maxX - minX;
    const roomDepth = Math.max(...allY);

    // Ensure left < right (user may have marked walls in reversed order)
    let leftX = leftR.rx;
    let rightX = rightR.rx;
    if (leftX > rightX) {
      [leftX, rightX] = [rightX, leftX];
    }

    // Compute offsets from placement
    let offsetX = 0;
    let offsetY = 0;
    if (placement === "right_corner") {
      offsetX = roomWidth;
    } else if (placement === "wall") {
      offsetX = roomWidth / 2;
    }

    // Update state
    this._sensorAngle = sensorAngle;
    this._offsetX = offsetX;
    this._offsetY = offsetY;

    // Compute room bounds in room frame
    this._wizardBounds = {
      far_y: roomDepth,
      left_x: 0,
      right_x: roomWidth,
    };
    this._roomBounds = { ...this._wizardBounds };

    // Populate _wizardCapturedPoints for mini-grid display
    this._wizardCapturedPoints = [
      { x: farR.rx + offsetX, y: farR.ry + offsetY },
      { x: leftR.rx + offsetX, y: leftR.ry + offsetY },
      { x: rightR.rx + offsetX, y: rightR.ry + offsetY },
    ];

    this._autoFillGrid();
  }
```

- [ ] **Step 7: Add `_wizardRawPoints` state**

Add a state property for storing raw captured points:

```typescript
  @state() private _wizardRawPoints: Array<{x: number; y: number; label: string}> = [];
```

Reset this array alongside `_wizardCapturedPoints` in these 2 locations:
1. In `_wizardGoToBounds()` (line ~443): add `this._wizardRawPoints = [];` next to the existing `this._wizardCapturedPoints = [];`
2. In `_changePlacement()` (line ~1158): add `this._wizardRawPoints = [];` next to the existing `this._wizardCapturedPoints = [];`

Also update the back button handlers (lines ~1418-1427, ~1493) to slice `_wizardRawPoints` alongside `_wizardCapturedPoints`:
```typescript
this._wizardRawPoints = this._wizardRawPoints.slice(0, -1);
```

- [ ] **Step 8: Update `_wizardFinish` to send calibration data**

In the `_wizardFinish` method (line ~498), add the `calibration` parameter to the `set_setup` WS call so the computed `sensor_angle` is persisted to the backend:

```typescript
      await this.hass.callWS({
        type: "everything_presence_pro/set_setup",
        entry_id: this._selectedEntryId,
        room_name: this._wizardRoomName.trim(),
        placement: this._wizardPlacement,
        mirrored: this._wizardMirrored,
        room_bounds: this._wizardBounds,
        calibration: { sensor_angle: this._sensorAngle },  // NEW
      });
```

Without this, every initial setup would store `sensor_angle = 0.0` on the backend, making the rotation stage ineffective.

- [ ] **Step 9: Load calibration from config**

Wherever the config is loaded from the WebSocket `get_config` response, add:

```typescript
    if (config.calibration) {
      this._sensorAngle = config.calibration.sensor_angle || 0;
      this._offsetX = config.calibration.offset_x || 0;
      this._offsetY = config.calibration.offset_y || 0;
    }
```

- [ ] **Step 10: Remove calibrate tool button**

Find the calibrate tool button by searching for `"calibrate"` in the toolbar section — it's a `<button>` with `@click` that sets the active tool to `"calibrate"`. Remove the button element. Also update the `Tool` type definition (search for `type Tool =`) to remove `"calibrate"`:

```typescript
type Tool = "room" | "outside" | "furniture" | "zone";
```

- [ ] **Step 11: Build the frontend**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout/frontend && npm run build`

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 12: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: replace _sensorToRoom with three-stage calibration pipeline in frontend"
```

---

### Task 7: Add recalibration UI to frontend panel

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Add recalibrate button to the panel toolbar**

Find the toolbar section where tool buttons are rendered. Add a recalibrate button (not a tool — a standalone action button):

```typescript
<button
  class="tool-btn"
  @click=${() => this._startRecalibration()}
>
  <ha-icon icon="mdi:compass-outline"></ha-icon>
  Recalibrate
</button>
```

- [ ] **Step 2: Add recalibration state**

```typescript
  @state() private _recalibrating: boolean = false;
```

- [ ] **Step 3: Implement `_startRecalibration` method**

```typescript
  private _startRecalibration(): void {
    this._recalibrating = true;
  }
```

- [ ] **Step 4: Add recalibration overlay UI**

In the render method, add a conditional overlay when `_recalibrating` is true:

```typescript
${this._recalibrating
  ? html`
    <div class="recalibrate-overlay">
      <p>Stand in the far corner and tap Mark</p>
      <button @click=${() => this._markRecalibration()}>Mark</button>
      <button @click=${() => { this._recalibrating = false; }}>Cancel</button>
    </div>
  `
  : nothing}
```

- [ ] **Step 5: Implement `_markRecalibration` method**

Note: This uses `this._mirrored` (the runtime mirror property, line 93), not `_wizardMirrored` (which is only for the setup wizard).

```typescript
  private async _markRecalibration(): Promise<void> {
    const active = this._targets.find((t) => t.active);
    if (!active) return;

    const tx = this._mirrored ? -active.x : active.x;
    const bounds = this._roomBounds;
    if (!bounds || !bounds.far_y || !bounds.right_x) return;

    const roomWidth = bounds.right_x - bounds.left_x;
    const roomDepth = bounds.far_y;
    const placement = this._placement;

    // Determine expected room position of the reference corner
    let expectedX: number;
    let expectedY: number;
    if (placement === "left_corner") {
      expectedX = roomWidth;
      expectedY = roomDepth;
    } else if (placement === "right_corner") {
      expectedX = 0;
      expectedY = roomDepth;
    } else {
      expectedX = roomWidth / 2;
      expectedY = roomDepth;
    }

    // Send recalibrate command and update local state
    try {
      await this.hass.callWS({
        type: "everything_presence_pro/recalibrate",
        entry_id: this._selectedEntryId,
        sensor_x: tx,
        sensor_y: active.y,
        expected_room_x: expectedX,
        expected_room_y: expectedY,
      });
      // Recompute local sensor angle to match what the backend computed
      const { cx, cy } = ld2450Correct(tx, active.y);
      const sensorFrameAngle = Math.atan2(cx, cy);
      const roomFrameAngle = Math.atan2(
        expectedX - this._offsetX,
        expectedY - this._offsetY,
      );
      this._sensorAngle = sensorFrameAngle - roomFrameAngle;
    } catch (e) {
      console.error("Recalibration failed:", e);
    }

    this._recalibrating = false;
  }
```

- [ ] **Step 6: Build the frontend**

Run: `cd /workspaces/ha-dev/everythingpro/.worktrees/layout/frontend && npm run build`

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 7: Verify recalibration flow**

Search the built output for the recalibrate overlay and WS message type to confirm they're included:

Run: `grep -c "recalibrate-overlay" /workspaces/ha-dev/everythingpro/.worktrees/layout/frontend/src/everything-presence-pro-panel.ts && grep -c "everything_presence_pro/recalibrate" /workspaces/ha-dev/everythingpro/.worktrees/layout/frontend/src/everything-presence-pro-panel.ts`

Expected: Both counts are >= 1, confirming the overlay and WS command are present.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: add one-click recalibration UI to panel"
```

---

### Task 8: Update diagnostic tool with corrected view toggle

**Files:**
- Modify: `tools/sensor-diagnostic.html`

- [ ] **Step 1: Add the correction function to the diagnostic tool**

In the JavaScript section, after the constants, add:

```javascript
// LD2450 distortion correction — MUST match _SCALE_FACTOR in calibration.py
// Copy value from Task 1 output (same as calibration.py and panel.ts)
const LD2450_SCALE_FACTOR = 0.0; // PLACEHOLDER — replace with value from derive_scale_factor.py

function ld2450Correct(x, y) {
  if (x === 0 && y === 0) return { cx: 0, cy: 0 };
  const angle = Math.atan2(x, y);
  const distance = Math.sqrt(x * x + y * y);
  const correctedAngle = angle * LD2450_SCALE_FACTOR;
  return {
    cx: distance * Math.sin(correctedAngle),
    cy: distance * Math.cos(correctedAngle),
  };
}
```

Set `LD2450_SCALE_FACTOR` to the same value as everywhere else.

- [ ] **Step 2: Add a "Show corrected" toggle to the controls**

In the controls section, add:
```html
<label><input type="checkbox" id="ctl-corrected" /> Show corrected</label>
```

- [ ] **Step 3: Update raw canvas to optionally show corrected coordinates**

In `drawRawCanvas()`, when plotting target dots, check the toggle and apply correction:

```javascript
const showCorrected = document.getElementById('ctl-corrected').checked;
// When plotting:
let px = t.x, py = t.y;
if (showCorrected) {
  const c = ld2450Correct(t.x, t.y);
  px = c.cx;
  py = c.cy;
}
```

- [ ] **Step 4: Verify the HTML loads**

Open `tools/sensor-diagnostic.html` in a browser (or use `python -m http.server` from the tools directory). Verify:
- The page loads without JavaScript console errors
- The "Show corrected" checkbox appears in the controls section
- Toggling the checkbox does not crash the page (functional testing with a live sensor can be deferred)

- [ ] **Step 5: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "feat: add corrected view toggle to diagnostic tool"
```

# Sensor calibration system

## Problem

The LD2450 mmWave sensor reports target positions in Cartesian coordinates (mm), but these coordinates do not correspond to physical room positions. Diagnostic testing reveals:

1. **Non-linear distortion** — The sensor's Cartesian output is derived internally from polar measurements (angle + distance). The angle estimation has systematic error that grows at wider angles from centerline. In a 3.5m x 4.45m room, corner errors range from 2m to 3.6m.
2. **Unknown sensor angle** — The sensor is mounted at approximately 45 degrees in a corner, but the exact angle is uncertain and can change if someone bumps or cleans the sensor. A 10-degree error drastically changes target positioning.
3. **No recalibration path** — If the sensor is moved, there's no way to correct the mapping without redoing the entire room setup.

The current code has two incomplete solutions:
- `_sensorToRoom()` in the frontend: hardcodes 45-degree rotations per placement type. Does not correct distortion.
- `CalibrationTransform` in `calibration.py`: 6-parameter affine transform. Backend is complete but the frontend UI is a non-functional stub.

## Solution

A three-stage transform pipeline that separates universal chip correction from per-installation calibration, plus a one-click recalibration flow.

## Coordinate systems and conventions

**Sensor frame:** Origin at sensor. X axis points right (positive) / left (negative). Y axis points forward (away from sensor, always positive). Units: millimeters. Angles measured from the Y axis (sensor forward): `angle = atan2(x, y)`, so 0° is straight ahead, positive angles are to the right, negative to the left.

**Room frame:** Origin at top-left corner of the room rectangle. X axis points right (positive). Y axis points down/away from the sensor wall (positive). Units: millimeters. This matches the existing grid coordinate system.

**Rotation convention:** `sensor_angle` is the clockwise rotation from the sensor's forward axis (Y) to the room's Y axis. For a left-corner sensor at 45°, `sensor_angle ≈ +0.785 rad` (positive = clockwise). For a right-corner sensor at 45°, `sensor_angle ≈ -0.785 rad`. For a wall sensor pointed straight, `sensor_angle ≈ 0`.

## Architecture

### Transform pipeline

```
Raw LD2450 (x, y) in mm
  → Stage 1: ld2450_correct(x, y) → (cx, cy)       [sensor frame, corrected]
  → Stage 2: rotate(cx, cy, sensor_angle) → (rx, ry) [room-aligned, sensor origin]
  → Stage 3: translate(rx, ry, offset_x, offset_y) → (room_x, room_y) [room frame]
```

### Stage 1: Built-in LD2450 distortion correction

A pure function with no parameters or state. Same correction for every unit — the LD2450's distortion is a chip characteristic, not manufacturing variance.

**Algorithm:**
1. Convert Cartesian to polar: `angle = atan2(x, y)`, `distance = sqrt(x² + y²)`
2. Apply angle correction: `true_angle = angle * SCALE_FACTOR`
3. Convert back to Cartesian: `cx = distance * sin(true_angle)`, `cy = distance * cos(true_angle)`

Note: `atan2(x, y)` (not `atan2(y, x)`) because in the sensor frame, angle is measured from the Y axis (forward), with X as the lateral component.

**Deriving the correction (separating distortion from sensor angle):**

The distortion and sensor angle are separable because:
- Distortion is symmetric about the sensor's centerline (0°) — the LD2450's antenna pattern is symmetric
- Sensor angle is a uniform rotation of all points

To derive the correction from the diagnostic data:

1. Start with the 4 captured corners in sensor space and the known room dimensions (3500mm x 4450mm)
2. For each corner, compute the reported polar angle: `reported_angle = atan2(sensor_x, sensor_y)`
3. The sensor angle is estimated from the near-left corner (closest to sensor, minimal distortion): `est_sensor_angle = atan2(-79, 243) ≈ -18.0°`. Since near-left is the corner the sensor is in, its expected room-frame angle is `atan2(0, 0)` — but since we're AT the sensor, we use the far-right corner for angle reference instead: `est_sensor_angle = reported_angle_far_right - expected_room_angle_far_right` where `expected_room_angle_far_right = atan2(room_width, room_depth) = atan2(3500, 4450) ≈ 38.2°`
4. With the estimated sensor angle, compute expected sensor-frame angles for all 4 corners by subtracting the sensor angle from their room-frame angles
5. The ratio `reported_angle / expected_angle` at each corner gives the scale factor. Average the absolute values (exploiting symmetry) to get `SCALE_FACTOR`
6. Validate: after correction, the 4 corners should form a much closer rectangle

**Diagnostic data:**

| Corner | Sensor (x, y) | Reported angle | Distance |
|--------|---------------|----------------|----------|
| Near-left | (-79, 243) | -18.0° | 256mm |
| Near-right | (2250, 1908) | 49.7° | 2951mm |
| Far-right | (401, 5012) | 4.6° | 5028mm |
| Far-left | (-2818, 2283) | -51.0° | 3627mm |

The exact `SCALE_FACTOR` will be computed during implementation by fitting to this data. Expected value is approximately 0.75-0.80 (reported angles are ~25% wider than true angles).

This function is written with no dependencies so it can be ported to ESP32 firmware later.

### Stage 2: Rotation

Clockwise rotation by `sensor_angle` (radians). Using the convention that positive `sensor_angle` = clockwise:

```
rx = cx * cos(sensor_angle) + cy * sin(sensor_angle)
ry = -cx * sin(sensor_angle) + cy * cos(sensor_angle)
```

After rotation, coordinates are aligned with the room axes but still have origin at the sensor.

### Stage 3: Translation

Shift origin from sensor position to room origin (top-left corner at 0, 0):

```
room_x = rx + offset_x
room_y = ry + offset_y
```

Offsets depend on placement and room bounds:
- **Left corner:** sensor is at room (0, 0), so `offset_x = 0`, `offset_y = 0`
- **Right corner:** sensor is at room (room_width, 0), so `offset_x = room_width`, `offset_y = 0` where `room_width = right_x - left_x` from bounds
- **Wall (center):** sensor is at room (room_width / 2, 0), so `offset_x = room_width / 2`, `offset_y = 0` where `room_width = right_x - left_x` from bounds

### Config storage

```python
"calibration": {
    "sensor_angle": 0.785,   # radians (positive = clockwise)
    "offset_x": 0.0,         # mm
    "offset_y": 0.0,         # mm
}
```

Room bounds continue to be stored separately in the existing `room_bounds` config key. Bounds are stored in **room-frame coordinates** (post-transform), as they represent physical room dimensions.

The existing `CalibrationTransform` (6-parameter affine) is removed. No backward compatibility needed — still in development.

### Resolving the boundary capture chicken-and-egg

The existing bounds wizard captures 3 points by having the user walk to boundary positions. Currently these are transformed via `_sensorToRoom()` before storage. The new approach:

1. During the bounds wizard, the system captures **raw sensor coordinates** for each boundary point
2. The final boundary point (far-right for left-corner, far-left for right-corner, center-back for wall) is used as the **angle reference point**
3. The system computes `sensor_angle` from this reference point (see "Angle computation" below)
4. All captured raw points are then run through the full pipeline (correct → rotate → translate) to produce room-frame bounds
5. Room-frame bounds are stored in config as `room_bounds`

This resolves the dependency: raw points are captured first, then the angle is derived, then bounds are computed. No circularity.

### Angle computation

**During initial setup (no known room dimensions yet):**

The 3 boundary points (after distortion correction) form a pattern that encodes the sensor angle. For a corner sensor, the far-left and far-right corrected points define two edges of the room. The angle of the line between them (relative to the sensor X axis) gives the sensor rotation. Specifically:

1. Apply distortion correction to all 3 raw boundary points
2. For a left-corner sensor: the far-left and far-right corrected points span the back wall. The angle of the back wall relative to the sensor X axis is: `wall_angle = atan2(cy_right - cy_left, cx_right - cx_left)`. The sensor angle is `sensor_angle = wall_angle` (since the back wall should be perpendicular to the room Y axis).
3. For a wall sensor: the back-wall point should be straight ahead, so `sensor_angle ≈ atan2(cx_back, cy_back)` (should be near 0).

**During recalibration (room dimensions already known):**

Given a single reference point with known room-frame position:

1. Apply distortion correction to raw coords: `(cx, cy) = ld2450_correct(raw_x, raw_y)`
2. Compute the angle from sensor to point in corrected sensor frame: `sensor_frame_angle = atan2(cx, cy)`
3. Compute the angle from sensor to point in room frame: `room_frame_angle = atan2(expected_room_x - offset_x, expected_room_y - offset_y)`
4. The sensor angle is the difference: `sensor_angle = sensor_frame_angle - room_frame_angle`

### Initial setup flow

The standard setup requires no manual entry of dimensions or angles. Everything is derived from walking.

1. User selects placement (wall / left corner / right corner)
2. User walks to 3 boundary points as today (back wall, far left, far right) — **raw sensor coordinates** captured at each step
3. System applies LD2450 distortion correction to all 3 raw points
4. System computes `sensor_angle`: the corrected boundary points define the room rectangle's orientation relative to the sensor. For a corner sensor, the angle between the two near-wall points (far-left and far-right) gives the rotation. For a wall sensor, the back-wall point is straight ahead so `sensor_angle ≈ 0`.
5. System rotates all corrected points by the computed angle to get room-aligned coordinates
6. Room dimensions are derived from the rotated points: `room_width = max_x - min_x`, `room_depth = max_y`
7. Offsets computed from placement type
8. All parameters stored in config (sensor_angle, offsets, room_bounds)

No manual dimension entry, no angle input. Power users who want to fine-tune can manually edit dimensions or recalibrate after the fact.

### One-click recalibration

After the sensor is bumped or moved:

1. User taps "Recalibrate" in the panel UI
2. UI prompts: "Stand in the far corner and tap Mark"
   - Left-corner sensor → stand in far-right corner (room position: width, depth)
   - Right-corner sensor → stand in far-left corner (room position: 0, depth)
   - Wall sensor → stand at center of back wall (room position: width/2, depth)
3. System reads the target's **raw sensor coordinates**, applies distortion correction → (cx, cy)
4. Computes new sensor angle:
   ```
   sensor_angle = atan2(cx, cy) - atan2(expected_room_x - offset_x, expected_room_y - offset_y)
   ```
   where `expected_room_x/y` are the known room-frame coordinates of the reference corner, and `offset_x/y` are the existing offsets (unchanged since the sensor is still in the same corner, just rotated)
5. Updates `sensor_angle` in config. Room bounds, offsets, and distortion correction unchanged.

One person, one corner, one click. Works for all placement types.

## Files changed

### `calibration.py`
- Add `ld2450_correct(x: float, y: float) -> tuple[float, float]` — pure distortion correction function
- Add `SensorTransform` class:
  - `__init__(sensor_angle, offset_x, offset_y)` — holds the 3 pipeline parameters
  - `apply(x, y) -> tuple[float, float]` — runs full pipeline (correct → rotate → translate)
  - `recalibrate(raw_sensor_x, raw_sensor_y, expected_room_x, expected_room_y)` — recomputes angle from a single reference point. All inputs clearly named: raw sensor coords and expected room-frame coords.
  - `to_dict() / from_dict()` — serialization
- Remove `CalibrationTransform` class and `CalibrationPoint` dataclass

### `coordinator.py`
- Replace `self._calibration` (`CalibrationTransform`) with `self._sensor_transform` (`SensorTransform`)
- `_rebuild_targets()` calls `self._sensor_transform.apply()` instead of `self._calibration.apply()`
- `set_calibration()` replaced by methods to set transform parameters
- `load_config_data()` / `get_config_data()` updated for new calibration dict format

### `websocket_api.py`
- Replace `everything_presence_pro/set_calibration` with `everything_presence_pro/recalibrate`
  - Takes: `entry_id`, `sensor_x`, `sensor_y`, `expected_room_x`, `expected_room_y`
  - `sensor_x/y` are raw sensor coordinates; `expected_room_x/y` are room-frame coordinates
  - Calls `coordinator.sensor_transform.recalibrate()`
  - Persists updated config
- `set_setup` handler: compute `sensor_angle` and offsets from bounds points during initial setup
- `get_config` response: include calibration parameters

### Frontend panel TypeScript
- Replace `_sensorToRoom()` switch/case with equivalent 3-stage pipeline
- Port `ld2450_correct()` to TypeScript (must produce identical results — validate with shared test vectors: at minimum the 4 diagnostic corner points)
- Add "Recalibrate" button/flow to the panel UI
- Remove calibrate tool stub (the non-functional button)
- Bounds capture: store raw sensor coords, compute angle, then derive room-frame bounds

### `tools/sensor-diagnostic.html`
- Keep for ongoing testing and future recalibration validation
- Optionally add toggle to show corrected vs raw coordinates

### Tests
- Unit tests for `ld2450_correct()` using the 4 diagnostic corner points as test vectors
- Unit tests for `SensorTransform.apply()` end-to-end
- Unit tests for `SensorTransform.recalibrate()` — verify angle recomputation
- Same test vectors used for TypeScript validation

### Files not changed
- Config flow — no changes to initial integration setup
- Zone engine — receives room coordinates as before
- Sensors — no changes

## Data flow

```
LD2450 sensor (10 Hz)
  → ESPHome firmware (raw x, y, active per target)
    → aioesphomeapi (coordinator.py)
      → ld2450_correct() — chip distortion correction [sensor frame]
        → rotate(sensor_angle) — align to room axes [room-aligned, sensor origin]
          → translate(offset_x, offset_y) — shift to room origin [room frame]
            → Room coordinates (mm)
              → Zone engine (presence detection)
              → WebSocket → Frontend panel (live grid display)
```

## Future considerations

- **Firmware port:** `ld2450_correct()` is designed as a pure function so it can be moved to ESPHome C++ firmware later, correcting coordinates before they leave the ESP32.
- **Multi-unit validation:** The built-in correction is initially derived from a single unit. If future units show different distortion, the correction function can be updated or parameterized.
- **Power-user affine override:** If needed, a full affine transform can be re-added as an alternative to the standard pipeline.
- **Firmware configuration:** The ESP32 firmware accepts configuration parameters (e.g., zone polygons). The distortion correction could potentially be sent as a firmware parameter rather than hardcoded.

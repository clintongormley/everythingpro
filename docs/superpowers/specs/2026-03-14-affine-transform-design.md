# Affine transform from corner calibration

## Context

The LD2450 radar sensor has accurate range but noisy/distorted angles. Polar corrections (angle_scale, range_scale, rotation) don't have enough degrees of freedom to map sensor readings to room coordinates accurately. An affine transform computed from 4 known corner positions can absorb rotation, scale, shear, and translation in one step.

## Design

### Overview

Replace the polar fit in the Mark corners tab with a 2D affine transform. The transform maps raw sensor coordinates directly to room coordinates, bypassing the existing three-stage pipeline (ld2450Correct → rotate → translate).

### Math

Affine transform: `[rx, ry] = [[a, b], [c, d]] × [sx, sy] + [ex, ey]`

6 unknowns: a, b, c, d, ex, ey. 4 corners provide 8 equations (x and y for each). Solved with least-squares by minimizing `Σ(predicted - known)²`.

The least-squares system in matrix form:

```
For each corner i with sensor coords (sx_i, sy_i) and known room coords (rx_i, ry_i):
  a * sx_i + b * sy_i + ex = rx_i
  c * sx_i + d * sy_i + ey = ry_i
```

This is two independent 3-parameter least-squares problems:
- Solve [a, b, ex] from the x equations
- Solve [c, d, ey] from the y equations

Each is a standard `A x = b` least-squares: `x = (AᵀA)⁻¹ Aᵀb` where A is the Nx3 matrix of `[sx_i, sy_i, 1]` rows.

If `AᵀA` is singular (corners are collinear), display an error: "Corners are collinear — cannot compute affine transform. Ensure corners form a quadrilateral."

### Corner-to-room mapping

The 4 corners in room coordinates are the room rectangle, independent of sensor placement. The affine transform absorbs the sensor's position, rotation, and any distortion.

Room corners (same for all placements):
- Corner 0 (near-left): (0, 0)
- Corner 1 (near-right): (width, 0)
- Corner 2 (far-right): (width, depth)
- Corner 3 (far-left): (0, depth)

The user marks corners in this order (same as existing workflow). The sensor coordinates from `markedCorners[0..3]` pair with these room coordinates. The affine transform maps between the two coordinate systems, naturally absorbing the sensor's placement, rotation, and distortion.

### Changes to Mark corners tab

**Compute step**: After all 4 corners are marked, clicking Compute (or auto-computing):
1. Collects the 4 raw sensor positions from `markedCorners[]`
2. Sets room corners to (0,0), (width,0), (width,depth), (0,depth) using entered room dimensions
3. Solves the least-squares affine fit
4. Stores the result in `affineTransform = { a, b, c, d, ex, ey }`
5. Displays:
   - The affine matrix parameters
   - Residual error table in room space: for each corner, shows known room (x, y), predicted room (x, y), and error in mm. Predicted = affine transform applied to the sensor reading.

**UI changes**:
- Remove: polar fit params display, angle/range ratio table, corrected error table with polar corrections
- Add: affine matrix display, residual error table (room-space columns)
- The "Apply" button sets `affineTransform` to the computed value (it's computed into a local variable first, then Apply commits it). This makes the Explore tab's room view immediately use the affine path.

### Changes to Explore tab / sensorToRoom()

`sensorToRoom(sx, sy, placement, bounds)` gains a new path at the top: if `affineTransform` is set, apply the matrix directly to raw sensor coordinates and return. Skip ld2450Correct(), rotation, and placement translation entirely.

```javascript
if (affineTransform) {
  const rx = affineTransform.a * sx + affineTransform.b * sy + affineTransform.ex;
  const ry = affineTransform.c * sx + affineTransform.d * sy + affineTransform.ey;
  return { rx, ry };
}
```

Note: the function parameters are renamed from `tx, ty` to `sx, sy` to avoid confusion with the affine translation components.

When the affine transform is active, the angle/range/rotation sliders and "Show corrected" / "Use fitted curve" checkboxes are visually greyed out with a label "Using affine calibration" to indicate they're bypassed.

### State

- `affineTransform`: `null | { a, b, c, d, ex, ey }` — module-level variable, null until Apply is clicked
- `markedCorners[]`: unchanged — still stores raw sensor positions for each corner
- `fittedAngleCoeffs`, `fittedRangeCoeffs`: still exist for polar fit from grid calibration, but affine takes priority when set

### Priority

When `affineTransform` is set, it takes priority over all other corrections (polar fit, sliders). A "Clear affine" button in the Mark corners results section resets `affineTransform = null` to fall back to slider/polar behavior.

### File changes

Only `tools/sensor-diagnostic.html` is modified.

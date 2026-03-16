# Grid calibration mode for sensor diagnostic tool

## Context

The LD2450 radar sensor reports accurate range (confirmed by arc calibration) but may have angle-dependent distortion. Corner calibration revealed significant angle errors (`angle_scale = 0.87 + 0.33 * |theta|`) but only uses 4 data points. A grid calibration mode lets the user measure sensor accuracy at many known positions across the FOV, providing enough data for a reliable angle correction fit.

## Design

### New tab

A fourth tab "Grid calibration" in the diagnostic tool toolbar, alongside Explore, Mark corners, and Arc calibration. Follows the existing layout pattern: canvas on the left, controls on the right.

### Grid setup controls

- **X range**: min and max in meters (default -3 to 3)
- **Y range**: min and max in meters (default 1 to 5)
- **Spacing**: meters (default 1)
- **Generate button**: creates grid points, filtering out any that fall outside the 120-degree FOV. If grid points already exist with recorded data, clicking Generate clears all data and regenerates (no confirmation — data collection is quick to redo). If a recording is in progress, Generate cancels it first (`clearTimeout(gridRecordingTimer)`, resets recording state).
- **Target selector**: dropdown to choose which target (T1/T2/T3) to track

### Units

Grid controls use meters for user input. Internally, all coordinates are stored in **millimeters** to match the existing tool conventions (`raw_x`, `raw_y`, `MAX_RANGE` are all mm). Grid point `{x, y}` and `measured.{x, y}` are in mm. Conversion happens at the UI boundary: user enters meters, code multiplies by 1000.

### Grid point generation

Cartesian grid aligned to the sensor coordinate system (x = lateral, y = forward). Points are generated at every spacing interval within the x/y ranges. Points outside the 120-degree FOV (`|atan2(x, y)| > 60 degrees`) are excluded.

### Recording workflow

1. Grid points are ordered in serpentine pattern: first row (lowest y) traverses x from xMin to xMax; second row reverses xMax to xMin; alternating thereafter. This minimizes walking distance.
2. The current target point is highlighted on the canvas (pulsing blue circle) with a label showing the expected position.
3. User stands at the point and clicks **Record**.
4. Sample collection uses the render loop: each animation frame, if the tracked target is active, its `raw_x`/`raw_y` is pushed to `gridSamples` (skipping consecutive duplicates where both raw_x and raw_y match the previous sample). A `setTimeout(5000)` fires to end collection.
5. During recording, a progress bar shows elapsed time (0-5s) and sample count.
6. After 5 seconds, the averaged position (`mean(raw_x)`, `mean(raw_y)`) is stored in the grid point's `measured` field. If fewer than 5 unique samples were collected, the recording is rejected with a message ("Not enough readings — ensure you're detected by the sensor") and the point stays pending.
7. Auto-advances to next unrecorded point.
8. User can click any grid point on the **canvas** to select it as the current target (no separate list UI — the canvas is the navigation). Canvas hit-testing: click within 15px of a grid point's canvas position.
9. A **Skip** button advances to the next point without recording.

### Canvas display

Reuses `drawFovAndRings()` for the FOV wedge and range rings. Overlays:

- **Pending points**: grey circles at known grid positions, labeled with coordinates
- **Current target**: pulsing blue circle with label showing the expected (x, y) in meters
- **Recorded points**: green circles at known position, with small red line to measured position (error vector shown incrementally as points are recorded)
- **Live target dot**: real-time sensor reading with distance/angle readout (same as arc mode)

Error vectors are always visible on recorded points — they don't require clicking Compute. Compute adds the analysis tables and fit, not the visual vectors.

### Analysis

Triggered by a **Compute** button (available once at least 3 points are recorded). Produces:

#### Error table

| Known X | Known Y | Meas X | Meas Y | Range err (mm) | Angle err (deg) |
|---------|---------|--------|--------|----------------|-----------------|

All values in mm (X/Y columns) or degrees (angle column). For each recorded point:
- Known angle = `atan2(known_x, known_y)`, known range = `sqrt(x^2 + y^2)`
- Measured angle = `atan2(meas_x, meas_y)`, measured range = `sqrt(x^2 + y^2)`
- Range error = measured range - known range
- Angle error = measured angle - known angle (in degrees)

#### Fitted corrections

Same linear model as corner calibration:
- `angle_scale(|theta|) = a0 + a1 * |theta|`
- `range_scale(|theta|) = r0 + r1 * |theta|`

Fitting uses all recorded points. For each point, the correction factors are:
- On-axis points (`|measured_angle| < 0.01 rad`): excluded entirely from the angle fit data set (not pushed to fitting array). They provide no angle information.
- Otherwise: `angle_ratio = known_angle / measured_angle`
- `range_ratio = known_range / measured_range`

Linear least-squares fit of these ratios against `|measured_angle|`.

#### Corrected error table

Shows residual error after applying the fitted correction to each measured position. Columns:

| Known X | Known Y | Corrected X | Corrected Y | Range err (mm) | Angle err (deg) |

Corrected position is computed by applying `angle_scale` and `range_scale` to the measured angle/range, then converting back to x/y. The error columns show the difference between the corrected position and the known position.

#### Actions

- **Apply to Explore**: sets `fittedAngleCoeffs` and `fittedRangeCoeffs` globals with the fit parameters `[a0, a1]` and `[r0, r1]`, and also sets the slider values (`ctl-scale`, `ctl-range`) to the fit evaluated at the median `|theta|` of the recorded points. Same mechanism as the existing `btn-apply-fit` handler in Mark corners.
- **Export JSON**: copies all raw measurements, grid config, errors, and fit parameters to clipboard.

### State

All grid calibration state is held in module-level variables (same pattern as arc calibration):
- `gridPoints`: array of `{x, y, measured: null | {x, y}, status: 'pending' | 'recording' | 'recorded'}` — x, y in mm
- `gridCurrentIndex`: index of current target point
- `gridSamples`: array of `{x, y}` samples being collected during a 5-second recording
- `gridRecordingStart`: timestamp when recording began (for progress bar)
- `gridRecordingTimer`: setTimeout ID for the 5-second cutoff
- `gridConfig`: `{xMin, xMax, yMin, yMax, spacing}` — stored in mm, used for regeneration and export

### Render loop integration

`renderLoop()` gains a `currentMode === 'grid'` branch that calls `drawGridCanvas()` and, if recording is active, `gridRecordFrame()`. This mirrors the existing arc calibration pattern where `renderLoop()` dispatches to `drawArcCanvas()` and `arcRecordFrame()`.

### File changes

Only `tools/sensor-diagnostic.html` is modified. No backend changes needed — grid calibration uses the same raw_x/raw_y target events already being sent via websocket.

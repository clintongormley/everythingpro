# Sensor coordinate diagnostic tool

## Problem

The Everything Presence Pro's LD2450 mmWave sensor reports target positions in millimeters relative to the sensor origin, but:

1. **Coordinate distortion** — The LD2450 has known non-linearity, especially at wider angles. Walking along a straight wall may produce a curved path in the sensor's coordinate space.
2. **Angle sensitivity** — The sensor is mounted in a corner at approximately 45 degrees, but the exact angle is uncertain. A 10-degree error drastically changes where targets map in room space.
3. **No diagnostic visibility** — There's currently no way to see the raw sensor output vs the room-transformed output side by side to understand what's happening.

The existing calibration system (affine transform in `calibration.py`) was built but the UI is non-functional — clicking it does nothing. Before designing a proper calibration solution, we need to understand the actual distortion characteristics.

## Solution

A throwaway standalone HTML diagnostic tool with two modes:

1. **Explore mode** — Two-panel live view for free-roaming observation
2. **Mark corners mode** — Guided 4-corner capture to quantify distortion

## Architecture

### Single file, no dependencies

One HTML file at `tools/sensor-diagnostic.html`. Contains all HTML, CSS, and JS inline. No build step, no framework, no external dependencies. Opens directly in any browser.

### Connection

On load, a form collects:
- **HA URL** (default: `http://homeassistant.local:8123`)
- **Long-lived access token** (created from HA profile page: Settings > People > user > Long-lived access tokens)
- **Config entry ID** (text input — paste from HA URL or integration page)

Derives WebSocket URL from the HA URL scheme (`http` → `ws`, `https` → `wss`), connects to `<ws-url>/api/websocket`.

### WebSocket protocol

HA's WebSocket API requires a specific handshake:

1. Connect — server sends `{"type": "auth_required"}`
2. Authenticate — send `{"type": "auth", "access_token": "<token>"}`
3. Server responds `{"type": "auth_ok"}` or `{"type": "auth_invalid"}`
4. Each subsequent command requires an incrementing `id` field

**Subscribe to targets:**
```json
{"id": 1, "type": "everything_presence_pro/subscribe_targets", "entry_id": "<entry_id>"}
```
Response: initial `{"id": 1, "type": "result", "success": true}`, then ongoing events:
```json
{"id": 1, "type": "event", "event": {"targets": [{"x": 1234, "y": 3456, "active": true}, ...]}}
```
The `targets` array always contains 3 entries (one per LD2450 tracking slot). Inactive targets have `active: false`.

**Get config:**
```json
{"id": 2, "type": "everything_presence_pro/get_config", "entry_id": "<entry_id>"}
```
Response includes (among other fields):
- `placement` — `"wall"`, `"left_corner"`, or `"right_corner"`
- `mirrored` — boolean
- `room_bounds` — `{"far_y": <mm>, "left_x": <mm>, "right_x": <mm>}`
- `room_name` — string

### Rendering

Plain Canvas 2D API with `requestAnimationFrame` loop. No state persistence — closing the page loses everything.

## Explore mode

### Left panel: raw sensor view

- Draws the 120-degree FOV wedge from sensor origin (top center of canvas), Y extending downward (away from sensor)
- Scale: 6000mm max range fits canvas height
- Up to 3 target dots plotted at raw (x, y) mm coordinates
- Color-coded: target 1 = blue, target 2 = green, target 3 = orange
- Only active targets shown
- **Trails:** Each target leaves a fading trail of its last ~100 positions. Trail dots shrink and fade over time. "Clear trail" button resets.
- **Readout:** Below the canvas, current raw coordinates for each active target: `T1: x=1234mm, y=3456mm`

### Right panel: room view

- Draws the room as a rectangle based on saved bounds (`far_y`, `left_x`, `right_x`) or a default 6m x 6m if no bounds saved
- Applies the same `_sensorToRoom()` transform logic from the panel frontend:
  - **Wall placement:** `sensorX = (left_x + right_x) / 2`, then `rx = sensorX + tx`, `ry = ty`
  - **Left corner:** `rx = ty * sin45 + tx * sin45`, `ry = ty * sin45 - tx * sin45` (where sin45 = 0.7071)
  - **Right corner:** `wallWidth = right_x - left_x`, then `rx = wallWidth - ty * sin45 + tx * sin45`, `ry = ty * sin45 + tx * sin45`
- Mirroring applied before transform if enabled (`tx = -tx`)
- Same trailing behavior as left panel for shape comparison

### Controls (between panels)

- Placement selector: wall / left_corner / right_corner
- Mirror toggle
- Manual room dimension inputs (width, depth in meters) or "Use saved" button to load from config

## Mark corners mode

### Purpose

Quantify distortion by capturing 4 known room corners and comparing sensor positions to ideal positions.

### UI

Same left panel (raw sensor view) with an overlay for the marking workflow.

### Target selector

Since multiple people may be in the room, a "Use Target 1 / 2 / 3" selector (or numbered dot highlights) lets the user pick which target is them before marking.

### Steps

1. "Stand in corner 1 (near-left). Click Mark when steady." — captures current selected target position
2. "Stand in corner 2 (near-right). Click Mark."
3. "Stand in corner 3 (far-right). Click Mark."
4. "Stand in corner 4 (far-left). Click Mark."

### Result visualization

After marking all 4 corners:
- **Red polygon:** The 4 points as the sensor saw them (raw coordinates)
- **Blue rectangle:** An ideal rectangle using entered room dimensions (width x depth). If no dimensions entered, uses the bounding box of the 4 marked points as a rough approximation.
- **Distortion arrows:** Lines from each red point to its corresponding blue corner, showing direction and magnitude of error
- **Summary table:** Each corner's raw coords, ideal coords, and error in mm

### Controls

- "Redo corner N" button to re-mark any single corner
- Optional room dimension inputs (width x depth in meters) for accurate ideal rectangle
- "Reset all" to start over

## Data flow

```
LD2450 sensor (10Hz)
  → ESPHome firmware
    → aioesphomeapi (coordinator.py)
      → subscribe_targets websocket (websocket_api.py)
        → diagnostic tool (WebSocket client)
          → Canvas rendering (explore or mark corners mode)
```

The tool reads only — it does not write any configuration or state.

## What this is NOT

- Not a calibration tool (that comes later, informed by what we learn here)
- Not part of the integration UI (standalone throwaway file)
- Not persisted (no saves, no config changes)
- Not production code (no tests, no error handling beyond basic connection feedback)

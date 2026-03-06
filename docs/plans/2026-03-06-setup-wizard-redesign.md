# Setup wizard redesign

## Problem

The current wizard captures sensor placement and room bounds, but coordinates are stored in sensor-native space. This means the room layout (grid cells, zones, furniture) is tied to a specific sensor placement and can't be reused if the sensor is repositioned.

## Design decisions

- **Approach B (transform at capture time)**: all persisted coordinates are in room space. The sensor→room transform is applied to bounds at capture time and to live targets at display time.
- **Grid = physical room**: the 20×16 grid represents the room viewed from above. Sensor position on the grid matches its physical location.
- **Room layout survives placement changes**: room cells, zones, and furniture are stored in room-space grid coordinates. Re-running the wizard only changes placement, orientation, and bounds.

## Room coordinate system

- Origin: left corner of the sensor wall (where wall meets left wall)
- X axis: left → right along the sensor wall (mm)
- Y axis: perpendicular to sensor wall, into the room (mm)
- Units: millimeters

### Sensor → room transform

Mirror is applied first: `tx = mirrored ? -sensor_x : sensor_x`

**Wall** (sensor at wall center, facing 90° into room):
```
room_x = sensor_wall_x + tx
room_y = sensor_y
```
`sensor_wall_x` = midpoint of (left_x + right_x) from bounds.

**Left corner** (sensor at origin, facing 45° into room):
```
room_x = sensor_y * sin(45°) + tx * cos(45°)
room_y = sensor_y * cos(45°) - tx * sin(45°)
```

**Right corner** (sensor at right corner, facing -45° into room):
```
room_x = wall_width - (sensor_y * sin(45°) + tx * cos(45°))
room_y = sensor_y * cos(45°) + tx * sin(45°)
```
`wall_width` = right_x from bounds.

## Wizard flow

### Step 1: Placement

- 3 buttons: Left corner | Wall | Right corner
- Each shows mini room diagram with sensor dot + 120° FOV cone at correct angle
- Room name text input
- "Next" proceeds to step 2

### Step 2: Orientation

- Mini-grid with live target dots transformed to room coordinates
- Sensor dot at correct grid position (top-left, top-center, or top-right)
- "Move to the left side of the room. The dot should appear on the left."
- "Flip left/right" toggles mirror flag (negates sensor_x before transform)
- "Looks correct" → step 3

### Step 3: Room bounds (3 sequential captures)

Each sub-step shows mini-grid with live target + previously captured points.

1. "Walk to the wall furthest from the sensor" → captures `far_y` (room Y of target)
2. "Walk to the left-most point of the room" → captures `left_x` (room X of target)
3. "Walk to the right-most point of the room" → captures `right_x` (room X of target)

All values stored in room coordinates (transform applied at capture time). "Mark position" reads current primary target, transforms to room coords, stores value.

### Step 4: Preview + auto-fill

- Grid scaled to room bounds
- Auto-fill: grid cells whose center falls within (left_x → right_x, 0 → far_y) = "room", else "outside"
- Live target dots verify positions
- Room dimensions displayed (width × depth in meters)
- "Finish" saves config

### Re-running the wizard

All 4 steps run fresh. After finishing, the previously saved room layout (cells, furniture, zones) is loaded back on top of the auto-filled grid. This preserves manual refinements while allowing placement/bounds to change.

## Grid coordinate mapping

The 20×16 grid maps to the physical room:

```
cell_width_mm  = (right_x - left_x) / 20
cell_height_mm = far_y / 16

For target at room coords (rx, ry):
  xPercent = ((rx - left_x) / (right_x - left_x)) * 100
  yPercent = (ry / far_y) * 100
```

Sensor position on grid:
- Wall: `(50%, 0%)` — midpoint of wall
- Left corner: `(0%, 0%)` — left edge
- Right corner: `(100%, 0%)` — right edge

FOV overlay originates from sensor grid position, fans out at correct angle (0° for wall, ±45° for corners), clipped to grid bounds.

## Data model

Stored in `entry.options["config"]`:

```python
{
    "room_name": "Living Room",
    "placement": "wall",            # "wall" | "left_corner" | "right_corner"
    "mirrored": False,              # orientation flip
    "room_bounds": {                # room coordinates (mm)
        "far_y": 4500,
        "left_x": 200,
        "right_x": 5800,
    },
    "room_layout": {                # room-space grid (survives placement changes)
        "room_cells": [0, 1, 2, ...],
        "furniture": [{"type": "sofa", "cells": [45, 46, 65, 66]}],
    },
    "zones": [
        {"id": "zone_1", "name": "Desk", "sensitivity": "high", "cells": [100, 101]},
    ],
    "calibration": { ... },
}
```

## Files to modify

| File | Changes |
|------|---------|
| `everything-presence-pro-panel.ts` | Rewrite coordinate mapping, wizard flow, auto-fill logic |
| `coordinator.py` | No changes needed (fields already exist) |
| `websocket_api.py` | No changes needed (schema already accepts dict for room_bounds) |

Changes are frontend-only. The backend already supports the required data model.

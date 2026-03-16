# Perspective transform setup for Everything Presence Pro

## Context

The LD2450 radar sensor has accurate range but noisy/distorted angles. The existing 3-stage polar calibration pipeline (distortion correction → rotation → translation) doesn't have enough degrees of freedom to map sensor readings to room coordinates accurately. A perspective transform computed from 4 corner measurements maps raw sensor coordinates directly to room coordinates, absorbing all distortion, rotation, and placement in one step. This was validated in the sensor-diagnostic tool.

## Overview

Replace the entire setup wizard and calibration pipeline with a perspective transform approach:
- User marks 4 room corners → compute 8-parameter perspective matrix
- Raw sensor readings are smoothed (1s rolling median), transformed, and clamped to room bounds
- No placement selection, orientation step, or mirroring needed
- Grid system uses fixed 300mm cells covering the FOV bounding box in room space

## Setup wizard (frontend)

### Single step: Mark 4 corners

Guided sequential corner marking:

1. For each corner (near-left, near-right, far-right, far-left):
   - Instruction text: "Walk to the [corner name] corner and click Mark"
   - Wall offset inputs visible alongside the instruction:
     - Two number inputs (meters, step 0.1, default 0): "from [side] wall" and "from [front/back] wall"
     - Labels adapt per corner: near-left shows "from left wall" + "from front wall"; far-right shows "from right wall" + "from back wall"
     - User can fill these in before or after clicking Mark
   - Live sensor view showing raw target dot so user can verify they're detected
   - "Mark" button captures the first active target's raw (x, y) for this corner. If multiple targets are active, use target index 0 (T1). The user should be the only person in the room during calibration.
   - After marking, shows the captured coordinates and advances to next corner

2. After all 4 corners marked:
   - Auto-compute room dimensions from sensor-space corner distances as initial estimates:
     - Width = distance(near-left, near-right) in sensor space (accurate to ~5%)
     - Depth = average of distance(near-left, far-left) and distance(near-right, far-right)
   - Show room dimensions as editable fields: "Room width (m)" and "Room depth (m)" — user can override with tape measurement
   - Compute perspective transform from 4 sensor points → 4 room rectangle corners (with offsets applied). Recomputed whenever the user edits room dimensions or wall offsets.
   - Preview: room view with live target using perspective transform + clamping. This is the main feedback — the user sees themselves moving in the room and can judge if it looks right.
   - "Finish" button saves
   - **Advanced section** (collapsed by default, "Show advanced" toggle): perspective matrix parameters, residual error per corner. For debugging, not for end users.

### What's removed from the existing wizard

- Placement selection step (left corner / wall / right corner)
- Orientation step (flip left/right)
- Individual far/left/right wall marking steps
- Mirrored flag
- All polar correction UI (angle scale, range scale sliders)

## Backend: calibration.py

### SensorTransform — complete replacement

Old 3-stage pipeline (ld2450_correct → rotate → translate) is removed entirely. Replaced with:

```python
class SensorTransform:
    def __init__(self, perspective=None, room_width=0, room_depth=0):
        # perspective: [a, b, c, d, e, f, g, h] or None
        self.perspective = perspective  # 8 floats
        self.room_width = room_width
        self.room_depth = room_depth
        # Rolling median buffers per target (applied externally by coordinator)

    def apply(self, x: float, y: float) -> tuple[float, float]:
        if self.perspective is None or len(self.perspective) != 8:
            return x, y  # identity if not calibrated
        a, b, c, d, e, f, g, h = self.perspective
        denom = g * x + h * y + 1
        rx = (a * x + b * y + c) / denom
        ry = (d * x + e * y + f) / denom
        # Clamp to room bounds
        rx = max(0, min(rx, self.room_width))
        ry = max(0, min(ry, self.room_depth))
        return rx, ry

    def to_dict(self):
        return {
            "perspective": self.perspective,
            "room_width": self.room_width,
            "room_depth": self.room_depth,
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            perspective=data.get("perspective"),
            room_width=data.get("room_width", 0),
            room_depth=data.get("room_depth", 0),
        )
```

Remove: `ld2450_correct()`, `LD2450_SCALE_FACTOR`, `recalibrate()`, `sensor_angle`, `offset_x`, `offset_y`.

### Perspective solve

The perspective transform is computed on the frontend (same Gaussian elimination as the diagnostic tool) and sent as 8 floats. The backend just stores and applies it. No server-side solving needed.

## Backend: websocket_api.py

### set_setup command — simplified

```python
@websocket_api.websocket_command({
    vol.Required("type"): "everything_presence_pro/set_setup",
    vol.Required("entry_id"): str,
    vol.Required("perspective"): vol.All([vol.Coerce(float)], vol.Length(min=8, max=8)),
    vol.Required("room_width"): vol.Coerce(float),     # mm
    vol.Required("room_depth"): vol.Coerce(float),     # mm
})
```

Handler:
1. Creates `SensorTransform(perspective, room_width, room_depth)`
2. Sets on coordinator via `coordinator.set_sensor_transform(transform)`
3. Saves to entry options

### Removed commands

- `recalibrate` — no longer needed (re-run wizard instead)

### Updated commands

- `list_entries` — remove `placement` from response, add `has_perspective: bool` (true if perspective matrix is set)
- `get_config` — calibration section returns `{ perspective, room_width, room_depth }` instead of old polar fields
- `set_room_layout` — unchanged, but when calibration is re-run (new `set_setup`), existing room_layout and zones are cleared since grid dimensions may change

### Unchanged commands

- `set_zones`, `subscribe_targets` — unchanged


## Backend: coordinator.py

### Rolling median smoothing

Per-target rolling median on raw sensor coordinates before applying the perspective transform:

```python
SMOOTH_WINDOW_S = 1.0  # 1 second window

class TargetSmoother:
    def __init__(self):
        self.buffers = [[] for _ in range(3)]  # [(x, y, t), ...] per target

    def update(self, idx, x, y):
        now = time.monotonic()
        buf = self.buffers[idx]
        buf.append((x, y, now))
        # Prune old entries
        while buf and now - buf[0][2] > SMOOTH_WINDOW_S:
            buf.pop(0)
        # Compute median
        xs = sorted(s[0] for s in buf)
        ys = sorted(s[1] for s in buf)
        mid = len(xs) // 2
        median_x = xs[mid] if len(xs) % 2 else (xs[mid - 1] + xs[mid]) / 2
        median_y = ys[mid] if len(ys) % 2 else (ys[mid - 1] + ys[mid]) / 2
        return median_x, median_y

    def clear(self, idx):
        self.buffers[idx].clear()
```

### Target processing flow

```
raw (x, y) from ESPHome
  → rolling median (1s window)
  → perspective transform → room (rx, ry)
  → clamp to room bounds
  → grid cell lookup → zone assignment
```

### Smoother lifecycle

- `TargetSmoother.clear(idx)` is called when a target becomes inactive (active transitions from true to false)
- On calibration change (`set_sensor_transform`), all buffers are cleared since the coordinate space has changed

### _forward_targets in websocket_api.py

Target events sent to frontend include:
- `raw_x`, `raw_y`: original sensor values (before smoothing, directly from ESPHome)
- `x`, `y`: transformed room coordinates (after median + perspective + clamp)

## Grid system

### Cell size

Fixed 300mm × 300mm per cell. This ensures each cell represents the same physical area regardless of room size.

### Grid extent

Computed from the sensor FOV projected through the perspective transform:

1. Sample the FOV boundary: points every 2° along the 120° wedge at 6m range (61 points), plus the sensor origin (0,0)
2. Transform each point through the perspective matrix into room coordinates
3. Compute the bounding box of the transformed points
4. Snap bounding box to 300mm grid boundaries
5. Grid dimensions = bounding box size / 300mm

This gives a grid that covers everything the sensor can see, in room-aligned coordinates.

### Cell classification

- Cells whose center falls inside the room rectangle (0,0)→(room_width, room_depth) default to "room"
- Cells outside default to "outside" (greyed)
- User can toggle cells at the boundary to adjust walls (ungrey to extend, grey to contract)

### Zone lookup

For a target at room coordinates (rx, ry):
1. Compute grid column: `col = floor((rx - grid_origin_x) / 300)`
2. Compute grid row: `row = floor((ry - grid_origin_y) / 300)`
3. Clamp col to [0, num_cols - 1] and row to [0, num_rows - 1] — this handles targets at the exact room boundary
4. Cell index: `row * num_cols + col`
5. Look up zone from cell-to-zone mapping. If the cell is classified as "outside", the target is not in any zone.

### Grid origin

The grid origin is the top-left corner of the FOV bounding box (in room coordinates). This will typically be at negative room coordinates on some edges, providing cells beyond the room walls.

## Frontend: coordinate mapping

### _sensorToRoom() replacement

The existing `_sensorToRoom()` method (which does rotation + translation based on placement) is replaced with a perspective transform:

```typescript
private _sensorToRoom(sx: number, sy: number): { rx: number; ry: number } {
    if (!this._perspective) return { rx: sx, ry: sy };
    const [a, b, c, d, e, f, g, h] = this._perspective;
    const denom = g * sx + h * sy + 1;
    const rx = (a * sx + b * sy + c) / denom;
    const ry = (d * sx + e * sy + f) / denom;
    return { rx, ry };
}
```

### Room view rendering

The room canvas draws:
- Room rectangle at (0,0)→(room_width, room_depth)
- Grid cells covering the FOV bounding box, colored by type (room/outside/furniture/zone)
- Live targets at transformed + clamped positions

### Perspective solve (frontend)

Same Gaussian elimination with partial pivoting as the diagnostic tool, solving the 8×8 system from 4 corner pairs. Runs when all 4 corners are marked, and re-runs when dimensions or offsets are edited.

If the solve fails (singular matrix — e.g., collinear corners or two corners at the same position), display an error message: "Cannot compute transform — ensure all 4 corners are in different positions." The "Finish" button is disabled until the solve succeeds.

## Grid data format

The grid is a flat byte array of `grid_rows * grid_cols` bytes. Each byte encodes a cell's state:

```
Bit 7:   room flag (1 = inside room, 0 = outside/greyed)
Bit 6:   exit flag (1 = exit)
Bits 5-4: reserved for future use (e.g., sensitivity, ghost map)
Bits 3-0: zone number (0-15, where 0 = no zone)
```

Examples:
- `0x00` = outside (greyed)
- `0x80` = room, no zone
- `0x83` = room, zone 3
- `0xC5` = room, zone 5, exit

Zone lookup: `zone = grid[row * cols + col] & 0x0F`
Exit check: `is_exit = grid[row * cols + col] & 0x40`
Room check: `is_room = grid[row * cols + col] & 0x80`

This gives up to 15 zones (zone 0 = unassigned), which is plenty for a single room.

## Data storage

Config entry options:

```json
{
  "config": {
    "perspective": [a, b, c, d, e, f, g, h],
    "room_width": 3000,
    "room_depth": 5000,
    "grid_origin_x": -600,
    "grid_origin_y": -300,
    "grid_cols": 16,
    "grid_rows": 22,
    "grid": "<base64-encoded byte array>",
    "zones": [
      { "id": 1, "name": "Sofa", "color": "#FF6384", "sensitivity": "normal" },
      { "id": 3, "name": "Desk", "color": "#36A2EB", "sensitivity": "high" }
    ]
  }
}
```

The `grid` field is a base64-encoded byte array (grid_rows × grid_cols bytes). Zone definitions (name, color, sensitivity) are stored separately keyed by their zone number. The cell-to-zone mapping lives entirely in the grid byte array.

## File changes

- `custom_components/everything_presence_pro/calibration.py` — replace SensorTransform entirely
- `custom_components/everything_presence_pro/coordinator.py` — add TargetSmoother, update target processing
- `custom_components/everything_presence_pro/websocket_api.py` — update set_setup, remove recalibrate, update get_config
- `custom_components/everything_presence_pro/zone_engine.py` — update grid to use dynamic dimensions and room-space coordinates
- `frontend/src/everything-presence-pro-panel.ts` — rewrite setup wizard, add perspective solve, update coordinate mapping and room view

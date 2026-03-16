# Perspective Transform Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the polar calibration pipeline with a perspective transform in the EPP backend (calibration.py, coordinator.py, websocket_api.py, zone_engine.py, const.py).

**Architecture:** SensorTransform becomes a simple perspective matrix applier. TargetSmoother provides 1s rolling median on raw coords. ZoneEngine switches from FOV-based grid to room-space grid with dynamic dimensions and byte-array cell data. WebSocket API updated for new setup payload.

**Tech Stack:** Python 3.13+, Home Assistant, aioesphomeapi, voluptuous

**Spec:** `docs/superpowers/specs/2026-03-14-perspective-setup-design.md`

---

## Chunk 1: calibration.py and const.py

### Task 1: Replace SensorTransform with perspective transform

**Files:**
- Modify: `custom_components/everything_presence_pro/calibration.py`
- Modify: `custom_components/everything_presence_pro/const.py`

- [ ] **Step 1: Rewrite calibration.py**

Replace the entire file:

```python
"""Sensor calibration via perspective transform.

Maps raw LD2450 sensor coordinates directly to room coordinates
using an 8-parameter perspective (projective) transform computed
from 4 corner measurements. Absorbs all distortion, rotation,
and placement in one step.
"""

from __future__ import annotations

from typing import Any


class SensorTransform:
    """Perspective transform from raw sensor coords to room coords.

    The transform is: rx = (a*sx + b*sy + c) / (g*sx + h*sy + 1)
                      ry = (d*sx + e*sy + f) / (g*sx + h*sy + 1)
    """

    def __init__(
        self,
        perspective: list[float] | None = None,
        room_width: float = 0.0,
        room_depth: float = 0.0,
    ) -> None:
        """Initialize the transform."""
        self.perspective = perspective  # [a, b, c, d, e, f, g, h]
        self.room_width = room_width
        self.room_depth = room_depth

    def apply(self, x: float, y: float) -> tuple[float, float]:
        """Apply perspective transform and clamp to room bounds."""
        if self.perspective is None or len(self.perspective) != 8:
            return x, y
        a, b, c, d, e, f, g, h = self.perspective
        denom = g * x + h * y + 1.0
        if abs(denom) < 1e-10:
            return x, y
        rx = (a * x + b * y + c) / denom
        ry = (d * x + e * y + f) / denom
        # Clamp to room bounds
        rx = max(0.0, min(rx, self.room_width))
        ry = max(0.0, min(ry, self.room_depth))
        return rx, ry

    def to_dict(self) -> dict[str, Any]:
        """Serialize transform to a dictionary."""
        return {
            "perspective": self.perspective,
            "room_width": self.room_width,
            "room_depth": self.room_depth,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SensorTransform:
        """Deserialize transform from a dictionary."""
        if not data:
            return cls()
        return cls(
            perspective=data.get("perspective"),
            room_width=data.get("room_width", 0.0),
            room_depth=data.get("room_depth", 0.0),
        )
```

- [ ] **Step 2: Update const.py**

Remove old grid/placement constants, add new ones:

```python
"""Constants for the Everything Presence Pro integration."""

DOMAIN = "everything_presence_pro"

# Grid
GRID_CELL_SIZE_MM = 300  # Fixed 300mm × 300mm cells

# LD2450 sensor limits
MAX_TARGETS = 3
MAX_RANGE_MM = 6000  # 6 meters
FOV_DEGREES = 120

# ESPHome API
DEFAULT_PORT = 6053

# Smoothing
SMOOTH_WINDOW_S = 1.0  # Rolling median window

# Sensitivity defaults (consecutive frames to confirm presence)
SENSITIVITY_NORMAL = 3
SENSITIVITY_HIGH = 1
SENSITIVITY_LOW = 8

# Grid cell byte format:
# Bit 7: room flag (1 = inside room)
# Bit 6: exit flag
# Bits 5-4: reserved
# Bits 3-0: zone number (0 = no zone, 1-15 = zone id)
CELL_FLAG_ROOM = 0x80
CELL_FLAG_EXIT = 0x40
CELL_ZONE_MASK = 0x0F

# Zone sensitivity types
ZONE_NORMAL = "normal"
ZONE_HIGH = "high"
ZONE_LOW = "low"
ZONE_EXCLUSION = "exclusion"

# ESPHome entity name patterns for EP Pro
TARGET_X_PATTERN = "target_{n}_x"
TARGET_Y_PATTERN = "target_{n}_y"
TARGET_SPEED_PATTERN = "target_{n}_speed"
TARGET_ACTIVE_PATTERN = "target_{n}_active"
STATIC_PRESENCE_PATTERN = "mmwave"
PIR_PATTERN = "pir"
ILLUMINANCE_PATTERN = "illuminance"
TEMPERATURE_PATTERN = "temperature"
HUMIDITY_PATTERN = "humidity"
CO2_PATTERN = "co2"
```

- [ ] **Step 3: Verify syntax**

Run: `python -c "import ast; ast.parse(open('custom_components/everything_presence_pro/calibration.py').read()); print('OK')"`

- [ ] **Step 4: Commit**

```bash
git add custom_components/everything_presence_pro/calibration.py custom_components/everything_presence_pro/const.py
git commit -m "feat: replace polar calibration with perspective transform"
```

### Task 2: Add TargetSmoother to coordinator.py

**Files:**
- Modify: `custom_components/everything_presence_pro/coordinator.py`

- [ ] **Step 1: Add TargetSmoother class**

Add `time`, `statistics.median`, `SMOOTH_WINDOW_S`, and `CELL_FLAG_ROOM` to the existing imports at the top of coordinator.py. The `MAX_TARGETS` import already exists. Then add the class before `EverythingPresenceProCoordinator`:

Also add `from .zone_engine import Grid` to the imports (alongside the existing `ProcessingResult`, `Zone`, `ZoneEngine` imports).

```python
import time
from statistics import median

from .const import SMOOTH_WINDOW_S, CELL_FLAG_ROOM


class TargetSmoother:
    """Rolling median filter on raw sensor coordinates.

    Maintains a time-windowed buffer per target and returns the
    median x and y over the window.
    """

    def __init__(self, window_s: float = SMOOTH_WINDOW_S) -> None:
        """Initialize the smoother."""
        self._window_s = window_s
        self._buffers: list[list[tuple[float, float, float]]] = [
            [] for _ in range(MAX_TARGETS)
        ]

    def update(self, idx: int, x: float, y: float) -> tuple[float, float]:
        """Add a reading and return the smoothed (median) position."""
        now = time.monotonic()
        buf = self._buffers[idx]
        buf.append((x, y, now))
        # Prune old entries
        cutoff = now - self._window_s
        while buf and buf[0][2] < cutoff:
            buf.pop(0)
        # Compute median
        xs = sorted(s[0] for s in buf)
        ys = sorted(s[1] for s in buf)
        return median(xs), median(ys)

    def clear(self, idx: int) -> None:
        """Clear the buffer for a target."""
        self._buffers[idx].clear()

    def clear_all(self) -> None:
        """Clear all buffers."""
        for buf in self._buffers:
            buf.clear()
```

- [ ] **Step 2: Update coordinator __init__ — remove old config, add smoother**

Replace the setup config section of `__init__` (lines 58-65):

Old:
```python
        # Calibration
        self._sensor_transform = SensorTransform()

        # Room layout
        self._room_layout: dict[str, Any] = {}

        # Setup config
        self._room_name: str = ""
        self._placement: str = ""  # "wall" | "left_corner" | "right_corner"
        self._mirrored: bool = False  # X axis flipped (sensor upside down)
        self._room_bounds: dict[str, float] = {}  # far_y, left_x, right_x
```

New:
```python
        # Calibration
        self._sensor_transform = SensorTransform()
        self._smoother = TargetSmoother()

        # Room layout
        self._room_layout: dict[str, Any] = {}
```

- [ ] **Step 3: Update set_sensor_transform to clear smoother**

```python
    def set_sensor_transform(self, transform: SensorTransform) -> None:
        """Set the sensor transform, rebuild grid, and reset smoothing."""
        self._sensor_transform = transform
        self._smoother.clear_all()
        self._rebuild_grid()

    def _rebuild_grid(self) -> None:
        """Compute grid dimensions from perspective + room size and set on zone engine."""
        t = self._sensor_transform
        if t.perspective is None:
            return
        origin_x, origin_y, cols, rows = Grid.compute_extent(
            t.perspective, t.room_width, t.room_depth
        )
        grid = Grid(origin_x=origin_x, origin_y=origin_y, cols=cols, rows=rows)
        # Mark cells inside the room rectangle as room
        for r in range(rows):
            for c in range(cols):
                cx = origin_x + (c + 0.5) * grid.cell_size
                cy = origin_y + (r + 0.5) * grid.cell_size
                if 0 <= cx < t.room_width and 0 <= cy < t.room_depth:
                    grid.cells[r * cols + c] = CELL_FLAG_ROOM
        self._zone_engine.set_grid(grid)
```

- [ ] **Step 4: Update _do_rebuild to use smoother**

Replace the existing `_do_rebuild` method:

```python
    def _do_rebuild(self) -> None:
        """Rebuild target list, apply smoothing + calibration, run zone engine, dispatch."""
        self._rebuild_scheduled = False
        calibrated: list[tuple[float, float, bool]] = []
        for i in range(MAX_TARGETS):
            if self._target_active[i]:
                # Smooth raw coordinates
                sx, sy = self._smoother.update(
                    i, self._target_x[i], self._target_y[i]
                )
                # Apply perspective transform + clamp
                cx, cy = self._sensor_transform.apply(sx, sy)
                calibrated.append((cx, cy, True))
            else:
                self._smoother.clear(i)
                calibrated.append((self._target_x[i], self._target_y[i], False))

        self._targets = calibrated
        self._last_result = self._zone_engine.process_targets(calibrated)

        async_dispatcher_send(
            self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}"
        )
        async_dispatcher_send(
            self.hass, f"{SIGNAL_ZONES_UPDATED}_{self.entry.entry_id}"
        )
```

- [ ] **Step 5: Remove old properties, update get_config_data and load_config_data**

Remove these properties: `room_name`, `placement`, `mirrored`, `room_bounds`.

Update `get_config_data`:

```python
    def get_config_data(self) -> dict[str, Any]:
        """Serialize the current configuration to a dictionary."""
        grid = self._zone_engine.grid
        return {
            "zones": [
                {
                    "id": z.id,
                    "name": z.name,
                    "sensitivity": z.sensitivity,
                    "color": z.color,
                }
                for z in self._zones
            ],
            "calibration": self._sensor_transform.to_dict(),
            "grid": grid.to_base64(),
            "grid_origin_x": grid.origin_x,
            "grid_origin_y": grid.origin_y,
            "grid_cols": grid.cols,
            "grid_rows": grid.rows,
            "room_layout": self._room_layout,
        }
```

Update `load_config_data`:

```python
    def load_config_data(self, data: dict[str, Any]) -> None:
        """Load configuration from a dictionary."""
        if not data:
            return

        # Load calibration
        cal_data = data.get("calibration")
        if cal_data:
            self._sensor_transform = SensorTransform.from_dict(cal_data)

        # Load grid
        grid_data = data.get("grid")
        if grid_data and data.get("grid_cols"):
            grid = Grid.from_base64(
                grid_data,
                cols=data["grid_cols"],
                rows=data["grid_rows"],
                origin_x=data.get("grid_origin_x", 0.0),
                origin_y=data.get("grid_origin_y", 0.0),
            )
            self._zone_engine.set_grid(grid)
        elif cal_data and cal_data.get("perspective"):
            # No saved grid — compute from perspective
            self._rebuild_grid()

        # Load zones
        zone_list = data.get("zones", [])
        zones = [
            Zone(
                id=z["id"],
                name=z["name"],
                sensitivity=z.get("sensitivity", "normal"),
                color=z.get("color", ""),
            )
            for z in zone_list
        ]
        self.set_zones(zones)

        # Load room layout
        self._room_layout = data.get("room_layout", {})
```

- [ ] **Step 6: Verify syntax**

Run: `python -c "import ast; ast.parse(open('custom_components/everything_presence_pro/coordinator.py').read()); print('OK')"`

- [ ] **Step 7: Commit**

```bash
git add custom_components/everything_presence_pro/coordinator.py
git commit -m "feat: add TargetSmoother and integrate perspective transform in coordinator"
```

## Chunk 2: websocket_api.py and zone_engine.py

### Task 3: Update websocket_api.py

**Files:**
- Modify: `custom_components/everything_presence_pro/websocket_api.py`

- [ ] **Step 1: Update set_setup command**

Replace the `websocket_set_setup` function and its decorator (lines 76-149):

```python
@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_setup",
        vol.Required("entry_id"): str,
        vol.Required("perspective"): vol.All(
            [vol.Coerce(float)], vol.Length(min=8, max=8)
        ),
        vol.Required("room_width"): vol.Coerce(float),
        vol.Required("room_depth"): vol.Coerce(float),
    }
)
@websocket_api.async_response
async def websocket_set_setup(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Persist perspective transform and room dimensions for an entry."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    transform = SensorTransform(
        perspective=msg["perspective"],
        room_width=msg["room_width"],
        room_depth=msg["room_depth"],
    )
    coordinator.set_sensor_transform(transform)

    # Clear existing room layout and zones since grid dimensions may change
    coordinator.set_room_layout({})
    coordinator.set_zones([])

    config = dict(entry.options.get("config", {}))
    config["calibration"] = transform.to_dict()
    # Clear layout data
    config.pop("room_layout", None)
    config.pop("zones", None)

    hass.config_entries.async_update_entry(
        entry, options={**entry.options, "config": config}
    )

    connection.send_result(msg["id"])
```

- [ ] **Step 2: Remove recalibrate command**

Delete the entire `websocket_recalibrate` function and its decorator (lines 229-267).

Remove `websocket_api.async_register_command(hass, websocket_recalibrate)` from `async_register_websocket_commands`.

- [ ] **Step 3: Update list_entries**

Replace `placement` with `has_perspective`:

```python
@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/list_entries",
    }
)
@callback
def websocket_list_entries(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return all configured Everything Presence Pro entries."""
    entries = hass.config_entries.async_entries(DOMAIN)
    connection.send_result(
        msg["id"],
        [
            {
                "entry_id": e.entry_id,
                "title": e.title,
                "has_perspective": bool(
                    e.options.get("config", {})
                    .get("calibration", {})
                    .get("perspective")
                ),
                "has_layout": bool(
                    e.options.get("config", {}).get("room_layout")
                ),
            }
            for e in entries
        ],
    )
```

- [ ] **Step 4: Verify syntax**

Run: `python -c "import ast; ast.parse(open('custom_components/everything_presence_pro/websocket_api.py').read()); print('OK')"`

- [ ] **Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/websocket_api.py
git commit -m "feat: update websocket API for perspective transform setup"
```

### Task 4: Update zone_engine.py for room-space grid

**Files:**
- Modify: `custom_components/everything_presence_pro/zone_engine.py`

- [ ] **Step 1: Rewrite Grid class for room-space coordinates**

Replace the entire file:

```python
"""Zone engine for grid-based presence detection.

Grid uses fixed 300mm cells in room coordinate space. Cell data is stored
as a byte array where each byte encodes room/exit/zone flags.
"""

from __future__ import annotations

import base64
import math
from dataclasses import dataclass, field

from .const import (
    CELL_FLAG_ROOM,
    CELL_ZONE_MASK,
    FOV_DEGREES,
    GRID_CELL_SIZE_MM,
    MAX_RANGE_MM,
    SENSITIVITY_HIGH,
    SENSITIVITY_LOW,
    SENSITIVITY_NORMAL,
    ZONE_EXCLUSION,
    ZONE_HIGH,
    ZONE_LOW,
    ZONE_NORMAL,
)


@dataclass
class Zone:
    """A named zone with metadata."""

    id: int  # 1-15
    name: str
    sensitivity: str
    color: str = ""


@dataclass
class ProcessingResult:
    """Result of processing target positions."""

    device_tracking_present: bool = False
    zone_occupancy: dict[int, bool] = field(default_factory=dict)
    zone_target_counts: dict[int, int] = field(default_factory=dict)


class Grid:
    """Room-space grid with fixed cell size.

    Grid origin and dimensions are computed from the sensor FOV
    projected through the perspective transform into room coordinates.
    """

    def __init__(
        self,
        origin_x: float = 0.0,
        origin_y: float = 0.0,
        cols: int = 1,
        rows: int = 1,
        cell_size: int = GRID_CELL_SIZE_MM,
    ) -> None:
        """Initialize the grid."""
        self.origin_x = origin_x
        self.origin_y = origin_y
        self.cols = cols
        self.rows = rows
        self.cell_size = cell_size
        self.cell_count = cols * rows
        # Byte array: one byte per cell
        self.cells = bytearray(self.cell_count)

    def xy_to_cell(self, x: float, y: float) -> int | None:
        """Map room coordinates to a grid cell index.

        Returns None if the point is outside the grid.
        """
        col = int((x - self.origin_x) / self.cell_size)
        row = int((y - self.origin_y) / self.cell_size)
        if col < 0 or col >= self.cols or row < 0 or row >= self.rows:
            return None
        return row * self.cols + col

    def cell_zone(self, cell_index: int) -> int:
        """Get the zone number for a cell (0 = no zone)."""
        return self.cells[cell_index] & CELL_ZONE_MASK

    def cell_is_room(self, cell_index: int) -> bool:
        """Check if a cell is inside the room."""
        return bool(self.cells[cell_index] & CELL_FLAG_ROOM)

    def load_from_bytes(self, data: bytes) -> None:
        """Load cell data from bytes."""
        count = min(len(data), self.cell_count)
        self.cells[:count] = data[:count]

    def to_base64(self) -> str:
        """Serialize cell data to base64."""
        return base64.b64encode(bytes(self.cells)).decode("ascii")

    @staticmethod
    def from_base64(data: str, cols: int, rows: int, origin_x: float, origin_y: float) -> Grid:
        """Deserialize grid from base64 cell data."""
        grid = Grid(origin_x=origin_x, origin_y=origin_y, cols=cols, rows=rows)
        raw = base64.b64decode(data)
        grid.load_from_bytes(raw)
        return grid

    @staticmethod
    def compute_extent(
        perspective: list[float],
        room_width: float,
        room_depth: float,
        cell_size: int = GRID_CELL_SIZE_MM,
    ) -> tuple[float, float, int, int]:
        """Compute grid origin and dimensions from FOV projected through perspective.

        Samples the 120° FOV boundary at 6m range, transforms through
        the perspective matrix, and computes the bounding box.

        Returns (origin_x, origin_y, cols, rows).
        """
        if not perspective or len(perspective) != 8:
            # No perspective — default to room size
            cols = max(1, int(math.ceil(room_width / cell_size)))
            rows = max(1, int(math.ceil(room_depth / cell_size)))
            return 0.0, 0.0, cols, rows

        a, b, c, d, e, f, g, h = perspective

        # Sample FOV boundary: every 2° along the arc at max range, plus origin
        points = [(0.0, 0.0)]  # sensor origin
        for deg in range(-FOV_DEGREES // 2, FOV_DEGREES // 2 + 1, 2):
            angle = math.radians(deg)
            sx = MAX_RANGE_MM * math.sin(angle)
            sy = MAX_RANGE_MM * math.cos(angle)
            points.append((sx, sy))

        # Transform all points
        min_x = float("inf")
        min_y = float("inf")
        max_x = float("-inf")
        max_y = float("-inf")
        for sx, sy in points:
            denom = g * sx + h * sy + 1.0
            if abs(denom) < 1e-10:
                continue
            rx = (a * sx + b * sy + c) / denom
            ry = (d * sx + e * sy + f) / denom
            min_x = min(min_x, rx)
            min_y = min(min_y, ry)
            max_x = max(max_x, rx)
            max_y = max(max_y, ry)

        # Snap to cell boundaries
        origin_x = math.floor(min_x / cell_size) * cell_size
        origin_y = math.floor(min_y / cell_size) * cell_size
        end_x = math.ceil(max_x / cell_size) * cell_size
        end_y = math.ceil(max_y / cell_size) * cell_size

        cols = max(1, int((end_x - origin_x) / cell_size))
        rows = max(1, int((end_y - origin_y) / cell_size))

        return origin_x, origin_y, cols, rows


class ZoneEngine:
    """Computes zone occupancy from transformed target positions."""

    def __init__(self) -> None:
        """Initialize the zone engine."""
        self.grid = Grid()
        self._zones: list[Zone] = []
        self._zone_frame_counts: dict[int, int] = {}
        self._sensitivity_thresholds: dict[str, int] = {
            ZONE_NORMAL: SENSITIVITY_NORMAL,
            ZONE_HIGH: SENSITIVITY_HIGH,
            ZONE_LOW: SENSITIVITY_LOW,
        }

    def set_grid(self, grid: Grid) -> None:
        """Set the grid."""
        self.grid = grid

    def set_zones(self, zones: list[Zone]) -> None:
        """Set the zone configuration."""
        self._zones = zones
        self._zone_frame_counts.clear()
        for zone in zones:
            if zone.sensitivity != ZONE_EXCLUSION:
                self._zone_frame_counts[zone.id] = 0

    def process_targets(
        self, targets: list[tuple[float, float, bool]]
    ) -> ProcessingResult:
        """Process target positions and return zone occupancy.

        Args:
            targets: List of (room_x_mm, room_y_mm, active) tuples.

        Returns:
            ProcessingResult with device and zone occupancy states.
        """
        result = ProcessingResult()
        zone_counts: dict[int, int] = {
            z.id: 0 for z in self._zones if z.sensitivity != ZONE_EXCLUSION
        }

        for x, y, active in targets:
            if not active:
                continue

            cell = self.grid.xy_to_cell(x, y)
            if cell is None:
                continue

            if not self.grid.cell_is_room(cell):
                continue

            zone_id = self.grid.cell_zone(cell)

            result.device_tracking_present = True

            if zone_id > 0 and zone_id in zone_counts:
                zone_counts[zone_id] += 1

        for zone in self._zones:
            if zone.sensitivity == ZONE_EXCLUSION:
                continue

            count = zone_counts.get(zone.id, 0)
            threshold = self._sensitivity_thresholds.get(
                zone.sensitivity, SENSITIVITY_NORMAL
            )

            if count > 0:
                self._zone_frame_counts[zone.id] = (
                    self._zone_frame_counts.get(zone.id, 0) + 1
                )
            else:
                self._zone_frame_counts[zone.id] = 0

            occupied = self._zone_frame_counts[zone.id] >= threshold
            result.zone_occupancy[zone.id] = occupied
            result.zone_target_counts[zone.id] = count

        return result
```

- [ ] **Step 2: Verify syntax**

Run: `python -c "import ast; ast.parse(open('custom_components/everything_presence_pro/zone_engine.py').read()); print('OK')"`

- [ ] **Step 3: Commit**

```bash
git add custom_components/everything_presence_pro/zone_engine.py
git commit -m "feat: rewrite zone engine for room-space grid with byte array cells"
```

### Task 5: Fix imports and integration points

After changing Zone.id from str to int and removing old constants, fix any broken references.

**Files:**
- Modify: `custom_components/everything_presence_pro/coordinator.py` (Zone import, zone id types)
- Modify: `custom_components/everything_presence_pro/websocket_api.py` (Zone creation, set_zones schema)
- Modify: `custom_components/everything_presence_pro/sensor.py` (zone id references)
- Modify: `custom_components/everything_presence_pro/binary_sensor.py` (zone id references)

- [ ] **Step 1: Update websocket_api.py set_zones to use int zone ids**

In the `websocket_set_zones` schema, change zone id from str to int:

```python
vol.Required("zones"): [
    {
        vol.Required("id"): vol.Coerce(int),
        vol.Required("name"): str,
        vol.Required("sensitivity"): str,
        vol.Optional("color", default=""): str,
    }
],
```

Update the Zone creation in the handler:

```python
    zones = [
        Zone(
            id=z["id"],
            name=z["name"],
            sensitivity=z["sensitivity"],
            color=z.get("color", ""),
        )
        for z in msg["zones"]
    ]
```

And update the zone serialization in `get_config_data` (coordinator.py):

```python
            "zones": [
                {
                    "id": z.id,
                    "name": z.name,
                    "sensitivity": z.sensitivity,
                    "color": z.color,
                }
                for z in self._zones
            ],
```

- [ ] **Step 2: Update sensor.py and binary_sensor.py zone id types**

In both `sensor.py` and `binary_sensor.py`, change `tracked_zone_ids: set[str]` to `set[int]`:

```python
# sensor.py line 53 and binary_sensor.py line 41
tracked_zone_ids: set[int] = set()
```

Also update the `websocket_set_zones` handler's persistence block in websocket_api.py to serialize without `cells`:

```python
    # Persist to config entry options
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is not None:
        config = dict(entry.options.get("config", {}))
        config["zones"] = [
            {
                "id": z.id,
                "name": z.name,
                "sensitivity": z.sensitivity,
                "color": z.color,
            }
            for z in zones
        ]
        hass.config_entries.async_update_entry(entry, options={**entry.options, "config": config})
```

- [ ] **Step 3: Remove old const imports**

In zone_engine.py, the old imports (`CELL_OUTSIDE`, `CELL_ROOM`, `GRID_COLS`, `GRID_ROWS`) are gone. Verify no other file imports them. Search for these symbols across the codebase and remove any stale references.

- [ ] **Step 4: Verify full import chain**

Run: `cd custom_components/everything_presence_pro && python -c "from . import calibration, coordinator, websocket_api, zone_engine; print('All imports OK')"`

If that fails due to HA dependencies, at minimum verify each file parses:

```bash
for f in calibration.py coordinator.py websocket_api.py zone_engine.py const.py; do
  python -c "import ast; ast.parse(open('custom_components/everything_presence_pro/$f').read()); print('$f OK')"
done
```

- [ ] **Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/
git commit -m "fix: update imports and zone id types for perspective transform"
```

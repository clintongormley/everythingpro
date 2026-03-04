# Everything Presence Pro custom integration design

## Overview

A custom Home Assistant integration for the Everything Presence Pro mmWave presence sensor that provides:

1. **Grid-based zone configuration** — like the Aqara FP2, divide a room into a grid of cells and paint zones
2. **Visual room editor** — place sensor, define room boundaries, lay out furniture, calibrate sensor coordinates
3. **Smart multi-sensor fusion** — combine PIR, tracking mmWave, and static mmWave for accurate zone-level and whole-room presence detection
4. **Dynamic entity creation** — only create entities for zones the user defines, no entity bloat

## Architecture

### Connection

The integration connects directly to the EP Pro via `aioesphomeapi` (ESPHome native API on TCP port 6053). This replaces the standard ESPHome integration for EP Pro devices — the user removes the device from ESPHome and adds it via this integration instead.

The integration:
- Discovers EP Pro devices via mDNS (`_esphomelib._tcp`)
- Authenticates with the device's API encryption key
- Subscribes to all sensor state updates (~10Hz for target tracking)
- Reads environment sensors (illuminance, temperature, humidity, CO2)

### Config flow

1. Auto-discovery via mDNS, or manual entry of host + API key
2. Validate connection, verify device is an EP Pro (check device model/name)
3. Store connection details in config entry
4. After setup, user opens the visual editor to configure room layout and zones

## Sensor hardware

The EP Pro has three independent detection sensors:

| Sensor | Chip | Purpose | Range | Zone-capable |
|---|---|---|---|---|
| PIR | Panasonic EKMC1603111 | Fast motion detection | 12m | No (whole-room) |
| Tracking mmWave | HiLink LD2450 | Multi-target X,Y tracking (up to 3 targets) | 6m | Yes |
| Static mmWave | DFRobot SEN0609 | Static presence (detects still people) | 25m | No (whole-room) |

Additional sensors: BH1750 (illuminance), SHTC3 (temperature/humidity), optional SCD40 (CO2).

### LD2450 coordinate system

- Origin at the sensor module
- X axis: perpendicular to sensor face (negative = left, positive = right)
- Y axis: straight ahead away from sensor (always positive)
- Units: millimeters
- Field of view: 120 degrees
- Update rate: 10Hz, up to 3 simultaneous targets
- Each target reports: X, Y, speed, distance resolution

## Zone system

### Grid-based zones (Aqara-style)

The detection area is divided into a fixed grid of cells (e.g., 320 cells). Every cell is classified as one of:

- **Room** — inside the room, available for zone assignment
- **Outside** — beyond room walls, detections ignored (filters radar reflections)
- **Furniture** — visual marker with a type (bed, desk, sofa, etc.), informational
- **Zone member** — belongs to a named zone

### Zone types

Each zone has a sensitivity level:

- **Normal** — target present in zone = occupied
- **High sensitivity** — lower detection threshold (fewer consecutive frames required), good for beds/desks where someone may be very still
- **Low sensitivity** — higher threshold (more frames, minimum movement), reduces false positives
- **Exclusion** — detections always ignored, no entities created

### Zone data model

```python
@dataclass
class Zone:
    id: str              # Unique zone ID
    name: str            # User label (e.g., "Desk", "Sofa")
    sensitivity: str     # "normal", "high", "low", "exclusion"
    cells: list[int]     # Cell indices (can be non-contiguous)
```

### No zone limits

Unlike the EP Pro firmware's built-in 4-zone limit, this integration computes zones in HA from raw target coordinates. Users can create as many zones as they need.

### Zone storage

Zone definitions, room layout, furniture, and calibration data are stored in the config entry options. Nothing is written to the device for zones — the device just provides raw target X,Y data.

## Calibration

The LD2450's coordinate system isn't perfectly linear — there's distortion, especially at wider angles. The calibration system corrects this.

### Calibration flow

1. Have someone stand at a known position (e.g., a room corner)
2. See their live dot on the radar view in the editor
3. Tap where that position actually is on the grid layout
4. Repeat for 2-3 more reference points
5. Define which points form straight lines and right angles (e.g., "these two points are along a wall, this third point is on the perpendicular wall")
6. The system computes an affine/perspective correction transform

### Minimum calibration

3 points forming a known right angle — two points along one wall, one point on the perpendicular wall. More points improve accuracy.

The transform is applied to all raw target coordinates before grid cell mapping.

## Target processing pipeline

1. Receive raw target X,Y (mm) from device via `aioesphomeapi`
2. Apply calibration transform to get corrected X,Y
3. Map corrected X,Y to grid cell index
4. Look up cell's zone membership
5. Apply zone sensitivity rules
6. Update zone occupancy state

### Combined sensor logic

- **Zone occupancy**: tracking sensor has target in zone, OR (static sensor says present AND zone was recently occupied by tracking)
- **Zone clears**: tracking shows no targets in zone AND static sensor shows no presence (or after configurable timeout)
- **Device occupancy**: combined PIR + static + tracking (any sensor triggers it)
- **Device motion**: PIR only (instant trigger)

## Entity model

| Entity | Type | Source | Created when |
|---|---|---|---|
| Device occupancy | Binary sensor | PIR + static + tracking | Always |
| Device motion | Binary sensor | PIR | Always |
| Static presence | Binary sensor | SEN0609 | Always |
| Zone "{name}" occupancy | Binary sensor | Tracking + static assist | Per user-defined zone |
| Zone "{name}" target count | Sensor | Tracking | Per user-defined zone |
| Illuminance | Sensor | BH1750 | Always |
| Temperature | Sensor | SHTC3 | Always |
| Humidity | Sensor | SHTC3 | Always |
| CO2 | Sensor | SCD40 | If CO2 module detected |

Entities are created dynamically — adding a zone in the editor creates its entities, removing a zone removes them.

## Visual zone editor (frontend)

### Room setup flow

1. **Sensor placement** — choose mount type (wall or corner) and position on grid
2. **Room layout** — paint grid cells as "room" or "outside" (the boundary between them is the wall)
3. **Furniture** — paint cells with furniture types (bed, desk, sofa, dining table, etc.) for visual orientation
4. **Zones** — paint cells into named zones, set sensitivity per zone
5. **Calibration** — place reference points to correct sensor distortion

### Live view

Real-time target dots overlaid on the room layout, updated at ~10Hz. Users can see where people are detected relative to furniture and zones, helping validate zone placement and calibration.

### Deployment

- **Custom panel** — accessible from device configuration in HA settings
- **Lovelace card** — placeable on any dashboard, shows radar view with zones and live tracking

Both are the same TypeScript + Lit web component, registered as both a panel and a card.

### Tech stack

- TypeScript + Lit (consistent with HA frontend conventions)
- Single web component registered as panel and card
- Communicates with integration backend via WebSocket API

## WebSocket API

| Command | Purpose |
|---|---|
| `everything_presence_pro/get_config` | Get zones, calibration, room layout, furniture |
| `everything_presence_pro/set_zones` | Save zone definitions |
| `everything_presence_pro/set_calibration` | Save calibration points and transform |
| `everything_presence_pro/set_room_layout` | Save room cells and furniture |
| `everything_presence_pro/subscribe_targets` | Stream live calibrated target positions |

## Project structure

Single repo containing both backend integration and frontend source:

```
everythingpro/
├── custom_components/everything_presence_pro/
│   ├── __init__.py          # Setup, aioesphomeapi connection
│   ├── manifest.json        # HACS metadata, dependencies
│   ├── const.py             # Constants, grid dimensions
│   ├── config_flow.py       # Discovery + manual setup
│   ├── coordinator.py       # Data coordinator, target processing
│   ├── calibration.py       # Coordinate transform/correction
│   ├── zone_engine.py       # Grid, cell-to-zone mapping, sensitivity
│   ├── binary_sensor.py     # Occupancy entities (device + per-zone)
│   ├── sensor.py            # Environment + target count sensors
│   ├── websocket_api.py     # WS commands for zone CRUD, calibration, live targets
│   ├── strings.json         # Translations
│   ├── translations/
│   └── frontend/            # Built JS served by the integration
│       └── everything-presence-pro-panel.js
├── frontend/                # Frontend source
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── rollup.config.js     # Builds to custom_components/.../frontend/
├── hacs.json
└── README.md
```

## Scope

### In scope (v1)

- EP Pro support only (extensible architecture for One/Lite later)
- Grid-based zone editor with room layout and furniture
- Calibration system for sensor distortion correction
- Multi-sensor fusion (PIR + tracking + static)
- Dynamic zone entities with sensitivity levels
- Custom panel + Lovelace card
- HACS installation

### Out of scope (future)

- EP One / EP Lite support
- Ceiling mount sensor placement
- Multi-sensor room coverage (combining multiple EP Pro devices)
- Heatmap visualization
- Zone templates / presets

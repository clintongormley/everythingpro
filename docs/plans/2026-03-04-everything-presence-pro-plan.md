# Everything Presence Pro implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a custom HA integration for the Everything Presence Pro that provides Aqara-style grid-based zone configuration with a visual room editor, calibration, and multi-sensor fusion.

**Architecture:** Direct connection to EP Pro via `aioesphomeapi`. Zones computed HA-side from raw target X,Y data on a grid. Frontend is a TypeScript + Lit web component served by the integration, usable as both a custom panel and a Lovelace card. WebSocket API connects frontend to backend.

**Tech Stack:** Python 3.13+, aioesphomeapi, Home Assistant custom integration, TypeScript, Lit, Rollup

---

## Phase 1: Backend foundation

### Task 1: Project scaffolding and constants

**Files:**
- Create: `custom_components/everything_presence_pro/__init__.py`
- Create: `custom_components/everything_presence_pro/manifest.json`
- Create: `custom_components/everything_presence_pro/const.py`
- Create: `custom_components/everything_presence_pro/strings.json`
- Create: `custom_components/everything_presence_pro/translations/en.json`
- Create: `hacs.json`
- Create: `tests/conftest.py`
- Create: `tests/__init__.py`

**Step 1: Create manifest.json**

```json
{
  "domain": "everything_presence_pro",
  "name": "Everything Presence Pro",
  "codeowners": ["@clintongormley"],
  "config_flow": true,
  "dependencies": [],
  "documentation": "https://github.com/clintongormley/everythingpro",
  "iot_class": "local_push",
  "issue_tracker": "https://github.com/clintongormley/everythingpro/issues",
  "requirements": ["aioesphomeapi>=29.0.0"],
  "version": "0.1.0"
}
```

**Step 2: Create const.py**

```python
"""Constants for the Everything Presence Pro integration."""

DOMAIN = "everything_presence_pro"

# Grid dimensions (Aqara-style 320-cell grid)
GRID_COLS = 20
GRID_ROWS = 16
GRID_CELL_COUNT = GRID_COLS * GRID_ROWS  # 320

# LD2450 sensor limits
MAX_TARGETS = 3
MAX_RANGE_MM = 6000  # 6 meters
FOV_DEGREES = 120

# ESPHome API
DEFAULT_PORT = 6053

# Sensitivity defaults (consecutive frames to confirm presence)
SENSITIVITY_NORMAL = 3
SENSITIVITY_HIGH = 1
SENSITIVITY_LOW = 8

# Cell types
CELL_OUTSIDE = "outside"
CELL_ROOM = "room"

# Zone sensitivity types
ZONE_NORMAL = "normal"
ZONE_HIGH = "high"
ZONE_LOW = "low"
ZONE_EXCLUSION = "exclusion"

# Furniture types
FURNITURE_TYPES = [
    "bed",
    "desk",
    "sofa",
    "dining_table",
    "chair",
    "tv",
    "bookshelf",
    "wardrobe",
    "kitchen_counter",
    "bathtub",
    "shower",
    "toilet",
]

# ESPHome entity name patterns for EP Pro
# These are the entity object_id patterns used to identify EP Pro sensors
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

**Step 3: Create minimal `__init__.py`**

```python
"""Integration for Everything Presence Pro."""

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN

type EverythingPresenceProConfigEntry = ConfigEntry[None]


async def async_setup_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Set up Everything Presence Pro from a config entry."""
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Unload a config entry."""
    return True
```

**Step 4: Create hacs.json**

```json
{
  "name": "Everything Presence Pro",
  "render_readme": true
}
```

**Step 5: Create test scaffolding**

```python
# tests/__init__.py
"""Tests for Everything Presence Pro."""

# tests/conftest.py
"""Fixtures for Everything Presence Pro tests."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture
def mock_api_client():
    """Create a mock aioesphomeapi APIClient."""
    with patch("aioesphomeapi.APIClient") as mock_cls:
        client = AsyncMock()
        client.device_info = AsyncMock()
        client.list_entities_services = AsyncMock(return_value=([], []))
        client.subscribe_states = AsyncMock()
        client.disconnect = AsyncMock()
        mock_cls.return_value = client
        yield client
```

**Step 6: Create strings.json and translations**

```json
{
  "config": {
    "step": {
      "user": {
        "title": "Connect to Everything Presence Pro",
        "data": {
          "host": "Host",
          "noise_psk": "Encryption key"
        }
      }
    },
    "error": {
      "cannot_connect": "Unable to connect to device",
      "not_ep_pro": "Device is not an Everything Presence Pro",
      "invalid_auth": "Invalid encryption key"
    },
    "abort": {
      "already_configured": "Device is already configured"
    }
  }
}
```

**Step 7: Commit**

```bash
git add custom_components/ hacs.json tests/
git commit -m "feat: initial project scaffolding for Everything Presence Pro integration"
```

---

### Task 2: Config flow (discovery + manual setup)

**Files:**
- Create: `custom_components/everything_presence_pro/config_flow.py`
- Create: `tests/test_config_flow.py`

**Step 1: Write failing test for manual config flow**

```python
# tests/test_config_flow.py
"""Tests for the config flow."""

from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from aioesphomeapi import (
    APIConnectionError,
    DeviceInfo,
    InvalidAuthAPIError,
)

from custom_components.everything_presence_pro.const import DOMAIN


@pytest.fixture
def mock_device_info():
    """Create mock device info for an EP Pro."""
    info = MagicMock(spec=DeviceInfo)
    info.name = "everything-presence-pro-abc123"
    info.friendly_name = "Everything Presence Pro"
    info.mac_address = "AA:BB:CC:DD:EE:FF"
    info.model = "Everything Presence Pro"
    info.manufacturer = "Everything Smart Technology"
    return info


async def test_user_flow_success(hass, mock_device_info):
    """Test successful manual setup flow."""
    with patch(
        "custom_components.everything_presence_pro.config_flow.APIClient"
    ) as mock_client_cls:
        client = AsyncMock()
        client.connect = AsyncMock()
        client.device_info = AsyncMock(return_value=mock_device_info)
        client.disconnect = AsyncMock()
        mock_client_cls.return_value = client

        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": "user"}
        )
        assert result["type"] == "form"
        assert result["step_id"] == "user"

        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            user_input={"host": "192.168.1.100", "noise_psk": "test_key"},
        )
        assert result["type"] == "create_entry"
        assert result["title"] == "Everything Presence Pro"
        assert result["data"]["host"] == "192.168.1.100"


async def test_user_flow_cannot_connect(hass):
    """Test manual setup with connection failure."""
    with patch(
        "custom_components.everything_presence_pro.config_flow.APIClient"
    ) as mock_client_cls:
        client = AsyncMock()
        client.connect = AsyncMock(side_effect=APIConnectionError("timeout"))
        client.disconnect = AsyncMock()
        mock_client_cls.return_value = client

        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": "user"}
        )
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            user_input={"host": "192.168.1.100", "noise_psk": "test_key"},
        )
        assert result["type"] == "form"
        assert result["errors"]["base"] == "cannot_connect"


async def test_user_flow_invalid_auth(hass, mock_device_info):
    """Test manual setup with invalid auth."""
    with patch(
        "custom_components.everything_presence_pro.config_flow.APIClient"
    ) as mock_client_cls:
        client = AsyncMock()
        client.connect = AsyncMock(side_effect=InvalidAuthAPIError("bad key"))
        client.disconnect = AsyncMock()
        mock_client_cls.return_value = client

        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": "user"}
        )
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            user_input={"host": "192.168.1.100", "noise_psk": "bad_key"},
        )
        assert result["type"] == "form"
        assert result["errors"]["base"] == "invalid_auth"
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_config_flow.py -v`
Expected: FAIL — config_flow module doesn't exist yet

**Step 3: Implement config flow**

```python
# custom_components/everything_presence_pro/config_flow.py
"""Config flow for Everything Presence Pro."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from aioesphomeapi import (
    APIClient,
    APIConnectionError,
    InvalidAuthAPIError,
)

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DEFAULT_PORT, DOMAIN

_LOGGER = logging.getLogger(__name__)

USER_SCHEMA = vol.Schema(
    {
        vol.Required("host"): str,
        vol.Optional("noise_psk", default=""): str,
    }
)


class EverythingPresenceProConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Everything Presence Pro."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            host = user_input["host"]
            noise_psk = user_input.get("noise_psk", "")

            client = APIClient(
                host,
                DEFAULT_PORT,
                "",
                noise_psk=noise_psk or None,
            )

            try:
                await client.connect(login=True)
                device_info = await client.device_info()
            except InvalidAuthAPIError:
                errors["base"] = "invalid_auth"
            except APIConnectionError:
                errors["base"] = "cannot_connect"
            except Exception:
                _LOGGER.exception("Unexpected error connecting to device")
                errors["base"] = "cannot_connect"
            else:
                await self.async_set_unique_id(device_info.mac_address)
                self._abort_if_unique_id_configured()

                return self.async_create_entry(
                    title=device_info.friendly_name or device_info.name,
                    data={
                        "host": host,
                        "noise_psk": noise_psk,
                        "mac": device_info.mac_address,
                    },
                )
            finally:
                await client.disconnect()

        return self.async_show_form(
            step_id="user",
            data_schema=USER_SCHEMA,
            errors=errors,
        )
```

**Step 4: Run tests to verify they pass**

Run: `pytest tests/test_config_flow.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/config_flow.py tests/test_config_flow.py
git commit -m "feat: add config flow with manual setup and validation"
```

---

### Task 3: Zone engine (grid + cell mapping + sensitivity)

**Files:**
- Create: `custom_components/everything_presence_pro/zone_engine.py`
- Create: `tests/test_zone_engine.py`

**Step 1: Write failing tests**

```python
# tests/test_zone_engine.py
"""Tests for the zone engine."""

from custom_components.everything_presence_pro.zone_engine import (
    Grid,
    Zone,
    ZoneEngine,
)
from custom_components.everything_presence_pro.const import (
    CELL_OUTSIDE,
    CELL_ROOM,
    GRID_COLS,
    GRID_ROWS,
    ZONE_EXCLUSION,
    ZONE_HIGH,
    ZONE_LOW,
    ZONE_NORMAL,
)


def test_grid_creation():
    """Test grid initializes with correct dimensions."""
    grid = Grid(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    assert grid.cell_count == 320
    assert len(grid.cells) == 320
    # All cells default to room
    assert all(c == CELL_ROOM for c in grid.cells)


def test_grid_xy_to_cell():
    """Test mapping raw coordinates to grid cell index."""
    grid = Grid(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    # Sensor origin (0, 0) should map to a cell in the middle-bottom of grid
    cell = grid.xy_to_cell(0, 100)
    assert cell is not None
    assert 0 <= cell < grid.cell_count

    # Out of range should return None
    cell = grid.xy_to_cell(0, 7000)
    assert cell is None


def test_grid_xy_outside_fov():
    """Test coordinates outside field of view return None."""
    grid = Grid(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    # Far to the side, outside 120-degree FOV
    cell = grid.xy_to_cell(10000, 100)
    assert cell is None


def test_zone_engine_no_zones():
    """Test zone engine with no zones defined."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    result = engine.process_targets([(1000, 2000, True)])
    assert result.device_tracking_present is True
    assert len(result.zone_occupancy) == 0


def test_zone_engine_target_in_zone():
    """Test zone engine detects target in a zone."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    # Add a zone covering some cells
    # First, figure out which cell (1000, 2000) maps to
    cell = engine.grid.xy_to_cell(1000, 2000)
    assert cell is not None

    zone = Zone(id="z1", name="Desk", sensitivity=ZONE_NORMAL, cells=[cell])
    engine.set_zones([zone])

    result = engine.process_targets([(1000, 2000, True)])
    assert result.zone_occupancy["z1"] is True
    assert result.zone_target_counts["z1"] == 1


def test_zone_engine_target_not_in_zone():
    """Test zone engine when target is outside all zones."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    zone = Zone(id="z1", name="Desk", sensitivity=ZONE_NORMAL, cells=[0])
    engine.set_zones([zone])

    # Target far from cell 0
    result = engine.process_targets([(3000, 5000, True)])
    assert result.zone_occupancy["z1"] is False
    assert result.zone_target_counts["z1"] == 0


def test_zone_engine_exclusion_zone():
    """Test exclusion zones ignore targets."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    cell = engine.grid.xy_to_cell(1000, 2000)
    zone = Zone(id="z1", name="Fan", sensitivity=ZONE_EXCLUSION, cells=[cell])
    engine.set_zones([zone])

    result = engine.process_targets([(1000, 2000, True)])
    # Exclusion zones don't report occupancy
    assert "z1" not in result.zone_occupancy


def test_zone_engine_outside_cells_ignored():
    """Test targets in outside cells are ignored."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)
    cell = engine.grid.xy_to_cell(1000, 2000)
    engine.grid.cells[cell] = CELL_OUTSIDE

    result = engine.process_targets([(1000, 2000, True)])
    assert result.device_tracking_present is False


def test_zone_engine_multiple_targets_same_zone():
    """Test multiple targets in the same zone."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    cell1 = engine.grid.xy_to_cell(1000, 2000)
    cell2 = engine.grid.xy_to_cell(1050, 2050)
    cells = {cell1, cell2} if cell1 != cell2 else {cell1}
    zone = Zone(id="z1", name="Sofa", sensitivity=ZONE_NORMAL, cells=list(cells))
    engine.set_zones([zone])

    result = engine.process_targets([
        (1000, 2000, True),
        (1050, 2050, True),
    ])
    assert result.zone_occupancy["z1"] is True
    assert result.zone_target_counts["z1"] >= 1


def test_zone_noncontiguous_cells():
    """Test zones with non-contiguous cells work correctly."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    # Pick two cells far apart
    cell_a = engine.grid.xy_to_cell(-1000, 1000)
    cell_b = engine.grid.xy_to_cell(1000, 4000)
    assert cell_a != cell_b

    zone = Zone(id="z1", name="Split", sensitivity=ZONE_NORMAL, cells=[cell_a, cell_b])
    engine.set_zones([zone])

    # Target near cell_a
    result = engine.process_targets([(-1000, 1000, True)])
    assert result.zone_occupancy["z1"] is True

    # Target near cell_b
    result = engine.process_targets([(1000, 4000, True)])
    assert result.zone_occupancy["z1"] is True


def test_zone_high_sensitivity():
    """Test high sensitivity zones respond immediately."""
    engine = ZoneEngine(cols=20, rows=16, range_mm=6000, fov_degrees=120)

    cell = engine.grid.xy_to_cell(0, 3000)
    zone = Zone(id="z1", name="Bed", sensitivity=ZONE_HIGH, cells=[cell])
    engine.set_zones([zone])

    # Single frame should trigger high sensitivity zone
    result = engine.process_targets([(0, 3000, True)])
    assert result.zone_occupancy["z1"] is True
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_zone_engine.py -v`
Expected: FAIL — zone_engine module doesn't exist

**Step 3: Implement zone engine**

```python
# custom_components/everything_presence_pro/zone_engine.py
"""Zone engine for grid-based presence detection."""

from __future__ import annotations

import math
from dataclasses import dataclass, field


from .const import (
    CELL_OUTSIDE,
    CELL_ROOM,
    GRID_COLS,
    GRID_ROWS,
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
    """A named zone consisting of grid cells."""

    id: str
    name: str
    sensitivity: str
    cells: list[int]


@dataclass
class ProcessingResult:
    """Result of processing target positions."""

    device_tracking_present: bool = False
    zone_occupancy: dict[str, bool] = field(default_factory=dict)
    zone_target_counts: dict[str, int] = field(default_factory=dict)


class Grid:
    """Grid overlay on the sensor's detection area."""

    def __init__(
        self,
        cols: int = GRID_COLS,
        rows: int = GRID_ROWS,
        range_mm: int = 6000,
        fov_degrees: int = 120,
    ) -> None:
        """Initialize the grid."""
        self.cols = cols
        self.rows = rows
        self.cell_count = cols * rows
        self.range_mm = range_mm
        self.fov_degrees = fov_degrees
        self.fov_rad = math.radians(fov_degrees)
        self.cells: list[str] = [CELL_ROOM] * self.cell_count

        # Pre-compute grid boundaries
        # The grid maps the fan-shaped FOV into a rectangular grid
        # X range: -range * sin(fov/2) to +range * sin(fov/2)
        half_fov = self.fov_rad / 2
        self.x_max = range_mm * math.sin(half_fov)
        self.x_min = -self.x_max
        self.y_min = 0
        self.y_max = range_mm

        self.cell_width = (self.x_max - self.x_min) / cols
        self.cell_height = (self.y_max - self.y_min) / rows

    def xy_to_cell(self, x: float, y: float) -> int | None:
        """Map sensor X,Y coordinates (mm) to a grid cell index.

        Returns None if the point is outside the detection area.
        """
        # Check if within FOV angle
        if y <= 0:
            return None
        angle = math.atan2(abs(x), y)
        if angle > self.fov_rad / 2:
            return None

        # Check if within range
        distance = math.sqrt(x * x + y * y)
        if distance > self.range_mm:
            return None

        # Map to grid coordinates
        col = int((x - self.x_min) / self.cell_width)
        row = int(y / self.cell_height)

        # Clamp to grid bounds
        col = max(0, min(col, self.cols - 1))
        row = max(0, min(row, self.rows - 1))

        return row * self.cols + col

    def cell_to_center_xy(self, cell_index: int) -> tuple[float, float]:
        """Get the center X,Y coordinates of a cell."""
        row = cell_index // self.cols
        col = cell_index % self.cols

        x = self.x_min + (col + 0.5) * self.cell_width
        y = (row + 0.5) * self.cell_height

        return x, y


class ZoneEngine:
    """Computes zone occupancy from raw target positions."""

    def __init__(
        self,
        cols: int = GRID_COLS,
        rows: int = GRID_ROWS,
        range_mm: int = 6000,
        fov_degrees: int = 120,
    ) -> None:
        """Initialize the zone engine."""
        self.grid = Grid(cols, rows, range_mm, fov_degrees)
        self._zones: list[Zone] = []
        # Reverse lookup: cell index -> zone id (non-exclusion only)
        self._cell_to_zone: dict[int, str] = {}
        # Set of cells in exclusion zones
        self._exclusion_cells: set[int] = set()
        # Frame counters for sensitivity
        self._zone_frame_counts: dict[str, int] = {}
        self._sensitivity_thresholds: dict[str, int] = {
            ZONE_NORMAL: SENSITIVITY_NORMAL,
            ZONE_HIGH: SENSITIVITY_HIGH,
            ZONE_LOW: SENSITIVITY_LOW,
        }

    def set_zones(self, zones: list[Zone]) -> None:
        """Set the zone configuration."""
        self._zones = zones
        self._cell_to_zone.clear()
        self._exclusion_cells.clear()
        self._zone_frame_counts.clear()

        for zone in zones:
            if zone.sensitivity == ZONE_EXCLUSION:
                self._exclusion_cells.update(zone.cells)
            else:
                for cell in zone.cells:
                    self._cell_to_zone[cell] = zone.id
                self._zone_frame_counts[zone.id] = 0

    def process_targets(
        self, targets: list[tuple[float, float, bool]]
    ) -> ProcessingResult:
        """Process target positions and return zone occupancy.

        Args:
            targets: List of (x_mm, y_mm, active) tuples for each target.

        Returns:
            ProcessingResult with device and zone occupancy states.
        """
        result = ProcessingResult()
        zone_counts: dict[str, int] = {z.id: 0 for z in self._zones if z.sensitivity != ZONE_EXCLUSION}

        for x, y, active in targets:
            if not active:
                continue

            cell = self.grid.xy_to_cell(x, y)
            if cell is None:
                continue

            # Skip outside cells
            if self.grid.cells[cell] == CELL_OUTSIDE:
                continue

            # Skip exclusion zone cells
            if cell in self._exclusion_cells:
                continue

            result.device_tracking_present = True

            # Check zone membership
            zone_id = self._cell_to_zone.get(cell)
            if zone_id is not None:
                zone_counts[zone_id] += 1

        # Apply sensitivity and build results
        for zone in self._zones:
            if zone.sensitivity == ZONE_EXCLUSION:
                continue

            count = zone_counts.get(zone.id, 0)
            threshold = self._sensitivity_thresholds.get(zone.sensitivity, SENSITIVITY_NORMAL)

            if count > 0:
                self._zone_frame_counts[zone.id] = self._zone_frame_counts.get(zone.id, 0) + 1
            else:
                self._zone_frame_counts[zone.id] = 0

            occupied = self._zone_frame_counts[zone.id] >= threshold
            result.zone_occupancy[zone.id] = occupied
            result.zone_target_counts[zone.id] = count

        return result
```

**Step 4: Run tests to verify they pass**

Run: `pytest tests/test_zone_engine.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/zone_engine.py tests/test_zone_engine.py
git commit -m "feat: add zone engine with grid-based cell mapping and sensitivity"
```

---

### Task 4: Calibration engine

**Files:**
- Create: `custom_components/everything_presence_pro/calibration.py`
- Create: `tests/test_calibration.py`

**Step 1: Write failing tests**

```python
# tests/test_calibration.py
"""Tests for the calibration engine."""

import math

from custom_components.everything_presence_pro.calibration import (
    CalibrationPoint,
    CalibrationTransform,
)


def test_identity_transform():
    """Test transform with no calibration points is identity."""
    transform = CalibrationTransform()
    x, y = transform.apply(1000, 2000)
    assert x == 1000
    assert y == 2000


def test_simple_offset_calibration():
    """Test calibration corrects a simple offset."""
    transform = CalibrationTransform()
    # Sensor says (100, 200) but real position is (150, 250)
    # Sensor says (1000, 2000) but real position is (1050, 2050)
    points = [
        CalibrationPoint(sensor_x=100, sensor_y=200, real_x=150, real_y=250),
        CalibrationPoint(sensor_x=1000, sensor_y=2000, real_x=1050, real_y=2050),
        CalibrationPoint(sensor_x=500, sensor_y=1000, real_x=550, real_y=1050),
    ]
    transform.calibrate(points)

    x, y = transform.apply(100, 200)
    assert abs(x - 150) < 5
    assert abs(y - 250) < 5


def test_right_angle_constraint():
    """Test calibration with right angle constraint."""
    transform = CalibrationTransform()
    # Three points forming a right angle
    # Wall A: (0, 1000) to (0, 3000) — vertical wall
    # Wall B: (0, 1000) to (2000, 1000) — horizontal wall, meets wall A at right angle
    points = [
        CalibrationPoint(sensor_x=50, sensor_y=1020, real_x=0, real_y=1000),
        CalibrationPoint(sensor_x=40, sensor_y=3010, real_x=0, real_y=3000),
        CalibrationPoint(sensor_x=2030, sensor_y=1050, real_x=2000, real_y=1000),
    ]
    transform.calibrate(points)

    # After calibration, the transform should correct the skew
    x, y = transform.apply(50, 1020)
    assert abs(x - 0) < 50
    assert abs(y - 1000) < 50


def test_calibration_serialization():
    """Test calibration can be serialized and deserialized."""
    transform = CalibrationTransform()
    points = [
        CalibrationPoint(sensor_x=0, sensor_y=0, real_x=10, real_y=20),
        CalibrationPoint(sensor_x=1000, sensor_y=0, real_x=1010, real_y=20),
        CalibrationPoint(sensor_x=0, sensor_y=1000, real_x=10, real_y=1020),
    ]
    transform.calibrate(points)

    data = transform.to_dict()
    restored = CalibrationTransform.from_dict(data)

    x1, y1 = transform.apply(500, 500)
    x2, y2 = restored.apply(500, 500)
    assert abs(x1 - x2) < 0.01
    assert abs(y1 - y2) < 0.01


def test_no_calibration_points():
    """Test calibrate with empty list is identity."""
    transform = CalibrationTransform()
    transform.calibrate([])
    x, y = transform.apply(1000, 2000)
    assert x == 1000
    assert y == 2000
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_calibration.py -v`
Expected: FAIL

**Step 3: Implement calibration**

```python
# custom_components/everything_presence_pro/calibration.py
"""Calibration engine for sensor coordinate correction."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class CalibrationPoint:
    """A calibration reference point."""

    sensor_x: float  # Raw sensor X coordinate (mm)
    sensor_y: float  # Raw sensor Y coordinate (mm)
    real_x: float    # Actual physical X coordinate (mm)
    real_y: float    # Actual physical Y coordinate (mm)


class CalibrationTransform:
    """Affine transform for correcting sensor coordinate distortion.

    Uses least-squares to fit an affine transform from 3+ calibration points:
    real_x = a * sensor_x + b * sensor_y + tx
    real_y = c * sensor_x + d * sensor_y + ty
    """

    def __init__(self) -> None:
        """Initialize as identity transform."""
        # Affine matrix coefficients [a, b, tx, c, d, ty]
        self._a = 1.0
        self._b = 0.0
        self._tx = 0.0
        self._c = 0.0
        self._d = 1.0
        self._ty = 0.0

    def calibrate(self, points: list[CalibrationPoint]) -> None:
        """Compute affine transform from calibration points.

        Requires at least 3 non-collinear points.
        """
        if len(points) < 3:
            return

        # Solve using least squares for the affine transform
        # [real_x] = [a b tx] [sensor_x]
        # [real_y]   [c d ty] [sensor_y]
        #                     [1       ]
        n = len(points)

        # Build matrices for least squares: A * params = B
        # For X: real_x = a * sx + b * sy + tx
        # For Y: real_y = c * sx + d * sy + ty

        sx = [p.sensor_x for p in points]
        sy = [p.sensor_y for p in points]
        rx = [p.real_x for p in points]
        ry = [p.real_y for p in points]

        # Solve for X transform: [sx, sy, 1] * [a, b, tx]^T = rx
        # Solve for Y transform: [sx, sy, 1] * [c, d, ty]^T = ry
        # Using normal equations: A^T A x = A^T b

        # A^T A components
        sum_sx2 = sum(x * x for x in sx)
        sum_sy2 = sum(y * y for y in sy)
        sum_sxsy = sum(sx[i] * sy[i] for i in range(n))
        sum_sx_val = sum(sx)
        sum_sy_val = sum(sy)

        # Determinant of A^T A
        # [sum_sx2,   sum_sxsy, sum_sx]
        # [sum_sxsy,  sum_sy2,  sum_sy]
        # [sum_sx,    sum_sy,   n     ]
        det = (
            sum_sx2 * (sum_sy2 * n - sum_sy_val * sum_sy_val)
            - sum_sxsy * (sum_sxsy * n - sum_sy_val * sum_sx_val)
            + sum_sx_val * (sum_sxsy * sum_sy_val - sum_sy2 * sum_sx_val)
        )

        if abs(det) < 1e-10:
            # Points are collinear or degenerate, keep identity
            return

        # A^T b for X
        sum_sx_rx = sum(sx[i] * rx[i] for i in range(n))
        sum_sy_rx = sum(sy[i] * rx[i] for i in range(n))
        sum_rx = sum(rx)

        # A^T b for Y
        sum_sx_ry = sum(sx[i] * ry[i] for i in range(n))
        sum_sy_ry = sum(sy[i] * ry[i] for i in range(n))
        sum_ry = sum(ry)

        # Solve using Cramer's rule
        def solve_3x3(
            a11: float, a12: float, a13: float,
            a21: float, a22: float, a23: float,
            a31: float, a32: float, a33: float,
            b1: float, b2: float, b3: float,
        ) -> tuple[float, float, float]:
            d = (
                a11 * (a22 * a33 - a23 * a32)
                - a12 * (a21 * a33 - a23 * a31)
                + a13 * (a21 * a32 - a22 * a31)
            )
            d1 = (
                b1 * (a22 * a33 - a23 * a32)
                - a12 * (b2 * a33 - a23 * b3)
                + a13 * (b2 * a32 - a22 * b3)
            )
            d2 = (
                a11 * (b2 * a33 - a23 * b3)
                - b1 * (a21 * a33 - a23 * a31)
                + a13 * (a21 * b3 - b2 * a31)
            )
            d3 = (
                a11 * (a22 * b3 - b2 * a32)
                - a12 * (a21 * b3 - b2 * a31)
                + b1 * (a21 * a32 - a22 * a31)
            )
            return d1 / d, d2 / d, d3 / d

        self._a, self._b, self._tx = solve_3x3(
            sum_sx2, sum_sxsy, sum_sx_val,
            sum_sxsy, sum_sy2, sum_sy_val,
            sum_sx_val, sum_sy_val, n,
            sum_sx_rx, sum_sy_rx, sum_rx,
        )

        self._c, self._d, self._ty = solve_3x3(
            sum_sx2, sum_sxsy, sum_sx_val,
            sum_sxsy, sum_sy2, sum_sy_val,
            sum_sx_val, sum_sy_val, n,
            sum_sx_ry, sum_sy_ry, sum_ry,
        )

    def apply(self, x: float, y: float) -> tuple[float, float]:
        """Apply the calibration transform to sensor coordinates."""
        real_x = self._a * x + self._b * y + self._tx
        real_y = self._c * x + self._d * y + self._ty
        return real_x, real_y

    def to_dict(self) -> dict[str, Any]:
        """Serialize transform to a dictionary."""
        return {
            "a": self._a,
            "b": self._b,
            "tx": self._tx,
            "c": self._c,
            "d": self._d,
            "ty": self._ty,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> CalibrationTransform:
        """Deserialize transform from a dictionary."""
        transform = cls()
        if data:
            transform._a = data.get("a", 1.0)
            transform._b = data.get("b", 0.0)
            transform._tx = data.get("tx", 0.0)
            transform._c = data.get("c", 0.0)
            transform._d = data.get("d", 1.0)
            transform._ty = data.get("ty", 0.0)
        return transform
```

**Step 4: Run tests to verify they pass**

Run: `pytest tests/test_calibration.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/calibration.py tests/test_calibration.py
git commit -m "feat: add calibration engine with affine transform correction"
```

---

### Task 5: Coordinator (device connection + state subscription)

**Files:**
- Create: `custom_components/everything_presence_pro/coordinator.py`
- Create: `tests/test_coordinator.py`
- Modify: `custom_components/everything_presence_pro/__init__.py`

**Step 1: Write failing tests**

```python
# tests/test_coordinator.py
"""Tests for the data coordinator."""

from unittest.mock import AsyncMock, MagicMock, patch, call

import pytest

from custom_components.everything_presence_pro.coordinator import (
    EverythingPresenceProCoordinator,
)
from custom_components.everything_presence_pro.const import DOMAIN


@pytest.fixture
def mock_entry():
    """Create a mock config entry."""
    entry = MagicMock()
    entry.entry_id = "test_entry_id"
    entry.data = {
        "host": "192.168.1.100",
        "noise_psk": "test_key",
    }
    entry.options = {}
    return entry


@pytest.fixture
def mock_device_info():
    """Create mock device info."""
    info = MagicMock()
    info.name = "everything-presence-pro-abc123"
    info.friendly_name = "Everything Presence Pro"
    info.mac_address = "AA:BB:CC:DD:EE:FF"
    info.model = "Everything Presence Pro"
    return info


async def test_coordinator_creation(hass, mock_entry):
    """Test coordinator can be created."""
    coordinator = EverythingPresenceProCoordinator(hass, mock_entry)
    assert coordinator is not None
    assert coordinator.zones == []


async def test_coordinator_set_zones(hass, mock_entry):
    """Test setting zones on coordinator."""
    from custom_components.everything_presence_pro.zone_engine import Zone

    coordinator = EverythingPresenceProCoordinator(hass, mock_entry)
    zones = [
        Zone(id="z1", name="Desk", sensitivity="normal", cells=[10, 11, 12]),
    ]
    coordinator.set_zones(zones)
    assert len(coordinator.zones) == 1
    assert coordinator.zones[0].name == "Desk"
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_coordinator.py -v`
Expected: FAIL

**Step 3: Implement coordinator**

```python
# custom_components/everything_presence_pro/coordinator.py
"""Data coordinator for Everything Presence Pro."""

from __future__ import annotations

import logging
from typing import Any

from aioesphomeapi import (
    APIClient,
    EntityInfo,
    EntityState,
    SensorInfo,
    SensorState,
    BinarySensorInfo,
    BinarySensorState,
    TextSensorInfo,
    TextSensorState,
)

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .calibration import CalibrationTransform
from .const import (
    DEFAULT_PORT,
    DOMAIN,
    MAX_TARGETS,
)
from .zone_engine import ProcessingResult, Zone, ZoneEngine

_LOGGER = logging.getLogger(__name__)

SIGNAL_ZONES_UPDATED = f"{DOMAIN}_zones_updated"
SIGNAL_TARGETS_UPDATED = f"{DOMAIN}_targets_updated"


class EverythingPresenceProCoordinator:
    """Manage connection and data processing for an EP Pro device."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
    ) -> None:
        """Initialize the coordinator."""
        self.hass = hass
        self.entry = entry
        self._host = entry.data["host"]
        self._noise_psk = entry.data.get("noise_psk", "")

        self._client: APIClient | None = None
        self._connected = False

        # Sensor state
        self._target_positions: list[tuple[float, float, bool]] = [
            (0, 0, False)
        ] * MAX_TARGETS
        self._static_present = False
        self._pir_motion = False
        self._illuminance: float | None = None
        self._temperature: float | None = None
        self._humidity: float | None = None
        self._co2: float | None = None

        # Zone engine
        self._zone_engine = ZoneEngine()
        self._calibration = CalibrationTransform()
        self._last_result = ProcessingResult()

        # Entity key mapping (discovered during connection)
        self._entity_keys: dict[str, int] = {}

        # Room layout
        self._room_cells: list[str] = []
        self._furniture: list[dict[str, Any]] = []

        # Subscribers for live target streaming
        self._target_subscribers: list[callback] = []

    @property
    def zones(self) -> list[Zone]:
        """Return current zone list."""
        return self._zone_engine._zones

    @property
    def last_result(self) -> ProcessingResult:
        """Return last processing result."""
        return self._last_result

    @property
    def static_present(self) -> bool:
        """Return static mmWave presence state."""
        return self._static_present

    @property
    def pir_motion(self) -> bool:
        """Return PIR motion state."""
        return self._pir_motion

    @property
    def illuminance(self) -> float | None:
        """Return illuminance value."""
        return self._illuminance

    @property
    def temperature(self) -> float | None:
        """Return temperature value."""
        return self._temperature

    @property
    def humidity(self) -> float | None:
        """Return humidity value."""
        return self._humidity

    @property
    def co2(self) -> float | None:
        """Return CO2 value."""
        return self._co2

    @property
    def device_occupied(self) -> bool:
        """Return combined device occupancy."""
        return (
            self._pir_motion
            or self._static_present
            or self._last_result.device_tracking_present
        )

    @property
    def connected(self) -> bool:
        """Return connection state."""
        return self._connected

    def set_zones(self, zones: list[Zone]) -> None:
        """Update zone configuration."""
        self._zone_engine.set_zones(zones)
        # Reprocess with current target positions
        self._process_targets()
        async_dispatcher_send(
            self.hass, f"{SIGNAL_ZONES_UPDATED}_{self.entry.entry_id}"
        )

    def set_calibration(self, calibration: CalibrationTransform) -> None:
        """Update calibration transform."""
        self._calibration = calibration
        self._process_targets()

    def set_room_layout(
        self, cells: list[str], furniture: list[dict[str, Any]]
    ) -> None:
        """Update room layout."""
        self._room_cells = cells
        self._furniture = furniture
        if cells:
            self._zone_engine.grid.cells = cells.copy()
        self._process_targets()

    async def async_connect(self) -> None:
        """Connect to the device."""
        self._client = APIClient(
            self._host,
            DEFAULT_PORT,
            "",
            noise_psk=self._noise_psk or None,
        )
        await self._client.connect(login=True)
        self._connected = True

        # Discover entities
        device_info = await self._client.device_info()
        entities, services = await self._client.list_entities_services()

        self._map_entity_keys(entities)

        # Subscribe to state updates
        self._client.subscribe_states(self._on_state_update)

        _LOGGER.info(
            "Connected to %s (%s)",
            device_info.friendly_name,
            device_info.mac_address,
        )

    def _map_entity_keys(self, entities: list[EntityInfo]) -> None:
        """Map entity names to keys for fast lookup."""
        for entity in entities:
            if hasattr(entity, "object_id"):
                self._entity_keys[entity.object_id] = entity.key

    @callback
    def _on_state_update(self, state: EntityState) -> None:
        """Handle state update from device."""
        key = state.key

        # Find which entity this key belongs to
        for name, entity_key in self._entity_keys.items():
            if entity_key != key:
                continue

            if isinstance(state, SensorState) and not state.missing_state:
                self._handle_sensor_state(name, state.state)
            elif isinstance(state, BinarySensorState) and not state.missing_state:
                self._handle_binary_sensor_state(name, state.state)
            break

    def _handle_sensor_state(self, name: str, value: float) -> None:
        """Handle a sensor state update."""
        # Target position updates
        for i in range(1, MAX_TARGETS + 1):
            if name == f"target_{i}_x":
                self._target_positions[i - 1] = (
                    value,
                    self._target_positions[i - 1][1],
                    self._target_positions[i - 1][2],
                )
                if name == "target_1_x":
                    # Process all targets on the first target's X update
                    # (they arrive together in a batch)
                    self._process_targets()
                return
            if name == f"target_{i}_y":
                self._target_positions[i - 1] = (
                    self._target_positions[i - 1][0],
                    value,
                    self._target_positions[i - 1][2],
                )
                return

        # Environment sensors
        if "illuminance" in name:
            self._illuminance = value
        elif "temperature" in name:
            self._temperature = value
        elif "humidity" in name:
            self._humidity = value
        elif "co2" in name:
            self._co2 = value

    def _handle_binary_sensor_state(self, name: str, value: bool) -> None:
        """Handle a binary sensor state update."""
        for i in range(1, MAX_TARGETS + 1):
            if name == f"target_{i}_active":
                self._target_positions[i - 1] = (
                    self._target_positions[i - 1][0],
                    self._target_positions[i - 1][1],
                    value,
                )
                return

        if "mmwave" in name or "static" in name:
            self._static_present = value
        elif "pir" in name or "motion" in name:
            self._pir_motion = value

    @callback
    def _process_targets(self) -> None:
        """Apply calibration and run zone engine."""
        calibrated = []
        for x, y, active in self._target_positions:
            if active:
                cx, cy = self._calibration.apply(x, y)
                calibrated.append((cx, cy, True))
            else:
                calibrated.append((x, y, False))

        self._last_result = self._zone_engine.process_targets(calibrated)

        # Notify target subscribers (for live view)
        for sub_callback in self._target_subscribers:
            sub_callback(calibrated)

        # Signal HA entities to update
        async_dispatcher_send(
            self.hass, f"{SIGNAL_TARGETS_UPDATED}_{self.entry.entry_id}"
        )

    @callback
    def subscribe_targets(
        self, target_callback: callback
    ) -> callback:
        """Subscribe to live target position updates.

        Returns an unsubscribe callback.
        """
        self._target_subscribers.append(target_callback)

        def unsubscribe() -> None:
            self._target_subscribers.remove(target_callback)

        return unsubscribe

    async def async_disconnect(self) -> None:
        """Disconnect from the device."""
        if self._client:
            await self._client.disconnect()
            self._connected = False
            self._client = None

    def get_config_data(self) -> dict[str, Any]:
        """Get all configuration data for serialization."""
        return {
            "zones": [
                {
                    "id": z.id,
                    "name": z.name,
                    "sensitivity": z.sensitivity,
                    "cells": z.cells,
                }
                for z in self._zone_engine._zones
            ],
            "calibration": self._calibration.to_dict(),
            "room_cells": self._room_cells,
            "furniture": self._furniture,
        }

    def load_config_data(self, data: dict[str, Any]) -> None:
        """Load configuration from stored data."""
        if not data:
            return

        # Load calibration
        cal_data = data.get("calibration", {})
        self._calibration = CalibrationTransform.from_dict(cal_data)

        # Load room layout
        self._room_cells = data.get("room_cells", [])
        self._furniture = data.get("furniture", [])
        if self._room_cells:
            self._zone_engine.grid.cells = self._room_cells.copy()

        # Load zones
        zones_data = data.get("zones", [])
        zones = [
            Zone(
                id=z["id"],
                name=z["name"],
                sensitivity=z["sensitivity"],
                cells=z["cells"],
            )
            for z in zones_data
        ]
        self._zone_engine.set_zones(zones)
```

**Step 4: Update `__init__.py` to use coordinator**

```python
# custom_components/everything_presence_pro/__init__.py
"""Integration for Everything Presence Pro."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import EverythingPresenceProCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.BINARY_SENSOR, Platform.SENSOR]

type EverythingPresenceProConfigEntry = ConfigEntry[
    EverythingPresenceProCoordinator
]


async def async_setup_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Set up Everything Presence Pro from a config entry."""
    coordinator = EverythingPresenceProCoordinator(hass, entry)

    # Load stored configuration
    coordinator.load_config_data(entry.options.get("config", {}))

    # Connect to device
    await coordinator.async_connect()

    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(
        entry, PLATFORMS
    )
    if unload_ok:
        coordinator: EverythingPresenceProCoordinator = entry.runtime_data
        await coordinator.async_disconnect()

    return unload_ok
```

**Step 5: Run tests to verify they pass**

Run: `pytest tests/test_coordinator.py -v`
Expected: PASS

**Step 6: Commit**

```bash
git add custom_components/everything_presence_pro/coordinator.py custom_components/everything_presence_pro/__init__.py tests/test_coordinator.py
git commit -m "feat: add coordinator with device connection and state processing"
```

---

### Task 6: Binary sensor entities

**Files:**
- Create: `custom_components/everything_presence_pro/binary_sensor.py`
- Create: `tests/test_binary_sensor.py`

**Step 1: Write failing tests**

```python
# tests/test_binary_sensor.py
"""Tests for binary sensor entities."""

from unittest.mock import MagicMock, AsyncMock, patch

import pytest

from custom_components.everything_presence_pro.binary_sensor import (
    EverythingPresenceProOccupancySensor,
    EverythingPresenceProMotionSensor,
    EverythingPresenceProStaticPresenceSensor,
    EverythingPresenceProZoneOccupancySensor,
)
from custom_components.everything_presence_pro.zone_engine import (
    Zone,
    ProcessingResult,
)


@pytest.fixture
def mock_coordinator():
    """Create a mock coordinator."""
    coordinator = MagicMock()
    coordinator.entry = MagicMock()
    coordinator.entry.entry_id = "test_entry"
    coordinator.device_occupied = True
    coordinator.pir_motion = False
    coordinator.static_present = True
    coordinator.last_result = ProcessingResult(
        device_tracking_present=True,
        zone_occupancy={"z1": True},
        zone_target_counts={"z1": 1},
    )
    return coordinator


def test_occupancy_sensor_is_on(mock_coordinator):
    """Test device occupancy sensor reflects coordinator state."""
    sensor = EverythingPresenceProOccupancySensor(mock_coordinator)
    assert sensor.is_on is True


def test_motion_sensor_is_off(mock_coordinator):
    """Test motion sensor reflects PIR state."""
    sensor = EverythingPresenceProMotionSensor(mock_coordinator)
    assert sensor.is_on is False


def test_static_presence_sensor(mock_coordinator):
    """Test static presence sensor reflects SEN0609 state."""
    sensor = EverythingPresenceProStaticPresenceSensor(mock_coordinator)
    assert sensor.is_on is True


def test_zone_occupancy_sensor(mock_coordinator):
    """Test zone occupancy sensor reflects zone state."""
    zone = Zone(id="z1", name="Desk", sensitivity="normal", cells=[10])
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, zone)
    assert sensor.is_on is True
    assert sensor.name == "Desk"


def test_zone_occupancy_sensor_off(mock_coordinator):
    """Test zone occupancy sensor when zone is empty."""
    mock_coordinator.last_result.zone_occupancy["z2"] = False
    zone = Zone(id="z2", name="Sofa", sensitivity="normal", cells=[20])
    sensor = EverythingPresenceProZoneOccupancySensor(mock_coordinator, zone)
    assert sensor.is_on is False
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_binary_sensor.py -v`
Expected: FAIL

**Step 3: Implement binary sensors**

```python
# custom_components/everything_presence_pro/binary_sensor.py
"""Binary sensor entities for Everything Presence Pro."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .coordinator import (
    EverythingPresenceProCoordinator,
    SIGNAL_TARGETS_UPDATED,
    SIGNAL_ZONES_UPDATED,
)
from .zone_engine import Zone

if TYPE_CHECKING:
    from . import EverythingPresenceProConfigEntry


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EverythingPresenceProConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up binary sensor entities."""
    coordinator: EverythingPresenceProCoordinator = entry.runtime_data

    # Static entities (always present)
    entities: list[BinarySensorEntity] = [
        EverythingPresenceProOccupancySensor(coordinator),
        EverythingPresenceProMotionSensor(coordinator),
        EverythingPresenceProStaticPresenceSensor(coordinator),
    ]

    # Zone entities (dynamic)
    for zone in coordinator.zones:
        entities.append(
            EverythingPresenceProZoneOccupancySensor(coordinator, zone)
        )

    async_add_entities(entities)

    # Listen for zone changes to add/remove zone entities
    @callback
    def _on_zones_updated() -> None:
        new_entities = []
        for zone in coordinator.zones:
            new_entities.append(
                EverythingPresenceProZoneOccupancySensor(coordinator, zone)
            )
        async_add_entities(new_entities)

    async_dispatcher_connect(
        hass,
        f"{SIGNAL_ZONES_UPDATED}_{entry.entry_id}",
        _on_zones_updated,
    )


class EverythingPresenceProBaseEntity(BinarySensorEntity):
    """Base entity for EP Pro binary sensors."""

    _attr_has_entity_name = True

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator
    ) -> None:
        """Initialize the entity."""
        self._coordinator = coordinator
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
        )

    async def async_added_to_hass(self) -> None:
        """Subscribe to updates."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_TARGETS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._handle_update,
            )
        )

    @callback
    def _handle_update(self) -> None:
        """Handle state update."""
        self.async_write_ha_state()


class EverythingPresenceProOccupancySensor(EverythingPresenceProBaseEntity):
    """Combined device occupancy sensor."""

    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_translation_key = "occupancy"

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_occupancy"

    @property
    def is_on(self) -> bool:
        """Return true if occupied."""
        return self._coordinator.device_occupied


class EverythingPresenceProMotionSensor(EverythingPresenceProBaseEntity):
    """PIR motion sensor."""

    _attr_device_class = BinarySensorDeviceClass.MOTION
    _attr_translation_key = "motion"

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_motion"

    @property
    def is_on(self) -> bool:
        """Return true if motion detected."""
        return self._coordinator.pir_motion


class EverythingPresenceProStaticPresenceSensor(
    EverythingPresenceProBaseEntity
):
    """Static mmWave presence sensor (SEN0609)."""

    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_translation_key = "static_presence"

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = (
            f"{coordinator.entry.entry_id}_static_presence"
        )

    @property
    def is_on(self) -> bool:
        """Return true if static presence detected."""
        return self._coordinator.static_present


class EverythingPresenceProZoneOccupancySensor(
    EverythingPresenceProBaseEntity
):
    """Zone occupancy sensor."""

    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY

    def __init__(
        self,
        coordinator: EverythingPresenceProCoordinator,
        zone: Zone,
    ) -> None:
        """Initialize the zone sensor."""
        super().__init__(coordinator)
        self._zone = zone
        self._attr_unique_id = (
            f"{coordinator.entry.entry_id}_zone_{zone.id}"
        )
        self._attr_name = zone.name

    @property
    def is_on(self) -> bool:
        """Return true if zone is occupied."""
        return self._coordinator.last_result.zone_occupancy.get(
            self._zone.id, False
        )

    @property
    def extra_state_attributes(self) -> dict[str, int]:
        """Return target count as extra attribute."""
        return {
            "target_count": self._coordinator.last_result.zone_target_counts.get(
                self._zone.id, 0
            ),
        }
```

**Step 4: Run tests to verify they pass**

Run: `pytest tests/test_binary_sensor.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/binary_sensor.py tests/test_binary_sensor.py
git commit -m "feat: add binary sensor entities for occupancy, motion, and zones"
```

---

### Task 7: Sensor entities (environment + zone target counts)

**Files:**
- Create: `custom_components/everything_presence_pro/sensor.py`
- Create: `tests/test_sensor.py`

**Step 1: Write failing tests**

```python
# tests/test_sensor.py
"""Tests for sensor entities."""

from unittest.mock import MagicMock

from custom_components.everything_presence_pro.sensor import (
    EverythingPresenceProIlluminanceSensor,
    EverythingPresenceProTemperatureSensor,
    EverythingPresenceProHumiditySensor,
    EverythingPresenceProZoneTargetCountSensor,
)
from custom_components.everything_presence_pro.zone_engine import (
    Zone,
    ProcessingResult,
)


@pytest.fixture
def mock_coordinator():
    """Create a mock coordinator."""
    coordinator = MagicMock()
    coordinator.entry = MagicMock()
    coordinator.entry.entry_id = "test_entry"
    coordinator.illuminance = 350.0
    coordinator.temperature = 22.5
    coordinator.humidity = 45.0
    coordinator.co2 = 420.0
    coordinator.last_result = ProcessingResult(
        device_tracking_present=True,
        zone_occupancy={"z1": True},
        zone_target_counts={"z1": 2},
    )
    return coordinator


import pytest


def test_illuminance_sensor(mock_coordinator):
    """Test illuminance sensor value."""
    sensor = EverythingPresenceProIlluminanceSensor(mock_coordinator)
    assert sensor.native_value == 350.0


def test_temperature_sensor(mock_coordinator):
    """Test temperature sensor value."""
    sensor = EverythingPresenceProTemperatureSensor(mock_coordinator)
    assert sensor.native_value == 22.5


def test_humidity_sensor(mock_coordinator):
    """Test humidity sensor value."""
    sensor = EverythingPresenceProHumiditySensor(mock_coordinator)
    assert sensor.native_value == 45.0


def test_zone_target_count_sensor(mock_coordinator):
    """Test zone target count sensor."""
    zone = Zone(id="z1", name="Desk", sensitivity="normal", cells=[10])
    sensor = EverythingPresenceProZoneTargetCountSensor(
        mock_coordinator, zone
    )
    assert sensor.native_value == 2
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_sensor.py -v`
Expected: FAIL

**Step 3: Implement sensor entities**

```python
# custom_components/everything_presence_pro/sensor.py
"""Sensor entities for Everything Presence Pro."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import (
    CONCENTRATION_PARTS_PER_MILLION,
    LIGHT_LUX,
    PERCENTAGE,
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .coordinator import (
    EverythingPresenceProCoordinator,
    SIGNAL_TARGETS_UPDATED,
    SIGNAL_ZONES_UPDATED,
)
from .zone_engine import Zone

if TYPE_CHECKING:
    from . import EverythingPresenceProConfigEntry


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EverythingPresenceProConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up sensor entities."""
    coordinator: EverythingPresenceProCoordinator = entry.runtime_data

    entities: list[SensorEntity] = [
        EverythingPresenceProIlluminanceSensor(coordinator),
        EverythingPresenceProTemperatureSensor(coordinator),
        EverythingPresenceProHumiditySensor(coordinator),
    ]

    if coordinator.co2 is not None:
        entities.append(EverythingPresenceProCO2Sensor(coordinator))

    for zone in coordinator.zones:
        entities.append(
            EverythingPresenceProZoneTargetCountSensor(coordinator, zone)
        )

    async_add_entities(entities)


class EverythingPresenceProBaseSensor(SensorEntity):
    """Base sensor entity."""

    _attr_has_entity_name = True
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator
    ) -> None:
        """Initialize the sensor."""
        self._coordinator = coordinator
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
        )

    async def async_added_to_hass(self) -> None:
        """Subscribe to updates."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_TARGETS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._handle_update,
            )
        )

    @callback
    def _handle_update(self) -> None:
        """Handle update."""
        self.async_write_ha_state()


class EverythingPresenceProIlluminanceSensor(
    EverythingPresenceProBaseSensor
):
    """Illuminance sensor."""

    _attr_device_class = SensorDeviceClass.ILLUMINANCE
    _attr_native_unit_of_measurement = LIGHT_LUX
    _attr_translation_key = "illuminance"

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_illuminance"

    @property
    def native_value(self) -> float | None:
        """Return illuminance value."""
        return self._coordinator.illuminance


class EverythingPresenceProTemperatureSensor(
    EverythingPresenceProBaseSensor
):
    """Temperature sensor."""

    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_translation_key = "temperature"

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_temperature"

    @property
    def native_value(self) -> float | None:
        """Return temperature value."""
        return self._coordinator.temperature


class EverythingPresenceProHumiditySensor(EverythingPresenceProBaseSensor):
    """Humidity sensor."""

    _attr_device_class = SensorDeviceClass.HUMIDITY
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_translation_key = "humidity"

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_humidity"

    @property
    def native_value(self) -> float | None:
        """Return humidity value."""
        return self._coordinator.humidity


class EverythingPresenceProCO2Sensor(EverythingPresenceProBaseSensor):
    """CO2 sensor."""

    _attr_device_class = SensorDeviceClass.CO2
    _attr_native_unit_of_measurement = CONCENTRATION_PARTS_PER_MILLION
    _attr_translation_key = "co2"

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_co2"

    @property
    def native_value(self) -> float | None:
        """Return CO2 value."""
        return self._coordinator.co2


class EverythingPresenceProZoneTargetCountSensor(
    EverythingPresenceProBaseSensor
):
    """Zone target count sensor."""

    _attr_translation_key = "zone_target_count"

    def __init__(
        self,
        coordinator: EverythingPresenceProCoordinator,
        zone: Zone,
    ) -> None:
        """Initialize the zone target count sensor."""
        super().__init__(coordinator)
        self._zone = zone
        self._attr_unique_id = (
            f"{coordinator.entry.entry_id}_zone_{zone.id}_count"
        )
        self._attr_name = f"{zone.name} target count"

    @property
    def native_value(self) -> int:
        """Return target count in zone."""
        return self._coordinator.last_result.zone_target_counts.get(
            self._zone.id, 0
        )
```

**Step 4: Run tests to verify they pass**

Run: `pytest tests/test_sensor.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/sensor.py tests/test_sensor.py
git commit -m "feat: add sensor entities for illuminance, temperature, humidity, CO2, zone counts"
```

---

### Task 8: WebSocket API

**Files:**
- Create: `custom_components/everything_presence_pro/websocket_api.py`
- Create: `tests/test_websocket_api.py`

**Step 1: Write failing tests**

```python
# tests/test_websocket_api.py
"""Tests for the WebSocket API."""

from unittest.mock import MagicMock, patch

import pytest

from custom_components.everything_presence_pro.websocket_api import (
    websocket_get_config,
    websocket_set_zones,
)
from custom_components.everything_presence_pro.zone_engine import Zone


@pytest.fixture
def mock_coordinator():
    """Create a mock coordinator."""
    coordinator = MagicMock()
    coordinator.entry = MagicMock()
    coordinator.entry.entry_id = "test_entry"
    coordinator.get_config_data.return_value = {
        "zones": [],
        "calibration": {},
        "room_cells": [],
        "furniture": [],
    }
    return coordinator


def test_websocket_get_config_returns_data(mock_coordinator):
    """Test get_config returns coordinator config."""
    hass = MagicMock()
    hass.config_entries.async_get_entry.return_value = MagicMock(
        runtime_data=mock_coordinator
    )

    connection = MagicMock()
    msg = {"id": 1, "type": "everything_presence_pro/get_config", "entry_id": "test_entry"}

    websocket_get_config(hass, connection, msg)
    connection.send_result.assert_called_once_with(1, {
        "zones": [],
        "calibration": {},
        "room_cells": [],
        "furniture": [],
    })
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_websocket_api.py -v`
Expected: FAIL

**Step 3: Implement WebSocket API**

```python
# custom_components/everything_presence_pro/websocket_api.py
"""WebSocket API for Everything Presence Pro."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .coordinator import EverythingPresenceProCoordinator
from .calibration import CalibrationPoint, CalibrationTransform
from .zone_engine import Zone


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register WebSocket commands."""
    websocket_api.async_register_command(hass, websocket_get_config)
    websocket_api.async_register_command(hass, websocket_set_zones)
    websocket_api.async_register_command(hass, websocket_set_calibration)
    websocket_api.async_register_command(hass, websocket_set_room_layout)
    websocket_api.async_register_command(hass, websocket_subscribe_targets)


def _get_coordinator(
    hass: HomeAssistant, entry_id: str
) -> EverythingPresenceProCoordinator | None:
    """Get coordinator for an entry."""
    entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None:
        return None
    return entry.runtime_data


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/get_config",
        vol.Required("entry_id"): str,
    }
)
@callback
def websocket_get_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get configuration for the frontend."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Entry not found")
        return

    connection.send_result(msg["id"], coordinator.get_config_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_zones",
        vol.Required("entry_id"): str,
        vol.Required("zones"): [
            {
                vol.Required("id"): str,
                vol.Required("name"): str,
                vol.Required("sensitivity"): str,
                vol.Required("cells"): [int],
            }
        ],
    }
)
@websocket_api.async_response
async def websocket_set_zones(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set zone definitions."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Entry not found")
        return

    zones = [
        Zone(
            id=z["id"],
            name=z["name"],
            sensitivity=z["sensitivity"],
            cells=z["cells"],
        )
        for z in msg["zones"]
    ]
    coordinator.set_zones(zones)

    # Persist to config entry options
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    hass.config_entries.async_update_entry(
        entry,
        options={**entry.options, "config": coordinator.get_config_data()},
    )

    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_calibration",
        vol.Required("entry_id"): str,
        vol.Required("points"): [
            {
                vol.Required("sensor_x"): vol.Coerce(float),
                vol.Required("sensor_y"): vol.Coerce(float),
                vol.Required("real_x"): vol.Coerce(float),
                vol.Required("real_y"): vol.Coerce(float),
            }
        ],
    }
)
@websocket_api.async_response
async def websocket_set_calibration(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set calibration points and compute transform."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Entry not found")
        return

    points = [
        CalibrationPoint(
            sensor_x=p["sensor_x"],
            sensor_y=p["sensor_y"],
            real_x=p["real_x"],
            real_y=p["real_y"],
        )
        for p in msg["points"]
    ]
    transform = CalibrationTransform()
    transform.calibrate(points)
    coordinator.set_calibration(transform)

    # Persist
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    hass.config_entries.async_update_entry(
        entry,
        options={**entry.options, "config": coordinator.get_config_data()},
    )

    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_room_layout",
        vol.Required("entry_id"): str,
        vol.Required("room_cells"): [str],
        vol.Optional("furniture", default=[]): [
            {
                vol.Required("type"): str,
                vol.Required("cells"): [int],
                vol.Optional("label", default=""): str,
            }
        ],
    }
)
@websocket_api.async_response
async def websocket_set_room_layout(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set room layout (cell types and furniture)."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Entry not found")
        return

    coordinator.set_room_layout(msg["room_cells"], msg.get("furniture", []))

    # Persist
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    hass.config_entries.async_update_entry(
        entry,
        options={**entry.options, "config": coordinator.get_config_data()},
    )

    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/subscribe_targets",
        vol.Required("entry_id"): str,
    }
)
@callback
def websocket_subscribe_targets(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Subscribe to live target position updates."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Entry not found")
        return

    @callback
    def forward_targets(
        targets: list[tuple[float, float, bool]],
    ) -> None:
        connection.send_message(
            websocket_api.event_message(
                msg["id"],
                {
                    "targets": [
                        {"x": x, "y": y, "active": active}
                        for x, y, active in targets
                    ],
                },
            )
        )

    unsub = coordinator.subscribe_targets(forward_targets)
    connection.subscriptions[msg["id"]] = unsub

    connection.send_result(msg["id"])
```

**Step 4: Update `__init__.py` to register WS commands**

Add to `async_setup_entry` in `__init__.py`, before the coordinator setup:

```python
from .websocket_api import async_register_websocket_commands

# In async_setup_entry, add at the beginning:
async_register_websocket_commands(hass)
```

**Step 5: Run tests to verify they pass**

Run: `pytest tests/test_websocket_api.py -v`
Expected: PASS

**Step 6: Commit**

```bash
git add custom_components/everything_presence_pro/websocket_api.py custom_components/everything_presence_pro/__init__.py tests/test_websocket_api.py
git commit -m "feat: add WebSocket API for zone CRUD, calibration, room layout, and live targets"
```

---

## Phase 2: Frontend

### Task 9: Frontend project scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/rollup.config.js`
- Create: `frontend/src/index.ts`
- Create: `frontend/src/everything-presence-pro-panel.ts`

**Step 1: Create package.json**

```json
{
  "name": "everything-presence-pro-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w"
  },
  "dependencies": {
    "lit": "^3.1.0"
  },
  "devDependencies": {
    "@rollup/plugin-node-resolve": "^15.2.0",
    "@rollup/plugin-typescript": "^11.1.0",
    "rollup": "^4.9.0",
    "rollup-plugin-terser": "^7.0.2",
    "tslib": "^2.6.0",
    "typescript": "^5.3.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ES2020",
    "moduleResolution": "node",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "declaration": false,
    "strict": true,
    "noImplicitAny": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "outDir": "./dist",
    "sourceMap": true
  },
  "include": ["src/**/*.ts"]
}
```

**Step 3: Create rollup.config.js**

```javascript
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.ts",
  output: {
    file: "../custom_components/everything_presence_pro/frontend/everything-presence-pro-panel.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    resolve(),
    typescript(),
    terser(),
  ],
};
```

**Step 4: Create entry point and shell component**

```typescript
// frontend/src/index.ts
export { EverythingPresenceProPanel } from "./everything-presence-pro-panel";
```

```typescript
// frontend/src/everything-presence-pro-panel.ts
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

interface Target {
  x: number;
  y: number;
  active: boolean;
}

interface ZoneConfig {
  id: string;
  name: string;
  sensitivity: string;
  cells: number[];
}

interface Config {
  zones: ZoneConfig[];
  calibration: Record<string, number>;
  room_cells: string[];
  furniture: Array<{ type: string; cells: number[]; label: string }>;
}

@customElement("everything-presence-pro-panel")
export class EverythingPresenceProPanel extends LitElement {
  @property({ attribute: false }) hass: any;
  @property({ type: String }) entryId = "";

  @state() private _config: Config | null = null;
  @state() private _targets: Target[] = [];
  @state() private _selectedTool = "room";
  @state() private _selectedZoneId = "";
  @state() private _gridCells: string[] = [];

  private _unsubscribe: (() => void) | null = null;

  // Grid dimensions matching backend
  private readonly COLS = 20;
  private readonly ROWS = 16;
  private readonly CELL_COUNT = 320;

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      font-family: var(--primary-font-family, Roboto, sans-serif);
    }
    .container {
      display: flex;
      gap: 16px;
    }
    .grid-container {
      flex: 1;
      position: relative;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(20, 1fr);
      gap: 1px;
      background: var(--divider-color, #e0e0e0);
      border: 1px solid var(--divider-color, #e0e0e0);
      aspect-ratio: 20 / 16;
    }
    .cell {
      background: var(--card-background-color, white);
      cursor: pointer;
      position: relative;
      transition: background-color 0.1s;
    }
    .cell:hover {
      opacity: 0.8;
    }
    .cell.outside {
      background: var(--secondary-background-color, #f5f5f5);
    }
    .cell.room {
      background: var(--card-background-color, white);
    }
    .target-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .target-dot {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--error-color, red);
      transform: translate(-50%, -50%);
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
    }
    .sidebar {
      width: 280px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .tool-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .tool-btn {
      padding: 8px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      cursor: pointer;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      text-align: left;
    }
    .tool-btn.active {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
      border-color: var(--primary-color);
    }
    h3 {
      margin: 0;
      color: var(--primary-text-color);
    }
    .zone-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._initGrid();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  private _initGrid(): void {
    this._gridCells = new Array(this.CELL_COUNT).fill("room");
  }

  protected render() {
    return html`
      <div class="container">
        <div class="grid-container">
          <div class="grid">
            ${this._gridCells.map(
              (cell, index) => html`
                <div
                  class="cell ${cell}"
                  style="${this._getCellStyle(cell, index)}"
                  @mousedown=${() => this._onCellClick(index)}
                  @mouseenter=${(e: MouseEvent) =>
                    this._onCellDrag(index, e)}
                ></div>
              `
            )}
          </div>
          <div class="target-overlay">
            ${this._targets
              .filter((t) => t.active)
              .map(
                (t) => html`
                  <div
                    class="target-dot"
                    style="left: ${this._targetToGridX(t.x)}%; top: ${this._targetToGridY(t.y)}%"
                  ></div>
                `
              )}
          </div>
        </div>
        <div class="sidebar">
          <h3>Tools</h3>
          <div class="tool-group">
            <button
              class="tool-btn ${this._selectedTool === "room" ? "active" : ""}"
              @click=${() => (this._selectedTool = "room")}
            >
              Room (inside)
            </button>
            <button
              class="tool-btn ${this._selectedTool === "outside"
                ? "active"
                : ""}"
              @click=${() => (this._selectedTool = "outside")}
            >
              Outside (wall)
            </button>
            <button
              class="tool-btn ${this._selectedTool === "furniture"
                ? "active"
                : ""}"
              @click=${() => (this._selectedTool = "furniture")}
            >
              Furniture
            </button>
            <button
              class="tool-btn ${this._selectedTool === "zone" ? "active" : ""}"
              @click=${() => (this._selectedTool = "zone")}
            >
              Zone
            </button>
            <button
              class="tool-btn ${this._selectedTool === "calibrate"
                ? "active"
                : ""}"
              @click=${() => (this._selectedTool = "calibrate")}
            >
              Calibrate
            </button>
          </div>

          ${this._selectedTool === "zone" ? this._renderZoneSidebar() : ""}
        </div>
      </div>
    `;
  }

  private _renderZoneSidebar() {
    const zones = this._config?.zones ?? [];
    return html`
      <h3>Zones</h3>
      <div class="zone-list">
        ${zones.map(
          (z) => html`
            <button
              class="tool-btn ${this._selectedZoneId === z.id ? "active" : ""}"
              @click=${() => (this._selectedZoneId = z.id)}
            >
              ${z.name} (${z.sensitivity})
            </button>
          `
        )}
        <button class="tool-btn" @click=${this._addZone}>+ Add zone</button>
      </div>
    `;
  }

  private _getCellStyle(cellType: string, index: number): string {
    if (!this._config) return "";
    // Check if cell belongs to a zone
    for (const zone of this._config.zones) {
      if (zone.cells.includes(index)) {
        return `background: ${this._zoneColor(zone.id)}`;
      }
    }
    return "";
  }

  private _zoneColor(zoneId: string): string {
    const colors = [
      "rgba(33, 150, 243, 0.4)",
      "rgba(76, 175, 80, 0.4)",
      "rgba(255, 152, 0, 0.4)",
      "rgba(156, 39, 176, 0.4)",
      "rgba(244, 67, 54, 0.4)",
      "rgba(0, 188, 212, 0.4)",
    ];
    const idx =
      (this._config?.zones.findIndex((z) => z.id === zoneId) ?? 0) %
      colors.length;
    return colors[idx];
  }

  private _onCellClick(index: number): void {
    if (this._selectedTool === "room") {
      this._gridCells = [...this._gridCells];
      this._gridCells[index] = "room";
    } else if (this._selectedTool === "outside") {
      this._gridCells = [...this._gridCells];
      this._gridCells[index] = "outside";
    }
    this.requestUpdate();
  }

  private _onCellDrag(index: number, e: MouseEvent): void {
    if (e.buttons !== 1) return;
    this._onCellClick(index);
  }

  private _addZone(): void {
    const name = prompt("Zone name:");
    if (!name) return;
    const id = `zone_${Date.now()}`;
    const zones = [...(this._config?.zones ?? [])];
    zones.push({ id, name, sensitivity: "normal", cells: [] });
    this._config = { ...this._config!, zones };
    this._selectedZoneId = id;
  }

  private _targetToGridX(xMm: number): number {
    // Map sensor X (-x_max to +x_max) to grid percentage (0-100)
    const halfFov = (120 / 2) * (Math.PI / 180);
    const xMax = 6000 * Math.sin(halfFov);
    return ((xMm + xMax) / (2 * xMax)) * 100;
  }

  private _targetToGridY(yMm: number): number {
    // Map sensor Y (0 to 6000) to grid percentage (0-100)
    return (yMm / 6000) * 100;
  }
}
```

**Step 5: Install dependencies and build**

```bash
cd frontend && npm install && npm run build
```

**Step 6: Commit**

```bash
git add frontend/ custom_components/everything_presence_pro/frontend/
git commit -m "feat: add frontend scaffolding with grid editor and live target overlay"
```

---

### Task 10: Panel registration in integration

**Files:**
- Modify: `custom_components/everything_presence_pro/__init__.py`

**Step 1: Add panel registration**

Add to `__init__.py`:

```python
from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
import os

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")

async def async_setup_entry(
    hass: HomeAssistant, entry: EverythingPresenceProConfigEntry
) -> bool:
    """Set up Everything Presence Pro from a config entry."""
    # Register WebSocket commands (idempotent)
    async_register_websocket_commands(hass)

    # Register frontend panel
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path=f"/{DOMAIN}_static",
            path=FRONTEND_DIR,
            cache_headers=True,
        )
    ])
    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=DOMAIN,
        webcomponent_name="everything-presence-pro-panel",
        module_url=f"/{DOMAIN}_static/everything-presence-pro-panel.js",
        sidebar_title="EP Pro",
        sidebar_icon="mdi:radar",
        require_admin=False,
        config={"entry_id": entry.entry_id},
    )

    # Set up coordinator
    coordinator = EverythingPresenceProCoordinator(hass, entry)
    coordinator.load_config_data(entry.options.get("config", {}))
    await coordinator.async_connect()
    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True
```

**Step 2: Commit**

```bash
git add custom_components/everything_presence_pro/__init__.py
git commit -m "feat: register custom panel for zone editor in HA sidebar"
```

---

## Phase 3: Integration testing and polish

### Task 11: End-to-end integration test

**Files:**
- Create: `tests/test_init.py`

**Step 1: Write integration test**

```python
# tests/test_init.py
"""Tests for integration setup and teardown."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.everything_presence_pro.const import DOMAIN


@pytest.fixture
def mock_config_entry(hass):
    """Create a mock config entry."""
    entry = MagicMock()
    entry.entry_id = "test_entry_id"
    entry.domain = DOMAIN
    entry.data = {
        "host": "192.168.1.100",
        "noise_psk": "test_key",
        "mac": "AA:BB:CC:DD:EE:FF",
    }
    entry.options = {}
    entry.runtime_data = None
    return entry


async def test_setup_and_unload(hass, mock_config_entry):
    """Test integration setup and teardown."""
    with patch(
        "custom_components.everything_presence_pro.coordinator.APIClient"
    ) as mock_client_cls:
        client = AsyncMock()
        client.connect = AsyncMock()
        client.device_info = AsyncMock(
            return_value=MagicMock(
                friendly_name="EP Pro",
                mac_address="AA:BB:CC:DD:EE:FF",
            )
        )
        client.list_entities_services = AsyncMock(return_value=([], []))
        client.subscribe_states = MagicMock()
        client.disconnect = AsyncMock()
        mock_client_cls.return_value = client

        # Test setup
        from custom_components.everything_presence_pro import (
            async_setup_entry,
            async_unload_entry,
        )

        result = await async_setup_entry(hass, mock_config_entry)
        assert result is True
        assert mock_config_entry.runtime_data is not None

        # Test unload
        result = await async_unload_entry(hass, mock_config_entry)
        assert result is True
        client.disconnect.assert_called_once()
```

**Step 2: Run tests**

Run: `pytest tests/test_init.py -v`
Expected: PASS

**Step 3: Run all tests**

Run: `pytest tests/ -v`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add tests/test_init.py
git commit -m "feat: add end-to-end integration setup/teardown test"
```

---

### Task 12: Final polish and documentation

**Files:**
- Modify: `custom_components/everything_presence_pro/strings.json` (add all translation keys)
- Create: `custom_components/everything_presence_pro/translations/en.json`

**Step 1: Finalize strings**

Update `strings.json` with all entity translation keys.

**Step 2: Run full test suite**

Run: `pytest tests/ -v`
Expected: ALL PASS

**Step 3: Verify HACS compatibility**

Run: Check `manifest.json` has all required fields, `hacs.json` exists.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: finalize translations and HACS compatibility"
```

---

## Summary

| Phase | Tasks | What you get |
|---|---|---|
| Phase 1 (Backend) | Tasks 1-8 | Working integration: connects to EP Pro, grid-based zones, calibration, all entities, WebSocket API |
| Phase 2 (Frontend) | Tasks 9-10 | Visual zone editor with grid painting, live targets, sidebar panel |
| Phase 3 (Polish) | Tasks 11-12 | Integration tests, translations, HACS readiness |

**Total: 12 tasks, each broken into 3-6 steps.**

The frontend (Tasks 9-10) is a shell that provides the basic grid editor. Further frontend iterations (furniture placement UI, calibration flow, zone sensitivity picker, Lovelace card mode) would follow as incremental improvements after the core is working.

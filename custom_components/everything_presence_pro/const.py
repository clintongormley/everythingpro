"""Constants for the Everything Presence Pro integration."""

DOMAIN = "everything_presence_pro"

# Grid
GRID_COLS = 20
GRID_ROWS = 20
GRID_CELL_SIZE_MM = 300  # Fixed 300mm x 300mm cells

# LD2450 sensor limits
MAX_TARGETS = 3
MAX_RANGE_MM = 6000  # 6 meters
FOV_DEGREES = 120

# ESPHome API
DEFAULT_PORT = 6053

# Grid cell byte format:
# Bit 0: room (0=outside, 1=inside)
# Bits 1-3: zone number (0=room default, 1-7=named zone)
# Bits 4-7: per-cell training (reserved, default 0)
CELL_ROOM_BIT = 0x01
CELL_ZONE_MASK = 0x0E
CELL_ZONE_SHIFT = 1
CELL_TRAINING_MASK = 0xF0
CELL_TRAINING_SHIFT = 4
MAX_ZONES = 7

# Zone types and their default thresholds (0-9 scale, 0=disabled, higher=harder to trigger)
# Threshold N means "need N out of 10 expected frames to count as detected"
ZONE_TYPE_NORMAL = "normal"
ZONE_TYPE_ENTRANCE = "entrance"
ZONE_TYPE_THOROUGHFARE = "thoroughfare"
ZONE_TYPE_REST = "rest"
ZONE_TYPE_CUSTOM = "custom"

ZONE_TYPE_DEFAULTS: dict[str, dict[str, int | float]] = {
    ZONE_TYPE_NORMAL: {"trigger": 5, "renew": 3, "timeout": 10.0, "handoff_timeout": 3},
    ZONE_TYPE_ENTRANCE: {"trigger": 3, "renew": 2, "timeout": 5.0, "handoff_timeout": 1},
    ZONE_TYPE_THOROUGHFARE: {"trigger": 3, "renew": 2, "timeout": 3.0, "handoff_timeout": 1},
    ZONE_TYPE_REST: {"trigger": 7, "renew": 1, "timeout": 30.0, "handoff_timeout": 10},
}

# Maximum Chebyshev distance (cells) for continuous movement between ticks
MAX_MOVEMENT_CELLS = 5

# Zone types that are entry points (targets can appear from nowhere)
ENTRY_POINT_ZONE_TYPES = {ZONE_TYPE_ENTRANCE}

# LD2450 raw frame rate (10Hz per datasheet)
RAW_FPS = 10


def threshold_to_frame_count(threshold: int) -> int:
    """Convert 1-9 threshold to minimum hit-count needed.

    Threshold N = need N frames to confirm presence.
    """
    return max(1, threshold)


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

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

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
# Bits 0-1: room/overlay (00=outside, 01=inside, 10=entrance, 11=interference)
# Bits 2-4: zone number (0=room default, 1-7=named zone)
# Bits 5-7: per-cell training baseline (reserved)
CELL_ROOM_MASK = 0x03
CELL_ROOM_OUTSIDE = 0x00
CELL_ROOM_INSIDE = 0x01
CELL_ROOM_ENTRANCE = 0x02
CELL_ROOM_INTERFERENCE = 0x03
CELL_ZONE_MASK = 0x1C
CELL_ZONE_SHIFT = 2
CELL_TRAINING_MASK = 0xE0
CELL_TRAINING_SHIFT = 5
MAX_ZONES = 7

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

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

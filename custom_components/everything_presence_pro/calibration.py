"""Sensor calibration pipeline for LD2450 coordinate correction.

Three-stage transform:
  1. ld2450_correct() — built-in chip distortion correction (pure function)
  2. Rotation by sensor_angle — aligns sensor frame to room frame
  3. Translation by (offset_x, offset_y) — shifts origin to room corner

The ld2450_correct() function is intentionally written with no dependencies
so it can be ported to ESP32 firmware (C++) later.
"""

from __future__ import annotations

import math
from typing import Any

# LD2450 angle correction scale factor.
# Derived from diagnostic data: the LD2450 reports angles ~25% wider than
# reality at the edges of its 120° FOV. This factor compresses reported
# angles to match physical angles.
# Derivation: tools/derive_scale_factor.py
_SCALE_FACTOR: float = 0.78


def ld2450_correct(x: float, y: float) -> tuple[float, float]:
    """Apply built-in LD2450 distortion correction.

    Converts to polar, applies angle scale correction, converts back.
    Pure function — same correction for every unit.

    Note: uses atan2(x, y) not atan2(y, x) because sensor-frame angles
    are measured from the Y axis (forward), with X as lateral.
    """
    if x == 0.0 and y == 0.0:
        return 0.0, 0.0

    angle = math.atan2(x, y)
    distance = math.sqrt(x * x + y * y)

    corrected_angle = angle * _SCALE_FACTOR

    cx = distance * math.sin(corrected_angle)
    cy = distance * math.cos(corrected_angle)
    return cx, cy


class SensorTransform:
    """Three-stage sensor-to-room coordinate transform.

    Stage 1: ld2450_correct (chip distortion)
    Stage 2: rotate by sensor_angle (clockwise, positive = CW)
    Stage 3: translate by (offset_x, offset_y)
    """

    def __init__(
        self,
        sensor_angle: float = 0.0,
        offset_x: float = 0.0,
        offset_y: float = 0.0,
    ) -> None:
        """Initialize the transform."""
        self.sensor_angle = sensor_angle
        self.offset_x = offset_x
        self.offset_y = offset_y

    def apply(self, x: float, y: float) -> tuple[float, float]:
        """Apply the full transform pipeline: correct → rotate → translate."""
        # Stage 1: distortion correction
        cx, cy = ld2450_correct(x, y)

        # Stage 2: clockwise rotation by sensor_angle
        cos_a = math.cos(self.sensor_angle)
        sin_a = math.sin(self.sensor_angle)
        rx = cx * cos_a + cy * sin_a
        ry = -cx * sin_a + cy * cos_a

        # Stage 3: translation
        room_x = rx + self.offset_x
        room_y = ry + self.offset_y
        return room_x, room_y

    def recalibrate(
        self,
        raw_sensor_x: float,
        raw_sensor_y: float,
        expected_room_x: float,
        expected_room_y: float,
    ) -> None:
        """Recompute sensor_angle from a single reference point.

        The reference point has known room-frame coordinates.
        Only updates sensor_angle; offsets are unchanged.
        """
        # Apply distortion correction to get corrected sensor-frame coords
        cx, cy = ld2450_correct(raw_sensor_x, raw_sensor_y)

        # Angle from sensor to point in corrected sensor frame
        sensor_frame_angle = math.atan2(cx, cy)

        # Angle from sensor to point in room frame
        # (subtract offset to get sensor-origin room-aligned coords)
        room_frame_angle = math.atan2(
            expected_room_x - self.offset_x,
            expected_room_y - self.offset_y,
        )

        self.sensor_angle = sensor_frame_angle - room_frame_angle

    def to_dict(self) -> dict[str, Any]:
        """Serialize transform to a dictionary."""
        return {
            "sensor_angle": self.sensor_angle,
            "offset_x": self.offset_x,
            "offset_y": self.offset_y,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SensorTransform:
        """Deserialize transform from a dictionary."""
        if not data:
            return cls()
        return cls(
            sensor_angle=data.get("sensor_angle", 0.0),
            offset_x=data.get("offset_x", 0.0),
            offset_y=data.get("offset_y", 0.0),
        )

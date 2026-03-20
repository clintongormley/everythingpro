"""Tests for the sensor calibration pipeline."""

import math

from custom_components.everything_presence_pro.calibration import SensorTransform
from custom_components.everything_presence_pro.calibration import ld2450_correct

# -- Diagnostic test vectors (from real sensor capture) --
# Room: 3500mm x 4450mm, sensor in left corner
# These are raw sensor readings for known room corners
DIAGNOSTIC_CORNERS = {
    "near_right": {"sx": 2250, "sy": 1908, "room_x": 3500, "room_y": 0},
    "far_right": {"sx": 401, "sy": 5012, "room_x": 3500, "room_y": 4450},
    "far_left": {"sx": -2818, "sy": 2283, "room_x": 0, "room_y": 4450},
}


def test_ld2450_correct_identity_near_center():
    """Points near the sensor centerline (small angles) should barely change."""
    cx, cy = ld2450_correct(0, 3000)
    # Straight ahead: angle = 0, correction is identity
    assert abs(cx - 0) < 1
    assert abs(cy - 3000) < 1


def test_ld2450_correct_preserves_distance():
    """Distortion correction changes angle but not distance."""
    for sx, sy in [(2250, 1908), (-2818, 2283), (401, 5012)]:
        cx, cy = ld2450_correct(sx, sy)
        original_dist = math.sqrt(sx**2 + sy**2)
        corrected_dist = math.sqrt(cx**2 + cy**2)
        assert abs(corrected_dist - original_dist) < 1, f"Distance changed: {original_dist:.0f} -> {corrected_dist:.0f}"


def test_ld2450_correct_reduces_angle():
    """Corrected angles should be smaller than reported angles (scale < 1)."""
    for sx, sy in [(2250, 1908), (-2818, 2283)]:
        cx, cy = ld2450_correct(sx, sy)
        reported = abs(math.atan2(sx, sy))
        corrected = abs(math.atan2(cx, cy))
        assert corrected < reported, (
            f"Corrected angle {math.degrees(corrected):.1f}° >= reported {math.degrees(reported):.1f}°"
        )


def test_ld2450_correct_symmetric():
    """Correction should be symmetric: correct(x, y) mirrors correct(-x, y)."""
    cx1, cy1 = ld2450_correct(2000, 3000)
    cx2, cy2 = ld2450_correct(-2000, 3000)
    assert abs(cx1 + cx2) < 1  # X values should be negatives of each other
    assert abs(cy1 - cy2) < 1  # Y values should be the same


# -- SensorTransform tests --


def test_sensor_transform_identity():
    """Transform with angle=0 and no offset is distortion-correction only."""
    t = SensorTransform(sensor_angle=0.0, offset_x=0.0, offset_y=0.0)
    # Straight ahead point: correction is ~identity
    rx, ry = t.apply(0, 3000)
    assert abs(rx - 0) < 1
    assert abs(ry - 3000) < 1


def test_sensor_transform_rotation():
    """Transform applies rotation after distortion correction."""
    angle = math.pi / 4  # 45 degrees
    t = SensorTransform(sensor_angle=angle, offset_x=0.0, offset_y=0.0)
    # A point straight ahead at (0, 1000) after correction is still ~(0, 1000)
    # After 45° clockwise rotation: rx = 0*cos45 + 1000*sin45, ry = -0*sin45 + 1000*cos45
    rx, ry = t.apply(0, 1000)
    expected_rx = 1000 * math.sin(angle)
    expected_ry = 1000 * math.cos(angle)
    assert abs(rx - expected_rx) < 5
    assert abs(ry - expected_ry) < 5


def test_sensor_transform_translation():
    """Transform applies translation after rotation."""
    t = SensorTransform(sensor_angle=0.0, offset_x=500.0, offset_y=100.0)
    rx, ry = t.apply(0, 3000)
    assert abs(rx - 500) < 1
    assert abs(ry - 3100) < 1


def test_sensor_transform_serialization():
    """Transform can be serialized and deserialized."""
    t = SensorTransform(sensor_angle=0.785, offset_x=100.0, offset_y=200.0)
    data = t.to_dict()
    restored = SensorTransform.from_dict(data)

    x1, y1 = t.apply(1000, 2000)
    x2, y2 = restored.apply(1000, 2000)
    assert abs(x1 - x2) < 0.01
    assert abs(y1 - y2) < 0.01


def test_sensor_transform_recalibrate():
    """Recalibration updates only the angle from a single reference point."""
    t = SensorTransform(sensor_angle=0.5, offset_x=0.0, offset_y=0.0)
    original_offset_x = t.offset_x
    original_offset_y = t.offset_y

    # Recalibrate using a point at known room position
    # Use a point straight ahead in sensor: (0, 3000)
    # After correction it's still ~(0, 3000)
    # If expected room position is (2121, 2121) that implies ~45° rotation
    t.recalibrate(
        raw_sensor_x=0,
        raw_sensor_y=3000,
        expected_room_x=3000 * math.sin(math.pi / 4),
        expected_room_y=3000 * math.cos(math.pi / 4),
    )

    # Angle should have changed
    assert abs(t.sensor_angle - 0.5) > 0.1
    # Offsets should not have changed
    assert t.offset_x == original_offset_x
    assert t.offset_y == original_offset_y


def test_sensor_transform_default():
    """Default transform (no calibration) is identity + correction."""
    t = SensorTransform()
    rx, ry = t.apply(0, 3000)
    assert abs(rx - 0) < 1
    assert abs(ry - 3000) < 1

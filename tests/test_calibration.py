"""Tests for the calibration engine."""

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
    points = [
        CalibrationPoint(sensor_x=100, sensor_y=200, real_x=150, real_y=250),
        CalibrationPoint(sensor_x=1000, sensor_y=200, real_x=1050, real_y=250),
        CalibrationPoint(sensor_x=100, sensor_y=2000, real_x=150, real_y=2050),
    ]
    transform.calibrate(points)

    x, y = transform.apply(100, 200)
    assert abs(x - 150) < 5
    assert abs(y - 250) < 5


def test_right_angle_constraint():
    """Test calibration with right angle constraint."""
    transform = CalibrationTransform()
    points = [
        CalibrationPoint(sensor_x=50, sensor_y=1020, real_x=0, real_y=1000),
        CalibrationPoint(sensor_x=40, sensor_y=3010, real_x=0, real_y=3000),
        CalibrationPoint(sensor_x=2030, sensor_y=1050, real_x=2000, real_y=1000),
    ]
    transform.calibrate(points)

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

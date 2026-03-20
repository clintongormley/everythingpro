"""Tests for the sensor calibration (SensorTransform)."""

from __future__ import annotations

import pytest

from custom_components.everything_presence_pro.calibration import SensorTransform

# ---------------------------------------------------------------------------
# SensorTransform.apply
# ---------------------------------------------------------------------------


class TestSensorTransformApply:
    """Tests for applying the perspective transform."""

    def test_identity_when_no_perspective(self):
        """With perspective=None, apply returns the input unchanged."""
        t = SensorTransform()
        rx, ry = t.apply(1000, 2000)
        assert rx == 1000
        assert ry == 2000

    def test_identity_when_perspective_wrong_length(self):
        """Perspective with != 8 elements falls back to identity."""
        t = SensorTransform(perspective=[1.0, 0.0, 0.0])
        rx, ry = t.apply(500, 600)
        assert rx == 500
        assert ry == 600

    def test_simple_identity_perspective(self):
        """Perspective [1,0,0, 0,1,0, 0,0] is the identity transform."""
        t = SensorTransform(perspective=[1, 0, 0, 0, 1, 0, 0, 0])
        rx, ry = t.apply(123.0, 456.0)
        assert rx == pytest.approx(123.0)
        assert ry == pytest.approx(456.0)

    def test_translation_via_perspective(self):
        """Perspective with c,f offsets translates the point."""
        # rx = (1*x + 0*y + 100) / 1, ry = (0*x + 1*y + 200) / 1
        t = SensorTransform(perspective=[1, 0, 100, 0, 1, 200, 0, 0])
        rx, ry = t.apply(0, 0)
        assert rx == pytest.approx(100.0)
        assert ry == pytest.approx(200.0)

    def test_scaling_via_perspective(self):
        """Perspective with a=2, e=3 scales the coordinates."""
        t = SensorTransform(perspective=[2, 0, 0, 0, 3, 0, 0, 0])
        rx, ry = t.apply(100, 200)
        assert rx == pytest.approx(200.0)
        assert ry == pytest.approx(600.0)

    def test_near_zero_denominator_returns_input(self):
        """When the denominator is near zero, return the input unchanged."""
        # denom = g*x + h*y + 1
        # Choose g, h, x, y such that g*x + h*y + 1 ~= 0
        # g=1, h=0, x=-1 => denom = -1 + 0 + 1 = 0
        t = SensorTransform(perspective=[1, 0, 0, 0, 1, 0, 1, 0])
        rx, ry = t.apply(-1.0, 0.0)
        assert rx == -1.0
        assert ry == 0.0

    def test_perspective_transform_with_projective_terms(self):
        """Test with non-zero g, h (projective warp)."""
        # rx = (1*x + 0*y + 0) / (0.001*x + 0*y + 1)
        # ry = (0*x + 1*y + 0) / (0.001*x + 0*y + 1)
        t = SensorTransform(perspective=[1, 0, 0, 0, 1, 0, 0.001, 0])
        rx, ry = t.apply(1000, 2000)
        # denom = 0.001 * 1000 + 0 + 1 = 2
        assert rx == pytest.approx(500.0)
        assert ry == pytest.approx(1000.0)


# ---------------------------------------------------------------------------
# SensorTransform.to_dict / from_dict
# ---------------------------------------------------------------------------


class TestSensorTransformSerialization:
    """Tests for serialize/deserialize round-trips."""

    def test_roundtrip_with_perspective(self):
        """to_dict -> from_dict preserves all fields."""
        t = SensorTransform(
            perspective=[1, 2, 3, 4, 5, 6, 0.01, 0.02],
            room_width=3500.0,
            room_depth=4000.0,
        )
        data = t.to_dict()
        restored = SensorTransform.from_dict(data)
        assert restored.perspective == t.perspective
        assert restored.room_width == t.room_width
        assert restored.room_depth == t.room_depth

    def test_roundtrip_preserves_apply(self):
        """Restored transform produces the same output as original."""
        t = SensorTransform(
            perspective=[1.5, 0.2, 100, -0.1, 1.3, 50, 0.0001, 0.0002],
            room_width=5000.0,
            room_depth=6000.0,
        )
        data = t.to_dict()
        restored = SensorTransform.from_dict(data)
        x1, y1 = t.apply(1000, 2000)
        x2, y2 = restored.apply(1000, 2000)
        assert x1 == pytest.approx(x2)
        assert y1 == pytest.approx(y2)

    def test_from_dict_empty(self):
        """from_dict({}) returns a default transform."""
        t = SensorTransform.from_dict({})
        assert t.perspective is None
        assert t.room_width == 0.0
        assert t.room_depth == 0.0

    def test_from_dict_none(self):
        """from_dict(None-ish empty dict) returns default."""
        t = SensorTransform.from_dict({})
        rx, ry = t.apply(100, 200)
        assert rx == 100
        assert ry == 200

    def test_to_dict_structure(self):
        """to_dict returns the expected keys."""
        t = SensorTransform(perspective=[1, 0, 0, 0, 1, 0, 0, 0], room_width=1000, room_depth=2000)
        d = t.to_dict()
        assert set(d.keys()) == {"perspective", "room_width", "room_depth"}

    def test_from_dict_missing_optional_fields(self):
        """from_dict handles missing room_width/room_depth gracefully."""
        t = SensorTransform.from_dict({"perspective": [1, 0, 0, 0, 1, 0, 0, 0]})
        assert t.room_width == 0.0
        assert t.room_depth == 0.0
        assert t.perspective == [1, 0, 0, 0, 1, 0, 0, 0]


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


class TestSensorTransformEdgeCases:
    """Edge-case and boundary tests."""

    def test_apply_zero_coordinates(self):
        """Apply at origin with identity perspective returns c, f."""
        t = SensorTransform(perspective=[1, 0, 50, 0, 1, 75, 0, 0])
        rx, ry = t.apply(0, 0)
        assert rx == pytest.approx(50.0)
        assert ry == pytest.approx(75.0)

    def test_apply_negative_coordinates(self):
        """Apply handles negative sensor coordinates correctly."""
        t = SensorTransform(perspective=[1, 0, 0, 0, 1, 0, 0, 0])
        rx, ry = t.apply(-500, -300)
        assert rx == pytest.approx(-500.0)
        assert ry == pytest.approx(-300.0)

    def test_default_constructor(self):
        """Default SensorTransform has no perspective and zero room dimensions."""
        t = SensorTransform()
        assert t.perspective is None
        assert t.room_width == 0.0
        assert t.room_depth == 0.0

    def test_apply_large_coordinates(self):
        """Apply works with large coordinate values (sensor max range)."""
        t = SensorTransform(perspective=[1, 0, 0, 0, 1, 0, 0, 0])
        rx, ry = t.apply(6000.0, 6000.0)
        assert rx == pytest.approx(6000.0)
        assert ry == pytest.approx(6000.0)

"""Calibration engine for sensor coordinate correction."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class CalibrationPoint:
    """A calibration reference point."""

    sensor_x: float
    sensor_y: float
    real_x: float
    real_y: float


class CalibrationTransform:
    """Affine transform for correcting sensor coordinate distortion.

    Uses least-squares to fit an affine transform from 3+ calibration points:
    real_x = a * sensor_x + b * sensor_y + tx
    real_y = c * sensor_x + d * sensor_y + ty
    """

    def __init__(self) -> None:
        """Initialize as identity transform."""
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

        n = len(points)

        sx = [p.sensor_x for p in points]
        sy = [p.sensor_y for p in points]
        rx = [p.real_x for p in points]
        ry = [p.real_y for p in points]

        sum_sx2 = sum(x * x for x in sx)
        sum_sy2 = sum(y * y for y in sy)
        sum_sxsy = sum(sx[i] * sy[i] for i in range(n))
        sum_sx_val = sum(sx)
        sum_sy_val = sum(sy)

        det = (
            sum_sx2 * (sum_sy2 * n - sum_sy_val * sum_sy_val)
            - sum_sxsy * (sum_sxsy * n - sum_sy_val * sum_sx_val)
            + sum_sx_val * (sum_sxsy * sum_sy_val - sum_sy2 * sum_sx_val)
        )

        if abs(det) < 1e-10:
            return

        sum_sx_rx = sum(sx[i] * rx[i] for i in range(n))
        sum_sy_rx = sum(sy[i] * rx[i] for i in range(n))
        sum_rx = sum(rx)

        sum_sx_ry = sum(sx[i] * ry[i] for i in range(n))
        sum_sy_ry = sum(sy[i] * ry[i] for i in range(n))
        sum_ry = sum(ry)

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

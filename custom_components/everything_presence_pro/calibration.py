"""Sensor calibration via perspective transform.

Maps raw LD2450 sensor coordinates directly to room coordinates
using an 8-parameter perspective (projective) transform computed
from 4 corner measurements. Absorbs all distortion, rotation,
and placement in one step.
"""

from __future__ import annotations

from typing import Any


class SensorTransform:
    """Perspective transform from raw sensor coords to room coords.

    The transform is: rx = (a*sx + b*sy + c) / (g*sx + h*sy + 1)
                      ry = (d*sx + e*sy + f) / (g*sx + h*sy + 1)
    """

    def __init__(
        self,
        perspective: list[float] | None = None,
        room_width: float = 0.0,
        room_depth: float = 0.0,
    ) -> None:
        """Initialize the transform."""
        self.perspective = perspective  # [a, b, c, d, e, f, g, h]
        self.room_width = room_width
        self.room_depth = room_depth

    def apply(self, x: float, y: float) -> tuple[float, float]:
        """Apply perspective transform and clamp to room bounds."""
        if self.perspective is None or len(self.perspective) != 8:
            return x, y
        a, b, c, d, e, f, g, h = self.perspective
        denom = g * x + h * y + 1.0
        if abs(denom) < 1e-10:
            return x, y
        rx = (a * x + b * y + c) / denom
        ry = (d * x + e * y + f) / denom
        return rx, ry

    def to_dict(self) -> dict[str, Any]:
        """Serialize transform to a dictionary."""
        return {
            "perspective": self.perspective,
            "room_width": self.room_width,
            "room_depth": self.room_depth,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SensorTransform:
        """Deserialize transform from a dictionary."""
        if not data:
            return cls()
        return cls(
            perspective=data.get("perspective"),
            room_width=data.get("room_width", 0.0),
            room_depth=data.get("room_depth", 0.0),
        )

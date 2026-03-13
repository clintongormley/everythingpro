"""Derive LD2450 angle correction SCALE_FACTOR from diagnostic data.

Diagnostic data captured from a real sensor in a 3.5m x 4.45m room,
sensor in left corner.
"""
import math

# Raw sensor readings for 4 room corners
CORNERS = {
    "near_left":  {"sx": -79,   "sy": 243},
    "near_right": {"sx": 2250,  "sy": 1908},
    "far_right":  {"sx": 401,   "sy": 5012},
    "far_left":   {"sx": -2818, "sy": 2283},
}

ROOM_WIDTH = 3500   # mm
ROOM_DEPTH = 4450   # mm

def reported_angle(sx, sy):
    """Sensor-frame angle: atan2(x, y), 0 = straight ahead."""
    return math.atan2(sx, sy)

def main():
    # Step 1: Estimate sensor angle from far-right corner (minimal distortion)
    # Far-right is at room coords (ROOM_WIDTH, ROOM_DEPTH) for left-corner sensor
    expected_room_angle_fr = math.atan2(ROOM_WIDTH, ROOM_DEPTH)
    reported_angle_fr = reported_angle(
        CORNERS["far_right"]["sx"], CORNERS["far_right"]["sy"]
    )

    # Initial sensor angle estimate (iterative refinement)
    sensor_angle = reported_angle_fr - expected_room_angle_fr
    print(f"Initial sensor angle estimate: {math.degrees(sensor_angle):.1f}°")

    # Step 2: Compute expected sensor-frame angles for all corners
    # Room-frame positions (left-corner sensor at room origin 0,0)
    room_positions = {
        "near_left":  (0, 0),  # sensor corner — too close, skip
        "near_right": (ROOM_WIDTH, 0),
        "far_right":  (ROOM_WIDTH, ROOM_DEPTH),
        "far_left":   (0, ROOM_DEPTH),
    }

    # Step 3: Iteratively refine scale factor
    scale_factor = 1.0
    for iteration in range(5):
        ratios = []
        for name in ["near_right", "far_right", "far_left"]:
            rx, ry = room_positions[name]
            # Expected angle in sensor frame = room angle - sensor angle
            room_angle = math.atan2(rx, ry)
            expected_sensor_angle = room_angle - sensor_angle
            rep_angle = reported_angle(
                CORNERS[name]["sx"], CORNERS[name]["sy"]
            )
            if abs(expected_sensor_angle) > 0.01:
                ratio = rep_angle / expected_sensor_angle
                ratios.append(ratio)
                print(
                    f"  {name}: reported={math.degrees(rep_angle):.1f}°, "
                    f"expected={math.degrees(expected_sensor_angle):.1f}°, "
                    f"ratio={ratio:.4f}"
                )

        scale_factor = sum(ratios) / len(ratios)
        print(f"Iteration {iteration}: SCALE_FACTOR = {scale_factor:.4f}")

        # Re-estimate sensor angle using scale factor
        corrected_angle_fr = reported_angle_fr * scale_factor
        sensor_angle = corrected_angle_fr - expected_room_angle_fr
        print(f"  Refined sensor angle: {math.degrees(sensor_angle):.1f}°")

    print(f"\nFinal SCALE_FACTOR = {scale_factor:.4f}")

    # Step 4: Validate — correct all corners and check rectangle
    print("\nValidation (corrected corners in room frame):")
    cos_a = math.cos(sensor_angle)
    sin_a = math.sin(sensor_angle)
    for name, raw in CORNERS.items():
        if name == "near_left":
            continue
        sx, sy = raw["sx"], raw["sy"]
        dist = math.sqrt(sx**2 + sy**2)
        angle = math.atan2(sx, sy)
        corrected_angle = angle * scale_factor
        cx = dist * math.sin(corrected_angle)
        cy = dist * math.cos(corrected_angle)
        # Rotate by sensor_angle (clockwise)
        rx = cx * cos_a + cy * sin_a
        ry = -cx * sin_a + cy * cos_a
        expected_rx, expected_ry = room_positions[name]
        err = math.sqrt((rx - expected_rx)**2 + (ry - expected_ry)**2)
        print(
            f"  {name}: room=({rx:.0f}, {ry:.0f}), "
            f"expected=({expected_rx}, {expected_ry}), error={err:.0f}mm"
        )


if __name__ == "__main__":
    main()

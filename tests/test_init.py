"""Tests for integration setup and teardown."""

from unittest.mock import MagicMock

from custom_components.everything_presence_pro.const import DOMAIN
from custom_components.everything_presence_pro.coordinator import (
    EverythingPresenceProCoordinator,
)


def test_coordinator_full_lifecycle():
    """Test coordinator creation, zone config, and teardown."""
    hass = MagicMock()
    entry = MagicMock()
    entry.entry_id = "test_entry_id"
    entry.data = {"host": "192.168.1.100", "noise_psk": "key"}
    entry.options = {}

    coordinator = EverythingPresenceProCoordinator(hass, entry)
    assert coordinator.connected is False
    assert coordinator.device_occupied is False

    # Configure zones
    from custom_components.everything_presence_pro.zone_engine import Zone

    zones = [
        Zone(id="z1", name="Desk", sensitivity="normal", cells=[150, 151, 152]),
        Zone(id="z2", name="Bed", sensitivity="high", cells=[200, 201]),
    ]
    coordinator.set_zones(zones)
    assert len(coordinator.zones) == 2

    # Verify config roundtrip
    data = coordinator.get_config_data()
    assert len(data["zones"]) == 2

    coordinator2 = EverythingPresenceProCoordinator(hass, entry)
    coordinator2.load_config_data(data)
    assert len(coordinator2.zones) == 2
    assert coordinator2.zones[0].name == "Desk"
    assert coordinator2.zones[1].name == "Bed"


def test_zone_engine_full_pipeline():
    """Test the full target processing pipeline."""
    from custom_components.everything_presence_pro.calibration import (
        CalibrationTransform,
    )
    from custom_components.everything_presence_pro.zone_engine import (
        Zone,
        ZoneEngine,
    )

    engine = ZoneEngine()

    # Set up a zone
    cell = engine.grid.xy_to_cell(0, 3000)
    assert cell is not None

    zone = Zone(id="z1", name="Center", sensitivity="high", cells=[cell])
    engine.set_zones([zone])

    # Process target at zone location
    result = engine.process_targets([(0, 3000, True)])
    assert result.device_tracking_present is True
    assert result.zone_occupancy["z1"] is True  # High sensitivity = immediate
    assert result.zone_target_counts["z1"] == 1

    # Process with no active targets
    result = engine.process_targets([(0, 0, False)])
    assert result.device_tracking_present is False
    assert result.zone_occupancy["z1"] is False

    # Test calibration integration
    transform = CalibrationTransform()
    x, y = transform.apply(0, 3000)
    assert x == 0  # Identity transform
    assert y == 3000


def test_calibration_full_pipeline():
    """Test calibration with real-world-like points."""
    from custom_components.everything_presence_pro.calibration import (
        CalibrationPoint,
        CalibrationTransform,
    )

    transform = CalibrationTransform()

    # Simulate sensor reading slightly off from reality
    points = [
        CalibrationPoint(sensor_x=0, sensor_y=1000, real_x=0, real_y=1000),
        CalibrationPoint(sensor_x=2000, sensor_y=1000, real_x=2000, real_y=1000),
        CalibrationPoint(sensor_x=0, sensor_y=3000, real_x=0, real_y=3000),
        CalibrationPoint(sensor_x=2000, sensor_y=3000, real_x=2000, real_y=3000),
    ]
    transform.calibrate(points)

    # Identity case - should be very close
    x, y = transform.apply(1000, 2000)
    assert abs(x - 1000) < 1
    assert abs(y - 2000) < 1

    # Verify serialization
    data = transform.to_dict()
    restored = CalibrationTransform.from_dict(data)
    x2, y2 = restored.apply(1000, 2000)
    assert abs(x - x2) < 0.001
    assert abs(y - y2) < 0.001

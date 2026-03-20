"""Tests for integration setup and teardown."""

from unittest.mock import MagicMock

from custom_components.everything_presence_pro.coordinator import EverythingPresenceProCoordinator


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
        Zone(id=1, name="Desk", type="normal"),
        Zone(id=2, name="Bed", type="rest"),
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
    from custom_components.everything_presence_pro.zone_engine import Zone
    from custom_components.everything_presence_pro.zone_engine import ZoneEngine

    engine = ZoneEngine()

    # Set up a zone
    cell = engine.grid.xy_to_cell(0, 3000)
    assert cell is not None

    zone = Zone(id=1, name="Center", type="normal", trigger=9, renew=9)
    engine.set_zones([zone])

    # Process target at zone location
    result = engine.process_targets([(0, 3000, True)])
    assert result.device_tracking_present is True
    assert result.zone_occupancy[1] is True  # High sensitivity = immediate
    assert result.zone_target_counts[1] == 1

    # Process with no active targets
    result = engine.process_targets([(0, 0, False)])
    assert result.device_tracking_present is False
    assert result.zone_occupancy[1] is False

    # Test calibration integration
    from custom_components.everything_presence_pro.calibration import SensorTransform

    transform = SensorTransform()
    x, y = transform.apply(0, 3000)
    assert abs(x - 0) < 1  # Identity transform (ld2450_correct at angle=0 is identity)
    assert abs(y - 3000) < 1


def test_calibration_full_pipeline():
    """Test calibration transform serialization roundtrip."""
    from custom_components.everything_presence_pro.calibration import SensorTransform

    transform = SensorTransform(sensor_angle=0.5, offset_x=100.0, offset_y=200.0)

    # Apply to a point
    x, y = transform.apply(0, 3000)

    # Verify serialization roundtrip
    data = transform.to_dict()
    restored = SensorTransform.from_dict(data)
    x2, y2 = restored.apply(0, 3000)
    assert abs(x - x2) < 0.001
    assert abs(y - y2) < 0.001

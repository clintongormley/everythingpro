"""Tests for the WebSocket API."""

from __future__ import annotations

from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.everything_presence_pro.const import DOMAIN
from custom_components.everything_presence_pro.const import MAX_ZONES


@pytest.fixture(autouse=True)
def _clear_ws_registered():
    """Clear the global WS registration guard between tests.

    The websocket_api module uses a module-level ``_REGISTERED`` set to
    avoid double-registering commands. Each test gets a fresh ``hass``
    instance, so we must reset the guard so commands are registered on
    the new instance.
    """
    from custom_components.everything_presence_pro import websocket_api

    websocket_api._REGISTERED.discard(DOMAIN)
    yield
    websocket_api._REGISTERED.discard(DOMAIN)


@pytest.fixture
async def setup_integration(hass: HomeAssistant, mock_config_entry, mock_esphome_client):
    """Set up the integration for WS tests and return the entry."""
    mock_http = MagicMock()
    mock_http.async_register_static_paths = AsyncMock()
    hass.http = mock_http

    with patch(
        "custom_components.everything_presence_pro.panel_custom.async_register_panel",
        new_callable=AsyncMock,
    ):
        await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()
    return mock_config_entry


# ---------------------------------------------------------------------------
# list_entries
# ---------------------------------------------------------------------------


async def test_list_entries(hass: HomeAssistant, hass_ws_client, setup_integration):
    """list_entries returns configured entries with metadata."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json({"id": 1, "type": "everything_presence_pro/list_entries"})
    msg = await ws_client.receive_json()

    assert msg["id"] == 1
    assert msg["success"] is True
    result = msg["result"]
    assert len(result) == 1
    assert result[0]["entry_id"] == entry.entry_id
    assert result[0]["title"] == "Test EP Pro"
    assert "has_perspective" in result[0]
    assert "has_layout" in result[0]


# ---------------------------------------------------------------------------
# get_config
# ---------------------------------------------------------------------------


async def test_get_config(hass: HomeAssistant, hass_ws_client, setup_integration):
    """get_config returns the coordinator's config data."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/get_config",
            "entry_id": entry.entry_id,
        }
    )
    msg = await ws_client.receive_json()

    assert msg["success"] is True
    result = msg["result"]
    assert "zones" in result
    assert "calibration" in result
    assert "grid" in result
    assert "offsets" in result


async def test_get_config_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """get_config with invalid entry_id returns an error."""
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/get_config",
            "entry_id": "nonexistent_id",
        }
    )
    msg = await ws_client.receive_json()

    assert msg["success"] is False
    assert msg["error"]["code"] == "not_found"


# ---------------------------------------------------------------------------
# set_zones
# ---------------------------------------------------------------------------


async def test_set_zones(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_zones persists zones to the coordinator and entry options."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_zones",
            "entry_id": entry.entry_id,
            "zones": [
                {"id": 1, "name": "Desk", "type": "normal"},
                {"id": 2, "name": "Bed", "type": "rest"},
            ],
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True

    # Verify coordinator state
    coordinator = entry.runtime_data
    assert len(coordinator.zones) == 2
    assert coordinator.zones[0].name == "Desk"
    assert coordinator.zones[1].name == "Bed"

    # Verify persistence in entry options
    config = entry.options.get("config", {})
    assert len(config["zones"]) == 2


async def test_set_zones_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_zones with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_zones",
            "entry_id": "bad_id",
            "zones": [],
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False


# ---------------------------------------------------------------------------
# set_room_layout
# ---------------------------------------------------------------------------


async def test_set_room_layout(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_room_layout updates grid, zones, and persists to options."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    # Create grid_bytes: 400 bytes (20x20), with some room + zone cells
    grid_bytes = [0] * 400
    grid_bytes[0] = 0x01  # room bit set

    zone_slots = [None] * MAX_ZONES
    zone_slots[0] = {"name": "Desk", "color": "#ff0000", "type": "normal"}

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_room_layout",
            "entry_id": entry.entry_id,
            "grid_bytes": grid_bytes,
            "zone_slots": zone_slots,
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True

    # Verify coordinator has the zone
    coordinator = entry.runtime_data
    assert len(coordinator.zones) == 1
    assert coordinator.zones[0].name == "Desk"

    # Verify persistence
    config = entry.options.get("config", {})
    assert "room_layout" in config


async def test_set_room_layout_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_room_layout with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_room_layout",
            "entry_id": "bad_id",
            "grid_bytes": [0] * 400,
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False


# ---------------------------------------------------------------------------
# rename_zone_entities
# ---------------------------------------------------------------------------


async def test_rename_zone_entities(hass: HomeAssistant, hass_ws_client, setup_integration):
    """rename_zone_entities renames entities in the registry."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/rename_zone_entities",
            "entry_id": entry.entry_id,
            "renames": [{"old_entity_id": "binary_sensor.nonexistent", "new_entity_id": "binary_sensor.renamed"}],
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
    assert len(msg["result"]["errors"]) == 1
    assert "not found" in msg["result"]["errors"][0]


async def test_rename_zone_entities_conflict(hass: HomeAssistant, hass_ws_client, setup_integration):
    """rename_zone_entities reports error when target entity_id exists."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)
    entity_ids = [e.entity_id for e in hass.states.async_all()]
    if len(entity_ids) < 2:
        pytest.skip("Need at least 2 entities")
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/rename_zone_entities",
            "entry_id": entry.entry_id,
            "renames": [{"old_entity_id": entity_ids[0], "new_entity_id": entity_ids[1]}],
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
    assert len(msg["result"]["errors"]) == 1
    assert "already exists" in msg["result"]["errors"][0]


async def test_rename_zone_entities_empty(hass: HomeAssistant, hass_ws_client, setup_integration):
    """rename_zone_entities with empty list succeeds."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/rename_zone_entities",
            "entry_id": entry.entry_id,
            "renames": [],
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
    assert msg["result"]["errors"] == []


# ---------------------------------------------------------------------------
# set_reporting
# ---------------------------------------------------------------------------


async def test_set_reporting(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_reporting persists reporting config."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_reporting",
            "entry_id": entry.entry_id,
            "reporting": {"room_occupancy": True, "room_target_count": False},
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
    config = entry.options.get("config", {})
    assert config["reporting"]["room_occupancy"] is True
    assert config["reporting"]["room_target_count"] is False


async def test_set_reporting_with_offsets(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_reporting saves offsets and applies them to coordinator."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_reporting",
            "entry_id": entry.entry_id,
            "reporting": {},
            "offsets": {"illuminance": 10.0, "temperature": -1.5, "humidity": 3.0},
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
    config = entry.options.get("config", {})
    assert config["offsets"]["illuminance"] == 10.0
    coordinator = entry.runtime_data
    assert coordinator._illuminance_offset == 10.0


async def test_set_reporting_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_reporting with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_reporting",
            "entry_id": "bad_id",
            "reporting": {},
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False
    assert msg["error"]["code"] == "not_found"


async def test_set_reporting_zone_entities(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_reporting handles zone-level entity toggling."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_reporting",
            "entry_id": entry.entry_id,
            "reporting": {"zone_presence": True, "zone_target_count": False},
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True


# ---------------------------------------------------------------------------
# set_setup
# ---------------------------------------------------------------------------


async def test_set_setup(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_setup persists perspective transform."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_setup",
            "entry_id": entry.entry_id,
            "perspective": [1.0, 0.0, 100.0, 0.0, 1.0, 200.0, 0.0, 0.0],
            "room_width": 3000.0,
            "room_depth": 4000.0,
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is True
    config = entry.options.get("config", {})
    assert config["calibration"]["perspective"] == [1.0, 0.0, 100.0, 0.0, 1.0, 200.0, 0.0, 0.0]
    assert config["calibration"]["room_width"] == 3000.0


async def test_set_setup_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """set_setup with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)
    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/set_setup",
            "entry_id": "bad_id",
            "perspective": [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
            "room_width": 3000.0,
            "room_depth": 4000.0,
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False


# ---------------------------------------------------------------------------
# subscribe_grid_targets
# ---------------------------------------------------------------------------


async def test_subscribe_grid_targets(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_grid_targets sends initial state with grid positions, sensors, and zones."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_grid_targets",
            "entry_id": entry.entry_id,
        }
    )

    msg = await ws_client.receive_json()
    assert msg["id"] == 1
    assert msg["success"] is True

    msg = await ws_client.receive_json()
    assert msg["type"] == "event"
    event = msg["event"]

    # Verify target structure — grid positions + cached state
    assert len(event["targets"]) == 3
    for t in event["targets"]:
        assert "x" in t
        assert "y" in t
        assert "signal" in t
        assert "status" in t
        assert t["status"] in ("active", "pending", "inactive")
        # No raw_x/raw_y — that's subscribe_raw_targets
        assert "raw_x" not in t
        assert "raw_y" not in t

    # Verify sensors
    sensors = event["sensors"]
    assert "occupancy" in sensors
    assert "static_presence" in sensors
    assert "motion_presence" in sensors
    assert "target_presence" in sensors
    assert "illuminance" in sensors
    assert "temperature" in sensors
    assert "humidity" in sensors
    assert "co2" in sensors

    # Verify zones
    zones = event["zones"]
    assert "occupancy" in zones
    assert "target_counts" in zones
    assert "frame_count" in zones
    assert "debug_log" in zones


async def test_subscribe_grid_targets_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_grid_targets with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_grid_targets",
            "entry_id": "bad_id",
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False
    assert msg["error"]["code"] == "not_found"


async def test_subscribe_grid_targets_tracks_subscriber_count(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_grid_targets increments/decrements the display subscriber count."""
    entry = setup_integration
    coordinator = entry.runtime_data
    assert coordinator.display_subscriber_count == 0

    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_grid_targets",
            "entry_id": entry.entry_id,
        }
    )
    await ws_client.receive_json()  # result
    await ws_client.receive_json()  # initial event

    assert coordinator.display_subscriber_count == 1

    await ws_client.send_json({"id": 2, "type": "unsubscribe_events", "subscription": 1})
    await ws_client.receive_json()

    assert coordinator.display_subscriber_count == 0


# ---------------------------------------------------------------------------
# subscribe_raw_targets
# ---------------------------------------------------------------------------


async def test_subscribe_raw_targets(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_raw_targets sends initial state with raw positions and target_count."""
    entry = setup_integration
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_raw_targets",
            "entry_id": entry.entry_id,
        }
    )

    msg = await ws_client.receive_json()
    assert msg["id"] == 1
    assert msg["success"] is True

    msg = await ws_client.receive_json()
    assert msg["type"] == "event"
    event = msg["event"]
    assert "target_count" in event
    assert "targets" in event
    assert len(event["targets"]) == 3
    for t in event["targets"]:
        assert "raw_x" in t
        assert "raw_y" in t
        assert len(t) == 2  # only raw_x and raw_y, nothing else


async def test_subscribe_raw_targets_not_found(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_raw_targets with invalid entry_id returns error."""
    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_raw_targets",
            "entry_id": "bad_id",
        }
    )
    msg = await ws_client.receive_json()
    assert msg["success"] is False
    assert msg["error"]["code"] == "not_found"


async def test_subscribe_raw_targets_tracks_subscriber_count(hass: HomeAssistant, hass_ws_client, setup_integration):
    """subscribe_raw_targets increments/decrements the display subscriber count."""
    entry = setup_integration
    coordinator = entry.runtime_data
    assert coordinator.display_subscriber_count == 0

    ws_client = await hass_ws_client(hass)

    await ws_client.send_json(
        {
            "id": 1,
            "type": "everything_presence_pro/subscribe_raw_targets",
            "entry_id": entry.entry_id,
        }
    )
    await ws_client.receive_json()  # result
    await ws_client.receive_json()  # initial event

    assert coordinator.display_subscriber_count == 1

    await ws_client.send_json({"id": 2, "type": "unsubscribe_events", "subscription": 1})
    await ws_client.receive_json()

    assert coordinator.display_subscriber_count == 0

"""Tests for the WebSocket API."""

from unittest.mock import MagicMock

import pytest

from custom_components.everything_presence_pro.websocket_api import websocket_get_config


@pytest.fixture
def mock_coordinator():
    """Create a mock coordinator."""
    coordinator = MagicMock()
    coordinator.entry = MagicMock()
    coordinator.entry.entry_id = "test_entry"
    coordinator.get_config_data.return_value = {
        "zones": [],
        "calibration": {},
        "room_cells": [],
        "furniture": [],
    }
    return coordinator


def test_websocket_get_config_returns_data(mock_coordinator):
    """Test get_config returns coordinator config."""
    hass = MagicMock()
    entry = MagicMock()
    entry.runtime_data = mock_coordinator
    hass.config_entries.async_get_entry.return_value = entry

    connection = MagicMock()
    msg = {"id": 1, "type": "everything_presence_pro/get_config", "entry_id": "test_entry"}

    websocket_get_config(hass, connection, msg)
    connection.send_result.assert_called_once_with(
        1,
        {
            "zones": [],
            "calibration": {},
            "room_cells": [],
            "furniture": [],
        },
    )


def test_websocket_get_config_not_found():
    """Test get_config with invalid entry_id."""
    hass = MagicMock()
    hass.config_entries.async_get_entry.return_value = None

    connection = MagicMock()
    msg = {"id": 1, "type": "everything_presence_pro/get_config", "entry_id": "bad_id"}

    websocket_get_config(hass, connection, msg)
    connection.send_error.assert_called_once()

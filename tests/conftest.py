"""Fixtures for Everything Presence Pro tests."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture
def mock_api_client():
    """Create a mock aioesphomeapi APIClient."""
    with patch("aioesphomeapi.APIClient") as mock_cls:
        client = AsyncMock()
        client.device_info = AsyncMock()
        client.list_entities_services = AsyncMock(return_value=([], []))
        client.subscribe_states = AsyncMock()
        client.disconnect = AsyncMock()
        mock_cls.return_value = client
        yield client

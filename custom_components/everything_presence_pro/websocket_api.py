"""WebSocket API for Everything Presence Pro."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .calibration import SensorTransform
from .const import DOMAIN
from .coordinator import EverythingPresenceProCoordinator, SIGNAL_TARGETS_UPDATED
from .zone_engine import Zone

_REGISTERED: set[str] = set()


def _get_coordinator(
    hass: HomeAssistant, entry_id: str
) -> EverythingPresenceProCoordinator | None:
    """Look up the coordinator for a config entry."""
    entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None:
        return None
    return entry.runtime_data


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register WebSocket commands for Everything Presence Pro."""
    if DOMAIN in _REGISTERED:
        return
    _REGISTERED.add(DOMAIN)

    websocket_api.async_register_command(hass, websocket_list_entries)
    websocket_api.async_register_command(hass, websocket_get_config)
    websocket_api.async_register_command(hass, websocket_set_zones)
    websocket_api.async_register_command(hass, websocket_recalibrate)
    websocket_api.async_register_command(hass, websocket_set_room_layout)
    websocket_api.async_register_command(hass, websocket_set_setup)
    websocket_api.async_register_command(hass, websocket_subscribe_targets)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/list_entries",
    }
)
@callback
def websocket_list_entries(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return all configured Everything Presence Pro entries."""
    entries = hass.config_entries.async_entries(DOMAIN)
    connection.send_result(
        msg["id"],
        [
            {
                "entry_id": e.entry_id,
                "title": e.title,
                "room_name": e.options.get("config", {}).get("room_name", ""),
                "placement": e.options.get("config", {}).get("placement", ""),
                "has_layout": bool(
                    e.options.get("config", {}).get("room_layout")
                ),
            }
            for e in entries
        ],
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_setup",
        vol.Required("entry_id"): str,
        vol.Required("room_name"): str,
        vol.Required("placement"): vol.In(["wall", "left_corner", "right_corner"]),
        vol.Optional("mirrored", default=False): bool,
        vol.Optional("room_bounds", default={}): {
            vol.Optional("far_y"): vol.Coerce(float),
            vol.Optional("left_x"): vol.Coerce(float),
            vol.Optional("right_x"): vol.Coerce(float),
        },
        vol.Optional("calibration", default={}): {
            vol.Optional("sensor_angle"): vol.Coerce(float),
        },
    }
)
@websocket_api.async_response
async def websocket_set_setup(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Persist room name, sensor placement, and room bounds for an entry."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    config = dict(entry.options.get("config", {}))
    config["room_name"] = msg["room_name"]
    config["placement"] = msg["placement"]
    config["mirrored"] = msg["mirrored"]
    config["room_bounds"] = msg["room_bounds"]

    # Compute and persist sensor transform from placement + bounds
    bounds = msg.get("room_bounds", {})
    placement = msg["placement"]
    if (
        bounds.get("far_y")
        and bounds.get("left_x") is not None
        and bounds.get("right_x") is not None
    ):
        room_width = bounds["right_x"] - bounds["left_x"]
        if placement == "left_corner":
            offset_x = 0.0
            offset_y = 0.0
        elif placement == "right_corner":
            offset_x = room_width
            offset_y = 0.0
        else:  # wall
            offset_x = room_width / 2
            offset_y = 0.0

        cal_msg = msg.get("calibration", {})
        sensor_angle = cal_msg.get("sensor_angle", 0.0)
        transform = SensorTransform(
            sensor_angle=sensor_angle,
            offset_x=offset_x,
            offset_y=offset_y,
        )
        coordinator.set_sensor_transform(transform)
        config["calibration"] = transform.to_dict()

    hass.config_entries.async_update_entry(
        entry, options={**entry.options, "config": config}
    )

    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/get_config",
        vol.Required("entry_id"): str,
    }
)
@callback
def websocket_get_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle get_config command."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    connection.send_result(msg["id"], coordinator.get_config_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_zones",
        vol.Required("entry_id"): str,
        vol.Required("zones"): [
            {
                vol.Required("id"): str,
                vol.Required("name"): str,
                vol.Required("sensitivity"): str,
                vol.Required("cells"): [int],
            }
        ],
    }
)
@websocket_api.async_response
async def websocket_set_zones(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle set_zones command."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    zones = [
        Zone(
            id=z["id"],
            name=z["name"],
            sensitivity=z["sensitivity"],
            cells=z["cells"],
        )
        for z in msg["zones"]
    ]

    coordinator.set_zones(zones)

    # Persist to config entry options
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is not None:
        config = dict(entry.options.get("config", {}))
        config["zones"] = [
            {
                "id": z.id,
                "name": z.name,
                "sensitivity": z.sensitivity,
                "cells": z.cells,
            }
            for z in zones
        ]
        hass.config_entries.async_update_entry(entry, options={**entry.options, "config": config})

    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/recalibrate",
        vol.Required("entry_id"): str,
        vol.Required("sensor_x"): vol.Coerce(float),
        vol.Required("sensor_y"): vol.Coerce(float),
        vol.Required("expected_room_x"): vol.Coerce(float),
        vol.Required("expected_room_y"): vol.Coerce(float),
    }
)
@websocket_api.async_response
async def websocket_recalibrate(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle recalibrate command — recompute sensor angle from a reference point."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    coordinator.sensor_transform.recalibrate(
        raw_sensor_x=msg["sensor_x"],
        raw_sensor_y=msg["sensor_y"],
        expected_room_x=msg["expected_room_x"],
        expected_room_y=msg["expected_room_y"],
    )

    # Persist to config entry options
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is not None:
        config = dict(entry.options.get("config", {}))
        config["calibration"] = coordinator.sensor_transform.to_dict()
        hass.config_entries.async_update_entry(
            entry, options={**entry.options, "config": config}
        )

    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_room_layout",
        vol.Required("entry_id"): str,
        vol.Required("room_cells"): [int],
        vol.Optional("furniture", default=[]): [
            {
                vol.Required("type"): str,
                vol.Required("cells"): [int],
            }
        ],
    }
)
@websocket_api.async_response
async def websocket_set_room_layout(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle set_room_layout command."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    layout = {
        "room_cells": msg["room_cells"],
        "furniture": msg["furniture"],
    }

    coordinator.set_room_layout(layout)

    # Persist to config entry options
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is not None:
        config = dict(entry.options.get("config", {}))
        config["room_layout"] = layout
        hass.config_entries.async_update_entry(entry, options={**entry.options, "config": config})

    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/subscribe_targets",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_subscribe_targets(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle subscribe_targets command."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    @callback
    def _forward_targets() -> None:
        """Forward target positions to the WebSocket subscriber."""
        targets = coordinator.targets
        connection.send_message(
            websocket_api.event_message(
                msg["id"],
                {
                    "targets": [
                        {"x": t[0], "y": t[1], "active": t[2]} for t in targets
                    ],
                },
            )
        )

    # Send initial state
    connection.send_result(msg["id"])
    _forward_targets()

    # Subscribe to target updates via dispatcher
    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    unsub = async_dispatcher_connect(
        hass,
        f"{SIGNAL_TARGETS_UPDATED}_{msg['entry_id']}",
        _forward_targets,
    )
    connection.subscriptions[msg["id"]] = unsub

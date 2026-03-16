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
                "has_perspective": bool(
                    e.options.get("config", {})
                    .get("calibration", {})
                    .get("perspective")
                ),
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
        vol.Required("perspective"): vol.All(
            [vol.Coerce(float)], vol.Length(min=8, max=8)
        ),
        vol.Required("room_width"): vol.Coerce(float),
        vol.Required("room_depth"): vol.Coerce(float),
    }
)
@websocket_api.async_response
async def websocket_set_setup(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Persist perspective transform and room dimensions for an entry."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    transform = SensorTransform(
        perspective=msg["perspective"],
        room_width=msg["room_width"],
        room_depth=msg["room_depth"],
    )
    coordinator.set_sensor_transform(transform)

    # Clear existing room layout and zones since grid dimensions may change
    coordinator.set_room_layout({})
    coordinator.set_zones([])

    config = dict(entry.options.get("config", {}))
    config["calibration"] = transform.to_dict()
    # Clear layout data
    config.pop("room_layout", None)
    config.pop("zones", None)
    # Save grid dimensions
    grid = coordinator.zone_engine.grid
    config["grid"] = grid.to_base64()
    config["grid_origin_x"] = grid.origin_x
    config["grid_origin_y"] = grid.origin_y
    config["grid_cols"] = grid.cols
    config["grid_rows"] = grid.rows

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
                vol.Required("id"): vol.Coerce(int),
                vol.Required("name"): str,
                vol.Required("sensitivity"): str,
                vol.Optional("color", default=""): str,
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
            color=z.get("color", ""),
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
                "color": z.color,
            }
            for z in zones
        ]
        hass.config_entries.async_update_entry(
            entry, options={**entry.options, "config": config}
        )

    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_room_layout",
        vol.Required("entry_id"): str,
        vol.Required("grid_bytes"): [int],
        vol.Optional("zones", default=[]): [
            {
                vol.Required("name"): str,
                vol.Required("color"): str,
                vol.Required("sensitivity"): int,
            }
        ],
        vol.Optional("room_sensitivity", default=1): int,
        vol.Optional("furniture", default=[]): [
            {
                vol.Optional("type", default="icon"): str,
                vol.Required("icon"): str,
                vol.Required("label"): str,
                vol.Required("x"): vol.Coerce(float),
                vol.Required("y"): vol.Coerce(float),
                vol.Required("width"): vol.Coerce(float),
                vol.Required("height"): vol.Coerce(float),
                vol.Required("rotation"): vol.Coerce(float),
                vol.Optional("lockAspect", default=False): bool,
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
        "grid_bytes": msg["grid_bytes"],
        "zones": msg["zones"],
        "room_sensitivity": msg["room_sensitivity"],
        "furniture": msg["furniture"],
    }

    coordinator.set_room_layout(layout)

    # Persist to config entry options
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is not None:
        config = dict(entry.options.get("config", {}))
        config["room_layout"] = layout
        hass.config_entries.async_update_entry(
            entry, options={**entry.options, "config": config}
        )

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
        raw_targets = coordinator.raw_targets
        connection.send_message(
            websocket_api.event_message(
                msg["id"],
                {
                    "targets": [
                        {
                            "x": t[0],
                            "y": t[1],
                            "active": t[2],
                            "raw_x": r[0],
                            "raw_y": r[1],
                        }
                        for t, r in zip(targets, raw_targets)
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

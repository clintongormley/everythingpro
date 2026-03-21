"""WebSocket API for Everything Presence Pro."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.core import callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry

from .calibration import SensorTransform
from .const import DOMAIN
from .const import MAX_TARGETS
from .const import MAX_ZONES
from .const import ZONE_TYPE_DEFAULTS
from .const import ZONE_TYPE_NORMAL
from .coordinator import SIGNAL_DISPLAY_UPDATED
from .coordinator import SIGNAL_SENSORS_UPDATED
from .coordinator import SIGNAL_TARGETS_UPDATED
from .coordinator import EverythingPresenceProCoordinator
from .zone_engine import DisplaySnapshot
from .zone_engine import DisplayTarget
from .zone_engine import TargetResult
from .zone_engine import Zone

_REGISTERED: set[str] = set()


def _get_coordinator(hass: HomeAssistant, entry_id: str) -> EverythingPresenceProCoordinator | None:
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
    websocket_api.async_register_command(hass, websocket_subscribe_display)
    websocket_api.async_register_command(hass, websocket_subscribe_raw_targets)
    websocket_api.async_register_command(hass, websocket_subscribe_grid_targets)
    websocket_api.async_register_command(hass, websocket_rename_zone_entities)
    websocket_api.async_register_command(hass, websocket_set_reporting)


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
    dev_reg = dr.async_get(hass)
    result = []
    for e in entries:
        device = dev_reg.async_get_device(identifiers={(DOMAIN, e.entry_id)})
        device_name = device.name_by_user or device.name if device else None
        result.append(
            {
                "entry_id": e.entry_id,
                "title": device_name or e.title,
                "has_perspective": bool(e.options.get("config", {}).get("calibration", {}).get("perspective")),
                "has_layout": bool(e.options.get("config", {}).get("room_layout")),
            }
        )
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_setup",
        vol.Required("entry_id"): str,
        vol.Required("perspective"): vol.All([vol.Coerce(float)], vol.Length(min=8, max=8)),
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

    hass.config_entries.async_update_entry(entry, options={**entry.options, "config": config})

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
                vol.Required("type"): vol.In(["normal", "entrance", "thoroughfare", "rest", "custom"]),
                vol.Optional("color", default=""): str,
                vol.Optional("trigger"): vol.All(int, vol.Range(min=0, max=9)),
                vol.Optional("renew"): vol.All(int, vol.Range(min=0, max=9)),
                vol.Optional("timeout"): vol.Coerce(float),
                vol.Optional("handoff_timeout"): vol.Coerce(float),
                vol.Optional("entry_point"): bool,
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

    zones = []
    for z in msg["zones"]:
        ztype = z.get("type", ZONE_TYPE_NORMAL)
        defaults = ZONE_TYPE_DEFAULTS.get(ztype, ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL])
        zones.append(
            Zone(
                id=z["id"],
                name=z["name"],
                type=ztype,
                color=z.get("color", ""),
                trigger=z.get("trigger", defaults["trigger"]),
                renew=z.get("renew", defaults["renew"]),
                timeout=z.get("timeout", defaults["timeout"]),
                handoff_timeout=z.get("handoff_timeout", defaults["handoff_timeout"]),
                entry_point=z.get("entry_point", False),
            )
        )

    coordinator.set_zones(zones)

    # Persist to config entry options
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is not None:
        config = dict(entry.options.get("config", {}))
        config["zones"] = [
            {
                "id": z.id,
                "name": z.name,
                "type": z.type,
                "color": z.color,
                "trigger": z.trigger,
                "renew": z.renew,
                "timeout": z.timeout,
                "handoff_timeout": z.handoff_timeout,
                "entry_point": z.entry_point,
            }
            for z in zones
        ]
        hass.config_entries.async_update_entry(entry, options={**entry.options, "config": config})

    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_room_layout",
        vol.Required("entry_id"): str,
        vol.Required("grid_bytes"): [int],
        vol.Optional("zone_slots", default=[None] * MAX_ZONES): vol.All(
            [
                vol.Any(
                    None,
                    {
                        vol.Required("name"): str,
                        vol.Required("color"): str,
                        vol.Required("type"): vol.In(["normal", "entrance", "thoroughfare", "rest", "custom"]),
                        vol.Optional("trigger"): vol.All(int, vol.Range(min=0, max=9)),
                        vol.Optional("renew"): vol.All(int, vol.Range(min=0, max=9)),
                        vol.Optional("timeout"): vol.Coerce(float),
                        vol.Optional("handoff_timeout"): vol.Coerce(float),
                        vol.Optional("entry_point"): bool,
                    },
                )
            ],
            vol.Length(min=MAX_ZONES, max=MAX_ZONES),
        ),
        vol.Optional("room_type", default="normal"): vol.In(["normal", "entrance", "thoroughfare", "rest", "custom"]),
        vol.Optional("room_trigger"): vol.All(int, vol.Range(min=0, max=9)),
        vol.Optional("room_renew"): vol.All(int, vol.Range(min=0, max=9)),
        vol.Optional("room_timeout"): vol.Coerce(float),
        vol.Optional("room_handoff_timeout"): vol.Coerce(float),
        vol.Optional("room_entry_point"): bool,
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

    # Build Zone objects from slot map (filter out empty slots)
    zone_slots = msg["zone_slots"]
    zones = []
    for i, z in enumerate(zone_slots):
        if z is None:
            continue
        ztype = z.get("type", ZONE_TYPE_NORMAL)
        defaults = ZONE_TYPE_DEFAULTS.get(ztype, ZONE_TYPE_DEFAULTS[ZONE_TYPE_NORMAL])
        zones.append(
            Zone(
                id=i + 1,
                name=z["name"],
                type=ztype,
                color=z.get("color", ""),
                trigger=z.get("trigger", defaults["trigger"]),
                renew=z.get("renew", defaults["renew"]),
                timeout=z.get("timeout", defaults["timeout"]),
                handoff_timeout=z.get("handoff_timeout", defaults["handoff_timeout"]),
                entry_point=z.get("entry_point", False),
            )
        )
    coordinator.set_zones(zones)

    layout = {
        "grid_bytes": msg["grid_bytes"],
        "room_type": msg["room_type"],
        "room_trigger": msg.get("room_trigger"),
        "room_renew": msg.get("room_renew"),
        "room_timeout": msg.get("room_timeout"),
        "room_handoff_timeout": msg.get("room_handoff_timeout"),
        "room_entry_point": msg.get("room_entry_point", False),
        "zone_slots": zone_slots,
        "furniture": msg["furniture"],
    }

    coordinator.set_room_layout(layout)

    # Persist to config entry options
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is not None:
        config = dict(entry.options.get("config", {}))
        config["room_layout"] = layout
        hass.config_entries.async_update_entry(entry, options={**entry.options, "config": config})

    # Enable/disable zone entities based on slot occupancy AND reporting toggles
    registry = entity_registry.async_get(hass)
    entry_id = msg["entry_id"]
    entity_id_renames: list[dict[str, str]] = []
    reporting = config.get("reporting", {})

    # Zone 0 "rest of room" — enable if zone_presence/zone_target_count reporting is on
    zone0_entities = [
        (f"{entry_id}_rest_of_room", "binary_sensor", "zone_presence"),
        (f"{entry_id}_rest_of_room_count", "sensor", "zone_target_count"),
    ]
    for unique_id, platform, report_key in zone0_entities:
        ent = registry.async_get_entity_id(platform, DOMAIN, unique_id)
        if ent is None:
            continue
        ent_entry = registry.async_get(ent)
        if ent_entry is None:
            continue
        should_enable = reporting.get(report_key, report_key == "zone_presence")
        if should_enable and ent_entry.disabled_by is not None:
            registry.async_update_entity(ent, disabled_by=None)
        elif not should_enable and ent_entry.disabled_by is None:
            registry.async_update_entity(
                ent,
                disabled_by=entity_registry.RegistryEntryDisabler.INTEGRATION,
            )

    for slot in range(1, MAX_ZONES + 1):
        zone_cfg = zone_slots[slot - 1]
        occupied = zone_cfg is not None
        zone_name = zone_cfg["name"] if zone_cfg else None

        suffixes = [
            (f"_zone_{slot}", "binary_sensor", "occupancy", "zone_presence"),
            (f"_zone_{slot}_count", "sensor", "target_count", "zone_target_count"),
        ]
        for uid_suffix, platform, entity_suffix, report_key in suffixes:
            unique_id = f"{entry_id}{uid_suffix}"
            ent = registry.async_get_entity_id(platform, DOMAIN, unique_id)
            if ent is None:
                continue
            ent_entry = registry.async_get(ent)
            if ent_entry is None:
                continue

            # Only enable if slot is occupied AND reporting toggle is on
            report_enabled = reporting.get(report_key, report_key == "zone_presence")
            should_enable = occupied and report_enabled

            if should_enable:
                # Enable and update friendly name
                friendly = f"{zone_name} {entity_suffix.replace('_', ' ')}"
                updates: dict[str, Any] = {}
                if ent_entry.disabled_by is not None:
                    updates["disabled_by"] = None
                if ent_entry.name != friendly:
                    updates["name"] = friendly
                if updates:
                    registry.async_update_entity(ent, **updates)

                # Track entity_id renames if name-based ID differs
                if zone_name:
                    slug = zone_name.lower().replace(" ", "_")
                    # Get device name for entity_id prefix
                    dev_reg = dr.async_get(hass)
                    device_entry = dev_reg.async_get(ent_entry.device_id) if ent_entry.device_id else None
                    device_slug = (
                        (device_entry.name_by_user or device_entry.name or "epp").lower().replace(" ", "_")
                        if device_entry
                        else "epp"
                    )
                    desired_id = f"{platform}.{device_slug}_{slug}_{entity_suffix}"
                    if ent != desired_id:
                        entity_id_renames.append(
                            {
                                "old_entity_id": ent,
                                "new_entity_id": desired_id,
                            }
                        )
            else:
                # Disable: slot empty or reporting toggle off
                if ent_entry.disabled_by is None:
                    registry.async_update_entity(
                        ent,
                        disabled_by=entity_registry.RegistryEntryDisabler.INTEGRATION,
                    )

    connection.send_result(
        msg["id"],
        {
            "entity_id_renames": entity_id_renames,
        },
    )


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
    def _forward_state() -> None:
        """Forward targets, sensors, and zone state to the WebSocket subscriber."""
        result = coordinator.last_result
        snap = coordinator.last_display_snapshot
        # Pad targets to MAX_TARGETS if zone engine hasn't ticked yet
        targets = list(result.targets) if result else []
        while len(targets) < MAX_TARGETS:
            targets.append(TargetResult())
        display = snap.targets if snap else [DisplayTarget()] * MAX_TARGETS
        connection.send_message(
            websocket_api.event_message(
                msg["id"],
                {
                    "targets": [
                        {
                            "x": t.x,
                            "y": t.y,
                            "raw_x": d.raw_x,
                            "raw_y": d.raw_y,
                            "status": t.status.value,
                            "signal": t.signal,
                        }
                        for t, d in zip(targets, display, strict=False)
                    ],
                    "sensors": {
                        "occupancy": coordinator.device_occupied,
                        "static_presence": coordinator.static_present,
                        "pir_motion": coordinator.pir_motion,
                        "target_presence": coordinator.target_present,
                        "illuminance": coordinator.illuminance,
                        "temperature": coordinator.temperature,
                        "humidity": coordinator.humidity,
                        "co2": coordinator.co2,
                    },
                    "zones": {
                        "frame_count": result.frame_count,
                        "occupancy": result.zone_occupancy,
                        "target_counts": result.zone_target_counts,
                        "debug_log": result.debug_log,
                    },
                },
            )
        )

    # Send initial state
    connection.send_result(msg["id"])
    _forward_state()

    # Subscribe to both target and sensor updates
    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    unsub_targets = async_dispatcher_connect(
        hass,
        f"{SIGNAL_TARGETS_UPDATED}_{msg['entry_id']}",
        _forward_state,
    )
    unsub_sensors = async_dispatcher_connect(
        hass,
        f"{SIGNAL_SENSORS_UPDATED}_{msg['entry_id']}",
        _forward_state,
    )

    @callback
    def _unsub_all() -> None:
        unsub_targets()
        unsub_sensors()

    connection.subscriptions[msg["id"]] = _unsub_all


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/subscribe_display",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_subscribe_display(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle subscribe_display command — lightweight 5 Hz position updates."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    def _build_payload(snap: DisplaySnapshot | None) -> dict[str, Any]:
        """Build the display payload from a snapshot."""
        targets = snap.targets if snap else [DisplayTarget()] * MAX_TARGETS
        return {
            "targets": [
                {
                    "x": t.x,
                    "y": t.y,
                    "raw_x": t.raw_x,
                    "raw_y": t.raw_y,
                    "signal": min(t.frame_count, 9),
                }
                for t in targets
            ],
        }

    @callback
    def _forward_display() -> None:
        """Forward display snapshot to subscriber."""
        connection.send_message(
            websocket_api.event_message(
                msg["id"],
                _build_payload(coordinator.last_display_snapshot),
            )
        )

    # Track subscriber
    coordinator.increment_display_subscribers()

    # Send initial state
    connection.send_result(msg["id"])
    connection.send_message(
        websocket_api.event_message(
            msg["id"],
            _build_payload(coordinator.last_display_snapshot),
        )
    )

    # Subscribe to display updates
    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    unsub = async_dispatcher_connect(
        hass,
        f"{SIGNAL_DISPLAY_UPDATED}_{msg['entry_id']}",
        _forward_display,
    )

    @callback
    def _unsub_all() -> None:
        unsub()
        coordinator.decrement_display_subscribers()

    connection.subscriptions[msg["id"]] = _unsub_all


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/subscribe_raw_targets",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_subscribe_raw_targets(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle subscribe_raw_targets — 5 Hz smoothed sensor-space positions."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    def _build_payload() -> dict[str, Any]:
        snap = coordinator.last_display_snapshot
        targets = snap.targets if snap else [DisplayTarget()] * MAX_TARGETS
        raw_list = [{"raw_x": t.raw_x, "raw_y": t.raw_y} for t in targets]
        target_count = sum(1 for t in targets if t.raw_x != 0.0 or t.raw_y != 0.0)
        return {"target_count": target_count, "targets": raw_list}

    @callback
    def _forward() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], _build_payload())
        )

    coordinator.increment_display_subscribers()

    connection.send_result(msg["id"])
    connection.send_message(
        websocket_api.event_message(msg["id"], _build_payload())
    )

    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    unsub = async_dispatcher_connect(
        hass,
        f"{SIGNAL_DISPLAY_UPDATED}_{msg['entry_id']}",
        _forward,
    )

    @callback
    def _unsub_all() -> None:
        unsub()
        coordinator.decrement_display_subscribers()

    connection.subscriptions[msg["id"]] = _unsub_all


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/subscribe_grid_targets",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_subscribe_grid_targets(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle subscribe_grid_targets — 5 Hz grid positions + cached 1 Hz state."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if coordinator is None:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    def _build_payload() -> dict[str, Any]:
        snap = coordinator.last_display_snapshot
        display = snap.targets if snap else [DisplayTarget()] * MAX_TARGETS
        result = coordinator.last_result
        ztargets = list(result.targets) if result else []
        while len(ztargets) < MAX_TARGETS:
            ztargets.append(TargetResult())
        return {
            "targets": [
                {
                    "x": d.x,
                    "y": d.y,
                    "signal": t.signal,
                    "status": t.status.value,
                }
                for d, t in zip(display, ztargets, strict=False)
            ],
            "sensors": {
                "occupancy": coordinator.device_occupied,
                "static_presence": coordinator.static_present,
                "motion_presence": coordinator.pir_motion,
                "target_presence": coordinator.target_present,
                "illuminance": coordinator.illuminance,
                "temperature": coordinator.temperature,
                "humidity": coordinator.humidity,
                "co2": coordinator.co2,
            },
            "zones": {
                "frame_count": result.frame_count,
                "occupancy": result.zone_occupancy,
                "target_counts": result.zone_target_counts,
                "debug_log": result.debug_log,
            },
        }

    @callback
    def _forward() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], _build_payload())
        )

    coordinator.increment_display_subscribers()

    connection.send_result(msg["id"])
    connection.send_message(
        websocket_api.event_message(msg["id"], _build_payload())
    )

    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    unsub = async_dispatcher_connect(
        hass,
        f"{SIGNAL_DISPLAY_UPDATED}_{msg['entry_id']}",
        _forward,
    )

    @callback
    def _unsub_all() -> None:
        unsub()
        coordinator.decrement_display_subscribers()

    connection.subscriptions[msg["id"]] = _unsub_all


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/rename_zone_entities",
        vol.Required("entry_id"): str,
        vol.Required("renames"): [
            {
                vol.Required("old_entity_id"): str,
                vol.Required("new_entity_id"): str,
            }
        ],
    }
)
@websocket_api.async_response
async def websocket_rename_zone_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Batch-rename zone entity IDs via the entity registry."""
    registry = entity_registry.async_get(hass)
    errors: list[str] = []
    for rename in msg["renames"]:
        old_id = rename["old_entity_id"]
        new_id = rename["new_entity_id"]
        entry = registry.async_get(old_id)
        if entry is None:
            errors.append(f"{old_id} not found")
            continue
        if registry.async_get(new_id) is not None:
            errors.append(f"{new_id} already exists")
            continue
        registry.async_update_entity(old_id, new_entity_id=new_id)

    connection.send_result(msg["id"], {"errors": errors})


# Reporting entity unique_id suffixes and their platforms
_REPORTING_ENTITIES: dict[str, list[tuple[str, str]]] = {
    # Room level
    "room_occupancy": [("_occupancy", "binary_sensor")],
    "room_static_presence": [("_static_presence", "binary_sensor")],
    "room_motion_presence": [("_motion", "binary_sensor")],
    "room_target_presence": [("_target_presence", "binary_sensor")],
    "room_target_count": [("_target_count", "sensor")],
    # Zone level (handled separately per slot)
    # Target level (expanded per target index)
    "target_xy_sensor": [(f"_target_{i + 1}_xy_sensor", "sensor") for i in range(MAX_TARGETS)],
    "target_xy_grid": [(f"_target_{i + 1}_xy_grid", "sensor") for i in range(MAX_TARGETS)],
    "target_active": [(f"_target_{i + 1}_active", "binary_sensor") for i in range(MAX_TARGETS)],
    "target_distance": [(f"_target_{i + 1}_distance", "sensor") for i in range(MAX_TARGETS)],
    "target_angle": [(f"_target_{i + 1}_angle", "sensor") for i in range(MAX_TARGETS)],
    "target_speed": [(f"_target_{i + 1}_speed", "sensor") for i in range(MAX_TARGETS)],
    "target_resolution": [(f"_target_{i + 1}_resolution", "sensor") for i in range(MAX_TARGETS)],
    # Environmental
    "env_illuminance": [("_illuminance", "sensor")],
    "env_humidity": [("_humidity", "sensor")],
    "env_temperature": [("_temperature", "sensor")],
    "env_co2": [("_co2", "sensor")],
}

# Zone-level reporting keys
_ZONE_REPORTING: dict[str, list[tuple[str, str]]] = {
    "zone_presence": [("_zone_{slot}", "binary_sensor")],
    "zone_target_count": [("_zone_{slot}_count", "sensor")],
}


@websocket_api.websocket_command(
    {
        vol.Required("type"): "everything_presence_pro/set_reporting",
        vol.Required("entry_id"): str,
        vol.Required("reporting"): dict,
        vol.Optional("offsets"): {
            vol.Optional("illuminance"): vol.Coerce(float),
            vol.Optional("temperature"): vol.Coerce(float),
            vol.Optional("humidity"): vol.Coerce(float),
        },
    }
)
@callback
def websocket_set_reporting(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Enable/disable reporting entities and save offsets."""
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None:
        connection.send_error(msg["id"], "not_found", "Entry not found")
        return

    registry = entity_registry.async_get(hass)
    entry_id = msg["entry_id"]
    reporting: dict[str, bool] = msg["reporting"]
    offsets: dict[str, float] = msg.get("offsets", {})

    # Save reporting settings and offsets to config entry options
    config = dict(entry.options.get("config", {}))
    config["reporting"] = reporting
    if offsets:
        config["offsets"] = offsets
    hass.config_entries.async_update_entry(entry, options={**entry.options, "config": config})

    # Apply offsets to coordinator immediately
    coordinator = _get_coordinator(hass, entry_id)
    if coordinator and offsets:
        coordinator.set_offsets(offsets)

    # Enable/disable room and target-level entities
    for key, enabled in reporting.items():
        if key in _REPORTING_ENTITIES:
            for uid_suffix, platform in _REPORTING_ENTITIES[key]:
                unique_id = f"{entry_id}{uid_suffix}"
                ent = registry.async_get_entity_id(platform, DOMAIN, unique_id)
                if ent is None:
                    continue
                ent_entry = registry.async_get(ent)
                if ent_entry is None:
                    continue
                if enabled and ent_entry.disabled_by is not None:
                    registry.async_update_entity(ent, disabled_by=None)
                elif not enabled and ent_entry.disabled_by is None:
                    registry.async_update_entity(
                        ent,
                        disabled_by=entity_registry.RegistryEntryDisabler.INTEGRATION,
                    )

        # Zone-level entities: zone 0 (rest of room) + slots 1-7
        if key in _ZONE_REPORTING:
            # Zone 0 "rest of room"
            zone0_map = {
                "zone_presence": ("_rest_of_room", "binary_sensor"),
                "zone_target_count": ("_rest_of_room_count", "sensor"),
            }
            if key in zone0_map:
                uid_suffix, platform = zone0_map[key]
                unique_id = f"{entry_id}{uid_suffix}"
                ent = registry.async_get_entity_id(platform, DOMAIN, unique_id)
                if ent is not None:
                    ent_entry = registry.async_get(ent)
                    if ent_entry is not None:
                        if enabled and ent_entry.disabled_by is not None:
                            registry.async_update_entity(ent, disabled_by=None)
                        elif not enabled and ent_entry.disabled_by is None:
                            registry.async_update_entity(
                                ent,
                                disabled_by=entity_registry.RegistryEntryDisabler.INTEGRATION,
                            )

            # Named zones 1-7
            room_layout = config.get("room_layout", {})
            zone_slots = room_layout.get("zone_slots", [])
            for slot in range(1, MAX_ZONES + 1):
                slot_cfg = zone_slots[slot - 1] if slot - 1 < len(zone_slots) else None
                slot_occupied = slot_cfg is not None
                for uid_template, platform in _ZONE_REPORTING[key]:
                    uid_suffix = uid_template.format(slot=slot)
                    unique_id = f"{entry_id}{uid_suffix}"
                    ent = registry.async_get_entity_id(platform, DOMAIN, unique_id)
                    if ent is None:
                        continue
                    ent_entry = registry.async_get(ent)
                    if ent_entry is None:
                        continue
                    # Only enable if both the toggle is on AND the slot has a zone
                    should_enable = enabled and slot_occupied
                    if should_enable and ent_entry.disabled_by is not None:
                        registry.async_update_entity(ent, disabled_by=None)
                    elif not should_enable and ent_entry.disabled_by is None:
                        registry.async_update_entity(
                            ent,
                            disabled_by=entity_registry.RegistryEntryDisabler.INTEGRATION,
                        )

    connection.send_result(msg["id"])

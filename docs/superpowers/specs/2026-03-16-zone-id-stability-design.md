# Zone ID stability and entity lifecycle

## Problem

Zone IDs shift when a zone is deleted — deleting zone 1 renumbers zones 2 and 3 to 1 and 2. This breaks HA entity associations because entity unique_ids are tied to zone numbers. Users lose automations and dashboard references.

## Design

### Zone slot model

7 fixed zone slots (1-7). IDs are permanent and never renumber.

- Frontend stores `_zoneConfigs` as a 7-element array: `(ZoneConfig | null)[]`
- A `null` entry means the slot is empty
- Adding a zone fills the lowest available `null` slot
- Deleting a zone sets its slot to `null` and clears grid cells with that zone number back to zone 0 — no shifting of other zones
- Grid cell encoding unchanged (bits 2-4 store slot number directly)

### Entity lifecycle

All 14 zone entities (7 slots x 2 types) are pre-created on integration setup, disabled by default. This matches the ESPHome pattern where firmware defines all entities at compile time.

**Entity types per slot:**
- `binary_sensor`: zone occupancy
- `sensor`: zone target count

**Identifiers:**
- `unique_id`: `{entry_id}_zone_{slot}` / `{entry_id}_zone_{slot}_count` — never changes
- `entity_id`: initially generated from zone name (e.g. `binary_sensor.epp_desk_occupancy`). User can rename freely; unique_id maintains the link.
- Friendly name: updated on Apply to match zone config name (e.g. "Desk occupancy")

**State transitions:**
- Zone configured in slot → enable entities, set friendly name
- Zone deleted from slot → disable entities
- Zone re-created in same slot → re-enable entities, update name

### Apply behavior

When the user clicks Apply:

1. Save zone configs (slot map) and grid bytes to backend via `set_room_layout`
2. For each slot: update entity friendly names to match zone config
3. Enable entities for occupied slots, disable entities for empty slots
4. If zone names changed and entity_ids are stale, show rename confirmation dialog

### Entity ID rename dialog

Shown when Apply detects zone name changes where current entity_ids don't reflect the new name:

- Lists each affected zone with old and new entity_ids for all its entity types
- Actions: **Cancel**, **Apply without renaming IDs**, **Apply and rename IDs**
- Uses `entity_registry.async_update_entity(entity_id, new_entity_id=...)` to batch-rename
- If a target entity_id already exists (collision), skip that rename and show a warning

### Backend changes

**websocket_api.py:**
- `set_room_layout` accepts `zone_slots`: array of 7 entries, each `{name, color, sensitivity}` or `null`
- New command `rename_zone_entities`: accepts slot number and new base name, renames all entities for that slot via entity registry

**coordinator.py:**
- Stores zone slot map (7 entries, nullable)
- Passes active zones to zone engine (filters out nulls)
- On setup, registers all 14 entities as `disabled_by_default=True`

**zone_engine.py:**
- No changes needed. Already handles sparse zone IDs (looks up zone number from grid cells, doesn't assume contiguous numbering).

### Frontend changes

**State:**
- `_zoneConfigs: (ZoneConfig | null)[]` — always length 7

**_addZone():**
- Find first `null` index, fill with new ZoneConfig
- Default name: "Zone {slot}" where slot = index + 1

**_removeZone(slot):**
- Set `_zoneConfigs[slot - 1] = null`
- Clear all grid cells with zone number = slot back to zone 0
- No renumbering of other zones or grid cells

**Sidebar:**
- Shows only occupied slots, in slot order
- Slot number displayed alongside zone name

**Apply:**
- Collects active zones from slot map
- Detects name changes vs. current entity names
- Shows rename dialog if needed

## Files to modify

- `frontend/src/everything-presence-pro-panel.ts` — zone model, add/remove logic, sidebar, apply dialog
- `custom_components/everything_presence_pro/sensor.py` — pre-create 7 target count entities
- `custom_components/everything_presence_pro/binary_sensor.py` — pre-create 7 occupancy entities
- `custom_components/everything_presence_pro/websocket_api.py` — zone_slots field, rename command
- `custom_components/everything_presence_pro/coordinator.py` — zone slot storage, entity registration
- `tests/test_zone_engine.py` — verify sparse zone IDs work correctly
- `tests/test_binary_sensor.py` — test enable/disable lifecycle
- `tests/test_sensor.py` — test enable/disable lifecycle

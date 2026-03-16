# Zone ID Stability Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make zone IDs stable (1-7 fixed slots) so HA entities survive zone deletions, and pre-create all zone entities as disabled by default.

**Architecture:** Replace the packed `ZoneConfig[]` array with a 7-element sparse array `(ZoneConfig | null)[]`. Zone deletion nulls a slot instead of shifting. Backend pre-creates all 14 zone entities (7 occupancy + 7 target count) disabled by default, enabling/disabling them as zones are configured. Entity rename dialog on Apply lets users batch-update entity_ids when zone names change.

**Tech Stack:** TypeScript (Lit), Python (HA integration), ESPHome native API

**Spec:** `docs/superpowers/specs/2026-03-16-zone-id-stability-design.md`

---

## Chunk 1: Backend — stable zone slots and pre-created entities

### Task 1: Add MAX_ZONES constant usage in zone engine

**Files:**
- Modify: `custom_components/everything_presence_pro/const.py` (already has `MAX_ZONES = 7`)
- Modify: `custom_components/everything_presence_pro/zone_engine.py`
- Test: `tests/test_zone_engine.py`

- [ ] **Step 1: Write test for sparse zone IDs**

In `tests/test_zone_engine.py`, add:

```python
def test_zone_engine_sparse_zone_ids():
    """Test zone engine works with non-contiguous zone IDs."""
    engine = ZoneEngine()
    grid = _make_grid()
    # Zone 1 on cell (150, 150), zone 3 on cell (450, 450) — skip zone 2
    cell1 = grid.xy_to_cell(150, 150)
    grid.cells[cell1] = CELL_ROOM_INSIDE | (1 << CELL_ZONE_SHIFT)
    cell3 = grid.xy_to_cell(450, 450)
    grid.cells[cell3] = CELL_ROOM_INSIDE | (3 << CELL_ZONE_SHIFT)
    engine.set_grid(grid)

    zone1 = Zone(id=1, name="Desk", sensitivity=ZONE_HIGH)
    zone3 = Zone(id=3, name="Bed", sensitivity=ZONE_HIGH)
    engine.set_zones([zone1, zone3])

    result = engine.process_targets([(150, 150, True)])
    assert result.zone_occupancy[1] is True
    assert result.zone_target_counts[1] == 1
    assert result.zone_occupancy.get(3, False) is False

    result = engine.process_targets([(450, 450, True)])
    assert result.zone_occupancy.get(1, False) is False
    assert result.zone_occupancy[3] is True
```

- [ ] **Step 2: Run test to verify it passes** (zone engine already handles sparse IDs)

Run: `pytest tests/test_zone_engine.py::test_zone_engine_sparse_zone_ids -v`
Expected: PASS (zone engine uses zone.id directly, no contiguity assumption)

- [ ] **Step 3: Commit**

```bash
git add tests/test_zone_engine.py
git commit -m "test: verify zone engine handles sparse zone IDs"
```

### Task 2: Pre-create zone entities in binary_sensor.py

**Files:**
- Modify: `custom_components/everything_presence_pro/binary_sensor.py`
- Modify: `custom_components/everything_presence_pro/const.py`
- Test: `tests/test_binary_sensor.py`

- [ ] **Step 1: Write test for pre-created disabled zone entities**

In `tests/test_binary_sensor.py`, add:

```python
def test_zone_occupancy_precreated_disabled(mock_coordinator):
    """Test all 7 zone occupancy entities are pre-created and disabled."""
    from custom_components.everything_presence_pro.const import MAX_ZONES

    mock_coordinator.zones = []  # No zones configured yet
    sensor = EverythingPresenceProZoneOccupancySensor(
        mock_coordinator, slot=1
    )
    assert sensor.unique_id == "test_entry_zone_1"
    assert sensor.entity_registry_enabled_default is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_binary_sensor.py::test_zone_occupancy_precreated_disabled -v`
Expected: FAIL — constructor doesn't accept `slot` parameter yet

- [ ] **Step 3: Rewrite ZoneOccupancySensor to use slot-based model**

In `binary_sensor.py`, replace `EverythingPresenceProZoneOccupancySensor`:

```python
class EverythingPresenceProZoneOccupancySensor(BinarySensorEntity):
    """Per-zone occupancy sensor. One per slot (1-7), pre-created disabled."""

    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_entity_registry_enabled_default = False

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, slot: int
    ) -> None:
        """Initialize the zone occupancy sensor."""
        self._coordinator = coordinator
        self._slot = slot
        self._attr_unique_id = f"{coordinator.entry.entry_id}_zone_{slot}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def name(self) -> str:
        """Return the zone name from the coordinator's slot map."""
        zone = self._coordinator.get_zone_by_slot(self._slot)
        if zone is not None:
            return f"{zone.name} occupancy"
        return f"Zone {self._slot} occupancy"

    @property
    def is_on(self) -> bool:
        """Return true if zone is occupied."""
        return self._coordinator.last_result.zone_occupancy.get(
            self._slot, False
        )

    @property
    def extra_state_attributes(self) -> dict[str, int]:
        """Return extra state attributes including target count."""
        return {
            "target_count": self._coordinator.last_result.zone_target_counts.get(
                self._slot, 0
            )
        }

    async def async_added_to_hass(self) -> None:
        """Subscribe to target updates when added to hass."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_TARGETS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )

    @callback
    def _on_update(self) -> None:
        """Handle target update."""
        self.async_write_ha_state()
```

- [ ] **Step 4: Update async_setup_entry to pre-create all 7 slots**

Replace the zone entity creation in `async_setup_entry`:

```python
async def async_setup_entry(
    hass: HomeAssistant,
    entry: EverythingPresenceProConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up binary sensor entities from a config entry."""
    coordinator: EverythingPresenceProCoordinator = entry.runtime_data

    entities: list[BinarySensorEntity] = [
        EverythingPresenceProOccupancySensor(coordinator),
        EverythingPresenceProMotionSensor(coordinator),
        EverythingPresenceProStaticPresenceSensor(coordinator),
    ]

    # Pre-create all 7 zone occupancy entities (disabled by default)
    for slot in range(1, MAX_ZONES + 1):
        entities.append(
            EverythingPresenceProZoneOccupancySensor(coordinator, slot)
        )

    async_add_entities(entities)
```

Remove the `_on_zones_updated` callback and `SIGNAL_ZONES_UPDATED` import — no longer needed since all entities are pre-created.

- [ ] **Step 5: Add get_zone_by_slot to coordinator**

In `coordinator.py`, add method:

```python
def get_zone_by_slot(self, slot: int) -> Zone | None:
    """Return the zone configured in a slot, or None if empty."""
    for zone in self._zones:
        if zone.id == slot:
            return zone
    return None
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pytest tests/test_binary_sensor.py::test_zone_occupancy_precreated_disabled -v`
Expected: PASS

- [ ] **Step 7: Fix remaining binary sensor tests for new constructor**

Update all existing tests that create `EverythingPresenceProZoneOccupancySensor` to use `slot=` instead of `zone=`. Update assertions for the new name format.

- [ ] **Step 8: Run all binary sensor tests**

Run: `pytest tests/test_binary_sensor.py -v`
Expected: All PASS

- [ ] **Step 9: Commit**

```bash
git add custom_components/everything_presence_pro/binary_sensor.py \
        custom_components/everything_presence_pro/coordinator.py \
        tests/test_binary_sensor.py
git commit -m "feat: pre-create zone occupancy entities with stable slot IDs"
```

### Task 3: Pre-create zone target count entities in sensor.py

**Files:**
- Modify: `custom_components/everything_presence_pro/sensor.py`
- Test: `tests/test_sensor.py`

- [ ] **Step 1: Rewrite ZoneTargetCountSensor to use slot-based model**

Same pattern as binary_sensor — replace `zone: Zone` param with `slot: int`, add `_attr_entity_registry_enabled_default = False`, look up zone name from coordinator.

```python
class EverythingPresenceProZoneTargetCountSensor(SensorEntity):
    """Per-zone target count sensor. One per slot (1-7), pre-created disabled."""

    _attr_has_entity_name = True
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_registry_enabled_default = False

    def __init__(
        self, coordinator: EverythingPresenceProCoordinator, slot: int
    ) -> None:
        """Initialize the zone target count sensor."""
        self._coordinator = coordinator
        self._slot = slot
        self._attr_unique_id = (
            f"{coordinator.entry.entry_id}_zone_{slot}_count"
        )
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)}
        )

    @property
    def name(self) -> str:
        """Return the sensor name."""
        zone = self._coordinator.get_zone_by_slot(self._slot)
        if zone is not None:
            return f"{zone.name} target count"
        return f"Zone {self._slot} target count"

    @property
    def native_value(self) -> int:
        """Return the target count for this zone."""
        return self._coordinator.last_result.zone_target_counts.get(
            self._slot, 0
        )

    async def async_added_to_hass(self) -> None:
        """Subscribe to target updates when added to hass."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                f"{SIGNAL_TARGETS_UPDATED}_{self._coordinator.entry.entry_id}",
                self._on_update,
            )
        )

    @callback
    def _on_update(self) -> None:
        """Handle update."""
        self.async_write_ha_state()
```

- [ ] **Step 2: Update async_setup_entry to pre-create all 7 slots**

```python
# Pre-create all 7 zone target count entities (disabled by default)
for slot in range(1, MAX_ZONES + 1):
    entities.append(
        EverythingPresenceProZoneTargetCountSensor(coordinator, slot)
    )
```

Remove the `_on_zones_updated` callback and `SIGNAL_ZONES_UPDATED` import.

- [ ] **Step 3: Fix sensor tests for new constructor**

Update tests that create `EverythingPresenceProZoneTargetCountSensor` to use `slot=` instead of `zone=`.

- [ ] **Step 4: Run all sensor tests**

Run: `pytest tests/test_sensor.py -v`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/sensor.py \
        tests/test_sensor.py
git commit -m "feat: pre-create zone target count entities with stable slot IDs"
```

### Task 4: Update websocket API for zone_slots

**Files:**
- Modify: `custom_components/everything_presence_pro/websocket_api.py`

- [ ] **Step 1: Update set_room_layout schema**

Change the `zones` field in `websocket_set_room_layout` to `zone_slots` — an array of exactly 7 entries, each either a zone config object or `null`:

```python
vol.Optional("zone_slots", default=[None] * 7): vol.All(
    [
        vol.Any(
            None,
            {
                vol.Required("name"): str,
                vol.Required("color"): str,
                vol.Required("sensitivity"): int,
            },
        )
    ],
    vol.Length(min=7, max=7),
),
```

- [ ] **Step 2: Update handler to build Zone objects from slots**

In `websocket_set_room_layout`, after reading `zone_slots`:

```python
zone_slots = msg["zone_slots"]
zones = [
    Zone(
        id=i + 1,
        name=z["name"],
        sensitivity=_sensitivity_str(z["sensitivity"]),
        color=z.get("color", ""),
    )
    for i, z in enumerate(zone_slots)
    if z is not None
]
coordinator.set_zones(zones)
```

Where `_sensitivity_str` maps int sensitivity to the string constants (or keep as-is if already compatible).

- [ ] **Step 3: Store zone_slots in layout data**

```python
layout = {
    "grid_bytes": msg["grid_bytes"],
    "zone_slots": msg["zone_slots"],
    "room_sensitivity": msg["room_sensitivity"],
    "furniture": msg["furniture"],
}
```

- [ ] **Step 4: Add rename_zone_entities websocket command**

```python
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
```

Register it in `async_register_websocket_commands`.

- [ ] **Step 5: Commit**

```bash
git add custom_components/everything_presence_pro/websocket_api.py
git commit -m "feat: add zone_slots to layout API and entity rename command"
```

---

## Chunk 2: Frontend — sparse zone model, no-shift delete, rename dialog

### Task 5: Change _zoneConfigs to sparse 7-element array

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Update state declaration**

```typescript
@state() private _zoneConfigs: (ZoneConfig | null)[] = new Array(7).fill(null);
```

- [ ] **Step 2: Rewrite _addZone()**

```typescript
private _addZone(): void {
  const firstEmpty = this._zoneConfigs.findIndex((z) => z === null);
  if (firstEmpty === -1) return; // All 7 slots full

  const usedColors = new Set(
    this._zoneConfigs.filter((z) => z !== null).map((z) => z!.color)
  );
  const color = ZONE_COLORS.find((c) => !usedColors.has(c)) ??
    ZONE_COLORS[firstEmpty % ZONE_COLORS.length];
  const configs = [...this._zoneConfigs];
  configs[firstEmpty] = {
    name: `Zone ${firstEmpty + 1}`,
    color,
    sensitivity: 1,
  };
  this._zoneConfigs = configs;
  this._activeZone = firstEmpty + 1; // 1-based slot number
  this._dirty = true;
}
```

- [ ] **Step 3: Rewrite _removeZone(slot)**

```typescript
private _removeZone(slot: number): void {
  if (slot < 1 || slot > 7 || this._zoneConfigs[slot - 1] === null) return;
  // Clear all grid cells with this zone back to zone 0
  this._grid = new Uint8Array(this._grid);
  for (let i = 0; i < GRID_CELL_COUNT; i++) {
    if (cellZone(this._grid[i]) === slot) {
      this._grid[i] = cellSetZone(this._grid[i], 0);
    }
  }
  // No renumbering — just null out the slot
  const configs = [...this._zoneConfigs];
  configs[slot - 1] = null;
  this._zoneConfigs = configs;
  if (this._activeZone === slot) {
    this._activeZone = null;
  }
  this._dirty = true;
  this.requestUpdate();
}
```

- [ ] **Step 4: Update _getCellColor to handle sparse array**

```typescript
private _getCellColor(index: number): string {
  const cell = this._grid[index];
  if (!cellIsInside(cell)) return "var(--secondary-background-color, #e0e0e0)";
  const zone = cellZone(cell);
  if (zone > 0) {
    const config = this._zoneConfigs[zone - 1];
    if (config) return config.color;
  }
  return "var(--card-background-color, #fff)";
}
```

- [ ] **Step 5: Update sidebar zone list rendering**

Change the `_zoneConfigs.map` in the template to iterate all 7 slots, skipping nulls:

```typescript
${this._zoneConfigs.map((zone, i) => {
  if (zone === null) return nothing;
  const slot = i + 1;
  // ... render zone with slot number ...
})}
```

Update all zone name/color/sensitivity edit handlers to work with slot index instead of packed index.

- [ ] **Step 6: Update _applyLayout to send zone_slots**

```typescript
zone_slots: this._zoneConfigs.map((z) =>
  z !== null ? { name: z.name, color: z.color, sensitivity: z.sensitivity } : null
),
```

- [ ] **Step 7: Update zone loading from layout**

When loading `zone_slots` from the backend config, populate the sparse array directly:

```typescript
if (layout.zone_slots && Array.isArray(layout.zone_slots)) {
  this._zoneConfigs = layout.zone_slots.map(
    (z: any) => z !== null ? { name: z.name, color: z.color, sensitivity: z.sensitivity } : null
  );
}
```

- [ ] **Step 8: Update template save/load**

Templates should store `zone_slots` (sparse array) instead of `zones` (packed array).

- [ ] **Step 9: Update "add zone" button visibility**

```typescript
${this._zoneConfigs.some((z) => z === null)
  ? html`<button class="add-zone-btn" @click=${this._addZone}>...`
  : nothing}
```

- [ ] **Step 10: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: sparse zone slots in frontend — no renumbering on delete"
```

### Task 6: Entity rename dialog

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Add rename dialog state**

```typescript
@state() private _pendingRenames: { old_entity_id: string; new_entity_id: string }[] = [];
@state() private _showRenameDialog = false;
```

- [ ] **Step 2: Add rename detection to _applyLayout**

After the main WS call succeeds, check if any zone names changed. Compare current entity_ids (fetched from HA entity registry) against expected entity_ids derived from zone names. If mismatches exist, populate `_pendingRenames` and show the dialog.

- [ ] **Step 3: Render rename confirmation dialog**

Dialog lists each rename, with three buttons: Cancel, Apply without renaming IDs, Apply and rename IDs. "Apply and rename IDs" calls the `rename_zone_entities` WS command.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: entity ID rename dialog on zone name changes"
```

### Task 7: Build frontend and run tests

- [ ] **Step 1: Build frontend**

```bash
cd frontend && npm run build
```

- [ ] **Step 2: Run backend tests**

```bash
pytest tests/test_zone_engine.py tests/test_binary_sensor.py tests/test_sensor.py -v
```
Expected: All PASS

- [ ] **Step 3: Commit built JS**

```bash
git add custom_components/everything_presence_pro/frontend/everything-presence-pro-panel.js
git commit -m "build: regenerate frontend JS"
```

# Setup wizard redesign implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the setup wizard so all coordinates are in room space, the grid represents the physical room regardless of sensor placement, and room layouts survive placement changes.

**Architecture:** Single-file frontend rewrite of `everything-presence-pro-panel.ts`. The sensor→room transform is applied at capture time (bounds) and display time (live targets). The 20×16 grid maps to physical room coordinates. No backend changes needed.

**Tech Stack:** TypeScript, Lit 3, Rollup

**Design doc:** `docs/plans/2026-03-06-setup-wizard-redesign.md`

---

### Task 1: Rewrite `_sensorToRoom()` transform

The current `_sensorToRoom()` at line 346 does basic 45° rotation but doesn't account for sensor position offset. Rewrite it to produce correct room coordinates per the design doc.

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:346-368`

**Step 1: Replace `_sensorToRoom()` with the new transform**

The method takes raw sensor (tx, ty), placement, and optionally bounds (needed for wall mount to know sensor X position). Returns room coordinates (rx, ry).

```typescript
/**
 * Transform raw sensor coordinates to room coordinates.
 *
 * Room coordinate system:
 *   Origin = left corner of sensor wall
 *   X = left→right along wall (mm)
 *   Y = into room perpendicular to wall (mm)
 *
 * Mirror is applied by caller before passing tx.
 */
private _sensorToRoom(
  tx: number,
  ty: number,
  placement: Placement | "",
  bounds: RoomBounds | null
): { rx: number; ry: number } {
  switch (placement) {
    case "left_corner":
      // Sensor at origin, facing 45° into room
      return {
        rx: ty * SIN45 + tx * SIN45,
        ry: ty * SIN45 - tx * SIN45,
      };
    case "right_corner":
      // Sensor at right corner, facing -45° into room
      // wall_width = right_x from bounds (or 6000 as fallback)
      const wallWidth = bounds?.right_x ?? 6000;
      return {
        rx: wallWidth - (ty * SIN45 + tx * SIN45),
        ry: ty * SIN45 + tx * SIN45,
      };
    case "wall":
    default: {
      // Sensor at wall center, facing straight into room
      // sensor_wall_x = midpoint of bounds, or 3000 fallback
      const sensorX = bounds
        ? (bounds.left_x + bounds.right_x) / 2
        : 3000;
      return { rx: sensorX + tx, ry: ty };
    }
  }
}
```

Note: The right corner `ry` formula uses `+` not `-` for `tx * SIN45` because sensor-right points toward the wall (opposite to left corner). Verify with the example from the design doc: person at room (3,4), right corner sensor at (6,0). Sensor raw ≈ (0.71, 4.95):
- `rx = 6 - (4.95 * 0.707 + 0.71 * 0.707) = 6 - 4.0 = 2.0` ... hmm that gives ~2, not 3.

Actually let me re-derive. For right corner, sensor forward direction points at -45° from room Y. The rotation from sensor frame to room frame:
- `room_x = wall_width + (-ty * sin45 + tx * cos45)` → sensor forward (-ty*sin45) goes left, sensor right (tx*cos45) goes right
- `room_y = ty * cos45 + tx * sin45`

Check: tx=0.71, ty=4.95, wall_width=6:
- `rx = 6 + (-4.95*0.707 + 0.71*0.707) = 6 + (-3.5 + 0.5) = 3.0` ✓
- `ry = 4.95*0.707 + 0.71*0.707 = 3.5 + 0.5 = 4.0` ✓

Corrected right corner transform:

```typescript
case "right_corner": {
  const wallWidth = bounds?.right_x ?? 6000;
  return {
    rx: wallWidth - ty * SIN45 + tx * SIN45,
    ry: ty * SIN45 + tx * SIN45,
  };
}
```

**Step 2: Update all callers to pass bounds parameter**

The method signature now requires `bounds`. Update these call sites:
- `_mapTargetToPercent()` at line 377 — already has bounds parameter, pass it through
- `_markBoundsPoint()` at line 456 — pass `null` during capture (bounds not yet established; for wall mount pre-bounds, use fallback)
- `_getWizardTargetStyle()` at line 568 — pass `null`

**Step 3: Build and verify**

```bash
cd /workspaces/everythingpro/frontend && npm run build
```

Expected: builds without errors.

**Step 4: Commit**

```bash
cd /workspaces/everythingpro
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "fix: rewrite sensorToRoom transform with correct room-space math"
```

---

### Task 2: Rewrite `_mapTargetToPercent()` to use room-space mapping

The current method at line 370 has separate branches for each placement. Replace with a single room-space mapping that works uniformly.

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:370-411`

**Step 1: Replace `_mapTargetToPercent()`**

```typescript
private _mapTargetToPercent(
  target: Target,
  mirrored: boolean,
  placement: Placement | "",
  bounds: RoomBounds | null
): { x: number; y: number } {
  const tx = mirrored ? -target.x : target.x;
  const { rx, ry } = this._sensorToRoom(tx, target.y, placement, bounds);

  if (bounds && bounds.far_y > 0 && bounds.right_x > bounds.left_x) {
    // Map room coords to grid percentage using bounds
    const xPercent =
      ((rx - bounds.left_x) / (bounds.right_x - bounds.left_x)) * 100;
    const yPercent = (ry / bounds.far_y) * 100;
    return { x: xPercent, y: yPercent };
  }

  // Fallback before bounds are set: use raw sensor FOV
  // Map to a 6000×6000mm area with sensor-appropriate origin
  const yPercent = (ry / 6000) * 100;
  let xPercent: number;
  switch (placement) {
    case "left_corner":
      xPercent = (rx / 6000) * 100;
      break;
    case "right_corner":
      xPercent = (rx / 6000) * 100;
      break;
    case "wall":
    default:
      xPercent = (rx / 6000) * 100;
      break;
  }
  return { x: xPercent, y: yPercent };
}
```

Since `_sensorToRoom()` already produces room-space coords, the fallback can be simplified — all placements use the same formula. But the fallback range (6000) may not be ideal for all placements. For the fallback (pre-bounds), we just need something reasonable for the orientation step.

**Step 2: Build and verify**

```bash
cd /workspaces/everythingpro/frontend && npm run build
```

**Step 3: Commit**

```bash
cd /workspaces/everythingpro
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: simplify mapTargetToPercent to use room-space coords"
```

---

### Task 3: Update `_markBoundsPoint()` to store room coordinates

The current method at line 450 already calls `_sensorToRoom()`, but needs to use the updated signature and ensure room coords are stored correctly.

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:450-498`

**Step 1: Update `_markBoundsPoint()`**

The key change: pass `null` for bounds during capture (bounds aren't established yet). For wall mount, the fallback in `_sensorToRoom` uses `sensorX = 3000`, which is fine for initial capture — the values get refined once all 3 points are captured.

```typescript
private _markBoundsPoint(): void {
  const active = this._targets.find((t) => t.active);
  if (!active) return;

  const tx = this._wizardMirrored ? -active.x : active.x;
  // Transform to room coordinates
  // Pass existing partial bounds for right_corner wall_width estimate
  const partialBounds = this._wizardBounds.right_x > 0 ? this._wizardBounds : null;
  const { rx, ry } = this._sensorToRoom(
    tx,
    active.y,
    this._wizardPlacement || "wall",
    partialBounds
  );

  switch (this._setupStep) {
    case "bounds_far":
      this._wizardBounds = { ...this._wizardBounds, far_y: ry };
      this._wizardCapturedPoints = [
        ...this._wizardCapturedPoints,
        { x: rx, y: ry },
      ];
      this._setupStep = "bounds_left";
      break;
    case "bounds_left":
      this._wizardBounds = { ...this._wizardBounds, left_x: rx };
      this._wizardCapturedPoints = [
        ...this._wizardCapturedPoints,
        { x: rx, y: ry },
      ];
      this._setupStep = "bounds_right";
      break;
    case "bounds_right":
      this._wizardBounds = { ...this._wizardBounds, right_x: rx };
      this._wizardCapturedPoints = [
        ...this._wizardCapturedPoints,
        { x: rx, y: ry },
      ];
      // Ensure left_x < right_x
      if (this._wizardBounds.left_x > this._wizardBounds.right_x) {
        const tmp = this._wizardBounds.left_x;
        this._wizardBounds = {
          ...this._wizardBounds,
          left_x: this._wizardBounds.right_x,
          right_x: tmp,
        };
      }
      this._roomBounds = { ...this._wizardBounds };
      this._setupStep = "preview";
      break;
  }
}
```

**Step 2: Build and verify**

```bash
cd /workspaces/everythingpro/frontend && npm run build
```

**Step 3: Commit**

```bash
cd /workspaces/everythingpro
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "fix: markBoundsPoint uses room coords with updated transform"
```

---

### Task 4: Update `_getWizardCapturedStyle()` and `_getWizardTargetStyle()`

These helper methods need to work with room-space coordinates consistently.

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:567-593`

**Step 1: Simplify `_getWizardCapturedStyle()`**

Captured points are now in room coordinates. The mapping to grid percentage is the same as `_mapTargetToPercent` fallback (no bounds during capture).

```typescript
private _getWizardCapturedStyle(point: { x: number; y: number }): string {
  // Points are in room coords — map to grid using 6000mm fallback range
  const xPercent = (point.x / 6000) * 100;
  const yPercent = (point.y / 6000) * 100;
  return `left: ${xPercent}%; top: ${yPercent}%;`;
}
```

No per-placement switching needed — room coords are uniform.

**Step 2: Update `_getWizardTargetStyle()`**

Pass `null` for bounds (orientation/bounds steps don't have bounds yet).

```typescript
private _getWizardTargetStyle(target: Target): string {
  const { x, y } = this._mapTargetToPercent(
    target,
    this._wizardMirrored,
    this._wizardPlacement || "wall",
    null
  );
  return `left: ${x}%; top: ${y}%;`;
}
```

This is unchanged from current code — just verifying it still works with the new `_mapTargetToPercent`.

**Step 3: Build and verify**

```bash
cd /workspaces/everythingpro/frontend && npm run build
```

**Step 4: Commit**

```bash
cd /workspaces/everythingpro
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "refactor: simplify wizard style helpers to use room coords"
```

---

### Task 5: Add auto-fill grid logic to preview step

When the wizard reaches the preview step, auto-fill grid cells based on room bounds.

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

**Step 1: Add `_autoFillGrid()` method**

Add this method near the other grid helpers (around line 315):

```typescript
private _autoFillGrid(bounds: RoomBounds): void {
  // Map each grid cell center to room coordinates and check if inside bounds
  const cellWidthMm = (bounds.right_x - bounds.left_x) / GRID_COLS;
  const cellHeightMm = bounds.far_y / GRID_ROWS;

  const grid = new Array(GRID_CELL_COUNT).fill("outside");
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const centerX = bounds.left_x + (col + 0.5) * cellWidthMm;
      const centerY = (row + 0.5) * cellHeightMm;
      if (
        centerX >= bounds.left_x &&
        centerX <= bounds.right_x &&
        centerY >= 0 &&
        centerY <= bounds.far_y
      ) {
        grid[row * GRID_COLS + col] = "room";
      }
    }
  }
  this._grid = grid;
}
```

Since the bounds define the grid extents, all cells within the rectangle will be "room" (which means all 320 cells). This is correct — the grid IS the room. The "outside" painting comes later when the user manually trims corners or irregular shapes.

Simplify to:

```typescript
private _autoFillGrid(): void {
  // All grid cells are inside the room (grid = room bounds)
  this._grid = new Array(GRID_CELL_COUNT).fill("room");
}
```

**Step 2: Call `_autoFillGrid()` when entering preview step**

In `_markBoundsPoint()`, after setting `this._setupStep = "preview"`, add:

```typescript
this._autoFillGrid();
```

**Step 3: Build and verify**

```bash
cd /workspaces/everythingpro/frontend && npm run build
```

**Step 4: Commit**

```bash
cd /workspaces/everythingpro
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: auto-fill grid cells as room when bounds are captured"
```

---

### Task 6: Update `_wizardFinish()` to preserve saved layouts on re-run

When the wizard finishes, save the new placement/bounds. If there was a previously saved room layout, reload it on top of the auto-filled grid.

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:501-523`

**Step 1: Update `_wizardFinish()`**

```typescript
private async _wizardFinish(): Promise<void> {
  if (!this._wizardPlacement || !this._wizardRoomName.trim()) return;

  this._wizardSaving = true;
  try {
    await this.hass.callWS({
      type: "everything_presence_pro/set_setup",
      entry_id: this._selectedEntryId,
      room_name: this._wizardRoomName.trim(),
      placement: this._wizardPlacement,
      mirrored: this._wizardMirrored,
      room_bounds: this._wizardBounds,
    });
    this._placement = this._wizardPlacement;
    this._roomName = this._wizardRoomName.trim();
    this._mirrored = this._wizardMirrored;
    this._roomBounds = { ...this._wizardBounds };
    this._setupStep = null;

    // Reload config to restore saved room layout/zones on top of auto-fill
    await this._loadEntryConfig(this._selectedEntryId);
    await this._loadEntries();
  } finally {
    this._wizardSaving = false;
  }
}
```

The key change: call `_loadEntryConfig()` after saving. This will call `_applyConfig()` which loads the saved `room_layout` and `zones`, overlaying them on the auto-filled grid. If no layout was previously saved, the auto-filled grid persists.

**Step 2: Build and verify**

```bash
cd /workspaces/everythingpro/frontend && npm run build
```

**Step 3: Commit**

```bash
cd /workspaces/everythingpro
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: reload saved room layout after wizard re-run"
```

---

### Task 7: Update FOV overlay for room-space sensor positions

The sensor overlay on the main grid needs to show the sensor at the correct room-space position with the FOV at the correct angle.

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:527-551` (`_getSensorPosition`, `_getFovAngles`)

**Step 1: Update `_getSensorPosition()`**

The sensor position on the grid depends on placement:
- Left corner: top-left (0, 0)
- Wall: top-center (GRID_WIDTH/2, 0)
- Right corner: top-right (GRID_WIDTH, 0)

This is actually unchanged from the current code. Keep as-is.

**Step 2: Verify `_getFovAngles()` are correct**

Current values:
- Wall: -60° to 60° (120° cone, straight down) ✓
- Left corner: -15° to 105° (120° cone, centered at 45°) ✓
- Right corner: -105° to 15° (120° cone, centered at -45°) ✓

These are correct for the room-space view. Keep as-is.

**Step 3: No changes needed — verify with build**

```bash
cd /workspaces/everythingpro/frontend && npm run build
```

---

### Task 8: Update `_getOrientationSensorStyle()` for mini-grid

The mini-grid sensor dot position should match the placement. Currently correct — verify.

**Files:**
- Verify: `frontend/src/everything-presence-pro-panel.ts:555-564`

Current code:
- Left corner: `left: 0; top: 0;` ✓
- Right corner: `right: 0; top: 0;` ✓
- Wall: `left: 50%; top: 0;` ✓

No changes needed.

---

### Task 9: Build, deploy, and verify end-to-end

**Step 1: Final build**

```bash
cd /workspaces/everythingpro/frontend && npm run build
```

Expected: no errors, output at `custom_components/everything_presence_pro/frontend/everything-presence-pro-panel.js`

**Step 2: Deploy to HA**

```bash
cp -r /workspaces/everythingpro/custom_components/everything_presence_pro/ \
  /workspaces/homeassistant-core.worktrees/everythingpro/config/custom_components/everything_presence_pro/
```

**Step 3: Manual verification checklist**

1. Load panel — should show wizard if no placement saved
2. Step 1 (placement): select each placement option, verify FOV diagrams show correct angles
3. Step 2 (orientation): target dot should move in room-space coordinates (left = left on grid regardless of sensor placement)
4. Step 3 (bounds): mark 3 points, verify captured dots appear at correct room-space positions
5. Step 4 (preview): grid should be all "room" cells, targets positioned correctly within bounds
6. After finish: main editor shows grid with targets at correct positions
7. Re-run wizard (settings gear): go through all steps, after finish the previously saved room layout should be restored

**Step 4: Final commit**

```bash
cd /workspaces/everythingpro
git add -A
git commit -m "feat: complete setup wizard redesign with room-space coordinates"
```

import {
	CELL_ROOM_BIT,
	cellIsInside,
	cellSetZone,
	cellZone,
	GRID_CELL_COUNT,
	MAX_ZONES,
} from "./grid.js";

export type PaintAction = "set" | "clear";

/**
 * Determine the paint action (set or clear) when starting a paint stroke.
 *
 * For boundary painting (activeZone === 0):
 *   - If cell is plain inside room (no zone), action = "clear" (remove from room)
 *   - Otherwise, action = "set" (add to room)
 *
 * For zone painting (activeZone > 0):
 *   - If cell already has this zone, action = "clear" (unpaint)
 *   - Otherwise, action = "set" (paint zone)
 *
 * @param cellValue Current cell byte value
 * @param activeZone Active zone (0 = boundary, 1-7 = named zone)
 * @returns The paint action to use for the entire stroke
 */
export function determinePaintAction(
	cellValue: number,
	activeZone: number,
): PaintAction {
	if (activeZone === 0) {
		const isPlainRoom = cellIsInside(cellValue) && cellZone(cellValue) === 0;
		return isPlainRoom ? "clear" : "set";
	}
	return cellZone(cellValue) === activeZone ? "clear" : "set";
}

/**
 * Apply a paint action to a single grid cell and return the new cell value.
 *
 * Returns null if the cell should not be modified (e.g. painting a zone
 * on an outside cell).
 *
 * @param cellValue Current cell byte value
 * @param activeZone Active zone (0 = boundary, 1-7 = named zone)
 * @param paintAction Whether to "set" or "clear"
 * @returns New cell value, or null if no change should occur
 */
export function applyPaintToCell(
	cellValue: number,
	activeZone: number,
	paintAction: PaintAction,
): number | null {
	if (activeZone === 0) {
		// Boundary: set = plain inside room, clear = outside
		if (paintAction === "set") {
			return CELL_ROOM_BIT;
		}
		return 0;
	}

	// Named zone painting — only on inside-room cells
	if (!cellIsInside(cellValue)) return null;
	if (paintAction === "set") {
		return cellSetZone(cellValue | CELL_ROOM_BIT, activeZone);
	}
	return cellSetZone(cellValue, 0);
}

/**
 * Clear all cells of a specific zone back to zone 0 (room default).
 *
 * Returns a new grid with the zone cleared. Does NOT mutate the original.
 *
 * @param grid Current grid
 * @param slot Zone slot to clear (1-based, 1-7)
 * @returns New grid with the zone cleared, or null if slot is invalid or empty
 */
export function clearZoneFromGrid(
	grid: Uint8Array,
	slot: number,
): Uint8Array | null {
	if (slot < 1 || slot > MAX_ZONES) return null;

	const newGrid = new Uint8Array(grid);
	let changed = false;
	for (let i = 0; i < GRID_CELL_COUNT; i++) {
		if (cellZone(newGrid[i]) === slot) {
			newGrid[i] = cellSetZone(newGrid[i], 0);
			changed = true;
		}
	}
	return changed ? newGrid : new Uint8Array(grid);
}

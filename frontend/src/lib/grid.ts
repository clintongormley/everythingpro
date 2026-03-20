// Bit 0: room (0=outside, 1=inside)
// Bits 1-3: zone (0=room default, 1-7=named zone)
// Bits 4-7: per-cell training (reserved)
export const CELL_ROOM_BIT = 0x01;
export const CELL_ZONE_MASK = 0x0e; // bits 1-3
export const CELL_ZONE_SHIFT = 1;
export const MAX_ZONES = 7;

export const GRID_COLS = 20;
export const GRID_ROWS = 20;
export const GRID_CELL_COUNT = GRID_COLS * GRID_ROWS;
export const GRID_CELL_MM = 300; // each cell represents 300mm x 300mm
export const MAX_RANGE = 6000;

export const cellIsInside = (v: number): boolean => (v & CELL_ROOM_BIT) !== 0;
export const cellZone = (v: number): number => (v >> CELL_ZONE_SHIFT) & 0x07;
export const cellSetInside = (v: number, inside: boolean): number =>
	inside ? v | CELL_ROOM_BIT : v & ~CELL_ROOM_BIT;
export const cellSetZone = (v: number, zone: number): number =>
	(v & ~CELL_ZONE_MASK) | ((zone & 0x07) << CELL_ZONE_SHIFT);

/** Get room bounds with 1-cell padding around inside cells. */
export function getRoomBounds(grid: Uint8Array): {
	minCol: number;
	maxCol: number;
	minRow: number;
	maxRow: number;
} {
	let minCol = GRID_COLS;
	let maxCol = 0;
	let minRow = GRID_ROWS;
	let maxRow = 0;
	for (let i = 0; i < GRID_CELL_COUNT; i++) {
		if (cellIsInside(grid[i])) {
			const col = i % GRID_COLS;
			const row = Math.floor(i / GRID_COLS);
			if (col < minCol) minCol = col;
			if (col > maxCol) maxCol = col;
			if (row < minRow) minRow = row;
			if (row > maxRow) maxRow = row;
		}
	}
	// Add 1-cell padding
	return {
		minCol: Math.max(0, minCol - 1),
		maxCol: Math.min(GRID_COLS - 1, maxCol + 1),
		minRow: Math.max(0, minRow - 1),
		maxRow: Math.min(GRID_ROWS - 1, maxRow + 1),
	};
}

/** Get raw room bounds without padding (only actual inside cells). */
export function getRawRoomBounds(grid: Uint8Array): {
	minCol: number;
	maxCol: number;
	minRow: number;
	maxRow: number;
} {
	let minCol = GRID_COLS;
	let maxCol = 0;
	let minRow = GRID_ROWS;
	let maxRow = 0;
	for (let i = 0; i < GRID_CELL_COUNT; i++) {
		if (cellIsInside(grid[i])) {
			const col = i % GRID_COLS;
			const row = Math.floor(i / GRID_COLS);
			if (col < minCol) minCol = col;
			if (col > maxCol) maxCol = col;
			if (row < minRow) minRow = row;
			if (row > maxRow) maxRow = row;
		}
	}
	return { minCol, maxCol, minRow, maxRow };
}

/** Initialize a grid from room dimensions (mm). Room is centered horizontally. */
export function initGridFromRoom(
	roomWidth: number,
	roomDepth: number,
): Uint8Array {
	const grid = new Uint8Array(GRID_CELL_COUNT);

	const roomCols = Math.ceil(roomWidth / GRID_CELL_MM);
	const roomRows = Math.ceil(roomDepth / GRID_CELL_MM);
	const startCol = Math.floor((GRID_COLS - roomCols) / 2);
	const startRow = 0; // sensor is at front wall

	for (let r = 0; r < GRID_ROWS; r++) {
		for (let c = 0; c < GRID_COLS; c++) {
			const idx = r * GRID_COLS + c;
			const inRoom =
				c >= startCol &&
				c < startCol + roomCols &&
				r >= startRow &&
				r < startRow + roomRows;

			if (inRoom) {
				grid[idx] = CELL_ROOM_BIT; // inside room, zone 0
			}
		}
	}

	return grid;
}

/** Derive room dimensions (mm) from the grid's raw bounds. */
export function updateRoomDimensionsFromGrid(grid: Uint8Array): {
	roomWidth: number;
	roomDepth: number;
} {
	const raw = getRawRoomBounds(grid);
	if (raw.minCol > raw.maxCol) {
		return { roomWidth: 0, roomDepth: 0 };
	}
	return {
		roomWidth: (raw.maxCol - raw.minCol + 1) * GRID_CELL_MM,
		roomDepth: (raw.maxRow - raw.minRow + 1) * GRID_CELL_MM,
	};
}

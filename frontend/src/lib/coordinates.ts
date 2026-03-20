import { GRID_CELL_MM, GRID_COLS, MAX_RANGE } from "./grid.js";

/**
 * Map a target to percentage coordinates for the editor grid.
 * Uses the backend's already-transformed x/y (perspective applied server-side).
 */
export function mapTargetToPercent(
	targetX: number,
	targetY: number,
	roomWidth: number,
	roomDepth: number,
): { x: number; y: number } {
	if (roomWidth > 0 && roomDepth > 0) {
		const rx = Math.max(0, Math.min(targetX, roomWidth));
		const ry = Math.max(0, Math.min(targetY, roomDepth));
		return {
			x: (rx / roomWidth) * 100,
			y: (ry / roomDepth) * 100,
		};
	}
	return {
		x: (targetX / MAX_RANGE) * 100,
		y: (targetY / MAX_RANGE) * 100,
	};
}

/**
 * Map a target to a fractional grid cell position (col, row).
 * Returns null if room dimensions are invalid.
 */
export function mapTargetToGridCell(
	targetX: number,
	targetY: number,
	roomWidth: number,
	roomDepth: number,
): { col: number; row: number } | null {
	if (roomWidth <= 0 || roomDepth <= 0) return null;

	// Room is centered horizontally in the grid
	const roomCols = Math.ceil(roomWidth / GRID_CELL_MM);
	const startCol = Math.floor((GRID_COLS - roomCols) / 2);

	// target x/y are room-space mm (perspective applied server-side)
	const col = startCol + targetX / GRID_CELL_MM;
	const row = targetY / GRID_CELL_MM;

	return { col, row };
}

// FOV geometry constants (120-degree wedge)
const FOV_X_EXTENT = MAX_RANGE * Math.sin(Math.PI / 3); // ~5196

/** Map raw sensor coords to percentage in the FOV view (marking step). */
export function rawToFovPct(
	rawX: number,
	rawY: number,
): { xPct: number; yPct: number } {
	const halfW = FOV_X_EXTENT;
	return {
		xPct: ((rawX + halfW) / (halfW * 2)) * 100,
		yPct: (rawY / MAX_RANGE) * 100,
	};
}

export interface SmoothBufferEntry {
	x: number;
	y: number;
	t: number;
}

/**
 * 1-second rolling median smoother for raw readings during marking.
 * Returns the smoothed x/y and the updated buffer (immutable style).
 */
export function getSmoothedValue(
	buffer: SmoothBufferEntry[],
	newX: number,
	newY: number,
	now: number,
): { x: number; y: number; buffer: SmoothBufferEntry[] } {
	const updated = [...buffer, { x: newX, y: newY, t: now }];

	// Prune readings older than 1 second
	let start = 0;
	while (start < updated.length && now - updated[start].t > 1000) {
		start++;
	}
	const pruned = updated.slice(start);

	if (pruned.length === 0) {
		return { x: newX, y: newY, buffer: pruned };
	}

	const medianOf = (arr: number[]): number => {
		const sorted = arr.slice().sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2
			? sorted[mid]
			: (sorted[mid - 1] + sorted[mid]) / 2;
	};

	return {
		x: medianOf(pruned.map((s) => s.x)),
		y: medianOf(pruned.map((s) => s.y)),
		buffer: pruned,
	};
}

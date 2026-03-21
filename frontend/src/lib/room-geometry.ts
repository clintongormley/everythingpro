import {
	cellIsInside,
	GRID_CELL_COUNT,
	GRID_CELL_MM,
	GRID_COLS,
	GRID_ROWS,
	getRawRoomBounds,
} from "./grid.js";
import { applyPerspective } from "./perspective.js";

/**
 * Sensor FOV geometry in room-space.
 * sensorPos: the sensor's position (mm) in room-space.
 * dirX, dirY: unit vector in room-space pointing "ahead" from sensor.
 */
export interface SensorFov {
	sensorPos: { x: number; y: number };
	dirX: number;
	dirY: number;
}

/**
 * Compute sensor FOV geometry (position + look-direction) in room-space
 * from a perspective transform.
 *
 * The sensor sits at sensor-space origin (0,0). The "ahead" direction is
 * (0, 1000) in sensor-space. We transform both through the perspective to
 * get the room-space position and direction.
 */
export function computeSensorFov(perspective: number[]): SensorFov {
	const origin = applyPerspective(perspective, 0, 0);
	const ahead = applyPerspective(perspective, 0, 1000);
	const dx = ahead.x - origin.x;
	const dy = ahead.y - origin.y;
	const len = Math.sqrt(dx * dx + dy * dy);
	return { sensorPos: origin, dirX: dx / len, dirY: dy / len };
}

/**
 * Get the sensor position in room-space mm by transforming sensor origin (0,0).
 * Returns null if no perspective is provided.
 */
export function getSensorRoomPosition(
	perspective: number[] | null,
): { x: number; y: number } | null {
	if (!perspective) return null;
	return applyPerspective(perspective, 0, 0);
}

/**
 * Check if a grid cell (col, row) is within the sensor's FOV and range.
 *
 * @param col Grid column index
 * @param row Grid row index
 * @param fov Sensor FOV geometry (null = no calibration, allow all)
 * @param roomWidth Room width in mm
 * @param maxRangeMm Maximum detection range in mm
 * @returns true if the cell is within the sensor's FOV and range
 */
export function isCellInSensorRange(
	col: number,
	row: number,
	fov: SensorFov | null,
	roomWidth: number,
	maxRangeMm: number,
): boolean {
	if (!fov) return true; // no calibration — allow all

	// Cell centre in room-space mm
	const roomCols = Math.ceil(roomWidth / GRID_CELL_MM);
	const startCol = Math.floor((GRID_COLS - roomCols) / 2);
	const rx = (col - startCol + 0.5) * GRID_CELL_MM;
	const ry = (row + 0.5) * GRID_CELL_MM;

	// Vector from sensor to cell in room-space
	const dx = rx - fov.sensorPos.x;
	const dy = ry - fov.sensorPos.y;
	const dist = Math.sqrt(dx * dx + dy * dy);
	if (dist < 1) return true; // at sensor position

	// Angle between sensor direction and cell direction (both in room-space)
	const dot = (dx / dist) * fov.dirX + (dy / dist) * fov.dirY;
	const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
	if (angle > Math.PI / 3) return false; // 120° FOV = 60° half-angle

	// Distance check
	if (dist > maxRangeMm) return false;

	return true;
}

/**
 * Compute the effective maximum range in mm, given the current settings.
 *
 * When auto-range is enabled, uses the auto-computed range (capped at 6m).
 * Otherwise uses the manual distance.
 *
 * @param targetAutoRange Whether auto-range is enabled
 * @param autoRange Auto-computed range in metres (0 = fallback to 6m)
 * @param targetMaxDistance Manual max distance in metres
 * @returns Max range in mm
 */
export function computeMaxRangeMm(
	targetAutoRange: boolean,
	autoRange: number,
	targetMaxDistance: number,
): number {
	return (
		(targetAutoRange
			? autoRange > 0
				? Math.min(autoRange, 6)
				: 6
			: targetMaxDistance) * 1000
	);
}

/**
 * Auto-compute the detection range (in metres, rounded up to nearest 0.5m)
 * based on the furthest room cell from the sensor.
 *
 * @param roomWidth Room width in mm
 * @param roomDepth Room depth in mm
 * @param perspective Perspective coefficients (null = no calibration)
 * @param grid The grid array
 * @returns Range in metres (rounded up to nearest 0.5m), or 0 if room dimensions are invalid
 */
export function autoDetectionRange(
	roomWidth: number,
	roomDepth: number,
	perspective: number[] | null,
	grid: Uint8Array,
): number {
	if (roomWidth <= 0 || roomDepth <= 0) return 0;

	// Compute max room-space distance from sensor to any room cell
	const sensorPos = getSensorRoomPosition(perspective);
	if (sensorPos) {
		const roomCols = Math.ceil(roomWidth / GRID_CELL_MM);
		const startCol = Math.floor((GRID_COLS - roomCols) / 2);
		let maxDistMm = 0;
		const raw = getRawRoomBounds(grid);
		for (let r = raw.minRow; r <= raw.maxRow; r++) {
			for (let c = raw.minCol; c <= raw.maxCol; c++) {
				const idx = r * GRID_COLS + c;
				if (!cellIsInside(grid[idx])) continue;
				const rx = (c - startCol + 0.5) * GRID_CELL_MM;
				const ry = (r + 0.5) * GRID_CELL_MM;
				const dx = rx - sensorPos.x;
				const dy = ry - sensorPos.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist > maxDistMm) maxDistMm = dist;
			}
		}
		if (maxDistMm > 0) {
			const m = maxDistMm / 1000;
			return Math.ceil(m * 2) / 2; // round up to nearest 0.5m
		}
	}

	// Fallback: use room dimensions
	const maxMm = Math.max(roomWidth, roomDepth);
	const m = maxMm / 1000;
	return Math.ceil(m * 2) / 2;
}

/**
 * Compute room dimensions from wizard corner measurements.
 *
 * Width = distance between corners 0 and 1.
 * Depth = average of distance(corner 0, corner 3) and distance(corner 1, corner 2).
 *
 * @param corners Array of 4 corner points with raw_x, raw_y coordinates
 * @returns { width, depth } in integer mm
 */
export function autoComputeRoomDimensions(
	corners: { raw_x: number; raw_y: number }[],
): { width: number; depth: number } {
	const dist = (
		a: { raw_x: number; raw_y: number },
		b: { raw_x: number; raw_y: number },
	): number => Math.sqrt((a.raw_x - b.raw_x) ** 2 + (a.raw_y - b.raw_y) ** 2);

	const width = Math.round(dist(corners[0], corners[1]));
	const depthLeft = dist(corners[0], corners[3]);
	const depthRight = dist(corners[1], corners[2]);
	const depth = Math.round((depthLeft + depthRight) / 2);

	return { width, depth };
}

/**
 * Compute the median of an array of numbers.
 * For even-length arrays, returns the average of the two middle values.
 *
 * @param values Array of numbers (will be sorted internally)
 * @returns The median value, or 0 for empty arrays
 */
export function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute median x/y from a set of sample points.
 * Used in the wizard capture flow to get a stable position from noisy readings.
 *
 * @param samples Array of {x, y} points
 * @returns { x, y } median position, or null if no samples
 */
export function medianPoint(
	samples: { x: number; y: number }[],
): { x: number; y: number } | null {
	if (samples.length === 0) return null;
	return {
		x: median(samples.map((s) => s.x)),
		y: median(samples.map((s) => s.y)),
	};
}

/**
 * Compute room dimensions and furthest point from sensor based on grid.
 *
 * @param grid The grid array
 * @param roomWidth Room width in mm
 * @param perspective Perspective coefficients (null = no calibration)
 * @returns { widthM, depthM, furthestM } as formatted strings with 1 decimal place,
 *          or null if grid has no inside cells
 */
export function getGridRoomMetrics(
	grid: Uint8Array,
	roomWidth: number,
	perspective: number[] | null,
): { widthM: string; depthM: string; furthestM: string } | null {
	const raw = getRawRoomBounds(grid);
	if (raw.minCol > raw.maxCol) return null;

	const widthCells = raw.maxCol - raw.minCol + 1;
	const depthCells = raw.maxRow - raw.minRow + 1;
	const widthMm = widthCells * GRID_CELL_MM;
	const depthMm = depthCells * GRID_CELL_MM;

	// Sensor position in room-space, or fallback to top-centre of room
	const sensorPos = getSensorRoomPosition(perspective);
	const roomCols = Math.ceil(roomWidth / GRID_CELL_MM);
	const startCol = Math.floor((GRID_COLS - roomCols) / 2);
	const sensorMmX = sensorPos ? sensorPos.x : widthMm / 2;
	const sensorMmY = sensorPos ? sensorPos.y : 0;

	// Find furthest inside cell from sensor
	let maxDistSq = 0;
	for (let i = 0; i < GRID_CELL_COUNT; i++) {
		if (!cellIsInside(grid[i])) continue;
		const col = i % GRID_COLS;
		const row = Math.floor(i / GRID_COLS);
		const cellMmX = (col - startCol + 0.5) * GRID_CELL_MM;
		const cellMmY = (row + 0.5) * GRID_CELL_MM;
		const dx = cellMmX - sensorMmX;
		const dy = cellMmY - sensorMmY;
		const distSq = dx * dx + dy * dy;
		if (distSq > maxDistSq) maxDistSq = distSq;
	}

	return {
		widthM: (widthMm / 1000).toFixed(1),
		depthM: (depthMm / 1000).toFixed(1),
		furthestM: (Math.sqrt(maxDistSq) / 1000).toFixed(1),
	};
}

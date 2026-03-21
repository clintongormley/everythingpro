import { describe, expect, it } from "vitest";
import {
	CELL_ROOM_BIT,
	GRID_CELL_COUNT,
	GRID_CELL_MM,
	GRID_COLS,
	initGridFromRoom,
} from "../grid.js";
import { solvePerspective } from "../perspective.js";
import {
	autoComputeRoomDimensions,
	autoDetectionRange,
	computeMaxRangeMm,
	computeSensorFov,
	getGridRoomMetrics,
	getSensorRoomPosition,
	isCellInSensorRange,
	median,
	medianPoint,
	type SensorFov,
} from "../room-geometry.js";

// Helper: create a simple identity-like perspective where sensor-space ≈ room-space
function makeSimplePerspective(): number[] {
	// Map sensor corners to room corners (identity-like)
	const src = [
		{ x: -1000, y: 0 },
		{ x: 1000, y: 0 },
		{ x: 1000, y: 3000 },
		{ x: -1000, y: 3000 },
	];
	const dst = [
		{ x: 0, y: 0 },
		{ x: 2000, y: 0 },
		{ x: 2000, y: 3000 },
		{ x: 0, y: 3000 },
	];
	return solvePerspective(src, dst)!;
}

describe("computeSensorFov", () => {
	it("returns sensor position and direction from perspective", () => {
		const p = makeSimplePerspective();
		const fov = computeSensorFov(p);
		expect(fov.sensorPos).toBeDefined();
		expect(typeof fov.sensorPos.x).toBe("number");
		expect(typeof fov.sensorPos.y).toBe("number");
		expect(typeof fov.dirX).toBe("number");
		expect(typeof fov.dirY).toBe("number");
	});

	it("direction vector is normalized", () => {
		const p = makeSimplePerspective();
		const fov = computeSensorFov(p);
		const len = Math.sqrt(fov.dirX * fov.dirX + fov.dirY * fov.dirY);
		expect(len).toBeCloseTo(1, 6);
	});

	it("sensor looks roughly forward (positive Y in room-space)", () => {
		const p = makeSimplePerspective();
		const fov = computeSensorFov(p);
		// Y direction should be positive (forward into room)
		expect(fov.dirY).toBeGreaterThan(0);
	});
});

describe("getSensorRoomPosition", () => {
	it("returns null if perspective is null", () => {
		expect(getSensorRoomPosition(null)).toBeNull();
	});

	it("returns a position when perspective is provided", () => {
		const p = makeSimplePerspective();
		const pos = getSensorRoomPosition(p);
		expect(pos).not.toBeNull();
		expect(typeof pos!.x).toBe("number");
		expect(typeof pos!.y).toBe("number");
	});

	it("sensor position matches the origin transform", () => {
		const p = makeSimplePerspective();
		const pos = getSensorRoomPosition(p);
		const fov = computeSensorFov(p);
		expect(pos!.x).toBeCloseTo(fov.sensorPos.x, 6);
		expect(pos!.y).toBeCloseTo(fov.sensorPos.y, 6);
	});
});

describe("isCellInSensorRange", () => {
	it("returns true when fov is null (no calibration)", () => {
		expect(isCellInSensorRange(5, 5, null, 3000, 6000)).toBe(true);
	});

	it("returns true for cell at sensor position", () => {
		const p = makeSimplePerspective();
		const fov = computeSensorFov(p);
		// Place cell near sensor position
		const roomCols = Math.ceil(3000 / GRID_CELL_MM);
		const startCol = Math.floor((GRID_COLS - roomCols) / 2);
		// Find the col/row closest to sensor position
		const col = Math.floor(fov.sensorPos.x / GRID_CELL_MM) + startCol;
		const row = Math.floor(fov.sensorPos.y / GRID_CELL_MM);
		expect(isCellInSensorRange(col, row, fov, 3000, 6000)).toBe(true);
	});

	it("returns false for cell beyond max range", () => {
		const fov: SensorFov = {
			sensorPos: { x: 1500, y: 0 },
			dirX: 0,
			dirY: 1, // looking straight ahead
		};
		// Cell very far away (row=19, with cell_mm=300 → y = 19.5*300 = 5850)
		expect(isCellInSensorRange(10, 19, fov, 3000, 1000)).toBe(false);
	});

	it("returns false for cell outside FOV angle", () => {
		const fov: SensorFov = {
			sensorPos: { x: 1500, y: 0 },
			dirX: 0,
			dirY: 1, // looking straight ahead
		};
		// Cell far to the side — col 0, row 1 → the angle should be > 60°
		// roomWidth=3000 → roomCols=10, startCol=5
		// Cell centre: (0-5+0.5)*300 = -1350, (1+0.5)*300 = 450
		// Vector from sensor: (-1350-1500, 450-0) = (-2850, 450)
		// Angle from (0,1): acos(450/sqrt(2850^2+450^2)) ≈ acos(0.156) ≈ 81° > 60°
		expect(isCellInSensorRange(0, 1, fov, 3000, 6000)).toBe(false);
	});

	it("returns true for cell within FOV angle and range", () => {
		const fov: SensorFov = {
			sensorPos: { x: 1500, y: 0 },
			dirX: 0,
			dirY: 1, // looking straight ahead
		};
		// Cell directly ahead — col 10, row 5
		// roomWidth=3000 → roomCols=10, startCol=5
		// Cell centre: (10-5+0.5)*300 = 1650, (5+0.5)*300 = 1650
		// Vector from sensor: (1650-1500, 1650-0) = (150, 1650)
		// Angle from (0,1): acos(1650/sqrt(150^2+1650^2)) ≈ acos(0.996) ≈ 5° < 60°
		expect(isCellInSensorRange(10, 5, fov, 3000, 6000)).toBe(true);
	});

	it("returns true when cell is very close to sensor (dist < 1)", () => {
		const fov: SensorFov = {
			sensorPos: { x: 1650, y: 150 }, // Near centre of cell (10, 0) with startCol=5
			dirX: 0,
			dirY: 1,
		};
		// roomWidth=3000 → roomCols=10, startCol=5
		// Cell (10, 0) centre: (10-5+0.5)*300=1650, (0+0.5)*300=150
		expect(isCellInSensorRange(10, 0, fov, 3000, 6000)).toBe(true);
	});
});

describe("computeMaxRangeMm", () => {
	it("uses autoRange when enabled and > 0", () => {
		expect(computeMaxRangeMm(true, 4.5, 6.0)).toBe(4500);
	});

	it("caps autoRange at 6m", () => {
		expect(computeMaxRangeMm(true, 8.0, 3.0)).toBe(6000);
	});

	it("falls back to 6m when autoRange is 0", () => {
		expect(computeMaxRangeMm(true, 0, 3.0)).toBe(6000);
	});

	it("uses manual distance when auto-range is disabled", () => {
		expect(computeMaxRangeMm(false, 4.5, 3.0)).toBe(3000);
	});

	it("uses manual distance when auto-range is disabled, regardless of autoRange value", () => {
		expect(computeMaxRangeMm(false, 0, 5.0)).toBe(5000);
	});
});

describe("autoDetectionRange", () => {
	it("returns 0 when roomWidth <= 0", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		expect(autoDetectionRange(0, 3000, null, grid)).toBe(0);
	});

	it("returns 0 when roomDepth <= 0", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		expect(autoDetectionRange(3000, 0, null, grid)).toBe(0);
	});

	it("falls back to room dimensions when no perspective", () => {
		const grid = initGridFromRoom(3000, 4500);
		const range = autoDetectionRange(3000, 4500, null, grid);
		// Fallback: max(3000, 4500)/1000 = 4.5, ceil(4.5*2)/2 = 4.5
		expect(range).toBe(4.5);
	});

	it("uses perspective sensor position when available", () => {
		const grid = initGridFromRoom(3000, 3000);
		const p = makeSimplePerspective();
		const range = autoDetectionRange(3000, 3000, p, grid);
		expect(range).toBeGreaterThan(0);
		// Should be rounded up to nearest 0.5m
		expect(range * 2).toBe(Math.ceil(range * 2));
	});

	it("rounds up to nearest 0.5m", () => {
		// 6000mm room → max dimension = 6000mm = 6.0m → ceil(6*2)/2 = 6.0
		const grid = initGridFromRoom(6000, 3000);
		const range = autoDetectionRange(6000, 3000, null, grid);
		expect(range).toBe(6.0);
	});

	it("handles small rooms", () => {
		const grid = initGridFromRoom(600, 600);
		const range = autoDetectionRange(600, 600, null, grid);
		// 600mm = 0.6m → ceil(0.6*2)/2 = ceil(1.2)/2 = 1.0
		expect(range).toBe(1.0);
	});
});

describe("autoComputeRoomDimensions", () => {
	it("computes width from corners 0 and 1", () => {
		const corners = [
			{ raw_x: 0, raw_y: 0 },
			{ raw_x: 3000, raw_y: 0 },
			{ raw_x: 3000, raw_y: 4000 },
			{ raw_x: 0, raw_y: 4000 },
		];
		const result = autoComputeRoomDimensions(corners);
		expect(result.width).toBe(3000);
	});

	it("computes depth as average of left and right side distances", () => {
		const corners = [
			{ raw_x: 0, raw_y: 0 },
			{ raw_x: 3000, raw_y: 0 },
			{ raw_x: 3000, raw_y: 4000 },
			{ raw_x: 0, raw_y: 4000 },
		];
		const result = autoComputeRoomDimensions(corners);
		expect(result.depth).toBe(4000);
	});

	it("handles trapezoidal corners (different depths)", () => {
		const corners = [
			{ raw_x: 0, raw_y: 0 },
			{ raw_x: 3000, raw_y: 0 },
			{ raw_x: 3000, raw_y: 5000 },
			{ raw_x: 0, raw_y: 3000 },
		];
		const result = autoComputeRoomDimensions(corners);
		expect(result.width).toBe(3000);
		// Left depth: dist(0,0)→(0,3000) = 3000; Right depth: dist(3000,0)→(3000,5000) = 5000
		// Average = 4000
		expect(result.depth).toBe(4000);
	});

	it("rounds results to nearest integer", () => {
		const corners = [
			{ raw_x: 0, raw_y: 0 },
			{ raw_x: 100, raw_y: 100 }, // diagonal, width = sqrt(20000) ≈ 141.42
			{ raw_x: 200, raw_y: 200 },
			{ raw_x: 100, raw_y: 100 },
		];
		const result = autoComputeRoomDimensions(corners);
		expect(result.width).toBe(Math.round(Math.sqrt(20000)));
	});

	it("works with diagonal corners", () => {
		const corners = [
			{ raw_x: 0, raw_y: 0 },
			{ raw_x: 300, raw_y: 400 }, // distance = 500
			{ raw_x: 600, raw_y: 800 },
			{ raw_x: 300, raw_y: 400 },
		];
		const result = autoComputeRoomDimensions(corners);
		expect(result.width).toBe(500);
	});
});

describe("median", () => {
	it("returns 0 for empty array", () => {
		expect(median([])).toBe(0);
	});

	it("returns single value for single-element array", () => {
		expect(median([42])).toBe(42);
	});

	it("returns middle value for odd-length array", () => {
		expect(median([1, 3, 5])).toBe(3);
	});

	it("returns average of middle two for even-length array", () => {
		expect(median([1, 3, 5, 7])).toBe(4);
	});

	it("handles unsorted input", () => {
		expect(median([5, 1, 3])).toBe(3);
	});

	it("does not mutate the original array", () => {
		const arr = [5, 1, 3];
		median(arr);
		expect(arr).toEqual([5, 1, 3]);
	});

	it("handles duplicate values", () => {
		expect(median([2, 2, 2])).toBe(2);
	});

	it("handles negative values", () => {
		expect(median([-5, -1, -3])).toBe(-3);
	});

	it("handles two-element array", () => {
		expect(median([10, 20])).toBe(15);
	});
});

describe("medianPoint", () => {
	it("returns null for empty array", () => {
		expect(medianPoint([])).toBeNull();
	});

	it("returns the point for single sample", () => {
		const result = medianPoint([{ x: 10, y: 20 }]);
		expect(result).toEqual({ x: 10, y: 20 });
	});

	it("computes median x and y independently", () => {
		const samples = [
			{ x: 1, y: 100 },
			{ x: 3, y: 300 },
			{ x: 2, y: 200 },
		];
		const result = medianPoint(samples);
		expect(result).toEqual({ x: 2, y: 200 });
	});

	it("handles even number of samples", () => {
		const samples = [
			{ x: 1, y: 10 },
			{ x: 3, y: 30 },
			{ x: 5, y: 50 },
			{ x: 7, y: 70 },
		];
		const result = medianPoint(samples);
		expect(result).toEqual({ x: 4, y: 40 });
	});
});

describe("getGridRoomMetrics", () => {
	it("returns null for empty grid", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		expect(getGridRoomMetrics(grid, 3000, null)).toBeNull();
	});

	it("returns formatted width and depth", () => {
		// 3000mm x 1500mm = 10 cols x 5 rows
		const grid = initGridFromRoom(3000, 1500);
		const result = getGridRoomMetrics(grid, 3000, null);
		expect(result).not.toBeNull();
		expect(result!.widthM).toBe("3.0");
		expect(result!.depthM).toBe("1.5");
	});

	it("computes furthest distance without perspective", () => {
		const grid = initGridFromRoom(3000, 3000);
		const result = getGridRoomMetrics(grid, 3000, null);
		expect(result).not.toBeNull();
		// Without perspective, sensor defaults to top-centre
		// Furthest cell should be in a far corner
		expect(parseFloat(result!.furthestM)).toBeGreaterThan(0);
	});

	it("computes furthest distance with perspective", () => {
		const grid = initGridFromRoom(3000, 3000);
		const p = makeSimplePerspective();
		const result = getGridRoomMetrics(grid, 3000, p);
		expect(result).not.toBeNull();
		expect(parseFloat(result!.furthestM)).toBeGreaterThan(0);
	});

	it("formats values with one decimal place", () => {
		const grid = initGridFromRoom(1800, 900);
		const result = getGridRoomMetrics(grid, 1800, null);
		expect(result).not.toBeNull();
		// 1800mm = 6 cols = 1800mm, 900mm = 3 rows = 900mm
		expect(result!.widthM).toBe("1.8");
		expect(result!.depthM).toBe("0.9");
		expect(result!.furthestM).toMatch(/^\d+\.\d$/);
	});
});

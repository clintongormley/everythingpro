import { describe, expect, it } from "vitest";
import {
	CELL_ROOM_BIT,
	cellIsInside,
	cellSetInside,
	cellSetZone,
	cellZone,
	GRID_CELL_COUNT,
	GRID_CELL_MM,
	GRID_COLS,
	GRID_ROWS,
	getRawRoomBounds,
	getRoomBounds,
	initGridFromRoom,
	MAX_ZONES,
	updateRoomDimensionsFromGrid,
} from "../grid.js";

describe("cellIsInside", () => {
	it("returns true when room bit is set", () => {
		expect(cellIsInside(0x01)).toBe(true);
		expect(cellIsInside(0x0f)).toBe(true);
	});

	it("returns false when room bit is clear", () => {
		expect(cellIsInside(0x00)).toBe(false);
		expect(cellIsInside(0x0e)).toBe(false);
	});
});

describe("cellZone", () => {
	it("extracts zone 0 from a plain inside cell", () => {
		expect(cellZone(CELL_ROOM_BIT)).toBe(0);
	});

	it("extracts correct zone 1-7", () => {
		for (let z = 0; z <= 7; z++) {
			const val = (z << 1) | CELL_ROOM_BIT;
			expect(cellZone(val)).toBe(z);
		}
	});

	it("ignores the room bit", () => {
		// zone 3, room bit clear
		const val = 3 << 1;
		expect(cellZone(val)).toBe(3);
	});
});

describe("cellSetInside", () => {
	it("sets room bit while preserving zone", () => {
		const val = cellSetZone(0, 5);
		const result = cellSetInside(val, true);
		expect(cellIsInside(result)).toBe(true);
		expect(cellZone(result)).toBe(5);
	});

	it("clears room bit while preserving zone", () => {
		const val = cellSetZone(CELL_ROOM_BIT, 3);
		const result = cellSetInside(val, false);
		expect(cellIsInside(result)).toBe(false);
		expect(cellZone(result)).toBe(3);
	});

	it("round-trips with cellIsInside", () => {
		const val = 0x00;
		expect(cellIsInside(cellSetInside(val, true))).toBe(true);
		expect(cellIsInside(cellSetInside(val, false))).toBe(false);
	});
});

describe("cellSetZone", () => {
	it("sets zone while preserving room bit", () => {
		const result = cellSetZone(CELL_ROOM_BIT, 4);
		expect(cellIsInside(result)).toBe(true);
		expect(cellZone(result)).toBe(4);
	});

	it("overwrites previous zone", () => {
		let val = cellSetZone(CELL_ROOM_BIT, 2);
		val = cellSetZone(val, 6);
		expect(cellZone(val)).toBe(6);
		expect(cellIsInside(val)).toBe(true);
	});

	it("clamps zone to 3 bits (0-7)", () => {
		const result = cellSetZone(0, 0xff);
		expect(cellZone(result)).toBe(7);
	});

	it("round-trips with cellZone", () => {
		for (let z = 0; z <= MAX_ZONES; z++) {
			expect(cellZone(cellSetZone(CELL_ROOM_BIT, z))).toBe(z);
		}
	});
});

describe("getRoomBounds", () => {
	it("returns padded bounds around inside cells", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		// Place a 3x2 room block starting at col=5, row=3
		for (let r = 3; r < 5; r++) {
			for (let c = 5; c < 8; c++) {
				grid[r * GRID_COLS + c] = CELL_ROOM_BIT;
			}
		}
		const bounds = getRoomBounds(grid);
		expect(bounds.minCol).toBe(4); // 5-1
		expect(bounds.maxCol).toBe(8); // 7+1
		expect(bounds.minRow).toBe(2); // 3-1
		expect(bounds.maxRow).toBe(5); // 4+1
	});

	it("clamps padding to grid edges", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		// Place cell at top-left corner (0,0)
		grid[0] = CELL_ROOM_BIT;
		const bounds = getRoomBounds(grid);
		expect(bounds.minCol).toBe(0);
		expect(bounds.minRow).toBe(0);
		expect(bounds.maxCol).toBe(1); // 0+1
		expect(bounds.maxRow).toBe(1); // 0+1
	});

	it("clamps padding at bottom-right corner", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		grid[(GRID_ROWS - 1) * GRID_COLS + (GRID_COLS - 1)] = CELL_ROOM_BIT;
		const bounds = getRoomBounds(grid);
		expect(bounds.maxCol).toBe(GRID_COLS - 1);
		expect(bounds.maxRow).toBe(GRID_ROWS - 1);
	});

	it("handles empty grid gracefully", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		const bounds = getRoomBounds(grid);
		// With no inside cells, minCol=GRID_COLS and maxCol=0 before padding
		// After padding: minCol = max(0, 20-1)=19, maxCol = min(19, 0+1)=1
		// This is the expected degenerate result for an empty grid
		expect(bounds.minCol).toBeGreaterThanOrEqual(0);
		expect(bounds.maxCol).toBeLessThan(GRID_COLS);
	});
});

describe("getRawRoomBounds", () => {
	it("returns exact bounds without padding", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		for (let r = 3; r < 5; r++) {
			for (let c = 5; c < 8; c++) {
				grid[r * GRID_COLS + c] = CELL_ROOM_BIT;
			}
		}
		const bounds = getRawRoomBounds(grid);
		expect(bounds.minCol).toBe(5);
		expect(bounds.maxCol).toBe(7);
		expect(bounds.minRow).toBe(3);
		expect(bounds.maxRow).toBe(4);
	});

	it("returns inverted bounds for empty grid (minCol > maxCol)", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		const bounds = getRawRoomBounds(grid);
		expect(bounds.minCol).toBeGreaterThan(bounds.maxCol);
	});
});

describe("initGridFromRoom", () => {
	it("creates grid with correct number of inside cells", () => {
		// 3000mm x 1500mm = 10 cols x 5 rows = 50 cells
		const grid = initGridFromRoom(3000, 1500);
		let count = 0;
		for (let i = 0; i < GRID_CELL_COUNT; i++) {
			if (cellIsInside(grid[i])) count++;
		}
		expect(count).toBe(50);
	});

	it("centers the room horizontally", () => {
		// 1800mm = 6 cols, centered in 20-col grid → starts at col 7
		const grid = initGridFromRoom(1800, 600);
		const bounds = getRawRoomBounds(grid);
		expect(bounds.minCol).toBe(7);
		expect(bounds.maxCol).toBe(12);
		expect(bounds.minRow).toBe(0);
		expect(bounds.maxRow).toBe(1);
	});

	it("starts room at row 0 (sensor at front wall)", () => {
		const grid = initGridFromRoom(6000, 6000);
		const bounds = getRawRoomBounds(grid);
		expect(bounds.minRow).toBe(0);
	});

	it("returns all-outside grid for zero dimensions", () => {
		const grid = initGridFromRoom(0, 0);
		let count = 0;
		for (let i = 0; i < GRID_CELL_COUNT; i++) {
			if (cellIsInside(grid[i])) count++;
		}
		expect(count).toBe(0);
	});

	it("has correct grid size", () => {
		const grid = initGridFromRoom(3000, 3000);
		expect(grid.length).toBe(GRID_CELL_COUNT);
	});
});

describe("updateRoomDimensionsFromGrid", () => {
	it("derives room dimensions from grid bounds", () => {
		const grid = initGridFromRoom(3000, 1500);
		const { roomWidth, roomDepth } = updateRoomDimensionsFromGrid(grid);
		expect(roomWidth).toBe(3000);
		expect(roomDepth).toBe(1500);
	});

	it("returns zero dimensions for empty grid", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		const { roomWidth, roomDepth } = updateRoomDimensionsFromGrid(grid);
		expect(roomWidth).toBe(0);
		expect(roomDepth).toBe(0);
	});

	it("accounts for non-rectangular room shapes", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		// L-shaped room: row 2 cols 3-6, row 3 cols 3-4
		for (let c = 3; c <= 6; c++) grid[2 * GRID_COLS + c] = CELL_ROOM_BIT;
		for (let c = 3; c <= 4; c++) grid[3 * GRID_COLS + c] = CELL_ROOM_BIT;
		const { roomWidth, roomDepth } = updateRoomDimensionsFromGrid(grid);
		// Bounding box: cols 3-6 (4 cells), rows 2-3 (2 cells)
		expect(roomWidth).toBe(4 * GRID_CELL_MM);
		expect(roomDepth).toBe(2 * GRID_CELL_MM);
	});
});

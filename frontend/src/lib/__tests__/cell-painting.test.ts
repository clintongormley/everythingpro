import { describe, expect, it } from "vitest";
import {
	applyPaintToCell,
	clearZoneFromGrid,
	determinePaintAction,
} from "../cell-painting.js";
import {
	CELL_ROOM_BIT,
	cellIsInside,
	cellSetZone,
	cellZone,
	GRID_CELL_COUNT,
	MAX_ZONES,
} from "../grid.js";

describe("determinePaintAction", () => {
	describe("boundary painting (activeZone === 0)", () => {
		it("returns 'clear' for plain room cell (inside, zone 0)", () => {
			expect(determinePaintAction(CELL_ROOM_BIT, 0)).toBe("clear");
		});

		it("returns 'set' for outside cell", () => {
			expect(determinePaintAction(0, 0)).toBe("set");
		});

		it("returns 'set' for cell with a zone assigned", () => {
			const cell = cellSetZone(CELL_ROOM_BIT, 3);
			expect(determinePaintAction(cell, 0)).toBe("set");
		});
	});

	describe("zone painting (activeZone > 0)", () => {
		it("returns 'clear' when cell already has this zone", () => {
			const cell = cellSetZone(CELL_ROOM_BIT, 2);
			expect(determinePaintAction(cell, 2)).toBe("clear");
		});

		it("returns 'set' when cell has a different zone", () => {
			const cell = cellSetZone(CELL_ROOM_BIT, 3);
			expect(determinePaintAction(cell, 2)).toBe("set");
		});

		it("returns 'set' when cell has no zone", () => {
			expect(determinePaintAction(CELL_ROOM_BIT, 1)).toBe("set");
		});

		it("returns 'set' for outside cell (zone 0)", () => {
			expect(determinePaintAction(0, 1)).toBe("set");
		});
	});
});

describe("applyPaintToCell", () => {
	describe("boundary painting (activeZone === 0)", () => {
		it("sets cell to CELL_ROOM_BIT when setting", () => {
			const result = applyPaintToCell(0, 0, "set");
			expect(result).toBe(CELL_ROOM_BIT);
		});

		it("sets cell to 0 when clearing", () => {
			const result = applyPaintToCell(CELL_ROOM_BIT, 0, "clear");
			expect(result).toBe(0);
		});

		it("clears a cell with zone data when clearing boundary", () => {
			const cell = cellSetZone(CELL_ROOM_BIT, 3);
			const result = applyPaintToCell(cell, 0, "clear");
			expect(result).toBe(0);
		});
	});

	describe("zone painting (activeZone > 0)", () => {
		it("sets zone on inside cell", () => {
			const result = applyPaintToCell(CELL_ROOM_BIT, 3, "set");
			expect(result).not.toBeNull();
			expect(cellZone(result!)).toBe(3);
			expect(cellIsInside(result!)).toBe(true);
		});

		it("clears zone back to 0 on inside cell", () => {
			const cell = cellSetZone(CELL_ROOM_BIT, 3);
			const result = applyPaintToCell(cell, 3, "clear");
			expect(result).not.toBeNull();
			expect(cellZone(result!)).toBe(0);
			expect(cellIsInside(result!)).toBe(true);
		});

		it("returns null for outside cell (cannot paint zone on outside)", () => {
			expect(applyPaintToCell(0, 2, "set")).toBeNull();
		});

		it("returns null for outside cell on clear action too", () => {
			expect(applyPaintToCell(0, 2, "clear")).toBeNull();
		});

		it("overwrites existing zone when setting a different one", () => {
			const cell = cellSetZone(CELL_ROOM_BIT, 2);
			const result = applyPaintToCell(cell, 5, "set");
			expect(result).not.toBeNull();
			expect(cellZone(result!)).toBe(5);
		});

		it("preserves room bit when setting zone", () => {
			const result = applyPaintToCell(CELL_ROOM_BIT, 1, "set");
			expect(cellIsInside(result!)).toBe(true);
		});

		it("preserves room bit when clearing zone", () => {
			const cell = cellSetZone(CELL_ROOM_BIT, 4);
			const result = applyPaintToCell(cell, 4, "clear");
			expect(cellIsInside(result!)).toBe(true);
		});
	});
});

describe("clearZoneFromGrid", () => {
	it("clears all cells of the specified zone", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		// Set some cells to zone 2
		grid[0] = cellSetZone(CELL_ROOM_BIT, 2);
		grid[5] = cellSetZone(CELL_ROOM_BIT, 2);
		grid[10] = cellSetZone(CELL_ROOM_BIT, 3); // different zone

		const result = clearZoneFromGrid(grid, 2);
		expect(result).not.toBeNull();
		expect(cellZone(result![0])).toBe(0);
		expect(cellZone(result![5])).toBe(0);
		expect(cellZone(result![10])).toBe(3); // untouched
	});

	it("preserves room bit when clearing zone", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		grid[0] = cellSetZone(CELL_ROOM_BIT, 2);

		const result = clearZoneFromGrid(grid, 2);
		expect(cellIsInside(result![0])).toBe(true);
	});

	it("does not mutate the original grid", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		grid[0] = cellSetZone(CELL_ROOM_BIT, 2);

		clearZoneFromGrid(grid, 2);
		expect(cellZone(grid[0])).toBe(2); // unchanged
	});

	it("returns null for slot < 1", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		expect(clearZoneFromGrid(grid, 0)).toBeNull();
	});

	it("returns null for slot > MAX_ZONES", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		expect(clearZoneFromGrid(grid, MAX_ZONES + 1)).toBeNull();
	});

	it("returns a new grid even when no cells have the zone", () => {
		const grid = new Uint8Array(GRID_CELL_COUNT);
		grid[0] = CELL_ROOM_BIT; // zone 0
		const result = clearZoneFromGrid(grid, 3);
		expect(result).not.toBeNull();
		expect(result).not.toBe(grid); // different reference
	});

	it("handles all valid zone slots", () => {
		for (let slot = 1; slot <= MAX_ZONES; slot++) {
			const grid = new Uint8Array(GRID_CELL_COUNT);
			grid[0] = cellSetZone(CELL_ROOM_BIT, slot);
			const result = clearZoneFromGrid(grid, slot);
			expect(result).not.toBeNull();
			expect(cellZone(result![0])).toBe(0);
		}
	});
});

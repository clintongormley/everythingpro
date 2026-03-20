import { beforeEach, describe, expect, it } from "vitest";
import type { EverythingPresenceProPanel } from "../everything-presence-pro-panel.js";
import "../everything-presence-pro-panel.js";
import {
	CELL_ROOM_BIT,
	cellIsInside,
	cellSetZone,
	cellZone,
	GRID_CELL_COUNT,
	GRID_CELL_MM,
	GRID_COLS,
} from "../lib/grid.js";

function createPanel(): EverythingPresenceProPanel {
	const el = document.createElement(
		"everything-presence-pro-panel",
	) as EverythingPresenceProPanel;
	el.hass = { callWS: async () => ({}) };
	const a = el as any;
	a._grid = new Uint8Array(GRID_CELL_COUNT);
	a._zoneConfigs = new Array(7).fill(null);
	a._activeZone = 0;
	a._dirty = false;
	a._loading = false;
	a._isPainting = false;
	a._sidebarTab = "zones";
	a._roomWidth = 0;
	a._roomDepth = 0;
	return el;
}

describe("boundary painting (activeZone=0)", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("mousedown on outside cell sets it to inside room", () => {
		const a = el as any;
		a._activeZone = 0;
		const cellIndex = 5 * GRID_COLS + 5; // row 5, col 5

		// Cell starts as outside (0)
		expect(cellIsInside(a._grid[cellIndex])).toBe(false);

		a._onCellMouseDown(cellIndex);

		expect(cellIsInside(a._grid[cellIndex])).toBe(true);
		expect(a._grid[cellIndex]).toBe(CELL_ROOM_BIT);
	});

	it("mousedown on plain inside cell clears it to outside", () => {
		const a = el as any;
		a._activeZone = 0;
		const cellIndex = 5 * GRID_COLS + 5;

		// Set cell as plain room (inside, zone 0)
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		a._grid[cellIndex] = CELL_ROOM_BIT;

		a._onCellMouseDown(cellIndex);

		expect(cellIsInside(a._grid[cellIndex])).toBe(false);
		expect(a._grid[cellIndex]).toBe(0);
	});

	it("sets _dirty = true after painting", () => {
		const a = el as any;
		a._activeZone = 0;
		expect(a._dirty).toBe(false);

		a._onCellMouseDown(5 * GRID_COLS + 5);
		expect(a._dirty).toBe(true);
	});

	it("updates _paintAction based on initial cell state", () => {
		const a = el as any;
		a._activeZone = 0;

		// Outside cell -> paintAction = "set"
		a._onCellMouseDown(0);
		expect(a._paintAction).toBe("set");

		// Reset: inside cell -> paintAction = "clear"
		a._isPainting = false;
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		a._grid[10] = CELL_ROOM_BIT;
		a._onCellMouseDown(10);
		expect(a._paintAction).toBe("clear");
	});

	it("sets _isPainting = true on mousedown", () => {
		const a = el as any;
		a._activeZone = 0;
		expect(a._isPainting).toBe(false);

		a._onCellMouseDown(0);
		expect(a._isPainting).toBe(true);
	});
});

describe("boundary clearing", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("direct _applyPaintToCell with clear action removes room bit", () => {
		const a = el as any;
		a._activeZone = 0;
		a._paintAction = "clear";

		const cellIndex = 5 * GRID_COLS + 5;
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		a._grid[cellIndex] = CELL_ROOM_BIT;

		a._applyPaintToCell(cellIndex);

		expect(a._grid[cellIndex]).toBe(0);
		expect(cellIsInside(a._grid[cellIndex])).toBe(false);
	});

	it("direct _applyPaintToCell with set action adds room bit", () => {
		const a = el as any;
		a._activeZone = 0;
		a._paintAction = "set";

		const cellIndex = 5 * GRID_COLS + 5;
		a._grid = new Uint8Array(GRID_CELL_COUNT);

		a._applyPaintToCell(cellIndex);

		expect(a._grid[cellIndex]).toBe(CELL_ROOM_BIT);
	});
});

describe("zone painting (activeZone=N on inside cell)", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("paints zone N on an inside-room cell", () => {
		const a = el as any;
		a._activeZone = 3;

		// Set up a grid with some inside cells
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		const cellIndex = 5 * GRID_COLS + 5;
		a._grid[cellIndex] = CELL_ROOM_BIT; // inside, zone 0

		a._onCellMouseDown(cellIndex);

		expect(cellZone(a._grid[cellIndex])).toBe(3);
		expect(cellIsInside(a._grid[cellIndex])).toBe(true);
	});

	it("clears zone to 0 when painting same zone on a cell that already has it", () => {
		const a = el as any;
		a._activeZone = 3;

		a._grid = new Uint8Array(GRID_CELL_COUNT);
		const cellIndex = 5 * GRID_COLS + 5;
		a._grid[cellIndex] = cellSetZone(CELL_ROOM_BIT, 3); // inside, zone 3

		a._onCellMouseDown(cellIndex);

		expect(cellZone(a._grid[cellIndex])).toBe(0);
		expect(cellIsInside(a._grid[cellIndex])).toBe(true);
	});

	it("is a no-op when painting zone on an outside cell", () => {
		const a = el as any;
		a._activeZone = 2;

		a._grid = new Uint8Array(GRID_CELL_COUNT);
		const cellIndex = 5 * GRID_COLS + 5;
		// Cell is outside (0)

		// Directly call _applyPaintToCell with "set" action
		a._paintAction = "set";
		a._applyPaintToCell(cellIndex);

		expect(a._grid[cellIndex]).toBe(0);
		expect(cellIsInside(a._grid[cellIndex])).toBe(false);
	});

	it("sets _dirty = true after zone painting", () => {
		const a = el as any;
		a._activeZone = 1;
		a._dirty = false;

		a._grid = new Uint8Array(GRID_CELL_COUNT);
		const cellIndex = 5 * GRID_COLS + 5;
		a._grid[cellIndex] = CELL_ROOM_BIT;

		a._onCellMouseDown(cellIndex);
		expect(a._dirty).toBe(true);
	});
});

describe("zone clearing", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("direct _applyPaintToCell with clear action on zone cell sets zone to 0", () => {
		const a = el as any;
		a._activeZone = 2;
		a._paintAction = "clear";

		const cellIndex = 5 * GRID_COLS + 5;
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		a._grid[cellIndex] = cellSetZone(CELL_ROOM_BIT, 2);

		a._applyPaintToCell(cellIndex);

		expect(cellZone(a._grid[cellIndex])).toBe(0);
		expect(cellIsInside(a._grid[cellIndex])).toBe(true);
	});
});

describe("room dimensions update after boundary change", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("updates _roomWidth and _roomDepth when boundary cell is set", () => {
		const a = el as any;
		a._activeZone = 0;
		a._roomWidth = 0;
		a._roomDepth = 0;

		// Paint a 3-wide, 2-tall block of cells
		for (let r = 0; r < 2; r++) {
			for (let c = 5; c < 8; c++) {
				a._paintAction = "set";
				a._applyPaintToCell(r * GRID_COLS + c);
			}
		}

		// 3 cols x GRID_CELL_MM = 900, 2 rows x GRID_CELL_MM = 600
		expect(a._roomWidth).toBe(3 * GRID_CELL_MM);
		expect(a._roomDepth).toBe(2 * GRID_CELL_MM);
	});

	it("does not update room dimensions when zone painting (non-boundary)", () => {
		const a = el as any;

		// First set up some room cells
		a._activeZone = 0;
		for (let c = 5; c < 8; c++) {
			a._paintAction = "set";
			a._applyPaintToCell(c);
		}
		const prevWidth = a._roomWidth;
		const prevDepth = a._roomDepth;

		// Now paint a zone on existing room cells
		a._activeZone = 1;
		a._paintAction = "set";
		a._applyPaintToCell(5);

		// Room dimensions should not change from zone painting
		expect(a._roomWidth).toBe(prevWidth);
		expect(a._roomDepth).toBe(prevDepth);
	});
});

describe("painting guards", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("does nothing when _activeZone is null", () => {
		const a = el as any;
		a._activeZone = null;
		a._dirty = false;

		a._onCellMouseDown(0);
		expect(a._dirty).toBe(false);
		expect(a._isPainting).toBe(false);
	});

	it("deselects furniture and returns when sidebarTab is furniture", () => {
		const a = el as any;
		a._sidebarTab = "furniture";
		a._selectedFurnitureId = "some-id";
		a._dirty = false;

		a._onCellMouseDown(0);

		expect(a._selectedFurnitureId).toBeNull();
		expect(a._dirty).toBe(false);
		expect(a._isPainting).toBe(false);
	});
});

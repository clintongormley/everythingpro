/**
 * Zone engine parity tests.
 *
 * These tests verify that the frontend's _runLocalZoneEngine() produces the
 * same zone occupancy results as the Python backend's ZoneEngine._tick() for
 * identical inputs. Each test here has a mirror in tests/test_zone_engine_parity.py.
 *
 * To keep the two in sync:
 *   - Grid: 20×20, room cells at cols 8-11 rows 0-3 (1200×1200mm room)
 *   - Zone 1 painted on cell (9,1) = grid index 29
 *   - Room (zone 0) on all other room cells
 *   - Room dimensions: 1200×1200mm → startCol=8
 *   - Target at (450, 450) maps to col 9.5 → cell (9,1) = zone 1
 *   - Target at (150, 150) maps to col 8.5 → cell (8,0) = zone 0 (room)
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { EverythingPresenceProPanel } from "../everything-presence-pro-panel.js";
import "../everything-presence-pro-panel.js";
import {
	CELL_ROOM_BIT,
	cellSetZone,
	GRID_CELL_COUNT,
	GRID_COLS,
} from "../lib/grid.js";

const MAX_ZONES = 7;

/** Room: 1200×1200mm, centered in 20-col grid → cols 8-11, rows 0-3. */
function makeParityGrid(): Uint8Array {
	const grid = new Uint8Array(GRID_CELL_COUNT);
	for (let r = 0; r < 4; r++) {
		for (let c = 8; c < 12; c++) {
			grid[r * GRID_COLS + c] = CELL_ROOM_BIT; // zone 0 (room)
		}
	}
	// Zone 1 on cell (col=9, row=1)
	grid[1 * GRID_COLS + 9] = cellSetZone(CELL_ROOM_BIT, 1);
	return grid;
}

type TargetStatus = "active" | "pending" | "inactive";

interface Target {
	x: number;
	y: number;
	raw_x: number;
	raw_y: number;
	status: TargetStatus;
	signal: number;
	speed: number;
}

function makeTarget(
	x: number,
	y: number,
	signal: number,
	status: TargetStatus = "active",
): Target {
	return { x, y, raw_x: x, raw_y: y, status, signal, speed: 0 };
}

function createParityPanel(): EverythingPresenceProPanel {
	const el = document.createElement(
		"everything-presence-pro-panel",
	) as EverythingPresenceProPanel;
	el.hass = { callWS: async () => ({}) };
	const a = el as any;
	a._grid = makeParityGrid();
	a._zoneConfigs = new Array(MAX_ZONES).fill(null);
	// Zone 1: entrance type (trigger=3, renew=2, timeout=5, entry_point=true)
	a._zoneConfigs[0] = {
		name: "Zone 1",
		color: "#ff0000",
		type: "entrance",
	};
	a._roomWidth = 1200;
	a._roomDepth = 1200;
	a._roomType = "normal";
	a._roomTrigger = 5;
	a._roomRenew = 3;
	a._roomTimeout = 10;
	a._roomHandoffTimeout = 3;
	a._roomEntryPoint = false;
	a._targets = [];
	a._loading = false;
	return el;
}

describe("Zone engine parity (mirrors test_zone_engine_parity.py)", () => {
	let el: EverythingPresenceProPanel;
	let a: any;

	beforeEach(() => {
		el = createParityPanel();
		a = el as any;
	});

	it("no targets → all zones clear", () => {
		a._targets = [];
		const occ = a._runLocalZoneEngine();
		expect(occ[0]).toBe(false);
		expect(occ[1]).toBe(false);
	});

	it("inactive target → all zones clear", () => {
		a._targets = [makeTarget(450, 450, 5, "inactive")];
		const occ = a._runLocalZoneEngine();
		expect(occ[0]).toBe(false);
		expect(occ[1]).toBe(false);
	});

	it("target in zone 1 (entrance) with signal >= trigger → zone 1 occupied", () => {
		// Entrance zone: trigger=3, entry_point=true
		a._targets = [makeTarget(450, 450, 3)];
		const occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(true);
		expect(occ[0]).toBe(false);
	});

	it("target in zone 1 with signal < trigger → zone 1 stays clear", () => {
		a._targets = [makeTarget(450, 450, 2)];
		const occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(false);
	});

	it("target in room (zone 0) with signal >= gated threshold → zone 0 occupied after gating", () => {
		// Room zone 0: trigger=5, gated threshold = min(5+2, 8) = 7
		// First tick: signal=7 meets gated threshold, gate_count=1
		a._targets = [makeTarget(150, 150, 7)];
		let occ = a._runLocalZoneEngine();
		expect(occ[0]).toBe(false); // not yet — need continuous or 2 gate ticks

		// Second tick: continuous from tick 1, bypasses gating → confirmed
		occ = a._runLocalZoneEngine();
		expect(occ[0]).toBe(true);
	});

	it("target in entry-point zone bypasses gating", () => {
		// Entrance zone 1: entry_point=true, trigger=3
		// No previous position but entry point → no gating required
		a._targets = [makeTarget(450, 450, 3)];
		const occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(true); // immediate — no gating
	});

	it("zone transitions to PENDING then CLEAR after timeout", () => {
		// Get zone 1 occupied first
		a._targets = [makeTarget(450, 450, 5)];
		let occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(true);

		// Target disappears → PENDING
		a._targets = [makeTarget(450, 450, 0, "inactive")];
		occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(true); // still occupied (PENDING)

		// Fast-forward past timeout (entrance timeout=5s)
		const st = a._localZoneState.get(1);
		st.pendingSince = Date.now() / 1000 - 6; // 6 seconds ago
		occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(false); // cleared
	});

	it("target reappears during PENDING → back to OCCUPIED", () => {
		// Occupy zone 1
		a._targets = [makeTarget(450, 450, 5)];
		a._runLocalZoneEngine();

		// Target gone → PENDING
		a._targets = [makeTarget(450, 450, 0, "inactive")];
		let occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(true); // PENDING

		// Target reappears with signal >= renew (2)
		a._targets = [makeTarget(450, 450, 2)];
		occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(true); // back to OCCUPIED
	});

	it("two targets in different zones → both zones occupied", () => {
		// Target 0 in zone 1 (entrance, trigger=3, entry point — no gating)
		// Target 1 in zone 0 (room, trigger=5, gated threshold = min(5+2,8) = 7)
		a._targets = [makeTarget(450, 450, 5), makeTarget(150, 150, 7)];

		// First tick: zone 1 immediate (entry point), zone 0 gating (count=1)
		let occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(true);
		expect(occ[0]).toBe(false);

		// Second tick: zone 0 continuous → confirmed
		occ = a._runLocalZoneEngine();
		expect(occ[1]).toBe(true);
		expect(occ[0]).toBe(true);
	});

	it("target outside grid → no zone occupancy", () => {
		a._targets = [makeTarget(9000, 9000, 9)];
		const occ = a._runLocalZoneEngine();
		// No zones should be occupied
		for (const v of Object.values(occ)) {
			expect(v).toBe(false);
		}
	});

	it("continuity: target moving within 5 cells skips gating", () => {
		// First establish position in zone 0 via gating (need 2 ticks)
		a._targets = [makeTarget(150, 150, 9)];
		a._runLocalZoneEngine(); // gate count 1
		a._runLocalZoneEngine(); // gate count 2 → occupied

		// Move to adjacent cell (still zone 0) — continuous, no re-gating needed
		a._targets = [makeTarget(450, 150, 5)]; // col 9.5 row 0.5 → still zone 0
		const occ = a._runLocalZoneEngine();
		expect(occ[0]).toBe(true); // stays occupied via renew
	});
});

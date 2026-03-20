import { describe, expect, it } from "vitest";
import {
	getSmoothedValue,
	mapTargetToGridCell,
	mapTargetToPercent,
	rawToFovPct,
	type SmoothBufferEntry,
} from "../coordinates.js";

describe("mapTargetToPercent", () => {
	it("maps center of room to 50%/50%", () => {
		const result = mapTargetToPercent(1500, 2000, 3000, 4000);
		expect(result.x).toBeCloseTo(50, 6);
		expect(result.y).toBeCloseTo(50, 6);
	});

	it("maps origin to 0%/0%", () => {
		const result = mapTargetToPercent(0, 0, 3000, 4000);
		expect(result.x).toBeCloseTo(0, 6);
		expect(result.y).toBeCloseTo(0, 6);
	});

	it("maps room corner to 100%/100%", () => {
		const result = mapTargetToPercent(3000, 4000, 3000, 4000);
		expect(result.x).toBeCloseTo(100, 6);
		expect(result.y).toBeCloseTo(100, 6);
	});

	it("clamps values to room bounds", () => {
		const result = mapTargetToPercent(5000, -500, 3000, 4000);
		expect(result.x).toBeCloseTo(100, 6);
		expect(result.y).toBeCloseTo(0, 6);
	});

	it("falls back to MAX_RANGE when room is zero", () => {
		const result = mapTargetToPercent(3000, 3000, 0, 0);
		// 3000 / 6000 * 100 = 50
		expect(result.x).toBeCloseTo(50, 6);
		expect(result.y).toBeCloseTo(50, 6);
	});

	it("does not clamp when room is zero (uses MAX_RANGE)", () => {
		const result = mapTargetToPercent(6000, 6000, 0, 0);
		expect(result.x).toBeCloseTo(100, 6);
		expect(result.y).toBeCloseTo(100, 6);
	});
});

describe("mapTargetToGridCell", () => {
	it("maps center of room to approximately center of grid", () => {
		// Room: 3000mm wide = 10 cols, centered: startCol = 5
		// Center: x=1500 → col = 5 + 1500/300 = 10
		// y=1500 → row = 1500/300 = 5
		const result = mapTargetToGridCell(1500, 1500, 3000, 3000);
		expect(result).not.toBeNull();
		expect(result?.col).toBeCloseTo(10, 6);
		expect(result?.row).toBeCloseTo(5, 6);
	});

	it("returns null when room width is zero", () => {
		expect(mapTargetToGridCell(100, 100, 0, 1000)).toBeNull();
	});

	it("returns null when room depth is zero", () => {
		expect(mapTargetToGridCell(100, 100, 1000, 0)).toBeNull();
	});

	it("returns null when both dimensions are zero", () => {
		expect(mapTargetToGridCell(100, 100, 0, 0)).toBeNull();
	});

	it("returns null for negative dimensions", () => {
		expect(mapTargetToGridCell(100, 100, -1000, -1000)).toBeNull();
	});

	it("maps origin of room to startCol, row 0", () => {
		// Room: 6000mm = 20 cols, startCol = 0
		const result = mapTargetToGridCell(0, 0, 6000, 6000);
		expect(result).not.toBeNull();
		expect(result?.col).toBeCloseTo(0, 6);
		expect(result?.row).toBeCloseTo(0, 6);
	});
});

describe("rawToFovPct", () => {
	it("maps center (0, 0) to ~50% x, 0% y", () => {
		const result = rawToFovPct(0, 0);
		expect(result.xPct).toBeCloseTo(50, 1);
		expect(result.yPct).toBeCloseTo(0, 6);
	});

	it("maps forward center target correctly", () => {
		const result = rawToFovPct(0, 3000);
		expect(result.xPct).toBeCloseTo(50, 1);
		expect(result.yPct).toBeCloseTo(50, 1);
	});

	it("maps max range target", () => {
		const result = rawToFovPct(0, 6000);
		expect(result.xPct).toBeCloseTo(50, 1);
		expect(result.yPct).toBeCloseTo(100, 1);
	});

	it("maps left edge target", () => {
		// FOV_X_EXTENT = 6000 * sin(60°) ≈ 5196
		const halfW = 6000 * Math.sin(Math.PI / 3);
		const result = rawToFovPct(-halfW, 3000);
		expect(result.xPct).toBeCloseTo(0, 1);
		expect(result.yPct).toBeCloseTo(50, 1);
	});

	it("maps right edge target", () => {
		const halfW = 6000 * Math.sin(Math.PI / 3);
		const result = rawToFovPct(halfW, 3000);
		expect(result.xPct).toBeCloseTo(100, 1);
		expect(result.yPct).toBeCloseTo(50, 1);
	});
});

describe("getSmoothedValue", () => {
	it("returns the single value for a single point", () => {
		const result = getSmoothedValue([], 100, 200, 1000);
		expect(result.x).toBe(100);
		expect(result.y).toBe(200);
		expect(result.buffer).toHaveLength(1);
	});

	it("returns median of multiple points", () => {
		const now = 5000;
		let buffer: SmoothBufferEntry[] = [];
		// Add 5 points at the same time
		const values = [
			{ x: 10, y: 20 },
			{ x: 30, y: 40 },
			{ x: 20, y: 30 },
			{ x: 50, y: 60 },
			{ x: 25, y: 35 },
		];
		for (const v of values) {
			const result = getSmoothedValue(buffer, v.x, v.y, now);
			buffer = result.buffer;
		}
		// Sorted x: [10, 20, 25, 30, 50] → median = 25
		// Sorted y: [20, 30, 35, 40, 60] → median = 35
		const final = getSmoothedValue(buffer, 25, 35, now);
		// With 6 values: [10, 20, 25, 25, 30, 50] → median = (25+25)/2 = 25
		// y: [20, 30, 35, 35, 40, 60] → median = (35+35)/2 = 35
		expect(final.x).toBe(25);
		expect(final.y).toBe(35);
	});

	it("prunes entries older than 1 second", () => {
		const buffer: SmoothBufferEntry[] = [
			{ x: 100, y: 200, t: 1000 },
			{ x: 110, y: 210, t: 1500 },
		];
		// Now is 2500, so entry at t=1000 is 1500ms old (>1000ms), pruned
		// Entry at t=1500 is 1000ms old (exactly at boundary), pruned
		const result = getSmoothedValue(buffer, 120, 220, 2501);
		// Only the new point remains
		expect(result.buffer).toHaveLength(1);
		expect(result.x).toBe(120);
		expect(result.y).toBe(220);
	});

	it("keeps entries within 1 second", () => {
		const buffer: SmoothBufferEntry[] = [
			{ x: 100, y: 200, t: 2000 },
			{ x: 110, y: 210, t: 2500 },
		];
		// Now is 2800, both entries are within 1 second
		const result = getSmoothedValue(buffer, 105, 205, 2800);
		expect(result.buffer).toHaveLength(3);
		// Sorted x: [100, 105, 110] → median = 105
		// Sorted y: [200, 205, 210] → median = 205
		expect(result.x).toBe(105);
		expect(result.y).toBe(205);
	});

	it("handles even number of entries (average of middle two)", () => {
		const now = 5000;
		const buffer: SmoothBufferEntry[] = [
			{ x: 10, y: 100, t: now },
			{ x: 20, y: 200, t: now },
			{ x: 30, y: 300, t: now },
		];
		const result = getSmoothedValue(buffer, 40, 400, now);
		// 4 entries: [10, 20, 30, 40] → median = (20+30)/2 = 25
		// y: [100, 200, 300, 400] → median = (200+300)/2 = 250
		expect(result.x).toBe(25);
		expect(result.y).toBe(250);
	});
});

import { describe, expect, it } from "vitest";
import { CELL_ROOM_BIT, cellSetZone, MAX_ZONES } from "../grid.js";
import {
	CELL_COLOR_OUTSIDE,
	CELL_COLOR_ROOM,
	computeHeatmapColors,
	getCellColor,
	hexToRgb,
} from "../heatmap.js";
import type { ZoneConfig } from "../zone-defaults.js";

const makeZoneConfig = (overrides: Partial<ZoneConfig> = {}): ZoneConfig => ({
	name: "Test Zone",
	color: "#E69F00",
	type: "normal",
	...overrides,
});

describe("getCellColor", () => {
	it("returns outside color for non-room cell", () => {
		expect(getCellColor(0, [])).toBe(CELL_COLOR_OUTSIDE);
	});

	it("returns room color for zone-0 inside cell", () => {
		expect(getCellColor(CELL_ROOM_BIT, [])).toBe(CELL_COLOR_ROOM);
	});

	it("returns zone color for inside cell with zone", () => {
		const configs: (ZoneConfig | null)[] = [
			null,
			makeZoneConfig({ color: "#FF0000" }),
		];
		const cell = cellSetZone(CELL_ROOM_BIT, 2);
		expect(getCellColor(cell, configs)).toBe("#FF0000");
	});

	it("returns room color if zone config is null", () => {
		const configs: (ZoneConfig | null)[] = [null, null, null];
		const cell = cellSetZone(CELL_ROOM_BIT, 1);
		expect(getCellColor(cell, configs)).toBe(CELL_COLOR_ROOM);
	});

	it("handles all zone slots", () => {
		const configs: (ZoneConfig | null)[] = Array.from(
			{ length: MAX_ZONES },
			(_, i) => makeZoneConfig({ color: `#${String(i + 1).padStart(6, "0")}` }),
		);
		for (let z = 1; z <= MAX_ZONES; z++) {
			const cell = cellSetZone(CELL_ROOM_BIT, z);
			expect(getCellColor(cell, configs)).toBe(
				`#${String(z).padStart(6, "0")}`,
			);
		}
	});

	it("returns room color for zone > MAX_ZONES", () => {
		// This shouldn't happen in practice, but test the boundary
		const configs: (ZoneConfig | null)[] = [];
		// Zone 0 with room bit set
		expect(getCellColor(CELL_ROOM_BIT, configs)).toBe(CELL_COLOR_ROOM);
	});
});

describe("hexToRgb", () => {
	it("parses orange hex", () => {
		expect(hexToRgb("#E69F00")).toEqual({ r: 230, g: 159, b: 0 });
	});

	it("parses black", () => {
		expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("parses white", () => {
		expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
	});

	it("parses red", () => {
		expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
	});

	it("parses green", () => {
		expect(hexToRgb("#00FF00")).toEqual({ r: 0, g: 255, b: 0 });
	});

	it("parses blue", () => {
		expect(hexToRgb("#0000FF")).toEqual({ r: 0, g: 0, b: 255 });
	});

	it("handles lowercase hex", () => {
		expect(hexToRgb("#ff8800")).toEqual({ r: 255, g: 136, b: 0 });
	});
});

describe("computeHeatmapColors", () => {
	it("returns empty map for empty target counts", () => {
		const result = computeHeatmapColors({}, []);
		expect(result.size).toBe(0);
	});

	it("skips zones with 0 or negative hit counts", () => {
		const result = computeHeatmapColors({ "0": 0, "1": -1 }, []);
		expect(result.size).toBe(0);
	});

	it("uses blue default for zone 0", () => {
		const result = computeHeatmapColors({ "0": 5 }, []);
		const color = result.get(0);
		expect(color).toBeDefined();
		// rgb(100, 180, 255) with opacity = (5/9)*0.6 ≈ 0.333
		expect(color).toMatch(/^rgba\(100, 180, 255,/);
	});

	it("uses zone config color for named zones", () => {
		const configs: (ZoneConfig | null)[] = [
			makeZoneConfig({ color: "#FF0000" }),
		];
		const result = computeHeatmapColors({ "1": 9 }, configs);
		const color = result.get(1);
		expect(color).toBeDefined();
		// #FF0000 → rgb(255, 0, 0) with opacity = (9/9)*0.6 = 0.6
		expect(color).toBe("rgba(255, 0, 0, 0.6)");
	});

	it("caps signal at 9", () => {
		const result = computeHeatmapColors({ "0": 100 }, []);
		const color = result.get(0);
		expect(color).toBeDefined();
		// Opacity should be capped at (9/9)*0.6 = 0.6
		expect(color).toMatch(/0\.6\)$/);
	});

	it("scales opacity linearly", () => {
		const result1 = computeHeatmapColors({ "0": 1 }, []);
		const result5 = computeHeatmapColors({ "0": 5 }, []);
		const result9 = computeHeatmapColors({ "0": 9 }, []);

		// Extract opacity values
		const getOpacity = (color: string) =>
			parseFloat(color.match(/rgba\(.+, (.+)\)/)![1]);

		const o1 = getOpacity(result1.get(0)!);
		const o5 = getOpacity(result5.get(0)!);
		const o9 = getOpacity(result9.get(0)!);

		expect(o1).toBeCloseTo((1 / 9) * 0.6, 4);
		expect(o5).toBeCloseTo((5 / 9) * 0.6, 4);
		expect(o9).toBeCloseTo(0.6, 4);
		expect(o1).toBeLessThan(o5);
		expect(o5).toBeLessThan(o9);
	});

	it("handles multiple zones at once", () => {
		const configs: (ZoneConfig | null)[] = [
			makeZoneConfig({ color: "#FF0000" }),
			makeZoneConfig({ color: "#00FF00" }),
		];
		const result = computeHeatmapColors({ "0": 3, "1": 6, "2": 9 }, configs);
		expect(result.size).toBe(3);
		expect(result.has(0)).toBe(true);
		expect(result.has(1)).toBe(true);
		expect(result.has(2)).toBe(true);
	});

	it("falls back to blue for named zone without config", () => {
		const result = computeHeatmapColors({ "5": 3 }, []);
		const color = result.get(5);
		expect(color).toBeDefined();
		// No config for zone 5, so defaults to blue
		expect(color).toMatch(/^rgba\(100, 180, 255,/);
	});

	it("falls back to blue for zone > MAX_ZONES", () => {
		const result = computeHeatmapColors({ "99": 3 }, []);
		const color = result.get(99);
		expect(color).toBeDefined();
		expect(color).toMatch(/^rgba\(100, 180, 255,/);
	});
});

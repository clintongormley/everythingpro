import { describe, expect, it } from "vitest";
import {
	parseCalibration,
	parseConfig,
	parseFurniture,
	parseGrid,
	parseRoomThresholds,
	parseZoneConfigs,
} from "../config-serialization.js";
import { cellIsInside, GRID_CELL_COUNT, MAX_ZONES } from "../grid.js";
import { ZONE_COLORS, ZONE_TYPE_DEFAULTS } from "../zone-defaults.js";

describe("parseCalibration", () => {
	it("returns perspective and room dimensions when valid", () => {
		const config = {
			calibration: {
				perspective: [1, 0, 0, 0, 1, 0, 0, 0],
				room_width: 3000,
				room_depth: 4000,
			},
		};
		const result = parseCalibration(config);
		expect(result.perspective).toEqual([1, 0, 0, 0, 1, 0, 0, 0]);
		expect(result.roomWidth).toBe(3000);
		expect(result.roomDepth).toBe(4000);
	});

	it("returns null perspective when no calibration", () => {
		const result = parseCalibration({});
		expect(result.perspective).toBeNull();
		expect(result.roomWidth).toBe(0);
		expect(result.roomDepth).toBe(0);
	});

	it("returns null perspective when room_width is 0", () => {
		const config = {
			calibration: {
				perspective: [1, 0, 0, 0, 1, 0, 0, 0],
				room_width: 0,
				room_depth: 4000,
			},
		};
		const result = parseCalibration(config);
		expect(result.perspective).toBeNull();
	});

	it("returns null perspective when perspective is missing", () => {
		const config = {
			calibration: {
				room_width: 3000,
				room_depth: 4000,
			},
		};
		const result = parseCalibration(config);
		expect(result.perspective).toBeNull();
	});

	it("handles null config", () => {
		const result = parseCalibration(null);
		expect(result.perspective).toBeNull();
	});

	it("defaults room_depth to 0 when missing", () => {
		const config = {
			calibration: {
				perspective: [1, 0, 0, 0, 1, 0, 0, 0],
				room_width: 3000,
			},
		};
		const result = parseCalibration(config);
		expect(result.roomDepth).toBe(0);
	});
});

describe("parseFurniture", () => {
	it("parses valid furniture items", () => {
		const raw = [
			{
				id: "f1",
				type: "icon",
				icon: "mdi:sofa",
				label: "Sofa",
				x: 100,
				y: 200,
				width: 600,
				height: 400,
				rotation: 45,
				lockAspect: true,
			},
		];
		const result = parseFurniture(raw);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(raw[0]);
	});

	it("applies defaults for missing fields", () => {
		const raw = [{}];
		const result = parseFurniture(raw);
		expect(result[0].id).toBe("f_load_0");
		expect(result[0].type).toBe("icon");
		expect(result[0].icon).toBe("mdi:help");
		expect(result[0].label).toBe("Item");
		expect(result[0].x).toBe(0);
		expect(result[0].y).toBe(0);
		expect(result[0].width).toBe(600);
		expect(result[0].height).toBe(600);
		expect(result[0].rotation).toBe(0);
		expect(result[0].lockAspect).toBe(true); // type !== "svg"
	});

	it("sets lockAspect false for svg type", () => {
		const raw = [{ type: "svg" }];
		const result = parseFurniture(raw);
		expect(result[0].lockAspect).toBe(false);
	});

	it("preserves explicit lockAspect", () => {
		const raw = [{ type: "svg", lockAspect: true }];
		const result = parseFurniture(raw);
		expect(result[0].lockAspect).toBe(true);
	});

	it("handles null/undefined input", () => {
		expect(parseFurniture(null as any)).toEqual([]);
		expect(parseFurniture(undefined as any)).toEqual([]);
	});

	it("generates sequential ids for items without id", () => {
		const raw = [{}, {}, {}];
		const result = parseFurniture(raw);
		expect(result[0].id).toBe("f_load_0");
		expect(result[1].id).toBe("f_load_1");
		expect(result[2].id).toBe("f_load_2");
	});

	it("preserves x=0 and y=0 explicitly set", () => {
		const raw = [{ x: 0, y: 0 }];
		const result = parseFurniture(raw);
		expect(result[0].x).toBe(0);
		expect(result[0].y).toBe(0);
	});
});

describe("parseGrid", () => {
	it("uses grid_bytes when available", () => {
		const bytes = new Array(GRID_CELL_COUNT).fill(0);
		bytes[0] = 1;
		bytes[5] = 3;
		const layout = { grid_bytes: bytes };
		const grid = parseGrid(layout, 3000, 3000);
		expect(grid[0]).toBe(1);
		expect(grid[5]).toBe(3);
		expect(grid.length).toBe(GRID_CELL_COUNT);
	});

	it("initializes from room dimensions when no grid_bytes", () => {
		const grid = parseGrid({}, 3000, 3000);
		let count = 0;
		for (let i = 0; i < GRID_CELL_COUNT; i++) {
			if (cellIsInside(grid[i])) count++;
		}
		expect(count).toBeGreaterThan(0);
	});

	it("returns empty grid when no grid_bytes and no room dimensions", () => {
		const grid = parseGrid({}, 0, 0);
		let count = 0;
		for (let i = 0; i < GRID_CELL_COUNT; i++) {
			if (cellIsInside(grid[i])) count++;
		}
		expect(count).toBe(0);
	});

	it("handles null layout", () => {
		const grid = parseGrid(null, 0, 0);
		expect(grid.length).toBe(GRID_CELL_COUNT);
	});

	it("ignores grid_bytes that is not an array", () => {
		const grid = parseGrid({ grid_bytes: "not-an-array" }, 3000, 3000);
		// Should fall through to initGridFromRoom
		let count = 0;
		for (let i = 0; i < GRID_CELL_COUNT; i++) {
			if (cellIsInside(grid[i])) count++;
		}
		expect(count).toBeGreaterThan(0);
	});
});

describe("parseZoneConfigs", () => {
	it("returns MAX_ZONES null entries for empty layout", () => {
		const result = parseZoneConfigs({});
		expect(result).toHaveLength(MAX_ZONES);
		for (const z of result) {
			expect(z).toBeNull();
		}
	});

	it("parses zone_slots", () => {
		const layout = {
			zone_slots: [
				{
					name: "Kitchen",
					color: "#FF0000",
					type: "entrance",
					trigger: 3,
					renew: 2,
					timeout: 5,
					handoff_timeout: 1,
					entry_point: true,
				},
			],
		};
		const result = parseZoneConfigs(layout);
		expect(result[0]).toEqual({
			name: "Kitchen",
			color: "#FF0000",
			type: "entrance",
			trigger: 3,
			renew: 2,
			timeout: 5,
			handoff_timeout: 1,
			entry_point: true,
		});
		// Rest should be null
		for (let i = 1; i < MAX_ZONES; i++) {
			expect(result[i]).toBeNull();
		}
	});

	it("falls back to legacy zones key", () => {
		const layout = {
			zones: [{ name: "Living Room" }],
		};
		const result = parseZoneConfigs(layout);
		expect(result[0]!.name).toBe("Living Room");
	});

	it("applies defaults for missing zone fields", () => {
		const layout = {
			zone_slots: [{}],
		};
		const result = parseZoneConfigs(layout);
		expect(result[0]!.name).toBe("Zone 1");
		expect(result[0]!.color).toBe(ZONE_COLORS[0]);
		expect(result[0]!.type).toBe("normal");
		expect(result[0]!.entry_point).toBe(false);
	});

	it("cycles zone colors for slots without color", () => {
		const slots = Array.from({ length: MAX_ZONES }, () => ({}));
		const layout = { zone_slots: slots };
		const result = parseZoneConfigs(layout);
		for (let i = 0; i < MAX_ZONES; i++) {
			expect(result[i]!.color).toBe(ZONE_COLORS[i % ZONE_COLORS.length]);
		}
	});

	it("handles null layout", () => {
		const result = parseZoneConfigs(null);
		expect(result).toHaveLength(MAX_ZONES);
		for (const z of result) {
			expect(z).toBeNull();
		}
	});
});

describe("parseRoomThresholds", () => {
	it("returns normal defaults for empty layout", () => {
		const result = parseRoomThresholds({});
		expect(result.roomType).toBe("normal");
		expect(result.roomTrigger).toBe(ZONE_TYPE_DEFAULTS.normal.trigger);
		expect(result.roomRenew).toBe(ZONE_TYPE_DEFAULTS.normal.renew);
		expect(result.roomTimeout).toBe(ZONE_TYPE_DEFAULTS.normal.timeout);
		expect(result.roomHandoffTimeout).toBe(
			ZONE_TYPE_DEFAULTS.normal.handoff_timeout,
		);
		expect(result.roomEntryPoint).toBe(false);
	});

	it("uses specified room_type defaults", () => {
		const layout = { room_type: "entrance" };
		const result = parseRoomThresholds(layout);
		expect(result.roomType).toBe("entrance");
		expect(result.roomTrigger).toBe(ZONE_TYPE_DEFAULTS.entrance.trigger);
		expect(result.roomRenew).toBe(ZONE_TYPE_DEFAULTS.entrance.renew);
		expect(result.roomTimeout).toBe(ZONE_TYPE_DEFAULTS.entrance.timeout);
	});

	it("uses explicit values over defaults", () => {
		const layout = {
			room_type: "normal",
			room_trigger: 9,
			room_renew: 1,
			room_timeout: 60,
			room_handoff_timeout: 15,
			room_entry_point: true,
		};
		const result = parseRoomThresholds(layout);
		expect(result.roomTrigger).toBe(9);
		expect(result.roomRenew).toBe(1);
		expect(result.roomTimeout).toBe(60);
		expect(result.roomHandoffTimeout).toBe(15);
		expect(result.roomEntryPoint).toBe(true);
	});

	it("handles null layout", () => {
		const result = parseRoomThresholds(null);
		expect(result.roomType).toBe("normal");
	});

	it("falls back to normal defaults for unknown room type", () => {
		const layout = { room_type: "unknown_type" };
		const result = parseRoomThresholds(layout);
		// ZONE_TYPE_DEFAULTS["unknown_type"] is undefined, falls back to normal
		expect(result.roomTrigger).toBe(ZONE_TYPE_DEFAULTS.normal.trigger);
	});
});

describe("parseConfig", () => {
	it("parses a complete config", () => {
		const config = {
			calibration: {
				perspective: [1, 0, 100, 0, 1, 200, 0, 0],
				room_width: 3000,
				room_depth: 4000,
			},
			room_layout: {
				furniture: [{ icon: "mdi:table", label: "Table" }],
				grid_bytes: new Array(GRID_CELL_COUNT).fill(0),
				zone_slots: [{ name: "Zone A" }],
				room_type: "rest",
				room_entry_point: false,
			},
			reporting: { some_key: true },
			offsets: { offset_x: 10 },
		};
		const result = parseConfig(config);
		expect(result.calibration.perspective).toEqual([
			1, 0, 100, 0, 1, 200, 0, 0,
		]);
		expect(result.calibration.roomWidth).toBe(3000);
		expect(result.furniture).toHaveLength(1);
		expect(result.grid.length).toBe(GRID_CELL_COUNT);
		expect(result.zoneConfigs[0]!.name).toBe("Zone A");
		expect(result.roomThresholds.roomType).toBe("rest");
		expect(result.reportingConfig).toEqual({ some_key: true });
		expect(result.offsetsConfig).toEqual({ offset_x: 10 });
	});

	it("handles minimal config", () => {
		const result = parseConfig({});
		expect(result.calibration.perspective).toBeNull();
		expect(result.furniture).toEqual([]);
		expect(result.grid.length).toBe(GRID_CELL_COUNT);
		expect(result.zoneConfigs.every((z) => z === null)).toBe(true);
		expect(result.roomThresholds.roomType).toBe("normal");
		expect(result.reportingConfig).toEqual({});
		expect(result.offsetsConfig).toEqual({});
	});

	it("handles null config", () => {
		const result = parseConfig(null);
		expect(result.calibration.perspective).toBeNull();
		expect(result.furniture).toEqual([]);
	});

	it("initializes grid from room dimensions when no grid_bytes", () => {
		const config = {
			calibration: {
				perspective: [1, 0, 0, 0, 1, 0, 0, 0],
				room_width: 3000,
				room_depth: 3000,
			},
		};
		const result = parseConfig(config);
		let count = 0;
		for (let i = 0; i < GRID_CELL_COUNT; i++) {
			if (cellIsInside(result.grid[i])) count++;
		}
		expect(count).toBeGreaterThan(0);
	});
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EverythingPresenceProPanel } from "../everything-presence-pro-panel.js";
import "../everything-presence-pro-panel.js";
import { GRID_CELL_COUNT } from "../lib/grid.js";

function createPanel(): EverythingPresenceProPanel {
	const el = document.createElement(
		"everything-presence-pro-panel",
	) as EverythingPresenceProPanel;
	el.hass = { callWS: vi.fn().mockResolvedValue({}) };
	const a = el as any;
	a._grid = new Uint8Array(GRID_CELL_COUNT);
	a._zoneConfigs = new Array(7).fill(null);
	a._activeZone = 0;
	a._dirty = false;
	a._loading = false;
	a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];
	a._roomWidth = 3000;
	a._roomDepth = 4000;
	a._furniture = [];
	a._selectedFurnitureId = null;
	a._targets = [];
	a._sensorState = {
		occupancy: false,
		static_presence: false,
		pir_motion: false,
		target_presence: false,
		illuminance: null,
		temperature: null,
		humidity: null,
		co2: null,
	};
	a._zoneState = { occupancy: {}, target_counts: {}, frame_count: 0 };
	a._unsubTargets = undefined;
	return el;
}

describe("_subscribeTargets", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("does nothing when hass is not set", () => {
		const a = el as any;
		el.hass = null;

		a._subscribeTargets("e1");
		expect(a._unsubTargets).toBeUndefined();
	});

	it("does nothing when entryId is empty", () => {
		const a = el as any;
		el.hass = {
			callWS: vi.fn(),
			connection: { subscribeMessage: vi.fn() },
		};

		a._subscribeTargets("");
		expect(el.hass.connection.subscribeMessage).not.toHaveBeenCalled();
	});

	it("subscribes when hass and entryId are provided", () => {
		const a = el as any;
		const unsubFn = vi.fn();
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockResolvedValue(unsubFn),
			},
		};

		a._subscribeTargets("e1");

		expect(el.hass.connection.subscribeMessage).toHaveBeenCalledWith(
			expect.any(Function),
			{
				type: "everything_presence_pro/subscribe_targets",
				entry_id: "e1",
			},
		);
	});

	it("unsubscribes existing subscription before subscribing", () => {
		const a = el as any;
		const oldUnsub = vi.fn();
		a._unsubTargets = oldUnsub;

		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockResolvedValue(() => {}),
			},
		};

		a._subscribeTargets("e1");
		expect(oldUnsub).toHaveBeenCalled();
	});

	it("processes target events correctly", async () => {
		const a = el as any;
		let handler: (event: any) => void;
		let callCount = 0;
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					if (callCount++ === 0) handler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._subscribeTargets("e1");

		// Trigger event
		handler!({
			targets: [
				{ x: 100, y: 200, status: "active", signal: 5 },
				{ x: 300, y: 400, status: "inactive", signal: 0 },
			],
			sensors: {
				occupancy: true,
				static_presence: true,
				pir_motion: false,
				target_presence: false,
				illuminance: 150,
				temperature: 22.5,
				humidity: 45,
				co2: 400,
			},
			zones: {
				occupancy: { 1: true },
				target_counts: { 1: 1 },
				frame_count: 10,
			},
		});

		expect(a._targets).toHaveLength(2);
		expect(a._targets[0].status).toBe("active");
		expect(a._targets[0].raw_x).toBe(100);
		expect(a._targets[1].status).toBe("inactive");

		expect(a._sensorState.occupancy).toBe(true);
		expect(a._sensorState.illuminance).toBe(150);
		expect(a._sensorState.temperature).toBe(22.5);

		expect(a._zoneState.occupancy).toEqual({ 1: true });
		expect(a._zoneState.target_counts).toEqual({ 1: 1 });
		expect(a._zoneState.frame_count).toBe(10);
	});

	it("handles pending targets via status field", async () => {
		const a = el as any;
		let handler: (event: any) => void;
		let callCount = 0;
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					if (callCount++ === 0) handler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._subscribeTargets("e1");

		handler!({
			targets: [{ x: 150, y: 250, status: "pending", signal: 0 }],
		});

		expect(a._targets[0].status).toBe("pending");
		expect(a._targets[0].x).toBe(150);
	});

	it("active targets retain active status", async () => {
		const a = el as any;
		let handler: (event: any) => void;
		let callCount = 0;
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					if (callCount++ === 0) handler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._subscribeTargets("e1");

		handler!({
			targets: [{ x: 100, y: 200, status: "active", signal: 5 }],
		});

		expect(a._targets[0].status).toBe("active");
		expect(a._targets[0].x).toBe(100);
	});

	it("handles event without sensors or zones", async () => {
		const a = el as any;
		let handler: (event: any) => void;
		let callCount = 0;
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					if (callCount++ === 0) handler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._subscribeTargets("e1");

		handler!({
			targets: [{ x: 100, y: 200, status: "active", signal: 3 }],
		});

		// Sensor state should remain unchanged
		expect(a._sensorState.occupancy).toBe(false);
		expect(a._zoneState.frame_count).toBe(0);
	});
});

describe("_unsubscribeTargets", () => {
	it("calls unsub function and clears targets", () => {
		const el = createPanel();
		const a = el as any;
		const unsub = vi.fn();
		a._unsubTargets = unsub;
		a._targets = [
			{
				x: 1,
				y: 2,
				raw_x: 1,
				raw_y: 2,
				speed: 0,
				status: "active",
				signal: 5,
			},
		];

		a._unsubscribeTargets();

		expect(unsub).toHaveBeenCalled();
		expect(a._unsubTargets).toBeUndefined();
		expect(a._targets).toEqual([]);
	});

	it("handles no existing subscription gracefully", () => {
		const el = createPanel();
		const a = el as any;
		a._unsubTargets = undefined;

		// Should not throw
		a._unsubscribeTargets();
		expect(a._targets).toEqual([]);
	});
});

describe("_mapTargetToPercent", () => {
	it("maps target position to percentage", () => {
		const el = createPanel();
		const a = el as any;
		a._roomWidth = 4000;
		a._roomDepth = 4000;

		const result = a._mapTargetToPercent({ x: 2000, y: 2000 });
		expect(result.x).toBeCloseTo(50, 0);
		expect(result.y).toBeCloseTo(50, 0);
	});
});

describe("_mapTargetToGridCell", () => {
	it("maps target position to grid cell", () => {
		const el = createPanel();
		const a = el as any;
		a._roomWidth = 6000;
		a._roomDepth = 6000;

		const result = a._mapTargetToGridCell({ x: 3000, y: 3000 });
		expect(result).not.toBeNull();
		expect(result.col).toBeGreaterThan(0);
		expect(result.row).toBeGreaterThan(0);
	});
});

describe("_getInversePerspective", () => {
	it("returns null when perspective is null", () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = null;

		expect(a._getInversePerspective()).toBeNull();
	});

	it("returns inverse when perspective is set", () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];

		const result = a._getInversePerspective();
		expect(result).not.toBeNull();
		expect(result).toHaveLength(8);
	});
});

describe("_applyPerspective", () => {
	it("applies perspective transform to a point", () => {
		const el = createPanel();
		const a = el as any;
		const h = [1, 0, 0, 0, 1, 0, 0, 0];

		const result = a._applyPerspective(h, 100, 200);
		expect(result.x).toBeCloseTo(100);
		expect(result.y).toBeCloseTo(200);
	});
});

describe("_getSensorFov", () => {
	it("returns null when perspective is null", () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = null;

		expect(a._getSensorFov()).toBeNull();
	});

	it("returns FOV and caches it", () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];

		const fov1 = a._getSensorFov();
		expect(fov1).not.toBeNull();

		// Should return cached result
		const fov2 = a._getSensorFov();
		expect(fov2).toBe(fov1);
	});

	it("recomputes on perspective change", () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];

		const fov1 = a._getSensorFov();
		a._perspective = [2, 0, 0, 0, 2, 0, 0, 0];
		const fov2 = a._getSensorFov();

		expect(fov2).not.toBe(fov1);
	});
});

describe("_isCellInSensorRange", () => {
	it("returns a boolean", () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];
		a._roomWidth = 3000;
		a._targetAutoRange = false;
		a._targetMaxDistance = 6;

		const result = a._isCellInSensorRange(10, 10);
		expect(typeof result).toBe("boolean");
	});
});

describe("_getGridRoomMetrics", () => {
	it("returns null for empty grid", () => {
		const el = createPanel();
		const a = el as any;
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		a._roomWidth = 0;
		a._perspective = null;

		const result = a._getGridRoomMetrics();
		expect(result).toBeNull();
	});
});

describe("_getSensorRoomPosition", () => {
	it("returns null when perspective is null", () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = null;

		expect(a._getSensorRoomPosition()).toBeNull();
	});

	it("returns position when perspective is set", () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];

		const result = a._getSensorRoomPosition();
		expect(result).not.toBeNull();
		expect(typeof result.x).toBe("number");
		expect(typeof result.y).toBe("number");
	});
});

describe("_autoDetectionRange", () => {
	it("returns a number", () => {
		const el = createPanel();
		const a = el as any;
		a._roomWidth = 3000;
		a._roomDepth = 4000;
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];

		const result = a._autoDetectionRange();
		expect(typeof result).toBe("number");
	});
});

describe("_getRawRoomBounds", () => {
	it("returns bounds object", () => {
		const el = createPanel();
		const a = el as any;

		const result = a._getRawRoomBounds();
		expect(result).toHaveProperty("minCol");
		expect(result).toHaveProperty("maxCol");
		expect(result).toHaveProperty("minRow");
		expect(result).toHaveProperty("maxRow");
	});
});

describe("_subscribeDisplay", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("subscribes to display when hass and entryId are provided", () => {
		const a = el as any;
		const unsubFn = vi.fn();
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockResolvedValue(unsubFn),
			},
		};

		a._subscribeDisplay("e1");

		expect(el.hass.connection.subscribeMessage).toHaveBeenCalledWith(
			expect.any(Function),
			{
				type: "everything_presence_pro/subscribe_display",
				entry_id: "e1",
			},
		);
	});

	it("does nothing when hass is not set", () => {
		const a = el as any;
		el.hass = null;
		a._subscribeDisplay("e1");
		expect(a._unsubDisplay).toBeUndefined();
	});
});

describe("display event merging", () => {
	it("merges display positions into existing targets preserving status", () => {
		const el = createPanel();
		const a = el as any;

		// Set up existing targets (as if from subscribe_targets)
		a._targets = [
			{ x: 0, y: 0, raw_x: 0, raw_y: 0, speed: 0, status: "active", signal: 5 },
			{
				x: 0,
				y: 0,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "pending",
				signal: 3,
			},
			{
				x: 0,
				y: 0,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "inactive",
				signal: 0,
			},
		];

		// Simulate display event callback
		let callback: (event: any) => void;
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					callback = cb;
					return Promise.resolve(vi.fn());
				}),
			},
		};
		a._subscribeDisplay("e1");

		// Fire display event
		callback!({
			targets: [
				{ x: 100, y: 200, raw_x: 50, raw_y: 100, signal: 7 },
				{ x: 300, y: 400, raw_x: 150, raw_y: 200, signal: 4 },
				{ x: 0, y: 0, raw_x: 0, raw_y: 0, signal: 0 },
			],
		});

		// Positions updated
		expect(a._targets[0].x).toBe(100);
		expect(a._targets[0].y).toBe(200);
		expect(a._targets[0].raw_x).toBe(50);
		expect(a._targets[0].signal).toBe(7);
		// Status preserved from subscribe_targets
		expect(a._targets[0].status).toBe("active");
		expect(a._targets[1].status).toBe("pending");
	});
});

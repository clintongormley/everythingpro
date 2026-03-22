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
		motion_presence: false,
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
				type: "everything_presence_pro/subscribe_grid_targets",
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
				motion_presence: false,
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

describe("_subscribeDisplay", () => {
	it("returns early when hass is not set", () => {
		const el = createPanel();
		const a = el as any;
		el.hass = null;
		a._unsubDisplay = undefined;

		a._subscribeDisplay("e1");

		expect(a._unsubDisplay).toBeUndefined();
	});

	it("returns early when entryId is empty", () => {
		const el = createPanel();
		const a = el as any;
		const subscribeMock = vi.fn().mockResolvedValue(() => {});
		el.hass = {
			callWS: vi.fn(),
			connection: { subscribeMessage: subscribeMock },
		};

		a._subscribeDisplay("");

		expect(subscribeMock).not.toHaveBeenCalled();
	});

	it("calls unsubscribeDisplay before subscribing", () => {
		const el = createPanel();
		const a = el as any;
		const oldUnsub = vi.fn();
		a._unsubDisplay = oldUnsub;

		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockResolvedValue(() => {}),
			},
		};

		a._subscribeDisplay("e1");

		expect(oldUnsub).toHaveBeenCalled();
	});

	it("subscribes to display topic and stores unsub", async () => {
		const el = createPanel();
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
				type: "everything_presence_pro/subscribe_raw_targets",
				entry_id: "e1",
			},
		);

		// Wait for the promise to resolve so _unsubDisplay is set
		await Promise.resolve();

		expect(a._unsubDisplay).toBe(unsubFn);
	});

	it("merges raw positions into existing targets", async () => {
		const el = createPanel();
		const a = el as any;
		let displayHandler: (event: any) => void;
		let callCount = 0;
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					callCount++;
					displayHandler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		// Set up existing targets
		a._targets = [
			{
				x: 100,
				y: 200,
				raw_x: 100,
				raw_y: 200,
				speed: 1,
				status: "active",
				signal: 3,
			},
			{
				x: 300,
				y: 400,
				raw_x: 300,
				raw_y: 400,
				speed: 0,
				status: "inactive",
				signal: 0,
			},
		];

		a._subscribeDisplay("e1");

		// Fire a raw targets event with updated raw positions
		displayHandler!({
			target_count: 2,
			targets: [
				{ raw_x: 111, raw_y: 211 },
				{ raw_x: 311, raw_y: 411 },
			],
		});

		// x, y, signal remain unchanged (come from grid targets)
		expect(a._targets[0].x).toBe(100);
		expect(a._targets[0].y).toBe(200);
		expect(a._targets[0].raw_x).toBe(111);
		expect(a._targets[0].raw_y).toBe(211);
		expect(a._targets[0].signal).toBe(3);
		// Non-raw fields remain unchanged
		expect(a._targets[0].status).toBe("active");
		expect(a._targets[0].speed).toBe(1);

		expect(a._targets[1].raw_x).toBe(311);
		expect(a._targets[1].raw_y).toBe(411);
		expect(a._targets[1].x).toBe(300);
	});

	it("skips merge when raw target index has no match", async () => {
		const el = createPanel();
		const a = el as any;
		let displayHandler: (event: any) => void;
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					displayHandler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		// Two targets but raw targets only provides one
		a._targets = [
			{
				x: 100,
				y: 200,
				raw_x: 100,
				raw_y: 200,
				speed: 1,
				status: "active",
				signal: 3,
			},
			{
				x: 300,
				y: 400,
				raw_x: 300,
				raw_y: 400,
				speed: 0,
				status: "inactive",
				signal: 0,
			},
		];

		a._subscribeDisplay("e1");

		displayHandler!({
			target_count: 1,
			targets: [
				{ raw_x: 111, raw_y: 211 },
				// index 1 is missing — fewer raw targets than grid targets
			],
		});

		// First target raw positions merged
		expect(a._targets[0].raw_x).toBe(111);
		expect(a._targets[0].x).toBe(100);
		// Second target is unchanged because rawTargets[1] is undefined
		expect(a._targets[1].raw_x).toBe(300);
		expect(a._targets[1].raw_y).toBe(400);
	});

	it("handles raw targets event with empty targets array", async () => {
		const el = createPanel();
		const a = el as any;
		let displayHandler: (event: any) => void;
		el.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					displayHandler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._targets = [
			{
				x: 100,
				y: 200,
				raw_x: 100,
				raw_y: 200,
				speed: 1,
				status: "active",
				signal: 3,
			},
		];

		a._subscribeDisplay("e1");

		// Fire event with no targets field (falls back to [])
		displayHandler!({ target_count: 0 });

		// All targets unchanged because rawTargets is empty
		expect(a._targets[0].x).toBe(100);
		expect(a._targets[0].raw_x).toBe(100);
	});
});

describe("_unsubscribeDisplay", () => {
	it("calls and clears _unsubDisplay when set", () => {
		const el = createPanel();
		const a = el as any;
		const unsub = vi.fn();
		a._unsubDisplay = unsub;

		a._unsubscribeDisplay();

		expect(unsub).toHaveBeenCalled();
		expect(a._unsubDisplay).toBeUndefined();
	});

	it("does nothing when _unsubDisplay is not set", () => {
		const el = createPanel();
		const a = el as any;
		a._unsubDisplay = undefined;

		// Should not throw
		expect(() => a._unsubscribeDisplay()).not.toThrow();
		expect(a._unsubDisplay).toBeUndefined();
	});

	it("is called during _unsubscribeTargets", () => {
		const el = createPanel();
		const a = el as any;
		const displayUnsub = vi.fn();
		a._unsubDisplay = displayUnsub;
		a._unsubTargets = vi.fn();
		a._targets = [];

		a._unsubscribeTargets();

		expect(displayUnsub).toHaveBeenCalled();
		expect(a._unsubDisplay).toBeUndefined();
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

describe("raw targets event merging", () => {
	it("merges raw positions into existing targets preserving status and grid fields", () => {
		const el = createPanel();
		const a = el as any;

		// Set up existing targets (as if from subscribe_grid_targets)
		a._targets = [
			{
				x: 10,
				y: 20,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "active",
				signal: 5,
			},
			{
				x: 30,
				y: 40,
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

		// Simulate raw targets event callback
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

		// Fire raw targets event
		callback!({
			target_count: 3,
			targets: [
				{ raw_x: 50, raw_y: 100 },
				{ raw_x: 150, raw_y: 200 },
				{ raw_x: 0, raw_y: 0 },
			],
		});

		// Raw positions updated
		expect(a._targets[0].raw_x).toBe(50);
		expect(a._targets[0].raw_y).toBe(100);
		// Grid fields preserved from subscribe_grid_targets
		expect(a._targets[0].x).toBe(10);
		expect(a._targets[0].y).toBe(20);
		expect(a._targets[0].signal).toBe(5);
		// Status preserved from subscribe_grid_targets
		expect(a._targets[0].status).toBe("active");
		expect(a._targets[1].status).toBe("pending");
		expect(a._targets[1].raw_x).toBe(150);
	});
});

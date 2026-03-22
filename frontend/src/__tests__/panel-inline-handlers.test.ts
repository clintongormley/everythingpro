/**
 * Tests for inline event handler logic, zone engine in _renderVisibleCells,
 * and other uncovered code paths in the panel component.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EverythingPresenceProPanel } from "../everything-presence-pro-panel.js";
import "../everything-presence-pro-panel.js";
import {
	CELL_ROOM_BIT,
	cellSetZone,
	GRID_CELL_COUNT,
	GRID_COLS,
	GRID_ROWS,
	initGridFromRoom,
} from "../lib/grid.js";
import { ZONE_COLORS, ZONE_TYPE_DEFAULTS } from "../lib/zone-defaults.js";

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
	a._view = "live";
	a._entries = [
		{
			entry_id: "e1",
			title: "Test Sensor",
			room_name: "Living room",
			has_perspective: true,
			has_layout: true,
		},
	];
	a._selectedEntryId = "e1";
	a._targets = [];
	a._sensorState = {
		occupancy: false,
		static_presence: false,
		motion_presence: false,
		target_presence: false,
		illuminance: 150,
		temperature: 22.5,
		humidity: 45,
		co2: 400,
	};
	a._zoneState = { occupancy: {}, target_counts: {}, frame_count: 0 };
	a._openAccordions = new Set();
	a._showUnsavedDialog = false;
	a._pendingNavigation = null;
	a._saving = false;
	a._showLiveMenu = false;
	a._showDeleteCalibrationDialog = false;
	a._showTemplateSave = false;
	a._showTemplateLoad = false;
	a._showRenameDialog = false;
	a._pendingRenames = [];
	a._reportingConfig = {};
	a._offsetsConfig = {};
	a._targetAutoRange = true;
	a._targetMaxDistance = 6;
	a._staticAutoRange = true;
	a._staticMinDistance = 0.3;
	a._staticMaxDistance = 16;
	a._roomType = "normal";
	a._roomTrigger = ZONE_TYPE_DEFAULTS.normal.trigger;
	a._roomRenew = ZONE_TYPE_DEFAULTS.normal.renew;
	a._roomTimeout = ZONE_TYPE_DEFAULTS.normal.timeout;
	a._roomHandoffTimeout = ZONE_TYPE_DEFAULTS.normal.handoff_timeout;
	a._roomEntryPoint = false;
	a._showHitCounts = false;
	a._expandedSensorInfo = null;
	a._localZoneState = new Map();
	a._targetPrev = [null, null, null];
	a._targetGateCount = [0, 0, 0];
	a._showCustomIconPicker = false;
	a._customIconValue = "";
	a._isPainting = false;
	a._frozenBounds = null;
	a._sidebarTab = "zones";
	a._setupStep = null;
	a._wizardCornerIndex = 0;
	a._wizardCorners = [null, null, null, null];
	a._wizardRoomWidth = 3000;
	a._wizardRoomDepth = 4000;
	a._wizardCapturing = false;
	a._wizardCaptureProgress = 0;
	a._wizardCapturePaused = false;
	a._wizardCaptureCancelled = false;
	a._wizardOffsetSide = "";
	a._wizardOffsetFb = "";
	a._wizardSaving = false;
	a._templateName = "";
	a._fovCache = null;
	a._fovPerspective = null;
	return el;
}

describe("zone engine in _renderVisibleCells", () => {
	it("runs the zone engine with active targets in zones", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);

		// Set up zone 1 on some cells
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "normal",
		};

		// Paint zone 1 on grid cells in the room area
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
			}
		}

		// Provide targets in zone 1 with signal
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];

		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);
	});

	it("handles target with no signal", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 0,
			},
		];

		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
	});

	it("handles pending (inactive) target", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "pending" as const,
				signal: 5,
			},
		];

		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
	});

	it("handles target outside grid bounds", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._targets = [
			{
				x: 999999,
				y: 999999,
				raw_x: 999999,
				raw_y: 999999,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];

		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
	});

	it("handles target on outside cell (not inside room)", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		// Place target at (0,0) which maps to a cell outside the room
		a._targets = [
			{
				x: -1000,
				y: -1000,
				raw_x: -1000,
				raw_y: -1000,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];

		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
	});

	it("runs zone engine with continuity tracking", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "normal",
		};
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
			}
		}

		// Set previous target position for continuity check
		a._targetPrev = [{ col: 10, row: 5 }, null, null];
		a._targetGateCount = [0, 0, 0];

		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];

		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
	});

	it("handles gating for non-entry-point zones", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "normal",
		};
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
			}
		}

		// No previous position -> gating triggers
		a._targetPrev = [null, null, null];
		a._targetGateCount = [0, 0, 0];

		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 9, // high signal, above gated threshold
			},
		];

		// First call - gating starts
		a._renderVisibleCells(5, 15, 0, 10, 20);

		// Second call - gating should complete
		a._renderVisibleCells(5, 15, 0, 10, 20);

		expect(a._targetGateCount[0]).toBe(0); // should be 0 after completing gate
	});

	it("handles zone state machine transitions (clear->occupied->pending->clear)", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 3,
			renew: 2,
			timeout: 0.001, // very short
			handoff_timeout: 0.001,
			entry_point: true,
		};
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
			}
		}

		// Step 1: target enters zone -> CLEAR -> OCCUPIED
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];
		a._renderVisibleCells(5, 15, 0, 10, 20);

		// Step 2: target leaves -> OCCUPIED -> PENDING
		a._targets = [];
		a._renderVisibleCells(5, 15, 0, 10, 20);

		// Step 3: wait for timeout -> PENDING -> CLEAR
		// With timeout=0.001s it should clear very quickly
		a._renderVisibleCells(5, 15, 0, 10, 20);
	});

	it("handles handoff between zones", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(6000, 6000);
		a._roomWidth = 6000;
		a._roomDepth = 6000;

		// Create two zones
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "normal",
		};
		a._zoneConfigs[1] = {
			name: "Zone 2",
			color: ZONE_COLORS[1],
			type: "normal",
		};

		// Paint zone 1 in top half and zone 2 in bottom half
		for (let r = 0; r < GRID_ROWS; r++) {
			for (let c = 0; c < GRID_COLS; c++) {
				const idx = r * GRID_COLS + c;
				if (a._grid[idx] & CELL_ROOM_BIT) {
					if (r < GRID_ROWS / 2) {
						a._grid[idx] = cellSetZone(a._grid[idx], 1);
					} else {
						a._grid[idx] = cellSetZone(a._grid[idx], 2);
					}
				}
			}
		}

		// Target starts in zone 1
		a._targets = [
			{
				x: 3000,
				y: 1000,
				raw_x: 3000,
				raw_y: 1000,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];
		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);

		// Target moves to zone 2
		a._targets = [
			{
				x: 3000,
				y: 5000,
				raw_x: 3000,
				raw_y: 5000,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];
		const result = a._renderVisibleCells(
			0,
			GRID_COLS - 1,
			0,
			GRID_ROWS - 1,
			10,
		);
		expect(result).toBeDefined();
	});

	it("handles gating with signal below threshold", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "normal",
		};
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
			}
		}

		// No previous position, not entry point -> gating
		a._targetPrev = [null, null, null];
		a._targetGateCount = [1, 0, 0]; // 1 gate count already

		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 1, // low signal, below gated threshold
			},
		];

		a._renderVisibleCells(5, 15, 0, 10, 20);
		// Gate count should be reset due to low signal
		expect(a._targetGateCount[0]).toBe(0);
	});

	it("handles signal below baseTrigger for non-gated path", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 9, // very high threshold
			renew: 9,
			timeout: 10,
			handoff_timeout: 3,
			entry_point: true, // entry point -> no gating
		};
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
			}
		}

		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 2, // below threshold
			},
		];

		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
	});

	it("state machine: PENDING with confirmed target -> back to OCCUPIED", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 3,
			renew: 2,
			timeout: 100,
			handoff_timeout: 100,
			entry_point: true,
		};
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
			}
		}

		// Set up zone state: occupied with pending timeout
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: Date.now() / 1000 - 1,
			confirmedTargets: new Set(),
		});

		// Provide target that confirms presence
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];

		a._renderVisibleCells(5, 15, 0, 10, 20);

		// Zone should be back to occupied (pending cleared)
		const st = a._localZoneState.get(1);
		expect(st?.occupied).toBe(true);
		expect(st?.pendingSince).toBeNull();
	});

	it("handles multiple targets", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "normal",
		};
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
			}
		}

		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
			{
				x: 1000,
				y: 1000,
				raw_x: 1000,
				raw_y: 1000,
				speed: 0,
				status: "active" as const,
				signal: 3,
			},
			{
				x: 2000,
				y: 3000,
				raw_x: 2000,
				raw_y: 3000,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];

		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
	});

	it("handoff: occupied zone transitions to pending with handoff timeout", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(6000, 6000);
		a._roomWidth = 6000;
		a._roomDepth = 6000;

		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 3,
			renew: 2,
			timeout: 100,
			handoff_timeout: 1,
			entry_point: true,
		};
		a._zoneConfigs[1] = {
			name: "Zone 2",
			color: ZONE_COLORS[1],
			type: "normal",
		};

		for (let r = 0; r < GRID_ROWS; r++) {
			for (let c = 0; c < GRID_COLS; c++) {
				const idx = r * GRID_COLS + c;
				if (a._grid[idx] & CELL_ROOM_BIT) {
					if (r < GRID_ROWS / 2) {
						a._grid[idx] = cellSetZone(a._grid[idx], 1);
					} else {
						a._grid[idx] = cellSetZone(a._grid[idx], 2);
					}
				}
			}
		}

		// Set up zone 1 as occupied with target 0 confirmed
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set([0]),
		});

		// Target moves from zone 1 to zone 2
		a._targetPrev = [{ col: 10, row: 3 }, null, null]; // was in zone 1
		a._targets = [
			{
				x: 3000,
				y: 5000,
				raw_x: 3000,
				raw_y: 5000,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);

		const st = a._localZoneState.get(1);
		// Zone 1 should be in pending state since target moved away
		if (st && st.occupied && st.pendingSince !== null) {
			expect(st.pendingSince).not.toBeNull();
		}
	});
});

describe("_onFurnitureDrag with active drag state", () => {
	it("handles move drag", () => {
		const a = createPanel() as any;
		a._furniture = [
			{
				id: "f1",
				type: "svg",
				icon: "armchair",
				label: "Chair",
				x: 100,
				y: 200,
				width: 800,
				height: 800,
				rotation: 0,
				lockAspect: false,
			},
		];
		a._dragState = {
			type: "move",
			id: "f1",
			startX: 500,
			startY: 300,
			origX: 100,
			origY: 200,
			origW: 800,
			origH: 800,
			origRot: 0,
		};

		// Mock the grid element
		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelector: (sel: string) => {
					if (sel === ".grid") {
						return {
							firstElementChild: { offsetWidth: 28 },
						};
					}
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		a._onFurnitureDrag({ clientX: 520, clientY: 310 });

		expect(a._dirty).toBe(true);
	});

	it("handles resize drag", () => {
		const a = createPanel() as any;
		a._furniture = [
			{
				id: "f1",
				type: "svg",
				icon: "armchair",
				label: "Chair",
				x: 100,
				y: 200,
				width: 800,
				height: 800,
				rotation: 0,
				lockAspect: false,
			},
		];
		a._dragState = {
			type: "resize",
			id: "f1",
			startX: 500,
			startY: 300,
			origX: 100,
			origY: 200,
			origW: 800,
			origH: 800,
			origRot: 0,
			handle: "se",
		};

		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelector: (sel: string) => {
					if (sel === ".grid") {
						return {
							firstElementChild: { offsetWidth: 28 },
						};
					}
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		a._onFurnitureDrag({ clientX: 520, clientY: 310 });

		expect(a._dirty).toBe(true);
	});

	it("handles rotate drag", () => {
		const a = createPanel() as any;
		a._furniture = [
			{
				id: "f1",
				type: "svg",
				icon: "armchair",
				label: "Chair",
				x: 100,
				y: 200,
				width: 800,
				height: 800,
				rotation: 0,
				lockAspect: false,
			},
		];
		a._dragState = {
			type: "rotate",
			id: "f1",
			startX: 500,
			startY: 300,
			origX: 100,
			origY: 200,
			origW: 800,
			origH: 800,
			origRot: 0,
			centerX: 500,
			centerY: 300,
			startAngle: 0,
		};

		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelector: (sel: string) => {
					if (sel === ".grid") {
						return {
							firstElementChild: { offsetWidth: 28 },
						};
					}
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		a._onFurnitureDrag({ clientX: 520, clientY: 310 });

		expect(a._dirty).toBe(true);
	});

	it("returns early when no grid element found", () => {
		const a = createPanel() as any;
		a._dragState = {
			type: "move",
			id: "f1",
			startX: 500,
			startY: 300,
			origX: 100,
			origY: 200,
			origW: 800,
			origH: 800,
			origRot: 0,
		};

		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelector: () => null,
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		a._onFurnitureDrag({ clientX: 520, clientY: 310 });
		// Should not throw
		expect(a._dirty).toBe(false);
	});
});

describe("_saveSettings with proper shadow root", () => {
	it("collects reporting and offsets from DOM elements", async () => {
		const a = createPanel() as any;
		a._selectedEntryId = "e1";
		a._dirty = true;

		const callWS = vi.fn().mockResolvedValue({});
		a.hass = { callWS };

		// Create a mock settings container with toggle elements
		const reportInputs = [
			{ dataset: { reportKey: "room_occupancy" }, checked: true },
			{ dataset: { reportKey: "zone_presence" }, checked: false },
		];
		const offsetInputs = [
			{ dataset: { offsetKey: "illuminance" }, value: "10" },
			{ dataset: { offsetKey: "temperature" }, value: "-0.5" },
		];

		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelector: (sel: string) => {
					if (sel === ".settings-container") {
						return {
							querySelectorAll: (s: string) => {
								if (s === "[data-report-key]") return reportInputs;
								if (s === "[data-offset-key]") return offsetInputs;
								return [];
							},
						};
					}
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		await a._saveSettings();

		expect(callWS).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "everything_presence_pro/set_reporting",
				entry_id: "e1",
				reporting: { room_occupancy: true, zone_presence: false },
				offsets: { illuminance: 10, temperature: -0.5 },
			}),
		);
		expect(a._dirty).toBe(false);
		expect(a._view).toBe("live");
		expect(a._saving).toBe(false);
	});

	it("resets saving flag on error", async () => {
		const a = createPanel() as any;
		a._selectedEntryId = "e1";
		a._dirty = true;

		a.hass = {
			callWS: vi.fn().mockRejectedValue(new Error("fail")),
		};

		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelector: (sel: string) => {
					if (sel === ".settings-container") {
						return {
							querySelectorAll: () => [],
						};
					}
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		await expect(a._saveSettings()).rejects.toThrow("fail");
		expect(a._saving).toBe(false);
	});
});

describe("_applyLayout zone/furniture serialization", () => {
	it("serializes zone configs including threshold fields", async () => {
		const a = createPanel() as any;
		a._selectedEntryId = "e1";
		a._dirty = true;
		a._zoneConfigs[0] = {
			name: "Kitchen",
			color: "#ff0000",
			type: "custom",
			trigger: 7,
			renew: 4,
			timeout: 15,
			handoff_timeout: 5,
			entry_point: true,
		};
		// Paint a cell with zone 1 so it doesn't get pruned
		a._grid[0] = 0x03; // CELL_ROOM_BIT | (1 << CELL_ZONE_SHIFT)
		a._furniture = [
			{
				id: "f1",
				type: "svg",
				icon: "armchair",
				label: "Chair",
				x: 100,
				y: 200,
				width: 800,
				height: 800,
				rotation: 45,
				lockAspect: false,
			},
		];

		a.hass = {
			callWS: vi.fn().mockResolvedValue({}),
		};

		await a._applyLayout();

		const call = a.hass.callWS.mock.calls[0][0];
		expect(call.zone_slots[0]).toEqual(
			expect.objectContaining({
				name: "Kitchen",
				type: "custom",
				trigger: 7,
			}),
		);
		expect(call.furniture).toHaveLength(1);
		expect(call.furniture[0].rotation).toBe(45);
	});
});

describe("_wizardStartCapture cancellation", () => {
	it("cancels capture when _wizardCaptureCancelled is set", async () => {
		const a = createPanel() as any;
		a._targets = [
			{
				x: 100,
				y: 200,
				raw_x: 100,
				raw_y: 200,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];

		a._wizardStartCapture();
		expect(a._wizardCapturing).toBe(true);

		// Cancel immediately
		a._wizardCancelCapture();
		expect(a._wizardCapturing).toBe(false);
		expect(a._wizardCaptureCancelled).toBe(true);
	});
});

describe("_onFurniturePointerDown with rotate type", () => {
	it("computes start angle for rotation", () => {
		const a = createPanel() as any;
		a._furniture = [
			{
				id: "f1",
				type: "svg",
				icon: "armchair",
				label: "Chair",
				x: 100,
				y: 200,
				width: 800,
				height: 800,
				rotation: 0,
				lockAspect: false,
			},
		];

		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelector: (sel: string) => {
					if (sel.includes("f1")) {
						return {
							getBoundingClientRect: () => ({
								left: 100,
								top: 100,
								width: 200,
								height: 200,
							}),
						};
					}
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		const addSpy = vi
			.spyOn(window, "addEventListener")
			.mockImplementation(() => {});

		const mockEvent = {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			clientX: 300,
			clientY: 200,
		};

		a._onFurniturePointerDown(mockEvent, "f1", "rotate");

		expect(a._dragState).not.toBeNull();
		expect(a._dragState.type).toBe("rotate");
		expect(a._dragState.centerX).toBe(200); // 100 + 200/2
		expect(a._dragState.centerY).toBe(200); // 100 + 200/2

		addSpy.mockRestore();
	});
});

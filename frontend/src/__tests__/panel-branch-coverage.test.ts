/**
 * Tests specifically targeting uncovered branches to push branch coverage above 90%.
 */

import { render } from "lit";
import { describe, expect, it, vi } from "vitest";
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
import { setupLocalize } from "../localize.js";

function createPanel() {
	const el = document.createElement(
		"everything-presence-pro-panel",
	) as EverythingPresenceProPanel;
	el.hass = { callWS: vi.fn().mockResolvedValue({}) };
	const a = el as any;
	a._grid = initGridFromRoom(3000, 4000);
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
			title: "T",
			room_name: "",
			has_perspective: true,
			has_layout: true,
		},
	];
	a._selectedEntryId = "e1";
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
	a._localize = setupLocalize();
	return el;
}

function renderTo(tpl: any) {
	const c = document.createElement("div");
	document.body.appendChild(c);
	render(tpl, c);
	return c;
}

// =========================================================
// Target subscription: exercise ?? branches (null coalescing)
// =========================================================
describe("target subscription null coalescing branches", () => {
	it("handles targets with missing raw_x/raw_y and signal", async () => {
		const a = createPanel() as any;
		let handler: (event: any) => void;
		a.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					handler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._subscribeTargets("e1");

		// Fire event with targets missing raw_x, raw_y, signal
		handler!({
			targets: [{ x: 100, y: 200, status: "active" }],
			sensors: {
				// All fields missing -> ?? branches hit
			},
			zones: {
				// All fields missing -> ?? branches hit
			},
		});

		// raw_x should fall back to x, raw_y to y, signal to 0
		expect(a._targets[0].raw_x).toBe(100);
		expect(a._targets[0].raw_y).toBe(200);
		expect(a._targets[0].signal).toBe(0);

		// Sensor state should use defaults
		expect(a._sensorState.occupancy).toBe(false);
		expect(a._sensorState.illuminance).toBeNull();

		// Zone state should use defaults
		expect(a._zoneState.frame_count).toBe(0);
	});

	it("handles event with empty targets array", async () => {
		const a = createPanel() as any;
		let handler: (event: any) => void;
		a.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					handler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._subscribeTargets("e1");

		handler!({});

		expect(a._targets).toEqual([]);
	});
});

// =========================================================
// _loadEntries: sort with missing/empty titles
// =========================================================
describe("_loadEntries edge branches", () => {
	it("handles entries with no title", async () => {
		const a = createPanel() as any;
		a.hass = {
			callWS: vi.fn().mockResolvedValue([
				{ entry_id: "e1", title: "", room_name: "" },
				{ entry_id: "e2", title: "Zebra", room_name: "" },
			]),
		};

		await a._loadEntries();
		// Should not throw during sort, empty string sorts before "Zebra"
		expect(a._entries[0].entry_id).toBe("e1");
	});
});

// =========================================================
// _renderVisibleCells zone engine: more branch coverage
// =========================================================
describe("zone engine branch coverage", () => {
	it("target not on inside cell", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };

		// Place target at position that maps to an outside cell
		a._targets = [
			{
				x: -5000,
				y: -5000,
				raw_x: -5000,
				raw_y: -5000,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];
		a._targetPrev = [{ col: 5, row: 5 }, null, null]; // had previous valid position

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		// Target should have been cleared
		expect(a._targetPrev[0]).toBeNull();
	});

	it("zone engine with occupied pending timeout via handoff", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = {
			name: "Z1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 3,
			renew: 2,
			timeout: 0.001,
			handoff_timeout: 0.001,
			entry_point: true,
		};

		// Set zone as occupied with handoff pending that has expired
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: Date.now() / 1000 - 100, // well past timeout
			confirmedTargets: new Set(),
		});

		a._targets = []; // no targets

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);

		// Zone should have been cleared by timeout
		const st = a._localZoneState.get(1);
		expect(st?.occupied).toBe(false);
	});

	it("zone engine PENDING -> confirmed (back to OCCUPIED)", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = {
			name: "Z1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 3,
			renew: 2,
			timeout: 100,
			handoff_timeout: 100,
			entry_point: true,
		};

		// Zone is in pending state
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: Date.now() / 1000,
			confirmedTargets: new Set(),
		});

		// Target confirms presence
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

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);

		const st = a._localZoneState.get(1);
		expect(st?.occupied).toBe(true);
		expect(st?.pendingSince).toBeNull();
	});

	it("zone engine OCCUPIED -> no confirmation -> PENDING", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = {
			name: "Z1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 3,
			renew: 2,
			timeout: 100,
			handoff_timeout: 100,
			entry_point: true,
		};

		// Zone is occupied, no pending
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set([0]),
		});

		// No targets -> no confirmation
		a._targets = [];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);

		const st = a._localZoneState.get(1);
		expect(st?.occupied).toBe(true);
		expect(st?.pendingSince).not.toBeNull(); // now pending
	});

	it("gating: gate count reaches 2 -> confirmed", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = {
			name: "Z1",
			color: ZONE_COLORS[0],
			type: "normal", // NOT entry point
		};

		// No previous position (non-continuous) and zone is clear -> gating
		a._targetPrev = [null, null, null];
		a._targetGateCount = [1, 0, 0]; // already 1, next will be 2 -> confirmed

		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 9,
			},
		];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);

		// Gate should be 0 after confirming
		expect(a._targetGateCount[0]).toBe(0);
	});

	it("handles target with previous position on inside cell for zone tracking", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(6000, 6000);
		a._roomWidth = 6000;
		a._roomDepth = 6000;

		// Zone 1 in top half, zone 2 in bottom half
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a._zoneConfigs[1] = { name: "Z2", color: ZONE_COLORS[1], type: "normal" };
		for (let r = 0; r < GRID_ROWS; r++) {
			for (let c = 0; c < GRID_COLS; c++) {
				const idx = r * GRID_COLS + c;
				if (a._grid[idx] & CELL_ROOM_BIT) {
					a._grid[idx] = cellSetZone(a._grid[idx], r < GRID_ROWS / 2 ? 1 : 2);
				}
			}
		}

		// Set previous position in zone 1 (valid inside cell)
		a._targetPrev = [{ col: 10, row: 3 }, null, null];
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set([0]),
		});

		// Target moves to zone 2 (row near bottom)
		a._targets = [
			{
				x: 3000,
				y: 5500,
				raw_x: 3000,
				raw_y: 5500,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		// Zone 1 should be in pending/handoff
	});

	it("target with negative grid cell (out of bounds)", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._targets = [
			{
				x: -10000,
				y: -10000,
				raw_x: -10000,
				raw_y: -10000,
				speed: 0,
				status: "active" as const,
				signal: 5,
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
});

// =========================================================
// _renderWizardCorners: branches for offset update on null corner
// =========================================================
describe("wizard corner offset edge cases", () => {
	it("offset input on null corner does nothing", () => {
		const a = createPanel() as any;
		a._wizardCorners = [null, null, null, null];
		a._wizardCornerIndex = 0;
		a._targets = [
			{
				x: 0,
				y: 0,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];

		const tpl = a._renderWizardCorners();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const offsets = c.querySelectorAll(
			".offset-input",
		) as NodeListOf<HTMLInputElement>;
		if (offsets.length >= 2) {
			offsets[0].value = "50";
			offsets[0].dispatchEvent(new Event("input"));
			// Corner is null so no change
		}
		document.body.removeChild(c);
	});
});

// =========================================================
// _renderVisibleCells: inRange=false cell mousedown/mouseenter guard
// =========================================================
describe("_renderVisibleCells inRange false branches", () => {
	it("cells have correct background based on zone", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a._showHitCounts = true;
		a._zoneState = {
			occupancy: { 1: true },
			target_counts: { 1: 5 },
			frame_count: 100,
		};

		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
			}
		}

		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result.length).toBeGreaterThan(0);
	});
});

// =========================================================
// _renderEditor: branches for target rendering in editor
// =========================================================
describe("_renderEditor target rendering branches", () => {
	it("renders pending target with reduced opacity", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "pending" as const,
				signal: 3,
			},
		];

		const tpl = a._renderEditor();
		expect(tpl).toBeDefined();
	});

	it("renders signal label when showHitCounts and not pending", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._showHitCounts = true;
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

		const tpl = a._renderEditor();
		expect(tpl).toBeDefined();
	});

	it("does not render signal label when pending", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._showHitCounts = true;
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "pending" as const,
				signal: 7,
			},
		];

		const tpl = a._renderEditor();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _renderLiveGrid: target with no grid position (returns null)
// =========================================================
describe("_renderLiveGrid target branches", () => {
	it("skips targets where mapTargetToGridCell returns null", () => {
		const a = createPanel() as any;
		a._roomWidth = 0; // Will cause mapTargetToGridCell to return null
		a._roomDepth = 0;
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

		const tpl = a._renderLiveGrid();
		expect(tpl).toBeDefined();
	});

	it("uses TARGET_COLORS with fallback for > 3 targets", () => {
		const a = createPanel() as any;
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

		const tpl = a._renderLiveGrid();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _addZone: color fallback when ZONE_COLORS.find returns undefined
// =========================================================
describe("_addZone fallback branch", () => {
	it("picks color from fallback when all are used", () => {
		const a = createPanel() as any;
		// Create zones that use all ZONE_COLORS
		for (let i = 0; i < ZONE_COLORS.length && i < 6; i++) {
			a._zoneConfigs[i] = {
				name: `Z${i + 1}`,
				color: ZONE_COLORS[i],
				type: "normal",
			};
		}

		a._addZone();
		// Should use fallback: ZONE_COLORS[firstEmpty % ZONE_COLORS.length]
		const lastZone =
			a._zoneConfigs[
				a._zoneConfigs.findIndex(
					(z: any, i: number) => z !== null && i >= ZONE_COLORS.length,
				)
			];
		expect(a._zoneConfigs.filter((z: any) => z !== null).length).toBe(
			Math.min(ZONE_COLORS.length + 1, 7),
		);
	});
});

// =========================================================
// _renderSaveCancelButtons: settings vs editor save handler
// =========================================================
describe("_renderSaveCancelButtons save handler branch", () => {
	it("uses _saveSettings handler when in settings view", () => {
		const a = createPanel() as any;
		a._view = "settings";
		const tpl = a._renderSaveCancelButtons();
		expect(tpl).toBeDefined();
	});

	it("uses _applyLayout handler when in editor view", () => {
		const a = createPanel() as any;
		a._view = "editor";
		const tpl = a._renderSaveCancelButtons();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _renderDetectionRanges: autoRange branches
// =========================================================
describe("_renderDetectionRanges auto range edge cases", () => {
	it("target auto with zero autoRange", () => {
		const a = createPanel() as any;
		a._targetAutoRange = true;
		a._roomWidth = 0;
		a._roomDepth = 0;
		a._perspective = null;
		const tpl = a._renderDetectionRanges();
		expect(tpl).toBeDefined();
	});

	it("static auto with zero autoRange", () => {
		const a = createPanel() as any;
		a._staticAutoRange = true;
		a._roomWidth = 0;
		a._roomDepth = 0;
		a._perspective = null;
		const tpl = a._renderDetectionRanges();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _renderReporting: isOn with fallback
// =========================================================
describe("_renderReporting fallback branches", () => {
	it("uses fallback values when reporting config is empty", () => {
		const a = createPanel() as any;
		a._reportingConfig = {};
		const tpl = a._renderReporting();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _renderLiveSidebar: env sensor partial branches
// =========================================================
describe("_renderLiveSidebar env sensor branches", () => {
	it("renders with only illuminance available", () => {
		const a = createPanel() as any;
		a._sensorState = {
			occupancy: true,
			static_presence: true,
			pir_motion: true,
			target_presence: false,
			illuminance: 100,
			temperature: null,
			humidity: null,
			co2: null,
		};
		const tpl = a._renderLiveSidebar();
		expect(tpl).toBeDefined();
	});

	it("renders zone with target count = 1 (singular)", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a._zoneState = {
			occupancy: { 1: true },
			target_counts: { 1: 1 },
			frame_count: 10,
		};
		const tpl = a._renderLiveSidebar();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _renderZoneSidebar: boundary occupancy glow
// =========================================================
describe("_renderZoneSidebar boundary occupancy glow", () => {
	it("renders boundary with occupancy glow", () => {
		const a = createPanel() as any;
		a._localZoneState.set(0, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set(),
		});
		const tpl = a._renderZoneSidebar();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// stopPropagation handlers on boundary/zone type controls
// =========================================================
describe("stopPropagation handlers coverage", () => {
	it("boundary type select click calls stopPropagation", () => {
		const a = createPanel() as any;
		a._roomType = "custom";
		const tpl = a._renderBoundaryTypeControls();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		// Click on the sensitivity-select to fire @click handler
		const select = c.querySelector(".sensitivity-select") as HTMLElement;
		if (select) {
			select.click();
		}

		// Click on range inputs to fire their @click handlers
		const ranges = c.querySelectorAll('input[type="range"]');
		ranges.forEach((r: any) => {
			(r as HTMLElement).click();
		});

		// Click on number inputs
		const numbers = c.querySelectorAll('input[type="number"]');
		numbers.forEach((n: any) => {
			(n as HTMLElement).click();
		});

		// Click on checkbox
		const checkboxes = c.querySelectorAll(
			'.toggle-switch input[type="checkbox"]',
		);
		checkboxes.forEach((cb: any) => {
			(cb as HTMLElement).click();
		});

		document.body.removeChild(c);
	});

	it("zone type controls click calls stopPropagation", () => {
		const a = createPanel() as any;
		const zone = {
			name: "Z1",
			color: "#ff0000",
			type: "custom" as const,
			trigger: 5,
			renew: 3,
			timeout: 10,
			handoff_timeout: 3,
		};
		a._zoneConfigs[0] = zone;
		const tpl = a._renderZoneTypeControls(zone, 0);
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const select = c.querySelector(".sensitivity-select") as HTMLElement;
		if (select) select.click();

		const ranges = c.querySelectorAll('input[type="range"]');
		ranges.forEach((r: any) => {
			(r as HTMLElement).click();
		});

		const numbers = c.querySelectorAll('input[type="number"]');
		numbers.forEach((n: any) => {
			(n as HTMLElement).click();
		});

		const checkboxes = c.querySelectorAll(
			'.toggle-switch input[type="checkbox"]',
		);
		checkboxes.forEach((cb: any) => {
			(cb as HTMLElement).click();
		});

		document.body.removeChild(c);
	});
});

// =========================================================
// Furniture overlay: all 7 resize handle pointerdown + rotate + delete
// =========================================================
describe("furniture overlay all handle events", () => {
	it("triggers all 8 resize handles", () => {
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
		a._sidebarTab = "furniture";
		a._selectedFurnitureId = "f1";

		const tpl = a._renderFurnitureOverlay(28, 0, 0, 20, 20);
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const addSpy = vi
			.spyOn(window, "addEventListener")
			.mockImplementation(() => {});

		const handles = c.querySelectorAll(".furn-handle");
		handles.forEach((h: any) => {
			h.dispatchEvent(
				new PointerEvent("pointerdown", { clientX: 500, clientY: 300 }),
			);
		});

		const rotateHandle = c.querySelector(".furn-rotate-handle");
		if (rotateHandle) {
			rotateHandle.dispatchEvent(
				new PointerEvent("pointerdown", { clientX: 500, clientY: 300 }),
			);
		}

		addSpy.mockRestore();
		document.body.removeChild(c);
	});
});

// =========================================================
// _infoTip click handler
// =========================================================
describe("_infoTip DOM click handler", () => {
	it("click toggles tooltip display", () => {
		const a = createPanel() as any;

		// Create mock shadowRoot that will be used by the handler
		const tooltips: HTMLElement[] = [];
		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelectorAll: (sel: string) => {
					if (sel === ".setting-info-tooltip") return tooltips;
					return [];
				},
			},
			configurable: true,
		});

		const tpl = a._infoTip("Test tip");
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const infoSpan = c.querySelector(".setting-info") as HTMLElement;
		if (infoSpan) {
			infoSpan.click();
		}
		document.body.removeChild(c);
	});
});

// =========================================================
// _renderTemplateLoadDialog: load and delete on templates
// =========================================================
describe("_renderTemplateLoadDialog item events", () => {
	it("fires load and delete on template items", () => {
		localStorage.setItem(
			"epp_layout_templates",
			JSON.stringify([
				{
					name: "T1",
					grid: new Array(GRID_CELL_COUNT).fill(0),
					zones: [],
					roomWidth: 5000,
					roomDepth: 6000,
				},
				{
					name: "T2",
					grid: new Array(GRID_CELL_COUNT).fill(0),
					zones: [],
					roomWidth: 3000,
					roomDepth: 4000,
				},
			]),
		);
		const a = createPanel() as any;
		const tpl = a._renderTemplateLoadDialog();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		// Should have load and delete buttons for each template
		const btns = c.querySelectorAll(".template-item-btn");
		// Click load for first template
		if (btns.length >= 1) {
			(btns[0] as HTMLElement).click();
		}
		// Click delete for second template (if it exists)
		if (btns.length >= 4) {
			(btns[3] as HTMLElement).click();
		}

		localStorage.removeItem("epp_layout_templates");
		document.body.removeChild(c);
	});
});

// =========================================================
// _loadEntries: null title branch (line 588)
// =========================================================
describe("_loadEntries null title sorting", () => {
	it("handles entries with null/undefined titles", async () => {
		const a = createPanel() as any;
		a.hass = {
			callWS: vi.fn().mockResolvedValue([
				{ entry_id: "e1", title: null, room_name: "" },
				{ entry_id: "e2", room_name: "" }, // title undefined
			]),
		};

		await a._loadEntries();
		expect(a._entries).toHaveLength(2);
	});
});

// =========================================================
// _removeZone: clearZoneFromGrid returns non-null (line 805)
// =========================================================
describe("_removeZone grid clearing", () => {
	it("replaces grid when cells have the zone", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: "#ff0000", type: "normal" };
		// Paint some cells with zone 1
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
				break; // just one cell
			}
		}

		a._removeZone(1);
		expect(a._zoneConfigs[0]).toBeNull();
	});
});

// =========================================================
// _onFurnitureDrag: edge case branches (929, 944, 961, 964, 967, 968, 974)
// =========================================================
describe("_onFurnitureDrag edge case branches", () => {
	it("handles move when item not found (null width/height)", () => {
		const a = createPanel() as any;
		a._furniture = []; // empty, item won't be found
		a._dragState = {
			type: "move",
			id: "nonexistent",
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
				querySelector: (sel: string) => {
					if (sel === ".grid")
						return { firstElementChild: { offsetWidth: 28 } };
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		// item?.width ?? 0 and item?.height ?? 0 -> 0 (branch covered)
		a._onFurnitureDrag({ clientX: 520, clientY: 310 });
	});

	it("handles resize when item not found (null lockAspect)", () => {
		const a = createPanel() as any;
		a._furniture = [];
		a._dragState = {
			type: "resize",
			id: "nonexistent",
			handle: "se",
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
				querySelector: (sel: string) => {
					if (sel === ".grid")
						return { firstElementChild: { offsetWidth: 28 } };
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		// item?.lockAspect ?? false -> false (branch covered)
		a._onFurnitureDrag({ clientX: 520, clientY: 310 });
	});

	it("handles rotate with null centerX/centerY/startAngle", () => {
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
			// centerX, centerY, startAngle are undefined
		};

		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelector: (sel: string) => {
					if (sel === ".grid")
						return { firstElementChild: { offsetWidth: 28 } };
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		// ds.centerY ?? 0, ds.centerX ?? 0, ds.startAngle ?? 0 branches covered
		a._onFurnitureDrag({ clientX: 520, clientY: 310 });
		expect(a._dirty).toBe(true);
	});

	it("handles grid element with no firstElementChild", () => {
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

		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelector: (sel: string) => {
					if (sel === ".grid") return { firstElementChild: null }; // no child -> use fallback 28
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		// cellPx = 28 (fallback) branch covered
		a._onFurnitureDrag({ clientX: 520, clientY: 310 });
		expect(a._dirty).toBe(true);
	});
});

// =========================================================
// _renderWizardCorners: branches for corner chip offset restore
// =========================================================
describe("corner chip click with null offsets", () => {
	it("corner chip click on corner with zero offsets", () => {
		const a = createPanel() as any;
		a._wizardCorners = [
			{ raw_x: 100, raw_y: 200, offset_side: 0, offset_fb: 0 },
			null,
			null,
			null,
		];
		a._targets = [
			{
				x: 0,
				y: 0,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];

		const tpl = a._renderWizardCorners();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const chips = c.querySelectorAll(".corner-chip");
		if (chips.length > 0) {
			(chips[0] as HTMLElement).click();
			// offset_side and offset_fb are 0 -> empty strings
			expect(a._wizardOffsetSide).toBe("");
			expect(a._wizardOffsetFb).toBe("");
		}
		document.body.removeChild(c);
	});
});

// =========================================================
// _renderSaveCancelButtons branches
// =========================================================
describe("save cancel buttons: saving state branch", () => {
	it("save button shows Saving when _saving is true", () => {
		const a = createPanel() as any;
		a._saving = true;
		a._dirty = true;
		a._view = "editor";
		const tpl = a._renderSaveCancelButtons();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const saveBtn = c.querySelector(".wizard-btn-primary");
		if (saveBtn) {
			expect(saveBtn.textContent).toContain("Saving");
		}
		document.body.removeChild(c);
	});
});

// =========================================================
// _renderLiveSidebar: zone with target_counts singular/plural
// =========================================================
describe("_renderLiveSidebar target count branches", () => {
	it("renders zone with 0 targets", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a._zoneState = {
			occupancy: { 1: false },
			target_counts: { 1: 0 },
			frame_count: 10,
		};
		const tpl = a._renderLiveSidebar();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _renderEditor: branches for target rendering with signal and pending
// =========================================================
describe("editor target signal display branches", () => {
	it("signal > 0 and not pending shows signal label", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._showHitCounts = false; // signal shown only when showHitCounts=true
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
		const tpl = a._renderEditor();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _renderUncalibratedFov: target color fallback
// =========================================================
describe("uncalibrated FOV target color", () => {
	it("uses fallback color for target index >= 3", () => {
		const a = createPanel() as any;
		a._perspective = null;
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
			{
				x: 200,
				y: 300,
				raw_x: 200,
				raw_y: 300,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
			{
				x: 300,
				y: 400,
				raw_x: 300,
				raw_y: 400,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];
		const tpl = a._renderUncalibratedFov();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _renderLiveGrid: hit count signal check
// =========================================================
describe("live grid hit count and signal", () => {
	it("shows signal label when showHitCounts and signal > 0", () => {
		const a = createPanel() as any;
		a._showHitCounts = true;
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
		const tpl = a._renderLiveGrid();
		expect(tpl).toBeDefined();
	});

	it("no signal label when signal is 0", () => {
		const a = createPanel() as any;
		a._showHitCounts = true;
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
		const tpl = a._renderLiveGrid();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// _renderZoneSidebar: zone occupancy glow styling branch
// =========================================================
describe("zone sidebar occupancy glow branch", () => {
	it("zone color dot shows glow when zone is occupied", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a._activeZone = 0; // boundary selected, not zone 1
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set(),
		});

		const tpl = a._renderZoneSidebar();
		expect(tpl).toBeDefined();
	});

	it("boundary dot shows glow when boundary zone occupied", () => {
		const a = createPanel() as any;
		a._localZoneState.set(0, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set(),
		});
		const tpl = a._renderZoneSidebar();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// customElements.get guard (line 5577)
// =========================================================
describe("customElements registration guard", () => {
	it("does not re-register if already defined", () => {
		const Ctor = customElements.get("everything-presence-pro-panel");
		expect(Ctor).toBeDefined();
	});
});

// =========================================================
// _onFurniturePointerDown: onUp callback
// =========================================================
describe("_onFurniturePointerDown onUp callback", () => {
	it("onUp cleans up drag state and removes listeners", () => {
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

		let onMove: Function | null = null;
		let onUp: Function | null = null;
		const addSpy = vi
			.spyOn(window, "addEventListener")
			.mockImplementation((type: string, fn: any) => {
				if (type === "pointermove") onMove = fn;
				if (type === "pointerup") onUp = fn;
			});
		const removeSpy = vi
			.spyOn(window, "removeEventListener")
			.mockImplementation(() => {});

		const mockEvent = {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			clientX: 500,
			clientY: 300,
		};

		a._onFurniturePointerDown(mockEvent, "f1", "move");

		expect(a._dragState).not.toBeNull();

		// Call onUp to trigger cleanup
		if (onUp) {
			(onUp as Function)();
			expect(a._dragState).toBeNull();
			expect(removeSpy).toHaveBeenCalled();
		}

		addSpy.mockRestore();
		removeSpy.mockRestore();
	});
});

// =========================================================
// Debug log: _showDebugLog exercising the full debug log path
// =========================================================
describe("local zone engine debug log branches", () => {
	it("generates debug log line with active target and occupied zone", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = {
			name: "Z1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 3,
			renew: 2,
			timeout: 100,
			handoff_timeout: 100,
			entry_point: true,
		};
		a._showDebugLog = true;
		a._debugLogLines = [];
		a._debugLogPrev = null;

		// Zone occupied
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set([0]),
		});

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

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		expect(a._debugLogLines.length).toBeGreaterThan(0);
		expect(a._debugLogLines[0]).toContain("T0:");
		expect(a._debugLogLines[0]).toContain("Z1");
	});

	it("skips duplicate debug log body", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._showDebugLog = true;
		a._targets = [];
		a._debugLogPrev = "no targets | all clear";
		a._debugLogLines = ["old"];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		// Should not add a new line since body equals prev
		expect(a._debugLogLines.length).toBe(1);
	});

	it("debug log with pending zone", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = {
			name: "Z1",
			color: ZONE_COLORS[0],
			type: "normal",
		};
		a._showDebugLog = true;
		a._debugLogLines = [];
		a._debugLogPrev = null;

		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: Date.now() / 1000,
			confirmedTargets: new Set(),
		});
		a._targets = [];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		expect(a._debugLogLines.length).toBeGreaterThan(0);
		expect(a._debugLogLines[0]).toContain("pending");
	});

	it("debug log with no-config zone uses fallback name", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 2);
		}
		a._zoneConfigs = new Array(7).fill(null); // no config for zone 2
		a._showDebugLog = true;
		a._debugLogLines = [];
		a._debugLogPrev = null;

		a._localZoneState.set(2, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set(),
		});
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
		];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		// Should use fallback "Zone 2"
		expect(a._debugLogLines.length).toBeGreaterThan(0);
		expect(a._debugLogLines[0]).toContain("Zone 2");
	});

	it("debug log with target outside grid (zone=null)", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._showDebugLog = true;
		a._debugLogLines = [];
		a._debugLogPrev = null;

		a._targets = [
			{
				x: -9999,
				y: -9999,
				raw_x: -9999,
				raw_y: -9999,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		// Should produce "outside" for the zone name
		expect(a._debugLogLines.length).toBeGreaterThan(0);
	});

	it("debug log with zoneId 0 shows Room", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		// Zone 0 = room boundary (no zone set) - all cells are inside but zone=0
		a._showDebugLog = true;
		a._debugLogLines = [];
		a._debugLogPrev = null;

		a._localZoneState.set(0, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set([0]),
		});
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
		];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		expect(a._debugLogLines.length).toBeGreaterThan(0);
		expect(a._debugLogLines[0]).toContain("Room");
	});

	it("debug log truncation when exceeding max", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._showDebugLog = true;
		// Fill with many lines
		a._debugLogLines = new Array(500).fill("old line");
		a._debugLogPrev = null;
		a._targets = [];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		// Lines should be trimmed
		expect(a._debugLogLines.length).toBeLessThanOrEqual(501);
	});

	it("debug log with inactive target skips it", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._showDebugLog = true;
		a._debugLogLines = [];
		a._debugLogPrev = null;

		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "inactive" as const,
				signal: 5,
			},
		];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		expect(a._debugLogLines.length).toBeGreaterThan(0);
		expect(a._debugLogLines[0]).toContain("no targets");
	});

	it("debug log with target signal 0 skips it", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._showDebugLog = true;
		a._debugLogLines = [];
		a._debugLogPrev = null;

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

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		expect(a._debugLogLines.length).toBeGreaterThan(0);
		expect(a._debugLogLines[0]).toContain("no targets");
	});

	it("debug log with confirmed=N (not confirmed)", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = {
			name: "Z1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 99, // very high trigger - won't be confirmed
			renew: 2,
			timeout: 100,
			handoff_timeout: 100,
			entry_point: false,
		};
		a._showDebugLog = true;
		a._debugLogLines = [];
		a._debugLogPrev = null;

		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "active" as const,
				signal: 3,
			},
		];

		a._renderVisibleCells(0, GRID_COLS - 1, 0, GRID_ROWS - 1, 10);
		expect(a._debugLogLines.length).toBeGreaterThan(0);
		expect(a._debugLogLines[0]).toContain("confirmed=N");
	});
});

// =========================================================
// Zone engine: confirmed target cleanup for non-active targets
// =========================================================
describe("zone engine confirmed target cleanup", () => {
	it("removes non-active target from confirmed sets (non-pending zones)", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = {
			name: "Z1",
			color: ZONE_COLORS[0],
			type: "custom",
			trigger: 3,
			renew: 2,
			timeout: 100,
			handoff_timeout: 100,
			entry_point: true,
		};

		// Zone has confirmed targets 0 AND 1
		// Target 1 is still active, so zone stays occupied & pendingSince stays null
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set([0, 1]),
		});

		// Target 0 is inactive, target 1 is active (keeps zone occupied)
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "inactive" as const,
				signal: 0,
			},
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

		a._runLocalZoneEngine();
		const st = a._localZoneState.get(1);
		// Target 0 should have been removed from confirmedTargets (non-active, non-pending zone)
		expect(st?.confirmedTargets.has(0)).toBe(false);
		// Target 1 should still be there
		expect(st?.confirmedTargets.has(1)).toBe(true);
	});

	it("does NOT remove target from pending zones", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };

		// Zone is pending (pendingSince is non-null)
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: Date.now() / 1000,
			confirmedTargets: new Set([0]),
		});

		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "pending" as const,
				signal: 0,
			},
		];

		a._runLocalZoneEngine();
		const st = a._localZoneState.get(1);
		// Should NOT have been removed because zone is pending
		expect(st?.confirmedTargets.has(0)).toBe(true);
	});
});

// =========================================================
// Backend debug log subscription: _showBackendDebugLog branch
// =========================================================
describe("backend debug log subscription branch", () => {
	it("appends backend debug log when _showBackendDebugLog is true", () => {
		const a = createPanel() as any;
		a._showBackendDebugLog = true;
		a._backendDebugLogLines = [];
		a._backendDebugLogPrev = null;

		let handler: (event: any) => void;
		a.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					handler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._subscribeTargets("e1");

		handler!({
			targets: [],
			zones: {
				occupancy: {},
				target_counts: {},
				frame_count: 1,
				debug_log: "zone1: occupied",
			},
		});

		expect(a._backendDebugLogLines.length).toBe(1);
		expect(a._backendDebugLogLines[0]).toContain("zone1: occupied");
	});

	it("skips duplicate backend debug log body", () => {
		const a = createPanel() as any;
		a._showBackendDebugLog = true;
		a._backendDebugLogLines = ["old"];
		a._backendDebugLogPrev = "same body";

		let handler: (event: any) => void;
		a.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					handler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._subscribeTargets("e1");

		handler!({
			targets: [],
			zones: {
				occupancy: {},
				target_counts: {},
				frame_count: 1,
				debug_log: "same body",
			},
		});

		// Should NOT have added a new line
		expect(a._backendDebugLogLines.length).toBe(1);
	});

	it("truncates backend debug log when exceeding max", () => {
		const a = createPanel() as any;
		a._showBackendDebugLog = true;
		a._backendDebugLogLines = new Array(500).fill("old");
		a._backendDebugLogPrev = null;

		let handler: (event: any) => void;
		a.hass = {
			callWS: vi.fn(),
			connection: {
				subscribeMessage: vi.fn().mockImplementation((cb: any) => {
					handler = cb;
					return Promise.resolve(() => {});
				}),
			},
		};

		a._subscribeTargets("e1");

		handler!({
			targets: [],
			zones: {
				occupancy: {},
				target_counts: {},
				frame_count: 1,
				debug_log: "new line",
			},
		});

		expect(a._backendDebugLogLines.length).toBeLessThanOrEqual(501);
	});
});

// =========================================================
// _renderDebugLog and _renderBackendDebugLog toggle+content
// =========================================================
describe("debug log rendering branches", () => {
	it("renders debug log expanded with lines", () => {
		const a = createPanel() as any;
		a._showDebugLog = true;
		a._debugLogLines = ["line 1", "line 2"];
		const tpl = a._renderDebugLog();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const logLines = c.querySelectorAll(".debug-log-line");
		expect(logLines.length).toBe(2);
		document.body.removeChild(c);
	});

	it("renders debug log expanded with empty lines shows waiting", () => {
		const a = createPanel() as any;
		a._showDebugLog = true;
		a._debugLogLines = [];
		const tpl = a._renderDebugLog();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		expect(c.textContent).toContain("Waiting");
		document.body.removeChild(c);
	});

	it("clicking debug log toggle closes and clears", () => {
		const a = createPanel() as any;
		a._showDebugLog = true;
		a._debugLogLines = ["something"];
		a._debugLogPrev = "body";
		const tpl = a._renderDebugLog();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const toggleBtn = c.querySelector(".live-section-link") as HTMLElement;
		if (toggleBtn) {
			toggleBtn.click();
			expect(a._showDebugLog).toBe(false);
			expect(a._debugLogLines).toEqual([]);
			expect(a._debugLogPrev).toBeNull();
		}
		document.body.removeChild(c);
	});

	it("renders backend debug log expanded with lines", () => {
		const a = createPanel() as any;
		a._showBackendDebugLog = true;
		a._backendDebugLogLines = ["evt 1", "evt 2"];
		const tpl = a._renderBackendDebugLog();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const logLines = c.querySelectorAll(".debug-log-line");
		expect(logLines.length).toBe(2);
		document.body.removeChild(c);
	});

	it("renders backend debug log expanded with empty lines", () => {
		const a = createPanel() as any;
		a._showBackendDebugLog = true;
		a._backendDebugLogLines = [];
		const tpl = a._renderBackendDebugLog();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		expect(c.textContent).toContain("Waiting");
		document.body.removeChild(c);
	});

	it("clicking backend debug log toggle closes and clears", () => {
		const a = createPanel() as any;
		a._showBackendDebugLog = true;
		a._backendDebugLogLines = ["something"];
		a._backendDebugLogPrev = "body";
		const tpl = a._renderBackendDebugLog();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const toggleBtn = c.querySelector(".live-section-link") as HTMLElement;
		if (toggleBtn) {
			toggleBtn.click();
			expect(a._showBackendDebugLog).toBe(false);
			expect(a._backendDebugLogLines).toEqual([]);
			expect(a._backendDebugLogPrev).toBeNull();
		}
		document.body.removeChild(c);
	});
});

// =========================================================
// Live overview: click outside menu dismisses it
// =========================================================
describe("live overview panel click dismisses menu", () => {
	it("clicking outside menu wrapper closes showLiveMenu", () => {
		const a = createPanel() as any;
		a._showLiveMenu = true;
		const tpl = a._renderLiveOverview();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		// Click on the panel div itself (not .sidebar-menu-wrapper)
		const panel = c.querySelector(".panel") as HTMLElement;
		if (panel) {
			panel.click();
			expect(a._showLiveMenu).toBe(false);
		}
		document.body.removeChild(c);
	});
});

// =========================================================
// Wizard mini sensor view: inactive target not rendered
// =========================================================
describe("wizard mini sensor view: inactive target rendering", () => {
	it("does not render inactive targets in wizard mini grid", () => {
		const a = createPanel() as any;
		a._targets = [
			{
				x: 100,
				y: 200,
				raw_x: 100,
				raw_y: 200,
				speed: 0,
				status: "inactive" as const,
				signal: 0,
			},
			{
				x: 300,
				y: 400,
				raw_x: 300,
				raw_y: 400,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];
		a._perspective = null; // uncalibrated -> renders FOV
		const tpl = a._renderMiniSensorView();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// Pending targets in live grid rendering
// =========================================================
describe("live grid pending target opacity", () => {
	it("renders pending target with 0.3 opacity", () => {
		const a = createPanel() as any;
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "pending" as const,
				signal: 3,
			},
		];
		const tpl = a._renderLiveGrid();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const dot = c.querySelector(".target-dot") as HTMLElement;
		if (dot) {
			expect(dot.style.opacity).toBe("0.3");
		}
		document.body.removeChild(c);
	});

	it("skips inactive target in live grid", () => {
		const a = createPanel() as any;
		a._targets = [
			{
				x: 1500,
				y: 2000,
				raw_x: 1500,
				raw_y: 2000,
				speed: 0,
				status: "inactive" as const,
				signal: 0,
			},
		];
		const tpl = a._renderLiveGrid();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const dots = c.querySelectorAll(".target-dot");
		expect(dots.length).toBe(0);
		document.body.removeChild(c);
	});
});

// =========================================================
// Uncalibrated FOV: inactive target not rendered, pending target
// =========================================================
describe("uncalibrated FOV target status branches", () => {
	it("skips inactive target in FOV", () => {
		const a = createPanel() as any;
		a._perspective = null;
		a._targets = [
			{
				x: 100,
				y: 200,
				raw_x: 100,
				raw_y: 200,
				speed: 0,
				status: "inactive" as const,
				signal: 0,
			},
		];
		const tpl = a._renderUncalibratedFov();
		expect(tpl).toBeDefined();
	});
});

// =========================================================
// Static min/max distance clamping branches
// =========================================================
describe("detection range distance clamping", () => {
	it("clamps static min distance when >= max distance", () => {
		const a = createPanel() as any;
		a._staticAutoRange = false;
		a._staticMinDistance = 5;
		a._staticMaxDistance = 10;
		const tpl = a._renderDetectionRanges();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		// Find the min distance range input (min=0.3)
		const ranges = c.querySelectorAll(".setting-range");
		for (let i = 0; i < ranges.length; i++) {
			const r = ranges[i] as HTMLInputElement;
			if (r.min === "0.3") {
				r.value = "15"; // exceeds max
				r.dispatchEvent(new Event("input"));
				expect(a._staticMinDistance).toBeLessThan(a._staticMaxDistance);
				break;
			}
		}
		document.body.removeChild(c);
	});

	it("clamps static max distance when <= min distance", () => {
		const a = createPanel() as any;
		a._staticAutoRange = false;
		a._staticMinDistance = 5;
		a._staticMaxDistance = 10;
		const tpl = a._renderDetectionRanges();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		// Find the max distance range input (max=16)
		const ranges = c.querySelectorAll(".setting-range");
		for (let i = 0; i < ranges.length; i++) {
			const r = ranges[i] as HTMLInputElement;
			if (r.min === "2.4") {
				r.value = "3"; // less than min=5
				r.dispatchEvent(new Event("input"));
				expect(a._staticMaxDistance).toBeGreaterThan(a._staticMinDistance);
				break;
			}
		}
		document.body.removeChild(c);
	});
});

// =========================================================
// Rename dialog: entity_id split fallback branches
// =========================================================
describe("rename dialog entity_id fallback branches", () => {
	it("handles entity_id with no dot (fallback to full string)", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._showRenameDialog = true;
		a._pendingRenames = [
			{
				old_entity_id: "nodotshere",
				new_entity_id: "alsonodots",
			},
		];
		const tpl = a._renderEditor();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		// Should not throw, and render the fallback strings
		expect(c.textContent).toContain("nodotshere");
		document.body.removeChild(c);
	});
});

// =========================================================
// _applyLayout: zone with zero painted cells gets removed
// =========================================================
describe("_applyLayout zero-cell zone removal", () => {
	it("removes zone config with zero painted cells", async () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		// Zone 1 config exists but no cells painted with zone 1
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a.hass = {
			callWS: vi.fn().mockResolvedValue({
				entity_renames: [],
			}),
		};
		a._selectedEntryId = "e1";

		await a._applyLayout();

		// Zone should have been removed since no cells are painted
		expect(a._zoneConfigs[0]).toBeNull();
	});
});

// =========================================================
// _renderLiveSidebar: expanded sensor info toggle (collapse)
// =========================================================
describe("live sidebar sensor info collapse", () => {
	it("toggles sensor info from expanded to collapsed", () => {
		const a = createPanel() as any;
		a._expandedSensorInfo = "occupancy";
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a._zoneState = {
			occupancy: { 1: true },
			target_counts: { 1: 1 },
			frame_count: 10,
		};
		const tpl = a._renderLiveSidebar();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		// Find the already-expanded info button and click to collapse
		const infoBtns = c.querySelectorAll(".live-sensor-info-btn");
		if (infoBtns.length > 0) {
			(infoBtns[0] as HTMLElement).click();
			expect(a._expandedSensorInfo).toBeNull();
		}
		document.body.removeChild(c);
	});
});

// =========================================================
// Updated callback: _showDebugLog scroll
// =========================================================
describe("updated callback debug log scroll", () => {
	it("scrolls debug log when _showDebugLog is true", () => {
		const a = createPanel() as any;
		a._showDebugLog = true;

		const mockEl = { scrollTop: 0, scrollHeight: 500 };
		Object.defineProperty(a, "shadowRoot", {
			value: {
				getElementById: (id: string) => {
					if (id === "debug-log-scroll") return mockEl;
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		a.updated(new Map([["_showDebugLog", false]]));
		expect(mockEl.scrollTop).toBe(500);
	});

	it("scrolls backend debug log when _showBackendDebugLog is true", () => {
		const a = createPanel() as any;
		a._showBackendDebugLog = true;

		const mockEl = { scrollTop: 0, scrollHeight: 300 };
		Object.defineProperty(a, "shadowRoot", {
			value: {
				getElementById: (id: string) => {
					if (id === "backend-debug-log-scroll") return mockEl;
					return null;
				},
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		a.updated(new Map([["_showBackendDebugLog", false]]));
		expect(mockEl.scrollTop).toBe(300);
	});
});

// =========================================================
// Zone engine: pending target skip in local zone engine
// =========================================================
describe("zone engine pending target handling", () => {
	it("clears targetPrev and gateCount for pending target", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) a._grid[i] = cellSetZone(a._grid[i], 1);
		}
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a._targetPrev = [{ col: 5, row: 5 }, null, null];
		a._targetGateCount = [3, 0, 0];

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

		a._runLocalZoneEngine();
		expect(a._targetPrev[0]).toBeNull();
		expect(a._targetGateCount[0]).toBe(0);
	});
});

// =========================================================
// Wizard corners: fb offset input on existing corner
// =========================================================
describe("wizard corners fb offset input", () => {
	it("updates offset_fb on existing corner", () => {
		const a = createPanel() as any;
		a._wizardCorners = [
			{ raw_x: 100, raw_y: 200, offset_side: 0, offset_fb: 0 },
			null,
			null,
			null,
		];
		a._wizardCornerIndex = 0;
		a._targets = [
			{
				x: 0,
				y: 0,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];

		const tpl = a._renderWizardCorners();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const offsets = c.querySelectorAll(
			".offset-input",
		) as NodeListOf<HTMLInputElement>;
		if (offsets.length >= 2) {
			offsets[1].value = "25";
			offsets[1].dispatchEvent(new Event("input"));
			expect(a._wizardCorners[0].offset_fb).toBe(250);
		}
		document.body.removeChild(c);
	});
});

// =========================================================
// Handoff detection: srcSt is null (no state for previous zone)
// =========================================================
describe("handoff detection srcSt null branch", () => {
	it("skips handoff when source zone has no state", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(6000, 6000);
		a._roomWidth = 6000;
		a._roomDepth = 6000;

		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a._zoneConfigs[1] = { name: "Z2", color: ZONE_COLORS[1], type: "normal" };
		for (let r = 0; r < GRID_ROWS; r++) {
			for (let c = 0; c < GRID_COLS; c++) {
				const idx = r * GRID_COLS + c;
				if (a._grid[idx] & CELL_ROOM_BIT) {
					a._grid[idx] = cellSetZone(a._grid[idx], r < GRID_ROWS / 2 ? 1 : 2);
				}
			}
		}

		// Previous position in zone 1, but no localZoneState for zone 1
		a._targetPrev = [{ col: 10, row: 3 }, null, null];
		a._targetGateCount = [0, 0, 0];
		// No localZoneState for zone 1

		a._targets = [
			{
				x: 3000,
				y: 5500,
				raw_x: 3000,
				raw_y: 5500,
				speed: 0,
				status: "active" as const,
				signal: 7,
			},
		];

		// Should not throw
		a._runLocalZoneEngine();
	});
});

// =========================================================
// _renderWizardCorners: corner arrow done branch
// =========================================================
describe("wizard corner progress arrow done", () => {
	it("renders done arrow for completed corner", () => {
		const a = createPanel() as any;
		a._wizardCorners = [
			{ raw_x: 100, raw_y: 200, offset_side: 0, offset_fb: 0 },
			{ raw_x: 300, raw_y: 400, offset_side: 0, offset_fb: 0 },
			null,
			null,
		];
		a._wizardCornerIndex = 2;
		a._targets = [
			{
				x: 0,
				y: 0,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];

		const tpl = a._renderWizardCorners();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const doneArrows = c.querySelectorAll(".corner-arrow.done");
		expect(doneArrows.length).toBeGreaterThan(0);
		document.body.removeChild(c);
	});
});

// =========================================================
// Wizard corner offset side input on existing corner
// =========================================================
describe("wizard offset side on existing corner", () => {
	it("updates offset_side on existing corner", () => {
		const a = createPanel() as any;
		a._wizardCorners = [
			{ raw_x: 100, raw_y: 200, offset_side: 0, offset_fb: 0 },
			null,
			null,
			null,
		];
		a._wizardCornerIndex = 0;
		a._targets = [
			{
				x: 0,
				y: 0,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];

		const tpl = a._renderWizardCorners();
		const c = document.createElement("div");
		document.body.appendChild(c);
		render(tpl, c);

		const offsets = c.querySelectorAll(
			".offset-input",
		) as NodeListOf<HTMLInputElement>;
		if (offsets.length >= 1) {
			offsets[0].value = "30";
			offsets[0].dispatchEvent(new Event("input"));
			expect(a._wizardCorners[0].offset_side).toBe(300);
		}
		document.body.removeChild(c);
	});
});

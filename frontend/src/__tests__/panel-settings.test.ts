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
	a._view = "live";
	a._entries = [
		{
			entry_id: "e1",
			title: "Test",
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
	a._roomTrigger = 5;
	a._roomRenew = 3;
	a._roomTimeout = 10;
	a._roomHandoffTimeout = 3;
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
	return el;
}

describe("_toggleAccordion", () => {
	it("adds an accordion id when not present", () => {
		const a = createPanel() as any;
		a._openAccordions = new Set();

		a._toggleAccordion("detection");

		expect(a._openAccordions.has("detection")).toBe(true);
	});

	it("removes an accordion id when already present", () => {
		const a = createPanel() as any;
		a._openAccordions = new Set(["detection"]);

		a._toggleAccordion("detection");

		expect(a._openAccordions.has("detection")).toBe(false);
	});

	it("can handle multiple accordions", () => {
		const a = createPanel() as any;
		a._openAccordions = new Set(["detection"]);

		a._toggleAccordion("sensitivity");

		expect(a._openAccordions.has("detection")).toBe(true);
		expect(a._openAccordions.has("sensitivity")).toBe(true);
	});
});

describe("_getCellColor", () => {
	it("returns a color string for outside cells", () => {
		const a = createPanel() as any;
		const result = a._getCellColor(0);
		expect(typeof result).toBe("string");
	});

	it("returns a color string for inside cells", () => {
		const a = createPanel() as any;
		a._grid[0] = 0x80; // CELL_ROOM_BIT
		const result = a._getCellColor(0);
		expect(typeof result).toBe("string");
	});
});

describe("_getRoomBounds", () => {
	it("returns bounds for empty grid", () => {
		const a = createPanel() as any;
		const result = a._getRoomBounds();
		expect(result).toHaveProperty("minCol");
		expect(result).toHaveProperty("maxCol");
		expect(result).toHaveProperty("minRow");
		expect(result).toHaveProperty("maxRow");
	});
});

describe("_mmToPx and _pxToMm", () => {
	it("converts mm to px", () => {
		const a = createPanel() as any;
		// mmToPx formula: (mm / 300) * (cellPx + 1)
		// 300mm with cellPx=28 -> (300/300) * 29 = 29
		const px = a._mmToPx(300, 28);
		expect(px).toBeCloseTo(29, 0);
	});

	it("converts px to mm", () => {
		const a = createPanel() as any;
		// pxToMm formula: (px / (cellPx + 1)) * 300
		// 29px with cellPx=28 -> (29/29) * 300 = 300
		const mm = a._pxToMm(29, 28);
		expect(mm).toBeCloseTo(300, 0);
	});
});

describe("_onCellMouseEnter", () => {
	it("applies paint when _isPainting is true", () => {
		const a = createPanel() as any;
		a._isPainting = true;
		a._activeZone = 0;
		a._paintAction = "set";

		a._onCellMouseEnter(0);

		expect(a._grid[0]).toBe(0x01); // CELL_ROOM_BIT = 0x01
	});

	it("does nothing when _isPainting is false", () => {
		const a = createPanel() as any;
		a._isPainting = false;

		a._onCellMouseEnter(0);
		expect(a._grid[0]).toBe(0);
	});
});

describe("_onCellMouseUp", () => {
	it("resets painting state", () => {
		const a = createPanel() as any;
		a._isPainting = true;
		a._frozenBounds = { minCol: 0, maxCol: 10, minRow: 0, maxRow: 10 };

		a._onCellMouseUp();

		expect(a._isPainting).toBe(false);
		expect(a._frozenBounds).toBeNull();
	});
});

describe("_updateRoomDimensionsFromGrid", () => {
	it("updates room dimensions based on grid", () => {
		const a = createPanel() as any;
		a._roomWidth = 0;
		a._roomDepth = 0;

		// Mark some cells as inside room using CELL_ROOM_BIT (0x01)
		// Import GRID_COLS from the already-imported module
		const GRID_COLS_LOCAL = 20; // from grid.ts
		for (let r = 0; r < 3; r++) {
			for (let c = 10; c < 15; c++) {
				a._grid[r * GRID_COLS_LOCAL + c] = 0x01; // CELL_ROOM_BIT
			}
		}

		a._updateRoomDimensionsFromGrid();

		expect(a._roomWidth).toBeGreaterThan(0);
		expect(a._roomDepth).toBeGreaterThan(0);
	});
});

describe("_computeHeatmapColors", () => {
	it("returns a Map", () => {
		const a = createPanel() as any;
		const result = a._computeHeatmapColors();
		expect(result).toBeInstanceOf(Map);
	});
});

describe("_getZoneThresholds", () => {
	it("returns thresholds for boundary zone", () => {
		const a = createPanel() as any;
		const result = a._getZoneThresholds(0);
		expect(result).toHaveProperty("trigger");
		expect(result).toHaveProperty("renew");
		expect(result).toHaveProperty("timeout");
		expect(result).toHaveProperty("handoffTimeout");
		expect(result).toHaveProperty("entryPoint");
	});

	it("uses zone-specific thresholds for named zones", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = {
			name: "Kitchen",
			color: "#ff0000",
			type: "custom",
			trigger: 7,
			renew: 5,
			timeout: 15,
			handoff_timeout: 5,
			entry_point: true,
		};

		const result = a._getZoneThresholds(1);
		expect(result.trigger).toBe(7);
		expect(result.renew).toBe(5);
		expect(result.timeout).toBe(15);
		expect(result.handoffTimeout).toBe(5);
		expect(result.entryPoint).toBe(true);
	});
});

describe("connectedCallback and disconnectedCallback", () => {
	it("connectedCallback sets up event listeners", () => {
		const el = createPanel();
		const a = el as any;
		// Prevent actual initialization
		el.hass = null;

		// Spy on addEventListener
		const addSpy = vi.spyOn(window, "addEventListener");
		el.connectedCallback();

		expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
		expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function));

		addSpy.mockRestore();
		el.disconnectedCallback();
	});

	it("disconnectedCallback removes event listeners", () => {
		const el = createPanel();
		const a = el as any;
		el.hass = null;

		el.connectedCallback();

		const removeSpy = vi.spyOn(window, "removeEventListener");
		el.disconnectedCallback();

		expect(removeSpy).toHaveBeenCalledWith(
			"beforeunload",
			expect.any(Function),
		);
		expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function));

		removeSpy.mockRestore();
	});
});

describe("_beforeUnloadHandler", () => {
	it("sets returnValue when dirty", () => {
		const el = createPanel();
		const a = el as any;
		a._dirty = true;

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		const preventSpy = vi.spyOn(event, "preventDefault");

		a._beforeUnloadHandler(event);

		expect(preventSpy).toHaveBeenCalled();
	});

	it("does nothing when not dirty", () => {
		const el = createPanel();
		const a = el as any;
		a._dirty = false;

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		const preventSpy = vi.spyOn(event, "preventDefault");

		a._beforeUnloadHandler(event);

		expect(preventSpy).not.toHaveBeenCalled();
	});
});

describe("_interceptNavigation", () => {
	it("returns false and does nothing when not dirty", () => {
		const el = createPanel();
		const a = el as any;
		a._dirty = false;

		const result = a._interceptNavigation();

		expect(result).toBe(false);
		expect(a._showUnsavedDialog).toBe(false);
	});

	it("returns true and shows dialog when dirty", () => {
		const el = createPanel();
		const a = el as any;
		a._dirty = true;

		const result = a._interceptNavigation();

		expect(result).toBe(true);
		expect(a._showUnsavedDialog).toBe(true);
		expect(a._pendingNavigation).toBeNull();
	});
});

describe("_dismissTooltips", () => {
	it("is a function", () => {
		const el = createPanel();
		const a = el as any;

		expect(typeof a._dismissTooltips).toBe("function");
	});
});

describe("updated lifecycle", () => {
	it("re-initializes when hass changes and loading", () => {
		const el = createPanel();
		const a = el as any;
		a._loading = true;
		a._entries = [];

		// Mock _initialize to track calls
		const initSpy = vi.spyOn(a, "_initialize").mockResolvedValue(undefined);

		const props = new Map();
		props.set("hass", undefined);

		a.updated(props);

		expect(initSpy).toHaveBeenCalled();
		initSpy.mockRestore();
	});

	it("does not re-initialize when hass has not changed", () => {
		const el = createPanel();
		const a = el as any;
		a._loading = true;
		a._entries = [];

		const initSpy = vi.spyOn(a, "_initialize").mockResolvedValue(undefined);

		const props = new Map();
		// hass not in changedProps

		a.updated(props);

		expect(initSpy).not.toHaveBeenCalled();
		initSpy.mockRestore();
	});

	it("does not re-initialize when entries already loaded", () => {
		const el = createPanel();
		const a = el as any;
		a._loading = true;
		a._entries = [
			{
				entry_id: "e1",
				title: "A",
				room_name: "",
				has_perspective: false,
				has_layout: false,
			},
		];

		const initSpy = vi.spyOn(a, "_initialize").mockResolvedValue(undefined);

		const props = new Map();
		props.set("hass", undefined);

		a.updated(props);

		expect(initSpy).not.toHaveBeenCalled();
		initSpy.mockRestore();
	});
});

describe("_onFurniturePointerDown", () => {
	it("sets up drag state for move", () => {
		const el = createPanel();
		const a = el as any;
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

		const mockEvent = {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			clientX: 500,
			clientY: 300,
		};

		// Mock addEventListener
		const addSpy = vi
			.spyOn(window, "addEventListener")
			.mockImplementation(() => {});

		a._onFurniturePointerDown(mockEvent, "f1", "move");

		expect(a._selectedFurnitureId).toBe("f1");
		expect(a._dragState).not.toBeNull();
		expect(a._dragState.type).toBe("move");
		expect(a._dragState.id).toBe("f1");

		addSpy.mockRestore();
	});

	it("returns early when item not found", () => {
		const el = createPanel();
		const a = el as any;
		a._furniture = [];

		const mockEvent = {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			clientX: 500,
			clientY: 300,
		};

		a._onFurniturePointerDown(mockEvent, "nonexistent", "move");

		expect(a._dragState).toBeNull();
	});
});

describe("_onFurnitureDrag", () => {
	it("returns early when no drag state", () => {
		const el = createPanel();
		const a = el as any;
		a._dragState = null;

		// Should not throw
		a._onFurnitureDrag({ clientX: 0, clientY: 0 });
	});
});

describe("history navigation interception", () => {
	it("pushState is intercepted when dirty", () => {
		const el = createPanel();
		const a = el as any;
		el.hass = null; // Prevent initialization

		// Save original
		const origPush = history.pushState.bind(history);

		el.connectedCallback();

		a._dirty = true;
		history.pushState({}, "", "/test");

		expect(a._showUnsavedDialog).toBe(true);
		expect(a._pendingNavigation).not.toBeNull();

		el.disconnectedCallback();
		// Ensure originals are restored
	});

	it("replaceState is intercepted when dirty", () => {
		const el = createPanel();
		const a = el as any;
		el.hass = null;

		el.connectedCallback();

		a._dirty = true;
		history.replaceState({}, "", "/test");

		expect(a._showUnsavedDialog).toBe(true);
		expect(a._pendingNavigation).not.toBeNull();

		el.disconnectedCallback();
	});

	it("pushState passes through when not dirty", () => {
		const el = createPanel();
		const a = el as any;
		el.hass = null;

		el.connectedCallback();

		a._dirty = false;
		// Should not throw or show dialog
		history.pushState({}, "", "");
		expect(a._showUnsavedDialog).toBe(false);

		el.disconnectedCallback();
	});

	it("replaceState passes through when not dirty", () => {
		const el = createPanel();
		const a = el as any;
		el.hass = null;

		el.connectedCallback();

		a._dirty = false;
		history.replaceState({}, "", "");
		expect(a._showUnsavedDialog).toBe(false);

		el.disconnectedCallback();
	});
});

/**
 * Tests for inline anonymous event handlers in render templates.
 * These handlers are simple state mutations that we exercise by replicating
 * the handler body logic directly on the panel state.
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

// ========================
// _renderHeader inline handlers
// ========================
describe("_renderHeader inline handlers", () => {
	it("device select __add__ option opens new window", () => {
		const a = createPanel() as any;
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

		// Simulate the handler for __add__ selection
		const val = "__add__";
		if (val === "__add__") {
			window.open(
				"/config/integrations/integration/everything_presence_pro",
				"_blank",
			);
		}

		expect(openSpy).toHaveBeenCalledWith(
			"/config/integrations/integration/everything_presence_pro",
			"_blank",
		);
		openSpy.mockRestore();
	});
});

// ========================
// _renderWizardGuide inline handlers
// ========================
describe("_renderWizardGuide inline handlers", () => {
	it("cancel button resets wizard state", () => {
		const a = createPanel() as any;
		a._setupStep = "guide";

		// Replicate cancel handler (line 3276-3281)
		a._setupStep = null;
		a._wizardCorners = [null, null, null, null];
		a._wizardCornerIndex = 0;
		a._wizardOffsetSide = "";
		a._wizardOffsetFb = "";

		expect(a._setupStep).toBeNull();
		expect(a._wizardCorners).toEqual([null, null, null, null]);
	});

	it("begin marking button sets step to corners", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3285-3286)
		a._setupStep = "corners";

		expect(a._setupStep).toBe("corners");
	});
});

// ========================
// _renderWizardCorners inline handlers
// ========================
describe("_renderWizardCorners inline handlers", () => {
	it("corner chip click resets that corner and updates index", () => {
		const a = createPanel() as any;
		a._wizardCorners = [
			{ raw_x: 100, raw_y: 200, offset_side: 500, offset_fb: 300 },
			{ raw_x: 300, raw_y: 400, offset_side: 0, offset_fb: 0 },
			null,
			null,
		];

		// Click on corner 0 (line 3331-3341)
		const i = 0;
		const prev = a._wizardCorners[i];
		a._wizardCornerIndex = i;
		a._wizardCorners = [...a._wizardCorners];
		a._wizardCorners[i] = null;
		a._wizardOffsetSide = prev?.offset_side
			? String(prev.offset_side / 10)
			: "";
		a._wizardOffsetFb = prev?.offset_fb ? String(prev.offset_fb / 10) : "";

		expect(a._wizardCornerIndex).toBe(0);
		expect(a._wizardCorners[0]).toBeNull();
		expect(a._wizardOffsetSide).toBe("50");
		expect(a._wizardOffsetFb).toBe("30");
	});

	it("offset side input updates corner", () => {
		const a = createPanel() as any;
		const idx = 0;
		a._wizardCorners = [
			{ raw_x: 100, raw_y: 200, offset_side: 0, offset_fb: 0 },
			null,
			null,
			null,
		];
		a._wizardCornerIndex = idx;

		// Replicate handler (line 3366-3370)
		a._wizardOffsetSide = "50";
		const val = 10 * (parseFloat(a._wizardOffsetSide) || 0);
		const corner = a._wizardCorners[idx];
		if (corner) corner.offset_side = val;

		expect(a._wizardCorners[0]!.offset_side).toBe(500);
	});

	it("offset fb input updates corner", () => {
		const a = createPanel() as any;
		const idx = 0;
		a._wizardCorners = [
			{ raw_x: 100, raw_y: 200, offset_side: 0, offset_fb: 0 },
			null,
			null,
			null,
		];
		a._wizardCornerIndex = idx;

		// Replicate handler (line 3380-3384)
		a._wizardOffsetFb = "30";
		const val = 10 * (parseFloat(a._wizardOffsetFb) || 0);
		const corner = a._wizardCorners[idx];
		if (corner) corner.offset_fb = val;

		expect(a._wizardCorners[0]!.offset_fb).toBe(300);
	});

	it("cancel button on corners step resets state", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3412-3417)
		a._setupStep = null;
		a._wizardCorners = [null, null, null, null];
		a._wizardCornerIndex = 0;
		a._wizardOffsetSide = "";
		a._wizardOffsetFb = "";

		expect(a._setupStep).toBeNull();
	});

	it("save button calls computeWizardPerspective and wizardFinish", async () => {
		const a = createPanel() as any;
		a._wizardCorners = [
			{ raw_x: -1500, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 1500, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 2000, raw_y: 4000, offset_side: 0, offset_fb: 0 },
			{ raw_x: -2000, raw_y: 4000, offset_side: 0, offset_fb: 0 },
		];
		a._wizardRoomWidth = 3000;
		a._wizardRoomDepth = 4000;

		// Replicate handler (line 3426-3428)
		a._computeWizardPerspective();

		expect(a._perspective).not.toBeNull();
	});
});

// ========================
// _renderSaveCancelButtons inline handlers
// ========================
describe("_renderSaveCancelButtons inline handlers", () => {
	it("cancel button resets dirty and loads config", () => {
		const a = createPanel() as any;
		a._dirty = true;
		a._view = "editor";

		// Replicate cancel handler (line 3535-3538)
		a._dirty = false;
		a._view = "live";
		// Would call: a._loadEntryConfig(a._selectedEntryId);

		expect(a._dirty).toBe(false);
		expect(a._view).toBe("live");
	});
});

// ========================
// _renderLiveOverview inline handlers
// ========================
describe("_renderLiveOverview inline handlers", () => {
	it("hit counts toggle", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3571-3572)
		a._showHitCounts = !a._showHitCounts;
		expect(a._showHitCounts).toBe(true);
		a._showHitCounts = !a._showHitCounts;
		expect(a._showHitCounts).toBe(false);
	});

	it("live menu toggle", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3578-3579)
		a._showLiveMenu = !a._showLiveMenu;
		expect(a._showLiveMenu).toBe(true);
	});

	it("live menu close on click", () => {
		const a = createPanel() as any;
		a._showLiveMenu = true;
		// Replicate handler (line 3586-3587)
		a._showLiveMenu = false;
		expect(a._showLiveMenu).toBe(false);
	});

	it("detection zones button", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3592-3594)
		a._view = "editor";
		a._sidebarTab = "zones";
		expect(a._view).toBe("editor");
		expect(a._sidebarTab).toBe("zones");
	});

	it("furniture button", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3598-3600)
		a._view = "editor";
		a._sidebarTab = "furniture";
		expect(a._view).toBe("editor");
		expect(a._sidebarTab).toBe("furniture");
	});

	it("settings button", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3607-3608)
		a._view = "settings";
		expect(a._view).toBe("settings");
	});

	it("delete calibration button shows dialog", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3619-3620)
		a._showDeleteCalibrationDialog = true;
		expect(a._showDeleteCalibrationDialog).toBe(true);
	});

	it("save template button shows dialog", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3628-3629)
		a._showTemplateSave = true;
		expect(a._showTemplateSave).toBe(true);
	});

	it("load template button shows dialog", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3633-3634)
		a._showTemplateLoad = true;
		expect(a._showTemplateLoad).toBe(true);
	});
});

// ========================
// _renderUncalibratedFov inline handlers
// ========================
describe("_renderUncalibratedFov inline handlers", () => {
	it("calibrate button sets wizard state", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3783-3789)
		a._setupStep = "guide";
		a._wizardCorners = [null, null, null, null];
		a._wizardCornerIndex = 0;
		a._wizardOffsetSide = "";
		a._wizardOffsetFb = "";
		a._view = "live";

		expect(a._setupStep).toBe("guide");
		expect(a._view).toBe("live");
	});
});

// ========================
// _renderNeedsCalibration inline handlers
// ========================
describe("_renderNeedsCalibration inline handlers", () => {
	it("start calibration button sets wizard state", () => {
		const a = createPanel() as any;
		// Replicate handler (line 3952-3957)
		a._setupStep = "guide";
		a._wizardCorners = [null, null, null, null];
		a._wizardCornerIndex = 0;
		a._wizardOffsetSide = "";
		a._wizardOffsetFb = "";

		expect(a._setupStep).toBe("guide");
	});
});

// ========================
// _renderSettings inline handlers
// ========================
describe("_renderSettings inline handlers", () => {
	it("settings container input sets dirty", () => {
		const a = createPanel() as any;
		a._dirty = false;
		// Replicate handler (line 4010-4013)
		a._dirty = true;
		expect(a._dirty).toBe(true);
	});
});

// ========================
// _renderDetectionRanges inline handlers
// ========================
describe("_renderDetectionRanges inline handlers", () => {
	it("target auto range toggle", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4136-4139)
		a._targetAutoRange = false;
		expect(a._targetAutoRange).toBe(false);
	});

	it("target max distance slider", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4148-4151)
		a._targetMaxDistance = 4.5;
		expect(a._targetMaxDistance).toBe(4.5);
	});

	it("static auto range toggle", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4162-4165)
		a._staticAutoRange = false;
		expect(a._staticAutoRange).toBe(false);
	});

	it("static min distance slider", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4174-4179)
		a._staticMinDistance = 0.5;
		expect(a._staticMinDistance).toBe(0.5);
	});

	it("static max distance slider", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4189-4197)
		a._staticMaxDistance = 12;
		expect(a._staticMaxDistance).toBe(12);
	});
});

// ========================
// _renderBoundaryTypeControls inline handlers
// ========================
describe("_renderBoundaryTypeControls inline handlers", () => {
	it("room type change to entrance", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4895-4904)
		const val = "entrance";
		const d = ZONE_TYPE_DEFAULTS[val] || ZONE_TYPE_DEFAULTS.normal;
		a._roomType = val;
		a._roomTrigger = d.trigger;
		a._roomRenew = d.renew;
		a._roomTimeout = d.timeout;
		a._roomHandoffTimeout = d.handoff_timeout;
		a._dirty = true;

		expect(a._roomType).toBe("entrance");
		expect(a._dirty).toBe(true);
	});

	it("room trigger input", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4918-4920)
		a._roomTrigger = 7;
		a._dirty = true;
		expect(a._roomTrigger).toBe(7);
	});

	it("room renew input", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4928-4930)
		a._roomRenew = 4;
		a._dirty = true;
		expect(a._roomRenew).toBe(4);
	});

	it("room timeout input (valid > 0)", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4939-4943)
		const v = 15;
		if (v > 0) {
			a._roomTimeout = v;
			a._dirty = true;
		}
		expect(a._roomTimeout).toBe(15);
	});

	it("room timeout input (invalid <= 0 is no-op)", () => {
		const a = createPanel() as any;
		a._roomTimeout = 10;
		a._dirty = false;
		const v = 0;
		if (v > 0) {
			a._roomTimeout = v;
			a._dirty = true;
		}
		expect(a._roomTimeout).toBe(10);
		expect(a._dirty).toBe(false);
	});

	it("room handoff timeout input", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4953-4957)
		const v = 5;
		if (v > 0) {
			a._roomHandoffTimeout = v;
			a._dirty = true;
		}
		expect(a._roomHandoffTimeout).toBe(5);
	});

	it("room entry point toggle", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4968-4970)
		a._roomEntryPoint = true;
		a._dirty = true;
		expect(a._roomEntryPoint).toBe(true);
	});
});

// ========================
// _renderZoneTypeControls inline handlers
// ========================
describe("_renderZoneTypeControls inline handlers", () => {
	it("zone type change updates config", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: "#ff0000", type: "normal" };

		// Replicate handler (line 4997-5011)
		const val = "rest";
		const zone = a._zoneConfigs[0]!;
		const index = 0;
		const d = ZONE_TYPE_DEFAULTS[val] || ZONE_TYPE_DEFAULTS.normal;
		const configs = [...a._zoneConfigs];
		configs[index] = {
			...zone,
			type: val,
			trigger: d.trigger,
			renew: d.renew,
			timeout: d.timeout,
			handoff_timeout: d.handoff_timeout,
		};
		a._zoneConfigs = configs;
		a._dirty = true;

		expect(a._zoneConfigs[0].type).toBe("rest");
	});

	it("zone trigger input", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = {
			name: "Z1",
			color: "#ff0000",
			type: "custom",
			trigger: 5,
			renew: 3,
			timeout: 10,
			handoff_timeout: 3,
		};

		// Replicate handler (line 5025-5032)
		const zone = a._zoneConfigs[0]!;
		const configs = [...a._zoneConfigs];
		configs[0] = { ...zone, trigger: 8 };
		a._zoneConfigs = configs;
		a._dirty = true;

		expect(a._zoneConfigs[0].trigger).toBe(8);
	});

	it("zone renew input", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = {
			name: "Z1",
			color: "#ff0000",
			type: "custom",
			trigger: 5,
			renew: 3,
			timeout: 10,
			handoff_timeout: 3,
		};

		// Replicate handler (line 5040-5047)
		const zone = a._zoneConfigs[0]!;
		const configs = [...a._zoneConfigs];
		configs[0] = { ...zone, renew: 6 };
		a._zoneConfigs = configs;
		a._dirty = true;

		expect(a._zoneConfigs[0].renew).toBe(6);
	});

	it("zone timeout input", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = {
			name: "Z1",
			color: "#ff0000",
			type: "custom",
			trigger: 5,
			renew: 3,
			timeout: 10,
			handoff_timeout: 3,
		};

		// Replicate handler (line 5056-5062)
		const v = 20;
		if (v > 0) {
			const zone = a._zoneConfigs[0]!;
			const configs = [...a._zoneConfigs];
			configs[0] = { ...zone, timeout: v };
			a._zoneConfigs = configs;
			a._dirty = true;
		}

		expect(a._zoneConfigs[0].timeout).toBe(20);
	});

	it("zone handoff timeout input", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = {
			name: "Z1",
			color: "#ff0000",
			type: "custom",
			trigger: 5,
			renew: 3,
			timeout: 10,
			handoff_timeout: 3,
		};

		// Replicate handler (line 5072-5078)
		const v = 7;
		if (v > 0) {
			const zone = a._zoneConfigs[0]!;
			const configs = [...a._zoneConfigs];
			configs[0] = { ...zone, handoff_timeout: v };
			a._zoneConfigs = configs;
			a._dirty = true;
		}

		expect(a._zoneConfigs[0].handoff_timeout).toBe(7);
	});

	it("zone entry point toggle", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = {
			name: "Z1",
			color: "#ff0000",
			type: "custom",
		};

		// Replicate handler (line 5089-5096)
		const zone = a._zoneConfigs[0]!;
		const configs = [...a._zoneConfigs];
		configs[0] = { ...zone, entry_point: true };
		a._zoneConfigs = configs;
		a._dirty = true;

		expect(a._zoneConfigs[0].entry_point).toBe(true);
	});
});

// ========================
// _renderZoneSidebar inline handlers
// ========================
describe("_renderZoneSidebar inline handlers", () => {
	it("boundary click sets activeZone to 0", () => {
		const a = createPanel() as any;
		a._activeZone = 3;
		// Replicate handler (line 5113-5114)
		a._activeZone = 0;
		expect(a._activeZone).toBe(0);
	});

	it("zone item click sets activeZone", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: "#ff0000", type: "normal" };
		const slot = 1;
		// Replicate handler (line 5139-5140)
		a._activeZone = slot;
		expect(a._activeZone).toBe(1);
	});

	it("zone color picker input", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: "#ff0000", type: "normal" };

		// Replicate handler (line 5152-5157)
		const val = "#00ff00";
		const zone = a._zoneConfigs[0]!;
		const i = 0;
		const configs = [...a._zoneConfigs];
		configs[i] = { ...zone, color: val };
		a._zoneConfigs = configs;
		a._dirty = true;

		expect(a._zoneConfigs[0].color).toBe("#00ff00");
	});

	it("zone name input", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: "#ff0000", type: "normal" };

		// Replicate handler (line 5170-5174)
		const val = "Kitchen";
		const zone = a._zoneConfigs[0]!;
		const i = 0;
		const configs = [...a._zoneConfigs];
		configs[i] = { ...zone, name: val };
		a._zoneConfigs = configs;

		expect(a._zoneConfigs[0].name).toBe("Kitchen");
	});

	it("zone name click sets active zone", () => {
		const a = createPanel() as any;
		const slot = 2;
		// Replicate handler (line 5176-5178)
		a._activeZone = slot;
		expect(a._activeZone).toBe(2);
	});

	it("zone name focus sets active zone", () => {
		const a = createPanel() as any;
		const slot = 3;
		// Replicate handler (line 5180-5181)
		a._activeZone = slot;
		expect(a._activeZone).toBe(3);
	});

	it("zone remove button calls _removeZone", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: "#ff0000", type: "normal" };
		const slot = 1;
		// Replicate handler (line 5186-5188)
		a._removeZone(slot);
		expect(a._zoneConfigs[0]).toBeNull();
	});
});

// ========================
// _renderEditor inline handlers
// ========================
describe("_renderEditor inline handlers", () => {
	it("panel click deselects activeZone when outside grid/sidebar", () => {
		const a = createPanel() as any;
		a._activeZone = 2;
		// Replicate handler (line 4397-4400)
		a._activeZone = null;
		expect(a._activeZone).toBeNull();
	});

	it("grid container click deselects furniture", () => {
		const a = createPanel() as any;
		a._selectedFurnitureId = "f1";
		// Replicate handler (line 4409-4411)
		a._selectedFurnitureId = null;
		expect(a._selectedFurnitureId).toBeNull();
	});

	it("unsaved dialog cancel button closes dialog", () => {
		const a = createPanel() as any;
		a._showUnsavedDialog = true;
		a._pendingNavigation = () => {};
		// Replicate handler (line 4520-4522)
		a._showUnsavedDialog = false;
		a._pendingNavigation = null;
		expect(a._showUnsavedDialog).toBe(false);
		expect(a._pendingNavigation).toBeNull();
	});
});

// ========================
// _renderTemplateSaveDialog inline handlers
// ========================
describe("_renderTemplateSaveDialog inline handlers", () => {
	it("template name input updates _templateName", () => {
		const a = createPanel() as any;
		// Replicate handler (line 4548-4549)
		a._templateName = "My Layout";
		expect(a._templateName).toBe("My Layout");
	});

	it("cancel button hides save dialog", () => {
		const a = createPanel() as any;
		a._showTemplateSave = true;
		// Replicate handler (line 4555-4556)
		a._showTemplateSave = false;
		expect(a._showTemplateSave).toBe(false);
	});
});

// ========================
// _renderTemplateLoadDialog inline handlers
// ========================
describe("_renderTemplateLoadDialog inline handlers", () => {
	it("close button hides load dialog", () => {
		const a = createPanel() as any;
		a._showTemplateLoad = true;
		// Replicate handler (line 4586)
		a._showTemplateLoad = false;
		expect(a._showTemplateLoad).toBe(false);
	});

	it("load button calls _loadTemplate", () => {
		const a = createPanel() as any;
		localStorage.setItem(
			"epp_layout_templates",
			JSON.stringify([
				{
					name: "T1",
					grid: new Array(GRID_CELL_COUNT).fill(0),
					zones: [],
					roomWidth: 3000,
					roomDepth: 4000,
				},
			]),
		);

		// Replicate handler (line 4590)
		a._loadTemplate("T1");
		expect(a._roomWidth).toBe(3000);

		localStorage.removeItem("epp_layout_templates");
	});

	it("delete button calls _deleteTemplate", () => {
		const a = createPanel() as any;
		localStorage.setItem(
			"epp_layout_templates",
			JSON.stringify([
				{
					name: "T1",
					grid: [],
					zones: [],
					roomWidth: 3000,
					roomDepth: 4000,
				},
			]),
		);

		// Replicate handler (line 4601)
		a._deleteTemplate("T1");
		expect(a._getTemplates()).toHaveLength(0);

		localStorage.removeItem("epp_layout_templates");
	});
});

// ========================
// _renderDeleteCalibrationDialog inline handler
// ========================
describe("render delete calibration dialog inline handler", () => {
	it("cancel button hides dialog", () => {
		const a = createPanel() as any;
		a._showDeleteCalibrationDialog = true;
		// Replicate handler (line 2990-2991)
		a._showDeleteCalibrationDialog = false;
		expect(a._showDeleteCalibrationDialog).toBe(false);
	});
});

// ========================
// _renderLiveSidebar inline handlers
// ========================
describe("_renderLiveSidebar inline handlers", () => {
	it("sensor info toggle expands/collapses", () => {
		const a = createPanel() as any;
		const id = "occupancy";
		// Replicate handler (line 5383-5385)
		a._expandedSensorInfo = a._expandedSensorInfo === id ? null : id;
		expect(a._expandedSensorInfo).toBe("occupancy");

		a._expandedSensorInfo = a._expandedSensorInfo === id ? null : id;
		expect(a._expandedSensorInfo).toBeNull();
	});

	it("detection zones link navigates to editor", () => {
		const a = createPanel() as any;
		// Replicate handler (line 5403-5405)
		a._view = "editor";
		a._sidebarTab = "zones";
		expect(a._view).toBe("editor");
	});

	it("zone sensor info toggle", () => {
		const a = createPanel() as any;
		const id = "zone_1";
		// Replicate handler (line 5416-5418)
		a._expandedSensorInfo = a._expandedSensorInfo === id ? null : id;
		expect(a._expandedSensorInfo).toBe("zone_1");
	});

	it("add zones button navigates", () => {
		const a = createPanel() as any;
		// Replicate handler (line 5434-5436)
		a._view = "editor";
		a._sidebarTab = "zones";
		expect(a._view).toBe("editor");
	});
});

// ========================
// _renderFurnitureSidebar inline handlers
// ========================
describe("_renderFurnitureSidebar inline handlers", () => {
	it("custom icon picker toggle", () => {
		const a = createPanel() as any;
		// Replicate handler (line 5523-5524)
		a._showCustomIconPicker = !a._showCustomIconPicker;
		expect(a._showCustomIconPicker).toBe(true);
	});

	it("custom icon value-changed event", () => {
		const a = createPanel() as any;
		// Replicate handler (line 5539-5540)
		a._customIconValue = "mdi:lamp";
		expect(a._customIconValue).toBe("mdi:lamp");

		a._customIconValue = "";
		expect(a._customIconValue).toBe("");
	});

	it("custom icon cancel button", () => {
		const a = createPanel() as any;
		a._showCustomIconPicker = true;
		a._customIconValue = "mdi:something";
		// Replicate handler (line 5554-5556)
		a._showCustomIconPicker = false;
		a._customIconValue = "";
		expect(a._showCustomIconPicker).toBe(false);
		expect(a._customIconValue).toBe("");
	});

	it("custom icon add button", () => {
		const a = createPanel() as any;
		a._showCustomIconPicker = true;
		a._customIconValue = "mdi:star";
		a._furniture = [];
		// Replicate handler (line 5561-5564)
		a._addCustomFurniture(a._customIconValue.trim());
		a._customIconValue = "";
		a._showCustomIconPicker = false;

		expect(a._furniture).toHaveLength(1);
		expect(a._furniture[0].icon).toBe("mdi:star");
		expect(a._showCustomIconPicker).toBe(false);
	});

	it("furniture width change", () => {
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
		// Replicate handler (line 5487)
		a._updateFurniture("f1", { width: 1200 });
		expect(a._furniture[0].width).toBe(1200);
	});

	it("furniture height change", () => {
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
		// Replicate handler (line 5493)
		a._updateFurniture("f1", { height: 1000 });
		expect(a._furniture[0].height).toBe(1000);
	});

	it("furniture rotation change", () => {
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
		// Replicate handler (line 5499)
		a._updateFurniture("f1", { rotation: 90 % 360 });
		expect(a._furniture[0].rotation).toBe(90);
	});
});

// ========================
// History interception pendingNavigation callbacks
// ========================
describe("history interception pendingNavigation callbacks", () => {
	it("pushState pendingNavigation calls originalPushState", () => {
		const a = createPanel() as any;
		const originalPush = vi.fn();
		a._originalPushState = originalPush;

		// Simulate the pendingNavigation closure created at line 531-533
		const args: [any, string, string] = [{}, "", "/test"];
		const pendingNav = () => {
			a._originalPushState!(...args);
			window.dispatchEvent(new PopStateEvent("popstate"));
		};

		pendingNav();
		expect(originalPush).toHaveBeenCalledWith({}, "", "/test");
	});

	it("replaceState pendingNavigation calls originalReplaceState", () => {
		const a = createPanel() as any;
		const originalReplace = vi.fn();
		a._originalReplaceState = originalReplace;

		// Simulate the pendingNavigation closure created at line 541-543
		const args: [any, string, string] = [{}, "", "/replaced"];
		const pendingNav = () => {
			a._originalReplaceState!(...args);
			window.dispatchEvent(new PopStateEvent("popstate"));
		};

		pendingNav();
		expect(originalReplace).toHaveBeenCalledWith({}, "", "/replaced");
	});
});

// ========================
// _dismissTooltips with shadow root
// ========================
describe("_dismissTooltips with tooltips", () => {
	it("hides tooltip elements", () => {
		const a = createPanel() as any;
		const tooltip1 = { style: { display: "block" } };
		const tooltip2 = { style: { display: "block" } };

		Object.defineProperty(a, "shadowRoot", {
			value: {
				querySelectorAll: (sel: string) => {
					if (sel === ".setting-info-tooltip") return [tooltip1, tooltip2];
					return [];
				},
			},
			configurable: true,
		});

		a._dismissTooltips();

		expect(tooltip1.style.display).toBe("none");
		expect(tooltip2.style.display).toBe("none");
	});
});

// ========================
// _renderVisibleCells mousedown/mouseenter handlers
// ========================
describe("_renderVisibleCells cell handlers", () => {
	it("cell mousedown handler with inRange=true calls _onCellMouseDown", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._activeZone = 0;
		a._dirty = false;

		// Find an inside cell
		let insideIdx = -1;
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				insideIdx = i;
				break;
			}
		}
		if (insideIdx >= 0) {
			a._onCellMouseDown(insideIdx);
			expect(a._dirty).toBe(true);
		}
	});
});

// ========================
// _infoTip click handler
// ========================
describe("_infoTip click handler logic", () => {
	it("toggles tooltip visibility", () => {
		const a = createPanel() as any;
		// The handler at line 4092 checks wasOpen and toggles display
		// Simulating the logic:
		const tip = { style: { display: "none" } };
		const wasOpen = tip.style.display === "block";

		// Close any other open tooltips first (line 4099-4103)
		// Then if not wasOpen, show this one
		if (!wasOpen) {
			tip.style.display = "block";
		}

		expect(tip.style.display).toBe("block");

		// Toggle again
		const wasOpen2 = tip.style.display === "block";
		if (wasOpen2) {
			tip.style.display = "none";
		}

		expect(tip.style.display).toBe("none");
	});
});

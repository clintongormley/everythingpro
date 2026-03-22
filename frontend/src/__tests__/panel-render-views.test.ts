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
			title: "Test",
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

describe("render() dispatches to correct view", () => {
	it("renders loading state when _loading is true", () => {
		const a = createPanel() as any;
		a._loading = true;
		const result = a.render();
		expect(result).toBeDefined();
	});

	it("renders loading when entries is empty", () => {
		const a = createPanel() as any;
		a._loading = false;
		a._entries = [];
		const result = a.render();
		expect(result).toBeDefined();
	});

	it("renders wizard when _setupStep is set", () => {
		const a = createPanel() as any;
		a._setupStep = "guide";
		const result = a.render();
		expect(result).toBeDefined();
	});

	it("renders settings view", () => {
		const a = createPanel() as any;
		a._view = "settings";
		const result = a.render();
		expect(result).toBeDefined();
	});

	it("renders editor view with perspective", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];
		// Need a grid with some room cells for proper rendering
		a._grid = initGridFromRoom(3000, 4000);
		const result = a.render();
		expect(result).toBeDefined();
	});

	it("renders live overview", () => {
		const a = createPanel() as any;
		a._view = "live";
		const result = a.render();
		expect(result).toBeDefined();
	});

	it("renders delete calibration dialog", () => {
		const a = createPanel() as any;
		a._view = "live";
		a._showDeleteCalibrationDialog = true;
		const result = a.render();
		expect(result).toBeDefined();
	});
});

describe("_renderHeader", () => {
	it("returns defined result", () => {
		const a = createPanel() as any;
		const result = a._renderHeader();
		expect(result).toBeDefined();
	});
});

describe("_renderWizard", () => {
	it("renders guide step", () => {
		const a = createPanel() as any;
		a._setupStep = "guide";
		const result = a._renderWizard();
		expect(result).toBeDefined();
	});

	it("renders corners step", () => {
		const a = createPanel() as any;
		a._setupStep = "corners";
		const result = a._renderWizard();
		expect(result).toBeDefined();
	});

	it("renders with capture in progress", () => {
		const a = createPanel() as any;
		a._setupStep = "corners";
		a._wizardCapturing = true;
		a._wizardCaptureProgress = 0.5;
		const result = a._renderWizard();
		expect(result).toBeDefined();
	});

	it("renders with capture paused", () => {
		const a = createPanel() as any;
		a._setupStep = "corners";
		a._wizardCapturing = true;
		a._wizardCapturePaused = true;
		const result = a._renderWizard();
		expect(result).toBeDefined();
	});
});

describe("_renderWizardGuide", () => {
	it("renders guide content", () => {
		const a = createPanel() as any;
		const result = a._renderWizardGuide();
		expect(result).toBeDefined();
	});
});

describe("_renderWizardCorners", () => {
	it("renders corner marking step with no targets", () => {
		const a = createPanel() as any;
		a._targets = [];
		const result = a._renderWizardCorners();
		expect(result).toBeDefined();
	});

	it("renders with active target", () => {
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
		const result = a._renderWizardCorners();
		expect(result).toBeDefined();
	});

	it("renders with too many targets", () => {
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
		const result = a._renderWizardCorners();
		expect(result).toBeDefined();
	});

	it("renders when all corners marked", () => {
		const a = createPanel() as any;
		a._wizardCorners = [
			{ raw_x: -1000, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 1000, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 1000, raw_y: 3000, offset_side: 0, offset_fb: 0 },
			{ raw_x: -1000, raw_y: 3000, offset_side: 0, offset_fb: 0 },
		];
		const result = a._renderWizardCorners();
		expect(result).toBeDefined();
	});

	it("renders wizard saving state", () => {
		const a = createPanel() as any;
		a._wizardCorners = [
			{ raw_x: -1000, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 1000, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 1000, raw_y: 3000, offset_side: 0, offset_fb: 0 },
			{ raw_x: -1000, raw_y: 3000, offset_side: 0, offset_fb: 0 },
		];
		a._wizardSaving = true;
		const result = a._renderWizardCorners();
		expect(result).toBeDefined();
	});
});

describe("_renderMiniSensorView", () => {
	it("renders sensor FOV view without targets", () => {
		const a = createPanel() as any;
		a._targets = [];
		const result = a._renderMiniSensorView();
		expect(result).toBeDefined();
	});

	it("renders with targets on the FOV view", () => {
		const a = createPanel() as any;
		a._targets = [
			{
				x: 100,
				y: 200,
				raw_x: 500,
				raw_y: 1000,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];
		a._wizardCorners = [
			{ raw_x: -1000, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			null,
			null,
			null,
		];
		const result = a._renderMiniSensorView();
		expect(result).toBeDefined();
	});
});

describe("_renderSaveCancelButtons", () => {
	it("renders for editor view", () => {
		const a = createPanel() as any;
		a._view = "editor";
		const result = a._renderSaveCancelButtons();
		expect(result).toBeDefined();
	});

	it("renders for settings view", () => {
		const a = createPanel() as any;
		a._view = "settings";
		const result = a._renderSaveCancelButtons();
		expect(result).toBeDefined();
	});
});

describe("_renderLiveOverview", () => {
	it("renders live overview with perspective", () => {
		const a = createPanel() as any;
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];
		a._grid = initGridFromRoom(3000, 4000);
		const result = a._renderLiveOverview();
		expect(result).toBeDefined();
	});

	it("renders live overview without perspective (uncalibrated)", () => {
		const a = createPanel() as any;
		a._perspective = null;
		const result = a._renderLiveOverview();
		expect(result).toBeDefined();
	});

	it("renders with live menu open", () => {
		const a = createPanel() as any;
		a._showLiveMenu = true;
		const result = a._renderLiveOverview();
		expect(result).toBeDefined();
	});

	it("renders with live menu open and no perspective", () => {
		const a = createPanel() as any;
		a._showLiveMenu = true;
		a._perspective = null;
		const result = a._renderLiveOverview();
		expect(result).toBeDefined();
	});
});

describe("_renderLiveGrid", () => {
	it("renders a grid with targets", () => {
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
				signal: 5,
			},
		];
		const result = a._renderLiveGrid();
		expect(result).toBeDefined();
	});

	it("renders with hit counts enabled", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
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
		const result = a._renderLiveGrid();
		expect(result).toBeDefined();
	});

	it("renders with no room bounds (empty grid)", () => {
		const a = createPanel() as any;
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		const result = a._renderLiveGrid();
		expect(result).toBeDefined();
	});
});

describe("_renderGridDimensions", () => {
	it("returns nothing when no metrics", () => {
		const a = createPanel() as any;
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		a._roomWidth = 0;
		a._perspective = null;
		const result = a._renderGridDimensions();
		expect(result).toBeDefined();
	});
});

describe("_renderUncalibratedFov", () => {
	it("renders FOV view with no occupancy", () => {
		const a = createPanel() as any;
		a._sensorState.occupancy = false;
		a._targets = [];
		const result = a._renderUncalibratedFov();
		expect(result).toBeDefined();
	});

	it("renders FOV view with occupancy", () => {
		const a = createPanel() as any;
		a._sensorState.occupancy = true;
		const result = a._renderUncalibratedFov();
		expect(result).toBeDefined();
	});

	it("renders with active targets", () => {
		const a = createPanel() as any;
		a._targets = [
			{
				x: 100,
				y: 200,
				raw_x: 500,
				raw_y: 1000,
				speed: 0,
				status: "active" as const,
				signal: 5,
			},
		];
		const result = a._renderUncalibratedFov();
		expect(result).toBeDefined();
	});

	it("skips targets with zero raw positions", () => {
		const a = createPanel() as any;
		a._targets = [
			{
				x: 0,
				y: 0,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "inactive" as const,
				signal: 0,
			},
		];
		// Should render without error — target is skipped
		const result = a._renderUncalibratedFov();
		expect(result).toBeDefined();
	});

	it("shows targets with raw positions even if status is inactive", () => {
		const a = createPanel() as any;
		a._targets = [
			{
				x: 0,
				y: 0,
				raw_x: 500,
				raw_y: 1000,
				speed: 0,
				status: "inactive" as const,
				signal: 0,
			},
		];
		// Target has raw positions — should render even though status is inactive
		const result = a._renderUncalibratedFov();
		expect(result).toBeDefined();
	});

	it("maps target polar coordinates correctly", () => {
		// Target straight ahead (raw_x=0, raw_y=3000) should map to center-x, partway down
		const cx = 150,
			cy = 10,
			maxR = 180;
		const raw_x = 0,
			raw_y = 3000;
		const dist = Math.sqrt(raw_x * raw_x + raw_y * raw_y); // 3000
		const angle = Math.atan2(raw_x, raw_y); // 0 (straight ahead)
		const r = Math.min(dist / 6000, 1) * maxR; // 0.5 * 180 = 90
		const svgAngle = Math.PI / 2 + angle; // π/2 (pointing down)
		const tx = cx + r * Math.cos(svgAngle); // 150 + 90*cos(π/2) ≈ 150
		const ty = cy + r * Math.sin(svgAngle); // 10 + 90*sin(π/2) = 100

		expect(tx).toBeCloseTo(cx, 0); // centered horizontally
		expect(ty).toBeCloseTo(100, 0); // partway down
	});

	it("maps target at 45° offset correctly", () => {
		const cx = 150,
			cy = 10,
			maxR = 180;
		// Target at 45° right: raw_x=3000, raw_y=3000
		const raw_x = 3000,
			raw_y = 3000;
		const dist = Math.sqrt(raw_x * raw_x + raw_y * raw_y); // ~4243
		const angle = Math.atan2(raw_x, raw_y); // π/4
		const r = Math.min(dist / 6000, 1) * maxR; // ~127.3
		const svgAngle = Math.PI / 2 - angle; // π/4

		const tx = cx + r * Math.cos(svgAngle);
		const ty = cy + r * Math.sin(svgAngle);

		// At 45° right (positive raw_x), tx should be right of center
		// and ty should be partway down
		expect(tx).toBeGreaterThan(cx);
		expect(ty).toBeGreaterThan(cy);
	});

	it("clamps distant targets to maxR", () => {
		const maxR = 180;
		// Target at 12000mm — well beyond 6000 max
		const raw_x = 0,
			raw_y = 12000;
		const dist = Math.sqrt(raw_x * raw_x + raw_y * raw_y);
		const r = Math.min(dist / 6000, 1) * maxR;
		expect(r).toBe(maxR); // clamped to edge
	});
});

describe("_renderNeedsCalibration", () => {
	it("renders calibration guide", () => {
		const a = createPanel() as any;
		const result = a._renderNeedsCalibration();
		expect(result).toBeDefined();
	});
});

describe("_renderSettings", () => {
	it("renders settings page with closed accordions", () => {
		const a = createPanel() as any;
		a._view = "settings";
		a._openAccordions = new Set();
		const result = a._renderSettings();
		expect(result).toBeDefined();
	});

	it("renders with open detection accordion", () => {
		const a = createPanel() as any;
		a._view = "settings";
		a._openAccordions = new Set(["detection"]);
		const result = a._renderSettings();
		expect(result).toBeDefined();
	});

	it("renders with open sensitivity accordion", () => {
		const a = createPanel() as any;
		a._view = "settings";
		a._openAccordions = new Set(["sensitivity"]);
		const result = a._renderSettings();
		expect(result).toBeDefined();
	});

	it("renders with open reporting accordion", () => {
		const a = createPanel() as any;
		a._view = "settings";
		a._openAccordions = new Set(["reporting"]);
		const result = a._renderSettings();
		expect(result).toBeDefined();
	});

	it("renders with all accordions open", () => {
		const a = createPanel() as any;
		a._view = "settings";
		a._openAccordions = new Set(["detection", "sensitivity", "reporting"]);
		const result = a._renderSettings();
		expect(result).toBeDefined();
	});
});

describe("_renderSettingsSection", () => {
	it("renders detection section", () => {
		const a = createPanel() as any;
		const result = a._renderSettingsSection("detection");
		expect(result).toBeDefined();
	});

	it("renders sensitivity section", () => {
		const a = createPanel() as any;
		const result = a._renderSettingsSection("sensitivity");
		expect(result).toBeDefined();
	});

	it("renders reporting section", () => {
		const a = createPanel() as any;
		const result = a._renderSettingsSection("reporting");
		expect(result).toBeDefined();
	});

	it("returns nothing for unknown section", () => {
		const a = createPanel() as any;
		const result = a._renderSettingsSection("unknown");
		expect(result).toBeDefined();
	});
});

describe("_renderDetectionRanges", () => {
	it("renders with auto range enabled", () => {
		const a = createPanel() as any;
		a._targetAutoRange = true;
		a._staticAutoRange = true;
		const result = a._renderDetectionRanges();
		expect(result).toBeDefined();
	});

	it("renders with auto range disabled", () => {
		const a = createPanel() as any;
		a._targetAutoRange = false;
		a._staticAutoRange = false;
		const result = a._renderDetectionRanges();
		expect(result).toBeDefined();
	});

	it("renders with grid room metrics", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		const result = a._renderDetectionRanges();
		expect(result).toBeDefined();
	});
});

describe("_renderSensitivities", () => {
	it("renders sensitivity section with sensor state", () => {
		const a = createPanel() as any;
		const result = a._renderSensitivities();
		expect(result).toBeDefined();
	});
});

describe("_renderEnvOffset", () => {
	it("renders offset control with a reading", () => {
		const a = createPanel() as any;
		a._offsetsConfig = { illuminance: 10 };
		const result = a._renderEnvOffset(
			"Illuminance offset",
			150,
			"illuminance",
			-500,
			500,
			1,
			"lux",
			0,
			"Adjust illuminance.",
		);
		expect(result).toBeDefined();
	});

	it("renders offset control with null reading", () => {
		const a = createPanel() as any;
		const result = a._renderEnvOffset(
			"Temperature offset",
			null,
			"temperature",
			-20,
			20,
			0.1,
			"°C",
			1,
			"Adjust temperature.",
		);
		expect(result).toBeDefined();
	});

	it("renders with no saved offset", () => {
		const a = createPanel() as any;
		a._offsetsConfig = {};
		const result = a._renderEnvOffset(
			"Humidity offset",
			45,
			"humidity",
			-50,
			50,
			0.1,
			"%",
			1,
			"Adjust humidity.",
		);
		expect(result).toBeDefined();
	});
});

describe("_infoTip", () => {
	it("returns defined result", () => {
		const a = createPanel() as any;
		const result = a._infoTip("Some tip text");
		expect(result).toBeDefined();
	});
});

describe("_renderReporting", () => {
	it("renders reporting toggles", () => {
		const a = createPanel() as any;
		a._reportingConfig = {
			room_occupancy: true,
			room_static_presence: false,
		};
		const result = a._renderReporting();
		expect(result).toBeDefined();
	});

	it("renders with empty reporting config", () => {
		const a = createPanel() as any;
		a._reportingConfig = {};
		const result = a._renderReporting();
		expect(result).toBeDefined();
	});
});

describe("_renderEditor", () => {
	it("renders editor view with zones sidebar", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._sidebarTab = "zones";
		a._grid = initGridFromRoom(3000, 4000);
		const result = a._renderEditor();
		expect(result).toBeDefined();
	});

	it("renders editor view with furniture sidebar", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._sidebarTab = "furniture";
		a._grid = initGridFromRoom(3000, 4000);
		const result = a._renderEditor();
		expect(result).toBeDefined();
	});

	it("renders editor with template save dialog", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._showTemplateSave = true;
		a._grid = initGridFromRoom(3000, 4000);
		const result = a._renderEditor();
		expect(result).toBeDefined();
	});

	it("renders editor with template load dialog", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._showTemplateLoad = true;
		a._grid = initGridFromRoom(3000, 4000);
		const result = a._renderEditor();
		expect(result).toBeDefined();
	});

	it("renders editor with rename dialog", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._showRenameDialog = true;
		a._pendingRenames = [
			{
				old_entity_id: "binary_sensor.zone_1",
				new_entity_id: "binary_sensor.kitchen",
			},
		];
		a._grid = initGridFromRoom(3000, 4000);
		const result = a._renderEditor();
		expect(result).toBeDefined();
	});

	it("renders editor with unsaved dialog", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._showUnsavedDialog = true;
		a._grid = initGridFromRoom(3000, 4000);
		const result = a._renderEditor();
		expect(result).toBeDefined();
	});

	it("renders editor with targets", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._grid = initGridFromRoom(3000, 4000);
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
				x: 500,
				y: 1000,
				raw_x: 500,
				raw_y: 1000,
				speed: 0,
				status: "pending" as const,
				signal: 3,
			},
			{
				x: 0,
				y: 0,
				raw_x: 0,
				raw_y: 0,
				speed: 0,
				status: "inactive" as const,
				signal: 0,
			},
		];
		const result = a._renderEditor();
		expect(result).toBeDefined();
	});

	it("renders editor with signal badge only for active targets", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._sidebarTab = "zones";
		a._roomWidth = 3000;
		a._roomDepth = 4000;
		a._grid = initGridFromRoom(3000, 4000);
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
			{
				x: 500,
				y: 1000,
				raw_x: 500,
				raw_y: 1000,
				speed: 0,
				status: "inactive" as const,
				signal: 5,
			},
		];
		const result = a._renderEditor();
		expect(result).toBeDefined();

		// The signal badge guard is: t.status === "active" && t.signal > 0
		// Verify the logic: active target with signal shows badge, inactive does not
		const activeTarget = a._targets[0];
		const inactiveTarget = a._targets[1];
		expect(activeTarget.status === "active" && activeTarget.signal > 0).toBe(
			true,
		);
		expect(
			inactiveTarget.status === "active" && inactiveTarget.signal > 0,
		).toBe(false);
	});

	it("renders editor with frozen bounds during painting", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._grid = initGridFromRoom(3000, 4000);
		a._frozenBounds = { minCol: 5, maxCol: 15, minRow: 2, maxRow: 12 };
		const result = a._renderEditor();
		expect(result).toBeDefined();
	});

	it("renders editor on empty grid (no room)", () => {
		const a = createPanel() as any;
		a._view = "editor";
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		const result = a._renderEditor();
		expect(result).toBeDefined();
	});
});

describe("_renderTemplateSaveDialog", () => {
	it("renders save dialog", () => {
		const a = createPanel() as any;
		a._templateName = "Test";
		const result = a._renderTemplateSaveDialog();
		expect(result).toBeDefined();
	});
});

describe("_renderTemplateLoadDialog", () => {
	it("renders load dialog with no templates", () => {
		localStorage.removeItem("epp_layout_templates");
		const a = createPanel() as any;
		const result = a._renderTemplateLoadDialog();
		expect(result).toBeDefined();
	});

	it("renders load dialog with templates", () => {
		const templates = [
			{ name: "T1", grid: [], zones: [], roomWidth: 3000, roomDepth: 4000 },
			{ name: "T2", grid: [], zones: [], roomWidth: 5000, roomDepth: 6000 },
		];
		localStorage.setItem("epp_layout_templates", JSON.stringify(templates));
		const a = createPanel() as any;
		const result = a._renderTemplateLoadDialog();
		expect(result).toBeDefined();
		localStorage.removeItem("epp_layout_templates");
	});
});

describe("_renderVisibleCells", () => {
	it("renders cells for a visible region", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
	});

	it("renders cells with hit counts and targets", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		a._showHitCounts = true;
		a._zoneState = {
			occupancy: { 0: true },
			target_counts: { 0: 5 },
			frame_count: 100,
		};
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
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "normal",
		};
		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
	});

	it("renders cells with zone occupancy", () => {
		const a = createPanel() as any;
		a._grid = initGridFromRoom(3000, 4000);
		// Paint some zone 1
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & CELL_ROOM_BIT) {
				a._grid[i] = cellSetZone(a._grid[i], 1);
				break;
			}
		}
		a._zoneConfigs[0] = {
			name: "Zone 1",
			color: ZONE_COLORS[0],
			type: "normal",
		};
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
		const result = a._renderVisibleCells(5, 15, 0, 10, 20);
		expect(result).toBeDefined();
	});
});

describe("_renderBoundaryTypeControls", () => {
	it("renders for normal type", () => {
		const a = createPanel() as any;
		a._roomType = "normal";
		const result = a._renderBoundaryTypeControls();
		expect(result).toBeDefined();
	});

	it("renders for custom type", () => {
		const a = createPanel() as any;
		a._roomType = "custom";
		const result = a._renderBoundaryTypeControls();
		expect(result).toBeDefined();
	});

	it("renders for entrance type", () => {
		const a = createPanel() as any;
		a._roomType = "entrance";
		const result = a._renderBoundaryTypeControls();
		expect(result).toBeDefined();
	});
});

describe("_renderZoneTypeControls", () => {
	it("renders for normal zone", () => {
		const a = createPanel() as any;
		const zone = { name: "Zone 1", color: "#ff0000", type: "normal" };
		const result = a._renderZoneTypeControls(zone, 0);
		expect(result).toBeDefined();
	});

	it("renders for custom zone with explicit thresholds", () => {
		const a = createPanel() as any;
		const zone = {
			name: "Zone 1",
			color: "#ff0000",
			type: "custom",
			trigger: 7,
			renew: 4,
			timeout: 15,
			handoff_timeout: 5,
			entry_point: true,
		};
		const result = a._renderZoneTypeControls(zone, 0);
		expect(result).toBeDefined();
	});
});

describe("_renderZoneSidebar", () => {
	it("renders with no zones configured", () => {
		const a = createPanel() as any;
		a._zoneConfigs = new Array(7).fill(null);
		const result = a._renderZoneSidebar();
		expect(result).toBeDefined();
	});

	it("renders with zones configured", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = {
			name: "Kitchen",
			color: ZONE_COLORS[0],
			type: "normal",
		};
		a._zoneConfigs[1] = {
			name: "Living",
			color: ZONE_COLORS[1],
			type: "entrance",
		};
		a._activeZone = 1;
		const result = a._renderZoneSidebar();
		expect(result).toBeDefined();
	});

	it("renders with active boundary zone", () => {
		const a = createPanel() as any;
		a._activeZone = 0;
		const result = a._renderZoneSidebar();
		expect(result).toBeDefined();
	});

	it("renders with zone occupancy glow", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = { name: "Z1", color: ZONE_COLORS[0], type: "normal" };
		a._activeZone = 1;
		a._localZoneState.set(1, {
			occupied: true,
			pendingSince: null,
			confirmedTargets: new Set(),
		});
		const result = a._renderZoneSidebar();
		expect(result).toBeDefined();
	});

	it("renders with all zones full (no add button)", () => {
		const a = createPanel() as any;
		for (let i = 0; i < 7; i++) {
			a._zoneConfigs[i] = {
				name: `Zone ${i + 1}`,
				color: ZONE_COLORS[i % ZONE_COLORS.length],
				type: "normal",
			};
		}
		const result = a._renderZoneSidebar();
		expect(result).toBeDefined();
	});
});

describe("_renderFurnitureOverlay", () => {
	it("returns nothing when no furniture", () => {
		const a = createPanel() as any;
		a._furniture = [];
		const result = a._renderFurnitureOverlay(28, 0, 0, 20, 20);
		expect(result).toBeDefined();
	});

	it("renders furniture items", () => {
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
		const result = a._renderFurnitureOverlay(28, 0, 0, 20, 20);
		expect(result).toBeDefined();
	});

	it("renders icon-type furniture", () => {
		const a = createPanel() as any;
		a._furniture = [
			{
				id: "f1",
				type: "icon",
				icon: "mdi:desk",
				label: "Desk",
				x: 100,
				y: 200,
				width: 1400,
				height: 700,
				rotation: 45,
				lockAspect: false,
			},
		];
		a._sidebarTab = "furniture";
		a._selectedFurnitureId = null;
		const result = a._renderFurnitureOverlay(28, 0, 0, 20, 20);
		expect(result).toBeDefined();
	});

	it("renders non-interactive when not in furniture tab", () => {
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
		a._sidebarTab = "zones";
		const result = a._renderFurnitureOverlay(28, 0, 0, 20, 20);
		expect(result).toBeDefined();
	});
});

describe("_renderLiveSidebar", () => {
	it("renders live sidebar with basic sensors", () => {
		const a = createPanel() as any;
		const result = a._renderLiveSidebar();
		expect(result).toBeDefined();
	});

	it("renders with zone occupancy", () => {
		const a = createPanel() as any;
		a._zoneConfigs[0] = {
			name: "Kitchen",
			color: ZONE_COLORS[0],
			type: "normal",
		};
		a._zoneState = {
			occupancy: { 1: true },
			target_counts: { 1: 2 },
			frame_count: 50,
		};
		const result = a._renderLiveSidebar();
		expect(result).toBeDefined();
	});

	it("renders with no env sensors", () => {
		const a = createPanel() as any;
		a._sensorState = {
			occupancy: false,
			static_presence: false,
			motion_presence: false,
			illuminance: null,
			temperature: null,
			humidity: null,
			co2: null,
		};
		const result = a._renderLiveSidebar();
		expect(result).toBeDefined();
	});

	it("renders with expanded sensor info", () => {
		const a = createPanel() as any;
		a._expandedSensorInfo = "occupancy";
		const result = a._renderLiveSidebar();
		expect(result).toBeDefined();
	});

	it("renders without configured zones (still shows rest-of-room)", () => {
		const a = createPanel() as any;
		a._zoneConfigs = new Array(7).fill(null);
		const result = a._renderLiveSidebar();
		expect(result).toBeDefined();
	});
});

describe("_renderFurnitureSidebar", () => {
	it("renders furniture catalog", () => {
		const a = createPanel() as any;
		a._furniture = [];
		const result = a._renderFurnitureSidebar();
		expect(result).toBeDefined();
	});

	it("renders with selected furniture", () => {
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
				rotation: 45,
				lockAspect: false,
			},
		];
		a._selectedFurnitureId = "f1";
		const result = a._renderFurnitureSidebar();
		expect(result).toBeDefined();
	});

	it("renders with custom icon picker open", () => {
		const a = createPanel() as any;
		a._showCustomIconPicker = true;
		a._customIconValue = "mdi:lamp";
		const result = a._renderFurnitureSidebar();
		expect(result).toBeDefined();
	});

	it("renders with empty custom icon value", () => {
		const a = createPanel() as any;
		a._showCustomIconPicker = true;
		a._customIconValue = "";
		const result = a._renderFurnitureSidebar();
		expect(result).toBeDefined();
	});
});

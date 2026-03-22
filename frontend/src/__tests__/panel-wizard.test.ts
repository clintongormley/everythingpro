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
	a._perspective = null;
	a._roomWidth = 0;
	a._roomDepth = 0;
	a._furniture = [];
	a._selectedFurnitureId = null;
	a._setupStep = null;
	a._wizardCornerIndex = 0;
	a._wizardCorners = [null, null, null, null];
	a._wizardRoomWidth = 0;
	a._wizardRoomDepth = 0;
	a._wizardCapturing = false;
	a._wizardCaptureProgress = 0;
	a._wizardCapturePaused = false;
	a._wizardCaptureCancelled = false;
	a._wizardOffsetSide = "";
	a._wizardOffsetFb = "";
	a._wizardSaving = false;
	a._targets = [];
	a._entries = [
		{
			entry_id: "e1",
			title: "Test",
			room_name: "",
			has_perspective: false,
			has_layout: false,
		},
	];
	a._selectedEntryId = "e1";
	a._view = "live";
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
	a._showUnsavedDialog = false;
	a._pendingNavigation = null;
	a._smoothBuffer = [];
	return el;
}

describe("_syncCornerOffsets", () => {
	it("sets offset fields from current corner data", () => {
		const el = createPanel();
		const a = el as any;
		a._wizardCorners = [
			{ raw_x: 100, raw_y: 200, offset_side: 500, offset_fb: 300 },
			null,
			null,
			null,
		];
		a._wizardCornerIndex = 0;

		a._syncCornerOffsets();

		expect(a._wizardOffsetSide).toBe("50");
		expect(a._wizardOffsetFb).toBe("30");
	});

	it("sets empty strings when corner is null", () => {
		const el = createPanel();
		const a = el as any;
		a._wizardCorners = [null, null, null, null];
		a._wizardCornerIndex = 0;

		a._syncCornerOffsets();

		expect(a._wizardOffsetSide).toBe("");
		expect(a._wizardOffsetFb).toBe("");
	});

	it("handles corner with zero offsets", () => {
		const el = createPanel();
		const a = el as any;
		a._wizardCorners = [
			{ raw_x: 100, raw_y: 200, offset_side: 0, offset_fb: 0 },
			null,
			null,
			null,
		];
		a._wizardCornerIndex = 0;

		a._syncCornerOffsets();

		expect(a._wizardOffsetSide).toBe("");
		expect(a._wizardOffsetFb).toBe("");
	});
});

describe("_wizardCancelCapture", () => {
	it("resets capture state", () => {
		const el = createPanel();
		const a = el as any;
		a._wizardCapturing = true;
		a._wizardCapturePaused = true;

		a._wizardCancelCapture();

		expect(a._wizardCaptureCancelled).toBe(true);
		expect(a._wizardCapturing).toBe(false);
		expect(a._wizardCapturePaused).toBe(false);
	});
});

describe("_wizardStartCapture", () => {
	it("does nothing when no active target", () => {
		const el = createPanel();
		const a = el as any;
		a._targets = [
			{
				x: 0,
				y: 0,
				raw_x: null,
				raw_y: null,
				speed: 0,
				status: "inactive" as const,
				signal: 0,
			},
		];

		a._wizardStartCapture();

		expect(a._wizardCapturing).toBe(false);
	});

	it("starts capture when active target exists", () => {
		const el = createPanel();
		const a = el as any;
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
		expect(a._wizardCaptureProgress).toBe(0);
		expect(a._wizardCapturePaused).toBe(false);
		expect(a._wizardCaptureCancelled).toBe(false);

		// Cancel to stop the animation loop
		a._wizardCaptureCancelled = true;
	});
});

describe("_autoComputeRoomDimensions", () => {
	it("computes room width and depth from wizard corners", () => {
		const el = createPanel();
		const a = el as any;
		// Front-left, Front-right, Back-right, Back-left
		a._wizardCorners = [
			{ raw_x: -1000, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 1000, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 1000, raw_y: 3000, offset_side: 0, offset_fb: 0 },
			{ raw_x: -1000, raw_y: 3000, offset_side: 0, offset_fb: 0 },
		];

		a._autoComputeRoomDimensions();

		expect(a._wizardRoomWidth).toBeGreaterThan(0);
		expect(a._wizardRoomDepth).toBeGreaterThan(0);
	});
});

describe("_computeWizardPerspective", () => {
	it("does nothing when not all corners marked", () => {
		const el = createPanel();
		const a = el as any;
		a._wizardCorners = [
			{ raw_x: -1000, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			null,
			null,
			null,
		];
		a._wizardRoomWidth = 3000;
		a._wizardRoomDepth = 4000;

		a._computeWizardPerspective();

		expect(a._perspective).toBeNull();
	});

	it("solves perspective when all 4 corners are marked", () => {
		const el = createPanel();
		const a = el as any;
		a._wizardCorners = [
			{ raw_x: -1500, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 1500, raw_y: 1000, offset_side: 0, offset_fb: 0 },
			{ raw_x: 2000, raw_y: 4000, offset_side: 0, offset_fb: 0 },
			{ raw_x: -2000, raw_y: 4000, offset_side: 0, offset_fb: 0 },
		];
		a._wizardRoomWidth = 3000;
		a._wizardRoomDepth = 4000;

		a._computeWizardPerspective();

		expect(a._perspective).not.toBeNull();
		expect(a._perspective).toHaveLength(8);
		expect(a._roomWidth).toBe(3000);
		expect(a._roomDepth).toBe(4000);
	});
});

describe("_wizardFinish", () => {
	it("does nothing when perspective is null", async () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = null;

		await a._wizardFinish();

		expect(el.hass.callWS).not.toHaveBeenCalled();
	});

	it("saves calibration, inits grid, and navigates to live", async () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];
		a._selectedEntryId = "e1";
		a._wizardRoomWidth = 3000;
		a._wizardRoomDepth = 4000;

		el.hass = {
			callWS: vi.fn().mockResolvedValue({}),
		};

		await a._wizardFinish();

		expect(el.hass.callWS).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "everything_presence_pro/set_setup",
				entry_id: "e1",
				perspective: [1, 0, 0, 0, 1, 0, 0, 0],
				room_width: 3000,
				room_depth: 4000,
			}),
		);
		expect(a._roomWidth).toBe(3000);
		expect(a._roomDepth).toBe(4000);
		expect(a._setupStep).toBeNull();
		expect(a._view).toBe("live");
		expect(a._wizardSaving).toBe(false);
	});

	it("resets saving flag on error", async () => {
		const el = createPanel();
		const a = el as any;
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];
		a._selectedEntryId = "e1";
		a._wizardRoomWidth = 3000;
		a._wizardRoomDepth = 4000;

		el.hass = {
			callWS: vi.fn().mockRejectedValue(new Error("fail")),
		};

		await expect(a._wizardFinish()).rejects.toThrow("fail");
		expect(a._wizardSaving).toBe(false);
	});
});

describe("_changePlacement", () => {
	it("sets up wizard state when not dirty", () => {
		const el = createPanel();
		const a = el as any;
		a._dirty = false;
		a._roomWidth = 3000;
		a._roomDepth = 4000;

		a._changePlacement();

		expect(a._setupStep).toBe("guide");
		expect(a._wizardCornerIndex).toBe(0);
		expect(a._wizardCorners).toEqual([null, null, null, null]);
		expect(a._wizardRoomWidth).toBe(3000);
		expect(a._wizardRoomDepth).toBe(4000);
	});

	it("shows unsaved dialog when dirty", () => {
		const el = createPanel();
		const a = el as any;
		a._dirty = true;

		a._changePlacement();

		expect(a._showUnsavedDialog).toBe(true);
		expect(a._setupStep).toBeNull(); // not yet applied
	});
});

describe("_getSmoothedRaw", () => {
	it("returns null when no active target", () => {
		const el = createPanel();
		const a = el as any;
		a._targets = [];

		expect(a._getSmoothedRaw()).toBeNull();
	});

	it("returns smoothed value when active target exists", () => {
		const el = createPanel();
		const a = el as any;
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
		a._smoothBuffer = [];

		const result = a._getSmoothedRaw();

		expect(result).not.toBeNull();
		expect(result.x).toBeCloseTo(500, 0);
		expect(result.y).toBeCloseTo(1000, 0);
	});
});

describe("_getWizardTargetStyle", () => {
	it("returns a style string with left and top percentages", () => {
		const el = createPanel();
		const a = el as any;
		const target = {
			x: 0,
			y: 3000,
			raw_x: 0,
			raw_y: 3000,
			speed: 0,
			status: "active" as const,
			signal: 5,
		};

		const style = a._getWizardTargetStyle(target);

		expect(style).toContain("left:");
		expect(style).toContain("top:");
		expect(style).toContain("%");
	});
});

describe("_rawToFovPct", () => {
	it("maps sensor center to approximately 50% x", () => {
		const el = createPanel();
		const a = el as any;
		const result = a._rawToFovPct(0, 3000);
		expect(result.xPct).toBeCloseTo(50, 0);
	});
});

describe("_solvePerspective", () => {
	it("delegates to perspective lib", () => {
		const el = createPanel();
		const a = el as any;
		const src = [
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			{ x: 1, y: 1 },
			{ x: 0, y: 1 },
		];
		const dst = [
			{ x: 0, y: 0 },
			{ x: 100, y: 0 },
			{ x: 100, y: 100 },
			{ x: 0, y: 100 },
		];

		const result = a._solvePerspective(src, dst);
		expect(result).not.toBeNull();
		expect(result).toHaveLength(8);
	});
});

describe("_initGridFromRoom", () => {
	it("creates a grid based on room dimensions", () => {
		const el = createPanel();
		const a = el as any;
		a._roomWidth = 3000;
		a._roomDepth = 4000;

		a._initGridFromRoom();

		expect(a._grid).toBeInstanceOf(Uint8Array);
		expect(a._grid.length).toBe(GRID_CELL_COUNT);
		// Some cells should be marked as inside (CELL_ROOM_BIT = 0x01)
		let insideCount = 0;
		for (let i = 0; i < a._grid.length; i++) {
			if (a._grid[i] & 0x01) insideCount++;
		}
		expect(insideCount).toBeGreaterThan(0);
	});
});

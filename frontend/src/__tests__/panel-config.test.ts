import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EverythingPresenceProPanel } from "../everything-presence-pro-panel.js";
import "../everything-presence-pro-panel.js";
import { GRID_CELL_COUNT } from "../lib/grid.js";
import { ZONE_TYPE_DEFAULTS } from "../lib/zone-defaults.js";

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
	a._entries = [];
	a._selectedEntryId = "";
	a._perspective = null;
	a._roomWidth = 0;
	a._roomDepth = 0;
	a._furniture = [];
	a._selectedFurnitureId = null;
	a._setupStep = null;
	a._saving = false;
	a._showUnsavedDialog = false;
	a._pendingNavigation = null;
	a._showRenameDialog = false;
	a._pendingRenames = [];
	a._view = "live";
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
	return el;
}

describe("_initialize", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("does nothing when hass is null", async () => {
		const a = el as any;
		el.hass = null;
		await a._initialize();
		expect(a._loading).toBe(false); // unchanged from setup
	});

	it("loads entries and config when hass is available", async () => {
		const a = el as any;
		const entries = [
			{
				entry_id: "e1",
				title: "Sensor 1",
				room_name: "Living room",
				has_perspective: true,
				has_layout: true,
			},
		];
		el.hass = {
			callWS: vi.fn().mockImplementation((msg: any) => {
				if (msg.type === "everything_presence_pro/list_entries") {
					return Promise.resolve(entries);
				}
				if (msg.type === "everything_presence_pro/get_config") {
					return Promise.resolve({
						calibration: { perspective: null, room_width: 0, room_depth: 0 },
						room_layout: {},
					});
				}
				return Promise.resolve({});
			}),
			connection: {
				subscribeMessage: vi.fn().mockResolvedValue(() => {}),
			},
		};

		await a._initialize();

		expect(a._loading).toBe(false);
		expect(a._entries).toEqual(entries);
	});
});

describe("_loadEntries", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("sorts entries alphabetically by title", async () => {
		const a = el as any;
		const entries = [
			{
				entry_id: "e2",
				title: "Zebra",
				room_name: "",
				has_perspective: false,
				has_layout: false,
			},
			{
				entry_id: "e1",
				title: "Apple",
				room_name: "",
				has_perspective: false,
				has_layout: false,
			},
		];
		el.hass = {
			callWS: vi.fn().mockResolvedValue(entries),
		};

		await a._loadEntries();

		expect(a._entries[0].title).toBe("Apple");
		expect(a._entries[1].title).toBe("Zebra");
	});

	it("sets _entries to empty on error", async () => {
		const a = el as any;
		el.hass = {
			callWS: vi.fn().mockRejectedValue(new Error("fail")),
		};

		await a._loadEntries();

		expect(a._entries).toEqual([]);
	});

	it("selects the stored entry from localStorage if available", async () => {
		const a = el as any;
		const entries = [
			{
				entry_id: "e1",
				title: "A",
				room_name: "",
				has_perspective: false,
				has_layout: false,
			},
			{
				entry_id: "e2",
				title: "B",
				room_name: "",
				has_perspective: false,
				has_layout: false,
			},
		];
		el.hass = {
			callWS: vi.fn().mockResolvedValue(entries),
		};

		localStorage.setItem("epp_selected_entry", "e2");

		await a._loadEntries();

		expect(a._selectedEntryId).toBe("e2");

		localStorage.removeItem("epp_selected_entry");
	});

	it("selects first entry when stored entry not found", async () => {
		const a = el as any;
		const entries = [
			{
				entry_id: "e1",
				title: "A",
				room_name: "",
				has_perspective: false,
				has_layout: false,
			},
		];
		el.hass = {
			callWS: vi.fn().mockResolvedValue(entries),
		};

		localStorage.setItem("epp_selected_entry", "nonexistent");

		await a._loadEntries();

		expect(a._selectedEntryId).toBe("e1");

		localStorage.removeItem("epp_selected_entry");
	});

	it("sets empty string when no entries available", async () => {
		const a = el as any;
		el.hass = {
			callWS: vi.fn().mockResolvedValue([]),
		};

		await a._loadEntries();

		expect(a._selectedEntryId).toBe("");
	});
});

describe("_loadEntryConfig", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("calls get_config and subscribes targets", async () => {
		const a = el as any;
		const unsubFn = vi.fn();
		el.hass = {
			callWS: vi.fn().mockResolvedValue({
				calibration: {
					perspective: [1, 0, 0, 0, 1, 0, 0, 0],
					room_width: 3000,
					room_depth: 4000,
				},
				room_layout: {},
			}),
			connection: {
				subscribeMessage: vi.fn().mockResolvedValue(unsubFn),
			},
		};

		await a._loadEntryConfig("e1");

		expect(el.hass.callWS).toHaveBeenCalledWith({
			type: "everything_presence_pro/get_config",
			entry_id: "e1",
		});
		expect(el.hass.connection.subscribeMessage).toHaveBeenCalled();
	});

	it("handles error gracefully", async () => {
		const a = el as any;
		el.hass = {
			callWS: vi.fn().mockRejectedValue(new Error("fail")),
			connection: {
				subscribeMessage: vi.fn().mockResolvedValue(() => {}),
			},
		};

		// Should not throw
		await expect(a._loadEntryConfig("e1")).resolves.toBeUndefined();
	});
});

describe("_applyConfig", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("applies calibration data from config", () => {
		const a = el as any;
		const config = {
			calibration: {
				perspective: [1, 0, 0, 0, 1, 0, 0, 0],
				room_width: 3000,
				room_depth: 4000,
			},
			room_layout: {},
		};

		a._applyConfig(config);

		expect(a._perspective).toEqual([1, 0, 0, 0, 1, 0, 0, 0]);
		expect(a._roomWidth).toBe(3000);
		expect(a._roomDepth).toBe(4000);
		expect(a._setupStep).toBeNull();
	});

	it("applies furniture from config", () => {
		const a = el as any;
		const config = {
			calibration: {
				perspective: [1, 0, 0, 0, 1, 0, 0, 0],
				room_width: 3000,
				room_depth: 4000,
			},
			room_layout: {
				furniture: [
					{
						type: "svg",
						icon: "armchair",
						label: "Chair",
						x: 100,
						y: 200,
						width: 800,
						height: 800,
						rotation: 0,
					},
				],
			},
		};

		a._applyConfig(config);

		expect(a._furniture).toHaveLength(1);
		expect(a._furniture[0].icon).toBe("armchair");
	});

	it("applies room thresholds from config", () => {
		const a = el as any;
		const config = {
			calibration: {
				perspective: null,
				room_width: 0,
				room_depth: 0,
			},
			room_layout: {
				room_type: "entrance",
				room_trigger: 3,
				room_renew: 2,
				room_timeout: 5,
				room_handoff_timeout: 2,
				room_entry_point: true,
			},
		};

		a._applyConfig(config);

		expect(a._roomType).toBe("entrance");
		expect(a._roomTrigger).toBe(3);
		expect(a._roomRenew).toBe(2);
		expect(a._roomTimeout).toBe(5);
		expect(a._roomHandoffTimeout).toBe(2);
		expect(a._roomEntryPoint).toBe(true);
	});

	it("applies reporting and offsets config", () => {
		const a = el as any;
		const config = {
			calibration: { perspective: null, room_width: 0, room_depth: 0 },
			room_layout: {},
			reporting: { room_occupancy: true },
			offsets: { illuminance: 10 },
		};

		a._applyConfig(config);

		expect(a._reportingConfig).toEqual({ room_occupancy: true });
		expect(a._offsetsConfig).toEqual({ illuminance: 10 });
	});
});

describe("_applyLayout", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("calls set_room_layout and resets dirty", async () => {
		const a = el as any;
		a._selectedEntryId = "e1";
		a._dirty = true;
		a._roomType = "normal";
		a._roomTrigger = 5;
		a._roomRenew = 3;
		a._roomTimeout = 10;
		a._roomHandoffTimeout = 3;
		a._roomEntryPoint = false;

		el.hass = {
			callWS: vi.fn().mockResolvedValue({}),
		};

		await a._applyLayout();

		expect(el.hass.callWS).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "everything_presence_pro/set_room_layout",
				entry_id: "e1",
			}),
		);
		expect(a._dirty).toBe(false);
		expect(a._saving).toBe(false);
		expect(a._view).toBe("live");
	});

	it("handles entity_id_renames from response", async () => {
		const a = el as any;
		a._selectedEntryId = "e1";
		a._dirty = true;

		el.hass = {
			callWS: vi.fn().mockResolvedValue({
				entity_id_renames: [
					{
						old_entity_id: "binary_sensor.old",
						new_entity_id: "binary_sensor.new",
					},
				],
			}),
		};

		await a._applyLayout();

		expect(a._pendingRenames).toHaveLength(1);
		expect(a._showRenameDialog).toBe(true);
	});

	it("resets _saving on error", async () => {
		const a = el as any;
		a._selectedEntryId = "e1";
		a._dirty = true;

		el.hass = {
			callWS: vi.fn().mockRejectedValue(new Error("fail")),
		};

		await expect(a._applyLayout()).rejects.toThrow("fail");
		expect(a._saving).toBe(false);
	});
});

describe("_saveSettings", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("resets saving flag even when container is missing", async () => {
		const a = el as any;
		a._selectedEntryId = "e1";
		a._dirty = true;
		a._saving = false;

		const callWS = vi.fn().mockResolvedValue({});
		el.hass = { callWS };

		// Provide a minimal shadowRoot mock with no .settings-container
		Object.defineProperty(el, "shadowRoot", {
			value: {
				querySelector: () => null,
				querySelectorAll: () => [],
			},
			configurable: true,
		});

		await a._saveSettings();

		// callWS should not have been called since container is null
		expect(callWS).not.toHaveBeenCalled();
		expect(a._saving).toBe(false);
	});
});

describe("_applyRenames", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("does nothing when no pending renames", async () => {
		const a = el as any;
		el.hass = {
			callWS: vi.fn().mockResolvedValue({}),
		};

		await a._applyRenames();
		expect(el.hass.callWS).not.toHaveBeenCalled();
	});

	it("calls rename_zone_entities WS and clears state", async () => {
		const a = el as any;
		a._selectedEntryId = "e1";
		a._pendingRenames = [
			{
				old_entity_id: "binary_sensor.zone_1",
				new_entity_id: "binary_sensor.kitchen",
			},
		];
		a._showRenameDialog = true;

		el.hass = {
			callWS: vi.fn().mockResolvedValue({ errors: [] }),
		};

		await a._applyRenames();

		expect(el.hass.callWS).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "everything_presence_pro/rename_zone_entities",
				entry_id: "e1",
			}),
		);
		expect(a._showRenameDialog).toBe(false);
		expect(a._pendingRenames).toEqual([]);
	});

	it("handles rename errors gracefully", async () => {
		const a = el as any;
		a._selectedEntryId = "e1";
		a._pendingRenames = [
			{
				old_entity_id: "binary_sensor.zone_1",
				new_entity_id: "binary_sensor.kitchen",
			},
		];
		a._showRenameDialog = true;

		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		el.hass = {
			callWS: vi.fn().mockResolvedValue({ errors: ["some rename error"] }),
		};

		await a._applyRenames();

		expect(warn).toHaveBeenCalled();
		expect(a._showRenameDialog).toBe(false);
		warn.mockRestore();
	});

	it("cleans up even on WS error", async () => {
		const a = el as any;
		a._selectedEntryId = "e1";
		a._pendingRenames = [
			{
				old_entity_id: "binary_sensor.zone_1",
				new_entity_id: "binary_sensor.kitchen",
			},
		];
		a._showRenameDialog = true;

		el.hass = {
			callWS: vi.fn().mockRejectedValue(new Error("fail")),
		};

		await expect(a._applyRenames()).rejects.toThrow("fail");
		expect(a._showRenameDialog).toBe(false);
		expect(a._pendingRenames).toEqual([]);
	});
});

describe("_dismissRenameDialog", () => {
	it("clears rename state", () => {
		const el = createPanel();
		const a = el as any;
		a._showRenameDialog = true;
		a._pendingRenames = [{ old_entity_id: "a", new_entity_id: "b" }];

		a._dismissRenameDialog();

		expect(a._showRenameDialog).toBe(false);
		expect(a._pendingRenames).toEqual([]);
	});
});

describe("_deleteCalibration", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("resets all calibration state and calls backend", async () => {
		const a = el as any;
		a._selectedEntryId = "e1";
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];
		a._roomWidth = 3000;
		a._roomDepth = 4000;
		a._dirty = true;

		el.hass = {
			callWS: vi.fn().mockResolvedValue({}),
		};

		await a._deleteCalibration();

		expect(a._perspective).toBeNull();
		expect(a._roomWidth).toBe(0);
		expect(a._roomDepth).toBe(0);
		expect(a._zoneConfigs.every((z: any) => z === null)).toBe(true);
		expect(a._furniture).toEqual([]);
		expect(a._dirty).toBe(false);
		expect(a._view).toBe("live");
		expect(a._roomType).toBe("normal");
		expect(a._roomEntryPoint).toBe(false);

		// Should have called set_setup and set_room_layout
		expect(el.hass.callWS).toHaveBeenCalledTimes(2);
	});

	it("handles backend error gracefully", async () => {
		const a = el as any;
		a._selectedEntryId = "e1";
		a._perspective = [1, 0, 0, 0, 1, 0, 0, 0];

		const err = vi.spyOn(console, "error").mockImplementation(() => {});
		el.hass = {
			callWS: vi.fn().mockRejectedValue(new Error("fail")),
		};

		await a._deleteCalibration();

		expect(err).toHaveBeenCalled();
		expect(a._dirty).toBe(false);
		err.mockRestore();
	});
});

describe("_onDeviceChange", () => {
	it("guards navigation and loads new config", async () => {
		const el = createPanel();
		const a = el as any;
		a._dirty = false;
		a._selectedEntryId = "old";

		el.hass = {
			callWS: vi.fn().mockResolvedValue({
				calibration: { perspective: null, room_width: 0, room_depth: 0 },
				room_layout: {},
			}),
			connection: {
				subscribeMessage: vi.fn().mockResolvedValue(() => {}),
			},
		};

		const fakeEvent = {
			target: { value: "new_entry" },
		};

		await a._onDeviceChange(fakeEvent);

		expect(a._selectedEntryId).toBe("new_entry");
	});

	it("shows unsaved dialog when dirty", async () => {
		const el = createPanel();
		const a = el as any;
		a._dirty = true;

		const fakeEvent = {
			target: { value: "new_entry" },
		};

		a._onDeviceChange(fakeEvent);

		expect(a._showUnsavedDialog).toBe(true);
	});
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EverythingPresenceProPanel } from "../everything-presence-pro-panel.js";
import "../everything-presence-pro-panel.js";
import { CELL_ROOM_BIT, GRID_CELL_COUNT } from "../lib/grid.js";
import { ZONE_COLORS } from "../lib/zone-defaults.js";

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
	a._roomWidth = 3000;
	a._roomDepth = 4000;
	a._furniture = [];
	a._selectedFurnitureId = null;
	a._showTemplateSave = false;
	a._showTemplateLoad = false;
	a._templateName = "";
	return el;
}

describe("_getTemplates", () => {
	afterEach(() => {
		localStorage.removeItem("epp_layout_templates");
	});

	it("returns empty array when no templates stored", () => {
		const a = createPanel() as any;
		localStorage.removeItem("epp_layout_templates");

		expect(a._getTemplates()).toEqual([]);
	});

	it("returns stored templates", () => {
		const templates = [
			{
				name: "Test",
				grid: [],
				zones: [],
				roomWidth: 3000,
				roomDepth: 4000,
			},
		];
		localStorage.setItem("epp_layout_templates", JSON.stringify(templates));
		const a = createPanel() as any;

		expect(a._getTemplates()).toEqual(templates);
	});

	it("returns empty array on invalid JSON", () => {
		localStorage.setItem("epp_layout_templates", "not json");
		const a = createPanel() as any;

		expect(a._getTemplates()).toEqual([]);
	});
});

describe("_saveTemplate", () => {
	afterEach(() => {
		localStorage.removeItem("epp_layout_templates");
	});

	it("does nothing when name is empty", () => {
		const a = createPanel() as any;
		a._templateName = "";

		a._saveTemplate();

		expect(a._getTemplates()).toEqual([]);
	});

	it("does nothing when name is whitespace only", () => {
		const a = createPanel() as any;
		a._templateName = "   ";

		a._saveTemplate();

		expect(a._getTemplates()).toEqual([]);
	});

	it("saves a new template", () => {
		const a = createPanel() as any;
		a._templateName = "My layout";
		a._grid = new Uint8Array(GRID_CELL_COUNT);
		a._grid[0] = CELL_ROOM_BIT;
		a._zoneConfigs = [
			{ name: "Zone 1", color: ZONE_COLORS[0], type: "normal" },
			null,
			null,
			null,
			null,
			null,
			null,
		];
		a._roomWidth = 5000;
		a._roomDepth = 6000;
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

		a._saveTemplate();

		const templates = a._getTemplates();
		expect(templates).toHaveLength(1);
		expect(templates[0].name).toBe("My layout");
		expect(templates[0].roomWidth).toBe(5000);
		expect(templates[0].furniture).toHaveLength(1);
		expect(a._showTemplateSave).toBe(false);
		expect(a._templateName).toBe("");
	});

	it("overwrites existing template with same name", () => {
		const a = createPanel() as any;
		a._templateName = "Template A";
		a._roomWidth = 1000;
		a._saveTemplate();

		a._templateName = "Template A";
		a._roomWidth = 2000;
		a._saveTemplate();

		const templates = a._getTemplates();
		expect(templates).toHaveLength(1);
		expect(templates[0].roomWidth).toBe(2000);
	});

	it("adds new templates to existing list", () => {
		const a = createPanel() as any;
		a._templateName = "Template A";
		a._saveTemplate();

		a._templateName = "Template B";
		a._saveTemplate();

		expect(a._getTemplates()).toHaveLength(2);
	});
});

describe("_loadTemplate", () => {
	afterEach(() => {
		localStorage.removeItem("epp_layout_templates");
	});

	it("loads a template by name", () => {
		const grid = new Array(GRID_CELL_COUNT).fill(0);
		grid[0] = CELL_ROOM_BIT;
		const templates = [
			{
				name: "Saved",
				grid,
				zones: [{ name: "Z1", color: "#ff0000", type: "normal" }],
				roomWidth: 5000,
				roomDepth: 6000,
				furniture: [
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
				],
			},
		];
		localStorage.setItem("epp_layout_templates", JSON.stringify(templates));

		const a = createPanel() as any;

		a._loadTemplate("Saved");

		expect(a._grid[0]).toBe(CELL_ROOM_BIT);
		expect(a._roomWidth).toBe(5000);
		expect(a._roomDepth).toBe(6000);
		expect(a._zoneConfigs[0]).not.toBeNull();
		expect(a._zoneConfigs[0].name).toBe("Z1");
		expect(a._furniture).toHaveLength(1);
		expect(a._showTemplateLoad).toBe(false);
	});

	it("pads zone configs to 7 slots", () => {
		const templates = [
			{
				name: "Short",
				grid: new Array(GRID_CELL_COUNT).fill(0),
				zones: [{ name: "Only one", color: "#ff0000", type: "normal" }],
				roomWidth: 3000,
				roomDepth: 4000,
			},
		];
		localStorage.setItem("epp_layout_templates", JSON.stringify(templates));

		const a = createPanel() as any;
		a._loadTemplate("Short");

		expect(a._zoneConfigs).toHaveLength(7);
		expect(a._zoneConfigs[0]).not.toBeNull();
		for (let i = 1; i < 7; i++) {
			expect(a._zoneConfigs[i]).toBeNull();
		}
	});

	it("does nothing when template not found", () => {
		localStorage.setItem("epp_layout_templates", "[]");
		const a = createPanel() as any;
		const origWidth = a._roomWidth;

		a._loadTemplate("Nonexistent");

		expect(a._roomWidth).toBe(origWidth);
	});

	it("handles templates without furniture", () => {
		const templates = [
			{
				name: "Old",
				grid: new Array(GRID_CELL_COUNT).fill(0),
				zones: [],
				roomWidth: 3000,
				roomDepth: 4000,
			},
		];
		localStorage.setItem("epp_layout_templates", JSON.stringify(templates));

		const a = createPanel() as any;
		a._loadTemplate("Old");

		expect(a._furniture).toEqual([]);
	});
});

describe("_deleteTemplate", () => {
	afterEach(() => {
		localStorage.removeItem("epp_layout_templates");
	});

	it("removes a template by name", () => {
		const templates = [
			{
				name: "Keep",
				grid: [],
				zones: [],
				roomWidth: 3000,
				roomDepth: 4000,
			},
			{
				name: "Delete me",
				grid: [],
				zones: [],
				roomWidth: 3000,
				roomDepth: 4000,
			},
		];
		localStorage.setItem("epp_layout_templates", JSON.stringify(templates));

		const a = createPanel() as any;
		a._deleteTemplate("Delete me");

		const remaining = a._getTemplates();
		expect(remaining).toHaveLength(1);
		expect(remaining[0].name).toBe("Keep");
	});

	it("does nothing when name not found", () => {
		const templates = [
			{
				name: "Keep",
				grid: [],
				zones: [],
				roomWidth: 3000,
				roomDepth: 4000,
			},
		];
		localStorage.setItem("epp_layout_templates", JSON.stringify(templates));

		const a = createPanel() as any;
		a._deleteTemplate("Nonexistent");

		expect(a._getTemplates()).toHaveLength(1);
	});
});

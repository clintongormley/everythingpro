import { beforeEach, describe, expect, it } from "vitest";
import type { EverythingPresenceProPanel } from "../everything-presence-pro-panel.js";
import "../everything-presence-pro-panel.js";
import { GRID_CELL_COUNT } from "../lib/grid.js";

function createPanel(): EverythingPresenceProPanel {
	const el = document.createElement(
		"everything-presence-pro-panel",
	) as EverythingPresenceProPanel;
	el.hass = { callWS: async () => ({}) };
	const a = el as any;
	a._grid = new Uint8Array(GRID_CELL_COUNT);
	a._zoneConfigs = new Array(7).fill(null);
	a._activeZone = 0;
	a._dirty = false;
	a._loading = false;
	a._furniture = [];
	a._selectedFurnitureId = null;
	a._roomWidth = 6000;
	a._roomDepth = 6000;
	return el;
}

describe("_addFurniture", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("creates a furniture item with defaults from the sticker", () => {
		const a = el as any;
		const sticker = {
			type: "svg" as const,
			icon: "bed-double",
			label: "Double bed",
			defaultWidth: 1600,
			defaultHeight: 2000,
		};

		a._addFurniture(sticker);

		expect(a._furniture).toHaveLength(1);
		const item = a._furniture[0];
		expect(item.type).toBe("svg");
		expect(item.icon).toBe("bed-double");
		expect(item.label).toBe("Double bed");
		expect(item.width).toBe(1600);
		expect(item.height).toBe(2000);
		expect(item.rotation).toBe(0);
		expect(item.id).toMatch(/^f_/);
	});

	it("sets _dirty = true", () => {
		const a = el as any;
		expect(a._dirty).toBe(false);

		a._addFurniture({
			type: "svg" as const,
			icon: "sofa-two-seater",
			label: "Sofa",
			defaultWidth: 1600,
			defaultHeight: 800,
		});

		expect(a._dirty).toBe(true);
	});

	it("sets _selectedFurnitureId to the new item", () => {
		const a = el as any;
		a._addFurniture({
			type: "svg" as const,
			icon: "armchair",
			label: "Armchair",
			defaultWidth: 800,
			defaultHeight: 800,
		});

		expect(a._selectedFurnitureId).toBe(a._furniture[0].id);
	});

	it("centers the furniture in the room", () => {
		const a = el as any;
		a._roomWidth = 6000;
		a._roomDepth = 6000;

		a._addFurniture({
			type: "svg" as const,
			icon: "bed-double",
			label: "Double bed",
			defaultWidth: 1600,
			defaultHeight: 2000,
		});

		const item = a._furniture[0];
		expect(item.x).toBe((6000 - 1600) / 2);
		expect(item.y).toBe((6000 - 2000) / 2);
	});

	it("clamps position to zero when item is larger than room", () => {
		const a = el as any;
		a._roomWidth = 500;
		a._roomDepth = 500;

		a._addFurniture({
			type: "svg" as const,
			icon: "bed-double",
			label: "Double bed",
			defaultWidth: 1600,
			defaultHeight: 2000,
		});

		const item = a._furniture[0];
		expect(item.x).toBe(0);
		expect(item.y).toBe(0);
	});

	it("sets lockAspect to true for icon-type stickers by default", () => {
		const a = el as any;
		a._addFurniture({
			type: "icon" as const,
			icon: "mdi:fridge",
			label: "Fridge",
			defaultWidth: 700,
			defaultHeight: 700,
		});

		expect(a._furniture[0].lockAspect).toBe(true);
	});

	it("uses explicit lockAspect from sticker when provided", () => {
		const a = el as any;
		a._addFurniture({
			type: "icon" as const,
			icon: "mdi:desk",
			label: "Desk",
			defaultWidth: 1400,
			defaultHeight: 700,
			lockAspect: false,
		});

		expect(a._furniture[0].lockAspect).toBe(false);
	});
});

describe("_removeFurniture", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("removes the item by id", () => {
		const a = el as any;
		a._addFurniture({
			type: "svg" as const,
			icon: "armchair",
			label: "Armchair",
			defaultWidth: 800,
			defaultHeight: 800,
		});
		const id = a._furniture[0].id;

		a._removeFurniture(id);
		expect(a._furniture).toHaveLength(0);
	});

	it("clears selection if the removed item was selected", () => {
		const a = el as any;
		a._addFurniture({
			type: "svg" as const,
			icon: "armchair",
			label: "Armchair",
			defaultWidth: 800,
			defaultHeight: 800,
		});
		const id = a._furniture[0].id;
		expect(a._selectedFurnitureId).toBe(id);

		a._removeFurniture(id);
		expect(a._selectedFurnitureId).toBeNull();
	});

	it("does not clear selection if a different item was removed", () => {
		const a = el as any;
		a._addFurniture({
			type: "svg" as const,
			icon: "armchair",
			label: "Armchair",
			defaultWidth: 800,
			defaultHeight: 800,
		});
		a._addFurniture({
			type: "svg" as const,
			icon: "bed-double",
			label: "Double bed",
			defaultWidth: 1600,
			defaultHeight: 2000,
		});
		// selectedFurnitureId is now the second item
		const secondId = a._furniture[1].id;
		expect(a._selectedFurnitureId).toBe(secondId);

		const firstId = a._furniture[0].id;
		a._removeFurniture(firstId);

		expect(a._selectedFurnitureId).toBe(secondId);
		expect(a._furniture).toHaveLength(1);
	});

	it("sets _dirty = true", () => {
		const a = el as any;
		a._addFurniture({
			type: "svg" as const,
			icon: "armchair",
			label: "Armchair",
			defaultWidth: 800,
			defaultHeight: 800,
		});
		a._dirty = false;

		a._removeFurniture(a._furniture[0].id);
		expect(a._dirty).toBe(true);
	});
});

describe("_updateFurniture", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("merges partial updates into an existing item", () => {
		const a = el as any;
		a._addFurniture({
			type: "svg" as const,
			icon: "armchair",
			label: "Armchair",
			defaultWidth: 800,
			defaultHeight: 800,
		});
		const id = a._furniture[0].id;

		a._updateFurniture(id, { width: 1200, rotation: 45 });

		const updated = a._furniture[0];
		expect(updated.width).toBe(1200);
		expect(updated.rotation).toBe(45);
		// Other properties preserved
		expect(updated.height).toBe(800);
		expect(updated.icon).toBe("armchair");
	});

	it("sets _dirty = true", () => {
		const a = el as any;
		a._addFurniture({
			type: "svg" as const,
			icon: "armchair",
			label: "Armchair",
			defaultWidth: 800,
			defaultHeight: 800,
		});
		a._dirty = false;

		a._updateFurniture(a._furniture[0].id, { label: "Big chair" });
		expect(a._dirty).toBe(true);
	});

	it("does not affect other items", () => {
		const a = el as any;
		a._addFurniture({
			type: "svg" as const,
			icon: "armchair",
			label: "Armchair",
			defaultWidth: 800,
			defaultHeight: 800,
		});
		a._addFurniture({
			type: "svg" as const,
			icon: "bed-double",
			label: "Double bed",
			defaultWidth: 1600,
			defaultHeight: 2000,
		});

		a._updateFurniture(a._furniture[0].id, { label: "Updated" });
		expect(a._furniture[1].label).toBe("Double bed");
	});
});

describe("_addCustomFurniture", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("creates an icon-type furniture with defaults", () => {
		const a = el as any;
		a._addCustomFurniture("mdi:star");

		expect(a._furniture).toHaveLength(1);
		const item = a._furniture[0];
		expect(item.type).toBe("icon");
		expect(item.icon).toBe("mdi:star");
		expect(item.label).toBe("Custom");
		expect(item.width).toBe(600);
		expect(item.height).toBe(600);
		expect(item.lockAspect).toBe(false);
	});

	it("sets _dirty = true and _selectedFurnitureId", () => {
		const a = el as any;
		a._addCustomFurniture("mdi:lamp");

		expect(a._dirty).toBe(true);
		expect(a._selectedFurnitureId).toBe(a._furniture[0].id);
	});
});

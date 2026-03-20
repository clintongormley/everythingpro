import { describe, expect, it } from "vitest";
import type { EverythingPresenceProPanel } from "../everything-presence-pro-panel.js";
import "../everything-presence-pro-panel.js";
import { GRID_CELL_COUNT } from "../lib/grid.js";

describe("panel element creation", () => {
	it("can be created via document.createElement", () => {
		const el = document.createElement(
			"everything-presence-pro-panel",
		) as EverythingPresenceProPanel;
		expect(el).toBeInstanceOf(HTMLElement);
	});

	it("is registered as a custom element", () => {
		const Ctor = customElements.get("everything-presence-pro-panel");
		expect(Ctor).toBeDefined();
	});

	it("can be connected to the DOM", () => {
		const el = document.createElement(
			"everything-presence-pro-panel",
		) as EverythingPresenceProPanel;
		// Mock hass to prevent WS calls during connectedCallback
		el.hass = { callWS: async () => ({}) };
		document.body.appendChild(el);
		expect(el.isConnected).toBe(true);
		document.body.removeChild(el);
	});
});

describe("panel loading state", () => {
	it("starts in loading state by default", () => {
		const el = document.createElement(
			"everything-presence-pro-panel",
		) as EverythingPresenceProPanel;
		const a = el as any;
		expect(a._loading).toBe(true);
	});

	it("has empty entries by default", () => {
		const el = document.createElement(
			"everything-presence-pro-panel",
		) as EverythingPresenceProPanel;
		const a = el as any;
		expect(a._entries).toEqual([]);
	});
});

describe("panel renders without throwing", () => {
	it("renders loading state when _loading is true", () => {
		const el = document.createElement(
			"everything-presence-pro-panel",
		) as EverythingPresenceProPanel;
		el.hass = { callWS: async () => ({}) };
		const a = el as any;
		a._loading = true;

		// Calling render() directly should not throw
		const result = a.render();
		expect(result).toBeDefined();
	});

	it("renders loading state when _entries is empty", () => {
		const el = document.createElement(
			"everything-presence-pro-panel",
		) as EverythingPresenceProPanel;
		el.hass = { callWS: async () => ({}) };
		const a = el as any;
		a._loading = false;
		a._entries = [];

		const result = a.render();
		expect(result).toBeDefined();
	});

	it("has default grid of correct size", () => {
		const el = document.createElement(
			"everything-presence-pro-panel",
		) as EverythingPresenceProPanel;
		const a = el as any;
		expect(a._grid).toBeInstanceOf(Uint8Array);
		expect(a._grid.length).toBe(GRID_CELL_COUNT);
	});

	it("has default zone configs array of length 7", () => {
		const el = document.createElement(
			"everything-presence-pro-panel",
		) as EverythingPresenceProPanel;
		const a = el as any;
		expect(a._zoneConfigs).toHaveLength(7);
		for (const cfg of a._zoneConfigs) {
			expect(cfg).toBeNull();
		}
	});

	it("has _dirty = false by default", () => {
		const el = document.createElement(
			"everything-presence-pro-panel",
		) as EverythingPresenceProPanel;
		const a = el as any;
		expect(a._dirty).toBe(false);
	});
});

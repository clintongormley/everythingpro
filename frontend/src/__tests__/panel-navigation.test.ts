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
	a._showUnsavedDialog = false;
	a._pendingNavigation = null;
	return el;
}

describe("_guardNavigation", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("executes action immediately when _dirty is false", () => {
		const a = el as any;
		a._dirty = false;
		let executed = false;

		a._guardNavigation(() => {
			executed = true;
		});

		expect(executed).toBe(true);
		expect(a._showUnsavedDialog).toBe(false);
		expect(a._pendingNavigation).toBeNull();
	});

	it("stores action and shows dialog when _dirty is true", () => {
		const a = el as any;
		a._dirty = true;
		let executed = false;

		a._guardNavigation(() => {
			executed = true;
		});

		expect(executed).toBe(false);
		expect(a._showUnsavedDialog).toBe(true);
		expect(a._pendingNavigation).toBeTypeOf("function");
	});

	it("does not execute action when dirty until user confirms", () => {
		const a = el as any;
		a._dirty = true;
		const calls: string[] = [];

		a._guardNavigation(() => {
			calls.push("action");
		});

		expect(calls).toHaveLength(0);

		// Simulate user confirming discard
		a._discardAndNavigate();
		expect(calls).toEqual(["action"]);
	});
});

describe("_discardAndNavigate", () => {
	let el: EverythingPresenceProPanel;

	beforeEach(() => {
		el = createPanel();
	});

	it("resets _dirty to false", () => {
		const a = el as any;
		a._dirty = true;
		a._showUnsavedDialog = true;
		a._pendingNavigation = () => {};

		a._discardAndNavigate();
		expect(a._dirty).toBe(false);
	});

	it("hides the unsaved dialog", () => {
		const a = el as any;
		a._dirty = true;
		a._showUnsavedDialog = true;
		a._pendingNavigation = () => {};

		a._discardAndNavigate();
		expect(a._showUnsavedDialog).toBe(false);
	});

	it("executes the pending navigation action", () => {
		const a = el as any;
		a._dirty = true;
		a._showUnsavedDialog = true;
		let executed = false;
		a._pendingNavigation = () => {
			executed = true;
		};

		a._discardAndNavigate();
		expect(executed).toBe(true);
	});

	it("clears _pendingNavigation after executing", () => {
		const a = el as any;
		a._dirty = true;
		a._showUnsavedDialog = true;
		a._pendingNavigation = () => {};

		a._discardAndNavigate();
		expect(a._pendingNavigation).toBeNull();
	});

	it("handles null _pendingNavigation gracefully", () => {
		const a = el as any;
		a._dirty = true;
		a._showUnsavedDialog = true;
		a._pendingNavigation = null;

		// Should not throw
		expect(() => a._discardAndNavigate()).not.toThrow();
		expect(a._dirty).toBe(false);
		expect(a._showUnsavedDialog).toBe(false);
	});

	it("full flow: guard -> store -> discard -> execute", () => {
		const a = el as any;
		a._dirty = true;
		const log: string[] = [];

		// Step 1: guard stores the action
		a._guardNavigation(() => {
			log.push("navigated");
		});
		expect(log).toHaveLength(0);
		expect(a._showUnsavedDialog).toBe(true);

		// Step 2: discard and navigate
		a._discardAndNavigate();
		expect(log).toEqual(["navigated"]);
		expect(a._dirty).toBe(false);
		expect(a._showUnsavedDialog).toBe(false);
		expect(a._pendingNavigation).toBeNull();
	});
});

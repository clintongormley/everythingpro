import { describe, expect, it } from "vitest";
import { setupLocalize } from "../localize.js";

describe("setupLocalize", () => {
	it("returns a function", () => {
		const localize = setupLocalize();
		expect(typeof localize).toBe("function");
	});

	it("resolves a simple top-level key", () => {
		const localize = setupLocalize();
		expect(localize("common.save")).toBe("Save");
	});

	it("resolves a nested key", () => {
		const localize = setupLocalize();
		expect(localize("common.loading")).toBe("Loading...");
	});

	it("returns the key itself when key is missing", () => {
		const localize = setupLocalize();
		expect(localize("nonexistent.key")).toBe("nonexistent.key");
	});

	it("returns the key for a partially valid path", () => {
		const localize = setupLocalize();
		expect(localize("common.nonexistent")).toBe("common.nonexistent");
	});

	it("formats parameterized strings with intl-messageformat", () => {
		const localize = setupLocalize();
		expect(localize("wizard.recording", { current: 3, total: 5 })).toBe(
			"Recording... 3s / 5s",
		);
	});

	it("formats ICU plural strings correctly for singular", () => {
		const localize = setupLocalize();
		const result = localize("info.zone_occupancy", { slot: 1, count: 1 });
		expect(result).toContain("1 target detected");
		expect(result).not.toContain("targets");
	});

	it("formats ICU plural strings correctly for plural", () => {
		const localize = setupLocalize();
		const result = localize("info.zone_occupancy", { slot: 2, count: 3 });
		expect(result).toContain("3 targets detected");
	});

	it("reads language from hass.locale.language", () => {
		const localize = setupLocalize({
			locale: { language: "en" },
		});
		expect(localize("common.save")).toBe("Save");
	});

	it("reads language from hass.language as fallback", () => {
		const localize = setupLocalize({ language: "en" });
		expect(localize("common.save")).toBe("Save");
	});

	it("falls back to English for unknown language", () => {
		const localize = setupLocalize({
			locale: { language: "zz" },
		});
		expect(localize("common.save")).toBe("Save");
	});

	it("works with no hass object", () => {
		const localize = setupLocalize();
		expect(localize("common.save")).toBe("Save");
	});

	it("works with undefined hass", () => {
		const localize = setupLocalize(undefined);
		expect(localize("common.save")).toBe("Save");
	});

	it("returns plain string when params provided but string has no placeholders", () => {
		const localize = setupLocalize();
		expect(localize("common.save", { unused: 1 })).toBe("Save");
	});

	it("caches IntlMessageFormat instances for repeated calls", () => {
		const localize = setupLocalize();
		const r1 = localize("wizard.recording", { current: 1, total: 5 });
		const r2 = localize("wizard.recording", { current: 2, total: 5 });
		expect(r1).toBe("Recording... 1s / 5s");
		expect(r2).toBe("Recording... 2s / 5s");
	});
});

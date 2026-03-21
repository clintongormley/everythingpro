# Frontend Translations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all human-visible text in the TypeScript frontend panel translatable, starting with English.

**Architecture:** Bundled JSON translation files + `localize()` function following the Mushroom/HACS pattern. Uses `intl-messageformat` for ICU parameterized strings. Language detected from `hass.locale.language` with English fallback.

**Tech Stack:** Lit 3.x, intl-messageformat, @rollup/plugin-json, Vitest

**Spec:** `docs/superpowers/specs/2026-03-21-frontend-translations-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `frontend/src/translations/en.json` | All English strings, nested by UI section |
| Create | `frontend/src/localize.ts` | `setupLocalize()` factory + dot-path resolver |
| Create | `frontend/src/__tests__/localize.test.ts` | Unit tests for localize module |
| Modify | `frontend/tsconfig.json` | Add `resolveJsonModule`, `esModuleInterop` |
| Modify | `frontend/rollup.config.js` | Add `@rollup/plugin-json` |
| Modify | `frontend/package.json` | Add `intl-messageformat`, `@rollup/plugin-json` |
| Modify | `frontend/src/everything-presence-pro-panel.ts` | Replace all hardcoded strings with `_localize()` calls |
| Modify | `frontend/src/__tests__/panel-coverage-gaps.test.ts` | Update string assertions |
| Modify | `frontend/src/__tests__/panel-dom-events.test.ts` | Update string assertions |

---

### Task 1: Build configuration — dependencies, tsconfig, rollup

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/tsconfig.json`
- Modify: `frontend/rollup.config.js`

- [ ] **Step 1: Install dependencies**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm install intl-messageformat
npm install -D @rollup/plugin-json
```

- [ ] **Step 2: Add `resolveJsonModule` and `esModuleInterop` to tsconfig.json**

In `frontend/tsconfig.json`, add to `compilerOptions`:

```json
"resolveJsonModule": true,
"esModuleInterop": true
```

- [ ] **Step 3: Add `@rollup/plugin-json` to rollup.config.js**

```javascript
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.ts",
  output: {
    file: "../custom_components/everything_presence_pro/frontend/everything-presence-pro-panel.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    resolve(),
    json(),
    typescript(),
    terser(),
  ],
};
```

- [ ] **Step 4: Verify build works**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/tsconfig.json frontend/rollup.config.js
git commit -m "build: add intl-messageformat and @rollup/plugin-json for i18n support"
```

---

### Task 2: Create `localize.ts` with tests (TDD)

**Files:**
- Create: `frontend/src/localize.ts`
- Create: `frontend/src/translations/en.json`
- Create: `frontend/src/__tests__/localize.test.ts`

- [ ] **Step 1: Create a minimal `en.json` with a few keys for testing**

Create `frontend/src/translations/en.json`:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading..."
  },
  "wizard": {
    "recording": "Recording... {current}s / {total}s"
  },
  "info": {
    "zone_occupancy": "Zone {slot} occupancy. Currently {count} {count, plural, one {target} other {targets}} detected."
  }
}
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/src/__tests__/localize.test.ts`:

```typescript
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npx vitest run src/__tests__/localize.test.ts
```

Expected: FAIL — `setupLocalize` not found.

- [ ] **Step 4: Write the localize module**

Create `frontend/src/localize.ts`:

```typescript
import { IntlMessageFormat } from "intl-messageformat";
import en from "./translations/en.json";

const LANGUAGES: Record<string, Record<string, unknown>> = { en };

type Params = Record<string, string | number>;

function resolve(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function setupLocalize(
  hass?: { locale?: { language?: string }; language?: string },
): (key: string, params?: Params) => string {
  const lang = hass?.locale?.language ?? hass?.language ?? "en";
  const strings = LANGUAGES[lang] ?? LANGUAGES.en;
  const fallback = LANGUAGES.en;

  const formatCache = new Map<string, IntlMessageFormat>();

  return (key: string, params?: Params): string => {
    const raw =
      resolve(strings as Record<string, unknown>, key) ??
      resolve(fallback as Record<string, unknown>, key) ??
      key;

    if (!params) return raw;

    let fmt = formatCache.get(raw);
    if (!fmt) {
      fmt = new IntlMessageFormat(raw, lang);
      formatCache.set(raw, fmt);
    }
    return fmt.format(params) as string;
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npx vitest run src/__tests__/localize.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: Run coverage check on new file**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npx vitest run --coverage src/__tests__/localize.test.ts
```

Expected: `localize.ts` meets 90% threshold on all metrics.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/localize.ts frontend/src/translations/en.json frontend/src/__tests__/localize.test.ts
git commit -m "feat: add localize module with English translations and tests"
```

---

### Task 3: Complete `en.json` with all strings

**Files:**
- Modify: `frontend/src/translations/en.json`

This task extracts ALL human-visible strings from `everything-presence-pro-panel.ts` into the translation JSON. The complete JSON below is organized by UI section.

- [ ] **Step 1: Write the complete `en.json`**

Replace `frontend/src/translations/en.json` with the full set of strings. Every hardcoded user-visible string from the panel must be represented. The keys below are organized to match the render method structure.

Sections to include:
- `common` — shared button labels (Save, Cancel, Delete, Close, Add, Remove, Skip, Rename, Discard, Apply, Load, Loading..., Saving..., + Add another sensor)
- `furniture` — all 22 catalog item labels (Armchair through Window) plus "Custom icon"
- `corners` — corner names (Front-left, Front-right, Back-right, Back-left) and wall names (left wall, right wall, front wall, back wall)
- `wizard` — all wizard flow text: titles, instructions, recording status, positioning guide, SVG labels. Include:
  - Full instruction paragraphs from `_renderWizardGuide` lines 3257 and 3264 (multi-sentence)
  - `walk_instruction`: "Walk to each corner of the room and click Mark. The sensor will record your position over {duration} seconds." (line 3310-3311)
  - `corner_step`: "Corner {index}/4: Walk to the {corner}" (line 3319-3320)
  - `distance_from`: "Distance from:" (line 3361)
  - SVG text: "Detected" (line 3757), "No presence" (line 3760), "Calibrate room size" (line 3777)
- `dialogs` — delete calibration, unsaved changes (title + body), update entity IDs (title + body: "Zone names changed. Would you like to update the entity IDs to match?"), save/load template
- `menu` — live overview menu items: Settings, Room size calibration, Delete room calibration, Detection zones, Furniture, Save template, Load template
- `settings` — section titles, all detection range labels, all sensitivity labels, environmental offset labels with their info tips. Include `environmental` as a subsection header.
- `sidebar` — tab names, add zone, rest of room, room
- `zones` — zone config labels: Type, Normal, Entrance, Thoroughfare, Rest area, Custom, Trigger, Renew, Presence timeout, Handoff timeout, Entry point, Zone name, plus the unit suffix "s" for seconds
- `live` — presence section: Occupancy, Static presence, Motion presence, Target presence, Detected, Clear, Environment, Detection zones
- `entities` — reporting section labels including sub-headers: "Room level", "Zone level", "Target level", "Environmental"
- `info` — ALL info tip strings: occupancy, static_presence, motion_presence, target_presence, zone_occupancy (ICU plural), rest_of_room_occupancy (ICU plural: "Covers the entire room outside of any defined zones. Currently {count} {count, plural, one {target} other {targets}} detected."), target auto range, target max distance, static min/max distance, static max distance hardware limit, motion timeout, static timeout ("Time after last static detection before the sensor clears."), trigger threshold ("Minimum signal strength needed to initially detect static presence. Higher = harder to trigger."), renew threshold ("Minimum signal strength needed to maintain static presence detection. Higher = harder to renew."), all reporting info tips (room occupancy, static, motion, target presence, target count, zone presence, zone target count, xy sensor, xy grid, active, distance, angle, speed, resolution, illuminance, humidity, temperature, co2), all env offset tips ("Adjust the illuminance/humidity/temperature reading by a fixed amount.")
- `dimensions` — W (mm), H (mm), Rot

**Important:** Copy the exact English text from the source file. For ICU parameterized strings (zone_occupancy, rest_of_room_occupancy, recording, mark_corner, distance_from_side, furthest_point, walk_instruction, corner_step), use `{paramName}` placeholders and ICU `{count, plural, one {..} other {..}}` syntax.

**Verification:** After writing `en.json`, grep the panel source for remaining English text in templates to catch any missed strings:
```bash
grep -nE "'[A-Z][a-z]+" src/everything-presence-pro-panel.ts | grep -v '//' | grep -v 'import' | head -30
```

- [ ] **Step 2: Verify the JSON is valid**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
node -e "JSON.parse(require('fs').readFileSync('src/translations/en.json','utf8')); console.log('JSON valid')"
```

Expected: "JSON valid"

- [ ] **Step 3: Run existing tests to ensure nothing broke**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm test
```

Expected: All existing tests pass. The JSON is just data; no code changed yet.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/translations/en.json
git commit -m "feat: complete English translation strings for all panel UI text"
```

---

### Task 4: Wire up `_localize` in the panel component

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts` (lines ~1-10 imports, ~345-400 class properties, ~560 `updated()` area)

This task adds the localize plumbing to the panel without changing any templates yet.

- [ ] **Step 1: Add import**

At the top of `everything-presence-pro-panel.ts`, add after the existing imports:

```typescript
import { setupLocalize } from "./localize.js";
```

- [ ] **Step 2: Add `_localize` property and `_currentLang` tracking field**

Inside the `EverythingPresenceProPanel` class, after the `@property` for `hass` (line ~346), add:

```typescript
private _localize: (key: string, params?: Record<string, string | number>) => string = (k) => k;
private _currentLang = "";
```

- [ ] **Step 3: Add `willUpdate` lifecycle method**

Add a new `willUpdate` method to the class. This runs before `render()` so `_localize` is ready when templates evaluate. Place it before the existing `updated()` method:

```typescript
willUpdate(changed: PropertyValues) {
  if (changed.has("hass")) {
    const newLang = this.hass?.locale?.language ?? this.hass?.language;
    if (newLang !== this._currentLang) {
      this._currentLang = newLang;
      this._localize = setupLocalize(this.hass);
    }
  }
}
```

- [ ] **Step 4: Verify build and tests still pass**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run build && npm test
```

Expected: Build succeeds, all tests pass. No templates changed yet.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: wire up localize function in panel component"
```

---

### Task 5: Replace strings in constants and simple render methods

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

Replace hardcoded strings in top-level constants and simple render methods. These are the low-risk, high-count changes.

- [ ] **Step 1: Convert `FURNITURE_CATALOG` labels to translation keys**

Change each `label:` value from English text to a translation key. Example:

```typescript
// Before:
{ type: "svg", icon: "armchair", label: "Armchair", defaultWidth: 800, defaultHeight: 800 },
// After:
{ type: "svg", icon: "armchair", label: "furniture.armchair", defaultWidth: 800, defaultHeight: 800 },
```

Do this for all 22 entries. The mapping is:
- `"Armchair"` → `"furniture.armchair"`
- `"Bath"` → `"furniture.bath"`
- `"Double bed"` → `"furniture.double_bed"`
- `"Single bed"` → `"furniture.single_bed"`
- `"Door (left swing)"` → `"furniture.door_left"`
- `"Door (right swing)"` → `"furniture.door_right"`
- `"Dining table"` → `"furniture.dining_table"`
- `"Round table"` → `"furniture.round_table"`
- `"Lamp"` → `"furniture.lamp"`
- `"Oven / stove"` → `"furniture.oven"`
- `"Plant"` → `"furniture.plant"`
- `"Shower"` → `"furniture.shower"`
- `"Sofa (2 seat)"` → `"furniture.sofa_2"`
- `"Sofa (3 seat)"` → `"furniture.sofa_3"`
- `"TV"` → `"furniture.tv"`
- `"Toilet"` → `"furniture.toilet"`
- `"Counter"` → `"furniture.counter"`
- `"Cupboard"` → `"furniture.cupboard"`
- `"Desk"` → `"furniture.desk"`
- `"Fridge"` → `"furniture.fridge"`
- `"Speaker"` → `"furniture.speaker"`
- `"Window"` → `"furniture.window"`

- [ ] **Step 2: Convert `CORNER_LABELS` and `CORNER_OFFSET_LABELS` to translation keys**

```typescript
// Before:
const CORNER_LABELS = ["Front-left", "Front-right", "Back-right", "Back-left"];
const CORNER_OFFSET_LABELS: [string, string][] = [
  ["left wall", "front wall"],
  ["right wall", "front wall"],
  ["right wall", "back wall"],
  ["left wall", "back wall"],
];

// After:
const CORNER_LABELS = ["corners.front_left", "corners.front_right", "corners.back_right", "corners.back_left"];
const CORNER_OFFSET_LABELS: [string, string][] = [
  ["corners.left_wall", "corners.front_wall"],
  ["corners.right_wall", "corners.front_wall"],
  ["corners.right_wall", "corners.back_wall"],
  ["corners.left_wall", "corners.back_wall"],
];
```

- [ ] **Step 3: Update all template references to these constants to use `_localize()`**

Anywhere `CORNER_LABELS[i]` is used in a template, wrap it:
- `${label}` → `${this._localize(label)}`
- `${s.label}` (for furniture) → `${this._localize(s.label)}`
- `${sideLabel}` → `${this._localize(sideLabel)}`
- etc.

Search for all references in the file to `CORNER_LABELS`, `CORNER_OFFSET_LABELS`, and furniture `.label` in templates.

- [ ] **Step 4: Replace strings in `_renderHeader()`**

```typescript
// Line 3086 — change:
<option value="__add__">+ Add another sensor</option>
// To:
<option value="__add__">${this._localize("common.add_another_sensor")}</option>
```

- [ ] **Step 5: Replace strings in `_renderSaveCancelButtons()`**

```typescript
// Lines 3543, 3547 — change:
>Cancel</button>
>${this._saving ? "Saving..." : "Save"}</button>
// To:
>${this._localize("common.cancel")}</button>
>${this._saving ? this._localize("common.saving") : this._localize("common.save")}</button>
```

- [ ] **Step 6: Replace strings in `render()` (top-level dialogs)**

```typescript
// Line 2963, 2967:
"Loading..." → this._localize("common.loading")

// Lines 2989-2999 (delete calibration dialog):
"Delete room calibration?" → this._localize("dialogs.delete_calibration_title")
"This will also delete all detection zones and furniture. This cannot be undone." → this._localize("dialogs.delete_calibration_body")
"Cancel" → this._localize("common.cancel")
"Delete" → this._localize("common.delete")
```

- [ ] **Step 7: Replace strings in `_renderFurnitureSidebar()`**

```typescript
// Line 5474: "W (mm)" → this._localize("dimensions.width_mm")
// Line 5480: "H (mm)" → this._localize("dimensions.height_mm")
// Line 5486: "Rot" → this._localize("dimensions.rotation")
// Line 5516: "Custom icon" → this._localize("furniture.custom_icon")
// Line 5524: "Custom icon" → this._localize("furniture.custom_icon")
// Line 5547: "Cancel" → this._localize("common.cancel")
// Line 5555: "Add" → this._localize("common.add")
```

- [ ] **Step 8: Verify build and tests**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run build && npm test
```

Expected: Build succeeds. Some tests may fail if they check for English string content — note which ones.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: replace strings in constants, header, save/cancel, furniture sidebar"
```

---

### Task 6: Replace strings in wizard flow

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

Replace all hardcoded strings in `_renderWizard()`, `_renderWizardGuide()`, `_renderWizardCorners()`, `_renderUncalibratedFov()`, and `_renderNeedsCalibration()`.

- [ ] **Step 1: Replace strings in `_renderWizard()` (lines ~3107-3131)**

```typescript
// Line 3115: "Recording... Xs / Ys" → this._localize("wizard.recording", { current: Math.round(...), total: CAPTURE_DURATION_S })
// Line 3118: "Paused — need exactly one target visible" → this._localize("wizard.paused")
// Line 3118: "Stand still" → this._localize("wizard.stand_still")
// Line 3124: "Cancel" → this._localize("common.cancel")
```

- [ ] **Step 2: Replace strings in `_renderWizardGuide()` (lines ~3134-3295)**

SVG text elements and instruction text:
```typescript
// Line 3186: "Front wall (sensor side)" → this._localize("wizard.front_wall_label")
// Line 3187: "Back wall" → this._localize("wizard.back_wall_label")
// Line 3242: "Sensor" → this._localize("wizard.sensor")
// Line 3249: "How room calibration works" → this._localize("wizard.how_calibration_works")
// Lines 3257: "Walk to each corner" (strong) + full instruction → use localize keys
// Lines 3264: "Can't reach a corner?" (strong) + full instruction → use localize keys
// Line 3271: corner sensor hint → this._localize("wizard.corner_sensor_hint")
// Line 3286: "Cancel" → this._localize("common.cancel")
// Line 3291: "Begin marking corners" → this._localize("wizard.begin_marking")
```

- [ ] **Step 3: Replace strings in `_renderWizardCorners()` (lines ~3297-3450)**

```typescript
// Line 3308: "Calibrate room size" → this._localize("wizard.calibrate_room_size")
// Lines 3310-3311: instruction with duration interpolation → this._localize("wizard.walk_instruction", { duration: CAPTURE_DURATION_S })
// Lines 3319-3320: "Corner N/4: Walk to the <label>" → use localize with params
// Line 3361: "Distance from:" → this._localize("wizard.distance_from")
// Lines 3367, 3381: offset labels with (cm) → this._localize("wizard.distance_from_side", { wall: this._localize(sideLabel) })
// Line 3400: no target warning → this._localize("wizard.no_target")
// Line 3401: multiple targets warning → this._localize("wizard.multiple_targets")
// Line 3407: save prompt → this._localize("wizard.save_prompt")
// Lines 3422, 3434: Cancel/Save buttons → common keys
// Line 3443: "Mark <label>" → this._localize("wizard.mark_corner", { corner: this._localize(label) })
```

- [ ] **Step 4: Replace strings in `_renderNeedsCalibration()` (lines ~3783-3950)**

SVG labels and positioning guide:
```typescript
// Line 3803: "1.5–2m" (SVG) — leave as-is (measurement, not translatable prose)
// Line 3862: "Sensor" → this._localize("wizard.sensor")
// Line 3878: "Horizontal ✓" → this._localize("wizard.horizontal_correct")
// Line 3881, 3884: "Angled ✗" → this._localize("wizard.angled_wrong")
// Line 3893: "How to position your sensor" → this._localize("wizard.how_to_position")
// Line 3899: "Mount height" → this._localize("wizard.mount_height")
// Line 3901: mount height description → this._localize("wizard.mount_height_desc") (contains <strong> tags)
// Line 3911: "Placement" → this._localize("wizard.placement")
// Line 3913: placement description → this._localize("wizard.placement_desc")
// Line 3923: "Beam direction" → this._localize("wizard.beam_direction")
// Line 3925: beam direction description → this._localize("wizard.beam_direction_desc")
// Line 3944: "Start room size calibration" → this._localize("wizard.start_calibration")
```

**Handling `<strong>` tags in translations:** Several wizard strings contain inline `<strong>` HTML (e.g., `"Place the sensor <strong>1.5 to 2 meters</strong> from the floor"`). Use `unsafeHTML()` from Lit to render these. Add `import { unsafeHTML } from "lit/directives/unsafe-html.js";` if not already imported. Usage pattern:

```typescript
// Before:
html`<div>Place the sensor <strong>1.5 to 2 meters</strong> from the floor</div>`
// After:
html`<div>${unsafeHTML(this._localize("wizard.mount_height_desc"))}</div>`
```

This is safe because the translation strings come from our own bundled JSON files, not user input.

For the instruction paragraphs at lines 3257 and 3264, these have `<strong>` wrapping a prefix phrase with the rest as plain text. Split into two keys — the strong prefix and the body — or keep as a single HTML string. The simplest approach is a single HTML string per paragraph:

```typescript
// Line 3257 — one key for the full paragraph:
// en.json: "wizard.walk_instruction_full": "<strong>Walk to each corner</strong> in order (1 → 2 → 3 → 4) and click Mark. Stand still for a few seconds so the sensor can lock on."
html`<div style="font-size: 13px;">${unsafeHTML(this._localize("wizard.walk_instruction_full"))}</div>`
```

- [ ] **Step 5: Replace strings in `_renderUncalibratedFov()` (lines ~3698-3781)**

```typescript
// Line 3757: SVG "Detected" → this._localize("live.detected")
// Line 3760: SVG "No presence" → this._localize("wizard.no_presence")
// Line 3777: "Calibrate room size" → this._localize("wizard.calibrate_room_size")
```

- [ ] **Step 6: Verify build and tests**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run build && npm test
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: replace strings in wizard and positioning guide"
```

---

### Task 7: Replace strings in settings and reporting

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

Replace all strings in `_renderSettings()`, `_renderDetectionRanges()`, `_renderSensitivities()`, and `_renderReporting()`.

- [ ] **Step 1: Replace strings in `_renderSettings()` (lines ~3976-4025)**

```typescript
// Line 3999: "Settings" → this._localize("settings.title")
// Lines 3977-3988: The `sections` array uses `label:` — change to translation keys and resolve at render:
//   { id: "detection", label: "settings.detection_ranges", icon: "mdi:signal-distance-variant" },
//   { id: "sensitivity", label: "settings.sensor_calibration", icon: "mdi:tune-vertical" },
//   { id: "reporting", label: "settings.entities", icon: "mdi:format-list-checks" },
// Then in the template: <span class="accordion-title">${this._localize(s.label)}</span>
```

- [ ] **Step 2: Replace strings in `_renderDetectionRanges()` (lines ~4097-4188)**

```typescript
// Line 4113: furthest point text → this._localize("settings.furthest_point", { distance: metrics.furthestM })
// Line 4115: "Target Sensor" → this._localize("settings.target_sensor")
// Line 4117: "Auto" → this._localize("settings.auto")
// Line 4127: auto range info tip → this._localize("info.target_auto_range")
// Line 4130: "Max distance" → this._localize("settings.max_distance")
// Line 4137: max distance info tip → this._localize("info.target_max_distance")
// Line 4141: "Static Sensor" → this._localize("settings.static_sensor")
// Line 4143: "Auto" → this._localize("settings.auto")
// Line 4153: auto range info tip → this._localize("info.target_auto_range")
// Line 4156: "Min distance" → this._localize("settings.min_distance")
// Line 4168: min distance info tip → this._localize("info.static_min_distance")
// Line 4171: "Max distance" → this._localize("settings.max_distance")
// Line 4183: max distance info tip → this._localize("info.static_max_distance")
```

- [ ] **Step 3: Replace strings in `_renderSensitivities()` (lines ~4190-4247)**

```typescript
// Line 4194: "Motion Sensor" → this._localize("settings.motion_sensor")
// Line 4196: "Presence timeout" → this._localize("settings.presence_timeout")
// Line 4203: motion timeout tip → this._localize("info.motion_timeout")
// Line 4207: "Static Sensor" → this._localize("settings.static_sensor")
// Line 4209: "Presence timeout" → this._localize("settings.presence_timeout")
// Line 4216: static timeout tip → this._localize("info.static_timeout")
// Line 4219: "Trigger threshold" → this._localize("settings.trigger_threshold")
// Line 4226: trigger threshold tip → this._localize("info.trigger_threshold")
// Line 4229: "Renew threshold" → this._localize("settings.renew_threshold")
// Line 4236: renew threshold tip → this._localize("info.renew_threshold")
// Line 4240: "Environmental" → this._localize("settings.environmental")
// Lines 4241-4243: env offset calls — pass localized label and tip strings:
//   this._renderEnvOffset(this._localize("settings.illuminance_offset"), ..., this._localize("info.illuminance_offset"))
//   this._renderEnvOffset(this._localize("settings.humidity_offset"), ..., this._localize("info.humidity_offset"))
//   this._renderEnvOffset(this._localize("settings.temperature_offset"), ..., this._localize("info.temperature_offset"))
```

- [ ] **Step 4: Replace strings in `_renderReporting()` (lines ~4249-4360)**

Replace all label strings and info tip strings. There are 4 sub-sections with `<h4>` headers and ~20 label+tip pairs:

```typescript
// Section headers:
// Line 4257: "Room level" → this._localize("entities.room_level")
// Line 4285: "Zone level" → this._localize("entities.zone_level")
// Line 4298: "Target level" → this._localize("entities.target_level")
// Line 4336: "Environmental" → this._localize("settings.environmental")
```

Each label becomes `this._localize("entities.xxx")` and each tip becomes `this._localize("info.xxx")`. Add `entities.room_level`, `entities.zone_level`, `entities.target_level` to `en.json`.

- [ ] **Step 5: Verify build and tests**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run build && npm test
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: replace strings in settings, sensitivities, and reporting"
```

---

### Task 8: Replace strings in live view and zone sidebar

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

Replace all strings in `_renderLiveOverview()`, `_renderLiveSidebar()`, `_renderZoneSidebar()`, `_renderBoundaryTypeControls()`, and `_renderZoneTypeControls()`.

- [ ] **Step 1: Replace strings in `_renderLiveOverview()` (lines ~3552-3642)**

```typescript
// Line 3569: "Live overview" → this._localize("sidebar.live_overview")
// Menu items:
// Line 3589: "Detection zones" → this._localize("menu.detection_zones")
// Line 3595: "Furniture" → this._localize("menu.furniture")
// Line 3603: "Settings" → this._localize("menu.settings")
// Line 3607: "Room size calibration" → this._localize("menu.room_calibration")
// Line 3615: "Delete room calibration" → this._localize("menu.delete_calibration")
// Line 3624: "Save template" → this._localize("dialogs.save_template")
// Line 3629: "Load template" → this._localize("dialogs.load_template")
```

- [ ] **Step 2: Replace strings in `_renderLiveSidebar()` (lines ~5286-5453)**

```typescript
// Sensor labels and info strings:
// Line 5298/5300: "Occupancy" + info → this._localize("live.occupancy"), this._localize("info.occupancy")
// Line 5304/5306: "Static presence" + info → this._localize("live.static_presence"), this._localize("info.static_presence")
// Line 5310/5312: "Motion presence" + info → this._localize("live.motion_presence"), this._localize("info.motion_presence")
// Line 5316/5318: "Target presence" + info → this._localize("live.target_presence"), this._localize("info.target_presence")

// Zone info with ICU plural — convert from JS template literal with ternary to ICU message format:
// Line 5334 BEFORE: info: `Zone ${slot} occupancy. Currently ${count} target${count !== 1 ? "s" : ""} detected. Sensitivity determines...`
// Line 5334 AFTER:  info: this._localize("info.zone_occupancy", { slot, count })
// The en.json key uses ICU: "Zone {slot} occupancy. Currently {count} {count, plural, one {target} other {targets}} detected. Sensitivity determines..."
//
// Line 5342: "Rest of room" → this._localize("sidebar.rest_of_room")
// Line 5344 BEFORE: info: `Covers the entire room outside of any defined zones. Currently ${rorCount} target${rorCount !== 1 ? "s" : ""} detected.`
// Line 5344 AFTER:  info: this._localize("info.rest_of_room_occupancy", { count: rorCount })

// Environment sensor labels:
// Line 5352: "Illuminance" → this._localize("entities.illuminance")
// Line 5358: "Temperature" → this._localize("entities.temperature")
// Line 5364: "Humidity" → this._localize("entities.humidity")
// Line 5370: "CO₂" → this._localize("entities.co2")

// Section headers and status:
// Line 5376: "Presence" → this._localize("live.presence")
// Line 5382: "Detected" / "Clear" → this._localize("live.detected") / this._localize("live.clear")
// Line 5407: "Detection zones" → this._localize("sidebar.detection_zones")
// Line 5438: "Environment" → this._localize("live.environment")
```

- [ ] **Step 3: Replace strings in zone type controls and zone sidebar**

In `_renderBoundaryTypeControls()` and `_renderZoneTypeControls()`:
```typescript
// "Type" label → this._localize("zones.type")
// <option> values: "Normal", "Entrance", "Thoroughfare", "Rest area", "Custom"
//   → this._localize("zones.normal"), etc.
// "Trigger" → this._localize("zones.trigger")
// "Renew" → this._localize("zones.renew")
// "Presence timeout" → this._localize("zones.presence_timeout")
// "Handoff timeout" → this._localize("zones.handoff_timeout")
// "Entry point" → this._localize("zones.entry_point")
// "s" unit suffix → this._localize("zones.seconds_suffix") (add to en.json)
```

In `_renderZoneSidebar()`:
```typescript
// Line 5106: "Room" → this._localize("sidebar.room")
// Line 5197: "Add zone" → this._localize("sidebar.add_zone")
```

- [ ] **Step 4: Replace strings in editor and template dialogs**

In `_renderEditor()`:
```typescript
// Line 4437: "Furniture" / "Detection zones" → this._localize("sidebar.furniture") / this._localize("sidebar.detection_zones")
// Line 4454: "Update entity IDs?" → this._localize("dialogs.update_entity_ids")
// Line 4455: body text → this._localize("dialogs.update_entity_ids_body")
// Line 4485: "Skip" → this._localize("common.skip")
// Line 4488: "Rename" → this._localize("common.rename")
// Line 4500: "You have unsaved changes" → this._localize("dialogs.unsaved_changes")
// Line 4501: body text → this._localize("dialogs.unsaved_changes_body")
// Line 4508: "Cancel" → this._localize("common.cancel")
// Line 4511: "Discard" → this._localize("common.discard")
```

In `_renderTemplateSaveDialog()`:
```typescript
// Line 4526: "Save template" → this._localize("dialogs.save_template")
// Line 4530: "Template name" placeholder → this._localize("dialogs.template_name")
// Line 4542: "Cancel" → this._localize("common.cancel")
// Line 4547: "Save" → this._localize("common.save")
```

In `_renderTemplateLoadDialog()`:
```typescript
// Line 4559: "Load template" → this._localize("dialogs.load_template")
// Line 4562: "No saved templates." → this._localize("dialogs.no_templates")
// Line 4571: "Load" → this._localize("common.load")
// Line 4588: "Close" → this._localize("common.close")
```

- [ ] **Step 5: Verify build and tests**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run build && npm test
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts frontend/src/translations/en.json
git commit -m "feat: replace strings in live view, zones, editor, and template dialogs"
```

---

### Task 9: Fix failing tests

**Files:**
- Modify: `frontend/src/__tests__/panel-coverage-gaps.test.ts`
- Modify: `frontend/src/__tests__/panel-dom-events.test.ts`
- Possibly modify: other test files that assert on English text content

- [ ] **Step 1: Identify all failing tests**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm test 2>&1 | head -100
```

- [ ] **Step 2: Fix string assertions in `panel-coverage-gaps.test.ts`**

Tests that check for `textContent.includes("Furniture")` etc. need to check for the translation key or the translated value. Since `_localize` is wired up through `setupLocalize` which reads from `en.json`, the rendered output will still contain English text when tests set up the `hass` object properly.

The key issue is that tests create panels without calling `willUpdate`, so `_localize` remains the identity function `(k) => k` and rendered text will show translation keys like `"menu.furniture"` instead of `"Furniture"`.

**Mandatory fix:** In every `createPanel()` helper across all test files, add `_localize` initialization:

```typescript
import { setupLocalize } from "../localize.js";

// In createPanel():
a._localize = setupLocalize({ locale: { language: "en" } });
```

This ensures rendered templates produce English text, matching existing assertions. Update assertions only if the visible text changed (e.g., the exact wording was corrected during extraction).

- [ ] **Step 3: Fix any other failing tests**

Check each failing test and update as needed. Most will be in tests that render templates and check for visible text.

- [ ] **Step 4: Run full test suite with coverage**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run test:coverage
```

Expected: All tests pass. Coverage thresholds met (90% per file).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/__tests__/
git commit -m "test: update test assertions for localized strings"
```

---

### Task 10: Final verification and completeness check

**Files:**
- All modified files

- [ ] **Step 1: Grep for remaining hardcoded English strings**

Search broadly for remaining hardcoded English strings in templates:

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend

# Common button/label text still in angle brackets
grep -nE '>[A-Z][a-z]{2,}[^<]*</' src/everything-presence-pro-panel.ts | grep -v '_localize' | grep -v '//' | grep -v 'class=' | head -30

# Quoted English strings in template literals (not CSS, not identifiers)
grep -nE '"[A-Z][a-z]{3,}[^"]*"' src/everything-presence-pro-panel.ts | grep -v 'import\|icon\|class\|style\|type\|data-\|mdi:\|event\|color\|font' | head -30

# Placeholder attributes with English text
grep -nE 'placeholder="[A-Z]' src/everything-presence-pro-panel.ts | head -10

# SVG <text> elements with hardcoded strings
grep -nE '<text[^>]*>[A-Z]' src/everything-presence-pro-panel.ts | grep -v '_localize' | head -10
```

If any remain, add them to `en.json` and replace with `_localize()` calls.

- [ ] **Step 2: Run full build**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run build
```

Expected: Clean build, no errors.

- [ ] **Step 3: Run full test suite with coverage**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run test:coverage
```

Expected: All tests pass, 90% per-file coverage met.

- [ ] **Step 4: Run linter**

```bash
cd /workspaces/ha-dev/everything-presence-pro-grid.worktrees/ts_translations/frontend
npm run lint
```

Expected: No lint errors.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "feat: complete frontend translation system — all UI text translatable"
```

# Frontend Translation System Design

**Date:** 2026-03-21
**Status:** Draft
**Scope:** Add i18n support to the TypeScript frontend panel so all human-visible text is translatable

## Problem

The Everything Presence Pro custom panel has ~150+ hardcoded English strings across the LitElement frontend. All text — button labels, dialog titles, settings headers, furniture names, info tooltips, wizard instructions, status messages — is embedded directly in template literals. There is no mechanism for translation.

The Python backend already has translations via `strings.json` + `translations/en.json` using Home Assistant's standard `_attr_translation_key` pattern, but this only covers config flows and entity names. Custom panels do not have access to HA's `hass.localize()` for custom keys.

## Approach

Follow the established HACS custom component pattern (used by Mushroom cards, HACS frontend, Frigate panel): bundle translation JSON files into the JS build and implement a lightweight `localize()` function. Use `intl-messageformat` (the same ICU message format library that HA core uses) for parameterized strings with plurals and interpolation.

### Why not `@lit/localize`?

Home Assistant's frontend does not use `@lit/localize` — it uses a custom system built on `intl-messageformat`. No major HACS component uses `@lit/localize` either. The Mushroom/HACS pattern is simpler, has no extraction tooling overhead, and aligns with the ecosystem.

### Why not the HA `translations/` directory?

Custom panels cannot access integration translation keys via `hass.localize()`. While a websocket API (`frontend/get_translations`) exists, no HACS project uses it — it adds async load latency and is non-standard for panel UI strings.

## Architecture

### New files

#### `frontend/src/translations/en.json`

Nested JSON organized by UI section. Keys use snake_case. Values are plain strings or ICU message format strings where interpolation/plurals are needed.

```json
{
  "common": {
    "save": "Save",
    "saving": "Saving...",
    "cancel": "Cancel",
    "delete": "Delete",
    "close": "Close",
    "add": "Add",
    "remove": "Remove",
    "skip": "Skip",
    "rename": "Rename",
    "discard": "Discard",
    "apply": "Apply",
    "load": "Load",
    "loading": "Loading...",
    "add_another_sensor": "+ Add another sensor"
  },
  "furniture": {
    "armchair": "Armchair",
    "bath": "Bath",
    "double_bed": "Double bed",
    "single_bed": "Single bed",
    "door_left": "Door (left swing)",
    "door_right": "Door (right swing)",
    "dining_table": "Dining table",
    "round_table": "Round table",
    "lamp": "Lamp",
    "oven": "Oven / stove",
    "plant": "Plant",
    "shower": "Shower",
    "sofa_2": "Sofa (2 seat)",
    "sofa_3": "Sofa (3 seat)",
    "tv": "TV",
    "toilet": "Toilet",
    "counter": "Counter",
    "cupboard": "Cupboard",
    "desk": "Desk",
    "fridge": "Fridge",
    "speaker": "Speaker",
    "window": "Window",
    "custom_icon": "Custom icon"
  },
  "corners": {
    "front_left": "Front-left",
    "front_right": "Front-right",
    "back_right": "Back-right",
    "back_left": "Back-left",
    "left_wall": "left wall",
    "right_wall": "right wall",
    "front_wall": "front wall",
    "back_wall": "back wall"
  },
  "wizard": {
    "how_calibration_works": "How room calibration works",
    "calibrate_room_size": "Calibrate room size",
    "start_calibration": "Start room size calibration",
    "begin_marking": "Begin marking corners",
    "mark_corner": "Mark {corner}",
    "recording": "Recording... {current}s / {total}s",
    "paused": "Paused — need exactly one target visible",
    "stand_still": "Stand still",
    "no_target": "No target detected. Make sure you are visible to the sensor.",
    "multiple_targets": "Multiple targets detected. Only one person should be in the room during calibration.",
    "save_prompt": "Click Save to store this room's calibration, or click a corner above to re-mark it.",
    "walk_to_corners": "Walk to each corner",
    "cant_reach": "Can't reach a corner?",
    "cant_reach_help": "If furniture blocks a corner, enter the distance from the nearest walls instead.",
    "distance_from_side": "Distance from {wall} (cm)",
    "how_to_position": "How to position your sensor",
    "mount_height": "Mount height",
    "mount_height_desc": "Place the sensor <strong>1.5 to 2 meters</strong> from the floor",
    "placement": "Placement",
    "placement_desc": "Place in a <strong>corner or on a wall</strong>, pointing toward the most distant opposite corner",
    "beam_direction": "Beam direction",
    "beam_direction_desc": "Keep the beam <strong>horizontal</strong> — not angled up or down",
    "front_wall_label": "Front wall (sensor side)",
    "back_wall_label": "Back wall",
    "sensor": "Sensor",
    "horizontal_correct": "Horizontal ✓",
    "angled_wrong": "Angled ✗",
    "corner_sensor_hint": "Corner 2 is where your sensor is mounted. You can stand right under it.",
    "no_presence": "No presence"
  },
  "dialogs": {
    "delete_calibration_title": "Delete room calibration?",
    "delete_calibration_body": "This will also delete all detection zones and furniture. This cannot be undone.",
    "unsaved_changes": "You have unsaved changes",
    "update_entity_ids": "Update entity IDs?",
    "save_template": "Save template",
    "load_template": "Load template",
    "no_templates": "No saved templates.",
    "template_name": "Template name"
  },
  "menu": {
    "settings": "Settings",
    "room_calibration": "Room size calibration",
    "delete_calibration": "Delete room calibration",
    "detection_zones": "Detection zones",
    "furniture": "Furniture"
  },
  "settings": {
    "title": "Settings",
    "detection_ranges": "Detection Ranges",
    "sensor_calibration": "Sensor Calibration",
    "entities": "Entities",
    "target_sensor": "Target Sensor",
    "static_sensor": "Static Sensor",
    "motion_sensor": "Motion Sensor",
    "auto": "Auto",
    "max_distance": "Max distance",
    "min_distance": "Min distance",
    "presence_timeout": "Presence timeout",
    "trigger_threshold": "Trigger threshold",
    "renew_threshold": "Renew threshold",
    "illuminance_offset": "Illuminance offset",
    "humidity_offset": "Humidity offset",
    "temperature_offset": "Temperature offset",
    "furthest_point": "Current furthest point from sensor: {distance}m"
  },
  "sidebar": {
    "detection_zones": "Detection zones",
    "furniture": "Furniture",
    "live_overview": "Live overview",
    "add_zone": "Add zone",
    "rest_of_room": "Rest of room",
    "room": "Room"
  },
  "zones": {
    "zone_name": "Zone name",
    "type": "Type",
    "normal": "Normal",
    "entrance": "Entrance",
    "thoroughfare": "Thoroughfare",
    "rest_area": "Rest area",
    "custom": "Custom",
    "trigger": "Trigger",
    "renew": "Renew",
    "presence_timeout": "Presence timeout",
    "handoff_timeout": "Handoff timeout",
    "entry_point": "Entry point"
  },
  "live": {
    "presence": "Presence",
    "detected": "Detected",
    "clear": "Clear",
    "environment": "Environment",
    "occupancy": "Occupancy",
    "static_presence": "Static presence",
    "motion_presence": "Motion presence",
    "target_presence": "Target presence",
    "target_count": "Target count"
  },
  "entities": {
    "occupancy": "Occupancy",
    "static_presence": "Static presence",
    "motion_presence": "Motion presence",
    "target_presence": "Target presence",
    "target_count": "Target count",
    "zone_presence": "Presence",
    "zone_target_count": "Target count",
    "xy_sensor": "XY position, relative to sensor",
    "xy_grid": "XY position, relative to grid",
    "active": "Active",
    "distance": "Distance",
    "angle": "Angle",
    "speed": "Speed",
    "resolution": "Resolution",
    "illuminance": "Illuminance",
    "humidity": "Humidity",
    "temperature": "Temperature",
    "co2": "CO₂"
  },
  "sensors": {
    "bh1750": "BH1750",
    "shtc3": "SHTC3",
    "scd40": "SCD40"
  },
  "info": {
    "occupancy": "Combined occupancy from all sources — PIR motion, static mmWave presence, and zone tracking. Shows detected if any source detects presence.",
    "static_presence": "mmWave radar detects stationary people by measuring micro-movements like breathing. Works through furniture and blankets.",
    "motion_presence": "Passive infrared sensor detects movement by sensing body heat. Fast response but only triggers on motion, not stationary presence.",
    "target_presence": "Whether any target is actively tracked by the mmWave radar. Detected when at least one target point is being reported.",
    "zone_occupancy": "Zone {slot} occupancy. Currently {count} {count, plural, one {target} other {targets}} detected. Sensitivity determines how many consecutive frames are needed to confirm presence.",
    "rest_of_room_occupancy": "Rest-of-room occupancy. Currently {count} {count, plural, one {target} other {targets}} detected outside named zones.",
    "target_auto_range": "Automatically set max distance from room dimensions.",
    "target_max_distance": "Maximum detection distance for the target sensor (LD2450). Hardware limit: 6m.",
    "static_min_distance": "Minimum detection distance for the static sensor.",
    "static_max_distance": "Maximum detection distance for the static sensor.",
    "motion_timeout": "Time after last motion before the motion sensor clears.",
    "xy_sensor": "Raw XY coordinates from the sensor.",
    "xy_grid": "XY coordinates mapped to the room grid.",
    "resolution": "Detection resolution for each target.",
    "illuminance": "BH1750 illuminance sensor.",
    "humidity": "SHTC3 humidity sensor.",
    "temperature": "SHTC3 temperature sensor.",
    "co2": "SCD40 CO₂ sensor (optional module)."
  },
  "dimensions": {
    "width_mm": "W (mm)",
    "height_mm": "H (mm)",
    "rotation": "Rot"
  }
}
```

> **Note:** The above is representative, not exhaustive. The full extraction during implementation will capture every string from the panel source. Some keys may be added, renamed, or reorganized as the complete set is catalogued.

#### `frontend/src/localize.ts`

```typescript
import { IntlMessageFormat } from "intl-messageformat";
import en from "./translations/en.json";

// Language registry — add imports here for new languages
const LANGUAGES: Record<string, Record<string, unknown>> = { en };

type Params = Record<string, string | number>;

/**
 * Resolve a dot-path key in a nested object.
 * e.g., resolve(obj, "common.save") => obj.common.save
 */
function resolve(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Create a localize function bound to the user's language.
 * Reads language from hass.locale.language (HA 2023.9+) or hass.language.
 */
export function setupLocalize(
  hass?: { locale?: { language?: string }; language?: string }
): (key: string, params?: Params) => string {
  const lang = hass?.locale?.language ?? hass?.language ?? "en";
  const strings = LANGUAGES[lang] ?? LANGUAGES.en;
  const fallback = LANGUAGES.en;

  // Cache for IntlMessageFormat instances
  const formatCache = new Map<string, IntlMessageFormat>();

  return (key: string, params?: Params): string => {
    const raw = resolve(strings as Record<string, unknown>, key)
      ?? resolve(fallback as Record<string, unknown>, key)
      ?? key;

    if (!params) return raw;

    // Use intl-messageformat for parameterized strings
    let fmt = formatCache.get(raw);
    if (!fmt) {
      fmt = new IntlMessageFormat(raw, lang);
      formatCache.set(raw, fmt);
    }
    return fmt.format(params) as string;
  };
}
```

### Build configuration changes

#### `frontend/tsconfig.json`

Add `resolveJsonModule` and `esModuleInterop` to enable JSON imports:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ES2020",
    "moduleResolution": "node",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "declaration": false,
    "strict": true,
    "noImplicitAny": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "outDir": "./dist",
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"]
}
```

#### `frontend/rollup.config.js`

Add `@rollup/plugin-json` to handle `.json` imports:

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

#### `frontend/package.json`

New dependencies:

```json
{
  "dependencies": {
    "lit": "^3.1.0",
    "intl-messageformat": "^11.0.0"
  },
  "devDependencies": {
    "@rollup/plugin-json": "^6.1.0"
  }
}
```

`intl-messageformat` is ~5KB gzipped. It's the same library HA core uses.

### Changes to `everything-presence-pro-panel.ts`

1. **Import:** `import { setupLocalize } from "./localize.js";`
2. **Property:** Add `private _localize: (key: string, params?: Record<string, string | number>) => string = (k) => k;` — identity function as initial value
3. **State:** Add `private _currentLang = "";` to track the active language
4. **Language detection in `willUpdate()`** — this runs *before* `render()`, so the localize function is ready when templates evaluate. The existing `updated()` method handles initialization and must remain unchanged.
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
5. **Replace all hardcoded strings** with `this._localize("section.key")` or `this._localize("section.key", { param: value })` for parameterized strings.
6. **`FURNITURE_CATALOG`:** Keep the `label` field name (it's persisted in saved layouts and templates), but change values to translation keys. Resolve at render time:
   ```typescript
   // Before:
   { type: "svg", icon: "armchair", label: "Armchair", ... }
   // After:
   { type: "svg", icon: "armchair", label: "furniture.armchair", ... }
   // In template:
   <span>${this._localize(s.label)}</span>
   ```
   The `FurnitureSticker` and `FurnitureItem` interfaces keep `label: string` — the field now stores a translation key. The `parseFurniture()` fallback in config-serialization.ts (`f.label || "Item"`) continues to work because keys are non-empty strings that will be resolved by `_localize()`.

   **Backward compatibility:** Existing saved layouts have English labels like `"Armchair"`. When loaded, `_localize("Armchair")` won't find a matching key and will return `"Armchair"` as-is (the last-resort fallback). This means old saved data displays correctly without migration.

7. **`CORNER_LABELS` / `CORNER_OFFSET_LABELS`:** Same pattern — store keys, resolve at render time.
8. **SVG text elements** in wizard diagrams (e.g., "Front wall (sensor side)", "Sensor", "Horizontal ✓"): Replace with `this._localize()` calls.
9. **Methods with string parameters** like `_renderEnvOffset(label, ..., tip)` and `_infoTip(text)`: Callers pass `this._localize(...)` results instead of raw strings. The method signatures stay the same.

### `hass` typing note

The `hass` property is typed as `any` on the panel element (line 346). The `setupLocalize` function defensively handles this with `hass?.locale?.language ?? hass?.language ?? "en"`, covering both modern HA (2023.9+, `locale.language`) and older versions (`language`). No compile-time guarantee exists for the language path, but the runtime fallback chain is robust.

## String extraction strategy

During implementation, **all** human-visible strings will be extracted. The work is organized by render method:

1. `render()` — loading states, top-level dialogs
2. `_renderHeader()` — device select, "add another sensor"
3. `_renderWizard()` / `_renderWizardGuide()` / `_renderWizardCorners()` — wizard flow (including SVG diagram labels)
4. `_renderSettings()` / `_renderDetectionRanges()` / `_renderSensitivities()` / `_renderReporting()` — settings
5. `_renderLiveOverview()` / `_renderLiveSidebar()` — live view (including rest-of-room zone info)
6. `_renderEditor()` / `_renderZoneSidebar()` — zone editor
7. `_renderFurnitureSidebar()` / `_renderFurnitureOverlay()` — furniture
8. `_renderTemplateSaveDialog()` / `_renderTemplateLoadDialog()` — templates
9. Top-level constants: `FURNITURE_CATALOG`, `CORNER_LABELS`, `CORNER_OFFSET_LABELS`
10. Live overview menu items: Settings, Room size calibration, Delete room calibration, Detection zones, Furniture

## Adding a new language

1. Create `frontend/src/translations/{lang}.json` — copy `en.json`, translate values
2. Add `import {lang} from "./translations/{lang}.json";` to `localize.ts`
3. Add to `LANGUAGES` map: `{ en, de, fr, ... }`
4. Rebuild

## Testing

### `localize.ts` unit tests (must meet 90% per-file coverage threshold)

Test cases:
- Simple key lookup: `localize("common.save")` returns `"Save"`
- Nested key lookup: `localize("info.occupancy")` returns the full info string
- Missing key returns the key itself: `localize("nonexistent.key")` returns `"nonexistent.key"`
- Fallback to English when non-English language has no translation for a key
- Parameterized string formatting: `localize("wizard.recording", { current: 3, total: 5 })` returns `"Recording... 3s / 5s"`
- ICU plural rules: `localize("info.zone_occupancy", { slot: 1, count: 1 })` returns singular form; `count: 3` returns plural form
- Format cache reuse: calling with same key+params twice uses cached IntlMessageFormat instance

### Existing test migration

Test files in `frontend/src/__tests__/` include render tests that assert on English string content. These will need updating when hardcoded strings are replaced with `_localize()` calls. Tests that construct `FurnitureSticker` objects with `label` values will continue to work since the field type hasn't changed.

### String completeness check

A one-time grep verification after implementation to confirm no raw English strings remain in template output (outside of SVG path data, CSS, and non-human-visible attributes).

## Known limitations / future work

- **Additional languages beyond English** — future PRs, one language file each
- **Backend `translations/` directory** — already handled by existing system, no changes needed
- **Locale-aware number/date formatting** — out of scope for initial implementation. The live sidebar formats environment values with hardcoded units (lux, °C, ppm). When future languages are added, temperature units may need to respect HA's unit system setting (not just language). This can be addressed when the first non-English language is added.

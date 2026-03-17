# Settings page design

## Overview

Replace the current settings page (section-based dropdown) with an accordion-based layout containing three collapsible sections. All values stored in the existing room layout data blob. Multiple sections can be open simultaneously.

## UI structure

### Page layout

- "Settings" title (h2, already implemented)
- Three accordion sections, each with icon + label + chevron toggle:
  1. Detection Ranges (`mdi:signal-distance-variant`)
  2. Sensitivities and Timeout (`mdi:tune-vertical`)
  3. Reporting (`mdi:format-list-checks`)

Uses existing CSS classes: `setting-row`, `setting-input`, `setting-range`, `setting-toggle`. Sub-sections use `<h4>` headings.

### Auto-calculated defaults

Where a field defaults to "auto from room dimensions", the value is the furthest room point (max of room width and depth) **rounded up to the nearest 50cm**. When the stored value is `null`, the UI shows the computed value with a visual hint that it's auto-derived. The user can override by entering a value.

## Section 1: Detection Ranges

### Target Sensor

| Field | Control | Range | Default |
|---|---|---|---|
| Detection range | number (cm) | 0–600 | auto (furthest room point, rounded up 50cm) |
| Update rate | select | 5Hz / 10Hz / 2Hz | 5Hz (placeholder, non-functional) |

### Static Sensor — Range

| Field | Control | Range | Default |
|---|---|---|---|
| Min distance | number (cm) | 0–2500 | 0 |
| Max distance | number (cm) | 0–2500 | auto (furthest room point, rounded up 50cm) |
| Trigger distance | number (cm) | 0–2500 | auto (furthest room point, rounded up 50cm) |

## Section 2: Sensitivities and Timeout

### Motion Sensor

| Field | Control | Range | Default |
|---|---|---|---|
| Presence timeout | number (sec) | — | 5 |

### Static Sensor

| Field | Control | Range | Default |
|---|---|---|---|
| Presence timeout | number (sec) | — | 30 |
| Trigger sensitivity | number | 0–9 | 7 |
| Sustain sensitivity | number | 0–9 | 5 |

### Target Sensor — Zone type profiles

Four zone-type sub-groups. Each zone in the layout editor has a type, and these profiles define the sensitivity/timeout behavior for that type. Entrance/Exit maps to the entrance/exit overlay in the grid editor.

| Zone type | Timeout (sec) | Trigger sensitivity | Sustain sensitivity | Expect appear/vanish |
|---|---|---|---|---|
| Entrance/Exit | 5 | 1 | 1 | yes |
| Thoroughfare | 3 | 1 | 1 | no |
| Living area | 15 | 3 | 3 | no |
| Bed/Sofa | 60 | 5 | 1 | no |

Each sub-group exposes:
- Presence timeout — number (seconds)
- Trigger sensitivity — number (0–9)
- Sustain sensitivity — number (0–9)
- Expect appear/vanish — toggle

## Section 3: Reporting

Toggles controlling which HA entities get created.

### Room level

| Entity | Default |
|---|---|
| Occupancy (binary) | on |
| Static presence (binary) | off |
| Motion presence (binary) | off |
| Target presence (binary) | off |
| Target count | off |

### Zone level

| Entity | Default |
|---|---|
| Presence (binary) | on |
| Target count | off |

### Target level

| Entity | Default |
|---|---|
| XY position, relative to sensor | off |
| XY position, relative to grid | off |
| Active (binary) | off |
| Distance | off |
| Angle | off |
| Speed | off |
| Resolution | off |

## Data storage

Settings stored as flat keys in the existing room layout data blob (via `websocket_get_room_layout` / `websocket_set_room_layout`). Auto-derived values stored as `null`; the UI and coordinator compute the actual value from room dimensions at read time.

## Implementation scope

- Frontend only: replace `_renderSettings()` and `_renderSettingsSection()` in the panel TypeScript
- Add accordion CSS (expand/collapse with chevron animation)
- Wire values to layout data via existing websocket API
- No new ESPHome calls, no new websocket endpoints
- Reporting toggles are UI-only for now; entity creation wiring comes later

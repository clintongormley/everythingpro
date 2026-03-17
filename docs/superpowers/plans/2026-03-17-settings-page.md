# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current dropdown-based settings page with an accordion UI containing three sections: Detection Ranges, Sensitivities and Timeout, and Reporting.

**Architecture:** Pure frontend change in the panel TypeScript. Remove existing `_renderSettings()` / `_renderSettingsSection()` methods and replace with accordion-based rendering. Add accordion CSS. No backend changes — controls are UI-only placeholders for now, values not persisted yet.

**Tech Stack:** Lit (TypeScript), Rollup build

**Spec:** `docs/superpowers/specs/2026-03-17-settings-page-design.md`

---

### File map

- **Modify:** `frontend/src/everything-presence-pro-panel.ts`
  - Lines 231: Replace `_settingsSection` state with `_openAccordions` set
  - Lines 2410–2511: Replace dropdown CSS with accordion CSS
  - Lines 3342–3596: Replace `_renderSettings()` and `_renderSettingsSection()` with accordion-based methods

No new files. No backend changes.

---

### Task 1: Add accordion CSS and state

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:231` (state)
- Modify: `frontend/src/everything-presence-pro-panel.ts:2410-2511` (CSS)

- [ ] **Step 1: Replace `_settingsSection` state with accordion open-set**

At line 231, replace:
```typescript
@state() private _settingsSection = "tracking";
```
with:
```typescript
@state() private _openAccordions: Set<string> = new Set(["detection"]);
```

- [ ] **Step 2: Replace settings CSS**

Replace the CSS block from `.settings-section-select` through `.setting-toggle` (lines 2416–2511) with:

```css
    .accordion {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      margin-bottom: 12px;
      overflow: hidden;
      background: var(--card-background-color, #fff);
    }

    .accordion-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      cursor: pointer;
      user-select: none;
      background: var(--card-background-color, #fff);
      border: none;
      width: 100%;
      text-align: left;
      font-size: 15px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .accordion-header:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .accordion-header ha-icon {
      --mdc-icon-size: 20px;
      color: var(--secondary-text-color, #757575);
    }

    .accordion-header .accordion-title {
      flex: 1;
    }

    .accordion-chevron {
      transition: transform 0.2s ease;
      --mdc-icon-size: 20px;
      color: var(--secondary-text-color, #757575);
    }

    .accordion-chevron[data-open] {
      transform: rotate(180deg);
    }

    .accordion-body {
      padding: 0 16px 16px;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
```

Keep the existing `.setting-group`, `.setting-group h4`, `.setting-row`, `.setting-row:last-child`, `.setting-row label`, `.setting-hint`, `.setting-value`, `.setting-input`, `select.setting-input`, `.setting-range`, `.setting-toggle` CSS unchanged.

- [ ] **Step 3: Add a zone-type sub-group CSS class**

Append after the accordion CSS:
```css
    .zone-type-group {
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 8px;
    }

    .zone-type-group:last-child {
      margin-bottom: 0;
    }

    .zone-type-group h5 {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color, #212121);
    }
```

- [ ] **Step 4: Build and verify no errors**

Run: `cd frontend && npm run build`
Expected: Build succeeds (the old render methods still reference `_settingsSection` — that's fine, we replace them next).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: add accordion CSS and state for settings page"
```

---

### Task 2: Replace `_renderSettings()` with accordion layout

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:3342-3375`

- [ ] **Step 1: Add accordion toggle helper**

Add just above `_renderSettings()`:
```typescript
private _toggleAccordion(id: string) {
  const next = new Set(this._openAccordions);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  this._openAccordions = next;
}
```

- [ ] **Step 2: Replace `_renderSettings()`**

Replace the entire `_renderSettings()` method (lines 3342–3375) with:

```typescript
private _renderSettings() {
  const sections: { id: string; label: string; icon: string }[] = [
    { id: "detection", label: "Detection Ranges", icon: "mdi:signal-distance-variant" },
    { id: "sensitivity", label: "Sensitivities and Timeout", icon: "mdi:tune-vertical" },
    { id: "reporting", label: "Reporting", icon: "mdi:format-list-checks" },
  ];

  return html`
    <div class="panel">
      ${this._renderHeader()}
      <div class="settings-container">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500;">Settings</h2>
        ${sections.map((s) => {
          const open = this._openAccordions.has(s.id);
          return html`
            <div class="accordion">
              <button class="accordion-header" @click=${() => this._toggleAccordion(s.id)}>
                <ha-icon icon=${s.icon}></ha-icon>
                <span class="accordion-title">${s.label}</span>
                <ha-icon class="accordion-chevron" icon="mdi:chevron-down" ?data-open=${open}></ha-icon>
              </button>
              ${open ? html`
                <div class="accordion-body">
                  ${this._renderSettingsSection(s.id)}
                </div>
              ` : nothing}
            </div>
          `;
        })}
      </div>
    </div>
  `;
}
```

- [ ] **Step 3: Build and verify**

Run: `cd frontend && npm run build`
Expected: Builds (the old `_renderSettingsSection` still exists and works as fallback).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: replace settings dropdown with accordion layout"
```

---

### Task 3: Replace `_renderSettingsSection()` with new content

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts:3378-3596`

- [ ] **Step 1: Compute auto-detection range helper**

Add above `_renderSettings()`:
```typescript
private _autoDetectionRange(): number {
  const maxMm = Math.max(this._roomWidth, this._roomDepth);
  if (maxMm <= 0) return 0;
  const cm = maxMm / 10;
  return Math.ceil(cm / 50) * 50;
}
```

- [ ] **Step 2: Replace `_renderSettingsSection()`**

Replace the entire `_renderSettingsSection()` method (lines 3378–3596) with a method that takes an `id` parameter:

```typescript
private _renderSettingsSection(id: string) {
  switch (id) {
    case "detection":
      return this._renderDetectionRanges();
    case "sensitivity":
      return this._renderSensitivities();
    case "reporting":
      return this._renderReporting();
    default:
      return nothing;
  }
}

private _renderDetectionRanges() {
  const autoRange = this._autoDetectionRange();
  return html`
    <div class="settings-section">
      <div class="setting-group">
        <h4>Target Sensor</h4>
        <div class="setting-row">
          <label>Detection range</label>
          <span class="setting-hint">Auto-set to furthest room point${autoRange > 0 ? ` (${autoRange} cm)` : ""}</span>
          <input type="number" class="setting-input" .value=${String(autoRange)} min="0" max="600" step="10" /> cm
        </div>
        <div class="setting-row">
          <label>Update rate</label>
          <select class="setting-input">
            <option value="5" selected>5 Hz (default)</option>
            <option value="10">10 Hz (fast)</option>
            <option value="2">2 Hz (low power)</option>
          </select>
        </div>
      </div>
      <div class="setting-group">
        <h4>Static Sensor</h4>
        <div class="setting-row">
          <label>Min distance</label>
          <input type="number" class="setting-input" value="0" min="0" max="2500" step="10" /> cm
        </div>
        <div class="setting-row">
          <label>Max distance</label>
          <span class="setting-hint">Auto-set to furthest room point${autoRange > 0 ? ` (${autoRange} cm)` : ""}</span>
          <input type="number" class="setting-input" .value=${String(autoRange)} min="0" max="2500" step="10" /> cm
        </div>
        <div class="setting-row">
          <label>Trigger distance</label>
          <input type="number" class="setting-input" .value=${String(autoRange)} min="0" max="2500" step="10" /> cm
        </div>
      </div>
    </div>
  `;
}

private _renderSensitivities() {
  return html`
    <div class="settings-section">
      <div class="setting-group">
        <h4>Motion Sensor</h4>
        <div class="setting-row">
          <label>Presence timeout</label>
          <input type="number" class="setting-input" value="5" min="0" max="600" step="1" /> sec
        </div>
      </div>
      <div class="setting-group">
        <h4>Static Sensor</h4>
        <div class="setting-row">
          <label>Presence timeout</label>
          <input type="number" class="setting-input" value="30" min="0" max="600" step="1" /> sec
        </div>
        <div class="setting-row">
          <label>Trigger sensitivity</label>
          <input type="range" class="setting-range" min="0" max="9" value="7" />
          <span class="setting-value">7</span>
        </div>
        <div class="setting-row">
          <label>Sustain sensitivity</label>
          <input type="range" class="setting-range" min="0" max="9" value="5" />
          <span class="setting-value">5</span>
        </div>
      </div>
      <div class="setting-group">
        <h4>Target Sensor</h4>
        ${this._renderZoneTypeProfile("Entrance / Exit", 5, 1, 1, true)}
        ${this._renderZoneTypeProfile("Thoroughfare", 3, 1, 1, false)}
        ${this._renderZoneTypeProfile("Living area", 15, 3, 3, false)}
        ${this._renderZoneTypeProfile("Bed / Sofa", 60, 5, 1, false)}
      </div>
    </div>
  `;
}

private _renderZoneTypeProfile(
  label: string,
  timeout: number,
  trigger: number,
  sustain: number,
  expectAppearVanish: boolean,
) {
  return html`
    <div class="zone-type-group">
      <h5>${label}</h5>
      <div class="setting-row">
        <label>Presence timeout</label>
        <input type="number" class="setting-input" value=${timeout} min="0" max="600" step="1" /> sec
      </div>
      <div class="setting-row">
        <label>Trigger sensitivity</label>
        <input type="range" class="setting-range" min="0" max="9" value=${trigger} />
        <span class="setting-value">${trigger}</span>
      </div>
      <div class="setting-row">
        <label>Sustain sensitivity</label>
        <input type="range" class="setting-range" min="0" max="9" value=${sustain} />
        <span class="setting-value">${sustain}</span>
      </div>
      <div class="setting-row">
        <label>Expect appear/vanish</label>
        <input type="checkbox" class="setting-toggle" ?checked=${expectAppearVanish} />
      </div>
    </div>
  `;
}

private _renderReporting() {
  return html`
    <div class="settings-section">
      <div class="setting-group">
        <h4>Room level</h4>
        <div class="setting-row">
          <label>Occupancy</label>
          <input type="checkbox" class="setting-toggle" checked />
        </div>
        <div class="setting-row">
          <label>Static presence</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
        <div class="setting-row">
          <label>Motion presence</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
        <div class="setting-row">
          <label>Target presence</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
        <div class="setting-row">
          <label>Target count</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
      </div>
      <div class="setting-group">
        <h4>Zone level</h4>
        <div class="setting-row">
          <label>Presence</label>
          <input type="checkbox" class="setting-toggle" checked />
        </div>
        <div class="setting-row">
          <label>Target count</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
      </div>
      <div class="setting-group">
        <h4>Target level</h4>
        <div class="setting-row">
          <label>XY position, relative to sensor</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
        <div class="setting-row">
          <label>XY position, relative to grid</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
        <div class="setting-row">
          <label>Active</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
        <div class="setting-row">
          <label>Distance</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
        <div class="setting-row">
          <label>Angle</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
        <div class="setting-row">
          <label>Speed</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
        <div class="setting-row">
          <label>Resolution</label>
          <input type="checkbox" class="setting-toggle" />
        </div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 3: Build and verify**

Run: `cd frontend && npm run build`
Expected: Build succeeds, no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts
git commit -m "feat: implement settings page sections — detection, sensitivity, reporting"
```

---

### Task 4: Clean up removed CSS and final build

**Files:**
- Modify: `frontend/src/everything-presence-pro-panel.ts`

- [ ] **Step 1: Remove the `.settings-section-select` CSS**

The dropdown select CSS (lines ~2416-2427) is no longer used. Remove:
```css
    .settings-section-select {
      width: 100%;
      padding: 10px 12px;
      font-size: 15px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      margin-bottom: 20px;
      cursor: pointer;
      appearance: auto;
    }
```

- [ ] **Step 2: Final build**

Run: `cd frontend && npm run build`
Expected: Build succeeds, compiled JS updated.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/everything-presence-pro-panel.ts custom_components/everything_presence_pro/frontend/everything-presence-pro-panel.js
git commit -m "feat: clean up old settings CSS, final build"
```

import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

interface Target {
  x: number;
  y: number;
  speed: number;
  active: boolean;
}

interface Zone {
  id: string;
  name: string;
  color: string;
  sensitivity: string;
  cells: number[];
}

type Tool = "room" | "outside" | "furniture" | "zone" | "calibrate";

const GRID_COLS = 20;
const GRID_ROWS = 16;
const GRID_CELL_COUNT = GRID_COLS * GRID_ROWS;

const ZONE_COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#9C27B0",
  "#F44336",
  "#00BCD4",
  "#FFEB3B",
  "#795548",
];

@customElement("everything-presence-pro-panel")
export class EverythingPresenceProPanel extends LitElement {
  @property({ attribute: false }) hass: any;
  @property({ type: String }) entryId = "";

  @state() private _activeTool: Tool = "room";
  @state() private _grid: string[] = new Array(GRID_CELL_COUNT).fill("room");
  @state() private _zones: Zone[] = [];
  @state() private _activeZoneId: string | null = null;
  @state() private _targets: Target[] = [];
  @state() private _isPainting = false;
  @state() private _paintValue = "";

  private _config: any = {};

  connectedCallback(): void {
    super.connectedCallback();
    this._loadConfig();
  }

  updated(changedProps: PropertyValues): void {
    if (changedProps.has("hass") && this.hass) {
      this._updateTargets();
    }
  }

  private _loadConfig(): void {
    if (!this.hass) return;
    const panelConfig = (this.hass.panels as any)?.everything_presence_pro?.config;
    if (panelConfig) {
      this._config = panelConfig;
      if (!this.entryId && panelConfig.entry_id) {
        this.entryId = panelConfig.entry_id;
      }
    }
  }

  private _updateTargets(): void {
    if (!this.hass) return;
    const targets: Target[] = [];
    for (let i = 1; i <= 3; i++) {
      const xEntity = this._findEntity(`target_${i}_x`);
      const yEntity = this._findEntity(`target_${i}_y`);
      const speedEntity = this._findEntity(`target_${i}_speed`);

      if (xEntity && yEntity) {
        const x = parseFloat(this.hass.states[xEntity]?.state ?? "0");
        const y = parseFloat(this.hass.states[yEntity]?.state ?? "0");
        const speed = speedEntity
          ? parseFloat(this.hass.states[speedEntity]?.state ?? "0")
          : 0;
        const active = x !== 0 || y !== 0;
        targets.push({ x, y, speed, active });
      }
    }
    this._targets = targets;
  }

  private _findEntity(suffix: string): string | undefined {
    if (!this.hass?.states) return undefined;
    return Object.keys(this.hass.states).find(
      (eid: string) =>
        eid.startsWith("sensor.everything_presence_pro") &&
        eid.endsWith(suffix)
    );
  }

  private _selectTool(tool: Tool): void {
    this._activeTool = tool;
    this._activeZoneId = null;
  }

  private _onCellMouseDown(index: number): void {
    this._isPainting = true;
    this._applyToolToCell(index);
  }

  private _onCellMouseEnter(index: number): void {
    if (this._isPainting) {
      this._applyToolToCell(index);
    }
  }

  private _onCellMouseUp(): void {
    this._isPainting = false;
  }

  private _applyToolToCell(index: number): void {
    switch (this._activeTool) {
      case "room":
        this._grid = [...this._grid];
        this._grid[index] = "room";
        break;
      case "outside":
        this._grid = [...this._grid];
        this._grid[index] = "outside";
        break;
      case "furniture":
        this._grid = [...this._grid];
        this._grid[index] = "furniture";
        break;
      case "zone":
        if (this._activeZoneId) {
          const zone = this._zones.find((z) => z.id === this._activeZoneId);
          if (zone) {
            // Remove cell from other zones
            this._zones = this._zones.map((z) => ({
              ...z,
              cells: z.id === this._activeZoneId
                ? z.cells.includes(index)
                  ? z.cells.filter((c) => c !== index)
                  : [...z.cells, index]
                : z.cells.filter((c) => c !== index),
            }));
          }
        }
        break;
    }
    this.requestUpdate();
  }

  private _addZone(): void {
    const id = `zone_${Date.now()}`;
    const colorIndex = this._zones.length % ZONE_COLORS.length;
    const newZone: Zone = {
      id,
      name: `Zone ${this._zones.length + 1}`,
      color: ZONE_COLORS[colorIndex],
      sensitivity: "normal",
      cells: [],
    };
    this._zones = [...this._zones, newZone];
    this._activeZoneId = id;
  }

  private _selectZone(id: string): void {
    this._activeZoneId = id;
  }

  private _removeZone(id: string): void {
    this._zones = this._zones.filter((z) => z.id !== id);
    if (this._activeZoneId === id) {
      this._activeZoneId = null;
    }
  }

  private _getCellClass(index: number): string {
    const cellType = this._grid[index];
    const classes = [cellType];

    // Check if cell belongs to any zone
    for (const zone of this._zones) {
      if (zone.cells.includes(index)) {
        classes.push("zone-cell");
        break;
      }
    }

    return classes.join(" ");
  }

  private _getCellZoneColor(index: number): string {
    for (const zone of this._zones) {
      if (zone.cells.includes(index)) {
        return zone.color;
      }
    }
    return "";
  }

  private _getTargetStyle(target: Target): string {
    // Map sensor coordinates (mm) to grid percentage
    // X: -3000 to 3000 mm -> 0% to 100%
    // Y: 0 to 6000 mm -> 100% to 0% (inverted, sensor is at bottom)
    const xPercent = ((target.x + 3000) / 6000) * 100;
    const yPercent = (1 - target.y / 6000) * 100;
    return `left: ${xPercent}%; top: ${yPercent}%;`;
  }

  static styles = css`
    :host {
      display: flex;
      height: 100%;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color, #212121);
      font-family: var(--paper-font-body1_-_font-family, "Roboto", sans-serif);
    }

    .tools-sidebar {
      width: 64px;
      background: var(--card-background-color, #fff);
      border-right: 1px solid var(--divider-color, #e0e0e0);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 8px;
    }

    .tool-btn {
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      gap: 2px;
      transition: background 0.2s;
    }

    .tool-btn:hover {
      background: var(--secondary-background-color, #e0e0e0);
    }

    .tool-btn.active {
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .tool-btn ha-icon {
      --mdc-icon-size: 22px;
    }

    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: auto;
    }

    .grid-container {
      position: relative;
      display: inline-block;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(${GRID_COLS}, 28px);
      grid-template-rows: repeat(${GRID_ROWS}, 28px);
      gap: 1px;
      background: var(--divider-color, #e0e0e0);
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      user-select: none;
    }

    .cell {
      width: 28px;
      height: 28px;
      background: var(--card-background-color, #fff);
      cursor: pointer;
      transition: background 0.1s;
      position: relative;
    }

    .cell:hover {
      opacity: 0.8;
    }

    .cell.room {
      background: var(--card-background-color, #fff);
    }

    .cell.outside {
      background: var(--secondary-background-color, #e0e0e0);
    }

    .cell.furniture {
      background: #bcaaa4;
    }

    .cell.zone-cell {
      opacity: 0.85;
    }

    .targets-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    .target-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -50%);
      z-index: 10;
    }

    .target-dot.moving {
      background: #4caf50;
    }

    .target-dot.stationary {
      background: #ff9800;
    }

    .zone-sidebar {
      width: 240px;
      background: var(--card-background-color, #fff);
      border-left: 1px solid var(--divider-color, #e0e0e0);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }

    .zone-sidebar h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .zone-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s;
    }

    .zone-item:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .zone-item.active {
      border-color: var(--primary-color, #03a9f4);
    }

    .zone-color-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .zone-name {
      flex: 1;
      font-size: 14px;
    }

    .zone-remove-btn {
      background: none;
      border: none;
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .zone-remove-btn:hover {
      color: var(--error-color, #f44336);
    }

    .add-zone-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      border: 2px dashed var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: none;
      color: var(--primary-color, #03a9f4);
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .add-zone-btn:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .panel-header {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 16px;
      text-align: center;
    }
  `;

  render() {
    return html`
      <div class="tools-sidebar">
        <button
          class="tool-btn ${this._activeTool === "room" ? "active" : ""}"
          @click=${() => this._selectTool("room")}
        >
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          Room
        </button>
        <button
          class="tool-btn ${this._activeTool === "outside" ? "active" : ""}"
          @click=${() => this._selectTool("outside")}
        >
          <ha-icon icon="mdi:tree"></ha-icon>
          Outside
        </button>
        <button
          class="tool-btn ${this._activeTool === "furniture" ? "active" : ""}"
          @click=${() => this._selectTool("furniture")}
        >
          <ha-icon icon="mdi:sofa"></ha-icon>
          Furniture
        </button>
        <button
          class="tool-btn ${this._activeTool === "zone" ? "active" : ""}"
          @click=${() => this._selectTool("zone")}
        >
          <ha-icon icon="mdi:select-group"></ha-icon>
          Zone
        </button>
        <button
          class="tool-btn ${this._activeTool === "calibrate" ? "active" : ""}"
          @click=${() => this._selectTool("calibrate")}
        >
          <ha-icon icon="mdi:crosshairs-gps"></ha-icon>
          Calibrate
        </button>
      </div>

      <div class="main-area">
        <div class="panel-header">Everything Presence Pro</div>
        <div class="grid-container">
          <div
            class="grid"
            @mouseup=${this._onCellMouseUp}
            @mouseleave=${this._onCellMouseUp}
          >
            ${Array.from({ length: GRID_CELL_COUNT }, (_, i) => {
              const zoneColor = this._getCellZoneColor(i);
              const style = zoneColor
                ? `background-color: ${zoneColor}`
                : "";
              return html`
                <div
                  class="cell ${this._getCellClass(i)}"
                  style=${style}
                  @mousedown=${() => this._onCellMouseDown(i)}
                  @mouseenter=${() => this._onCellMouseEnter(i)}
                ></div>
              `;
            })}
          </div>
          <div class="targets-overlay">
            ${this._targets
              .filter((t) => t.active)
              .map(
                (t) => html`
                  <div
                    class="target-dot ${t.speed !== 0 ? "moving" : "stationary"}"
                    style=${this._getTargetStyle(t)}
                  ></div>
                `
              )}
          </div>
        </div>
      </div>

      ${this._activeTool === "zone"
        ? html`
            <div class="zone-sidebar">
              <h3>Zones</h3>
              ${this._zones.map(
                (zone) => html`
                  <div
                    class="zone-item ${this._activeZoneId === zone.id ? "active" : ""}"
                    @click=${() => this._selectZone(zone.id)}
                  >
                    <div
                      class="zone-color-dot"
                      style="background: ${zone.color}"
                    ></div>
                    <span class="zone-name">${zone.name}</span>
                    <button
                      class="zone-remove-btn"
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        this._removeZone(zone.id);
                      }}
                    >
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                `
              )}
              <button class="add-zone-btn" @click=${this._addZone}>
                <ha-icon icon="mdi:plus"></ha-icon>
                Add zone
              </button>
            </div>
          `
        : ""}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "everything-presence-pro-panel": EverythingPresenceProPanel;
  }
}

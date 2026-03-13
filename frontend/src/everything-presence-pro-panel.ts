import { LitElement, html, css, PropertyValues, nothing } from "lit";
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

interface EntryInfo {
  entry_id: string;
  title: string;
  room_name: string;
  placement: string;
  has_layout: boolean;
}

interface RoomBounds {
  far_y: number;
  left_x: number;
  right_x: number;
}

type Tool = "room" | "outside" | "furniture" | "zone";
type Placement = "wall" | "left_corner" | "right_corner";
type SetupStep =
  | "placement"
  | "orientation"
  | "bounds_far"
  | "bounds_left"
  | "bounds_right"
  | "preview";

const GRID_COLS = 20;
const GRID_ROWS = 16;
const GRID_CELL_COUNT = GRID_COLS * GRID_ROWS;
const CELL_SIZE = 28;
const CELL_GAP = 1;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const GRID_WIDTH = GRID_COLS * CELL_STEP - CELL_GAP;
const GRID_HEIGHT = GRID_ROWS * CELL_STEP - CELL_GAP;
// LD2450 angle correction scale factor (must match Python calibration.py)
const LD2450_SCALE_FACTOR = 0.78;

function ld2450Correct(x: number, y: number): { cx: number; cy: number } {
  if (x === 0 && y === 0) return { cx: 0, cy: 0 };
  const angle = Math.atan2(x, y);
  const distance = Math.sqrt(x * x + y * y);
  const correctedAngle = angle * LD2450_SCALE_FACTOR;
  return {
    cx: distance * Math.sin(correctedAngle),
    cy: distance * Math.cos(correctedAngle),
  };
}

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

  @state() private _activeTool: Tool = "room";
  @state() private _grid: string[] = new Array(GRID_CELL_COUNT).fill("room");
  @state() private _zones: Zone[] = [];
  @state() private _activeZoneId: string | null = null;
  @state() private _targets: Target[] = [];
  @state() private _isPainting = false;
  @state() private _paintValue = "";

  // Multi-device support
  @state() private _entries: EntryInfo[] = [];
  @state() private _selectedEntryId = "";
  @state() private _loading = true;

  // Setup wizard
  @state() private _setupStep: SetupStep | null = null;
  @state() private _wizardRoomName = "";
  @state() private _wizardPlacement: Placement | null = null;
  @state() private _wizardSaving = false;
  @state() private _wizardMirrored = false;
  @state() private _wizardBounds: RoomBounds = { far_y: 0, left_x: 0, right_x: 0 };
  @state() private _wizardCapturedPoints: Array<{ x: number; y: number }> = [];

  // Sensor config (from saved config)
  @state() private _placement: Placement | "" = "";
  @state() private _roomName = "";
  @state() private _mirrored = false;
  @state() private _roomBounds: RoomBounds | null = null;

  // Calibration state
  @state() private _sensorAngle: number = 0;
  @state() private _offsetX: number = 0;
  @state() private _offsetY: number = 0;
  @state() private _wizardRawPoints: Array<{x: number; y: number; label: string}> = [];

  // Recalibration
  @state() private _recalibrating: boolean = false;

  // Target subscription
  private _unsubTargets?: () => void;

  connectedCallback(): void {
    super.connectedCallback();
    this._initialize();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribeTargets();
  }

  updated(changedProps: PropertyValues): void {
    if (changedProps.has("hass") && this.hass) {
      if (this._loading && !this._entries.length) {
        this._initialize();
      }
    }
  }

  private async _initialize(): Promise<void> {
    if (!this.hass) return;
    this._loading = true;
    await this._loadEntries();
    if (this._selectedEntryId) {
      await this._loadEntryConfig(this._selectedEntryId);
    }
    this._loading = false;
  }

  private async _loadEntries(): Promise<void> {
    try {
      const result = await this.hass.callWS({
        type: "everything_presence_pro/list_entries",
      });
      this._entries = result as EntryInfo[];
    } catch {
      this._entries = [];
      return;
    }

    const stored = localStorage.getItem("epp_selected_entry");
    const match = stored && this._entries.find((e) => e.entry_id === stored);
    this._selectedEntryId = match
      ? stored!
      : this._entries[0]?.entry_id ?? "";
  }

  private async _loadEntryConfig(entryId: string): Promise<void> {
    try {
      const config = await this.hass.callWS({
        type: "everything_presence_pro/get_config",
        entry_id: entryId,
      });
      this._applyConfig(config);
    } catch {
      // Entry may not be ready yet
    }
    this._subscribeTargets(entryId);
  }

  private _applyConfig(config: any): void {
    // Load room layout
    const layout = config.room_layout || {};
    const roomCells: number[] = layout.room_cells || [];
    const furniture: any[] = layout.furniture || [];
    const grid = new Array(GRID_CELL_COUNT).fill("outside");
    for (const idx of roomCells) {
      if (idx >= 0 && idx < GRID_CELL_COUNT) grid[idx] = "room";
    }
    for (const item of furniture) {
      for (const idx of item.cells || []) {
        if (idx >= 0 && idx < GRID_CELL_COUNT) grid[idx] = "furniture";
      }
    }
    this._grid = grid;

    // Load zones
    const zones: Zone[] = (config.zones || []).map((z: any, i: number) => ({
      id: z.id,
      name: z.name,
      color: ZONE_COLORS[i % ZONE_COLORS.length],
      sensitivity: z.sensitivity || "normal",
      cells: z.cells || [],
    }));
    this._zones = zones;

    // Load setup config
    const placement = config.placement || "";
    const roomName = config.room_name || "";
    const mirrored = config.mirrored || false;
    const bounds = config.room_bounds;

    if (config.calibration) {
      this._sensorAngle = config.calibration.sensor_angle || 0;
      this._offsetX = config.calibration.offset_x || 0;
      this._offsetY = config.calibration.offset_y || 0;
    }

    if (!placement) {
      this._setupStep = "placement";
      this._wizardRoomName = roomName;
      this._wizardPlacement = null;
      this._wizardMirrored = false;
      this._wizardBounds = { far_y: 0, left_x: 0, right_x: 0 };
      this._wizardCapturedPoints = [];
      this._placement = "";
      this._roomName = "";
      this._mirrored = false;
      this._roomBounds = null;
    } else {
      this._setupStep = null;
      this._placement = placement as Placement;
      this._roomName = roomName;
      this._mirrored = mirrored;
      this._roomBounds =
        bounds && bounds.far_y
          ? { far_y: bounds.far_y, left_x: bounds.left_x, right_x: bounds.right_x }
          : null;
    }
  }

  private _subscribeTargets(entryId: string): void {
    this._unsubscribeTargets();
    if (!this.hass || !entryId) return;

    const conn = this.hass.connection;

    conn
      .subscribeMessage(
        (event: any) => {
          const targets: Target[] = (event.targets || []).map((t: any) => ({
            x: t.x,
            y: t.y,
            speed: 0,
            active: t.active,
          }));
          this._targets = targets;
        },
        {
          type: "everything_presence_pro/subscribe_targets",
          entry_id: entryId,
        }
      )
      .then((unsub: () => void) => {
        // Store unsubscribe if we haven't already been asked to unsub
        this._unsubTargets = unsub;
      });
  }

  private _unsubscribeTargets(): void {
    if (this._unsubTargets) {
      this._unsubTargets();
      this._unsubTargets = undefined;
    }
    this._targets = [];
  }

  // -- Tool actions --

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
          this._zones = this._zones.map((z) => ({
            ...z,
            cells:
              z.id === this._activeZoneId
                ? z.cells.includes(index)
                  ? z.cells.filter((c) => c !== index)
                  : [...z.cells, index]
                : z.cells.filter((c) => c !== index),
          }));
        }
        break;
    }
    this.requestUpdate();
  }

  // -- Zone management --

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

  // -- Grid helpers --

  private _getCellClass(index: number): string {
    const cellType = this._grid[index];
    const classes = [cellType];
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

  private _autoFillGrid(): void {
    this._grid = new Array(GRID_CELL_COUNT).fill("room");
  }

  // -- Coordinate mapping --

  private _sensorToRoom(
    tx: number,
    ty: number,
  ): { rx: number; ry: number } {
    // Stage 1: distortion correction
    const { cx, cy } = ld2450Correct(tx, ty);

    // Stage 2: clockwise rotation by sensor_angle
    const angle = this._sensorAngle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const rx = cx * cosA + cy * sinA;
    const ry = -cx * sinA + cy * cosA;

    // Stage 3: translation
    return {
      rx: rx + this._offsetX,
      ry: ry + this._offsetY,
    };
  }

  private _mapTargetToPercent(
    target: Target,
    mirrored: boolean,
    bounds: RoomBounds | null
  ): { x: number; y: number } {
    const tx = mirrored ? -target.x : target.x;
    const { rx, ry } = this._sensorToRoom(tx, target.y);

    if (bounds && bounds.far_y > 0 && bounds.right_x > bounds.left_x) {
      const xPercent =
        ((rx - bounds.left_x) / (bounds.right_x - bounds.left_x)) * 100;
      const yPercent = (ry / bounds.far_y) * 100;
      return { x: xPercent, y: yPercent };
    }

    const xPercent = (rx / 6000) * 100;
    const yPercent = (ry / 6000) * 100;
    return { x: xPercent, y: yPercent };
  }

  private _getTargetStyle(target: Target): string {
    const { x, y } = this._mapTargetToPercent(
      target,
      this._mirrored,
      this._roomBounds
    );
    return `left: ${x}%; top: ${y}%;`;
  }

  // -- Device selector --

  private async _onDeviceChange(e: Event): Promise<void> {
    const select = e.target as HTMLSelectElement;
    const entryId = select.value;
    this._unsubscribeTargets();
    this._selectedEntryId = entryId;
    localStorage.setItem("epp_selected_entry", entryId);
    await this._loadEntryConfig(entryId);
  }

  // -- Setup wizard --

  private _wizardGoToOrientation(): void {
    if (!this._wizardPlacement || !this._wizardRoomName.trim()) return;
    this._placement = this._wizardPlacement;
    this._mirrored = false;
    this._wizardMirrored = false;
    this._setupStep = "orientation";
  }

  private _wizardGoToBounds(): void {
    this._mirrored = this._wizardMirrored;
    this._wizardBounds = { far_y: 0, left_x: 0, right_x: 0 };
    this._wizardCapturedPoints = [];
    this._wizardRawPoints = [];
    this._setupStep = "bounds_far";
  }

  private _markBoundsPoint(): void {
    const active = this._targets.find((t) => t.active);
    if (!active) return;

    const tx = this._wizardMirrored ? -active.x : active.x;

    switch (this._setupStep) {
      case "bounds_far":
        this._wizardRawPoints = [
          ...this._wizardRawPoints,
          { x: tx, y: active.y, label: "far" },
        ];
        this._setupStep = "bounds_left";
        break;
      case "bounds_left":
        this._wizardRawPoints = [
          ...this._wizardRawPoints,
          { x: tx, y: active.y, label: "left" },
        ];
        this._setupStep = "bounds_right";
        break;
      case "bounds_right": {
        this._wizardRawPoints = [
          ...this._wizardRawPoints,
          { x: tx, y: active.y, label: "right" },
        ];
        this._computeCalibrationFromBounds();
        this._setupStep = "preview";
        break;
      }
    }
  }

  private _computeCalibrationFromBounds(): void {
    const farPt = this._wizardRawPoints.find((p) => p.label === "far");
    const leftPt = this._wizardRawPoints.find((p) => p.label === "left");
    const rightPt = this._wizardRawPoints.find((p) => p.label === "right");
    if (!farPt || !leftPt || !rightPt) return;

    const far = ld2450Correct(farPt.x, farPt.y);
    const left = ld2450Correct(leftPt.x, leftPt.y);
    const right = ld2450Correct(rightPt.x, rightPt.y);

    const placement = this._wizardPlacement || "wall";
    let sensorAngle: number;
    if (placement === "left_corner" || placement === "right_corner") {
      sensorAngle = Math.atan2(
        right.cy - left.cy,
        right.cx - left.cx
      );
    } else {
      sensorAngle = Math.atan2(far.cx, far.cy);
    }

    const cosA = Math.cos(sensorAngle);
    const sinA = Math.sin(sensorAngle);
    const rotate = (cx: number, cy: number) => ({
      rx: cx * cosA + cy * sinA,
      ry: -cx * sinA + cy * cosA,
    });

    const farR = rotate(far.cx, far.cy);
    const leftR = rotate(left.cx, left.cy);
    const rightR = rotate(right.cx, right.cy);

    const allX = [farR.rx, leftR.rx, rightR.rx];
    let minX = Math.min(...allX);
    let maxX = Math.max(...allX);
    const roomWidth = maxX - minX;
    const roomDepth = Math.max(farR.ry, leftR.ry, rightR.ry);

    let leftX = leftR.rx;
    let rightX = rightR.rx;
    if (leftX > rightX) {
      [leftX, rightX] = [rightX, leftX];
    }

    let offsetX = 0;
    let offsetY = 0;
    if (placement === "right_corner") {
      offsetX = roomWidth;
    } else if (placement === "wall") {
      offsetX = roomWidth / 2;
    }

    this._sensorAngle = sensorAngle;
    this._offsetX = offsetX;
    this._offsetY = offsetY;

    this._wizardBounds = {
      far_y: roomDepth,
      left_x: 0,
      right_x: roomWidth,
    };
    this._roomBounds = { ...this._wizardBounds };

    this._wizardCapturedPoints = [
      { x: farR.rx + offsetX, y: farR.ry + offsetY },
      { x: leftR.rx + offsetX, y: leftR.ry + offsetY },
      { x: rightR.rx + offsetX, y: rightR.ry + offsetY },
    ];

    this._autoFillGrid();
  }

  private async _wizardFinish(): Promise<void> {
    if (!this._wizardPlacement || !this._wizardRoomName.trim()) return;

    this._wizardSaving = true;
    try {
      await this.hass.callWS({
        type: "everything_presence_pro/set_setup",
        entry_id: this._selectedEntryId,
        room_name: this._wizardRoomName.trim(),
        placement: this._wizardPlacement,
        mirrored: this._wizardMirrored,
        room_bounds: this._wizardBounds,
        calibration: { sensor_angle: this._sensorAngle },
      });
      this._placement = this._wizardPlacement;
      this._roomName = this._wizardRoomName.trim();
      this._mirrored = this._wizardMirrored;
      this._roomBounds = { ...this._wizardBounds };
      this._setupStep = null;

      await this._loadEntryConfig(this._selectedEntryId);
      await this._loadEntries();
    } finally {
      this._wizardSaving = false;
    }
  }

  // -- Recalibration --

  private _startRecalibration(): void {
    this._recalibrating = true;
  }

  private async _markRecalibration(): Promise<void> {
    const active = this._targets.find((t) => t.active);
    if (!active) return;

    const tx = this._mirrored ? -active.x : active.x;
    const bounds = this._roomBounds;
    if (!bounds || !bounds.far_y || !bounds.right_x) return;

    const roomWidth = bounds.right_x - bounds.left_x;
    const roomDepth = bounds.far_y;
    const placement = this._placement;

    let expectedX: number;
    let expectedY: number;
    if (placement === "left_corner") {
      expectedX = roomWidth;
      expectedY = roomDepth;
    } else if (placement === "right_corner") {
      expectedX = 0;
      expectedY = roomDepth;
    } else {
      expectedX = roomWidth / 2;
      expectedY = roomDepth;
    }

    try {
      await this.hass.callWS({
        type: "everything_presence_pro/recalibrate",
        entry_id: this._selectedEntryId,
        sensor_x: tx,
        sensor_y: active.y,
        expected_room_x: expectedX,
        expected_room_y: expectedY,
      });
      const { cx, cy } = ld2450Correct(tx, active.y);
      const sensorFrameAngle = Math.atan2(cx, cy);
      const roomFrameAngle = Math.atan2(
        expectedX - this._offsetX,
        expectedY - this._offsetY,
      );
      this._sensorAngle = sensorFrameAngle - roomFrameAngle;
    } catch (e) {
      console.error("Recalibration failed:", e);
    }

    this._recalibrating = false;
  }

  // -- Sensor overlay geometry --

  private _getSensorPosition(): { x: number; y: number } {
    switch (this._placement) {
      case "wall":
        return { x: GRID_WIDTH / 2, y: 0 };
      case "left_corner":
        return { x: 0, y: 0 };
      case "right_corner":
        return { x: GRID_WIDTH, y: 0 };
      default:
        return { x: GRID_WIDTH / 2, y: 0 };
    }
  }

  private _getFovAngles(): { start: number; end: number } {
    switch (this._placement) {
      case "wall":
        return { start: -60, end: 60 };
      case "left_corner":
        return { start: -15, end: 105 };
      case "right_corner":
        return { start: -105, end: 15 };
      default:
        return { start: -60, end: 60 };
    }
  }

  // -- Mini-grid helpers for wizard steps --

  private _getOrientationSensorStyle(): string {
    switch (this._wizardPlacement) {
      case "left_corner":
        return "left: 0; top: 0; transform: translate(-50%, -50%);";
      case "right_corner":
        return "right: 0; top: 0; transform: translate(50%, -50%); left: auto;";
      case "wall":
      default:
        return "left: 50%; top: 0; transform: translate(-50%, -50%);";
    }
  }

  private _getWizardTargetStyle(target: Target): string {
    const { x, y } = this._mapTargetToPercent(
      target,
      this._wizardMirrored,
      null // no bounds during orientation/bounds steps
    );
    return `left: ${x}%; top: ${y}%;`;
  }

  private _getWizardCapturedStyle(point: { x: number; y: number }): string {
    const xPercent = (point.x / 6000) * 100;
    const yPercent = (point.y / 6000) * 100;
    return `left: ${xPercent}%; top: ${yPercent}%;`;
  }

  // -- Styles --

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
      grid-template-columns: repeat(20, 28px);
      grid-template-rows: repeat(16, 28px);
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

    .sensor-overlay {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 5;
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 16px;
      text-align: center;
    }

    .header-settings-btn {
      background: none;
      border: none;
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      transition: background 0.2s;
    }

    .header-settings-btn:hover {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--primary-text-color, #212121);
    }

    .header-settings-btn ha-icon {
      --mdc-icon-size: 20px;
    }

    .device-select {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
    }

    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      font-size: 16px;
      color: var(--secondary-text-color, #757575);
    }

    /* Setup wizard */
    .wizard-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      padding: 32px;
      box-sizing: border-box;
    }

    .wizard-card {
      max-width: 560px;
      width: 100%;
      background: var(--card-background-color, #fff);
      border-radius: 16px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .wizard-card h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 500;
    }

    .wizard-card p {
      margin: 0;
      color: var(--secondary-text-color, #757575);
      font-size: 15px;
      line-height: 1.5;
    }

    .wizard-card label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: var(--secondary-text-color, #757575);
    }

    .wizard-card input[type="text"] {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      font-size: 15px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .placement-options {
      display: flex;
      gap: 12px;
    }

    .placement-btn {
      flex: 1;
      padding: 16px 12px;
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 500;
      transition: border-color 0.2s, background 0.2s;
    }

    .placement-btn:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .placement-btn.selected {
      border-color: var(--primary-color, #03a9f4);
      background: rgba(3, 169, 244, 0.06);
    }

    .wizard-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .wizard-btn {
      padding: 10px 24px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
    }

    .wizard-btn-primary {
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .wizard-btn-primary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .wizard-btn-back {
      background: transparent;
      color: var(--secondary-text-color, #757575);
    }

    .wizard-btn-secondary {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--primary-text-color, #212121);
    }

    .wizard-btn-secondary:hover {
      opacity: 0.85;
    }

    /* Mini-grid used in orientation and bounds steps */
    .mini-grid-container {
      display: flex;
      justify-content: center;
    }

    .mini-grid {
      width: 280px;
      height: 224px;
      background: var(--secondary-background-color, #f5f5f5);
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .mini-grid-label {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      color: var(--secondary-text-color, #757575);
      pointer-events: none;
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }

    .mini-grid-label.left-label {
      left: 6px;
    }

    .mini-grid-label.right-label {
      right: 6px;
      transform: translateY(-50%) rotate(180deg);
    }

    .mini-grid-sensor {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      z-index: 5;
    }

    .mini-grid-target {
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4caf50;
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -50%);
      z-index: 10;
      transition: left 0.15s, top 0.15s;
    }

    .mini-grid-captured {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ff9800;
      border: 2px solid #fff;
      transform: translate(-50%, -50%);
      z-index: 8;
    }

    .placement-diagram {
      width: 80px;
      height: 56px;
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 6px;
      position: relative;
      background: var(--secondary-background-color, #f5f5f5);
    }

    .placement-diagram .sensor-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      position: absolute;
    }

    .placement-diagram .fov-cone {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .placement-diagram.wall .sensor-dot {
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
    }

    .placement-diagram.left-corner .sensor-dot {
      top: -5px;
      left: -5px;
    }

    .placement-diagram.right-corner .sensor-dot {
      top: -5px;
      right: -5px;
      left: auto;
    }

    .step-indicator {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .step-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--divider-color, #e0e0e0);
    }

    .step-dot.active {
      background: var(--primary-color, #03a9f4);
    }

    .step-dot.done {
      background: #4caf50;
    }

    .no-target-warning {
      color: var(--error-color, #f44336);
      font-size: 13px;
      text-align: center;
    }

    .recalibrate-overlay {
      margin-top: 16px;
      padding: 16px 24px;
      background: var(--card-background-color, #fff);
      border: 2px solid var(--primary-color, #03a9f4);
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .recalibrate-overlay p {
      margin: 0;
      font-size: 14px;
      flex: 1;
    }

    .recalibrate-overlay button {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }

    .recalibrate-overlay button:first-of-type {
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .recalibrate-overlay button:last-of-type {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--primary-text-color, #212121);
    }
  `;

  // -- Render methods --

  render() {
    if (this._loading) {
      return html`<div class="loading-container">Loading...</div>`;
    }

    if (!this._entries.length) {
      return html`<div class="loading-container">
        No Everything Presence Pro devices configured
      </div>`;
    }

    if (this._setupStep !== null) {
      return this._renderWizard();
    }

    return this._renderEditor();
  }

  private _changePlacement(): void {
    this._setupStep = "placement";
    this._wizardRoomName = this._roomName;
    this._wizardPlacement = (this._placement as Placement) || null;
    this._wizardMirrored = this._mirrored;
    this._wizardBounds = this._roomBounds
      ? { ...this._roomBounds }
      : { far_y: 0, left_x: 0, right_x: 0 };
    this._wizardCapturedPoints = [];
    this._wizardRawPoints = [];
  }

  private _renderHeader() {
    const setupBtn =
      this._setupStep === null
        ? html`<button
            class="header-settings-btn"
            @click=${this._changePlacement}
            title="Change sensor placement"
          >
            <ha-icon icon="mdi:cog"></ha-icon>
          </button>`
        : nothing;

    if (this._entries.length > 1) {
      return html`
        <div class="panel-header">
          <select
            class="device-select"
            .value=${this._selectedEntryId}
            @change=${this._onDeviceChange}
          >
            ${this._entries.map(
              (e) => html`
                <option value=${e.entry_id}>
                  ${e.title}${e.room_name ? ` \u2014 ${e.room_name}` : ""}
                </option>
              `
            )}
          </select>
          ${setupBtn}
        </div>
      `;
    }
    const entry = this._entries[0];
    const title = this._roomName
      ? `${entry?.title ?? "EP Pro"} \u2014 ${this._roomName}`
      : entry?.title ?? "Everything Presence Pro";
    return html`<div class="panel-header">${title} ${setupBtn}</div>`;
  }

  private _renderStepIndicator() {
    const steps: SetupStep[] = [
      "placement",
      "orientation",
      "bounds_far",
      "preview",
    ];
    const currentIdx = steps.indexOf(this._setupStep!);
    // bounds_left and bounds_right share the same dot as bounds_far
    const effectiveIdx =
      this._setupStep === "bounds_left" || this._setupStep === "bounds_right"
        ? 2
        : currentIdx;

    return html`
      <div class="step-indicator">
        ${steps.map(
          (_, i) => html`
            <div
              class="step-dot ${i === effectiveIdx ? "active" : i < effectiveIdx ? "done" : ""}"
            ></div>
          `
        )}
      </div>
    `;
  }

  private _renderWizard() {
    let stepContent;
    switch (this._setupStep) {
      case "placement":
        stepContent = this._renderWizardPlacement();
        break;
      case "orientation":
        stepContent = this._renderWizardOrientation();
        break;
      case "bounds_far":
      case "bounds_left":
      case "bounds_right":
        stepContent = this._renderWizardBounds();
        break;
      case "preview":
        stepContent = this._renderWizardPreview();
        break;
    }
    return html`
      <div class="wizard-container">
        ${this._renderHeader()} ${this._renderStepIndicator()} ${stepContent}
      </div>
    `;
  }

  private _renderWizardPlacement() {
    const canNext = !!this._wizardPlacement && !!this._wizardRoomName.trim();

    return html`
      <div class="wizard-card">
        <h2>Sensor placement</h2>
        <p>Where is the sensor mounted? Choose the position and name the room.</p>

        <label>
          Room name
          <input
            type="text"
            .value=${this._wizardRoomName}
            @input=${(e: InputEvent) => {
              this._wizardRoomName = (e.target as HTMLInputElement).value;
            }}
            placeholder="e.g. Living Room"
          />
        </label>

        <div class="placement-options">
          <button
            class="placement-btn ${this._wizardPlacement === "left_corner" ? "selected" : ""}"
            @click=${() => {
              this._wizardPlacement = "left_corner";
            }}
          >
            <div class="placement-diagram left-corner">
              <div class="sensor-dot"></div>
              <svg class="fov-cone" viewBox="0 0 80 56">
                <path d="M 0 0 L 56 0 L 0 56 Z" fill="rgba(3,169,244,0.15)" stroke="rgba(3,169,244,0.4)" stroke-width="1"/>
              </svg>
            </div>
            Left corner
          </button>
          <button
            class="placement-btn ${this._wizardPlacement === "wall" ? "selected" : ""}"
            @click=${() => {
              this._wizardPlacement = "wall";
            }}
          >
            <div class="placement-diagram wall">
              <div class="sensor-dot"></div>
              <svg class="fov-cone" viewBox="0 0 80 56">
                <path d="M 40 0 L 72 56 L 8 56 Z" fill="rgba(3,169,244,0.15)" stroke="rgba(3,169,244,0.4)" stroke-width="1"/>
              </svg>
            </div>
            Wall (center)
          </button>
          <button
            class="placement-btn ${this._wizardPlacement === "right_corner" ? "selected" : ""}"
            @click=${() => {
              this._wizardPlacement = "right_corner";
            }}
          >
            <div class="placement-diagram right-corner">
              <div class="sensor-dot"></div>
              <svg class="fov-cone" viewBox="0 0 80 56">
                <path d="M 80 0 L 80 56 L 24 0 Z" fill="rgba(3,169,244,0.15)" stroke="rgba(3,169,244,0.4)" stroke-width="1"/>
              </svg>
            </div>
            Right corner
          </button>
        </div>

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-primary"
            ?disabled=${!canNext}
            @click=${this._wizardGoToOrientation}
          >
            Next
          </button>
        </div>
      </div>
    `;
  }

  private _renderWizardOrientation() {
    return html`
      <div class="wizard-card">
        <h2>Verify orientation</h2>
        <p>
          Move to the <strong>left side</strong> of the room. The dot should
          appear on the <strong>left</strong> of the grid below. If it appears on
          the wrong side, click "Flip left/right".
        </p>

        ${this._renderMiniGrid()}

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-back"
            @click=${() => {
              this._setupStep = "placement";
            }}
          >
            Back
          </button>
          <button
            class="wizard-btn wizard-btn-secondary"
            @click=${() => {
              this._wizardMirrored = !this._wizardMirrored;
              this._mirrored = this._wizardMirrored;
            }}
          >
            Flip left/right
          </button>
          <button
            class="wizard-btn wizard-btn-primary"
            @click=${this._wizardGoToBounds}
          >
            Looks correct
          </button>
        </div>
      </div>
    `;
  }

  private _renderWizardBounds() {
    const hasTarget = this._targets.some((t) => t.active);

    let instruction: string;
    let stepLabel: string;
    switch (this._setupStep) {
      case "bounds_far":
        instruction =
          "Walk to the <strong>wall furthest</strong> from the sensor and click Mark.";
        stepLabel = "Far wall (1/3)";
        break;
      case "bounds_left":
        instruction =
          "Walk to the <strong>left-most point</strong> of the room and click Mark.";
        stepLabel = "Left extent (2/3)";
        break;
      case "bounds_right":
        instruction =
          "Walk to the <strong>right-most point</strong> of the room and click Mark.";
        stepLabel = "Right extent (3/3)";
        break;
      default:
        instruction = "";
        stepLabel = "";
    }

    return html`
      <div class="wizard-card">
        <h2>Define room bounds</h2>
        <p><strong>${stepLabel}</strong></p>
        <p>${this._unsafeHTML(instruction)}</p>

        ${this._renderMiniGrid(true)}

        ${!hasTarget
          ? html`<p class="no-target-warning">
              No target detected. Make sure you are visible to the sensor.
            </p>`
          : nothing}

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-back"
            @click=${() => {
              if (this._setupStep === "bounds_far") {
                this._setupStep = "orientation";
              } else if (this._setupStep === "bounds_left") {
                this._wizardCapturedPoints = this._wizardCapturedPoints.slice(
                  0,
                  -1
                );
                this._wizardRawPoints = this._wizardRawPoints.slice(0, -1);
                this._setupStep = "bounds_far";
              } else {
                this._wizardCapturedPoints = this._wizardCapturedPoints.slice(
                  0,
                  -1
                );
                this._wizardRawPoints = this._wizardRawPoints.slice(0, -1);
                this._setupStep = "bounds_left";
              }
            }}
          >
            Back
          </button>
          <button
            class="wizard-btn wizard-btn-primary"
            ?disabled=${!hasTarget}
            @click=${this._markBoundsPoint}
          >
            Mark position
          </button>
        </div>
      </div>
    `;
  }

  private _unsafeHTML(str: string) {
    const el = document.createElement("span");
    el.innerHTML = str;
    return html`${el}`;
  }

  private _renderWizardPreview() {
    const b = this._wizardBounds;
    const widthM = ((b.right_x - b.left_x) / 1000).toFixed(1);
    const depthM = (b.far_y / 1000).toFixed(1);

    return html`
      <div class="wizard-card">
        <h2>Room preview</h2>
        <p>
          Room size: approximately ${widthM}m wide x ${depthM}m deep. The grid
          below is now scaled to your room. Verify that targets appear in the
          correct positions.
        </p>

        <div class="mini-grid-container">
          <div class="mini-grid">
            <div class="mini-grid-sensor" style=${this._getOrientationSensorStyle()}></div>
            ${this._targets
              .filter((t) => t.active)
              .map(
                (t) => {
                  const { x, y } = this._mapTargetToPercent(
                    t,
                    this._wizardMirrored,
                    this._wizardBounds
                  );
                  return html`
                    <div
                      class="mini-grid-target"
                      style="left: ${x}%; top: ${y}%;"
                    ></div>
                  `;
                }
              )}
          </div>
        </div>

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-back"
            @click=${() => {
              this._wizardCapturedPoints = this._wizardCapturedPoints.slice(0, -1);
              this._wizardRawPoints = this._wizardRawPoints.slice(0, -1);
              this._roomBounds = null;
              this._setupStep = "bounds_right";
            }}
          >
            Back
          </button>
          <button
            class="wizard-btn wizard-btn-primary"
            ?disabled=${this._wizardSaving}
            @click=${this._wizardFinish}
          >
            ${this._wizardSaving ? "Saving..." : "Finish"}
          </button>
        </div>
      </div>
    `;
  }

  private _renderMiniGrid(showCaptured = false) {
    return html`
      <div class="mini-grid-container">
        <div class="mini-grid">
          <div class="mini-grid-label left-label">Left</div>
          <div class="mini-grid-label right-label">Right</div>
          <div
            class="mini-grid-sensor"
            style=${this._getOrientationSensorStyle()}
          ></div>
          ${showCaptured
            ? this._wizardCapturedPoints.map(
                (pt) => html`
                  <div
                    class="mini-grid-captured"
                    style=${this._getWizardCapturedStyle(pt)}
                  ></div>
                `
              )
            : nothing}
          ${this._targets
            .filter((t) => t.active)
            .map(
              (t) => html`
                <div
                  class="mini-grid-target"
                  style=${this._getWizardTargetStyle(t)}
                ></div>
              `
            )}
        </div>
      </div>
    `;
  }

  private _renderEditor() {
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
          class="tool-btn"
          @click=${() => this._startRecalibration()}
        >
          <ha-icon icon="mdi:compass-outline"></ha-icon>
          Recalibrate
        </button>
      </div>

      <div class="main-area">
        ${this._renderHeader()}
        <div class="grid-container">
          <div
            class="grid"
            @mouseup=${this._onCellMouseUp}
            @mouseleave=${this._onCellMouseUp}
          >
            ${Array.from({ length: GRID_CELL_COUNT }, (_, i) => {
              const zoneColor = this._getCellZoneColor(i);
              const style = zoneColor ? `background-color: ${zoneColor}` : "";
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
          ${this._renderSensorOverlay()}
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
        ${this._recalibrating
          ? html`
            <div class="recalibrate-overlay">
              <p>Stand in the far corner and tap Mark</p>
              <button @click=${() => this._markRecalibration()}>Mark</button>
              <button @click=${() => { this._recalibrating = false; }}>Cancel</button>
            </div>
          `
          : nothing}
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
        : nothing}
    `;
  }

  private _renderSensorOverlay() {
    if (!this._placement) return nothing;

    const { x: sx, y: sy } = this._getSensorPosition();
    const { start, end } = this._getFovAngles();

    const radius = Math.max(GRID_WIDTH, GRID_HEIGHT);
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const x1 = sx + radius * Math.sin(toRad(start));
    const y1 = sy + radius * Math.cos(toRad(start));
    const x2 = sx + radius * Math.sin(toRad(end));
    const y2 = sy + radius * Math.cos(toRad(end));
    const largeArc = end - start > 180 ? 1 : 0;

    const fovPath = `M ${sx} ${sy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return html`
      <svg
        class="sensor-overlay"
        width="${GRID_WIDTH + 4}"
        height="${GRID_HEIGHT + 4}"
        viewBox="-2 -2 ${GRID_WIDTH + 4} ${GRID_HEIGHT + 4}"
      >
        <defs>
          <clipPath id="grid-clip">
            <rect x="0" y="0" width="${GRID_WIDTH}" height="${GRID_HEIGHT}" />
          </clipPath>
        </defs>

        <path
          d="${fovPath}"
          fill="rgba(3, 169, 244, 0.08)"
          stroke="rgba(3, 169, 244, 0.3)"
          stroke-width="1.5"
          clip-path="url(#grid-clip)"
        />

        <circle
          cx="${sx}"
          cy="${sy + 2}"
          r="9"
          fill="var(--primary-color, #03a9f4)"
          stroke="#fff"
          stroke-width="2"
        />
        <circle cx="${sx}" cy="${sy + 2}" r="3" fill="#fff" />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "everything-presence-pro-panel": EverythingPresenceProPanel;
  }
}

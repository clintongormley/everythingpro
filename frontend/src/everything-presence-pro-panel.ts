import { LitElement, html, svg, css, PropertyValues, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

interface Target {
  x: number;
  y: number;
  raw_x: number;
  raw_y: number;
  speed: number;
  active: boolean;
  signal: number;  // 0-9 signal strength from tumbling window
}

interface ZoneConfig {
  name: string;
  color: string;
  type: "normal" | "entrance" | "thoroughfare" | "rest" | "custom";
  trigger?: number;  // 0-9 threshold, 0=disabled, higher=harder
  sustain?: number;  // 0-9 threshold, 0=disabled, higher=harder
  timeout?: number;  // seconds, if undefined use type default
}

const ZONE_TYPE_DEFAULTS: Record<string, { trigger: number; sustain: number; timeout: number }> = {
  normal: { trigger: 5, sustain: 3, timeout: 10 },
  entrance: { trigger: 3, sustain: 2, timeout: 5 },
  thoroughfare: { trigger: 3, sustain: 2, timeout: 3 },
  rest: { trigger: 7, sustain: 1, timeout: 30 },
};

interface EntryInfo {
  entry_id: string;
  title: string;
  room_name: string;
  has_perspective: boolean;
  has_layout: boolean;
}

interface WizardCorner {
  raw_x: number;
  raw_y: number;
  offset_side: number;
  offset_fb: number;
}

interface FurnitureItem {
  id: string;
  type: "icon" | "svg";
  icon: string;       // mdi icon name (type=icon) or svg key (type=svg)
  label: string;
  x: number;          // mm from left edge of room
  y: number;          // mm from top edge of room
  width: number;      // mm
  height: number;     // mm
  rotation: number;   // degrees
  lockAspect: boolean; // true for mdi icons, false for floor plan SVGs
}

interface FurnitureSticker {
  type: "icon" | "svg";
  icon: string;
  label: string;
  defaultWidth: number;  // mm
  defaultHeight: number; // mm
  lockAspect?: boolean;
}

// Top-down floor plan SVGs from frontend/images/
const FLOOR_PLAN_SVGS: Record<string, { viewBox: string; content: string }> = {
  "armchair": { viewBox: "0 0 256 256", content: `<rect x="16" y="16" width="224" height="224" rx="16" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="16" width="224" height="48" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="192" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="64" y="64" width="128" height="176" rx="8" stroke="black" stroke-width="8" fill="none"/>` },
  "bath": { viewBox: "0 0 600 300", content: `<rect x="50" y="50" width="500" height="200" rx="40" stroke="black" stroke-width="8" fill="none"/><path d="M 100 220 C 100 240, 500 240, 500 220" stroke="black" stroke-width="8" fill="none"/><rect x="70" y="70" width="30" height="20" stroke="black" stroke-width="8" fill="none"/><rect x="80" y="90" width="10" height="20" stroke="black" stroke-width="8" fill="none"/><circle cx="510" cy="150" r="10" stroke="black" stroke-width="8" fill="none"/>` },
  "bed-double": { viewBox: "0 0 512 512", content: `<rect x="0" y="0" width="512" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H480C497.673 32 512 46.3269 512 64V128C512 145.673 497.673 160 480 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="272" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="480" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="496" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="496" y2="368" stroke="#D0D0D0" stroke-width="8"/>` },
  "bed-single": { viewBox: "0 0 256 512", content: `<rect x="0" y="0" width="256" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H224C241.673 32 256 46.3269 256 64V128C256 145.673 241.673 160 224 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="192" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="224" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="240" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="240" y2="368" stroke="#D0D0D0" stroke-width="8"/>` },
  "door-left": { viewBox: "0 0 256 256", content: `<rect x="0" y="210" width="80" height="20" fill="black"/><rect x="60" y="60" width="20" height="150" fill="black"/><rect x="200" y="210" width="56" height="20" fill="black"/><path d="M 80 60 A 150 150 0 0 1 200 210" stroke="black" stroke-width="3" fill="none"/>` },
  "door-right": { viewBox: "0 0 256 256", content: `<rect x="176" y="210" width="80" height="20" fill="black"/><rect x="176" y="60" width="20" height="150" fill="black"/><rect x="0" y="210" width="56" height="20" fill="black"/><path d="M 176 60 A 150 150 0 0 0 56 210" stroke="black" stroke-width="3" fill="none"/>` },
  "floor-lamp": { viewBox: "0 0 256 256", content: `<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" stroke="black" stroke-width="8" fill="none"/><circle cx="128" cy="128" r="16" fill="black"/><line x1="128" y1="112" x2="128" y2="48" stroke="black" stroke-width="8"/><circle cx="128" cy="48" r="8" fill="black"/><path d="M 64 64 A 128 128 0 0 1 192 64" stroke="black" stroke-width="8" stroke-dasharray="8 8"/>` },
  "oven": { viewBox: "0 0 256 256", content: `<rect x="0" y="0" width="256" height="256" rx="16" stroke="black" stroke-width="16" fill="none"/><line x1="0" y1="224" x2="256" y2="224" stroke="black" stroke-width="16"/><circle cx="64" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="64" r="16" fill="black"/><circle cx="192" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="64" r="16" fill="black"/><circle cx="64" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="192" r="16" fill="black"/><circle cx="192" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="192" r="16" fill="black"/><rect x="32" y="240" width="192" height="16" rx="4" stroke="black" stroke-width="8" fill="black"/>` },
  "plant": { viewBox: "0 0 256 256", content: `<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" fill="none"/><g transform="translate(128 128)"><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(72)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(144)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(216)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(288)" fill="none" stroke="black" stroke-width="12"/></g>` },
  "shower": { viewBox: "0 0 256 256", content: `<path d="M 32 32 H 224 V 224 H 32 Z" stroke="black" stroke-width="16" fill="none"/><line x1="32" y1="32" x2="224" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><line x1="224" y1="32" x2="32" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><circle cx="128" cy="200" r="16" stroke="black" stroke-width="16" fill="none"/>` },
  "sofa-two-seater": { viewBox: "0 0 400 200", content: `<rect x="8" y="8" width="384" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="384" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="204" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>` },
  "sofa-three-seater": { viewBox: "0 0 560 200", content: `<rect x="8" y="8" width="544" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="544" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="200" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="376" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>` },
  "table-dining-room": { viewBox: "0 0 600 400", content: `<rect x="150" y="100" width="300" height="200" stroke="black" stroke-width="8" fill="none" rx="10"/><rect x="80" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="460" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/>` },
  "table-dining-room-round": { viewBox: "0 0 400 400", content: `<circle cx="200" cy="200" r="100" stroke="black" stroke-width="8" fill="none"/><rect x="150" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="150" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="30" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="310" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/>` },
  "television": { viewBox: "0 0 256 64", content: `<line x1="0" y1="56" x2="256" y2="56" stroke="black" stroke-width="16"/><rect x="32" y="16" width="192" height="40" rx="4" stroke="black" stroke-width="16" fill="none"/><rect x="40" y="24" width="176" height="24" rx="2" stroke="black" stroke-width="8" fill="none"/>` },
  "toilet": { viewBox: "0 0 300 400", content: `<rect x="75" y="30" width="150" height="80" rx="10" stroke="black" stroke-width="8" fill="none"/><path d="M 75 110 C 75 110, 50 160, 50 210 C 50 310, 125 360, 150 360 C 175 360, 250 310, 250 210 C 250 160, 225 110, 225 110 Z" stroke="black" stroke-width="8" fill="none"/><path d="M 100 150 C 100 150, 75 190, 75 220 C 75 300, 125 340, 150 340 C 175 340, 225 300, 225 220 C 225 190, 200 150, 200 150 Z" stroke="black" stroke-width="8" fill="none"/><circle cx="150" cy="70" r="15" stroke="black" stroke-width="8" fill="none"/>` },
};

type SetupStep = "guide" | "corners" | "preview";

const FURNITURE_CATALOG: FurnitureSticker[] = [
  // Floor plan SVGs (top-down, independently scalable)
  { type: "svg", icon: "armchair", label: "Armchair", defaultWidth: 800, defaultHeight: 800 },
  { type: "svg", icon: "bath", label: "Bath", defaultWidth: 1700, defaultHeight: 700 },
  { type: "svg", icon: "bed-double", label: "Double bed", defaultWidth: 1600, defaultHeight: 2000 },
  { type: "svg", icon: "bed-single", label: "Single bed", defaultWidth: 900, defaultHeight: 2000 },
  { type: "svg", icon: "door-left", label: "Door (left swing)", defaultWidth: 800, defaultHeight: 800 },
  { type: "svg", icon: "door-right", label: "Door (right swing)", defaultWidth: 800, defaultHeight: 800 },
  { type: "svg", icon: "table-dining-room", label: "Dining table", defaultWidth: 1600, defaultHeight: 900 },
  { type: "svg", icon: "table-dining-room-round", label: "Round table", defaultWidth: 1000, defaultHeight: 1000 },
  { type: "svg", icon: "floor-lamp", label: "Lamp", defaultWidth: 400, defaultHeight: 400 },
  { type: "svg", icon: "oven", label: "Oven / stove", defaultWidth: 600, defaultHeight: 600 },
  { type: "svg", icon: "plant", label: "Plant", defaultWidth: 400, defaultHeight: 400 },
  { type: "svg", icon: "shower", label: "Shower", defaultWidth: 900, defaultHeight: 900 },
  { type: "svg", icon: "sofa-two-seater", label: "Sofa (2 seat)", defaultWidth: 1600, defaultHeight: 800 },
  { type: "svg", icon: "sofa-three-seater", label: "Sofa (3 seat)", defaultWidth: 2400, defaultHeight: 800 },
  { type: "svg", icon: "television", label: "TV", defaultWidth: 1200, defaultHeight: 200 },
  { type: "svg", icon: "toilet", label: "Toilet", defaultWidth: 400, defaultHeight: 700 },
  // MDI icons (front-view, aspect-locked)
  { type: "icon", icon: "mdi:countertop", label: "Counter", defaultWidth: 2000, defaultHeight: 600, lockAspect: false },
  { type: "icon", icon: "mdi:cupboard", label: "Cupboard", defaultWidth: 1000, defaultHeight: 500, lockAspect: false },
  { type: "icon", icon: "mdi:desk", label: "Desk", defaultWidth: 1400, defaultHeight: 700, lockAspect: false },
  { type: "icon", icon: "mdi:fridge", label: "Fridge", defaultWidth: 700, defaultHeight: 700, lockAspect: true },
  { type: "icon", icon: "mdi:speaker", label: "Speaker", defaultWidth: 300, defaultHeight: 300, lockAspect: true },
  { type: "icon", icon: "mdi:window-open-variant", label: "Window", defaultWidth: 1000, defaultHeight: 150, lockAspect: false },
];

// Bit 0: room (0=outside, 1=inside)
// Bits 1-3: zone (0=room default, 1-7=named zone)
// Bits 4-7: per-cell training (reserved)
const CELL_ROOM_BIT = 0x01;
const CELL_ZONE_MASK = 0x0E;  // bits 1-3
const CELL_ZONE_SHIFT = 1;
const MAX_ZONES = 7;

const cellIsInside = (v: number): boolean => (v & CELL_ROOM_BIT) !== 0;
const cellZone = (v: number): number => (v >> CELL_ZONE_SHIFT) & 0x07;
const cellSetInside = (v: number, inside: boolean): number =>
  inside ? (v | CELL_ROOM_BIT) : (v & ~CELL_ROOM_BIT);
const cellSetZone = (v: number, zone: number): number =>
  (v & ~CELL_ZONE_MASK) | ((zone & 0x07) << CELL_ZONE_SHIFT);

const CORNER_LABELS = ["Front-left", "Front-right", "Back-right", "Back-left"];
const CORNER_OFFSET_LABELS: [string, string][] = [
  ["left wall", "front wall"],
  ["right wall", "front wall"],
  ["right wall", "back wall"],
  ["left wall", "back wall"],
];

const GRID_COLS = 20;
const GRID_ROWS = 20;
const GRID_CELL_COUNT = GRID_COLS * GRID_ROWS;
const GRID_CELL_MM = 300; // each cell represents 300mm x 300mm
const MAX_RANGE = 6000;

// Corner capture duration (seconds)
const CAPTURE_DURATION_S = 5;

// Target dot colors (1 per target, high contrast)
const TARGET_COLORS = ["#2196F3", "#FF5722", "#4CAF50"]; // blue, red-orange, green

// Color-blind-friendly palette (distinguishable across protanopia, deuteranopia, tritanopia)
const ZONE_COLORS = [
  "#E69F00", // orange
  "#56B4E9", // sky blue
  "#009E73", // bluish green
  "#F0E442", // yellow
  "#0072B2", // blue
  "#D55E00", // vermillion
  "#CC79A7", // reddish purple
];

export class EverythingPresenceProPanel extends LitElement {
  @property({ attribute: false }) hass: any;

  // Grid data: byte per cell using the encoding above
  @state() private _grid: Uint8Array = new Uint8Array(GRID_CELL_COUNT);
  @state() private _zoneConfigs: (ZoneConfig | null)[] = new Array(MAX_ZONES).fill(null);
  @state() private _activeZone: number | null = null; // null = none selected, 0 = boundary, 1-7 = named zones
  @state() private _roomType: ZoneConfig["type"] = "normal";
  @state() private _roomTrigger: number = ZONE_TYPE_DEFAULTS.normal.trigger;
  @state() private _roomSustain: number = ZONE_TYPE_DEFAULTS.normal.sustain;
  @state() private _roomTimeout: number = ZONE_TYPE_DEFAULTS.normal.timeout;
  @state() private _sidebarTab: "zones" | "furniture" | "live" = "zones";
  @state() private _expandedSensorInfo: string | null = null;
  @state() private _showLiveMenu = false;
  @state() private _showDeleteCalibrationDialog = false;
  @state() private _showCustomIconPicker = false;
  @state() private _customIconValue = "";
  @state() private _furniture: FurnitureItem[] = [];
  @state() private _selectedFurnitureId: string | null = null;
  private _dragState: {
    type: "move" | "resize" | "rotate";
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origRot: number;
    handle?: string;
    centerX?: number; // screen coords of item center (for rotate)
    centerY?: number;
    startAngle?: number; // angle at drag start
  } | null = null;
  @state() private _pendingRenames: { old_entity_id: string; new_entity_id: string }[] = [];
  @state() private _showRenameDialog = false;
  @state() private _targets: Target[] = [];
  @state() private _sensorState: {
    occupancy: boolean;
    static_presence: boolean;
    pir_motion: boolean;
    illuminance: number | null;
    temperature: number | null;
    humidity: number | null;
    co2: number | null;
  } = { occupancy: false, static_presence: false, pir_motion: false, illuminance: null, temperature: null, humidity: null, co2: null };
  @state() private _zoneState: { occupancy: Record<number, boolean>; target_counts: Record<number, number>; frame_count: number } = { occupancy: {}, target_counts: {}, frame_count: 0 };
  @state() private _showHitCounts = false;

  // Local zone occupancy state machine for live preview (with timeout)
  private _localZoneState: Map<number, { occupied: boolean; pendingSince: number | null }> = new Map();
  @state() private _isPainting = false;
  @state() private _paintAction: "set" | "clear" = "set";
  private _frozenBounds: { minCol: number; maxCol: number; minRow: number; maxRow: number } | null = null;
  @state() private _saving = false;
  @state() private _dirty = false;
  @state() private _showUnsavedDialog = false;
  private _pendingNavigation: (() => void) | null = null;
  @state() private _showTemplateSave = false;
  @state() private _showTemplateLoad = false;
  @state() private _templateName = "";

  // Multi-device support
  @state() private _entries: EntryInfo[] = [];
  @state() private _selectedEntryId = "";
  @state() private _loading = true;

  // Setup wizard — perspective corner marking
  @state() private _setupStep: SetupStep | null = null;
  @state() private _wizardSaving = false;
  @state() private _wizardCornerIndex = 0;
  @state() private _wizardCorners: (WizardCorner | null)[] = [null, null, null, null];
  @state() private _wizardRoomWidth = 0; // mm
  @state() private _wizardRoomDepth = 0; // mm
  @state() private _wizardCapturing = false;
  @state() private _wizardCaptureProgress = 0; // 0..1

  // View mode: live (default), editor (grid/zones), or settings (configuration)
  @state() private _view: "live" | "editor" | "settings" = "live";
  @state() private _openAccordions: Set<string> = new Set();


  // Perspective transform state (client-side, set after corner marking)
  @state() private _perspective: number[] | null = null;
  @state() private _roomWidth = 0; // mm
  @state() private _roomDepth = 0; // mm

  // Target subscription
  private _unsubTargets?: () => void;

  private _beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    if (this._dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  private _originalPushState: typeof history.pushState | null = null;
  private _originalReplaceState: typeof history.replaceState | null = null;

  private _interceptNavigation = (): boolean => {
    if (!this._dirty) return false;
    this._showUnsavedDialog = true;
    this._pendingNavigation = null; // no specific action — just allow navigation on discard
    return true;
  };

  private _dismissTooltips = () => {
    this.shadowRoot!.querySelectorAll('.setting-info-tooltip').forEach((t) => {
      (t as HTMLElement).style.display = 'none';
    });
  };

  connectedCallback(): void {
    super.connectedCallback();
    this._initialize();
    window.addEventListener("beforeunload", this._beforeUnloadHandler);
    window.addEventListener("click", this._dismissTooltips);

    // Intercept HA's client-side routing (pushState/replaceState)
    this._originalPushState = history.pushState.bind(history);
    this._originalReplaceState = history.replaceState.bind(history);
    const self = this;
    history.pushState = function (...args) {
      if (self._interceptNavigation()) {
        self._pendingNavigation = () => {
          self._originalPushState!(...args);
          window.dispatchEvent(new PopStateEvent("popstate"));
        };
        return;
      }
      self._originalPushState!(...args);
    };
    history.replaceState = function (...args) {
      if (self._interceptNavigation()) {
        self._pendingNavigation = () => {
          self._originalReplaceState!(...args);
          window.dispatchEvent(new PopStateEvent("popstate"));
        };
        return;
      }
      self._originalReplaceState!(...args);
    };
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribeTargets();
    window.removeEventListener("beforeunload", this._beforeUnloadHandler);
    window.removeEventListener("click", this._dismissTooltips);

    // Restore original history methods
    if (this._originalPushState) history.pushState = this._originalPushState;
    if (this._originalReplaceState) history.replaceState = this._originalReplaceState;
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
      // Sort alphabetically by title
      this._entries = (result as EntryInfo[]).sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    } catch {
      this._entries = [];
      return;
    }

    const stored = localStorage.getItem("epp_selected_entry");
    const match = stored && this._entries.find((e: EntryInfo) => e.entry_id === stored);
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
    // Load calibration / perspective first (needed for grid init)
    const cal = config.calibration;
    if (cal?.perspective && cal.room_width > 0) {
      this._perspective = cal.perspective;
      this._roomWidth = cal.room_width || 0;
      this._roomDepth = cal.room_depth || 0;
      this._setupStep = null;
    } else {
      this._perspective = null;
      this._roomWidth = 0;
      this._roomDepth = 0;
      // Don't auto-start wizard — render() will show the positioning guide
      this._setupStep = null;
    }

    // Load grid from saved layout bytes, or initialize from room dimensions
    const layout = config.room_layout || {};
    this._furniture = (layout.furniture || []).map((f: any, i: number) => ({
      id: f.id || `f_load_${i}`,
      type: f.type || "icon",
      icon: f.icon || "mdi:help",
      label: f.label || "Item",
      x: f.x ?? 0, y: f.y ?? 0,
      width: f.width ?? 600, height: f.height ?? 600,
      rotation: f.rotation ?? 0,
      lockAspect: f.lockAspect ?? (f.type !== "svg"),
    }));
    if (layout.grid_bytes && Array.isArray(layout.grid_bytes)) {
      this._grid = new Uint8Array(layout.grid_bytes);
    } else if (this._roomWidth > 0 && this._roomDepth > 0) {
      this._initGridFromRoom();
    } else {
      this._grid = new Uint8Array(GRID_CELL_COUNT);
    }

    // Load zone configs (stored inside room_layout as zone_slots or legacy zones)
    const slots = layout.zone_slots || layout.zones || [];
    this._zoneConfigs = Array.from({ length: MAX_ZONES }, (_, i) => {
      const z = slots[i];
      if (!z) return null;
      return {
        name: z.name || `Zone ${i + 1}`,
        color: z.color || ZONE_COLORS[i % ZONE_COLORS.length],
        type: z.type ?? "normal",
        trigger: z.trigger,
        sustain: z.sustain,
        timeout: z.timeout,
      };
    });

    this._roomType = layout.room_type ?? "normal";
    this._roomTrigger = layout.room_trigger ?? ZONE_TYPE_DEFAULTS[this._roomType]?.trigger ?? 5;
    this._roomSustain = layout.room_sustain ?? ZONE_TYPE_DEFAULTS[this._roomType]?.sustain ?? 3;
    this._roomTimeout = layout.room_timeout ?? ZONE_TYPE_DEFAULTS[this._roomType]?.timeout ?? 10;

    // Load reporting config and offsets
    (this as any)._reportingConfig = config.reporting || {};
    (this as any)._offsetsConfig = config.offsets || {};
  }

  private _subscribeTargets(entryId: string): void {
    this._unsubscribeTargets();
    if (!this.hass || !entryId) return;

    const conn = this.hass.connection;

    conn
      .subscribeMessage(
        (event: any) => {
          this._targets = (event.targets || []).map((t: any) => ({
            x: t.x,
            y: t.y,
            raw_x: t.raw_x ?? t.x,
            raw_y: t.raw_y ?? t.y,
            speed: 0,
            active: t.active,
            signal: t.signal ?? 0,
          }));
          if (event.sensors) {
            this._sensorState = {
              occupancy: event.sensors.occupancy ?? false,
              static_presence: event.sensors.static_presence ?? false,
              pir_motion: event.sensors.pir_motion ?? false,
              illuminance: event.sensors.illuminance ?? null,
              temperature: event.sensors.temperature ?? null,
              humidity: event.sensors.humidity ?? null,
              co2: event.sensors.co2 ?? null,
            };
          }
          if (event.zones) {
            this._zoneState = {
              occupancy: event.zones.occupancy ?? {},
              target_counts: event.zones.target_counts ?? {},
              frame_count: event.zones.frame_count ?? 0,
            };
          }
        },
        {
          type: "everything_presence_pro/subscribe_targets",
          entry_id: entryId,
        }
      )
      .then((unsub: () => void) => {
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

  // -- Grid cell painting --

  private _onCellMouseDown(index: number): void {
    // Furniture tab: deselect furniture on grid click, no painting
    if (this._sidebarTab === "furniture") {
      this._selectedFurnitureId = null;
      return;
    }
    if (this._activeZone === null) return;
    this._isPainting = true;
    this._frozenBounds = this._getRoomBounds();

    const cell = this._grid[index];
    if (this._activeZone === 0) {
      // Boundary: toggle inside/outside (only if already plain room)
      const isPlainRoom = cellIsInside(cell) && cellZone(cell) === 0;
      this._paintAction = isPlainRoom ? "clear" : "set";
    } else {
      // Named zone
      this._paintAction = cellZone(cell) === this._activeZone ? "clear" : "set";
    }

    this._applyPaintToCell(index);
  }

  private _onCellMouseEnter(index: number): void {
    if (this._isPainting) {
      this._applyPaintToCell(index);
    }
  }

  private _onCellMouseUp(): void {
    this._isPainting = false;
    this._frozenBounds = null;
  }

  private _applyPaintToCell(index: number): void {
    if (this._activeZone === null) return;
    const cell = this._grid[index];
    this._grid = new Uint8Array(this._grid);

    if (this._activeZone === 0) {
      // Boundary: set = plain inside room, clear = outside
      if (this._paintAction === "set") {
        this._grid[index] = CELL_ROOM_BIT;
      } else {
        this._grid[index] = 0;
      }
    } else {
      // Named zone painting — only on inside-room cells
      if (!cellIsInside(cell)) return;
      if (this._paintAction === "set") {
        this._grid[index] = cellSetZone(cell | CELL_ROOM_BIT, this._activeZone);
      } else {
        this._grid[index] = cellSetZone(cell, 0);
      }
    }
    this._dirty = true;

    // Update room dimensions when boundary changes
    if (this._activeZone === 0) {
      this._updateRoomDimensionsFromGrid();
    }

    this.requestUpdate();
  }

  private _updateRoomDimensionsFromGrid(): void {
    const raw = this._getRawRoomBounds();
    if (raw.minCol > raw.maxCol) {
      this._roomWidth = 0;
      this._roomDepth = 0;
      return;
    }
    this._roomWidth = (raw.maxCol - raw.minCol + 1) * GRID_CELL_MM;
    this._roomDepth = (raw.maxRow - raw.minRow + 1) * GRID_CELL_MM;
  }

  // -- Zone management --

  private _addZone(): void {
    const firstEmpty = this._zoneConfigs.findIndex((z) => z === null);
    if (firstEmpty === -1) return; // All 7 slots full

    // Pick first unused color
    const usedColors = new Set(
      this._zoneConfigs.filter((z): z is ZoneConfig => z !== null).map((z) => z.color)
    );
    const color = ZONE_COLORS.find((c) => !usedColors.has(c)) ??
      ZONE_COLORS[firstEmpty % ZONE_COLORS.length];
    const configs = [...this._zoneConfigs];
    configs[firstEmpty] = {
      name: `Zone ${firstEmpty + 1}`,
      color,
      type: "normal",
    };
    this._zoneConfigs = configs;
    this._activeZone = firstEmpty + 1; // 1-based slot number
    this._dirty = true;
  }

  private _removeZone(slot: number): void {
    if (slot < 1 || slot > MAX_ZONES || this._zoneConfigs[slot - 1] === null) return;
    // Clear all grid cells with this zone back to zone 0
    this._grid = new Uint8Array(this._grid);
    for (let i = 0; i < GRID_CELL_COUNT; i++) {
      if (cellZone(this._grid[i]) === slot) {
        this._grid[i] = cellSetZone(this._grid[i], 0);
      }
    }
    // No renumbering — just null out the slot
    const configs = [...this._zoneConfigs];
    configs[slot - 1] = null;
    this._zoneConfigs = configs;
    if (this._activeZone === slot) {
      this._activeZone = null;
    }
    this._dirty = true;
    this.requestUpdate();
  }

  // -- Furniture management --

  private _addFurniture(sticker: FurnitureSticker): void {
    const item: FurnitureItem = {
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: sticker.type,
      icon: sticker.icon,
      label: sticker.label,
      x: Math.max(0, (this._roomWidth - sticker.defaultWidth) / 2),
      y: Math.max(0, (this._roomDepth - sticker.defaultHeight) / 2),
      width: sticker.defaultWidth,
      height: sticker.defaultHeight,
      rotation: 0,
      lockAspect: sticker.lockAspect ?? (sticker.type === "icon"),
    };
    this._furniture = [...this._furniture, item];
    this._selectedFurnitureId = item.id;
    this._dirty = true;
  }

  private _addCustomFurniture(icon: string): void {
    this._addFurniture({ type: "icon", icon, label: "Custom", defaultWidth: 600, defaultHeight: 600, lockAspect: false });
  }

  private _removeFurniture(id: string): void {
    this._furniture = this._furniture.filter((f) => f.id !== id);
    if (this._selectedFurnitureId === id) this._selectedFurnitureId = null;
    this._dirty = true;
  }

  private _updateFurniture(id: string, updates: Partial<FurnitureItem>): void {
    this._furniture = this._furniture.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    this._dirty = true;
  }

  /** Convert mm in room-space to px in the visible grid */
  private _mmToPx(mm: number, cellPx: number): number {
    return (mm / GRID_CELL_MM) * (cellPx + 1); // +1 for gap
  }

  /** Convert px delta back to mm */
  private _pxToMm(px: number, cellPx: number): number {
    return (px / (cellPx + 1)) * GRID_CELL_MM;
  }

  private _onFurniturePointerDown(e: PointerEvent, id: string, type: "move" | "resize" | "rotate", handle?: string): void {
    e.preventDefault();
    e.stopPropagation();
    this._selectedFurnitureId = id;
    const item = this._furniture.find((f) => f.id === id);
    if (!item) return;

    // For rotate, find the item's center on screen
    let centerX = 0, centerY = 0, startAngle = 0;
    if (type === "rotate") {
      const el = this.shadowRoot?.querySelector(`.furniture-item[data-id="${id}"]`) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
        startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      }
    }

    this._dragState = {
      type,
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: item.x,
      origY: item.y,
      origW: item.width,
      origH: item.height,
      origRot: item.rotation,
      handle,
      centerX,
      centerY,
      startAngle,
    };

    const onMove = (ev: PointerEvent) => this._onFurnitureDrag(ev);
    const onUp = () => {
      this._dragState = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  private _onFurnitureDrag(e: PointerEvent): void {
    if (!this._dragState) return;
    const ds = this._dragState;

    // Get cellPx from the grid container
    const gridEl = this.shadowRoot?.querySelector(".grid") as HTMLElement | null;
    if (!gridEl) return;
    const cellPx = gridEl.firstElementChild
      ? (gridEl.firstElementChild as HTMLElement).offsetWidth
      : 28;

    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;

    if (ds.type === "move") {
      const item = this._furniture.find((f) => f.id === ds.id);
      const w = item?.width ?? 0;
      const h = item?.height ?? 0;
      this._updateFurniture(ds.id, {
        x: Math.max(-w / 2, Math.min(this._roomWidth - w / 2, ds.origX + this._pxToMm(dx, cellPx))),
        y: Math.max(-h / 2, Math.min(this._roomDepth - h / 2, ds.origY + this._pxToMm(dy, cellPx))),
      });
    } else if (ds.type === "resize" && ds.handle) {
      const dxMm = this._pxToMm(dx, cellPx);
      const dyMm = this._pxToMm(dy, cellPx);
      let { origX: x, origY: y, origW: w, origH: h } = ds;
      const item = this._furniture.find((f) => f.id === ds.id);
      const locked = item?.lockAspect ?? false;

      if (locked) {
        // Uniform scale from the dominant axis
        const delta = Math.abs(dxMm) > Math.abs(dyMm) ? dxMm : dyMm;
        const aspect = ds.origW / ds.origH;
        const sign = ds.handle.includes("w") || ds.handle.includes("n") ? -1 : 1;
        w = Math.max(100, ds.origW + sign * delta);
        h = Math.max(100, w / aspect);
        w = h * aspect;
        if (ds.handle.includes("w")) x = ds.origX + (ds.origW - w);
        if (ds.handle.includes("n")) y = ds.origY + (ds.origH - h);
      } else {
        if (ds.handle.includes("e")) w = Math.max(100, w + dxMm);
        if (ds.handle.includes("w")) { w = Math.max(100, w - dxMm); x = x + dxMm; }
        if (ds.handle.includes("s")) h = Math.max(100, h + dyMm);
        if (ds.handle.includes("n")) { h = Math.max(100, h - dyMm); y = y + dyMm; }
      }

      this._updateFurniture(ds.id, { x, y, width: w, height: h });
    } else if (ds.type === "rotate") {
      // Calculate angle from item center to current pointer
      const currentAngle = Math.atan2(
        e.clientY - (ds.centerY ?? 0),
        e.clientX - (ds.centerX ?? 0),
      ) * (180 / Math.PI);
      const deltaAngle = currentAngle - (ds.startAngle ?? 0);
      this._updateFurniture(ds.id, {
        rotation: Math.round((ds.origRot + deltaAngle + 360) % 360),
      });
    }
  }

  // -- Grid cell display helpers --

  private _getCellColor(index: number): string {
    const cell = this._grid[index];
    if (!cellIsInside(cell)) return "var(--secondary-background-color, #e0e0e0)";

    const zone = cellZone(cell);
    if (zone > 0 && zone <= MAX_ZONES) {
      const config = this._zoneConfigs[zone - 1];
      if (config) return config.color;
    }
    return "var(--card-background-color, #fff)"; // zone 0 = white
  }

  /** Compute the bounding box of inside-room cells (for zoom) */
  private _getRoomBounds(): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
    let minCol = GRID_COLS, maxCol = 0, minRow = GRID_ROWS, maxRow = 0;
    for (let i = 0; i < GRID_CELL_COUNT; i++) {
      if (cellIsInside(this._grid[i])) {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        if (col < minCol) minCol = col;
        if (col > maxCol) maxCol = col;
        if (row < minRow) minRow = row;
        if (row > maxRow) maxRow = row;
      }
    }
    // Add 1-cell padding
    return {
      minCol: Math.max(0, minCol - 1),
      maxCol: Math.min(GRID_COLS - 1, maxCol + 1),
      minRow: Math.max(0, minRow - 1),
      maxRow: Math.min(GRID_ROWS - 1, maxRow + 1),
    };
  }

  /** Save the current grid and zone config to the backend */
  private async _applyLayout(): Promise<void> {
    this._saving = true;
    try {
      const result = await this.hass.callWS({
        type: "everything_presence_pro/set_room_layout",
        entry_id: this._selectedEntryId,
        grid_bytes: Array.from(this._grid),
        room_type: this._roomType,
        room_trigger: this._roomTrigger,
        room_sustain: this._roomSustain,
        room_timeout: this._roomTimeout,
        zone_slots: this._zoneConfigs.map((z) =>
          z !== null ? { name: z.name, color: z.color, type: z.type, trigger: z.trigger, sustain: z.sustain, timeout: z.timeout } : null
        ),
        furniture: this._furniture.map((f) => ({
          type: f.type, icon: f.icon, label: f.label,
          x: f.x, y: f.y, width: f.width, height: f.height,
          rotation: f.rotation, lockAspect: f.lockAspect,
        })),
      });
      this._dirty = false;
      this._view = "live";

      // Show rename dialog if backend detected entity_id mismatches
      const renames = result?.entity_id_renames || [];
      if (renames.length > 0) {
        this._pendingRenames = renames;
        this._showRenameDialog = true;
      }
    } finally {
      this._saving = false;
    }
  }

  private async _saveSettings(): Promise<void> {
    this._saving = true;
    try {
      // Collect reporting toggle states
      const container = this.shadowRoot!.querySelector(".settings-container");
      if (!container) return;
      const reporting: Record<string, boolean> = {};
      container.querySelectorAll<HTMLInputElement>("[data-report-key]").forEach((el) => {
        reporting[el.dataset.reportKey!] = el.checked;
      });

      // Collect offset values
      const offsets: Record<string, number> = {};
      container.querySelectorAll<HTMLInputElement>("[data-offset-key]").forEach((el) => {
        offsets[el.dataset.offsetKey!] = parseFloat(el.value);
      });

      await this.hass.callWS({
        type: "everything_presence_pro/set_reporting",
        entry_id: this._selectedEntryId,
        reporting,
        offsets,
      });

      (this as any)._reportingConfig = reporting;
      (this as any)._offsetsConfig = offsets;
      this._dirty = false;
      this._view = "live";
    } finally {
      this._saving = false;
    }
  }

  // -- Entity rename --

  private async _applyRenames(): Promise<void> {
    if (!this._pendingRenames.length) return;
    try {
      const result = await this.hass.callWS({
        type: "everything_presence_pro/rename_zone_entities",
        entry_id: this._selectedEntryId,
        renames: this._pendingRenames,
      });
      if (result.errors?.length) {
        console.warn("Entity rename errors:", result.errors);
      }
    } finally {
      this._showRenameDialog = false;
      this._pendingRenames = [];
    }
  }

  private _dismissRenameDialog(): void {
    this._showRenameDialog = false;
    this._pendingRenames = [];
  }

  // -- Template management (localStorage) --

  private _getTemplates(): { name: string; grid: number[]; zones: (ZoneConfig | null)[]; roomWidth: number; roomDepth: number; furniture?: FurnitureItem[] }[] {
    try {
      return JSON.parse(localStorage.getItem("epp_layout_templates") || "[]");
    } catch {
      return [];
    }
  }

  private _saveTemplate(): void {
    const name = this._templateName.trim();
    if (!name) return;
    const templates = this._getTemplates();
    // Overwrite if same name exists
    const existing = templates.findIndex((t) => t.name === name);
    const entry = {
      name,
      grid: Array.from(this._grid),
      zones: this._zoneConfigs.map((z) => z !== null ? { ...z } : null),
      roomWidth: this._roomWidth,
      roomDepth: this._roomDepth,
      furniture: this._furniture.map((f) => ({ ...f })),
    };
    if (existing >= 0) {
      templates[existing] = entry;
    } else {
      templates.push(entry);
    }
    localStorage.setItem("epp_layout_templates", JSON.stringify(templates));
    this._showTemplateSave = false;
    this._templateName = "";
  }

  private _loadTemplate(name: string): void {
    const templates = this._getTemplates();
    const tmpl = templates.find((t) => t.name === name);
    if (!tmpl) return;
    this._grid = new Uint8Array(tmpl.grid);
    // Pad to 7 slots for backwards compat with old packed templates
    const zones = tmpl.zones || [];
    this._zoneConfigs = Array.from({ length: MAX_ZONES }, (_, i) => zones[i] ?? null);
    this._roomWidth = tmpl.roomWidth;
    this._roomDepth = tmpl.roomDepth;
    this._furniture = (tmpl.furniture || []).map((f: any) => ({ ...f }));
    this._showTemplateLoad = false;
  }

  private _deleteTemplate(name: string): void {
    const templates = this._getTemplates().filter((t) => t.name !== name);
    localStorage.setItem("epp_layout_templates", JSON.stringify(templates));
    this.requestUpdate();
  }

  /** Initialize grid from room dimensions after wizard finishes */
  private _initGridFromRoom(): void {
    const grid = new Uint8Array(GRID_CELL_COUNT);

    // Sensor is centered at top of the grid
    // Grid origin (0,0) is top-left, room origin (0,0) is also top-left (sensor side)
    // Room width centered horizontally in 20-col grid
    const roomCols = Math.ceil(this._roomWidth / GRID_CELL_MM);
    const roomRows = Math.ceil(this._roomDepth / GRID_CELL_MM);
    const startCol = Math.floor((GRID_COLS - roomCols) / 2);
    const startRow = 0; // sensor is at front wall

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const idx = r * GRID_COLS + c;
        // Is this cell within the room rectangle?
        const inRoom =
          c >= startCol && c < startCol + roomCols &&
          r >= startRow && r < startRow + roomRows;

        if (inRoom) {
          grid[idx] = CELL_ROOM_BIT; // inside room, zone 0
        }
        // Otherwise stays 0 (outside room)
      }
    }

    this._grid = grid;
  }

  // -- Coordinate mapping (perspective transform) --

  /**
   */
  /**
   * Map a target to percentage coordinates for the editor grid.
   * Uses the backend's already-transformed x/y (perspective applied server-side).
   */
  private _mapTargetToPercent(
    target: Target,
  ): { x: number; y: number } {
    if (this._roomWidth > 0 && this._roomDepth > 0) {
      const rx = Math.max(0, Math.min(target.x, this._roomWidth));
      const ry = Math.max(0, Math.min(target.y, this._roomDepth));
      return {
        x: (rx / this._roomWidth) * 100,
        y: (ry / this._roomDepth) * 100,
      };
    }
    return {
      x: (target.x / MAX_RANGE) * 100,
      y: (target.y / MAX_RANGE) * 100,
    };
  }

  /** Compute room dimensions and furthest point from sensor based on grid */
  private _getGridRoomMetrics(): { widthM: string; depthM: string; furthestM: string } | null {
    const raw = this._getRawRoomBounds();
    if (raw.minCol > raw.maxCol) return null;

    const widthCells = raw.maxCol - raw.minCol + 1;
    const depthCells = raw.maxRow - raw.minRow + 1;
    const widthMm = widthCells * GRID_CELL_MM;
    const depthMm = depthCells * GRID_CELL_MM;

    // Sensor is centered at top of room (row 0, center of room columns)
    const sensorCol = (raw.minCol + raw.maxCol) / 2;
    const sensorRow = raw.minRow;

    // Find furthest inside cell from sensor
    let maxDistSq = 0;
    for (let i = 0; i < GRID_CELL_COUNT; i++) {
      if (!cellIsInside(this._grid[i])) continue;
      const col = (i % GRID_COLS) + 0.5; // cell center
      const row = Math.floor(i / GRID_COLS) + 0.5;
      const dx = (col - sensorCol) * GRID_CELL_MM;
      const dy = (row - sensorRow) * GRID_CELL_MM;
      const distSq = dx * dx + dy * dy;
      if (distSq > maxDistSq) maxDistSq = distSq;
    }

    return {
      widthM: (widthMm / 1000).toFixed(1),
      depthM: (depthMm / 1000).toFixed(1),
      furthestM: (Math.sqrt(maxDistSq) / 1000).toFixed(1),
    };
  }

  /** Get raw room bounds without padding (only actual inside cells) */
  private _getRawRoomBounds(): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
    let minCol = GRID_COLS, maxCol = 0, minRow = GRID_ROWS, maxRow = 0;
    for (let i = 0; i < GRID_CELL_COUNT; i++) {
      if (cellIsInside(this._grid[i])) {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        if (col < minCol) minCol = col;
        if (col > maxCol) maxCol = col;
        if (row < minRow) minRow = row;
        if (row > maxRow) maxRow = row;
      }
    }
    return { minCol, maxCol, minRow, maxRow };
  }

  /** Map a target to a fractional grid cell position (col, row) */
  private _mapTargetToGridCell(
    target: Target,
  ): { col: number; row: number } | null {
    if (this._roomWidth <= 0 || this._roomDepth <= 0) return null;

    // Room is centered horizontally in the grid
    const roomCols = Math.ceil(this._roomWidth / GRID_CELL_MM);
    const startCol = Math.floor((GRID_COLS - roomCols) / 2);

    // Use actual inside-cell bounds for clamping (no padding)
    const raw = this._getRawRoomBounds();
    const minMmX = (raw.minCol - startCol) * GRID_CELL_MM;
    const maxMmX = (raw.maxCol - startCol + 1) * GRID_CELL_MM;
    const maxMmY = (raw.maxRow + 1) * GRID_CELL_MM;

    // target.x/y are room-space mm (perspective applied server-side)
    const rx = Math.max(minMmX, Math.min(target.x, maxMmX));
    const ry = Math.max(0, Math.min(target.y, maxMmY));

    const col = startCol + (rx / GRID_CELL_MM);
    const row = ry / GRID_CELL_MM;

    return { col, row };
  }

  // -- Device selector --

  /** Guard navigation when dirty — shows dialog and queues the action */
  private _guardNavigation(action: () => void): void {
    if (this._dirty) {
      this._pendingNavigation = action;
      this._showUnsavedDialog = true;
    } else {
      action();
    }
  }

  private _discardAndNavigate(): void {
    this._dirty = false;
    this._showUnsavedDialog = false;
    if (this._pendingNavigation) {
      this._pendingNavigation();
      this._pendingNavigation = null;
    }
  }

  private async _onDeviceChange(e: Event): Promise<void> {
    const select = e.target as HTMLSelectElement;
    const entryId = select.value;
    this._guardNavigation(async () => {
      this._unsubscribeTargets();
      this._selectedEntryId = entryId;
      localStorage.setItem("epp_selected_entry", entryId);
      await this._loadEntryConfig(entryId);
    });
  }

  // -- Setup wizard: perspective corner marking --

  // Local 1s rolling median smoother for raw readings during marking
  private _smoothBuffer: { x: number; y: number; t: number }[] = [];

  private _getSmoothedRaw(): { x: number; y: number } | null {
    const active = this._targets.find((t) => t.active);
    if (!active) return null;

    const now = Date.now();
    this._smoothBuffer.push({ x: active.raw_x, y: active.raw_y, t: now });

    // Prune readings older than 1 second
    while (this._smoothBuffer.length > 0 && now - this._smoothBuffer[0].t > 1000) {
      this._smoothBuffer.shift();
    }

    if (this._smoothBuffer.length === 0) return { x: active.raw_x, y: active.raw_y };

    const medianOf = (arr: number[]): number => {
      const sorted = arr.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    return {
      x: medianOf(this._smoothBuffer.map((s) => s.x)),
      y: medianOf(this._smoothBuffer.map((s) => s.y)),
    };
  }

  private _wizardStartCapture(): void {
    const active = this._targets.find((t) => t.active);
    if (!active) return;

    this._wizardCapturing = true;
    this._wizardCaptureProgress = 0;

    const samples: { x: number; y: number }[] = [];
    const startTime = Date.now();
    const duration = CAPTURE_DURATION_S * 1000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      this._wizardCaptureProgress = Math.min(elapsed / duration, 1);

      // Collect sample from first active target
      const t = this._targets.find((t) => t.active);
      if (t) samples.push({ x: t.raw_x, y: t.raw_y });

      if (elapsed < duration) {
        requestAnimationFrame(tick);
        return;
      }

      // Done — compute median position
      this._wizardCapturing = false;
      if (samples.length === 0) return;

      const sortedX = samples.map((s) => s.x).sort((a, b) => a - b);
      const sortedY = samples.map((s) => s.y).sort((a, b) => a - b);
      const mid = Math.floor(samples.length / 2);
      const medianX = samples.length % 2 ? sortedX[mid] : (sortedX[mid - 1] + sortedX[mid]) / 2;
      const medianY = samples.length % 2 ? sortedY[mid] : (sortedY[mid - 1] + sortedY[mid]) / 2;

      const idx = this._wizardCornerIndex;
      this._wizardCorners = [...this._wizardCorners];
      this._wizardCorners[idx] = {
        raw_x: medianX,
        raw_y: medianY,
        offset_side: 0,
        offset_fb: 0,
      };

      // Advance to next unmarked corner
      if (idx < 3) {
        this._wizardCornerIndex = idx + 1;
      }

      // If all 4 corners marked, compute dimensions and save immediately
      if (this._wizardCorners.every((c) => c !== null)) {
        this._autoComputeRoomDimensions();
        this._computeWizardPerspective();
        this._wizardFinish();
      }
    };

    requestAnimationFrame(tick);
  }

  private _autoComputeRoomDimensions(): void {
    const corners = this._wizardCorners as WizardCorner[];
    const dist = (a: WizardCorner, b: WizardCorner): number =>
      Math.sqrt((a.raw_x - b.raw_x) ** 2 + (a.raw_y - b.raw_y) ** 2);
    this._wizardRoomWidth = Math.round(dist(corners[0], corners[1]));
    const depthLeft = dist(corners[0], corners[3]);
    const depthRight = dist(corners[1], corners[2]);
    this._wizardRoomDepth = Math.round((depthLeft + depthRight) / 2);
  }

  private _solvePerspective(
    src: { x: number; y: number }[],
    dst: { x: number; y: number }[],
  ): number[] | null {
    // Build 8x8 system from 4 point pairs
    const A: number[][] = [];
    const b: number[] = [];
    for (let i = 0; i < 4; i++) {
      const sx = src[i].x, sy = src[i].y;
      const rx = dst[i].x, ry = dst[i].y;
      A.push([sx, sy, 1, 0, 0, 0, -sx * rx, -sy * rx]);
      b.push(rx);
      A.push([0, 0, 0, sx, sy, 1, -sx * ry, -sy * ry]);
      b.push(ry);
    }
    // Gaussian elimination with partial pivoting
    const n = 8;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      let maxVal = Math.abs(M[col][col]), maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(M[row][col]) > maxVal) {
          maxVal = Math.abs(M[row][col]);
          maxRow = row;
        }
      }
      if (maxVal < 1e-12) return null; // singular
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
      for (let row = col + 1; row < n; row++) {
        const factor = M[row][col] / M[col][col];
        for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
      }
    }
    // Back-substitution
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = M[i][n];
      for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
      x[i] /= M[i][i];
    }
    return x;
  }

  private _computeWizardPerspective(): void {
    const corners = this._wizardCorners as WizardCorner[];
    if (!corners.every((c) => c !== null)) return;

    const w = this._wizardRoomWidth;
    const d = this._wizardRoomDepth;

    const sensorPts = corners.map((c) => ({ x: c.raw_x, y: c.raw_y }));
    const roomPts = [
      { x: corners[0].offset_side, y: corners[0].offset_fb },
      { x: w - corners[1].offset_side, y: corners[1].offset_fb },
      { x: w - corners[2].offset_side, y: d - corners[2].offset_fb },
      { x: corners[3].offset_side, y: d - corners[3].offset_fb },
    ];

    this._perspective = this._solvePerspective(sensorPts, roomPts);
    this._roomWidth = w;
    this._roomDepth = d;
  }

  private async _wizardFinish(): Promise<void> {
    if (!this._perspective) return;

    this._wizardSaving = true;
    try {
      await this.hass.callWS({
        type: "everything_presence_pro/set_setup",
        entry_id: this._selectedEntryId,
        perspective: this._perspective,
        room_width: this._wizardRoomWidth,
        room_depth: this._wizardRoomDepth,
      });
      this._roomWidth = this._wizardRoomWidth;
      this._roomDepth = this._wizardRoomDepth;
      this._initGridFromRoom();
      this._setupStep = null;
      this._view = "live";
    } finally {
      this._wizardSaving = false;
    }
  }

  // -- Wizard mini-grid helpers --

  // FOV geometry constants (120° wedge)
  private static readonly FOV_HALF_ANGLE = Math.PI / 3; // 60°
  private static readonly FOV_X_EXTENT = MAX_RANGE * Math.sin(Math.PI / 3); // ~5196

  /** Map raw sensor coords to percentage in the FOV view (marking step) */
  private _rawToFovPct(rawX: number, rawY: number): { xPct: number; yPct: number } {
    const halfW = EverythingPresenceProPanel.FOV_X_EXTENT;
    return {
      xPct: ((rawX + halfW) / (halfW * 2)) * 100,
      yPct: (rawY / MAX_RANGE) * 100,
    };
  }

  private _getWizardTargetStyle(target: Target): string {
    const { xPct, yPct } = this._rawToFovPct(target.raw_x, target.raw_y);
    return `left: ${xPct}%; top: ${yPct}%;`;
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

    .panel {
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
      font-size: 14px;
    }

    .mode-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
    }

    .mode-tab {
      padding: 8px 18px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .mode-tab:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .mode-tab.active {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border-color: var(--primary-color, #03a9f4);
    }

    .mode-tab.apply-btn {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border-color: var(--primary-color, #03a9f4);
    }

    .mode-tab.apply-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .editor-layout {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    .grid-container {
      position: relative;
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
    }

    .grid {
      display: grid;
      gap: 1px;
      background: var(--divider-color, #e0e0e0);
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      user-select: none;
    }

    .cell {
      cursor: pointer;
      transition: opacity 0.1s;
    }

    .cell:hover {
      opacity: 0.75;
    }

    .overlay-help {
      font-size: 13px;
      color: var(--secondary-text-color, #757575);
      margin: 0;
    }

    .zone-name-input {
      flex: 1;
      border: none;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      background: transparent;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      padding: 2px 4px;
      min-width: 0;
    }

    .zone-name-input:focus {
      outline: none;
      border-bottom: 1px solid var(--primary-color, #03a9f4);
    }

    .template-dialog {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .template-dialog-card {
      background: var(--card-background-color, #fff);
      border-radius: 16px;
      padding: 24px;
      min-width: 320px;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    }

    .template-dialog-card h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .template-name-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      font-size: 15px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .template-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .template-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
    }

    .template-item-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .template-item-size {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
    }

    .template-item-btn {
      padding: 4px 12px;
      font-size: 13px;
    }

    .sensitivity-select {
      padding: 2px 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      font-size: 12px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      flex-shrink: 0;
    }

    /* Furniture overlay */
    .furniture-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 15;
    }

    .furniture-overlay.non-interactive {
      pointer-events: none !important;
    }

    .furniture-overlay.non-interactive .furniture-item {
      pointer-events: none !important;
      opacity: 0.6;
    }

    .furniture-item {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      background: transparent;
      pointer-events: auto;
      cursor: grab;
      transform-origin: center center;
      user-select: none;
    }

    .furniture-item:hover {
      border-color: var(--primary-color, #03a9f4);
    }

    .furniture-item.selected {
      border: 2px solid var(--primary-color, #03a9f4);
      box-shadow: 0 0 8px rgba(3, 169, 244, 0.4);
      z-index: 10;
    }

    .furniture-item ha-icon {
      color: rgba(0, 0, 0, 0.6);
      pointer-events: none;
    }

    .furn-svg {
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .furn-sticker-svg {
      width: 28px;
      height: 28px;
    }

    .furn-handle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--primary-color, #03a9f4);
      border: 1px solid #fff;
      border-radius: 2px;
      pointer-events: auto;
      z-index: 2;
    }

    .furn-handle-n { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
    .furn-handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
    .furn-handle-e { right: -4px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
    .furn-handle-w { left: -4px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
    .furn-handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
    .furn-handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
    .furn-handle-se { bottom: -4px; right: -4px; cursor: se-resize; }
    .furn-handle-sw { bottom: -4px; left: -4px; cursor: sw-resize; }

    .furn-rotate-stem {
      position: absolute;
      top: -32px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 32px;
      background: var(--primary-color, #03a9f4);
      pointer-events: none;
    }

    .furn-rotate-handle {
      position: absolute;
      top: -48px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 20px;
      background: var(--primary-color, #03a9f4);
      border: 2px solid #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      pointer-events: auto;
      color: #fff;
    }

    .furn-delete-btn {
      position: absolute;
      top: -24px;
      right: -4px;
      width: 20px;
      height: 20px;
      background: var(--error-color, #f44336);
      border: 1px solid #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      pointer-events: auto;
      color: #fff;
    }

    /* Furniture sidebar */
    .furn-selected-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      border: 2px solid var(--primary-color, #03a9f4);
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .furn-dims {
      display: flex;
      gap: 6px;
    }

    .furn-dims label {
      flex: 1;
      font-size: 11px;
      color: var(--secondary-text-color, #757575);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .furn-dims input {
      width: 100%;
      padding: 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      font-size: 12px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .furn-catalog {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    .furn-sticker {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      cursor: pointer;
      font-size: 11px;
      color: var(--primary-text-color, #212121);
      text-align: center;
      transition: background 0.15s;
    }

    .furn-sticker:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .furn-sticker span {
      line-height: 1.2;
    }

    .furn-icon-picker {
      margin-top: 8px;
    }

    .furn-icon-input-row {
      display: flex;
      gap: 6px;
    }

    .furn-icon-input {
      flex: 1;
      padding: 6px 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 6px;
      font-size: 13px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .zone-color-picker {
      width: 24px;
      height: 24px;
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .targets-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 20;
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
      max-height: 70vh;
      background: var(--card-background-color, #fff);
      border-left: 1px solid var(--divider-color, #e0e0e0);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
    }

    .sidebar-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
    }

    .sidebar-tab {
      flex: 1;
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
    }

    .sidebar-tab.active {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border-color: var(--primary-color, #03a9f4);
    }

    .zone-sidebar h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .zone-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid var(--divider-color, #e0e0e0);
      transition: border-color 0.2s;
    }

    .zone-item:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .zone-item.active {
      border-color: var(--primary-color, #03a9f4);
    }

    .zone-item-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .zone-settings-row {
      padding-left: 24px;
      gap: 6px;
    }

    .zone-separator {
      border: none;
      border-top: 1px solid var(--divider-color, #e0e0e0);
      margin: 4px 0;
      flex-shrink: 0;
    }

    .zone-scroll-area {
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    .zone-setting-label {
      font-size: 11px;
      color: var(--secondary-text-color, #757575);
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


    .wizard-actions {
      display: flex;
      justify-content: space-between;
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

    .sensor-fov-view {
      width: 480px;
      aspect-ratio: 1.732 / 1;
      background: #1a1a2e;
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .sensor-fov-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .preview-grid-container {
      display: flex;
      justify-content: center;
      position: relative;
    }

    .preview-grid-wrapper {
      position: relative;
    }

    .preview-grid {
      display: grid;
      gap: 1px;
      width: 100%;
      height: 100%;
      background: var(--divider-color, #e0e0e0);
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
    }

    .preview-cell {
      background: var(--card-background-color, #fff);
    }

    .no-target-warning {
      color: var(--error-color, #f44336);
      font-size: 13px;
      text-align: center;
    }

    .corner-progress {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .corner-chip {
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 13px;
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      transition: background 0.2s;
    }

    .corner-chip.active {
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .corner-chip.done {
      background: #4caf50;
      color: #fff;
    }

    .corner-arrow {
      font-size: 18px;
      color: var(--disabled-text-color, #ccc);
      font-weight: bold;
    }

    .corner-arrow.done {
      color: var(--primary-color, #03a9f4);
    }

    .corner-instruction {
      font-size: 15px;
      color: var(--primary-text-color, #212121);
    }

    .corner-offsets {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .offset-label {
      font-size: 13px;
      color: var(--secondary-text-color, #888);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .capture-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .capture-overlay-content {
      background: var(--card-background-color, #fff);
      padding: 24px 32px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .offset-input {
      flex: 1;
      width: 100%;
      padding: 14px 12px 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      font-size: 16px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .offset-input::placeholder {
      color: var(--secondary-text-color, #888);
      font-size: 13px;
    }

    .offset-input:focus {
      outline: none;
      border-color: var(--primary-color, #03a9f4);
    }

    .dimension-inputs {
      display: flex;
      gap: 16px;
    }

    .dimension-inputs label {
      flex: 1;
    }

    .dimension-inputs input {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .capture-progress {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .capture-bar {
      flex: 1;
      height: 8px;
      background: var(--secondary-background-color, #e0e0e0);
      border-radius: 4px;
      overflow: hidden;
    }

    .capture-fill {
      height: 100%;
      background: var(--primary-color, #03a9f4);
      border-radius: 4px;
      transition: width 0.1s linear;
    }

    .capture-progress span {
      font-size: 13px;
      color: var(--secondary-text-color, #757575);
      white-space: nowrap;
    }

    /* Live sidebar */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 4px 4px 12px;
    }

    .sidebar-title {
      font-size: 15px;
      font-weight: 600;
      padding: 10px 12px 8px;
      color: var(--primary-text-color, #212121);
    }

    .sidebar-header .sidebar-title {
      padding: 0;
    }

    .sidebar-menu-wrapper {
      position: relative;
    }

    .sidebar-menu-btn {
      background: none;
      border: none;
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
    }

    .sidebar-menu-btn:hover {
      background: var(--secondary-background-color, #f0f0f0);
    }

    .sidebar-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      z-index: 100;
      min-width: 220px;
      padding: 4px 0;
    }

    .sidebar-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 14px;
      border: none;
      background: none;
      color: var(--primary-text-color, #212121);
      font-size: 13px;
      cursor: pointer;
      text-align: left;
    }

    .sidebar-menu-item:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .save-cancel-bar {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-top: 1px solid var(--divider-color, #eee);
      margin-top: auto;
    }

    .live-section-link {
      cursor: pointer;
      background: none;
      border: none;
      color: var(--primary-color, #03a9f4);
    }

    .live-section-link:hover {
      text-decoration: underline;
    }

    .live-section-header {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text-color, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 12px 6px;
    }

    .live-sensor-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      font-size: 13px;
    }

    .live-sensor-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .live-sensor-dot.on {
      background: #4CAF50;
    }

    .live-sensor-dot.off {
      background: var(--disabled-text-color, #bbb);
    }

    .live-sensor-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .live-sensor-state {
      font-size: 12px;
      color: var(--secondary-text-color, #888);
      flex-shrink: 0;
    }

    .live-sensor-state.detected {
      color: #4CAF50;
      font-weight: 500;
    }

    .live-sensor-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      margin-left: auto;
    }

    .live-sensor-info-btn {
      background: none;
      border: none;
      color: var(--secondary-text-color, #aaa);
      cursor: pointer;
      padding: 2px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .live-sensor-info-btn:hover {
      color: var(--primary-color, #03a9f4);
    }

    .live-sensor-info-text {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      padding: 2px 12px 8px 30px;
      line-height: 1.4;
    }

    .live-nav-links {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px 12px 8px;
      margin-top: 8px;
      border-top: 1px solid var(--divider-color, #eee);
    }

    .live-nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: var(--primary-color, #03a9f4);
      cursor: pointer;
      padding: 6px 4px;
      font-size: 13px;
      border-radius: 6px;
      text-align: left;
    }

    .live-nav-link:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    /* Settings view */
    .grid-dimensions {
      text-align: center;
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      margin-top: 8px;
    }

    .settings-container {
      width: 560px;
      max-width: 100%;
      margin: 0 auto;
      padding: 0 16px;
      box-sizing: border-box;
    }

    .accordion {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      margin-bottom: 12px;
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
      border-radius: 12px;
      width: 100%;
      text-align: left;
      font-size: 15px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .accordion-header[data-open] {
      border-radius: 12px 12px 0 0;
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

    .setting-group {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
    }

    .setting-group h4 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-text-color, #212121);
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      padding: 8px 0;
      gap: 4px;
      border-bottom: 1px solid var(--divider-color, #f0f0f0);
    }

    .setting-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .setting-row label:not(.toggle-switch) {
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      flex: 1;
      min-width: 120px;
    }

    .setting-info {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .setting-info ha-icon {
      --mdc-icon-size: 18px;
      color: var(--primary-text-color, #212121);
      cursor: default;
    }

    .setting-info .setting-info-tooltip {
      display: none;
      position: fixed;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      color: var(--primary-text-color, #212121);
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      white-space: normal;
      width: 240px;
      z-index: 9999;
      line-height: 1.4;
      pointer-events: none;
    }

    .setting-value {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
      font-weight: 500;
      display: inline-block;
      width: 36px;
      text-align: right;
      flex-shrink: 0;
    }

    .setting-unit {
      display: inline-block;
      width: 24px;
      font-size: 13px;
      color: var(--secondary-text-color, #757575);
      flex-shrink: 0;
    }

    .setting-input {
      width: 80px;
      padding: 6px 8px;
      font-size: 13px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--secondary-background-color, #f5f5f5);
      color: var(--primary-text-color, #212121);
      text-align: right;
    }

    .setting-input-unit {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--secondary-text-color, #757575);
      flex: 1;
      min-width: 0;
      justify-content: flex-end;
    }

    select.setting-input {
      flex: 1;
      width: auto;
      text-align: left;
    }

    .setting-range {
      flex: 1;
      min-width: 80px;
      accent-color: var(--primary-color, #03a9f4);
    }

    .setting-toggle {
      width: 18px;
      height: 18px;
      accent-color: var(--primary-color, #03a9f4);
      cursor: pointer;
    }

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

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 40px;
      min-width: 40px;
      max-width: 40px;
      height: 22px;
      flex: 0 0 40px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: var(--divider-color, #ccc);
      border-radius: 22px;
      transition: background-color 0.2s;
    }

    .toggle-slider::before {
      content: "";
      position: absolute;
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background-color: var(--primary-color, #03a9f4);
    }

    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(18px);
    }
  `;

  // -- Render methods --

  render() {
    if (this._loading) {
      return html`<div class="loading-container">Loading...</div>`;
    }

    if (!this._entries.length) {
      return html`<div class="loading-container">Loading...</div>`;
    }

    if (this._setupStep !== null) {
      return this._renderWizard();
    }

    if (this._view === "settings") {
      return this._renderSettings();
    }

    if (this._view === "editor" && this._perspective) {
      return this._renderEditor();
    }

    return html`
      ${this._renderLiveOverview()}
      ${this._showDeleteCalibrationDialog ? html`
        <div class="template-dialog">
          <div class="template-dialog-card">
            <h3>Delete room calibration?</h3>
            <p class="overlay-help">This will also delete all detection zones and furniture. This cannot be undone.</p>
            <div class="template-dialog-actions">
              <button class="wizard-btn wizard-btn-back"
                @click=${() => { this._showDeleteCalibrationDialog = false; }}
              >Cancel</button>
              <button class="wizard-btn wizard-btn-primary" style="background: var(--error-color, #f44336);"
                @click=${this._deleteCalibration}
              >Delete</button>
            </div>
          </div>
        </div>
      ` : nothing}
    `;
  }

  private async _deleteCalibration(): Promise<void> {
    this._showDeleteCalibrationDialog = false;
    this._perspective = null;
    this._roomWidth = 0;
    this._roomDepth = 0;
    this._grid = new Uint8Array(GRID_COLS * GRID_ROWS);
    this._zoneConfigs = new Array(MAX_ZONES).fill(null);
    this._roomType = "normal";
    this._roomTrigger = ZONE_TYPE_DEFAULTS.normal.trigger;
    this._roomSustain = ZONE_TYPE_DEFAULTS.normal.sustain;
    this._roomTimeout = ZONE_TYPE_DEFAULTS.normal.timeout;
    this._furniture = [];
    // Clear calibration and layout on the backend
    try {
      await this.hass.callWS({
        type: "everything_presence_pro/set_setup",
        entry_id: this._selectedEntryId,
        perspective: [0, 0, 0, 0, 0, 0, 0, 0],
        room_width: 0,
        room_depth: 0,
      });
      await this.hass.callWS({
        type: "everything_presence_pro/set_room_layout",
        entry_id: this._selectedEntryId,
        grid_bytes: Array.from(this._grid),
        zone_slots: this._zoneConfigs.map(() => null),
        furniture: [],
      });
    } catch (e) {
      console.error("Failed to delete calibration", e);
    }
    this._dirty = false;
    this._view = "live";
  }

  private _changePlacement(): void {
    this._guardNavigation(() => {
      this._setupStep = "guide";
      this._wizardCornerIndex = 0;
      this._wizardCorners = [null, null, null, null];
      this._wizardRoomWidth = this._roomWidth;
      this._wizardRoomDepth = this._roomDepth;
    });
  }

  private _renderHeader() {
    const headerBtns = nothing;

    return html`
      <div class="panel-header">
        <select
          class="device-select"
          .value=${this._selectedEntryId}
          @change=${(e: Event) => {
            const val = (e.target as HTMLSelectElement).value;
            if (val === "__add__") {
              window.open("/config/integrations/integration/everything_presence_pro", "_blank");
              (e.target as HTMLSelectElement).value = this._selectedEntryId;
              return;
            }
            this._onDeviceChange(e);
          }}
        >
          ${this._entries.map(
            (e) => html`
              <option value=${e.entry_id}>
                ${e.title}${e.room_name ? ` \u2014 ${e.room_name}` : ""}
              </option>
            `
          )}
          <option value="__add__">+ Add another sensor</option>
        </select>
        ${headerBtns}
      </div>
    `;
  }

  private _renderWizard() {
    let stepContent;
    switch (this._setupStep) {
      case "guide":
        stepContent = this._renderWizardGuide();
        break;
      case "corners":
        stepContent = this._renderWizardCorners();
        break;
    }
    return html`
      <div class="wizard-container">
        ${this._renderHeader()} ${stepContent}
        ${this._wizardCapturing ? html`
          <div class="capture-overlay">
            <div class="capture-overlay-content">
              <div class="capture-progress" style="width: 200px;">
                <div class="capture-bar">
                  <div class="capture-fill" style="width: ${this._wizardCaptureProgress * 100}%"></div>
                </div>
                <span>Recording... ${Math.round(this._wizardCaptureProgress * CAPTURE_DURATION_S)}s / ${CAPTURE_DURATION_S}s</span>
              </div>
              <p style="margin: 8px 0 0; font-size: 13px; color: var(--secondary-text-color);">Stand still</p>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderWizardGuide() {
    // Walking person icon (simple cartoon stick figure)
    const walker = (x: number, y: number, flip = false, rotate = 0) => svg`
      <g transform="translate(${x}, ${y}) rotate(${rotate}) scale(${flip ? -0.7 : 0.7}, 0.7)">
        <circle cx="0" cy="-12" r="4" fill="var(--primary-color, #03a9f4)"/>
        <line x1="0" y1="-8" x2="0" y2="2" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="-4" y2="10" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="4" y2="10" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="-4" x2="-5" y2="2" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="-4" x2="5" y2="-1" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
      </g>
    `;

    // Arrow between two points, shortened on both ends
    const arrow = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len, uy = dy / len;
      const inset = 40;
      const sx = x1 + ux * inset, sy = y1 + uy * inset;
      const ex = x2 - ux * inset, ey = y2 - uy * inset;
      // Arrowhead
      const ax = ex - ux * 8 + uy * 4, ay = ey - uy * 8 - ux * 4;
      const bx = ex - ux * 8 - uy * 4, by = ey - uy * 8 + ux * 4;
      return svg`
        <line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <polygon points="${ex},${ey} ${ax},${ay} ${bx},${by}" fill="var(--primary-color, #03a9f4)" opacity="0.5"/>
      `;
    };

    // Corner positions: sensor top-right, order: TL(1) → TR(2) → BR(3) → BL(4)
    // Inset from room walls so badges and sensor don't clip
    const TL = { x: 50, y: 55 };   // Corner 1: front-left
    const TR = { x: 290, y: 55 };  // Corner 2: front-right (sensor here)
    const BR = { x: 290, y: 225 }; // Corner 3: back-right (same distance from bottom as 1/2 from top)
    const BL = { x: 50, y: 235 };  // Corner 4 plant/65cm position (stays near wall)
    const BL_BADGE = { x: 98, y: 225 }; // Corner 4 badge at same height as 3

    const roomDiagram = svg`
      <svg viewBox="0 0 360 290" width="360" height="290" style="display: block; margin: 0 auto;">
        <!-- Room with rounded corners, soft fill -->
        <rect x="30" y="35" width="280" height="210" rx="8"
              fill="var(--secondary-background-color, #f5f5f5)"
              stroke="var(--divider-color, #d0d0d0)" stroke-width="2.5"/>

        <!-- Wall labels -->
        <text x="170" y="28" font-size="9" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">Front wall (sensor side)</text>
        <text x="170" y="262" font-size="9" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">Back wall</text>

        <!-- Arrows with walking figures: 1→2→3→4 -->
        ${arrow(TL.x, TL.y, TR.x, TR.y)}
        ${walker(170, 72)}
        ${arrow(TR.x, TR.y, BR.x, BR.y)}
        ${walker(265, 145, false, 90)}
        <!-- 3rd arrow flat from 3 to 4 badge, same gap as arrow 1 has from 2 -->
        ${arrow(BR.x, BR.y, BL_BADGE.x - 15, BR.y)}
        ${walker(190, BR.y - 17, true)}

        <!-- Corner 4 badge: same height as 3, just past arrow end -->
        <circle cx="${BL_BADGE.x}" cy="${BL_BADGE.y}" r="14" fill="#FF9800" opacity="0.15"/>
        <circle cx="${BL_BADGE.x}" cy="${BL_BADGE.y}" r="14" fill="none" stroke="#FF9800" stroke-width="2.5" stroke-dasharray="5 3"/>
        <text x="${BL_BADGE.x}" y="${BL_BADGE.y + 5}" font-size="14" fill="#FF9800" font-weight="bold" text-anchor="middle">4</text>

        <!-- Pot plant in the corner (BL) -->
        <g transform="translate(${BL.x + 5}, ${BL.y - 5})">
          <!-- Pot -->
          <path d="M -12 -2 L -10 12 L 10 12 L 12 -2 Z" fill="#C68642" stroke="#A0522D" stroke-width="1.5"/>
          <rect x="-14" y="-5" width="28" height="5" rx="2" fill="#A0522D"/>
          <!-- Plant leaves -->
          <ellipse cx="0" cy="-18" rx="12" ry="10" fill="#66BB6A" stroke="#43A047" stroke-width="1"/>
          <ellipse cx="-10" cy="-12" rx="9" ry="7" fill="#81C784" stroke="#43A047" stroke-width="1"/>
          <ellipse cx="10" cy="-12" rx="9" ry="7" fill="#81C784" stroke="#43A047" stroke-width="1"/>
          <ellipse cx="-6" cy="-22" rx="7" ry="6" fill="#A5D6A7" stroke="#66BB6A" stroke-width="1"/>
          <ellipse cx="6" cy="-22" rx="7" ry="6" fill="#A5D6A7" stroke="#66BB6A" stroke-width="1"/>
        </g>

        <!-- Horizontal distance measure below the room -->
        <line x1="30" y1="${BL.y + 18}" x2="${BL_BADGE.x}" y2="${BL.y + 18}" stroke="#FF9800" stroke-width="1.5"/>
        <line x1="30" y1="${BL.y + 12}" x2="30" y2="${BL.y + 24}" stroke="#FF9800" stroke-width="1.5"/>
        <line x1="${BL_BADGE.x}" y1="${BL.y + 12}" x2="${BL_BADGE.x}" y2="${BL.y + 24}" stroke="#FF9800" stroke-width="1.5"/>
        <text x="${(30 + BL_BADGE.x) / 2}" y="${BL.y + 32}" font-size="9" fill="#FF9800" text-anchor="middle" font-weight="500">65cm</text>

        <!-- Corner 1: front-left -->
        <circle cx="${TL.x}" cy="${TL.y}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${TL.x}" cy="${TL.y}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${TL.x}" y="${TL.y + 5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">1</text>

        <!-- Corner 2: front-right (sensor here) -->
        <circle cx="${TR.x}" cy="${TR.y}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${TR.x}" cy="${TR.y}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${TR.x}" y="${TR.y + 5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">2</text>

        <!-- Corner 3: back-right -->
        <circle cx="${BR.x}" cy="${BR.y}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${BR.x}" cy="${BR.y}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${BR.x}" y="${BR.y + 5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">3</text>

        <!-- Sensor icon outside the top-right corner -->
        <g transform="translate(${TR.x + 18}, ${TR.y - 18}) rotate(-45)">
          <rect x="-5" y="-7" width="10" height="14" rx="3" fill="var(--primary-color, #03a9f4)"/>
          <circle cx="0" cy="-11" r="3.5" fill="var(--primary-color, #03a9f4)" opacity="0.4"/>
        </g>
        <text x="${TR.x + 24}" y="${TR.y - 24}" font-size="10" fill="var(--primary-color, #03a9f4)" font-weight="500">Sensor</text>
      </svg>
    `;

    return html`
      <div style="max-width: 560px; margin: 0 auto;">
        <div class="setting-group">
          <h4 style="text-align: center; margin-bottom: 16px;">How room calibration works</h4>

          ${roomDiagram}

          <div style="display: flex; flex-direction: column; gap: 14px; padding: 16px 4px 0;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="min-width: 22px; height: 22px; border-radius: 50%; background: #4CAF50; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white;">1</div>
              <div style="font-size: 13px;">
                <strong>Walk to each corner</strong> in order (1 → 2 → 3 → 4) and click Mark. Stand still for a few seconds so the sensor can lock on.
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="min-width: 22px; height: 22px; border-radius: 50%; background: #FF9800; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white;">!</div>
              <div style="font-size: 13px;">
                <strong>Can't reach a corner?</strong> Stand as close as you can and enter the distance from each wall in the offset fields — like corner 4 in the diagram above, where a plant is in the way.
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 20px; color: var(--primary-color); flex-shrink: 0; margin-top: 1px;"></ha-icon>
              <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                Corner 2 is where your sensor is mounted. You can stand right under it.
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <button class="wizard-btn wizard-btn-back"
            @click=${() => { this._setupStep = null; }}
          >Cancel</button>
          <button class="wizard-btn wizard-btn-primary"
            @click=${() => { this._setupStep = "corners"; }}
          >Begin marking corners</button>
        </div>
      </div>
    `;
  }

  private _renderWizardCorners() {
    const idx = this._wizardCornerIndex;
    const activeTargets = this._targets.filter((t) => t.active);
    const hasTarget = activeTargets.length > 0;
    const tooManyTargets = activeTargets.length > 1;
    const allMarked = this._wizardCorners.every((c) => c !== null);
    const label = CORNER_LABELS[idx] || "";
    const [sideLabel, fbLabel] = CORNER_OFFSET_LABELS[idx] || ["", ""];

    return html`
      <div class="wizard-card">
        <h2>Calibrate room size</h2>
        <p>
          Walk to each corner of the room and click Mark. The sensor will
          record your position over ${CAPTURE_DURATION_S} seconds.
        </p>

        ${allMarked
          ? nothing
          : html`
            <p class="corner-instruction">
              <strong>Corner ${idx + 1}/4:</strong> Walk to the
              <strong>${label.toLowerCase()}</strong> corner.
            </p>
        `}

        <div class="corner-progress">
          ${CORNER_LABELS.map(
            (name, i) => {
              const done = !!this._wizardCorners[i];
              const active = i === idx;
              const showArrow = i < 3;
              const arrowDone = i < idx;
              return html`
                <span
                  class="corner-chip ${done ? "done" : ""} ${active ? "active" : ""}"
                  @click=${() => { this._wizardCornerIndex = i; }}
                >
                  ${name} ${done ? "\u2713" : ""}
                </span>
                ${showArrow ? html`
                  <span class="corner-arrow ${arrowDone ? "done" : ""}">›</span>
                ` : nothing}
              `;
            }
          )}
        </div>

        ${allMarked
          ? nothing
          : html`

            <div class="corner-offsets" key="${idx}">
              <span class="offset-label">Distance from:</span>
              <input
                type="number"
                class="offset-input"
                min="0"
                step="1"
                placeholder="${sideLabel} (cm)"
                .value=${this._wizardCorners[idx]?.offset_side ? String(this._wizardCorners[idx]!.offset_side / 10) : ""}
                @change=${(e: Event) => {
                  const val = 10 * (parseFloat((e.target as HTMLInputElement).value) || 0);
                  const corner = this._wizardCorners[idx];
                  if (corner) corner.offset_side = val;
                }}
              />
              <input
                type="number"
                class="offset-input"
                min="0"
                step="1"
                placeholder="${fbLabel} (cm)"
                .value=${this._wizardCorners[idx]?.offset_fb ? String(this._wizardCorners[idx]!.offset_fb / 10) : ""}
                @change=${(e: Event) => {
                  const val = 10 * (parseFloat((e.target as HTMLInputElement).value) || 0);
                  const corner = this._wizardCorners[idx];
                  if (corner) corner.offset_fb = val;
                }}
              />
            </div>

            ${this._renderMiniSensorView()}

            ${!hasTarget
              ? html`<p class="no-target-warning">
                  No target detected. Make sure you are visible to the sensor.
                </p>`
              : tooManyTargets
              ? html`<p class="no-target-warning">
                  Multiple targets detected. Only one person should be in the room during calibration.
                </p>`
              : nothing}

            <div class="wizard-actions">
              <button
                class="wizard-btn wizard-btn-back"
                @click=${() => { this._setupStep = null; }}
              >Cancel</button>
              <button
                class="wizard-btn wizard-btn-primary"
                ?disabled=${!hasTarget || tooManyTargets || this._wizardCapturing}
                @click=${() => this._wizardStartCapture()}
              >
                Mark ${label}
              </button>
            </div>
          `}
      </div>
    `;
  }

  /** Sensor FOV view showing raw target positions during corner marking */
  private _renderMiniSensorView() {
    // SVG uses real mm coordinates: sensor at (0,0), FOV opens downward
    const halfX = EverythingPresenceProPanel.FOV_X_EXTENT; // ~5196
    const R = MAX_RANGE; // 6000
    const pad = 200; // small padding

    // FOV edge points at max range
    const lx = -halfX, ly = R * Math.cos(EverythingPresenceProPanel.FOV_HALF_ANGLE); // (-5196, 3000)
    const rx = halfX, ry = ly; // (5196, 3000)

    // FOV wedge with arc: sensor → left edge → arc to right edge → close
    const fovPath = `M 0 0 L ${lx} ${ly} A ${R} ${R} 0 0 0 ${rx} ${ry} Z`;

    // Range ring arcs (2m and 4m)
    const ringPaths = [2000, 4000].map((r) => {
      const ex = r * Math.sin(EverythingPresenceProPanel.FOV_HALF_ANGLE);
      const ey = r * Math.cos(EverythingPresenceProPanel.FOV_HALF_ANGLE);
      return `M ${-ex} ${ey} A ${r} ${r} 0 0 0 ${ex} ${ey}`;
    });

    return html`
      <div class="mini-grid-container">
        <div class="sensor-fov-view">
          <svg
            class="sensor-fov-svg"
            viewBox="${-halfX - pad} ${-pad} ${halfX * 2 + pad * 2} ${R + pad * 2}"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="${fovPath}"
              fill="rgba(3, 169, 244, 0.10)"
              stroke="rgba(3, 169, 244, 0.3)"
              stroke-width="30"
            />
            ${ringPaths.map(
              (d) => svg`
                <path
                  d="${d}"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  stroke-width="40"
                  stroke-dasharray="80 80"
                />
              `
            )}
            <!-- Sensor dot -->
            <circle cx="0" cy="0" r="100" fill="var(--primary-color, #03a9f4)" stroke="#fff" stroke-width="40" />
          </svg>
          <!-- Marked corners (positioned via CSS %) -->
          ${this._wizardCorners
            .filter((c): c is WizardCorner => c !== null)
            .map((c, i) => {
              const { xPct, yPct } = this._rawToFovPct(c.raw_x, c.raw_y);
              return html`
                <div
                  class="mini-grid-captured"
                  style="left: ${xPct}%; top: ${yPct}%;"
                  title="${CORNER_LABELS[i]}"
                ></div>
              `;
            })}
          <!-- Live targets (per-target colors) -->
          ${this._targets.map(
            (t, i) => t.active ? html`
              <div
                class="mini-grid-target"
                style="${this._getWizardTargetStyle(t)} background: ${TARGET_COLORS[i] || TARGET_COLORS[0]};"
              ></div>
            ` : nothing
          )}
        </div>
      </div>
    `;
  }

  private _renderSaveCancelButtons() {
    const saveHandler = this._view === "settings" ? this._saveSettings : this._applyLayout;
    return html`
      <div class="save-cancel-bar">
        <button class="wizard-btn wizard-btn-back"
          @click=${() => {
            this._dirty = false;
            this._view = "live";
            this._loadEntryConfig(this._selectedEntryId);
          }}
        >Cancel</button>
        <button class="wizard-btn wizard-btn-primary"
          ?disabled=${this._saving || !this._dirty}
          @click=${saveHandler}
        >${this._saving ? "Saving..." : "Save"}</button>
      </div>
    `;
  }

  private _renderLiveOverview() {
    return html`
      <div class="panel">
        ${this._renderHeader()}
        <div class="editor-layout">
          <div style="flex: 1; min-width: 0;">
            ${nothing}
            <div class="grid-container">
              ${this._perspective
                ? this._renderLiveGrid()
                : this._renderUncalibratedFov()}
            </div>
          </div>
          <div class="zone-sidebar">
            <div class="sidebar-header">
              <span class="sidebar-title">Live overview</span>
              <button
                class="sidebar-menu-btn"
                title="Show signal strength"
                style="margin-right: auto; opacity: ${this._showHitCounts ? 1 : 0.4};"
                @click=${() => { this._showHitCounts = !this._showHitCounts; }}
              >
                <ha-icon icon="mdi:signal-cellular-3" style="--mdc-icon-size: 18px;"></ha-icon>
              </button>
              <div class="sidebar-menu-wrapper">
                <button class="sidebar-menu-btn" @click=${() => { this._showLiveMenu = !this._showLiveMenu; }}>
                  <ha-icon icon="mdi:dots-vertical" style="--mdc-icon-size: 20px;"></ha-icon>
                </button>
                ${this._showLiveMenu ? html`
                  <div class="sidebar-menu" @click=${() => { this._showLiveMenu = false; }}>
                    ${this._perspective ? html`
                      <button class="sidebar-menu-item" @click=${() => { this._view = "editor"; this._sidebarTab = "zones"; }}>
                        <ha-icon icon="mdi:vector-square" style="--mdc-icon-size: 18px;"></ha-icon> Detection zones
                      </button>
                      <button class="sidebar-menu-item" @click=${() => { this._view = "editor"; this._sidebarTab = "furniture"; }}>
                        <ha-icon icon="mdi:sofa" style="--mdc-icon-size: 18px;"></ha-icon> Furniture
                      </button>
                    ` : nothing}
                    <button class="sidebar-menu-item" @click=${() => { this._view = "settings"; }}>
                      <ha-icon icon="mdi:cog" style="--mdc-icon-size: 18px;"></ha-icon> Settings
                    </button>
                    <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 4px 0;"/>
                    <button class="sidebar-menu-item" @click=${this._changePlacement}>
                      <ha-icon icon="mdi:target" style="--mdc-icon-size: 18px;"></ha-icon> Room size calibration
                    </button>
                    ${this._perspective ? html`
                      <button class="sidebar-menu-item" style="color: var(--error-color, #f44336);" @click=${() => {
                        this._showDeleteCalibrationDialog = true;
                      }}>
                        <ha-icon icon="mdi:delete" style="--mdc-icon-size: 18px;"></ha-icon> Delete room calibration
                      </button>
                    ` : nothing}
                    <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 4px 0;"/>
                    <button class="sidebar-menu-item" @click=${() => { this._showTemplateSave = true; }}>
                      <ha-icon icon="mdi:content-save" style="--mdc-icon-size: 18px;"></ha-icon> Save template
                    </button>
                    <button class="sidebar-menu-item" @click=${() => { this._showTemplateLoad = true; }}>
                      <ha-icon icon="mdi:folder-open" style="--mdc-icon-size: 18px;"></ha-icon> Load template
                    </button>
                  </div>
                ` : nothing}
              </div>
            </div>
            ${this._renderLiveSidebar()}
          </div>
        </div>
      </div>
    `;
  }

  private _renderLiveGrid() {
    // Reuse the same grid rendering as the editor but read-only (no painting)
    const bounds = this._getRoomBounds();
    const noRoom = bounds.minCol > bounds.maxCol;
    const minCol = noRoom ? 0 : bounds.minCol;
    const maxCol = noRoom ? GRID_COLS - 1 : bounds.maxCol;
    const minRow = noRoom ? 0 : bounds.minRow;
    const maxRow = noRoom ? GRID_ROWS - 1 : bounds.maxRow;
    const visCols = maxCol - minCol + 1;
    const visRows = maxRow - minRow + 1;
    const maxPx = Math.min(480, (this.offsetWidth || 800) * 0.55);
    const cellPx = Math.min(Math.floor(maxPx / visCols), Math.floor(maxPx / visRows), 32);

    return html`
      <div
        class="grid"
        style="grid-template-columns: repeat(${visCols}, ${cellPx}px); grid-template-rows: repeat(${visRows}, ${cellPx}px);"
      >
        ${this._renderVisibleCells(minCol, maxCol, minRow, maxRow, cellPx)}
      </div>
      ${this._renderFurnitureOverlay(cellPx, minCol, minRow, visCols, visRows)}
      <div class="targets-overlay" style="pointer-events: none;">
        ${this._targets.map((t, i) => {
          if (!t.active) return nothing;
          const pos = this._mapTargetToGridCell(t);
          if (!pos) return nothing;
          const xPct = ((pos.col - minCol) / visCols) * 100;
          const yPct = ((pos.row - minRow) / visRows) * 100;
          return html`
            <div
              class="target-dot"
              style="left: ${xPct}%; top: ${yPct}%; background: ${TARGET_COLORS[i] || TARGET_COLORS[0]};"
            ></div>
            ${this._showHitCounts && t.signal > 0 ? html`
              <div style="position: absolute; left: ${xPct}%; top: ${yPct}%; transform: translate(-50%, -280%); background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; font-weight: bold; padding: 0 4px; border-radius: 6px; pointer-events: none;">
                ${t.signal}
              </div>
            ` : nothing}
          `;
        })}
      </div>
      ${this._renderGridDimensions()}
    `;
  }

  private _renderGridDimensions() {
    const metrics = this._getGridRoomMetrics();
    if (!metrics) return nothing;
    return html`
      <div class="grid-dimensions">
        ${metrics.widthM}m × ${metrics.depthM}m · Furthest point: ${metrics.furthestM}m
      </div>
    `;
  }

  private _renderUncalibratedFov() {
    const occupied = this._sensorState.occupancy;
    const fovColor = occupied ? "#4CAF50" : "var(--primary-color, #03a9f4)";
    // 120° FOV centered at 90° (pointing down), ±60°
    const cx = 150, cy = 10, maxR = 180;
    const a1 = (90 - 60) * Math.PI / 180; // 30°
    const a2 = (90 + 60) * Math.PI / 180; // 150°
    const ex1 = cx + maxR * Math.cos(a1), ey1 = cy + maxR * Math.sin(a1);
    const ex2 = cx + maxR * Math.cos(a2), ey2 = cy + maxR * Math.sin(a2);

    return html`
      <div style="display: flex; flex-direction: column; align-items: center; padding: 24px;">
        <svg viewBox="0 0 300 210" width="300" height="210" style="display: block;">
          <!-- Sensor at top center -->
          <rect x="${cx - 6}" y="0" width="12" height="8" rx="3" fill="${fovColor}"/>
          <circle cx="${cx}" cy="0" r="4" fill="${fovColor}" opacity="0.4"/>

          <!-- 120° FOV wedge with rounded arc end -->
          <path d="M ${cx} ${cy} L ${ex1} ${ey1} A ${maxR} ${maxR} 0 0 1 ${ex2} ${ey2} Z"
                fill="${fovColor}" fill-opacity="${occupied ? 0.15 : 0.06}"
                stroke="${fovColor}" stroke-width="1" stroke-opacity="0.2"/>

          <!-- Range arcs -->
          ${[60, 120, 180].map((r) => {
            const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
            const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
            return svg`
              <path d="M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}"
                    fill="none" stroke="${fovColor}" stroke-width="1"
                    stroke-dasharray="4 3" opacity="0.2"/>
            `;
          })}

          <!-- Edge lines -->
          <line x1="${cx}" y1="${cy}" x2="${ex1}" y2="${ey1}" stroke="${fovColor}" stroke-width="0.5" opacity="0.2"/>
          <line x1="${cx}" y1="${cy}" x2="${ex2}" y2="${ey2}" stroke="${fovColor}" stroke-width="0.5" opacity="0.2"/>

          <!-- Target dots -->
          ${this._targets.map((t, i) => {
            if (!t.active) return nothing;
            // Map raw coords to FOV: x maps left-right, y maps top-bottom
            const dist = Math.sqrt(t.raw_x * t.raw_x + t.raw_y * t.raw_y);
            const angle = Math.atan2(t.raw_x, t.raw_y); // angle from center
            const r = Math.min(dist / 6000, 1) * maxR;
            const svgAngle = Math.PI / 2 + angle; // rotate so 0=down
            const tx = cx + r * Math.cos(svgAngle);
            const ty = cy + r * Math.sin(svgAngle);
            return svg`<circle cx="${tx}" cy="${ty}" r="5" fill="${TARGET_COLORS[i] || TARGET_COLORS[0]}"/>`;
          })}

          ${occupied ? svg`
            <text x="${cx}" y="120" font-size="13" fill="${fovColor}" text-anchor="middle" font-weight="500">Detected</text>
          ` : svg`
            <text x="${cx}" y="120" font-size="13" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">No presence</text>
          `}
        </svg>

        <button
          class="live-nav-link" style="margin-top: 16px;"
          @click=${() => { this._setupStep = "guide"; this._view = "live"; }}
        >
          <ha-icon icon="mdi:target" style="--mdc-icon-size: 16px;"></ha-icon>
          Calibrate room size
        </button>
      </div>
    `;
  }

  private _renderNeedsCalibration() {
    // SVG diagrams for positioning guide
    const heightDiagram = svg`
      <svg viewBox="0 0 200 160" width="200" height="160" style="display: block;">
        <!-- Floor and wall -->
        <line x1="20" y1="150" x2="180" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <line x1="20" y1="10" x2="20" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <!-- Person outline -->
        <circle cx="130" cy="50" r="10" fill="none" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="60" x2="130" y2="105" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="105" x2="118" y2="148" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="105" x2="142" y2="148" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="75" x2="115" y2="95" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="75" x2="145" y2="95" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <!-- Sensor on wall -->
        <rect x="14" y="52" width="12" height="8" rx="2" fill="var(--primary-color, #03a9f4)"/>
        <!-- Height bracket -->
        <line x1="40" y1="56" x2="40" y2="150" stroke="var(--primary-color, #03a9f4)" stroke-width="1" stroke-dasharray="4 2"/>
        <line x1="36" y1="56" x2="44" y2="56" stroke="var(--primary-color, #03a9f4)" stroke-width="1.5"/>
        <line x1="36" y1="150" x2="44" y2="150" stroke="var(--primary-color, #03a9f4)" stroke-width="1.5"/>
        <text x="48" y="108" font-size="11" fill="var(--primary-color, #03a9f4)">1.5–2m</text>
        <!-- Detection cone -->
        <path d="M 26 56 L 100 30 L 100 82 Z" fill="var(--primary-color, #03a9f4)" opacity="0.1" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5"/>
      </svg>
    `;

    const cornerDiagram = (() => {
      // 120° FOV from top-left corner, centered on diagonal into room
      // In SVG: 0°=right, 90°=down. Diagonal to bottom-right = 45°
      // ±60° from center → edges at -15° and 105°
      const cx = 28, cy = 28, r = 180;
      const centerDeg = 45;
      const a1Rad = (centerDeg - 60) * Math.PI / 180; // -15°
      const a2Rad = (centerDeg + 60) * Math.PI / 180; // 105°
      const x1 = cx + r * Math.cos(a1Rad), y1 = cy + r * Math.sin(a1Rad);
      const x2 = cx + r * Math.cos(a2Rad), y2 = cy + r * Math.sin(a2Rad);
      // Range arcs at 2m and 4m (~32px per meter)
      const arcPath = (ar: number, label: string) => {
        const ax1 = cx + ar * Math.cos(a1Rad), ay1 = cy + ar * Math.sin(a1Rad);
        const ax2 = cx + ar * Math.cos(a2Rad), ay2 = cy + ar * Math.sin(a2Rad);
        // Label just inside the arc
        const labelAngle = centerDeg * Math.PI / 180;
        const lx = cx + (ar - 10) * Math.cos(labelAngle), ly = cy + (ar - 10) * Math.sin(labelAngle);
        return svg`
          <path d="M ${ax1} ${ay1} A ${ar} ${ar} 0 0 1 ${ax2} ${ay2}"
                fill="none" stroke="var(--primary-color, #03a9f4)" stroke-width="1"
                stroke-dasharray="4 3" opacity="0.35" clip-path="url(#room-clip)"/>
          <text x="${lx}" y="${ly}" font-size="8" fill="var(--secondary-text-color, #aaa)"
                text-anchor="middle" clip-path="url(#room-clip)">${label}</text>
        `;
      };
      return svg`
        <svg viewBox="0 0 200 160" width="200" height="160" style="display: block;">
          <defs>
            <clipPath id="room-clip"><rect x="20" y="20" width="160" height="120"/></clipPath>
          </defs>
          <!-- Room outline -->
          <rect x="20" y="20" width="160" height="120" fill="none" stroke="var(--divider-color, #ccc)" stroke-width="2" rx="2"/>
          <!-- 120° FOV wedge clipped to room -->
          <path d="M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 0 0 ${x1} ${y1} Z"
                fill="var(--primary-color, #03a9f4)" opacity="0.08"
                clip-path="url(#room-clip)"/>
          <!-- Cone edge lines -->
          <line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <!-- Range arcs -->
          ${arcPath(60, "2m")}
          ${arcPath(120, "4m")}
          ${arcPath(180, "")}
          <!-- Sensor dot -->
          <circle cx="${cx}" cy="${cy}" r="6" fill="var(--primary-color, #03a9f4)"/>
          <!-- Labels -->
          <text x="30" y="16" font-size="10" fill="var(--primary-color, #03a9f4)">Sensor</text>
          <text x="152" y="136" font-size="8" fill="var(--secondary-text-color, #aaa)" text-anchor="end">6m</text>
        </svg>
      `;
    })();

    const horizontalDiagram = svg`
      <svg viewBox="0 0 200 160" width="200" height="160" style="display: block;">
        <!-- Wall -->
        <line x1="20" y1="10" x2="20" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <line x1="20" y1="150" x2="180" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <!-- Sensor -->
        <rect x="14" y="56" width="12" height="8" rx="2" fill="var(--primary-color, #03a9f4)"/>
        <!-- Correct: horizontal beam -->
        <line x1="26" y1="60" x2="170" y2="60" stroke="var(--primary-color, #03a9f4)" stroke-width="1.5"/>
        <polygon points="170,60 162,56 162,64" fill="var(--primary-color, #03a9f4)"/>
        <text x="70" y="52" font-size="10" fill="var(--primary-color, #03a9f4)">Horizontal ✓</text>
        <!-- Wrong: angled down -->
        <line x1="26" y1="60" x2="140" y2="140" stroke="var(--error-color, #f44336)" stroke-width="1" stroke-dasharray="4 2" opacity="0.6"/>
        <text x="90" y="118" font-size="10" fill="var(--error-color, #f44336)" opacity="0.7">Angled ✗</text>
        <!-- Wrong: angled up -->
        <line x1="26" y1="60" x2="120" y2="22" stroke="var(--error-color, #f44336)" stroke-width="1" stroke-dasharray="4 2" opacity="0.6"/>
        <text x="75" y="18" font-size="10" fill="var(--error-color, #f44336)" opacity="0.7">Angled ✗</text>
      </svg>
    `;

    return html`
      <div class="panel">
        ${this._renderHeader()}
        <div style="max-width: 560px; margin: 0 auto; padding: 0 24px;">
          <div class="setting-group">
            <h4>How to position your sensor</h4>
            <div style="display: flex; flex-direction: column; gap: 20px; padding: 8px 0;">

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${heightDiagram}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">Mount height</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    Place the sensor <strong>1.5 to 2 meters</strong> from the floor
                  </div>
                </div>
              </div>

              <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 0;"/>

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${cornerDiagram}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">Placement</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    Place in a <strong>corner or on a wall</strong>, pointing toward the most distant opposite corner
                  </div>
                </div>
              </div>

              <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 0;"/>

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${horizontalDiagram}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">Beam direction</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    Keep the beam <strong>horizontal</strong> — not angled up or down
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <button
              class="wizard-btn wizard-btn-primary"
              @click=${() => { this._setupStep = "guide"; }}
            >
              Start room size calibration
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _toggleAccordion(id: string) {
    const next = new Set(this._openAccordions);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this._openAccordions = next;
  }

  private _autoDetectionRange(): number {
    const maxMm = Math.max(this._roomWidth, this._roomDepth);
    if (maxMm <= 0) return 0;
    const m = maxMm / 1000;
    return Math.ceil(m * 2) / 2; // round up to nearest 0.5m
  }

  private _renderSettings() {
    const sections: { id: string; label: string; icon: string }[] = [
      { id: "detection", label: "Detection Ranges", icon: "mdi:signal-distance-variant" },
      { id: "sensitivity", label: "Sensor Calibration", icon: "mdi:tune-vertical" },
      { id: "reporting", label: "Entities", icon: "mdi:format-list-checks" },
    ];

    return html`
      <div class="panel">
        ${this._renderHeader()}
        <div class="settings-container" @input=${() => { this._dirty = true; }} @change=${() => { this._dirty = true; }}>
          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500;">Settings</h2>
          ${sections.map((s) => {
            const open = this._openAccordions.has(s.id);
            return html`
              <div class="accordion">
                <button class="accordion-header" ?data-open=${open} @click=${() => this._toggleAccordion(s.id)}>
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
          ${this._renderSaveCancelButtons()}
        </div>
      </div>
    `;
  }

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

  private _renderEnvOffset(
    label: string, reading: number | null, offsetKey: string,
    min: number, max: number, step: number, unit: string, precision: number, tip: string,
  ) {
    const savedOffsets: Record<string, number> = (this as any)._offsetsConfig || {};
    const offset = savedOffsets[offsetKey] ?? 0;
    // reading already has the saved offset applied by the coordinator,
    // so subtract it to get the raw value
    const raw = reading != null ? reading - offset : null;
    const adjusted = raw != null ? (raw + offset).toFixed(precision) : "—";
    return html`
      <div class="setting-row">
        <label>${label}</label>
        <span class="setting-input-unit"><input type="range" class="setting-range" data-offset-key=${offsetKey} .value=${String(offset)} min=${min} max=${max} step=${step} @input=${(e: Event) => {
          const el = e.target as HTMLInputElement;
          const off = parseFloat(el.value);
          const val = raw != null ? (raw + off).toFixed(precision) : "—";
          el.nextElementSibling!.textContent = val;
        }} /><span class="setting-value">${adjusted}</span> ${unit}</span>
        ${this._infoTip(tip)}
      </div>
    `;
  }

  private _infoTip(text: string) {
    return html`<span class="setting-info"
      @click=${(e: Event) => {
        e.stopPropagation();
        const icon = e.currentTarget as HTMLElement;
        const tip = icon.querySelector('.setting-info-tooltip') as HTMLElement;
        if (!tip) return;
        const wasOpen = tip.style.display === 'block';
        // Close any other open tooltips
        this.shadowRoot!.querySelectorAll('.setting-info-tooltip').forEach((t) => {
          (t as HTMLElement).style.display = 'none';
        });
        if (wasOpen) return;
        const rect = icon.getBoundingClientRect();
        tip.style.display = 'block';
        tip.style.left = `${Math.max(8, Math.min(rect.right - 240, window.innerWidth - 256))}px`;
        tip.style.top = `${rect.bottom + 6}px`;
      }}
    ><ha-icon icon="mdi:help-circle-outline"></ha-icon><span class="setting-info-tooltip">${text}</span></span>`;
  }

  private _renderDetectionRanges() {
    const autoRange = this._autoDetectionRange();
    const metrics = this._getGridRoomMetrics();
    return html`
      <div class="settings-section">
        ${metrics ? html`<p style="font-size: 13px; color: var(--secondary-text-color, #757575); margin: 0 0 12px;">Current furthest point from sensor: <strong style="color: var(--error-color, #e53935);">${metrics.furthestM}m</strong></p>` : nothing}
        <div class="setting-group">
          <h4>Target Sensor</h4>
          <div class="setting-row">
            <label>Detection range</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" .value=${String(autoRange)} min="0" max="6" step="0.1" @input=${(e: Event) => { const el = e.target as HTMLInputElement; el.nextElementSibling!.textContent = el.value; }} /><span class="setting-value">${autoRange}</span><span class="setting-unit">m</span></span>
            ${this._infoTip("Maximum detection distance for the target sensor. Auto-set from room dimensions.")}
          </div>
          <div class="setting-row">
            <label>Update rate</label>
            <span class="setting-input-unit">
              <select class="setting-input">
                <option value="5" selected>5 Hz (default)</option>
                <option value="10">10 Hz (fast)</option>
                <option value="2">2 Hz (low power)</option>
              </select>
              <span class="setting-value"></span><span class="setting-unit"></span>
            </span>
            ${this._infoTip("How often the sensor reports target data.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Static Sensor</h4>
          <div class="setting-row">
            <label>Min distance</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="0" min="0" max="25" step="0.1" @input=${(e: Event) => { const el = e.target as HTMLInputElement; el.nextElementSibling!.textContent = el.value; }} /><span class="setting-value">0</span><span class="setting-unit">m</span></span>
            ${this._infoTip("Minimum detection distance for the static sensor.")}
          </div>
          <div class="setting-row">
            <label>Max distance</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" .value=${String(autoRange)} min="0" max="25" step="0.1" @input=${(e: Event) => { const el = e.target as HTMLInputElement; el.nextElementSibling!.textContent = el.value; }} /><span class="setting-value">${autoRange}</span><span class="setting-unit">m</span></span>
            ${this._infoTip("Maximum detection distance for the static sensor. Auto-set from room dimensions.")}
          </div>
          <div class="setting-row">
            <label>Trigger distance</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" .value=${String(autoRange)} min="0" max="25" step="0.1" @input=${(e: Event) => { const el = e.target as HTMLInputElement; el.nextElementSibling!.textContent = el.value; }} /><span class="setting-value">${autoRange}</span><span class="setting-unit">m</span></span>
            ${this._infoTip("Distance at which the static sensor triggers presence.")}
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
            <span class="setting-input-unit"><input type="range" class="setting-range" value="5" min="0" max="120" step="1" @input=${(e: Event) => { const el = e.target as HTMLInputElement; el.nextElementSibling!.textContent = el.value; }} /><span class="setting-value">5</span><span class="setting-unit">s</span></span>
            ${this._infoTip("Time after last motion before the motion sensor clears.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Static Sensor</h4>
          <div class="setting-row">
            <label>Presence timeout</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="30" min="0" max="120" step="1" @input=${(e: Event) => { const el = e.target as HTMLInputElement; el.nextElementSibling!.textContent = el.value; }} /><span class="setting-value">30</span><span class="setting-unit">s</span></span>
            ${this._infoTip("Time after last static detection before the sensor clears.")}
          </div>
          <div class="setting-row">
            <label>Trigger threshold</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" min="0" max="9" value="3" @input=${(e: Event) => { const el = e.target as HTMLInputElement; el.nextElementSibling!.textContent = el.value; }} /><span class="setting-value">3</span><span class="setting-unit"></span></span>
            ${this._infoTip("Minimum signal strength needed to initially detect static presence. Higher = harder to trigger.")}
          </div>
          <div class="setting-row">
            <label>Sustain threshold</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" min="0" max="9" value="3" @input=${(e: Event) => { const el = e.target as HTMLInputElement; el.nextElementSibling!.textContent = el.value; }} /><span class="setting-value">3</span><span class="setting-unit"></span></span>
            ${this._infoTip("Minimum signal strength needed to maintain static presence detection. Higher = harder to sustain.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Environmental</h4>
          ${this._renderEnvOffset("Illuminance offset", this._sensorState.illuminance, "illuminance", -500, 500, 1, "lux", 0, "Adjust the illuminance reading by a fixed amount.")}
          ${this._renderEnvOffset("Humidity offset", this._sensorState.humidity, "humidity", -50, 50, 0.1, "%", 1, "Adjust the humidity reading by a fixed amount.")}
          ${this._renderEnvOffset("Temperature offset", this._sensorState.temperature, "temperature", -20, 20, 0.1, "°C", 1, "Adjust the temperature reading by a fixed amount.")}
        </div>
      </div>
    `;
  }

  private _renderReporting() {
    // Load saved reporting state from config
    const saved: Record<string, boolean> = (this as any)._reportingConfig || {};
    const isOn = (key: string, fallback: boolean) => saved[key] ?? fallback;

    return html`
      <div class="settings-section">
        <div class="setting-group">
          <h4>Room level</h4>
          <div class="setting-row">
            <label>Occupancy</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_occupancy" ?checked=${isOn("room_occupancy", true)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Combined room occupancy from all sensors.")}
          </div>
          <div class="setting-row">
            <label>Static presence</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_static_presence" ?checked=${isOn("room_static_presence", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("mmWave static presence detection.")}
          </div>
          <div class="setting-row">
            <label>Motion presence</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_motion_presence" ?checked=${isOn("room_motion_presence", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("PIR motion detection.")}
          </div>
          <div class="setting-row">
            <label>Target presence</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_target_presence" ?checked=${isOn("room_target_presence", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Whether any target is actively tracked.")}
          </div>
          <div class="setting-row">
            <label>Target count</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_target_count" ?checked=${isOn("room_target_count", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Number of targets detected in the room.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Zone level</h4>
          <div class="setting-row">
            <label>Presence</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="zone_presence" ?checked=${isOn("zone_presence", true)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Per-zone occupancy based on target tracking.")}
          </div>
          <div class="setting-row">
            <label>Target count</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="zone_target_count" ?checked=${isOn("zone_target_count", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Number of targets in each zone.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Target level</h4>
          <div class="setting-row">
            <label>XY position, relative to sensor</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_xy_sensor" ?checked=${isOn("target_xy_sensor", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Raw XY coordinates from the sensor.")}
          </div>
          <div class="setting-row">
            <label>XY position, relative to grid</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_xy_grid" ?checked=${isOn("target_xy_grid", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("XY coordinates mapped to the room grid.")}
          </div>
          <div class="setting-row">
            <label>Active</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_active" ?checked=${isOn("target_active", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Whether each target slot is actively tracking.")}
          </div>
          <div class="setting-row">
            <label>Distance</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_distance" ?checked=${isOn("target_distance", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Distance from sensor to each target.")}
          </div>
          <div class="setting-row">
            <label>Angle</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_angle" ?checked=${isOn("target_angle", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Angle from sensor to each target.")}
          </div>
          <div class="setting-row">
            <label>Speed</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_speed" ?checked=${isOn("target_speed", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Movement speed of each target.")}
          </div>
          <div class="setting-row">
            <label>Resolution</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_resolution" ?checked=${isOn("target_resolution", false)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Detection resolution for each target.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Environmental</h4>
          <div class="setting-row">
            <label>Illuminance</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_illuminance" ?checked=${isOn("env_illuminance", true)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("BH1750 illuminance sensor.")}
          </div>
          <div class="setting-row">
            <label>Humidity</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_humidity" ?checked=${isOn("env_humidity", true)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("SHTC3 humidity sensor.")}
          </div>
          <div class="setting-row">
            <label>Temperature</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_temperature" ?checked=${isOn("env_temperature", true)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("SHTC3 temperature sensor.")}
          </div>
          <div class="setting-row">
            <label>CO₂</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_co2" ?checked=${isOn("env_co2", true)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("SCD40 CO₂ sensor (optional module).")}
          </div>
        </div>
      </div>
    `;
  }

  private _renderEditor() {
    // Determine visible range: zoom to room cells (freeze during painting)
    const bounds = this._frozenBounds ?? this._getRoomBounds();
    const noRoom = bounds.minCol > bounds.maxCol;
    const minCol = noRoom ? 0 : bounds.minCol;
    const maxCol = noRoom ? GRID_COLS - 1 : bounds.maxCol;
    const minRow = noRoom ? 0 : bounds.minRow;
    const maxRow = noRoom ? GRID_ROWS - 1 : bounds.maxRow;

    const visCols = maxCol - minCol + 1;
    const visRows = maxRow - minRow + 1;
    const maxGridPx = Math.min(520, (this.offsetWidth || 800) * 0.55);
    const cellPx = Math.min(32, Math.floor(maxGridPx / visCols), Math.floor(maxGridPx / visRows));

    return html`
      <div class="panel" @click=${(e: Event) => {
        const el = e.target as HTMLElement;
        if (!el.closest(".grid") && !el.closest(".zone-sidebar")) {
          this._activeZone = null;
        }
      }}>
        ${this._renderHeader()}

        <div class="editor-layout">
          <div style="flex: 1; min-width: 0;">
            ${nothing}
            <!-- Grid -->
            <div class="grid-container" @click=${(e: Event) => {
            if (!(e.target as HTMLElement).closest(".furniture-item")) {
              this._selectedFurnitureId = null;
            }
          }}>
            <div
              class="grid"
              style="grid-template-columns: repeat(${visCols}, ${cellPx}px); grid-template-rows: repeat(${visRows}, ${cellPx}px);"
              @mouseup=${this._onCellMouseUp}
              @mouseleave=${this._onCellMouseUp}
            >
              ${this._renderVisibleCells(minCol, maxCol, minRow, maxRow, cellPx)}
            </div>
            ${this._renderFurnitureOverlay(cellPx, minCol, minRow, visCols, visRows)}
            <div class="targets-overlay" style="pointer-events: none;">
              ${this._targets
                .map((t, i) => {
                  if (!t.active) return nothing;
                  const pos = this._mapTargetToGridCell(t);
                  if (!pos) return nothing;
                  const xPct = ((pos.col - minCol) / visCols) * 100;
                  const yPct = ((pos.row - minRow) / visRows) * 100;
                  return html`
                    <div
                      class="target-dot"
                      style="left: ${xPct}%; top: ${yPct}%; background: ${TARGET_COLORS[i] || TARGET_COLORS[0]};"
                    ></div>
                    ${t.signal > 0 ? html`
                      <div style="position: absolute; left: ${xPct}%; top: ${yPct}%; transform: translate(-50%, -280%); background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; font-weight: bold; padding: 0 4px; border-radius: 6px; pointer-events: none;">
                        ${t.signal}
                      </div>
                    ` : nothing}
                  `;
                })}
            </div>
            ${this._renderGridDimensions()}
          </div>
          </div>

          <!-- Sidebar -->
          <div class="zone-sidebar">
            <div class="sidebar-title">${this._sidebarTab === "furniture" ? "Furniture" : "Detection zones"}</div>
            ${this._sidebarTab === "zones"
              ? this._renderZoneSidebar()
              : this._renderFurnitureSidebar()}
            ${this._renderSaveCancelButtons()}
          </div>
        </div>

        ${this._showTemplateSave ? this._renderTemplateSaveDialog() : nothing}
        ${this._showTemplateLoad ? this._renderTemplateLoadDialog() : nothing}
        ${this._showRenameDialog ? html`
          <div class="template-dialog">
            <div class="template-dialog-card" style="max-width: 520px;">
              <h3>Update entity IDs?</h3>
              <p class="overlay-help">Zone names changed. Would you like to update the entity IDs to match?</p>
              <div style="max-height: 300px; overflow-y: auto; margin: 12px 0;">
                ${this._pendingRenames.map((r) => {
                  const oldShort = r.old_entity_id.split(".")[1] || r.old_entity_id;
                  const newShort = r.new_entity_id.split(".")[1] || r.new_entity_id;
                  const platform = r.old_entity_id.split(".")[0] || "";
                  return html`
                    <div style="
                      padding: 8px 12px; margin: 4px 0;
                      background: var(--secondary-background-color, #f5f5f5);
                      border-radius: 8px; font-family: monospace; font-size: 12px;
                    ">
                      <div style="color: var(--secondary-text-color, #888); font-size: 11px; margin-bottom: 4px; font-family: var(--paper-font-body1_-_font-family, sans-serif);">
                        ${platform}
                      </div>
                      <div style="text-decoration: line-through; color: var(--secondary-text-color, #888); word-break: break-all;">
                        ${oldShort}
                      </div>
                      <div style="font-weight: 500; word-break: break-all; margin-top: 2px;">
                        → ${newShort}
                      </div>
                    </div>
                  `;
                })}
              </div>
              <div class="template-dialog-actions">
                <button class="wizard-btn wizard-btn-back"
                  @click=${this._dismissRenameDialog}
                >Skip</button>
                <button class="wizard-btn wizard-btn-primary"
                  @click=${this._applyRenames}
                >Rename</button>
              </div>
            </div>
          </div>
        ` : nothing}
        ${this._showUnsavedDialog ? html`
          <div class="template-dialog">
            <div class="template-dialog-card">
              <h3>You have unsaved changes</h3>
              <p class="overlay-help">Your changes will be lost if you navigate away without applying.</p>
              <div class="template-dialog-actions">
                <button class="wizard-btn wizard-btn-back"
                  @click=${() => { this._showUnsavedDialog = false; this._pendingNavigation = null; }}
                >Cancel</button>
                <button class="wizard-btn wizard-btn-primary" style="background: var(--error-color, #f44336);"
                  @click=${this._discardAndNavigate}
                >Discard</button>
              </div>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderTemplateSaveDialog() {
    return html`
      <div class="template-dialog">
        <div class="template-dialog-card">
          <h3>Save template</h3>
          <input
            type="text"
            class="template-name-input"
            placeholder="Template name"
            .value=${this._templateName}
            @input=${(e: Event) => { this._templateName = (e.target as HTMLInputElement).value; }}
          />
          <div class="template-dialog-actions">
            <button
              class="wizard-btn wizard-btn-back"
              @click=${() => { this._showTemplateSave = false; }}
            >Cancel</button>
            <button
              class="wizard-btn wizard-btn-primary"
              ?disabled=${!this._templateName.trim()}
              @click=${() => this._saveTemplate()}
            >Save</button>
          </div>
        </div>
      </div>
    `;
  }

  private _renderTemplateLoadDialog() {
    const templates = this._getTemplates();
    return html`
      <div class="template-dialog">
        <div class="template-dialog-card">
          <h3>Load template</h3>
          ${templates.length === 0
            ? html`<p class="overlay-help">No saved templates.</p>`
            : templates.map((t) => html`
              <div class="template-item">
                <span class="template-item-name">${t.name}</span>
                <span class="template-item-size">${(t.roomWidth / 1000).toFixed(1)}m x ${(t.roomDepth / 1000).toFixed(1)}m</span>
                <button
                  class="wizard-btn wizard-btn-primary template-item-btn"
                  @click=${() => this._loadTemplate(t.name)}
                >Load</button>
                <button
                  class="zone-remove-btn"
                  @click=${() => this._deleteTemplate(t.name)}
                >
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
            `)}
          <div class="template-dialog-actions">
            <button
              class="wizard-btn wizard-btn-back"
              @click=${() => { this._showTemplateLoad = false; }}
            >Close</button>
          </div>
        </div>
      </div>
    `;
  }

  private _renderVisibleCells(
    minCol: number, maxCol: number,
    minRow: number, maxRow: number,
    cellPx: number,
  ) {
    // Pre-compute heatmap colours per zone if enabled
    const heatmap = this._showHitCounts ? this._computeHeatmapColors() : null;
    // Local zone occupancy with trigger/sustain thresholds and timeout
    const now = Date.now() / 1000;

    // Determine which zones have a confirmed target this tick
    const zoneConfirmed: Set<number> = new Set();
    for (const t of this._targets) {
      if (!t.active || t.signal <= 0) continue;
      const pos = this._mapTargetToGridCell(t);
      if (!pos) continue;
      const col = Math.floor(pos.col);
      const row = Math.floor(pos.row);
      if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) continue;
      const idx = row * GRID_COLS + col;
      const cellVal = this._grid[idx];
      if (!cellIsInside(cellVal)) continue;
      const zid = cellZone(cellVal);
      const { trigger, sustain } = this._getZoneThresholds(zid);
      const st = this._localZoneState.get(zid);
      const isOccupied = st?.occupied ?? false;
      const thresh = isOccupied ? sustain : trigger;
      if (t.signal >= thresh) zoneConfirmed.add(zid);
    }

    // Update per-zone state machine
    const occupancy: Record<number, boolean> = {};
    // Ensure all zones with cells are tracked
    const allZoneIds = new Set<number>();
    for (let i = 0; i < this._grid.length; i++) {
      if (cellIsInside(this._grid[i])) allZoneIds.add(cellZone(this._grid[i]));
    }
    for (const zid of allZoneIds) {
      let st = this._localZoneState.get(zid);
      if (!st) { st = { occupied: false, pendingSince: null }; this._localZoneState.set(zid, st); }
      const { timeout } = this._getZoneThresholds(zid);
      const confirmed = zoneConfirmed.has(zid);

      if (!st.occupied) {
        // CLEAR
        if (confirmed) { st.occupied = true; st.pendingSince = null; }
      } else if (st.pendingSince === null) {
        // OCCUPIED
        if (!confirmed) { st.pendingSince = now; }
      } else {
        // PENDING
        if (confirmed) { st.pendingSince = null; }
        else if (now - st.pendingSince >= timeout) { st.occupied = false; st.pendingSince = null; }
      }
      occupancy[zid] = st.occupied;
    }

    const cells = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const idx = r * GRID_COLS + c;
        const cellVal = this._grid[idx];
        let bg = this._getCellColor(idx);
        let border = "";
        if (cellIsInside(cellVal)) {
          const zoneId = cellZone(cellVal);
          if (heatmap) {
            const overlay = heatmap.get(zoneId);
            if (overlay) {
              bg = `linear-gradient(${overlay}, ${overlay}), linear-gradient(${bg}, ${bg})`;
            }
          }
          if (occupancy[zoneId]) {
            // Zone is occupied — show coloured border
            border = `filter: brightness(1.15);`;
          }
        }
        cells.push(html`
          <div
            class="cell"
            style="background: ${bg}; width: ${cellPx}px; height: ${cellPx}px; ${border}"
            @mousedown=${() => this._onCellMouseDown(idx)}
            @mouseenter=${() => this._onCellMouseEnter(idx)}
          ></div>
        `);
      }
    }
    return cells;
  }

  /** Compute rgba overlay colour per zone based on hit counts. */
  private _computeHeatmapColors(): Map<number, string> {
    const zs = this._zoneState;
    const result = new Map<number, string>();
    for (const [zoneIdStr, hitCount] of Object.entries(zs.target_counts)) {
      const zoneId = Number(zoneIdStr);
      if (hitCount <= 0) continue;
      const signal = Math.min(hitCount, 9);
      const opacity = signal / 9 * 0.6;
      let r = 100, g = 180, b = 255; // zone 0 default blue
      if (zoneId > 0 && zoneId <= MAX_ZONES) {
        const config = this._zoneConfigs[zoneId - 1];
        if (config) {
          const hex = config.color;
          r = parseInt(hex.slice(1, 3), 16);
          g = parseInt(hex.slice(3, 5), 16);
          b = parseInt(hex.slice(5, 7), 16);
        }
      }
      result.set(zoneId, `rgba(${r}, ${g}, ${b}, ${opacity})`);
    }
    return result;
  }

  /** Get trigger/sustain/timeout for a zone from the current editor state. */
  private _getZoneThresholds(zid: number): { trigger: number; sustain: number; timeout: number } {
    if (zid === 0) {
      const d = ZONE_TYPE_DEFAULTS[this._roomType] || ZONE_TYPE_DEFAULTS.normal;
      return this._roomType === "custom"
        ? { trigger: this._roomTrigger, sustain: this._roomSustain, timeout: this._roomTimeout }
        : { trigger: d.trigger, sustain: d.sustain, timeout: d.timeout };
    }
    if (zid > 0 && zid <= MAX_ZONES) {
      const cfg = this._zoneConfigs[zid - 1];
      if (cfg) {
        const d = ZONE_TYPE_DEFAULTS[cfg.type] || ZONE_TYPE_DEFAULTS.normal;
        return cfg.type === "custom"
          ? { trigger: cfg.trigger ?? d.trigger, sustain: cfg.sustain ?? d.sustain, timeout: cfg.timeout ?? d.timeout }
          : { trigger: d.trigger, sustain: d.sustain, timeout: d.timeout };
      }
    }
    return { trigger: 5, sustain: 3, timeout: 10 };
  }

  private _renderBoundaryTypeControls() {
    const isCustom = this._roomType === "custom";
    const defaults = ZONE_TYPE_DEFAULTS[this._roomType] || ZONE_TYPE_DEFAULTS.normal;
    const trigger = isCustom ? this._roomTrigger : defaults.trigger;
    const sustain = isCustom ? this._roomSustain : defaults.sustain;
    const timeout = isCustom ? this._roomTimeout : defaults.timeout;
    const rowStyle = `width: 100%; display: flex; align-items: center; gap: 4px; font-size: 12px; opacity: ${isCustom ? 1 : 0.5};`;
    return html`
      <div class="zone-item-row zone-settings-row" style="flex-wrap: wrap; gap: 3px; padding: 4px 8px;">
        <div style="width: 100%; display: flex; align-items: center; gap: 4px;">
          <label style="width: 50px; flex-shrink: 0; font-size: 12px;">Type</label>
          <select
            class="sensitivity-select" style="flex: 1; min-width: 0;"
            .value=${this._roomType}
            @change=${(e: Event) => {
              const val = (e.target as HTMLSelectElement).value as ZoneConfig["type"];
              const d = ZONE_TYPE_DEFAULTS[val] || ZONE_TYPE_DEFAULTS.normal;
              this._roomType = val;
              this._roomTrigger = d.trigger;
              this._roomSustain = d.sustain;
              this._roomTimeout = d.timeout;
              this._dirty = true;
            }}
            @click=${(e: Event) => e.stopPropagation()}
          >
            <option value="normal">Normal</option>
            <option value="entrance">Entrance</option>
            <option value="thoroughfare">Thoroughfare</option>
            <option value="rest">Rest area</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div style="${rowStyle}">
          <label style="width: 50px; flex-shrink: 0;">Trigger</label>
          <input type="range" min="1" max="9" style="flex: 1; min-width: 0;" .value=${String(trigger)} ?disabled=${!isCustom}
            @input=${(e: Event) => { this._roomTrigger = Number((e.target as HTMLInputElement).value); this._dirty = true; }}
            @click=${(e: Event) => e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0;">${trigger}</span>
        </div>
        <div style="${rowStyle}">
          <label style="width: 50px; flex-shrink: 0;">Sustain</label>
          <input type="range" min="1" max="9" style="flex: 1; min-width: 0;" .value=${String(sustain)} ?disabled=${!isCustom}
            @input=${(e: Event) => { this._roomSustain = Number((e.target as HTMLInputElement).value); this._dirty = true; }}
            @click=${(e: Event) => e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0;">${sustain}</span>
        </div>
        <div style="${rowStyle}">
          <label style="width: 50px; flex-shrink: 0;">Timeout</label>
          <span style="flex: 1;"></span>
          <input type="number" min="1" max="300" style="width: 48px; text-align: right; font: inherit; font-size: 12px;" .value=${String(timeout)} ?disabled=${!isCustom}
            @input=${(e: Event) => { const v = Number((e.target as HTMLInputElement).value); if (v > 0) { this._roomTimeout = v; this._dirty = true; } }}
            @click=${(e: Event) => e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0; font-size: 12px;">s</span>
        </div>
      </div>
    `;
  }

  private _renderZoneTypeControls(zone: ZoneConfig, index: number) {
    const isCustom = zone.type === "custom";
    const defaults = ZONE_TYPE_DEFAULTS[zone.type] || ZONE_TYPE_DEFAULTS.normal;
    const trigger = zone.trigger ?? defaults.trigger;
    const sustain = zone.sustain ?? defaults.sustain;
    const timeout = zone.timeout ?? defaults.timeout;
    const rowStyle = `width: 100%; display: flex; align-items: center; gap: 4px; font-size: 12px; opacity: ${isCustom ? 1 : 0.5};`;
    return html`
      <div class="zone-item-row zone-settings-row" style="flex-wrap: wrap; gap: 3px; padding: 4px 8px;">
        <div style="width: 100%; display: flex; align-items: center; gap: 4px;">
          <label style="width: 50px; flex-shrink: 0; font-size: 12px;">Type</label>
          <select
            class="sensitivity-select" style="flex: 1; min-width: 0;"
            .value=${zone.type}
            @change=${(e: Event) => {
              const val = (e.target as HTMLSelectElement).value as ZoneConfig["type"];
              const d = ZONE_TYPE_DEFAULTS[val] || ZONE_TYPE_DEFAULTS.normal;
              const configs = [...this._zoneConfigs];
              configs[index] = { ...zone, type: val, trigger: d.trigger, sustain: d.sustain, timeout: d.timeout };
              this._zoneConfigs = configs;
              this._dirty = true;
            }}
            @click=${(e: Event) => e.stopPropagation()}
          >
            <option value="normal">Normal</option>
            <option value="entrance">Entrance</option>
            <option value="thoroughfare">Thoroughfare</option>
            <option value="rest">Rest area</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div style="${rowStyle}">
          <label style="width: 50px; flex-shrink: 0;">Trigger</label>
          <input type="range" min="1" max="9" style="flex: 1; min-width: 0;" .value=${String(trigger)} ?disabled=${!isCustom}
            @input=${(e: Event) => { const configs = [...this._zoneConfigs]; configs[index] = { ...zone, trigger: Number((e.target as HTMLInputElement).value) }; this._zoneConfigs = configs; this._dirty = true; }}
            @click=${(e: Event) => e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0;">${trigger}</span>
        </div>
        <div style="${rowStyle}">
          <label style="width: 50px; flex-shrink: 0;">Sustain</label>
          <input type="range" min="1" max="9" style="flex: 1; min-width: 0;" .value=${String(sustain)} ?disabled=${!isCustom}
            @input=${(e: Event) => { const configs = [...this._zoneConfigs]; configs[index] = { ...zone, sustain: Number((e.target as HTMLInputElement).value) }; this._zoneConfigs = configs; this._dirty = true; }}
            @click=${(e: Event) => e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0;">${sustain}</span>
        </div>
        <div style="${rowStyle}">
          <label style="width: 50px; flex-shrink: 0;">Timeout</label>
          <span style="flex: 1;"></span>
          <input type="number" min="1" max="300" style="width: 48px; text-align: right; font: inherit; font-size: 12px; margin-right: 0;" .value=${String(timeout)} ?disabled=${!isCustom}
            @input=${(e: Event) => { const v = Number((e.target as HTMLInputElement).value); if (v > 0) { const configs = [...this._zoneConfigs]; configs[index] = { ...zone, timeout: v }; this._zoneConfigs = configs; this._dirty = true; } }}
            @click=${(e: Event) => e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0; font-size: 12px;">s</span>
        </div>
      </div>
    `;
  }

  private _renderZoneSidebar() {
    return html`
      <!-- Boundary -->
      <div
        class="zone-item ${this._activeZone === 0 ? "active" : ""}"
        @click=${() => { this._activeZone = 0; }}
      >
        <div class="zone-item-row">
          <div class="zone-color-dot" style="background: #fff; border: 1px solid #ccc;${this._localZoneState.get(0)?.occupied ? ' box-shadow: 0 0 6px 2px #4CAF50;' : ''}"></div>
          <span class="zone-name">Boundary</span>
        </div>
        ${this._activeZone === 0 ? html`
          ${this._renderBoundaryTypeControls()}
        ` : nothing}
      </div>

      <hr class="zone-separator"/>
      <div class="zone-scroll-area">
      <!-- Named zones 1..N -->
      ${this._zoneConfigs.map((zone, i) => {
        if (zone === null) return nothing;
        const slot = i + 1;
        return html`
          <div
            class="zone-item ${this._activeZone === slot ? "active" : ""}"
            @click=${() => { this._activeZone = slot; }}
          >
            <div class="zone-item-row">
              ${this._activeZone === slot ? html`
                <input
                  type="color"
                  class="zone-color-picker"
                  style="width: 16px; height: 16px; border-radius: 50%;${this._localZoneState.get(slot)?.occupied ? ' box-shadow: 0 0 6px 2px #4CAF50;' : ''}"
                  .value=${zone.color}
                  @input=${(e: Event) => {
                    const val = (e.target as HTMLInputElement).value;
                    const configs = [...this._zoneConfigs];
                    configs[i] = { ...zone, color: val };
                    this._zoneConfigs = configs;
                    this._dirty = true;
                  }}
                  @click=${(e: Event) => e.stopPropagation()}
                />
              ` : html`
                <div class="zone-color-dot" style="background: ${zone.color};${this._localZoneState.get(slot)?.occupied ? ' box-shadow: 0 0 6px 2px #4CAF50;' : ''}"></div>
              `}
              <input
                class="zone-name-input"
                type="text"
                .value=${zone.name}
                @input=${(e: Event) => {
                  const val = (e.target as HTMLInputElement).value;
                  const configs = [...this._zoneConfigs];
                  configs[i] = { ...zone, name: val };
                  this._zoneConfigs = configs;
                }}
                @click=${(e: Event) => { e.stopPropagation(); this._activeZone = slot; }}
                @focus=${() => { this._activeZone = slot; }}
              />
              <button
                class="zone-remove-btn"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._removeZone(slot);
                }}
              >
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
            ${this._activeZone === slot ? html`
              ${this._renderZoneTypeControls(zone, i)}
            ` : nothing}
          </div>
        `;
      })}

      ${this._zoneConfigs.some((z) => z === null)
        ? html`
          <button class="add-zone-btn" @click=${this._addZone}>
            <ha-icon icon="mdi:plus"></ha-icon>
            Add zone
          </button>
        `
        : nothing}
      </div>
    `;
  }

  private _renderFurnitureOverlay(
    cellPx: number, minCol: number, minRow: number,
    visCols: number, visRows: number,
  ) {
    if (!this._furniture.length) return nothing;

    // Room starts at startCol in the grid
    const roomCols = Math.ceil(this._roomWidth / GRID_CELL_MM);
    const startCol = Math.floor((GRID_COLS - roomCols) / 2);
    const step = cellPx + 1; // px per cell including gap

    const interactive = this._sidebarTab === "furniture";
    return html`
      <div class="furniture-overlay ${interactive ? "" : "non-interactive"}">
        ${this._furniture.map((item) => {
          // Convert mm to grid-relative px, then adjust for visible bounds
          const leftPx = (startCol - minCol) * step + this._mmToPx(item.x, cellPx);
          const topPx = (0 - minRow) * step + this._mmToPx(item.y, cellPx);
          const wPx = this._mmToPx(item.width, cellPx);
          const hPx = this._mmToPx(item.height, cellPx);
          const selected = this._selectedFurnitureId === item.id;

          return html`
            <div
              class="furniture-item ${selected ? "selected" : ""}"
              data-id="${item.id}"
              style="
                left: ${leftPx}px; top: ${topPx}px;
                width: ${wPx}px; height: ${hPx}px;
                transform: rotate(${item.rotation}deg);
              "
              @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "move")}
            >
              ${item.type === "svg" && FLOOR_PLAN_SVGS[item.icon]
                ? svg`<svg viewBox="${FLOOR_PLAN_SVGS[item.icon].viewBox}" preserveAspectRatio="none" class="furn-svg">
                    ${unsafeSVG(FLOOR_PLAN_SVGS[item.icon].content)}
                  </svg>`
                : html`<ha-icon icon="${item.icon}" style="--mdc-icon-size: ${Math.min(wPx, hPx) * 0.6}px;"></ha-icon>`
              }
              ${selected ? html`
                <!-- Resize handles -->
                <div class="furn-handle furn-handle-n" @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "resize", "n")}></div>
                <div class="furn-handle furn-handle-s" @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "resize", "s")}></div>
                <div class="furn-handle furn-handle-e" @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "resize", "e")}></div>
                <div class="furn-handle furn-handle-w" @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "resize", "w")}></div>
                <div class="furn-handle furn-handle-ne" @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "resize", "ne")}></div>
                <div class="furn-handle furn-handle-nw" @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "resize", "nw")}></div>
                <div class="furn-handle furn-handle-se" @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "resize", "se")}></div>
                <div class="furn-handle furn-handle-sw" @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "resize", "sw")}></div>
                <!-- Rotate handle with stem -->
                <div class="furn-rotate-stem"></div>
                <div class="furn-rotate-handle" @pointerdown=${(e: PointerEvent) => this._onFurniturePointerDown(e, item.id, "rotate")}>
                  <ha-icon icon="mdi:rotate-right" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
                <!-- Delete button -->
                <div class="furn-delete-btn" @pointerdown=${(e: PointerEvent) => { e.stopPropagation(); this._removeFurniture(item.id); }}>
                  <ha-icon icon="mdi:close" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
              ` : nothing}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderLiveSidebar() {
    const ss = this._sensorState;
    const zs = this._zoneState;

    const sensorDefs: { id: string; label: string; on: boolean; info: string }[] = [
      {
        id: "occupancy",
        label: "Occupancy",
        on: ss.occupancy,
        info: "Combined occupancy from all sources — PIR motion, static mmWave presence, and zone tracking. Shows detected if any source detects presence.",
      },
      {
        id: "static",
        label: "Static presence",
        on: ss.static_presence,
        info: "mmWave radar detects stationary people by measuring micro-movements like breathing. Works through furniture and blankets.",
      },
      {
        id: "motion",
        label: "PIR motion",
        on: ss.pir_motion,
        info: "Passive infrared sensor detects movement by sensing body heat. Fast response but only triggers on motion, not stationary presence.",
      },
    ];

    // Add zone occupancy entries for configured zones
    for (let i = 0; i < MAX_ZONES; i++) {
      const zone = this._zoneConfigs[i];
      if (!zone) continue;
      const slot = i + 1;
      const occupied = zs.occupancy[slot] ?? false;
      const count = zs.target_counts[slot] ?? 0;
      sensorDefs.push({
        id: `zone_${slot}`,
        label: zone.name,
        on: occupied,
        info: `Zone ${slot} occupancy. Currently ${count} target${count !== 1 ? "s" : ""} detected. Sensitivity determines how many consecutive frames are needed to confirm presence.`,
      });
    }

    // Environment sensors
    const envSensors: { id: string; label: string; value: string }[] = [];
    if (ss.illuminance !== null) envSensors.push({ id: "illuminance", label: "Illuminance", value: `${ss.illuminance.toFixed(1)} lux` });
    if (ss.temperature !== null) envSensors.push({ id: "temperature", label: "Temperature", value: `${ss.temperature.toFixed(1)} °C` });
    if (ss.humidity !== null) envSensors.push({ id: "humidity", label: "Humidity", value: `${ss.humidity.toFixed(1)} %` });
    if (ss.co2 !== null) envSensors.push({ id: "co2", label: "CO₂", value: `${Math.round(ss.co2)} ppm` });

    const hasZones = sensorDefs.length > 3;

    return html`
      <div style="padding: 8px 0;">
        <div class="live-section-header">Presence</div>
        ${sensorDefs.slice(0, 3).map((s) => html`
          <div class="live-sensor-row">
            <div class="live-sensor-dot ${s.on ? "on" : "off"}"></div>
            <span class="live-sensor-label">${s.label}</span>
            <span class="live-sensor-state ${s.on ? "detected" : ""}">${s.on ? "Detected" : "Clear"}</span>
            <button class="live-sensor-info-btn"
              @click=${() => { this._expandedSensorInfo = this._expandedSensorInfo === s.id ? null : s.id; }}
            >
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 16px;"></ha-icon>
            </button>
          </div>
          ${this._expandedSensorInfo === s.id ? html`
            <div class="live-sensor-info-text">${s.info}</div>
          ` : nothing}
        `)}

        <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 10px 12px;"/>

        <button class="live-section-header live-section-link" @click=${() => { this._view = "editor"; this._sidebarTab = "zones"; }}>Detection zones</button>
        ${hasZones ? sensorDefs.slice(3).map((s) => html`
          <div class="live-sensor-row">
            <div class="live-sensor-dot ${s.on ? "on" : "off"}"></div>
            <span class="live-sensor-label">${s.label}</span>
            <span class="live-sensor-state ${s.on ? "detected" : ""}">${s.on ? "Detected" : "Clear"}</span>
            <button class="live-sensor-info-btn"
              @click=${() => { this._expandedSensorInfo = this._expandedSensorInfo === s.id ? null : s.id; }}
            >
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 16px;"></ha-icon>
            </button>
          </div>
          ${this._expandedSensorInfo === s.id ? html`
            <div class="live-sensor-info-text">${s.info}</div>
          ` : nothing}
        `) : html`
          <button class="live-nav-link" style="padding: 4px 12px;" @click=${() => { this._view = "editor"; this._sidebarTab = "zones"; }}>
            <ha-icon icon="mdi:plus" style="--mdc-icon-size: 16px;"></ha-icon>
            Add zones
          </button>
        `}

        <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 10px 12px;"/>

        ${envSensors.length ? html`
          <div class="live-section-header">Environment</div>
          ${envSensors.map((s) => html`
            <div class="live-sensor-row">
              <span class="live-sensor-label">${s.label}</span>
              <span class="live-sensor-value">${s.value}</span>
            </div>
          `)}
        ` : nothing}

      </div>
    `;
  }

  private _renderFurnitureSidebar() {
    const selected = this._furniture.find((f) => f.id === this._selectedFurnitureId);

    return html`
      ${selected ? html`
        <div class="furn-selected-info">
          <div class="zone-item-row">
            <ha-icon icon="${selected.icon}" style="--mdc-icon-size: 20px;"></ha-icon>
            <strong>${selected.label}</strong>
            <button class="zone-remove-btn" @click=${() => this._removeFurniture(selected.id)}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="furn-dims">
            <label>
              W (mm)
              <input type="number" min="100" step="50" .value=${String(Math.round(selected.width))}
                @change=${(e: Event) => this._updateFurniture(selected.id, { width: parseInt((e.target as HTMLInputElement).value) })}
              />
            </label>
            <label>
              H (mm)
              <input type="number" min="100" step="50" .value=${String(Math.round(selected.height))}
                @change=${(e: Event) => this._updateFurniture(selected.id, { height: parseInt((e.target as HTMLInputElement).value) })}
              />
            </label>
            <label>
              Rot
              <input type="number" step="5" .value=${String(Math.round(selected.rotation))}
                @change=${(e: Event) => this._updateFurniture(selected.id, { rotation: parseInt((e.target as HTMLInputElement).value) % 360 })}
              />
            </label>
          </div>
        </div>
      ` : nothing}

      <div class="furn-catalog">
        ${FURNITURE_CATALOG.map((s) => html`
          <button class="furn-sticker" @click=${() => this._addFurniture(s)}>
            ${s.type === "svg" && FLOOR_PLAN_SVGS[s.icon]
              ? svg`<svg viewBox="${FLOOR_PLAN_SVGS[s.icon].viewBox}" class="furn-sticker-svg">
                  ${unsafeSVG(FLOOR_PLAN_SVGS[s.icon].content)}
                </svg>`
              : html`<ha-icon icon="${s.icon}" style="--mdc-icon-size: 24px;"></ha-icon>`
            }
            <span>${s.label}</span>
          </button>
        `)}
        <button class="furn-sticker furn-custom" @click=${() => { this._showCustomIconPicker = !this._showCustomIconPicker; }}>
          <ha-icon icon="mdi:plus" style="--mdc-icon-size: 24px;"></ha-icon>
          <span>Custom icon</span>
        </button>
      </div>
      ${this._showCustomIconPicker ? html`
        <div class="template-dialog">
          <div class="template-dialog-card">
            <h3>Custom icon</h3>
            <ha-icon-picker
              .hass=${this.hass}
              .value=${this._customIconValue}
              @value-changed=${(e: CustomEvent) => {
                this._customIconValue = e.detail.value || "";
              }}
            ></ha-icon-picker>
            ${this._customIconValue.trim() ? html`
              <div style="text-align: center;">
                <ha-icon icon="${this._customIconValue.trim()}" style="--mdc-icon-size: 48px;"></ha-icon>
              </div>
            ` : nothing}
            <div class="template-dialog-actions">
              <button class="wizard-btn wizard-btn-back"
                @click=${() => { this._showCustomIconPicker = false; this._customIconValue = ""; }}
              >Cancel</button>
              <button class="wizard-btn wizard-btn-primary"
                ?disabled=${!this._customIconValue.trim()}
                @click=${() => {
                  this._addCustomFurniture(this._customIconValue.trim());
                  this._customIconValue = "";
                  this._showCustomIconPicker = false;
                }}
              >Add</button>
            </div>
          </div>
        </div>
      ` : nothing}
    `;
  }
}

if (!customElements.get("everything-presence-pro-panel")) {
  customElements.define("everything-presence-pro-panel", EverythingPresenceProPanel);
}

declare global {
  interface HTMLElementTagNameMap {
    "everything-presence-pro-panel": EverythingPresenceProPanel;
  }
}

import type { FurnitureItem } from "./furniture.js";
import { GRID_CELL_COUNT, initGridFromRoom, MAX_ZONES } from "./grid.js";
import {
	ZONE_COLORS,
	ZONE_TYPE_DEFAULTS,
	type ZoneConfig,
} from "./zone-defaults.js";

/**
 * Parsed calibration data from config.
 */
export interface ParsedCalibration {
	perspective: number[] | null;
	roomWidth: number;
	roomDepth: number;
}

/**
 * Parsed room thresholds (room-level zone settings).
 */
export interface ParsedRoomThresholds {
	roomType: ZoneConfig["type"];
	roomTrigger: number;
	roomRenew: number;
	roomTimeout: number;
	roomHandoffTimeout: number;
	roomEntryPoint: boolean;
}

/**
 * Full parsed config result — pure data, no side effects.
 */
export interface ParsedConfig {
	calibration: ParsedCalibration;
	furniture: FurnitureItem[];
	grid: Uint8Array;
	zoneConfigs: (ZoneConfig | null)[];
	roomThresholds: ParsedRoomThresholds;
	reportingConfig: Record<string, unknown>;
	offsetsConfig: Record<string, unknown>;
}

/**
 * Parse calibration from raw config object.
 *
 * @param config Raw config object from backend
 * @returns Parsed calibration data
 */
export function parseCalibration(config: any): ParsedCalibration {
	const cal = config?.calibration;
	if (cal?.perspective && cal.room_width > 0) {
		return {
			perspective: cal.perspective,
			roomWidth: cal.room_width || 0,
			roomDepth: cal.room_depth || 0,
		};
	}
	return { perspective: null, roomWidth: 0, roomDepth: 0 };
}

/**
 * Parse furniture items from raw layout data, applying defaults for missing fields.
 *
 * @param rawFurniture Raw furniture array from layout
 * @returns Parsed furniture items with all fields filled
 */
export function parseFurniture(rawFurniture: any[]): FurnitureItem[] {
	return (rawFurniture || []).map((f: any, i: number) => ({
		id: f.id || `f_load_${i}`,
		type: f.type || "icon",
		icon: f.icon || "mdi:help",
		label: f.label || "Item",
		x: f.x ?? 0,
		y: f.y ?? 0,
		width: f.width ?? 600,
		height: f.height ?? 600,
		rotation: f.rotation ?? 0,
		lockAspect: f.lockAspect ?? f.type !== "svg",
	}));
}

/**
 * Parse the grid from layout data, or initialize from room dimensions.
 *
 * @param layout Raw layout object
 * @param roomWidth Room width in mm
 * @param roomDepth Room depth in mm
 * @returns The grid Uint8Array
 */
export function parseGrid(
	layout: any,
	roomWidth: number,
	roomDepth: number,
): Uint8Array {
	if (layout?.grid_bytes && Array.isArray(layout.grid_bytes)) {
		return new Uint8Array(layout.grid_bytes);
	}
	if (roomWidth > 0 && roomDepth > 0) {
		return initGridFromRoom(roomWidth, roomDepth);
	}
	return new Uint8Array(GRID_CELL_COUNT);
}

/**
 * Parse zone configurations from layout data, applying defaults.
 *
 * @param layout Raw layout object (should contain zone_slots or zones array)
 * @returns Array of MAX_ZONES zone configs (null for empty slots)
 */
export function parseZoneConfigs(layout: any): (ZoneConfig | null)[] {
	const slots = layout?.zone_slots || layout?.zones || [];
	return Array.from({ length: MAX_ZONES }, (_, i) => {
		const z = slots[i];
		if (!z) return null;
		return {
			name: z.name || `Zone ${i + 1}`,
			color: z.color || ZONE_COLORS[i % ZONE_COLORS.length],
			type: z.type ?? "normal",
			trigger: z.trigger,
			renew: z.renew,
			timeout: z.timeout,
			handoff_timeout: z.handoff_timeout,
			entry_point: z.entry_point ?? false,
		};
	});
}

/**
 * Parse room-level threshold settings from layout data.
 *
 * @param layout Raw layout object
 * @returns Parsed room thresholds with defaults applied
 */
export function parseRoomThresholds(layout: any): ParsedRoomThresholds {
	const roomType: ZoneConfig["type"] = layout?.room_type ?? "normal";
	const defaults = ZONE_TYPE_DEFAULTS[roomType] ?? ZONE_TYPE_DEFAULTS.normal;
	return {
		roomType,
		roomTrigger: layout?.room_trigger ?? defaults?.trigger ?? 5,
		roomRenew: layout?.room_renew ?? defaults?.renew ?? 3,
		roomTimeout: layout?.room_timeout ?? defaults?.timeout ?? 10,
		roomHandoffTimeout:
			layout?.room_handoff_timeout ?? defaults?.handoff_timeout ?? 3,
		roomEntryPoint: layout?.room_entry_point ?? false,
	};
}

/**
 * Parse the full config object into structured data.
 * This is a pure function: no side effects, no DOM, no `this`.
 *
 * @param config Raw config from the backend
 * @returns ParsedConfig with all fields populated
 */
export function parseConfig(config: any): ParsedConfig {
	const calibration = parseCalibration(config);
	const layout = config?.room_layout || {};

	const furniture = parseFurniture(layout.furniture);
	const grid = parseGrid(layout, calibration.roomWidth, calibration.roomDepth);
	const zoneConfigs = parseZoneConfigs(layout);
	const roomThresholds = parseRoomThresholds(layout);

	return {
		calibration,
		furniture,
		grid,
		zoneConfigs,
		roomThresholds,
		reportingConfig: config?.reporting || {},
		offsetsConfig: config?.offsets || {},
	};
}

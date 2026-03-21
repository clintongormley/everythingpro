import { cellIsInside, cellZone, MAX_ZONES } from "./grid.js";
import type { ZoneConfig } from "./zone-defaults.js";

/**
 * CSS color strings for grid cells.
 */
export const CELL_COLOR_OUTSIDE = "var(--secondary-background-color, #e0e0e0)";
export const CELL_COLOR_ROOM = "var(--card-background-color, #fff)";

/**
 * Get the CSS color for a grid cell.
 *
 * - Outside cells: secondary background color
 * - Zone 0 (room default): card background color
 * - Zone 1-7: the zone's configured color
 *
 * @param cellValue The cell byte value from the grid
 * @param zoneConfigs Array of zone configurations
 * @returns CSS color string
 */
export function getCellColor(
	cellValue: number,
	zoneConfigs: (ZoneConfig | null)[],
): string {
	if (!cellIsInside(cellValue)) return CELL_COLOR_OUTSIDE;

	const zone = cellZone(cellValue);
	if (zone > 0 && zone <= MAX_ZONES) {
		const config = zoneConfigs[zone - 1];
		if (config) return config.color;
	}
	return CELL_COLOR_ROOM;
}

/**
 * Parse a hex color string (#RRGGBB) into RGB components.
 *
 * @param hex Color string like "#E69F00"
 * @returns { r, g, b } with values 0-255
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	return {
		r: parseInt(hex.slice(1, 3), 16),
		g: parseInt(hex.slice(3, 5), 16),
		b: parseInt(hex.slice(5, 7), 16),
	};
}

/**
 * Compute rgba overlay colour per zone based on hit counts (target_counts).
 *
 * The opacity scales linearly from 0 to 0.6 based on the hit count (capped at 9).
 * Zone 0 uses a blue default; zones 1-7 use their configured color.
 *
 * @param targetCounts Map of zone ID (as string keys) to hit counts
 * @param zoneConfigs Array of zone configurations
 * @returns Map of zone ID → CSS rgba color string
 */
export function computeHeatmapColors(
	targetCounts: Record<string, number>,
	zoneConfigs: (ZoneConfig | null)[],
): Map<number, string> {
	const result = new Map<number, string>();

	for (const [zoneIdStr, hitCount] of Object.entries(targetCounts)) {
		const zoneId = Number(zoneIdStr);
		if (hitCount <= 0) continue;

		const signal = Math.min(hitCount, 9);
		const opacity = (signal / 9) * 0.6;

		let r = 100,
			g = 180,
			b = 255; // zone 0 default blue

		if (zoneId > 0 && zoneId <= MAX_ZONES) {
			const config = zoneConfigs[zoneId - 1];
			if (config) {
				const rgb = hexToRgb(config.color);
				r = rgb.r;
				g = rgb.g;
				b = rgb.b;
			}
		}

		result.set(zoneId, `rgba(${r}, ${g}, ${b}, ${opacity})`);
	}

	return result;
}

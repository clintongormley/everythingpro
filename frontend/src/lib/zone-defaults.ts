export interface ZoneConfig {
	name: string;
	color: string;
	type: "normal" | "entrance" | "thoroughfare" | "rest" | "custom";
	trigger?: number; // 0-9 threshold, 0=disabled, higher=harder
	renew?: number; // 0-9 threshold, 0=disabled, higher=harder
	timeout?: number; // seconds, if undefined use type default
	handoff_timeout?: number; // seconds, time for zone to clear after target leaves
	entry_point?: boolean;
}

export const ZONE_TYPE_DEFAULTS: Record<
	string,
	{ trigger: number; renew: number; timeout: number; handoff_timeout: number }
> = {
	normal: { trigger: 5, renew: 3, timeout: 10, handoff_timeout: 3 },
	entrance: { trigger: 3, renew: 2, timeout: 5, handoff_timeout: 1 },
	thoroughfare: { trigger: 3, renew: 2, timeout: 3, handoff_timeout: 1 },
	rest: { trigger: 7, renew: 1, timeout: 30, handoff_timeout: 10 },
};

// Color-blind-friendly palette (distinguishable across protanopia, deuteranopia, tritanopia)
export const ZONE_COLORS = [
	"#E69F00", // orange
	"#56B4E9", // sky blue
	"#009E73", // bluish green
	"#F0E442", // yellow
	"#0072B2", // blue
	"#D55E00", // vermillion
	"#CC79A7", // reddish purple
];

export interface ZoneThresholds {
	trigger: number;
	renew: number;
	timeout: number;
	handoffTimeout: number;
	entryPoint: boolean;
}

/**
 * Get trigger/renew/timeout for a zone from the current editor state.
 *
 * - zid === 0: room boundary (uses roomType/roomTrigger/roomRenew/roomTimeout/etc.)
 * - zid 1-7: named zone (uses zone config)
 */
export function getZoneThresholds(
	zid: number,
	zoneConfigs: (ZoneConfig | null)[],
	roomType: ZoneConfig["type"],
	roomTrigger: number,
	roomRenew: number,
	roomTimeout: number,
	roomHandoffTimeout: number,
	roomEntryPoint: boolean,
): ZoneThresholds {
	if (zid === 0) {
		const d = ZONE_TYPE_DEFAULTS[roomType] || ZONE_TYPE_DEFAULTS.normal;
		const isCustom = roomType === "custom";
		return isCustom
			? {
					trigger: roomTrigger,
					renew: roomRenew,
					timeout: roomTimeout,
					handoffTimeout: roomHandoffTimeout,
					entryPoint: roomEntryPoint,
				}
			: {
					trigger: d.trigger,
					renew: d.renew,
					timeout: d.timeout,
					handoffTimeout: d.handoff_timeout,
					entryPoint: false,
				};
	}
	if (zid > 0 && zid <= zoneConfigs.length) {
		const cfg = zoneConfigs[zid - 1];
		if (cfg) {
			const d = ZONE_TYPE_DEFAULTS[cfg.type] || ZONE_TYPE_DEFAULTS.normal;
			const isCustom = cfg.type === "custom";
			return isCustom
				? {
						trigger: cfg.trigger ?? d.trigger,
						renew: cfg.renew ?? d.renew,
						timeout: cfg.timeout ?? d.timeout,
						handoffTimeout: cfg.handoff_timeout ?? d.handoff_timeout,
						entryPoint: cfg.entry_point ?? false,
					}
				: {
						trigger: d.trigger,
						renew: d.renew,
						timeout: d.timeout,
						handoffTimeout: d.handoff_timeout,
						entryPoint: cfg.type === "entrance",
					};
		}
	}
	return {
		trigger: 5,
		renew: 3,
		timeout: 10,
		handoffTimeout: 3,
		entryPoint: false,
	};
}

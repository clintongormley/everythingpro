import { GRID_CELL_MM } from "./grid.js";

export interface FurnitureItem {
	id: string;
	type: "icon" | "svg";
	icon: string;
	label: string;
	x: number; // mm from left edge of room
	y: number; // mm from top edge of room
	width: number; // mm
	height: number; // mm
	rotation: number; // degrees
	lockAspect: boolean;
}

export interface FurnitureSticker {
	type: "icon" | "svg";
	icon: string;
	label: string;
	defaultWidth: number; // mm
	defaultHeight: number; // mm
	lockAspect?: boolean;
}

/**
 * Create a new furniture item from a sticker definition, centered in the room.
 *
 * @param sticker The sticker definition to create from
 * @param roomWidth Room width in mm
 * @param roomDepth Room depth in mm
 * @param id Unique ID for the item (pass a generated ID)
 * @returns A new FurnitureItem
 */
export function createFurnitureItem(
	sticker: FurnitureSticker,
	roomWidth: number,
	roomDepth: number,
	id: string,
): FurnitureItem {
	return {
		id,
		type: sticker.type,
		icon: sticker.icon,
		label: sticker.label,
		x: Math.max(0, (roomWidth - sticker.defaultWidth) / 2),
		y: Math.max(0, (roomDepth - sticker.defaultHeight) / 2),
		width: sticker.defaultWidth,
		height: sticker.defaultHeight,
		rotation: 0,
		lockAspect: sticker.lockAspect ?? sticker.type === "icon",
	};
}

/**
 * Remove a furniture item by ID from the list.
 *
 * @param furniture Current list of furniture items
 * @param id ID of the item to remove
 * @returns New filtered list (does not mutate original)
 */
export function removeFurnitureItem(
	furniture: FurnitureItem[],
	id: string,
): FurnitureItem[] {
	return furniture.filter((f) => f.id !== id);
}

/**
 * Update a furniture item by ID with partial updates.
 *
 * @param furniture Current list of furniture items
 * @param id ID of the item to update
 * @param updates Partial updates to apply
 * @returns New list with updated item (does not mutate original)
 */
export function updateFurnitureItem(
	furniture: FurnitureItem[],
	id: string,
	updates: Partial<FurnitureItem>,
): FurnitureItem[] {
	return furniture.map((f) => (f.id === id ? { ...f, ...updates } : f));
}

/**
 * Convert mm in room-space to px in the visible grid.
 *
 * @param mm Distance in millimetres
 * @param cellPx Width of a grid cell in pixels
 * @returns Distance in pixels
 */
export function mmToPx(mm: number, cellPx: number): number {
	return (mm / GRID_CELL_MM) * (cellPx + 1); // +1 for gap
}

/**
 * Convert px delta back to mm.
 *
 * @param px Distance in pixels
 * @param cellPx Width of a grid cell in pixels
 * @returns Distance in millimetres
 */
export function pxToMm(px: number, cellPx: number): number {
	return (px / (cellPx + 1)) * GRID_CELL_MM;
}

/**
 * Compute clamped move position for a furniture item being dragged.
 *
 * Clamps the position so the item cannot move more than half its size outside
 * the room boundary.
 *
 * @param origX Original X position (mm)
 * @param origY Original Y position (mm)
 * @param dxPx Drag delta X in pixels
 * @param dyPx Drag delta Y in pixels
 * @param cellPx Current cell pixel size
 * @param itemWidth Item width in mm
 * @param itemHeight Item height in mm
 * @param roomWidth Room width in mm
 * @param roomDepth Room depth in mm
 * @returns Clamped { x, y } position in mm
 */
export function clampFurnitureMove(
	origX: number,
	origY: number,
	dxPx: number,
	dyPx: number,
	cellPx: number,
	itemWidth: number,
	itemHeight: number,
	roomWidth: number,
	roomDepth: number,
): { x: number; y: number } {
	const dxMm = pxToMm(dxPx, cellPx);
	const dyMm = pxToMm(dyPx, cellPx);
	return {
		x: Math.max(
			-itemWidth / 2,
			Math.min(roomWidth - itemWidth / 2, origX + dxMm),
		),
		y: Math.max(
			-itemHeight / 2,
			Math.min(roomDepth - itemHeight / 2, origY + dyMm),
		),
	};
}

/**
 * Compute resized dimensions for a furniture item.
 *
 * Supports locked-aspect (uniform) and free-form resize, with per-handle
 * direction control.
 *
 * @param handle Resize handle id (e.g. "ne", "sw", "e", "n")
 * @param dxPx Drag delta X in pixels
 * @param dyPx Drag delta Y in pixels
 * @param cellPx Current cell pixel size
 * @param origX Original X position (mm)
 * @param origY Original Y position (mm)
 * @param origW Original width (mm)
 * @param origH Original height (mm)
 * @param lockAspect Whether to lock the aspect ratio
 * @returns Updated { x, y, width, height }
 */
export function computeFurnitureResize(
	handle: string,
	dxPx: number,
	dyPx: number,
	cellPx: number,
	origX: number,
	origY: number,
	origW: number,
	origH: number,
	lockAspect: boolean,
): { x: number; y: number; width: number; height: number } {
	const dxMm = pxToMm(dxPx, cellPx);
	const dyMm = pxToMm(dyPx, cellPx);
	let x = origX;
	let y = origY;
	let w = origW;
	let h = origH;

	if (lockAspect) {
		// Uniform scale from the dominant axis
		const delta = Math.abs(dxMm) > Math.abs(dyMm) ? dxMm : dyMm;
		const aspect = origW / origH;
		const sign = handle.includes("w") || handle.includes("n") ? -1 : 1;
		w = Math.max(100, origW + sign * delta);
		h = Math.max(100, w / aspect);
		w = h * aspect;
		if (handle.includes("w")) x = origX + (origW - w);
		if (handle.includes("n")) y = origY + (origH - h);
	} else {
		if (handle.includes("e")) w = Math.max(100, w + dxMm);
		if (handle.includes("w")) {
			w = Math.max(100, w - dxMm);
			x = x + dxMm;
		}
		if (handle.includes("s")) h = Math.max(100, h + dyMm);
		if (handle.includes("n")) {
			h = Math.max(100, h - dyMm);
			y = y + dyMm;
		}
	}

	return { x, y, width: w, height: h };
}

/**
 * Compute the new rotation angle for a furniture item being rotated.
 *
 * @param origRotation Original rotation in degrees
 * @param startAngle Angle from item center to pointer at drag start (degrees)
 * @param currentAngle Current angle from item center to pointer (degrees)
 * @returns New rotation angle (0-359 degrees, rounded to integer)
 */
export function computeFurnitureRotation(
	origRotation: number,
	startAngle: number,
	currentAngle: number,
): number {
	const deltaAngle = currentAngle - startAngle;
	return Math.round((origRotation + deltaAngle + 360) % 360);
}

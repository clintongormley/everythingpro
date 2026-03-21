import { describe, expect, it } from "vitest";
import {
	clampFurnitureMove,
	computeFurnitureResize,
	computeFurnitureRotation,
	createFurnitureItem,
	type FurnitureItem,
	type FurnitureSticker,
	mmToPx,
	pxToMm,
	removeFurnitureItem,
	updateFurnitureItem,
} from "../furniture.js";
import { GRID_CELL_MM } from "../grid.js";

const makeItem = (overrides: Partial<FurnitureItem> = {}): FurnitureItem => ({
	id: "f1",
	type: "icon",
	icon: "mdi:sofa",
	label: "Sofa",
	x: 500,
	y: 500,
	width: 600,
	height: 400,
	rotation: 0,
	lockAspect: true,
	...overrides,
});

describe("createFurnitureItem", () => {
	it("creates item centered in the room", () => {
		const sticker: FurnitureSticker = {
			type: "icon",
			icon: "mdi:sofa",
			label: "Sofa",
			defaultWidth: 600,
			defaultHeight: 400,
		};
		const item = createFurnitureItem(sticker, 3000, 4000, "id1");
		expect(item.x).toBe((3000 - 600) / 2); // 1200
		expect(item.y).toBe((4000 - 400) / 2); // 1800
		expect(item.width).toBe(600);
		expect(item.height).toBe(400);
		expect(item.rotation).toBe(0);
		expect(item.id).toBe("id1");
		expect(item.type).toBe("icon");
		expect(item.icon).toBe("mdi:sofa");
		expect(item.label).toBe("Sofa");
	});

	it("clamps position to 0 when item is larger than room", () => {
		const sticker: FurnitureSticker = {
			type: "svg",
			icon: "bed",
			label: "Bed",
			defaultWidth: 4000,
			defaultHeight: 5000,
		};
		const item = createFurnitureItem(sticker, 3000, 4000, "id2");
		expect(item.x).toBe(0); // (3000 - 4000) / 2 = -500, clamped to 0
		expect(item.y).toBe(0); // (4000 - 5000) / 2 = -500, clamped to 0
	});

	it("defaults lockAspect from sticker or type", () => {
		const iconSticker: FurnitureSticker = {
			type: "icon",
			icon: "mdi:lamp",
			label: "Lamp",
			defaultWidth: 300,
			defaultHeight: 300,
		};
		expect(createFurnitureItem(iconSticker, 3000, 3000, "a").lockAspect).toBe(
			true,
		);

		const svgSticker: FurnitureSticker = {
			type: "svg",
			icon: "bed",
			label: "Bed",
			defaultWidth: 300,
			defaultHeight: 300,
		};
		expect(createFurnitureItem(svgSticker, 3000, 3000, "b").lockAspect).toBe(
			false,
		);
	});

	it("uses explicit lockAspect from sticker", () => {
		const sticker: FurnitureSticker = {
			type: "svg",
			icon: "table",
			label: "Table",
			defaultWidth: 300,
			defaultHeight: 300,
			lockAspect: true,
		};
		expect(createFurnitureItem(sticker, 3000, 3000, "c").lockAspect).toBe(true);
	});
});

describe("removeFurnitureItem", () => {
	it("removes item by id", () => {
		const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
		const result = removeFurnitureItem(items, "a");
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("b");
	});

	it("returns same-length list when id not found", () => {
		const items = [makeItem({ id: "a" })];
		const result = removeFurnitureItem(items, "z");
		expect(result).toHaveLength(1);
	});

	it("does not mutate original array", () => {
		const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
		removeFurnitureItem(items, "a");
		expect(items).toHaveLength(2);
	});

	it("handles empty array", () => {
		expect(removeFurnitureItem([], "a")).toEqual([]);
	});
});

describe("updateFurnitureItem", () => {
	it("updates matching item with partial updates", () => {
		const items = [makeItem({ id: "a", x: 100 })];
		const result = updateFurnitureItem(items, "a", { x: 200, y: 300 });
		expect(result[0].x).toBe(200);
		expect(result[0].y).toBe(300);
		expect(result[0].width).toBe(600); // preserved
	});

	it("leaves non-matching items unchanged", () => {
		const items = [makeItem({ id: "a" }), makeItem({ id: "b", x: 999 })];
		const result = updateFurnitureItem(items, "a", { x: 0 });
		expect(result[1].x).toBe(999);
	});

	it("does not mutate original array", () => {
		const items = [makeItem({ id: "a", x: 100 })];
		updateFurnitureItem(items, "a", { x: 999 });
		expect(items[0].x).toBe(100);
	});

	it("returns new array reference", () => {
		const items = [makeItem({ id: "a" })];
		const result = updateFurnitureItem(items, "a", { x: 0 });
		expect(result).not.toBe(items);
	});
});

describe("mmToPx", () => {
	it("converts mm to px accounting for gap", () => {
		// 300mm (1 cell) at cellPx=28 → (300/300)*(28+1) = 29
		expect(mmToPx(300, 28)).toBeCloseTo(29);
	});

	it("returns 0 for 0mm", () => {
		expect(mmToPx(0, 28)).toBe(0);
	});

	it("scales linearly", () => {
		const px1 = mmToPx(600, 28);
		const px2 = mmToPx(300, 28);
		expect(px1).toBeCloseTo(px2 * 2);
	});

	it("uses GRID_CELL_MM for conversion", () => {
		const cellPx = 20;
		const mm = GRID_CELL_MM;
		expect(mmToPx(mm, cellPx)).toBeCloseTo(cellPx + 1);
	});
});

describe("pxToMm", () => {
	it("converts px to mm accounting for gap", () => {
		// 29px at cellPx=28 → (29/(28+1))*300 = 300mm
		expect(pxToMm(29, 28)).toBeCloseTo(300);
	});

	it("returns 0 for 0px", () => {
		expect(pxToMm(0, 28)).toBe(0);
	});

	it("round-trips with mmToPx", () => {
		const mm = 1500;
		const cellPx = 28;
		expect(pxToMm(mmToPx(mm, cellPx), cellPx)).toBeCloseTo(mm);
	});
});

describe("clampFurnitureMove", () => {
	it("returns unclamped position within bounds", () => {
		const result = clampFurnitureMove(500, 500, 0, 0, 28, 600, 400, 3000, 4000);
		expect(result.x).toBe(500);
		expect(result.y).toBe(500);
	});

	it("clamps to minimum -width/2", () => {
		// Large negative drag
		const result = clampFurnitureMove(
			0,
			0,
			-1000,
			-1000,
			28,
			600,
			400,
			3000,
			4000,
		);
		expect(result.x).toBe(-300); // -600/2
		expect(result.y).toBe(-200); // -400/2
	});

	it("clamps to maximum roomWidth - width/2", () => {
		// Large positive drag
		const result = clampFurnitureMove(
			2000,
			3000,
			10000,
			10000,
			28,
			600,
			400,
			3000,
			4000,
		);
		expect(result.x).toBe(2700); // 3000 - 600/2
		expect(result.y).toBe(3800); // 4000 - 400/2
	});

	it("converts pixel delta to mm correctly", () => {
		// Move 29px at cellPx=28 → 300mm
		const result = clampFurnitureMove(0, 0, 29, 29, 28, 100, 100, 6000, 6000);
		expect(result.x).toBeCloseTo(300);
		expect(result.y).toBeCloseTo(300);
	});
});

describe("computeFurnitureResize", () => {
	describe("free-form (lockAspect=false)", () => {
		it("resizes east handle", () => {
			const result = computeFurnitureResize(
				"e",
				29,
				0,
				28,
				0,
				0,
				600,
				400,
				false,
			);
			expect(result.width).toBeCloseTo(900); // 600 + 300
			expect(result.height).toBe(400); // unchanged
			expect(result.x).toBe(0); // unchanged
		});

		it("resizes west handle (moves x)", () => {
			const result = computeFurnitureResize(
				"w",
				29,
				0,
				28,
				500,
				0,
				600,
				400,
				false,
			);
			// w handle: width = max(100, 600 - 300) = 300, x = 500 + 300 = 800
			expect(result.width).toBeCloseTo(300);
			expect(result.x).toBeCloseTo(800);
		});

		it("resizes south handle", () => {
			const result = computeFurnitureResize(
				"s",
				0,
				29,
				28,
				0,
				0,
				600,
				400,
				false,
			);
			expect(result.height).toBeCloseTo(700); // 400 + 300
			expect(result.width).toBe(600); // unchanged
		});

		it("resizes north handle (moves y)", () => {
			const result = computeFurnitureResize(
				"n",
				0,
				29,
				28,
				0,
				500,
				600,
				400,
				false,
			);
			// n handle: height = max(100, 400 - 300) = 100, y = 500 + 300 = 800
			expect(result.height).toBeCloseTo(100);
			expect(result.y).toBeCloseTo(800);
		});

		it("handles diagonal corner (se)", () => {
			const result = computeFurnitureResize(
				"se",
				29,
				29,
				28,
				0,
				0,
				600,
				400,
				false,
			);
			expect(result.width).toBeCloseTo(900); // 600 + 300
			expect(result.height).toBeCloseTo(700); // 400 + 300
		});

		it("enforces minimum size of 100mm", () => {
			const result = computeFurnitureResize(
				"e",
				-10000,
				0,
				28,
				0,
				0,
				600,
				400,
				false,
			);
			expect(result.width).toBe(100);
		});
	});

	describe("locked aspect", () => {
		it("maintains aspect ratio on scale up", () => {
			const result = computeFurnitureResize(
				"se",
				29,
				0,
				28,
				0,
				0,
				600,
				400,
				true,
			);
			const aspect = result.width / result.height;
			expect(aspect).toBeCloseTo(600 / 400, 4);
		});

		it("uses sign -1 for w handle (shrinks)", () => {
			const result = computeFurnitureResize(
				"w",
				29,
				0,
				28,
				500,
				0,
				600,
				400,
				true,
			);
			// sign=-1, delta=~300mm, w = max(100, 600 + (-1)*300) = 300
			// aspect = 600/400 = 1.5, h = max(100, 300/1.5) = 200, w = 200*1.5 = 300
			expect(result.width).toBeCloseTo(300, 0);
			expect(result.height).toBeCloseTo(200, 0);
			// x moves: origX + (origW - w) = 500 + (600 - 300) = 800
			expect(result.x).toBeCloseTo(800, 0);
		});

		it("uses sign -1 for n handle (shrinks)", () => {
			const result = computeFurnitureResize(
				"n",
				0,
				29,
				28,
				0,
				500,
				600,
				400,
				true,
			);
			// y moves when n handle
			expect(result.y).not.toBe(500);
		});

		it("enforces minimum size of 100mm for locked aspect", () => {
			const result = computeFurnitureResize(
				"se",
				-10000,
				0,
				28,
				0,
				0,
				600,
				400,
				true,
			);
			expect(result.width).toBeGreaterThanOrEqual(100);
			expect(result.height).toBeGreaterThanOrEqual(100);
		});
	});
});

describe("computeFurnitureRotation", () => {
	it("computes simple rotation", () => {
		expect(computeFurnitureRotation(0, 0, 45)).toBe(45);
	});

	it("adds delta to original rotation", () => {
		expect(computeFurnitureRotation(90, 10, 30)).toBe(110); // 90 + (30-10)
	});

	it("wraps around 360", () => {
		expect(computeFurnitureRotation(350, 0, 20)).toBe(10); // (350 + 20) % 360
	});

	it("handles negative delta", () => {
		const result = computeFurnitureRotation(10, 30, 0);
		// 10 + (0 - 30) + 360 = 340
		expect(result).toBe(340);
	});

	it("rounds to integer", () => {
		const result = computeFurnitureRotation(0, 0, 45.7);
		expect(result).toBe(46);
	});

	it("returns 0 for full rotation", () => {
		expect(computeFurnitureRotation(0, 0, 360)).toBe(0);
	});
});

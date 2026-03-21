import { describe, expect, it } from "vitest";
import {
	applyPerspective,
	getInversePerspective,
	solvePerspective,
} from "../perspective.js";

describe("solvePerspective", () => {
	it("solves identity mapping (src === dst)", () => {
		const pts = [
			{ x: 0, y: 0 },
			{ x: 1000, y: 0 },
			{ x: 1000, y: 1000 },
			{ x: 0, y: 1000 },
		];
		const h = solvePerspective(pts, pts);
		expect(h).not.toBeNull();
		// For identity: h0=1, h1=0, h2=0, h3=0, h4=1, h5=0, h6=0, h7=0
		expect(h?.[0]).toBeCloseTo(1, 6);
		expect(h?.[1]).toBeCloseTo(0, 6);
		expect(h?.[2]).toBeCloseTo(0, 6);
		expect(h?.[3]).toBeCloseTo(0, 6);
		expect(h?.[4]).toBeCloseTo(1, 6);
		expect(h?.[5]).toBeCloseTo(0, 6);
		expect(h?.[6]).toBeCloseTo(0, 6);
		expect(h?.[7]).toBeCloseTo(0, 6);
	});

	it("solves unit square to scaled rectangle", () => {
		const src = [
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			{ x: 1, y: 1 },
			{ x: 0, y: 1 },
		];
		const dst = [
			{ x: 0, y: 0 },
			{ x: 2000, y: 0 },
			{ x: 2000, y: 3000 },
			{ x: 0, y: 3000 },
		];
		const h = solvePerspective(src, dst);
		expect(h).not.toBeNull();
		if (!h) return;
		// Apply to each source point, should get the destination
		for (let i = 0; i < 4; i++) {
			const result = applyPerspective(h, src[i].x, src[i].y);
			expect(result.x).toBeCloseTo(dst[i].x, 4);
			expect(result.y).toBeCloseTo(dst[i].y, 4);
		}
	});

	it("returns null for collinear/degenerate points", () => {
		// All source points on a line
		const src = [
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			{ x: 2, y: 0 },
			{ x: 3, y: 0 },
		];
		const dst = [
			{ x: 0, y: 0 },
			{ x: 1, y: 1 },
			{ x: 2, y: 2 },
			{ x: 3, y: 3 },
		];
		const h = solvePerspective(src, dst);
		expect(h).toBeNull();
	});

	it("solves a perspective (trapezoidal) transform", () => {
		const src = [
			{ x: -1000, y: 2000 },
			{ x: 1000, y: 2000 },
			{ x: 2000, y: 5000 },
			{ x: -2000, y: 5000 },
		];
		const dst = [
			{ x: 0, y: 0 },
			{ x: 3000, y: 0 },
			{ x: 3000, y: 4000 },
			{ x: 0, y: 4000 },
		];
		const h = solvePerspective(src, dst);
		expect(h).not.toBeNull();
		if (!h) return;
		// Each source point should map to destination
		for (let i = 0; i < 4; i++) {
			const result = applyPerspective(h, src[i].x, src[i].y);
			expect(result.x).toBeCloseTo(dst[i].x, 2);
			expect(result.y).toBeCloseTo(dst[i].y, 2);
		}
	});
});

describe("applyPerspective", () => {
	it("applies identity transform", () => {
		const h = [1, 0, 0, 0, 1, 0, 0, 0];
		const result = applyPerspective(h, 500, 700);
		expect(result.x).toBeCloseTo(500, 6);
		expect(result.y).toBeCloseTo(700, 6);
	});

	it("applies scale+translate transform", () => {
		// h0=2, h1=0, h2=100, h3=0, h4=3, h5=200, h6=0, h7=0
		// rx = (2*x + 0*y + 100)/(1) = 2x+100
		// ry = (0*x + 3*y + 200)/(1) = 3y+200
		const h = [2, 0, 100, 0, 3, 200, 0, 0];
		const result = applyPerspective(h, 10, 20);
		expect(result.x).toBeCloseTo(120, 6);
		expect(result.y).toBeCloseTo(260, 6);
	});

	it("handles origin correctly", () => {
		const h = [1, 2, 3, 4, 5, 6, 0, 0];
		const result = applyPerspective(h, 0, 0);
		expect(result.x).toBeCloseTo(3, 6);
		expect(result.y).toBeCloseTo(6, 6);
	});
});

describe("getInversePerspective", () => {
	it("returns null for null input", () => {
		expect(getInversePerspective(null)).toBeNull();
	});

	it("returns null for short array", () => {
		expect(getInversePerspective([1, 2, 3])).toBeNull();
	});

	it("returns identity inverse for identity transform", () => {
		const h = [1, 0, 0, 0, 1, 0, 0, 0];
		const inv = getInversePerspective(h);
		expect(inv).not.toBeNull();
		expect(inv?.[0]).toBeCloseTo(1, 6);
		expect(inv?.[1]).toBeCloseTo(0, 6);
		expect(inv?.[2]).toBeCloseTo(0, 6);
		expect(inv?.[3]).toBeCloseTo(0, 6);
		expect(inv?.[4]).toBeCloseTo(1, 6);
		expect(inv?.[5]).toBeCloseTo(0, 6);
		expect(inv?.[6]).toBeCloseTo(0, 6);
		expect(inv?.[7]).toBeCloseTo(0, 6);
	});

	it("round-trips: forward then inverse returns original point", () => {
		const src = [
			{ x: 0, y: 0 },
			{ x: 1000, y: 0 },
			{ x: 1000, y: 2000 },
			{ x: 0, y: 2000 },
		];
		const dst = [
			{ x: 100, y: 50 },
			{ x: 2100, y: 50 },
			{ x: 2100, y: 4050 },
			{ x: 100, y: 4050 },
		];
		const h = solvePerspective(src, dst);
		expect(h).not.toBeNull();
		if (!h) return;

		const inv = getInversePerspective(h);
		expect(inv).not.toBeNull();
		if (!inv) return;

		// Forward then inverse round-trip
		const testPt = { x: 500, y: 1000 };
		const fwd = applyPerspective(h, testPt.x, testPt.y);
		const back = applyPerspective(inv, fwd.x, fwd.y);
		expect(back.x).toBeCloseTo(testPt.x, 4);
		expect(back.y).toBeCloseTo(testPt.y, 4);
	});

	it("full solve, apply, inverse, apply round-trip with perspective", () => {
		// A trapezoidal mapping that introduces actual perspective
		const src = [
			{ x: -500, y: 1000 },
			{ x: 500, y: 1000 },
			{ x: 1500, y: 4000 },
			{ x: -1500, y: 4000 },
		];
		const dst = [
			{ x: 0, y: 0 },
			{ x: 3000, y: 0 },
			{ x: 3000, y: 5000 },
			{ x: 0, y: 5000 },
		];
		const h = solvePerspective(src, dst);
		expect(h).not.toBeNull();
		if (!h) return;

		const inv = getInversePerspective(h);
		expect(inv).not.toBeNull();
		if (!inv) return;

		// Test multiple points
		const testPoints = [
			{ x: 0, y: 2000 },
			{ x: -300, y: 1500 },
			{ x: 800, y: 3000 },
		];
		for (const pt of testPoints) {
			const fwd = applyPerspective(h, pt.x, pt.y);
			const back = applyPerspective(inv, fwd.x, fwd.y);
			expect(back.x).toBeCloseTo(pt.x, 2);
			expect(back.y).toBeCloseTo(pt.y, 2);
		}
	});

	it("returns null for near-singular matrix (zero determinant)", () => {
		// All-zero coefficients → determinant is 0
		const h = [0, 0, 0, 0, 0, 0, 0, 0];
		expect(getInversePerspective(h)).toBeNull();
	});

	it("returns null when normalized scale factor is near-zero", () => {
		// Need det != 0 but inv[8] = (h0*h4 - h1*h3)/det ≈ 0
		// h = [2,3,10,4,6,1,1,2] gives:
		// H = [2,3,10; 4,6,1; 1,2,1]
		// det = 2*(6-2) - 3*(4-1) + 10*(8-6) = 8 - 9 + 20 = 19 (nonzero)
		// inv[8] = (2*6 - 3*4) / 19 = 0/19 = 0 → triggers line 98
		const h = [2, 3, 10, 4, 6, 1, 1, 2];
		expect(getInversePerspective(h)).toBeNull();
	});
});

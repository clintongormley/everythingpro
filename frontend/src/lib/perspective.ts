/**
 * Solve a perspective transform from 4 source→destination point pairs.
 * Returns 8 coefficients [h0..h7] or null if the system is singular.
 *
 * The transform maps (sx,sy) → (rx,ry) via:
 *   rx = (h0*sx + h1*sy + h2) / (h6*sx + h7*sy + 1)
 *   ry = (h3*sx + h4*sy + h5) / (h6*sx + h7*sy + 1)
 */
export function solvePerspective(
	src: { x: number; y: number }[],
	dst: { x: number; y: number }[],
): number[] | null {
	// Build 8x8 system from 4 point pairs
	const A: number[][] = [];
	const b: number[] = [];
	for (let i = 0; i < 4; i++) {
		const sx = src[i].x;
		const sy = src[i].y;
		const rx = dst[i].x;
		const ry = dst[i].y;
		A.push([sx, sy, 1, 0, 0, 0, -sx * rx, -sy * rx]);
		b.push(rx);
		A.push([0, 0, 0, sx, sy, 1, -sx * ry, -sy * ry]);
		b.push(ry);
	}
	// Gaussian elimination with partial pivoting
	const n = 8;
	const M = A.map((row, i) => [...row, b[i]]);
	for (let col = 0; col < n; col++) {
		let maxVal = Math.abs(M[col][col]);
		let maxRow = col;
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

/** Apply a perspective transform (8 coefficients) to a point. */
export function applyPerspective(
	h: number[],
	x: number,
	y: number,
): { x: number; y: number } {
	const w = h[6] * x + h[7] * y + 1;
	return {
		x: (h[0] * x + h[1] * y + h[2]) / w,
		y: (h[3] * x + h[4] * y + h[5]) / w,
	};
}

/**
 * Compute the inverse perspective (room→sensor) from the forward perspective.
 * Returns 8 coefficients or null if the matrix is singular.
 */
export function getInversePerspective(h: number[] | null): number[] | null {
	if (!h || h.length < 8) return null;
	// Forward homography as 3x3 matrix:
	// [h0 h1 h2]
	// [h3 h4 h5]
	// [h6 h7  1]
	const H = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
	// 3x3 matrix inverse
	const det =
		H[0] * (H[4] * H[8] - H[5] * H[7]) -
		H[1] * (H[3] * H[8] - H[5] * H[6]) +
		H[2] * (H[3] * H[7] - H[4] * H[6]);
	if (Math.abs(det) < 1e-10) return null;
	const inv = [
		(H[4] * H[8] - H[5] * H[7]) / det,
		(H[2] * H[7] - H[1] * H[8]) / det,
		(H[1] * H[5] - H[2] * H[4]) / det,
		(H[5] * H[6] - H[3] * H[8]) / det,
		(H[0] * H[8] - H[2] * H[6]) / det,
		(H[2] * H[3] - H[0] * H[5]) / det,
		(H[3] * H[7] - H[4] * H[6]) / det,
		(H[1] * H[6] - H[0] * H[7]) / det,
		(H[0] * H[4] - H[1] * H[3]) / det,
	];
	// Normalize so inv[8] = 1
	const s = inv[8];
	if (Math.abs(s) < 1e-10) return null;
	return [
		inv[0] / s,
		inv[1] / s,
		inv[2] / s,
		inv[3] / s,
		inv[4] / s,
		inv[5] / s,
		inv[6] / s,
		inv[7] / s,
	];
}

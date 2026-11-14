// Small helpers for drawing organic shapes in SVG.
// Points are [x, y]. Shapes are described as their RIGHT half (x ≥ 0, measured
// from the body's centre line) and mirrored, so left and right always match.

export type Point = [number, number];

/**
 * A smooth path through every point (Catmull-Rom curve converted to SVG Béziers).
 * tension 0 = straight lines with sharp corners, 1 = very round.
 */
export function smoothPath(points: Point[], closed = true, tension = 0.5): string {
  const n = points.length;
  if (n < 2) return "";
  const at = (i: number) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  const s = tension / 6;
  const fmt = (v: number) => Math.round(v * 10) / 10;

  let d = `M${fmt(points[0][0])},${fmt(points[0][1])}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) * s, p1[1] + (p2[1] - p0[1]) * s];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) * s, p2[1] - (p3[1] - p1[1]) * s];
    d += ` C${fmt(c1[0])},${fmt(c1[1])} ${fmt(c2[0])},${fmt(c2[1])} ${fmt(p2[0])},${fmt(p2[1])}`;
  }
  return closed ? `${d} Z` : d;
}

/** Right half (top → bottom) + its mirror image = a full closed outline around centre x `cx`. */
export function mirrored(rightHalf: Point[], cx: number): Point[] {
  const right = rightHalf.map(([x, y]): Point => [cx + x, y]);
  const left = rightHalf
    .slice()
    .reverse()
    .filter(([x]) => x !== 0) // points on the centre line aren't duplicated
    .map(([x, y]): Point => [cx - x, y]);
  return [...right, ...left];
}

/** Moves a set of right-side points to the left side (for one-sided parts like a single leg). */
export function flipX(points: Point[], cx: number): Point[] {
  return points.map(([x, y]) => [2 * cx - x, y]);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

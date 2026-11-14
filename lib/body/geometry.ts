import { bodyShapes, genderProportions } from "@/config/dolab.config";
import type { BodyProfile } from "./profile";
import { clamp, lerp } from "./path";

// Everything is drawn on a fixed canvas; the figure always fills it top to
// bottom, and body WIDTHS change with weight, height, shape and gender.
export const CANVAS = { width: 400, height: 840 } as const;
const TOP = 22;
const FIGURE_HEIGHT = 795; // head top → floor

// Artists measure the body in "heads": an adult is about 7.5 heads tall.
const HEADS = 7.5;

export type BodyGeometry = ReturnType<typeof bodyGeometry>;

export function bodyGeometry(body: BodyProfile) {
  const h = FIGURE_HEIGHT / HEADS; // one head, in pixels
  const y = (heads: number) => TOP + heads * h;
  const cx = CANVAS.width / 2;

  // BMI decides how "full" the figure is; clamped so extremes still look human.
  const metres = body.heightCm / 100;
  const bmi = body.weightKg / (metres * metres);
  const build = clamp(1 + (bmi - 22) * 0.028, 0.82, 1.45);
  const shape = bodyShapes.find((s) => s.id === body.shape) ?? bodyShapes[1];
  const sex = genderProportions[body.gender];

  const shoulderHalf = h * 0.98 * Math.sqrt(build) * shape.shoulders * sex.shoulders;
  const waistHalf = h * 0.6 * build ** 1.25 * shape.waist * sex.waist;
  const hipHalf = h * 0.72 * build ** 1.05 * shape.hips * sex.hips;
  const chestHalf = Math.max(shoulderHalf * 0.82 * build ** 0.3 * sex.chest, waistHalf);
  const legOffset = hipHalf * 0.5; // distance from centre line to the middle of each leg

  const g = {
    h,
    cx,
    build,
    // vertical landmarks (pixels from the top)
    headCy: y(0.5),
    chinY: y(1.0),
    neckBaseY: y(1.18),
    shoulderY: y(1.42),
    armpitY: y(1.85),
    chestY: y(2.0),
    waistY: y(2.85),
    elbowY: y(2.95),
    hipY: y(3.35),
    crotchY: y(3.78),
    wristY: y(4.0),
    handEndY: y(4.6),
    kneeY: y(5.55),
    calfY: y(6.1),
    ankleY: y(7.1),
    floorY: y(7.5),
    // half-widths (pixels from the centre line)
    headRx: h * 0.36,
    headRy: h * 0.5,
    neckHalf: h * 0.19 * build ** 0.35 * sex.neck,
    shoulderHalf,
    chestHalf,
    waistHalf,
    hipHalf,
    legOffset,
    thighHalf: hipHalf * 0.5,
    kneeHalf: h * 0.18 * build ** 0.55,
    calfHalf: h * 0.19 * build ** 0.6,
    ankleHalf: h * 0.1 * build ** 0.3,
    // arms hang slightly away from the body ("A-pose") so sleeves stay visible
    armTop: h * 0.25 * build ** 0.6,
    armElbow: h * 0.19 * build ** 0.55,
    armWrist: h * 0.13 * build ** 0.3,
  };
  return { ...g, armAt: (yy: number) => armAt(g, yy), legAt: (yy: number) => legAt(g, yy), bodyHalfAt: (yy: number) => bodyHalfAt(g, yy) };
}

type BaseGeometry = Omit<BodyGeometry, "armAt" | "legAt" | "bodyHalfAt">;

/** Right arm at height y: centre and half-width, measured from the body's centre line. */
function armAt(g: BaseGeometry, y: number) {
  const startX = g.shoulderHalf - g.armTop * 0.55;
  const wristX = Math.max(g.hipHalf + g.armWrist + g.h * 0.14, g.shoulderHalf + g.h * 0.06);
  const elbowX = lerp(startX, wristX, 0.55);
  const top = g.shoulderY + g.h * 0.15;

  if (y <= g.elbowY) {
    const t = clamp((y - top) / (g.elbowY - top), 0, 1);
    return { center: lerp(startX, elbowX, t), half: lerp(g.armTop, g.armElbow, t) };
  }
  const t = clamp((y - g.elbowY) / (g.wristY - g.elbowY), 0, 1.3);
  return { center: lerp(elbowX, wristX, t), half: lerp(g.armElbow, g.armWrist, t) };
}

/** Right leg at height y: outer and inner edge, measured from the centre line. */
function legAt(g: BaseGeometry, y: number) {
  const stops = [
    { y: g.crotchY, outer: g.legOffset + g.thighHalf * 1.02, inner: g.h * 0.03 },
    { y: g.kneeY, outer: g.legOffset * 0.96 + g.kneeHalf, inner: g.legOffset * 0.96 - g.kneeHalf },
    { y: g.calfY, outer: g.legOffset * 0.95 + g.calfHalf, inner: g.legOffset * 0.95 - g.calfHalf * 0.9 },
    { y: g.ankleY, outer: g.legOffset * 0.94 + g.ankleHalf, inner: g.legOffset * 0.94 - g.ankleHalf },
  ];
  const i = Math.max(0, stops.findIndex((s) => s.y >= y) - 1);
  const a = stops[Math.min(i, stops.length - 2)];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const t = clamp((y - a.y) / (b.y - a.y), 0, 1);
  return { outer: lerp(a.outer, b.outer, t), inner: lerp(a.inner, b.inner, t) };
}

/** Torso half-width at height y (shoulders → hips), used to fit clothes. */
function bodyHalfAt(g: BaseGeometry, y: number) {
  const stops: [number, number][] = [
    [g.shoulderY, g.shoulderHalf],
    [g.chestY, g.chestHalf],
    [g.waistY, g.waistHalf],
    [g.hipY, g.hipHalf],
    [g.crotchY, g.hipHalf * 0.97],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [y0, w0] = stops[i];
    const [y1, w1] = stops[i + 1];
    if (y <= y1) return lerp(w0, w1, clamp((y - y0) / (y1 - y0), 0, 1));
  }
  return stops[stops.length - 1][1];
}

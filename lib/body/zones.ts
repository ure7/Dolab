import type { CategoryId } from "@/config/dolab.config";
import { CANVAS, type BodyGeometry } from "./geometry";

export type Rect = { x: number; y: number; width: number; height: number };

// Back-to-front drawing order on the ghost mannequin. Trousers first, then
// shoes ON TOP of the trouser hem (so they're always fully visible), then
// the tops from the inside out.
export const layerOrder: CategoryId[] = ["bottoms", "shoes", "inner_top", "hoodie", "outer_layer", "accessory"];

/**
 * The box each kind of clothing occupies on this body. Photos are fitted
 * inside it WITHOUT stretching (see lib/try-on/fit.ts); drawn garments use it
 * for flat views like wardrobe cards.
 */
export function zoneRect(category: CategoryId, g: BodyGeometry): Rect {
  const { cx, h } = g;
  const box = (halfWidth: number, top: number, bottom: number): Rect => ({
    x: cx - halfWidth,
    y: top,
    width: halfWidth * 2,
    height: bottom - top,
  });
  const sleeveReach = g.armAt(g.wristY).center + g.armAt(g.wristY).half;

  switch (category) {
    case "inner_top": // from the collar down to just below the hips
      return box(g.shoulderHalf + h * 0.62, g.neckBaseY - h * 0.16, g.crotchY + h * 0.1);
    case "hoodie":
      return box(sleeveReach + h * 0.12, g.chinY - h * 0.02, g.crotchY + h * 0.1);
    case "outer_layer":
      return box(sleeveReach + h * 0.2, g.neckBaseY - h * 0.2, g.crotchY + h * 0.35);
    case "bottoms": // waistband at the waist, hem at the ankle
      return box(g.hipHalf + h * 0.45, g.waistY + h * 0.04, g.ankleY + h * 0.08);
    case "shoes": // a pair, standing on the floor
      return box(g.legOffset + h * 0.62, g.ankleY - h * 0.1, g.floorY + h * 0.35);
    case "accessory":
      // beside the body, clear of jacket sleeves where there's room (always inside the canvas)
      return {
        x: Math.min(cx + sleeveReach + h * 0.2, CANVAS.width - h * 0.95 - 4),
        y: g.hipY - h * 0.5,
        width: h * 0.95,
        height: h * 0.95,
      };
  }
}

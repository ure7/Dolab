import type { CategoryId } from "@/config/dolab.config";
import type { BodyGeometry } from "@/lib/body/geometry";
import type { Rect } from "@/lib/body/zones";
import { mirrored, smoothPath, type Point } from "@/lib/body/path";
import type { PhotoCrop } from "./types";

/**
 * Where a cut-out photo goes on the ghost mannequin. Photos are NEVER
 * stretched: we only pick one scale and a position.
 *  - tops:     as wide as their zone (sleeve to sleeve), hung from the collar;
 *              shrunk if that would make them unrealistically long
 *  - trousers: waist → ankle; shrunk if that would make them too wide
 *  - shoes:    fitted whole in their box, centred, standing on the floor
 */
export function fitPhoto(category: CategoryId, zone: Rect, crop: PhotoCrop): Rect {
  const aspect = crop.width / crop.height; // >1 = wide photo
  const centreX = zone.x + zone.width / 2;
  const centred = (width: number, height: number, y: number): Rect => ({ x: centreX - width / 2, y, width, height });

  switch (category) {
    case "inner_top":
    case "hoodie":
    case "outer_layer": {
      let width = zone.width;
      let height = width / aspect;
      const maxHeight = zone.height * 1.1;
      if (height > maxHeight) [height, width] = [maxHeight, maxHeight * aspect];
      return centred(width, height, zone.y);
    }
    case "bottoms": {
      let height = zone.height;
      let width = height * aspect;
      const maxWidth = zone.width * 1.25;
      if (width > maxWidth) [width, height] = [maxWidth, maxWidth / aspect];
      return centred(width, height, zone.y);
    }
    case "shoes":
    case "accessory": {
      const scale = Math.min(zone.width / crop.width, zone.height / crop.height);
      const width = crop.width * scale;
      const height = crop.height * scale;
      const y = category === "shoes" ? zone.y + zone.height - height : zone.y + (zone.height - height) / 2;
      return centred(width, height, y);
    }
  }
}

/**
 * Shoes go just below the trouser hem, never hidden behind it. If the
 * trousers end higher or lower than average, the shoe box follows them.
 */
export function shoeZone(zone: Rect, bottoms: Rect | null, g: BodyGeometry): Rect {
  if (!bottoms) return zone;
  const top = bottoms.y + bottoms.height - g.h * 0.12;
  return { ...zone, y: top, height: Math.max(zone.height, g.h * 0.9) };
}

/**
 * Under a hoodie or jacket, an inner top's sleeves (spread out in a flat
 * photo) would poke out sideways. Real sleeves sit inside the outer layer, so
 * we only show the torso part of the inner top.
 */
export function innerTopClip(g: BodyGeometry, placed: Rect): string {
  const ease = g.h * 0.1;
  const bottom = placed.y + placed.height + g.h;
  const right: Point[] = [
    [g.neckHalf * 1.4, placed.y - g.h * 0.5],
    [g.shoulderHalf * 0.92, g.shoulderY + g.h * 0.12],
    [g.bodyHalfAt(g.armpitY) + ease, g.armpitY + g.h * 0.1],
    [g.bodyHalfAt(g.waistY) + ease, g.waistY],
    [g.bodyHalfAt(g.hipY) + ease, g.hipY],
    [g.bodyHalfAt(g.hipY) + ease, bottom],
  ];
  return smoothPath(mirrored(right, g.cx), true, 0.3);
}

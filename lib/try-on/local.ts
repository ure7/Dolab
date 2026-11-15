import type { CategoryId } from "@/config/dolab.config";
import { CANVAS, bodyGeometry } from "@/lib/body/geometry";
import { layerOrder, zoneRect, type Rect } from "@/lib/body/zones";
import { measureCutout } from "./measure";
import { fitPhoto, innerTopClip, shoeZone } from "./fit";
import type { TryOnLayer, TryOnRequest, TryOnResult } from "./types";

// Layers worn over others are drawn a little bigger, so they look worn OVER
// them instead of being the same size pasted on top. (1 = inner top's size.)
const layerScale: Partial<Record<CategoryId, number>> = { hoodie: 1.05, outer_layer: 1.09 };

/** How far apart the two halves of an open jacket sit, as a share of its width. */
const OPEN_GAP = 0.13;

/** Grows a rect around the middle of its top edge (the collar stays at the neck). */
function grow(rect: Rect, scale: number, lift: number): Rect {
  const width = rect.width * scale;
  const height = rect.height * scale;
  return { x: rect.x - (width - rect.width) / 2, y: rect.y - lift, width, height };
}

// The free renderer for the ghost mannequin: decides which picture to use
// for each item, where it goes and in which order. Runs in the browser.
export async function renderLocally({ body, items, outerOpen = true }: TryOnRequest): Promise<TryOnResult> {
  const g = bodyGeometry(body);
  const hasLayerOnTop = items.some((i) => i.category === "hoodie" || i.category === "outer_layer");
  const hasInnerLayers = items.some((i) => i.category === "inner_top" || i.category === "hoodie");

  const sorted = items
    .slice()
    .sort((a, b) => layerOrder.indexOf(a.category) - layerOrder.indexOf(b.category));

  // Measure every photo in parallel first…
  const crops = await Promise.all(sorted.map((item) => (item.cutoutUrl ? measureCutout(item.cutoutUrl) : null)));

  // …then place them in drawing order, so shoes can line up under the trousers.
  let bottomsRect: Rect | null = null;
  const layers = sorted.map((item, i): TryOnLayer => {
    let zone = zoneRect(item.category, g);
    if (item.category === "shoes") zone = shoeZone(zone, bottomsRect, g);

    // A photo WITH its background would look like a pasted rectangle,
    // so only background-free cut-outs are used; otherwise we draw the item.
    if (!item.cutoutUrl) {
      if (item.category === "bottoms") bottomsRect = zone;
      return { item, kind: "drawn", rect: zone, crop: null, clip: null, open: null };
    }
    const crop = crops[i];
    let rect = crop ? fitPhoto(item.category, zone, crop) : zone;
    const scale = layerScale[item.category];
    if (scale) rect = grow(rect, scale, g.h * 0.04);
    if (item.category === "bottoms") bottomsRect = rect;

    const clip = item.category === "inner_top" && hasLayerOnTop ? innerTopClip(g, rect) : null;
    // Open only makes sense when there's something underneath to show.
    const open = item.category === "outer_layer" && outerOpen && hasInnerLayers ? { gap: rect.width * OPEN_GAP } : null;
    return { item, kind: "photo", rect, crop, clip, open };
  });

  // Tall trousers + shoes can reach below the usual floor: grow the canvas.
  const lowest = Math.max(CANVAS.height, ...layers.map((l) => l.rect.y + l.rect.height + 12));
  return { kind: "layers", layers, canvasHeight: Math.ceil(lowest) };
}

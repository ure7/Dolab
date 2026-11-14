import { CANVAS, bodyGeometry } from "@/lib/body/geometry";
import { layerOrder, zoneRect, type Rect } from "@/lib/body/zones";
import { measureCutout } from "./measure";
import { fitPhoto, innerTopClip, shoeZone } from "./fit";
import type { TryOnLayer, TryOnRequest, TryOnResult } from "./types";

// The free renderer for the ghost mannequin: decides which picture to use
// for each item, where it goes and in which order. Runs in the browser.
export async function renderLocally({ body, items }: TryOnRequest): Promise<TryOnResult> {
  const g = bodyGeometry(body);
  const hasLayerOnTop = items.some((i) => i.category === "hoodie" || i.category === "outer_layer");

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
      return { item, kind: "drawn", rect: zone, crop: null, clip: null };
    }
    const crop = crops[i];
    const rect = crop ? fitPhoto(item.category, zone, crop) : zone;
    if (item.category === "bottoms") bottomsRect = rect;
    const clip = item.category === "inner_top" && hasLayerOnTop ? innerTopClip(g, rect) : null;
    return { item, kind: "photo", rect, crop, clip };
  });

  // Tall trousers + shoes can reach below the usual floor: grow the canvas.
  const lowest = Math.max(CANVAS.height, ...layers.map((l) => l.rect.y + l.rect.height + 12));
  return { kind: "layers", layers, canvasHeight: Math.ceil(lowest) };
}

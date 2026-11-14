"use client";

import type { CategoryId } from "@/config/dolab.config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { FittingRoomItem } from "./types";
import { CutoutImage } from "./CutoutImage";
import { FlatGarment } from "./FlatGarment";

// ---------------------------------------------------------------------------
// Layout. The board is a 100 × 125 grid (4:5). Like a fashion flat-lay:
//   tops on top across the full width (outer layer overlapping from the right),
//   then trousers, then shoes; accessories at the side of the trousers.
// Each row has a maximum height so 2 items don't become giant and 6 items
// still fit. Pictures are always fitted INSIDE their box, never stretched.
// ---------------------------------------------------------------------------
const W = 100;
const H = 125;
const PAD = 6;
const GAP = 2.5;

type Box = { item: FittingRoomItem; x: number; y: number; w: number; h: number; z: number };

const rowSpec = {
  tops: { weight: 1, max: 50 },
  bottoms: { weight: 1.3, max: 64 },
  shoes: { weight: 0.45, max: 22 },
} as const;
type Row = keyof typeof rowSpec;

const rowOf = (c: CategoryId): Row | "side" =>
  c === "bottoms" ? "bottoms" : c === "shoes" ? "shoes" : c === "accessory" ? "side" : "tops";
const topOrder: CategoryId[] = ["inner_top", "hoodie", "outer_layer"];

export function layoutBoard(items: FittingRoomItem[]): Box[] {
  const side = items.filter((i) => rowOf(i.category) === "side");
  const sideW = side.length ? 22 : 0;
  const fullW = W - PAD * 2;
  // Trousers + shoes share their rows with the accessory column; tops get the full width.
  const mainX = PAD;
  const mainW = fullW - (sideW ? sideW + GAP : 0);
  let bottomsSpan: [number, number] | null = null;

  // Which rows are used, and how tall each one is.
  const rows = (Object.keys(rowSpec) as Row[]).filter((r) => items.some((i) => rowOf(i.category) === r));
  const free = H - PAD * 2 - GAP * Math.max(0, rows.length - 1);
  const totalWeight = rows.reduce((sum, r) => sum + rowSpec[r].weight, 0);
  const heights = rows.map((r) => Math.min(rowSpec[r].max, (free * rowSpec[r].weight) / totalWeight));
  const used = heights.reduce((a, b) => a + b, 0) + GAP * Math.max(0, rows.length - 1);
  let y = (H - used) / 2; // centre the stack vertically

  const boxes: Box[] = [];
  rows.forEach((row, r) => {
    const rowH = heights[r];
    const rowItems = items.filter((i) => rowOf(i.category) === row);
    if (row === "tops") {
      // Side by side, each one overlapping the previous a little; the
      // outer layer is last, so it lies on top, slightly lower.
      const sorted = rowItems.sort((a, b) => topOrder.indexOf(a.category) - topOrder.indexOf(b.category));
      const n = sorted.length;
      const overlap = n > 2 ? 0.3 : 0.22;
      const w = n === 1 ? fullW * 0.72 : fullW / (n - overlap * (n - 1));
      const start = PAD + (fullW - (n === 1 ? w : fullW)) / 2;
      sorted.forEach((item, k) => {
        const drop = item.category === "outer_layer" && n > 1 ? rowH * 0.06 : 0;
        boxes.push({ item, x: start + k * w * (1 - overlap), y: y + drop, w, h: rowH - drop, z: k + 1 });
      });
    } else {
      // Trousers and shoes are centred under the tops.
      const share = row === "bottoms" ? 0.7 : 0.62;
      const w = mainW * share;
      for (const item of rowItems) boxes.push({ item, x: mainX + (mainW - w) / 2, y, w, h: rowH, z: 0 });
      if (row === "bottoms") bottomsSpan = [y, y + rowH];
    }
    y += rowH + GAP;
  });

  // Accessories: stacked beside the trousers (or centred, if there are none).
  if (side.length) {
    const [top, bottom] = bottomsSpan ?? [PAD, H - PAD];
    const each = Math.min(24, (bottom - top) / side.length - GAP);
    let sy = (top + bottom - (each + GAP) * side.length + GAP) / 2;
    for (const item of side) {
      boxes.push({ item, x: W - PAD - sideW, y: sy, w: sideW, h: each, z: 5 });
      sy += each + GAP;
    }
  }
  return boxes;
}

export function OutfitBoard({ items }: { items: FittingRoomItem[] }) {
  const { t } = useI18n();
  const boxes = layoutBoard(items);

  return (
    // dir="ltr": the collage is a picture; it shouldn't flip in Arabic.
    <div
      dir="ltr"
      className="relative aspect-4/5 w-full overflow-hidden rounded-3xl bg-photo bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,255,255,0.6)_0%,transparent_70%)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
    >
      {boxes.map(({ item, x, y, w, h, z }) => (
        <figure
          key={item.id}
          className="absolute m-0 flex items-center justify-center"
          style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%`, zIndex: z }}
          title={item.name}
        >
          <BoardPicture item={item} />
          {item.status === "not_owned" && (
            <figcaption className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-[#1b1209]/90 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-[#f3dcc0] shadow">
              {t.wardrobe.notOwnedBadge}
            </figcaption>
          )}
        </figure>
      ))}
      <span className="sr-only">{items.map((i) => i.name).join(", ")}</span>
    </div>
  );
}

// Soft shadow under each piece, as if lying on paper.
const shadow = "photo-shadow";

function BoardPicture({ item }: { item: FittingRoomItem }) {
  if (item.cutoutUrl) {
    return <CutoutImage url={item.cutoutUrl} alt={item.name} className={`size-full ${shadow}`} />;
  }
  if (item.photoUrl) {
    // A photo with its background becomes a neat little print on the board.
    return (
      <img src={item.photoUrl} alt={item.name} className="max-h-full max-w-full rounded-md border-4 border-white object-contain shadow-lg" />
    );
  }
  return <FlatGarment category={item.category} colour={item.colour} className={`size-full ${shadow}`} />;
}

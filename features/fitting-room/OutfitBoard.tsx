"use client";

import { boardItemSizes, type CategoryId } from "@/config/dolab.config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { FittingRoomItem } from "./types";
import { CutoutImage } from "./CutoutImage";
import { FlatGarment } from "./FlatGarment";

// ---------------------------------------------------------------------------
// Layout. The board is a 100 × 125 grid (4:5). Like a fashion flat-lay:
//   tops on top (outer layer overlapping from the right), then trousers with
//   accessories beside them, then shoes.
// Every item gets a box of its typical REAL size (boardItemSizes in the
// config, in cm) and the whole board uses ONE scale (grid units per cm), the
// largest that still fits — so a T-shirt and jeans keep their real proportions
// whether the outfit has 2 items or 6. Pictures are fitted inside their box,
// never stretched.
// ---------------------------------------------------------------------------
const W = 100;
const H = 125;
const PAD = 6;
const GAP_CM = 8; // space between rows / items, in real centimetres
// How much each extra top tucks under the previous one (more when there are 3).
const overlapFor = (tops: number) => (tops > 2 ? 0.42 : 0.25);

type Box = { item: FittingRoomItem; x: number; y: number; w: number; h: number; z: number };
type Row = "tops" | "bottoms" | "shoes";

const rowOf = (c: CategoryId): Row | "side" =>
  c === "bottoms" ? "bottoms" : c === "shoes" ? "shoes" : c === "accessory" ? "side" : "tops";
const topOrder: CategoryId[] = ["inner_top", "hoodie", "outer_layer"];
const size = (item: FittingRoomItem) => boardItemSizes[item.category];

export function layoutBoard(items: FittingRoomItem[]): Box[] {
  const tops = items.filter((i) => rowOf(i.category) === "tops").sort((a, b) => topOrder.indexOf(a.category) - topOrder.indexOf(b.category));
  const bottoms = items.filter((i) => rowOf(i.category) === "bottoms");
  const shoes = items.filter((i) => rowOf(i.category) === "shoes");
  const side = items.filter((i) => rowOf(i.category) === "side");

  // ---- each row's size in centimetres ----
  const OVERLAP = overlapFor(tops.length);
  const topsWidth = tops.reduce((sum, item, k) => sum + size(item).width * (k === 0 ? 1 : 1 - OVERLAP), 0);
  const topsHeight = Math.max(0, ...tops.map((i) => size(i).height));
  const sideWidth = Math.max(0, ...side.map((i) => size(i).width));
  const sideHeight = side.reduce((sum, i) => sum + size(i).height, 0) + GAP_CM * Math.max(0, side.length - 1);
  const bottomsWidth = Math.max(0, ...bottoms.map((i) => size(i).width)) + (side.length ? GAP_CM + sideWidth : 0);
  const bottomsHeight = Math.max(0, ...bottoms.map((i) => size(i).height), bottoms.length ? 0 : sideHeight);
  const shoesWidth = Math.max(0, ...shoes.map((i) => size(i).width));
  const shoesHeight = Math.max(0, ...shoes.map((i) => size(i).height));

  const rows = [
    { name: "tops" as const, width: topsWidth, height: topsHeight },
    { name: "bottoms" as const, width: bottomsWidth, height: bottomsHeight },
    { name: "shoes" as const, width: shoesWidth, height: shoesHeight },
  ].filter((r) => r.height > 0);
  if (rows.length === 0) return [];

  // ---- one scale for everything: the biggest that fits the board ----
  const totalHeightCm = rows.reduce((sum, r) => sum + r.height, 0) + GAP_CM * (rows.length - 1);
  const widestCm = Math.max(...rows.map((r) => r.width));
  const scale = Math.min((H - PAD * 2) / totalHeightCm, (W - PAD * 2) / widestCm);

  const boxes: Box[] = [];
  let y = (H - totalHeightCm * scale) / 2; // centre the whole flat-lay vertically
  for (const row of rows) {
    const rowWidth = row.width * scale;
    const left = (W - rowWidth) / 2;
    if (row.name === "tops") {
      let x = left;
      tops.forEach((item, k) => {
        const { width, height } = size(item);
        // the outer layer lies on top of the others, slightly lower
        const drop = item.category === "outer_layer" && tops.length > 1 ? 3 * scale : 0;
        boxes.push({ item, x, y: y + drop, w: width * scale, h: height * scale, z: k + 1 });
        x += width * scale * (1 - OVERLAP);
      });
    } else if (row.name === "bottoms") {
      let x = left;
      for (const item of bottoms) {
        boxes.push({ item, x, y, w: size(item).width * scale, h: size(item).height * scale, z: 0 });
        x += size(item).width * scale + GAP_CM * scale;
      }
      // accessories stacked beside the trousers, vertically centred
      let sy = y + ((row.height - sideHeight) * scale) / 2;
      for (const item of side) {
        boxes.push({ item, x: left + rowWidth - sideWidth * scale, y: sy, w: size(item).width * scale, h: size(item).height * scale, z: 5 });
        sy += (size(item).height + GAP_CM) * scale;
      }
    } else {
      for (const item of shoes) boxes.push({ item, x: left, y, w: size(item).width * scale, h: size(item).height * scale, z: 0 });
    }
    y += (row.height + GAP_CM) * scale;
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

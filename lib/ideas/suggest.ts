import { clothingColours, colourHarmonies, ideasConfig, type CategoryId, type ColourId, type Condition, type ItemStatus } from "@/config/dolab.config";

// ---------------------------------------------------------------------------
// Outfit ideas from simple colour rules — free, instant, and easy to explain.
//
// An idea is: a top + bottoms (+ shoes if you have any), optionally with one
// layer (hoodie or outer layer) over the top. Its colours decide if it works:
//   • only neutral colours (black, white, grey, beige, navy, denim) → yes
//   • neutrals + ONE accent colour                                   → yes (best)
//   • TWO accent colours that are a known good pair (config)          → yes
//   • anything else                                                   → no
// Worn-out items, and outfits you've already saved, are skipped.
//
// suggestOutfits() is the ONE place to swap in AI recommendations later
// (phase 7): keep its input and output the same and the pages keep working.
// ---------------------------------------------------------------------------

export type IdeaItem = { id: string; category: CategoryId; colour: ColourId; status: ItemStatus; condition: Condition };

export type IdeaReason =
  | { kind: "neutral" }
  | { kind: "accent"; colour: ColourId }
  | { kind: "pair"; colours: [ColourId, ColourId] };

export type Idea = { itemIds: string[]; reason: IdeaReason; score: number };

export type SuggestOptions = {
  items: IdeaItem[];
  /** Item-id lists of outfits already saved (so we don't suggest them again). */
  saved?: string[][];
  /** Every idea must contain this item (used for "Thinking of buying?"). It may be not-owned. */
  mustInclude?: string;
  /** Different number → different ideas among equally good ones ("Shuffle"). */
  seed?: number;
  limit?: number;
  /**
   * Weather layering (see lib/weather.ts): "none" = no hoodie/jacket,
   * "one" = exactly one, "outer" = must include a jacket, "two" = hoodie AND jacket.
   * If your wardrobe can't match it, ideas fall back to any layering.
   */
  layering?: "none" | "one" | "outer" | "two";
  /** Rain likely: ideas with a jacket rank higher. */
  preferOuter?: boolean;
};

const neutral = new Set<ColourId>(clothingColours.filter((c) => c.neutral).map((c) => c.id));
const harmonious = new Set(colourHarmonies.flatMap(([a, b]) => [`${a}+${b}`, `${b}+${a}`]));

/** Does this set of colours work together? If so, why and how well. */
export function judgeColours(colours: ColourId[]): { reason: IdeaReason; score: number } | null {
  const accents = [...new Set(colours.filter((c) => !neutral.has(c)))];
  if (accents.length === 0) return { reason: { kind: "neutral" }, score: 2 };
  if (accents.length === 1) return { reason: { kind: "accent", colour: accents[0] }, score: 3 };
  if (accents.length === 2 && harmonious.has(`${accents[0]}+${accents[1]}`)) {
    return { reason: { kind: "pair", colours: [accents[0], accents[1]] }, score: 2.5 };
  }
  return null;
}

/** Ideas ignore accessories, so compare outfits by their other items. */
const signature = (ids: string[], byId: Map<string, IdeaItem>) =>
  ids
    .filter((id) => byId.get(id)?.category !== "accessory")
    .sort()
    .join(",");

// Small seeded random generator (same seed → same order), for tie-breaks.
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_COMBINATIONS = 20_000; // keeps big wardrobes fast

export function suggestOutfits(options: SuggestOptions): {
  ideas: Idea[];
  /** How many good combinations exist in total (before trimming to `limit`). */
  total: number;
  /** false when the requested weather layering couldn't be matched. */
  matchedWeather: boolean;
} {
  const result = suggest(options);
  if (options.layering && result.total === 0) return { ...suggest({ ...options, layering: undefined }), matchedWeather: false };
  return { ...result, matchedWeather: true };
}

function suggest({ items, saved = [], mustInclude, seed = 1, limit = ideasConfig.count, layering, preferOuter = false }: SuggestOptions) {
  const rand = random(seed);
  const byId = new Map(items.map((i) => [i.id, i]));
  // Usable items: in good condition; owned, except the one we're asked about.
  const usable = items.filter((i) => i.condition !== "worn_out" && (i.status === "owned" || i.id === mustInclude));
  const of = (c: CategoryId) => usable.filter((i) => i.category === c);

  const innerTops = of("inner_top");
  const hoodies = of("hoodie");
  const outers = of("outer_layer");
  // With no T-shirts/shirts, a hoodie can be the main top.
  const tops = innerTops.length > 0 ? innerTops : hoodies;
  const layerHoodies = innerTops.length > 0 ? hoodies : [];
  // Layer options over the top: none, a hoodie, a jacket, or hoodie + jacket.
  const allLayers: IdeaItem[][] = [
    [],
    ...layerHoodies.map((h) => [h]),
    ...outers.map((o) => [o]),
    ...layerHoodies.flatMap((h) => outers.map((o) => [h, o])),
  ];
  const hasOuter = (l: IdeaItem[]) => l.some((i) => i.category === "outer_layer");
  const layers = allLayers.filter((l) => {
    if (layering === "none") return l.length === 0;
    if (layering === "one") return l.length === 1;
    if (layering === "outer") return hasOuter(l);
    if (layering === "two") return l.length === 2;
    return l.length <= 1; // no weather: keep ideas simple (at most one layer)
  });
  const bottoms = of("bottoms");
  const shoes: (IdeaItem | null)[] = of("shoes").length > 0 ? of("shoes") : [null];
  if (tops.length === 0 || bottoms.length === 0 || layers.length === 0) return { ideas: [], total: 0 };

  const savedSignatures = new Set(saved.map((ids) => signature(ids, byId)));
  const size = [tops.length, layers.length, bottoms.length, shoes.length];
  const combos = size.reduce((a, b) => a * b, 1);

  // Every combination (or a random sample of them for very big wardrobes).
  const pickAt = (n: number) => {
    const [t, l, b] = [n % size[0], Math.floor(n / size[0]) % size[1], Math.floor(n / (size[0] * size[1])) % size[2]];
    const s = Math.floor(n / (size[0] * size[1] * size[2]));
    return [tops[t], ...layers[l], bottoms[b], shoes[s]].filter((i): i is IdeaItem => i !== null);
  };
  const indexes = combos <= MAX_COMBINATIONS
    ? Array.from({ length: combos }, (_, n) => n)
    : Array.from({ length: MAX_COMBINATIONS }, () => Math.floor(rand() * combos));

  const good: Idea[] = [];
  const seen = new Set<string>();
  for (const n of indexes) {
    const outfit = pickAt(n);
    const ids = outfit.map((i) => i.id);
    if (mustInclude && !ids.includes(mustInclude)) continue;
    const key = signature(ids, byId);
    if (seen.has(key) || savedSignatures.has(key)) continue;
    seen.add(key);
    const verdict = judgeColours(outfit.map((i) => i.colour));
    if (!verdict) continue;
    // A tiny random nudge only re-orders ideas that are equally good.
    const rainBonus = preferOuter && outfit.some((i) => i.category === "outer_layer") ? 1 : 0;
    good.push({ itemIds: ids, reason: verdict.reason, score: verdict.score + rainBonus + rand() * 0.5 });
  }
  good.sort((a, b) => b.score - a.score);

  // Keep the list varied: each item may appear only a couple of times —
  // unless its category has few options (with one pair of shoes, every idea
  // needs those shoes, so they may appear in all of them).
  const optionsIn = (c: CategoryId) => usable.filter((i) => i.category === c).length;
  const maxUses = (id: string) => {
    const options = optionsIn(byId.get(id)!.category);
    return Math.max(ideasConfig.maxRepeatsPerItem, Math.ceil(limit / Math.max(1, options)));
  };
  const used = new Map<string, number>();
  const ideas: Idea[] = [];
  for (const idea of good) {
    if (ideas.length >= limit) break;
    const repeats = idea.itemIds.filter((id) => id !== mustInclude).some((id) => (used.get(id) ?? 0) >= maxUses(id));
    if (repeats) continue;
    idea.itemIds.forEach((id) => used.set(id, (used.get(id) ?? 0) + 1));
    ideas.push(idea);
  }
  return { ideas, total: good.length };
}

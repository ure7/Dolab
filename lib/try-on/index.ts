import type { ItemWithPhotos } from "@/types/database";
import { renderLocally } from "./local";
import type { TryOnItem, TryOnRequest, TryOnResult } from "./types";

export type { PhotoCrop, TryOnItem, TryOnLayer, TryOnRequest, TryOnResult } from "./types";

/** The parts of a wardrobe item that try-on needs (owned or "not owned yet"). */
export function toTryOnItem(item: ItemWithPhotos): TryOnItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    colour: item.colour,
    status: item.status,
    cutoutUrl: item.cutoutUrl,
    photoUrl: item.photoUrl,
  };
}

/**
 * THE ONE PLACE to plug in a realistic AI try-on service later.
 *
 * Today: returns layers for the free SVG mannequin (no API, no cost).
 *
 * To add an AI provider later:
 *   1. Create lib/try-on/ai.ts with `renderWithAi(request): Promise<TryOnResult>`
 *      that calls the provider from a server route (keep its API key on the
 *      server, in .env.local — never in browser code) and returns
 *      { kind: "image", imageUrl }.
 *   2. Switch the line below to use it (e.g. behind a setting in the config).
 * The fitting room already knows how to show { kind: "image" } results.
 */
export async function renderTryOn(request: TryOnRequest): Promise<TryOnResult> {
  return renderLocally(request);
}

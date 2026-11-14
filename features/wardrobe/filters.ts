import type { ItemFilters } from "@/lib/db/items";
import { isCategoryId, isColourId, isCondition, isItemStatus } from "@/lib/helpers/config-guards";

export type WardrobeSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Filters live in the URL (/wardrobe?category=shoes&q=nike) so they survive
// a refresh and can be bookmarked. Unknown values are simply ignored.
export function parseFilters(params: WardrobeSearchParams): ItemFilters {
  const category = first(params.category);
  const colour = first(params.colour);
  const condition = first(params.condition);
  const status = first(params.status);
  const q = first(params.q)?.slice(0, 80);

  return {
    q: q || undefined,
    category: isCategoryId(category) ? category : undefined,
    colour: isColourId(colour) ? colour : undefined,
    condition: isCondition(condition) ? condition : undefined,
    status: isItemStatus(status) ? status : undefined,
  };
}

export function hasActiveFilters(filters: ItemFilters): boolean {
  return Object.values(filters).some(Boolean);
}

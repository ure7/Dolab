import {
  categories,
  clothingColours,
  conditions,
  itemStatuses,
  type CategoryId,
  type ColourId,
  type Condition,
  type ItemStatus,
} from "@/config/dolab.config";

// Anything coming from a form or URL is just a string. These checks make sure
// it's one of the values listed in the config before we trust it.

const categoryIds: readonly string[] = categories.map((c) => c.id);
const colourIds: readonly string[] = clothingColours.map((c) => c.id);

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && categoryIds.includes(value);
}

export function isColourId(value: unknown): value is ColourId {
  return typeof value === "string" && colourIds.includes(value);
}

export function isCondition(value: unknown): value is Condition {
  return typeof value === "string" && (conditions as readonly string[]).includes(value);
}

export function isItemStatus(value: unknown): value is ItemStatus {
  return typeof value === "string" && (itemStatuses as readonly string[]).includes(value);
}

export function getColourHex(colour: ColourId): string {
  return clothingColours.find((c) => c.id === colour)?.hex ?? "#888888";
}

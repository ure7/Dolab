import type { TryOnItem } from "@/lib/try-on";

// An item as the fitting room sees it: what try-on needs + shop details
// for "not owned yet" items (to show what the outfit would cost).
export type FittingRoomItem = TryOnItem & {
  price: number | null;
  storeName: string | null;
};

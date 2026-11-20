import type { ItemWithPhotos } from "@/types/database";
import { FlatGarment } from "@/features/fitting-room/FlatGarment";

// Shows the best picture we have: the background-free cut-out, then the
// original photo, then a drawn garment in the item's colour as a fallback.
// `priority`: for the first cards on screen — loaded straight away instead of
// lazily, so the page's main pictures appear as fast as possible.
export function ItemImage({
  item,
  priority = false,
}: {
  item: Pick<ItemWithPhotos, "name" | "category" | "colour" | "photoUrl" | "cutoutUrl">;
  priority?: boolean;
}) {
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : "auto";
  if (item.cutoutUrl) {
    return <img src={item.cutoutUrl} alt={item.name} className="photo-shadow size-full object-contain p-4" loading={loading} fetchPriority={fetchPriority} decoding="async" />;
  }
  if (item.photoUrl) {
    return <img src={item.photoUrl} alt={item.name} className="size-full object-cover" loading={loading} fetchPriority={fetchPriority} decoding="async" />;
  }
  return (
    <div className="grid size-full place-items-center p-4">
      <FlatGarment category={item.category} colour={item.colour} className="photo-shadow size-full" />
    </div>
  );
}

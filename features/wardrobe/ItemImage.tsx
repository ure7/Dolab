import type { ItemWithPhotos } from "@/types/database";
import { FlatGarment } from "@/features/fitting-room/FlatGarment";

// Shows the best picture we have: the background-free cut-out, then the
// original photo, then a drawn garment in the item's colour as a fallback.
export function ItemImage({ item }: { item: Pick<ItemWithPhotos, "name" | "category" | "colour" | "photoUrl" | "cutoutUrl"> }) {
  if (item.cutoutUrl) {
    return <img src={item.cutoutUrl} alt={item.name} className="photo-shadow size-full object-contain p-4" loading="lazy" />;
  }
  if (item.photoUrl) {
    return <img src={item.photoUrl} alt={item.name} className="size-full object-cover" loading="lazy" />;
  }
  return (
    <div className="grid size-full place-items-center p-4">
      <FlatGarment category={item.category} colour={item.colour} className="photo-shadow size-full" />
    </div>
  );
}

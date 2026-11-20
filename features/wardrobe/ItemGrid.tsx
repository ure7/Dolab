import type { Locale } from "@/config/dolab.config";
import type { ItemWithPhotos } from "@/types/database";
import type { Dictionary } from "@/lib/i18n";
import { ItemCard } from "./ItemCard";

export function ItemGrid({ items, t, locale }: { items: ItemWithPhotos[]; t: Dictionary; locale: Locale }) {
  return (
    <ul className="grid grid-cols-2 gap-[clamp(0.75rem,1.2vw,1.25rem)] md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
      {items.map((item, index) => (
        <li key={item.id}>
          {/* the first row or two is on screen right away */}
          <ItemCard item={item} t={t} locale={locale} priority={index < 6} />
        </li>
      ))}
    </ul>
  );
}

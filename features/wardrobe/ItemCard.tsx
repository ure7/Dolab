import Link from "next/link";
import type { Locale } from "@/config/dolab.config";
import type { ItemWithPhotos } from "@/types/database";
import type { Dictionary } from "@/lib/i18n";
import { getColourHex } from "@/lib/helpers/config-guards";
import { formatPrice } from "@/lib/helpers/format";
import { ItemImage } from "./ItemImage";

type ItemCardProps = { item: ItemWithPhotos; t: Dictionary; locale: Locale; priority?: boolean };

export function ItemCard({ item, t, locale, priority = false }: ItemCardProps) {
  const isStoreItem = item.status === "not_owned";

  return (
    <Link
      href={`/wardrobe/${item.id}`}
      className="press group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface hover:-translate-y-0.5 hover:border-muted hover:shadow-xl hover:shadow-black/30 motion-reduce:hover:translate-y-0"
    >
      <div className="relative m-2 mb-0 aspect-square overflow-hidden rounded-xl bg-photo">
        <ItemImage item={item} priority={priority} />
        <div className="absolute start-2 top-2 flex flex-col items-start gap-1">
          {isStoreItem && <Badge className="bg-accent text-on-accent">{t.wardrobe.notOwnedBadge}</Badge>}
          {item.condition === "worn_out" && <Badge className="bg-bg/85 text-danger">{t.wardrobe.wornOutBadge}</Badge>}
        </div>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <p className="truncate font-medium group-hover:text-accent">{item.name}</p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted">
          <span
            className="size-2.5 shrink-0 rounded-full border border-white/20"
            style={{ backgroundColor: getColourHex(item.colour) }}
            aria-hidden
          />
          <span className="truncate">{item.brand ?? t.colours[item.colour]}</span>
        </p>
        {isStoreItem && item.price !== null && (
          <p className="text-xs font-medium text-accent">{formatPrice(item.price, locale)}</p>
        )}
      </div>
    </Link>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium shadow ${className}`}>{children}</span>;
}

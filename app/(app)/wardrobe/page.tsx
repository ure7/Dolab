import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/plural";
import { listItems } from "@/lib/db/items";
import { PageTitle } from "@/components/PageTitle";
import { buttonClasses } from "@/components/ui/Button";
import { hasActiveFilters, parseFilters, type WardrobeSearchParams } from "@/features/wardrobe/filters";
import { WardrobeFilters } from "@/features/wardrobe/WardrobeFilters";
import { WardrobeEmpty } from "@/features/wardrobe/WardrobeEmpty";
import { ItemGrid } from "@/features/wardrobe/ItemGrid";
import { pageTitle } from "@/lib/i18n/metadata";

type WardrobePageProps = { searchParams: Promise<WardrobeSearchParams> };


export const generateMetadata = pageTitle((t) => t.nav.wardrobe);

export default async function WardrobePage({ searchParams }: WardrobePageProps) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const filters = parseFilters(await searchParams);
  const items = await listItems(filters);
  const filtered = hasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle>{t.pages.wardrobe}</PageTitle>
          <p className="mt-1 text-sm text-muted">{plural(t.wardrobe.itemCount, items.length, locale)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/stats" className={buttonClasses("ghost")}>
            {t.wear.statsLink}
          </Link>
          <Link href="/wardrobe/new?status=not_owned" className={buttonClasses("secondary")}>
            {t.wardrobe.addStoreItem}
          </Link>
          <Link href="/wardrobe/new" className={buttonClasses("primary")}>
            + {t.wardrobe.addItem}
          </Link>
        </div>
      </div>

      {(items.length > 0 || filtered) && <WardrobeFilters />}

      {items.length > 0 ? (
        <ItemGrid items={items} t={t} locale={locale} />
      ) : filtered ? (
        <p className="py-10 text-center text-muted">{t.wardrobe.noResults}</p>
      ) : (
        <WardrobeEmpty t={t} />
      )}
    </div>
  );
}

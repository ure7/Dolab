import { shoppingSections } from "@/config/dolab.config";
import { getLocale, getT } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/plural";
import { formatPrice } from "@/lib/helpers/format";
import { listShopping } from "@/lib/db/shopping";
import { listItems } from "@/lib/db/items";
import { getProfile } from "@/lib/db/profile";
import { PageTitle } from "@/components/PageTitle";
import { ItemImage } from "@/features/wardrobe/ItemImage";
import { AddFromItemButton, AddShoppingForm, BudgetCard, ClearBoughtButton, ShoppingRow } from "@/features/shopping/ShoppingParts";
import type { ItemWithPhotos } from "@/types/database";
import { pageTitle } from "@/lib/i18n/metadata";


export const generateMetadata = pageTitle((t) => t.nav.shopping);

export default async function ShoppingPage() {
  const [t, locale, entries, wardrobe, profile] = await Promise.all([getT(), getLocale(), listShopping(), listItems(), getProfile()]);

  const open = entries.filter((e) => !e.is_done);
  const bought = entries.filter((e) => e.is_done);
  const toBuy = open.reduce((sum, e) => sum + (e.price_estimate ?? 0), 0);
  const unpriced = open.filter((e) => e.price_estimate === null).length;

  // Suggestions: not-owned items not yet on the list, and worn-out clothes to replace.
  const linked = new Set(entries.map((e) => e.item_id).filter(Boolean));
  const listedNames = new Set(open.map((e) => e.name.toLowerCase()));
  const toBuySuggestions = wardrobe.filter((i) => i.status === "not_owned" && !linked.has(i.id));
  const toReplace = wardrobe.filter((i) => i.status === "owned" && i.condition === "worn_out" && !listedNames.has(i.name.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>{t.pages.shopping}</PageTitle>
        <p className="mt-1 text-sm text-muted">{plural(t.shopping.count, open.length, locale)}</p>
      </div>

      <div className="grid gap-[clamp(1.25rem,2.5vw,2.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
        {/* Budget + quick add: first on phones, on the side on big screens */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:order-2">
          <BudgetCard budget={profile?.shopping_budget ?? null} toBuy={toBuy} unpriced={unpriced} />
          <AddShoppingForm />
        </aside>

        <div className="flex flex-col gap-8 lg:order-1">
          {entries.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">{t.shopping.empty}</p>}

          {entries.length > 0 &&
            shoppingSections.map((section) => {
              const rows = open.filter((e) => e.section === section);
              const sum = rows.reduce((s, e) => s + (e.price_estimate ?? 0), 0);
              return (
                <section key={section} className="flex flex-col gap-3" aria-labelledby={`list-${section}`}>
                  <h2 id={`list-${section}`} className="flex items-baseline justify-between text-lg font-semibold">
                    <span>
                      {t.shopping.sections[section]} <span className="text-sm font-normal text-muted">({rows.length})</span>
                    </span>
                    {sum > 0 && <span className="text-sm font-medium text-muted">{formatPrice(sum, locale)}</span>}
                  </h2>
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted">{t.shopping.emptySection}</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {rows.map((entry) => (
                        <ShoppingRow key={entry.id} entry={entry} />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}

          {bought.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="list-bought">
              <div className="flex items-center justify-between gap-2">
                <h2 id="list-bought" className="text-lg font-semibold text-muted">
                  {t.shopping.bought} <span className="text-sm font-normal">({bought.length})</span>
                </h2>
                <ClearBoughtButton />
              </div>
              <ul className="flex flex-col gap-2">
                {bought.map((entry) => (
                  <ShoppingRow key={entry.id} entry={entry} />
                ))}
              </ul>
            </section>
          )}

          {(toBuySuggestions.length > 0 || toReplace.length > 0) && (
            <section className="flex flex-col gap-4" aria-labelledby="suggestions">
              <h2 id="suggestions" className="text-lg font-semibold">
                {t.shopping.suggestionsTitle}
              </h2>
              <Suggestions title={t.shopping.fromNotOwned} items={toBuySuggestions} reason="buy" locale={locale} />
              <Suggestions title={t.shopping.replaceWornOut} items={toReplace} reason="replace" locale={locale} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Suggestions({ title, items, reason, locale }: { title: string; items: ItemWithPhotos[]; reason: "buy" | "replace"; locale: "en" | "ar" }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted">{title}</h3>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-photo">
              <ItemImage item={item} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              {reason === "buy" && item.price !== null && (
                <p className="text-xs text-muted" dir="auto">
                  {[item.store_name, formatPrice(item.price, locale)].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <AddFromItemButton itemId={item.id} reason={reason} />
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageTitle } from "@/lib/i18n/metadata";
import { format } from "@/lib/i18n/format";
import { plural } from "@/lib/i18n/plural";
import { formatDate, formatPrice } from "@/lib/helpers/format";
import { daysAgo, startOfMonth } from "@/lib/helpers/dates";
import { listItems } from "@/lib/db/items";
import { listWearLogs, summarise } from "@/lib/db/wear";
import { PageTitle } from "@/components/PageTitle";
import { ItemImage } from "@/features/wardrobe/ItemImage";
import type { ItemWithPhotos } from "@/types/database";

export const generateMetadata = pageTitle((t) => t.wear.statsTitle);

export default async function StatsPage() {
  const [t, locale, wardrobe, logs] = await Promise.all([getT(), getLocale(), listItems({ status: "owned" }), listWearLogs(365)]);
  const stats = summarise(logs);
  const itemById = new Map(wardrobe.map((i) => [i.id, i]));

  const monthStart = startOfMonth();
  const thisMonth = logs.filter((l) => l.worn_on >= monthStart).length;

  const withStats = wardrobe.map((item) => ({ item, ...(stats.get(item.id) ?? { count: 0, last: null as string | null }) }));
  const mostWorn = withStats.filter((s) => s.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
  const ninetyDaysAgo = daysAgo(90);
  // Owned at least 90 days (or worn before) and not worn since then.
  const forgotten = withStats
    .filter((s) => (s.last ? s.last < ninetyDaysAgo : s.item.created_at.slice(0, 10) < ninetyDaysAgo))
    .slice(0, 12);
  const costPerWear = withStats
    .filter((s) => s.count > 0 && s.item.price !== null && s.item.price > 0)
    .map((s) => ({ ...s, per: s.item.price! / s.count }))
    .sort((a, b) => a.per - b.per);

  // Last 14 days, grouped by day.
  const twoWeeksAgo = daysAgo(14);
  const byDay = new Map<string, ItemWithPhotos[]>();
  for (const log of logs.filter((l) => l.worn_on >= twoWeeksAgo)) {
    const item = itemById.get(log.item_id);
    if (item) byDay.set(log.worn_on, [...(byDay.get(log.worn_on) ?? []), item]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageTitle>{t.wear.statsTitle}</PageTitle>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t.wear.statsSubtitle}</p>
        <p className="mt-3 text-lg font-semibold text-accent">{plural(t.wear.thisMonth, thisMonth, locale)}</p>
      </div>

      {logs.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">{t.wear.empty}</p>}

      {mostWorn.length > 0 && (
        <Section title={t.wear.mostWorn}>
          <ItemList
            rows={mostWorn.map(({ item, count, last }) => ({
              item,
              line1: plural(t.wear.timesWorn, count, locale),
              line2: last ? format(t.wear.lastWorn, { date: formatDate(last, locale) }) : "",
            }))}
          />
        </Section>
      )}

      {costPerWear.length > 0 && (
        <Section title={t.wear.costPerWear} hint={t.wear.costPerWearHint}>
          <ItemList
            rows={costPerWear.map(({ item, count, per }) => ({
              item,
              line1: format(t.wear.perWear, { price: formatPrice(per, locale) }),
              line2: `${formatPrice(item.price!, locale)} · ${plural(t.wear.timesWorn, count, locale)}`,
            }))}
          />
        </Section>
      )}

      {byDay.size > 0 && (
        <Section title={t.wear.recent}>
          <ul className="flex flex-col gap-3">
            {[...byDay.entries()].map(([day, items]) => (
              <li key={day} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <span className="w-28 shrink-0 text-sm font-medium">{formatDate(day, locale)}</span>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <Link key={item.id} href={`/wardrobe/${item.id}`} title={item.name} className="press size-14 overflow-hidden rounded-lg bg-photo">
                      <ItemImage item={item} />
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {forgotten.length > 0 && (
        <Section title={t.wear.forgotten} hint={t.wear.forgottenHint}>
          <ItemList
            rows={forgotten.map(({ item, last }) => ({
              item,
              line1: last ? format(t.wear.lastWorn, { date: formatDate(last, locale) }) : t.wear.neverWorn,
              line2: "",
            }))}
          />
        </Section>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function ItemList({ rows }: { rows: { item: ItemWithPhotos; line1: string; line2: string }[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map(({ item, line1, line2 }) => (
        <li key={item.id}>
          <Link href={`/wardrobe/${item.id}`} className="press flex items-center gap-3 rounded-xl border border-line bg-surface p-2 hover:border-muted">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-photo">
              <ItemImage item={item} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-accent">{line1}</p>
              {line2 && <p className="text-xs text-muted">{line2}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { plural } from "@/lib/i18n/plural";
import type { Dictionary } from "@/lib/i18n";
import { listItems } from "@/lib/db/items";
import { listOutfits } from "@/lib/db/outfits";
import { toTryOnItem } from "@/lib/try-on";
import { suggestOutfits, type IdeaReason } from "@/lib/ideas/suggest";
import { PageTitle } from "@/components/PageTitle";
import { buttonClasses } from "@/components/ui/Button";
import { IdeaCard, SavedOutfitCard } from "@/features/outfits/OutfitCards";
import type { FittingRoomItem } from "@/features/fitting-room/types";

type OutfitsPageProps = { searchParams: Promise<{ seed?: string }> };

/** "Neutral base with one accent colour: Red" etc., in the user's language. */
function describe(reason: IdeaReason, t: Dictionary): string {
  if (reason.kind === "neutral") return t.outfits.reasons.neutral;
  if (reason.kind === "accent") return format(t.outfits.reasons.accent, { colour: t.colours[reason.colour] });
  return format(t.outfits.reasons.pair, { a: t.colours[reason.colours[0]], b: t.colours[reason.colours[1]] });
}

const grid = "grid grid-cols-2 gap-[clamp(0.75rem,1.2vw,1.25rem)] md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

export default async function OutfitsPage({ searchParams }: OutfitsPageProps) {
  const [t, locale, wardrobe, outfits, { seed }] = await Promise.all([getT(), getLocale(), listItems(), listOutfits(), searchParams]);

  const byId = new Map<string, FittingRoomItem>(
    wardrobe.map((item) => [item.id, { ...toTryOnItem(item), price: item.price, storeName: item.store_name }]),
  );
  const itemsOf = (ids: string[]) => ids.map((id) => byId.get(id)).filter((i): i is FittingRoomItem => !!i);

  // Ideas from your own clothes (worn-out and already-saved combinations skipped).
  const ideaItems = wardrobe.map(({ id, category, colour, status, condition }) => ({ id, category, colour, status, condition }));
  const saved = outfits.map((o) => o.itemIds);
  const seedNumber = Number(seed) || 1;
  const { ideas } = suggestOutfits({ items: ideaItems, saved, seed: seedNumber });

  // "Thinking of buying?": how each not-owned item works with what you own.
  const candidates = wardrobe
    .filter((item) => item.status === "not_owned")
    .map((item) => ({ item, ...suggestOutfits({ items: ideaItems, saved, mustInclude: item.id, limit: 1, seed: seedNumber }) }));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle>{t.pages.outfits}</PageTitle>
          <p className="mt-1 text-sm text-muted">{plural(t.outfits.count, outfits.length, locale)}</p>
        </div>
        <Link href="/fitting-room" className={buttonClasses("primary")}>
          + {t.outfits.newOutfit}
        </Link>
      </div>

      {/* ---- saved outfits ---- */}
      <section className="flex flex-col gap-4" aria-labelledby="saved-heading">
        <h2 id="saved-heading" className="text-lg font-semibold">
          {t.outfits.savedTitle}
        </h2>
        {outfits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">{t.outfits.empty}</p>
        ) : (
          // One grid, sorted by code (1.1, 1.2, 2.1 …), so variations sit side by side.
          <ul className={grid}>
            {outfits.map((outfit) => (
              <li key={outfit.id}>
                <SavedOutfitCard id={outfit.id} code={outfit.code} name={outfit.name} items={itemsOf(outfit.itemIds)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- ideas ---- */}
      <section className="flex flex-col gap-4" aria-labelledby="ideas-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="ideas-heading" className="text-lg font-semibold">
              {t.outfits.ideasTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t.outfits.ideasHint}</p>
          </div>
          {ideas.length > 0 && (
            <Link href={`/outfits?seed=${seedNumber + 1}`} scroll={false} className={buttonClasses("secondary")}>
              {t.outfits.shuffle}
            </Link>
          )}
        </div>
        {ideas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">{t.outfits.noIdeas}</p>
        ) : (
          <ul className={grid}>
            {ideas.map((idea) => (
              <li key={idea.itemIds.join()}>
                <IdeaCard items={itemsOf(idea.itemIds)} reason={describe(idea.reason, t)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- thinking of buying? ---- */}
      {candidates.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="buying-heading">
          <div>
            <h2 id="buying-heading" className="text-lg font-semibold">
              {t.outfits.buyingTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t.outfits.buyingHint}</p>
          </div>
          <ul className={grid}>
            {candidates.map(({ item, ideas: best, total }) => (
              <li key={item.id} className="flex flex-col gap-2">
                <p className="text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className={`block text-xs ${total > 0 ? "text-success" : "text-muted"}`}>
                    {total > 0 ? plural(t.outfits.buyingCount, total, locale) : t.outfits.buyingNone}
                  </span>
                </p>
                {best[0] && <IdeaCard items={itemsOf(best[0].itemIds)} reason={describe(best[0].reason, t)} />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

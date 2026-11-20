import Link from "next/link";
import type { CategoryId } from "@/config/dolab.config";
import { getT } from "@/lib/i18n/server";
import { listItems } from "@/lib/db/items";
import { getOutfit, listOutfits } from "@/lib/db/outfits";
import { listWearLogs, summarise } from "@/lib/db/wear";
import type { EditingOutfit } from "@/features/outfits/SaveOutfitPanel";
import { getProfile } from "@/lib/db/profile";
import { hasBodyProfile, toBodyProfile } from "@/lib/body/profile";
import { toTryOnItem } from "@/lib/try-on";
import { PageTitle } from "@/components/PageTitle";
import { buttonClasses } from "@/components/ui/Button";
import { FittingRoom } from "@/features/fitting-room/FittingRoom";
import type { FittingRoomItem } from "@/features/fitting-room/types";
import { pageTitle } from "@/lib/i18n/metadata";

type FittingRoomPageProps = { searchParams: Promise<{ with?: string | string[]; outfit?: string }> };

// Start with a simple everyday outfit so the mannequin isn't bare.
const startWith: CategoryId[] = ["inner_top", "bottoms", "shoes"];


export const generateMetadata = pageTitle((t) => t.nav.fittingRoom);

export default async function FittingRoomPage({ searchParams }: FittingRoomPageProps) {
  const [t, profile, wardrobe, params] = await Promise.all([getT(), getProfile(), listItems(), searchParams]);
  // ?outfit=<id> opens a saved outfit for editing.
  const [outfit, allOutfits, recentWears] = await Promise.all([
    params.outfit ? getOutfit(params.outfit) : null,
    listOutfits(),
    listWearLogs(2),
  ]);
  const lastWorn = Object.fromEntries([...summarise(recentWears)].map(([id, s]) => [id, s.last]));

  const items: FittingRoomItem[] = wardrobe.map((item) => ({
    ...toTryOnItem(item),
    price: item.price,
    storeName: item.store_name,
  }));

  // ?with=<id> (e.g. "Try it on" from an item page) puts that item on first.
  const requested = [params.with ?? []].flat();
  const selection: Partial<Record<CategoryId, string>> = {};
  // A saved outfit starts with exactly its items; otherwise a simple default outfit.
  for (const category of outfit ? [] : startWith) {
    const pick = items.find((i) => i.category === category && i.status === "owned");
    if (pick) selection[category] = pick.id;
  }
  for (const id of [...(outfit?.itemIds ?? []), ...requested]) {
    const item = items.find((i) => i.id === id);
    if (item) selection[item.category] = item.id;
  }

  const editing: EditingOutfit | null = outfit
    ? {
        id: outfit.id,
        code: outfit.code,
        name: outfit.name,
        notes: outfit.notes,
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{t.pages.fittingRoom}</PageTitle>

      {!hasBodyProfile(profile) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <div>
            <p className="font-medium">{t.fittingRoom.setupTitle}</p>
            <p className="text-sm text-muted">{t.fittingRoom.setupBody}</p>
          </div>
          <Link href="/fitting-room/avatar" className={buttonClasses("primary")}>
            {t.fittingRoom.setupButton}
          </Link>
        </div>
      )}

      <FittingRoom body={toBodyProfile(profile)} items={items} initialSelection={selection} hasProfile={hasBodyProfile(profile)}
        initialOuterOpen={outfit?.jacket_open ?? true}
        editing={editing}
        existingCodes={allOutfits.map((o) => o.code)}
        lastWorn={lastWorn}
        // A different outfit = a fresh fitting room (new selection, new save panel).
        key={outfit?.id ?? "new"}
      />
    </div>
  );
}

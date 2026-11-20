"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { categories, type CategoryId } from "@/config/dolab.config";
import type { BodyProfile } from "@/lib/body/profile";
import { sizeHint } from "@/lib/body/sizing";
import { format } from "@/lib/i18n/format";
import { renderTryOn, type TryOnResult } from "@/lib/try-on";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { plural } from "@/lib/i18n/plural";
import { formatPrice } from "@/lib/helpers/format";
import { buttonClasses } from "@/components/ui/Button";
import { BagIcon } from "@/components/icons";
import { GhostMannequin } from "./GhostMannequin";
import { OutfitBoard } from "./OutfitBoard";
import { CutoutImage } from "./CutoutImage";
import { FlatGarment } from "./FlatGarment";
import type { FittingRoomItem } from "./types";
import { SaveOutfitPanel, type EditingOutfit } from "@/features/outfits/SaveOutfitPanel";
import { WoreTodayButton } from "@/features/wear/WoreTodayButton";

type View = "board" | "mannequin";
type Selection = Partial<Record<CategoryId, string>>; // category → item id

type FittingRoomProps = {
  body: BodyProfile;
  items: FittingRoomItem[];
  initialSelection: Selection;
  /** false until the user has filled in the avatar page (then sizes are guesses from defaults). */
  hasProfile: boolean;
  /** Outer layer worn open (default) or closed — saved with the outfit. */
  initialOuterOpen?: boolean;
  /** The saved outfit being edited (opened from the Outfits page), if any. */
  editing?: EditingOutfit | null;
  existingCodes?: string[];
  /** item id → last day worn, for the "Wore it today" button. */
  lastWorn?: Record<string, string>;
};

export function FittingRoom({ body, items, initialSelection, hasProfile, initialOuterOpen = true, editing = null, existingCodes = [], lastWorn = {} }: FittingRoomProps) {
  const { t, locale } = useI18n();
  const [view, setView] = useState<View>("board"); // the outfit board is the main view
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [outerOpen, setOuterOpen] = useState(initialOuterOpen);

  const byCategory = useMemo(() => {
    const groups = new Map<CategoryId, FittingRoomItem[]>();
    for (const item of items) groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
    return groups;
  }, [items]);

  const chosen = useMemo(
    () => items.filter((item) => selection[item.category] === item.id),
    [items, selection],
  );

  // Ask the try-on renderer for a new picture whenever the outfit changes.
  // It's async (a future AI service takes a few seconds), so ignore answers
  // that arrive after the outfit has changed again.
  useEffect(() => {
    let live = true;
    renderTryOn({ body, items: chosen, outerOpen }).then((next) => live && setResult(next));
    return () => {
      live = false;
    };
  }, [body, chosen, outerOpen]);

  const toggle = (category: CategoryId, id: string | null) =>
    setSelection((current) => ({ ...current, [category]: id ?? undefined }));

  const wearsOuterLayer = chosen.some((item) => item.category === "outer_layer");
  const notOwned = chosen.filter((item) => item.status === "not_owned");
  const notOwnedTotal = notOwned.reduce((sum, item) => sum + (item.price ?? 0), 0);

  return (
    <div className="grid gap-[clamp(1.25rem,2.5vw,2.5rem)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-start">
      {/* ---- the stage ---- */}
      {/* The stage is as wide as its column, but never taller than the window (4:5 board). */}
      <section className="mx-auto flex w-full max-w-[min(100%,calc((100dvh-11rem)*0.8))] flex-col gap-3 md:sticky md:top-20">
        <div role="tablist" aria-label={t.fittingRoom.viewLabel} className="grid grid-cols-2 rounded-xl border border-line bg-surface p-1">
          {(["board", "mannequin"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-lg py-2 text-sm font-medium transition ${view === v ? "bg-accent text-on-accent" : "text-muted hover:text-fg"}`}
            >
              {v === "mannequin" ? t.fittingRoom.viewMannequin : t.fittingRoom.viewBoard}
            </button>
          ))}
        </div>

        {view === "mannequin" ? (
          <div className="relative flex aspect-4/5 justify-center overflow-hidden rounded-3xl border border-line bg-[radial-gradient(ellipse_at_50%_35%,#262b34_0%,#14171c_75%)] py-4">
            {result?.kind === "image" ? (
              <img src={result.imageUrl} alt={t.fittingRoom.mannequinAlt} className="h-full w-auto object-contain" />
            ) : (
              <GhostMannequin
                body={body}
                layers={result?.kind === "layers" ? result.layers : []}
                canvasHeight={result?.kind === "layers" ? result.canvasHeight : undefined}
                className="h-full w-auto"
                title={t.fittingRoom.mannequinAlt}
              />
            )}
          </div>
        ) : chosen.length > 0 ? (
          <OutfitBoard items={chosen} />
        ) : (
          <p className="grid aspect-4/5 place-items-center rounded-3xl border border-dashed border-line p-8 text-center text-muted">
            {t.fittingRoom.boardEmpty}
          </p>
        )}

        {view === "mannequin" && wearsOuterLayer && (
          <div role="radiogroup" aria-label={t.fittingRoom.jacketLabel} className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1 text-sm">
            {[true, false].map((isOpen) => (
              <button
                key={String(isOpen)}
                type="button"
                role="radio"
                aria-checked={outerOpen === isOpen}
                onClick={() => setOuterOpen(isOpen)}
                className={`press rounded-lg py-2 font-medium ${outerOpen === isOpen ? "bg-raised text-fg" : "text-muted hover:text-fg"}`}
              >
                {isOpen ? t.fittingRoom.jacketOpen : t.fittingRoom.jacketClosed}
              </button>
            ))}
          </div>
        )}

        {notOwned.length > 0 && (
          <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm">
            {plural(t.fittingRoom.notOwnedSummary, notOwned.length, locale)}
            {notOwnedTotal > 0 && <strong className="ms-1 text-accent">{formatPrice(notOwnedTotal, locale)}</strong>}
            {hasProfile && (
              <span className="mt-1 block text-xs text-muted">
                {format(t.fittingRoom.sizeHint, { top: sizeHint(body).top, bottom: sizeHint(body).bottom })}
              </span>
            )}
          </p>
        )}

        <SaveOutfitPanel itemIds={chosen.map((item) => item.id)} jacketOpen={outerOpen} editing={editing} existingCodes={existingCodes} />
        {/* key: a different set of items starts with a fresh "worn today?" state */}
        <WoreTodayButton key={chosen.map((i) => i.id).join()} itemIds={chosen.filter((i) => i.status === "owned").map((i) => i.id)} outfitId={editing?.id} lastWorn={lastWorn} />
      </section>

      {/* ---- the item pickers ---- */}
      <section className="flex flex-col gap-5" aria-label={t.fittingRoom.pickItems}>
        {categories.map(({ id: category }) => {
          const options = byCategory.get(category) ?? [];
          return (
            <fieldset key={category} className="flex flex-col gap-2">
              <legend className="mb-2 flex w-full items-center justify-between text-sm font-medium">
                <span>{t.categories[category]}</span>
              </legend>
              {options.length === 0 ? (
                <p className="text-xs text-muted">
                  {t.fittingRoom.noItemsInCategory}{" "}
                  <Link href="/wardrobe/new" className="text-accent hover:underline">
                    {t.wardrobe.addItem}
                  </Link>
                </p>
              ) : (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  <PickerTile selected={!selection[category]} label={t.fittingRoom.none} onClick={() => toggle(category, null)}>
                    <span className="text-xs text-[#6b6660]">{t.fittingRoom.none}</span>
                  </PickerTile>
                  {options.map((item) => (
                    <PickerTile key={item.id} selected={selection[category] === item.id} label={item.name} onClick={() => toggle(category, selection[category] === item.id ? null : item.id)}>
                      <Thumb item={item} />
                      {item.status === "not_owned" && (
                        // A small shopping-bag badge: readable at any tile size.
                        <span
                          title={t.wardrobe.notOwnedBadge}
                          className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-accent text-on-accent shadow"
                        >
                          <BagIcon width={14} height={14} aria-hidden />
                          <span className="sr-only">{t.wardrobe.notOwnedBadge}</span>
                        </span>
                      )}
                    </PickerTile>
                  ))}
                </div>
              )}
            </fieldset>
          );
        })}

        <Link href="/fitting-room/avatar" className={buttonClasses("secondary", "self-start")}>
          {t.fittingRoom.editAvatar}
        </Link>
      </section>
    </div>
  );
}

function PickerTile({ selected, label, onClick, children }: { selected: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={label}
      aria-label={label}
      className={`press relative grid size-[clamp(4.5rem,6vw,6rem)] shrink-0 place-items-center overflow-hidden rounded-xl border-2 bg-photo ${selected ? "border-accent" : "border-transparent hover:border-line"}`}
    >
      {children}
    </button>
  );
}

function Thumb({ item }: { item: FittingRoomItem }) {
  if (item.cutoutUrl) return <CutoutImage url={item.cutoutUrl} alt="" className="photo-shadow size-full p-2" />;
  if (item.photoUrl) return <img src={item.photoUrl} alt="" className="size-full object-cover" />;
  return <FlatGarment category={item.category} colour={item.colour} className="photo-shadow size-full p-2" />;
}

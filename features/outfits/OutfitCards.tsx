"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { format } from "@/lib/i18n/format";
import { plural } from "@/lib/i18n/plural";
import { formatPrice } from "@/lib/helpers/format";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { OutfitBoard } from "@/features/fitting-room/OutfitBoard";
import type { FittingRoomItem } from "@/features/fitting-room/types";
import { deleteOutfit, renameOutfit, saveOutfit } from "./actions";
import { WoreTodayButton } from "@/features/wear/WoreTodayButton";
import { ShareButton } from "./ShareButton";
import type { OutfitErrorKey } from "./validation";

function notOwnedTotal(items: FittingRoomItem[]) {
  const notOwned = items.filter((i) => i.status === "not_owned");
  return { count: notOwned.length, total: notOwned.reduce((sum, i) => sum + (i.price ?? 0), 0) };
}

const cardClasses = "flex flex-col overflow-hidden rounded-2xl border border-line bg-surface";

// ---------------------------------------------------------------------------
// A saved outfit: mini flat-lay + code/name + actions.
// ---------------------------------------------------------------------------
export function SavedOutfitCard({
  id,
  code,
  name,
  items,
  lastWorn,
  shareToken,
}: {
  id: string;
  code: string;
  name: string | null;
  items: FittingRoomItem[];
  lastWorn: Record<string, string>;
  shareToken: string | null;
}) {
  const { t, locale } = useI18n();
  const [error, setError] = useState<OutfitErrorKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const title = name || format(t.outfits.untitled, { code });
  const { count, total } = notOwnedTotal(items);

  function run(action: () => Promise<{ status: string; errorKey?: OutfitErrorKey } | undefined>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.status === "error" && result.errorKey) setError(result.errorKey);
    });
  }

  return (
    <article className={`${cardClasses} ${isPending ? "opacity-60" : ""}`}>
      <Link href={`/fitting-room?outfit=${id}`} className="press m-2 mb-0 block rounded-xl" aria-label={`${t.outfits.open}: ${title}`}>
        {items.length > 0 ? (
          <OutfitBoard items={items} />
        ) : (
          <div className="grid aspect-4/5 place-items-center rounded-3xl bg-photo p-4 text-center text-sm text-[#6b6660]">{t.fittingRoom.boardEmpty}</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          <span className="shrink-0 rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-semibold text-accent" dir="ltr">
            {code}
          </span>
          <h3 className="min-w-0 flex-1 truncate font-medium" title={title}>
            {title}
          </h3>
        </div>
        <p className="text-xs text-muted">
          {plural(t.outfits.itemCount, items.length, locale)}
          {count > 0 && total > 0 && <span className="text-accent"> · {format(t.outfits.notOwnedTotal, { total: formatPrice(total, locale) })}</span>}
        </p>
        <WoreTodayButton itemIds={items.filter((i) => i.status === "owned").map((i) => i.id)} outfitId={id} lastWorn={lastWorn} size="small" />
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <Link href={`/fitting-room?outfit=${id}`} className={buttonClasses("secondary", "min-h-9 px-3 py-1.5 text-xs")}>
            {t.outfits.open}
          </Link>
          <Button
            variant="ghost"
            className="min-h-9 px-3 py-1.5 text-xs"
            disabled={isPending}
            onClick={() => {
              const next = window.prompt(format(t.outfits.renamePrompt, { code }), name ?? "");
              if (next !== null) run(() => renameOutfit(id, next));
            }}
          >
            {t.outfits.rename}
          </Button>
          <Button
            variant="ghost"
            className="min-h-9 px-3 py-1.5 text-xs text-danger hover:text-danger"
            disabled={isPending}
            onClick={() => {
              if (window.confirm(format(t.outfits.confirmDelete, { code }))) run(() => deleteOutfit(id));
            }}
          >
            {t.outfits.delete}
          </Button>
        </div>
        <ShareButton outfitId={id} title={title} initialToken={shareToken} />
        {error && <Alert tone="error">{t.outfits.errors[error]}</Alert>}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// An outfit idea: mini flat-lay + why it works + Try on / Save.
// ---------------------------------------------------------------------------
export function IdeaCard({ items, reason }: { items: FittingRoomItem[]; reason: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [error, setError] = useState<OutfitErrorKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const { count, total } = notOwnedTotal(items);
  const tryOnHref = `/fitting-room?${items.map((i) => `with=${i.id}`).join("&")}`;

  return (
    <article className={cardClasses}>
      <Link href={tryOnHref} className="press m-2 mb-0 block rounded-xl" aria-label={t.outfits.tryOn}>
        <OutfitBoard items={items} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-sm">{reason}</p>
        {count > 0 && total > 0 && (
          <p className="text-xs text-accent">{format(t.outfits.notOwnedTotal, { total: formatPrice(total, locale) })}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <Link href={tryOnHref} className={buttonClasses("secondary", "min-h-9 px-3 py-1.5 text-xs")}>
            {t.outfits.tryOn}
          </Link>
          {savedCode ? (
            <span className="self-center text-xs text-success">{format(t.outfits.savedMessage, { code: savedCode })}</span>
          ) : (
            <Button
              className="min-h-9 px-3 py-1.5 text-xs"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await saveOutfit({ itemIds: items.map((i) => i.id), mode: "new" });
                  if (result.status === "error") return setError(result.errorKey);
                  setSavedCode(result.code);
                  // Show it under "Saved outfits" (and drop it from the ideas).
                  setTimeout(() => router.refresh(), 1200);
                })
              }
            >
              {isPending ? t.common.working : t.outfits.save}
            </Button>
          )}
        </div>
        {error && <Alert tone="error">{t.outfits.errors[error]}</Alert>}
      </div>
    </article>
  );
}

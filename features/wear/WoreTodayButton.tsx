"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { undoWearToday, wearToday } from "./actions";

/** Today's date where the user is, e.g. "2026-11-15" (en-CA formats dates as YYYY-MM-DD). */
const localToday = () => new Date().toLocaleDateString("en-CA");

type WoreTodayButtonProps = {
  itemIds: string[];
  outfitId?: string | null;
  /** item id → the last day it was worn ("YYYY-MM-DD"), to show "Worn today" straight away. */
  lastWorn: Record<string, string>;
  size?: "normal" | "small";
};

// "Wore it today" for an outfit (or any set of items). Pressing it again does
// nothing new; "Undo" removes today's entries.
export function WoreTodayButton({ itemIds, outfitId = null, lastWorn, size = "normal" }: WoreTodayButtonProps) {
  const { t } = useI18n();
  const [worn, setWorn] = useState(() => itemIds.length > 0 && itemIds.every((id) => lastWorn[id] === localToday()));
  const [failed, setFailed] = useState(false);
  const [isPending, start] = useTransition();
  const small = size === "small" ? "min-h-9 px-3 py-1.5 text-xs" : "";

  function toggle(next: boolean) {
    setFailed(false);
    setWorn(next); // show it right away; flip back if saving fails
    start(async () => {
      const result = next ? await wearToday(itemIds, localToday(), outfitId) : await undoWearToday(itemIds, localToday());
      if (result.status === "error") {
        setWorn(!next);
        setFailed(true);
      }
    });
  }

  if (itemIds.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {worn ? (
        <>
          <span className={`text-success ${size === "small" ? "text-xs" : "text-sm"}`}>✓ {t.wear.worn}</span>
          <Button variant="ghost" className={small} disabled={isPending} onClick={() => toggle(false)}>
            {t.wear.undo}
          </Button>
        </>
      ) : (
        <Button variant="secondary" className={small} disabled={isPending} onClick={() => toggle(true)}>
          {t.wear.woreIt}
        </Button>
      )}
      {failed && <span className="text-xs text-danger">{t.wear.failed}</span>}
    </span>
  );
}

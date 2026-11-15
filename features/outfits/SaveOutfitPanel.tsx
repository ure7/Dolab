"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { format } from "@/lib/i18n/format";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { saveOutfit, type SaveMode } from "./actions";
import { nextVariationCode } from "./code";
import type { OutfitErrorKey } from "./validation";

/** The saved outfit currently open in the fitting room (if any). */
export type EditingOutfit = { id: string; code: string; name: string | null; notes: string | null };

type SaveOutfitPanelProps = {
  itemIds: string[];
  jacketOpen: boolean;
  editing: EditingOutfit | null;
  /** Codes of all saved outfits, to show the next variation number. */
  existingCodes: string[];
};

// "Save this outfit" box under the fitting-room stage.
//  - new outfit:      [Save outfit]                         → gets the next family code, e.g. 4.1
//  - editing outfit:  [Save changes] [Save as variation 3.2] [Save as a new outfit]
export function SaveOutfitPanel({ itemIds, jacketOpen, editing, existingCodes }: SaveOutfitPanelProps) {
  const { t } = useI18n();
  // The outfit being edited: the one we opened, or the one we just saved.
  const [current, setCurrent] = useState<{ id: string; code: string } | null>(editing);
  const [codes, setCodes] = useState(existingCodes);
  const [name, setName] = useState(editing?.name ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<OutfitErrorKey | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function save(mode: SaveMode) {
    setError(null);
    setSavedCode(null);
    startSaving(async () => {
      const result = await saveOutfit({ itemIds, name, notes, mode, outfitId: current?.id, jacketOpen });
      if (result.status === "error") return setError(result.errorKey);
      setSavedCode(result.code);
      // Keep working on the outfit we just saved: the next "Save changes" updates it.
      setCurrent({ id: result.id, code: result.code });
      setCodes((list) => (list.includes(result.code) ? list : [...list, result.code]));
      // Update the address (so a refresh reopens this outfit) without reloading the page.
      window.history.replaceState(null, "", `/fitting-room?outfit=${result.id}`);
    });
  }

  const disabled = isSaving || itemIds.length === 0;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4" aria-label={t.outfits.saveTitle}>
      <h2 className="text-sm font-semibold">{current ? format(t.outfits.editing, { code: current.code }) : t.outfits.saveTitle}</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t.outfits.name}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={t.outfits.namePlaceholder}
            className="rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t.outfits.notes}
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            className="rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {current ? (
          <>
            <Button onClick={() => save("update")} disabled={disabled}>
              {isSaving ? t.common.working : t.outfits.saveChanges}
            </Button>
            <Button variant="secondary" onClick={() => save("variation")} disabled={disabled}>
              {format(t.outfits.saveVariation, { code: nextVariationCode(codes, current.code) })}
            </Button>
            <Button variant="ghost" onClick={() => save("new")} disabled={disabled}>
              {t.outfits.saveAsNew}
            </Button>
          </>
        ) : (
          <Button onClick={() => save("new")} disabled={disabled}>
            {isSaving ? t.common.working : t.outfits.saveNew}
          </Button>
        )}
      </div>

      {savedCode && (
        <Alert tone="success">
          {format(t.outfits.savedMessage, { code: savedCode })}{" "}
          <Link href="/outfits" className="font-medium underline">
            {t.outfits.viewAll}
          </Link>
        </Alert>
      )}
      {error && <Alert tone="error">{t.outfits.errors[error]}</Alert>}
    </section>
  );
}

"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { shoppingSections, type ShoppingSection } from "@/config/dolab.config";
import type { ShoppingItem } from "@/types/database";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { format } from "@/lib/i18n/format";
import { plural } from "@/lib/i18n/plural";
import { formatPrice } from "@/lib/helpers/format";
import { categoryOptions } from "@/features/wardrobe/options";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  addFromItem,
  addShoppingItem,
  clearBought,
  deleteShoppingItem,
  moveToSection,
  setBudget,
  setDone,
  type ShoppingErrorKey,
  type ShoppingResult,
} from "./actions";

const inputClasses =
  "w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none";

/** Runs a server action and remembers its error, if any. */
function useAction() {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<ShoppingErrorKey | null>(null);
  const run = (action: () => Promise<ShoppingResult>, onOk?: () => void) => {
    setError(null);
    start(async () => {
      const result = await action();
      if (result.status === "error") setError(result.errorKey);
      else onOk?.();
    });
  };
  return { isPending, error, run };
}

// ---------------------------------------------------------------------------
// One entry on the list
// ---------------------------------------------------------------------------
export function ShoppingRow({ entry }: { entry: ShoppingItem }) {
  const { t, locale } = useI18n();
  const { isPending, error, run } = useAction();
  const other: ShoppingSection = entry.section === "need" ? "nice_to_have" : "need";
  // The tick shows immediately; if saving fails it flips back.
  const [isDone, setIsDone] = useState(entry.is_done);

  return (
    <li className={`flex flex-col gap-1 rounded-xl border border-line bg-surface p-3 transition ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isDone}
          disabled={isPending}
          onChange={(e) => {
            const next = e.target.checked;
            setIsDone(next);
            run(async () => {
              const result = await setDone(entry.id, next);
              if (result.status === "error") setIsDone(!next);
              return result;
            });
          }}
          aria-label={format(t.shopping.markBought, { name: entry.name })}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-accent)]"
        />
        <div className="min-w-0 flex-1">
          <p className={`font-medium ${isDone ? "text-muted line-through" : ""}`}>{entry.name}</p>
          <p className="text-xs text-muted">
            {[entry.category ? t.categories[entry.category] : null, entry.notes].filter(Boolean).join(" · ")}
          </p>
          {entry.item_id && !entry.is_done && <p className="mt-0.5 text-xs text-accent/90">{t.shopping.linkedHint}</p>}
        </div>
        {entry.price_estimate !== null && (
          <span className="shrink-0 text-sm font-medium" dir="ltr">
            {formatPrice(entry.price_estimate, locale)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 ps-8">
        {!entry.is_done && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => moveToSection(entry.id, other))}
            className="press rounded-lg px-2 py-1 text-xs text-muted hover:bg-raised hover:text-fg"
          >
            {format(t.shopping.moveTo, { section: t.shopping.sections[other] })}
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => deleteShoppingItem(entry.id))}
          className="press rounded-lg px-2 py-1 text-xs text-muted hover:bg-raised hover:text-danger"
        >
          {t.shopping.remove}
        </button>
      </div>
      {error && <Alert tone="error">{t.shopping.errors[error]}</Alert>}
    </li>
  );
}

export function ClearBoughtButton() {
  const { t } = useI18n();
  const { isPending, error, run } = useAction();
  return (
    <>
      <Button variant="ghost" className="min-h-9 px-3 py-1.5 text-xs" disabled={isPending} onClick={() => run(clearBought)}>
        {t.shopping.clearBought}
      </Button>
      {error && <Alert tone="error">{t.shopping.errors[error]}</Alert>}
    </>
  );
}

// ---------------------------------------------------------------------------
// Add-to-list form
// ---------------------------------------------------------------------------
export function AddShoppingForm() {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const { isPending, error, run } = useAction();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    // Clear the form only when saving worked, so nothing typed is lost on an error.
    run(() => addShoppingItem(data), () => formRef.current?.reset());
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold">{t.shopping.addTitle}</h2>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t.shopping.name}
        <input name="name" required maxLength={80} placeholder={t.shopping.namePlaceholder} className={inputClasses} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t.shopping.section}
          <select name="section" defaultValue="need" className={inputClasses}>
            {shoppingSections.map((s) => (
              <option key={s} value={s}>
                {t.shopping.sections[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t.shopping.category}
          <select name="category" defaultValue="" className={inputClasses}>
            <option value="">{t.shopping.noCategory}</option>
            {categoryOptions(t).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t.shopping.price}
          <input name="price_estimate" inputMode="decimal" dir="ltr" className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t.shopping.notes}
          <input name="notes" maxLength={500} className={inputClasses} />
        </label>
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? t.common.working : t.shopping.add}
      </Button>
      {error && <Alert tone="error">{t.shopping.errors[error]}</Alert>}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------
export function BudgetCard({ budget, toBuy, unpriced }: { budget: number | null; toBuy: number; unpriced: number }) {
  const { t, locale } = useI18n();
  const { isPending, error, run } = useAction();
  const left = budget !== null ? budget - toBuy : null;
  const share = budget ? Math.min(1, toBuy / budget) : 0;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4" aria-label={t.shopping.budgetTitle}>
      <h2 className="text-sm font-semibold">{t.shopping.budgetTitle}</h2>
      <p className="text-2xl font-semibold" dir="auto">
        {format(t.shopping.toBuy, { total: formatPrice(toBuy, locale) })}
      </p>
      {budget !== null && budget > 0 ? (
        <>
          <div className="h-2 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={toBuy}>
            <div className={`h-full rounded-full ${left! < 0 ? "bg-danger" : "bg-accent"}`} style={{ width: `${share * 100}%` }} />
          </div>
          <p className={`text-sm ${left! < 0 ? "text-danger" : "text-success"}`}>
            {left! < 0 ? format(t.shopping.over, { over: formatPrice(-left!, locale) }) : format(t.shopping.left, { left: formatPrice(left!, locale) })}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted">{t.shopping.noBudget}</p>
      )}
      {unpriced > 0 && <p className="text-xs text-muted">{plural(t.shopping.unknownPrices, unpriced, locale)}</p>}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          run(() => setBudget(data));
        }}
      >
        <label className="flex flex-1 flex-col gap-1 text-xs text-muted">
          {t.shopping.budgetLabel}
          <input name="budget" inputMode="decimal" dir="ltr" defaultValue={budget ?? ""} className={inputClasses} />
        </label>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {t.shopping.saveBudget}
        </Button>
      </form>
      {error && <Alert tone="error">{t.shopping.errors[error]}</Alert>}
    </section>
  );
}

// ---------------------------------------------------------------------------
// "Add to list" button for a wardrobe item (suggestions + item page)
// ---------------------------------------------------------------------------
export function AddFromItemButton({ itemId, reason, onList = false, label }: { itemId: string; reason: "buy" | "replace"; onList?: boolean; label?: string }) {
  const { t } = useI18n();
  const { isPending, error, run } = useAction();
  const [added, setAdded] = useState(onList);

  if (added) return <span className="text-xs text-success">✓ {t.shopping.onList}</span>;
  return (
    <>
      <Button
        variant="secondary"
        className="min-h-9 px-3 py-1.5 text-xs"
        disabled={isPending}
        onClick={() => run(() => addFromItem(itemId, reason), () => setAdded(true))}
      >
        {isPending ? t.common.working : (label ?? t.shopping.addToList)}
      </Button>
      {error && <Alert tone="error">{t.shopping.errors[error]}</Alert>}
    </>
  );
}


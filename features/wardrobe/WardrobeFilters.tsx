"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SelectField } from "@/components/ui/SelectField";
import { categoryOptions, colourOptions, conditionOptions, statusOptions } from "./options";

const SEARCH_DELAY_MS = 300;

// Search box + filters. Every change updates the URL; the page (a server
// component) reads the URL and fetches the matching items.
export function WardrobeFilters() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Wait until typing pauses before searching, instead of on every key press.
  useEffect(() => {
    if (search === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => setParam("q", search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the text changes
  }, [search]);

  const activeStatus = searchParams.get("status") ?? "";
  const hasFilters = ["q", "category", "colour", "condition", "status"].some((key) => searchParams.has(key));

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={t.wardrobe.status} className="flex gap-1 rounded-xl bg-surface p-1 text-sm">
        {[{ value: "", label: t.wardrobe.filterAll }, ...statusOptions(t)].map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={activeStatus === option.value}
            onClick={() => setParam("status", option.value)}
            className={`flex-1 rounded-lg px-3 py-2 transition ${
              activeStatus === option.value ? "bg-raised text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t.wardrobe.searchPlaceholder}
        aria-label={t.wardrobe.searchPlaceholder}
        className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <SelectField
          label={t.wardrobe.category}
          hideLabel
          options={categoryOptions(t)}
          placeholder={t.wardrobe.filterAllCategories}
          value={searchParams.get("category") ?? ""}
          onChange={(event) => setParam("category", event.target.value)}
        />
        <SelectField
          label={t.wardrobe.colour}
          hideLabel
          options={colourOptions(t)}
          placeholder={t.wardrobe.filterAllColours}
          value={searchParams.get("colour") ?? ""}
          onChange={(event) => setParam("colour", event.target.value)}
        />
        <SelectField
          label={t.wardrobe.condition}
          hideLabel
          options={conditionOptions(t)}
          placeholder={t.wardrobe.filterAnyCondition}
          value={searchParams.get("condition") ?? ""}
          onChange={(event) => setParam("condition", event.target.value)}
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.replace(pathname, { scroll: false });
          }}
          className="self-start text-sm text-accent hover:underline"
        >
          {t.wardrobe.clearFilters}
        </button>
      )}
    </div>
  );
}

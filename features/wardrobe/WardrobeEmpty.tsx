import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { buttonClasses } from "@/components/ui/Button";
import { HangerIcon } from "@/components/icons";

// Shown when the wardrobe has no items at all (not when filters hide them).
export function WardrobeEmpty({ t }: { t: Dictionary }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-raised text-accent">
        <HangerIcon width={28} height={28} />
      </span>
      <h2 className="text-lg font-semibold">{t.wardrobe.emptyTitle}</h2>
      <p className="max-w-xs text-sm text-muted">{t.wardrobe.emptyBody}</p>
      <Link href="/wardrobe/new" className={buttonClasses("primary", "mt-2")}>
        {t.wardrobe.addItem}
      </Link>
    </div>
  );
}

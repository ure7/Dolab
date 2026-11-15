"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Button, buttonClasses } from "@/components/ui/Button";

// Shown when a logged-in page fails to load (e.g. the internet drops while
// fetching). The header and tab bar stay, so you can still move around.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">{t.common.errorTitle}</h1>
      <p className="max-w-md text-muted">{t.common.errorBody}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>{t.common.tryAgain}</Button>
        <Link href="/wardrobe" className={buttonClasses("secondary")}>
          {t.common.goHome}
        </Link>
      </div>
    </div>
  );
}

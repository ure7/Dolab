import { setLocale } from "@/lib/i18n/actions";
import { getLocale, getT } from "@/lib/i18n/server";
import { buttonClasses } from "@/components/ui/Button";

// A tiny form instead of a client-side click handler: it works even before
// JavaScript has loaded, and the server re-renders the page in the new language.
export async function LanguageToggle() {
  const locale = await getLocale();
  const t = await getT();
  const nextLocale = locale === "en" ? "ar" : "en";

  return (
    <form action={setLocale}>
      <input type="hidden" name="locale" value={nextLocale} />
      <button
        type="submit"
        lang={nextLocale}
        aria-label={t.common.switchLanguageLabel}
        className={buttonClasses("secondary", "px-3 py-2")}
      >
        {t.common.switchLanguage}
      </button>
    </form>
  );
}

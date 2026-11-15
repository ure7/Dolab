import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { pageTitle } from "@/lib/i18n/metadata";
import { LogoMark } from "@/components/LogoMark";
import { buttonClasses } from "@/components/ui/Button";

export const generateMetadata = pageTitle((t) => t.common.notFoundTitle);

// Shown for any URL that doesn't exist (and for notFound() calls), in the
// user's language.
export default async function NotFound() {
  const t = await getT();
  return (
    <main className="page-container flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
      <LogoMark size={64} className="rounded-[15px] opacity-90" />
      <p className="text-6xl font-semibold text-accent" aria-hidden>
        404
      </p>
      <h1 className="text-[clamp(1.5rem,1.2rem+0.9vw,2.25rem)] font-semibold">{t.common.notFoundTitle}</h1>
      <p className="max-w-md text-muted">{t.common.notFoundBody}</p>
      <Link href="/wardrobe" className={buttonClasses("primary")}>
        {t.common.goHome}
      </Link>
    </main>
  );
}

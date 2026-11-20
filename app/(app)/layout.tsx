import { requireUserId } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

// Wraps every logged-in page. "(app)" in brackets is a route group: it shares
// this layout without adding "/app" to the URL.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUserId();
  const t = await getT();

  return (
    <>
      {/* Keyboard users can jump past the navigation straight to the page. */}
      <a
        href="#content"
        className="sr-only start-0 top-0 z-50 rounded-xl bg-accent font-medium text-on-accent focus:not-sr-only focus:fixed focus:start-4 focus:top-3 focus:px-4 focus:py-2"
      >
        {t.common.skipToContent}
      </a>
      <AppHeader />
      {/* Bottom padding on phones so content isn't hidden behind the tab bar. */}
      <main id="content" className="page-container flex-1 pt-[clamp(1.25rem,2.5vw,2.5rem)] pb-28 md:pb-16">{children}</main>
      <BottomNav />
    </>
  );
}

import { requireUserId } from "@/lib/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

// Wraps every logged-in page. "(app)" in brackets is a route group: it shares
// this layout without adding "/app" to the URL.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUserId();

  return (
    <>
      <AppHeader />
      {/* Bottom padding on phones so content isn't hidden behind the tab bar. */}
      <main className="page-container flex-1 pt-[clamp(1.25rem,2.5vw,2.5rem)] pb-28 md:pb-16">{children}</main>
      <BottomNav />
    </>
  );
}

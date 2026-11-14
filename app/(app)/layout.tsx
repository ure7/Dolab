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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:pb-12">{children}</main>
      <BottomNav />
    </>
  );
}

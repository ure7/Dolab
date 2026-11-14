import { LogoMark } from "@/components/LogoMark";
import { Wordmark } from "@/components/Logo";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

// Layout for the public pages (login, sign up). The "(auth)" folder name in
// brackets groups routes without adding "/auth" to the URL.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,var(--color-raised),transparent_60%)]">
      <header className="flex justify-end px-4 py-4 sm:px-6">
        <LanguageToggle />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-16">
        <div className="flex flex-col items-center gap-3">
          <LogoMark size={64} className="shadow-lg shadow-black/40 rounded-[15px]" />
          <Wordmark className="text-2xl" />
        </div>
        {children}
      </main>
    </div>
  );
}

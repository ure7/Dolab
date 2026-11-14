import { NavLinks } from "./NavLinks";

// Phone-only tab bar, within thumb reach. Hidden from medium screens up,
// where the links sit in the header instead.
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <NavLinks variant="bottom" />
    </nav>
  );
}

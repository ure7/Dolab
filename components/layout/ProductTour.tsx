"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { buttonClasses } from "@/components/ui/Button";

// A short guided tour of the app (driver.js). It opens by itself the first
// time someone lands on their wardrobe, and again whenever they press "Tour".
// driver.js is only downloaded when the tour starts, so it doesn't slow down
// normal page loads.

const SEEN_KEY = "dolab-tour-seen";

/** The visible copy of a nav link: the header one on big screens, the tab bar on phones. */
function visible(selector: string): Element | undefined {
  return [...document.querySelectorAll(selector)].find((el) => (el as HTMLElement).offsetParent !== null);
}

export function ProductTour() {
  const { t } = useI18n();
  const pathname = usePathname();

  const start = useCallback(async () => {
    const [{ driver }] = await Promise.all([import("driver.js"), import("driver.js/dist/driver.css")]);
    const step = (key: string, title: string, description: string) => {
      const element = visible(`[data-tour="${key}"]`);
      return { element, popover: { title, description } };
    };
    const tour = driver({
      showProgress: true,
      progressText: t.tour.progress,
      nextBtnText: t.tour.next,
      prevBtnText: t.tour.back,
      doneBtnText: t.tour.done,
      popoverClass: "dolab-tour",
      stageRadius: 12,
      overlayOpacity: 0.65,
      steps: [
        { popover: { title: t.tour.welcomeTitle, description: t.tour.welcomeBody } },
        step("nav-wardrobe", t.tour.wardrobeTitle, t.tour.wardrobeBody),
        step("nav-fittingRoom", t.tour.fittingRoomTitle, t.tour.fittingRoomBody),
        step("nav-outfits", t.tour.outfitsTitle, t.tour.outfitsBody),
        step("nav-shopping", t.tour.shoppingTitle, t.tour.shoppingBody),
        step("language", t.tour.languageTitle, t.tour.languageBody),
      ],
    });
    tour.drive();
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // private mode: the tour may show again next time, which is harmless
    }
  }, [t]);

  // First visit to the wardrobe → show the tour once.
  useEffect(() => {
    if (pathname !== "/wardrobe") return;
    let seen = true;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (seen) return;
    const timer = setTimeout(start, 600); // let the page settle first
    return () => clearTimeout(timer);
  }, [pathname, start]);

  return (
    <button type="button" onClick={start} aria-label={t.tour.startLabel} title={t.tour.startLabel} className={buttonClasses("ghost", "px-3 py-2")}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4" />
        <circle cx="12" cy="17" r=".6" fill="currentColor" />
      </svg>
      <span className="hidden lg:inline">{t.tour.start}</span>
    </button>
  );
}

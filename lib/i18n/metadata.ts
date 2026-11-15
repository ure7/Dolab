import type { Metadata } from "next";
import type { Dictionary } from "./index";
import { getT } from "./server";

/**
 * A translated browser-tab title for a page:
 *   export const generateMetadata = pageTitle((t) => t.nav.wardrobe);
 * The root layout adds " · Dolab" after it.
 */
export function pageTitle(pick: (t: Dictionary) => string) {
  return async function generateMetadata(): Promise<Metadata> {
    return { title: pick(await getT()) };
  };
}

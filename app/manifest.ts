import type { MetadataRoute } from "next";
import { theme } from "@/config/dolab.config";

// Makes Dolab installable ("Add to Home Screen"). Next.js serves this at
// /manifest.webmanifest and links it from every page automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dolab | دولاب",
    short_name: "Dolab",
    description: "Your wardrobe, outfits and shopping list in one place.",
    start_url: "/wardrobe",
    scope: "/",
    display: "standalone",
    background_color: theme.background,
    theme_color: theme.background,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Add an item", url: "/wardrobe/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Fitting room", url: "/fitting-room", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}

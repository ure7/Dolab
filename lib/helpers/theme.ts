import type { CSSProperties } from "react";
import { theme } from "@/config/dolab.config";

// Turns the theme in dolab.config.ts into CSS variables (surfaceRaised → --dolab-surface-raised).
// globals.css maps those variables to Tailwind colours, so the config stays the single source.
export function themeToCssVariables(): CSSProperties {
  const entries = Object.entries(theme).map(([name, value]) => [
    `--dolab-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
    value,
  ]);
  return Object.fromEntries(entries) as CSSProperties;
}

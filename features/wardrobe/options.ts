import { categories, clothingColours, conditions, itemStatuses } from "@/config/dolab.config";
import type { Dictionary } from "@/lib/i18n";
import type { Option } from "@/components/ui/SelectField";

// Turns config ids into translated { value, label } pairs for selects and pickers.

export const categoryOptions = (t: Dictionary): Option[] =>
  categories.map((c) => ({ value: c.id, label: t.categories[c.id] }));

export const colourOptions = (t: Dictionary): Option[] =>
  clothingColours.map((c) => ({ value: c.id, label: t.colours[c.id] }));

export const conditionOptions = (t: Dictionary): Option[] =>
  conditions.map((c) => ({ value: c, label: t.conditions[c] }));

export const statusOptions = (t: Dictionary): Option[] =>
  itemStatuses.map((s) => ({ value: s, label: t.statuses[s] }));

// Fills {placeholders} in a dictionary string: format("Phase {n}", { n: 2 }) → "Phase 2".
export function format(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

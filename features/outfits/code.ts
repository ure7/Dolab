// Outfit codes look like "3.2": outfit family 3, version 2.
//   - a brand-new outfit starts a new family:      "4.1"
//   - "Save as variation" adds a version to it:     "3.1" → "3.2" → "3.3"
// The database also checks the format and that each code is used once per person.

export type OutfitCode = { family: number; version: number };

export function parseCode(code: string): OutfitCode {
  const [family, version] = code.split(".").map(Number);
  return { family: family || 0, version: version || 0 };
}

export function formatCode({ family, version }: OutfitCode): string {
  return `${family}.${version}`;
}

/** "1.1", "1.2", "2.1" → next new family is "3.1". */
export function nextNewCode(existing: string[]): string {
  const highest = Math.max(0, ...existing.map((c) => parseCode(c).family));
  return formatCode({ family: highest + 1, version: 1 });
}

/** Next version in the same family as `code`: "2.1" (with "2.2" taken) → "2.3". */
export function nextVariationCode(existing: string[], code: string): string {
  const { family } = parseCode(code);
  const highest = Math.max(0, ...existing.map(parseCode).filter((c) => c.family === family).map((c) => c.version));
  return formatCode({ family, version: highest + 1 });
}

/** Sorts codes like numbers, so "1.10" comes after "1.9". */
export function compareCodes(a: string, b: string): number {
  const x = parseCode(a);
  const y = parseCode(b);
  return x.family - y.family || x.version - y.version;
}

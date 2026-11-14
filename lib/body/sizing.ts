import type { BodyProfile } from "./profile";

// A ROUGH size guide from height, weight and body shape — enough to say
// "you're probably an M" when trying on a shop item. Every brand sizes
// differently, so the app always tells people to check the shop's size chart.

const letters = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type LetterSize = (typeof letters)[number];

// Upper weight (kg) of each size, for someone of average height.
const weightSteps = {
  male: [58, 68, 78, 88, 100], // ≤58 XS, ≤68 S, ≤78 M, ≤88 L, ≤100 XL, above XXL
  female: [50, 57, 65, 74, 85],
} as const;
const averageHeight = { male: 175, female: 163 } as const;

function sizeFor(body: BodyProfile, extraSteps: number): LetterSize {
  // Taller people of the same weight are slimmer: compare at average height.
  const heightFactor = (averageHeight[body.gender] / body.heightCm) ** 1.5;
  const weight = body.weightKg * heightFactor;
  let index = weightSteps[body.gender].findIndex((max) => weight <= max);
  if (index === -1) index = letters.length - 1;
  return letters[Math.min(letters.length - 1, Math.max(0, index + extraSteps))];
}

export function sizeHint(body: BodyProfile): { top: LetterSize; bottom: LetterSize; tall: boolean } {
  // Broad / athletic shoulders usually need a size up in tops.
  const topExtra = body.shape === "broad" || body.shape === "athletic" ? 1 : body.shape === "slim" ? -1 : 0;
  const bottomExtra = body.shape === "broad" ? 1 : body.shape === "slim" ? -1 : 0;
  return {
    top: sizeFor(body, topExtra),
    bottom: sizeFor(body, bottomExtra),
    tall: body.heightCm >= averageHeight[body.gender] + 12,
  };
}

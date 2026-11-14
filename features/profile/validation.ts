import { bodyLimits, bodyShapes, genders } from "@/config/dolab.config";
import type { Dictionary } from "@/lib/i18n";
import type { Profile } from "@/types/database";

export type BodyErrorKey = keyof Dictionary["avatar"]["errors"];
export type BodyInput = Pick<Profile, "gender" | "height_cm" | "weight_kg" | "body_shape">;

const oneOf = <T extends string>(list: readonly T[], value: FormDataEntryValue | null): T | null =>
  typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : null;

const numberIn = (value: FormDataEntryValue | null, { min, max }: { min: number; max: number }): number | null => {
  const n = typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

// Everything from a form is untrusted text: check it against the config lists
// and limits (the database checks again, as a second lock).
export function parseBodyForm(formData: FormData): { ok: true; data: BodyInput } | { ok: false; errorKey: BodyErrorKey } {
  const gender = oneOf(genders, formData.get("gender"));
  const shape = oneOf(bodyShapes.map((s) => s.id), formData.get("body_shape"));
  const height = numberIn(formData.get("height_cm"), bodyLimits.heightCm);
  const weight = numberIn(formData.get("weight_kg"), bodyLimits.weightKg);

  if (height === null || weight === null) return { ok: false, errorKey: "invalidMeasurements" };
  if (!gender || !shape) return { ok: false, errorKey: "invalidChoice" };

  return {
    ok: true,
    data: {
      gender,
      height_cm: Math.round(height),
      weight_kg: Math.round(weight * 10) / 10,
      body_shape: shape,
    },
  };
}

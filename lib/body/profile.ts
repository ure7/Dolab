import { defaultBody, type BodyShape, type Gender } from "@/config/dolab.config";
import type { Profile } from "@/types/database";

export type BodyProfile = {
  gender: Gender;
  heightCm: number;
  weightKg: number;
  shape: BodyShape;
};

// Fills any missing profile fields with the defaults from the config.
export function toBodyProfile(profile: Profile | null): BodyProfile {
  return {
    gender: profile?.gender ?? defaultBody.gender,
    heightCm: profile?.height_cm ?? defaultBody.heightCm,
    weightKg: Number(profile?.weight_kg ?? defaultBody.weightKg),
    shape: profile?.body_shape ?? defaultBody.shape,
  };
}

export function hasBodyProfile(profile: Profile | null): boolean {
  return Boolean(profile?.gender && profile.height_cm && profile.weight_kg);
}


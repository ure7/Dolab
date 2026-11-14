"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { bodyLimits, bodyShapes, genders } from "@/config/dolab.config";
import type { BodyProfile } from "@/lib/body/profile";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { GhostMannequin } from "@/features/fitting-room/GhostMannequin";
import { sizeHint } from "@/lib/body/sizing";
import { format } from "@/lib/i18n/format";
import { saveBodyProfile } from "./actions";
import type { BodyErrorKey } from "./validation";

// Body settings with a live preview: every change redraws the mannequin
// immediately, before anything is saved.
export function AvatarForm({ initial }: { initial: BodyProfile }) {
  const { t } = useI18n();
  const [body, setBody] = useState<BodyProfile>(initial);
  const [error, setError] = useState<BodyErrorKey | null>(null);
  const [isSaving, startSaving] = useTransition();
  const update = (patch: Partial<BodyProfile>) => setBody((current) => ({ ...current, ...patch }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startSaving(async () => {
      const result = await saveBodyProfile(formData); // redirects to the fitting room on success
      if (result?.status === "error") setError(result.errorKey);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-start">
      {/* live preview */}
      <div className="flex flex-col gap-3 md:sticky md:top-20">
        <div className="flex justify-center rounded-3xl border border-line bg-[radial-gradient(ellipse_at_50%_35%,#262b34_0%,#14171c_75%)] py-4">
          <GhostMannequin body={body} className="h-[50vh] max-h-[480px] min-h-[320px] w-auto" title={t.avatar.preview} />
        </div>
        {/* sizing hint: updates as you move the sliders */}
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          {format(t.avatar.sizeHint, { top: sizeHint(body).top, bottom: sizeHint(body).bottom })}
          {sizeHint(body).tall && <span className="mt-1 block text-xs text-muted">{t.avatar.tallHint}</span>}
          <span className="mt-1 block text-xs text-muted">{t.avatar.sizeDisclaimer}</span>
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <ChoiceGroup
          legend={t.avatar.gender}
          name="gender"
          options={genders.map((g) => ({ value: g, label: t.avatar.genders[g] }))}
          value={body.gender}
          onChange={(value) => update({ gender: value as BodyProfile["gender"] })}
        />

        <Slider
          label={t.avatar.height}
          name="height_cm"
          unit={t.avatar.cm}
          value={body.heightCm}
          {...bodyLimits.heightCm}
          onChange={(heightCm) => update({ heightCm })}
        />
        <Slider
          label={t.avatar.weight}
          name="weight_kg"
          unit={t.avatar.kg}
          value={body.weightKg}
          {...bodyLimits.weightKg}
          onChange={(weightKg) => update({ weightKg })}
        />

        {/* body shape: each option shows a tiny mannequin with that shape */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t.avatar.bodyShape}</legend>
          <div className="grid grid-cols-4 gap-2">
            {bodyShapes.map(({ id }) => (
              <label key={id} className="cursor-pointer">
                <input
                  type="radio"
                  name="body_shape"
                  value={id}
                  checked={body.shape === id}
                  onChange={() => update({ shape: id })}
                  className="peer sr-only"
                />
                <span className="flex flex-col items-center gap-1 rounded-xl border-2 border-line bg-surface p-2 text-xs text-muted transition peer-checked:border-accent peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                  <GhostMannequin body={{ ...body, shape: id }} className="h-24 w-auto" />
                  {t.avatar.shapes[id]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="text-xs text-muted">{t.avatar.privacy}</p>

        {error && <Alert tone="error">{t.avatar.errors[error]}</Alert>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving} aria-busy={isSaving} className="min-w-28">
            {isSaving ? t.common.working : t.avatar.save}
          </Button>
          <Link href="/fitting-room" className={buttonClasses("ghost")}>
            {t.wardrobe.cancel}
          </Link>
        </div>
      </div>
    </form>
  );
}

type SliderProps = {
  label: string;
  name: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

// A slider for quick changes, plus the exact number next to it.
function Slider({ label, name, unit, value, min, max, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="flex items-baseline justify-between text-sm font-medium">
        <span>{label}</span>
        <span className="text-accent" dir="ltr">
          {value} {unit}
        </span>
      </label>
      <input
        id={name}
        name={name}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  );
}

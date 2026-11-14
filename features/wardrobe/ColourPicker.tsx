"use client";

import { clothingColours, type ColourId } from "@/config/dolab.config";
import { useI18n } from "@/lib/i18n/I18nProvider";

// Colour swatches from the config. Each swatch is a real radio button, so the
// chosen colour is sent with the form as "colour".
export function ColourPicker({ defaultValue }: { defaultValue?: ColourId }) {
  const { t } = useI18n();

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{t.wardrobe.colour}</legend>
      <div className="flex flex-wrap gap-2.5">
        {clothingColours.map((colour, index) => (
          <label key={colour.id} className="cursor-pointer" title={t.colours[colour.id]}>
            <input
              type="radio"
              name="colour"
              value={colour.id}
              defaultChecked={colour.id === defaultValue}
              // `required` on one radio makes the whole group required.
              required={index === 0}
              className="peer sr-only"
            />
            <span
              className="block size-9 rounded-full border border-white/15 ring-offset-2 ring-offset-surface transition peer-checked:ring-2 peer-checked:ring-accent peer-focus-visible:ring-2 peer-focus-visible:ring-fg"
              style={{ backgroundColor: colour.hex }}
            />
            <span className="sr-only">{t.colours[colour.id]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

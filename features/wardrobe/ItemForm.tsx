"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import type { ItemStatus } from "@/config/dolab.config";
import type { ItemWithPhotos } from "@/types/database";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { SelectField } from "@/components/ui/SelectField";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PhotoPicker } from "./photo/PhotoPicker";
import { uploadDraft, type PhotoDraft } from "./photo/photoDraft";
import { ColourPicker } from "./ColourPicker";
import { categoryOptions, conditionOptions, statusOptions } from "./options";
import { saveItem } from "./actions";
import type { ItemErrorKey } from "./validation";

type ItemFormProps = {
  userId: string;
  item?: ItemWithPhotos; // present when editing
  defaultStatus?: ItemStatus;
};

function initialPhoto(item?: ItemWithPhotos): PhotoDraft {
  if (!item?.photo_path || !item.photoUrl) return { kind: "none" };
  return {
    kind: "saved",
    photoPath: item.photo_path,
    cutoutPath: item.cutout_path,
    photoUrl: item.photoUrl,
    cutoutUrl: item.cutoutUrl,
  };
}

// Add / edit form. Photos are uploaded from the browser first, then the
// details are saved by a server action that validates everything again.
export function ItemForm({
  userId,
  item,
  defaultStatus = "owned",
}: ItemFormProps) {
  const { t } = useI18n();
  const [photo, setPhoto] = useState<PhotoDraft>(() => initialPhoto(item));
  const [status, setStatus] = useState<ItemStatus>(
    item?.status ?? defaultStatus,
  );
  const [error, setError] = useState<ItemErrorKey | null>(null);
  const [isSaving, startSaving] = useTransition();
  // true while the photo is being resized or its background removed
  const [photoBusy, setPhotoBusy] = useState(false);

  // We submit manually (instead of <form action>) so React doesn't reset the
  // fields when there's an error — nobody wants to retype everything.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (photoBusy) return; // the photo isn't ready yet — saving now would lose it
    const formData = new FormData(event.currentTarget);
    setError(null);

    startSaving(async () => {
      try {
        const paths = await uploadDraft(photo, userId);
        formData.set("photo_path", paths.photoPath ?? "");
        formData.set("cutout_path", paths.cutoutPath ?? "");
        // Remember the uploads, so retrying after an error doesn't upload twice.
        const uploadedSomething =
          photo.kind === "new" || (photo.kind === "saved" && photo.newCutout);
        if (uploadedSomething && paths.photoPath) {
          setPhoto({
            kind: "saved",
            photoPath: paths.photoPath,
            cutoutPath: paths.cutoutPath,
            photoUrl: photo.photoUrl,
            cutoutUrl: photo.cutoutUrl,
          });
        }
      } catch {
        setError("uploadFailed");
        return;
      }

      const result = await saveItem(formData); // redirects to /wardrobe on success
      if (result?.status === "error") setError(result.errorKey);
    });
  }

  const isStoreItem = status === "not_owned";

  return (
    // Desktop: photo on the left (stays in view while scrolling), fields on the right.
    // Phones: one column, photo first.
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start"
    >
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="md:sticky md:top-24">
        <PhotoPicker draft={photo} onChange={setPhoto} onBusyChange={setPhotoBusy} />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <ChoiceGroup
          legend={t.wardrobe.status}
          name="status"
          options={statusOptions(t)}
          value={status}
          onChange={(value) => setStatus(value as ItemStatus)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t.wardrobe.name}
            name="name"
            defaultValue={item?.name}
            placeholder={t.wardrobe.namePlaceholder}
            maxLength={80}
            required
          />
          <TextField
            label={`${t.wardrobe.brand} (${t.wardrobe.optional})`}
            name="brand"
            defaultValue={item?.brand ?? ""}
            maxLength={60}
          />
          <SelectField
            label={t.wardrobe.category}
            name="category"
            options={categoryOptions(t)}
            placeholder={t.wardrobe.chooseCategory}
            defaultValue={item?.category ?? ""}
            required
          />
        </div>

        <ColourPicker defaultValue={item?.colour} />

        {/* Condition only matters for clothes you own. */}
        {isStoreItem ? (
          <input
            type="hidden"
            name="condition"
            value={item?.condition ?? "good"}
          />
        ) : (
          <ChoiceGroup
            legend={t.wardrobe.condition}
            name="condition"
            options={conditionOptions(t)}
            defaultValue={item?.condition ?? "good"}
          />
        )}

        {/* Hidden (not removed) for owned items, so a bought item keeps its store info. */}
        <fieldset
          hidden={!isStoreItem}
          className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-2"
        >
          <legend className="px-1 text-sm font-medium">
            {t.wardrobe.storeDetails}
          </legend>
          <TextField
            label={`${t.wardrobe.storeName} (${t.wardrobe.optional})`}
            name="store_name"
            defaultValue={item?.store_name ?? ""}
            maxLength={60}
          />
          <TextField
            label={`${t.wardrobe.price} (${t.wardrobe.optional})`}
            name="price"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            defaultValue={item?.price ?? ""}
            dir="ltr"
          />
          <div className="sm:col-span-2">
            <TextField
              label={`${t.wardrobe.productUrl} (${t.wardrobe.optional})`}
              name="product_url"
              type="url"
              placeholder="https://"
              defaultValue={item?.product_url ?? ""}
              maxLength={500}
              dir="ltr"
            />
          </div>
        </fieldset>

        <TextAreaField
          label={`${t.wardrobe.notes} (${t.wardrobe.optional})`}
          name="notes"
          defaultValue={item?.notes ?? ""}
          maxLength={500}
        />

        {error && <Alert tone="error">{t.wardrobe.errors[error]}</Alert>}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSaving || photoBusy}
            aria-busy={isSaving || photoBusy}
            className="min-w-28"
          >
            {isSaving || photoBusy ? t.common.working : t.wardrobe.save}
          </Button>
          <Link href="/wardrobe" className={buttonClasses("ghost")}>
            {t.wardrobe.cancel}
          </Link>
        </div>
      </div>
    </form>
  );
}

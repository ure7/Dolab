"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { backgroundRemovalConfig } from "@/config/dolab.config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { format } from "@/lib/i18n/format";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { ItemErrorKey } from "../validation";
import { resizeImage } from "./resizeImage";
import { removeImageBackground, type RemovalStatus } from "./removeBackground";
import { previewUrl, withCutout, withoutCutout, type PhotoDraft } from "./photoDraft";

type Busy = { kind: "preparing" } | { kind: "removing"; status: RemovalStatus | null } | null;
type Candidate = { blob: Blob; url: string };

type PhotoPickerProps = {
  draft: PhotoDraft;
  onChange: (draft: PhotoDraft) => void;
  /** Tells the form when a photo is still being prepared, so it can't be saved half-done. */
  onBusyChange?: (busy: boolean) => void;
};

// A transparency-checkerboard, so you can see exactly what was cut away.
// Light, so black and navy clothes stay clearly visible against it.
const checkerboard = "bg-[repeating-conic-gradient(#e9e6e1_0_25%,#f7f5f2_0_50%)] bg-size-[20px_20px]";

// Pick a photo, paste a screenshot, and optionally cut out the background.
// After removal you compare before/after and choose. Nothing is uploaded
// here — the form uploads when you press Save.
export function PhotoPicker({ draft, onChange, onBusyChange }: PhotoPickerProps) {
  const { t } = useI18n();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<ItemErrorKey | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  // Each removal gets a number; "Cancel" bumps it so a late result is ignored.
  // (The library itself can't be stopped half-way, but nothing is shown or saved.)
  const run = useRef(0);

  useEffect(() => {
    onBusyChange?.(busy !== null);
  }, [busy, onBusyChange]);

  const acceptImage = useCallback(
    async (image: Blob) => {
      setError(null);
      setCandidate(null);
      setBusy({ kind: "preparing" });
      try {
        const photo = await resizeImage(image);
        onChange({ kind: "new", photo, cutout: null, photoUrl: URL.createObjectURL(photo), cutoutUrl: null });
      } catch {
        setError("photoFailed");
      } finally {
        setBusy(null);
      }
    },
    [onChange],
  );

  // A photo picked while the page was still starting up (slow phone) lands in
  // the file input before React is listening — pick it up now instead of losing it.
  useEffect(() => {
    const input = fileInput.current;
    const early = input?.files?.[0];
    if (!input || !early) return;
    input.value = "";
    void acceptImage(early);
  }, [acceptImage]);

  // Ctrl+V / long-press "Paste" of a screenshot anywhere on the form page.
  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const image = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (!image) return; // normal text paste into a field — leave it alone
      event.preventDefault();
      void acceptImage(image);
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [acceptImage]);

  async function handleRemoveBackground() {
    if (draft.kind === "none") return;
    setError(null);
    const thisRun = ++run.current;
    const current = () => run.current === thisRun;
    setBusy({ kind: "removing", status: null });
    try {
      // Always cut from the ORIGINAL photo (a saved one is downloaded first).
      const source = draft.kind === "new" ? draft.photo : await fetch(draft.photoUrl).then((r) => r.blob());
      const blob = await removeImageBackground(source, (status) => current() && setBusy({ kind: "removing", status }));
      if (current()) setCandidate({ blob, url: URL.createObjectURL(blob) });
    } catch {
      if (current()) setError("backgroundFailed");
    } finally {
      if (current()) setBusy(null);
    }
  }

  function cancelRemoval() {
    run.current++;
    setBusy(null);
  }

  function statusText(status: RemovalStatus | null): string {
    if (!status) return t.wardrobe.removalStarting;
    if (status.phase === "download") return format(t.wardrobe.removalDownloading, { mb: status.megabytes });
    if (status.phase === "cutting") return format(t.wardrobe.removalCutting, { step: status.step, steps: status.steps });
    return t.wardrobe.removalRefining;
  }

  function chooseCutout() {
    if (!candidate) return;
    onChange(withCutout(draft, candidate.blob, candidate.url));
    setCandidate(null);
  }

  function keepOriginal() {
    if (candidate) URL.revokeObjectURL(candidate.url);
    setCandidate(null);
    onChange(withoutCutout(draft));
  }

  const preview = previewUrl(draft);
  const hasCutout = draft.kind !== "none" && draft.cutoutUrl !== null;
  const canRemove = backgroundRemovalConfig.enabled && draft.kind !== "none" && !busy;

  const overlay = busy && (
    <span role="status" className="absolute inset-0 grid place-items-center bg-bg/85 px-6 text-center text-sm text-fg">
      <span className="flex flex-col items-center gap-3">
        <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        {busy.kind === "preparing" ? t.wardrobe.preparingPhoto : statusText(busy.status)}
      </span>
    </span>
  );

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">{t.wardrobe.photo}</span>

      {candidate && draft.kind !== "none" ? (
        // ---- before / after ----
        <div className="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-3">
          <p className="text-sm font-medium">{t.wardrobe.compareTitle}</p>
          <div className="grid max-w-md grid-cols-2 gap-3">
            <figure className="flex flex-col gap-1.5">
              <img src={draft.photoUrl} alt="" className="aspect-square w-full rounded-xl bg-photo object-contain" />
              <figcaption className="text-center text-xs text-muted">{t.wardrobe.before}</figcaption>
            </figure>
            <figure className="flex flex-col gap-1.5">
              <img src={candidate.url} alt="" className={`aspect-square w-full rounded-xl object-contain p-2 ${checkerboard}`} />
              <figcaption className="text-center text-xs text-muted">{t.wardrobe.after}</figcaption>
            </figure>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={chooseCutout}>{t.wardrobe.useCutout}</Button>
            <Button variant="secondary" onClick={keepOriginal}>
              {t.wardrobe.keepOriginal}
            </Button>
          </div>
          <p className="text-xs text-muted">{t.wardrobe.cutoutTip}</p>
        </div>
      ) : (
        // ---- the current picture ----
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-dashed text-sm transition hover:border-accent ${
            preview ? "border-transparent bg-photo" : "border-line bg-bg text-muted"
          }`}
        >
          {preview ? (
            <img src={preview} alt="" className={`size-full ${hasCutout ? "photo-shadow object-contain p-6" : "object-cover"}`} />
          ) : (
            <span className="px-6 text-center">{t.wardrobe.choosePhoto}</span>
          )}
          {overlay}
        </button>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void acceptImage(file);
          event.target.value = ""; // allow picking the same file again
        }}
      />

      {busy?.kind === "removing" && (
        <Button variant="secondary" onClick={cancelRemoval} className="self-start">
          {t.wardrobe.cancelRemoval}
        </Button>
      )}

      {!candidate && !busy && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={!!busy}>
            {draft.kind === "none" ? t.wardrobe.choosePhoto : t.wardrobe.changePhoto}
          </Button>
          {canRemove && (
            <Button variant="secondary" onClick={handleRemoveBackground}>
              {hasCutout ? t.wardrobe.redoBackground : t.wardrobe.removeBackground}
            </Button>
          )}
          {hasCutout && (
            <Button variant="ghost" onClick={keepOriginal} disabled={!!busy}>
              {t.wardrobe.switchToOriginal}
            </Button>
          )}
          {draft.kind !== "none" && (
            <Button variant="ghost" onClick={() => onChange({ kind: "none" })} disabled={!!busy}>
              {t.wardrobe.removePhoto}
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-muted">
        {busy?.kind === "removing" ? t.wardrobe.removingBackgroundFirstTime : t.wardrobe.pasteHint}
      </p>
      {error && <Alert tone="error">{t.wardrobe.errors[error]}</Alert>}
    </div>
  );
}

import { uploadPhoto } from "./uploadPhoto";

// The photo state of the item form:
// - none:  no photo
// - saved: already in storage (editing an item). `newCutout` is a cut-out made
//          in this session (e.g. "Redo background removal") that still needs uploading.
// - new:   picked/pasted in this session, not uploaded yet
export type PhotoDraft =
  | { kind: "none" }
  | {
      kind: "saved";
      photoPath: string;
      cutoutPath: string | null;
      photoUrl: string;
      cutoutUrl: string | null;
      newCutout?: Blob | null;
    }
  | { kind: "new"; photo: Blob; cutout: Blob | null; photoUrl: string; cutoutUrl: string | null };

export type PhotoPaths = { photoPath: string | null; cutoutPath: string | null };

// The image to show in previews: the cut-out if there is one, otherwise the photo.
export function previewUrl(draft: PhotoDraft): string | null {
  return draft.kind === "none" ? null : (draft.cutoutUrl ?? draft.photoUrl);
}

/** Puts a freshly made cut-out on the draft (without re-uploading a saved original). */
export function withCutout(draft: PhotoDraft, cutout: Blob, cutoutUrl: string): PhotoDraft {
  if (draft.kind === "new") return { ...draft, cutout, cutoutUrl };
  if (draft.kind === "saved") return { ...draft, newCutout: cutout, cutoutPath: null, cutoutUrl };
  return draft;
}

/** Back to the original photo only. */
export function withoutCutout(draft: PhotoDraft): PhotoDraft {
  if (draft.kind === "new") return { ...draft, cutout: null, cutoutUrl: null };
  if (draft.kind === "saved") return { ...draft, newCutout: null, cutoutPath: null, cutoutUrl: null };
  return draft;
}

// Uploads whatever is new and returns the storage paths to save on the item.
export async function uploadDraft(draft: PhotoDraft, userId: string): Promise<PhotoPaths> {
  if (draft.kind === "none") return { photoPath: null, cutoutPath: null };
  if (draft.kind === "saved") {
    const cutoutPath = draft.newCutout ? await uploadPhoto(draft.newCutout, userId) : draft.cutoutPath;
    return { photoPath: draft.photoPath, cutoutPath };
  }

  const [photoPath, cutoutPath] = await Promise.all([
    uploadPhoto(draft.photo, userId),
    draft.cutout ? uploadPhoto(draft.cutout, userId) : Promise.resolve(null),
  ]);
  return { photoPath, cutoutPath };
}

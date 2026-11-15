import type { CategoryId, ColourId, ItemStatus } from "@/config/dolab.config";
import type { BodyProfile } from "@/lib/body/profile";
import type { Rect } from "@/lib/body/zones";

export type TryOnItem = {
  id: string;
  name: string;
  category: CategoryId;
  colour: ColourId;
  status: ItemStatus;
  /** Background-free photo, if the item has one. */
  cutoutUrl: string | null;
  /** The original photo (with background), if any. */
  photoUrl: string | null;
};

export type TryOnRequest = {
  body: BodyProfile;
  items: TryOnItem[];
  /** Wear the outer layer (jacket, open shirt) open, showing the layers underneath. Default: open. */
  outerOpen?: boolean;
};

/** Where the visible garment sits inside a cut-out photo (in image pixels). */
export type PhotoCrop = Rect & { naturalWidth: number; naturalHeight: number };

/** One piece of clothing placed on the mannequin, in drawing order. */
export type TryOnLayer = {
  item: TryOnItem;
  /** "photo" = the real cut-out photo; "drawn" = Dolab draws the garment. */
  kind: "photo" | "drawn";
  /** Where the garment is drawn on the body (already fitted for photos). */
  rect: Rect;
  /** For photos: the part of the image that isn't transparent (null = use the whole image). */
  crop: PhotoCrop | null;
  /** Optional SVG path; only what's inside it is shown (e.g. no sleeves under a jacket). */
  clip: string | null;
  /** Worn open: draw the photo as left/right halves, each moved `gap / 2` outwards. */
  open: { gap: number } | null;
};

export type TryOnResult =
  // Free, in-browser result: the app draws the mannequin and these layers.
  | { kind: "layers"; layers: TryOnLayer[]; canvasHeight: number }
  // What an AI try-on service would return: one finished picture.
  | { kind: "image"; imageUrl: string };

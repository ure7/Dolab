import { useId } from "react";
import { defaultBody, type CategoryId, type ColourId } from "@/config/dolab.config";
import { bodyGeometry } from "@/lib/body/geometry";
import { zoneRect } from "@/lib/body/zones";
import { getColourHex } from "@/lib/helpers/config-guards";
import { Garment } from "./garments/Garment";

// The drawn garment on its own, laid flat like a product photo. Used for items
// without a photo on the outfit board and on wardrobe cards.
const flatBody = bodyGeometry(defaultBody);

export function FlatGarment({ category, colour, className = "" }: { category: CategoryId; colour: ColourId; className?: string }) {
  const id = `f${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const r = zoneRect(category, flatBody);
  const pad = flatBody.h * 0.12;

  return (
    <svg viewBox={`${r.x - pad} ${r.y - pad * 2.5} ${r.width + pad * 2} ${r.height + pad * 3.5}`} className={className} aria-hidden>
      <Garment category={category} g={flatBody} colour={getColourHex(colour)} colourId={colour} id={id} flat />
    </svg>
  );
}

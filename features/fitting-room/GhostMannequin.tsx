import { useId } from "react";
import { CANVAS, bodyGeometry } from "@/lib/body/geometry";
import type { BodyProfile } from "@/lib/body/profile";
import { getColourHex } from "@/lib/helpers/config-guards";
import type { TryOnLayer } from "@/lib/try-on";
import { GhostForm } from "./GhostForm";
import { Garment } from "./garments/Garment";

type GhostMannequinProps = {
  body: BodyProfile;
  layers?: TryOnLayer[];
  /** Canvas height from renderTryOn() (it grows when shoes sit lower). */
  canvasHeight?: number;
  className?: string;
  title?: string;
};

// The outfit on an invisible "ghost" mannequin. Layers arrive already placed
// and sorted back-to-front by renderTryOn(), so we simply draw them in order.
export function GhostMannequin({ body, layers = [], canvasHeight = CANVAS.height, className = "", title }: GhostMannequinProps) {
  // SVG ids must be unique on the page (useId gives ":r1:" etc.).
  const id = `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const g = bodyGeometry(body);
  const wearsBottoms = layers.some((l) => l.item.category === "bottoms");

  return (
    <svg viewBox={`0 0 ${CANVAS.width} ${canvasHeight}`} className={className} role="img" aria-label={title}>
      <defs>
        {/* soft contact shadow so photos sit on each other instead of looking pasted */}
        <filter id={`${id}-shadow`} x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      <GhostForm g={g} showLegs={!wearsBottoms} />

      {layers.map((layer, index) => {
        const key = `${layer.item.id}-${index}`;
        if (layer.kind === "drawn") {
          return (
            <g key={key} filter={`url(#${id}-shadow)`}>
              <Garment
                category={layer.item.category}
                g={g}
                colour={getColourHex(layer.item.colour)}
                colourId={layer.item.colour}
                id={`${id}-l${index}`}
              />
            </g>
          );
        }
        return <PhotoLayer key={key} layer={layer} filterId={`${id}-shadow`} clipId={`${id}-clip${index}`} />;
      })}
    </svg>
  );
}

// A cut-out photo at the spot renderTryOn() chose. The nested <svg>'s viewBox
// is the visible part of the photo (no transparent margins); its aspect
// ratio matches the rect, so nothing is stretched.
function PhotoLayer({ layer, filterId, clipId }: { layer: TryOnLayer; filterId: string; clipId: string }) {
  const { rect, crop, clip, item } = layer;
  const href = item.cutoutUrl ?? "";

  const picture = crop ? (
    <svg
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
    >
      <image href={href} width={crop.naturalWidth} height={crop.naturalHeight} />
    </svg>
  ) : (
    <image href={href} x={rect.x} y={rect.y} width={rect.width} height={rect.height} preserveAspectRatio="xMidYMid meet" />
  );

  return (
    <g filter={`url(#${filterId})`}>
      {clip ? (
        <>
          <clipPath id={clipId}>
            <path d={clip} />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>{picture}</g>
        </>
      ) : (
        picture
      )}
    </g>
  );
}

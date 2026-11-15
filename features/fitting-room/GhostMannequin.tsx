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
    <svg viewBox={`0 0 ${CANVAS.width} ${canvasHeight}`} className={className} role="img" aria-label={title} overflow="visible">
      <defs>
        {/* soft contact shadow so photos sit on each other instead of looking pasted */}
        <filter id={`${id}-shadow`} x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.4" />
        </filter>
        {/* open jacket: each front panel casts a shadow INWARDS onto the layer below */}
        <filter id={`${id}-shadowL`} x="-15%" y="-10%" width="135%" height="125%">
          <feDropShadow dx="5" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.55" />
        </filter>
        <filter id={`${id}-shadowR`} x="-20%" y="-10%" width="135%" height="125%">
          <feDropShadow dx="-5" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.55" />
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
        return <PhotoLayer key={key} layer={layer} filterId={`${id}-shadow`} idPrefix={`${id}-${index}`} svgId={id} />;
      })}
    </svg>
  );
}

// A cut-out photo at the spot renderTryOn() chose. The nested <svg>'s viewBox
// is the visible part of the photo (no transparent margins); its aspect
// ratio matches the rect, so nothing is stretched.
function PhotoLayer({ layer, filterId, idPrefix, svgId }: { layer: TryOnLayer; filterId: string; idPrefix: string; svgId: string }) {
  const { rect, crop, clip, item, open } = layer;
  const clipId = `${idPrefix}-clip`;
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

  // Worn open: the same photo twice, each clipped to one half (split at the
  // garment's centre line) and moved outwards, so the layer below shows.
  if (open) {
    const middle = rect.x + rect.width / 2;
    const halves = [
      { side: "L", x: rect.x - rect.width, shift: -open.gap / 2 },
      { side: "R", x: middle, shift: open.gap / 2 },
    ] as const;
    return (
      <g>
        {halves.map(({ side, x, shift }) => (
          <g key={side} transform={`translate(${shift} 0)`} filter={`url(#${svgId}-shadow${side})`}>
            <clipPath id={`${idPrefix}-half${side}`}>
              <rect x={x} y={rect.y - rect.height} width={side === "L" ? middle - x : rect.width * 2} height={rect.height * 3} />
            </clipPath>
            <g clipPath={`url(#${idPrefix}-half${side})`}>{picture}</g>
          </g>
        ))}
      </g>
    );
  }

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

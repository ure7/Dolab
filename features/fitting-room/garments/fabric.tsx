import type { ColourId } from "@/config/dolab.config";
import type { BodyGeometry } from "@/lib/body/geometry";
import { detailInk, luminance, shade } from "@/lib/helpers/colour";

export type GarmentProps = {
  g: BodyGeometry;
  colour: string; // hex
  colourId?: ColourId;
  /** Unique prefix for SVG gradient ids (several garments share one page). */
  id: string;
  /** true = laid flat / "ghost mannequin" (no body underneath). */
  flat?: boolean;
};

/**
 * Gradients that give fabric volume: darker at the sides where cloth turns
 * away from the light, a soft highlight down the middle, and a gentle
 * top-to-bottom falloff. Defined once per garment.
 */
export function FabricDefs({ id, colour }: { id: string; colour: string }) {
  const highlight = luminance(colour) < 0.08 ? 0.16 : 0.1;
  return (
    <defs>
      <linearGradient id={`${id}-vol`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.34" />
        <stop offset="0.22" stopColor="#000" stopOpacity="0.04" />
        <stop offset="0.48" stopColor="#fff" stopOpacity={highlight} />
        <stop offset="0.78" stopColor="#000" stopOpacity="0.06" />
        <stop offset="1" stopColor="#000" stopOpacity="0.38" />
      </linearGradient>
      <linearGradient id={`${id}-drop`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.07" />
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.2" />
      </linearGradient>
    </defs>
  );
}

/** A piece of cloth: colour + volume shading + a soft darker edge. */
export function Fabric({ d, colour, id, tone = 0 }: { d: string; colour: string; id: string; tone?: number }) {
  const fill = tone === 0 ? colour : shade(colour, tone);
  return (
    <>
      <path d={d} fill={fill} />
      <path d={d} fill={`url(#${id}-vol)`} />
      <path d={d} fill={`url(#${id}-drop)`} />
      <path d={d} fill="none" stroke={shade(colour, -0.5)} strokeOpacity="0.55" strokeWidth="1.2" strokeLinejoin="round" />
    </>
  );
}

/** Dashed stitching line along a seam. */
export function Stitch({ d, colour, ink }: { d: string; colour: string; ink?: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={ink ?? detailInk(colour)}
      strokeOpacity="0.75"
      strokeWidth="1"
      strokeDasharray="3 2.4"
      strokeLinecap="round"
    />
  );
}

/** A soft fold or crease: a faint dark line with a faint light line beside it. */
export function Fold({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="2.2" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.2" strokeLinecap="round" transform="translate(1.6 0)" />
    </>
  );
}

/** Ribbed knit (cuffs, hems): a darker band with fine vertical lines. */
export function Ribbing({ d, colour, x0, x1, y0, y1, id }: { d: string; colour: string; x0: number; x1: number; y0: number; y1: number; id: string }) {
  const lines = [];
  const step = 3.2;
  for (let x = x0 + step; x < x1; x += step) {
    lines.push(<line key={x} x1={x} x2={x} y1={y0} y2={y1} stroke="#000" strokeOpacity="0.14" strokeWidth="0.8" />);
  }
  return (
    <>
      <clipPath id={`${id}-rib-${Math.round(y0)}-${Math.round(x0)}`}>
        <path d={d} />
      </clipPath>
      <Fabric d={d} colour={colour} id={id} tone={-0.07} />
      <g clipPath={`url(#${id}-rib-${Math.round(y0)}-${Math.round(x0)})`}>{lines}</g>
    </>
  );
}

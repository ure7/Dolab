import { smoothPath, type Point } from "@/lib/body/path";
import { luminance, shade } from "@/lib/helpers/colour";
import { Fabric, FabricDefs, Stitch, type GarmentProps } from "./fabric";

// A pair of sneakers seen from the front: rubber sole, toe cap, tongue, laces.
export function Shoes({ g, colour, id }: GarmentProps) {
  const { h, cx } = g;
  const width = h * 0.4 * g.build ** 0.2;
  const height = h * 0.34;
  const isLight = luminance(colour) > 0.55;
  const sole = isLight ? "#dcdad5" : "#f1efe9";
  const lace = isLight ? shade(colour, -0.35) : "#f4f2ee";

  const shoe = (sign: 1 | -1) => {
    const fx = cx + sign * (g.legOffset * 0.94 + h * 0.02);
    const base = g.floorY;
    const top = base - height;
    const opening = g.ankleHalf * 1.3;
    const upper: Point[] = [
      [fx - width * 0.5, base - h * 0.04],
      [fx - width * 0.5, base - h * 0.13],
      [fx - width * 0.36, base - h * 0.23],
      [fx - opening, top],
      [fx + opening, top],
      [fx + width * 0.36, base - h * 0.23],
      [fx + width * 0.5, base - h * 0.13],
      [fx + width * 0.5, base - h * 0.04],
    ];
    return (
      <g key={sign}>
        <ellipse cx={fx} cy={base + 2} rx={width * 0.62} ry={h * 0.05} fill="#000" opacity="0.35" />
        <Fabric d={smoothPath(upper, true, 0.5)} colour={colour} id={id} />
        {/* toe cap */}
        <Stitch colour={colour} d={`M${fx - width * 0.44},${base - h * 0.1} Q${fx},${base - h * 0.2} ${fx + width * 0.44},${base - h * 0.1}`} />
        {/* tongue */}
        <rect x={fx - opening * 0.75} y={top - h * 0.05} width={opening * 1.5} height={h * 0.15} rx={h * 0.05} fill={shade(colour, 0.06)} stroke={shade(colour, -0.4)} strokeOpacity="0.5" strokeWidth="0.8" />
        {/* laces */}
        {[0.07, 0.13, 0.19].map((t) => (
          <line key={t} x1={fx - opening * 0.85} x2={fx + opening * 0.85} y1={top + h * t} y2={top + h * t} stroke={lace} strokeWidth="2.2" strokeLinecap="round" />
        ))}
        {/* sole */}
        <rect x={fx - width * 0.53} y={base - h * 0.08} width={width * 1.06} height={h * 0.08} rx={h * 0.035} fill={sole} stroke="#000" strokeOpacity="0.2" strokeWidth="0.8" />
        <line x1={fx - width * 0.48} x2={fx + width * 0.48} y1={base - h * 0.045} y2={base - h * 0.045} stroke="#000" strokeOpacity="0.12" strokeWidth="1" />
      </g>
    );
  };

  return (
    <g>
      <FabricDefs id={id} colour={colour} />
      {shoe(-1)}
      {shoe(1)}
    </g>
  );
}

import { flipX, mirrored, smoothPath, type Point } from "@/lib/body/path";
import { shade } from "@/lib/helpers/colour";
import { Fabric, FabricDefs, Fold, Stitch, type GarmentProps } from "./fabric";

// Bottoms: straight-leg trousers / jeans with waistband, belt loops, fly,
// front pockets and creases. Denim gets the classic gold stitching.
export function Trousers({ g, colour, colourId, id }: GarmentProps) {
  const { h, cx } = g;
  const ease = h * 0.07;
  const width = (y: number) => g.bodyHalfAt(y) + ease;

  const bandTop = g.waistY + h * 0.1;
  const bandBottom = bandTop + h * 0.11;
  const hemY = g.ankleY + h * 0.05;
  const thighY = g.crotchY + h * 0.35;
  const stitchInk = colourId === "denim" ? "#c99a3f" : undefined;

  const outline = smoothPath(
    mirrored(
      [
        [0, bandTop],
        [width(bandTop) * 0.98, bandTop],
        [width(g.hipY) * 1.01, g.hipY],
        [g.legAt(thighY).outer + ease * 0.8, thighY],
        [g.legAt(g.kneeY).outer + ease * 0.95, g.kneeY],
        [g.legAt(g.ankleY).outer + ease * 1.15, hemY],
        [g.legAt(g.ankleY).inner - ease * 1.15, hemY + h * 0.01],
        [g.legAt(g.kneeY).inner - ease * 0.8, g.kneeY],
        [ease * 0.3, g.crotchY + h * 0.09],
      ],
      cx,
    ),
    true,
    0.25,
  );

  // One leg's shape, used to shade each leg separately so they look round.
  const rightLeg: Point[] = [
    [cx + ease * 0.3, g.crotchY],
    [cx + width(g.hipY), g.hipY + h * 0.1],
    [cx + g.legAt(g.kneeY).outer + ease, g.kneeY],
    [cx + g.legAt(g.ankleY).outer + ease * 1.15, hemY],
    [cx + g.legAt(g.ankleY).inner - ease * 1.15, hemY],
    [cx + g.legAt(g.kneeY).inner - ease * 0.8, g.kneeY],
  ];

  const side = (sign: 1 | -1) => {
    const x = (v: number) => cx + sign * v;
    const legMid = g.legOffset * 0.95;
    return (
      <g key={sign}>
        <path d={smoothPath(sign === 1 ? rightLeg : flipX(rightLeg, cx), true, 0.2)} fill={`url(#${id}-vol)`} opacity="0.75" />
        {/* front pocket opening */}
        <Stitch ink={stitchInk} colour={colour} d={`M${x(width(bandTop) * 0.48)},${bandBottom} Q${x(width(g.hipY) * 0.62)},${g.hipY - h * 0.05} ${x(width(g.hipY) * 0.98)},${g.hipY - h * 0.02}`} />
        <path d={`M${x(width(bandTop) * 0.45)},${bandBottom} Q${x(width(g.hipY) * 0.6)},${g.hipY - h * 0.08} ${x(width(g.hipY) * 0.99)},${g.hipY - h * 0.06}`} stroke={shade(colour, -0.5)} strokeOpacity="0.5" fill="none" strokeWidth="1.1" />
        {/* centre crease down the leg */}
        <path d={`M${x(legMid + h * 0.02)},${g.crotchY + h * 0.15} L${x(legMid)},${hemY - h * 0.05}`} stroke="#fff" strokeOpacity="0.08" strokeWidth="2" />
        {/* knee and ankle wrinkles */}
        <Fold d={`M${x(legMid - g.kneeHalf * 0.6)},${g.kneeY - h * 0.05} q${sign * g.kneeHalf * 0.6},${h * 0.06} ${sign * g.kneeHalf * 1.2},0`} />
        <Fold d={`M${x(legMid - g.ankleHalf * 1.2)},${hemY - h * 0.22} q${sign * g.ankleHalf},${h * 0.07} ${sign * g.ankleHalf * 2.2},${-h * 0.02}`} />
        {/* hem */}
        <Stitch
          ink={stitchInk}
          colour={colour}
          d={`M${x(g.legAt(g.ankleY).outer + ease * 1.1 - 2)},${hemY - h * 0.05} L${x(g.legAt(g.ankleY).inner - ease * 1.1 + 2)},${hemY - h * 0.04}`}
        />
        {/* belt loops */}
        {[0.55, 0.96].map((t) => (
          <rect key={t} x={x(width(bandTop) * t) - 2.5} y={bandTop - 1} width="5" height={h * 0.13} rx="1.5" fill={shade(colour, -0.1)} stroke={shade(colour, -0.5)} strokeOpacity="0.4" strokeWidth="0.8" />
        ))}
      </g>
    );
  };

  return (
    <g>
      <FabricDefs id={id} colour={colour} />
      <Fabric d={outline} colour={colour} id={id} />
      {side(1)}
      {side(-1)}
      {/* waistband */}
      <path d={`M${cx - width(bandTop) * 0.98},${bandBottom} Q${cx},${bandBottom + h * 0.02} ${cx + width(bandTop) * 0.98},${bandBottom}`} stroke={shade(colour, -0.5)} strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
      <Stitch ink={stitchInk} colour={colour} d={`M${cx - width(bandTop) * 0.95},${bandTop + h * 0.03} Q${cx},${bandTop + h * 0.05} ${cx + width(bandTop) * 0.95},${bandTop + h * 0.03}`} />
      <circle cx={cx} cy={(bandTop + bandBottom) / 2} r={h * 0.035} fill={stitchInk ? "#b08d4a" : shade(colour, -0.3)} />
      {/* fly */}
      <Stitch ink={stitchInk} colour={colour} d={`M${cx - h * 0.06},${bandBottom} L${cx - h * 0.06},${g.crotchY - h * 0.12} Q${cx - h * 0.06},${g.crotchY - h * 0.02} ${cx},${g.crotchY}`} />
      <path d={`M${cx},${bandBottom} L${cx},${g.crotchY + h * 0.04}`} stroke={shade(colour, -0.5)} strokeOpacity="0.45" strokeWidth="1" />
    </g>
  );
}

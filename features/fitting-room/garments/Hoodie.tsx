import { flipX, mirrored, smoothPath, type Point } from "@/lib/body/path";
import { luminance, mix, shade } from "@/lib/helpers/colour";
import { Fabric, FabricDefs, Fold, Ribbing, Stitch, type GarmentProps } from "./fabric";

// Hoodie / sweatshirt: hood, long sleeves with ribbed cuffs, kangaroo pocket, ribbed hem.
export function Hoodie({ g, colour, id, flat }: GarmentProps) {
  const { h, cx } = g;
  const ease = h * 0.1;
  const width = (y: number) => g.bodyHalfAt(y) + ease;

  const neckW = g.neckHalf * 1.35;
  const neckY = g.neckBaseY - h * 0.02;
  const dipY = g.neckBaseY + h * 0.1;
  const hemY = g.crotchY - h * 0.02;
  const bandTop = hemY - h * 0.14;
  const cuffEnd = g.wristY + h * 0.05;
  const cuffTop = g.wristY - h * 0.1;
  const sleeve = (y: number, extra = 1) => {
    const arm = g.armAt(y);
    return { outer: arm.center + arm.half + ease * extra, inner: arm.center - arm.half - ease * 0.5 * extra };
  };
  const shoulderPt: Point = [g.shoulderHalf + ease * 0.6, g.shoulderY + h * 0.07];
  const armpitPt: Point = [width(g.armpitY), g.armpitY + h * 0.12];

  const body = smoothPath(
    mirrored(
      [
        [0, dipY],
        [neckW * 0.75, dipY - h * 0.06],
        [neckW, neckY],
        shoulderPt,
        [sleeve(g.armpitY).outer, g.armpitY], // sleeve covers the whole upper arm
        [sleeve(g.elbowY).outer, g.elbowY],
        [sleeve(cuffTop).outer, cuffTop],
        [sleeve(cuffEnd, 0.6).outer, cuffEnd],
        [sleeve(cuffEnd, 0.6).inner, cuffEnd + h * 0.02],
        [sleeve(cuffTop).inner, cuffTop],
        [sleeve(g.elbowY).inner, g.elbowY + h * 0.06],
        armpitPt,
        [Math.max(width(g.waistY), width(g.chestY) * 0.96), g.waistY],
        [width(g.hipY) * 0.98, bandTop],
        [width(g.hipY) * 0.9, hemY],
        [0, hemY + h * 0.01],
      ],
      cx,
    ),
    true,
    0.35,
  );

  // Hood lying on the shoulders: two lobes framing the neck.
  const hoodLobe: Point[] = [
    [cx + g.neckHalf * 1.02, g.chinY + h * 0.0],
    [cx + g.neckHalf * 2.0, g.chinY + h * 0.05],
    [cx + g.neckHalf * 2.6, g.neckBaseY + h * 0.04],
    [cx + g.shoulderHalf * 0.74, g.shoulderY + h * 0.05],
    [cx + neckW * 1.05, neckY + h * 0.08],
  ];

  const bandHalf = width(g.hipY) * 0.95;
  const band = smoothPath(
    [
      [cx - bandHalf, bandTop],
      [cx + bandHalf, bandTop],
      [cx + width(g.hipY) * 0.9, hemY],
      [cx - width(g.hipY) * 0.9, hemY],
    ],
    true,
    0.1,
  );

  const pocketTop = g.waistY + h * 0.08;
  const pocketBottom = bandTop - h * 0.03;
  const pocketTopHalf = g.waistHalf * 0.5;
  const pocketBottomHalf = width(g.hipY) * 0.62;
  const pocket = `M${cx - pocketTopHalf},${pocketTop} L${cx + pocketTopHalf},${pocketTop}
    Q${cx + pocketBottomHalf * 0.8},${pocketTop + h * 0.1} ${cx + pocketBottomHalf},${pocketBottom}
    L${cx - pocketBottomHalf},${pocketBottom} Q${cx - pocketBottomHalf * 0.8},${pocketTop + h * 0.1} ${cx - pocketTopHalf},${pocketTop} Z`;

  const stringColour = luminance(colour) > 0.6 ? shade(colour, -0.3) : mix(colour, "#ffffff", 0.65);

  const cuff = (sign: 1 | -1) => {
    const top = sleeve(cuffTop);
    const end = sleeve(cuffEnd, 0.6);
    const pts: Point[] = [
      [cx + top.outer, cuffTop],
      [cx + end.outer, cuffEnd],
      [cx + end.inner, cuffEnd + h * 0.02],
      [cx + top.inner, cuffTop],
    ];
    const shape = sign === 1 ? pts : flipX(pts, cx);
    const xs = shape.map(([x]) => x);
    return (
      <Ribbing
        key={`cuff${sign}`}
        id={id}
        colour={colour}
        d={smoothPath(shape, true, 0.15)}
        x0={Math.min(...xs)}
        x1={Math.max(...xs)}
        y0={cuffTop}
        y1={cuffEnd + h * 0.02}
      />
    );
  };

  return (
    <g>
      <FabricDefs id={id} colour={colour} />
      {flat && (
        <ellipse cx={cx} cy={neckY - h * 0.12} rx={neckW * 1.7} ry={h * 0.34} fill={shade(colour, -0.12)} />
      )}
      <Fabric d={body} colour={colour} id={id} />
      {[1, -1].map((sign) => (
        <g key={sign}>
          <Stitch
            colour={colour}
            d={smoothPath(
              [
                [cx + sign * (shoulderPt[0] - 2), shoulderPt[1] + 2],
                [cx + sign * (g.shoulderHalf - h * 0.02), (g.shoulderY + g.armpitY) / 2 + h * 0.08],
                [cx + sign * (armpitPt[0] - 2), armpitPt[1]],
              ],
              false,
            )}
          />
          <Fold d={`M${cx + sign * sleeve(g.elbowY).outer * 0.96},${g.elbowY - h * 0.15} q${-sign * h * 0.08},${h * 0.12} ${-sign * h * 0.02},${h * 0.3}`} />
          <Fold d={`M${cx + sign * width(g.waistY) * 0.8},${g.chestY + h * 0.3} Q${cx + sign * width(g.waistY) * 0.62},${g.waistY + h * 0.1} ${cx + sign * width(g.hipY) * 0.78},${bandTop - h * 0.04}`} />
        </g>
      ))}
      {cuff(1)}
      {cuff(-1)}
      <Ribbing id={id} colour={colour} d={band} x0={cx - bandHalf} x1={cx + bandHalf} y0={bandTop} y1={hemY} />
      {/* kangaroo pocket */}
      <path d={pocket} fill={shade(colour, -0.05)} />
      <path d={pocket} fill="none" stroke={shade(colour, -0.45)} strokeOpacity="0.45" strokeWidth="1" />
      <Stitch colour={colour} d={`M${cx - pocketTopHalf + 3},${pocketTop + 3} L${cx + pocketTopHalf - 3},${pocketTop + 3}`} />
      {/* hood */}
      <Fabric d={smoothPath(hoodLobe, true, 0.6)} colour={colour} id={id} tone={-0.03} />
      <Fabric d={smoothPath(flipX(hoodLobe, cx), true, 0.6)} colour={colour} id={id} tone={-0.03} />
      {/* drawstrings with metal tips */}
      {[1, -1].map((sign) => {
        const x = cx + sign * neckW * 0.42;
        return (
          <g key={`string${sign}`}>
            <path d={`M${x},${dipY - h * 0.01} q${sign * h * 0.03},${h * 0.3} ${sign * h * 0.05},${h * 0.55}`} stroke={stringColour} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <rect x={x + sign * h * 0.05 - 1.6} y={dipY + h * 0.52} width="3.2" height={h * 0.08} rx="1.2" fill="#b9b9b9" />
          </g>
        );
      })}
    </g>
  );
}

import { mirrored, smoothPath, type Point } from "@/lib/body/path";
import { shade } from "@/lib/helpers/colour";
import { Fabric, FabricDefs, Fold, Stitch, type GarmentProps } from "./fabric";

// Inner top: a crew-neck T-shirt with short sleeves.
export function Tee({ g, colour, id, flat }: GarmentProps) {
  const { h, cx } = g;
  const ease = h * 0.07;
  const width = (y: number) => g.bodyHalfAt(y) + ease;

  const sleeveY = g.shoulderY + h * 0.95;
  const arm = g.armAt(sleeveY);
  const neckW = g.neckHalf * 1.3;
  const neckY = g.neckBaseY - h * 0.03;
  const dipY = g.neckBaseY + h * 0.2;
  const hemY = g.crotchY - h * 0.04;
  const shoulderPt: Point = [g.shoulderHalf + ease * 0.5, g.shoulderY + h * 0.06];
  const armpitPt: Point = [width(g.armpitY), g.armpitY + h * 0.08];

  const body = smoothPath(
    mirrored(
      [
        [0, dipY],
        [neckW * 0.72, dipY - h * 0.12],
        [neckW, neckY],
        shoulderPt,
        [arm.center + arm.half + ease, sleeveY],
        [arm.center - arm.half - ease * 0.2, sleeveY + h * 0.1],
        armpitPt,
        [Math.max(width(g.waistY), width(g.chestY) * 0.95), g.waistY],
        [width(g.hipY), hemY - h * 0.06],
        [width(g.hipY) * 0.98, hemY],
        [0, hemY + h * 0.03],
      ],
      cx,
    ),
    true,
    0.35,
  );

  const neckline = (offset: number) =>
    smoothPath(
      [
        [cx - neckW, neckY + offset * 0.3],
        [cx - neckW * 0.72, dipY - h * 0.12 + offset],
        [cx, dipY + offset],
        [cx + neckW * 0.72, dipY - h * 0.12 + offset],
        [cx + neckW, neckY + offset * 0.3],
      ],
      false,
      0.6,
    );

  const side = (sign: 1 | -1) => {
    const x = (v: number) => cx + sign * v;
    return (
      <g key={sign}>
        {/* armhole seam */}
        <Stitch
          colour={colour}
          d={smoothPath(
            [
              [x(shoulderPt[0] - 2), shoulderPt[1] + 2],
              [x(g.shoulderHalf - h * 0.03), (g.shoulderY + g.armpitY) / 2 + h * 0.06],
              [x(armpitPt[0] - 2), armpitPt[1]],
            ],
            false,
          )}
        />
        {/* sleeve hem */}
        <Stitch
          colour={colour}
          d={`M${x(arm.center + arm.half + ease - 3)},${sleeveY - h * 0.07} L${x(arm.center - arm.half - ease * 0.2 + 2)},${sleeveY + h * 0.03}`}
        />
        {/* soft drape at the waist */}
        <Fold d={`M${x(width(g.waistY) * 0.78)},${g.chestY + h * 0.25} Q${x(width(g.waistY) * 0.6)},${g.waistY} ${x(width(g.hipY) * 0.7)},${hemY - h * 0.1}`} />
      </g>
    );
  };

  return (
    <g>
      <FabricDefs id={id} colour={colour} />
      {/* Laid flat there's no neck in the way, so show the inside back of the collar. */}
      {flat && (
        <path
          d={`M${cx - neckW},${neckY} Q${cx},${neckY - h * 0.1} ${cx + neckW},${neckY} L${cx},${dipY} Z`}
          fill={shade(colour, -0.4)}
        />
      )}
      <Fabric d={body} colour={colour} id={id} />
      {side(1)}
      {side(-1)}
      {/* ribbed crew collar */}
      <path d={neckline(h * 0.025)} fill="none" stroke={shade(colour, -0.1)} strokeWidth={h * 0.06} strokeLinecap="round" />
      <path d={neckline(0)} fill="none" stroke={shade(colour, -0.45)} strokeOpacity="0.5" strokeWidth="1" />
      <Stitch colour={colour} d={neckline(h * 0.06)} />
      {/* hem stitching */}
      <Stitch
        colour={colour}
        d={smoothPath(
          [
            [cx - width(g.hipY) * 0.95, hemY - h * 0.05],
            [cx, hemY - h * 0.02],
            [cx + width(g.hipY) * 0.95, hemY - h * 0.05],
          ],
          false,
        )}
      />
    </g>
  );
}

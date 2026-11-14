import { flipX, smoothPath, type Point } from "@/lib/body/path";
import { shade } from "@/lib/helpers/colour";
import { Fabric, FabricDefs, Fold, Stitch, type GarmentProps } from "./fabric";

// Outer layer: an OPEN jacket / overshirt with lapels, so the layers
// underneath stay visible down the middle.
export function Jacket({ g, colour, id, flat }: GarmentProps) {
  const { h, cx } = g;
  const ease = h * 0.13;
  const width = (y: number) => g.bodyHalfAt(y) + ease;
  const nh = g.neckHalf;

  const hemY = g.crotchY + h * 0.16;
  const sleeveEnd = g.wristY + h * 0.08;
  const lapelY = g.chestY + h * 0.38;
  const gapTop = nh * 1.05;
  const gapBottom = nh * 1.55;
  const sleeve = (y: number) => {
    const arm = g.armAt(y);
    return { outer: arm.center + arm.half + ease * 0.85, inner: arm.center - arm.half - ease * 0.55 };
  };
  const shoulderPt: Point = [cx + g.shoulderHalf + ease * 0.7, g.shoulderY + h * 0.05];
  const armpitPt: Point = [cx + width(g.armpitY) - ease * 0.6, g.armpitY + h * 0.14];
  const collarPt: Point = [cx + nh * 1.25, g.neckBaseY - h * 0.06];

  // Right front panel incl. sleeve (the left one is its mirror image).
  const panel: Point[] = [
    collarPt,
    shoulderPt,
    [cx + sleeve(g.armpitY).outer, g.armpitY],
    [cx + sleeve(g.elbowY).outer, g.elbowY],
    [cx + sleeve(sleeveEnd).outer, sleeveEnd],
    [cx + sleeve(sleeveEnd).inner, sleeveEnd + h * 0.04],
    [cx + sleeve(g.elbowY).inner, g.elbowY + h * 0.06],
    armpitPt,
    [cx + Math.max(width(g.waistY), width(g.chestY) * 0.97) - ease * 0.7, g.waistY],
    [cx + width(g.hipY) - ease * 0.6, hemY],
    [cx + gapBottom, hemY + h * 0.02],
    [cx + gapTop * 1.1, lapelY],
    [cx + nh * 1.35, g.neckBaseY + h * 0.12],
  ];
  const lapel: Point[] = [
    [cx + gapTop * 1.1, lapelY],
    [cx + nh * 2.65, g.shoulderY + h * 0.3],
    [cx + nh * 2.2, g.shoulderY - h * 0.01],
    [cx + nh * 1.25, g.neckBaseY - h * 0.05],
    [cx + nh * 1.35, g.neckBaseY + h * 0.12],
  ];
  const collarStand: Point[] = [
    [cx + nh * 1.02, g.neckBaseY - h * 0.24],
    [cx + nh * 1.7, g.neckBaseY - h * 0.18],
    [cx + nh * 2.2, g.shoulderY - h * 0.01],
    [cx + nh * 1.25, g.neckBaseY - h * 0.02],
  ];
  const pocketFlap = (sign: 1 | -1) => {
    const x0 = cx + sign * width(g.hipY) * 0.42;
    const x1 = cx + sign * width(g.hipY) * 0.86;
    const y0 = g.hipY + h * 0.04;
    return `M${x0},${y0} L${x1},${y0 - h * 0.02} L${x1},${y0 + h * 0.1} L${x0},${y0 + h * 0.12} Z`;
  };

  const side = (sign: 1 | -1) => {
    const flip = (pts: Point[]) => (sign === 1 ? pts : flipX(pts, cx));
    const cuffY = sleeveEnd - h * 0.14;
    const cuffLine = flip([
      [cx + sleeve(cuffY).outer, cuffY],
      [cx + sleeve(cuffY).inner, cuffY + h * 0.04],
    ]);
    return (
      <g key={sign}>
        <Fabric d={smoothPath(flip(collarStand), true, 0.5)} colour={colour} id={id} tone={-0.14} />
        <Fabric d={smoothPath(flip(panel), true, 0.22)} colour={colour} id={id} />
        <Fold d={`M${cx + sign * sleeve(g.elbowY).outer * 0.97},${g.elbowY - h * 0.2} q${-sign * h * 0.1},${h * 0.15} ${-sign * h * 0.03},${h * 0.35}`} />
        <Fold d={`M${cx + sign * width(g.waistY) * 0.72},${g.chestY + h * 0.4} q${sign * h * 0.04},${h * 0.5} ${sign * h * 0.1},${h * 1.0}`} />
        <Fabric d={smoothPath(flip(lapel), true, 0.12)} colour={colour} id={id} tone={-0.07} />
        <Stitch colour={colour} d={smoothPath(flip([[cx + gapTop * 1.1 + 4, lapelY + 6], [cx + gapBottom + 4, hemY - 4]]), false)} />
        <Stitch
          colour={colour}
          d={smoothPath(flip([[shoulderPt[0] - 3, shoulderPt[1] + 3], [cx + g.shoulderHalf + ease * 0.2, (g.shoulderY + g.armpitY) / 2 + h * 0.1], [armpitPt[0] - 2, armpitPt[1]]]), false)}
        />
        <path d={smoothPath(cuffLine, false)} stroke={shade(colour, -0.45)} strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
        <path d={pocketFlap(sign)} fill={shade(colour, -0.06)} stroke={shade(colour, -0.45)} strokeOpacity="0.55" strokeWidth="1" />
      </g>
    );
  };

  const buttonX = cx - gapTop * 1.1 - h * 0.08;
  const buttons = [lapelY + h * 0.06, g.waistY + h * 0.3, g.hipY + h * 0.32];

  return (
    <g>
      <FabricDefs id={id} colour={colour} />
      {/* Laid flat, the jacket's lining shows through the open front. */}
      {flat && (
        <path
          d={`M${cx - nh * 1.3},${g.neckBaseY - h * 0.05} L${cx + nh * 1.3},${g.neckBaseY - h * 0.05} L${cx + gapBottom * 1.3},${hemY} L${cx - gapBottom * 1.3},${hemY} Z`}
          fill={shade(colour, -0.45)}
        />
      )}
      {side(1)}
      {side(-1)}
      {buttons.map((y) => (
        <g key={y}>
          <circle cx={buttonX} cy={y} r={h * 0.045} fill={shade(colour, -0.35)} />
          <circle cx={buttonX - 1} cy={y - 1} r={h * 0.02} fill="#fff" fillOpacity="0.18" />
        </g>
      ))}
    </g>
  );
}

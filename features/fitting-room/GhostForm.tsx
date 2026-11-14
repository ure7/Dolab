import type { BodyGeometry } from "@/lib/body/geometry";
import { mirrored, smoothPath, type Point } from "@/lib/body/path";

type GhostFormProps = {
  g: BodyGeometry;
  /** Hide the legs (e.g. when trousers are on, so nothing shows between them). */
  showLegs: boolean;
};

// The "ghost mannequin": a faint, neutral outline that only shows where the
// layers sit — like the invisible mannequins in online-shop product photos.
// No head, no arms, no skin. Its proportions come from the body profile.
export function GhostForm({ g, showLegs }: GhostFormProps) {
  const { h, cx } = g;
  const line = "rgba(236, 238, 241, 0.4)";
  const fill = "rgba(236, 238, 241, 0.08)";

  // Torso: a short neck stub, soft shoulders, closed off at the hips.
  const torso: Point[] = [
    [0, g.neckBaseY - h * 0.28],
    [g.neckHalf * 0.95, g.neckBaseY - h * 0.28],
    [g.neckHalf, g.neckBaseY - h * 0.02],
    [g.neckHalf * 2, g.neckBaseY + h * 0.1],
    [g.shoulderHalf * 0.94, g.shoulderY + h * 0.06],
    [g.shoulderHalf * 0.98, g.shoulderY + h * 0.24], // rounded shoulder, no arm
    [g.chestHalf * 0.95, g.armpitY + h * 0.08],
    [g.chestHalf * 0.94, g.chestY + h * 0.2],
    [g.waistHalf, g.waistY],
    [g.hipHalf, g.hipY],
    [g.hipHalf * 0.94, g.crotchY],
    [0, g.crotchY + h * 0.04],
  ];

  const leg = (sign: 1 | -1): string => {
    const at = (y: number, edge: "outer" | "inner"): Point => [cx + sign * g.legAt(y)[edge], y];
    const thighY = g.crotchY + h * 0.35;
    return smoothPath(
      [
        at(g.crotchY + h * 0.05, "outer"),
        at(thighY, "outer"),
        at(g.kneeY, "outer"),
        at(g.calfY, "outer"),
        at(g.ankleY, "outer"),
        at(g.ankleY, "inner"),
        at(g.calfY, "inner"),
        at(g.kneeY, "inner"),
        at(thighY, "inner"),
        at(g.crotchY + h * 0.05, "inner"),
      ],
      true,
      0.4,
    );
  };

  return (
    <g>
      {/* soft floor shadow, so the outfit "stands" somewhere */}
      <ellipse cx={cx} cy={g.floorY + h * 0.3} rx={g.hipHalf * 1.8} ry={h * 0.08} fill="#000" opacity="0.25" />
      {showLegs && (
        <g fill={fill} stroke={line} strokeWidth="1.2" strokeDasharray="4 4">
          <path d={leg(1)} />
          <path d={leg(-1)} />
        </g>
      )}
      <path d={smoothPath(mirrored(torso, cx), true, 0.42)} fill={fill} stroke={line} strokeWidth="1.4" />
      {/* the neck opening, seen from the front */}
      <ellipse cx={cx} cy={g.neckBaseY - h * 0.28} rx={g.neckHalf * 0.95} ry={h * 0.05} fill="none" stroke={line} strokeWidth="1.2" />
    </g>
  );
}

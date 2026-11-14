import { shade } from "@/lib/helpers/colour";
import { zoneRect } from "@/lib/body/zones";
import { Fabric, FabricDefs, Stitch, type GarmentProps } from "./fabric";

// Accessory: a small crossbody bag with flap and buckle.
// Drawn beside the body with a short handle, in every view.
export function Bag({ g, colour, id }: GarmentProps) {
  const { h } = g;
  const bw = h * 0.78;
  const bh = h * 0.6;
  // Placed in the accessory zone (beside the body), so on-body and flat views agree.
  const zone = zoneRect("accessory", g);
  const bx = zone.x + (zone.width - bw) / 2;
  const by = zone.y + h * 0.38;
  const strap = shade(colour, -0.15);

  const body = `M${bx + 6},${by} H${bx + bw - 6} Q${bx + bw},${by} ${bx + bw},${by + 6} V${by + bh - 8} Q${bx + bw},${by + bh} ${bx + bw - 8},${by + bh} H${bx + 8} Q${bx},${by + bh} ${bx},${by + bh - 8} V${by + 6} Q${bx},${by} ${bx + 6},${by} Z`;
  const flap = `M${bx},${by + 6} Q${bx},${by} ${bx + 6},${by} H${bx + bw - 6} Q${bx + bw},${by} ${bx + bw},${by + 6} V${by + bh * 0.42} Q${bx + bw / 2},${by + bh * 0.62} ${bx},${by + bh * 0.42} Z`;

  return (
    <g>
      <FabricDefs id={id} colour={colour} />
      {/* short carry handle (a long crossbody strap looks like a stick when drawn flat) */}
      <path d={`M${bx + bw * 0.12},${by + 2} Q${bx + bw / 2},${by - bh * 1.1} ${bx + bw * 0.88},${by + 2}`} stroke={strap} strokeWidth={h * 0.045} fill="none" strokeLinecap="round" />
      <Fabric d={body} colour={colour} id={id} />
      <Fabric d={flap} colour={colour} id={id} tone={-0.06} />
      <Stitch colour={colour} d={`M${bx + 5},${by + bh * 0.38} Q${bx + bw / 2},${by + bh * 0.56} ${bx + bw - 5},${by + bh * 0.38}`} />
      <rect x={bx + bw / 2 - h * 0.06} y={by + bh * 0.46} width={h * 0.12} height={h * 0.08} rx="2" fill="#c8b27c" stroke="#7d6a3c" strokeWidth="0.8" />
    </g>
  );
}

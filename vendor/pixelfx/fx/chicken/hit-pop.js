import { fit, burst, fly, clamp, seg, ease, TAU, WHITE, sparkle } from "../../core/index.js";

// A small, snappy hit for tiny characters: a white 4-point star pops on contact, a thin ring kicks out,
// a few sparks fly back the way the blow came and drop.
export const meta = {
  name: "Hit pop",
  desc: "A tiny snappy impact: white star pop, kicked ring, a few sparks thrown off and falling.",
  tags: ["chicken", "combat", "hit", "impact", "small", "directional", "one-shot"],
  size: [48, 40],
  origin: [20, 24],
  duration: 0.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#5a2a10", "#a04a14", "#e07a24", "#ffb44a", "#ffe08a", "#fff6d0", "#ffffff"],
    size: 1,
    seed: 3,
  },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7), k = o.size;
  if (t < 0.12) {
    const u = t / 0.12, arm = (5 + 3 * k) * (1 - ease.inQuad(u));
    sparkle(p, 0, 0, arm, u < 0.4 ? WHITE : C[5], C[4], 0.7);
    if (t < 0.035) p.circle(0, 0, 2 + k, WHITE);
  }
  if (t < 0.22) {
    const u = t / 0.22;
    p.ring(0, 0, 2 + ease.outQuart(u) * (6 + 4 * k), 1, u < 0.3 ? WHITE : C[4], 1 - u);
  }
  burst(4 + Math.round(3 * k), o.seed, (r) => {
    const a = r.range(-0.9, 0.9) + Math.PI * 0.85 * (r.chance(0.7) ? 1 : 0), sp = r.range(50, 110) * (0.7 + 0.3 * k), life = r.range(0.18, 0.34);
    if (t > life) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp - 30, t, 400, 4);
    const [x2, y2] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp - 30, Math.max(0, t - 0.025), 400, 4);
    p.line(x2, y2, x, y, C[4]);
    p.px(x, y, t < life * 0.5 ? WHITE : C[5]);
    p.light(x, y, C[4], 0.5 * (1 - t / life));
  });
  p.glow(0, 0, 8 + 4 * k, C[4], 0.5 * (1 - seg(t, 0, 0.25)));
}

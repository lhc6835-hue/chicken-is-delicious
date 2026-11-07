import { fit, bolt, rng, clamp, seg, WHITE, sparkle, burst, fly } from "../../core/index.js";

// A small lightning strike from above onto a target: a jagged bolt flickers through three shapes, the
// ground point flares and throws sparks, an afterimage lingers.
export const meta = {
  name: "Zap",
  desc: "A small lightning bolt drops on a target, flickering through shapes; the strike point flares and sparks.",
  tags: ["chicken", "combat", "lightning", "small", "one-shot"],
  size: [56, 96],
  origin: [28, 84],
  duration: 0.55,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#14143a", "#26307a", "#3a5ad0", "#6a9cff", "#a8d0ff", "#e4f2ff", "#ffffff"],
    height: 70,
    seed: 5,
  },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7), H = o.height, frame = Math.floor(t * 30);
  if (t < 0.28) {
    const r = rng(o.seed, Math.floor(frame / 2));
    const path = bolt(r, r.range(-8, 8), -H, 0, -4, { jag: 0.28, depth: 4 });
    const a = t < 0.14 ? 1 : 1 - seg(t, 0.14, 0.28);
    for (let i = 0; i < path.length - 1; i++) {
      const [x0, y0] = path[i], [x1, y1] = path[i + 1];
      p.line(x0 - 1, y0, x1 - 1, y1, C[4], a * 0.7);
      p.line(x0, y0, x1, y1, a > 0.6 ? WHITE : C[5], a);
      p.glowLine(x0, y0, x1, y1, 7, C[4], 0.35 * a);
    }
    // a short branch
    const [bx, by] = path[Math.floor(path.length / 2)];
    p.line(bx, by, bx + r.range(-10, 10), by + r.range(6, 14), C[5], a * 0.8);
  }
  if (t < 0.08) { p.circle(0, -3, 4, WHITE); p.glow(0, -3, 22, C[5], 1); }
  if (t < 0.3) sparkle(p, 0, -3, 6 * (1 - t / 0.3) + 1, C[5], C[4], 0.6);
  burst(8, o.seed + 3, (r) => {
    const a = -Math.PI / 2 + r.range(-1.4, 1.4), sp = r.range(60, 140), life = r.range(0.2, 0.4);
    if (t > life) return;
    const [x, y] = fly(0, -3, Math.cos(a) * sp, Math.sin(a) * sp, t, 500, 3);
    p.px(x, y, t < life / 2 ? WHITE : C[5]);
    p.light(x, y, C[4], 0.5);
  });
  p.ellipse(0, 0, 8, 2, C[3], 0.6 * (1 - seg(t, 0, 0.5)));
  p.glow(0, -2, 14, C[4], 0.5 * (1 - seg(t, 0, 0.5)));
}

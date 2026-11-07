import { fit, clamp, seg, ease, TAU, WHITE, burst, fly } from "../../core/index.js";

// A short sword arc sized for a tiny hero: a crescent whips over the top from behind to the front in two
// frames, white at the leading edge, cooling as its tail thins out, a glint at the tip.
export const meta = {
  name: "Slash arc",
  desc: "A small crescent sword swing: white leading edge, tail cooling and thinning, a tip glint and shavings.",
  tags: ["chicken", "combat", "slash", "melee", "small", "directional", "one-shot"],
  size: [56, 48],
  origin: [20, 34],
  duration: 0.36,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#1a2450", "#2c4c94", "#4a84d0", "#8cc4f4", "#c8e4ff", "#eef6ff", "#ffffff"],
    radius: 13,
    seed: 2,
  },
};

const A0 = -2.4, A1 = 0.9, SWEEP = 0.07;

export function draw(p, t, o) {
  const C = fit(o.palette, 7), Rr = o.radius, cx = 2, cy = -8, sy = 0.7;
  const head = ease.outExpo(clamp(t / SWEEP)), tail = ease.inQuad(seg(t, SWEEP * 0.6, meta.duration * 0.85));
  const h = A0 + (A1 - A0) * head, tl = A0 + (A1 - A0) * tail;
  if (h - tl < 0.03) return;
  const age = seg(t, 0, meta.duration);
  for (let a = tl; a <= h; a += 0.02) {
    const v = (a - tl) / (h - tl), w = 1 + 3.2 * Math.pow(Math.sin(Math.PI * Math.pow(v, 1.8)), 0.7) * (1 - age * 0.6);
    const ca = Math.cos(a), sa = Math.sin(a) * sy;
    for (let d = 0; d < w; d += 0.5) {
      const q = d / w, x = cx + ca * (Rr - d), y = cy + sa * (Rr - d);
      const i = q < 0.25 && age < 0.5 ? 6 : clamp(Math.round(5 - q * 2 - age * 3 - (1 - v) * 1.5), 1, 6);
      p.dot(x, y, C[i], clamp(v * 2.5));
    }
    if (((a * 50) | 0) % 3 === 0) p.light(cx + ca * Rr, cy + sa * Rr, C[4], 0.25 * v * (1 - age));
  }
  // tip glint as it lands
  if (t > SWEEP * 0.5 && t < SWEEP + 0.08) {
    const x = cx + Math.cos(A1) * Rr, y = cy + Math.sin(A1) * Rr * sy;
    p.px(x, y, WHITE); p.px(x + 1, y, C[5]); p.px(x - 1, y, C[5]); p.px(x, y + 1, C[5]); p.px(x, y - 1, C[5]);
    p.glow(x, y, 6, C[5], 0.6);
  }
  burst(5, o.seed, (r) => {
    const a = A0 + (A1 - A0) * r.range(0.5, 1), sp = r.range(30, 70), life = r.range(0.12, 0.25), tt = t - SWEEP;
    if (tt < 0 || tt > life) return;
    const sx = cx + Math.cos(a) * Rr, sy2 = cy + Math.sin(a) * Rr * sy, [x, y] = fly(sx, sy2, Math.cos(a) * sp, Math.sin(a) * sp, tt, 200, 3);
    p.px(x, y, C[5]);
  });
}

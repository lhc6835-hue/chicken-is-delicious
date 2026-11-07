import { fit, clamp, seg, ease, WHITE, sparkle, burst, fly } from "../../core/index.js";

// Loot from a fallen hero: a coin jumps out, spinning, bounces twice on the floor with a glint each time
// and twinkles while it waits to be collected.
export const meta = {
  name: "Coin pop",
  desc: "A small coin hops out of a defeated enemy, spinning, bounces twice with glints, then twinkles.",
  tags: ["chicken", "combat", "loot", "coin", "small", "one-shot"],
  size: [56, 48],
  origin: [20, 40],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#3a2206", "#6e420a", "#a8700e", "#e0a418", "#ffd24a", "#fff0a0", "#ffffff"],
    dx: 12,
    seed: 2,
  },
};

// height over time: three hops, each lower
function hop(t) {
  const hops = [[0, 0.42, 22], [0.42, 0.66, 7], [0.66, 0.8, 2.5]];
  for (const [a, b, h] of hops) if (t < b) { const u = (t - a) / (b - a); return 4 * h * u * (1 - u); }
  return 0;
}

export function draw(p, t, o) {
  const C = fit(o.palette, 7), x = o.dx * ease.outQuad(clamp(t / 0.8)), y = -hop(t) - 2;
  const fade = 1 - seg(t, 1.0, 1.2);
  if (fade <= 0) return;
  const spin = Math.cos(t * 20 * (1 - clamp(t / 0.9) * 0.8)), w = Math.max(0.5, Math.abs(spin) * 2.2);
  p.ellipse(x, 0, 2.5, 0.8, C[0], 0.4 * fade);
  p.ellipse(x, y, w + 0.6, 2.8, C[1], fade);
  p.ellipse(x, y, w, 2.3, spin > 0 ? C[4] : C[3], fade);
  if (w > 1.2) p.px(x - 0.5, y - 1, C[6]);
  for (const b of [0.42, 0.66]) if (t > b && t < b + 0.12) sparkle(p, x, y - 1, 3, C[5], C[4], 0.5);
  if (t > 0.85) {
    const tw = Math.sin((t - 0.85) * 20);
    if (tw > 0.6) sparkle(p, x - 1, y - 1, 2, C[5], C[4], 0.4);
  }
  p.glow(x, y, 6, C[4], 0.4 * fade);
}

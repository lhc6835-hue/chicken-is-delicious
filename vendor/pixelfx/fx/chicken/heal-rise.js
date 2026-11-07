import { fit, burst, clamp, seg, ease, TAU, WHITE, band, cycle } from "../../core/index.js";

// A heal on a tiny character: a ring opens on the floor round their feet, little plus signs and motes rise
// up through them and wink out, a soft green glow pulses once.
export const meta = {
  name: "Heal rise",
  desc: "A small heal: a floor ring opens, plus signs and motes rise and wink out, one soft pulse of light.",
  tags: ["chicken", "combat", "heal", "buff", "small", "one-shot"],
  size: [48, 56],
  origin: [24, 46],
  duration: 1.1,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#08201a", "#0f3f2c", "#17663e", "#24924e", "#3ec466", "#7ee88a", "#c8ffc4", "#ffffff"],
    seed: 3,
  },
};

export function drawBack(p, t, o) {
  const C = fit(o.palette, 8), u = seg(t, 0, 0.5), k = 1 - seg(t, 0.5, 1.0);
  band(p, 0, 0, 3 + 7 * ease.outCubic(u), 0.3, 1, k, C.slice(2), (a) => Math.sin(a) < 0);
}

export function draw(p, t, o) {
  const C = fit(o.palette, 8), u = seg(t, 0, 0.5), k = 1 - seg(t, 0.5, 1.0);
  band(p, 0, 0, 3 + 7 * ease.outCubic(u), 0.3, 1, k, C.slice(2), (a) => Math.sin(a) >= 0, u < 0.15);
  burst(5, o.seed, (r, i) => {
    const d = r.range(0, 0.35), life = r.range(0.45, 0.7), tt = t - d;
    if (tt < 0 || tt > life) return;
    const v = tt / life, x = r.range(-6, 6), y = -2 - ease.outQuad(v) * r.range(12, 20), c = v < 0.5 ? C[7] : C[5];
    const a = v > 0.75 ? 1 - (v - 0.75) * 4 : 1;
    if (a <= 0) return;
    p.px(x, y, c); p.px(x - 1, y, C[5]); p.px(x + 1, y, C[5]); p.px(x, y - 1, C[5]); p.px(x, y + 1, C[5]);
    p.light(x, y, C[5], 0.5 * a);
  });
  burst(8, o.seed + 1, (r) => {
    const d = r.range(0, 0.5), life = r.range(0.3, 0.6), tt = t - d;
    if (tt < 0 || tt > life) return;
    const v = tt / life;
    p.dot(r.range(-7, 7), -v * r.range(10, 18), C[6], 1 - v);
  });
  p.glow(0, -6, 12, C[5], 0.45 * Math.sin(Math.PI * seg(t, 0, 0.8)));
}

import { fit, burst, fly, clamp, seg, ease, TAU, WHITE, hex, sparkle } from "../../core/index.js";

// One tap on the egg: the shell splits with a white snap, thin blades of light stab out of the crack, chips
// of shell pop off and tumble away, and a pulse of colored light leaks out.
export const meta = {
  name: "Egg crack",
  desc: "A tap on an egg: white snap, blades of light from the crack, shell chips tumbling off, a pulse of rarity light.",
  tags: ["chicken", "gacha", "egg", "crack", "one-shot"],
  size: [96, 80],
  origin: [48, 44],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0c1a3a", "#13306a", "#1d52a4", "#2f80d8", "#5ab0f4", "#a4dcff", "#ffffff"],
    shell: ["#7a6248", "#c8b090", "#f4ead8"],
    power: 1,
    seed: 7,
  },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7), S = fit(o.shell, 3), k = o.power;
  // white snap
  if (t < 0.05) {
    p.circle(0, 0, 4 + 2 * k, WHITE);
    p.glow(0, 0, 26, C[5], 0.9);
  }
  // blades of light out of the crack
  burst(4 + Math.round(k * 3), o.seed, (r, i) => {
    const a = -Math.PI / 2 + r.range(-1.5, 1.5), L = r.range(14, 26) * (0.7 + 0.4 * k), life = r.range(0.25, 0.45);
    if (t > life) return;
    const grow = ease.outExpo(clamp(t / 0.08)), fade = 1 - seg(t, life * 0.4, life);
    const ca = Math.cos(a), sa = Math.sin(a), len = L * grow;
    for (let d = 1; d <= len; d += 0.5) {
      const u = d / len;
      p.dot(ca * d, sa * d, u < 0.4 ? WHITE : u < 0.75 ? C[5] : C[4], fade * (1.2 - u));
    }
    p.glowLine(0, 0, ca * len, sa * len, 4, C[4], 0.3 * fade);
  });
  // shell chips: little curved flakes that pop out and fall, spinning
  burst(6 + Math.round(k * 4), o.seed + 1, (r) => {
    const a = -Math.PI / 2 + r.range(-1.7, 1.7), sp = r.range(50, 130), life = r.range(0.45, 0.75);
    if (t > life) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp - 40, t, 520, 1.5);
    const spin = r.range(-14, 14) * t, big = r.chance(0.4), al = 1 - seg(t, life * 0.6, life);
    const cx = Math.cos(spin), sx = Math.sin(spin);
    p.dot(x, y, S[2], al);
    p.dot(x + cx, y + sx, cx > 0 ? S[1] : S[0], al);
    if (big) p.dot(x - sx, y + cx, S[1], al);
  });
  // a pulse of light leaks out and fades
  p.glow(0, 0, 18 + 10 * k, C[4], 0.5 * (1 - seg(t, 0, 0.6)) * k);
  if (t < 0.25) sparkle(p, 0, 0, 6 * (1 - t / 0.25) + 1, C[5], C[4], 0.6);
}

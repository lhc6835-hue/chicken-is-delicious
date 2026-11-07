import { fit, cycle, TAU, WHITE, clamp } from "../../core/index.js";

// The statue's eye lit by the rarity it is about to give: a white-hot pupil in a colored ring, four long
// rays and four short ones turning slowly, breathing in and out, with motes circling in.
export const meta = {
  name: "Eye glow",
  desc: "A statue's eye burns in the rarity color: hot pupil, slowly turning flare, breathing glow and orbiting motes.",
  tags: ["chicken", "gacha", "glint", "eye", "loop"],
  size: [64, 64],
  origin: [32, 32],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#2a1806", "#5a3a0c", "#9a6c14", "#d8a424", "#ffd84a", "#fff1a0", "#ffffff"],
    power: 1,
    seed: 2,
  },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7), ph = t / meta.duration, k = o.power, breathe = 0.5 + 0.5 * Math.sin(ph * TAU);
  if (k <= 0) return;
  // rays: 8-fold, turning a quarter turn per loop so the ends meet
  const rot = ph * (TAU / 4);
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * TAU) / 8, long = i % 2 === 0, L = (long ? 13 + breathe * 5 : 6 + breathe * 2) * Math.min(1.4, k);
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let d = 2; d <= L; d += 0.5) {
      const u = d / L;
      p.dot(ca * d, sa * d, u < 0.3 ? WHITE : u < 0.65 ? C[5] : C[4], clamp(1.15 - u) * (long ? 1 : 0.8));
    }
    p.glowLine(0, 0, ca * L, sa * L, 3, C[4], 0.18 * k);
  }
  // the eye: a colored ring round a white pupil
  p.circle(0, 0, 2.6, C[3]);
  p.circle(0, 0, 1.8, C[5]);
  p.rect(-1, -1, 2, 2, WHITE);
  p.glow(0, 0, 10 + breathe * 4, C[5], 0.55 * k);
  p.glow(0, 0, 26, C[4], 0.22 * k);
  // motes circling in towards it
  cycle(t, meta.duration, 7, o.seed, 0.8, (age, life, r) => {
    const u = age / life, a = r.range(0, TAU) + u * 2.2, d = 16 * (1 - u) + 3;
    p.dot(Math.cos(a) * d, Math.sin(a) * d, u > 0.7 ? WHITE : C[5], clamp(u * 4) * k);
  });
}

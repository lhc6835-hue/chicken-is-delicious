import { fit, cycle, TAU, WHITE, clamp, band, loopNoise } from "../../core/index.js";

// A pillar of light that stands behind a freshly hatched chicken: soft shafts climbing up, a pulsing ring
// on the floor and motes rising through it, all in the rarity color.
export const meta = {
  name: "Rarity aura",
  desc: "A column of rarity light behind a character: climbing shafts, a pulsing floor ring, rising motes.",
  tags: ["chicken", "gacha", "aura", "pillar", "loop"],
  size: [80, 140],
  origin: [40, 120],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#1c0a30", "#3a1462", "#5e22a0", "#8c3ad8", "#b56cf4", "#e0b4ff", "#ffffff"],
    height: 100,
    width: 14,
    seed: 4,
  },
};

export function drawBack(p, t, o) {
  const C = fit(o.palette, 7), ph = t / meta.duration, H = o.height, W = o.width;
  // shafts: thin vertical lines of light whose brightness scrolls upward
  for (let x = -W; x <= W; x++) {
    const q = Math.abs(x) / W, base = (1 - q * q);
    for (let y = 0; y > -H; y -= 1) {
      const v = -y / H, wave = 0.5 + 0.5 * Math.sin((v * 3 - ph) * TAU + x * 0.9);
      const a = base * (1 - v) * (0.25 + 0.55 * wave) * (v < 0.06 ? v / 0.06 : 1);
      if (a > 0.04) p.blend(x, y, q < 0.3 && wave > 0.7 ? C[5] : C[4], a * 0.75);
    }
  }
  p.glowLine(0, 0, 0, -H * 0.8, W * 1.3, C[4], 0.22);
  band(p, 0, 0, W + 2 + Math.sin(ph * TAU) * 1.5, 0.3, 1.5, 0.9, C.slice(1), (a) => Math.sin(a) < 0);
}

export function draw(p, t, o) {
  const C = fit(o.palette, 7), ph = t / meta.duration, H = o.height, W = o.width;
  band(p, 0, 0, W + 2 + Math.sin(ph * TAU) * 1.5, 0.3, 1.5, 0.9, C.slice(1), (a) => Math.sin(a) >= 0);
  p.glow(0, 0, W * 2.4, C[4], 0.35);
  cycle(t, meta.duration, 12, o.seed, (r) => r.range(0.9, 1.6), (age, life, r) => {
    const u = age / life, x = r.range(-W, W) + Math.sin(u * 6 + r.range(0, 6)) * 2, y = -u * H * r.range(0.5, 0.9);
    const c = u < 0.3 ? WHITE : C[5];
    p.dot(x, y, c, clamp((1 - u) * 2));
    if (r.chance(0.3)) p.dot(x, y + 1, C[4], clamp((1 - u) * 1.5));
    p.light(x, y, C[4], 0.4 * (1 - u));
  });
}

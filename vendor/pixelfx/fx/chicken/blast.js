import { Particles, Lights, P, PF, Rng, fit, clamp, seg, ease, TAU, WHITE, sparkle } from "../../core/index.js";

// A small elemental blast for spells landing on tiny characters: a flash, a ball that swells and breaks
// into rising puffs, sparks and debris thrown out, a ring on the floor. kind: fire, ice, arcane, holy, poison.
export const meta = {
  name: "Blast",
  desc: "A small elemental burst: flash, swelling ball breaking into puffs, sparks, debris and a floor ring.",
  tags: ["chicken", "combat", "explosion", "spell", "small", "one-shot"],
  size: [80, 72],
  origin: [40, 54],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#1f0b10", "#4a1118", "#8c1d1c", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a", "#fff8d6"],
    kind: "fire",
    size: 1,
    seed: 4,
  },
};

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), k = o.size, fire = o.kind === "fire";
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [WHITE, C[6], C[5], C[4]] });
  const lights = new Lights();
  const cy = -6;
  lights.add(0, cy, 30 * k, C[5], 0.8, 0.45);
  for (let i = 0; i < 14 * k; i++) {
    const a = R.range(0, TAU), sp = R.range(80, 200) * k;
    ps.spawn(P.SPARK, 0, cy, Math.cos(a) * sp, Math.sin(a) * sp - 40, R.range(0.2, 0.5));
  }
  if (fire) for (let i = 0; i < 8 * k; i++) {
    const a = R.range(0, TAU), sp = R.range(10, 50);
    ps.spawn(P.FIRE, Math.cos(a) * 3, cy + Math.sin(a) * 3, Math.cos(a) * sp, Math.sin(a) * sp - 20, R.range(0.25, 0.5), 0, R.range(1.4, 2.6) * k, R.range(0, 0.06), PF.SMOKES);
  } else for (let i = 0; i < 9 * k; i++) {
    const a = R.range(0, TAU), sp = R.range(30, 90);
    ps.spawn(i % 2 ? P.FLAKE : P.STAR, Math.cos(a) * 3, cy + Math.sin(a) * 3, Math.cos(a) * sp, Math.sin(a) * sp - 20, R.range(0.4, 0.8), i % 3 ? C[6] : WHITE, R.range(0.8, 1.8));
  }
  for (let i = 0; i < 4; i++) ps.spawn(P.DUST, R.range(-6, 6), -1, R.range(-30, 30), R.range(-10, -2), R.range(0.5, 0.9), fire ? "#6a5a5a" : C[3], R.range(2, 3.4) * k);
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); lights.update(dt); },
    drawBack(p) {
      const u = seg(t, 0, 0.5);
      if (u < 1) p.ellipse(0, 0, 4 + 14 * k * ease.outCubic(u), (4 + 14 * k * ease.outCubic(u)) * 0.28, C[3], (1 - u) * 0.6);
      ps.draw(p, "back");
    },
    draw(p) {
      if (t < 0.05) { p.circle(0, cy, 7 * k, WHITE); p.glow(0, cy, 24 * k, C[6], 0.9); }
      // the ball: swells fast, the rim cools and breaks into the puffs
      const u = seg(t, 0.02, 0.34);
      if (u > 0 && u < 1) {
        // the ball swells then burns down from the outside in: opaque steps, no dither
        const r = (3 + 7 * ease.outCubic(Math.min(1, u * 1.6))) * k * (1 - ease.inCubic(u) * 0.9);
        if (r > 0.6) {
          p.circle(0, cy, r + 1, C[2]);
          p.circle(0, cy, r, u < 0.5 ? C[5] : C[4]);
          p.circle(-r * 0.2, cy - r * 0.2, r * 0.6, u < 0.3 ? C[7] : C[6]);
          if (u < 0.25) p.circle(-r * 0.25, cy - r * 0.25, r * 0.3, WHITE);
          p.glow(0, cy, r * 3, C[5], 0.5 * (1 - u));
        }
      }
      ps.draw(p, "front");
      if (t < 0.2) sparkle(p, 0, cy, 6 * k * (1 - t / 0.2) + 1, C[6], C[5], 0.6);
      lights.draw(p);
    },
  };
}

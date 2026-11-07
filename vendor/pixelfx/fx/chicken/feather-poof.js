import { Particles, P, Rng, fit, clamp, seg, ease, TAU, WHITE, hex } from "../../core/index.js";
import { Plumes } from "./_lib.js";

// A chicken is knocked out: a soft white puff pops where it stood, its feathers burst out and rock down to
// the floor, a few loose bits of down float after them. Colors from the chicken's own palette.
export const meta = {
  name: "Feather poof",
  desc: "A tiny chicken knocked out: soft puff, its feathers bursting out and rocking down, down floating after.",
  tags: ["chicken", "combat", "death", "poof", "feather", "small", "one-shot"],
  size: [72, 64],
  origin: [36, 44],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#a89a90", "#e8e0d8", "#ffffff"],
    seed: 12,
  },
};

export function create(o) {
  const F = fit(o.palette, 3), R = new Rng(o.seed);
  const plumes = new Plumes(R), ps = new Particles({ rng: R, ground: () => 0 });
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + R.range(-1.8, 1.8), sp = R.range(50, 110);
    plumes.add({ x: 0, y: -5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, len: R.range(3.5, 5.5), life: R.range(1.1, 1.6), c0: F[0], c1: R.chance(0.3) ? F[2] : F[1], sink: R.range(10, 18), amp: R.range(4, 7) });
  }
  for (let i = 0; i < 7; i++) {
    const a = R.range(0, TAU), sp = R.range(20, 60);
    ps.spawn(P.FLAKE, R.range(-2, 2), -5, Math.cos(a) * sp, Math.sin(a) * sp - 10, R.range(0.8, 1.5), F[2], R.range(0.5, 1));
  }
  const lobes = Array.from({ length: 6 }, () => {
    const a = R.range(0, TAU), d = R.range(1, 4);
    return { x: Math.cos(a) * d, y: -5 + Math.sin(a) * d * 0.7, r0: R.range(1.5, 2.5), r1: R.range(3.5, 5.5), life: R.range(0.3, 0.5) };
  });
  let t = 0;
  return {
    update(dt) { t += dt; plumes.update(dt); ps.update(dt); },
    draw(p) {
      for (const l of lobes) {
        const u = clamp(t / l.life);
        if (u >= 1) continue;
        const r = l.r0 + (l.r1 - l.r0) * ease.outCubic(u);
        p.disc(l.x * (1 + u), l.y - u * 2, r, F[2], 0.9 * (1 - u));
        p.disc(l.x * (1 + u) - 0.5, l.y - u * 2 - 0.8, r * 0.6, WHITE, 0.7 * (1 - u));
      }
      if (t < 0.04) p.circle(0, -5, 4, WHITE);
      plumes.draw(p);
      ps.draw(p, "front");
    },
  };
}

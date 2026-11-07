import { Particles, P, Rng, fit, clamp, seg, ease, TAU, WHITE, hex, sparkle } from "../../core/index.js";

// A hero goes down: a dust cloud bursts out low along the floor, a ring of little stars spins round where
// their head was and drifts up, and their soul pops out as a faint wisp.
export const meta = {
  name: "Knockout",
  desc: "An enemy defeated: low dust burst along the floor, a spinning ring of little stars, a faint wisp rising.",
  tags: ["chicken", "combat", "death", "dust", "stars", "small", "one-shot"],
  size: [72, 72],
  origin: [36, 56],
  duration: 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#5a4a3a", "#8a7a68", "#c8b8a0"],
    stars: ["#c08a10", "#ffd84a", "#fff6c0"],
    seed: 14,
  },
};

export function create(o) {
  const D = fit(o.palette, 3), S = fit(o.stars, 3), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 0 });
  for (let i = 0; i < 9; i++) {
    const s = i % 2 ? 1 : -1;
    ps.spawn(P.DUST, s * R.range(0, 4), -1, s * R.range(30, 80), R.range(-14, -2), R.range(0.5, 0.9), D[R.int(1, 2)], R.range(2, 3.5));
  }
  for (let i = 0; i < 6; i++) ps.spawn(P.GRIT, R.range(-3, 3), -2, R.range(-50, 50), R.range(-120, -60), R.range(0.6, 1), D[0], 1);
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); },
    drawBack(p) { ps.draw(p, "back"); },
    draw(p) {
      ps.draw(p, "front");
      // spinning stars round the head
      const k = 1 - seg(t, 0.8, 1.3);
      if (k > 0) for (let i = 0; i < 4; i++) {
        const a = t * 9 + (i * TAU) / 4, x = Math.cos(a) * 7, y = -14 - t * 6 + Math.sin(a) * 2.2, front = Math.sin(a) > 0;
        if (front) sparkle(p, x, y, 2, S[1], S[0], 0.4 * k);
        else p.px(x, y, S[0]);
      }
      // the wisp
      const w = seg(t, 0.2, 1.5);
      if (w > 0 && w < 1) {
        const y = -10 - w * 26, x = Math.sin(w * 9) * 2, a = Math.sin(Math.PI * w) * 0.8;
        p.disc(x, y, 2.5, hex("#e8f0ff"), a * 0.6);
        p.px(x, y, WHITE);
        p.glow(x, y, 6, hex("#c8dcff"), 0.3 * a);
      }
    },
  };
}

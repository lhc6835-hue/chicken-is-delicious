import { Particles, Lights, P, Rng, fit, clamp, seg, ease, TAU, WHITE, hex, mix, sparkle } from "../../core/index.js";
import { RAINBOW, jag } from "./_lib.js";

// The legendary tell: the sky splits. A jagged crack runs down the screen from the top, forks, and pries open;
// white-gold light pours through edged with a rainbow fringe, rays fan down across the scene and chips of sky
// fall away, then it seals itself up again.
export const meta = {
  name: "Sky split",
  desc: "A crack tears down the sky, forks and opens: white-gold light with a rainbow fringe, falling rays, sky chips; then it heals.",
  tags: ["chicken", "gacha", "legendary", "screen", "crack", "one-shot"],
  size: [320, 180],
  origin: [0, 0],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#2a1806", "#5a3a0c", "#9a6c14", "#d8a424", "#ffd84a", "#fff1a0", "#ffffff"],
    sky: ["#0a0c1c", "#1a2044", "#34407a"],
    cx: 160,
    depth: 120,
    seed: 8,
  },
};

const RUN = 0.35, OPEN = 0.7, HEAL = 2.2;

export function create(o) {
  const C = fit(o.palette, 7), SK = fit(o.sky, 3), R = new Rng(o.seed);
  const main = jag(R, o.cx + R.range(-10, 10), -2, o.cx + R.range(-16, 16), o.depth, 16, 7);
  const forks = [];
  for (const i of [3, 7, 11]) {
    const [x, y] = main[i], s = R.chance(0.5) ? 1 : -1;
    forks.push({ pts: jag(R, x, y, x + s * R.range(18, 34), y + R.range(10, 22), 5, 3), at: i / main.length });
  }
  const ps = new Particles({ rng: R, sparks: [WHITE, C[5], C[4], C[3]] });
  const lights = new Lights();
  let t = 0, opened = false;
  // how far down the crack has run (0..1) and how wide it is
  const run = () => ease.outQuart(clamp(t / RUN));
  const width = () => (t < RUN ? 0.6 : t < OPEN ? 0.6 + 7.4 * ease.outBack(seg(t, RUN, OPEN)) : t < HEAL ? 8 + Math.sin(t * 9) * 0.5 : 8 * (1 - ease.inQuad(seg(t, HEAL, meta.duration - 0.2))));
  const along = (pts, u) => {
    const f = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
  };
  const drawCrack = (p, pts, u, w, hue) => {
    if (u <= 0 || w <= 0.1) return;
    const n = pts.length - 1, upto = u * n;
    for (let i = 0; i < n && i < upto; i++) {
      const k = Math.min(1, upto - i), [x0, y0] = pts[i], x1 = x0 + (pts[i + 1][0] - x0) * k, y1 = y0 + (pts[i + 1][1] - y0) * k;
      const taper = 1 - Math.pow(i / n, 1.5) * 0.8;
      const ww = w * taper;
      // the rainbow fringe, then gold, then a white core
      // dark broken lips, a rainbow fringe, gold, and the white light inside the gap
      if (ww > 1.2) {
        p.beam(x0, y0, x1, y1, ww + 5, SK[0]);
        p.beam(x0, y0, x1, y1, ww + 3.5, RAINBOW[(i + hue) % RAINBOW.length]);
      }
      p.beam(x0, y0, x1, y1, ww + 1.5, C[4]);
      p.beam(x0, y0, x1, y1, ww, C[5]);
      p.beam(x0, y0, x1, y1, Math.max(0.6, ww - 2), WHITE);
      p.glowLine(x0, y0, x1, y1, 6 + ww * 2, C[4], 0.3);
    }
  };
  return {
    update(dt) {
      t += dt;
      if (!opened && t > RUN) {
        opened = true;
        lights.add(o.cx, o.depth * 0.4, 160, C[5], 0.45, 0.7);
        for (let i = 0; i < 40; i++) {
          const [x, y] = along(main, R.range(0, 1)), s = R.chance(0.5) ? 1 : -1;
          ps.spawn(P.SPARK, x, y, s * R.range(40, 180), R.range(-60, 40), R.range(0.4, 0.9));
        }
      }
      if (t > RUN && t < HEAL) {
        // chips of sky break off the lips and fall, light motes drift out of the gap
        if (R.chance(dt * 30)) {
          const [x, y] = along(main, R.range(0, run())), s = R.chance(0.5) ? 1 : -1;
          ps.spawn(P.GRIT, x + s * 4, y, s * R.range(10, 40), R.range(-20, 10), R.range(0.8, 1.4), SK[R.int(1, 2)], 1);
        }
        if (R.chance(dt * 50)) {
          const [x, y] = along(main, R.range(0, 1));
          ps.spawn(P.STAR, x + R.range(-6, 6), y, R.range(-25, 25), R.range(5, 40), R.range(0.5, 1.1), R.chance(0.5) ? WHITE : RAINBOW[R.int(0, 6)], R.range(1, 2.4));
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      const u = run(), w = width(), hue = Math.floor(t * 12);
      // rays fanning down from the gap across the scene
      const rk = t < RUN ? 0 : t < HEAL ? ease.outCubic(seg(t, RUN, OPEN)) : 1 - seg(t, HEAL, meta.duration - 0.3);
      if (rk > 0)
        for (let i = 0; i < 9; i++) {
          const [x, y] = along(main, 0.15 + i * 0.09), a = Math.PI / 2 + (i - 4) * 0.22 + Math.sin(t * 1.3 + i) * 0.04, L = 160;
          const x1 = x + Math.cos(a) * L, y1 = y + Math.sin(a) * L;
          p.glowLine(x, y, x1, y1, 10, i % 2 ? C[5] : C[4], 0.14 * rk);
          for (let d = 0; d < L; d += 3) p.dot(x + Math.cos(a) * d, y + Math.sin(a) * d, C[5], rk * 0.5 * (1 - d / L));
        }
      drawCrack(p, main, u, w, hue);
      for (const f of forks) drawCrack(p, f.pts, clamp((u - f.at) / (1 - f.at)) * (t > RUN ? 1 : 0.6), w * 0.45, hue + 3);
      // the head of the crack while it runs
      if (t < RUN + 0.05) {
        const [x, y] = along(main, u);
        sparkle(p, x, y, 6, C[5], C[4], 0.9);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

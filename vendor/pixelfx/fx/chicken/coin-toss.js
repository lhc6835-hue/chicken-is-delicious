import { Particles, Lights, P, Rng, fit, sparkle, clamp, seg, ease, TAU, WHITE, hex, mix, band } from "../../core/index.js";

// A coin flipped from below the screen tumbles up in a high arc, glinting each time its face turns to us,
// and drops into the fountain basin: a gold flash, a crown of droplets and two ripples on the water.
export const meta = {
  name: "Coin toss",
  desc: "A gold coin spins up in a high arc trailing glitter and drops into the water: flash, splash crown, ripples.",
  tags: ["chicken", "gacha", "coin", "splash", "one-shot"],
  size: [220, 150],
  origin: [150, 110],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#3a2206", "#6e420a", "#a8700e", "#e0a418", "#ffd24a", "#fff0a0", "#ffffff"],
    water: ["#0e2a4a", "#1c4f7c", "#3a86b8", "#7cc4ec", "#d4f2ff"],
    from: -120,
    seed: 3,
  },
};

const FLY = 0.72; // seconds in the air

export function create(o) {
  const C = fit(o.palette, 7), Wt = fit(o.water, 5), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 6, sparks: [WHITE, Wt[4], Wt[3], Wt[2]] });
  const glitter = new Particles({ rng: R, sparks: [WHITE, C[5], C[4], C[3]] });
  const lights = new Lights();
  const x0 = o.from, y0 = 40, apex = -78;
  // a parabola through (x0, y0), peaking at apex, landing at (0, 0)
  const path = (u) => {
    const cy = 2 * (apex - y0 / 4);
    return [x0 * (1 - u), y0 * (1 - u) * (1 - u) + 2 * cy * u * (1 - u)];
  };
  let t = 0, landed = false;
  return {
    update(dt) {
      t += dt;
      if (t < FLY) {
        const [x, y] = path(t / FLY);
        if (R.chance(dt * 60)) glitter.spawn(P.FLAKE, x + R.range(-2, 2), y + R.range(-2, 2), R.range(-10, 10), R.range(-10, 10), R.range(0.25, 0.5), R.chance(0.5) ? WHITE : C[5], R.range(0.6, 1.2));
      } else if (!landed) {
        landed = true;
        lights.add(0, -4, 28, C[5], 0.6, 0.45);
        lights.add(0, -2, 14, WHITE, 1, 0.18);
        // a crown: droplets thrown up and out, tallest at the middle
        for (let i = 0; i < 40; i++) {
          const a = -Math.PI / 2 + R.range(-0.9, 0.9), sp = R.range(160, 380) * (1 - Math.abs(a + Math.PI / 2) * 0.4);
          ps.spawn(P.SPARK, R.range(-4, 4), -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.45, 0.85));
        }
        for (let i = 0; i < 12; i++) {
          const a = -Math.PI / 2 + R.range(-1.3, 1.3), sp = R.range(40, 120);
          glitter.spawn(P.STAR, 0, -3, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.4, 0.9), R.chance(0.4) ? WHITE : C[5], R.range(1, 2));
        }
        for (let i = 0; i < 6; i++) ps.spawn(P.VAPOUR, R.range(-6, 6), -2, R.range(-20, 20), R.range(-18, -6), R.range(0.5, 0.9), Wt[4], R.range(2, 3.5));
      }
      ps.update(dt);
      glitter.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // ripples lie on the water: the far half behind the splash
      if (t > FLY) for (const [d, sp] of [[0, 46], [0.16, 30]]) {
        const u = t - FLY - d;
        if (u <= 0) continue;
        const k = 1 - clamp(u / 1.0);
        band(p, 0, 0, 3 + ease.outCubic(clamp(u / 1.0)) * sp, 0.28, 1.5, k, Wt, (g) => Math.sin(g) < 0);
      }
      ps.draw(p, "back");
    },
    draw(p) {
      if (t < FLY) {
        const [x, y] = path(t / FLY);
        // the coin: an ellipse that narrows and widens as it flips; its face flashes white when square on
        const flip = Math.cos(t * 22), face = flip > 0;
        for (let k = 1; k <= 5; k++) {
          const [tx, ty] = path(Math.max(0, t - k * 0.018) / FLY);
          p.dot(tx, ty, C[5 - Math.min(3, k >> 1)], 0.9 - k * 0.12);
          p.dot(tx + 1, ty, C[4 - Math.min(3, k >> 1)], 0.6 - k * 0.1);
        }
        const W = Math.max(0.8, Math.abs(flip) * 6);
        p.ellipse(x, y, W + 1, 7, C[1]);
        p.ellipse(x, y, W, 6, face ? C[4] : C[3]);
        if (W > 2) p.ellipse(x, y, W - 2, 4, face ? C[3] : C[2]);
        if (W > 3) p.ellipse(x - 0.5, y - 0.5, W - 3, 2.5, face ? C[5] : C[4]);
        p.line(x - W * 0.6, y - 4, x - W * 0.2, y - 5.5, C[6]);
        if (Math.abs(flip) > 0.9) sparkle(p, x - 2, y - 3, 7, C[5], C[4], 0.7);
        p.glow(x, y, 20, C[4], 0.5);
      }
      ps.draw(p, "front");
      glitter.draw(p);
      if (t > FLY && t < FLY + 0.08) {
        p.circle(0, -2, 6 * (1 - (t - FLY) / 0.08), WHITE);
        p.glow(0, -2, 26, C[5], 0.55);
      }
      if (t > FLY) {
        const u = t - FLY;
        // ripples, near half
        for (const [d, sp] of [[0, 46], [0.16, 30]]) {
          const v = u - d;
          if (v > 0) band(p, 0, 0, 3 + ease.outCubic(clamp(v / 1.0)) * sp, 0.28, 1.5, 1 - clamp(v / 1.0), Wt, (g) => Math.sin(g) >= 0, v < 0.15);
        }
        // a column of water jumps up where it went in and falls back into itself
        const h = 30 * Math.sin(Math.PI * clamp(u / 0.42)) * (1 - clamp(u / 0.42) * 0.3);
        if (u < 0.42 && h > 1) {
          for (let y = 0; y > -h; y -= 1) {
            const v = -y / h, w = 2.2 * (1 - v * 0.6);
            p.line(-w, y, w, y, v > 0.8 ? Wt[4] : Wt[3], 0.95);
            p.dot(-w, y, Wt[2], 0.9);
            p.dot(w * 0.3, y, WHITE, v < 0.7 ? 0.9 : 0.5);
          }
          p.circle(0, -h, 2.6, Wt[4]);
          p.px(0, -h - 1, WHITE);
          p.glowLine(0, 0, 0, -h, 6, Wt[3], 0.35);
        }
        // the gold settles as a glow under the water
        p.glow(0, 2, 22, C[3], 0.5 * (1 - seg(u, 0.2, 1.1)));
      }
      lights.draw(p);
    },
  };
}

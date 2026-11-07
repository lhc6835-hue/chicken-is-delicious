import { Particles, Lights, P, Rng, fit, sparkle, clamp, seg, smooth, ease, TAU, WHITE, band, noise2 } from "../../core/index.js";

// The fountain answers: the water draws in and brightens, then a column of liquid gold bursts up out of
// the basin, streaming upward in bright bands, throwing a crown of drops off its top, before it falls back
// into itself in a rain of glitter.
export const meta = {
  name: "Golden gush",
  desc: "The basin gathers light, then a streaming column of gold erupts, crowns with spray and collapses into a glitter rain.",
  tags: ["chicken", "gacha", "fountain", "water", "gold", "one-shot"],
  size: [200, 200],
  origin: [100, 176],
  duration: 3.2,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#2a1806", "#5a3a0c", "#9a6c14", "#d8a424", "#ffd84a", "#fff1a0", "#ffffff"],
    height: 120,
    seed: 5,
  },
};

const GO = 0.45, HOLD = 1.55, FALL = 2.15;

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), H = o.height;
  const ps = new Particles({ rng: R, ground: () => 4, sparks: [WHITE, C[5], C[4], C[3]] });
  const glit = new Particles({ rng: R, sparks: [WHITE, C[5], C[4], C[3]] });
  const lights = new Lights();
  let t = 0, burst = false;
  const height = (tt) => (tt < GO ? 0 : tt < HOLD ? H * ease.outBack(clamp((tt - GO) / 0.3)) : H * (1 - ease.inCubic(clamp((tt - HOLD) / (FALL - HOLD)))));
  return {
    update(dt) {
      t += dt;
      if (t < GO) {
        // light gathers into the basin
        if (R.chance(dt * 70)) {
          const a = R.range(Math.PI * 1.05, Math.PI * 1.95), d = R.range(40, 70);
          glit.spawn(P.STREAK, Math.cos(a) * d, Math.sin(a) * d * 0.5, -Math.cos(a) * 60, -Math.sin(a) * 30, R.range(0.25, 0.4), R.chance(0.5) ? C[5] : C[4]);
        }
      } else if (!burst) {
        burst = true;
        lights.add(0, -30, 90, C[5], 0.8, 0.7);
        lights.add(0, -6, 30, WHITE, 1, 0.2);
        for (let i = 0; i < 30; i++) {
          const a = -Math.PI / 2 + R.range(-1.2, 1.2), sp = R.range(120, 300);
          ps.spawn(P.SPARK, R.range(-6, 6), -2, Math.cos(a) * sp, Math.sin(a) * sp * 0.8, R.range(0.4, 0.8));
        }
        for (let i = 0; i < 16; i++) glit.spawn(P.FLAKE, R.range(-14, 14), -2, R.range(-60, 60), R.range(-50, -10), R.range(0.6, 1.1), R.chance(0.5) ? WHITE : C[5], R.range(0.8, 1.6));
      }
      const h = height(t);
      if (t > GO && t < FALL && h > 10) {
        // the crown: drops peel off the top and arc down outside the column
        if (R.chance(dt * 90)) {
          const s = R.chance(0.5) ? 1 : -1, sp = R.range(40, 110);
          ps.spawn(P.SPARK, s * R.range(2, 6), -h + R.range(0, 6), s * sp, R.range(-90, -20), R.range(0.6, 1.1));
        }
        if (R.chance(dt * 40)) glit.spawn(P.STAR, R.range(-30, 30), -R.range(10, h), R.range(-8, 8), R.range(-25, -5), R.range(0.4, 0.9), R.chance(0.5) ? WHITE : C[5], R.range(1, 2.2));
        
      }
      if (t > HOLD && t < FALL + 0.4 && R.chance(dt * 80)) {
        // collapse: glitter rains down
        glit.spawn(P.FLAKE, R.range(-34, 34), -R.range(20, H), R.range(-10, 10), R.range(10, 40), R.range(0.6, 1.2), R.chance(0.4) ? WHITE : C[R.int(4, 5)], R.range(0.6, 1.4));
      }
      ps.update(dt);
      glit.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // the basin glows from within; the far half of the rings goes behind the column
      const g = t < GO ? seg(t, 0, GO) : 1 - seg(t, FALL, meta.duration);
      p.glow(0, -2, 40, C[4], 0.35 * g);
      for (const d of [0, 0.22, 0.44]) {
        const u = t - GO - d;
        if (u > 0 && u < 1.2) band(p, 0, 0, 6 + ease.outCubic(u / 1.2) * 60, 0.24, 1.5, 1 - u / 1.2, C.slice(1), (a) => Math.sin(a) < 0);
      }
      ps.draw(p, "back");
    },
    draw(p) {
      // gathering: the water surface trembles and brightens
      if (t < GO) {
        const k = seg(t, 0, GO);
        for (let i = 0; i < 3; i++) band(p, 0, 0, 30 - k * 24 + i * 5, 0.24, 1, 0.3 + k * 0.6, C.slice(2), () => true);
        p.glow(0, -3, 18 + k * 10, C[5], 0.3 + k * 0.5);
      }
      const h = height(t);
      if (h > 1) {
        const tt = t - GO, top = -h;
        const wid = (y) => {
          const v = -y / h; // 0 base, 1 top
          return 6.5 + 5 * Math.pow(1 - v, 6) + Math.sin(y * 0.35 + t * 18) * 0.7 + (v > 0.9 ? -(v - 0.9) * 20 : 0);
        };
        p.shade(-18, top - 2, 18, 2, (x, y, out) => {
          if (y > 0) return;
          const w = wid(y);
          if (w <= 0.2) return;
          const q = Math.abs(x) / w;
          if (q > 1) return;
          // bright bands race upward through the stream
          const n = noise2(x * 0.45, y * 0.12 + tt * 9, 3);
          let i = q < 0.25 ? 6 : q < 0.55 ? 5 : q < 0.8 ? 4 : q < 0.93 ? 3 : 2;
          if (n > 0.68 && q < 0.85) i = Math.min(6, i + 1);
          else if (n < 0.25 && q > 0.3) i = Math.max(2, i - 1);
          if (x > w * 0.45) i = Math.max(2, i - 1); // shaded right side
          out.c = C[i];
        });
        // a white hero frame on the release
        if (tt < 0.07) p.rect(-8, top, 16, h, WHITE);
        // the crown: a bulb of spray at the top
        p.circle(0, top + 2, 7, C[5]);
        p.circle(-1, top + 1, 4, WHITE);
        p.glowLine(0, 0, 0, top, 16, C[4], 0.35);
        p.glow(0, top, 26, C[5], 0.5);
        if (tt < 0.5) sparkle(p, 0, top, 10 * (1 - tt / 0.5) + 3, C[5], C[4], 0.8);
      }
      ps.draw(p, "front");
      glit.draw(p);
      for (const d of [0, 0.22, 0.44]) {
        const u = t - GO - d;
        if (u > 0 && u < 1.2) band(p, 0, 0, 6 + ease.outCubic(u / 1.2) * 60, 0.24, 1.5, 1 - u / 1.2, C.slice(1), (a) => Math.sin(a) >= 0, u < 0.1);
      }
      lights.draw(p);
    },
  };
}

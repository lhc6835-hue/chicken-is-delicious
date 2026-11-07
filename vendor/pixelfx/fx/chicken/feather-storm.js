import { Particles, Lights, P, Rng, fit, clamp, seg, ease, TAU, WHITE, hex, mix, sparkle } from "../../core/index.js";
import { Plumes, feather, RAINBOW } from "./_lib.js";

// Feathers whirl in from the edges into a tightening vortex round the egg, faster and faster, then the storm
// blows apart: they scatter across the screen, rock and sink, glinting in gold, white and rainbow.
export const meta = {
  name: "Feather storm",
  desc: "Feathers spiral into a tightening golden vortex, then blow apart across the screen and rock down, glinting.",
  tags: ["chicken", "gacha", "legendary", "feather", "vortex", "screen", "one-shot"],
  size: [320, 180],
  origin: [160, 90],
  duration: 3.6,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#2a1806", "#5a3a0c", "#9a6c14", "#d8a424", "#ffd84a", "#fff1a0", "#ffffff"],
    count: 48,
    seed: 9,
  },
};

const BLOW = 1.3;

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed);
  const swirl = [];
  for (let i = 0; i < o.count; i++) {
    const kind = R.int(0, 9);
    const col = kind < 5 ? [C[3], C[5]] : kind < 8 ? [hex("#c8c4d8"), WHITE] : [mix(RAINBOW[i % 7], C[1], 0.3), RAINBOW[i % 7]];
    swirl.push({ a: R.range(0, TAU), r0: R.range(110, 190), r1: R.range(10, 24), w: R.range(3, 5.5), len: R.range(5, 9), delay: R.range(0, 0.35), c0: col[0], c1: col[1] });
  }
  const plumes = new Plumes(R), ps = new Particles({ rng: R, sparks: [WHITE, C[5], C[4], C[3]] }), lights = new Lights();
  let t = 0, blown = false;
  const pos = (f, tt) => {
    const u = ease.inCubic(clamp((tt - f.delay) / (BLOW - f.delay)));
    const r = f.r0 + (f.r1 - f.r0) * u, a = f.a + f.w * (tt - f.delay) * (0.6 + u * 2.4);
    return [Math.cos(a) * r, Math.sin(a) * r * 0.55, a, r];
  };
  return {
    update(dt) {
      t += dt;
      if (t < BLOW && R.chance(dt * 40)) {
        const a = R.range(0, TAU), d = R.range(20, 60);
        ps.spawn(P.STREAK, Math.cos(a) * d, Math.sin(a) * d * 0.55, -Math.cos(a) * 50, -Math.sin(a) * 28, R.range(0.2, 0.35), R.chance(0.5) ? WHITE : C[5]);
      }
      if (!blown && t >= BLOW) {
        blown = true;
        lights.add(0, 0, 160, C[5], 0.8, 0.7);
        for (const f of swirl) {
          const [x, y, a] = pos(f, BLOW), sp = R.range(220, 420), out = Math.atan2(y, x) + R.range(-0.4, 0.4);
          plumes.add({ x, y, vx: Math.cos(out) * sp - Math.sin(a) * 80, vy: Math.sin(out) * sp * 0.7 - 30, len: f.len, life: R.range(1.6, 2.2), c0: f.c0, c1: f.c1, glow: 0.2 });
        }
        for (let i = 0; i < 30; i++) {
          const a = R.range(0, TAU), sp = R.range(150, 380);
          ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp * 0.7, R.range(0.3, 0.7));
        }
        for (let i = 0; i < 24; i++) ps.spawn(P.STAR, R.range(-150, 150), R.range(-80, 80), 0, R.range(4, 14), R.range(0.5, 1.2), R.chance(0.5) ? WHITE : RAINBOW[R.int(0, 6)], R.range(1.2, 2.8), R.range(0, 1.6));
      }
      plumes.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      if (t < BLOW) {
        const k = seg(t, 0, BLOW);
        for (const f of swirl) {
          if (t < f.delay) continue;
          const [x, y, a] = pos(f, t), al = clamp((t - f.delay) * 5);
          // a ghost one step back, then the feather along its path
          const [gx, gy] = pos(f, t - 0.03);
          feather(p, gx, gy, a + Math.PI / 2, f.len, f.c0, f.c0, al * 0.4);
          feather(p, x, y, a + Math.PI / 2 + Math.sin(t * 8 + f.a) * 0.4, f.len, f.c0, f.c1, al);
        }
        p.glow(0, 0, 20 + k * 30, C[5], 0.2 + k * 0.6);
      } else if (t < BLOW + 0.07) {
        p.circle(0, 0, 18, WHITE);
        p.glow(0, 0, 80, C[5], 1);
      }
      ps.draw(p, "front");
      plumes.draw(p);
      lights.draw(p);
    },
  };
}

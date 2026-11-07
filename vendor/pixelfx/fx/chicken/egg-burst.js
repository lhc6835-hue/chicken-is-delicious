import { Particles, Lights, P, Rng, fit, sparkle, clamp, seg, ease, TAU, WHITE, hex, band } from "../../core/index.js";
import { Plumes } from "./_lib.js";

// The egg gives way: a white flash swallows it, a shock ring and a fan of rays burst out in the rarity
// color, shell shards fly and bounce on the floor, feathers puff out and rock down, stars twinkle on.
export const meta = {
  name: "Egg burst",
  desc: "An egg bursts open: white flash, shock ring, turning fan of rays, bouncing shell shards, feathers rocking down, twinkles.",
  tags: ["chicken", "gacha", "egg", "hatch", "burst", "one-shot"],
  size: [220, 170],
  origin: [110, 104],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#2a1806", "#5a3a0c", "#9a6c14", "#d8a424", "#ffd84a", "#fff1a0", "#ffffff"],
    shell: ["#7a6248", "#c8b090", "#f4ead8"],
    floor: 18,
    rays: 12,
    seed: 11,
  },
};

export function create(o) {
  const C = fit(o.palette, 7), S = fit(o.shell, 3), R = new Rng(o.seed), F = o.floor;
  const ps = new Particles({ rng: R, ground: () => F, sparks: [WHITE, C[5], C[4], C[3]] });
  const plumes = new Plumes(R), lights = new Lights();
  const shards = [];
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + R.range(-1.6, 1.6), sp = R.range(90, 220);
    shards.push({ x: R.range(-4, 4), y: R.range(-6, 4), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, a: R.range(0, TAU), va: R.range(-18, 18), s: R.range(1.5, 3), life: R.range(1.4, 2.2), rest: false });
  }
  for (let i = 0; i < 18; i++) {
    const a = R.range(0, TAU), sp = R.range(80, 200);
    const white = R.chance(0.35);
    plumes.add({ x: 0, y: -2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.8 - 40, len: R.range(5, 8), life: R.range(1.8, 2.6), c0: white ? hex("#c8c4d8") : C[3], c1: white ? WHITE : C[5], glow: 0.25, delay: R.range(0, 0.05) });
  }
  for (let i = 0; i < 34; i++) {
    const a = R.range(0, TAU), sp = R.range(120, 330);
    ps.spawn(P.SPARK, 0, -2, Math.cos(a) * sp, Math.sin(a) * sp - 40, R.range(0.3, 0.75));
  }
  for (let i = 0; i < 16; i++) ps.spawn(P.STAR, R.range(-60, 60), R.range(-60, 10), 0, R.range(-8, 0), R.range(0.5, 1.1), R.chance(0.5) ? WHITE : C[5], R.range(1.2, 2.6), R.range(0.15, 1.4));
  lights.add(0, -2, 100, C[5], 0.9, 1.0);
  lights.add(0, -2, 34, WHITE, 1, 0.25);
  let t = 0;
  return {
    update(dt) {
      t += dt;
      for (const s of shards) {
        if (s.rest) { s.life -= dt; continue; }
        s.life -= dt;
        s.vy += 700 * dt;
        s.vx *= Math.exp(-1.2 * dt);
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.a += s.va * dt;
        if (s.y > F && s.vy > 0) {
          s.y = F;
          if (s.vy > 120) { s.vy *= -0.38; s.vx *= 0.6; s.va *= 0.5; }
          else { s.rest = true; s.vy = 0; }
        }
      }
      ps.update(dt);
      plumes.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // the fan of rays, behind everything, turning slowly while it fades
      const fade = 1 - seg(t, 0.3, 1.6);
      if (fade > 0) {
        for (let i = 0; i < o.rays; i++) {
          const a = (i / o.rays) * TAU + t * 0.5, L = 50 + 40 * ease.outCubic(clamp(t / 0.35)), ca = Math.cos(a), sa = Math.sin(a);
          for (let d = 8; d < L; d += 0.5) {
            const u = d / L;
            p.dot(ca * d, sa * d - 2, u < 0.35 ? C[5] : C[4], fade * (1 - u) * 0.9);
            if (u < 0.5) p.dot(ca * d - sa, sa * d + ca - 2, C[3], fade * (0.6 - u));
          }
          p.glowLine(0, -2, ca * L, sa * L - 2, 6, C[4], 0.12 * fade);
        }
      }
      const g = seg(t, 0, 0.12) * (1 - seg(t, 0.4, 2.4));
      band(p, 0, F, 16 + 30 * ease.outCubic(seg(t, 0, 0.8)), 0.25, 1.5, g * 0.8, C.slice(1), (a) => Math.sin(a) < 0);
    },
    draw(p) {
      if (t < 0.08) {
        p.circle(0, -2, 15 * (1 - t / 0.12), WHITE);
        p.glow(0, -2, 40, C[5], 0.8);
      }
      // the shock ring
      if (t < 0.45) {
        const u = t / 0.45, r = 6 + ease.outQuart(u) * 64;
        p.ring(0, -2, r, Math.max(1, 3 * (1 - u)), u < 0.25 ? WHITE : C[5], 1 - u);
        p.glowRing(0, -2, r, 4, C[4], 0.4 * (1 - u));
      }
      const g = seg(t, 0, 0.12) * (1 - seg(t, 0.4, 2.4));
      band(p, 0, F, 16 + 30 * ease.outCubic(seg(t, 0, 0.8)), 0.25, 1.5, g * 0.8, C.slice(1), (a) => Math.sin(a) >= 0);
      for (const s of shards) {
        if (s.life <= 0) continue;
        const al = clamp(s.life / 0.5), ca = Math.cos(s.a), sa = Math.sin(s.a);
        for (let d = -s.s / 2; d <= s.s / 2; d += 0.5) p.dot(s.x + ca * d, s.y + sa * d, d < 0 ? S[2] : S[1], al);
        p.dot(s.x - sa, s.y + ca, S[0], al);
      }
      ps.draw(p, "front");
      plumes.draw(p);
      if (t < 0.6) sparkle(p, 0, -2, 16 * (1 - t / 0.6) + 2, C[5], C[4], 0.8);
      lights.draw(p);
    },
  };
}

// Shared bits for the chicken game's effects: rarity ramps and a little feather that tumbles as it sinks.
import { hex, clamp, TAU, GRAVITY } from "../../core/index.js";

// rarity ramps, dark to bright (7 steps): common, rare, epic(SR), heroic, legendary
export const RARITY = {
  common: ["#2b2f3a", "#4a5262", "#6f7a8c", "#98a4b6", "#c4ccd8", "#e8edf4", "#ffffff"],
  rare: ["#0c1a3a", "#13306a", "#1d52a4", "#2f80d8", "#5ab0f4", "#a4dcff", "#ffffff"],
  epic: ["#1c0a30", "#3a1462", "#5e22a0", "#8c3ad8", "#b56cf4", "#e0b4ff", "#ffffff"],
  hero: ["#2e0a0a", "#5e1414", "#a0261c", "#e04a24", "#ff8a3a", "#ffc88a", "#ffffff"],
  legend: ["#2a1806", "#5a3a0c", "#9a6c14", "#d8a424", "#ffd84a", "#fff1a0", "#ffffff"],
};
export const RAINBOW = ["#ff4a6a", "#ff9a3a", "#ffe04a", "#6ae05a", "#4ac8ff", "#7a7aff", "#d65aff"].map(hex);

/**
 * A feather: a 1 px quill with vanes either side that taper to the tip. (x, y) is its middle, a its angle,
 * len px long, c0 shadow side, c1 lit side, tip color for the end. a01 is alpha.
 */
export function feather(p, x, y, a, len, c0, c1, a01 = 1) {
  const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
  for (let d = -len / 2; d <= len / 2; d += 0.5) {
    const u = (d + len / 2) / len; // 0 at the quill end, 1 at the tip
    const w = u < 0.15 ? 0 : Math.sin(Math.PI * Math.min(1, (u - 0.1) / 0.95)) * (len * 0.16 + 0.4);
    const qx = x + ca * d, qy = y + sa * d;
    p.dot(qx, qy, u < 0.12 ? c0 : c1, a01);
    for (let s = 0.5; s <= w; s += 0.5) {
      p.dot(qx + nx * s, qy + ny * s, c1, a01);
      p.dot(qx - nx * s, qy - ny * s, s > w - 0.6 ? c0 : c1, a01 * 0.95);
    }
  }
}

/**
 * Loose feathers: thrown out fast, braked by drag, then rocking side to side as they sink, a pendulum that
 * tilts the feather the way it swings. add({x, y, vx, vy, len, life, c0, c1, delay, sink, amp, spin}).
 */
export class Plumes {
  constructor(R) {
    this.R = R;
    this.list = [];
  }
  add(f) {
    const R = this.R;
    this.list.push({ a: R.range(0, TAU), spin: R.range(-9, 9), sink: R.range(14, 26), amp: R.range(5, 10), freq: R.range(2.2, 3.4), ph: R.range(0, TAU), delay: 0, age: 0, ...f, max: f.life });
  }
  update(dt) {
    for (const f of this.list) {
      if (f.delay > 0) { f.delay -= dt; continue; }
      f.age += dt;
      f.life -= dt;
      const brake = Math.exp(-4.2 * dt);
      f.vx *= brake;
      f.vy = f.vy * brake + (f.sink - f.vy) * (1 - brake) * 0.6;
      const sw = Math.cos(f.age * f.freq + f.ph) * f.amp;
      f.x += (f.vx + sw * (f.age > 0.25 ? 1 : f.age * 4)) * dt;
      f.y += f.vy * dt;
      f.spin *= Math.exp(-1.6 * dt);
      f.a += f.spin * dt;
      f.tilt = Math.sin(f.age * f.freq + f.ph) * 0.7;
    }
    this.list = this.list.filter((f) => f.life > 0);
  }
  draw(p) {
    for (const f of this.list) {
      if (f.delay > 0) continue;
      const k = f.life / f.max, a01 = clamp(k * 3) * clamp(f.age * 12);
      feather(p, f.x, f.y, f.a + (f.tilt ?? 0), f.len, f.c0, f.c1, a01);
      if (f.glow) p.glow(f.x, f.y, 5, f.c1, f.glow * k);
    }
  }
}

/** n points along a jagged crack from (x0, y0) to (x1, y1). */
export function jag(R, x0, y0, x1, y1, n, amp) {
  const pts = [[x0, y0]];
  for (let i = 1; i < n; i++) {
    const u = i / n;
    pts.push([x0 + (x1 - x0) * u + R.range(-amp, amp), y0 + (y1 - y0) * u + R.range(-amp * 0.3, amp * 0.3)]);
  }
  pts.push([x1, y1]);
  return pts;
}

export { GRAVITY };

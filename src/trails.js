// Trails, reworked: a ribbon that follows the path the chicken actually ran (so it curves with every
// jump and glide), drawn column by column in pixels with a soft fade and a flowing wave, plus a few
// smooth particles riding on it. Shared by the game and the shop preview.
//
// yAt(d) gives the ribbon's centre y at d pixels behind the chicken; x0 is where the ribbon starts.

const RAINBOW = ["#ff4a5a", "#ff9a2a", "#ffe03c", "#5ad84a", "#3cc8ff", "#8a6cff"];
const hash = (n) => { n = (n << 13) ^ n; return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff; };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const TRAIL_FX = {
  none: {},
  dust: {
    rate: 16,
    // soft round puffs kicked up at the feet
    emit(emit, x, y, k, st) {
      if (st && !st.ground) return;
      emit({ x: x - 6 * k, y: y - 2 * k, vx: rnd(-40, -10) * k, vy: rnd(-30, -10) * k, g: -10 * k, drag: 2.5, size: rnd(3, 5) * k, grow: 5 * k, life: rnd(0.45, 0.7), t: 0, color: pick(["#d2b48e", "#c0a07a", "#e6d2b0"]), kind: "puff" });
    },
  },
  hearts: {
    len: 52, stripes: ["#ffd0e0", "#ff9ac0", "#ff6aa0"], alpha: 0.75, wave: 2.2, rate: 5,
    emit(emit, x, y, k) {
      emit({ x: x - rnd(4, 14) * k, y: y + rnd(-4, 4) * k, vx: rnd(-20, -5) * k, vy: rnd(-34, -18) * k, g: 0, drag: 0.6, size: 1, life: rnd(0.9, 1.3), t: 0, sway: 5 * k, ph: Math.random() * 6, color: pick(["#ff4a8a", "#ff86c0", "#ff6aa0"]), kind: "heart", front: true });
    },
  },
  stars: {
    len: 70, stripes: ["#8ad8ff", "#ffffff", "#8ad8ff"], alpha: 0.85, wave: 0.8, taper: true, rate: 12,
    emit(emit, x, y, k, st) {
      const d = rnd(4, 60) * k;
      emit({ x: x - d, y: (st && st.yAt ? st.yAt(d) : y) + rnd(-5, 5) * k, vx: 0, vy: rnd(-6, 6) * k, g: 0, drag: 0, size: 2, life: rnd(0.35, 0.6), t: 0, ph: Math.random() * 6, color: pick(["#fff3a6", "#ffffff", "#a0e8ff"]), kind: "twinkle", front: true });
    },
  },
  notes: {
    len: 78, staff: "#8a6cff", alpha: 0.8, wave: 3.5, rate: 3.5,
    emit(emit, x, y, k, st) {
      const d = rnd(8, 30) * k;
      emit({ x: x - d, y: (st && st.yAt ? st.yAt(d) : y) - 2 * k, vx: rnd(-12, -4) * k, vy: rnd(-26, -14) * k, g: 0, drag: 0.5, size: 1, life: rnd(1, 1.4), t: 0, sway: 3 * k, ph: Math.random() * 6, color: pick(["#7ad8ff", "#ff86e6", "#fff07a", "#b8a0ff"]), kind: "note", front: true });
    },
  },
  fire: {
    len: 66, stripes: ["#e0501a", "#ff8a2a", "#ffc23d", "#fff3a6", "#ffc23d", "#ff8a2a", "#e0501a"], alpha: 0.95, wave: 1.2, flame: true, rate: 30,
    emit(emit, x, y, k, st) {
      const d = rnd(0, 34) * k;
      emit({ x: x - d, y: (st && st.yAt ? st.yAt(d) : y) + rnd(-5, 5) * k, vx: rnd(-10, 10) * k, vy: rnd(-70, -30) * k, g: -40 * k, drag: 2, size: pick([2, 3, 3]), life: rnd(0.3, 0.55), t: 0, color: pick(["#fff3a6", "#ffc23d", "#ff8a2a", "#e0501a"]), kind: "ember", front: true });
    },
  },
  rainbow: {
    len: 96, stripes: RAINBOW, alpha: 1, wave: 1.6, rate: 8, sparkleTail: true,
    emit(emit, x, y, k, st) {
      const d = rnd(30, 92) * k;
      emit({ x: x - d, y: (st && st.yAt ? st.yAt(d) : y) + rnd(-8, 8) * k, vx: 0, vy: 0, g: 0, drag: 0, size: 2, life: rnd(0.3, 0.55), t: 0, ph: Math.random() * 6, color: "#ffffff", kind: "twinkle", front: true });
    },
  },
};

export function trailFx(id) { return TRAIL_FX[id] || TRAIL_FX.none; }

/**
 * Draws a trail ribbon. k scales it (1 in the game, 1.5 in the preview). fadeIn (0..1) grows it in
 * after a respawn or a trail change.
 */
export function drawRibbon(ctx, id, x0, yAt, time, k = 1, fadeIn = 1) {
  const f = trailFx(id);
  if (!f.len) return;
  const L = Math.round(f.len * k * fadeIn), step = Math.max(1, Math.round(k));
  ctx.save();
  for (let d = 0; d < L; d += step) {
    const u = d / L;                                   // 0 at the chicken, 1 at the tail
    const a = f.alpha * Math.pow(1 - u, 1.2) * Math.min(1, d / (4 * k) + 0.35);
    if (a <= 0.02) continue;
    const wave = Math.sin(d * 0.11 / k - time * 9) * f.wave * k * Math.min(1, u * 2.5);
    const cy = yAt(d) + wave;
    const x = Math.round(x0 - d);
    ctx.globalAlpha = a;
    if (f.staff) {
      // two thin staff lines that drift apart a little towards the tail
      const gap = Math.round((3 + u * 2) * k);
      ctx.fillStyle = f.staff;
      ctx.fillRect(x, Math.round(cy - gap), step, Math.max(1, Math.round(k)));
      ctx.fillRect(x, Math.round(cy + gap), step, Math.max(1, Math.round(k)));
      continue;
    }
    const n = f.stripes.length;
    let th = Math.max(1, Math.round(2 * k));
    let shown = n;
    if (f.taper) { th = Math.max(1, Math.round((2.4 - u * 1.6) * k)); }
    if (f.flame) {
      // a flame tongue: thick at the chicken, licking thinner with a flicker towards the tail
      shown = Math.max(2, Math.round(n * (1 - u * 0.8)));
      th = Math.max(1, Math.round((2.2 - u * 1.4) * k + (hash(Math.floor(d / step) * 7 + Math.floor(time * 18)) > 0.6 ? 1 : 0)));
    }
    const total = shown * th, top = Math.round(cy - total / 2);
    const first = Math.floor((n - shown) / 2);
    for (let i = 0; i < shown; i++) {
      ctx.fillStyle = f.stripes[first + i];
      ctx.fillRect(x, top + i * th, step, th);
    }
    if (f.sparkleTail && d > L - 8 * k && hash(Math.floor(time * 20) + d) > 0.7) {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x, Math.round(top + hash(d) * total), step, step);
    }
  }
  ctx.restore();
}

// Each skin's signature look: particles while running, a jump and a landing flourish, an overlay on
// the body (a glow, a gloss sweep, glowing eyes, a float) and its own way of going down. All of it
// is cosmetic: nothing here touches physics, hitboxes, speed or scoring.
//
// Emitters get emit(particle) plus the chicken's feet position (x, y) in the caller's pixels and a
// scale k (1 in the game, 1.5 in the bigger shop preview).

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const P = (o) => ({ g: 0, drag: 0, size: 2, life: 0.5, t: 0, vx: 0, vy: 0, ...o });

const RAINBOW = ["#ff4a4a", "#ffa03a", "#ffe03c", "#5ad84a", "#3cc8ff", "#7a6cff"];

export const SKIN_FX = {
  basic: {
    desc: "점프할 때 깃털이 폴폴",
    jump(emit, x, y, k) { for (let i = 0; i < 4; i++) emit(P({ x: x + rnd(-6, 6) * k, y: y - 10 * k, vx: rnd(-50, 30) * k, vy: rnd(-70, -20) * k, g: 50 * k, drag: 2.5, life: rnd(0.6, 1), color: pick(["#e4c0a3", "#95655a", "#f5ddca"]), kind: "feather", ph: Math.random() * 6 })); },
  },
  white: {
    desc: "달릴 때 하얀 솜털이 날려요",
    rate: 12,
    run(emit, x, y, k) { emit(P({ x: x + rnd(-8, 4) * k, y: y - rnd(6, 22) * k, vx: rnd(-40, -10) * k, vy: rnd(-25, -5) * k, drag: 1.5, size: 2, life: rnd(0.8, 1.3), color: pick(["#ffffff", "#f4f1ea", "#e8e4dc"]), kind: "fluff", front: true })); },
    land(emit, x, y, k, vy) { if (vy < 250) return; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI; emit(P({ x, y: y - 2, vx: Math.cos(a) * 80 * k, vy: -Math.sin(a) * 50 * k, drag: 4, size: 2, life: 0.5, color: "#ffffff", kind: "fluff", front: true })); } },
  },
  silkie: {
    desc: "어둠 속에서 눈이 빛나요",
    rate: 14, eye: "#ffd84a",
    run(emit, x, y, k) {
      emit(P({ x: x + 5 * k, y: y - 25 * k, vx: -70 * k, size: 2, life: 0.3, color: "#ffe066", kind: "glow", front: true }));
      if (Math.random() < 0.4) emit(P({ x: x + rnd(-10, 0) * k, y: y - rnd(4, 18) * k, vx: rnd(-40, -10) * k, vy: rnd(-20, 0) * k, drag: 2, size: 4, life: rnd(0.5, 0.8), color: pick(["#3a2a4a", "#4c3a60", "#2a2036"]), kind: "smoke" }));
    },
    death(emit, x, y, k) { for (let i = 0; i < 14; i++) emit(P({ x, y: y - 16 * k, vx: rnd(-140, 140) * k, vy: rnd(-160, 40) * k, drag: 2, size: 3, life: rnd(0.6, 1), color: pick(["#3a2a4a", "#4c3a60", "#ffd84a"]), kind: "smoke" })); },
  },
  berry: {
    desc: "점프하면 하트가 뿅뿅",
    rate: 4,
    run(emit, x, y, k) { emit(P({ x: x + rnd(-10, 4) * k, y: y - rnd(10, 24) * k, vx: -20 * k, vy: -30 * k, life: 0.9, color: pick(["#ff9ac0", "#ffc8d8"]), kind: "bubble", size: 3, front: true })); },
    jump(emit, x, y, k) { for (let i = 0; i < 3; i++) emit(P({ x: x + rnd(-8, 8) * k, y: y - 20 * k, vx: rnd(-40, 40) * k, vy: rnd(-90, -50) * k, drag: 1.5, life: 0.9, color: pick(["#ff4a8a", "#ff86c0"]), kind: "heart", front: true })); },
  },
  mint: {
    desc: "초코칩이 톡톡 튀어요",
    rate: 7,
    run(emit, x, y, k) {
      emit(P({ x: x + rnd(-10, 2) * k, y: y - rnd(4, 20) * k, vx: rnd(-60, -20) * k, vy: rnd(-60, -10) * k, g: 300 * k, size: 3, life: 0.6, color: pick(["#5a3a2a", "#3a2418", "#6a4a38"]), kind: "chip", front: true }));
      if (Math.random() < 0.5) emit(P({ x: x + rnd(-10, 6) * k, y: y - rnd(8, 26) * k, vx: -30 * k, size: 2, life: 0.4, color: "#5ad8b0", kind: "star", front: true }));
    },
    land(emit, x, y, k, vy) { if (vy < 250) return; for (let i = 0; i < 8; i++) emit(P({ x: x + rnd(-6, 6) * k, y: y - 2, vx: rnd(-120, 120) * k, vy: rnd(-200, -80) * k, g: 700 * k, size: 2, life: 0.6, color: pick(["#5a3a2a", "#a8ecd8", "#3a2418"]), kind: "chip", front: true })); },
  },
  ghost: {
    desc: "둥실둥실 떠다니는 유령",
    rate: 16,
    float: true,
    run(emit, x, y, k) { emit(P({ x: x + rnd(-12, 0) * k, y: y - rnd(2, 26) * k, vx: rnd(-70, -40) * k, vy: rnd(-10, 10) * k, drag: 1, size: 4, life: rnd(0.4, 0.7), color: pick(["#a0b8e8", "#b0c8f0", "#7890c8"]), kind: "wisp" })); },
    death(emit, x, y, k) { emit(P({ x, y: y - 14 * k, vy: -60 * k, life: 1.6, color: "#ffffff", kind: "soul", size: 6, front: true })); },
  },
  gold: {
    desc: "번쩍번쩍 황금 광택",
    rate: 6, glint: true,
    run(emit, x, y, k) { emit(P({ x: x + rnd(-14, 10) * k, y: y - rnd(4, 30) * k, vx: -20 * k, vy: rnd(-20, 0) * k, size: 2, life: rnd(0.3, 0.6), color: pick(["#ffd84a", "#f0b020", "#fff3a6"]), kind: "star", front: true })); },
    death(emit, x, y, k) { for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, s = rnd(60, 200) * k; emit(P({ x, y: y - 16 * k, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60 * k, g: 500 * k, drag: 1, size: 2, life: rnd(0.6, 1), color: pick(["#ffd84a", "#fff3a6", "#e0a020"]), kind: "chip", front: true })); } },
  },
  robot: {
    desc: "발밑 분사구와 전기 스파크",
    rate: 22, eye: "#5af0ff",
    run(emit, x, y, k, st) {
      emit(P({ x: x + rnd(-6, 4) * k, y: y + 1, vx: rnd(-90, -40) * k, vy: rnd(-20, 10) * k, drag: 3, size: 2, life: rnd(0.15, 0.3), color: pick(["#5af0ff", "#4a90e0", "#2a6ab0"]), kind: "glow", front: true }));
      if (st && Math.random() < 0.05) for (let i = 0; i < 4; i++) emit(P({ x: x + rnd(-12, 12) * k, y: y - rnd(8, 30) * k, size: 1, life: 0.14, color: "#2a9aff", kind: "zap", len: (4 + Math.random() * 6) * k, a: Math.random() * 6.28, front: true }));
    },
    jump(emit, x, y, k) { for (let i = 0; i < 8; i++) emit(P({ x: x + rnd(-6, 6) * k, y, vx: rnd(-40, 40) * k, vy: rnd(40, 140) * k, drag: 4, size: 2, life: 0.3, color: pick(["#ff8a2a", "#ffc23d", "#5af0ff"]), kind: "glow" })); },
    land(emit, x, y, k, vy) { if (vy < 200) return; for (let i = 0; i < 8; i++) emit(P({ x: x + rnd(-8, 8) * k, y: y - 1, vx: rnd(-160, 160) * k, vy: rnd(-180, -60) * k, g: 900 * k, size: 1, life: 0.4, color: pick(["#ffc23d", "#ffffff", "#ff8a2a"]), kind: "glow", front: true })); },
    death(emit, x, y, k) { for (let i = 0; i < 10; i++) emit(P({ x: x + rnd(-14, 14) * k, y: y - rnd(4, 30) * k, size: 1, life: 0.3, color: "#2a9aff", kind: "zap", len: (6 + Math.random() * 10) * k, a: Math.random() * 6.28, front: true })); },
  },
  phoenix: {
    desc: "온몸에 불꽃이 타올라요",
    rate: 36, aura: "rgba(255,110,30,0.16)",
    run(emit, x, y, k) { emit(P({ x: x + rnd(-12, 8) * k, y: y - rnd(2, 30) * k, vx: rnd(-70, -30) * k, vy: rnd(-90, -40) * k, g: -60 * k, drag: 2, size: pick([3, 3, 4]), life: rnd(0.25, 0.45), color: pick(["#ffc23d", "#ff8a2a", "#e0501a", "#ff6a1a"]), kind: "flame" })); },
    jump(emit, x, y, k) { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; emit(P({ x, y: y - 4, vx: Math.cos(a) * 110 * k, vy: Math.sin(a) * 40 * k, drag: 4, size: 2, life: 0.35, color: pick(["#ffc23d", "#ff8a2a"]), kind: "flame", front: true })); } },
    land(emit, x, y, k, vy) { if (vy < 250) return; for (let i = 0; i < 10; i++) emit(P({ x: x + rnd(-8, 8) * k, y: y - 1, vx: rnd(-140, 140) * k, vy: rnd(-220, -80) * k, g: 600 * k, size: 2, life: 0.5, color: pick(["#fff3a6", "#ffc23d", "#ff8a2a"]), kind: "flame", front: true })); },
    death(emit, x, y, k) { for (let i = 0; i < 30; i++) emit(P({ x: x + rnd(-10, 10) * k, y: y - rnd(0, 30) * k, vx: rnd(-80, 80) * k, vy: rnd(-260, -60) * k, g: -40 * k, drag: 1.5, size: pick([2, 3, 4]), life: rnd(0.5, 1), color: pick(["#fff3a6", "#ffc23d", "#ff8a2a", "#e0501a"]), kind: "flame", front: true })); },
  },
  rainbow: {
    desc: "무지갯빛 반짝이 꼬리",
    rate: 14,
    run(emit, x, y, k, st) { const c = RAINBOW[Math.floor((st ? st.time : 0) * 8) % RAINBOW.length]; emit(P({ x: x + rnd(-14, -4) * k, y: y - rnd(6, 26) * k, vx: rnd(-50, -20) * k, vy: rnd(-15, 15) * k, size: 2, life: 0.6, color: c, kind: "star", front: true })); },
    jump(emit, x, y, k) { RAINBOW.forEach((c, i) => { const a = (i / RAINBOW.length) * Math.PI * 2; emit(P({ x, y: y - 14 * k, vx: Math.cos(a) * 90 * k, vy: Math.sin(a) * 90 * k, drag: 3, size: 2, life: 0.45, color: c, kind: "glow", front: true })); }); },
  },
};

export function skinFx(id) { return SKIN_FX[id] || SKIN_FX.basic; }

/** The front/back layer a particle draws on. */
export function partIsFront(q) {
  if (q.front !== undefined) return q.front;
  return q.kind === "spark" || q.kind === "feather" || q.spin || q.kind === "star" || q.kind === "heart" || q.kind === "note";
}

/** Draws one particle at screen (x, y). Shared by the game and the shop preview. */
export function drawPart(ctx, q, x, y, time, worldSpeed = 0) {
  const k = 1 - q.t / q.life;
  ctx.fillStyle = q.color;
  ctx.globalAlpha = q.kind === "smoke" || q.kind === "dust" || q.kind === "wisp" ? k * 0.7 : Math.min(1, k * 2);
  switch (q.kind) {
    case "heart": ctx.fillRect(x, y, 2, 2); ctx.fillRect(x + 3, y, 2, 2); ctx.fillRect(x - 1, y + 1, 7, 2); ctx.fillRect(x, y + 3, 5, 1); ctx.fillRect(x + 1, y + 4, 3, 1); ctx.fillRect(x + 2, y + 5, 1, 1); break;
    case "star":
      if (q.size >= 2) { ctx.fillRect(x, y - 3, 1, 7); ctx.fillRect(x - 3, y, 7, 1); ctx.fillRect(x - 1, y - 1, 3, 3); ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y, 1, 1); }
      else { ctx.fillRect(x, y - 2, 1, 5); ctx.fillRect(x - 2, y, 5, 1); }
      break;
    case "note": ctx.fillRect(x, y, 3, 2); ctx.fillRect(x + 2, y - 5, 1, 5); ctx.fillRect(x + 3, y - 5, 2, 1); break;
    case "band": ctx.fillRect(x - Math.round(q.t * worldSpeed), y, q.w, 2); break;
    case "feather": { const s = Math.sin(time * 8 + (q.ph || 0)) > 0; ctx.fillRect(x, y, s ? 3 : 2, s ? 1 : 2); break; }
    case "bubble": ctx.fillRect(x - 1, y - 2, 3, 1); ctx.fillRect(x - 2, y - 1, 1, 3); ctx.fillRect(x + 2, y - 1, 1, 3); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - 1, 1, 1); break;
    case "glow": case "flame": {
      const sz = q.kind === "flame" ? Math.max(1, Math.round(q.size * (0.5 + k * 0.8))) : q.size;
      ctx.fillRect(x - (sz >> 1), y - (sz >> 1), sz, sz);
      if (sz >= 3) { ctx.fillStyle = q.kind === "flame" ? "#fff3a6" : "#ffffff"; ctx.fillRect(x - (sz >> 2), y - (sz >> 2), Math.max(1, sz >> 1), Math.max(1, sz >> 1)); }
      break;
    }
    case "zap": {
      ctx.save();
      const steps = 4, dx = Math.cos(q.a) * q.len / steps, dy = Math.sin(q.a) * q.len / steps;
      let px = x, py = y;
      for (let i = 0; i < steps; i++) { px += dx + (i % 2 ? 1 : -1); py += dy; ctx.fillRect(Math.round(px), Math.round(py), 1, 1); ctx.fillRect(Math.round(px - dx / 2), Math.round(py - dy / 2), 1, 1); }
      ctx.restore(); break;
    }
    case "soul": {
      // a little ghost rising
      ctx.globalAlpha = Math.min(1, k * 1.5) * 0.85;
      ctx.fillRect(x - 3, y - 4, 6, 6); ctx.fillRect(x - 2, y - 5, 4, 1); ctx.fillRect(x - 3, y + 2, 2, 1); ctx.fillRect(x + 1, y + 2, 2, 1);
      ctx.fillStyle = "#3a4a7a"; ctx.fillRect(x - 2, y - 2, 1, 1); ctx.fillRect(x + 1, y - 2, 1, 1);
      break;
    }
    default: {
      const grow = q.kind === "dust" || q.kind === "smoke" || q.kind === "wisp";
      const sz = grow ? Math.max(1, Math.round(q.size * (0.6 + q.t / q.life))) : q.size;
      ctx.fillRect(x - (sz >> 1), y - (sz >> 1), sz, sz);
    }
  }
  ctx.globalAlpha = 1;
}

export function stepParts(list, dt) {
  for (const q of list) {
    q.t += dt;
    q.vy += q.g * dt;
    if (q.drag) { const e = Math.exp(-q.drag * dt); q.vx *= e; q.vy *= e; }
    q.x += q.vx * dt; q.y += q.vy * dt;
  }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].t >= list[i].life) list.splice(i, 1);
}

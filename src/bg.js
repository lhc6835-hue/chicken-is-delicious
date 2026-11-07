// Parallax farm backdrops drawn in code: a stepped sky, sun or moon, clouds, far hills, a barn and
// windmill row, near bushes. The time of day cycles as you run (day, sunset, night, dawn).

export const W = 480, H = 270;

const BIOMES = [
  { name: "한낮의 농장", sky: ["#5ec8ff", "#7fd6ff", "#a6e4ff", "#cdf1ff"], far: "#8fd0a0", mid: "#5fae6a", near: "#3f8a4a", cloud: "#ffffff", cloudSh: "#d6ecff", sun: "#fff3a6", deco: "#c0503a", star: 0 },
  { name: "노을 언덕", sky: ["#3a2a6a", "#a0407a", "#f07a5a", "#ffc070"], far: "#a05a6a", mid: "#6a3a5a", near: "#3a2440", cloud: "#ffb08a", cloudSh: "#c0607a", sun: "#ffe080", deco: "#2a1830", star: 0.2 },
  { name: "별빛 밤", sky: ["#0a0c24", "#141a3e", "#1e2a5a", "#2a3a72"], far: "#1e3050", mid: "#152440", near: "#0c1628", cloud: "#3a4a7a", cloudSh: "#26325a", sun: "#f4f0d0", deco: "#0a1020", star: 1 },
  { name: "새벽 들판", sky: ["#4a6aa0", "#8aa0d0", "#d0b8d8", "#ffd8c0"], far: "#7a9ab0", mid: "#5a7a8a", near: "#3a5460", cloud: "#fff0ea", cloudSh: "#c8b8d0", sun: "#fff0c0", deco: "#3a3040", star: 0.1 },
];
export const BIOME_LEN = 900; // meters per biome

function lerpHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = ((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t;
  const g = ((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t;
  const bl = (pa & 255) * (1 - t) + (pb & 255) * t;
  return `rgb(${r | 0},${g | 0},${bl | 0})`;
}

export function biomeAt(meters) {
  const f = meters / BIOME_LEN, i = Math.floor(f) % BIOMES.length, j = (i + 1) % BIOMES.length;
  const local = f - Math.floor(f);
  const t = local > 0.85 ? (local - 0.85) / 0.15 : 0; // blend over the last 15%
  return { a: BIOMES[i], b: BIOMES[j], t, index: Math.floor(f), name: BIOMES[i].name };
}

function mix(bm, key, idx) {
  const a = idx === undefined ? bm.a[key] : bm.a[key][idx];
  const b = idx === undefined ? bm.b[key] : bm.b[key][idx];
  return bm.t ? lerpHex(a, b, bm.t) : a;
}

// deterministic hash noise
const hash = (n) => { n = (n << 13) ^ n; return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff; };

let stars = null;
function getStars() {
  if (stars) return stars;
  stars = [];
  for (let i = 0; i < 70; i++) stars.push({ x: hash(i * 7 + 1) * W, y: hash(i * 13 + 5) * 150, s: hash(i * 3 + 2) > 0.85 ? 2 : 1, p: hash(i * 11) * 6.28 });
  return stars;
}

function hillLine(ctx, scroll, base, amp, freq, color, seed) {
  ctx.fillStyle = color;
  const off = scroll;
  for (let x = 0; x < W; x += 2) {
    const wx = x + off;
    const y = base - (Math.sin(wx * freq + seed) * 0.6 + Math.sin(wx * freq * 2.3 + seed * 2) * 0.3 + Math.sin(wx * freq * 5.1 + seed) * 0.1) * amp;
    ctx.fillRect(x, Math.round(y / 2) * 2, 2, H - y);
  }
}

function cloud(ctx, x, y, s, c, sh) {
  const blobs = [[0, 0, 10], [10, -5, 12], [22, 0, 9], [14, 3, 10], [-8, 3, 7]];
  ctx.fillStyle = sh;
  for (const [dx, dy, r] of blobs) ctx.fillRect(Math.round(x + (dx - r) * s), Math.round(y + (dy - r * 0.6 + 3) * s), Math.round(r * 2 * s), Math.round(r * 1.2 * s));
  ctx.fillStyle = c;
  for (const [dx, dy, r] of blobs) ctx.fillRect(Math.round(x + (dx - r) * s), Math.round(y + (dy - r * 0.6) * s), Math.round(r * 2 * s), Math.round(r * 1.1 * s));
}

function barn(ctx, x, y, c, roof) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y - 26, 34, 26);
  ctx.beginPath(); ctx.moveTo(x - 3, y - 26); ctx.lineTo(x + 17, y - 42); ctx.lineTo(x + 37, y - 26); ctx.fill();
  ctx.fillStyle = roof;
  ctx.fillRect(x + 12, y - 16, 10, 16);
  ctx.fillRect(x + 14, y - 34, 6, 5);
}

function windmill(ctx, x, y, c, t) {
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 3, y - 44); ctx.lineTo(x + 3, y - 44); ctx.lineTo(x + 6, y); ctx.fill();
  ctx.save(); ctx.translate(x, y - 44); ctx.rotate(t * 0.8);
  for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-2, 0, 4, 24); ctx.fillRect(1, 6, 6, 16); }
  ctx.restore();
}

function tree(ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x - 2, y - 12, 4, 12);
  ctx.fillRect(x - 10, y - 30, 20, 16);
  ctx.fillRect(x - 7, y - 36, 14, 6);
  ctx.fillRect(x - 12, y - 24, 24, 8);
}

export function drawBackground(ctx, camX, meters, time) {
  const bm = biomeAt(meters);
  // stepped sky bands with a 2-px dither line between them
  const bands = 4, bh = 190 / bands;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = mix(bm, "sky", i);
    ctx.fillRect(0, Math.floor(i * bh), W, Math.ceil(bh) + 1);
    if (i < bands - 1) {
      ctx.fillStyle = mix(bm, "sky", i + 1);
      const y = Math.floor((i + 1) * bh) - 2;
      for (let x = (i % 2) * 2; x < W; x += 4) ctx.fillRect(x, y, 2, 2);
    }
  }
  ctx.fillStyle = mix(bm, "sky", 3);
  ctx.fillRect(0, 190, W, H - 190);
  // stars
  const starK = bm.a.star * (1 - bm.t) + bm.b.star * bm.t;
  if (starK > 0.05) {
    for (const s of getStars()) {
      const tw = 0.5 + 0.5 * Math.sin(time * 3 + s.p);
      ctx.globalAlpha = starK * (0.4 + 0.6 * tw);
      ctx.fillStyle = "#fffbe0";
      ctx.fillRect(Math.round((s.x - camX * 0.01 + W * 10) % W), s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }
  // sun / moon with a soft halo
  const sunY = 60 + Math.sin(meters / BIOME_LEN * Math.PI * 0.5) * 6;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = mix(bm, "sun");
  ctx.beginPath(); ctx.arc(380, sunY, 34, 0, 7); ctx.fill();
  ctx.globalAlpha = 0.08;
  ctx.beginPath(); ctx.arc(380, sunY, 24, 0, 7); ctx.fill();
  ctx.restore();
  ctx.fillStyle = mix(bm, "sun");
  ctx.fillRect(368, sunY - 10, 24, 20); ctx.fillRect(370, sunY - 12, 20, 24); ctx.fillRect(366, sunY - 8, 28, 16);
  // clouds, slow
  for (let i = 0; i < 6; i++) {
    const span = W + 200;
    const x = ((hash(i * 31) * span - camX * (0.06 + i * 0.015) - time * 4) % span + span) % span - 100;
    cloud(ctx, x, 30 + hash(i * 17) * 80, 0.8 + hash(i * 5) * 0.6, mix(bm, "cloud"), mix(bm, "cloudSh"));
  }
  // far hills
  hillLine(ctx, camX * 0.12, 196, 26, 0.008, mix(bm, "far"), 1.3);
  // mid row: hills with barns, windmills, trees
  hillLine(ctx, camX * 0.25, 214, 16, 0.013, mix(bm, "mid"), 4.1);
  const midScroll = camX * 0.25, spacing = 150;
  const first = Math.floor(midScroll / spacing) - 1;
  for (let k = first; k < first + 6; k++) {
    const x = Math.round(k * spacing - midScroll + hash(k * 3 + 9) * 60);
    const kind = Math.floor(hash(k * 7 + 3) * 4);
    const y = 214 - (Math.sin((x + midScroll) * 0.013 + 4.1) * 0.6) * 16 + 4;
    if (kind === 0) barn(ctx, x, y, mix(bm, "deco"), mix(bm, "mid"));
    else if (kind === 1) windmill(ctx, x, y, mix(bm, "near"), time + k);
    else tree(ctx, x, y, mix(bm, "near"));
  }
  // near bushes
  hillLine(ctx, camX * 0.45, 230, 6, 0.04, mix(bm, "near"), 2.2);
  return bm;
}

// ---------- ground tiles ----------
let tiles = null;
export function groundTiles() {
  if (tiles) return tiles;
  const mk = (draw) => { const c = document.createElement("canvas"); c.width = 16; c.height = 16; draw(c.getContext("2d")); return c; };
  const dirt = ["#6a4426", "#7d5230", "#5a3820", "#8c6038"];
  tiles = {
    top: mk((x) => {
      x.fillStyle = "#7d5230"; x.fillRect(0, 0, 16, 16);
      for (let i = 0; i < 20; i++) { x.fillStyle = dirt[i % 4]; x.fillRect(Math.floor(hash(i * 3) * 15), 6 + Math.floor(hash(i * 7) * 9), 2, 1); }
      x.fillStyle = "#3f8a2a"; x.fillRect(0, 0, 16, 6);
      x.fillStyle = "#5fbf3a"; x.fillRect(0, 0, 16, 3);
      x.fillStyle = "#9be05a"; x.fillRect(0, 0, 16, 1);
      x.fillStyle = "#3f8a2a"; for (let i = 0; i < 16; i += 3) x.fillRect(i, 6, 2, 1 + (i % 2));
      x.fillStyle = "#9be05a"; x.fillRect(3, 1, 1, 1); x.fillRect(11, 1, 1, 1);
    }),
    fill: mk((x) => {
      x.fillStyle = "#6a4426"; x.fillRect(0, 0, 16, 16);
      for (let i = 0; i < 18; i++) { x.fillStyle = dirt[(i + 1) % 4]; x.fillRect(Math.floor(hash(i * 5 + 1) * 15), Math.floor(hash(i * 9 + 2) * 15), 2, 1); }
      x.fillStyle = "#4a2e18"; x.fillRect(Math.floor(hash(99) * 12), 9, 3, 2);
    }),
    plank: mk((x) => {
      x.fillStyle = "#3a2214"; x.fillRect(0, 0, 16, 8);
      x.fillStyle = "#c0804a"; x.fillRect(0, 1, 16, 5);
      x.fillStyle = "#e0a060"; x.fillRect(0, 1, 16, 1);
      x.fillStyle = "#8a5430"; x.fillRect(0, 5, 16, 1); x.fillRect(7, 1, 1, 5);
      x.fillStyle = "#3a2214"; x.fillRect(3, 3, 1, 1); x.fillRect(12, 3, 1, 1);
    }),
    stone: mk((x) => {
      x.fillStyle = "#2a2a3a"; x.fillRect(0, 0, 16, 8);
      x.fillStyle = "#8a8aa0"; x.fillRect(0, 1, 16, 5);
      x.fillStyle = "#b8b8cc"; x.fillRect(0, 1, 16, 1);
      x.fillStyle = "#5a5a70"; x.fillRect(0, 5, 16, 1); x.fillRect(5, 2, 1, 3); x.fillRect(11, 1, 1, 4);
    }),
    cloud: mk((x) => {
      x.fillStyle = "#c8dcff"; x.fillRect(0, 2, 16, 6);
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, 16, 5);
      x.fillStyle = "#e8f2ff"; x.fillRect(2, 4, 4, 1); x.fillRect(10, 4, 3, 1);
    }),
  };
  return tiles;
}

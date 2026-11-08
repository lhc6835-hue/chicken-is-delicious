// The farm backdrop, drawn in pixels: a dithered sky, a sun or moon, three-tone clouds, snowy far
// mountains, rolling hills lined with trees and farm buildings, flowery near hills, and per time of
// day touches (birds, sunset rays, stars, shooting stars, fireflies, dawn mist). The time of day
// cycles as you run: day, sunset, night, dawn.

export const W = 480, H = 270;
export const BIOME_LEN = 900; // meters per biome

const BIOMES = [
  {
    name: "한낮의 농장",
    sky: ["#3a96ee", "#56b0f8", "#7cc8ff", "#a6dcff", "#d4f0ff"],
    cloud: ["#ffffff", "#eef6ff", "#c4dcf4"],
    far: ["#9cc0e0", "#c4daf0", "#7aa0c8"], snow: "#ffffff",
    mid: ["#6cc25a", "#9be05a", "#4a9a44"],
    near: ["#3f8a3a", "#62b84a", "#2e6a2e"],
    tint: ["#000000", 0], haze: "#d4f0ff", sun: "day", stars: 0, flowers: 1,
  },
  {
    name: "노을 언덕",
    sky: ["#241a54", "#5a2a78", "#b0466e", "#f07848", "#ffc468"],
    cloud: ["#ffc8a0", "#f0907a", "#9a4a6a"],
    far: ["#8a5a86", "#b07a98", "#643e6a"], snow: "#ffd0b0",
    mid: ["#6a3e62", "#8e5a70", "#4e2c4e"],
    near: ["#3e2644", "#5a3a54", "#2c1a34"],
    tint: ["#5a1e48", 0.42], haze: "#ffb070", sun: "sunset", stars: 0.15, flowers: 0.6,
  },
  {
    name: "별빛 밤",
    sky: ["#04061a", "#0a1030", "#121c46", "#1c2a5e", "#283a72"],
    cloud: ["#3a4a7a", "#2c3a66", "#1c2850"],
    far: ["#22305a", "#34467a", "#182448"], snow: "#8aa0d0",
    mid: ["#18284a", "#24385c", "#101c38"],
    near: ["#0e1830", "#182844", "#080f20"],
    tint: ["#0a1236", 0.62], haze: "#2a3e74", sun: "moon", stars: 1, flowers: 0.25,
  },
  {
    name: "새벽 들판",
    sky: ["#34447e", "#6670b4", "#ae92c8", "#eeb6b8", "#ffe2c4"],
    cloud: ["#fff0ee", "#e8c8d8", "#a898c0"],
    far: ["#8e9ec4", "#b4c0dc", "#6e7ea8"], snow: "#ffffff",
    mid: ["#6e909c", "#92b0b4", "#50707e"],
    near: ["#3e5e68", "#5a7c80", "#2c4650"],
    tint: ["#4a5a96", 0.28], haze: "#ffe2c4", sun: "dawn", stars: 0.2, flowers: 0.8,
  },
];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const hash = (n) => { n = (n << 13) ^ n; return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff; };
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const lerpRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lerpHex = (a, b, t) => (t <= 0 ? a : hex(lerpRgb(rgb(a), rgb(b), t)));

export function biomeAt(meters) {
  const f = meters / BIOME_LEN, i = Math.floor(f) % BIOMES.length, j = (i + 1) % BIOMES.length;
  const local = f - Math.floor(f);
  const t = local > 0.85 ? (local - 0.85) / 0.15 : 0; // blend over the last 15%
  return { a: BIOMES[i], b: BIOMES[j], t, index: Math.floor(f), name: BIOMES[i].name };
}

// a blended palette for the current spot in the cycle
function palette(bm) {
  const { a, b, t } = bm, L = (x, y) => lerpHex(x, y, t), A = (x, y) => x.map((c, i) => L(c, y[i]));
  return {
    sky: A(a.sky, b.sky), cloud: A(a.cloud, b.cloud), far: A(a.far, b.far), snow: L(a.snow, b.snow),
    mid: A(a.mid, b.mid), near: A(a.near, b.near), haze: L(a.haze, b.haze),
    tint: [L(a.tint[0], b.tint[0]), a.tint[1] + (b.tint[1] - a.tint[1]) * t],
    stars: a.stars + (b.stars - a.stars) * t, flowers: a.flowers + (b.flowers - a.flowers) * t,
  };
}

/** How dark it is (0 day .. 1 night), for lit windows and fireflies; and the ground's tint. */
export function nightness(meters) { const bm = biomeAt(meters); const n = (x) => (x.sun === "moon" ? 1 : x.sun === "sunset" ? 0.35 : x.sun === "dawn" ? 0.2 : 0); return n(bm.a) + (n(bm.b) - n(bm.a)) * bm.t; }
export function groundTint(meters) { return palette(biomeAt(meters)).tint; }

// ------------------------------------------------------------------ sky (dithered, cached)
const SKY_H = 210;
let skyCv = null, skyKey = "";
function drawSky(ctx, P, key) {
  if (!skyCv) { skyCv = document.createElement("canvas"); skyCv.width = W; skyCv.height = SKY_H; }
  if (key !== skyKey) {
    skyKey = key;
    const x = skyCv.getContext("2d"), img = x.createImageData(W, SKY_H), d = img.data;
    // interpolate the key colours into 14 steps; each step is a flat band, and only the seam between
    // two bands is dithered, so the sky reads as a smooth gradient instead of grain
    const keys = P.sky.map(rgb), STEPS = 14, cols = [];
    for (let i = 0; i < STEPS; i++) { const u = (i / (STEPS - 1)) * (keys.length - 1), k = Math.min(keys.length - 2, Math.floor(u)); cols.push(lerpRgb(keys[k], keys[k + 1], u - k).map(Math.round)); }
    const n = STEPS - 1;
    for (let y = 0; y < SKY_H; y += 2) {
      const u = (y / SKY_H) * n, i = Math.min(n - 1, Math.floor(u)), f = u - i;
      const seam = f < 0.65 ? 0 : (f - 0.65) / 0.35; // dither only in the last third of a band
      for (let xx = 0; xx < W; xx += 2) {
        const th = (BAYER[((y >> 1) % 4) * 4 + ((xx >> 1) % 4)] + 0.5) / 16;
        const c = seam > th ? cols[i + 1] : cols[i];
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
          const k = ((y + dy) * W + xx + dx) * 4;
          d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
        }
      }
    }
    x.putImageData(img, 0, 0);
  }
  ctx.drawImage(skyCv, 0, 0);
  ctx.fillStyle = P.sky[P.sky.length - 1];
  ctx.fillRect(0, SKY_H, W, H - SKY_H);
}

// pixel disc helper
function disc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); ctx.fillRect(cx - hw, cy + dy, hw * 2, 1); }
}

function drawCelestial(ctx, kind, alpha, time, meters) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (kind === "day") {
    const cx = 392, cy = 50;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [r, a] of [[40, 0.05], [30, 0.07], [22, 0.1]]) { ctx.globalAlpha = a * alpha; disc(ctx, cx, cy, r, "#fff6c8"); }
    ctx.restore(); ctx.globalAlpha = alpha;
    disc(ctx, cx, cy, 15, "#ffd84a"); disc(ctx, cx, cy, 13, "#ffe680"); disc(ctx, cx - 2, cy - 2, 9, "#fff6c8");
    // slow-turning ray pixels
    ctx.fillStyle = "#fff3a6";
    for (let i = 0; i < 8; i++) { const a = time * 0.4 + (i * Math.PI) / 4, r = 21 + (i % 2) * 3; ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2); }
  } else if (kind === "sunset") {
    // a big low sun cut by bands of haze
    const cx = 360, cy = 150;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [r, a] of [[64, 0.05], [46, 0.08], [34, 0.12]]) { ctx.globalAlpha = a * alpha; disc(ctx, cx, cy, r, "#ffb060"); }
    ctx.restore(); ctx.globalAlpha = alpha;
    disc(ctx, cx, cy, 26, "#ff8a3a"); disc(ctx, cx, cy - 2, 23, "#ffb04a"); disc(ctx, cx - 3, cy - 6, 15, "#ffe08a");
    ctx.fillStyle = "#f07848";
    for (let i = 0; i < 4; i++) ctx.fillRect(cx - 30, cy + 6 + i * 6, 60, 2 + (i >> 1));
  } else if (kind === "moon") {
    const cx = 380, cy = 54;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [r, a] of [[34, 0.05], [24, 0.08]]) { ctx.globalAlpha = a * alpha; disc(ctx, cx, cy, r, "#c8d8ff"); }
    ctx.restore(); ctx.globalAlpha = alpha;
    disc(ctx, cx, cy, 13, "#f4f0d8"); disc(ctx, cx + 5, cy - 3, 11, "#d8d4bc");
    disc(ctx, cx + 4, cy - 2, 10, "#f4f0d8");
    ctx.fillStyle = "#c8c4a8"; ctx.fillRect(cx - 6, cy + 2, 4, 3); ctx.fillRect(cx + 2, cy + 6, 3, 2); ctx.fillRect(cx - 2, cy - 7, 3, 2);
  } else if (kind === "dawn") {
    const cx = 120, cy = 176;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [r, a] of [[50, 0.05], [34, 0.09]]) { ctx.globalAlpha = a * alpha; disc(ctx, cx, cy, r, "#fff0c0"); }
    ctx.restore(); ctx.globalAlpha = alpha;
    disc(ctx, cx, cy, 18, "#ffe0a0"); disc(ctx, cx - 2, cy - 3, 13, "#fff6d8");
  }
  ctx.restore();
}

// ------------------------------------------------------------------ clouds (three-tone, cached)
const cloudCache = new Map();
function cloudSprite(shape, cols) {
  const key = shape + cols.join();
  let c = cloudCache.get(key);
  if (c) return c;
  const blobs = [
    [[14, 14, 10], [26, 9, 12], [40, 13, 10], [52, 16, 8], [6, 17, 7]],
    [[12, 12, 9], [24, 8, 11], [36, 12, 8]],
    [[10, 12, 8], [22, 9, 10], [34, 8, 9], [46, 11, 8], [58, 14, 7], [70, 15, 6]],
  ][shape];
  const w = 80, h = 30;
  c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d");
  const inside = (px, py) => blobs.some(([bx, by, r]) => (px - bx) ** 2 + ((py - by) * 1.3) ** 2 < r * r) && py < 24;
  for (let py = 0; py < h; py += 2) for (let px = 0; px < w; px += 2) {
    if (!inside(px, py)) continue;
    const top = !inside(px, py - 4), bottom = !inside(px, py + 4) || py > 18;
    x.fillStyle = bottom ? cols[2] : top ? cols[0] : cols[1];
    x.fillRect(px, py, 2, 2);
  }
  cloudCache.set(key, c);
  if (cloudCache.size > 60) cloudCache.delete(cloudCache.keys().next().value);
  return c;
}

// ------------------------------------------------------------------ farm props (pixel sprites)
function sprite(rows, pal) {
  const c = document.createElement("canvas");
  c.width = Math.max(...rows.map((r) => r.length)); c.height = rows.length;
  const x = c.getContext("2d");
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== "." && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
  return c;
}
let props = null;
function getProps() {
  if (props) return props;
  const tree = { K: "#1e3a1e", G: "#4a9a44", g: "#2e6a2e", L: "#7ac25a", N: "#6a4020" };
  props = {
    barn: sprite([
      ".........KKKKKK.........",
      ".......KKrrrrrrKK.......",
      ".....KKrrrrrrrrrrKK.....",
      "....KRRRRRRRRRRRRRRK....",
      "...KRRRRRRRRRRRRRRRRK...",
      "..KKKKKKKKKKKKKKKKKKKK..",
      "...KBBBBBBKWWKBBBBBbK...",
      "...KBBBBBBKWWKBBBBBbK...",
      "...KBBBBBBKKKKBBBBBbK...",
      "...KWWWWWWWWWWWWWWWWK...",
      "...KBBBBWWWWWWWWBBBbK...",
      "...KBBBBWDWWWWDWBBBbK...",
      "...KBBBBWWDWWDWWBBBbK...",
      "...KBBBBWWWDDWWWBBBbK...",
      "...KBBBBWWDWWDWWBBBbK...",
      "...KBBBBWDWWWWDWBBBbK...",
      "...KBBBBWWWWWWWWBBBbK...",
      "...KKKKKKKKKKKKKKKKKK...",
    ], { K: "#3a1a1a", R: "#6a2e2e", r: "#8a3e38", B: "#c8463c", b: "#9a3430", W: "#f4ead8", D: "#7a2a2a" }),
    silo: sprite([
      "...KKKK...", "..KSSssK..", ".KSSSSssK.", "KSSSSSSssK", "KKKKKKKKKK",
      "KMMMMMMmmK", "KMMMMMMmmK", "KMMMMMMmmK", "KKKKKKKKKK", "KMMMMMMmmK", "KMMMMMMmmK", "KMMMMMMmmK",
      "KKKKKKKKKK", "KMMMMMMmmK", "KMMMMMMmmK", "KMMMMMMmmK", "KKKKKKKKKK", "KMMMMMMmmK", "KMMMMMMmmK",
      "KMMMMMMmmK", "KMMMMMMmmK", "KKKKKKKKKK",
    ], { K: "#2a2a3a", S: "#b8bccc", s: "#8a8ea4", M: "#d8dce8", m: "#a0a6bc" }),
    house: sprite([
      "....KKKKKKKKKKKK....",
      "...KUUUUUUUUUUUUK...",
      "..KUUUUUUUUUUUUUUK..",
      ".KUUUUUUUUUUUUUUUUK.",
      "KKKKKKKKKKKKKKKKKKKK",
      ".KCCCCCCCCCCCCCCCcK.",
      ".KCKKKKCCCCCKKKKCcK.",
      ".KCKYYKCCCCCKYYKCcK.",
      ".KCKYYKCCCCCKYYKCcK.",
      ".KCKKKKCKKKCKKKKCcK.",
      ".KCCCCCCKNKCCCCCCcK.",
      ".KCCCCCCKNKCCCCCCcK.",
      ".KKKKKKKKKKKKKKKKKK.",
    ], { K: "#2a2030", U: "#4a5a8a", C: "#f0e2c4", c: "#c8b898", Y: "#5a6a8a", N: "#7a4a2a" }),
    houseLights: sprite([
      "", "", "", "", "", "", "",
      "....YY.......YY.....",
      "....YY.......YY.....",
    ], { Y: "#ffd86a" }),
    treeRound: sprite([
      "....KKKKK.....", "..KKLLLGGKK...", ".KLLLGGGGGgK..", "KLLGGGGGGGggK.", "KLGGGGGGGGGgK.",
      "KGGGGGGGGGggK.", ".KGGGGGGGggK..", "..KKgggggKK...", "....KKNKK.....", ".....KNK......", ".....KNK......",
    ], tree),
    treePine: sprite([
      "....K....", "...KLK...", "...KGK...", "..KLGgK..", "..KGGgK..", ".KLGGGgK.", ".KGGGggK.",
      "KLGGGGggK", "KKKKGKKKK", "...KNK...", "...KNK...",
    ], tree),
  };
  return props;
}
const silCache = new Map();
function silhouette(img, color) {
  const key = img.width + "x" + img.height + (img.dataset ? "" : "") + color + (img.__id || (img.__id = Math.random()));
  let c = silCache.get(key);
  if (c) return c;
  c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  silCache.set(key, c);
  if (silCache.size > 200) silCache.delete(silCache.keys().next().value);
  return c;
}
function drawProp(ctx, img, x, y, tint, k = 1) {
  const w = img.width * k, h = img.height * k;
  ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h), w, h);
  if (tint[1] > 0.01) {
    ctx.save(); ctx.globalAlpha = tint[1];
    ctx.drawImage(silhouette(img, tint[0]), Math.round(x - w / 2), Math.round(y - h), w, h);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ terrain layers
function ridgeY(wx, base, amp, f, seed, jag) {
  const s = Math.sin(wx * f + seed) * 0.55 + Math.sin(wx * f * 2.3 + seed * 1.7) * 0.3 + Math.sin(wx * f * 5.3 + seed) * 0.15;
  if (!jag) return base - s * amp;
  // mountains: sharpen into peaks
  const p = 1 - Math.abs(Math.sin(wx * f * 1.1 + seed));
  return base - (s * 0.35 + p * p * 0.9) * amp;
}
function drawLayer(ctx, scroll, base, amp, f, seed, cols, opts = {}) {
  const [c0, cHi, cLo] = cols;
  for (let x = 0; x < W; x += 2) {
    const wx = x + scroll;
    const ry = ridgeY(wx, base, amp, f, seed, opts.jag);
    const y = Math.round(ry / 2) * 2;
    const y2 = Math.round(ridgeY(wx + 2, base, amp, f, seed, opts.jag) / 2) * 2;
    ctx.fillStyle = c0; ctx.fillRect(x, y, 2, H - y);
    if (opts.jag) {
      // light from the upper left: faces rising to the right catch it, falling ones sit in shade;
      // the slope is measured over 8 px of the true ridge so gentle slopes don't flicker into stripes
      const slope = ridgeY(wx + 4, base, amp, f, seed, true) - ridgeY(wx - 4, base, amp, f, seed, true);
      const face = slope < -0.6 ? cHi : slope > 0.6 ? cLo : c0;
      ctx.fillStyle = face; ctx.fillRect(x, y, 2, Math.min(18, H - y));
      ctx.fillStyle = cHi; ctx.fillRect(x, y, 2, 2);
      if (opts.snow && ry < base - amp * 0.6) {
        const depth = Math.max(2, Math.round(((base - amp * 0.6 - ry) * 0.8) / 2) * 2);
        ctx.fillStyle = slope > 0.6 ? lerpHex(opts.snow, cLo, 0.35) : opts.snow;
        ctx.fillRect(x, y, 2, depth);
      }
    } else {
      ctx.fillStyle = cHi; ctx.fillRect(x, y, 2, 2);
      if (y2 > y) { ctx.fillStyle = cLo; ctx.fillRect(x, y + 2, 2, 2); }
    }
  }
}

let stars = null;
function getStars() {
  if (stars) return stars;
  stars = [];
  for (let i = 0; i < 90; i++) stars.push({ x: hash(i * 7 + 1) * W, y: hash(i * 13 + 5) * 150, s: hash(i * 3 + 2) > 0.88 ? 2 : 1, p: hash(i * 11) * 6.28 });
  return stars;
}

export function drawBackground(ctx, camX, meters, time) {
  const bm = biomeAt(meters), P = palette(bm), night = nightness(meters);
  drawSky(ctx, P, bm.index % 4 + ":" + Math.round(bm.t * 20));

  // stars, with the odd shooting star
  if (P.stars > 0.05) {
    for (const s of getStars()) {
      const tw = 0.5 + 0.5 * Math.sin(time * 3 + s.p);
      ctx.globalAlpha = P.stars * (0.35 + 0.65 * tw);
      ctx.fillStyle = s.s > 1 && tw > 0.8 ? "#ffffff" : "#fffbe0";
      ctx.fillRect(Math.round((s.x - camX * 0.01 + W * 10) % W), s.y, s.s, s.s);
      if (s.s > 1 && tw > 0.9) { ctx.fillRect(Math.round((s.x - camX * 0.01 + W * 10) % W) - 1, s.y + 0.5, 4, 1); }
    }
    const cyc = time % 9;
    if (P.stars > 0.6 && cyc < 0.7) {
      const k = cyc / 0.7, sx = 120 + hash(Math.floor(time / 9)) * 240, sy = 20 + hash(Math.floor(time / 9) + 3) * 50;
      ctx.globalAlpha = (1 - k) * P.stars;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 10; i++) ctx.fillRect(Math.round(sx + k * 90 - i * 3), Math.round(sy + k * 40 - i * 1.3), 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  drawCelestial(ctx, bm.a.sun, 1 - bm.t, time, meters);
  drawCelestial(ctx, bm.b.sun, bm.t, time, meters);

  // sunset rays fanning up from the sun
  const rayK = (bm.a.sun === "sunset" ? 1 - bm.t : 0) + (bm.b.sun === "sunset" ? bm.t : 0);
  if (rayK > 0.05) {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "#ffb070";
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = rayK * (0.05 + 0.03 * Math.sin(time * 0.8 + i));
      ctx.beginPath(); ctx.moveTo(360, 150);
      const a0 = -Math.PI * (0.18 + i * 0.16), a1 = a0 - 0.06;
      ctx.lineTo(360 + Math.cos(a0) * 400, 150 + Math.sin(a0) * 400); ctx.lineTo(360 + Math.cos(a1) * 400, 150 + Math.sin(a1) * 400); ctx.fill();
    }
    ctx.restore();
  }

  // high clouds drift slowly
  for (let i = 0; i < 7; i++) {
    const span = W + 240, par = 0.05 + (i % 3) * 0.02;
    const x = ((hash(i * 31) * span - camX * par - time * (3 + (i % 3) * 2)) % span + span) % span - 120;
    const y = 18 + hash(i * 17) * 90;
    const img = cloudSprite(i % 3, P.cloud);
    const k = i % 2 ? 1 : 2;
    if (k === 2 && y > 60) continue;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(img, Math.round(x), Math.round(y), img.width * (k === 2 ? 1 : 0.75) | 0, img.height * (k === 2 ? 1 : 0.75) | 0);
  }
  ctx.globalAlpha = 1;

  // far mountains, then haze over their feet
  drawLayer(ctx, camX * 0.06, 190, 46, 0.011, 0.7, P.far, { jag: true, snow: P.snow });
  const hz = ctx.createLinearGradient(0, 150, 0, 200);
  hz.addColorStop(0, "rgba(0,0,0,0)"); hz.addColorStop(1, P.haze);
  ctx.globalAlpha = 0.55; ctx.fillStyle = hz; ctx.fillRect(0, 150, W, 50); ctx.globalAlpha = 1;

  // a flock of birds now and then by day
  const dayK = 1 - night;
  if (dayK > 0.4) {
    const cyc = (time % 14) / 14, bx = -40 + cyc * (W + 80);
    ctx.fillStyle = "#2a3a5a"; ctx.globalAlpha = dayK * 0.8;
    for (let i = 0; i < 5; i++) {
      const fx = Math.round(bx - i * 11 - (i % 2) * 4), fy = Math.round(70 + i * 4 + Math.sin(time * 2 + i) * 2), up = Math.floor(time * 8 + i) % 2;
      ctx.fillRect(fx - 2, fy - up, 2, 1); ctx.fillRect(fx, fy, 1, 1); ctx.fillRect(fx + 1, fy - up, 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  // mid hills with trees on the ridge and farm buildings
  const midS = camX * 0.22;
  drawLayer(ctx, midS, 210, 18, 0.011, 4.1, P.mid);
  const Pp = getProps();
  {
    const gap = 26, first = Math.floor(midS / gap) - 1;
    for (let k = first; k < first + W / gap + 3; k++) {
      if (hash(k * 5 + 7) < 0.55) continue;
      const wx = k * gap + hash(k) * 10, x = wx - midS;
      const y = ridgeY(wx, 210, 18, 0.011, 4.1) + 3;
      drawProp(ctx, hash(k * 3) > 0.45 ? Pp.treeRound : Pp.treePine, x, y, P.tint, 1);
    }
    const sp = 170, f2 = Math.floor(midS / sp) - 1;
    for (let k = f2; k < f2 + 5; k++) {
      const kind = Math.floor(hash(k * 7 + 3) * 5);
      const wx = k * sp + hash(k * 3 + 9) * 70, x = wx - midS;
      const y = ridgeY(wx, 210, 18, 0.011, 4.1) + 4;
      if (kind === 0) drawProp(ctx, Pp.barn, x, y, P.tint);
      else if (kind === 1) { drawProp(ctx, Pp.barn, x, y, P.tint); drawProp(ctx, Pp.silo, x + 18, y, P.tint); }
      else if (kind === 2) {
        drawProp(ctx, Pp.house, x, y, P.tint);
        if (night > 0.15) { ctx.save(); ctx.globalAlpha = Math.min(1, night * 1.3); ctx.drawImage(Pp.houseLights, Math.round(x - 10), Math.round(y - 13)); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = night * 0.25; disc(ctx, Math.round(x - 5), Math.round(y - 5), 4, "#ffd86a"); disc(ctx, Math.round(x + 4), Math.round(y - 5), 4, "#ffd86a"); ctx.restore(); }
      } else if (kind === 3) drawWindmill(ctx, x, y, time + k, P.tint);
    }
  }

  // dawn mist rolling over the mid hills
  const mistK = (bm.a.sun === "dawn" ? 1 - bm.t : 0) + (bm.b.sun === "dawn" ? bm.t : 0);
  if (mistK > 0.05) {
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = mistK * 0.12;
      const off = ((time * (6 + i * 3) + i * 90 - camX * 0.3) % 160 + 160) % 160;
      for (let x = -160 + off; x < W; x += 160) ctx.fillRect(Math.round(x), 196 + i * 6, 110, 4);
    }
    ctx.globalAlpha = 1;
  }

  // near hills with bushes and flowers
  const nearS = camX * 0.45;
  drawLayer(ctx, nearS, 230, 7, 0.035, 2.2, P.near);
  {
    const gap = 9, first = Math.floor(nearS / gap) - 1;
    const flowers = ["#ff6a8a", "#ffe03c", "#ffffff", "#c88aff"];
    for (let k = first; k < first + W / gap + 3; k++) {
      const wx = k * gap, x = Math.round(wx - nearS), y = Math.round(ridgeY(wx, 230, 7, 0.035, 2.2) / 2) * 2;
      const h = hash(k * 11 + 1);
      if (h > 0.7) { ctx.fillStyle = P.near[1]; ctx.fillRect(x, y - 4, 6, 4); ctx.fillRect(x + 2, y - 6, 3, 2); ctx.fillStyle = P.near[2]; ctx.fillRect(x + 1, y - 2, 4, 2); }
      else if (h < 0.22 * P.flowers) { ctx.fillStyle = flowers[k & 3]; ctx.globalAlpha = 0.4 + P.flowers * 0.6; ctx.fillRect(x, y - 2, 2, 2); ctx.globalAlpha = 1; }
    }
  }

  // fireflies at night
  if (night > 0.5) {
    for (let i = 0; i < 14; i++) {
      const fx = ((hash(i * 9) * W - camX * 0.4 + Math.sin(time * 0.7 + i) * 14) % W + W) % W;
      const fy = 200 + hash(i * 4 + 1) * 26 + Math.sin(time * 1.3 + i * 2) * 4;
      const a = Math.max(0, Math.sin(time * 2.2 + i * 1.7));
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a * (night - 0.5) * 2;
      ctx.fillStyle = "#e8ff8a"; ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
      ctx.globalAlpha *= 0.35; ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 3, 3);
      ctx.restore();
    }
  }
  return bm;
}

function drawWindmill(ctx, x, y, t, tint) {
  // tinted per colour (an overlay box would also darken the sky between the sails)
  const T = (c) => lerpHex(c, tint[0], tint[1]);
  const body = T("#e8dcc4"), shade = T("#c0b090"), roof = T("#8a3e38"), K = T("#2a1a14"), sail = T("#f4ead8"), sail2 = T("#d8ccb4"), door = T("#5a3a2a");
  ctx.fillStyle = K; ctx.fillRect(Math.round(x - 7), Math.round(y - 30), 14, 30);
  ctx.fillStyle = body; ctx.fillRect(Math.round(x - 6), Math.round(y - 29), 12, 29);
  ctx.fillStyle = shade; ctx.fillRect(Math.round(x + 2), Math.round(y - 29), 4, 29);
  ctx.fillStyle = K; ctx.fillRect(Math.round(x - 8), Math.round(y - 34), 16, 5);
  ctx.fillStyle = roof; ctx.fillRect(Math.round(x - 7), Math.round(y - 33), 14, 3);
  ctx.fillStyle = door; ctx.fillRect(Math.round(x - 2), Math.round(y - 8), 4, 8);
  // turning sails
  const hx = Math.round(x), hy = Math.round(y - 26);
  for (let i = 0; i < 4; i++) {
    const a = t * 0.9 + (i * Math.PI) / 2, ca = Math.cos(a), sa = Math.sin(a);
    for (let r = 3; r < 20; r++) {
      ctx.fillStyle = r % 4 === 0 ? K : sail;
      ctx.fillRect(Math.round(hx + ca * r), Math.round(hy + sa * r), 2, 2);
      if (r > 6) { ctx.fillStyle = sail2; ctx.fillRect(Math.round(hx + ca * r - sa * 3), Math.round(hy + sa * r + ca * 3), 2, 2); }
    }
  }
  ctx.fillStyle = K; ctx.fillRect(hx - 1, hy - 1, 3, 3);
}

// ------------------------------------------------------------------ ground tiles
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

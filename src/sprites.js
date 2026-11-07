// Chicken pixel art, rebuilt cell by cell from the reference picture (16 x 18 cells, facing left there),
// plus the run / jump / glide poses, palette-swapped skins and hats. Everything is drawn into small
// canvases once and cached; the game draws the chicken 2x (one art cell = 2 x 2 screen pixels).

export const ART_W = 16, ART_H = 18, TOP = 6; // TOP: spare rows above the head for hats
export const CELL = 2;

// K outline, r/R comb, Y beak, S body, s body shade, L highlight, E eye, T/t/u tail, W/w wing, G legs
const BODY = [
  "....K.K.K.......",
  "...KrKrKrK......",
  "...KrRRRRK......",
  "..KYSSSKK..KKKKK",
  "..KRSEsK..KtTuuK",
  "...KSssK.KuTTtK.",
  "..KSSSSK.KTTTTuK",
  ".KSSSSSKKLLTTtTK",
  ".KSSSSSWWWSSTTK.",
  "KSSSSwWWWWSSSTK.",
  "KSSSSwWWWWWSLTK.",
  "KSSSSSWWWWWSSK..",
  "KsSSSSswwwSSsK..",
  ".KssSSSSSSSsK...",
  "..KKsGsssGsK....",
  "....KGKKKGK.....",
];

// the wing raised for a flap (rows 3..9, cols 5..11), drawn after the normal wing is painted over
const WING_UP = [
  "....ww.",
  "...wWWw",
  "..wWWWw",
  ".wWWWWw",
  "wWWWWw.",
  "wWWWw..",
  ".www...",
];

export const SKINS = [
  { id: "basic", name: "꼬꼬 (기본)", price: 0, pal: {} },
  { id: "white", name: "백봉", price: 200, pal: { S: "#f4f1ea", s: "#d8d2c8", L: "#ffffff", T: "#e8e4dc", t: "#bdb6ac", u: "#d6d0c6", W: "#cfc8d8", w: "#4b4058" } },
  { id: "silkie", name: "오골계", price: 400, pal: { K: "#120c14", S: "#3a3240", s: "#2a2430", L: "#54495e", T: "#2a2236", t: "#1a1422", u: "#3a2e4a", W: "#4c4060", w: "#0e0a10", E: "#ffd84a", R: "#8a2a7a", r: "#c45ab0" } },
  { id: "berry", name: "딸기우유", price: 600, pal: { S: "#ffc8d8", s: "#f0a0b8", L: "#ffe8f0", T: "#e070a0", t: "#b04878", u: "#d05890", W: "#ff9ac0", w: "#6a2040" } },
  { id: "mint", name: "민트초코", price: 800, pal: { S: "#a8ecd8", s: "#78d0b8", L: "#d8fff2", T: "#5a3a2a", t: "#3a2418", u: "#4a2e20", W: "#6a4a38", w: "#2a1810" } },
  { id: "ghost", name: "유령닭", price: 1200, alpha: 0.72, pal: { K: "#3a4a7a", S: "#d8e8ff", s: "#b0c8f0", L: "#ffffff", T: "#a0b8e8", t: "#7890c8", u: "#c0d4ff", W: "#c8d8ff", w: "#5068a0", E: "#3a4a7a", R: "#8ab0ff", r: "#c8dcff", Y: "#e8f0ff", G: "#b0c8f0" } },
  { id: "gold", name: "황금닭", price: 1500, pal: { K: "#5a3008", S: "#ffd84a", s: "#f0b020", L: "#fff3a6", T: "#e09414", t: "#a05c0c", u: "#c07010", W: "#ffe066", w: "#6a3c08", E: "#3a1a00" } },
  { id: "robot", name: "로봇닭", price: 2000, pal: { K: "#1e2230", S: "#b8c0cc", s: "#8c94a4", L: "#e0e6f0", T: "#5a6274", t: "#3a4050", u: "#4a90e0", W: "#6a7488", w: "#2a3040", E: "#5af0ff", R: "#4a90e0", r: "#8ad0ff", Y: "#ffb030", G: "#8c94a4" } },
  { id: "phoenix", name: "불사조", price: 3000, pal: { K: "#4a0a08", S: "#ff9a3a", s: "#e05a1a", L: "#ffd86a", T: "#ff4a2a", t: "#a01a0a", u: "#ffd84a", W: "#ffc040", w: "#6a1a08", R: "#ffe060", r: "#fff3a6" } },
  { id: "rainbow", name: "무지개닭", price: 5000, rainbow: true, pal: {} },
];

const BASE = { K: "#4b2424", r: "#ff816c", R: "#ff4c2d", Y: "#ffe33f", S: "#e4c0a3", s: "#e6b288", L: "#f5ddca", E: "#282828", T: "#95655a", t: "#733e33", u: "#9a5647", W: "#c49488", w: "#3f2d2c", G: "#f0b535" };

// hats: rows are relative to art row 0 (negative = above the head), in the left-facing grid
export const HATS = [
  { id: "none", name: "없음", price: 0 },
  { id: "straw", name: "밀짚모자", price: 150, row: -2, col: 0, pal: { o: "#4b2424", h: "#f0c860", d: "#c89838", b: "#e04030" },
    rows: ["...oooooo...", "..ohhhhhho..", "..obbbbbbo..", "oohhhhhhhhoo", "odddddddddd."] },
  { id: "party", name: "파티모자", price: 250, row: -6, col: 3, pal: { o: "#2a1430", a: "#ff4ab0", b: "#ffe03c", c: "#ffffff" },
    rows: ["..c...", "..o...", ".oao..", ".obo..", "oaaao.", "obbbbo", "oaaaao"] },
  { id: "crown", name: "왕관", price: 400, row: -3, col: 2, pal: { o: "#5a3008", g: "#ffd84a", d: "#e0a020", r: "#ff3a4a", c: "#3ad0ff" },
    rows: ["o.o..o.o", "ogoogogo", "ogggrggo", "ogcggcgo", "odddddo."] },
  { id: "shades", name: "선글라스", price: 300, row: 3, col: 1, pal: { o: "#111111", g: "#2a2a3a", c: "#7ad8ff" },
    rows: ["oooooooo", ".oggcgo.", "..ooooo."] },
  { id: "chef", name: "셰프모자", price: 500, row: -5, col: 2, pal: { o: "#4b4058", w: "#ffffff", g: "#d8d4e4" },
    rows: [".oo.oo..", "owwowwo.", "owwwwwwo", "owwwwgwo", ".owwwgo.", ".oggggo."] },
  { id: "viking", name: "바이킹 투구", price: 700, row: -3, col: 0, pal: { o: "#1e1c27", m: "#9d98b0", d: "#6f6a82", h: "#f4ead0" },
    rows: ["h..........h", "ho..oooo..oh", ".hommmmmmoh.", "..odddddddo."] },
  { id: "bow", name: "리본", price: 200, row: -2, col: 6, pal: { o: "#5a0a2a", p: "#ff5a9a", l: "#ffa0c8" },
    rows: ["oo.oo", "plopl", "pp.pp", "oo.oo"] },
  { id: "halo", name: "천사 고리", price: 900, row: -5, col: 2, glow: true, pal: { o: "#c89020", y: "#fff07a" },
    rows: [".oooooo.", "oyyyyyyo", ".oooooo."] },
  { id: "tophat", name: "신사 모자", price: 1100, row: -6, col: 2, pal: { o: "#0e0c12", k: "#2a2636", r: "#c02030", l: "#4a4458" },
    rows: [".oooooo.", ".okkklo.", ".okkklo.", ".okkklo.", ".orrrro.", "oooooooo"] },
];

export const TRAILS = [
  { id: "none", name: "없음", price: 0 },
  { id: "dust", name: "흙먼지", price: 0 },
  { id: "hearts", name: "하트", price: 300 },
  { id: "stars", name: "반짝별", price: 500 },
  { id: "notes", name: "음표", price: 600 },
  { id: "fire", name: "불꽃", price: 900 },
  { id: "rainbow", name: "무지개", price: 1500 },
];

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function hueShift(hex, deg) {
  let [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  h = (h + deg / 360) % 1;
  s = Math.min(1, s * 1.5 + 0.25);
  const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return rgbToHex([f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255]);
}

export function skinPalette(skin, phase = 0) {
  const pal = { ...BASE, ...(skin.pal || {}) };
  if (skin.rainbow) {
    const deg = phase * 60;
    for (const k of ["S", "s", "L", "T", "t", "u", "W"]) pal[k] = hueShift(BASE[k], deg + (k === "T" || k === "t" || k === "u" ? 120 : 0));
  }
  return pal;
}

// pose: { legs: [[dx, lift], [dx, lift]], bob, wing: "down" | "up", eye: "open" | "x" | "blink" }
function buildGrid(pose) {
  const g = [];
  for (let y = 0; y < ART_H + TOP; y++) g.push(new Array(ART_W).fill("."));
  const put = (x, y, c) => { y += TOP; if (x >= 0 && x < ART_W && y >= 0 && y < ART_H + TOP) g[y][x] = c; };
  const bob = pose.bob || 0;
  BODY.forEach((row, y) => [...row].forEach((c, x) => { if (c !== ".") put(x, y + bob, c); }));
  if (pose.wing === "up") {
    // paint the folded wing over with body, then stamp the raised wing
    for (let y = 8; y <= 12; y++) for (let x = 5; x <= 10; x++) {
      const c = BODY[y][x];
      if (c === "W" || c === "w") put(x, y + bob, y === 12 ? "s" : "S");
    }
    WING_UP.forEach((row, y) => [...row].forEach((c, x) => { if (c !== ".") put(x + 5, y + 3 + bob, c); }));
  }
  if (pose.eye === "x") { put(4, 3 + bob, "E"); put(6, 3 + bob, "E"); put(5, 4 + bob, "E"); put(4, 5 + bob, "E"); put(6, 5 + bob, "E"); }
  else if (pose.eye === "blink") put(5, 4 + bob, "s");
  // legs: shin at row 16, foot (3 wide) at row 17, or raised one row
  const hips = [5, 9];
  pose.legs.forEach(([dx, lift], i) => {
    const x = hips[i] + dx;
    if (lift) { put(x - 1, 16, "K"); put(x, 16, "K"); put(x + 1, 16, "K"); }
    else { put(x, 16, "K"); put(x - 1, 17, "K"); put(x, 17, "K"); put(x + 1, 17, "K"); }
  });
  return g;
}

export const POSES = {
  run: [
    { legs: [[-1, 0], [1, 1]], bob: 0 },
    { legs: [[0, 0], [0, 1]], bob: -1 },
    { legs: [[1, 1], [-1, 0]], bob: 0 },
    { legs: [[0, 1], [0, 0]], bob: -1 },
  ],
  jump: [{ legs: [[1, 1], [1, 1]], bob: 0, wing: "up" }],
  fall: [{ legs: [[0, 0], [0, 0]], bob: 0 }],
  glide: [{ legs: [[1, 1], [1, 1]], wing: "up" }, { legs: [[1, 1], [1, 1]], wing: "down" }],
  idle: [{ legs: [[0, 0], [0, 0]] }, { legs: [[0, 0], [0, 0]], eye: "blink" }],
  dead: [{ legs: [[1, 1], [-1, 1]], eye: "x", wing: "up" }],
};

const cache = new Map();

/** A canvas of the chicken (facing right) for a pose, skin and hat, at 1 px per art cell. */
export function chickenCanvas(poseName, frame, skinId, hatId, phase = 0) {
  const skin = SKINS.find((s) => s.id === skinId) || SKINS[0];
  const ph = skin.rainbow ? phase % 6 : 0;
  const key = `${poseName}:${frame}:${skinId}:${hatId}:${ph}`;
  let c = cache.get(key);
  if (c) return c;
  const poses = POSES[poseName], pose = poses[frame % poses.length];
  const grid = buildGrid(pose);
  const pal = skinPalette(skin, ph);
  c = document.createElement("canvas");
  c.width = ART_W; c.height = ART_H + TOP;
  const x = c.getContext("2d");
  const hat = HATS.find((h) => h.id === hatId);
  for (let y = 0; y < grid.length; y++) for (let i = 0; i < ART_W; i++) {
    const ch = grid[y][i];
    if (ch === ".") continue;
    x.fillStyle = pal[ch];
    x.fillRect(ART_W - 1 - i, y, 1, 1); // mirror: face right
  }
  if (hat && hat.rows) {
    const bob = pose.bob || 0;
    hat.rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (ch === ".") return;
      x.fillStyle = hat.pal[ch];
      x.fillRect(ART_W - 1 - (hat.col + rx), TOP + hat.row + ry + bob, 1, 1);
    }));
  }
  cache.set(key, c);
  return c;
}

/** Draws the chicken with its feet at (x, y) in screen pixels, scaled by CELL. */
let glintTmp = null;
function glintCanvas(src, t) {
  // a diagonal two-cell band crossing the body every 1.6 s, then a pause
  const period = 1.6, f = (t % period) / period;
  if (f > 0.55) return null;
  if (!glintTmp) glintTmp = document.createElement("canvas");
  glintTmp.width = src.width; glintTmp.height = src.height;
  const x = glintTmp.getContext("2d");
  x.clearRect(0, 0, src.width, src.height);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = "rgba(255,255,230,0.85)";
  const pos = -6 + (f / 0.55) * (src.width + 12);
  for (let y = 0; y < src.height; y++) x.fillRect(Math.round(pos - y * 0.5), y, 2, 1);
  x.globalCompositeOperation = "source-over";
  return glintTmp;
}

export function drawChicken(ctx, poseName, frame, skinId, hatId, x, y, opts = {}) {
  const skin = SKINS.find((s) => s.id === skinId) || SKINS[0];
  const c = chickenCanvas(poseName, frame, skinId, hatId, opts.phase || 0);
  const k = opts.scale || CELL;
  const w = ART_W * k, h = (ART_H + TOP) * k;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (skin.alpha) ctx.globalAlpha *= skin.alpha;
  if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
  ctx.translate(Math.round(x), Math.round(y + (opts.dy || 0)));
  if (opts.rot) ctx.rotate(opts.rot);
  if (opts.sx || opts.sy) ctx.scale(opts.sx || 1, opts.sy || 1);
  // skin overlays (cosmetic): a warm aura behind the body
  if (opts.aura) {
    // normal blending, so it stays a warm haze on a bright sky instead of blowing out to white
    ctx.save(); ctx.fillStyle = opts.aura;
    const pulse = 1 + Math.sin((opts.time || 0) * 9) * 0.06;
    ctx.beginPath(); ctx.ellipse(-1 * k, -10 * k, 11 * k * pulse, 12 * k * pulse, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-1 * k, -10 * k, 8 * k * pulse, 9 * k * pulse, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  if (opts.flash) ctx.filter = "brightness(3)";
  ctx.drawImage(c, -w / 2, -h, w, h);
  ctx.filter = "none";
  const pose = (POSES[poseName] || POSES.run)[frame % (POSES[poseName] || POSES.run).length];
  // a gloss band sweeping across the body, clipped to the sprite
  if (opts.glint !== undefined) {
    const g = glintCanvas(c, opts.glint);
    if (g) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.drawImage(g, -w / 2, -h, w, h); ctx.restore(); }
  }
  // glowing eyes (the eye sits at art cell (10, 4) once mirrored, below the hat rows)
  if (opts.eye && pose.eye !== "x" && pose.eye !== "blink") {
    const ex = -w / 2 + 10 * k + k / 2, ey = -h + (TOP + 4 + (pose.bob || 0)) * k + k / 2;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.35 + Math.sin((opts.time || 0) * 5) * 0.1; ctx.fillStyle = opts.eye;
    ctx.beginPath(); ctx.arc(ex, ey, 3.2 * k, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillRect(Math.round(ex - k / 2), Math.round(ey - k / 2), k, k);
    ctx.restore();
  }
  ctx.restore();
  const hat = HATS.find((hh) => hh.id === hatId);
  if (hat && hat.glow) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#fff07a";
    ctx.beginPath();
    ctx.ellipse(Math.round(x) - 2, Math.round(y) - h + (TOP - 4) * k, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---------- props: obstacles, platforms, items (small hand-made pixel art) ----------

function sprite(rows, pal) {
  const c = document.createElement("canvas");
  c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext("2d");
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== ".") { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
  return c;
}

let props = null;
export function getProps() {
  if (props) return props;
  const wood = { o: "#3a2214", a: "#a86a38", b: "#7a4a24", c: "#d08c4a", n: "#2a180e" };
  props = {
    // ground obstacles, drawn 2x like the chicken (one cell = 2 x 2 px), with a dark outline
    fence: sprite([
      "KK......KK",
      "KLK....KLK",
      "KNKKKKKKNK",
      "KNLLLLLLNK",
      "KNnnnnnnNK",
      "KNKKKKKKNK",
      "KNK....KNK",
      "KNKKKKKKNK",
      "KNLLLLLLNK",
      "KNnnnnnnNK",
      "KNKKKKKKNK",
      "KnK....KnK",
    ], { K: "#2a160c", N: "#c8844a", n: "#8a5428", L: "#f0b878" }),
    crate: sprite([
      "KKKKKKKKK",
      "KLLLLLLnK",
      "KLKnNNKnK",
      "KLnKNKnnK",
      "KLNNKNNnK",
      "KLnKNKnnK",
      "KLKnNNKnK",
      "KnnnnnnnK",
      "KKKKKKKKK",
    ], { K: "#2a160c", N: "#c8844a", n: "#8a5428", L: "#f0b878" }),
    hay: sprite([
      ".KKKKKKKKK.",
      "KLLYLYYLYYK",
      "KYLYYRYYLYK",
      "KYYYYRYYYyK",
      "KLYyYRYLYyK",
      "KYYYYRYYyyK",
      "KyYyYRyYyyK",
      ".KKKKKKKKK.",
    ], { K: "#4a2a08", Y: "#f4cc50", y: "#c89828", L: "#fff4b0", R: "#b0402a" }),
    // a bramble: purple stems, bone-white thorns and red berries, so it stands out on the grass
    thorns: sprite([
      "..T.....T...",
      ".KSK..T.KSK.",
      "TKSSKKSKSSKT",
      "KSSRSKSSSSSK",
      "KSsSSSSRSsSK",
      "TKSSsSSSSSKT",
      "KSsSSRSSsSSK",
      ".KKKKKKKKKK.",
    ], { K: "#1a0e14", S: "#9a4a86", s: "#5e2852", T: "#fff4dc", R: "#ff3a4a" }),
    crow: [
      sprite([
        "......ooo.....",
        ".....okkko....",
        "....okkekyy...",
        "oo.okkkkkoo...",
        "okookkkkko....",
        ".okkkkkkko....",
        "..okkkkkko....",
        "...ooooo......",
      ], { o: "#0a0810", k: "#2a2438", e: "#ff3040", y: "#ffb020" }),
      sprite([
        "..ooooo.ooo...",
        ".okkkkkokkko..",
        "..okkkkkkekyy.",
        "...okkkkkkoo..",
        "....okkkkko...",
        ".....ooooo....",
        "..............",
        "..............",
      ], { o: "#0a0810", k: "#2a2438", e: "#ff3040", y: "#ffb020" }),
    ],
    spring: [
      sprite([
        "oooooooooooo",
        "orrrrrrrrrro",
        "oooooooooooo",
        "..o.o..o.o..",
        "...o.oo.o...",
        "..o.o..o.o..",
        "oooooooooooo",
        "ommmmmmmmmmo",
      ], { o: "#1e1c27", r: "#ff4a4a", m: "#9d98b0" }),
      sprite([
        "oooooooooooo",
        "orrrrrrrrrro",
        "oooooooooooo",
        "..o.o..o.o..",
        ".o.o.oo.o.o.",
        "o.o.o..o.o.o",
        "..o.o..o.o..",
        ".o.o.oo.o.o.",
        "o.o.o..o.o.o",
        "..o.o..o.o..",
        "...o.oo.o...",
        "oooooooooooo",
        "ommmmmmmmmmo",
      ], { o: "#1e1c27", r: "#ff4a4a", m: "#9d98b0" }),
    ],
    egg: sprite([
      "...oooo...",
      "..oyyhyo..",
      ".oyyyyhyo.",
      ".oyyyyyyo.",
      "oyydyyyyyo",
      "oyyyyydyyo",
      "oyyyyyyyyo",
      "odyyyyyydo",
      ".oddyyddo.",
      "..oooooo..",
    ], { o: "#5a3008", y: "#ffd84a", h: "#fff8d0", d: "#e0a020" }),
    rocket: sprite([
      "....oo....",
      "...owwo...",
      "..owrrwo..",
      "..owwwwo..",
      "..owccwo..",
      "..owccwo..",
      "..owwwwo..",
      ".orwwwwro.",
      "orrowworro",
      "oo.oyyo.oo",
      "....yy....",
    ], { o: "#1e1c27", w: "#e8e8f0", r: "#ff4a3a", c: "#3ac0ff", y: "#ffc23d" }),
    magnet: sprite([
      ".oooo..oooo.",
      "orrrro.orrro",
      "orrro...orro",
      "orro.....rro",
      "orro.....rro",
      "orro.....rro",
      "orrro...orro",
      ".orrrooorro.",
      "..orrrrrro..",
      "...oooooo...",
    ].map((r) => r), { o: "#1e1c27", r: "#ff3a4a" }),
  };
  // the magnet's tips are silver
  const mx = props.magnet.getContext("2d");
  mx.fillStyle = "#d8d8e8"; mx.fillRect(1, 1, 3, 2); mx.fillRect(8, 1, 3, 2);
  return props;
}

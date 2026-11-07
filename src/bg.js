// Painted backdrops, generated once per scene into 320x180 canvases: region battlefields and the farm.
import { W, H } from "./engine.js";
import { REGIONS } from "./data.js";
import { mix } from "./sprites.js";

const cache = new Map();
const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** sky in bands, dithered where they meet */
function sky(x, cols, y0, y1) {
  const n = cols.length;
  for (let y = y0; y < y1; y++) {
    const f = ((y - y0) / (y1 - y0)) * (n - 1), i = Math.floor(f), k = f - i;
    for (let X = 0; X < W; X++) {
      const th = (BAYER[(y % 4) * 4 + (X % 4)] + 0.5) / 16;
      x.fillStyle = cols[Math.min(n - 1, k > th ? i + 1 : i)];
      x.fillRect(X, y, 1, 1);
    }
  }
}
function cloud(x, cx, cy, s, col, sh) {
  for (const [dx, dy, r] of [[0, 0, 5], [6, -2, 6], [12, 0, 5], [5, 2, 5], [-5, 2, 3], [17, 2, 3]]) {
    disc(x, cx + dx * s, cy + dy * s + 1, r * s, sh);
    disc(x, cx + dx * s, cy + dy * s, r * s, col);
  }
}
function disc(x, cx, cy, r, col) {
  x.fillStyle = col;
  for (let y = -Math.ceil(r); y <= r; y++) {
    const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
    x.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}
function hills(x, base, amp, col, freq, ph) {
  x.fillStyle = col;
  for (let X = 0; X < W; X++) {
    const h = Math.round(base - amp * (0.5 + 0.5 * Math.sin(X * freq + ph)) - amp * 0.35 * Math.sin(X * freq * 2.7 + ph * 2));
    x.fillRect(X, h, 1, H - h);
  }
}
function tree(x, tx, ty, s, leaf, leafD, trunk) {
  x.fillStyle = trunk;
  x.fillRect(Math.round(tx), Math.round(ty - 4 * s), Math.max(1, Math.round(2 * s)), Math.round(5 * s));
  disc(x, tx + s, ty - 8 * s, 5 * s, leafD);
  disc(x, tx + s - 1, ty - 9 * s, 4.2 * s, leaf);
  x.fillStyle = mix(leaf, "#ffffff", 0.25);
  x.fillRect(Math.round(tx - 2 * s), Math.round(ty - 11 * s), Math.round(2 * s), 1);
}
function pine(x, tx, ty, s, leaf, leafD) {
  for (let i = 0; i < 4; i++) {
    const w = (6 - i * 1.3) * s, y = ty - i * 4 * s;
    x.fillStyle = i % 2 ? leaf : leafD;
    for (let j = 0; j < 5 * s; j++) x.fillRect(Math.round(tx - w * (j / (5 * s))), Math.round(y - j), Math.round(w * 2 * (j / (5 * s))) + 1, 1);
  }
  x.fillStyle = "#4a2e1e";
  x.fillRect(Math.round(tx), Math.round(ty), 1, 2);
}
function house(x, hx, hy, s, wall, roof) {
  const w = Math.round(14 * s), h = Math.round(9 * s);
  x.fillStyle = "#2a1a1a"; x.fillRect(hx - 1, hy - h - 1, w + 2, h + 2);
  x.fillStyle = wall; x.fillRect(hx, hy - h, w, h);
  x.fillStyle = mix(wall, "#000000", 0.2); x.fillRect(hx + w - 3, hy - h, 3, h);
  for (let j = 0; j < 7 * s; j++) { x.fillStyle = j === 0 ? "#2a1a1a" : roof; x.fillRect(Math.round(hx - 2 + j), Math.round(hy - h - j), Math.max(0, w + 4 - j * 2), 1); }
  x.fillStyle = "#3a2a2a"; x.fillRect(hx + Math.round(w * 0.35), hy - Math.round(5 * s), Math.round(3 * s), Math.round(5 * s));
  x.fillStyle = "#ffe8a0"; x.fillRect(hx + 2, hy - h + 2, 2, 2); x.fillRect(hx + w - 5, hy - h + 2, 2, 2);
}
function tower(x, tx, ty, h, wall, roof, glow) {
  x.fillStyle = "#1a1228"; x.fillRect(tx - 6, ty - h - 1, 13, h + 1);
  x.fillStyle = wall; x.fillRect(tx - 5, ty - h, 11, h);
  x.fillStyle = mix(wall, "#000000", 0.3); x.fillRect(tx + 2, ty - h, 4, h);
  for (let j = 0; j < 14; j++) { x.fillStyle = roof; x.fillRect(tx - 7 + Math.round(j / 2), ty - h - j, 15 - j, 1); }
  for (let k = 0; k < h - 10; k += 9) { x.fillStyle = glow; x.fillRect(tx - 1, ty - h + 6 + k, 2, 3); }
}
function castle(x, cx, ty, wall, roof) {
  x.fillStyle = "#3a2018"; x.fillRect(cx - 41, ty - 31, 82, 32);
  x.fillStyle = wall; x.fillRect(cx - 40, ty - 30, 80, 30);
  for (let i = -40; i < 40; i += 6) { x.fillStyle = wall; x.fillRect(cx + i, ty - 34, 4, 4); }
  for (const tx of [cx - 40, cx + 30]) {
    x.fillStyle = mix(wall, "#000000", 0.15); x.fillRect(tx, ty - 46, 10, 46);
    for (let j = 0; j < 10; j++) { x.fillStyle = roof; x.fillRect(tx - 1 + Math.round(j / 2), ty - 46 - j, 12 - j, 1); }
  }
  x.fillStyle = "#3a2018"; x.fillRect(cx - 7, ty - 16, 14, 16);
  x.fillStyle = "#ffd84a"; x.fillRect(cx - 2, ty - 58, 4, 12); x.fillRect(cx - 6, ty - 56, 12, 2);
}
function ground(x, top, cols) {
  for (let y = top; y < H; y++) for (let X = 0; X < W; X++) {
    const n = (Math.sin(X * 0.21 + y * 0.9) + Math.sin(X * 0.07 - y * 0.33) * 1.3) * 0.5;
    x.fillStyle = y === top ? mix(cols[0], "#ffffff", 0.25) : n > 0.6 ? cols[0] : n < -0.5 ? cols[2] : cols[1];
    x.fillRect(X, y, 1, 1);
  }
  for (let i = 0; i < 90; i++) {
    const X = Math.floor(rnd() * W), Y = top + 3 + Math.floor(rnd() * (H - top - 3));
    x.fillStyle = mix(cols[0], "#ffffff", 0.35);
    x.fillRect(X, Y, 1, 1); x.fillRect(X - 1, Y + 1, 1, 1); x.fillRect(X + 1, Y + 1, 1, 1);
  }
}

export function regionBG(id) {
  const key = "r" + id;
  if (cache.has(key)) return cache.get(key);
  seed = 17 + id * 101;
  const R = REGIONS[id], c = mk(), x = c.getContext("2d");
  sky(x, R.sky, 0, 100);
  if (id === 2) for (let i = 0; i < 40; i++) { x.fillStyle = rnd() > 0.7 ? "#ffffff" : "#c8b8ff"; x.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * 70), 1, 1); }
  else for (let i = 0; i < 4; i++) cloud(x, 20 + i * 85 + rnd() * 20, 18 + rnd() * 26, 0.8 + rnd() * 0.5, mix(R.sky[2], "#ffffff", 0.6), mix(R.sky[1], "#ffffff", 0.2));
  hills(x, 82, 12, R.hill[0], 0.025, id);
  const deco = R.deco;
  if (deco === "village") { house(x, 40, 88, 1, "#f0e0c0", "#c8503a"); house(x, 230, 86, 1.2, "#e8d8b8", "#5a7ac8"); house(x, 270, 90, 0.9, "#f0e0c0", "#c8503a"); for (let i = 0; i < 6; i++) tree(x, 90 + i * 24 + rnd() * 8, 92, 0.9, "#5ab05a", "#3a8a4a", "#6a4a2a"); }
  if (deco === "forest") for (let i = 0; i < 22; i++) pine(x, i * 15 + rnd() * 6, 90 + rnd() * 6, 1 + rnd() * 0.6, "#2a7a4a", "#1a5a3a");
  if (deco === "tower") { tower(x, 250, 96, 70, "#5a4a7a", "#3a2a6a", "#ffe07a"); tower(x, 60, 92, 40, "#4a3e6a", "#3a2a6a", "#c684ff"); }
  if (deco === "castle") castle(x, 230, 94, "#e8c8a0", "#c8343a");
  hills(x, 96, 6, R.hill[1], 0.04, id * 3);
  ground(x, 98, R.ground);
  // a path along the field
  x.fillStyle = mix(R.ground[1], "#e8d0a0", 0.35);
  for (let X = 0; X < W; X++) { const y = 150 + Math.round(Math.sin(X * 0.03) * 2); x.fillRect(X, y, 1, 6); }
  cache.set(key, c);
  return c;
}

export function farmBG() {
  if (cache.has("farm")) return cache.get("farm");
  seed = 4242;
  const c = mk(), x = c.getContext("2d");
  sky(x, ["#7ac8f0", "#a8dcf4", "#d8f0fa"], 0, 60);
  for (let i = 0; i < 3; i++) cloud(x, 30 + i * 110 + rnd() * 30, 12 + rnd() * 14, 0.9, "#ffffff", "#c8e4f4");
  hills(x, 50, 8, "#6ab860", 0.03, 2);
  for (let i = 0; i < 9; i++) tree(x, 10 + i * 38 + rnd() * 10, 56, 0.9 + rnd() * 0.3, "#5ab05a", "#3a8a4a", "#6a4a2a");
  ground(x, 56, ["#8ad06a", "#76c05a", "#62a84a"]);
  // the coop house
  const hx = 14, hy = 70;
  x.fillStyle = "#2a1a1a"; x.fillRect(hx - 1, hy - 17, 40, 19);
  x.fillStyle = "#c86a3a"; x.fillRect(hx, hy - 16, 38, 17);
  for (let i = 0; i < 38; i += 4) { x.fillStyle = "#a8522a"; x.fillRect(hx + i, hy - 16, 1, 17); }
  for (let j = 0; j < 12; j++) { x.fillStyle = j === 0 ? "#2a1a1a" : j % 3 ? "#e8d8b0" : "#c8b890"; x.fillRect(hx - 3 + j, hy - 16 - j, 44 - j * 2, 1); }
  x.fillStyle = "#2a1a1a"; x.fillRect(hx + 15, hy - 10, 9, 11);
  x.fillStyle = "#4a2a1a"; x.fillRect(hx + 16, hy - 9, 7, 10);
  x.fillStyle = "#ffe07a"; x.fillRect(hx + 4, hy - 12, 4, 3); x.fillRect(hx + 30, hy - 12, 4, 3);
  // straw piles
  for (const [sx, sy] of [[60, 66], [292, 72]]) { disc(x, sx, sy, 6, "#c8a040"); disc(x, sx - 1, sy - 1, 5, "#f0d070"); }
  cache.set("farm", c);
  return c;
}

/** fence: a row of posts and two rails from (x0, y) to (x1, y) */
export function fence(ctx, x0, y, x1) {
  ctx.fillStyle = "#6a4024";
  ctx.fillRect(x0, y - 5, x1 - x0, 1);
  ctx.fillRect(x0, y - 2, x1 - x0, 1);
  ctx.fillStyle = "#c89060";
  ctx.fillRect(x0, y - 6, x1 - x0, 1);
  ctx.fillRect(x0, y - 3, x1 - x0, 1);
  for (let X = x0; X <= x1; X += 10) {
    ctx.fillStyle = "#3e2414"; ctx.fillRect(X - 1, y - 9, 4, 10);
    ctx.fillStyle = "#e0a870"; ctx.fillRect(X, y - 8, 2, 8);
  }
}

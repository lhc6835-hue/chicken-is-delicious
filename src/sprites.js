// Procedural pixel sprites: chickens (facing right), heroes (facing left), eggs and icons, built once into
// small canvases and cached. Every sprite knows its anchor: the point between its feet.
import { SP, EGG } from "./data.js";

const cache = new Map();
const mkc = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

// ---------- color helpers ----------
const hexv = (h) => {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const tohex = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
export const mix = (a, b, t) => { const A = hexv(a), B = hexv(b); return tohex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
const INK = "#1a1020";

/** A pixel grid of color strings (null = empty), turned into a canvas. */
class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.c = new Array(w * h).fill(null);
    this.tag = new Array(w * h).fill(0); // 1 = part of the silhouette that gets outlined
  }
  set(x, y, col, tag = 1) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !col) return;
    this.c[y * this.w + x] = col;
    this.tag[y * this.w + x] = tag;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.c[y * this.w + x];
  }
  filled(x, y) { return this.get(x, y) !== null; }
  /** fill an ellipse, color by fn(dx, dy) where dx, dy are -1..1 */
  ellipse(cx, cy, rx, ry, fn, tag = 1) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++)
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, typeof fn === "function" ? fn(dx, dy, x, y) : fn, tag);
      }
  }
  rect(x, y, w, h, col, tag = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, typeof col === "function" ? col(i, j) : col, tag);
  }
  rows(x, y, rows, pal, tag = 1) {
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== "." && pal[ch]) this.set(x + i, y + j, pal[ch], tag); }));
  }
  line(x0, y0, x1, y1, col, tag = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), col, tag);
  }
  /** dark rim round everything tagged 1 */
  outline(col) {
    const add = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.filled(x, y)) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const i = (y + dy) * this.w + (x + dx);
          if (x + dx >= 0 && y + dy >= 0 && x + dx < this.w && y + dy < this.h && this.c[i] && this.tag[i] === 1) { add.push([x, y]); break; }
        }
      }
    for (const [x, y] of add) this.set(x, y, col, 2);
  }
  canvas() {
    const cv = mkc(this.w, this.h), ctx = cv.getContext("2d"), img = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.c.length; i++) {
      const col = this.c[i];
      if (!col) continue;
      const [r, g, b] = hexv(col);
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

function silhouette(cv, col) {
  const s = mkc(cv.width, cv.height), x = s.getContext("2d");
  x.drawImage(cv, 0, 0);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = col;
  x.fillRect(0, 0, s.width, s.height);
  return s;
}
function finish(g, ax, ay) {
  const cv = g.canvas();
  return { cv, w: g.w, h: g.h, ax, ay, flash: silhouette(cv, "#ffffff"), dark: silhouette(cv, "#140e1c"), red: silhouette(cv, "#ff3a3a") };
}

// ---------- chickens ----------
// Hand-placed pixel templates in a chunky rooster style: warm dark outline, separate head, three-spike
// comb, a dark wing patch and a tall tail. Facing right. Letters are palette slots.
const ROOSTER = [
  "...........o.o.o..",
  "..........ocococo.",
  ".ooo......occcCCo.",
  "otttoo...olbbbbbo.",
  "otuutto.olbbbebbkk",
  "ottuuttoolbbbbbbko",
  "otuuuttoolbbbbrro.",
  "ottuuttbbbbbbbrro.",
  "ottuutbbbbbbbbbo..",
  ".otttbwwwwbbbbbbo.",
  ".ottbwvvvwwbbbbbo.",
  ".otbbwwvvvwlbbbbo.",
  ".obbbbwwwwllbbbo..",
  "..obbsbbbllllbso..",
  "...ossssllllsso...",
  "....ooogoooogooo..",
];
const ROOSTER_LEGS = [
  ["......ogo..ogo....", "......ffff..ffff.."], // stand
  [".....ogo....ogo...", ".....fff.....ffff."], // step
  ["......ffff..ffff..", ".................."], // tuck (mid-hop)
];
const CHICK = [
  "....oooo....",
  "...ollbbo...",
  "..olbbbbbo..",
  "..olbbbebkk.",
  "..olbbbbbko.",
  ".olbbwwbbbo.",
  ".obbwvwbbbo.",
  ".obbbwwbbbo.",
  ".osbbbbbbso.",
  "..osssssso..",
  "...oogoogo..",
];
const CHICK_LEGS = [
  ["....ogoogo..", ".....ff.ff.."],
  ["...ogo..ogo.", "....ff...ff."],
  [".....ffff...", "............"],
];

// per species: body, light (belly, lit face), shade, wing, wing light, tail, tail light
const CPAL = {
  kkokko: ["#f6f0e4", "#ffffff", "#d4c8b4", "#e0d4c0", "#ffffff", "#b8aca0", "#e8e0d4"],
  chick: ["#ffe04a", "#fff6b0", "#e0a820", "#f0c030", "#fff0a0"],
  brown: ["#e8b48a", "#f8d8b8", "#c88a62", "#8a4a30", "#b87a5a", "#7a3a2a", "#a85a44"],
  fire: ["#ff7a40", "#ffb070", "#d84a24", "#b8301c", "#ff8a50", "#ffcc3a", "#fff08a"],
  ice: ["#d8f0ff", "#ffffff", "#9ac8ec", "#6aa8d8", "#c8ecff", "#4a88c8", "#8ac8f4"],
  shield: ["#e8dcc8", "#fff6e8", "#c0b098", "#a08a6a", "#d0bc9c", "#6a5a4a", "#9a8a74"],
  sling: ["#f0d4a0", "#fff0d0", "#c8a070", "#a87a4a", "#d8aa78", "#5a7a3a", "#8ab05a"],
  thunder: ["#6a7ac0", "#9aa8e8", "#4a5a98", "#323e70", "#5a6aa8", "#ffe04a", "#fff6a0"],
  priest: ["#fffaf0", "#ffffff", "#e0d4bc", "#f0e8d8", "#ffffff", "#ffd870", "#fff0b0"],
  ninja: ["#4a4458", "#6a6480", "#2e2a3a", "#2a2434", "#4a4458", "#1e1a28", "#3a3448"],
  knight: ["#f0ece4", "#ffffff", "#c8c0b0", "#a8a094", "#e0dcd4", "#c83a3a", "#ff6a5a"],
  archmage: ["#8a5ad0", "#b088f0", "#6a3aa8", "#4a2480", "#7a4ac0", "#3a1a6a", "#6a3aa8"],
  silkie: ["#3a3242", "#5a5068", "#241e2c", "#2a2434", "#4a4058", "#2a2434", "#4a4058"],
  phoenix: ["#ffd040", "#fff4a0", "#e09a20", "#ff7a2a", "#ffb050", "#ff4a2a", "#ffa03a"],
  dragon: ["#4ac888", "#8ae8b0", "#2a9a5a", "#1e7a4a", "#3ab070", "#1e6a40", "#2a9a5a"],
  steam: ["#d0dce8", "#ffffff", "#9aa8b8", "#7a8898", "#b0bccc", "#c89a3a", "#e8c060"],
  storm: ["#ff8a3a", "#ffc080", "#d85a20", "#7a3acc", "#a06ae8", "#ffe04a", "#fff6a0"],
  paladin: ["#fff4d8", "#ffffff", "#e0c890", "#ffd870", "#fff0b0", "#5ab0f4", "#a8dcff"],
};

const PADX = 3, PADY = 9; // room round the template for hats, halos and plumes

/** frame: 0 stand, 1 step, 2 tuck (mid-hop) */
export function chicken(id, frame = 0) {
  const key = `c:${id}:${frame}`;
  if (cache.has(key)) return cache.get(key);
  const s = SP[id], chick = s.acc === "chick";
  const P = CPAL[id] ?? CPAL.kkokko;
  const out = mix(P[2], "#1a0808", 0.68);
  const combCol = typeof s.comb === "string" && s.comb.startsWith("#") ? s.comb : "#e8343a";
  const pal = {
    o: out, b: P[0], l: P[1], s: P[2], w: P[3], v: P[4], t: P[5] ?? P[3], u: P[6] ?? P[4],
    c: combCol, C: mix(combCol, "#ffb040", 0.55), k: "#ffc83a", e: "#1a1020", r: combCol, g: "#ffb43a", f: out,
  };
  const body = chick ? CHICK : ROOSTER, legs = (chick ? CHICK_LEGS : ROOSTER_LEGS)[frame];
  const tw = body[0].length, th = body.length + 2;
  const g = new Grid(tw + PADX * 2, th + PADY + 1);
  const X = PADX, Y = PADY;
  g.rows(X, Y, body, pal);
  g.rows(X, Y + body.length, legs, pal);
  if (!chick) accessory(g, s, X, Y, pal, out);
  else { g.set(X + 5, Y - 1, out); g.set(X + 6, Y - 2, out); g.set(X + 6, Y - 1, P[1]); }
  const spr = finish(g, X + (chick ? 6 : 10), Y + th);
  spr.head = chick ? [1, -th + 1] : [3, -th + 2];
  cache.set(key, spr);
  return spr;
}

/** clear the comb (rows 0..2 above the head) and close the head top, so another headpiece can go there */
function clearComb(g, X, Y, out) {
  for (let y = 0; y <= 2; y++) for (let x = 10; x <= 16; x++) { const i = (Y + y) * g.w + X + x; g.c[i] = null; g.tag[i] = 0; }
  for (let x = 10; x <= 15; x++) g.set(X + x, Y + 2, out);
}

function accessory(g, s, X, Y, pal, out) {
  const o = out;
  const put = (rows, x, y, P) => g.rows(X + x, Y + y, rows, { o, ...P });
  const comb = s.comb;
  const replaceComb = (rows, x, y, P) => { clearComb(g, X, Y, o); put(rows, x, y, P); };
  if (comb === "flame") replaceComb(["...y.y.", "..yoyry", ".oyrrro", "oyrrrro", ".orrro."], 10, -3, { y: "#fff08a", r: "#ff8a2a" });
  else if (comb === "bolt") replaceComb(["....oo.", "...oyo.", "..oyyo.", ".oyyyyo", "..oyyo.", ".oyo...", ".oo...."], 10, -4, { y: "#ffe84a" });
  else if (comb === "spikes") replaceComb(["..o.o.o", ".ogogog", "oggggg."], 10, -1, { g: "#8ae8b0" });

  switch (s.acc) {
    case "ice":
      put(["..o..", ".owo.", "owbwo", ".obo.", "..o.."], -1, -1, { w: "#ffffff", b: "#8ad8ff" });
      break;
    case "shield":
      put([".oooo.", "ommmmo", "omhmmo", "omyymo", "ommmmo", "ommmmo", ".oooo."], 12, 8, { m: "#a8b0c0", h: "#ffffff", y: "#ffd84a" });
      break;
    case "band":
      for (let x = 9; x <= 15; x++) g.set(X + x, Y + 3, "#e8343a");
      put(["rr", ".rr", "..r"], 6, 3, { r: "#e8343a" });
      break;
    case "tuft":
      put([".o.", "oyo", ".o."], 0, 1, { y: "#fff6a0" });
      break;
    case "halo":
      put([".oooooo.", "oyyyyyyo", ".oooooo."], 9, -5, { y: "#ffe070" });
      break;
    case "mask":
      for (let x = 9; x <= 15; x++) g.set(X + x, Y + 4, "#14101c");
      g.set(X + 13, Y + 4, "#ffffff");
      put(["rrr.", ".rrrr", "..rr"], 4, 5, { r: "#e8343a" });
      break;
    case "helm": {
      // a steel helmet over the head, a visor slit with the eye in it, and a red plume where the comb was
      clearComb(g, X, Y, o);
      put(["...ooooo..", "..ommmmmo.", ".omhhmmmmo", ".ommmmmmmo", ".oddddeddo", ".ommmmmmo."], 8, 1, { m: "#c8cedc", h: "#ffffff", d: "#20202c", e: "#ffd84a" });
      put(["..oo...", ".orro..", "orrrro.", ".orrrro"], 10, -3, { r: "#e8343a" });
      break;
    }
    case "holyhelm":
      clearComb(g, X, Y, o);
      put(["...ooooo..", "..ommmmmo.", ".omhhmmmmo", ".ommmmmmmo", ".oddddeddo", ".ommmmmmo."], 8, 1, { m: "#ffe070", h: "#ffffff", d: "#5a3a0c", e: "#5ab0f4" });
      put(["oo.....", "owwo...", ".owwwo.", "..owwwo", "...ooo."], 4, -1, { w: "#ffffff" });
      break;
    case "wizard":
      clearComb(g, X, Y, o);
      put(["......oo.", ".....opo.", "....oppo.", "...opppo.", "...opypo.", "..oppppo.", ".opppppo.", "ooddddddoo"], 7, -6, { p: "#5a3aa0", y: "#ffe84a", d: "#3a2470" });
      break;
    case "crown":
      replaceComb(["o.o.o.o", "oyoyoyo", "oyyryyo", "ooooooo"], 9, -1, { y: "#ffd84a", r: "#ff4a6a", b: "#5ab0f4" });
      break;
    case "horns":
      put(["oo.....", "owo....", ".owo...", "..oo..."], 6, -2, { w: "#f4ecd8" });
      break;
    case "pipe":
      put(["oooo", "obbo", ".od.", ".od."], 5, 4, { b: "#e8c060", d: "#8a6a2a" });
      break;
    case "fluff":
      replaceComb(["..ooo..", ".ollco.", "olllllo", ".olllo."], 10, -1, { l: pal.l, c: "#7a3a8a" });
      break;
  }
}

// ---------- heroes ----------
// Simple chibi people facing left: a solid black outline, a face that is only two black eyes framed by
// hair, and a plain block of a body (tunic with a belt, or a long robe with a fold line), no arms. The
// weapon is part of the sprite: frame 0 holds it at rest, 1 is a step, 2 is the strike pose.
const HEAD = [
  "...oooooo...",
  "..ohhhhhhho.",
  ".ohHhhhhhhho",
  ".ohhhhhhhhho",
  ".ossssshhhho",
  ".oseseshhhho",
  ".oseseshhhho",
  ".osssssShhho",
  "..ooooooooo.",
];
const TUNIC = ["..occcccCCo.", ".occccccCCCo", ".ottttttttto", ".occccccCCCo", "..oooooooo.."];
const TUNIC_FEET = [["..obo..obo..", "..ooo..ooo.."], [".obo....obo.", ".ooo....ooo."]];
const ROBE = ["..occcFcCCo.", ".occccFcCCCo", ".occccFcCCCo", ".occccFcCCCo", ".occccFcCCCo", ".occccFcCCCo"];
const ROBE_HEM = [[".oooooooooo."], ["..oooooooooo"]];
const BIG = [
  "....oooooooo....",
  "...ohhhhhhhho...",
  "..ohHHhhhhhhhho.",
  ".ohhhhhhhhhhhhho",
  ".ohhhhhhhhhhhhho",
  ".osssssssshhhhho",
  ".ossesssesshhhho",
  ".ossesssesshhhho",
  ".ossssssssShhhho",
  "..osssssssShhho.",
  "...oooooooooo...",
  "..occccccccCCoko",
  ".occccccccCCCoko",
  ".occccccccCCCoko",
  ".ottttttttttCoko",
  ".occccccccCCCoko",
  ".occccccccCCCoko",
  ".occccccccCCCoko",
  "..ooooooooooooo.",
];
const BIG_FEET = [["...obbo...obbo..", "...oooo...oooo.."], ["..obbo.....obbo.", "..oooo.....oooo."]];

// weapons as pixel rows, at [x, y] from the template's top-left; [rest, strike]
const W_PAL = { m: "#a8b0c0", M: "#eef2fa", g: "#ffd84a", w: "#8a5a3a", W: "#b8844a", s: "#e8e0d0", A: "#c8a070" };
const WEAPONS = {
  sword: [[-2, 4, [".M.", ".M.", "mM.", "mM.", "ggg", ".w."]], [-9, 9, ["......g..", "MMMMMMMgw", "......g.."]]],
  dagger: [[-1, 8, [".M", "mM", "g."]], [-6, 10, ["MMMMgw"]]],
  bow: [[-3, 6, [".W.", "W.s", "W.s", "W.s", "W.s", ".W."]], [-6, 6, ["..W...", ".W.s..", "AAAAAM", ".W.s..", "..W..."]]],
  mace: [[-3, 5, [".mm.", "mMMm", ".mm.", "..w.", "..w.", "..w."]], [-8, 8, [".mm.....", "mMMmwwww", ".mm....."]]],
  staff: [[-2, -2, [".x.", "xXx", ".x.", ".w.", ".w.", ".w.", ".w.", ".w.", ".w.", ".w.", ".w.", ".w.", ".w.", ".w."]], [-8, 1, ["xx.......", "xXx......", ".xw......", "...w.....", "....w....", ".....w...", "......w..", ".......w.", "........w"]]],
  greatsword: [[-3, -1, [".M.", "mMM", "mMM", "mMM", "mMM", "mMM", "mMM", "mMM", "mMM", "ggggg", ".ww.", ".ww."].map((r) => r.padEnd(5, "."))], [-14, 11, ["...........g...", "MMMMMMMMMMMgww.", "mmmmmmmmmmmg...", "...........g..."]]],
  fork: [[-4, -3, ["g.g.g", "g.g.g", "g.g.g", "ggggg", "..g..", "..w..", "..w..", "..w..", "..w..", "..w..", "..w..", "..w..", "..w..", "..w..", "..w.."]], [-14, 9, ["gggg.........", "....g........", "ggggggwwwwwww", "....g........", "gggg........."]]],
};

export function hero(id, look, boss = false, frame = 0) {
  const key = `h:${id}:${frame}`;
  if (cache.has(key)) return cache.get(key);
  const L = look, ink = "#0e0a12";
  let hair = L.hair, hairL = mix(L.hair, "#ffffff", 0.35);
  if (L.hat === "hood") { hair = L.hood ?? L.cloth; hairL = mix(hair, "#ffffff", 0.35); }
  if (L.hat === "helm" || L.hat === "crownhelm") { hair = "#b8c0d0"; hairL = "#ffffff"; }
  const pal = {
    o: ink, h: hair, H: hairL, s: L.skin, S: mix(L.skin, "#c06a5a", 0.3), e: ink,
    c: L.cloth, C: mix(L.cloth, "#1a1020", 0.28), F: mix(L.cloth, "#ffffff", 0.3), t: L.trim, b: "#2a2030",
    k: L.cape ?? mix(L.cloth, "#1a1020", 0.45),
  };
  const step = frame === 1 ? 1 : 0;
  let rows;
  if (boss) rows = BIG.concat(BIG_FEET[step]);
  else if (L.body === "robe") rows = HEAD.concat(ROBE, ROBE_HEM[step]);
  else rows = HEAD.concat(TUNIC, TUNIC_FEET[step]);
  const tw = rows[0].length, th = rows.length;
  const g = new Grid(tw + 16 + PADX, th + PADY + 1);
  const X = 14, Y = PADY;
  g.rows(X, Y, rows, pal, 3);
  heroHat(g, L, X, Y, boss, ink);
  // the weapon: lifted 3 rows on the big template, then outlined in black like everything else
  const wp = WEAPONS[L.wpn];
  if (wp) {
    const [wx, wy, wr] = wp[frame === 2 ? 1 : 0];
    g.rows(X + wx, Y + wy + (boss ? 3 : 0), wr, { ...W_PAL, x: L.gem ?? "#c684ff", X: "#ffffff" }, 1);
    g.outline(ink);
  }
  const spr = finish(g, X + Math.floor(tw / 2), Y + th);
  spr.hand = [-Math.floor(tw / 2) - 2, (boss ? 13 : 10) - th];
  spr.top = -th;
  cache.set(key, spr);
  return spr;
}

function heroHat(g, L, X, Y, boss, o) {
  const put = (rows, x, y, P) => g.rows(X + x, Y + y, rows, { o, ...P }, 3);
  const cl = L.cloth, cd = mix(L.cloth, "#1a1020", 0.35), wide = boss ? 4 : 0;
  switch (L.hat) {
    case "witch": // a floppy pointed hat, its tip bent back
      put(["........ooo..", ".......occco.", "......occo.o.", ".....occco...", "....occcco...", "oooooooooooooo", "occccccccccCCo", "oooooooooooooo"], -1, -6, { c: cl, C: cd });
      break;
    case "bigwitch":
      put(["...........ooo...", "..........occco..", ".........occo.oo.", "........occco....", ".......occcyo....", "......occccco....", ".....occcccco....", "ooooooooooooooooo", "occcccccccccccCCo", "ooooooooooooooooo"], -1, -8, { c: cl, C: cd, y: L.gem ?? "#ffd84a" });
      break;
    case "bandana":
      for (let x = 2; x <= (boss ? 14 : 10); x++) g.set(X + x, Y + 3, L.trim, 3);
      put(["tt.", ".tt", "t.."], boss ? 15 : 11, 3, { t: L.trim });
      break;
    case "feathercap":
      put([".........oo", "........oro", "..ooooooor.", ".occcccccco.", "oCCCCCCCCCCo", "oooooooooooo"].map((r) => r.padEnd(12, ".")), 1, -3, { c: cl, C: cd, r: "#e8343a" });
      break;
    case "crown":
      put(["o.o.o.o", "oyoyoyo", "oyryyby", "ooooooo"], boss ? 4 : 3, -2, { y: "#ffd84a", r: "#ff4a6a", b: "#5ab0f4" });
      break;
    case "crownhelm":
      put(["o.o.o.o", "oyoyoyo", "ooooooo"], boss ? 4 : 3, -1, { y: "#ffd84a" });
      break;
    case "helm":
      put(["ooooooooo"], 2, 4, {});
      break;
  }
  if (L.beard) put(["..ooooooo..", ".owwwwwwwo.", ".owwwwwwwo.", "..owwwwwo..", "...owwwo...", "....ooo...."], 1, 9, { w: "#f4f4f8" });
}

// ---------- eggs ----------
/** An egg of rarity r. size 1 = 8x10 (nest, battle), 2 = 16x20 (gacha). */
export function egg(r, size = 1) {
  const key = `e:${r}:${size}`;
  if (cache.has(key)) return cache.get(key);
  const [sh, mid, li, spot] = EGG[r];
  const rx = 3.6 * size + 0.2, ry = 4.6 * size + 0.2, w = Math.ceil(rx * 2) + 4, h = Math.ceil(ry * 2) + 4;
  const g = new Grid(w, h), cx = w / 2, cy = h / 2;
  let seed = r * 31 + size;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const spots = Array.from({ length: 4 + r }, () => [rnd() * 1.6 - 0.8, rnd() * 1.4 - 0.4, 0.12 + rnd() * 0.12]);
  g.ellipse(cx, cy, rx, ry, (dx, dy) => {
    // egg: narrower at the top
    const n = dx * 0.6 + dy * 0.7;
    for (const [sx, sy, sr] of spots) if ((dx - sx) ** 2 + (dy - sy) ** 2 < sr * sr) return spot;
    return n > 0.55 ? sh : n < -0.45 ? li : mid;
  });
  // narrow the top: clear corners above the middle
  for (let y = 0; y < cy; y++) for (let x = 0; x < w; x++) {
    const dy = (y + 0.5 - cy) / ry, dx = (x + 0.5 - cx) / rx;
    if (dx * dx * (1 + Math.max(0, -dy) * 0.6) + dy * dy > 1) { g.c[y * w + x] = null; g.tag[y * w + x] = 0; }
  }
  g.set(Math.round(cx - rx * 0.4), Math.round(cy - ry * 0.45), "#ffffff", 3);
  if (size > 1) g.set(Math.round(cx - rx * 0.4), Math.round(cy - ry * 0.45) + 1, "#ffffff", 3);
  g.outline(mix(sh, INK, 0.55));
  const spr = finish(g, Math.round(cx), h - 1);
  cache.set(key, spr);
  return spr;
}

// ---------- icons ----------
const ICONS = {
  coin: [".ooo.", "oyyho", "oyhyo", "oyyyo", ".ooo."],
  feather: ["....w", "...ww", "..wwb", ".wwb.", "wwb..", "b...."],
  egg: [".ww.", "wwwb", "wwwb", ".bb."],
  heart: [".r.r.", "rrrrr", "rrrrr", ".rrr.", "..r.."],
  sword: ["....w", "...w.", "y.w..", ".y...", "b.y.."],
  star: ["..y..", ".yyy.", "yyyyy", ".y.y."],
  lock: [".ggg.", ".g.g.", "yyyyy", "yyoyy", "yyyyy"],
  bolt: ["..y", ".y.", "yyy", ".y.", "y.."],
  clock: [".www.", "w.b.w", "w.bbw", "w...w", ".www."],
  plus: [".g.", "ggg", ".g."],
};
const ICON_PAL = { o: "#a8700e", y: "#ffd24a", h: "#fff6c0", w: "#f4f0f8", b: "#9a94b0", r: "#ff4a5a", g: "#9aa0b0", ...{} };
export function icon(name) {
  const key = `i:${name}`;
  if (cache.has(key)) return cache.get(key);
  const rows = ICONS[name], g = new Grid(rows[0].length + 2, rows.length + 2);
  const pal = name === "lock" ? { ...ICON_PAL, y: "#c89a3a", o: "#5a3a0c" } : name === "plus" ? { g: "#7ee88a" } : ICON_PAL;
  g.rows(1, 1, rows, pal);
  g.outline("#1a1020");
  const spr = finish(g, 0, 0);
  cache.set(key, spr);
  return spr;
}

// ---------- drawing ----------
/**
 * Draw a sprite with its anchor at (x, y). o: { flip, sx, sy (squash), flash (0..1 white), red, alpha, dark }
 */
export function draw(ctx, spr, x, y, o = {}) {
  const sx = o.sx ?? 1, sy = o.sy ?? 1;
  const dw = Math.max(1, Math.round(spr.w * sx)), dh = Math.max(1, Math.round(spr.h * sy));
  const ax = Math.round(spr.ax * sx), ay = Math.round(spr.ay * sy);
  const X = Math.round(x), Y = Math.round(y);
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.flip) {
    ctx.translate(X, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(o.dark ? spr.dark : spr.cv, -ax, Y - ay, dw, dh);
    if (o.flash > 0) { ctx.globalAlpha = (o.alpha ?? 1) * o.flash; ctx.drawImage(spr.flash, -ax, Y - ay, dw, dh); }
    if (o.red > 0) { ctx.globalAlpha = (o.alpha ?? 1) * o.red; ctx.drawImage(spr.red, -ax, Y - ay, dw, dh); }
  } else {
    ctx.drawImage(o.dark ? spr.dark : spr.cv, X - ax, Y - ay, dw, dh);
    if (o.flash > 0) { ctx.globalAlpha = (o.alpha ?? 1) * o.flash; ctx.drawImage(spr.flash, X - ax, Y - ay, dw, dh); }
    if (o.red > 0) { ctx.globalAlpha = (o.alpha ?? 1) * o.red; ctx.drawImage(spr.red, X - ax, Y - ay, dw, dh); }
  }
  ctx.restore();
}
export function drawIcon(ctx, name, x, y) {
  const s = icon(name);
  ctx.drawImage(s.cv, Math.round(x), Math.round(y));
}
/** a soft oval shadow under a character */
export function shadow(ctx, x, y, w = 8, a = 0.28) {
  ctx.fillStyle = `rgba(20,10,30,${a})`;
  const X = Math.round(x - w / 2), Y = Math.round(y - 1);
  ctx.fillRect(X + 1, Y, w - 2, 2);
  ctx.fillRect(X, Y + 0.5 | 0, w, 1);
}

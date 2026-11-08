// The chick train: chicks hatched from eggs you pick up run behind the chicken. Each one replays the
// chicken's jumps at the spot it took off from, but a chick is weaker: its jump is lower and it
// can't glide. So a jump that only just got the chicken over a fence or a pit can cost the chicks
// behind it. The chicken itself still dies to any hit. While a booster or speed mode is on, the
// chicks ride the chicken's exact path and are safe.

const CELL = 2;
const K = "#4b2424";
const PAL = { K, Y: "#ffd84a", y: "#e0a020", L: "#fff3a6", O: "#ff9a2a", E: "#1a0a0a", w: "#f0b030" };
// faces right
const BODY = [
  "..KKKK...",
  ".KLYYYK..",
  ".KYYYEKOO",
  "KYYYYYYK.",
  "KyYwwYYK.",
  "KyyYYYyK.",
  ".KKKKKK..",
];
const WING_UP = [[3, 3, "w"], [4, 3, "w"], [3, 4, "Y"], [4, 4, "Y"], [2, 2, "w"]];
const LEGS = [[[3, 0], [5, 1]], [[3, 1], [5, 0]]]; // [x, lifted]

const EGG = [".KKK.", "KLWWK", "KWWWK", "KWWsK", ".KKK."];
const EGG_PAL = { K, W: "#fff4dc", L: "#ffffff", s: "#e2d4b2" };

// each chicken skin has matching chicks
const RAINBOW_HUES = ["#ff6a6a", "#ffa040", "#ffe040", "#6ad85a", "#4ac8ff", "#9a7aff"];
const CHICK_SKINS = {
  basic: {},
  white: { Y: "#ffffff", y: "#d8d2c8", L: "#ffffff", w: "#e8e4dc", O: "#ffb040" },
  silkie: { K: "#120c14", Y: "#3a3240", y: "#2a2430", L: "#5a4e66", w: "#4c4060", E: "#ffd84a", O: "#6a6a8a", glowEye: "#ffd84a" },
  berry: { Y: "#ffc8d8", y: "#f0a0b8", L: "#ffe8f0", w: "#ff86b0" },
  mint: { Y: "#a8ecd8", y: "#78d0b8", L: "#d8fff2", w: "#6a4a38" },
  ghost: { K: "#3a4a7a", Y: "#d8e8ff", y: "#b0c8f0", L: "#ffffff", w: "#c8d8ff", E: "#3a4a7a", O: "#b0c8f0", alpha: 0.72 },
  gold: { K: "#5a3008", Y: "#ffc830", y: "#d89010", L: "#fff3a6", w: "#ffe066", glint: true },
  robot: { K: "#1e2230", Y: "#b8c0cc", y: "#8c94a4", L: "#e0e6f0", w: "#4a90e0", E: "#5af0ff", O: "#ffb030", glowEye: "#5af0ff" },
  phoenix: { K: "#4a0a08", Y: "#ff9a3a", y: "#e05a1a", L: "#ffd86a", w: "#ff4a2a", O: "#ffe060" },
  rainbow: { rainbow: true },
};
function chickPal(skin, idx) {
  const d = CHICK_SKINS[skin] || CHICK_SKINS.basic;
  if (d.rainbow) {
    // every chick in the line a different colour, so the whole train makes a rainbow
    const c = RAINBOW_HUES[((idx % 6) + 6) % 6];
    return { ...PAL, Y: c, y: shade(c, 0.78), L: shade(c, 1.25), w: shade(c, 0.9) };
  }
  return { ...PAL, ...d };
}
function shade(h, k) {
  const n = parseInt(h.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, "0");
  return "#" + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255);
}

const arts = new Map();
let eggArt = null;
function paint(rows, pal, h) {
  const c = document.createElement("canvas");
  c.width = rows[0].length; c.height = h || rows.length;
  const x = c.getContext("2d");
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== ".") { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
  return c;
}
function getArt(skin = "basic", idx = 0) {
  const d = CHICK_SKINS[skin] || CHICK_SKINS.basic;
  const key = d.rainbow ? `rainbow:${((idx % 6) + 6) % 6}` : skin;
  let art = arts.get(key);
  if (art) return art;
  const pal = chickPal(skin, idx);
  if (!eggArt) eggArt = paint(EGG, EGG_PAL);
  art = { run: [], jump: null, egg: eggArt, def: d };
  for (const legs of LEGS) {
    const c = paint(BODY, pal, 9), x = c.getContext("2d");
    for (const [lx, up] of legs) { x.fillStyle = pal.O; x.fillRect(lx, 7, 1, 2 - up); if (!up) x.fillRect(lx + 1, 8, 1, 1); }
    art.run.push(c);
  }
  {
    const c = paint(BODY, pal, 9), x = c.getContext("2d");
    for (const [i, j, ch] of WING_UP) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); }
    x.fillStyle = pal.O; x.fillRect(3, 7, 2, 1); x.fillRect(5, 7, 1, 1);
    art.jump = c;
  }
  arts.set(key, art);
  return art;
}

export const CHICK = {
  max: 15,
  gap: 13,            // spacing along the line, px
  jumpPow: 0.82,      // fraction of the chicken's jump speed
  grav: 1500, holdK: 0.35, holdT: 0.2, maxFall: 620,
};

export function drawChick(ctx, c, camX, time, skin = "basic", idx = 0) {
  const A = getArt(skin, idx), D = A.def;
  const img = c.ground ? A.run[Math.floor(time * 12 + c.ph) % 2] : c.windy ? (Math.floor(time * 14 + c.ph) % 2 ? A.jump : A.run[0]) : A.jump;
  ctx.save();
  ctx.translate(Math.round(c.x - camX), Math.round(c.y));
  if (c.dangle) ctx.rotate(Math.sin(time * 14) * 0.35); // wriggling in the crow's claws
  else if (c.lost) { ctx.rotate(c.spin); ctx.globalAlpha = Math.max(0, 1 - c.lostT / 0.9); }
  if (c.sq) ctx.scale(1 + c.sq * 0.25, 1 - c.sq * 0.25);
  if (D.alpha) ctx.globalAlpha *= D.alpha;
  if (c.flash > 0) ctx.filter = "brightness(3)";
  if (c.swim) {
    // only the part above the water line shows, with a little paddle ripple either side
    const line = 260 - Math.round(c.y); // water surface (GROUND + 28) in local coordinates
    ctx.save();
    ctx.beginPath(); ctx.rect(-40, -40, 80, 40 + line); ctx.clip();
    ctx.drawImage(A.run[Math.floor(time * 14 + c.ph) % 2], -img.width, -img.height * CELL, img.width * CELL, img.height * CELL);
    ctx.restore();
    ctx.fillStyle = "#d4fbff";
    const w = Math.floor(time * 8 + c.ph) % 2;
    ctx.fillRect(-12 - w, line, 3, 1); ctx.fillRect(4 + w, line, 3, 1);
    ctx.restore();
    return;
  }
  ctx.drawImage(img, -img.width, -img.height * CELL, img.width * CELL, img.height * CELL);
  // skin touches: glowing eyes, a passing gold glint
  if (D.glowEye) {
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = D.glowEye;
    ctx.globalAlpha = 0.35; ctx.fillRect(-img.width * CELL + 9, -img.height * CELL + 3, 4, 4);
    ctx.globalAlpha = 1; ctx.fillRect(-img.width * CELL + 10, -img.height * CELL + 4, 2, 2);
  }
  if (D.glint && Math.floor(time * 3 + idx * 0.7) % 4 === 0) {
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "#fff6c8";
    const gx = Math.floor(((time * 3 + idx * 0.7) % 1) * 16);
    ctx.fillRect(-img.width * CELL + gx, -img.height * CELL + 4, 2, 6);
  }
  ctx.restore();
}

export function drawChickEgg(ctx, e, camX, time) {
  const A = getArt();
  const x = Math.round(e.x - camX), y = Math.round(e.y + Math.sin(time * 5 + e.ph) * 2);
  // a soft glow so it reads as something to grab, not a coin
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,240,180,0.22)";
  ctx.beginPath(); ctx.arc(x, y, 10 + Math.sin(time * 6) * 1, 0, 7); ctx.fill();
  ctx.restore();
  const wob = Math.sin(time * 9 + e.ph) * 0.18;
  ctx.save();
  ctx.translate(x, y + 5);
  ctx.rotate(wob);
  ctx.drawImage(A.egg, -5, -10, 10, 10);
  ctx.restore();
}

/** Small chick icon for the HUD. */
export function chickIcon(skin = "basic") { return getArt(skin, 0).run[0]; }

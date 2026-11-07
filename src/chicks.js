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

let art = null;
function paint(rows, pal, h) {
  const c = document.createElement("canvas");
  c.width = rows[0].length; c.height = h || rows.length;
  const x = c.getContext("2d");
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== ".") { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
  return c;
}
function getArt() {
  if (art) return art;
  art = { run: [], jump: null, egg: paint(EGG, EGG_PAL) };
  for (const legs of LEGS) {
    const c = paint(BODY, PAL, 9), x = c.getContext("2d");
    for (const [lx, up] of legs) { x.fillStyle = PAL.O; x.fillRect(lx, 7, 1, 2 - up); if (!up) x.fillRect(lx + 1, 8, 1, 1); }
    art.run.push(c);
  }
  {
    const c = paint(BODY, PAL, 9), x = c.getContext("2d");
    for (const [i, j, ch] of WING_UP) { x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1); }
    x.fillStyle = PAL.O; x.fillRect(3, 7, 2, 1); x.fillRect(5, 7, 1, 1);
    art.jump = c;
  }
  return art;
}

export const CHICK = {
  max: 15,
  gap: 13,            // spacing along the line, px
  jumpPow: 0.82,      // fraction of the chicken's jump speed
  grav: 1500, holdK: 0.35, holdT: 0.2, maxFall: 620,
};

export function drawChick(ctx, c, camX, time) {
  const A = getArt();
  const img = c.ground ? A.run[Math.floor(time * 12 + c.ph) % 2] : A.jump;
  ctx.save();
  ctx.translate(Math.round(c.x - camX), Math.round(c.y));
  if (c.lost) { ctx.rotate(c.spin); ctx.globalAlpha = Math.max(0, 1 - c.lostT / 0.9); }
  if (c.sq) ctx.scale(1 + c.sq * 0.25, 1 - c.sq * 0.25);
  if (c.flash > 0) ctx.filter = "brightness(3)";
  ctx.drawImage(img, -img.width, -img.height * CELL, img.width * CELL, img.height * CELL);
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
export function chickIcon() { return getArt().run[0]; }

// Things that want the chicken for dinner, drawn in the chicken's own style (2x cells, dark brown
// outline, two or three tones): a fox, a hopping cooking pot, a fork soldier and a diving hawk.
// They face left, towards the chicken. Stomp them or hit them with a thrown egg; the fork's tines
// hurt to stomp on, so it needs an egg.

const CELL = 2;
const K = "#4b2424";

const FOX_PAL = { K, O: "#e8742a", o: "#b8501a", W: "#f4ead8", w: "#d0bea0", E: "#1a0a0a", N: "#1a0a0a", k: "#2a1410", p: "#ff9a8a" };
const FOX_BODY = [
  "....K...K...........",
  "...KoK.KoK......KK..",
  "...KOOKOOK.....KWWK.",
  "..KOOOOOOK....KOWWK.",
  ".KOOEOOOOOK...KOOK..",
  "KNWOOOOOOOOKKKKOOK..",
  ".KWWWOOOOOOOOOOOOK..",
  "..KWWWOOOOOOOOOOK...",
  "...KWWWOooooooOK....",
  "...KWWOooooooooK....",
  "...KOOKKKKKKKKOK....",
];
// legs: [front x, back x] per frame, each leg is 2 rows of shin and a paw
const FOX_LEGS = [[[4, 0], [12, 0]], [[5, 1], [11, 1]], [[4, 1], [13, 0]], [[3, 0], [12, 1]]];

const POT_PAL = { K, R: "#c83a2a", r: "#8a2418", H: "#f07a5a", M: "#c8ccd8", m: "#8a90a4", W: "#ffffff", E: "#1a0a0a" };
const POT_LID = [
  "......KK......",
  ".....KMMK.....",
  "..KKKKKKKKKK..",
  ".KMMMMMMMMMMK.",
  "KKKKKKKKKKKKKK",
];
const POT_BODY = [
  ".KHRRRRRRRRRK.",
  "KKRWWKRRKWWRKK",
  "KKRWEKRRKEWRKK",
  ".KRRRRRRRRRRK.",
  ".KRRKKKKKKRRK.",
  ".KrRRRRRRRRrK.",
  "..KrrrrrrrrK..",
  "...KKKKKKKK...",
];
const POT_ANGRY = [ // brows when the lid is gone
  [3, 1, "K"], [4, 1, "K"], [9, 1, "K"], [10, 1, "K"],
];

const FORK_PAL = { K: "#2a2a3a", M: "#d8dce8", m: "#9aa0b4", H: "#ffffff", E: "#1a0a14", e: "#ff3a3a", w: "#6a7088" };
const FORK = [
  ".K.K.K.K.",
  "KHKMKMKMK",
  "KHKMKMKmK",
  "KMKMKMKmK",
  "KHMMMMMmK",
  "KMEeMEeMK",
  "KMMMMMMmK",
  ".KMKKKMK.",
  "..KMMmK..",
  "...KMK...",
  "..KKMKK..",
  ".KwKMKwK.",
  "...KmK...",
  "...KmK...",
];
const FORK_LEGS = [[[3, 0], [5, 1]], [[3, 1], [5, 0]]];

const HAWK_PAL = { K, B: "#8a5a30", b: "#5a3a20", C: "#f0dcb0", c: "#c8b080", Y: "#ffc030", y: "#ffe060" };
const HAWK_BODY = [
  "...KKK............",
  "..KBBBK...........",
  ".KByBBBKKKKKK.....",
  "KYYBBBBBBBBBBKKK..",
  ".KKCCBBBBBBBBBbbbK",
  "...KCCCCBBBBBKbbbK",
  "....KKCcCCCKK.KKK.",
  "......KKKKK.......",
];
const HAWK_WING = [
  "......KK.",
  "....KKbbK",
  "..KKbbBbK",
  ".KbbBBBK.",
  "KbBBBBK..",
  "KBBBKK...",
];

const EGG = [".KK.", "KWHK", "KWWK", "KWWK", ".KK."];
const EGG_PAL = { K, W: "#fff4dc", H: "#ffffff" };

function paint(rows, pal, extra) {
  const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
  const c = document.createElement("canvas");
  c.width = w; c.height = h + (extra || 0);
  const x = c.getContext("2d");
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== "." && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
  return c;
}

let art = null;
function getArt() {
  if (art) return art;
  art = { fox: [], pot: {}, fork: [], hawk: [] };
  // fox: body plus legs per frame
  for (const legs of FOX_LEGS) {
    const c = paint(FOX_BODY, FOX_PAL, 3);
    const x = c.getContext("2d");
    for (const [lx, up] of legs) {
      x.fillStyle = K; x.fillRect(lx - 1, 11, 3, 2 - up);
      x.fillStyle = FOX_PAL.o; x.fillRect(lx, 11, 1, 2 - up);
      x.fillStyle = FOX_PAL.k; x.fillRect(lx - 1, 13 - up, 3, 1);
    }
    art.fox.push(c);
  }
  // a pounce frame: legs stretched out front and back
  {
    const c = paint(FOX_BODY, FOX_PAL, 3), x = c.getContext("2d");
    x.fillStyle = K; x.fillRect(1, 11, 3, 1); x.fillRect(14, 11, 4, 1);
    x.fillStyle = FOX_PAL.k; x.fillRect(0, 11, 1, 2); x.fillRect(18, 11, 1, 2);
    art.foxJump = c;
  }
  art.pot.lid = paint(POT_LID, POT_PAL);
  art.pot.body = paint(POT_BODY, POT_PAL);
  {
    const c = paint(POT_BODY, POT_PAL), x = c.getContext("2d");
    for (const [i, j, ch] of POT_ANGRY) { x.fillStyle = POT_PAL[ch]; x.fillRect(i, j, 1, 1); }
    x.fillStyle = POT_PAL.r; x.fillRect(4, 4, 6, 1); // gritted teeth
    x.fillStyle = "#ffffff"; x.fillRect(5, 4, 1, 1); x.fillRect(8, 4, 1, 1);
    art.pot.angry = c;
  }
  for (const legs of FORK_LEGS) {
    const c = paint(FORK, FORK_PAL, 3), x = c.getContext("2d");
    for (const [lx, up] of legs) { x.fillStyle = FORK_PAL.K; x.fillRect(lx, 14, 1, 2 - up); x.fillRect(lx - 1, 16 - up, 2, 1); }
    art.fork.push(c);
  }
  // hawk: wing up, level, down
  for (const pose of ["up", "mid", "down"]) {
    const c = document.createElement("canvas");
    c.width = 18; c.height = 20;
    const x = c.getContext("2d");
    const body = paint(HAWK_BODY, HAWK_PAL), wing = paint(HAWK_WING, HAWK_PAL);
    // the wing's root (its bottom-left) sits on the hawk's back at about (8, 9)
    if (pose === "up") x.drawImage(wing, 7, 3);
    x.drawImage(body, 0, 6);
    if (pose === "mid") x.drawImage(wing, 0, 3, 9, 3, 7, 7, 9, 3);
    if (pose === "down") { x.save(); x.translate(7, 15); x.scale(1, -1); x.drawImage(wing, 0, 0); x.restore(); }
    art.hawk.push(c);
  }
  art.egg = paint(EGG, EGG_PAL);
  return art;
}

// kind settings: art size (in cells), hit points, whether stomping is safe, score, debris colors
export const ENEMIES = {
  fox: { w: 20, h: 14, hp: 1, stomp: true, score: 150, colors: ["#e8742a", "#f4ead8", "#b8501a"], name: "여우" },
  pot: { w: 14, h: 13, hp: 2, stomp: true, score: 220, colors: ["#c83a2a", "#c8ccd8", "#f07a5a"], name: "냄비" },
  fork: { w: 9, h: 17, hp: 1, stomp: false, score: 250, colors: ["#d8dce8", "#9aa0b4", "#ffffff"], name: "포크" },
  hawk: { w: 18, h: 14, hp: 1, stomp: true, score: 300, colors: ["#8a5a30", "#f0dcb0", "#5a3a20"], name: "매" },
};

/** World-space hit box of an enemy whose feet (or, for the hawk, belly) are at (e.x, e.y). */
export function enemyBox(e) {
  const d = ENEMIES[e.kind];
  const w = d.w * CELL, h = d.h * CELL;
  if (e.kind === "hawk") return { x0: e.x - w / 2 + 4, y0: e.y - 16, x1: e.x + w / 2 - 4, y1: e.y + 2 };
  if (e.kind === "pot" && e.lidOff) return { x0: e.x - w / 2 + 3, y0: e.y - 16, x1: e.x + w / 2 - 3, y1: e.y };
  const top = e.kind === "fox" ? 6 : 0;
  return { x0: e.x - w / 2 + 4, y0: e.y - h + top, x1: e.x + w / 2 - 4, y1: e.y };
}

export function drawEnemy(ctx, e, camX, time) {
  const A = getArt();
  const x = Math.round(e.x - camX), y = Math.round(e.y);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (e.dead) { ctx.rotate(e.spin); ctx.scale(1, -1); } // knocked out: flipped and tumbling
  if (e.sq) ctx.scale(1 + e.sq * 0.25, 1 - e.sq * 0.3);
  if (e.flash > 0) ctx.filter = "brightness(4)";
  if (e.kind === "fox") {
    const img = !e.ground ? A.foxJump : A.fox[Math.floor(e.t * 12) % 4];
    ctx.drawImage(img, -img.width, -img.height * CELL + 6 * 0, img.width * CELL, img.height * CELL);
  } else if (e.kind === "pot") {
    const body = e.lidOff ? A.pot.angry : A.pot.body;
    ctx.drawImage(body, -body.width, -body.height * CELL, body.width * CELL, body.height * CELL);
    if (!e.lidOff) {
      const rattle = Math.round(Math.sin(time * 30 + e.ph) * (e.ground ? 1 : 0));
      ctx.drawImage(A.pot.lid, -A.pot.lid.width, -(body.height + A.pot.lid.height) * CELL + rattle * 2 + 2, A.pot.lid.width * CELL, A.pot.lid.height * CELL);
    }
  } else if (e.kind === "fork") {
    const img = A.fork[Math.floor(e.t * 6) % 2];
    ctx.drawImage(img, -img.width, -img.height * CELL, img.width * CELL, img.height * CELL);
  } else if (e.kind === "hawk") {
    const f = e.state === "dive" ? 0 : [0, 1, 2, 1][Math.floor(e.t * 10) % 4];
    const img = A.hawk[f];
    if (e.state === "dive") ctx.rotate(-0.5);
    ctx.drawImage(img, -img.width, -img.height * CELL + 8, img.width * CELL, img.height * CELL);
  }
  ctx.restore();
  // the hawk's warning before it dives
  if (e.kind === "hawk" && e.state === "aim" && Math.floor(time * 12) % 2 === 0) {
    ctx.fillStyle = "#1a0e14"; ctx.fillRect(x - 3, y - 40, 6, 14); ctx.fillRect(x - 3, y - 24, 6, 5);
    ctx.fillStyle = "#ff4c2d"; ctx.fillRect(x - 2, y - 39, 4, 11); ctx.fillRect(x - 2, y - 23, 4, 3);
  }
}

export function drawLid(ctx, l, camX) {
  const A = getArt();
  ctx.save();
  ctx.translate(Math.round(l.x - camX), Math.round(l.y));
  ctx.rotate(l.rot);
  ctx.drawImage(A.pot.lid, -A.pot.lid.width, -A.pot.lid.height, A.pot.lid.width * CELL, A.pot.lid.height * CELL);
  ctx.restore();
}

export function drawEgg(ctx, g, camX) {
  const A = getArt();
  ctx.save();
  ctx.translate(Math.round(g.x - camX), Math.round(g.y));
  ctx.rotate(g.rot);
  ctx.drawImage(A.egg, -4, -5, 8, 10);
  ctx.restore();
}

export function enemyArt() { return getArt(); }

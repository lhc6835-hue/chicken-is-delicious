// Core: a 320x180 pixel world drawn into low-res canvases, scaled up with nearest-neighbour, plus crisp
// Korean pixel text drawn at display resolution on top. Two passes per frame (base scene, overlay), each
// with its own text queue, so popups cover the labels underneath them.

export const W = 320, H = 180;

const mk = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

export const G = {
  t: 0, dt: 0, frame: 0,
  S: 1, dpr: 1, ox: 0, oy: 0,
  shake: 0, shakeAmp: 0, hitstop: 0, timeScale: 1,
  pass: 0, // 0 base, 1 overlay
  modal: null,
  scene: null,
  input: null,
  flash: 0, flashColor: "#ffffff",
};

let disp, dctx;
const passes = [0, 1].map(() => {
  const c = mk(W, H);
  return { c, ctx: c.getContext("2d"), texts: [] };
});

export const lo = () => passes[G.pass].ctx;

export function initDisplay(canvas) {
  disp = canvas;
  dctx = canvas.getContext("2d");
  resize();
  addEventListener("resize", resize);
}

function resize() {
  const vw = innerWidth, vh = innerHeight, dpr = Math.min(3, devicePixelRatio || 1);
  let S = Math.min(vw / W, vh / H);
  if (S >= 2) S = Math.floor(S);
  G.S = S;
  G.dpr = dpr;
  const cw = Math.round(W * S), ch = Math.round(H * S);
  disp.style.width = cw + "px";
  disp.style.height = ch + "px";
  disp.width = Math.round(cw * dpr);
  disp.height = Math.round(ch * dpr);
  G.ox = (vw - cw) / 2;
  G.oy = (vh - ch) / 2;
  disp.style.left = G.ox + "px";
  disp.style.top = G.oy + "px";
}

// ---------- text ----------
export const FONT = "Galmuri11";
/**
 * Queue text for the current pass, in world coordinates. size is in world pixels (6 = small, 8 = normal,
 * 12 = big). opts: { color, align: left|center|right, base: top|middle|bottom, outline (color or false),
 * alpha, bold, scale (pop animation), maxW }.
 */
export function text(str, x, y, opts = {}) {
  passes[G.pass].texts.push({ str: String(str), x, y, ...opts });
}
export function measure(str, size = 8, bold = false) {
  dctx.font = `${bold ? "bold " : ""}${size * 10}px ${FONT}`;
  return dctx.measureText(String(str)).width / 10;
}

function flushText(list, shake) {
  const k = G.S * G.dpr;
  dctx.save();
  dctx.textBaseline = "alphabetic";
  for (const t of list) {
    const size = t.size ?? 8, sc = t.scale ?? 1, a = t.alpha ?? 1;
    if (a <= 0) continue;
    const px = size * k * sc;
    dctx.font = `${t.bold ? "bold " : ""}${px}px ${FONT}`;
    dctx.globalAlpha = a;
    let w = dctx.measureText(t.str).width;
    let x = (t.x + (shake ? Math.round(G.shakeX) : 0)) * k, y = (t.y + (shake ? Math.round(G.shakeY) : 0)) * k;
    const align = t.align ?? "left", base = t.base ?? "top";
    if (align === "center") x -= w / 2;
    else if (align === "right") x -= w;
    if (base === "top") y += px * 0.86;
    else if (base === "middle") y += px * 0.36;
    if (t.outline !== false) {
      const ow = Math.max(1, Math.round(k * 0.75 * sc));
      dctx.fillStyle = t.outline ?? "#140e1c";
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2]]) dctx.fillText(t.str, x + dx * ow, y + dy * ow);
    }
    if (t.shadow) {
      dctx.fillStyle = t.shadow;
      dctx.fillText(t.str, x, y + k);
    }
    dctx.fillStyle = t.color ?? "#fff8ec";
    dctx.fillText(t.str, x, y);
  }
  dctx.restore();
  list.length = 0;
}

// ---------- input ----------
export const input = {
  x: -99, y: -99, down: false, pressed: false, released: false,
  sx: 0, sy: 0, moved: 0, consumed: false, wheel: 0, dx: 0, dy: 0, lx: 0, ly: 0,
};
G.input = input;
function toWorld(e) {
  return [(e.clientX - G.ox) / G.S, (e.clientY - G.oy) / G.S];
}
export function initInput(canvas) {
  const target = window;
  canvas.addEventListener("pointerdown", (e) => {
    const [x, y] = toWorld(e);
    input.x = input.sx = input.lx = x;
    input.y = input.sy = input.ly = y;
    input.down = true;
    input.pressed = true;
    input.moved = 0;
    input.consumed = false;
    canvas.setPointerCapture?.(e.pointerId);
    audioUnlock?.();
    e.preventDefault();
  });
  target.addEventListener("pointermove", (e) => {
    const [x, y] = toWorld(e);
    if (input.down) input.moved = Math.max(input.moved, Math.hypot(x - input.sx, y - input.sy));
    input.x = x;
    input.y = y;
  });
  const up = (e) => {
    if (!input.down) return;
    const [x, y] = toWorld(e);
    input.x = x;
    input.y = y;
    input.down = false;
    input.released = true;
  };
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", (e) => { input.wheel += e.deltaY; e.preventDefault(); }, { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
}
let audioUnlock = null;
export const onFirstGesture = (fn) => (audioUnlock = fn);

/** A press that began inside the rect and was released inside it without dragging: a tap. */
export function tapped(x, y, w, h, slop = 7) {
  if (!input.released || input.consumed || !inputLive()) return false;
  const inside = (px, py) => px >= x && px < x + w && py >= y && py < y + h;
  if (inside(input.sx, input.sy) && inside(input.x, input.y) && input.moved < slop) {
    input.consumed = true;
    return true;
  }
  return false;
}
/** Pointer held down on a press that began in the rect. */
export function holding(x, y, w, h) {
  if (!input.down || !inputLive()) return false;
  return input.sx >= x && input.sx < x + w && input.sy >= y && input.sy < y + h && input.x >= x && input.x < x + w && input.y >= y && input.y < y + h;
}
export const over = (x, y, w, h) => input.x >= x && input.x < x + w && input.y >= y && input.y < y + h;
/** Base-pass input is dead while a modal is open. */
export const inputLive = () => G.pass === 1 || !G.modal;

// ---------- frame ----------
G.shakeX = 0;
G.shakeY = 0;
export function addShake(amp, dur = 0.25) {
  G.shakeAmp = Math.max(G.shakeAmp * (G.shake > 0 ? 1 : 0), amp);
  G.shake = Math.max(G.shake, dur);
}
export function screenFlash(color = "#ffffff", k = 1) {
  G.flash = k;
  G.flashColor = color;
}

export function beginPass(n) {
  G.pass = n;
  const p = passes[n];
  p.ctx.setTransform(1, 0, 0, 1, 0, 0);
  p.ctx.clearRect(0, 0, W, H);
  p.ctx.imageSmoothingEnabled = false;
  if (n === 0) p.ctx.translate(Math.round(G.shakeX), Math.round(G.shakeY));
}
export function endPass(n) {
  const p = passes[n];
  dctx.imageSmoothingEnabled = false;
  dctx.drawImage(p.c, 0, 0, disp.width, disp.height);
  flushText(p.texts, n === 0);
}

export function startFrame(dt) {
  G.dt = dt;
  G.t += dt;
  G.frame++;
  input.dx = input.x - input.lx;
  input.dy = input.y - input.ly;
  input.lx = input.x;
  input.ly = input.y;
  if (G.shake > 0) {
    G.shake -= dt;
    const a = G.shakeAmp * Math.min(1, G.shake * 5);
    G.shakeX = (Math.random() * 2 - 1) * a;
    G.shakeY = (Math.random() * 2 - 1) * a;
  } else (G.shakeX = 0), (G.shakeY = 0);
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.fillStyle = "#0b0a12";
  dctx.fillRect(0, 0, disp.width, disp.height);
}
export function endFrame() {
  if (G.flash > 0) {
    dctx.globalAlpha = Math.min(1, G.flash);
    dctx.fillStyle = G.flashColor;
    dctx.fillRect(0, 0, disp.width, disp.height);
    dctx.globalAlpha = 1;
    G.flash -= G.dt * 3;
  }
  input.pressed = false;
  input.released = false;
  input.wheel = 0;
}

// Plays the pixelfx sprite sheets baked by tools/bake-fx.mjs: a color layer drawn normally and a light
// layer added on top with "lighter", so glows stay additive over any background.
import { FX } from "./fxdata.js";

const images = {};

export function loadFx(base = "assets/fx/") {
  const jobs = [];
  for (const [name, m] of Object.entries(FX)) {
    const load = (file) => new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = base + file;
    });
    jobs.push(load(`${name}.png`).then((i) => { images[name] = { color: i }; }));
  }
  return Promise.all(jobs).then(() => Promise.all(Object.entries(FX).filter(([, m]) => m.light).map(([name]) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { images[name].light = img; res(); };
    img.onerror = () => res();
    img.src = base + `${name}-light.png`;
  }))));
}

export function fxMeta(name) { return FX[name]; }

/** Draws frame `i` of a sheet with its pivot at (x, y). */
export function drawFxFrame(ctx, name, i, x, y, o = {}) {
  const m = FX[name], im = images[name];
  if (!m || !im || !im.color) return;
  i = m.loop ? ((i % m.n) + m.n) % m.n : Math.max(0, Math.min(m.n - 1, i));
  const sx = (i % m.cols) * m.w, sy = Math.floor(i / m.cols) * m.h;
  const k = o.scale || 1;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (o.flip) ctx.scale(-1, 1);
  if (o.rot) ctx.rotate(o.rot);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  // o.center: place the middle of the (clipped) frame at x, y instead of the pivot; o.clip cuts rows
  // off the bottom (pickup sheets carry a floor shadow we don't want in mid-air)
  const h = m.h - (o.clip || 0);
  const dx = o.center ? (-m.w / 2) * k : -m.px * k, dy = o.center ? (-h / 2) * k : -m.py * k;
  ctx.drawImage(im.color, sx, sy, m.w, h, dx, dy, m.w * k, h * k);
  if (im.light && o.light !== false) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha *= o.lightK ?? 1;
    ctx.drawImage(im.light, sx, sy, m.w, h, dx, dy, m.w * k, h * k);
  }
  ctx.restore();
}

/** A one-shot (or timed loop) effect instance. */
export class FxInst {
  constructor(name, x, y, o = {}) {
    this.name = name; this.x = x; this.y = y; this.o = o;
    this.t = 0; this.m = FX[name];
    this.life = o.life ?? (this.m ? this.m.n / this.m.fps : 0);
    this.speed = o.speed ?? 1;
    this.follow = o.follow || null;
  }
  update(dt) { this.t += dt * this.speed; }
  get done() { return this.t >= this.life; }
  draw(ctx, camX = 0, camY = 0) {
    if (!this.m) return;
    let x = this.x, y = this.y;
    if (this.follow) { x = this.follow.x + (this.o.dx || 0); y = this.follow.y + (this.o.dy || 0); }
    const f = Math.floor(this.t * this.m.fps);
    let alpha = this.o.alpha ?? 1;
    if (this.m.loop && this.o.life) alpha *= Math.min(1, (this.life - this.t) * 4);
    drawFxFrame(ctx, this.name, f, x - camX, y - camY, { ...this.o, alpha });
  }
}

export class FxLayer {
  constructor() { this.list = []; }
  add(name, x, y, o) { const f = new FxInst(name, x, y, o); this.list.push(f); return f; }
  update(dt) { for (const f of this.list) f.update(dt); this.list = this.list.filter((f) => !f.done); }
  draw(ctx, camX, camY) { for (const f of this.list) f.draw(ctx, camX, camY); }
  clear() { this.list.length = 0; }
}

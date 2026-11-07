// Screen transitions on an overlay canvas above the menus:
//   shell   - two eggshell halves slam shut on a zigzag seam, then crack apart (runs start / end)
//   iris    - a cartoon iris closes onto the chicken, holds a beat, closes (death -> results)
//   feather - a quick dithered diagonal wipe with a yolk-colored edge (menu to menu)
import { sfx } from "./audio.js";

const W = 480, H = 270;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const easeIn = (t) => t * t * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

export class Transitions {
  constructor(canvas) {
    this.cv = canvas;
    this.cv.width = W; this.cv.height = H;
    this.ctx = canvas.getContext("2d");
    this.cur = null;
    this.shards = [];
    this.shellCanvas = this.makeShell();
  }
  get busy() { return !!this.cur; }

  /** Covers the screen, runs mid() while covered, then uncovers. */
  run(type, mid, o = {}) {
    if (this.cur) { mid && mid(); return; }
    const dur = { shell: [0.34, 0.16, 0.5], iris: [0.75, 0.12, 0.45], feather: [0.2, 0.04, 0.22] }[type];
    this.cur = { type, mid, o, t: 0, dIn: o.skipIn ? 0 : dur[0], dHold: dur[1], dOut: dur[2], midDone: false, slammed: o.skipIn };
    if (o.skipIn) { this.cur.midDone = true; mid && mid(); }
  }
  /** Starts already covered and only plays the opening (used at boot). */
  open(type) { this.run(type, null, { skipIn: true }); }

  update(dt) {
    const c = this.cur;
    this.shards.forEach((s) => { s.t += dt; s.vy += 900 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += s.vr * dt; });
    this.shards = this.shards.filter((s) => s.t < 1.2 && s.y < H + 20);
    if (!c) return;
    c.t += dt;
    if (!c.slammed && c.t >= c.dIn) {
      c.slammed = true;
      if (c.type === "shell") { sfx("crate", { vol: 0.7, rate: 1.3 }); sfx("egg", { vol: 0.6, rate: 0.8 }); }
      if (c.type === "iris") sfx("tick", { vol: 0.8 });
    }
    if (!c.midDone && c.t >= c.dIn + c.dHold * 0.5) {
      c.midDone = true;
      c.mid && c.mid();
      if (c.type === "shell") this.crackShards();
    }
    if (c.t >= c.dIn + c.dHold + c.dOut) this.cur = null;
  }

  draw() {
    const x = this.ctx, c = this.cur;
    x.clearRect(0, 0, W, H);
    if (c) {
      const tin = c.dIn ? clamp01(c.t / c.dIn) : 1;
      const tout = clamp01((c.t - c.dIn - c.dHold) / c.dOut);
      // cover amount 0..1: closing, then opening
      const k = c.t < c.dIn ? tin : c.t < c.dIn + c.dHold ? 1 : 1 - tout;
      if (c.type === "shell") this.drawShell(k, c.t < c.dIn + c.dHold, c);
      else if (c.type === "iris") this.drawIris(c, tin, tout);
      else this.drawFeather(c.t < c.dIn + c.dHold ? tin : 1 - tout, c.t >= c.dIn + c.dHold);
    }
    for (const s of this.shards) {
      x.save(); x.translate(Math.round(s.x), Math.round(s.y)); x.rotate(s.r);
      x.fillStyle = "#1a0e14"; x.fillRect(-s.s / 2 - 1, -s.s / 2 - 1, s.s + 2, s.s + 2);
      x.fillStyle = s.c; x.fillRect(-s.s / 2, -s.s / 2, s.s, s.s);
      x.restore();
    }
  }

  // ------------------------------------------------------------ shell
  makeShell() {
    // one full-screen eggshell texture: cream, speckles, a light rim at the top
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "#f4ead0"; x.fillRect(0, 0, W, H);
    let n = 7;
    const rnd = () => ((n = (n * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 900; i++) {
      const px = Math.floor(rnd() * W / 2) * 2, py = Math.floor(rnd() * H / 2) * 2;
      x.fillStyle = rnd() < 0.6 ? "#e2d4b2" : rnd() < 0.5 ? "#c8b890" : "#fffbe8";
      x.fillRect(px, py, 2, 2);
    }
    for (let i = 0; i < 30; i++) {
      const px = Math.floor(rnd() * W / 2) * 2, py = Math.floor(rnd() * H / 2) * 2;
      x.fillStyle = "#b09868"; x.fillRect(px, py, 4, 2); x.fillRect(px + 2, py - 2, 2, 2);
    }
    return c;
  }
  seamY(px) {
    // zigzag teeth, 24 px wide
    const p = ((px % 24) + 24) % 24;
    return H / 2 + (p < 12 ? p : 24 - p) - 6;
  }
  drawShell(k, closing, c) {
    const x = this.ctx;
    const e = closing ? easeIn(k) : easeOut(k);
    // gap between the halves' seams; when closing they slam, when opening they're thrown apart
    const off = (1 - e) * (H / 2 + 20);
    const jolt = c.slammed && c.t < c.dIn + 0.08 ? Math.round(Math.sin(c.t * 90) * 3) : 0;
    // top half: everything above seam, shifted up by off
    x.save();
    x.beginPath();
    x.moveTo(0, -off - 30);
    for (let px = 0; px <= W; px += 12) x.lineTo(px, this.seamY(px) - off + jolt);
    x.lineTo(W, -off - 30); x.closePath(); x.clip();
    x.drawImage(this.shellCanvas, 0, -off + jolt);
    x.restore();
    // bottom half
    x.save();
    x.beginPath();
    x.moveTo(0, H + off + 30);
    for (let px = 0; px <= W; px += 12) x.lineTo(px, this.seamY(px) + off + jolt);
    x.lineTo(W, H + off + 30); x.closePath(); x.clip();
    x.drawImage(this.shellCanvas, 0, off + jolt);
    x.restore();
    // ink edges and inner shadow along both seams
    for (const dir of [-1, 1]) {
      x.strokeStyle = "#c8b890"; x.lineWidth = 6;
      x.beginPath();
      for (let px = 0; px <= W; px += 12) x.lineTo(px, this.seamY(px) + dir * (off + 3) + jolt);
      x.stroke();
      x.strokeStyle = "#1a0e14"; x.lineWidth = 2;
      x.beginPath();
      for (let px = 0; px <= W; px += 12) x.lineTo(px, this.seamY(px) + dir * off + jolt);
      x.stroke();
    }
    // the title stamped on the shell while it's shut
    if (e > 0.6) {
      // the title stamped into the top half, riding along with it
      x.save();
      x.font = "700 24px Silkscreen, monospace"; x.textAlign = "center";
      const ty = 100 - off + jolt;
      x.fillStyle = "#fffbe8"; x.fillText("FREE RANGE", W / 2, ty + 2);
      x.fillStyle = "#b09868"; x.fillText("FREE RANGE", W / 2, ty);
      x.font = "400 8px Silkscreen, monospace";
      x.fillText("DON'T BECOME DINNER.", W / 2, ty + 16);
      x.restore();
    }
    // hairline cracks flash just before it breaks
    if (c.slammed && c.t > c.dIn + c.dHold * 0.3 && c.t < c.dIn + c.dHold + 0.06) {
      x.strokeStyle = "#1a0e14"; x.lineWidth = 2;
      for (const [sx, len, sgn] of [[60, 50, 1], [190, 70, -1], [300, 40, 1], [410, 60, -1]]) {
        x.beginPath(); let px = sx, py = this.seamY(sx); x.moveTo(px, py);
        for (let i = 0; i < 4; i++) { px += 8 * (i % 2 ? 1 : -1); py += (sgn * len) / 4; x.lineTo(px, py); }
        x.stroke();
      }
    }
  }
  crackShards() {
    for (let i = 0; i < 26; i++) {
      const px = Math.random() * W;
      this.shards.push({ x: px, y: this.seamY(px), vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 380 - 60, r: 0, vr: (Math.random() - 0.5) * 14, s: 4 + Math.floor(Math.random() * 3) * 2, c: Math.random() < 0.7 ? "#f4ead0" : "#c8b890", t: 0 });
    }
    sfx("egg", { vol: 0.9 }); sfx("smash", { vol: 0.35, rate: 1.4 });
  }

  // ------------------------------------------------------------ iris
  drawIris(c, tin, tout) {
    const x = this.ctx;
    const cx = c.o.x ?? W / 2, cy = c.o.y ?? H / 2;
    const R = 300;
    let r, ox = cx, oy = cy;
    if (c.t < c.dIn) {
      // close to a small ring around the chicken, hang there, then snap shut
      const a = clamp01(tin / 0.55), b = clamp01((tin - 0.75) / 0.25);
      r = tin < 0.55 ? R - (R - 26) * easeOut(a) : tin < 0.75 ? 26 : 26 * (1 - easeIn(b));
    } else if (c.t < c.dIn + c.dHold) r = 0;
    else { r = R * easeOut(tout); ox = W / 2; oy = H / 2; }
    x.fillStyle = "#120c16";
    // pixel-stepped circle: fill every 2px row outside the chord
    for (let y = 0; y < H; y += 2) {
      const dy = y + 1 - oy;
      if (Math.abs(dy) >= r) { x.fillRect(0, y, W, 2); continue; }
      const hw = Math.round(Math.sqrt(r * r - dy * dy) / 2) * 2;
      x.fillRect(0, y, Math.max(0, ox - hw), 2);
      x.fillRect(ox + hw, y, W - ox - hw, 2);
    }
    if (r > 4 && r < 60) {
      // a yolk ring on the iris edge
      x.strokeStyle = "#ffd84a"; x.lineWidth = 2;
      x.beginPath(); x.arc(ox, oy, r, 0, Math.PI * 2); x.stroke();
    }
  }

  // ------------------------------------------------------------ feather wipe
  drawFeather(k, leaving) {
    const x = this.ctx;
    const B = 6;
    // a diagonal front sweeps left to right; behind it blocks fill through a Bayer dither
    const span = W + H;
    for (let by = 0; by < H; by += B) for (let bx = 0; bx < W; bx += B) {
      const d = (bx + by * 0.8) / span; // 0..~1 along the diagonal
      // covering: filled behind the front; uncovering: the front keeps going and clears behind it
      const v = leaving ? (d - ((1 - k) * 1.4 - 0.2)) * 6 : (k * 1.4 - 0.2 - d) * 6; // >1 covered, <0 empty
      if (v <= 0) continue;
      const th = BAYER[((by / B) % 4) * 4 + ((bx / B) % 4)] / 16;
      if (v < 1 && th > v) continue;
      x.fillStyle = v < 1.25 ? "#ffd84a" : "#2a1c2e";
      x.fillRect(bx, by, B, B);
    }
  }
}

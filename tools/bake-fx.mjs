#!/usr/bin/env node
// Bakes pixelfx effects (https://github.com/patch-gg/pixelfx, MIT) into sprite sheets for the game.
//
//   PIXELFX=/path/to/pixelfx node tools/bake-fx.mjs
//
// Each effect becomes assets/fx/<name>.png (color layer) and assets/fx/<name>-light.png (additive glow
// layer, drawn with "lighter"), trimmed to the pixels it actually uses. src/fxdata.js gets the frame
// layout, fps and pivot of every sheet.

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GAME = join(HERE, "..");
const PFX = process.env.PIXELFX ?? join(GAME, "..", "pixelfx");
if (!existsSync(join(PFX, "tools", "lib", "fxlib.mjs"))) {
  console.error(`pixelfx checkout not found at ${PFX}. git clone https://github.com/patch-gg/pixelfx and set PIXELFX.`);
  process.exit(1);
}
const { loadEffect, renderFrames, canvas } = await import(pathToFileURL(join(PFX, "tools", "lib", "fxlib.mjs")));

const GOLD = ["#2a1405", "#5c3008", "#9a5a0e", "#d48e18", "#f5b92c", "#ffde5e", "#fff4bc", "#ffffff"];
const MINT = ["#04161a", "#073a3e", "#0e6a66", "#16a08c", "#2ad6a8", "#7cf0c8", "#c8fff0", "#ffffff"];
const SKY = ["#0b1030", "#152a63", "#1d4f9e", "#2582d2", "#36b9ee", "#8ae8ff", "#d4fbff", "#ffffff"];
const DUST = ["#2a1c14", "#4a3424", "#6e5038", "#8f6c4c", "#b08c68", "#d2b48e", "#efe0c4"];
const FEATHER = ["#4b2424", "#95655a", "#c49488", "#e4c0a3", "#f5ddca", "#ffffff"];

// name, effect id, options, fps
const LIST = [
  ["coin", "pickups/coin-spin", {}, 20],
  ["gem", "pickups/gem-spin", {}, 20],
  ["star", "pickups/power-star", {}, 20],
  ["heart", "pickups/heart-pickup", {}, 20],
  ["potion", "pickups/potion", { palette: SKY }, 20],
  ["coinBurst", "pickups/collect-burst", { palette: GOLD }, 30],
  ["gemBurst", "pickups/collect-burst", {}, 30],
  ["itemBurst", "pickups/collect-burst", { palette: MINT }, 30],
  ["land", "impacts/heavy-landing", { palette: DUST, stone: "#5a4030" }, 30],
  ["poof", "spawn/poof", {}, 30],
  ["jet", "scifi/jetpack", { length: 22 }, 30],
  ["pow", "explosions/cartoon-pow", {}, 30],
  ["bam", "explosions/cartoon-pow", { text: "BAM!", seed: 8 }, 30],
  ["crit", "impacts/crit-hit", {}, 30],
  ["spark", "impacts/hit-spark", {}, 30],
  ["feathers", "holy/feather-burst", { palette: FEATHER, glow: "#ffd9a0" }, 20],
  ["confetti", "ui/confetti", {}, 15],
  ["firework", "explosions/firework-burst", {}, 12],
  ["splash", "water/splash", { stone: false }, 24],
  ["shieldBreak", "impacts/shield-block", {}, 30],
  ["zap", "lightning/zap-hit", {}, 30],
  ["speedUp", "ui/level-up", { text: "SPEED UP!" }, 15],
  ["newBest", "ui/level-up", { text: "NEW BEST!", palette: GOLD }, 15],
  ["combo10", "ui/combo-counter", { count: 10 }, 20],
  ["combo25", "ui/combo-counter", { count: 25 }, 20],
  ["combo50", "ui/combo-counter", { count: 50 }, 20],
  ["combo100", "ui/combo-counter", { count: 100 }, 20],
  ["mission", "ui/achievement", { title: "MISSION", text: "CLEAR!" }, 20],
  ["countdown", "ui/countdown", { from: 3, word: "GO!" }, 20],
  ["egg", "spawn/egg-hatch", {}, 24],
  ["heartLost", "ui/heart-lost", {}, 30],
  ["field", "scifi/force-field", { radius: 22 }, 20],
  ["coinDrop", "spawn/coin-drop", { coins: 9 }, 20],
];

const out = join(GAME, "assets", "fx");
mkdirSync(out, { recursive: true });
const manifest = {};

for (const [name, id, options, fps] of LIST) {
  const fx = await loadEffect(id);
  const r = renderFrames(fx, { fps, options, actor: false, bg: "none" });
  const { w, h } = r;
  // split each frame into a color layer and a light layer
  const frames = r.frames.map((f) => {
    const n = w * h, col = new Uint8ClampedArray(n * 4), lit = new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) {
      const c = f.raw[i], a = c >>> 24, j = i * 4;
      if (a) { col[j] = c & 255; col[j + 1] = (c >>> 8) & 255; col[j + 2] = (c >>> 16) & 255; col[j + 3] = a; }
      const l = f.light[i] & 0xffffff;
      if (l) {
        // alpha = brightest channel, color un-premultiplied: "lighter" then adds exactly the light,
        // over opaque and transparent canvases alike
        const r = l & 255, g = (l >>> 8) & 255, b = (l >>> 16) & 255, m = Math.max(r, g, b);
        lit[j] = (r * 255) / m; lit[j + 1] = (g * 255) / m; lit[j + 2] = (b * 255) / m; lit[j + 3] = m;
      }
    }
    return { col, lit };
  });
  // union bounding box of everything visible, so the sheets stay small
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (const f of frames) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      const on = f.col[j + 3] > 0 || f.lit[j] + f.lit[j + 1] + f.lit[j + 2] > 6;
      if (on) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    }
  }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = 0; y1 = 0; }
  const tw = x1 - x0 + 1, th = y1 - y0 + 1, n = frames.length;
  const cols = Math.max(1, Math.min(n, Math.floor(4096 / tw), Math.ceil(Math.sqrt((n * th) / tw))));
  const rows = Math.ceil(n / cols);
  const sc = canvas(cols * tw, rows * th, [0, 0, 0, 0]);
  const sl = canvas(cols * tw, rows * th, [0, 0, 0, 0]);
  let hasLight = false;
  frames.forEach((f, i) => {
    const crop = (src) => {
      const o = new Uint8ClampedArray(tw * th * 4);
      for (let y = 0; y < th; y++) o.set(src.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + tw) * 4), y * tw * 4);
      return o;
    };
    const lc = crop(f.lit);
    for (let k = 0; k < lc.length; k += 4) if (lc[k] | lc[k + 1] | lc[k + 2]) { hasLight = true; break; }
    sc.paste(crop(f.col), tw, th, (i % cols) * tw, Math.floor(i / cols) * th);
    sl.paste(lc, tw, th, (i % cols) * tw, Math.floor(i / cols) * th);
  });
  writeFileSync(join(out, `${name}.png`), sc.png());
  if (hasLight) writeFileSync(join(out, `${name}-light.png`), sl.png());
  const [ox, oy] = fx.meta.origin;
  manifest[name] = { w: tw, h: th, n, cols, fps, loop: !!fx.meta.loop, px: ox - x0, py: oy - y0, light: hasLight };
  console.log(`${name.padEnd(12)} ${id.padEnd(26)} ${n} frames ${tw}x${th}${hasLight ? " +light" : ""}`);
}

writeFileSync(
  join(GAME, "src", "fxdata.js"),
  "// Generated by tools/bake-fx.mjs from pixelfx effects. Do not edit.\nexport const FX = " + JSON.stringify(manifest, null, 0).replace(/},/g, "},\n  ") + ";\n",
);
console.log(`wrote ${Object.keys(manifest).length} sheets`);

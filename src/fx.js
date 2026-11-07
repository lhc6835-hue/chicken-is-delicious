// Bridge to pixelfx: live effect instances drawn into full-screen pixel frames, composited onto the low-res
// canvas as two images: color (normal blending) and light (additive), so glow reads over any background.
import { createFrame, clearFrame, createFx } from "../vendor/pixelfx/core/fx.js";
import { W, H, lo, G } from "./engine.js";

import * as coinToss from "../vendor/pixelfx/fx/chicken/coin-toss.js";
import * as goldenGush from "../vendor/pixelfx/fx/chicken/golden-gush.js";
import * as eyeGlow from "../vendor/pixelfx/fx/chicken/eye-glow.js";
import * as eggCrack from "../vendor/pixelfx/fx/chicken/egg-crack.js";
import * as eggBurst from "../vendor/pixelfx/fx/chicken/egg-burst.js";
import * as rarityAura from "../vendor/pixelfx/fx/chicken/rarity-aura.js";
import * as skySplit from "../vendor/pixelfx/fx/chicken/sky-split.js";
import * as featherStorm from "../vendor/pixelfx/fx/chicken/feather-storm.js";
import * as hitPop from "../vendor/pixelfx/fx/chicken/hit-pop.js";
import * as slashArc from "../vendor/pixelfx/fx/chicken/slash-arc.js";
import * as bolt from "../vendor/pixelfx/fx/chicken/bolt.js";
import * as blast from "../vendor/pixelfx/fx/chicken/blast.js";
import * as zap from "../vendor/pixelfx/fx/chicken/zap.js";
import * as featherPoof from "../vendor/pixelfx/fx/chicken/feather-poof.js";
import * as knockout from "../vendor/pixelfx/fx/chicken/knockout.js";
import * as healRise from "../vendor/pixelfx/fx/chicken/heal-rise.js";
import * as coinPop from "../vendor/pixelfx/fx/chicken/coin-pop.js";
import { RARITY } from "../vendor/pixelfx/fx/chicken/_lib.js";

export const FX = { coinToss, goldenGush, eyeGlow, eggCrack, eggBurst, rarityAura, skySplit, featherStorm, hitPop, slashArc, bolt, blast, zap, featherPoof, knockout, healRise, coinPop };
export { RARITY };

export const PAL = {
  fire: ["#1f0b10", "#4a1118", "#8c1d1c", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a", "#fff8d6"],
  ice: ["#0c1430", "#162c5c", "#1f4f94", "#2f7fcc", "#58b4ec", "#9bdcff", "#d8f4ff", "#ffffff"],
  arcane: ["#140a26", "#2b1252", "#481c88", "#6b2cc0", "#9a48ec", "#c684ff", "#ecc8ff", "#ffffff"],
  holy: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"],
  heal: ["#08201a", "#0f3f2c", "#17663e", "#24924e", "#3ec466", "#7ee88a", "#c8ffc4", "#ffffff"],
  shadow: ["#0a0612", "#1c1030", "#34184e", "#52226e", "#7a3494", "#a85ac0", "#d8a0e8", "#ffffff"],
  volt: ["#14143a", "#26307a", "#3a5ad0", "#6a9cff", "#a8d0ff", "#e4f2ff", "#ffffff"],
  steel: ["#1a2450", "#2c4c94", "#4a84d0", "#8cc4f4", "#c8e4ff", "#eef6ff", "#ffffff"],
  blood: ["#2a0810", "#5a1020", "#9a1c2a", "#d8343a", "#ff6a5a", "#ffb0a0", "#ffffff"],
  steam: ["#1a2028", "#3a4450", "#6a7888", "#a0b0c0", "#d0dce8", "#f0f6ff", "#ffffff"],
};

const layers = { back: createFrame(W, H), front: createFrame(W, H), top: createFrame(W, H) };
const live = [];

/**
 * Spawn an effect. layer: "world" (back half behind sprites, front half over them) or "top" (over the UI,
 * in the overlay pass). o: pixelfx options (x, y, flip, palette, seed, ...). Returns the instance; set
 * inst.options.x / y to move it, inst.stop() to fade a loop.
 */
export function spawn(mod, o = {}, layer = "world", { delay = 0, scaled = true } = {}) {
  const inst = createFx(mod, { seed: (Math.random() * 1e6) | 0, ...o });
  inst.layer = layer;
  inst.delay = delay;
  inst.scaled = scaled; // follows hit-stop and time scale
  live.push(inst);
  return inst;
}
export function kill(inst) {
  const i = live.indexOf(inst);
  if (i >= 0) live.splice(i, 1);
}
export function clearAll(layer) {
  for (let i = live.length - 1; i >= 0; i--) if (!layer || live[i].layer === layer) live.splice(i, 1);
}
export const count = () => live.length;

export function update(dt) {
  for (let i = live.length - 1; i >= 0; i--) {
    const f = live[i];
    const d = f.scaled ? dt * G.timeScale * (G.hitstop > 0 ? 0 : 1) : dt;
    if (f.delay > 0) { f.delay -= d; continue; }
    f.update(Math.min(d, 0.05));
    if (f.done()) live.splice(i, 1);
  }
}

// scratch canvases for compositing
const cc = document.createElement("canvas"), lc = document.createElement("canvas");
cc.width = lc.width = W;
cc.height = lc.height = H;
const cctx = cc.getContext("2d"), lctx = lc.getContext("2d");
const cimg = cctx.createImageData(W, H), limg = lctx.createImageData(W, H);
const c32 = new Uint32Array(cimg.data.buffer), l32 = new Uint32Array(limg.data.buffer);

function blitFrame(f, ctx) {
  const C = f.color, L = f.light, n = W * H;
  let anyC = false, anyL = false;
  for (let i = 0; i < n; i++) {
    const c = C[i];
    c32[i] = c;
    if (c) anyC = true;
    const l = L[i] & 0xffffff;
    if (l) { l32[i] = l | 0xff000000; anyL = true; } else l32[i] = 0;
  }
  if (anyC) {
    cctx.putImageData(cimg, 0, 0);
    ctx.drawImage(cc, 0, 0);
  }
  if (anyL) {
    lctx.putImageData(limg, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(lc, 0, 0);
    ctx.restore();
  }
}

/** Draw one layer of the live effects into the current pass: "back", "front" (world) or "top". */
export function draw(which) {
  const fr = layers[which];
  let any = false;
  for (const f of live) {
    if (f.delay > 0) continue;
    if (which === "top" ? f.layer !== "top" : f.layer !== "world") continue;
    if (!any) { clearFrame(fr); any = true; }
    f.draw(fr, which === "top" ? undefined : which);
  }
  if (any) blitFrame(fr, lo());
}

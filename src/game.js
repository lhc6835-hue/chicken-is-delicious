// The run itself: an endless procedurally built farm course, the chicken's physics (variable jump,
// glide, booster flight), pickups, hazards, and all the juice (hit-stop, shake, flashes, particles,
// pixelfx sheets, combo pitch ladders).
import { W, H, drawBackground, groundTiles, biomeAt, BIOME_LEN } from "./bg.js";
import { drawChicken, getProps, SKINS } from "./sprites.js";
import { FxLayer, drawFxFrame } from "./fx.js";
import { sfx, coinSound, jetLoop, setBgmRate } from "./audio.js";
import { upgradeValue } from "./data.js";

const GROUND = 232;
const PX = 110; // player's x on screen
const GRAV = 1500, JUMP_V = 440, HOLD_T = 0.2, MAX_FALL = 620;
const PPM = 20; // pixels per meter

const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const ITEM_LABEL = { booster: "부스터!", speed: "배속 x2!", magnet: "자석!", shield: "방패!", egg: "황금알!" };

export class Game {
  constructor(canvas, save, hooks) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.save = save;
    this.hooks = hooks; // { onGameOver(result), onMission(m), onHud() }
    this.fx = new FxLayer();
    this.sfx2 = new FxLayer(); // screen-space
    this.state = "idle";
    this.time = 0;
    this.reset();
  }

  reset() {
    const s = this.save;
    this.p = {
      x: 0, y: GROUND, vy: 0, ground: null, coyote: 0, buffer: 0, holding: false, holdT: 9, glideLeft: 0, gliding: false,
      anim: 0, flap: 0, alive: true, deadT: 0, rot: 0, vx: 0, sx: 1, sy: 1, invuln: 0,
      booster: 0, speed: 0, magnet: 0, shield: false, boostGrace: 0, lastLandVy: 0,
    };
    this.glideMax = upgradeValue(s, "glide");
    this.solids = []; this.obs = []; this.coins = []; this.items = []; this.springs = [];
    this.parts = []; this.pops = []; this.ghosts = [];
    this.fx.clear(); this.sfx2.clear();
    this.genX = -200;
    this.lastItemX = 0;
    this.camX = -PX; this.camY = 0; this.camOff = PX;
    this.shake = 0; this.flash = 0; this.flashColor = "#fff"; this.hitstop = 0; this.slowmo = 1; this.zoom = 1;
    this.dist = 0; this.score = 0; this.coinCount = 0; this.combo = 0; this.comboT = 0; this.maxCombo = 0;
    this.run = { boosters: 0, speeds: 0, smash: 0, glide: 0, jumps: 0, gems: 0, springs: 0, eggs: 0, crows: 0 };
    this.nextSpeedUp = 500;
    this.lastBiome = 0;
    this.revived = false;
    this.coinMult = 1;
    this.banner = null;
    this.stepT = 0;
    this.trailT = 0;
    this.ghostT = 0;
    this.speedLines = [];
    this.missionsShown = new Set();
    // starting runway
    this.addSolid(-300, GROUND, 900, "ground");
    this.genX = 600;
    this.coinLine(260, GROUND - 22, 8, 18);
  }

  start() {
    this.reset();
    const it = this.save.items;
    if (it.startShield > 0) { it.startShield--; this.p.shield = true; this.popText("시작 방패!", "#8ae8ff"); }
    if (it.startBoost > 0) { it.startBoost--; this.activate("booster", true); }
    if (it.doubleCoin > 0) { it.doubleCoin--; this.coinMult = 2; this.popText("코인 2배!", "#ffde5e", 30); }
    this.state = "run";
    sfx("j_start", { vol: 0.6, vary: 0 });
  }

  // ---------------------------------------------------------------- level building
  addSolid(x, y, w, kind, extra = {}) {
    const s = { x, y, w, h: kind === "ground" ? H - y + 40 : 8, kind, ox: x, oy: y, dx: 0, dy: 0, ...extra };
    this.solids.push(s);
    return s;
  }
  coinLine(x, y, n, gap = 18) { for (let i = 0; i < n; i++) this.coins.push({ x: x + i * gap, y, kind: "coin", ph: Math.random() * 3 }); }
  coinArc(x, y, w, h, n) {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      this.coins.push({ x: x + t * w, y: y - Math.sin(t * Math.PI) * h, kind: "coin", ph: i * 0.2 });
    }
  }
  addItem(x, y, kind) { this.items.push({ x, y, kind, ph: Math.random() * 6 }); this.lastItemX = x; }

  get speedBase() { return Math.min(205 + this.dist * 0.055, 400); }
  get worldSpeed() {
    const p = this.p;
    return this.speedBase * (p.speed > 0 ? 1.75 : 1) * (p.booster > 0 ? 1.2 : 1);
  }

  maybeItem(x, y) {
    const luck = upgradeValue(this.save, "luck");
    if (x - this.lastItemX < 700) return false;
    if (Math.random() > 0.22 * luck) return false;
    const r = Math.random();
    const kind = r < 0.26 ? "booster" : r < 0.5 ? "speed" : r < 0.7 ? "magnet" : r < 0.88 ? "shield" : "egg";
    this.addItem(x, y, kind);
    if (kind === "booster") this.skyTrail(x + 80);
    return true;
  }

  skyTrail(x) {
    // a ribbon of coins up in the sky to fly through with the booster
    let y = 110;
    for (let i = 0; i < 40; i++) {
      y = clamp(y + Math.sin(i * 0.35) * 9, 50, 150);
      this.coins.push({ x: x + i * 22, y, kind: i % 10 === 9 ? "gem" : "coin", ph: i * 0.1 });
    }
  }

  genChunk() {
    const d = clamp(this.dist / 3500, 0, 1);
    const v = this.speedBase;
    const reach = v * 0.72; // horizontal reach of a full jump at this speed
    let x = this.genX;
    const roll = Math.random();
    const kinds = ["flat", "pit", "obstacle", "platforms", "spring", "crows", "pitObstacle", "steps"];
    const weights = [1.2, 1.4, 1.3 + d, 0.8 + d, 0.5, 0.3 + d * 0.9, d * 1.2, 0.6];
    let t = 0, sum = weights.reduce((a, b) => a + b, 0), r = roll * sum, kind = kinds[0];
    for (let i = 0; i < kinds.length; i++) { t += weights[i]; if (r <= t) { kind = kinds[i]; break; } }

    if (kind === "flat") {
      const len = ri(220, 380);
      this.addSolid(x, GROUND, len, "ground");
      if (Math.random() < 0.7) {
        const n = ri(5, 10);
        if (Math.random() < 0.5) this.coinLine(x + 40, GROUND - 22, n);
        else this.coinArc(x + 40, GROUND - 22, n * 18, 30, n);
      }
      this.maybeItem(x + len * 0.5, GROUND - 40);
      x += len;
    } else if (kind === "pit") {
      const lead = ri(70, 120);
      const pw = Math.round(rnd(60, Math.max(70, reach * (0.55 + d * 0.25))));
      this.addSolid(x, GROUND, lead, "ground");
      this.coinArc(x + lead - 10, GROUND - 26, pw + 20, 48 + pw * 0.15, ri(5, 8));
      x += lead + pw;
      const tail = ri(80, 140);
      this.addSolid(x, GROUND, tail, "ground");
      x += tail;
    } else if (kind === "obstacle") {
      const len = ri(260, 420);
      this.addSolid(x, GROUND, len, "ground");
      const n = Math.random() < 0.3 + d * 0.5 ? 2 : 1;
      const gap = Math.max(v * 0.85, 150);
      for (let i = 0; i < n; i++) {
        const ox = x + 90 + i * gap;
        if (ox > x + len - 40) break;
        this.addObstacle(ox, pick(["fence", "crate", "hay", "thorns"]));
        this.coinArc(ox - 34, GROUND - 30, 84, 46, 5);
      }
      x += len;
    } else if (kind === "platforms") {
      const lead = ri(60, 100);
      this.addSolid(x, GROUND, lead, "ground");
      x += lead;
      const n = ri(3, 5);
      let py = GROUND - ri(30, 50);
      for (let i = 0; i < n; i++) {
        const gap = Math.round(rnd(40, reach * 0.55));
        x += gap;
        const pw = ri(56, 100);
        py = clamp(py + ri(-40, 34), 120, GROUND - 24);
        const r2 = Math.random();
        let kindP = "plank", extra = {};
        if (r2 < 0.25 + d * 0.2) { kindP = "stone"; extra = { crumble: -1 }; }
        else if (r2 < 0.4 + d * 0.3) { extra = { move: { ax: 0, ay: ri(16, 30), spd: rnd(1.2, 2), ph: Math.random() * 6 } }; }
        this.addSolid(x, py, pw, kindP, extra);
        if (Math.random() < 0.8) this.coinLine(x + 8, py - 18, Math.floor(pw / 18), 18);
        if (i === 1) this.maybeItem(x + pw / 2, py - 40);
        x += pw;
      }
      x += Math.round(rnd(40, reach * 0.5));
      const tail = ri(100, 160);
      this.addSolid(x, GROUND, tail, "ground");
      x += tail;
    } else if (kind === "spring") {
      const len = ri(140, 200);
      this.addSolid(x, GROUND, len, "ground");
      this.springs.push({ x: x + len - 50, y: GROUND, w: 24, t: 0 });
      x += len;
      // a big gap you can only clear off the spring, with a high coin arch
      const pw = Math.round(v * 1.15);
      this.coinArc(x - 40, GROUND - 60, pw + 60, 110, 12);
      if (Math.random() < 0.5) this.addSolid(x + pw * 0.45, 110, 70, "cloud");
      x += pw;
      const tail = ri(120, 180);
      this.addSolid(x, GROUND, tail, "ground");
      x += tail;
    } else if (kind === "crows") {
      const len = ri(320, 460);
      this.addSolid(x, GROUND, len, "ground");
      const n = ri(1, 2 + Math.round(d));
      for (let i = 0; i < n; i++) {
        const cy = pick([GROUND - 26, GROUND - 34, GROUND - 90]);
        this.obs.push({ x: x + 220 + i * 120, y: cy, w: 22, h: 12, kind: "crow", vx: -rnd(40, 90), ph: Math.random() * 6, by: cy });
      }
      this.coinLine(x + 60, GROUND - 22, 6);
      x += len;
    } else if (kind === "pitObstacle") {
      const lead = ri(160, 220);
      this.addSolid(x, GROUND, lead, "ground");
      this.addObstacle(x + 70, pick(["thorns", "crate"]));
      x += lead;
      const pw = Math.round(rnd(60, reach * 0.6));
      this.coinArc(x - 10, GROUND - 26, pw + 20, 50, 5);
      x += pw;
      this.addSolid(x, GROUND, 160, "ground");
      x += 160;
    } else if (kind === "steps") {
      // a staircase of planks over a ground run, coins on top
      const len = ri(380, 480);
      this.addSolid(x, GROUND, len, "ground");
      for (let i = 0; i < 3; i++) {
        const px = x + 60 + i * 110, py = GROUND - 40 - i * 34;
        this.addSolid(px, py, 70, "plank");
        this.coinLine(px + 8, py - 18, 4);
      }
      this.maybeItem(x + 60 + 2 * 110 + 35, GROUND - 40 - 2 * 34 - 40);
      x += len;
    }
    this.genX = x;
  }

  addObstacle(x, kind) {
    const P = getProps();
    const img = kind === "fence" ? P.fence : kind === "crate" ? P.crate : kind === "hay" ? P.hay : P.thorns;
    const k = kind === "thorns" ? 1 : 1;
    const o = { x, y: GROUND, w: img.width * k, h: img.height * k, kind, img };
    if (kind === "crate" && Math.random() < 0.35 && this.dist > 600) { o.h *= 2; o.stack = true; }
    this.obs.push(o);
  }

  // ---------------------------------------------------------------- input
  press() {
    const p = this.p;
    if (this.state !== "run" || !p.alive) return;
    p.holding = true;
    if (p.booster > 0) return;
    if (p.ground || p.coyote > 0) this.jump();
    else p.buffer = 0.12;
  }
  release() {
    const p = this.p;
    p.holding = false;
    if (this.state !== "run") return;
    if (p.booster <= 0 && p.vy < -200) p.vy *= 0.5;
  }

  jump(power = 1) {
    const p = this.p;
    p.vy = -JUMP_V * power;
    p.ground = null; p.coyote = 0; p.buffer = 0; p.holdT = 0;
    p.glideLeft = this.glideMax;
    p.sx = 0.75; p.sy = 1.3;
    this.run.jumps++;
    sfx("jump", { vol: 0.5, vary: 0.08 });
    for (let i = 0; i < 6; i++) this.dust(p.x + rnd(-8, 8), p.y, rnd(-60, 20), rnd(-40, -10));
  }

  // ---------------------------------------------------------------- powers
  activate(kind, silent) {
    const p = this.p, s = this.save;
    if (kind === "booster") {
      p.booster = upgradeValue(s, "booster"); this.run.boosters++;
      p.ground = null; p.vy = Math.min(p.vy, -260);
      if (!silent) sfx("booster", { vol: 0.8 });
      jetLoop(true, 0);
      this.popText("부스터! 스페이스로 날기", "#ffc23d");
    } else if (kind === "speed") {
      p.speed = upgradeValue(s, "speed"); this.run.speeds++;
      sfx("speed", { vol: 0.8 });
      this.flash = 0.5; this.flashColor = "#a3dcff";
      this.popText("배속 x2! 다 부숴!", "#5eb0ff");
      setBgmRate(1.12);
    } else if (kind === "magnet") {
      p.magnet = upgradeValue(s, "magnet");
      sfx("magnet", { vol: 0.8 });
      this.popText("자석!", "#ff5a6a");
    } else if (kind === "shield") {
      p.shield = true;
      sfx("shield", { vol: 0.8 });
      this.popText("방패!", "#8ae8ff");
    } else if (kind === "egg") {
      this.run.eggs++;
      sfx("egg", { vol: 1 }); sfx("gem", { vol: 0.6, delay: 0.25 });
      this.fx.add("coinBurst", p.x + 20, p.y + 6); this.flash = 0.35; this.flashColor = "#fff4bc"; this.addShake(3);
      this.fx.add("coinDrop", p.x + 40, p.y + 2);
      for (let i = 0; i < 14; i++) this.coins.push({ x: p.x + 50 + i * 16, y: GROUND - 20 - Math.sin(i / 13 * Math.PI) * 70, kind: i % 5 === 4 ? "gem" : "coin", ph: i * 0.2, mag: true });
      this.popText("황금알! 코인 폭탄!", "#ffde5e");
    }
  }

  popText(text, color = "#fff", big = 0) {
    this.pops.push({ x: W / 2, y: 122 + (this.pops.filter((q) => q.screen).length % 4) * 14, text, color, t: 0, life: 1.4, screen: true, big });
  }
  worldText(x, y, text, color = "#fff") { this.pops.push({ x, y, text, color, t: 0, life: 0.8 }); }

  // ---------------------------------------------------------------- particles
  part(o) { this.parts.push({ g: 0, drag: 0, size: 2, life: 0.5, t: 0, ...o }); }
  dust(x, y, vx, vy) { this.part({ x, y, vx, vy, g: -20, drag: 3, size: ri(2, 4), life: rnd(0.25, 0.5), color: pick(["#d2b48e", "#b08c68", "#efe0c4"]), kind: "dust" }); }
  sparkle(x, y, color = "#fff6c4", n = 6, sp = 120) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), s = rnd(sp * 0.4, sp);
      this.part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 4, size: pick([1, 2, 2]), life: rnd(0.25, 0.5), color, kind: "spark" });
    }
  }
  debris(x, y, colors, n = 10) {
    for (let i = 0; i < n; i++) this.part({ x: x + rnd(-6, 6), y: y + rnd(-10, 4), vx: rnd(40, 260), vy: rnd(-380, -120), g: 1100, size: ri(2, 4), life: rnd(0.6, 1.1), color: pick(colors), spin: true });
  }
  feathers(x, y, n, pal) {
    for (let i = 0; i < n; i++) this.part({ x: x + rnd(-6, 6), y: y + rnd(-16, -4), vx: rnd(-80, 60), vy: rnd(-120, 20), g: 60, drag: 2.5, size: 2, life: rnd(0.6, 1.2), color: pick(pal), kind: "feather", ph: Math.random() * 6 });
  }
  addShake(n) { if (this.save.settings.shake) this.shake = Math.max(this.shake, n); }

  // ---------------------------------------------------------------- update
  update(dtReal) {
    this.time += dtReal;
    if (this.state === "idle") { this.idleUpdate(dtReal); return; }
    if (this.state === "paused") return;
    if (this.hitstop > 0) { this.hitstop -= dtReal; this.shake *= 0.9; return; }
    const dt = dtReal * this.slowmo;
    this.slowmo = Math.min(1, this.slowmo + dtReal * 1.5);
    const step = 1 / 120;
    this.acc = (this.acc || 0) + dt;
    let n = 0;
    while (this.acc >= step && n++ < 8) { this.step(step); this.acc -= step; }
    this.frame(dt);
  }

  idleUpdate(dt) {
    // the title screen: the chicken jogs on an endless flat field
    this.p.x += 120 * dt;
    this.p.anim += dt * 10;
    this.camX = this.p.x - PX;
    if (this.genX < this.camX + W + 200) { this.addSolid(this.genX, GROUND, 400, "ground"); this.genX += 400; }
    this.solids = this.solids.filter((s) => s.x + s.w > this.camX - 100);
    this.stepT -= dt;
    if (this.stepT <= 0) { this.stepT = 0.08; this.dust(this.p.x - 6, this.p.y, -30, -20); }
    this.updateParts(dt);
    this.fx.update(dt);
  }

  step(dt) {
    const p = this.p;
    if (!p.alive) {
      p.deadT += dt;
      p.vy += 1100 * dt; p.y += p.vy * dt; p.x += p.vx * dt; p.rot += dt * 9;
      return;
    }
    const v = this.worldSpeed;
    const prevY = p.y;
    p.x += v * dt;
    this.dist = p.x / PPM;

    // moving platforms carry the chicken
    for (const s of this.solids) {
      if (s.move) {
        const ny = s.oy + Math.sin(this.time * s.move.spd + s.move.ph) * s.move.ay;
        s.dy = ny - s.y; s.y = ny;
      }
      if (s.falling) { s.vy = (s.vy || 0) + 900 * dt; s.y += s.vy * dt; }
    }
    if (p.ground && p.ground.move) p.y = p.ground.y;

    // vertical motion
    if (p.booster > 0) {
      if (p.holding) { p.vy -= 2600 * dt; p.vy = Math.max(p.vy, -300); }
      else { p.vy += 1000 * dt; p.vy = Math.min(p.vy, 230); }
      if (p.y < 74) { p.y = 74; p.vy = Math.max(p.vy, 0); }
      p.gliding = false;
    } else if (!p.ground) {
      let g = GRAV;
      if (p.vy < 0 && p.holding && p.holdT < HOLD_T) { g *= 0.35; p.holdT += dt; }
      p.gliding = false;
      if (p.vy >= 0 && p.holding && p.glideLeft > 0) {
        p.gliding = true; g = 260; p.glideLeft -= dt; this.run.glide += dt;
        if (p.vy > 75) p.vy = Math.max(75, p.vy - 2200 * dt);
      }
      if (p.boostGrace > 0) g *= 0.5;
      p.vy = Math.min(p.vy + g * dt, MAX_FALL);
    }
    if (!p.ground) p.y += p.vy * dt;

    // ground contact
    if (p.ground) {
      const s = p.ground;
      if (p.x + 7 < s.x || p.x - 7 > s.x + s.w || s.falling) { p.ground = null; p.coyote = 0.09; }
    }
    if (!p.ground && p.vy >= 0) {
      for (const s of this.solids) {
        if (s.falling) continue;
        if (p.x + 7 < s.x || p.x - 7 > s.x + s.w) continue;
        const top = s.y;
        if (prevY <= top + 2 + Math.max(0, s.dy) && p.y >= top - 0.5) { this.land(s, p.vy); break; }
        // ledge assist: clipped the lip of a ground block
        if (s.kind === "ground" && p.y > top && p.y < top + 9 && prevY < top + 9) { this.land(s, p.vy); break; }
      }
    }
    if (p.coyote > 0) p.coyote -= dt;
    if (p.buffer > 0) p.buffer -= dt;

    // springs
    for (const sp of this.springs) {
      if (p.x + 8 > sp.x && p.x - 8 < sp.x + sp.w && p.y >= sp.y - 10 && p.y <= sp.y + 2 && p.vy >= 0) {
        p.ground = null; p.vy = -720; p.holdT = HOLD_T; p.glideLeft = this.glideMax; sp.t = 0.3;
        p.sx = 0.7; p.sy = 1.4;
        this.run.springs++;
        sfx("spring", { vol: 0.8 });
        this.addShake(2);
        this.fx.add("spark", sp.x + sp.w / 2, sp.y - 6, { rot: -Math.PI / 2 });
        this.sparkle(sp.x + sp.w / 2, sp.y - 4, "#ffffff", 8, 160);
      }
    }

    // fell into the water
    if (p.y > H + 10) {
      if (p.shield || p.speed > 0 || p.invuln > 0) {
        if (p.shield && p.speed <= 0 && p.invuln <= 0) this.breakShield();
        p.y = H; p.vy = -690; p.ground = null; p.holdT = HOLD_T; p.glideLeft = this.glideMax;
        this.fx.add("splash", p.x, GROUND + 26);
        sfx("spring", { vol: 0.8, rate: 0.8 });
        this.popText("살았다!", "#8ae8ff");
      } else {
        this.fx.add("splash", p.x, GROUND + 26);
        sfx("fall", { vol: 0.8 });
        this.die(true);
        return;
      }
    }
    this.collide();
  }

  land(s, vy) {
    const p = this.p;
    p.y = s.y; p.vy = 0; p.ground = s; p.gliding = false;
    p.glideLeft = this.glideMax;
    if (vy > 380) {
      p.sx = 1.35; p.sy = 0.7;
      sfx("land", { vol: Math.min(1, vy / 700) * 0.8 });
      for (let i = 0; i < 8; i++) this.dust(p.x + rnd(-10, 10), p.y, rnd(-90, 90), rnd(-50, -10));
      if (vy > 560) { this.fx.add("land", p.x, p.y); this.addShake(2); }
    } else if (vy > 120) {
      p.sx = 1.15; p.sy = 0.88;
      for (let i = 0; i < 3; i++) this.dust(p.x + rnd(-8, 8), p.y, rnd(-50, 50), rnd(-30, -5));
    }
    if (s.crumble === -1) {
      s.crumble = 0.42;
      sfx("crumble", { vol: 0.5, rate: 1.3 });
    }
    if (p.buffer > 0) this.jump();
  }

  breakShield() {
    const p = this.p;
    p.shield = false; p.invuln = 1.4;
    this.fx.add("shieldBreak", p.x, p.y - 4);
    this.fx.add("heartLost", p.x, p.y - 40);
    sfx("shieldbreak", { vol: 1 });
    this.hitstop = 0.08; this.addShake(5); this.flash = 0.4; this.flashColor = "#8ae8ff";
  }

  collide() {
    const p = this.p;
    const bx = p.x - 9, by = p.y - 26, bw = 18, bh = 24;
    for (const o of this.obs) {
      if (o.dead) continue;
      const ox = o.x, oy = o.kind === "crow" ? o.y - o.h / 2 : o.y - o.h;
      const pad = o.kind === "thorns" ? 3 : 2;
      if (bx + bw < ox + pad || bx > ox + o.w - pad || by + bh < oy + pad || by > oy + o.h) continue;
      if (o.kind === "crow" && p.vy > 0 && p.y < o.y + 2) { this.stompCrow(o); continue; }
      if (p.speed > 0) { this.smash(o); continue; }
      if (p.invuln > 0) continue;
      if (p.shield) { this.breakShield(); this.smash(o, true); continue; }
      this.die(false, o);
      return;
    }
    // coins
    const cx = p.x, cy = p.y - 14;
    for (const c of this.coins) {
      if (c.taken) continue;
      const dx = c.x - cx, dy = c.y - cy, d2 = dx * dx + dy * dy;
      if (d2 < 16 * 16) this.takeCoin(c);
    }
    for (const it of this.items) {
      if (it.taken) continue;
      const dx = it.x - cx, dy = it.y + Math.sin(this.time * 3 + it.ph) * 4 - cy;
      if (dx * dx + dy * dy < 22 * 22) {
        it.taken = true;
        this.fx.add("itemBurst", it.x, it.y + 20);
        sfx("item", { vol: 0.8 });
        this.hitstop = 0.05;
        this.sparkle(it.x, it.y, "#c8fff0", 14, 200);
        this.activate(it.kind);
      }
    }
  }

  stompCrow(o) {
    const p = this.p;
    o.dead = true; o.vy = -100; o.spin = 0;
    p.vy = -520; p.holdT = HOLD_T; p.glideLeft = this.glideMax;
    this.run.crows++;
    sfx("hit", { vol: 0.8, rate: 1.3 }); sfx("jump", { vol: 0.4, rate: 1.4 });
    this.fx.add("spark", o.x + o.w / 2, o.y, { rot: Math.PI / 2 });
    this.feathers(o.x + o.w / 2, o.y + 10, 8, ["#2a2438", "#4a4458", "#0a0810"]);
    this.hitstop = 0.05; this.addShake(3);
    this.score += 100;
    this.worldText(o.x, o.y - 10, "+100 꾹!", "#fff07a");
    for (let i = 0; i < 3; i++) this.coins.push({ x: o.x + 30 + i * 16, y: o.y - 20, kind: "coin", ph: i, mag: true });
  }

  smash(o, quiet) {
    o.dead = true; o.flyVx = rnd(260, 380); o.flyVy = rnd(-420, -260); o.spin = 0;
    this.run.smash++;
    this.score += 50;
    const cx = o.x + o.w / 2, cy = o.y - o.h / 2;
    this.fx.add(Math.random() < 0.5 ? "pow" : "bam", cx + 10, cy - 6);
    this.fx.add("crit", cx - 20, o.y);
    sfx("smash", { vol: 0.9 });
    sfx(o.kind === "crate" || o.kind === "fence" ? "crate" : "metal", { vol: 0.7 });
    if (!quiet) { this.hitstop = 0.07; this.addShake(6); this.zoom = 1.04; }
    const cols = o.kind === "hay" ? ["#e8c050", "#fff0a0", "#b08828"] : o.kind === "thorns" ? ["#3a7a2a", "#24501a", "#e03040"] : ["#a86a38", "#d08c4a", "#7a4a24", "#3a2214"];
    this.debris(cx, cy, cols, 16);
    this.worldText(o.x, o.y - o.h - 8, "+50 SMASH!", "#ffc23d");
  }

  takeCoin(c) {
    c.taken = true;
    if (this.comboT > 0) this.combo++; else this.combo = 1;
    this.comboT = 1.0;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const mult = this.p.speed > 0 ? 2 : 1;
    if (c.kind === "gem") {
      this.coinCount += 5 * this.coinMult; this.score += 50 * mult; this.run.gems++;
      this.fx.add("gemBurst", c.x, c.y + 20);
      sfx("gem", { vol: 0.7 });
      this.worldText(c.x, c.y - 12, "+5", "#ff86e6");
    } else {
      this.coinCount += 1 * this.coinMult; this.score += 10 * mult;
      coinSound(Math.min(this.combo - 1, 14));
      if (this.combo % 5 === 0) this.fx.add("coinBurst", c.x, c.y + 20, { alpha: 0.9 });
    }
    this.sparkle(c.x, c.y, "#fff6c4", 5, 90);
    const milestones = { 10: "combo10", 25: "combo25", 50: "combo50", 100: "combo100" };
    if (milestones[this.combo]) {
      this.sfx2.add(milestones[this.combo], W / 2, 64);
      sfx("combo", { vol: 0.8 });
      this.flash = 0.25; this.flashColor = "#ffd2f6";
      this.score += this.combo * 10;
    }
  }

  die(fell, o) {
    const p = this.p;
    if (!p.alive) return;
    p.alive = false;
    jetLoop(false);
    setBgmRate(1);
    p.booster = 0; p.speed = 0;
    this.save.stats.deaths++;
    if (!fell) {
      sfx("hit", { vol: 1 }); sfx("die", { vol: 0.7, delay: 0.05 });
      this.fx.add("pow", p.x + 8, p.y - 20);
      this.fx.add("feathers", p.x, p.y - 14);
      this.feathers(p.x, p.y, 20, ["#e4c0a3", "#f5ddca", "#95655a", "#ffffff"]);
      this.hitstop = 0.16; this.addShake(9); this.flash = 0.7; this.flashColor = "#ffffff"; this.slowmo = 0.3;
      p.vy = -420; p.vx = -60;
    } else {
      p.vy = 0; p.vx = 0;
      this.addShake(4);
    }
    this.state = "dying";
    this.dieT = fell ? 0.9 : 1.4;
  }

  revive() {
    const p = this.p;
    this.revived = true;
    p.alive = true; p.rot = 0; p.vx = 0; p.deadT = 0;
    p.y = 120; p.vy = -100; p.ground = null;
    p.invuln = 2.5;
    // clear hazards right ahead
    for (const o of this.obs) if (o.x > p.x - 40 && o.x < p.x + 500) o.dead = true;
    this.state = "run";
    this.activate("booster", true);
    p.booster = 3;
    this.sfx2.add("countdown", W / 2, 120, { speed: 1.6 });
    sfx("go", { vol: 0.8 });
    this.fx.add("feathers", p.x, p.y - 14);
  }

  frame(dt) {
    const p = this.p;
    // timers
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
    p.invuln = Math.max(0, p.invuln - dt);
    p.boostGrace = Math.max(0, p.boostGrace - dt);
    if (p.booster > 0) {
      p.booster -= dt;
      jetLoop(true, p.holding ? 1 : 0.15);
      if (p.booster <= 0) { jetLoop(false); p.boostGrace = 1; p.glideLeft = this.glideMax; this.popText("부스터 끝!", "#ffc23d"); }
    }
    if (p.speed > 0) { p.speed -= dt; if (p.speed <= 0) { setBgmRate(1); p.invuln = Math.max(p.invuln, 0.8); } }
    if (p.magnet > 0) p.magnet -= dt;
    p.sx += (1 - p.sx) * Math.min(1, dt * 14); p.sy += (1 - p.sy) * Math.min(1, dt * 14);
    p.anim += dt * (this.worldSpeed / 18);
    p.flap += dt * (p.gliding ? 14 : 0);
    this.zoom += (1 - this.zoom) * Math.min(1, dt * 10);

    // crumbling platforms
    for (const s of this.solids) {
      if (s.crumble > 0) {
        s.crumble -= dt;
        if (s.crumble <= 0) {
          s.falling = true; s.vy = 0;
          sfx("crumble", { vol: 0.6 });
          this.debris(s.x + s.w / 2, s.y, ["#8a8aa0", "#5a5a70", "#b8b8cc"], 8);
        }
      }
    }
    for (const sp of this.springs) sp.t = Math.max(0, sp.t - dt);

    // crows flap along
    for (const o of this.obs) {
      if (o.kind === "crow" && !o.dead) { o.x += o.vx * dt; o.y = o.by + Math.sin(this.time * 4 + o.ph) * 5; }
      if (o.dead) {
        o.spin = (o.spin || 0) + dt * 12;
        if (o.flyVx !== undefined) { o.x += o.flyVx * dt; o.y += o.flyVy * dt; o.flyVy += 1200 * dt; }
        else { o.vy = (o.vy || 0) + 900 * dt; o.y += o.vy * dt; }
      }
    }

    // magnet & magnet-flagged coins fly to the chicken
    const cx = p.x, cy = p.y - 14;
    for (const c of this.coins) {
      if (c.taken) continue;
      const dx = cx - c.x, dy = cy - c.y, d = Math.hypot(dx, dy);
      if ((p.magnet > 0 && d < 130) || (c.mag && d < 200) || c.pulled) {
        c.pulled = true;
        const sp = 460 + (130 - Math.min(d, 130)) * 3;
        c.x += (dx / (d || 1)) * sp * dt + this.worldSpeed * dt * 0.9;
        c.y += (dy / (d || 1)) * sp * dt;
      }
    }

    // run dust, footsteps, trails, afterimages
    if (p.alive && this.state === "run") {
      if (p.ground) {
        this.stepT -= dt;
        if (this.stepT <= 0) {
          this.stepT = 0.11 * (210 / this.worldSpeed);
          if (this.save.trail === "dust" || this.save.trail === "none") this.dust(p.x - 6, p.y, -40, rnd(-30, -10));
          sfx(Math.random() < 0.5 ? "step1" : "step2", { vol: 0.12, rate: 1.4 });
        }
      }
      this.trailT -= dt;
      if (this.trailT <= 0) { this.trailT = 0.05; this.emitTrail(); }
      if (p.gliding && Math.random() < dt * 8) this.feathers(p.x - 6, p.y - 8, 1, this.skinFeathers());
      if (p.gliding && Math.floor(p.flap) % 2 === 0 && !p._flapped) { p._flapped = true; sfx("flap", { vol: 0.25, rate: 1.8 }); }
      if (Math.floor(p.flap) % 2 === 1) p._flapped = false;
      if (p.speed > 0) {
        this.ghostT -= dt;
        if (this.ghostT <= 0) { this.ghostT = 0.035; this.ghosts.push({ x: p.x, y: p.y, pose: this.pose(), t: 0 }); }
        if (Math.random() < dt * 40) this.speedLines.push({ x: W + 10, y: rnd(20, H - 20), len: rnd(20, 70), v: rnd(900, 1500) });
      }
      if (p.booster > 0 && p.holding && Math.random() < dt * 30) {
        this.part({ x: p.x - 12, y: p.y + 4, vx: rnd(-80, -20), vy: rnd(80, 200), g: -80, drag: 2, size: ri(3, 5), life: rnd(0.4, 0.7), color: pick(["#6c6688", "#a8a2c0", "#3a3450"]), kind: "smoke" });
      }
      // distance milestones
      if (this.dist >= this.nextSpeedUp) {
        this.nextSpeedUp += 500;
        this.sfx2.add("speedUp", W / 2, 150, { clip: 62 });
        sfx("levelup", { vol: 0.7 });
        this.score += 500;
      }
      const bm = biomeAt(this.dist);
      if (bm.index !== this.lastBiome) { this.lastBiome = bm.index; this.banner = { text: bm.name, t: 0 }; }
      this.score += this.worldSpeed * dt * 0.05 * (p.speed > 0 ? 2 : 1);
      this.checkMissions();
    }
    this.ghosts.forEach((g) => (g.t += dt));
    this.ghosts = this.ghosts.filter((g) => g.t < 0.25);
    this.speedLines.forEach((l) => (l.x -= l.v * dt));
    this.speedLines = this.speedLines.filter((l) => l.x + l.len > 0);

    // camera
    const want = p.speed > 0 ? 150 : PX;
    this.camOff += (want - this.camOff) * Math.min(1, dt * 3);
    if (p.alive) this.camX = p.x - this.camOff;
    this.shake *= Math.pow(0.0005, dt);
    if (this.shake < 0.3) this.shake = 0;
    this.flash = Math.max(0, this.flash - dt * 2.5);

    // generate ahead, forget behind
    while (this.genX < this.camX + W + 500) this.genChunk();
    const left = this.camX - 200;
    this.solids = this.solids.filter((s) => s.x + s.w > left && s.y < H + 200);
    this.obs = this.obs.filter((o) => o.x + o.w > left && o.y < H + 100);
    this.coins = this.coins.filter((c) => !c.taken && c.x > left);
    this.items = this.items.filter((c) => !c.taken && c.x > left);
    this.springs = this.springs.filter((c) => c.x > left);

    this.updateParts(dt);
    this.fx.update(dt);
    this.sfx2.update(dt);
    this.pops.forEach((q) => (q.t += dt));
    this.pops = this.pops.filter((q) => q.t < q.life);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 2.6) this.banner = null; }

    if (this.state === "dying") {
      this.dieT -= dt;
      if (this.dieT <= 0) { this.state = "over"; this.hooks.onGameOver(this.result()); }
    }
    this.hooks.onHud && this.hooks.onHud();
  }

  skinFeathers() {
    const sk = SKINS.find((s) => s.id === this.save.skin) || SKINS[0];
    const pal = sk.pal || {};
    return [pal.S || "#e4c0a3", pal.L || "#f5ddca", pal.W || "#c49488"];
  }

  emitTrail() {
    const p = this.p, t = this.save.trail;
    const x = p.x - 12, y = p.y - 10 + rnd(-4, 4);
    if (t === "hearts") this.part({ x, y, vx: -40, vy: -20, size: 1, life: 0.7, kind: "heart", color: pick(["#ff4a6a", "#ff8aa0"]) });
    else if (t === "stars") this.part({ x, y, vx: rnd(-60, -20), vy: rnd(-30, 30), size: 1, life: 0.6, kind: "star", color: pick(["#fff07a", "#ffffff", "#ffc23d"]) });
    else if (t === "notes") this.part({ x, y: y - 6, vx: -30, vy: -40, size: 1, life: 0.8, kind: "note", color: pick(["#7ad8ff", "#ff86e6", "#fff07a"]) });
    else if (t === "fire") for (let i = 0; i < 2; i++) this.part({ x: x + 4, y: y + 2, vx: rnd(-90, -40), vy: rnd(-60, -10), g: -120, drag: 2, size: ri(2, 4), life: rnd(0.25, 0.45), kind: "fire", color: pick(["#fff3a6", "#ffc23d", "#ff8a2a", "#e0501a"]) });
    else if (t === "rainbow") {
      const cols = ["#ff4a4a", "#ffa03a", "#ffe03c", "#5ad84a", "#3cc8ff", "#7a6cff"];
      cols.forEach((c, i) => this.part({ x: x + 6, y: p.y - 20 + i * 2, vx: -this.worldSpeed * 0.0, vy: 0, size: 2, life: 0.35, kind: "band", color: c, w: 8 }));
    }
  }

  updateParts(dt) {
    for (const q of this.parts) {
      q.t += dt;
      q.vy += q.g * dt;
      if (q.drag) { const k = Math.exp(-q.drag * dt); q.vx *= k; q.vy *= k; }
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    this.parts = this.parts.filter((q) => q.t < q.life);
    if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);
  }

  pose() {
    const p = this.p;
    if (!p.alive) return ["dead", 0];
    if (this.state === "idle") return ["run", Math.floor(p.anim) % 4];
    if (p.booster > 0) return ["glide", p.holding ? Math.floor(this.time * 16) % 2 : 0];
    if (p.ground) return ["run", Math.floor(p.anim) % 4];
    if (p.gliding) return ["glide", Math.floor(p.flap) % 2];
    return p.vy < 0 ? ["jump", 0] : ["fall", 0];
  }

  checkMissions() {
    const ms = this.save.missions;
    for (const m of ms) {
      if (m.done || this.missionsShown.has(m)) continue;
      if (this.missionProgress(m) >= m.goal) {
        this.missionsShown.add(m);
        this.sfx2.add("mission", W / 2, 46);
        sfx("j_mission", { vol: 0.7, vary: 0 });
        this.hooks.onMission && this.hooks.onMission(m);
      }
    }
  }
  missionProgress(m) {
    const runVal = { dist: Math.floor(this.dist), coins: this.coinCount, combo: this.maxCombo, coinsTotal: this.coinCount, ...this.run }[m.key] || 0;
    const t = { dist: 1, coins: 1, combo: 1 }[m.key];
    if (t) return Math.max(m.progress || 0, runVal);
    return (this.save.stats[m.key] || 0) + runVal - m.base;
  }

  result() {
    return { score: Math.floor(this.score), dist: Math.floor(this.dist), coins: this.coinCount, combo: this.maxCombo, run: { ...this.run }, revived: this.revived };
  }

  // ---------------------------------------------------------------- draw
  draw() {
    const ctx = this.ctx, p = this.p;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    const sx = this.shake ? Math.round(rnd(-1, 1) * this.shake) : 0, sy = this.shake ? Math.round(rnd(-1, 1) * this.shake) : 0;
    if (this.zoom !== 1) { ctx.translate(PX, GROUND - 20); ctx.scale(this.zoom, this.zoom); ctx.translate(-PX, -(GROUND - 20)); }
    ctx.translate(sx, sy);
    const camX = Math.round(this.camX);
    drawBackground(ctx, camX, this.dist, this.time);

    // water in the pits
    const wy = GROUND + 28;
    ctx.fillStyle = "#1e4f9e"; ctx.fillRect(-10, wy, W + 20, H - wy + 10);
    ctx.fillStyle = "#2582d2"; ctx.fillRect(-10, wy, W + 20, 3);
    ctx.fillStyle = "#8ae8ff";
    for (let x = -((camX * 0.9 + this.time * 30) % 24); x < W; x += 24) ctx.fillRect(Math.round(x), wy + (Math.floor(x / 24) % 2), 8, 1);

    if (!p.alive) this.drawChicken(camX);
    this.drawSolids(ctx, camX);
    this.drawSprings(ctx, camX);
    this.drawPartsLayer(ctx, camX, "back");
    this.drawCoins(ctx, camX);
    this.drawItems(ctx, camX);
    this.drawObstacles(ctx, camX);
    if (p.alive) this.drawChicken(camX);
    this.fx.draw(ctx, camX, 0);
    this.drawPartsLayer(ctx, camX, "front");
    // speed lines
    if (this.speedLines.length) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      for (const l of this.speedLines) ctx.fillRect(Math.round(l.x), Math.round(l.y), Math.round(l.len), 1);
    }
    this.drawPops(ctx, camX);
    ctx.restore();

    this.sfx2.draw(ctx, 0, 0);
    if (this.state !== "idle") this.drawHud(ctx);
    if (this.flash > 0) {
      ctx.globalAlpha = Math.min(1, this.flash);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    // speed vignette
    if (p.speed > 0 || p.booster > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 300);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, p.speed > 0 ? "rgba(40,80,255,0.35)" : "rgba(255,120,30,0.25)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  drawSolids(ctx, camX) {
    const T = groundTiles();
    for (const s of this.solids) {
      const x = Math.round(s.x - camX), y = Math.round(s.y);
      if (x > W || x + s.w < 0) continue;
      if (s.kind === "ground") {
        for (let tx = 0; tx < s.w; tx += 16) {
          const w = Math.min(16, s.w - tx);
          ctx.drawImage(T.top, 0, 0, w, 16, x + tx, y, w, 16);
          for (let ty = 16; ty < H - y + 16; ty += 16) ctx.drawImage(T.fill, 0, 0, w, 16, x + tx, y + ty, w, 16);
        }
        ctx.fillStyle = "#3a2214";
        ctx.fillRect(x, y + 4, 2, H - y); ctx.fillRect(x + s.w - 2, y + 4, 2, H - y);
        ctx.fillStyle = "#2a5a1a"; ctx.fillRect(x - 1, y, 2, 6); ctx.fillRect(x + s.w - 1, y, 2, 6);
      } else {
        let jx = 0, jy = 0;
        if (s.crumble > 0) { jx = Math.round(rnd(-1, 1)); jy = Math.round(rnd(-1, 1)); }
        const tile = s.kind === "stone" ? T.stone : s.kind === "cloud" ? T.cloud : T.plank;
        if (s.falling) ctx.globalAlpha = Math.max(0, 1 - (s.y - s.oy) / 120);
        for (let tx = 0; tx < s.w; tx += 16) {
          const w = Math.min(16, s.w - tx);
          ctx.drawImage(tile, 0, 0, w, 8, x + tx + jx, y + jy, w, 8);
        }
        if (s.move) {
          ctx.fillStyle = "#9d98b0"; ctx.fillRect(x + jx, y + jy + 1, 3, 5); ctx.fillRect(x + s.w - 3 + jx, y + jy + 1, 3, 5);
          ctx.fillStyle = "#ffe03c"; ctx.fillRect(x + s.w / 2 - 1, y + 8, 2, 2);
        }
        if (s.kind === "stone") {
          ctx.fillStyle = "#2a2a3a";
          for (let tx = 10; tx < s.w - 4; tx += 22) ctx.fillRect(x + tx + jx, y + 2 + jy, 1, 3);
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  drawSprings(ctx, camX) {
    const P = getProps();
    for (const sp of this.springs) {
      const img = sp.t > 0 ? P.spring[1] : P.spring[0];
      ctx.drawImage(img, Math.round(sp.x - camX + (sp.w - img.width * 2) / 2), Math.round(sp.y - img.height * 2), img.width * 2, img.height * 2);
    }
  }

  drawCoins(ctx, camX) {
    for (const c of this.coins) {
      const x = c.x - camX;
      if (x < -20 || x > W + 20) continue;
      const f = Math.floor(this.time * 20 + c.ph * 10);
      drawFxFrame(ctx, c.kind === "gem" ? "gem" : "coin", f, x, c.y, { center: true, clip: 7, lightK: 0.7 });
    }
  }

  drawItems(ctx, camX) {
    const P = getProps();
    for (const it of this.items) {
      const x = Math.round(it.x - camX), y = Math.round(it.y + Math.sin(this.time * 3 + it.ph) * 4);
      if (x < -30 || x > W + 30) continue;
      // bubble
      const pulse = 1 + Math.sin(this.time * 6) * 0.06;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(140,255,220,0.18)";
      ctx.beginPath(); ctx.arc(x, y, 17 * pulse, 0, 7); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, 13, 0, 7); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.fillRect(x - 7, y - 9, 3, 2);
      if (it.kind === "booster") ctx.drawImage(P.rocket, x - 10, y - 11, 20, 22);
      else if (it.kind === "magnet") ctx.drawImage(P.magnet, x - 12, y - 10, 24, 20);
      else if (it.kind === "egg") ctx.drawImage(P.egg, x - 10, y - 10, 20, 20);
      else if (it.kind === "shield") drawFxFrame(ctx, "heart", Math.floor(this.time * 20), x, y, { center: true, clip: 7 });
      else if (it.kind === "speed") drawFxFrame(ctx, "star", Math.floor(this.time * 20), x, y, { center: true, clip: 10, scale: 0.5 });
      ctx.font = "8px Galmuri11, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "#000"; ctx.fillText(ITEM_LABEL[it.kind].replace("!", ""), x + 1, y - 19);
      ctx.fillStyle = "#fff"; ctx.fillText(ITEM_LABEL[it.kind].replace("!", ""), x, y - 20);
    }
  }

  drawObstacles(ctx, camX) {
    const P = getProps();
    for (const o of this.obs) {
      const x = Math.round(o.x - camX);
      if (x < -60 || x > W + 60) continue;
      ctx.save();
      if (o.kind === "crow") {
        const img = P.crow[Math.floor(this.time * 8 + o.ph) % 2];
        ctx.translate(x + o.w / 2, Math.round(o.y));
        if (o.dead) ctx.rotate(o.spin);
        ctx.drawImage(img, -img.width, -img.height, img.width * 2, img.height * 2);
        ctx.restore();
        continue;
      }
      const w = o.img.width, h = o.img.height;
      ctx.translate(x + w / 2, Math.round(o.y) - o.h / 2);
      if (o.dead) ctx.rotate(o.spin);
      if (o.stack) { ctx.drawImage(o.img, -w / 2, -h); ctx.drawImage(o.img, -w / 2, 0); }
      else ctx.drawImage(o.img, -w / 2, -h / 2);
      ctx.restore();
    }
  }

  drawChicken(camX) {
    const ctx = this.ctx, p = this.p, s = this.save;
    const [pose, fr] = this.pose();
    const x = p.x - camX;
    const phase = Math.floor(this.time * 8);
    for (const g of this.ghosts) {
      ctx.save();
      ctx.globalAlpha = 0.45 * (1 - g.t / 0.25);
      ctx.filter = "sepia(1) hue-rotate(180deg) saturate(4) brightness(1.3)";
      drawChicken(ctx, g.pose[0], g.pose[1], s.skin, s.hat, g.x - camX, g.y, { phase });
      ctx.restore();
    }
    if (p.booster > 0 && p.alive) {
      const f = Math.floor(this.time * 30);
      drawFxFrame(ctx, "jet", f, x - 12, p.y - 12, { rot: 0.3, lightK: p.holding ? 1 : 0.5, alpha: p.holding ? 1 : 0.8 });
    }
    if (p.shield && p.alive) drawFxFrame(ctx, "field", Math.floor(this.time * 20), x, p.y + 2, { alpha: 0.75, lightK: 0.6 });
    if (p.magnet > 0 && p.alive) {
      ctx.fillStyle = "#ff8a9a";
      for (let i = 0; i < 6; i++) {
        const a = this.time * 4 + (i * Math.PI) / 3;
        ctx.fillRect(Math.round(x + Math.cos(a) * 22), Math.round(p.y - 16 + Math.sin(a) * 18), 2, 2);
      }
    }
    const blink = p.invuln > 0 && p.alive && Math.floor(this.time * 20) % 2 === 0;
    const flash = p.speed > 0 && Math.floor(this.time * 12) % 3 === 0;
    let rot = p.alive ? (p.booster > 0 ? -0.15 + p.vy * 0.0006 : p.gliding ? 0.08 : 0) : p.rot;
    drawChicken(ctx, pose, fr, s.skin, s.hat, x, p.y + (p.ground ? 0 : 0), { phase, rot, sx: p.sx, sy: p.sy, alpha: blink ? 0.35 : 1, flash });
    // glide stamina pips
    if (p.alive && !p.ground && p.booster <= 0 && p.glideLeft < this.glideMax - 0.01) {
      const k = clamp(p.glideLeft / this.glideMax, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(Math.round(x) - 11, Math.round(p.y) - 52, 22, 4);
      ctx.fillStyle = k > 0.3 ? "#9be05a" : "#ff5a4a"; ctx.fillRect(Math.round(x) - 10, Math.round(p.y) - 51, Math.round(20 * k), 2);
    }
  }

  drawPartsLayer(ctx, camX, layer) {
    for (const q of this.parts) {
      const front = q.kind === "spark" || q.kind === "feather" || q.spin || q.kind === "star" || q.kind === "heart" || q.kind === "note";
      if ((layer === "front") !== front) continue;
      const k = 1 - q.t / q.life;
      const x = Math.round(q.x - camX), y = Math.round(q.y);
      ctx.fillStyle = q.color;
      ctx.globalAlpha = q.kind === "smoke" || q.kind === "dust" ? k * 0.8 : Math.min(1, k * 2);
      if (q.kind === "heart") { ctx.fillRect(x, y, 2, 2); ctx.fillRect(x + 3, y, 2, 2); ctx.fillRect(x - 1, y + 1, 7, 2); ctx.fillRect(x, y + 3, 5, 1); ctx.fillRect(x + 1, y + 4, 3, 1); ctx.fillRect(x + 2, y + 5, 1, 1); }
      else if (q.kind === "star") { ctx.fillRect(x, y - 2, 1, 5); ctx.fillRect(x - 2, y, 5, 1); }
      else if (q.kind === "note") { ctx.fillRect(x, y, 3, 2); ctx.fillRect(x + 2, y - 5, 1, 5); ctx.fillRect(x + 3, y - 5, 2, 1); }
      else if (q.kind === "band") ctx.fillRect(x - Math.round(q.t * this.worldSpeed), y, q.w, 2);
      else if (q.kind === "feather") { const s = Math.sin(this.time * 8 + q.ph) > 0; ctx.fillRect(x, y, s ? 3 : 2, s ? 1 : 2); }
      else { const sz = q.kind === "dust" || q.kind === "smoke" ? Math.max(1, Math.round(q.size * (0.6 + q.t / q.life))) : q.size; ctx.fillRect(x - (sz >> 1), y - (sz >> 1), sz, sz); }
    }
    ctx.globalAlpha = 1;
  }

  drawPops(ctx, camX) {
    ctx.textAlign = "center";
    for (const q of this.pops) {
      const k = q.t / q.life;
      const pop = q.t < 0.12 ? 1 + (0.12 - q.t) * 5 : 1;
      const x = q.screen ? q.x : q.x - camX;
      const y = q.screen ? q.y - k * 8 : q.y - k * 26;
      const size = q.screen ? (q.big ? 16 : 12) : 8;
      ctx.font = `${Math.round(size * pop)}px Galmuri11, monospace`;
      ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
      ctx.fillStyle = "#1a0e14";
      ctx.fillText(q.text, Math.round(x) + 1, Math.round(y) + 1);
      ctx.fillText(q.text, Math.round(x) - 1, Math.round(y) + 1);
      ctx.fillStyle = q.color;
      ctx.fillText(q.text, Math.round(x), Math.round(y));
    }
    ctx.globalAlpha = 1;
  }

  drawHud(ctx) {
    const p = this.p;
    ctx.textAlign = "left";
    const txt = (t, x, y, c = "#fff", size = 12, align = "left") => {
      ctx.font = `${size}px Galmuri11, monospace`; ctx.textAlign = align;
      ctx.fillStyle = "#1a0e14"; ctx.fillText(t, x + 1, y + 1); ctx.fillText(t, x, y + 1);
      ctx.fillStyle = c; ctx.fillText(t, x, y);
    };
    txt(`${Math.floor(this.dist)}m`, 10, 18, "#ffffff", 16);
    txt(`점수 ${Math.floor(this.score).toLocaleString()}`, 10, 34, "#fff3a6", 12);
    drawFxFrame(ctx, "coin", Math.floor(this.time * 20), W - 90, 17, { center: true, clip: 7, lightK: 0.5 });
    txt(`${this.coinCount}`, W - 78, 22, "#ffde5e", 14);
    if (this.coinMult > 1) txt("x2", W - 78, 36, "#ff86e6", 10);
    if (this.combo >= 3) {
      const k = clamp(this.comboT, 0, 1);
      txt(`${this.combo} 콤보!`, W / 2, 22, this.combo >= 25 ? "#ff86e6" : this.combo >= 10 ? "#ffc23d" : "#ffffff", 12 + Math.min(6, Math.floor(this.combo / 10)), "center");
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(W / 2 - 25, 28, 50, 3);
      ctx.fillStyle = "#ffde5e"; ctx.fillRect(W / 2 - 25, 28, Math.round(50 * k), 3);
    }
    // power timers
    const P = getProps();
    let bx = 10;
    const bar = (label, t, max, color, draw) => {
      ctx.fillStyle = "rgba(10,8,20,0.55)"; ctx.fillRect(bx, H - 26, 62, 18);
      draw(bx + 9, H - 17);
      txt(label, bx + 19, H - 15, "#fff", 8);
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx + 19, H - 12, 40, 3);
      ctx.fillStyle = color; ctx.fillRect(bx + 19, H - 12, Math.round(40 * clamp(t / max, 0, 1)), 3);
      bx += 66;
    };
    if (p.booster > 0) bar("부스터", p.booster, upgradeValue(this.save, "booster"), "#ffc23d", (x, y) => ctx.drawImage(P.rocket, x - 5, y - 6, 10, 11));
    if (p.speed > 0) bar("배속", p.speed, upgradeValue(this.save, "speed"), "#5eb0ff", (x, y) => drawFxFrame(ctx, "star", Math.floor(this.time * 20), x, y, { center: true, clip: 10, scale: 0.25 }));
    if (p.magnet > 0) bar("자석", p.magnet, upgradeValue(this.save, "magnet"), "#ff5a6a", (x, y) => ctx.drawImage(P.magnet, x - 6, y - 5, 12, 10));
    if (p.shield) bar("방패", 1, 1, "#8ae8ff", (x, y) => drawFxFrame(ctx, "heart", 0, x, y, { center: true, clip: 7, scale: 0.4 }));
    if (this.banner) {
      const t = this.banner.t, a = t < 0.3 ? t / 0.3 : t > 2.2 ? (2.6 - t) / 0.4 : 1;
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(10,8,20,0.6)"; ctx.fillRect(0, 96, W, 22);
      txt(`~ ${this.banner.text} ~`, W / 2, 111, "#fff3a6", 12, "center");
      ctx.globalAlpha = 1;
    }
  }
}

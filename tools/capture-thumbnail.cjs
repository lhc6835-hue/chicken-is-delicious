// Renders a scripted run frame by frame (fake clock, so every frame is exactly 1/FPS apart) for the thumbnail.
const { chromium } = require('playwright');
// usage: serve the game on :8765 (npm run serve -- 8765), then node tools/capture-thumbnail.cjs [outDir]
// and encode, e.g. ffmpeg -framerate 25 -i <outDir>/%04d.png -vf "split[a][b];[a]palettegen=stats_mode=single[p];[b][p]paletteuse=new=1:dither=none" thumbnail.gif
const OUT = (process.argv[2] || 'thumb-frames') + '/';
const FPS = +(process.env.FPS || 25), STEP = 1000 / FPS;
const fs = require('fs'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  // a returning player: no daily popup, no tutorial texts, no fullscreen
  await p.addInitScript(() => {
    const d = new Date(), today = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    localStorage.setItem('kkokko-dash-save-v1', JSON.stringify({ coins: 4280, best: 186420, bestDist: 3120, daily: { last: today, streak: 3 },
      stats: { runs: 60, chicks: 300 }, settings: { sfx: 0, bgm: 0, shake: true, muted: true, fullscreen: false }, missions: [], skin: 'basic', hat: 'none', trail: 'rainbow',
      owned: { skin: ['basic'], hat: ['none'], trail: ['none', 'dust', 'rainbow'] } }));
  });
  const T0 = Date.now();
  await p.clock.install({ time: T0 });
  await p.goto('http://localhost:8765/index.html?debug');
  await p.clock.pauseAt(T0 + 5000);
  await p.clock.runFor(1500);
  await p.addStyleTag({ content: '.pausebtn{display:none!important} #toasts{display:none!important} .hint{display:none!important}' });
  let n = 0;
  const shot = async () => { await p.locator('#wrap').screenshot({ path: OUT + String(n++).padStart(4, '0') + '.png' }); };
  const frames = async (k) => { for (let i = 0; i < k; i++) { await p.clock.runFor(STEP); await shot(); } };

  // 1. the title
  await p.evaluate(() => { kkokko.save.missions = []; });
  await frames(Math.round(FPS * 0.9));
  // 2. start: the shell slams shut and cracks open on the run
  await p.keyboard.press('Space');
  for (let i = 0; i < FPS * 2; i++) {
    await p.clock.runFor(STEP);
    const st = await p.evaluate(() => kkokko.game.state);
    if (st === 'run') {
      // behind the closed shell, lay out the scripted course
      await p.evaluate(() => {
        const g = kkokko.game, P = g.p; const W0 = 1150 * 20; // sunset
        g.save.missions = []; g.popText = () => {}; g.nextSpeedUp = 1e9; g.lastBiome = 1; g.banner = null;
        g.solids = []; g.obs = []; g.coins = []; g.items = []; g.springs = []; g.updrafts = []; g.rings = []; g.zones = [];
        g.chicks = []; g.lostChicks = []; g.jumpLog = []; g.path = []; g.crowQueue = []; g.genX = 1e9; g.parts = []; g.pops = [];
        P.x = W0; g.dist = W0 / 20; g.camX = P.x - g.camOff; P.y = 232; P.vy = 0;
        const X = (a) => W0 + a;
        const G = (a, b, y = 232) => g.addSolid(X(a), y, b - a, 'ground');
        G(-600, 620); G(760, 1100); G(1100, 1900); G(1990, 2950); G(3400, 4600);
        P.ground = g.solids[0];
        const line = (a, n, y, gap = 18) => { for (let i = 0; i < n; i++) g.coins.push({ x: X(a + i * gap), y, kind: 'coin', ph: i * 0.3 }); };
        const arc = (a, w, y, h, n) => { for (let i = 0; i < n; i++) { const t = i / (n - 1); g.coins.push({ x: X(a + t * w), y: y - Math.sin(t * Math.PI) * h, kind: 'coin', ph: i * 0.2 }); } };
        line(120, 8, 210); g.addObstacle(X(440), 'fence'); arc(380, 140, 200, 55, 7);
        arc(590, 200, 205, 70, 9); g.addObstacle(X(950), 'crate'); { const o = g.obs[g.obs.length - 1]; o.h = o.img.height * 2 * 2; o.stack = true; } arc(890, 140, 195, 70, 7);
        g.coins.push({ x: X(1045), y: 214, kind: 'chick', ph: 0 });
        g.items.push({ x: X(1170), y: 212, kind: 'booster', ph: 0 });
        g.addObstacle(X(1380), 'fence'); g.addObstacle(X(1600), 'crate'); g.obs[g.obs.length - 1].stack = false; g.obs[g.obs.length - 1].h = 18; for (let i = 0; i < 3; i++) g.addObstacle(X(1760 + i * 24), 'thorns'); g.addObstacle(X(2010), 'hay');
        for (let i = 0; i < 46; i++) g.coins.push({ x: X(1260 + i * 24), y: 118 + Math.sin(i * 0.35) * 14, kind: i % 9 === 8 ? 'gem' : 'coin', ph: i * 0.1 });
        // the canyon: one vent, a ring above it
        g.updrafts.push({ x: X(3170), w: 64, top: 64, ph: 0 }); g.rings.push({ x: X(3240), y: 60 }); g.zones.push({ x0: X(2890), x1: X(3420) });
        line(3161, 2, 150); line(3161, 2, 100); arc(3420, 160, 200, 30, 8);
        for (let i = 0; i < 9; i++) g.hatchChick({ x: P.x, y: 218 });
        for (const c of g.chicks) { c.off -= 30; c.x = P.x - c.off; c.y = 232; c.ground = g.solids[0]; c.safeUntil = -1e9; c.flash = 0; }
        g.pops = []; g.parts = []; g.maxChicks = 9;
        // the pilot: jumps by position, cruises on the jetpack, rides the updraft
        const W00 = W0; let holdUntilX = -1;
        const plan = [[392, 70], [604, 75], [893, 70], [2934, 9999]];
        let pi = 0;
        const upd = g.update.bind(g);
        let boostCut = false;
        g.update = (dt) => {
          const rx = P.x - W00;
          if (!boostCut && P.booster > 3.2) { P.booster = 3.2; boostCut = true; }
          if (boostCut && P.booster <= 0) P.invuln = 0;
          if (P.alive && g.state === 'run') {
            if (P.booster > 0) { if (P.y > 128 && !P.holding) g.press(); if (P.y < 104 && P.holding) g.release(); }
            else {
              if (pi < plan.length && rx >= plan[pi][0] && P.ground) { if (P.holding) g.release(); g.press(); holdUntilX = rx + plan[pi][1]; pi++; }
              if (P.holding && rx > holdUntilX && !(holdUntilX > 9000 && !P.ground)) g.release();
              if (holdUntilX > 9000 && P.ground && rx > 3400 && P.holding) g.release();
            }
          }
          upd(dt);
        };
      });
      break;
    }
    await shot();
  }
  // 3-5. the run
  const until = async (fn, max) => { for (let i = 0; i < max; i++) { await p.clock.runFor(STEP); await shot(); if (await p.evaluate(fn)) return i; } return -1; };
  await until(() => kkokko.game.p.x - 1150 * 20 > 3400 || !kkokko.game.p.alive, FPS * 16);
  await p.evaluate(() => kkokko.trans.run('shell', () => { kkokko.showTitle(); kkokko.game.popText = () => {}; }));
  await frames(Math.round(FPS * 1.0));
  console.log('frames', n, 'alive', await p.evaluate(() => kkokko.game.p.alive), 'chicks', await p.evaluate(() => kkokko.game.chicks.length), 'lost', await p.evaluate(() => kkokko.game.run.chicksLost), 'rings', await p.evaluate(() => kkokko.game.run.rings));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();

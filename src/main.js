import { Game } from "./game.js";
import { W, H } from "./bg.js";
import { loadFx, drawFxFrame } from "./fx.js";
import { Transitions } from "./transition.js";
import { iconHtml as I, drawIcon, TRAIL_ICON } from "./icons.js";
import { skinFx, drawPart, partIsFront, stepParts } from "./skinfx.js";
import { trailFx, drawRibbon } from "./trails.js";
import { initAudio, sfx, playBgm, setVolumes, setMuted, duckBgm, jetLoop, muffle, resetMix, windLoop, duck } from "./audio.js";
import { SKINS, HATS, TRAILS, drawChicken } from "./sprites.js";
import {
  loadSave, writeSave, UPGRADES, UPGRADE_COST, MAX_LV, CONSUMABLES, GACHA_PRICE, fillMissions, missionText, missionType,
  todayStr, DAILY_REWARDS, defaultSave,
} from "./data.js";

const $ = (s, r = document) => r.querySelector(s);
const canvas = $("#game");
canvas.width = W; canvas.height = H;
const ui = $("#ui");
const trans = new Transitions($("#tr"));
const go = (fn) => trans.run("feather", fn);
let save = loadSave();
fillMissions(save);
writeSave(save);
setVolumes(save.settings.sfx, save.settings.bgm);
setMuted(save.settings.muted);

let screen = "title";
let lastResult = null;

const game = new Game(canvas, save, {
  onGameOver(r) {
    trans.run("iris", () => finishRun(r), game.deathPos || {});
  },
  onMission(m) { toast(`${I("flag")} 미션 완료! ${missionText(m)}`); },
  onHud() {},
});

// ---------------------------------------------------------------- layout
function fit() {
  const k = Math.min(window.innerWidth / W, window.innerHeight / H);
  const s = k;
  const wrap = $("#wrap");
  wrap.style.width = `${Math.floor(W * s)}px`;
  wrap.style.height = `${Math.floor(H * s)}px`;
  document.documentElement.style.setProperty("--k", s);
}
window.addEventListener("resize", fit);
document.addEventListener("fullscreenchange", fit);
document.addEventListener("webkitfullscreenchange", fit);

// ---------------------------------------------------------------- fullscreen
// Browsers only allow fullscreen from a click, tap or key press, so the first input of the session
// (and every run start) switches to it; on phones the screen is then locked to landscape.
const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function goFullscreen() {
  if (!save.settings.fullscreen || isFull()) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el, { navigationUI: "hide" });
    const lock = () => { try { const o = window.screen.orientation; if (o && o.lock) o.lock("landscape").catch(() => {}); } catch (e) { /* not supported */ } };
    if (p && p.then) p.then(lock).catch(() => {}); else lock();
  } catch (e) { /* refused: carry on windowed */ }
}
function exitFullscreen() {
  const ex = document.exitFullscreen || document.webkitExitFullscreen;
  if (isFull() && ex) try { ex.call(document); } catch (e) { /* ignore */ }
}
window.addEventListener("pointerdown", goFullscreen, true);
window.addEventListener("keydown", (e) => { if (!["Escape", "F11", "Tab"].includes(e.key)) goFullscreen(); }, true);
// leaving fullscreen mid-run (Esc, swipe) pauses the game instead of letting the chicken die
document.addEventListener("fullscreenchange", () => { if (!isFull() && screen === "run") pause(); });
fit();

// ---------------------------------------------------------------- loop
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.draw();
  trans.update(dt);
  trans.draw();
  if (screen === "shop" || screen === "title") drawPreview();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- input
function isTyping(e) { return e.target && (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON"); }
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
    e.preventDefault();
    if (e.repeat) return;
    initAudio();
    if (trans.busy) return;
    if (screen === "title") { startRun(); return; }
    if (screen === "over" && e.code === "Space") { startRun(); return; }
    if (screen === "run") game.press();
  } else if (e.code === "Escape" || e.code === "KeyP") {
    if (screen === "run") pause(); else if (screen === "pause") resume();
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") game.release();
});
canvas.addEventListener("pointerdown", (e) => {
  initAudio();
  if (screen === "run") { e.preventDefault(); game.press(); }
});
window.addEventListener("pointerup", () => game.release());
window.addEventListener("pointercancel", () => game.release());
window.addEventListener("blur", () => { if (screen === "run") pause(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && screen === "run") pause(); });
ui.addEventListener("click", (e) => { if (e.target.closest("button")) initAudio(); }, true);

// ---------------------------------------------------------------- helpers
function persist() { writeSave(save); }
function coinsHtml() { return `<span class="coinpill">${I("coin")}${save.coins.toLocaleString()}</span>`; }
function toast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = text;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function btn(label, cls = "", attrs = "") { return `<button class="${cls}" ${attrs}>${label}</button>`; }
function bindClicks(root, map) {
  root.querySelectorAll("[data-act]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const f = map[el.dataset.act];
      if (f) { e.stopPropagation(); f(el, e); }
    });
  });
}

// a small canvas in the menus showing the chicken as dressed
let previewCv = null;
const pv = { parts: [], acc: 0, tacc: 0, tin: 0, last: 0, beat: -1, skin: "", trail: "" };
function drawPreview() {
  if (!previewCv || !previewCv.isConnected) return;
  const c = previewCv.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, previewCv.width, previewCv.height);
  const t = performance.now() / 1000;
  const trail = previewCv.dataset.trail || save.trail;
  const skin = previewCv.dataset.skin || save.skin, f = skinFx(skin);
  const fx = previewCv.width / 2, fy = previewCv.height - 8, dt = Math.min(0.05, t - (pv.last || t));
  pv.last = t;
  if (pv.skin !== skin || pv.trail !== trail) { pv.skin = skin; pv.trail = trail; pv.parts.length = 0; pv.acc = 0; pv.tacc = 0; pv.tin = 0; }
  // the trail: a ribbon waving behind the chicken plus its particles, at preview scale
  const tf = trailFx(trail), K = 1.5, tx = fx - 8 * K;
  const tyAt = (d) => fy - 17 * K + Math.sin(d * 0.05 + t * 3) * 3;
  pv.tin = Math.min(1, pv.tin + dt * 2.5);
  if (tf.emit && tf.rate) {
    pv.tacc += dt * tf.rate;
    // in the preview the "world" doesn't scroll, so particles are pushed back by hand
    while (pv.tacc >= 1) { pv.tacc -= 1; tf.emit((q) => { q.vx -= 70; pv.parts.push(q); }, tx + 8 * K, fy - 17 * K, K, { ground: true, yAt: tyAt }); }
  }
  // the skin's effects, at preview scale: running particles plus a showcase jump every 2.4 s
  const emit = (q) => pv.parts.push(q);
  if (f.run && f.rate) { pv.acc += dt * f.rate; while (pv.acc >= 1) { pv.acc -= 1; f.run(emit, fx, fy, 1.5, { time: t }); } }
  const beat = Math.floor(t / 2.4);
  if (beat !== pv.beat) { pv.beat = beat; if (f.jump) f.jump(emit, fx, fy, 1.5); if (f.land) f.land(emit, fx, fy, 1.5, 400); }
  stepParts(pv.parts, dt);
  for (const q of pv.parts) if (!partIsFront(q)) drawPart(c, q, Math.round(q.x), Math.round(q.y), t);
  c.fillStyle = "rgba(0,0,0,0.25)";
  c.fillRect(previewCv.width / 2 - 20, previewCv.height - 10, 40, 4);
  if (trail !== "none") drawRibbon(c, trail, tx, tyAt, t, K, pv.tin);
  const dy = f.float ? Math.round(Math.sin(t * 4) * 3 - 4) : 0;
  drawChicken(c, "run", Math.floor(t * 9) % 4, skin, previewCv.dataset.hat || save.hat, fx, fy, { scale: 3, phase: Math.floor(t * 8), dy, eye: f.eye, glint: f.glint ? t : undefined, aura: f.aura, time: t });
  for (const q of pv.parts) if (partIsFront(q)) drawPart(c, q, Math.round(q.x), Math.round(q.y), t);
}

// ---------------------------------------------------------------- screens
function setScreen(name, html, bind) {
  screen = name;
  ui.innerHTML = html;
  ui.className = `screen-${name}`;
  previewCv = $("canvas.preview", ui);
  if (bind) bindClicks(ui, bind);
}

const letters = (w) => [...w].map((ch, i) => `<span style="--i:${i}" data-t="${ch}">${ch}</span>`).join("");

function showTitle() {
  resetMix();
  // a fresh, empty field behind the title: no leftover coins, crows or celebration effects
  if (game.state !== "idle") { game.reset(); game.coins = []; }
  game.state = "idle";
  jetLoop(false);
  playBgm("title");
  duckBgm(1);
  const unclaimed = save.missions.filter((m) => m.done && !m.claimed).length;
  setScreen("title", `
    <div class="title-top">${coinsHtml()}<span class="best">최고 ${save.best.toLocaleString()}점 · ${save.bestDist}m</span></div>
    <div class="logo">
      <div class="logo-kicker">${I("star")} A CHICKEN'S GREAT ESCAPE ${I("star")}</div>
      <div class="wm wm-free">${letters("FREE")}</div>
      <div class="wm wm-range">${letters("RANGE")}</div>
      <div class="logo-tag">DON'T BECOME DINNER.</div>
    </div>
    <canvas class="preview" width="96" height="84"></canvas>
    <div class="menu">
      ${btn(`${I("play")} 시작하기`, "big primary", 'data-act="play"')}
      <div class="row">
        ${btn(`${I("basket")} 상점`, "", 'data-act="shop"')}
        ${btn(`${I("flag")} 미션${unclaimed ? `<b class="dot">${unclaimed}</b>` : ""}`, "", 'data-act="missions"')}
        ${btn(`${I("egg")} 뽑기`, "", 'data-act="gacha"')}
      </div>
      <div class="row">
        ${btn(`${I("chart")} 기록`, "small", 'data-act="stats"')}
        ${btn(`${I("gear")} 설정`, "small", 'data-act="settings"')}
        ${btn(`${I("help")} 방법`, "small", 'data-act="help"')}
      </div>
    </div>
    <div class="hint">스페이스 / 화면 터치로 시작</div>
  `, {
    play: () => startRun(),
    shop: () => { sfx("open"); go(() => showShop("skin")); },
    missions: () => { sfx("open"); go(() => showMissions()); },
    gacha: () => { sfx("open"); go(() => showGacha()); },
    stats: () => { sfx("open"); go(() => showStats()); },
    settings: () => { sfx("open"); go(() => showSettings()); },
    help: () => { sfx("open"); go(() => showHelp()); },
  });
  ui.querySelector(".logo").addEventListener("click", () => sfx("jump", { rate: 1 + Math.random() }));
  ui.onpointerdown = (e) => { if (screen === "title" && e.target === ui && !$(".modal", ui)) startRun(); };
  checkDaily();
}

function checkDaily() {
  const today = todayStr();
  if (save.daily.last === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yStr = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
  const streak = save.daily.last === yStr ? save.daily.streak + 1 : 1;
  const reward = DAILY_REWARDS[(streak - 1) % DAILY_REWARDS.length];
  const days = DAILY_REWARDS.map((r, i) => `<div class="day ${i < ((streak - 1) % 7) ? "got" : i === (streak - 1) % 7 ? "now" : ""}"><small>${i + 1}일</small><b>${r}</b></div>`).join("");
  modal(`
    <h2>${I("sun", 2)} 출석 보상</h2>
    <p>${streak}일 연속 출석!</p>
    <div class="days">${days}</div>
    ${btn(`코인 ${reward}개 받기`, "primary", 'data-act="claim"')}
  `, {
    claim: (el) => {
      save.daily = { last: today, streak };
      save.coins += reward;
      persist();
      sfx("buy"); sfx("j_mission", { delay: 0.1, vol: 0.6 });
      closeModal();
      showTitle();
      toast(`코인 +${reward}`);
    },
  });
}

function modal(html, bind) {
  closeModal();
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="panel">${html}</div>`;
  ui.appendChild(m);
  bindClicks(m, bind || {});
  return m;
}
function closeModal() { const m = $(".modal", ui); if (m) m.remove(); }

function showHelp() {
  setScreen("help", `
    <div class="panel wide">
      <h2>${I("help", 2)} 플레이 방법</h2>
      <ul class="help">
        <li><b>스페이스 / 터치</b> : 점프. 길게 누를수록 높이 뛰어요.</li>
        <li><b>공중에서 꾹 누르기</b> : 날개를 퍼덕이며 천천히 활공해요 (머리 위 게이지).</li>
        <li><b>활공 구간</b> : 넓은 협곡의 바람 구멍 위에서 꾹 누르면 위로 떠올라요. 가시덤불 밭과 절벽은 활공으로 넘어가요. 하늘색 깃털 고리를 지나면 활공 게이지가 꽉 차요. (이 구간에선 병아리도 바람을 타요)</li>
        <li>${I("chick")} <b>작은 알</b> : 먹으면 병아리가 부화해서 뒤를 따라와요. 병아리 수만큼 점수 배율이 올라가요 (최대 ×16)!</li>
        <li><b>병아리</b>는 닭이 뛴 자리에서 똑같이 뛰지만 점프가 낮고 활공을 못 해요. 아슬아슬하게 넘으면 병아리가 장애물에 부딪히거나 구덩이에 빠져요. 닭이 부딪히면 무조건 꼬꼬 다운!</li>
        <li>${I("rocket")} <b>부스터</b> : 누르고 있으면 하늘로 날아올라요. 하늘 코인 길을 따라가요!</li>
        <li>${I("bolt")} <b>배속</b> : 엄청 빨라지고 장애물을 몽땅 부숴요. 점수 2배!</li>
        <li>${I("magnet")} <b>자석</b> : 근처 코인을 끌어당겨요. ${I("heart")} <b>방패</b> : 한 번 막아줘요.</li>
        <li>${I("egg")} <b>황금알</b> : 코인 폭탄! &nbsp; <b>스프링</b> : 엄청 높이 튕겨요.</li>
        <li><b>까마귀</b>는 위에서 밟으면 보너스! &nbsp; <b>회색 돌 발판</b>은 금방 무너져요.</li>
        <li>코인을 끊기지 않게 먹으면 <b>콤보</b>가 쌓이고 소리가 점점 올라가요.</li>
        <li>P / ESC : 일시정지</li>
      </ul>
      ${btn("돌아가기", "", 'data-act="back"')}
    </div>
  `, { back: () => { sfx("back"); go(showTitle); } });
}

function showStats() {
  const st = save.stats;
  const rows = [
    ["최고 점수", save.best.toLocaleString()], ["최장 거리", `${save.bestDist}m`], ["플레이 횟수", st.runs], ["총 달린 거리", `${Math.floor(st.distTotal).toLocaleString()}m`],
    ["모은 코인", st.coinsTotal.toLocaleString()], ["점프", st.jumps], ["활공 시간", `${Math.floor(st.glide)}초`], ["부스터 사용", st.boosters],
    ["배속 사용", st.speeds], ["부순 장애물", st.smash], ["밟은 까마귀", st.crows], ["부화시킨 병아리", st.chicks || 0], ["탄 상승기류", st.updrafts || 0], ["통과한 고리", st.rings || 0], ["잃은 병아리", st.chicksLost || 0], ["깬 황금알", st.eggs], ["완료한 미션", st.missionsDone],
  ];
  setScreen("stats", `
    <div class="panel wide">
      <h2>${I("chart", 2)} 기록</h2>
      <div class="stats">${rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>
      ${btn("돌아가기", "", 'data-act="back"')}
    </div>
  `, { back: () => { sfx("back"); go(showTitle); } });
}

function showSettings() {
  const s = save.settings;
  setScreen("settings", `
    <div class="panel">
      <h2>${I("gear", 2)} 설정</h2>
      <label class="set">효과음 <input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-k="sfx"></label>
      <label class="set">배경음악 <input type="range" min="0" max="1" step="0.05" value="${s.bgm}" data-k="bgm"></label>
      <label class="set">화면 흔들림 ${btn(s.shake ? "켜짐" : "꺼짐", "small", 'data-act="shake"')}</label>
      <label class="set">음소거 ${btn(s.muted ? "켜짐" : "꺼짐", "small", 'data-act="mute"')}</label>
      <label class="set">자동 전체화면 ${btn(s.fullscreen ? "켜짐" : "꺼짐", "small", 'data-act="full"')}</label>
      <div class="row">${btn("데이터 초기화", "small danger", 'data-act="reset"')}${btn("돌아가기", "", 'data-act="back"')}</div>
    </div>
  `, {
    back: () => { sfx("back"); go(showTitle); },
    shake: () => { s.shake = !s.shake; persist(); sfx("toggle"); showSettings(); },
    mute: () => { s.muted = !s.muted; setMuted(s.muted); persist(); sfx("toggle"); showSettings(); },
    full: () => { s.fullscreen = !s.fullscreen; persist(); sfx("toggle"); if (s.fullscreen) goFullscreen(); else exitFullscreen(); showSettings(); },
    reset: () => {
      modal(`<h2>정말 초기화할까요?</h2><p>코인, 스킨, 기록이 모두 사라져요.</p><div class="row">${btn("취소", "", 'data-act="no"')}${btn("초기화", "danger", 'data-act="yes"')}</div>`, {
        no: () => closeModal(),
        yes: () => {
          const keep = save.settings;
          Object.keys(save).forEach((k) => delete save[k]);
          Object.assign(save, defaultSave(), { settings: keep });
          fillMissions(save); persist(); closeModal(); sfx("back"); showTitle();
        },
      });
    },
  });
  ui.querySelectorAll("input[type=range]").forEach((inp) => {
    inp.addEventListener("input", () => {
      s[inp.dataset.k] = +inp.value;
      setVolumes(s.sfx, s.bgm);
      persist();
    });
    inp.addEventListener("change", () => sfx("coin", { vol: 0.8 }));
  });
}

// ---------------------------------------------------------------- shop
function showShop(tab = "skin") {
  const tabs = [["skin", `${I("chicken")} 스킨`], ["hat", `${I("hat")} 모자`], ["trail", `${I("sparkle")} 트레일`], ["up", `${I("up")} 강화`], ["item", `${I("bag")} 아이템`]];
  let list = "";
  if (tab === "skin" || tab === "hat" || tab === "trail") {
    const arr = tab === "skin" ? SKINS : tab === "hat" ? HATS : TRAILS;
    list = arr.map((it) => {
      const owned = save.owned[tab].includes(it.id);
      const eq = save[tab] === it.id;
      const label = eq ? "착용중" : owned ? "착용" : `${I("coin")}${it.price}`;
      return `<div class="card ${eq ? "eq" : ""} ${owned ? "" : "locked"}" data-act="hover" data-id="${it.id}">
        <canvas class="thumb" width="40" height="40" data-tab="${tab}" data-id="${it.id}"></canvas>
        <div class="nm">${it.name}</div>
        ${btn(label, eq ? "small on" : owned ? "small" : "small buy", `data-act="pick" data-id="${it.id}"`)}
      </div>`;
    }).join("");
  } else if (tab === "up") {
    list = UPGRADES.map((u) => {
      const lv = save.up[u.id] || 0, max = lv >= MAX_LV;
      const pips = Array.from({ length: MAX_LV }, (_, i) => `<i class="${i < lv ? "on" : ""}"></i>`).join("");
      return `<div class="card up"><div class="big-ic">${I(u.icon, 2)}</div><div class="nm">${u.name}</div><div class="desc">${u.desc}</div><div class="pips">${pips}</div>
        ${btn(max ? "MAX" : `${I("coin")}${UPGRADE_COST[lv]}`, max ? "small on" : "small buy", `data-act="up" data-id="${u.id}" ${max ? "disabled" : ""}`)}</div>`;
    }).join("");
  } else {
    list = CONSUMABLES.map((c) => `<div class="card up"><div class="big-ic">${I(c.icon, 2)}</div><div class="nm">${c.name}</div><div class="desc">${c.desc}</div><div class="desc">보유: ${save.items[c.id] || 0}</div>
      ${btn(`${I("coin")}${c.price}`, "small buy", `data-act="item" data-id="${c.id}"`)}</div>`).join("");
  }
  setScreen("shop", `
    <div class="shop">
      <div class="shop-head"><h2>${I("basket", 2)} 상점</h2>${coinsHtml()}${btn(I("close"), "small", 'data-act="back"')}</div>
      <div class="tabs">${tabs.map(([k, n]) => btn(n, k === tab ? "tab on" : "tab", `data-act="tab" data-id="${k}"`)).join("")}</div>
      <div class="shop-body">
        <div class="side"><canvas class="preview" width="96" height="84"></canvas><div class="side-nm"></div><div class="side-desc"></div></div>
        <div class="grid">${list}</div>
      </div>
    </div>
  `, {
    back: () => { sfx("back"); go(showTitle); },
    tab: (el) => { sfx("select"); showShop(el.dataset.id); },
    pick: (el) => buyOrEquip(tab, el.dataset.id),
    up: (el) => buyUpgrade(el.dataset.id),
    item: (el) => buyItem(el.dataset.id),
    hover: () => {},
  });
  // thumbnails and hover preview
  ui.querySelectorAll("canvas.thumb").forEach((c) => {
    const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
    const t = c.dataset.tab, id = c.dataset.id;
    if (t === "trail") {
      drawIcon(x, TRAIL_ICON[id], 20, 22, 2);
    } else drawChicken(x, "idle", 0, t === "skin" ? id : save.skin, t === "hat" ? id : "none", 20, 39, { scale: 1.5, phase: 3 });
  });
  const showEquipped = () => {
    if (tab !== "skin") return;
    const sk = SKINS.find((k) => k.id === save.skin);
    $(".side-nm", ui).textContent = sk ? sk.name : "";
    $(".side-desc", ui).textContent = skinFx(save.skin).desc;
  };
  showEquipped();
  ui.querySelectorAll(".card[data-id]").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      if (!previewCv) return;
      previewCv.dataset[tab] = card.dataset.id;
      const arr = tab === "skin" ? SKINS : tab === "hat" ? HATS : TRAILS;
      $(".side-nm", ui).textContent = (arr.find((a) => a.id === card.dataset.id) || {}).name || "";
      if (tab === "skin") $(".side-desc", ui).textContent = skinFx(card.dataset.id).desc;
    });
    card.addEventListener("mouseleave", () => { if (previewCv) delete previewCv.dataset[tab]; showEquipped(); });
  });
}

function spend(price) {
  if (save.coins < price) { sfx("error"); toast("코인이 부족해요!"); return false; }
  save.coins -= price;
  sfx("buy"); sfx("cointick", { delay: 0.05 }); sfx("cointick", { delay: 0.1, rate: 1.2 });
  return true;
}

function buyOrEquip(tab, id) {
  const arr = tab === "skin" ? SKINS : tab === "hat" ? HATS : TRAILS;
  const it = arr.find((a) => a.id === id);
  if (!save.owned[tab].includes(id)) {
    if (!spend(it.price)) return;
    save.owned[tab].push(id);
    toast(`${it.name} 획득!`);
  } else sfx("select");
  save[tab] = id;
  persist();
  showShop(tab);
}
function buyUpgrade(id) {
  const lv = save.up[id] || 0;
  if (lv >= MAX_LV) return;
  if (!spend(UPGRADE_COST[lv])) return;
  save.up[id] = lv + 1;
  sfx("levelup", { vol: 0.6 });
  persist();
  showShop("up");
}
function buyItem(id) {
  const c = CONSUMABLES.find((x) => x.id === id);
  if (!spend(c.price)) return;
  save.items[id] = (save.items[id] || 0) + 1;
  persist();
  showShop("item");
}

// ---------------------------------------------------------------- gacha: hatch an egg for a random cosmetic
function showGacha() {
  setScreen("gacha", `
    <div class="panel">
      <h2>${I("egg", 2)} 황금알 뽑기</h2>
      <p>코인 ${GACHA_PRICE}개로 알을 깨면 아직 없는 스킨·모자·트레일 중 하나가 나와요!<br><small>(모두 가졌다면 코인 500개)</small></p>
      <canvas class="eggcv" width="160" height="110"></canvas>
      <div class="gacha-res"></div>
      <div class="row">${btn(`${I("coin")}${GACHA_PRICE} 알 깨기`, "primary", 'data-act="hatch"')}${btn("돌아가기", "", 'data-act="back"')}</div>
      <div class="gacha-coins">${coinsHtml()}</div>
    </div>
  `, {
    back: () => { sfx("back"); go(showTitle); },
    hatch: (el) => {
      if (el.disabled) return;
      if (!spend(GACHA_PRICE)) return;
      el.disabled = true;
      const pool = [];
      for (const [tab, arr] of [["skin", SKINS], ["hat", HATS], ["trail", TRAILS]]) for (const it of arr) if (!save.owned[tab].includes(it.id)) pool.push([tab, it]);
      const prize = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
      playEgg($("canvas.eggcv", ui), () => {
        const res = $(".gacha-res", ui);
        if (prize) {
          save.owned[prize[0]].push(prize[1].id);
          res.innerHTML = `${I("party")} <b>${prize[1].name}</b> ${{ skin: "스킨", hat: "모자", trail: "트레일" }[prize[0]]} 획득!`;
        } else { save.coins += 500; res.innerHTML = `${I("party")} 전부 모았네요! 코인 <b>500</b>개!`; }
        persist();
        sfx("j_best", { vol: 0.7, vary: 0 });
        el.disabled = false;
        ui.querySelector(".gacha-coins").innerHTML = coinsHtml();
      });
    },
  });
}

function playEgg(cv, done) {
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  const t0 = performance.now();
  sfx("egg", { vol: 0.9 });
  setTimeout(() => sfx("egg", { vol: 1, rate: 1.2 }), 800);
  setTimeout(() => sfx("egg", { vol: 1, rate: 1.4 }), 1500);
  setTimeout(() => { sfx("smash", { vol: 0.6 }); sfx("gem", { vol: 0.8 }); sfx("combo", { vol: 0.6 }); }, 2050);
  let fired = false;
  const tick = () => {
    const t = (performance.now() - t0) / 1000;
    c.clearRect(0, 0, cv.width, cv.height);
    drawFxFrame(c, "egg", Math.floor(t * 20), 80, 92, {});
    if (t > 2.05) drawFxFrame(c, "coinBurst", Math.floor((t - 2.05) * 30), 80, 96, {});
    if (t > 2.1 && !fired) { fired = true; done(); }
    if (t < 4 && cv.isConnected) requestAnimationFrame(tick);
  };
  tick();
}

// ---------------------------------------------------------------- missions
function showMissions() {
  const items = save.missions.map((m, i) => {
    const t = missionType(m);
    const prog = m.done ? m.goal : t.run ? (m.progress || 0) : Math.max(0, (save.stats[m.key] || 0) - m.base);
    const k = Math.min(1, prog / m.goal);
    return `<div class="mission ${m.done ? "done" : ""}">
      <div class="mt">${missionText(m)}</div>
      <div class="bar"><i style="width:${Math.round(k * 100)}%"></i><span>${Math.min(prog, m.goal)} / ${m.goal}</span></div>
      ${m.done ? btn(`${I("coin")}${m.reward} 받기`, "small primary", `data-act="claim" data-i="${i}"`) : `<div class="reward">${I("coin")}${m.reward}</div>`}
    </div>`;
  }).join("");
  setScreen("missions", `
    <div class="panel wide">
      <h2>${I("flag", 2)} 미션</h2>
      <p class="sub">미션을 깨면 더 어려운 미션이 나와요. 지금까지 ${save.stats.missionsDone}개 완료!</p>
      ${items}
      ${btn("돌아가기", "", 'data-act="back"')}
    </div>
  `, {
    back: () => { sfx("back"); go(showTitle); },
    claim: (el) => {
      const i = +el.dataset.i, m = save.missions[i];
      save.coins += m.reward;
      save.missionTier[m.key] = (save.missionTier[m.key] || 0) + 1;
      save.stats.missionsDone++;
      save.missions.splice(i, 1);
      fillMissions(save);
      persist();
      sfx("buy"); sfx("j_mission", { delay: 0.08, vol: 0.6 });
      toast(`코인 +${m.reward}`);
      showMissions();
    },
  });
}

// ---------------------------------------------------------------- run flow
function startRun() {
  goFullscreen();
  if (trans.busy) return;
  ui.onpointerdown = null;
  sfx("select");
  trans.run("shell", beginRun);
}

function beginRun() {
  resetMix();
  closeModal();
  game.start();
  setScreen("run", `${btn(I("pause"), "pausebtn small", 'data-act="pause"')}`, { pause: () => pause() });
  playBgm(["run1", "run2", "run3"][save.stats.runs % 3]);
  duckBgm(1);
}

function pause() {
  if (screen !== "run") return;
  game.state = "paused";
  game.release();
  jetLoop(false);
  windLoop(0);
  muffle(520, 0.25);
  duckBgm(0.6);
  setScreen("pause", `
    <div class="panel">
      <h2>일시정지</h2>
      <div class="pause-missions">${save.missions.map((m) => `<div>${m.done || game.missionProgress(m) >= m.goal ? I("check") : I("box")} ${missionText(m)}</div>`).join("")}</div>
      <div class="row">${btn(`${I("play")} 계속`, "primary", 'data-act="resume"')}${btn("그만하기", "", 'data-act="quit"')}</div>
    </div>
  `, { resume: () => resume(), quit: () => { game.die(true); game.state = "over"; finishRun(game.result()); } });
}
function resume() {
  sfx("select");
  muffle(20000, 0.3);
  setScreen("run", `${btn(I("pause"), "pausebtn small", 'data-act="pause"')}`, { pause: () => pause() });
  duckBgm(1);
  game.state = "run";
  last = performance.now();
}

let pending = null;
function finishRun(r) {
  lastResult = r;
  jetLoop(false);
  // stats and missions
  const st = save.stats;
  st.runs++;
  st.distTotal += r.dist;
  st.coinsTotal += r.coins;
  for (const k of Object.keys(r.run)) st[k] = (st[k] || 0) + r.run[k];
  for (const m of save.missions) {
    if (m.done) continue;
    const t = missionType(m);
    if (t.run) {
      const v = { dist: r.dist, coins: r.coins, combo: r.combo, maxChicks: r.maxChicks }[m.key] || 0;
      m.progress = Math.max(m.progress || 0, v);
      if (m.progress >= m.goal) m.done = true;
    } else if ((st[m.key] || 0) - m.base >= m.goal) m.done = true;
  }
  save.coins += r.coins;
  const newBest = r.score > save.best;
  if (newBest) save.best = r.score;
  save.bestDist = Math.max(save.bestDist, r.dist);
  persist();
  pending = { r, newBest };
  showOver();
}

function showOver() {
  resetMix();
  const { r, newBest } = pending;
  playBgm("ending");
  duckBgm(0.8);
  sfx(newBest ? "j_best" : "j_gameover", { vol: 0.8, vary: 0 });
  const reviveCost = 150;
  const canRevive = !r.revived && save.coins >= reviveCost && !game.revived;
  const doneCount = save.missions.filter((m) => m.done && !m.claimed).length;
  setScreen("over", `
    <div class="panel over">
      <h2 class="over-title ${newBest ? "best" : ""}">${newBest ? "NEW RECORD!" : "DINNER TIME."}</h2><div class="over-sub">${newBest ? "최고 기록을 갈아치웠어요!" : "이번엔 잡혔어요... 다시 도망쳐요!"}</div>
      <div class="score" data-to="${r.score}">0</div>
      <div class="over-grid">
        <div><span>거리</span><b>${r.dist}m</b></div>
        <div><span>코인</span><b>${I("coin")}+${r.coins}</b></div>
        <div><span>최대 콤보</span><b>${r.combo}</b></div>
        <div><span>최대 병아리</span><b>${I("chick")} ${r.maxChicks || 0}마리</b></div>
        <div><span>잃은 병아리</span><b>${r.run.chicksLost || 0}마리</b></div>
        <div><span>최고 점수</span><b>${save.best.toLocaleString()}</b></div>
      </div>
      ${doneCount ? `<div class="mdone">${I("flag")} 완료한 미션 ${doneCount}개! 미션 화면에서 보상을 받으세요</div>` : ""}
      <div class="row">
        ${canRevive ? btn(`${I("heart")} 부활 ${I("coin")}${reviveCost}`, "revive", 'data-act="revive"') : ""}
        ${btn(`${I("retry")} 다시하기`, "primary", 'data-act="again"')}
        ${btn(`${I("home")} 홈`, "", 'data-act="home"')}
      </div>
    </div>
  `, {
    again: () => startRun(),
    home: () => { sfx("back"); trans.run("shell", showTitle); },
    revive: () => {
      if (save.coins < reviveCost) return;
      // undo the run's bookkeeping; it is counted again when this run really ends
      const st = save.stats;
      st.runs--; st.distTotal -= r.dist; st.coinsTotal -= r.coins;
      for (const k of Object.keys(r.run)) st[k] -= r.run[k];
      save.coins -= r.coins + reviveCost;
      persist();
      setScreen("run", `${btn(I("pause"), "pausebtn small", 'data-act="pause"')}`, { pause: () => pause() });
      playBgm(["run1", "run2", "run3"][save.stats.runs % 3]);
      game.revive();
    },
  });
  // count the score up with ticks
  const el = $(".score", ui), to = r.score, t0 = performance.now();
  let lastTick = 0;
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0) / 900);
    const v = Math.floor(to * (1 - Math.pow(1 - k, 3)));
    el.textContent = v.toLocaleString();
    if (performance.now() - lastTick > 60 && k < 1) { lastTick = performance.now(); sfx("cointick", { vol: 0.3, rate: 1 + k }); }
    if (k < 1 && el.isConnected) requestAnimationFrame(tick);
    else if (newBest && el.isConnected) {
      el.classList.add("pop");
      game.sfx2.add("newBest", W / 2, 120, { clip: 62 });
      game.sfx2.add("firework", 110, 130);
      setTimeout(() => { if (screen === "over") game.sfx2.add("firework", 370, 120); }, 350);
      game.sfx2.add("confetti", W / 2, 200);
    }
  };
  tick();
}

// ---------------------------------------------------------------- boot
$("#loading").textContent = "HATCHING...";
Promise.all([loadFx(), document.fonts ? Promise.all(["12px Galmuri11", "700 16px Silkscreen", "16px Silkscreen"].map((f) => document.fonts.load(f))).catch(() => {}) : null]).then(() => {
  $("#loading").remove();
  showTitle();
  trans.open("shell");
  requestAnimationFrame(loop);
});

// test hook: index.html?debug exposes the game and save in the console
if (location.search.includes("debug")) { window.kkokko = { game, save, showShop, showMissions, showGacha, persist }; }

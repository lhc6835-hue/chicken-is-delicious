// Shop upgrades, consumables, missions and the save file.
export const UPGRADES = [
  { id: "booster", name: "부스터 연료통", desc: "부스터 지속시간 +0.8초", icon: "rocket", base: 5, per: 0.8 },
  { id: "speed", name: "터보 깃털", desc: "배속 지속시간 +0.8초", icon: "bolt", base: 5, per: 0.8 },
  { id: "magnet", name: "강력 자석", desc: "자석 지속시간 +1.5초", icon: "magnet", base: 7, per: 1.5 },
  { id: "glide", name: "넓은 날개", desc: "활공 시간 +0.25초", icon: "feather", base: 1.1, per: 0.25 },
  { id: "luck", name: "행운의 모이", desc: "아이템 등장 확률 +12%", icon: "clover", base: 1, per: 0.12 },
];
export const UPGRADE_COST = [120, 300, 600, 1000, 1600];
export const MAX_LV = UPGRADE_COST.length;

export const CONSUMABLES = [
  { id: "startShield", name: "시작 방패", desc: "방패를 들고 출발 (1회)", icon: "shield", price: 150 },
  { id: "startBoost", name: "로켓 스타트", desc: "부스터를 켜고 출발 (1회)", icon: "flame", price: 200 },
  { id: "doubleCoin", name: "코인 2배 쿠폰", desc: "다음 판 코인 2배 (1회)", icon: "money", price: 350 },
];

export const GACHA_PRICE = 300;

// mission templates: stat to watch, per-run or lifetime, goals by tier
export const MISSION_TYPES = [
  { key: "dist", run: true, text: (n) => `한 판에 ${n}m 달리기`, goals: [300, 600, 1000, 1600, 2500, 4000] },
  { key: "coins", run: true, text: (n) => `한 판에 코인 ${n}개 모으기`, goals: [50, 100, 200, 350, 500, 800] },
  { key: "coinsTotal", run: false, text: (n) => `코인 총 ${n}개 모으기`, goals: [200, 500, 1000, 2000, 4000] },
  { key: "boosters", run: false, text: (n) => `부스터 ${n}번 사용하기`, goals: [3, 6, 10, 20] },
  { key: "speeds", run: false, text: (n) => `배속 ${n}번 먹기`, goals: [3, 6, 10, 20] },
  { key: "smash", run: false, text: (n) => `배속으로 장애물 ${n}개 부수기`, goals: [5, 15, 30, 60] },
  { key: "glide", run: false, text: (n) => `활공 ${n}초 하기`, goals: [10, 30, 60, 120] },
  { key: "jumps", run: false, text: (n) => `점프 ${n}번 하기`, goals: [50, 150, 300, 600] },
  { key: "combo", run: true, text: (n) => `코인 콤보 ${n} 달성하기`, goals: [15, 30, 50, 80, 120] },
  { key: "gems", run: false, text: (n) => `보석 ${n}개 모으기`, goals: [5, 15, 30, 60] },
  { key: "springs", run: false, text: (n) => `스프링 ${n}번 밟기`, goals: [5, 15, 30] },
  { key: "eggs", run: false, text: (n) => `황금알 ${n}개 깨기`, goals: [1, 3, 6, 10] },
  { key: "crows", run: false, text: (n) => `까마귀 ${n}마리 밟기`, goals: [3, 10, 25] },
  { key: "maxChicks", run: true, text: (n) => `병아리 ${n}마리 데리고 달리기`, goals: [3, 5, 8, 12, 15] },
  { key: "chicks", run: false, text: (n) => `병아리 총 ${n}마리 부화시키기`, goals: [5, 15, 40, 80, 150] },
];

const KEY = "kkokko-dash-save-v1";

export function defaultSave() {
  return {
    coins: 0, best: 0, bestDist: 0,
    skin: "basic", hat: "none", trail: "dust",
    owned: { skin: ["basic"], hat: ["none"], trail: ["none", "dust"] },
    up: { booster: 0, speed: 0, magnet: 0, glide: 0, luck: 0 },
    items: { startShield: 0, startBoost: 0, doubleCoin: 0 },
    missions: [], missionTier: {},
    stats: { runs: 0, coinsTotal: 0, distTotal: 0, boosters: 0, speeds: 0, smash: 0, glide: 0, jumps: 0, gems: 0, springs: 0, eggs: 0, crows: 0, chicks: 0, chicksLost: 0, deaths: 0, missionsDone: 0 },
    daily: { last: "", streak: 0 },
    settings: { sfx: 0.8, bgm: 0.5, shake: true, muted: false },
  };
}

export function loadSave() {
  const d = defaultSave();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        ...d, ...s,
        owned: { ...d.owned, ...(s.owned || {}) }, up: { ...d.up, ...(s.up || {}) }, items: { ...d.items, ...(s.items || {}) },
        stats: { ...d.stats, ...(s.stats || {}) }, daily: { ...d.daily, ...(s.daily || {}) }, settings: { ...d.settings, ...(s.settings || {}) },
        missionTier: { ...(s.missionTier || {}) }, missions: s.missions || [],
      };
    }
  } catch (e) { /* storage blocked: play without saving */ }
  return d;
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked */ }
}

export function upgradeValue(save, id) {
  const u = UPGRADES.find((x) => x.id === id);
  return u.base + u.per * (save.up[id] || 0);
}

/** Keeps three missions going, picking new types the player doesn't have yet. */
export function fillMissions(save) {
  const have = new Set(save.missions.map((m) => m.key));
  let guard = 0;
  while (save.missions.length < 3 && guard++ < 50) {
    const pool = MISSION_TYPES.filter((t) => !have.has(t.key));
    const t = pool[Math.floor(Math.random() * pool.length)];
    const tier = Math.min(save.missionTier[t.key] || 0, t.goals.length - 1);
    const goal = t.goals[tier];
    const base = t.run ? 0 : (save.stats[t.key] || 0);
    save.missions.push({ key: t.key, goal, base, progress: 0, done: false, reward: 60 + tier * 50 + Math.floor(Math.random() * 4) * 10 });
    have.add(t.key);
  }
}

export function missionText(m) {
  const t = MISSION_TYPES.find((x) => x.key === m.key);
  return t ? t.text(m.goal) : m.key;
}
export function missionType(m) { return MISSION_TYPES.find((x) => x.key === m.key); }

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
export const DAILY_REWARDS = [100, 150, 200, 250, 300, 400, 777];

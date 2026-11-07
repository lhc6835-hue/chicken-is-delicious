// Save data and the rules that change it: gacha rolls, nest incubation, hatching, breeding, upgrades.
import { RAR, SP, BY_RARITY, RECIPES, PITY_LEGEND, MAX_LV, MAX_STAR, lvCost, slotCost, nestCost, PULL1, PULL10 } from "./data.js";

const KEY = "chicken-fountain-save-v1";

export let S = null;

function fresh() {
  return {
    v: 1, coins: 300, feathers: 10, nextUid: 1,
    chickens: [], formation: [null, null, null, null, null, null, null, null], slots: 4,
    nest: [], nestSlots: 4, store: [],
    dex: {}, pity: 0, pulls: 0, hatched: 0,
    cleared: {}, best: 0, last: Date.now(),
    mute: false, tut: {},
  };
}

export function load() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { data = null; }
  if (data && data.v === 1) {
    S = { ...fresh(), ...data };
    // incubation keeps going while the game is closed, at the base rate, up to 8 hours
    const away = Math.min(8 * 3600, Math.max(0, (Date.now() - (S.last || Date.now())) / 1000));
    for (const e of S.nest) e.prog = Math.min(e.dur, e.prog + away);
    S.awaySeconds = away;
  } else {
    S = fresh();
    for (const sp of ["kkokko", "kkokko", "chick"]) addChicken(sp);
    S.formation[0] = S.chickens[0].uid;
    S.formation[1] = S.chickens[1].uid;
    S.formation[4] = S.chickens[2].uid;
    S.isNew = true;
  }
  return S;
}

let dirty = false;
export const touch = () => (dirty = true);
export function save(force = false) {
  if (!dirty && !force) return;
  dirty = false;
  S.last = Date.now();
  const { awaySeconds, isNew, ...keep } = S;
  try { localStorage.setItem(KEY, JSON.stringify(keep)); } catch { /* storage may be blocked */ }
}
export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* */ }
  S = null;
  load();
}

// ---------- chickens ----------
export function addChicken(sp, lv = 1) {
  const c = { uid: S.nextUid++, sp, lv, star: 1 };
  S.chickens.push(c);
  const isNew = !S.dex[sp];
  S.dex[sp] = true;
  touch();
  return { c, isNew };
}
export const byUid = (uid) => S.chickens.find((c) => c.uid === uid);
export const inFormation = (uid) => S.formation.includes(uid);
export function placeAt(uid, slot) {
  if (slot >= S.slots) return false;
  const was = S.formation.indexOf(uid);
  const there = S.formation[slot];
  if (was >= 0) S.formation[was] = there ?? null;
  S.formation[slot] = uid;
  touch();
  return true;
}
export function unplace(uid) {
  const i = S.formation.indexOf(uid);
  if (i >= 0) S.formation[i] = null;
  touch();
}
export function levelUp(c) {
  const cost = lvCost(c.sp, c.lv);
  if (c.lv >= MAX_LV || S.feathers < cost) return false;
  S.feathers -= cost;
  c.lv++;
  touch();
  return true;
}
/** Merge another chicken of the same species into c: +1 star. */
export function mergeInto(c, other) {
  if (!other || other.uid === c.uid || other.sp !== c.sp || (c.star ?? 1) >= MAX_STAR) return false;
  c.star = (c.star ?? 1) + 1;
  c.lv = Math.max(c.lv, other.lv);
  release(other, false);
  touch();
  return true;
}
export const releaseValue = (c) => Math.round((2 + SP[c.sp].r * 6) * (c.star ?? 1) + c.lv);
export function release(c, pay = true) {
  if (S.chickens.length <= 1) return false;
  if (pay) S.feathers += releaseValue(c);
  unplace(c.uid);
  S.chickens = S.chickens.filter((x) => x.uid !== c.uid);
  touch();
  return true;
}
export function buySlot() {
  const cost = slotCost(S.slots);
  if (S.slots >= 8 || S.coins < cost) return false;
  S.coins -= cost;
  S.slots++;
  touch();
  return true;
}
export function buyNest() {
  const cost = nestCost(S.nestSlots);
  if (S.nestSlots >= 6 || S.coins < cost) return false;
  S.coins -= cost;
  S.nestSlots++;
  touch();
  return true;
}

// ---------- gacha ----------
function rollRarity() {
  S.pity++;
  if (S.pity >= PITY_LEGEND) return 4;
  const total = RAR.reduce((a, r) => a + r.rate, 0);
  let x = Math.random() * total;
  for (const r of RAR) if ((x -= r.rate) < 0) return r.id;
  return 0;
}
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** Pull n eggs; pays, applies pity, returns [{ r, sp }]. Null if not enough coins. */
export function pull(n) {
  const cost = n === 10 ? PULL10 : PULL1 * n;
  if (S.coins < cost) return null;
  S.coins -= cost;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = rollRarity();
    if (r === 4) S.pity = 0;
    out.push({ r, sp: pick(BY_RARITY[r]).id });
  }
  // a ten-pull always has at least one 희귀 or better
  if (n === 10 && !out.some((e) => e.r >= 2)) {
    const r = 2;
    out[9] = { r, sp: pick(BY_RARITY[r]).id };
  }
  S.pulls += n;
  for (const e of out) S.store.push(e);
  fillNest();
  touch();
  return out;
}

// ---------- nest ----------
export function fillNest() {
  while (S.nest.length < S.nestSlots && S.store.length) {
    // the rarest waiting egg goes in first
    S.store.sort((a, b) => b.r - a.r);
    const e = S.store.shift();
    S.nest.push({ uid: S.nextUid++, sp: e.sp, r: e.r, prog: 0, dur: RAR[e.r].hatch, warm: 50, bred: !!e.bred });
  }
}
/** Warm band: in it, incubation runs 3x. */
export const WARM_LO = 40, WARM_HI = 85;
export function tickNest(dt) {
  for (const e of S.nest) {
    if (e.prog >= e.dur) continue;
    const good = e.warm >= WARM_LO && e.warm <= WARM_HI;
    e.prog = Math.min(e.dur, e.prog + dt * (good ? 3 : e.warm > WARM_HI ? 0.5 : 1));
    e.warm = Math.max(15, e.warm - dt * 2.6);
  }
}
export function warmEgg(e, k = 9) { e.warm = Math.min(100, e.warm + k); }
export function hatchEgg(e) {
  S.nest = S.nest.filter((x) => x !== e);
  S.hatched++;
  const res = addChicken(e.sp);
  fillNest();
  touch();
  return res;
}

// ---------- breeding ----------
export const breedCost = (a, b) => 60 + (SP[a.sp].r + SP[b.sp].r) * 90;
export function recipeFor(a, b) {
  return RECIPES.find((r) => (r.a === a.sp && r.b === b.sp) || (r.a === b.sp && r.b === a.sp));
}
export function breed(a, b) {
  const cost = breedCost(a, b);
  if (S.coins < cost || a.uid === b.uid) return null;
  S.coins -= cost;
  const rec = recipeFor(a, b);
  const bonus = Math.min(0.25, ((a.lv + b.lv) / 2) * 0.01 + ((a.star ?? 1) + (b.star ?? 1) - 2) * 0.03);
  let sp, mutated = false;
  if (rec && Math.random() < rec.chance + bonus) { sp = rec.out; mutated = true; }
  else {
    const top = Math.max(SP[a.sp].r, SP[b.sp].r), x = Math.random();
    if (x < 0.6) sp = Math.random() < 0.5 ? a.sp : b.sp;
    else if (x < 0.9) sp = pick(BY_RARITY[top]).id;
    else sp = pick(BY_RARITY[Math.min(4, top + 1)]).id;
    if (SP[sp].mut) sp = pick(BY_RARITY[SP[sp].r]).id;
  }
  const egg = { r: SP[sp].r, sp, bred: true };
  S.store.push(egg);
  fillNest();
  touch();
  return { ...egg, mutated };
}

export function addCoins(n) { S.coins += n; touch(); }
export function addFeathers(n) { S.feathers += n; touch(); }

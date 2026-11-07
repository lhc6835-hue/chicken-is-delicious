// Game data: rarities, chicken species, enemies, regions, breeding recipes.

export const RAR = [
  { id: 0, key: "common", name: "일반", color: "#c4ccd8", dark: "#4a5262", rate: 52, hatch: 20 },
  { id: 1, key: "rare", name: "고급", color: "#5ab0f4", dark: "#13306a", rate: 30, hatch: 45 },
  { id: 2, key: "epic", name: "희귀", color: "#c07cff", dark: "#3a1462", rate: 12.5, hatch: 90 },
  { id: 3, key: "hero", name: "영웅", color: "#ff8a3a", dark: "#5e1414", rate: 4.5, hatch: 180 },
  { id: 4, key: "legend", name: "전설", color: "#ffd84a", dark: "#5a3a0c", rate: 1, hatch: 300 },
];

// egg shell colors by rarity: [shadow, mid, light, spot]
export const EGG = [
  ["#9a8a78", "#e8dcc8", "#fff8ec", "#c8b090"],
  ["#2a5a9a", "#6ab4ec", "#d4eeff", "#2f80d8"],
  ["#5a2a8a", "#b07ce8", "#ecd8ff", "#7a3ac0"],
  ["#8a2a14", "#f0703a", "#ffd0a8", "#c0401c"],
  ["#8a5a0c", "#ffcc3a", "#fff6c0", "#d89a14"],
];

/*
 * Species. body/shade/hi/out: plumage ramp; comb; acc: accessory drawn on the sprite; size: body radius
 * scale; role: melee | ranged | tank | healer; atk kind picks the projectile and hit effect.
 * Stats at level 1: hp, atk, cd (seconds between attacks), range (px), spd (px/s).
 * skill: { name, desc, cd } and its id is handled in battle.js.
 */
export const SPECIES = [
  // common
  { id: "kkokko", name: "꼬꼬", r: 0, role: "melee", body: "#f4f0e8", shade: "#c8c0b4", hi: "#ffffff", comb: "#e8343a", acc: null,
    hp: 60, atk: 9, cd: 1.0, range: 12, spd: 34, skill: { id: "peck3", name: "연속 쪼기", desc: "3번 연속으로 쪼아요.", cd: 7 },
    lore: "어느 마당에나 있는 평범한 닭. 그래도 쪼는 힘만큼은 진심이에요." },
  { id: "chick", name: "삐약이", r: 0, role: "melee", body: "#ffe04a", shade: "#e0a820", hi: "#fff6b0", comb: null, acc: "chick", size: 0.78,
    hp: 38, atk: 7, cd: 0.6, range: 10, spd: 46, skill: { id: "dash", name: "종종 돌진", desc: "가장 먼 적에게 달려가 들이받아요.", cd: 6 },
    lore: "작고 빠른 병아리. 아직 무서운 게 뭔지 몰라요." },
  { id: "brown", name: "토종닭", r: 0, role: "tank", body: "#b8642a", shade: "#7a3e18", hi: "#e09050", comb: "#d82a2a", acc: null,
    hp: 110, atk: 7, cd: 1.2, range: 12, spd: 28, skill: { id: "guard", name: "버티기", desc: "4초 동안 받는 피해가 절반이 돼요.", cd: 9 },
    lore: "산골에서 자란 단단한 토종닭. 웬만해선 안 쓰러져요." },
  // rare
  { id: "fire", name: "불닭", r: 1, role: "ranged", body: "#ff6a3a", shade: "#c0301c", hi: "#ffb070", comb: "flame", acc: null, shot: "fire",
    hp: 55, atk: 14, cd: 1.5, range: 120, spd: 30, skill: { id: "fireball", name: "불알 투척", desc: "폭발하는 불덩이 알을 던져 주변에 피해를 줘요.", cd: 7 },
    lore: "매운 걸 너무 좋아하다 몸에서 불이 나기 시작했어요." },
  { id: "ice", name: "얼음닭", r: 1, role: "ranged", body: "#bfe8ff", shade: "#6aa8d8", hi: "#ffffff", comb: "#58b4ec", acc: "ice", shot: "ice",
    hp: 58, atk: 11, cd: 1.4, range: 115, spd: 30, skill: { id: "frost", name: "서리 깃", desc: "적 무리를 얼려 느리게 만들어요.", cd: 8 },
    lore: "냉동실에서 탈출한 전설이 있어요. 본인은 부인해요." },
  { id: "shield", name: "방패닭", r: 1, role: "tank", body: "#d8d0c0", shade: "#a09482", hi: "#f8f4ec", comb: "#e8343a", acc: "shield",
    hp: 150, atk: 6, cd: 1.3, range: 12, spd: 26, skill: { id: "taunt", name: "도발", desc: "적들의 공격을 끌어모으고 방어가 올라가요.", cd: 10 },
    lore: "냄비 뚜껑을 방패로 쓰기 시작한 뒤로 아무도 못 말려요." },
  { id: "sling", name: "새총닭", r: 1, role: "ranged", body: "#e8c890", shade: "#b08a50", hi: "#fff0c8", comb: "#e8343a", acc: "band", shot: "egg",
    hp: 50, atk: 10, cd: 0.9, range: 130, spd: 32, skill: { id: "volley", name: "알 난사", desc: "알 5개를 한꺼번에 쏘아요.", cd: 7 },
    lore: "알을 아끼지 않는 닭. 어디서 그렇게 많이 나오는지는 비밀." },
  // epic
  { id: "thunder", name: "천둥닭", r: 2, role: "ranged", body: "#5a6aa8", shade: "#323e70", hi: "#8a9ae0", comb: "bolt", acc: "tuft", shot: "volt",
    hp: 70, atk: 16, cd: 1.6, range: 120, spd: 30, skill: { id: "chain", name: "연쇄 번개", desc: "번개가 적 4명에게 튀어요.", cd: 7 },
    lore: "폭풍 치는 밤에 태어났어요. 깃털이 늘 곤두서 있어요." },
  { id: "priest", name: "성직닭", r: 2, role: "healer", body: "#fff8ec", shade: "#d8ccb4", hi: "#ffffff", comb: "#ffb040", acc: "halo", shot: "holy",
    hp: 65, atk: 8, cd: 1.4, range: 110, spd: 30, skill: { id: "heal", name: "치유의 알", desc: "체력이 가장 낮은 닭들을 치유해요.", cd: 5 },
    lore: "매일 아침 꼬끼오 대신 기도를 해요. 효과는 확실해요." },
  { id: "ninja", name: "닌자닭", r: 2, role: "melee", body: "#3a3448", shade: "#221e2e", hi: "#5a5470", comb: "#e8343a", acc: "mask",
    hp: 70, atk: 15, cd: 0.7, range: 11, spd: 52, skill: { id: "blink", name: "그림자 쪼기", desc: "적 뒤로 순간이동해 치명타를 넣어요.", cd: 6 },
    lore: "보였다면 이미 늦은 거예요." },
  // hero
  { id: "knight", name: "기사닭", r: 3, role: "tank", body: "#e8e4dc", shade: "#b0a898", hi: "#ffffff", comb: "#e8343a", acc: "helm", size: 1.12,
    hp: 260, atk: 14, cd: 1.2, range: 13, spd: 26, skill: { id: "bash", name: "방패 강타", desc: "앞의 적들을 밀치고 기절시켜요.", cd: 8 },
    lore: "마구간을 지키던 갑옷을 물려받은 자랑스러운 기사." },
  { id: "archmage", name: "대마법닭", r: 3, role: "ranged", body: "#7a4ac0", shade: "#4a2480", hi: "#a880e8", comb: "#ff5aa0", acc: "wizard", shot: "arcane",
    hp: 80, atk: 22, cd: 1.8, range: 125, spd: 28, skill: { id: "meteor", name: "운석 알", desc: "하늘에서 거대한 알을 떨어뜨려요.", cd: 9 },
    lore: "마법탑 꼭대기에서 백 년 동안 알을 품으며 마법을 익혔어요." },
  { id: "silkie", name: "오골계", r: 3, role: "melee", body: "#2a2430", shade: "#16121c", hi: "#4a4058", comb: "#5a2a6a", acc: "fluff", size: 1.05,
    hp: 150, atk: 18, cd: 0.9, range: 12, spd: 36, skill: { id: "drain", name: "흑염 흡수", desc: "주변 적의 생명력을 빨아들여요.", cd: 8 },
    lore: "피부까지 새까만 신비로운 닭. 밤이 되면 더 강해져요." },
  // legend
  { id: "phoenix", name: "황금 불사조닭", r: 4, role: "ranged", body: "#ffcc3a", shade: "#d88a14", hi: "#fff6b0", comb: "flame", acc: "crown", shot: "fire", size: 1.12,
    hp: 160, atk: 26, cd: 1.4, range: 125, spd: 32, skill: { id: "inferno", name: "불사의 날개", desc: "모든 적에게 불꽃을 퍼붓고, 쓰러지면 한 번 부활해요.", cd: 10 },
    lore: "황금 닭 분수의 첫 번째 알에서 태어났다는 전설의 닭." },
  { id: "dragon", name: "용닭", r: 4, role: "melee", body: "#3ac07a", shade: "#1e7a4a", hi: "#8ae8b0", comb: "spikes", acc: "horns", size: 1.2,
    hp: 300, atk: 28, cd: 1.0, range: 14, spd: 30, skill: { id: "breath", name: "용의 숨결", desc: "앞으로 불을 뿜어 줄지어 선 적을 태워요.", cd: 8 },
    lore: "닭은 공룡의 후손이라는 말, 이 닭을 보면 믿게 돼요." },
  // mutations: only from breeding
  { id: "steam", name: "증기닭", r: 2, role: "ranged", mut: true, body: "#c8d4e0", shade: "#8a98a8", hi: "#ffffff", comb: "#ff8a5a", acc: "pipe", shot: "steam",
    hp: 85, atk: 18, cd: 1.3, range: 120, spd: 30, skill: { id: "steam", name: "증기 폭발", desc: "뜨거운 증기로 주변 적을 태우고 얼려요.", cd: 7 },
    lore: "불과 얼음이 만나 태어난 닭. 늘 칙칙폭폭 소리를 내요.", hint: "불과 얼음이 만나면…" },
  { id: "storm", name: "폭풍불닭", r: 3, role: "ranged", mut: true, body: "#ff8a3a", shade: "#7a3acc", hi: "#ffd08a", comb: "bolt", acc: "tuft", shot: "volt",
    hp: 110, atk: 26, cd: 1.4, range: 125, spd: 32, skill: { id: "firestorm", name: "불벼락", desc: "불붙은 번개가 적 6명에게 튀어요.", cd: 7 },
    lore: "번개를 맞고도 멀쩡했던 불닭의 후손.", hint: "불꽃에 천둥이 치면…" },
  { id: "paladin", name: "성기사닭", r: 4, role: "tank", mut: true, body: "#fff4d0", shade: "#d8b860", hi: "#ffffff", comb: "#ffb040", acc: "holyhelm", size: 1.18,
    hp: 380, atk: 20, cd: 1.1, range: 14, spd: 28, skill: { id: "sanctum", name: "성역", desc: "모든 닭을 치유하고 3초간 무적으로 만들어요.", cd: 12 },
    lore: "기사의 방패와 성직자의 기도를 함께 물려받은 수호자.", hint: "기사가 기도를 배우면…" },
];
export const SP = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
export const BY_RARITY = [0, 1, 2, 3, 4].map((r) => SPECIES.filter((s) => s.r === r && !s.mut));

// breeding recipes (unordered pairs) -> mutation
export const RECIPES = [
  { a: "fire", b: "ice", out: "steam", chance: 0.4 },
  { a: "fire", b: "thunder", out: "storm", chance: 0.3 },
  { a: "phoenix", b: "thunder", out: "storm", chance: 0.5 },
  { a: "knight", b: "priest", out: "paladin", chance: 0.25 },
];

// ---------- enemies ----------
// look: skin, hair, cloth, trim, hat kind, weapon kind
export const FOES = {
  squire: { name: "견습 용사", role: "melee", hp: 50, atk: 8, cd: 1.1, range: 12, spd: 22, look: { skin: "#f4c8a0", hair: "#7a4a2a", cloth: "#3a6ad0", trim: "#ffd84a", hat: "none", wpn: "sword", body: "tunic" }, coin: 6 },
  archer: { name: "궁수", role: "ranged", hp: 36, atk: 9, cd: 1.5, range: 120, spd: 20, look: { skin: "#f0c090", hair: "#d8a040", cloth: "#3a8a4a", trim: "#a06a3a", hat: "hood", wpn: "bow", body: "tunic" }, coin: 7, shot: "arrow" },
  mage: { name: "마법사", role: "ranged", hp: 32, atk: 13, cd: 2.0, range: 115, spd: 18, look: { skin: "#f4d0b0", hair: "#e8e8f0", cloth: "#4a3a8a", trim: "#ffd84a", hat: "witch", wpn: "staff", body: "robe", gem: "#c684ff" }, coin: 9, shot: "arcane" },
  paladin: { name: "성기사", role: "tank", hp: 120, atk: 8, cd: 1.4, range: 12, spd: 16, look: { skin: "#f0c8a8", hair: "#c89a50", cloth: "#b8c0d0", trim: "#ffd84a", hat: "helm", wpn: "mace", body: "tunic" }, coin: 10 },
  rogue: { name: "도적", role: "melee", hp: 40, atk: 11, cd: 0.7, range: 11, spd: 34, look: { skin: "#e8b890", hair: "#2a2430", cloth: "#4a4058", trim: "#c83a3a", hat: "bandana", wpn: "dagger", body: "tunic" }, coin: 8 },
  cleric: { name: "사제", role: "healer", hp: 40, atk: 5, cd: 1.8, range: 100, spd: 18, look: { skin: "#f4d0b0", hair: "#f0d070", cloth: "#f0ece0", trim: "#5ab0f4", hat: "hood", wpn: "staff", body: "robe", gem: "#5ab0f4", hood: "#a8d0f4" }, coin: 9, shot: "holy" },
  // bosses
  guildmaster: { name: "용사 길드장 브레이브", boss: true, role: "melee", hp: 520, atk: 18, cd: 1.2, range: 16, spd: 20, look: { skin: "#f4c8a0", hair: "#d84a2a", cloth: "#c8343a", trim: "#ffd84a", hat: "crownhelm", wpn: "greatsword", cape: "#8a1a2a" }, coin: 120 },
  hunter: { name: "사냥꾼 대장 로빈", boss: true, role: "ranged", hp: 560, atk: 20, cd: 1.1, range: 130, spd: 20, look: { skin: "#e8b890", hair: "#5a3a1a", cloth: "#2a6a3a", trim: "#d8a040", hat: "feathercap", wpn: "bow", cape: "#1e4a2a" }, coin: 160, shot: "arrow" },
  archwizard: { name: "대마법사 메를로", boss: true, role: "ranged", hp: 620, atk: 26, cd: 1.6, range: 125, spd: 16, look: { skin: "#f4d0b0", hair: "#ffffff", cloth: "#2a2a7a", trim: "#c684ff", hat: "bigwitch", wpn: "staff", cape: "#1a1a4a", beard: true, gem: "#ff5aa0" }, coin: 220, shot: "arcane" },
  gourmet: { name: "미식왕 크리스피", boss: true, role: "melee", hp: 900, atk: 30, cd: 1.1, range: 18, spd: 18, look: { skin: "#f4c8a0", hair: "#3a2a1a", cloth: "#8a1a3a", trim: "#ffd84a", hat: "crown", wpn: "fork", cape: "#c8343a" }, coin: 400 },
};

// ---------- regions ----------
export const REGIONS = [
  { id: 0, name: "풀빛 마을", sub: "용사들이 처음 모이는 곳", foes: ["squire", "squire", "archer", "rogue"], boss: "guildmaster",
    sky: ["#8ad0f4", "#b8e4f8", "#e0f4ff"], hill: ["#5ab05a", "#3a8a4a"], ground: ["#7ac05a", "#5aa04a", "#4a8a3a"], deco: "village" },
  { id: 1, name: "속삭이는 숲", sub: "궁수와 도적의 은신처", foes: ["archer", "rogue", "squire", "cleric", "archer"], boss: "hunter",
    sky: ["#5a8ab0", "#8ab8c8", "#c8e0d8"], hill: ["#2a6a4a", "#1a4a3a"], ground: ["#4a8a4a", "#3a7040", "#2a5a34"], deco: "forest" },
  { id: 2, name: "별빛 마법탑", sub: "마법사들이 닭을 연구하는 탑", foes: ["mage", "cleric", "paladin", "mage", "archer"], boss: "archwizard",
    sky: ["#2a2050", "#4a3a80", "#7a5aa8"], hill: ["#3a2a5a", "#2a1e44"], ground: ["#6a6a8a", "#55557a", "#44446a"], deco: "tower" },
  { id: 3, name: "황금 왕성", sub: "치킨을 사랑하는 왕의 성", foes: ["paladin", "squire", "mage", "rogue", "cleric", "archer"], boss: "gourmet",
    sky: ["#e8905a", "#f0b880", "#f8dcb0"], hill: ["#a86a4a", "#7a4a3a"], ground: ["#c8b090", "#b09878", "#98805e"], deco: "castle" },
];
export const STAGES_PER_REGION = 6;

/** The waves of one stage: lists of foe ids, and the stat multiplier. */
export function stagePlan(region, stage) {
  const R = REGIONS[region], gi = region * STAGES_PER_REGION + stage;
  const mult = Math.pow(1.2, gi);
  const nWaves = 3 + Math.floor(stage / 2);
  const waves = [];
  let seed = gi * 7919 + 13;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let w = 0; w < nWaves; w++) {
    const n = Math.min(7, 2 + Math.floor((stage + w) / 2) + (region > 1 ? 1 : 0));
    const list = [];
    for (let i = 0; i < n; i++) list.push(R.foes[Math.floor(rnd() * R.foes.length)]);
    waves.push(list);
  }
  if (stage === STAGES_PER_REGION - 1) waves[waves.length - 1] = [R.boss, R.foes[0], R.foes[1]];
  return { waves, mult, coin: Math.round(40 * Math.pow(1.25, gi)), feather: 3 + gi };
}

/** Endless farm defense: wave n. */
export function defenseWave(n) {
  const pool = ["squire", "archer", "rogue", "mage", "cleric", "paladin"];
  const unlocked = Math.min(pool.length, 2 + Math.floor(n / 3));
  const count = Math.min(9, 2 + Math.floor(n / 2));
  const list = [];
  for (let i = 0; i < count; i++) list.push(pool[(n * 7 + i * 3) % unlocked]);
  if (n % 10 === 9) list[0] = ["guildmaster", "hunter", "archwizard", "gourmet"][Math.floor(n / 10) % 4];
  return { list, mult: Math.pow(1.13, n) };
}

// ---------- economy ----------
export const PULL1 = 100, PULL10 = 900;
export const PITY_LEGEND = 80, PITY_EPIC10 = true;
export const lvCost = (sp, lv) => Math.round(6 * lv * (1 + SP[sp].r * 0.6));
export const MAX_LV = 30, MAX_STAR = 5;
export const slotCost = (n) => [0, 0, 0, 0, 300, 800, 2000, 5000][n] ?? 9999;
export const nestCost = (n) => [0, 0, 0, 0, 600, 1500][n] ?? 9999;

export function stats(c) {
  const s = SP[c.sp], k = (1 + 0.12 * (c.lv - 1)) * (1 + 0.25 * ((c.star ?? 1) - 1));
  return { hp: Math.round(s.hp * k), atk: Math.round(s.atk * k), cd: s.cd, range: s.range, spd: s.spd };
}
export const power = (c) => { const s = stats(c); return Math.round(s.hp * 0.3 + (s.atk / s.cd) * 6); };

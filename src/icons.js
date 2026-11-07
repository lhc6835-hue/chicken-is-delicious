// Hand-made pixel icons for the menus and HUD (they replace emoji, which render differently on every
// device and clash with the pixel art). Each is a small grid in one shared palette with the ink
// outline the rest of the game uses. iconHtml() gives an <i> for the DOM menus, drawIcon() draws
// one on a canvas; both stay crisp at any zoom.

const PAL = {
  K: "#1a0e14", W: "#fff4dc", L: "#ffffff", w: "#c8b890", Y: "#ffd84a", y: "#d0901a", O: "#ff8a2a",
  R: "#ff4c2d", r: "#a8201a", P: "#ff86c0", G: "#6fd04a", g: "#2e8a2a", B: "#5eb0ff", b: "#2a5aa0",
  S: "#d0d4e0", s: "#7a8094", N: "#b8783a", n: "#6a4020", C: "#e4c0a3", k: "#3a3648", V: "#9a7aff", E: "#1a0a0a",
};

const ICONS = {
  play: [
    "..KK........", "..KWKK......", "..KWWWKK....", "..KWWWWWKK..", "..KWWWWWWWK.",
    "..KWWWWWWWK.", "..KWWWWWKK..", "..KWWWKK....", "..KWKK......", "..KK........",
  ],
  basket: [
    "...KKKKKK...", "..KNK..KNK..", ".KNK....KNK.", ".KNKWWKWWNK.", "KKKKKKKKKKKK", "KYNYNYNYNYNK",
    ".KNYNYNYNYK.", ".KYNYNYNYNK.", ".KNYNYNYNYK.", "..KyNyNyNK..", "..KKKKKKKK..",
  ],
  flag: [
    ".K..........", ".KKKKKK.....", ".KRRRRRKKKK.", ".KRRWRRRRRK.", ".KRWWWRRRRK.", ".KRRWRRKKKK.",
    ".KKKKKK.....", ".K..........", ".K..........", ".K..........", "KKK.........",
  ],
  egg: [
    "....KKKK....", "...KYYYYK...", "..KYLYYYYK..", "..KYLYYYYK..", ".KYYYYYYYYK.", ".KYYYYYYyYK.",
    ".KYYYYYYyYK.", ".KYYYYYyyYK.", "..KYYyyyYK..", "...KKKKKK...",
  ],
  chart: [
    "........KKK.", "........KGK.", "....KKK.KGK.", "....KYK.KGK.", "KKK.KYK.KGK.", "KRK.KYK.KGK.",
    "KRK.KYK.KGK.", "KRK.KYK.KGK.", "KKKKKKKKKKKK",
  ],
  gear: [
    "....KKKK....", "..KKKSSKKK..", ".KSSKSSKSSK.", ".KSSSSSSSSK.", "KKSSSKKSSSKK", "KSSSK..KSSSK",
    "KSSSK..KSSSK", "KKSSSKKSSSKK", ".KSSSSSSsSK.", ".KSSKSSKsSK.", "..KKKSSKKK..", "....KKKK....",
  ],
  help: [
    "..KKKKKKKK..", ".KWWWWWWWWK.", "KWWWKKKWWWWK", "KWWKWWWKWWWK", "KWWWWWWKWWWK", "KWWWWWKWWWWK",
    "KWWWWKWWWWWK", "KWWWWWWWWWWK", ".KWWWKWWWWK.", "..KKKKKKKK..", "...KK.......", "..K.........",
  ],
  sun: [
    ".....YY.....", "..Y..YY..Y..", "...KKKKKK...", "..KYYYYYYK..", "YYKYLYYYYKYY", "YYKYYYYYYKYY",
    "..KYYYYYyK..", "..KYYYYyyK..", "...KKKKKK...", "..Y..YY..Y..", ".....YY.....",
  ],
  heart: [
    ".KKK...KKK..", "KRRRK.KRRRK.", "KRLRRKRRRRK.", "KRRRRRRRRRK.", "KRRRRRRRRRK.", ".KRRRRRRRK..",
    "..KRRRRRK...", "...KRRRK....", "....KRK.....", ".....K......",
  ],
  retry: [
    "...KKKKK....", "..KGGGGGK.K.", ".KGKKKKKGKGK", ".KGK...KGGGK", "KGK....KGGGK", "KGK...KKKKKK",
    "KGK.........", "KGK......KK.", ".KGK....KGK.", ".KGKKKKKGK..", "..KGGGGGK...", "...KKKKK....",
  ],
  home: [
    ".....KK.....", "....KRRK....", "...KRRRRK...", "..KRRRRRRK..", ".KRRRRRRRRK.", "KKKKKKKKKKKK",
    ".KWWWWWWWWK.", ".KWWKKKWBBK.", ".KWWKNKWBBK.", ".KWWKNKWWWK.", ".KKKKKKKKKK.",
  ],
  close: [
    ".KK......KK.", ".KRK....KRK.", "..KRK..KRK..", "...KRKKRK...", "....KRRK....", "....KRRK....",
    "...KRKKRK...", "..KRK..KRK..", ".KRK....KRK.", ".KK......KK.",
  ],
  pause: [
    "..KKK..KKK..", "..KWK..KWK..", "..KWK..KWK..", "..KWK..KWK..", "..KWK..KWK..", "..KWK..KWK..",
    "..KWK..KWK..", "..KWK..KWK..", "..KKK..KKK..",
  ],
  chick: [
    "....KKKK....", "...KLYYYK...", "..KYYYYEKOO.", "..KYYYYYYK..", ".KYYwwYYYK..", ".KyYYYYYyK..",
    "..KyyyyyK...", "...KKKKK....", "....O..O....",
  ],
  chicken: [
    "...K.K.K....", "..KRKRKRK...", "..KRRRRRK...", ".KCCCCCCK...", "KYKCECCCCK..", "KYYKCCCCCK..",
    ".KKRCCCCCK..", "...KRCCCCCK.", "....KCCCCCK.", "....KKKKKK..",
  ],
  hat: [
    "...KKKKKK...", "...KkkkkK...", "...KkkkkK...", "...KkkkkK...", "...KRRRRK...", "...KkkkkK...",
    ".KKKKKKKKKK.", ".KkkkkkkkkK.", ".KKKKKKKKKK.",
  ],
  sparkle: [
    ".....K......", "....KYK.....", "....KYK.....", "..KKYLYKK...", ".KYYLLLYYK..", "..KKYLYKK...",
    "....KYK..K..", "....KYK.KYK.", ".....K...K..", "..K.........", ".KYK........", "..K.........",
  ],
  up: [
    ".....KK.....", "....KGGK....", "...KGGGGK...", "..KGGGGGGK..", ".KGGGGGGGGK.", ".KKKKGGKKKK.",
    "....KGGK....", "....KGGK....", "....KGGK....", "....KgGK....", "....KKKK....",
  ],
  bag: [
    "....KKKK....", "...K....K...", "..KKKKKKKK..", ".KNNNNNNNNK.", ".KNnnnnnnNK.", ".KNNNKKNNNK.",
    ".KNNNKYNNNK.", ".KNNNNNNNNK.", ".KNnNNNNnNK.", ".KNNNNNNNNK.", "..KKKKKKKK..",
  ],
  rocket: [
    ".....KK.....", "....KWWK....", "....KWWK....", "...KWRRWK...", "...KWBBWK...", "...KWBBWK...",
    "...KWWWWK...", "..KRKWWKRK..", ".KRRKWWKRRK.", ".KKKKOOKKKK.", ".....YY.....", "....Y..Y....",
  ],
  bolt: [
    "......KKKK..", ".....KYYK...", "....KYYK....", "...KYYK.....", "..KYYYKKKK..", ".KKKKYYYYK..",
    "....KYYK....", "...KYYK.....", "..KYYK......", "..KYK.......", "..KK........",
  ],
  magnet: [
    ".KKKK.KKKK..", ".KSSK.KSSK..", ".KRRK.KRRK..", ".KRRK.KRRK..", ".KRRK.KRRK..", ".KRRKKKRRK..",
    ".KRRRRRRRK..", "..KRRRRRK...", "...KKKKK....",
  ],
  feather: [
    "........KKK.", ".......KWWK.", "......KWWWK.", ".....KWWWK..", "....KWWWwK..", "...KWWWwK...",
    "...KWWwK....", "..KWWwK.....", "..KWwK......", ".KKKK.......", "KK..........",
  ],
  clover: [
    "...KK..KK...", "..KGGKKGGK..", "..KGgGGgGK..", "...KGGGGK...", ".KKKGGGGKKK.", "KGGGGKKGGGGK",
    "KGgGGKKGGgGK", ".KKKGGGGKKK.", "...KGGGGK...", "....KKgK....", "......KgK...", ".......KK...",
  ],
  shield: [
    ".KKKKKKKKKK.", ".KBBBBBBBBK.", ".KBLBBBBBBK.", ".KBLBBWBBBK.", ".KBBBWWWBBK.", ".KBBBBWBBbK.",
    "..KBBBBBbK..", "...KBBBbK...", "....KBbK....", ".....KK.....",
  ],
  flame: [
    ".....K......", "....KRK.....", "....KRRK....", "...KRRRK.K..", "..KRROORKRK.", "..KROOOORRK.",
    ".KRROYYORRK.", ".KROYYYYORK.", ".KROYLLYORK.", "..KROYYORK..", "...KKKKKK...",
  ],
  money: [
    "...KKKKK....", "....KYYK....", "...KKKKKK...", "..KYYYYYYK..", ".KYYYKYYYYK.", ".KYYKKKYYYK.",
    ".KYYYKYYYYK.", ".KYYKKKYYYK.", ".KYYYKYYYyK.", "..KYYYYYyK..", "...KKKKKK...",
  ],
  party: [
    "..R....B....", "....Y.....P.", ".B...K..G...", "....KYK.....", "...KYYRK..Y.", "..KRYYYK....",
    ".KYYRYK..R..", "KYYYYK......", "KRYK....B...", "KKK.........",
  ],
  check: [
    "KKKKKKKKKK", "KGGGGGGGGK", "KGGGGGGLGK", "KGGGGGLLGK", "KGLGGLLGGK", "KGLLLLGGGK",
    "KGGLLGGGGK", "KGGGGGGGGK", "KKKKKKKKKK",
  ],
  box: [
    "KKKKKKKKKK", "KssssssssK", "KsSSSSSSsK", "KsSSSSSSsK", "KsSSSSSSsK", "KsSSSSSSsK",
    "KsSSSSSSsK", "KssssssssK", "KKKKKKKKKK",
  ],
  star: [
    ".....KK.....", "....KYYK....", "KKKKKYYKKKKK", "KYYYYYYYYYYK", ".KYYYLYYYYK.", "..KYYYYYYK..",
    "..KYYKKYYK..", ".KYYK..KYYK.", ".KKK....KKK.",
  ],
  coin: [
    "..KKKK..", ".KYYYYK.", "KYLYYYyK", "KYLYYYyK", "KYYYYYyK", "KYYYYyyK", ".KyyyyK.", "..KKKK..",
  ],
  cloud: [
    "....KKK.....", "...KWWWK.KK.", "..KWWWWWKWWK", ".KWWWWWWWWWK", "KWWWWWWWWWWK", "KwWWWWWWWWwK",
    ".KwwwwwwwwK.", "..KKKKKKKK..",
  ],
  notes: [
    "...KKKKKKK..", "...KPPPPPPK.", "...KPKKKKPK.", "...KPK..KPK.", "...KPK..KPK.", "...KPK..KPK.",
    ".KKKPK.KKPK.", "KPPPPKKPPPK.", "KPLPPKKPLPK.", ".KKKK..KKK..",
  ],
  rainbow: [
    "...KKKKKK...", "..KRRRRRRK..", ".KROOOOOORK.", "KROYYYYYYORK", "KROYGGGGYORK", "KROYG..GYORK",
    "KROYG..GYORK", "KKKKK..KKKKK",
  ],
};

// trail ids -> icon
export const TRAIL_ICON = { none: "close", dust: "cloud", hearts: "heart", stars: "star", notes: "notes", fire: "flame", rainbow: "rainbow" };

const cache = {};
function canvasFor(name) {
  if (cache[name]) return cache[name];
  const rows = ICONS[name] || ICONS.star;
  const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== "." && PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1); } }));
  cache[name] = { c, w, h, url: c.toDataURL() };
  return cache[name];
}

/** An inline icon for the DOM: k = pixels per cell (1 in normal text, 2 for big buttons). */
export function iconHtml(name, k = 1, cls = "") {
  const ic = canvasFor(name);
  return `<i class="pi ${cls}" style="width:${ic.w * k}px;height:${ic.h * k}px;background-image:url(${ic.url})"></i>`;
}

/** Draws an icon centred at (x, y) on a canvas. */
export function drawIcon(ctx, name, x, y, k = 1) {
  const ic = canvasFor(name);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ic.c, Math.round(x - (ic.w * k) / 2), Math.round(y - (ic.h * k) / 2), ic.w * k, ic.h * k);
}

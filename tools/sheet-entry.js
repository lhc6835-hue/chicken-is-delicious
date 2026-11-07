import { SPECIES, FOES } from "../src/data.js";
import { chicken, hero, egg, draw, drawIcon, weapon } from "../src/sprites.js";
const c = document.createElement("canvas"); c.width = 320; c.height = 150; document.body.appendChild(c);
const x = c.getContext("2d"); x.fillStyle = "#8ad06a"; x.fillRect(0, 0, 320, 150);
SPECIES.forEach((s, i) => { const X = 14 + (i % 9) * 34, Y = 30 + Math.floor(i / 9) * 34; draw(x, chicken(s.id, 0), X, Y); draw(x, chicken(s.id, 1), X + 17, Y); });
Object.entries(FOES).forEach(([id, f], i) => { const X = 14 + i * 31, Y = 122, spr = hero(id, f.look, f.boss); draw(x, spr, X, Y); weapon(x, f.look.wpn, X + spr.hand[0], Y + spr.hand[1], -2.0, f.boss ? 1.4 : 1); });
for (let r = 0; r < 5; r++) { draw(x, egg(r, 1), 10 + r * 14, 147); draw(x, egg(r, 2), 90 + r * 22, 147); }
const big = document.createElement("canvas"); big.width = 1280; big.height = 600; const b = big.getContext("2d"); b.imageSmoothingEnabled = false; b.drawImage(c, 0, 0, 1280, 600);
document.body.replaceChildren(big);

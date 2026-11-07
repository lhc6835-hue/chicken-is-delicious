import { FOES } from "../src/data.js";
import { chicken, hero, draw } from "../src/sprites.js";
const c = document.createElement("canvas"); c.width = 200; c.height = 90;
const x = c.getContext("2d"); x.fillStyle = "#8a7ac8"; x.fillRect(0, 0, 200, 90);
Object.entries(FOES).forEach(([id, f], i) => { const X = 16 + (i % 6) * 32, Y = i < 6 ? 34 : 84; draw(x, hero(id, f.look, f.boss, 0), X, Y); });
["squire", "archer", "mage"].forEach((id, i) => draw(x, hero(id, FOES[id].look, false, 2), 150 + (i % 2) * 30, 84 - (i > 1 ? 0 : 0)));
draw(x, chicken("brown"), 186, 34);
const big = document.createElement("canvas"); big.width = 1400; big.height = 630; const b = big.getContext("2d"); b.imageSmoothingEnabled = false; b.drawImage(c, 0, 0, 1400, 630);
document.body.replaceChildren(big);

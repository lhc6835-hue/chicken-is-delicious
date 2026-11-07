import { FOES } from "../src/data.js";
import { chicken, hero, draw, weapon } from "../src/sprites.js";
const c = document.createElement("canvas"); c.width = 160; c.height = 70;
const x = c.getContext("2d"); x.fillStyle = "#fbf3e4"; x.fillRect(0, 0, 160, 70);
["brown", "kkokko", "knight", "phoenix", "chick", "archmage"].forEach((id, i) => draw(x, chicken(id, 0), 14 + i * 26, 32));
["squire", "mage", "guildmaster"].forEach((id, i) => { const f = FOES[id], s = hero(id, f.look, f.boss); draw(x, s, 20 + i * 30, 66); weapon(x, f.look.wpn, 20 + i * 30 + s.hand[0], 66 + s.hand[1], -2.0, f.boss ? 1.4 : 1); });
const big = document.createElement("canvas"); big.width = 1280; big.height = 560; const b = big.getContext("2d"); b.imageSmoothingEnabled = false; b.drawImage(c, 0, 0, 1280, 560);
document.body.replaceChildren(big);

// Immediate-mode pixel UI: panels, buttons, the resource bar, the tab bar, toasts and modals.
import { G, W, H, lo, text, measure, tapped, holding, input, inputLive } from "./engine.js";
import { drawIcon } from "./sprites.js";
import { sfx } from "./audio.js";
import { S } from "./state.js";

export const C = {
  ink: "#140e1c", wood: "#6a4024", woodD: "#3e2414", woodL: "#a86a3a",
  cream: "#fff1d6", creamD: "#e8cfa4", paper: "#fbe6bf",
  text: "#4a2a14", sub: "#8a6040",
  yellow: "#ffcc4a", yellowD: "#c88a1a", yellowL: "#fff0a0",
  green: "#6ad06a", greenD: "#2e8a3e", greenL: "#c0f4a0",
  red: "#ff6a5a", redD: "#b02a2a", redL: "#ffc0b0",
  blue: "#5ab0f4", blueD: "#2a5aa0", blueL: "#c8ecff",
  purple: "#b07cf0", purpleD: "#5a2a9a", purpleL: "#e8d4ff",
  gray: "#a8a0b4", grayD: "#5a5068", grayL: "#e0dce8",
  night: "#241a34", nightL: "#3a2c52",
};
const BTN = {
  yellow: [C.yellow, C.yellowD, C.yellowL, C.text],
  green: [C.green, C.greenD, C.greenL, "#143a1c"],
  red: [C.red, C.redD, C.redL, "#3a0a0a"],
  blue: [C.blue, C.blueD, C.blueL, "#0a1a3a"],
  purple: [C.purple, C.purpleD, C.purpleL, "#1a0a30"],
  gray: [C.gray, C.grayD, C.grayL, "#1a1420"],
  cream: [C.cream, C.creamD, "#ffffff", C.text],
};

export function rect(x, y, w, h, col) {
  const c = lo();
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
/** A bordered box with rounded pixel corners. */
export function box(x, y, w, h, fill, border = C.ink, hi = null, sh = null) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  rect(x + 1, y, w - 2, h, border);
  rect(x, y + 1, w, h - 2, border);
  rect(x + 1, y + 1, w - 2, h - 2, fill);
  if (hi) rect(x + 2, y + 1, w - 4, 1, hi);
  if (sh) rect(x + 2, y + h - 2, w - 4, 1, sh);
}
/** A wooden framed paper panel. */
export function panel(x, y, w, h, opts = {}) {
  box(x, y, w, h, opts.dark ? C.night : C.wood, C.ink, opts.dark ? C.nightL : C.woodL, C.woodD);
  if (!opts.dark) box(x + 3, y + 3, w - 6, h - 6, C.cream, C.woodD, "#ffffff", C.creamD);
  else box(x + 3, y + 3, w - 6, h - 6, "#1a1228", "#0e0a16", C.nightL);
  if (opts.title) {
    const tw = measure(opts.title, 8, true) + 16, tx = Math.round(x + w / 2 - tw / 2);
    box(tx, y - 6, tw, 13, C.yellow, C.ink, C.yellowL, C.yellowD);
    text(opts.title, x + w / 2, y - 4, { size: 8, align: "center", color: C.text, outline: false, bold: true });
  }
}

/** A button: returns true when tapped. */
export function button(x, y, w, h, label, o = {}) {
  const [f, d, l, tc] = BTN[o.color ?? "yellow"];
  const dis = !!o.disabled;
  const down = !dis && holding(x, y, w, h);
  const yy = y + (down ? 1 : 0);
  box(x, yy, w, h - (down ? 1 : 0), dis ? "#c8c0b8" : f, C.ink, dis ? "#e0dad4" : l, dis ? "#a09890" : d);
  if (!down) rect(x + 1, y + h - 1, w - 2, 1, C.ink);
  let tx = x + w / 2;
  const size = o.size ?? 8;
  if (o.icon) {
    const lw = label ? measure(label, size, o.bold) : 0, iw = 7, gap = label ? 2 : 0, total = iw + gap + lw;
    drawIcon(lo(), o.icon, Math.round(x + w / 2 - total / 2), Math.round(yy + h / 2 - 4));
    tx = x + w / 2 - total / 2 + iw + gap + lw / 2;
  }
  if (label) text(label, tx, yy + h / 2 - (down ? 0.5 : 1), { size, align: "center", base: "middle", color: dis ? "#7a7068" : tc, outline: false, bold: o.bold });
  if (o.badge) {
    rect(x + w - 5, y - 2, 6, 6, C.ink);
    rect(x + w - 4, y - 1, 4, 4, C.red);
  }
  if (!dis && tapped(x, y, w, h)) {
    sfx(o.sound ?? "click");
    return true;
  }
  if (dis && tapped(x, y, w, h)) sfx("error");
  return false;
}
/** an invisible hit area */
export const hit = (x, y, w, h) => tapped(x, y, w, h);

// ---------- top bar ----------
const shown = { coins: 0, feathers: 0 };
export function resourceBar(extra) {
  shown.coins += (S.coins - shown.coins) * Math.min(1, G.dt * 10);
  shown.feathers += (S.feathers - shown.feathers) * Math.min(1, G.dt * 10);
  if (Math.abs(S.coins - shown.coins) < 1) shown.coins = S.coins;
  if (Math.abs(S.feathers - shown.feathers) < 1) shown.feathers = S.feathers;
  const pill = (x, ic, v, col) => {
    box(x, 2, 58, 12, "#2a1e3a", C.ink, "#4a3a5e");
    drawIcon(lo(), ic, x + 2, 4);
    text(Math.round(v).toLocaleString(), x + 54, 4, { size: 7, align: "right", color: col });
  };
  pill(W - 124, "coin", shown.coins, "#ffe070");
  pill(W - 62, "feather", shown.feathers, "#e8f0ff");
  if (extra) extra();
}
export function pulse(which) { shown[which] = shown[which] * 0.98; }

// ---------- tab bar ----------
export const TABS = [
  ["farm", "양계장"], ["map", "원정"], ["fountain", "분수"], ["nest", "둥지"], ["breed", "교배"], ["dex", "도감"],
];
export function tabBar(current, go, badges = {}) {
  const y = H - 17, tw = W / TABS.length;
  rect(0, y, W, 17, C.ink);
  rect(0, y + 1, W, 16, C.woodD);
  TABS.forEach(([id, name], i) => {
    const x = Math.round(i * tw), on = id === current;
    if (on) box(x + 1, y + 1, Math.round(tw) - 2, 16, C.yellow, C.ink, C.yellowL, C.yellowD);
    else if (holding(x, y, tw, 17)) rect(x + 1, y + 2, Math.round(tw) - 2, 14, C.wood);
    text(name, x + tw / 2, y + 9, { size: 8, align: "center", base: "middle", color: on ? C.text : C.cream, outline: on ? false : C.ink, bold: on });
    if (badges[id]) { rect(x + tw - 9, y + 2, 6, 6, C.ink); rect(x + tw - 8, y + 3, 4, 4, C.red); }
    if (!on && tapped(x, y, tw, 17)) { sfx("click"); go(id); }
  });
}

// ---------- toasts ----------
const toasts = [];
export function toast(msg, color = "#fff8ec") {
  toasts.push({ msg, color, t: 0 });
  if (toasts.length > 3) toasts.shift();
}
export function drawToasts() {
  for (let i = toasts.length - 1; i >= 0; i--) {
    const t = toasts[i];
    t.t += G.dt;
    if (t.t > 2.2) { toasts.splice(i, 1); continue; }
  }
  toasts.forEach((t, i) => {
    const a = Math.min(1, t.t * 6, (2.2 - t.t) * 3), y = 30 + i * 14 - Math.min(1, t.t * 6) * 4;
    const w = measure(t.msg, 8) + 14;
    lo().globalAlpha = a;
    box(W / 2 - w / 2, y, w, 13, "#2a1e3a", C.ink, "#4a3a5e");
    lo().globalAlpha = 1;
    text(t.msg, W / 2, y + 2.5, { size: 8, align: "center", color: t.color, alpha: a });
  });
}

// ---------- modal ----------
/** Open a modal: an object with draw() called in the overlay pass every frame; close() removes it. */
export function openModal(m) {
  G.modal = m;
  m.t = 0;
  input.consumed = true;
}
export function closeModal() { G.modal = null; }
export function dim(a = 0.55) {
  const c = lo();
  c.fillStyle = `rgba(10,6,18,${a})`;
  c.fillRect(0, 0, W, H);
}
/** A simple yes/no dialog. */
export function confirm(title, lines, yes, onYes, { no = "취소", color = "green" } = {}) {
  openModal({
    draw() {
      dim();
      const w = 190, h = 54 + lines.length * 11, x = W / 2 - w / 2, y = H / 2 - h / 2;
      panel(x, y, w, h, { title });
      lines.forEach((l, i) => text(l, W / 2, y + 14 + i * 11, { size: 8, align: "center", color: C.text, outline: false }));
      if (button(x + 18, y + h - 24, 70, 16, no, { color: "gray", sound: "back" })) closeModal();
      if (button(x + w - 88, y + h - 24, 70, 16, yes, { color })) { closeModal(); onYes(); }
    },
  });
}

/** Scroll state for a vertical list area. */
export function scroller(st, x, y, w, h, contentH) {
  const max = Math.max(0, contentH - h);
  if (input.down && inputLive() && input.sx >= x && input.sx < x + w && input.sy >= y && input.sy < y + h && input.moved > 4) {
    st.v = -input.dy / Math.max(G.dt, 1 / 120);
    st.y -= input.dy;
  } else {
    st.y -= st.v * G.dt;
    st.v *= Math.pow(0.02, G.dt);
  }
  if (input.wheel && input.x >= x && input.x < x + w && input.y >= y && input.y < y + h) st.y += input.wheel * 0.25;
  if (st.y < 0) { st.y += (0 - st.y) * Math.min(1, G.dt * 14); st.v = 0; }
  if (st.y > max) { st.y += (max - st.y) * Math.min(1, G.dt * 14); st.v = 0; }
  return max;
}

/** star row */
export function stars(x, y, n, max = 5) {
  for (let i = 0; i < max; i++) {
    const on = i < n, c = lo();
    c.fillStyle = on ? "#ffd84a" : "#5a5068";
    const X = Math.round(x + i * 6), Y = Math.round(y);
    c.fillRect(X + 2, Y, 1, 1); c.fillRect(X + 1, Y + 1, 3, 1); c.fillRect(X, Y + 2, 5, 1); c.fillRect(X + 1, Y + 3, 1, 1); c.fillRect(X + 3, Y + 3, 1, 1);
  }
}
/** a horizontal bar */
export function bar(x, y, w, h, k, col, back = "#2a1e3a") {
  rect(x, y, w, h, C.ink);
  rect(x + 1, y + 1, w - 2, h - 2, back);
  const fw = Math.round((w - 2) * Math.max(0, Math.min(1, k)));
  if (fw > 0) { rect(x + 1, y + 1, fw, h - 2, col); rect(x + 1, y + 1, fw, 1, "rgba(255,255,255,0.35)"); }
}
export function rarityTag(x, y, r, RAR) {
  const R = RAR[r], w = measure(R.name, 6) + 6;
  box(x, y, w, 9, R.dark, C.ink);
  text(R.name, x + w / 2, y + 1.5, { size: 6, align: "center", color: R.color });
  return w;
}

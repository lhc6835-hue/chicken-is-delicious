import { fit, cycle, TAU, WHITE, clamp } from "../../core/index.js";

// A small magic projectile in flight (it faces right; the game moves it): a hot core in a colored shell,
// a wobbling comet tail and sparks shed behind it.
export const meta = {
  name: "Bolt",
  desc: "A little magic bolt in flight: hot core, colored shell, wobbling comet tail, shed sparks.",
  tags: ["chicken", "combat", "projectile", "magic", "small", "directional", "loop"],
  size: [48, 24],
  origin: [36, 12],
  duration: 0.5,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#1c0a30", "#3a1462", "#5e22a0", "#8c3ad8", "#b56cf4", "#e0b4ff", "#ffffff"],
    size: 2.5,
    seed: 6,
  },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7), ph = t / meta.duration, s = o.size;
  // the tail: a tapering line of the ramp, wobbling up and down
  for (let d = 1; d < 20; d += 0.5) {
    const u = d / 20, y = Math.sin(ph * TAU * 2 - d * 0.5) * u * 1.6;
    const w = s * (1 - u) * 0.9;
    p.dot(-d, y, u < 0.3 ? C[5] : u < 0.6 ? C[4] : C[3], clamp(1.2 - u));
    if (w > 0.8) { p.dot(-d, y - 1, C[3], 1 - u); p.dot(-d, y + 1, C[2], 1 - u); }
  }
  cycle(t, meta.duration, 6, o.seed, 0.3, (age, life, r) => {
    const u = age / life;
    p.dot(-4 - u * 16, r.range(-3, 3) + u * r.range(-3, 3), u < 0.4 ? C[5] : C[4], 1 - u);
  });
  const pulse = 1 + Math.sin(ph * TAU * 2) * 0.3;
  p.circle(0, 0, s + 1, C[3]);
  p.circle(0, 0, s * pulse, C[5]);
  p.circle(0.3, -0.3, Math.max(0.8, s * 0.5), WHITE);
  p.glow(0, 0, 9 + s * 2, C[4], 0.55);
}

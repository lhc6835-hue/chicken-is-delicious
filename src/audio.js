// Tiny WebAudio synth: chiptune sound effects and two looping tunes, all generated, no files.
let ac = null, master = null, musicGain = null, sfxGain = null, noiseBuf = null;
let muted = false;

export function unlock() {
  if (ac) { if (ac.state === "suspended") ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
  } catch { return; }
  master = ac.createGain();
  master.gain.value = muted ? 0 : 0.6;
  master.connect(ac.destination);
  sfxGain = ac.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
  musicGain = ac.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  if (pendingTune) playTune(pendingTune);
}
export function setMuted(m) {
  muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.6, ac.currentTime, 0.05);
}
export const isMuted = () => muted;

function tone(freq, dur, { type = "square", vol = 0.3, slide = 0, delay = 0, attack = 0.005, out = sfxGain } = {}) {
  if (!ac) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, { vol = 0.3, freq = 2000, q = 1, type = "bandpass", delay = 0, sweep = 0 } = {}) {
  if (!ac) return;
  const t = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf;
  f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxGain);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
const SCALES = [[72, 76, 79], [74, 78, 81, 86], [72, 76, 79, 83, 88], [71, 75, 78, 83, 87, 90], [72, 76, 79, 84, 88, 91, 96]];

export function sfx(name, arg) {
  if (!ac || muted) return;
  switch (name) {
    case "click": tone(880, 0.05, { vol: 0.12 }); break;
    case "back": tone(520, 0.06, { vol: 0.12, slide: 0.7 }); break;
    case "coin": tone(N(88), 0.06, { vol: 0.12 }); tone(N(95), 0.14, { vol: 0.12, delay: 0.05 }); break;
    case "peck": noise(0.05, { vol: 0.25, freq: 3000, q: 2 }); tone(300, 0.05, { vol: 0.1, slide: 0.5, type: "triangle" }); break;
    case "hit": noise(0.08, { vol: 0.3, freq: 1200, q: 1 }); tone(160, 0.08, { vol: 0.15, slide: 0.5 }); break;
    case "crit": noise(0.12, { vol: 0.35, freq: 2500, q: 0.8 }); tone(900, 0.12, { vol: 0.15, slide: 0.4 }); break;
    case "slash": noise(0.09, { vol: 0.2, freq: 5000, q: 3, sweep: 0.3 }); break;
    case "shoot": tone(700, 0.08, { vol: 0.08, slide: 1.6, type: "triangle" }); break;
    case "arrow": noise(0.1, { vol: 0.12, freq: 6000, q: 4, sweep: 0.5 }); break;
    case "magic": tone(N(84), 0.15, { vol: 0.08, slide: 1.5, type: "sine" }); tone(N(91), 0.15, { vol: 0.06, delay: 0.04, type: "sine" }); break;
    case "zap": noise(0.2, { vol: 0.3, freq: 4000, q: 1, sweep: 0.2 }); tone(1200, 0.15, { vol: 0.08, slide: 0.2, type: "sawtooth" }); break;
    case "boom": noise(0.45, { vol: 0.5, freq: 600, q: 0.7, type: "lowpass", sweep: 0.15 }); tone(90, 0.4, { vol: 0.3, slide: 0.4, type: "triangle" }); break;
    case "heal": [79, 84, 88].forEach((n, i) => tone(N(n), 0.18, { vol: 0.08, delay: i * 0.06, type: "sine" })); break;
    case "poof": noise(0.25, { vol: 0.22, freq: 900, q: 0.6, sweep: 0.4 }); tone(600, 0.2, { vol: 0.08, slide: 0.5, type: "triangle" }); break;
    case "ko": tone(400, 0.25, { vol: 0.12, slide: 0.4, type: "triangle" }); noise(0.2, { vol: 0.15, freq: 700 }); break;
    case "cluck": tone(620, 0.05, { vol: 0.1, slide: 1.4, type: "square" }); tone(820, 0.07, { vol: 0.08, delay: 0.06, slide: 0.8 }); break;
    case "crow": [0, 0.12, 0.26].forEach((d, i) => tone([520, 700, 980][i], i === 2 ? 0.35 : 0.1, { vol: 0.12, delay: d, slide: i === 2 ? 0.8 : 1.2, type: "sawtooth" })); break;
    case "toss": tone(500, 0.3, { vol: 0.08, slide: 2.5, type: "triangle" }); break;
    case "splash": noise(0.35, { vol: 0.3, freq: 1500, q: 0.5, sweep: 0.3 }); break;
    case "rumble": noise(1.2, { vol: 0.35, freq: 140, q: 0.7, type: "lowpass" }); break;
    case "gush": noise(1.4, { vol: 0.35, freq: 400, q: 0.5, sweep: 6 }); tone(N(60), 1.2, { vol: 0.1, slide: 2, type: "sawtooth", attack: 0.4 }); break;
    case "tier": { // the eyes light up a step higher
      const r = arg ?? 0, sc = SCALES[r];
      sc.forEach((n, i) => tone(N(n), 0.3, { vol: 0.1, delay: i * 0.05, type: "triangle" }));
      break;
    }
    case "crack": { const k = arg ?? 1; noise(0.08, { vol: 0.35, freq: 3500 - k * 300, q: 2 }); tone(N(76 + k * 4), 0.12, { vol: 0.1, type: "triangle" }); break; }
    case "reveal": { const r = arg ?? 0; SCALES[r].forEach((n, i) => tone(N(n), 0.5 + r * 0.1, { vol: 0.1, delay: i * 0.07, type: i % 2 ? "triangle" : "square" })); noise(0.4, { vol: 0.2, freq: 5000, q: 0.5 }); break; }
    case "legend":
      [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => { tone(N(n), 2.2, { vol: 0.07, delay: i * 0.09, type: "sawtooth", attack: 0.2 }); tone(N(n + 12), 1.8, { vol: 0.04, delay: i * 0.09 + 0.02, type: "sine" }); });
      noise(1.6, { vol: 0.3, freq: 300, q: 0.4, sweep: 12 });
      break;
    case "skycrack": noise(0.7, { vol: 0.5, freq: 3000, q: 0.6, sweep: 0.1 }); tone(N(48), 1.5, { vol: 0.2, type: "sawtooth", slide: 0.5 }); break;
    case "hatch": [72, 79, 84, 88].forEach((n, i) => tone(N(n), 0.25, { vol: 0.1, delay: i * 0.08 })); break;
    case "level": [72, 76, 79, 84].forEach((n, i) => tone(N(n), 0.12, { vol: 0.1, delay: i * 0.05 })); break;
    case "wave": [67, 72].forEach((n, i) => tone(N(n), 0.2, { vol: 0.12, delay: i * 0.12 })); break;
    case "win": [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => tone(N(n), 0.22, { vol: 0.11, delay: i * 0.1 })); break;
    case "lose": [67, 63, 60, 55].forEach((n, i) => tone(N(n), 0.35, { vol: 0.11, delay: i * 0.18, type: "triangle" })); break;
    case "heart": [84, 88].forEach((n, i) => tone(N(n), 0.12, { vol: 0.08, delay: i * 0.08, type: "sine" })); break;
    case "error": tone(200, 0.15, { vol: 0.12, type: "square" }); break;
  }
}

// ---------- music: two small loops ----------
const TUNES = {
  farm: { bpm: 104, lead: [76, 0, 79, 0, 81, 79, 76, 0, 74, 0, 76, 79, 76, 0, 72, 0, 76, 0, 79, 0, 84, 83, 81, 0, 79, 0, 76, 74, 72, 0, 0, 0], bass: [48, 55, 52, 55, 45, 52, 48, 52, 41, 48, 45, 48, 43, 50, 47, 50] },
  battle: { bpm: 140, lead: [72, 72, 79, 0, 77, 76, 74, 0, 72, 74, 76, 0, 79, 0, 76, 0, 77, 77, 81, 0, 79, 77, 76, 0, 74, 76, 77, 79, 76, 0, 72, 0], bass: [36, 43, 36, 43, 41, 48, 41, 48, 43, 50, 43, 50, 36, 43, 40, 43] },
  fountain: { bpm: 76, lead: [84, 0, 88, 0, 91, 0, 88, 0, 86, 0, 89, 0, 93, 0, 89, 0, 84, 0, 88, 0, 91, 0, 96, 0, 95, 0, 91, 0, 88, 0, 0, 0], bass: [48, 0, 55, 0, 50, 0, 57, 0, 48, 0, 55, 0, 53, 0, 55, 0] },
};
let pendingTune = null, current = null, timer = null, step = 0, nextT = 0;
export function playTune(name) {
  pendingTune = name;
  if (!ac || current === name) return;
  current = name;
  step = 0;
  nextT = ac.currentTime + 0.05;
  clearInterval(timer);
  const T = TUNES[name];
  if (!T) return;
  const sd = 60 / T.bpm / 2;
  timer = setInterval(() => {
    while (nextT < ac.currentTime + 0.2) {
      const l = T.lead[step % T.lead.length];
      if (l) tone(N(l), sd * 0.9, { vol: 0.22, type: "square", out: musicGain, delay: nextT - ac.currentTime });
      if (step % 2 === 0) {
        const b = T.bass[(step / 2) % T.bass.length];
        if (b) tone(N(b), sd * 1.8, { vol: 0.35, type: "triangle", out: musicGain, delay: nextT - ac.currentTime });
      }
      nextT += sd;
      step++;
    }
  }, 50);
}

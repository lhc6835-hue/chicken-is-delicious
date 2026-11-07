// Sound: Kenney CC0 effects (embedded by the build so they work from file://) and Juhani Junkala's CC0
// chiptunes. Everything runs through Web Audio buses so the mix can react to the game:
//
//   sfx -> sfxFilter (lowpass) -> limiter -> master
//   bgm -> bgmGain -> duck -> bgmFilter (lowpass) -> master
//
// which gives tape-stop on death, muffling (pause, dying), sidechain-style ducking on big hits and
// jingles, and a wind loop for gliding and speed. When the music can't be fetched (file://) it
// falls back to a plain <audio> element and those BGM effects are skipped.
import { SFX } from "./sfxdata.js";

let ac = null, master = null, sfxGain = null, sfxFilter = null;
let bgmGain = null, bgmDuck = null, bgmFilter = null;
const buffers = {};
const bgmBuffers = {};
let sfxVol = 0.8, bgmVol = 0.5, muted = false;
let bgmName = "", bgmSrc = null, bgmEl = null, bgmRate = 1, bgmToken = 0;
let jet = null, wind = null;

const now = () => ac.currentTime;
const ramp = (param, v, t, kind = "lin") => {
  param.cancelScheduledValues(now());
  param.setValueAtTime(param.value, now());
  if (kind === "exp") param.exponentialRampToValueAtTime(Math.max(0.0001, v), now() + t);
  else param.linearRampToValueAtTime(v, now() + t);
};

export function initAudio() {
  if (ac) { if (ac.state === "suspended") ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.connect(ac.destination);
  // a gentle limiter keeps stacked hits punchy instead of clipping
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -10; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.12;
  sfxGain = ac.createGain(); sfxGain.gain.value = sfxVol;
  sfxFilter = ac.createBiquadFilter(); sfxFilter.type = "lowpass"; sfxFilter.frequency.value = 20000; sfxFilter.Q.value = 0.7;
  sfxGain.connect(sfxFilter); sfxFilter.connect(comp); comp.connect(master);
  bgmGain = ac.createGain(); bgmGain.gain.value = muted ? 0 : bgmVol;
  bgmDuck = ac.createGain(); bgmDuck.gain.value = 1;
  bgmFilter = ac.createBiquadFilter(); bgmFilter.type = "lowpass"; bgmFilter.frequency.value = 20000; bgmFilter.Q.value = 1;
  bgmGain.connect(bgmDuck); bgmDuck.connect(bgmFilter); bgmFilter.connect(master);
  for (const [name, uri] of Object.entries(SFX)) {
    fetch(uri).then((r) => r.arrayBuffer()).then((b) => ac.decodeAudioData(b)).then((buf) => { buffers[name] = buf; }).catch(() => {});
  }
  // whatever was asked for before the first click moves onto the Web Audio path
  if (bgmName) { const n = bgmName; bgmName = ""; playBgm(n); }
}

/** Plays a sound. o: { vol, rate, vary (random pitch spread), delay, dry (skip the lowpass) } */
export function sfx(name, o = {}) {
  if (!ac || muted) return;
  const buf = buffers[name];
  if (!buf) return;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const vary = o.vary ?? 0.06;
  src.playbackRate.value = (o.rate ?? 1) * (1 + (Math.random() * 2 - 1) * vary);
  const g = ac.createGain();
  g.gain.value = o.vol ?? 1;
  src.connect(g); g.connect(sfxGain);
  // mp3 encoders pad the start; skip it so hits land on the frame
  src.start(now() + (o.delay || 0), 0.024);
  if (name.startsWith("j_")) duck(0.35, 0.05, (buf.duration / src.playbackRate.value) + 0.2);
}

// semitone ladder for coin combos: climbing a major scale is what makes chains feel good
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
export function coinSound(combo, fast) {
  const step = SCALE[Math.min(combo, SCALE.length - 1)];
  const rate = Math.pow(2, step / 12) * 0.9 * (fast ? 1.12 : 1);
  sfx("coin", { rate, vary: 0, vol: 0.7 });
  sfx("coin2", { rate: rate * 0.5, vary: 0, vol: 0.35 });
}

function noiseBuffer(sec, smooth) {
  const len = Math.floor(ac.sampleRate * sec);
  const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { last = last * smooth + (Math.random() * 2 - 1) * (1 - smooth); d[i] = last; }
  return buf;
}
function noiseLoop(type, freq, smooth) {
  const src = ac.createBufferSource(); src.buffer = noiseBuffer(2, smooth); src.loop = true;
  const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 0.7;
  const g = ac.createGain(); g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(sfxGain); src.start();
  return { src, f, g };
}

/** A looping jet hiss; thrust 0..1 sets its loudness and brightness. */
export function jetLoop(on, thrust = 0) {
  if (!ac) return;
  if (on && !jet) jet = noiseLoop("bandpass", 600, 0.6);
  if (!on && jet) {
    jet.g.gain.setTargetAtTime(0, now(), 0.05);
    const j = jet; jet = null;
    setTimeout(() => { try { j.src.stop(); } catch (e) { /* already stopped */ } }, 300);
    return;
  }
  if (jet) {
    jet.g.gain.setTargetAtTime(muted ? 0 : 0.12 + thrust * 0.35, now(), 0.04);
    jet.f.frequency.setTargetAtTime(500 + thrust * 1400, now(), 0.05);
  }
}

/** Air rushing past: level 0..1 (gliding is soft and low, speed mode loud and bright). */
export function windLoop(level, bright = 0) {
  if (!ac) return;
  if (!wind) wind = noiseLoop("highpass", 800, 0.3);
  wind.g.gain.setTargetAtTime(muted ? 0 : level * 0.22, now(), 0.12);
  wind.f.frequency.setTargetAtTime(500 + bright * 1800, now(), 0.2);
}

// ------------------------------------------------------------------ music
function loadBgm(name) {
  if (bgmBuffers[name]) return Promise.resolve(bgmBuffers[name]);
  return fetch(`assets/audio/bgm/${name}.mp3`).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then((b) => ac.decodeAudioData(b)).then((buf) => {
      // keep at most two decoded tracks around; they're big
      const keys = Object.keys(bgmBuffers);
      if (keys.length >= 2) delete bgmBuffers[keys[0]];
      bgmBuffers[name] = buf;
      return buf;
    });
}

export function playBgm(name) {
  if (bgmName === name) {
    if (bgmEl && bgmEl.paused && !muted) bgmEl.play().catch(() => {});
    return;
  }
  stopBgm(0.35);
  bgmName = name;
  bgmRate = 1;
  const token = ++bgmToken;
  if (!ac) { startElement(name); return; }
  ramp(bgmFilter.frequency, 20000, 0.05);
  loadBgm(name).then((buf) => {
    if (token !== bgmToken) return;
    const src = ac.createBufferSource();
    src.buffer = buf; src.loop = true;
    const fade = ac.createGain(); fade.gain.value = 0;
    src.connect(fade); fade.connect(bgmGain);
    src.start();
    ramp(fade.gain, 1, 0.4);
    bgmSrc = { src, fade };
  }).catch(() => { if (token === bgmToken) startElement(name); });
}
function startElement(name) {
  bgmEl = new Audio(`assets/audio/bgm/${name}.mp3`);
  bgmEl.loop = true;
  bgmEl.volume = muted ? 0 : bgmVol;
  bgmEl.play().catch(() => {});
}
export function stopBgm(fade = 0) {
  if (bgmEl) { bgmEl.pause(); bgmEl = null; }
  if (bgmSrc) {
    const s = bgmSrc; bgmSrc = null;
    if (fade && ac) { ramp(s.fade.gain, 0, fade); setTimeout(() => { try { s.src.stop(); } catch (e) { /* stopped */ } }, fade * 1000 + 50); }
    else try { s.src.stop(); } catch (e) { /* stopped */ }
  }
  bgmName = "";
}

/** Speeds the music up or down; t smooths it. */
export function setBgmRate(r, t = 0.3) {
  bgmRate = r;
  if (bgmEl) bgmEl.playbackRate = r;
  if (bgmSrc && ac) ramp(bgmSrc.src.playbackRate, r, t);
}
/** The tape stops: pitch and speed sag and fade out (death). */
export function tapeStop(t = 1.1) {
  if (bgmEl) { bgmEl.volume = muted ? 0 : bgmVol * 0.3; return; }
  if (!bgmSrc || !ac) return;
  const p = bgmSrc.src.playbackRate;
  p.cancelScheduledValues(now()); p.setValueAtTime(p.value, now());
  p.exponentialRampToValueAtTime(0.25, now() + t);
  ramp(bgmSrc.fade.gain, 0, t * 1.1);
}
/** Lowpass the music (and optionally the effects): hz 20000 = open. */
export function muffle(hz, t = 0.3, alsoSfx = false) {
  if (bgmEl) bgmEl.volume = muted ? 0 : bgmVol * (hz < 5000 ? 0.35 : 1);
  if (!ac) return;
  ramp(bgmFilter.frequency, hz, t, "exp");
  if (alsoSfx) ramp(sfxFilter.frequency, hz, t, "exp");
  else if (sfxFilter.frequency.value < 19000) ramp(sfxFilter.frequency, 20000, t, "exp");
}
/** Sidechain-style dip in the music: down to k, held, then back. */
export function duck(k = 0.4, attack = 0.03, hold = 0.2, release = 0.35) {
  if (!ac) return;
  const g = bgmDuck.gain;
  g.cancelScheduledValues(now()); g.setValueAtTime(g.value, now());
  g.linearRampToValueAtTime(k, now() + attack);
  g.setValueAtTime(k, now() + attack + hold);
  g.linearRampToValueAtTime(1, now() + attack + hold + release);
}
/** Back to a clean mix (new screen, revive). */
export function resetMix() {
  if (!ac) return;
  ramp(bgmFilter.frequency, 20000, 0.2, "exp");
  ramp(sfxFilter.frequency, 20000, 0.2, "exp");
  ramp(bgmDuck.gain, 1, 0.2);
  if (bgmSrc) { ramp(bgmSrc.fade.gain, 1, 0.3); ramp(bgmSrc.src.playbackRate, bgmRate, 0.3); }
  windLoop(0);
}

export function duckBgm(k) {
  if (bgmEl) bgmEl.volume = muted ? 0 : bgmVol * k;
  if (bgmGain) ramp(bgmGain.gain, muted ? 0 : bgmVol * k, 0.2);
}

export function setVolumes(s, b) {
  sfxVol = s; bgmVol = b;
  if (sfxGain) sfxGain.gain.value = s;
  if (bgmGain) bgmGain.gain.value = muted ? 0 : b;
  if (bgmEl) bgmEl.volume = muted ? 0 : b;
}
export function setMuted(m) {
  muted = m;
  if (bgmEl) bgmEl.volume = m ? 0 : bgmVol;
  if (bgmGain) bgmGain.gain.value = m ? 0 : bgmVol;
  if (m) { jetLoop(false); windLoop(0); }
}
export function isMuted() { return muted; }

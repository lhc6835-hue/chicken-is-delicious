// Sound: Kenney CC0 effects (embedded by the build so they work from file://) through Web Audio, with
// pitch and volume variation, plus Juhani Junkala's CC0 chiptunes streamed as background music.
import { SFX } from "./sfxdata.js";

let ac = null, master = null, sfxGain = null;
const buffers = {};
let sfxVol = 0.8, bgmVol = 0.5, muted = false;
let bgm = null, bgmName = "";
let jet = null;

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
  sfxGain.connect(comp); comp.connect(master);
  for (const [name, uri] of Object.entries(SFX)) {
    fetch(uri).then((r) => r.arrayBuffer()).then((b) => ac.decodeAudioData(b)).then((buf) => { buffers[name] = buf; }).catch(() => {});
  }
}

/** Plays a sound. o: { vol, rate, vary (random pitch spread), delay } */
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
  src.start(ac.currentTime + (o.delay || 0), 0.024);
}

// semitone ladder for coin combos: climbing a major scale is what makes chains feel good
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
export function coinSound(combo) {
  const step = SCALE[Math.min(combo, SCALE.length - 1)];
  const rate = Math.pow(2, step / 12) * 0.9;
  sfx("coin", { rate, vary: 0, vol: 0.7 });
  sfx("coin2", { rate: rate * 0.5, vary: 0, vol: 0.35 });
}

/** A looping jet hiss made from noise; thrust 0..1 sets its loudness and brightness. */
export function jetLoop(on, thrust = 0) {
  if (!ac) return;
  if (on && !jet) {
    const len = ac.sampleRate * 1;
    const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = last * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = last; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 600; f.Q.value = 0.7;
    const g = ac.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(sfxGain); src.start();
    jet = { src, f, g };
  }
  if (!on && jet) {
    jet.g.gain.setTargetAtTime(0, ac.currentTime, 0.05);
    const j = jet; jet = null;
    setTimeout(() => { try { j.src.stop(); } catch (e) { /* already stopped */ } }, 300);
    return;
  }
  if (jet) {
    jet.g.gain.setTargetAtTime(muted ? 0 : 0.12 + thrust * 0.35, ac.currentTime, 0.04);
    jet.f.frequency.setTargetAtTime(500 + thrust * 1400, ac.currentTime, 0.05);
  }
}

export function playBgm(name) {
  if (bgmName === name && bgm) { if (bgm.paused && !muted) bgm.play().catch(() => {}); return; }
  stopBgm();
  bgmName = name;
  bgm = new Audio(`assets/audio/bgm/${name}.mp3`);
  bgm.loop = true;
  bgm.volume = muted ? 0 : bgmVol;
  bgm.play().catch(() => {});
}
export function stopBgm() { if (bgm) { bgm.pause(); bgm = null; bgmName = ""; } }
export function duckBgm(k) { if (bgm) bgm.volume = muted ? 0 : bgmVol * k; }
export function setBgmRate(r) { if (bgm) { bgm.playbackRate = r; } }

export function setVolumes(s, b) {
  sfxVol = s; bgmVol = b;
  if (sfxGain) sfxGain.gain.value = s;
  if (bgm) bgm.volume = muted ? 0 : b;
}
export function setMuted(m) { muted = m; if (bgm) bgm.volume = m ? 0 : bgmVol; if (m) jetLoop(false); }
export function isMuted() { return muted; }

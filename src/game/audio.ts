import catchSound from "@/assets/horror_scream.mp3.asset.json";

let ctx: AudioContext | null = null;
let droneGain: GainNode | null = null;
let master: GainNode | null = null;
let muted = false;
let volume = 0.8;
const captures = new Set<HTMLAudioElement>();
let droneSources: (OscillatorNode | AudioBufferSourceNode)[] = [];

export function setAudioMuted(value: boolean) {
  muted = value;
  if (ctx && master) master.gain.setTargetAtTime(value ? 0 : volume, ctx.currentTime, 0.04);
  captures.forEach(audio => { audio.muted = value; });
}

function output(c: AudioContext) {
  if (!master) { master = c.createGain(); master.gain.value = muted ? 0 : volume; master.connect(c.destination); }
  return master;
}

export function interactionSound() {
  const c = getCtx(); if (!c || muted) return;
  const osc = c.createOscillator(); const gain = c.createGain();
  osc.type = "sine"; osc.frequency.setValueAtTime(640, c.currentTime); osc.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.08);
  gain.gain.setValueAtTime(0.035, c.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.1);
  osc.connect(gain).connect(output(c)); osc.start(); osc.stop(c.currentTime + 0.12);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Low buzzing drone — the sound of the Backrooms / the wind / the rain. */
export function startDrone(kind: "backrooms" | "tundra" | "roubaix" | "intro") {
  const c = getCtx();
  if (!c) return;
  stopDrone();
  const gain = c.createGain();
  gain.gain.value = 0.0001;
  gain.connect(output(c));
  gain.gain.exponentialRampToValueAtTime(kind === "backrooms" ? 0.05 : 0.07, c.currentTime + 2);

  if (kind === "intro") {
    // Canal wind + electrical hum of the street lamps.
    const buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const wind = c.createBufferSource(); wind.buffer = buffer; wind.loop = true;
    const wf = c.createBiquadFilter(); wf.type = "lowpass"; wf.frequency.value = 380;
    wind.connect(wf).connect(gain); wind.start(); droneSources.push(wind);
    const hum = c.createOscillator(); hum.type = "square"; hum.frequency.value = 50;
    const hf = c.createBiquadFilter(); hf.type = "lowpass"; hf.frequency.value = 160;
    const hg = c.createGain(); hg.gain.value = 0.18;
    hum.connect(hf).connect(hg).connect(gain); hum.start(); droneSources.push(hum);
  } else if (kind === "roubaix") {
    // Quiet city ambience: no rain in sunny Roubaix.
    const hum = c.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 48;
    const humGain = c.createGain();
    humGain.gain.value = 0.35;
    hum.connect(humGain).connect(gain);
    hum.start(); droneSources.push(hum);
  } else if (kind === "backrooms") {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 58;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;
    osc.connect(filter).connect(gain);
    osc.start(); droneSources.push(osc);
  } else {
    const buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 520;
    filter.Q.value = 0.6;
    noise.connect(filter).connect(gain);
    noise.start(); droneSources.push(noise);
  }
  droneGain = gain;
}

export function gunshot() {
  const c = getCtx(); if (!c) return;
  const buffer = c.createBuffer(1, c.sampleRate * 0.16, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource(); noise.buffer = buffer;
  const gain = c.createGain(); gain.gain.setValueAtTime(0.3, c.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  noise.connect(gain).connect(output(c)); noise.start(); noise.stop(c.currentTime + 0.16);
  noise.onended = () => { noise.disconnect(); gain.disconnect(); };
}

export function stopDrone() {
  if (!ctx || !droneGain) return;
  const c = ctx; const gain = droneGain; const sources = droneSources;
  droneGain = null; droneSources = [];
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
  sources.forEach(source => { try { source.stop(c.currentTime + 0.5); } catch { /* Already stopped. */ } });
  window.setTimeout(() => { sources.forEach(source => source.disconnect()); gain.disconnect(); }, 600);
}

export function scream() {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(880, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(70, c.currentTime + 0.9);
  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.0);
  osc.connect(gain).connect(output(c));
  osc.start();
  osc.stop(c.currentTime + 1.05);
}

export function chime(up = true) {
  const c = getCtx();
  if (!c) return;
  [0, 0.12, 0.24].forEach((t, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = (up ? [392, 523, 659] : [330, 262, 196])[i] ?? 440;
    gain.gain.setValueAtTime(0.0001, c.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.14, c.currentTime + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + 0.4);
    osc.connect(gain).connect(output(c));
    osc.start(c.currentTime + t);
    osc.stop(c.currentTime + t + 0.45);
  });
}

/** A low heartbeat nearby; faster, dissonant pulses during pursuit. */
export function threatPulse(distance: number, chasing: boolean) {
  const c = getCtx();
  if (!c) return;
  const intensity = Math.max(0.015, (1 - distance / 22) * 0.13);
  for (const offset of [0, 0.13]) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t = c.currentTime + offset;
    osc.type = chasing ? "triangle" : "sine";
    osc.frequency.setValueAtTime(chasing ? 135 : 75, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.2);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(intensity, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(gain).connect(output(c));
    osc.start(t);
    osc.stop(t + 0.27);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
}

/** Cri d'horreur joué dès qu'un Rôdeur attrape le joueur. */
export function playCatchSound() {
  if (typeof window === "undefined") return;
  const audio = new Audio(catchSound.url);
  audio.volume = 1;
  audio.muted = muted;
  captures.add(audio);
  audio.onended = () => captures.delete(audio);
  void audio.play().catch(() => { captures.delete(audio); });
}

/** Master volume 0..1 (the mute toggle still silences everything). */
export function setAudioVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (ctx && master && !muted) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
  captures.forEach(a => { a.volume = volume; });
}

let music: { gain: GainNode; filter: BiquadFilterNode; nodes: AudioScheduledSourceNode[]; timer: number } | null = null;
const SCALES = { backrooms: [110, 116.5, 146.8, 164.8], tundra: [98, 130.8, 146.8, 196], roubaix: [130.8, 164.8, 196, 246.9], intro: [87.3, 110, 130.8, 174.6] } as const;
export type MusicKind = keyof typeof SCALES;

/** Adaptive mystery/industrial pad with sparse bell notes; tension opens the filter. */
export function startMusic(kind: MusicKind) {
  const c = getCtx(); if (!c) return;
  stopMusic();
  const gain = c.createGain(); gain.gain.value = 0.0001; gain.gain.exponentialRampToValueAtTime(0.045, c.currentTime + 3);
  const filter = c.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 420; filter.Q.value = 4;
  filter.connect(gain).connect(output(c));
  const scale = SCALES[kind];
  const nodes: AudioScheduledSourceNode[] = [];
  [scale[0], scale[2], (scale[0] ?? 110) * 1.003].forEach(f => { const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = (f ?? 110) / 2; o.connect(filter); o.start(); nodes.push(o); });
  const lfo = c.createOscillator(); const lfoGain = c.createGain(); lfo.frequency.value = 0.07; lfoGain.gain.value = 160; lfo.connect(lfoGain).connect(filter.frequency); lfo.start(); nodes.push(lfo);
  const bell = () => {
    if (!music) return;
    const f = (scale[Math.floor(Math.random() * scale.length)] ?? 220) * 4;
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.03, c.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 2.5);
    o.connect(g).connect(gain); o.start(); o.stop(c.currentTime + 2.6); o.onended = () => { o.disconnect(); g.disconnect(); };
    music.timer = window.setTimeout(bell, 2500 + Math.random() * 5000);
  };
  music = { gain, filter, nodes, timer: window.setTimeout(bell, 1500) };
}

export function setMusicTension(t: number) {
  if (!ctx || !music) return;
  music.filter.frequency.setTargetAtTime(420 + t * 1400, ctx.currentTime, 0.4);
  music.gain.gain.setTargetAtTime(0.045 + t * 0.03, ctx.currentTime, 0.4);
}

export function stopMusic() {
  if (!ctx || !music) return;
  const m = music; music = null; window.clearTimeout(m.timer);
  m.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
  const end = ctx.currentTime + 1.2;
  m.nodes.forEach(n => { try { n.stop(end); } catch { /* stopped */ } });
  window.setTimeout(() => { m.nodes.forEach(n => n.disconnect()); m.gain.disconnect(); }, 1400);
}

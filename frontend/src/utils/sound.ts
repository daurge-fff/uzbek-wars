/**
 * Tiny Web-Audio sound engine.
 *
 * No audio assets: every effect is synthesised from oscillators, so there is nothing to
 * download and the bundle stays small. The AudioContext is created lazily on the first
 * user interaction (browsers block audio before a gesture) and all calls are safe no-ops
 * when sound is disabled or Web Audio is unavailable.
 */

export type SoundName =
  | 'tap'
  | 'success'
  | 'error'
  | 'coin'
  | 'levelup'
  | 'battle';

let ctx: AudioContext | null = null;
let enabled = true;
let master: GainNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;

  if (!ctx) {
    const created: AudioContext = new Ctor();
    const gain = created.createGain();
    gain.gain.value = 0.18;
    gain.connect(created.destination);
    ctx = created;
    master = gain;
  }
  const audio = ctx;
  if (audio.state === 'suspended') {
    audio.resume().catch(() => {});
  }
  return audio;
}

interface Tone {
  freq: number;
  duration: number;
  type?: OscillatorType;
  delay?: number;
  gain?: number;
  sweepTo?: number;
}

const RECIPES: Record<SoundName, Tone[]> = {
  tap: [{ freq: 220, duration: 0.05, type: 'sine', gain: 0.5 }],
  success: [
    { freq: 523.25, duration: 0.1, type: 'triangle' },
    { freq: 659.25, duration: 0.1, type: 'triangle', delay: 0.09 },
    { freq: 783.99, duration: 0.18, type: 'triangle', delay: 0.18 },
  ],
  error: [
    { freq: 220, duration: 0.12, type: 'sawtooth', gain: 0.4 },
    { freq: 165, duration: 0.2, type: 'sawtooth', delay: 0.1, gain: 0.4 },
  ],
  coin: [
    { freq: 987.77, duration: 0.06, type: 'square', gain: 0.35 },
    { freq: 1318.51, duration: 0.12, type: 'square', gain: 0.35, delay: 0.06 },
  ],
  levelup: [
    { freq: 523.25, duration: 0.12, type: 'triangle' },
    { freq: 659.25, duration: 0.12, type: 'triangle', delay: 0.1 },
    { freq: 783.99, duration: 0.12, type: 'triangle', delay: 0.2 },
    { freq: 1046.5, duration: 0.3, type: 'triangle', delay: 0.3 },
  ],
  battle: [
    { freq: 180, duration: 0.09, type: 'square', gain: 0.4, sweepTo: 90 },
  ],
};

function playTone(audio: AudioContext, tone: Tone, startAt: number): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const t0 = startAt + (tone.delay || 0);
  const vol = tone.gain ?? 0.7;

  osc.type = tone.type || 'sine';
  osc.frequency.setValueAtTime(tone.freq, t0);
  if (tone.sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, tone.sweepTo), t0 + tone.duration);
  }

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.duration);

  osc.connect(gain);
  gain.connect(master!);

  osc.start(t0);
  osc.stop(t0 + tone.duration + 0.02);
}

/** Plays a named effect. Safe to call anywhere; does nothing when muted. */
export function playSound(name: SoundName): void {
  if (!enabled) return;
  const audio = getContext();
  if (!audio || !master) return;

  try {
    const now = audio.currentTime;
    RECIPES[name].forEach((tone) => playTone(audio, tone, now));
  } catch {
    // Audio must never break the game
  }
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  if (!value && ctx && ctx.state === 'running') {
    ctx.suspend().catch(() => {});
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

// ─── Ambient music ──────────────────────────────────────────────
// A very quiet, slowly evolving pad so the "music" toggle is real without shipping
// any audio files. Starts/stops on demand and fades in/out.

let musicNodes: { oscillators: OscillatorNode[]; bus: GainNode } | null = null;

const PAD_FREQUENCIES = [110, 146.83, 164.81, 220, 329.63]; // A2 · D3 · E3 · A3 · E4

export function startMusic(): void {
  const audio = getContext();
  if (!audio || !master || musicNodes) return;

  try {
    const bus = audio.createGain();
    bus.gain.setValueAtTime(0.0001, audio.currentTime);
    bus.gain.linearRampToValueAtTime(0.06, audio.currentTime + 3);
    bus.connect(master);

    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.6;
    filter.connect(bus);

    const oscillators: OscillatorNode[] = PAD_FREQUENCIES.map((freq, i) => {
      const osc = audio.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = i % 2 === 0 ? -4 : 5;
      osc.connect(filter);
      osc.start();
      return osc;
    });

    // Slow tremolo for a breathing feel
    const lfo = audio.createOscillator();
    const lfoGain = audio.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(bus.gain);
    lfo.start();
    oscillators.push(lfo);

    musicNodes = { oscillators, bus };
  } catch {
    // ignore
  }
}

export function stopMusic(): void {
  if (!musicNodes || !ctx) return;
  const { oscillators, bus } = musicNodes;
  musicNodes = null;
  try {
    const now = ctx.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), now);
    bus.gain.linearRampToValueAtTime(0.0001, now + 0.8);
    oscillators.forEach((osc) => osc.stop(now + 0.9));
  } catch {
    // ignore
  }
}

export function isMusicPlaying(): boolean {
  return musicNodes !== null;
}

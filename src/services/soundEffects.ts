/**
 * Synthesizes cinematic Stark Iron Man audio effects using the Web Audio API.
 * 100% client-side, zero latency, zero external network assets.
 */

let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
};

/**
 * Cinematic Iron Man Arc Reactor & Armor Boot-up Sound
 * Stage 1: Low frequency transformer hum ramp (60Hz -> 220Hz)
 * Stage 2: Harmonic repulsor coil charge (440Hz -> 1320Hz)
 * Stage 3: High-frequency resonant ignite chime (1046Hz + 1568Hz)
 */
export const playStarkStartupSound = (): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.connect(ctx.destination);

    // 1. Sub-Bass Arc Transformer Hum
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(55, now);
    subOsc.frequency.exponentialRampToValueAtTime(220, now + 1.8);

    // Lowpass filter for warm heavy rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);
    filter.frequency.exponentialRampToValueAtTime(650, now + 1.8);

    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.25, now + 0.6);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    subOsc.connect(filter);
    filter.connect(subGain);
    subGain.connect(masterGain);

    subOsc.start(now);
    subOsc.stop(now + 2.3);

    // 2. High-Frequency Harmonic Repulsor Coil Charge Sweep
    const chargeOsc = ctx.createOscillator();
    const chargeGain = ctx.createGain();
    chargeOsc.type = 'sine';
    chargeOsc.frequency.setValueAtTime(320, now + 0.5);
    chargeOsc.frequency.exponentialRampToValueAtTime(1480, now + 2.2);

    chargeGain.gain.setValueAtTime(0.001, now);
    chargeGain.gain.linearRampToValueAtTime(0.18, now + 1.5);
    chargeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    chargeOsc.connect(chargeGain);
    chargeGain.connect(masterGain);

    chargeOsc.start(now + 0.5);
    chargeOsc.stop(now + 2.4);

    // 3. Final Arc Reactor Ignition Chime (Chest Core Flare at 2.4s)
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(1046.5, now + 2.3); // High C
    chimeOsc.frequency.exponentialRampToValueAtTime(1318.5, now + 2.6); // E

    chimeGain.gain.setValueAtTime(0.001, now + 2.3);
    chimeGain.gain.linearRampToValueAtTime(0.3, now + 2.35);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 3.4);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(masterGain);

    chimeOsc.start(now + 2.3);
    chimeOsc.stop(now + 3.5);
  } catch (err) {
    console.warn('Audio synthesis not permitted without user gesture yet:', err);
  }
};

/**
 * Iron Man Power Down / Sleep sound (descending sub-sweep)
 */
export const playStarkPowerDownSound = (): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 1.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.3);
  } catch (e) {
    // silent fallback
  }
};

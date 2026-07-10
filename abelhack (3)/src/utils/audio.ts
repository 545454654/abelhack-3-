let audioCtx: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

let planeOscillator: OscillatorNode | null = null;
let planeGainNode: GainNode | null = null;

export const playSound = (type: "click" | "toggle" | "predict" | "success" | "hover" | "plane-start" | "crash") => {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    switch (type) {
      case "click": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case "toggle": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }
      case "predict": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        filter.type = "lowpass";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.15);
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.linearRampToValueAtTime(2000, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case "success": {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);
          gain.gain.setValueAtTime(0, now + idx * 0.03);
          gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.03 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.6);
          osc.start(now + idx * 0.03);
          osc.stop(now + idx * 0.03 + 0.7);
        });
        break;
      }
      case "hover": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(2000, now);
        gain.gain.setValueAtTime(0.005, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        osc.start(now);
        osc.stop(now + 0.02);
        break;
      }
      case "plane-start": {
        if (planeOscillator) {
          try {
            planeOscillator.stop();
          } catch {}
        }
        planeOscillator = ctx.createOscillator();
        planeGainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        planeOscillator.connect(filter);
        filter.connect(planeGainNode);
        planeGainNode.connect(ctx.destination);
        planeOscillator.type = "sawtooth";
        filter.type = "lowpass";
        planeOscillator.frequency.setValueAtTime(100, now);
        planeOscillator.frequency.linearRampToValueAtTime(800, now + 5);
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.linearRampToValueAtTime(2000, now + 5);
        planeGainNode.gain.setValueAtTime(0, now);
        planeGainNode.gain.linearRampToValueAtTime(0.05, now + 0.5);
        planeOscillator.start(now);
        break;
      }
      case "crash": {
        if (planeOscillator && planeGainNode) {
          try {
            planeGainNode.gain.setValueAtTime(planeGainNode.gain.value, now);
            planeGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
            planeOscillator.stop(now + 0.15);
          } catch {}
          planeOscillator = null;
          planeGainNode = null;
        }
        const bufferSize = ctx.sampleRate * 1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        break;
      }
    }
  } catch (err) {
    console.warn("Audio Context Play Error:", err);
  }
};

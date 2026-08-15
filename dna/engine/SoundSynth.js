/**
 * CreativeCode.my — Web Audio API Procedural Sound Designer & Ambient Drone Engine
 */

class SoundSynthEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isDronePlaying = false;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;
    this.droneFilter = null;
    this.lfo = null;
    this.lfoGain = null;
    this.analyser = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.analyser || this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  playBeep(freq = 880, duration = 0.08, type = "square") {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.analyser || this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playMutationChirp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.analyser || this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  toggleAmbientDrone(force) {
    this.init();
    if (!this.ctx) return false;

    const targetState = force !== undefined ? force : !this.isDronePlaying;
    if (targetState) {
      if (this.isDronePlaying) return true;
      try {
        this.droneOsc1 = this.ctx.createOscillator();
        this.droneOsc2 = this.ctx.createOscillator();
        this.droneFilter = this.ctx.createBiquadFilter();
        this.droneGain = this.ctx.createGain();

        this.lfo = this.ctx.createOscillator();
        this.lfoGain = this.ctx.createGain();

        // 55 Hz (A1) & 82.4 Hz (E2) sub-harmonic chord
        this.droneOsc1.type = "sawtooth";
        this.droneOsc1.frequency.setValueAtTime(55.0, this.ctx.currentTime);

        this.droneOsc2.type = "triangle";
        this.droneOsc2.frequency.setValueAtTime(110.0, this.ctx.currentTime);
        this.droneOsc2.detune.setValueAtTime(7, this.ctx.currentTime);

        this.droneFilter.type = "lowpass";
        this.droneFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
        this.droneFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

        // LFO subtle filter sweep
        this.lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
        this.lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
        this.lfo.connect(this.droneFilter.frequency);

        this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.droneGain.gain.exponentialRampToValueAtTime(0.07, this.ctx.currentTime + 2.0);

        this.droneOsc1.connect(this.droneFilter);
        this.droneOsc2.connect(this.droneFilter);
        this.droneFilter.connect(this.droneGain);
        this.droneGain.connect(this.analyser || this.ctx.destination);

        this.droneOsc1.start();
        this.droneOsc2.start();
        this.lfo.start();
        this.isDronePlaying = true;
      } catch (e) {
        console.warn("Drone audio error:", e);
      }
    } else {
      if (!this.isDronePlaying) return false;
      if (this.droneGain && this.ctx) {
        this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, this.ctx.currentTime);
        this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
        setTimeout(() => {
          try {
            this.droneOsc1?.stop();
            this.droneOsc2?.stop();
            this.lfo?.stop();
            this.droneOsc1?.disconnect();
            this.droneOsc2?.disconnect();
            this.droneFilter?.disconnect();
            this.droneGain?.disconnect();
          } catch (e) {}
          this.isDronePlaying = false;
        }, 1100);
      } else {
        this.isDronePlaying = false;
      }
    }
    return this.isDronePlaying;
  }

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(32);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

export const soundSynth = new SoundSynthEngine();

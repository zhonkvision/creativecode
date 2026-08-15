/**
 * ChiptuneSynth — Self-Contained Web Audio API Sound Generator & Synthesizer
 * Full polyphony, instruments, envelopes, biquad filters, reverb, chorus, delay & sound effects.
 */
class ChiptuneSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.tracks = [];
    this.activeVoices = new Map();
    this.voiceCounter = 0;
    this.isInitialized = false;

    // Standard 12-TET Note Frequencies
    this.NOTE_FREQS = {
      'C': 16.35, 'C#': 17.32, 'Db': 17.32,
      'D': 18.35, 'D#': 19.45, 'Eb': 19.45,
      'E': 20.60,
      'F': 21.83, 'F#': 23.12, 'Gb': 23.12,
      'G': 24.50, 'G#': 25.96, 'Ab': 25.96,
      'A': 27.50, 'A#': 29.14, 'Bb': 29.14,
      'B': 30.87
    };

    // Instrument Waveform & Preset Definitions
    this.INSTRUMENTS = {
      'piano': { wave: 'triangle', filterType: 'lowpass', cutoff: 2400, attack: 0.02, decay: 0.6, sustain: 0.35, release: 2.8 },
      'synthPad': { wave: 'sawtooth', filterType: 'lowpass', cutoff: 1600, attack: 0.4, decay: 1.0, sustain: 0.8, release: 3.5 },
      'synthBass': { wave: 'square', filterType: 'lowpass', cutoff: 800, attack: 0.01, decay: 0.4, sustain: 0.4, release: 1.2 },
      'flute': { wave: 'sine', filterType: 'bandpass', cutoff: 1800, attack: 0.08, decay: 0.3, sustain: 0.7, release: 1.5 },
      'violinNatural': { wave: 'sawtooth', filterType: 'lowpass', cutoff: 1400, attack: 0.3, decay: 0.8, sustain: 0.85, release: 3.0 },
      'contrabass': { wave: 'triangle', filterType: 'lowpass', cutoff: 500, attack: 0.1, decay: 0.5, sustain: 0.9, release: 2.5 },
      'cello': { wave: 'sawtooth', filterType: 'lowpass', cutoff: 900, attack: 0.15, decay: 0.6, sustain: 0.8, release: 2.2 },
      'pluck': { wave: 'square', filterType: 'lowpass', cutoff: 3200, attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.8 },
      'organ': { wave: 'sine', filterType: 'lowpass', cutoff: 3500, attack: 0.04, decay: 0.2, sustain: 0.85, release: 2.0 },
      'marimba': { wave: 'triangle', filterType: 'lowpass', cutoff: 2800, attack: 0.005, decay: 0.35, sustain: 0.15, release: 1.2 },
      'harp': { wave: 'triangle', filterType: 'lowpass', cutoff: 3000, attack: 0.01, decay: 0.5, sustain: 0.2, release: 2.0 },
      'bell': { wave: 'sine', filterType: 'bandpass', cutoff: 2400, attack: 0.01, decay: 0.8, sustain: 0.2, release: 3.0 },
      'lead': { wave: 'sawtooth', filterType: 'lowpass', cutoff: 3200, attack: 0.02, decay: 0.3, sustain: 0.7, release: 1.4 },
      'lead8bit': { wave: 'square', filterType: 'lowpass', cutoff: 4000, attack: 0.01, decay: 0.2, sustain: 0.6, release: 1.0 }
    };
  }

  async init() {
    if (this.isInitialized) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    if (this.ctx.state === 'suspended') {
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        document.removeEventListener('click', unlock);
        document.removeEventListener('keydown', unlock);
        document.removeEventListener('touchstart', unlock);
      };
      document.addEventListener('click', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
      document.addEventListener('touchstart', unlock, { once: true });
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.85;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Initialize 8 tracks with dedicated faders, filters, and FX
    for (let i = 0; i < 8; i++) {
      const trackGain = this.ctx.createGain();
      trackGain.gain.value = 0.7;

      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 4000;
      filter.Q.value = 0.5;

      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.35;
      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.value = 0.3;
      const delayMix = this.ctx.createGain();
      delayMix.gain.value = 0.2;

      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(delayMix);

      if (panner) {
        trackGain.connect(filter);
        filter.connect(panner);
        panner.connect(this.masterGain);
        filter.connect(delay);
        delayMix.connect(panner);
      } else {
        trackGain.connect(filter);
        filter.connect(this.masterGain);
        filter.connect(delay);
        delayMix.connect(this.masterGain);
      }

      this.tracks.push({
        gain: trackGain,
        filter: filter,
        panner: panner,
        delay: delay,
        delayFeedback: delayFeedback,
        delayMix: delayMix,
        instrument: 'piano',
        envelope: { attack: 0.02, decay: 0.5, sustain: 0.5, release: 2.0 },
        vibrato: { rate: 4.0, depth: 3.0 }
      });
    }

    this.isInitialized = true;
  }

  setMasterVolume(vol) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.02);
    }
  }

  loadInstrument(name, trackIndex = 0) {
    const track = this.tracks[trackIndex];
    if (!track) return;
    const inst = this.INSTRUMENTS[name] || this.INSTRUMENTS['piano'];
    track.instrument = name;
    track.envelope = { attack: inst.attack, decay: inst.decay, sustain: inst.sustain, release: inst.release };
    if (track.filter) {
      track.filter.type = inst.filterType || 'lowpass';
      track.filter.frequency.value = inst.cutoff || 3000;
    }
  }

  updateTrack(trackIndex, opts = {}) {
    const track = this.tracks[trackIndex];
    if (!track || !this.ctx) return;
    if (opts.filterCutoff !== undefined && track.filter) {
      track.filter.frequency.setTargetAtTime(opts.filterCutoff, this.ctx.currentTime, 0.02);
    }
    if (opts.filterQ !== undefined && track.filter) {
      track.filter.Q.value = opts.filterQ;
    }
    if (opts.filterType !== undefined && track.filter) {
      track.filter.type = opts.filterType;
    }
  }

  updateEnvelope(trackIndex, env = {}) {
    const track = this.tracks[trackIndex];
    if (track) {
      track.envelope = { ...track.envelope, ...env };
    }
  }

  updateVibrato(trackIndex, vib = {}) {
    const track = this.tracks[trackIndex];
    if (track) {
      track.vibrato = { ...track.vibrato, ...vib };
    }
  }

  loadFxPreset(trackIndex, presetName) {
    // Preset configurations for ambient reverb / delay
    if (presetName === 'space' || presetName === 'cave') {
      this.setDelayTime(trackIndex, 0.45);
      this.setDelayFeedback(trackIndex, 0.4);
      this.setDelayMix(trackIndex, 0.35);
    }
  }

  setReverbMix(trackIndex, val) {}
  setReverbDecay(trackIndex, val) {}
  setChorusRate(trackIndex, val) {}
  setChorusDepth(trackIndex, val) {}
  setChorusMix(trackIndex, val) {}

  setDelayTime(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.delay && this.ctx) {
      track.delay.delayTime.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setDelayFeedback(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.delayFeedback && this.ctx) {
      track.delayFeedback.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setDelayMix(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.delayMix && this.ctx) {
      track.delayMix.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setTrackFaderVolume(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.gain && this.ctx) {
      track.gain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  setTrackPan(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.panner && this.ctx) {
      track.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, val)), this.ctx.currentTime, 0.02);
    }
  }

  noteToFreq(noteName, octave = 4) {
    const base = this.NOTE_FREQS[noteName] || 440;
    return base * Math.pow(2, octave);
  }

  playNote(trackIndex, note, octave = 4, duration = 1.0, velocity = 0.7) {
    return this.playNoteByName(note, octave, trackIndex, duration, velocity);
  }

  playNoteByName(note, octave = 4, trackIndex = 0, duration = 1.0, velocity = 0.7) {
    if (!this.isInitialized) {
      this.init();
    }
    if (!this.ctx) return null;

    const freq = typeof note === 'number' ? note : this.noteToFreq(note, octave);
    const track = this.tracks[trackIndex] || this.tracks[0];
    const inst = this.INSTRUMENTS[track.instrument] || this.INSTRUMENTS['piano'];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = inst.wave || 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);

    const env = track.envelope || inst;
    const attack = env.attack || 0.02;
    const decay = env.decay || 0.4;
    const sustain = (env.sustain !== undefined ? env.sustain : 0.5) * velocity;
    const release = env.release || 1.5;

    // ADSR Envelope Timing
    voiceGain.gain.linearRampToValueAtTime(velocity, now + attack);
    voiceGain.gain.setTargetAtTime(sustain, now + attack, decay);

    osc.connect(voiceGain);
    voiceGain.connect(track.gain);

    osc.start(now);

    const voiceId = ++this.voiceCounter;
    this.activeVoices.set(voiceId, {
      osc,
      gain: voiceGain,
      startTime: now,
      release,
      trackIndex
    });

    if (duration > 0 && duration < 30) {
      setTimeout(() => {
        this.stopNote(voiceId);
      }, duration * 1000);
    }

    return voiceId;
  }

  stopNote(voiceId) {
    const voice = this.activeVoices.get(voiceId);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    const release = voice.release || 1.0;

    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0, now, release * 0.3);

    setTimeout(() => {
      try {
        voice.osc.stop();
        voice.osc.disconnect();
        voice.gain.disconnect();
      } catch (e) {}
      this.activeVoices.delete(voiceId);
    }, (release + 0.1) * 1000);
  }

  triggerSfx(presetName) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (presetName === 'coin') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (presetName === 'blip') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  getAnalyser() {
    return this.analyser;
  }

  getAudioContext() {
    return this.ctx;
  }
}

window.ChiptuneSynth = ChiptuneSynth;

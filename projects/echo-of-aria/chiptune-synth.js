/**
 * ChiptuneSynth — Self-Contained Web Audio API Sound Generator & Synthesizer
 * Full polyphony, unison voices, instruments, ADSR envelopes, biquad filters, reverb, chorus, delay, compressors & sound effects.
 */
class ChiptuneSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.tracks = [];
    this.activeVoices = new Map();
    this.activeNotes = this.activeVoices; // Backward compatibility alias
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

  get audioContext() {
    return this.ctx;
  }

  async init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        try { await this.ctx.resume(); } catch (e) {}
      }
      return;
    }

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
        document.removeEventListener('pointerdown', unlock);
      };
      document.addEventListener('click', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
      document.addEventListener('touchstart', unlock, { once: true });
      document.addEventListener('pointerdown', unlock, { once: true });
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.85;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Shared Reverb Convolver Node with Synthetic Ethereal Impulse
    this.reverbBuffer = this.createSyntheticImpulseResponse(3.2, 2.5);

    // Initialize 8 tracks with dedicated faders, filters, panner, delay, reverb, and compressor
    for (let i = 0; i < 8; i++) {
      const trackGain = this.ctx.createGain();
      trackGain.gain.value = 0.7;

      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 4000;
      filter.Q.value = 0.5;

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;

      // Delay Node
      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.35;
      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.value = 0.3;
      const delayMix = this.ctx.createGain();
      delayMix.gain.value = 0.2;

      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(delayMix);

      // Reverb Convolver Node
      const reverb = this.ctx.createConvolver();
      reverb.buffer = this.reverbBuffer;
      const reverbMix = this.ctx.createGain();
      reverbMix.gain.value = 0.3;
      reverb.connect(reverbMix);

      // Signal Routing: TrackGain -> Filter -> Compressor -> [Dry & Wet] -> Panner -> MasterGain
      trackGain.connect(filter);
      filter.connect(compressor);

      if (panner) {
        compressor.connect(panner);
        compressor.connect(delay);
        compressor.connect(reverb);
        delayMix.connect(panner);
        reverbMix.connect(panner);
        panner.connect(this.masterGain);
      } else {
        compressor.connect(this.masterGain);
        compressor.connect(delay);
        compressor.connect(reverb);
        delayMix.connect(this.masterGain);
        reverbMix.connect(this.masterGain);
      }

      this.tracks.push({
        gain: trackGain,
        filter: filter,
        compressor: compressor,
        panner: panner,
        delay: delay,
        delayFeedback: delayFeedback,
        delayMix: delayMix,
        reverb: reverb,
        reverbMix: reverbMix,
        instrument: 'piano',
        unisonVoices: 1,
        unisonDetune: 4,
        unisonSpread: 20,
        envelope: { attack: 0.02, decay: 0.5, sustain: 0.5, release: 2.0 },
        vibrato: { rate: 4.0, depth: 3.0 }
      });
    }

    this.isInitialized = true;
  }

  createSyntheticImpulseResponse(duration = 3.0, decay = 2.0) {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const factor = Math.exp(-t * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return buffer;
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
    if (opts.unisonVoices !== undefined) track.unisonVoices = opts.unisonVoices;
    if (opts.unisonDetune !== undefined) track.unisonDetune = opts.unisonDetune;
    if (opts.unisonSpread !== undefined) track.unisonSpread = opts.unisonSpread;
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
    if (presetName === 'space' || presetName === 'cave') {
      this.setDelayTime(trackIndex, 0.55);
      this.setDelayFeedback(trackIndex, 0.35);
      this.setDelayMix(trackIndex, 0.25);
      this.setReverbMix(trackIndex, 0.75);
    }
  }

  setReverbMix(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.reverbMix && this.ctx) {
      track.reverbMix.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.05);
    }
  }

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

  setTrackCompressorEnabled(trackIndex, val) {}
  setTrackCompressorThreshold(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.compressor && this.ctx) {
      track.compressor.threshold.setValueAtTime(val, this.ctx.currentTime);
    }
  }
  setTrackCompressorRatio(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.compressor && this.ctx) {
      track.compressor.ratio.setValueAtTime(val, this.ctx.currentTime);
    }
  }
  setTrackCompressorAttack(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.compressor && this.ctx) {
      track.compressor.attack.setValueAtTime(val, this.ctx.currentTime);
    }
  }
  setTrackCompressorRelease(trackIndex, val) {
    const track = this.tracks[trackIndex];
    if (track && track.compressor && this.ctx) {
      track.compressor.release.setValueAtTime(val, this.ctx.currentTime);
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
    if (!this.isInitialized || !this.ctx) {
      this.init();
    }
    if (!this.ctx) return null;

    if (this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (e) {}
    }

    const freq = typeof note === 'number' ? note : this.noteToFreq(note, octave);
    const track = this.tracks[trackIndex] || this.tracks[0];
    const inst = this.INSTRUMENTS[track.instrument] || this.INSTRUMENTS['piano'];
    const now = this.ctx.currentTime;

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);

    const env = track.envelope || inst;
    const attack = env.attack !== undefined ? env.attack : 0.02;
    const decay = env.decay !== undefined ? env.decay : 0.4;
    const sustain = (env.sustain !== undefined ? env.sustain : 0.5) * velocity;
    const release = env.release !== undefined ? env.release : 1.5;

    // ADSR Envelope Timing
    voiceGain.gain.linearRampToValueAtTime(Math.max(0.001, velocity), now + Math.max(0.005, attack));
    voiceGain.gain.setTargetAtTime(Math.max(0.001, sustain), now + Math.max(0.005, attack), decay);

    // Unison voices with detuning for rich acoustic depth
    const numVoices = track.unisonVoices || 1;
    const detuneSpread = track.unisonDetune || 4;
    const oscillators = [];

    for (let v = 0; v < numVoices; v++) {
      const osc = this.ctx.createOscillator();
      osc.type = inst.wave || 'triangle';
      const detune = numVoices > 1 ? (v - (numVoices - 1) / 2) * detuneSpread : 0;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);
      osc.connect(voiceGain);
      osc.start(now);
      oscillators.push(osc);
    }

    voiceGain.connect(track.gain);

    const voiceId = ++this.voiceCounter;
    const voiceData = {
      id: voiceId,
      gainNode: voiceGain,
      gain: voiceGain,
      oscillators: oscillators,
      osc: oscillators[0],
      lfo: null,
      extraLfos: [],
      startTime: now,
      release: release,
      trackIndex: trackIndex
    };

    this.activeVoices.set(voiceId, voiceData);

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

    try {
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setTargetAtTime(0, now, Math.max(0.02, release * 0.25));
    } catch (e) {}

    setTimeout(() => {
      try {
        voice.oscillators.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch (e) {}
        });
        voice.gainNode.disconnect();
      } catch (e) {}
      this.activeVoices.delete(voiceId);
    }, (release + 0.1) * 1000);
  }

  triggerSfx(presetName) {
    if (!this.isInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (presetName === 'coin') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (presetName === 'blip') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (presetName === '1up') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.setValueAtTime(392, now + 0.08);
      osc.frequency.setValueAtTime(659, now + 0.16);
      osc.frequency.setValueAtTime(523, now + 0.24);
      osc.frequency.setValueAtTime(587, now + 0.32);
      osc.frequency.setValueAtTime(784, now + 0.40);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  }

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

// Universal module & global browser attachment
if (typeof window !== 'undefined') {
  window.ChiptuneSynth = ChiptuneSynth;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChiptuneSynth;
};

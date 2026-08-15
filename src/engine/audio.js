/**
 * CreativeCode.my — Audio Engine (UI Sound Synthesizer + Music for Programming Stream)
 * 
 * - Ambient: Randomly streams latest episodes from musicforprogramming.net with smooth fade-in
 * - UI Sounds: Micro-synthesized procedural Web Audio clicks, hovers, sliders, and selection chirps
 * - Independent volume controls & persistent localStorage preferences
 */

export const MFP_TRACKS = [
  { id: 78, title: 'MFP 78: Datassette', url: 'https://datashat.net/music_for_programming_78-datassette.mp3' },
  { id: 77, title: 'MFP 77: Phonaut', url: 'https://datashat.net/music_for_programming_77-phonaut.mp3' },
  { id: 76, title: 'MFP 76: Material Object', url: 'https://datashat.net/music_for_programming_76-material_object.mp3' },
  { id: 75, title: 'MFP 75: Datassette', url: 'https://datashat.net/music_for_programming_75-datassette.mp3' },
  { id: 74, title: 'MFP 74: K-Con', url: 'https://datashat.net/music_for_programming_74-k_con.mp3' },
  { id: 73, title: 'MFP 73: Abe Mangold', url: 'https://datashat.net/music_for_programming_73-abe_mangold.mp3' },
  { id: 72, title: 'MFP 72: Stave', url: 'https://datashat.net/music_for_programming_72-stave.mp3' },
  { id: 71, title: 'MFP 71: Jo Johnson', url: 'https://datashat.net/music_for_programming_71-jo_johnson.mp3' }
];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;

    // Preferences from localStorage
    this.isMuted = localStorage.getItem('cc_audio_muted') === 'true';
    this.musicVolume = parseFloat(localStorage.getItem('cc_music_volume')) || 0.22;
    this.sfxVolume = parseFloat(localStorage.getItem('cc_sfx_volume')) || 0.50;

    // Ambient Stream
    this.ambientAudio = null;
    this.currentTrack = null;
    this.isMusicPlaying = false;

    // Procedural Fallback Drone
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientFilter = null;
    this.lfo = null;
    this.droneGain = null;

    this.selectRandomTrack();
  }

  selectRandomTrack() {
    const idx = Math.floor(Math.random() * MFP_TRACKS.length);
    this.currentTrack = MFP_TRACKS[idx];
    console.log(`[AUDIO] Selected Ambient Stream: ${this.currentTrack.title}`);
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Procedural Drone Gain
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.droneGain.connect(this.masterGain);

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('[AUDIO] Web Audio init deferred:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // =========================================================================
  // MUSIC FOR PROGRAMMING AMBIENT STREAM
  // =========================================================================
  startAmbient() {
    this.ensureContext();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    try {
      if (!this.ambientAudio) {
        this.ambientAudio = new Audio();
        this.ambientAudio.crossOrigin = 'anonymous';
        this.ambientAudio.loop = true;
        this.ambientAudio.preload = 'auto';
        this.ambientAudio.volume = 0; // start at 0 for fade in
        this.ambientAudio.src = this.currentTrack.url;

        // Fallback to procedural synth drone on network error
        this.ambientAudio.addEventListener('error', (e) => {
          console.warn('[AUDIO] Music for programming stream offline, fallback to procedural drone:', e);
          this.startProceduralDrone();
        });
      }

      this.ambientAudio.play().then(() => {
        this.fadeInMusic();
      }).catch((err) => {
        console.warn('[AUDIO] Autoplay prevented, will play on next interaction:', err);
        this.isMusicPlaying = false;
      });
    } catch (e) {
      this.startProceduralDrone();
    }
  }

  fadeInMusic() {
    if (!this.ambientAudio) return;
    let target = this.isMuted ? 0 : this.musicVolume;
    let current = 0;
    this.ambientAudio.volume = 0;

    const fade = setInterval(() => {
      current += 0.02;
      if (current >= target) {
        current = target;
        clearInterval(fade);
      }
      if (this.ambientAudio) this.ambientAudio.volume = current;
    }, 100);
  }

  fadeOutMusic(onComplete) {
    if (!this.ambientAudio) {
      if (onComplete) onComplete();
      return;
    }
    let current = this.ambientAudio.volume;
    const fade = setInterval(() => {
      current -= 0.03;
      if (current <= 0) {
        current = 0;
        clearInterval(fade);
        if (this.ambientAudio) {
          this.ambientAudio.pause();
          this.isMusicPlaying = false;
        }
        if (onComplete) onComplete();
      }
      if (this.ambientAudio) this.ambientAudio.volume = current;
    }, 80);
  }

  pauseMusic() {
    if (this.ambientAudio && !this.ambientAudio.paused) {
      this.ambientAudio.pause();
    }
    this.isMusicPlaying = false;
  }

  resumeMusic() {
    if (this.ambientAudio && this.ambientAudio.paused && !this.isMuted) {
      this.ambientAudio.play().catch(() => {});
      this.isMusicPlaying = true;
    } else if (!this.ambientAudio) {
      this.startAmbient();
    }
  }

  toggleMusic() {
    if (this.isMusicPlaying) {
      this.pauseMusic();
    } else {
      this.resumeMusic();
    }
    return this.isMusicPlaying;
  }

  startProceduralDrone() {
    if (this.ambientOsc1 || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientFilter = this.ctx.createBiquadFilter();

      this.ambientOsc1.type = 'sine';
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc1.frequency.setValueAtTime(55.0, now);
      this.ambientOsc2.frequency.setValueAtTime(55.35, now);

      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setValueAtTime(180, now);
      this.ambientFilter.Q.setValueAtTime(3.0, now);

      this.lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.lfo.type = 'sine';
      this.lfo.frequency.setValueAtTime(0.08, now);
      lfoGain.gain.setValueAtTime(80, now);
      this.lfo.connect(this.ambientFilter.frequency);

      this.ambientOsc1.connect(this.ambientFilter);
      this.ambientOsc2.connect(this.ambientFilter);
      this.ambientFilter.connect(this.droneGain);

      this.droneGain.gain.setTargetAtTime(this.isMuted ? 0 : this.musicVolume * 0.5, now, 1.5);

      this.ambientOsc1.start(now);
      this.ambientOsc2.start(now);
      this.lfo.start(now);
    } catch (e) {}
  }

  // =========================================================================
  // VOLUME & MUTE CONTROLS
  // =========================================================================
  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    localStorage.setItem('cc_audio_muted', this.isMuted ? 'true' : 'false');

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime, 0.05);
    }

    if (this.ambientAudio) {
      this.ambientAudio.volume = this.isMuted ? 0 : this.musicVolume;
      if (!this.isMuted && this.ambientAudio.paused) {
        this.ambientAudio.play().catch(() => {});
      }
    }

    return !this.isMuted;
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1.0, parseFloat(val)));
    localStorage.setItem('cc_music_volume', this.musicVolume);
    if (this.ambientAudio && !this.isMuted) {
      this.ambientAudio.volume = this.musicVolume;
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1.0, parseFloat(val)));
    localStorage.setItem('cc_sfx_volume', this.sfxVolume);
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  // =========================================================================
  // INTERACTIVE UI SOUND EFFECTS (MICRO-SYNTHESIS)
  // =========================================================================
  playHover() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    
    // Smooth 35ms debouncing to keep hover sounds clean and musical
    const nowMs = performance.now();
    if (this._lastHoverTime && nowMs - this._lastHoverTime < 35) return;
    this._lastHoverTime = nowMs;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.016);

      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.018);
    } catch (e) {}
  }

  playClick() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.035);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  playSlider(factor = 0.5) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 450 + factor * 600;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.016);
    } catch (e) {}
  }

  playSelect() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(520, now);
      osc2.frequency.setValueAtTime(1040, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.07);
      osc2.stop(now + 0.07);
    } catch (e) {}
  }

  playBoot() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      sub.type = 'sine';

      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

      sub.frequency.setValueAtTime(40, now);
      sub.frequency.exponentialRampToValueAtTime(110, now + 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.4);
      filter.Q.setValueAtTime(4, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.75);
      sub.stop(now + 0.75);
    } catch (e) {}
  }
}

export const audioEngine = new AudioEngine();

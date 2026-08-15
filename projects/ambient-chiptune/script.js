/* ══════════════════════════════════════════════
   Generative Ambient Chiptune Soundscape Engine
   ══════════════════════════════════════════════ */

const synth = new ChiptuneSynth();
let initialized = false;
let playing = false;
let genTimer = null;

/* ── Star field ── */
(function buildStars() {
  const el = document.getElementById('stars');
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    const layer2 = i > 80;
    s.className = 'star' + (layer2 ? ' layer2' : '');
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--dur', (6 + Math.random() * 12) + 's');
    s.style.setProperty('--delay', (Math.random() * 10) + 's');
    s.style.setProperty('--bright', (0.2 + Math.random() * 0.6).toFixed(2));
    if (layer2) {
      s.style.setProperty('--dx', (Math.random() * 30 - 15) + 'px');
      s.style.setProperty('--dy', (Math.random() * 20 - 10) + 'px');
    }
    el.appendChild(s);
  }
})();

/* ── Mood definitions ── */
const MOODS = {
  cosmic: {
    label: 'Cosmic',
    colors: { primary: '#8b5cf6', secondary: '#3b82f6', glow: '#8b5cf633', ring: '#8b5cf6' },
    scale: ['C','D','E','G','A'],       // C major pentatonic
    padOctave: 3, melodyOctave: 4, bassOctave: 2,
    padInstrument: 'synthPad',
    melodyInstrument: 'flute',
    bassInstrument: 'synthBass',
    padDuration: 4.0,
    melodyDuration: [0.6, 1.0, 1.5],
    bassDuration: 3.0,
    tempoMs: 600,
    sfxPresets: ['coin', 'blip'],
  },
  rain: {
    label: 'Rain',
    colors: { primary: '#22d3ee', secondary: '#64748b', glow: '#22d3ee33', ring: '#22d3ee' },
    scale: ['C','Eb','F','G','Bb'],     // C minor pentatonic
    padOctave: 3, melodyOctave: 4, bassOctave: 2,
    padInstrument: 'synthPad',
    melodyInstrument: 'piano',
    bassInstrument: 'cello',
    padDuration: 5.0,
    melodyDuration: [0.3, 0.5, 0.8],
    bassDuration: 3.5,
    tempoMs: 500,
    sfxPresets: ['blip', 'blip'],
  },
  forest: {
    label: 'Forest',
    colors: { primary: '#4ade80', secondary: '#a16207', glow: '#4ade8033', ring: '#4ade80' },
    scale: ['D','E','G','A','B'],       // D major pentatonic
    padOctave: 3, melodyOctave: 5, bassOctave: 2,
    padInstrument: 'organ',
    melodyInstrument: 'flute',
    bassInstrument: 'synthBass',
    padDuration: 3.5,
    melodyDuration: [0.4, 0.7, 1.2],
    bassDuration: 2.5,
    tempoMs: 550,
    sfxPresets: ['coin', '1up'],
  },
  cave: {
    label: 'Cave',
    colors: { primary: '#f59e0b', secondary: '#78350f', glow: '#f59e0b33', ring: '#f59e0b' },
    scale: ['A','C','D','E','G'],       // A minor pentatonic
    padOctave: 2, melodyOctave: 3, bassOctave: 1,
    padInstrument: 'synthPad',
    melodyInstrument: 'marimba',
    bassInstrument: 'cello',
    padDuration: 5.0,
    melodyDuration: [0.8, 1.5, 2.0],
    bassDuration: 4.0,
    tempoMs: 800,
    sfxPresets: ['blip', 'coin'],
  }
};

let currentMood = 'cosmic';
let density = 4; // 1-10

/* ── DOM refs ── */
const overlay    = document.getElementById('overlay');
const playBtn    = document.getElementById('playBtn');
const playIcon   = document.getElementById('playIcon');
const noteDisp   = document.getElementById('noteDisplay');
const vizCanvas  = document.getElementById('vizCanvas');
const volSlider  = document.getElementById('volSlider');
const densSlider = document.getElementById('densSlider');
const ctx        = vizCanvas.getContext('2d');

const PLAY_PATH  = '<polygon points="8,5 19,12 8,19"/>';
const PAUSE_PATH = '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>';

/* ── Helper ── */
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

/* ── Apply mood colors ── */
function applyMoodColors(mood) {
  const m = MOODS[mood];
  document.documentElement.style.setProperty('--accent', m.colors.primary);
  document.documentElement.style.setProperty('--accent-glow', m.colors.glow);
  document.documentElement.style.setProperty('--glow-color', m.colors.glow);
  vizCanvas.style.filter = `drop-shadow(0 0 25px ${m.colors.glow}) drop-shadow(0 0 50px ${m.colors.glow})`;

  document.querySelectorAll('.mood-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mood === mood);
  });
}

/* ── Init synth & configure tracks for mood ── */
async function ensureInit() {
  if (!initialized) {
    await synth.init();
    initialized = true;
  }
}

function configureMood(mood) {
  const m = MOODS[mood];

  // Track 0: Pad (long sustained chords)
  synth.loadInstrument(m.padInstrument, 0);
  synth.updateEnvelope(0, { attack: 1.2, decay: 0.5, sustain: 0.7, release: 2.0 });
  synth.updateVibrato(0, { rate: 2, depth: 4 });

  // Track 1: Melody (fragments)
  synth.loadInstrument(m.melodyInstrument, 1);
  synth.updateVibrato(1, { rate: 4, depth: 6 });

  // Track 2: Bass (low drones)
  synth.loadInstrument(m.bassInstrument, 2);
  synth.updateEnvelope(2, { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 });
  synth.updateVibrato(2, { rate: 1.5, depth: 3 });

  // Track 3: FX sparkles — use default square for blips
  synth.updateTrack(3, { type: 'square', volume: 0.15, dutyCycle: 0.5 });
  synth.updateEnvelope(3, { attack: 0.001, decay: 0.06, sustain: 0.0, release: 0.02 });
}

/* ── Generative engine ── */
let beatCount = 0;
let nextPadBeat = 0;
let nextMelodyBeat = 0;
let nextBassBeat = 0;
let nextSfxBeat = 0;
let lastNoteName = '';

function scheduleNextBeat() {
  if (!playing) return;
  const m = MOODS[currentMood];
  const densityFactor = density / 10; // 0.1 to 1.0

  // Random interval: faster at high density
  const minBeats = Math.max(1, Math.floor(4 - densityFactor * 3));
  const maxBeats = Math.max(minBeats + 1, Math.floor(6 - densityFactor * 4));

  // ── Pad (track 0): play chord tones ──
  if (beatCount >= nextPadBeat) {
    const note = pick(m.scale);
    synth.playNoteByName(note, m.padOctave, 0, m.padDuration);
    // Sometimes stack a fifth
    if (Math.random() < 0.4) {
      const fifth = m.scale[(m.scale.indexOf(note) + 3) % m.scale.length];
      synth.playNoteByName(fifth, m.padOctave, 0, m.padDuration * 0.8);
    }
    nextPadBeat = beatCount + randInt(3, 6);
    lastNoteName = note + m.padOctave + ' pad';
    noteDisp.textContent = m.label + '  |  ' + note + m.padOctave + ' pad  |  ' + m.scale.join(' ');
    noteDisp.style.color = m.colors.primary;
  }

  // ── Melody (track 1): short fragments ──
  if (beatCount >= nextMelodyBeat) {
    const note = pick(m.scale);
    const dur = pick(m.melodyDuration);
    synth.playNoteByName(note, m.melodyOctave, 1, dur);
    nextMelodyBeat = beatCount + randInt(minBeats, maxBeats);
    lastNoteName = note + m.melodyOctave + ' melody';
    noteDisp.textContent = m.label + '  |  ' + note + m.melodyOctave + ' melody  |  ' + m.scale.join(' ');
    noteDisp.style.color = m.colors.primary;
  }

  // ── Bass (track 2): low drones ──
  if (beatCount >= nextBassBeat) {
    const note = pick(m.scale);
    synth.playNoteByName(note, m.bassOctave, 2, m.bassDuration);
    nextBassBeat = beatCount + randInt(4, 8);
  }

  // ── SFX sparkles (track 3): occasional blips ──
  if (beatCount >= nextSfxBeat && Math.random() < densityFactor * 0.6) {
    synth.playPreset(pick(m.sfxPresets));
    nextSfxBeat = beatCount + randInt(Math.floor(6 - densityFactor * 4), 10);
  }

  beatCount++;

  // Schedule next beat with slight humanization
  const interval = m.tempoMs * (0.8 + Math.random() * 0.4);
  genTimer = setTimeout(scheduleNextBeat, interval);
}

function startGen() {
  if (playing) return;
  playing = true;
  beatCount = 0;
  nextPadBeat = 0;
  nextMelodyBeat = 1;
  nextBassBeat = 2;
  nextSfxBeat = 4;
  configureMood(currentMood);
  scheduleNextBeat();
  playBtn.classList.add('playing');
  playIcon.innerHTML = PAUSE_PATH;
}

function stopGen() {
  playing = false;
  if (genTimer) { clearTimeout(genTimer); genTimer = null; }
  playBtn.classList.remove('playing');
  playIcon.innerHTML = PLAY_PATH;
  noteDisp.textContent = '. . .';
  noteDisp.style.color = '#555';
}

/* ── Circular waveform visualizer ── */
const VIZ_CX = 160, VIZ_CY = 160, VIZ_R = 120, VIZ_INNER = 80;

function drawViz() {
  requestAnimationFrame(drawViz);

  const w = vizCanvas.width;
  const h = vizCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const m = MOODS[currentMood];
  const waveform = synth.getWaveformData();

  // Draw faint base ring
  ctx.beginPath();
  ctx.arc(VIZ_CX, VIZ_CY, VIZ_R, 0, Math.PI * 2);
  ctx.strokeStyle = m.colors.primary + '15';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(VIZ_CX, VIZ_CY, VIZ_INNER, 0, Math.PI * 2);
  ctx.strokeStyle = m.colors.primary + '0a';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (!waveform) return;

  // Compute average amplitude for pulse
  let sum = 0;
  for (let i = 0; i < waveform.length; i++) sum += Math.abs(waveform[i] - 128);
  const avg = sum / waveform.length / 128;
  const pulseR = VIZ_R + avg * 20;

  // Glow circle behind waveform
  const grad = ctx.createRadialGradient(VIZ_CX, VIZ_CY, VIZ_INNER * 0.5, VIZ_CX, VIZ_CY, pulseR + 10);
  grad.addColorStop(0, m.colors.primary + '08');
  grad.addColorStop(0.6, m.colors.primary + '04');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(VIZ_CX, VIZ_CY, pulseR + 10, 0, Math.PI * 2);
  ctx.fill();

  // Draw circular waveform
  const step = Math.max(1, Math.floor(waveform.length / 256));
  const points = [];

  for (let i = 0; i < 256; i++) {
    const idx = (i * step) % waveform.length;
    const val = (waveform[idx] - 128) / 128; // -1 to 1
    const angle = (i / 256) * Math.PI * 2 - Math.PI / 2;
    const r = VIZ_INNER + (VIZ_R - VIZ_INNER) * 0.5 + val * (VIZ_R - VIZ_INNER) * 0.5;
    points.push({
      x: VIZ_CX + Math.cos(angle) * r,
      y: VIZ_CY + Math.sin(angle) * r
    });
  }

  // Main waveform line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();

  // Gradient stroke
  const lineGrad = ctx.createLinearGradient(VIZ_CX - VIZ_R, VIZ_CY, VIZ_CX + VIZ_R, VIZ_CY);
  lineGrad.addColorStop(0, m.colors.primary);
  lineGrad.addColorStop(0.5, m.colors.secondary);
  lineGrad.addColorStop(1, m.colors.primary);
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.8;
  ctx.stroke();

  // Glow layer
  ctx.strokeStyle = m.colors.primary;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.15 + avg * 0.3;
  ctx.stroke();

  ctx.globalAlpha = 1;

  // Pulsing inner ring
  ctx.beginPath();
  ctx.arc(VIZ_CX, VIZ_CY, VIZ_INNER - 2 + avg * 8, 0, Math.PI * 2);
  ctx.strokeStyle = m.colors.primary + '30';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/* ── Event handlers ── */

// Overlay click
overlay.addEventListener('click', async () => {
  await ensureInit();
  overlay.classList.add('hidden');
  applyMoodColors(currentMood);
  startGen();
});

// Play/Pause
playBtn.addEventListener('click', async () => {
  await ensureInit();
  if (playing) stopGen();
  else startGen();
});

// Mood buttons
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const mood = btn.dataset.mood;
    if (mood === currentMood) return;
    currentMood = mood;
    applyMoodColors(mood);
    if (playing) {
      stopGen();
      await ensureInit();
      startGen();
    }
  });
});

// Volume slider
volSlider.addEventListener('input', () => {
  if (initialized) synth.setMasterVolume(volSlider.value / 100);
});

// Density slider
densSlider.addEventListener('input', () => {
  density = parseInt(densSlider.value);
});

/* ── Start visualization loop ── */
applyMoodColors(currentMood);
drawViz();
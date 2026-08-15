(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // MUSICAL CONSTANTS — C418 / Minecraft inspired
  // ═══════════════════════════════════════════════════════════════════

  // Pentatonic scale for auto-melody (C major pentatonic)
  var MELODY_NOTES = [
    {n:'C',o:4},{n:'D',o:4},{n:'E',o:4},{n:'G',o:4},{n:'A',o:4},
    {n:'C',o:5},{n:'D',o:5},{n:'E',o:5},{n:'G',o:5},{n:'A',o:5}
  ];

  // Chord progressions (C418 style — simple, warm, cyclical)
  var CHORDS = [
    [{n:'C',o:3},{n:'E',o:3},{n:'G',o:3}],   // C major
    [{n:'A',o:2},{n:'C',o:3},{n:'E',o:3}],   // A minor
    [{n:'F',o:2},{n:'A',o:2},{n:'C',o:3}],   // F major
    [{n:'G',o:2},{n:'B',o:2},{n:'D',o:3}],   // G major
    [{n:'C',o:3},{n:'E',o:3},{n:'G',o:3}],   // C major
    [{n:'E',o:2},{n:'G',o:2},{n:'B',o:2}],   // E minor
    [{n:'A',o:2},{n:'C',o:3},{n:'E',o:3}],   // A minor
    [{n:'D',o:2},{n:'F',o:2},{n:'A',o:2}]    // D minor
  ];

  // Piano key layout (2 octaves)
  var WHITE_NOTES = ['C','D','E','F','G','A','B'];
  var BLACK_NOTES = {0:'C#',1:'D#',3:'F#',4:'G#',5:'A#'}; // index relative to white keys
  var KEYBOARD_MAP = {
    'a':'C','w':'C#','s':'D','e':'D#','d':'E','f':'F',
    't':'F#','g':'G','y':'G#','h':'A','u':'A#','j':'B',
    'k':'C+','o':'C#+','l':'D+','p':'D#+',';':'E+'
  };

  // ── State ──────────────────────────────────────────────────────────
  var synth = new ChiptuneSynth();
  var canvas = document.getElementById('world-canvas');
  var ctx = canvas.getContext('2d');
  var waveCanvas = document.getElementById('waveform');
  var waveCtx = waveCanvas.getContext('2d');

  var time = 0;
  var totalNotes = 0;
  var octave = 4;
  var dreaming = true;
  var dreamTimer = 0;
  var chordIndex = 0;
  var chordTimer = 0;
  var lastMelodyIndex = -1;

  // Visual state
  var stars = [];
  var fireflies = [];
  var noteParticles = [];
  var treePositions = [];

  // Active notes for key highlighting
  var activeKeys = {};
  var heldKeys = {};

  // ── DOM ────────────────────────────────────────────────────────────
  var overlay = document.getElementById('init-overlay');
  var initBtn = document.getElementById('init-btn');
  var pianoEl = document.getElementById('piano');
  var noteDisplay = document.getElementById('note-display');
  var infoNotes = document.getElementById('info-notes');
  var infoOctave = document.getElementById('info-octave');
  var infoMode = document.getElementById('info-mode');
  var btnDream = document.getElementById('btn-dream');
  var btnOctDown = document.getElementById('btn-oct-down');
  var btnOctUp = document.getElementById('btn-oct-up');

  // ── Helpers ────────────────────────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ── Canvas Setup ───────────────────────────────────────────────────
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    waveCanvas.width = waveCanvas.offsetWidth * dpr;
    waveCanvas.height = waveCanvas.offsetHeight * dpr;
    generateLandscape();
  }

  // ═══════════════════════════════════════════════════════════════════
  // LANDSCAPE GENERATION
  // ═══════════════════════════════════════════════════════════════════

  function generateLandscape() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    // Stars (cubic)
    stars = [];
    for (var i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.50,
        size: 1 + Math.random() * 2.5,
        twinkleSpeed: 0.005 + Math.random() * 0.015,
        twinklePhase: Math.random() * Math.PI * 2,
        brightness: 0.3 + Math.random() * 0.7
      });
    }

    // Trees (Minecraft-style — placed on terrain)
    treePositions = [];
    var numTrees = Math.floor(w / 45);
    for (var i = 0; i < numTrees; i++) {
      var layer = Math.floor(Math.random() * 3);
      treePositions.push({
        x: Math.floor(((i / numTrees) * w + (Math.random() - 0.5) * 30) / PX) * PX,
        height: 18 + Math.random() * 40,
        layer: layer
      });
    }
    treePositions.sort(function(a,b) { return a.layer - b.layer; });

    // Fireflies
    fireflies = [];
    for (var i = 0; i < 30; i++) {
      fireflies.push({
        x: Math.random() * w,
        y: h * 0.40 + Math.random() * h * 0.35,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.015,
        size: 1.5 + Math.random() * 1.5
      });
    }

    // Clouds
    generateClouds();
  }

  // ═══════════════════════════════════════════════════════════════════
  // PIANO BUILD
  // ═══════════════════════════════════════════════════════════════════

  function buildPiano() {
    pianoEl.innerHTML = '';
    var whiteKeys = [];

    // 2 octaves of white keys
    for (var oct = 0; oct < 2; oct++) {
      for (var i = 0; i < 7; i++) {
        var note = WHITE_NOTES[i];
        var o = octave + oct;
        var key = document.createElement('div');
        key.className = 'white-key';
        key.dataset.note = note;
        key.dataset.octave = o;

        var label = document.createElement('span');
        label.className = 'key-label';
        // Show keyboard hints on first octave
        var kbHints = ['A','S','D','F','G','H','J'];
        var kbHints2 = ['K','L',';','','','',''];
        label.textContent = oct === 0 ? kbHints[i] : (kbHints2[i] || '');
        key.appendChild(label);

        pianoEl.appendChild(key);
        whiteKeys.push(key);
      }
    }

    // Black keys
    for (var oct = 0; oct < 2; oct++) {
      for (var pos in BLACK_NOTES) {
        var i = parseInt(pos);
        var note = BLACK_NOTES[pos];
        var o = octave + oct;
        var key = document.createElement('div');
        key.className = 'black-key';
        key.dataset.note = note;
        key.dataset.octave = o;

        // Position relative to white keys
        var whiteIndex = oct * 7 + i;
        var leftOffset = whiteIndex * 39 + 26; // 38px + 1px margin
        key.style.left = leftOffset + 'px';

        pianoEl.appendChild(key);
      }
    }

    // Attach events
    var allKeys = pianoEl.querySelectorAll('.white-key, .black-key');
    allKeys.forEach(function(key) {
      key.addEventListener('mousedown', function(e) {
        e.preventDefault();
        playKey(this);
      });
      key.addEventListener('mouseup', function() {
        releaseKey(this);
      });
      key.addEventListener('mouseleave', function() {
        releaseKey(this);
      });
      key.addEventListener('mouseenter', function(e) {
        if (e.buttons === 1) playKey(this);
      });
      // Touch
      key.addEventListener('touchstart', function(e) {
        e.preventDefault();
        playKey(this);
      }, { passive: false });
      key.addEventListener('touchend', function(e) {
        e.preventDefault();
        releaseKey(this);
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PLAY / RELEASE NOTES
  // ═══════════════════════════════════════════════════════════════════

  function playKey(keyEl) {
    if (keyEl.classList.contains('active')) return;
    var note = keyEl.dataset.note;
    var o = parseInt(keyEl.dataset.octave);

    keyEl.classList.add('active');

    // Play note on track 0 (piano) — sustained until release
    var noteId = synth.playNoteByName(note, o, 0, 10);
    activeKeys[note + o] = noteId;
    totalNotes++;

    // Show note name
    showNote(note + o);

    // Spawn particles
    var rect = keyEl.getBoundingClientRect();
    spawnNoteParticles(rect.left + rect.width / 2, rect.top, note, o);
  }

  function releaseKey(keyEl) {
    if (!keyEl.classList.contains('active')) return;
    var note = keyEl.dataset.note;
    var o = parseInt(keyEl.dataset.octave);
    keyEl.classList.remove('active');

    var noteId = activeKeys[note + o];
    if (noteId !== undefined) {
      synth.stopNote(noteId);
      delete activeKeys[note + o];
    }
  }

  function playNoteAuto(note, o, duration, track) {
    track = track || 0;
    var noteId = synth.playNoteByName(note, o, track, duration);
    totalNotes++;

    // Find and flash the corresponding key
    var keyEl = pianoEl.querySelector('[data-note="' + note + '"][data-octave="' + o + '"]');
    if (keyEl) {
      keyEl.classList.add('active');
      setTimeout(function() { keyEl.classList.remove('active'); }, duration * 800);
    }

    // Particles from center-ish of piano
    var pianoRect = pianoEl.getBoundingClientRect();
    var xPos = pianoRect.left + Math.random() * pianoRect.width;
    spawnNoteParticles(xPos, pianoRect.top, note, o);

    showNote(note + o);
    return noteId;
  }

  function showNote(text) {
    noteDisplay.textContent = text;
    noteDisplay.style.opacity = 0.8;
    clearTimeout(showNote._timer);
    showNote._timer = setTimeout(function() { noteDisplay.style.opacity = 0; }, 1500);
  }

  // ═══════════════════════════════════════════════════════════════════
  // NOTE PARTICLES — firefly-like rising lights
  // ═══════════════════════════════════════════════════════════════════

  function spawnNoteParticles(x, y, note, o) {
    // Color based on note
    var noteColors = {
      'C':'#7eb8da','C#':'#6ea8ca','D':'#8ec8e0','D#':'#7eb8d0',
      'E':'#a8d8e8','F':'#e8c8a0','F#':'#d8b890',
      'G':'#c8d8a8','G#':'#b8c898','A':'#e8a87c','A#':'#d89870','B':'#c8b8d8'
    };
    var color = noteColors[note] || '#7eb8da';
    var count = 6 + Math.floor(Math.random() * 5);

    for (var i = 0; i < count; i++) {
      noteParticles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y,
        vx: (Math.random() - 0.5) * 1.0,
        vy: -0.6 - Math.random() * 1.8,
        life: 1.0,
        decay: 0.002 + Math.random() * 0.003,
        color: color,
        size: PX * (0.5 + Math.random() * 0.8),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.015 + Math.random() * 0.025
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // DREAM MODE — auto-generate C418-style melody
  // ═══════════════════════════════════════════════════════════════════

  function dreamTick() {
    if (!dreaming || !synth.initialized) return;

    dreamTimer++;

    // Chord changes every ~8 seconds (480 frames at 60fps)
    chordTimer++;
    if (chordTimer >= 480) {
      chordTimer = 0;
      chordIndex = (chordIndex + 1) % CHORDS.length;
      var chord = CHORDS[chordIndex];
      // Play pad chord
      for (var i = 0; i < chord.length; i++) {
        synth.playNoteByName(chord[i].n, chord[i].o, 1, 8.0);
      }
    }

    // Melody: play a note every ~90-180 frames (1.5-3 seconds)
    // C418 style = sparse, lots of silence
    var melodyInterval = 90 + Math.floor(Math.random() * 90);
    if (dreamTimer % melodyInterval === 0) {
      // Pick a note that's musically close to the last one
      var idx;
      if (lastMelodyIndex < 0) {
        idx = Math.floor(Math.random() * MELODY_NOTES.length);
      } else {
        // Step by 0-3 positions (prefer small intervals)
        var step = Math.floor(Math.random() * 4) - 1;
        idx = lastMelodyIndex + step;
        idx = Math.max(0, Math.min(idx, MELODY_NOTES.length - 1));
      }
      lastMelodyIndex = idx;

      var note = MELODY_NOTES[idx];
      var duration = 1.0 + Math.random() * 2.5;
      playNoteAuto(note.n, note.o, duration, 0);
    }

    // Occasional second voice (harmony) — every ~6-10 seconds
    if (dreamTimer % (360 + Math.floor(Math.random() * 240)) === 0) {
      var hIdx = Math.floor(Math.random() * MELODY_NOTES.length);
      var hNote = MELODY_NOTES[hIdx];
      playNoteAuto(hNote.n, hNote.o, 2.0 + Math.random() * 3.0, 0);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER — Minecraft-style cubic pixel landscape
  // ═══════════════════════════════════════════════════════════════════

  var PX = 6; // pixel block size
  var clouds = [];

  function generateClouds() {
    clouds = [];
    var w = window.innerWidth;
    for (var i = 0; i < 8; i++) {
      var cx = Math.random() * (w + 200) - 100;
      var cy = 40 + Math.random() * 80;
      var blocks = [];
      // Random cloud shape (3-6 blocks wide, 1-2 tall)
      var cw = 3 + Math.floor(Math.random() * 4);
      for (var bx = 0; bx < cw; bx++) {
        blocks.push({ x: bx, y: 0 });
        if (Math.random() > 0.4 && bx > 0 && bx < cw - 1) blocks.push({ x: bx, y: -1 });
        if (Math.random() > 0.7) blocks.push({ x: bx, y: 1 });
      }
      clouds.push({ x: cx, y: cy, blocks: blocks, speed: 0.08 + Math.random() * 0.12, size: 8 + Math.floor(Math.random() * 6) });
    }
  }

  // Stepped terrain height — returns block-snapped Y
  function terrainHeight(x, layer) {
    var h = window.innerHeight;
    var base, freq1, freq2, amp1, amp2;
    if (layer === 0) { base = h * 0.52; freq1 = 0.003; freq2 = 0.007; amp1 = 30; amp2 = 15; }
    else if (layer === 1) { base = h * 0.58; freq1 = 0.004; freq2 = 0.009; amp1 = 25; amp2 = 12; }
    else { base = h * 0.64; freq1 = 0.005; freq2 = 0.011; amp1 = 20; amp2 = 8; }
    var raw = base + Math.sin(x * freq1 + layer * 2) * amp1 + Math.sin(x * freq2 + layer * 5) * amp2;
    return Math.floor(raw / PX) * PX; // snap to grid
  }

  function render() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    // Sky gradient (smooth — only sky is non-pixel)
    var skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    skyGrad.addColorStop(0, '#060a14');
    skyGrad.addColorStop(0.3, '#0c0e22');
    skyGrad.addColorStop(0.6, '#151538');
    skyGrad.addColorStop(0.85, '#22184a');
    skyGrad.addColorStop(1, '#382060');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Pixel Moon ──
    drawMoon(w, h);

    // ── Cubic Stars ──
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.twinklePhase += s.twinkleSpeed;
      var alpha = s.brightness * (0.5 + Math.sin(s.twinklePhase) * 0.5);
      var sz = Math.max(PX * 0.4, Math.floor(s.size / PX * 2) * PX * 0.5);
      var sx = Math.floor(s.x / 2) * 2;
      var sy = Math.floor(s.y / 2) * 2;

      // Glow (subtle square)
      if (s.size > 1.2 && alpha > 0.4) {
        ctx.fillStyle = 'rgba(160,180,220,' + (alpha * 0.06) + ')';
        ctx.fillRect(sx - sz * 2, sy - sz * 2, sz * 5, sz * 5);
      }
      // Core pixel
      ctx.fillStyle = 'rgba(200,215,245,' + alpha + ')';
      ctx.fillRect(sx, sy, sz, sz);
      // Cross shape for bright stars
      if (s.size > 1.5 && alpha > 0.6) {
        ctx.fillStyle = 'rgba(220,230,255,' + (alpha * 0.4) + ')';
        ctx.fillRect(sx - sz, sy, sz, sz);
        ctx.fillRect(sx + sz, sy, sz, sz);
        ctx.fillRect(sx, sy - sz, sz, sz);
        ctx.fillRect(sx, sy + sz, sz, sz);
      }
    }

    // ── Clouds (blocky) ──
    drawClouds(w);

    // ── Terrain layers (far → near) ──
    drawBlockTerrain(w, h, 0, ['#12122a','#10102a','#0e0e28'], '#1a2a18', 0.35);
    drawBlockTerrain(w, h, 1, ['#0e0e24','#0c0c22','#0a0a20'], '#162816', 0.55);
    drawBlockTerrain(w, h, 2, ['#0a0a1e','#08081c','#06061a'], '#14261a', 0.8);

    // ── Trees on each layer ──
    drawBlockTrees(w, h);

    // ── Water reflection strip ──
    drawWater(w, h);

    // ── Fireflies (cubic) ──
    for (var i = 0; i < fireflies.length; i++) {
      var f = fireflies[i];
      f.phase += f.speed;
      f.x += f.vx + Math.sin(f.phase * 1.3) * 0.15;
      f.y += f.vy + Math.cos(f.phase) * 0.1;
      if (f.x < -10) f.x = w + 10;
      if (f.x > w + 10) f.x = -10;
      if (f.y < h * 0.35) f.vy += 0.008;
      if (f.y > h * 0.80) f.vy -= 0.008;
      f.vy *= 0.99;

      var glow = 0.3 + Math.sin(f.phase) * 0.5 + 0.2;
      var fx = Math.floor(f.x / 2) * 2;
      var fy = Math.floor(f.y / 2) * 2;
      // Glow
      ctx.fillStyle = 'rgba(220,200,100,' + (glow * 0.05) + ')';
      ctx.fillRect(fx - 8, fy - 8, 18, 18);
      // Core cube
      ctx.fillStyle = 'rgba(240,220,130,' + glow + ')';
      ctx.fillRect(fx, fy, 3, 3);
    }

    // ── Note Particles (cubic, rising) ──
    for (var i = noteParticles.length - 1; i >= 0; i--) {
      var p = noteParticles[i];
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * 0.4;
      p.y += p.vy;
      p.vy *= 0.996;
      p.life -= p.decay;

      if (p.life <= 0) { noteParticles.splice(i, 1); continue; }

      var px = Math.floor(p.x / PX) * PX;
      var py = Math.floor(p.y / PX) * PX;
      var ps = Math.max(2, Math.floor(p.size * p.life));

      // Glow square
      ctx.globalAlpha = p.life * 0.12;
      ctx.fillStyle = p.color;
      ctx.fillRect(px - ps * 2, py - ps * 2, ps * 5, ps * 5);
      // Core cube
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillStyle = p.color;
      ctx.fillRect(px, py, ps, ps);
      // Highlight pixel
      ctx.globalAlpha = p.life * 0.4;
      ctx.fillStyle = '#fff';
      ctx.fillRect(px, py, Math.ceil(ps / 2), Math.ceil(ps / 2));
      ctx.globalAlpha = 1;
    }
  }

  // ── Pixel Moon ────────────────────────────────────────────────────
  function drawMoon(w, h) {
    var moonX = w * 0.78;
    var moonY = h * 0.12;
    var bs = PX; // block size
    // Moon shape — circle made of blocks
    var moonR = 5; // radius in blocks
    for (var by = -moonR; by <= moonR; by++) {
      for (var bx = -moonR; bx <= moonR; bx++) {
        var dist = Math.sqrt(bx * bx + by * by);
        if (dist <= moonR) {
          // Crater shading
          var shade = 1 - dist / moonR * 0.3;
          var crater = (Math.sin(bx * 2.5 + by * 1.7) > 0.6) ? 0.7 : 1;
          var bright = Math.floor(200 * shade * crater);
          var g = Math.floor(195 * shade * crater);
          var b = Math.floor(160 * shade * crater);
          ctx.fillStyle = 'rgb(' + bright + ',' + g + ',' + b + ')';
          ctx.fillRect(moonX + bx * bs, moonY + by * bs, bs, bs);
        }
      }
    }
    // Moon glow
    ctx.fillStyle = 'rgba(200,190,150,0.03)';
    for (var r = 1; r < 5; r++) {
      ctx.fillRect(moonX - (moonR + r * 3) * bs, moonY - (moonR + r * 3) * bs,
                   (moonR * 2 + r * 6) * bs, (moonR * 2 + r * 6) * bs);
    }
  }

  // ── Blocky Clouds ─────────────────────────────────────────────────
  function drawClouds(w) {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += c.speed;
      if (c.x > w + 100) c.x = -c.blocks.length * c.size - 50;

      ctx.globalAlpha = 0.06;
      for (var j = 0; j < c.blocks.length; j++) {
        var b = c.blocks[j];
        ctx.fillStyle = '#8888aa';
        ctx.fillRect(c.x + b.x * c.size, c.y + b.y * c.size, c.size, c.size);
        // Top highlight
        ctx.fillStyle = '#9999bb';
        ctx.fillRect(c.x + b.x * c.size, c.y + b.y * c.size, c.size, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ── Block Terrain ─────────────────────────────────────────────────
  function drawBlockTerrain(w, h, layer, dirtColors, grassColor, opacity) {
    ctx.globalAlpha = opacity;
    var blockSize = layer === 0 ? PX * 1.5 : (layer === 1 ? PX * 1.2 : PX);

    for (var x = 0; x < w; x += blockSize) {
      var topY = terrainHeight(x, layer);

      // Grass block (top)
      ctx.fillStyle = grassColor;
      ctx.fillRect(x, topY, blockSize + 1, blockSize);
      // Grass highlight
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x, topY, blockSize + 1, 1);

      // Dirt blocks below
      var depth = h - topY;
      var numBlocks = Math.ceil(depth / blockSize);
      for (var d = 1; d < numBlocks; d++) {
        var dirtY = topY + d * blockSize;
        var ci = d < 3 ? 0 : (d < 6 ? 1 : 2);
        ctx.fillStyle = dirtColors[Math.min(ci, dirtColors.length - 1)];
        ctx.fillRect(x, dirtY, blockSize + 1, blockSize + 1);
        // Block edge shading
        if (d < 4) {
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.fillRect(x, dirtY + blockSize - 1, blockSize + 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // ── Block Trees (Minecraft-style) ─────────────────────────────────
  function drawBlockTrees(w, h) {
    for (var i = 0; i < treePositions.length; i++) {
      var t = treePositions[i];
      var baseY = terrainHeight(t.x, t.layer);
      var bs = t.layer === 0 ? PX * 1.5 : (t.layer === 1 ? PX * 1.2 : PX);

      ctx.globalAlpha = t.layer === 0 ? 0.35 : (t.layer === 1 ? 0.55 : 0.8);

      var trunkH = Math.floor(t.height / bs);
      var trunkColor = t.layer === 2 ? '#2a1a0e' : '#1a1208';
      var leafDark = t.layer === 2 ? '#0e3a0e' : '#0a2a0a';
      var leafLight = t.layer === 2 ? '#1a5a1a' : '#124212';

      // Trunk
      ctx.fillStyle = trunkColor;
      for (var ty = 0; ty < trunkH; ty++) {
        ctx.fillRect(t.x, baseY - (ty + 1) * bs, bs, bs);
      }
      // Trunk bark highlight
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (var ty = 0; ty < trunkH; ty++) {
        ctx.fillRect(t.x, baseY - (ty + 1) * bs, 1, bs);
      }

      // Leaves — cross/diamond shape
      var leafBase = baseY - trunkH * bs;
      var leafLayers = 3 + Math.floor(t.height / 25);

      for (var ly = 0; ly < leafLayers; ly++) {
        var span = Math.max(1, leafLayers - ly);
        for (var lx = -span; lx <= span; lx++) {
          // Skip corners for rounder shape
          if (Math.abs(lx) === span && ly === 0) continue;

          ctx.fillStyle = ((lx + ly) % 2 === 0) ? leafDark : leafLight;
          ctx.fillRect(t.x + lx * bs, leafBase - ly * bs, bs, bs);

          // Top highlight on topmost leaf blocks
          if (ly === leafLayers - 1 || (ly === leafLayers - 2 && Math.abs(lx) < span - 1)) {
            ctx.fillStyle = 'rgba(100,200,100,0.08)';
            ctx.fillRect(t.x + lx * bs, leafBase - ly * bs, bs, 1);
          }
        }
      }

      ctx.globalAlpha = 1;
    }
  }

  // ── Water strip ───────────────────────────────────────────────────
  function drawWater(w, h) {
    var waterY = h * 0.72;
    var waterH = h * 0.06;
    // Water base
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#0a1a30';
    ctx.fillRect(0, waterY, w, waterH);

    // Animated water surface blocks
    for (var x = 0; x < w; x += PX) {
      var shimmer = Math.sin(x * 0.05 + time * 0.03) * 0.5 + 0.5;
      ctx.fillStyle = 'rgba(80,140,200,' + (shimmer * 0.08) + ')';
      ctx.fillRect(x, waterY, PX, 2);

      // Reflection ripples
      if (Math.sin(x * 0.08 + time * 0.02) > 0.7) {
        ctx.fillStyle = 'rgba(120,180,220,0.05)';
        ctx.fillRect(x, waterY + PX * 2 + Math.sin(x * 0.03 + time * 0.01) * PX, PX * 3, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ── Waveform ───────────────────────────────────────────────────────
  function drawWaveform() {
    var dpr = window.devicePixelRatio || 1;
    var w = waveCanvas.width, h = waveCanvas.height;
    waveCtx.clearRect(0, 0, w, h);
    var data = synth.getWaveformData();
    if (!data) return;
    waveCtx.beginPath();
    waveCtx.strokeStyle = 'rgba(126,184,218,0.5)';
    waveCtx.lineWidth = 1 * dpr;
    var len = data.length, sliceW = w / len;
    for (var i = 0; i < len; i++) {
      var v = data[i] / 128.0, y = (v * h) / 2;
      if (i === 0) waveCtx.moveTo(0, y); else waveCtx.lineTo(i * sliceW, y);
    }
    waveCtx.stroke();
  }

  // ── Update ─────────────────────────────────────────────────────────
  function update() {
    time++;
    dreamTick();
    infoNotes.textContent = totalNotes;
    infoOctave.textContent = octave;
    infoMode.textContent = dreaming ? 'dream' : 'play';
  }

  // ── Main Loop ──────────────────────────────────────────────────────
  function loop() {
    requestAnimationFrame(loop);
    update();
    render();
    drawWaveform();
  }

  // ═══════════════════════════════════════════════════════════════════
  // KEYBOARD INPUT
  // ═══════════════════════════════════════════════════════════════════

  document.addEventListener('keydown', function(e) {
    if (!synth.initialized) return;
    if (e.repeat) return;
    var k = e.key.toLowerCase();

    if (KEYBOARD_MAP[k]) {
      e.preventDefault();
      var mapped = KEYBOARD_MAP[k];
      var note, o;
      if (mapped.endsWith('+')) {
        note = mapped.slice(0, -1);
        o = octave + 1;
      } else {
        note = mapped;
        o = octave;
      }
      var keyEl = pianoEl.querySelector('[data-note="' + note + '"][data-octave="' + o + '"]');
      if (keyEl && !keyEl.classList.contains('active')) {
        heldKeys[k] = keyEl;
        playKey(keyEl);
      }
    }
  });

  document.addEventListener('keyup', function(e) {
    var k = e.key.toLowerCase();
    if (heldKeys[k]) {
      releaseKey(heldKeys[k]);
      delete heldKeys[k];
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════════════════════════════

  btnDream.addEventListener('click', function() {
    dreaming = !dreaming;
    this.classList.toggle('active', dreaming);
    if (dreaming) {
      dreamTimer = 0;
      chordTimer = 470; // trigger chord soon
    }
  });

  btnOctDown.addEventListener('click', function() {
    if (octave > 2) { octave--; buildPiano(); }
  });

  btnOctUp.addEventListener('click', function() {
    if (octave < 6) { octave++; buildPiano(); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════

  initBtn.addEventListener('click', async function() {
    try {
      await synth.init();
      synth.setMasterVolume(0.55);

      // Track 0: Piano — warm, gentle, C418-like
      synth.loadInstrument('piano', 0);
      synth.updateEnvelope(0, {
        attack: 0.01,
        decay: 0.6,
        sustain: 0.15,
        release: 1.2  // Long reverb-like tail
      });
      synth.updateVibrato(0, { rate: 0, depth: 0 }); // No vibrato = clean
      synth.updateTrack(0, {
        filterEnabled: true,
        filterType: 'lowpass',
        filterCutoff: 5000,
        filterQ: 0.8,
        unisonVoices: 2,
        unisonDetune: 4,
        unisonSpread: 40,
        volume: 0.35
      });

      // Track 1: Ambient pad — slow, warm, evolving
      synth.loadInstrument('synthPad', 1);
      synth.updateEnvelope(1, {
        attack: 1.5,
        decay: 0.5,
        sustain: 0.6,
        release: 3.0
      });
      synth.updateVibrato(1, { rate: 1.5, depth: 3 });
      synth.updateTrack(1, {
        filterEnabled: true,
        filterType: 'lowpass',
        filterCutoff: 2800,
        filterQ: 1.2,
        volume: 0.12
      });

      // Track 2: Subtle bass support
      synth.loadInstrument('cello', 2);
      synth.updateEnvelope(2, {
        attack: 0.3,
        decay: 0.4,
        sustain: 0.5,
        release: 1.5
      });
      synth.updateTrack(2, {
        filterEnabled: true,
        filterType: 'lowpass',
        filterCutoff: 1500,
        filterQ: 0.5,
        volume: 0.08
      });

      overlay.classList.add('hidden');
      resize();
      buildPiano();

      // Start first chord
      chordTimer = 478;

      loop();
    } catch (e) {
      console.error('Init failed:', e);
      initBtn.textContent = 'Error — Retry';
    }
  });

  window.addEventListener('resize', function() {
    resize();
  });

})();
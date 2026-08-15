# CreativeCode.my — Living Visual DNA Engine & Generative Art Archive

> **Canonical System Identifier:** `cc-visual-dna`  
> **Methodology:** `Collect → Measure → Map → Generate → Mutate → Critique → Encode → Repeat`

---

## 1. System Overview
**CreativeCode.my** is a data-driven **Living Visual DNA Engine** and experimental generative digital art gallery. Rather than a static portfolio, it provides a computational feedback loop between visual taste archetypes and interactive generative code.

The system translates raw visual references (CRT neurology HUDs, 1984 raster displays, arcade coin-ops, silicon wafer defect maps, and astronomical spectrograms) into formal JSON Visual DNA manifests. These manifests drive interactive canvas engines with real-time parameter mutation, genetic cross-breeding, CRT optics post-processing, and procedural Web Audio synthesis.

---

## 2. Directory Architecture

```
11-creativcode.my/
├── index.html                           # Root Gallery & Laboratory Shell
├── server.js                            # High-speed ESM development server
├── package.json                         # Canonical configuration
├── dna/                                 # VISUAL DNA CANONICAL ENGINE
│   ├── manifest.json                    # Master DNA manifest (Colorways, Taxonomy, Formulas)
│   ├── schemas/                         # JSON Schema specifications
│   │   └── visual-dna.schema.json
│   ├── references/                      # Formalized Reference Manifests
│   │   ├── ref-01-compulsive-hud.json   # 3D Wireframe Neurology HUD
│   │   ├── ref-02-windows-84.json       # 1984 Phosphor CRT Display
│   │   ├── ref-03-atari-84.json         # Prismatic Rainbow Coin-Op
│   │   ├── ref-04-cosmic-dispersion.json# Deep Cosmic Dispersion
│   │   └── ref-05-silicon-yield.json    # Wafer Defect & Silicon Geometry
│   └── engine/                          # DNA Mutation, Palettes, Audio & Optics
│       ├── DnaEngine.js                 # Mutation seed & genetic cross-breeding
│       ├── Colorways.js                 # Color palette interpolation & CSS injector
│       ├── SoundSynth.js                # Web Audio procedural soundscape & drone
│       └── CrtPostProcess.js            # CRT scanlines, bloom & chromatic shift
├── projects/                            # CANONICAL GENERATIVE ARTWORKS
│   ├── index.js                         # Master Projects catalog & DNA bindings
│   ├── compulsive-neurology-hud/        # 3D Wireframe Cranial Scan & Telemetry HUD
│   ├── windows84-raster/                # 1984 Phosphor Raster CRT
│   ├── atari84-spectrum/                # Prismatic Rainbow Raster Coin-Op
│   ├── webgl-fluid-simulation/          # Navier-Stokes Fluid Physics Engine
│   ├── morphing-cyber-lattice/          # 3D Morphing Kinetic Manifold
│   ├── hopffibration/                   # 4D Hopf Fibration (S³ → S²)
│   ├── geometry-in-flux/                # SDF Raymarched Geometric Solids
│   ├── quantumlotus/                    # Quantum Harmonic Probability Petals
│   ├── bioelectric/                     # Bioelectric Neural Membrane
│   ├── cosmos-inmotion/                 # Gravitational N-Body Particle System
│   ├── magma-particle/                  # Thermal Magma Convection Dynamics
│   ├── opposing-forces/                 # Sonic Collision Particle Physics
│   ├── chromarad-isotope-matrix/        # Chromarad // Isotope Matrix (15 Styles + MP4/GIF Export)
│   ├── interactive-p5-wave-grid/        # Phosphor Waveform Matrix
│   ├── interactive-webgl-neon-ripple/   # Liquid Neon Refraction Shader
│   ├── mediterranean-drift/             # Volumetric Atmospheric Raymarch
│   ├── retro-noise/                     # Multiscale Scanline Perlin Noise
│   ├── loading-bar-cyberpunk/           # Cyberpunk Telemetry Loading Matrix
│   ├── cyberpunk-retro-crt/             # Curved Glass Bezel CRT Terminal
│   ├── echo-of-aria/                    # Harmonic Spectrogram Visualizer
│   ├── gsap-inertia-audio/              # Inertial 3D Audio Frequency Sphere
│   ├── ambient-chiptune/                # Generative 8-Bit Chiptune Synth
│   ├── quiet-worlds-piano/              # Generative Ambient Piano & Pixels
│   ├── xylophone/                       # WebGL Glass Resonator Chimes
│   ├── inkdrum/                         # Fluid Ink Dispersion & Drums
│   └── false-earth/                     # Procedural Planetary Terrain
└── src/                                 # APPLICATION UI & LAB SYSTEM
    ├── main.js                          # Coordinator entrypoint
    ├── styles/
    │   ├── theme.css                    # Design tokens & colorway variables
    │   ├── crt.css                      # CRT scanlines & phosphor bloom
    │   ├── hud.css                      # Telemetry HUD, clock & status bars
    │   └── gallery.css                  # Living gallery & mutation studio
    ├── components/
    │   ├── Header.js                    # Telemetry header, oscilloscope, audio
    │   ├── GalleryGrid.js               # Filterable living matrix
    │   ├── StudioViewport.js            # Fullscreen canvas lab & mutation drawer
    │   ├── DnaTasteMap.js               # Visual DNA knowledge taxonomy
    │   └── ManifestoModal.js            # 8-step methodology documentation
    └── utils/
        └── stats.js                     # Real-time FPS & frame timing telemetry
```

---

## 3. Quick Start & Execution

Start the local development server:

```bash
# Option 1: Native Node Server
node server.js

# Option 2: Python 3
python3 -m http.server 8080
```

Open your browser at `http://localhost:8080`.

---

## 4. Key Interactive Features

1. **Living Gallery Grid**: Filter 26+ interactive generative artworks by category (`CRT Telemetry`, `Vector & Math`, `Fluid & Shaders`, `Audio & Synth`, `Particle Systems`, `Raster & 8-Bit`), search tags, or switch global DNA colorways in real time.
2. **Mutation Studio**: Click **LAUNCH STUDIO** on any experiment to enter the fullscreen immersive canvas with live DNA chromosome sliders, mutation seed generation, genetic cross-breeding, CRT optics controllers, high-res snapshot capture, and JSON export.
3. **DNA Taste Map**: Visual interactive taxonomy connecting visual reference archetypes to mathematical formulations and live generative shaders.
4. **CRT Optics Stack**: Toggle hardware scanlines, chromatic aberration, phosphor bloom, curvature, and screen flicker on any screen.
5. **Procedural Web Audio Engine**: Integrated ambient generative drone synthesis with interactive UI sound blips and real-time header oscilloscope telemetry.

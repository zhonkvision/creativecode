/**
 * CreativeCode.my — Living Generative Projects Registry & Visual DNA Catalog
 */

/**
 * @typedef {Object} ProjectMeta
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string[]} tags
 * @property {string} dnaRef
 * @property {string} entry
 * @property {string} description
 * @property {string} [mathModel]
 * @property {Object} parameters
 */

export const PROJECTS = [
  {
    id: "compulsive-neurology-hud",
    name: "Compulsive Cyber-Neurology HUD",
    category: "CRT Telemetry",
    tags: ["3D Wireframe", "Telemetry", "CRT", "Oscilloscope", "Medical HUD"],
    dnaRef: "ref-01-compulsive-hud",
    entry: "./projects/compulsive-neurology-hud/index.html",
    description: "Retro-futuristic 3D wireframe head scan split in perspective with live telemetry, waveform oscilloscope, toxic mentality silhouette scanner, and horizon grid.",
    mathModel: "Spherical Oval Morphing & Perspective Projection: P(x,y) = C + V / (1 + z/d)",
    parameters: {
      headRotationSpeed: { value: 1.2, min: 0.1, max: 5.0, step: 0.1, label: "Lattice Spin Rate" },
      meshDivision: { value: 24, min: 8, max: 48, step: 2, label: "Wireframe Density" },
      toxicRatio: { value: 0.68, min: 0.0, max: 1.0, step: 0.01, label: "Mental Voltage Bias" },
      waveFrequency: { value: 4.5, min: 1.0, max: 20.0, step: 0.5, label: "Oscilloscope Harmonics" },
      perspectiveDepth: { value: 450, min: 100, max: 1000, step: 10, label: "Z-Focal Plane" }
    }
  },
  {
    id: "windows84-raster",
    name: "Microsoft Windows 84 Phosphor CRT",
    category: "Raster & 8-Bit",
    tags: ["CRT Scanlines", "Phosphor", "Retro 80s", "Chromatic Aberration"],
    dnaRef: "ref-02-windows-84",
    entry: "./projects/windows84-raster/index.html",
    description: "Authentic 1984 cathode-ray tube raster display with RGB chromatic shift, phosphor scanlines, Japanese subtext, and retro boot telemetry.",
    mathModel: "Phosphor Slat Slicing & RGB Fringe: I(x, y) = S(y % p) * (1 - |x-x0|/w)",
    parameters: {
      rasterBarCount: { value: 36, min: 10, max: 80, step: 2, label: "Phosphor Raster Lines" },
      rgbOffset: { value: 3.8, min: 0, max: 12.0, step: 0.2, label: "RGB Fringe Delta" },
      loadProgress: { value: 64, min: 0, max: 100, step: 1, label: "Boot Sequence Index" },
      scanlineSpeed: { value: 0.8, min: 0.0, max: 4.0, step: 0.1, label: "Vertical Refresh Pulse" }
    }
  },
  {
    id: "atari84-spectrum",
    name: "ATARI 84 Prismatic Coin-Op",
    category: "Raster & 8-Bit",
    tags: ["Arcade", "Spectrum", "Chiptune", "Coin-Op", "Vector Slat"],
    dnaRef: "ref-03-atari-84",
    entry: "./projects/atari84-spectrum/index.html",
    description: "Rainbow phosphor spectrum slats rasterized into the Atari vector icon with interactive 8-bit coin-op audio synthesis and beam animations.",
    mathModel: "Exponential Flare Outward Curvature: x(y) = x0 ± y^{2.2} * k",
    parameters: {
      spectrumShift: { value: 1.5, min: 0.0, max: 10.0, step: 0.1, label: "Color Cycle Rate" },
      rasterGlow: { value: 0.75, min: 0.1, max: 1.0, step: 0.05, label: "Phosphor Intensity" },
      coinBlinkRate: { value: 2.0, min: 0.5, max: 8.0, step: 0.5, label: "Coin Op Prompt Blink" },
      beamWidth: { value: 18, min: 4, max: 40, step: 1, label: "Vector Slat Width" }
    }
  },
  {
    id: "webgl-fluid-simulation",
    name: "WebGL Fluid Simulation Engine",
    category: "Fluid & Shaders",
    tags: ["WebGL", "Navier-Stokes", "Fluid Dynamics", "GPU Shaders", "Interactive"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/webgl-fluid-simulation/index.html",
    description: "High-performance GPU Navier-Stokes fluid physics simulation with real-time dye advection, pressure Poisson solver, and bloom lighting.",
    mathModel: "Incompressible Navier-Stokes: ∂u/∂t + (u·∇)u = -(1/ρ)∇p + ν∇²u + f",
    parameters: {
      simResolution: { value: 128, min: 32, max: 512, step: 32, label: "Grid Density" },
      densityDissipation: { value: 0.98, min: 0.8, max: 0.999, step: 0.005, label: "Dye Persistence" },
      velocityDissipation: { value: 0.96, min: 0.8, max: 0.999, step: 0.005, label: "Velocity Decay" },
      pressure: { value: 0.8, min: 0.1, max: 1.0, step: 0.05, label: "Pressure Iterations" },
      curl: { value: 25, min: 0, max: 60, step: 1, label: "Vorticity Confinement" }
    }
  },
  {
    id: "morphing-cyber-lattice",
    name: "Morphing Cyber Lattice",
    category: "Vector & Math",
    tags: ["3D Mesh", "Topology", "Wireframe", "Kinetic"],
    dnaRef: "ref-01-compulsive-hud",
    entry: "./projects/morphing-cyber-lattice/index.html",
    description: "Deforming 3D topological manifold lattice with synchronized vertex wave oscillators and vector depth shading.",
    mathModel: "Harmonic Toroidal Deformation: z = sin(x*k + ωt) * cos(y*k - ωt)",
    parameters: {
      latticeSize: { value: 24, min: 8, max: 64, step: 2, label: "Grid Resolution" },
      waveAmplitude: { value: 45, min: 5, max: 120, step: 5, label: "Displacement Amp" },
      morphSpeed: { value: 1.0, min: 0.1, max: 4.0, step: 0.1, label: "Oscillation Rate" }
    }
  },
  {
    id: "hopffibration",
    name: "4D Hopf Fibration Projection",
    category: "Vector & Math",
    tags: ["4D Geometry", "Hopf Map", "Torus Knot", "Hypersphere"],
    dnaRef: "ref-05-silicon-yield",
    entry: "./projects/hopffibration/index.html",
    description: "Stereographic projection of the 3-sphere S³ into ℝ³ via the Hopf fibration map, forming nested Villarceau circles and fiber bundles.",
    mathModel: "Hopf Map S³ → S²: (η₁, η₂, η₃) = (2Re(z₀z̄₁), 2Im(z₀z̄₁), |z₀|² - |z₁|²)",
    parameters: {
      fiberCount: { value: 48, min: 12, max: 180, step: 6, label: "Fiber Count" },
      rotation4DSpeed: { value: 0.8, min: 0.1, max: 3.0, step: 0.1, label: "4D SO(4) Rotation" },
      torusRadius: { value: 180, min: 50, max: 400, step: 10, label: "Major Radius R" }
    }
  },
  {
    id: "geometry-in-flux",
    name: "Geometry in Flux",
    category: "Vector & Math",
    tags: ["Raymarching", "SDF", "Morphing", "Topological"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/geometry-in-flux/index.html",
    description: "Signed Distance Field (SDF) raymarching of morphing Platonic and Archimedean geometric solids in dynamic transition.",
    mathModel: "SDF Smooth Minimum Blend: smin(a, b, k) = -ln(e^{-ka} + e^{-kb}) / k",
    parameters: {
      polyMorphRate: { value: 0.5, min: 0.1, max: 2.0, step: 0.05, label: "Morph Rate" },
      raySteps: { value: 64, min: 16, max: 128, step: 8, label: "Raymarch Precision" },
      specularGlow: { value: 0.85, min: 0.1, max: 1.5, step: 0.05, label: "Specular Bloom" }
    }
  },
  {
    id: "quantumlotus",
    name: "Quantum Lotus Orbital Wavefunction",
    category: "Vector & Math",
    tags: ["Sacred Geometry", "Quantum", "Harmonics", "Vector"],
    dnaRef: "ref-05-silicon-yield",
    entry: "./projects/quantumlotus/index.html",
    description: "Quantum harmonic oscillator probability density distributions projected as glowing sacred lotus petals.",
    mathModel: "Spherical Harmonics: Y_l^m(θ, φ) = P_l^m(cos θ) * e^{i m φ}",
    parameters: {
      petalHarmonics: { value: 8, min: 3, max: 24, step: 1, label: "Petal Symmetry" },
      orbitalDecay: { value: 0.42, min: 0.1, max: 0.95, step: 0.01, label: "Wavefunction Decay" },
      spinRate: { value: 1.2, min: 0.1, max: 5.0, step: 0.1, label: "Quantum Spin" }
    }
  },
  {
    id: "bioelectric",
    name: "Bioelectric Neural Membrane",
    category: "Fluid & Shaders",
    tags: ["Membrane", "Action Potential", "Cellular", "Bio-telemetry"],
    dnaRef: "ref-01-compulsive-hud",
    entry: "./projects/bioelectric/index.html",
    description: "Hodgkin-Huxley ionic conductance and membrane voltage propagation simulation across a bioelectric neural lattice.",
    mathModel: "Hodgkin-Huxley: C_m (dV/dt) = I - g_Na m³h(V - E_Na) - g_K n⁴(V - E_K)",
    parameters: {
      voltageBias: { value: -65, min: -90, max: 40, step: 1, label: "Membrane Potential (mV)" },
      ionDiffusion: { value: 1.4, min: 0.2, max: 4.0, step: 0.1, label: "Ion Channel Permeability" },
      spikeThreshold: { value: -55, min: -75, max: -30, step: 1, label: "Action Potential Threshold" }
    }
  },
  {
    id: "cosmos-inmotion",
    name: "Cosmos in Motion N-Body Gravitation",
    category: "Particle Systems",
    tags: ["N-Body", "Astrophysics", "Particle Field", "Gravitation"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/cosmos-inmotion/index.html",
    description: "Gravitational N-body astrophysical particle swarm simulating galaxy accretion discs and stellar orbital decay.",
    mathModel: "Newtonian Gravity Matrix: F_{ij} = G * (m_i m_j / (|r_{ij}|² + ε²)) * r̂_{ij}",
    parameters: {
      starCount: { value: 1200, min: 200, max: 5000, step: 100, label: "Star Count" },
      gravitationalConstant: { value: 0.65, min: 0.05, max: 2.5, step: 0.05, label: "G Constant" },
      softeningFactor: { value: 15, min: 2, max: 50, step: 1, label: "Core Softening ε" }
    }
  },
  {
    id: "magma-particle",
    name: "Magma Thermal Particle Dynamics",
    category: "Particle Systems",
    tags: ["Thermal Convection", "Magma", "Particles", "Viscosity"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/magma-particle/index.html",
    description: "High-temperature thermodynamic particle field featuring Rayleigh-Bénard thermal convection plumes.",
    mathModel: "Thermal Convection: ∂T/∂t + u·∇T = α∇²T + Q",
    parameters: {
      magmaTemp: { value: 1250, min: 600, max: 2200, step: 50, label: "Core Temperature (°C)" },
      viscosity: { value: 0.85, min: 0.1, max: 1.0, step: 0.05, label: "Magma Viscosity" },
      buoyancyForce: { value: 2.2, min: 0.5, max: 6.0, step: 0.1, label: "Convection Updraft" }
    }
  },
  {
    id: "opposing-forces",
    name: "Opposing Forces Sonic Collision",
    category: "Particle Systems",
    tags: ["Collision Physics", "Audio Reactive", "Vectors", "Kinetic"],
    dnaRef: "ref-01-compulsive-hud",
    entry: "./projects/opposing-forces/index.html",
    description: "Counter-propagating particle shockwaves colliding at high velocity with acoustic frequency resonance.",
    mathModel: "Elastic Collision Momentum: m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'",
    parameters: {
      collisionEnergy: { value: 85, min: 10, max: 200, step: 5, label: "Shock Velocity" },
      particleDamping: { value: 0.98, min: 0.85, max: 0.999, step: 0.005, label: "Kinetic Damping" },
      sonicModulation: { value: 1.5, min: 0.2, max: 4.0, step: 0.1, label: "Acoustic Coupling" }
    }
  },
  {
    id: "chromarad-isotope-matrix",
    name: "Chromarad // Isotope Matrix",
    category: "Particle Systems",
    tags: ["Radiation", "Grain", "Stochastic Noise", "Photon Field", "Isotope"],
    dnaRef: "ref-05-silicon-yield",
    entry: "./projects/chromarad-isotope-matrix/index.html",
    description: "Experimental radial isotope matrix with 15 styles, Original Colour retention, full Colour Editor, pre-adjustments, MP4/GIF export, and batch processing.",
    mathModel: "Poisson Radiation Process: P(k events in time t) = (λt)^k e^{-λt} / k!",
    parameters: {
      emissionFlux: { value: 450, min: 50, max: 2000, step: 50, label: "Radiation Flux (cpm)" },
      grainScattering: { value: 0.65, min: 0.1, max: 1.0, step: 0.05, label: "Grain Scattering" }
    }
  },
  {
    id: "interactive-p5-wave-grid",
    name: "Interactive Phosphor Wave Grid",
    category: "Fluid & Shaders",
    tags: ["p5.js", "Waveform", "Phosphor Glow", "Interactive Grid"],
    dnaRef: "ref-02-windows-84",
    entry: "./projects/interactive-p5-wave-grid/index.html",
    description: "Reactive 2D wave grid with cursor ripple excitation, phosphor bloom lingering, and customizable damping.",
    mathModel: "2D Wave Equation: ∂²u/∂t² = c² (∂²u/∂x² + ∂²u/∂y²) - γ (∂u/∂t)",
    parameters: {
      waveSpeed: { value: 1.2, min: 0.2, max: 3.0, step: 0.1, label: "Propagation Speed c" },
      gridSpacing: { value: 20, min: 8, max: 50, step: 2, label: "Matrix Mesh Pitch" },
      phosphorDecay: { value: 0.94, min: 0.8, max: 0.99, step: 0.01, label: "Phosphor Afterglow" }
    }
  },
  {
    id: "interactive-webgl-neon-ripple",
    name: "Interactive Neon Ripple Shader",
    category: "Fluid & Shaders",
    tags: ["WebGL", "Neon", "Ripple", "Fragment Shader"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/interactive-webgl-neon-ripple/index.html",
    description: "Multi-pass liquid refraction shader with chromatic aberration, neon edge detection, and caustic highlights.",
    mathModel: "Refractive Snell Surface: n₁ sin θ₁ = n₂ sin θ₂",
    parameters: {
      rippleIntensity: { value: 2.5, min: 0.5, max: 6.0, step: 0.1, label: "Refraction Amplitude" },
      chromaDispersion: { value: 0.035, min: 0.005, max: 0.1, step: 0.005, label: "Spectral Fringe" }
    }
  },
  {
    id: "mediterranean-drift",
    name: "Mediterranean Drift Volumetric Shader",
    category: "Fluid & Shaders",
    tags: ["Volumetric", "Raymarch", "Atmosphere", "Drift"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/mediterranean-drift/index.html",
    description: "Atmospheric volumetric density rendering with light ray scattering and slow wind vector drift.",
    mathModel: "Beer-Lambert Light Attenuation: I = I₀ * e^{-σ_t ∫ ρ(s) ds}",
    parameters: {
      cloudDensity: { value: 0.45, min: 0.1, max: 1.0, step: 0.05, label: "Volumetric Density" },
      windVelocity: { value: 0.8, min: 0.1, max: 3.0, step: 0.1, label: "Wind Advection" }
    }
  },
  {
    id: "retro-noise",
    name: "ZHONK Stepped Raster Display",
    category: "Raster & 8-Bit",
    tags: ["ZHONK", "Stepped Raster", "Scanlines", "Retro CRT", "Texture Synth"],
    dnaRef: "ref-02-windows-84",
    entry: "./projects/retro-noise/index.html",
    description: "ZHONK // Stepped raster phosphor typography and analog CRT displacement experiment.",
    mathModel: "Fractional Brownian Motion: fbm(p) = ∑_{i=0}^{octaves} A_i * noise(2^i * p)",
    parameters: {
      zhonk_word: { type: "text", default: "ZHONK", value: "ZHONK", label: "ZHONK Word" },
      zhonk_intensity: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: "ZHONK Intensity" },
      zhonk_frequency: { value: 1.0, min: 0.1, max: 2.5, step: 0.1, label: "ZHONK Frequency" }
    }
  },
  {
    id: "loading-bar-cyberpunk",
    name: "Cyberpunk Telemetry Loading Matrix",
    category: "CRT Telemetry",
    tags: ["CSS Only", "Cyberpunk", "Telemetry", "Loading Bar", "HUD"],
    dnaRef: "ref-01-compulsive-hud",
    entry: "./projects/loading-bar-cyberpunk/index.html",
    description: "Pure-CSS cyberpunk segment display with glowing phosphor progress indices and terminal borders.",
    mathModel: "Segment Quantization: S_k = ⌊(progress / 100) * totalSegments⌋",
    parameters: {
      cycleSpeed: { value: 1.5, min: 0.5, max: 4.0, step: 0.1, label: "Cycle Speed" },
      glowIntensity: { value: 1.0, min: 0.2, max: 2.0, step: 0.1, label: "Phosphor Glow" }
    }
  },
  {
    id: "cyberpunk-retro-crt",
    name: "ZHONKCRT Stepped Raster Phosphor Display",
    category: "Stepped Raster",
    tags: ["ZHONKCRT", "CRT Terminal", "Stepped Raster", "Scanlines", "HUD Matrix"],
    dnaRef: "ref-02-windows-84",
    entry: "./projects/cyberpunk-retro-crt/index.html",
    description: "ZHONKCRT // Stepped raster phosphor beam display and scanline CRT simulation.",
    mathModel: "CRT Barrel Distortion: (u', v') = (u, v) * (1 + k(u² + v²))",
    parameters: {
      speed: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: "Beam Scan Rate" },
      intensity: { value: 1.0, min: 0.1, max: 2.0, step: 0.1, label: "Phosphor Intensity" }
    }
  },
  {
    id: "echo-of-aria",
    name: "Echo of Aria Harmonic Visualizer",
    category: "Audio & Synth",
    tags: ["Audio Reactive", "Harmonics", "Spectrogram", "Particles"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/echo-of-aria/index.html",
    description: "Harmonic audio spectrogram visualizer converting frequencies into radiant spectral ribbon waves.",
    mathModel: "FFT Spectral Bin Decomposition: S_f = |∑ x(t) e^{-i 2π f t} dt|",
    parameters: {
      harmonicGain: { value: 1.6, min: 0.5, max: 4.0, step: 0.1, label: "Acoustic Gain" },
      ribbonCount: { value: 16, min: 4, max: 32, step: 2, label: "Harmonic Strands" }
    }
  },
  {
    id: "gsap-inertia-audio",
    name: "GSAP Three.js Inertia Audio Visualizer",
    category: "Audio & Synth",
    tags: ["Three.js", "GSAP", "Audio Reactive", "Inertia Sphere"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/gsap-inertia-audio/index.html",
    description: "3D geodesic frequency sphere driven by Three.js and GSAP with smooth inertial spring physics.",
    mathModel: "Inertial Spring Damper: m ẍ + c ẋ + k x = F_{audio}(t)",
    parameters: {
      sphereRadius: { value: 120, min: 40, max: 240, step: 10, label: "Sphere Radius" },
      springTension: { value: 0.65, min: 0.1, max: 1.0, step: 0.05, label: "Spring Elasticity" }
    }
  },
  {
    id: "ambient-chiptune",
    name: "Ambient Chiptune Synthesizer Engine",
    category: "Audio & Synth",
    tags: ["Chiptune", "8-Bit Synth", "Generative Sound", "Soundscape"],
    dnaRef: "ref-03-atari-84",
    entry: "./projects/ambient-chiptune/index.html",
    description: "Generative 8-bit chiptune soundscape engine generating endless ambient melodies and starry constellations.",
    mathModel: "Pentatonic Markov Note Generator: P(N_{t+1} | N_t) = M_{ij}",
    parameters: {
      density: { value: 4, min: 1, max: 10, step: 1, label: "Note Density" },
      volume: { value: 50, min: 0, max: 100, step: 5, label: "Master Gain" }
    }
  },
  {
    id: "quiet-worlds-piano",
    name: "Quiet Worlds Ambient Pixel Piano",
    category: "Audio & Synth",
    tags: ["Piano", "Ambient", "Pixel Art", "Generative C418"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/quiet-worlds-piano/index.html",
    description: "Peaceful generative ambient piano synthesizer with calming harmonic progressions and pixel particles.",
    mathModel: "Generative Harmonic Progression: Chord(t) = Tonic + ScaleDeg((t * 7) % 5)",
    parameters: {
      tempo: { value: 48, min: 20, max: 120, step: 4, label: "BPM Tempo" },
      reverbWet: { value: 0.65, min: 0.1, max: 0.95, step: 0.05, label: "Reverb Space" }
    }
  },
  {
    id: "xylophone",
    name: "WebGL Chromatic Resonator Xylophone",
    category: "Audio & Synth",
    tags: ["Three.js", "WebGL", "Web Audio", "Glass Refraction"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/xylophone/src/index.html",
    description: "Interactive WebGL scrolling helix of frosted glass resonator bars that chime melodically as the cursor sweeps.",
    mathModel: "Bar Resonant Frequency: f_n = (v / (2L)) * β_n²",
    parameters: {
      barCount: { value: 36, min: 12, max: 64, step: 4, label: "Resonator Bars" },
      sweepSensitivity: { value: 1.2, min: 0.2, max: 3.0, step: 0.1, label: "Sweep Sensitivity" }
    }
  },
  {
    id: "inkdrum",
    name: "Inkdrum Fluid Dispersion Synthesizer",
    category: "Fluid & Shaders",
    tags: ["Fluid", "Ink", "Acoustic Drum", "Simulation"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/inkdrum/index.html",
    description: "Simulated ink droplet diffusion across porous paper coupled with procedural percussion synth triggers.",
    mathModel: "Radial Diffusion & Permeability: ∂C/∂t = D ∇²C + Source(r, θ)",
    parameters: {
      inkDiffusionRate: { value: 0.8, min: 0.1, max: 2.0, step: 0.05, label: "Diffusion Coefficient" },
      bleedIntensity: { value: 1.4, min: 0.2, max: 3.0, step: 0.1, label: "Bleed Spread" }
    }
  },
  {
    id: "false-earth",
    name: "False Earth Procedural Planetary Terrain",
    category: "Vector & Math",
    tags: ["Three.js", "Voxel", "Terrain", "Planetary"],
    dnaRef: "ref-04-cosmic-dispersion",
    entry: "./projects/false-earth/index.html",
    description: "Procedural planetary voxel terrain with raymarched clouds, orbital telemetry, and real-time atmospheric shaders.",
    mathModel: "Spherical Heightmap Displacement: R(θ, φ) = R₀ + fbm(rot(θ, φ) * f)",
    parameters: {
      terrainElevation: { value: 1.2, min: 0.2, max: 3.0, step: 0.1, label: "Mountain Altitude" },
      cloudSpeed: { value: 0.5, min: 0.05, max: 2.0, step: 0.05, label: "Cloud Rotation" }
    }
  }
];

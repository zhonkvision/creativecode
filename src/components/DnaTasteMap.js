/**
 * CreativeCode.my — Visual DNA Taste Map & Architectural Graph Component
 */
import { COLORWAYS } from "../../dna/engine/Colorways.js";
import { PROJECTS } from "../../projects/index.js";
import { soundSynth } from "../../dna/engine/SoundSynth.js";

export class DnaTasteMapComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <section class="dna-map-view" id="dnaMapView">
        <div style="margin-bottom: 24px; border-bottom: 1px solid var(--dna-border); padding-bottom: 16px;">
          <h2 style="font-size: 28px; font-family: var(--font-display); color: #ffffff; letter-spacing: 0.1em;">
            VISUAL DNA TASTE ENGINE & KNOWLEDGE TAXONOMY
          </h2>
          <p style="font-size: 13px; color: var(--dna-text-muted);">
            Structural mapping of raw aesthetic references &rarr; mathematical formulations &rarr; live generative canvas shaders.
          </p>
        </div>

        <div class="tree-container">
          <!-- 1. Archetype References -->
          <div class="tree-node-card">
            <div class="tree-node-header" style="color: #00f0a0;">01. VISUAL DNA ARCHETYPES</div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12px;">
              <div style="border-left: 2px solid #00f0a0; padding-left: 8px;">
                <strong style="color: #ffffff;">REF-01 : Compulsive Neurology HUD</strong><br>
                <span>3D Wireframe Cranial Scan, Oscilloscope Waves, Medical Telemetry</span>
              </div>
              <div style="border-left: 2px solid #00ff66; padding-left: 8px;">
                <strong style="color: #ffffff;">REF-02 : Windows 84 Phosphor CRT</strong><br>
                <span>Raster Slicing, RGB Chromatic Aberration, Green Terminal Frame</span>
              </div>
              <div style="border-left: 2px solid #ff3366; padding-left: 8px;">
                <strong style="color: #ffffff;">REF-03 : Atari 84 Prismatic Coin-Op</strong><br>
                <span>Rainbow Phosphor Slat Flare, Coin-op HUD, 8-Bit Web Audio</span>
              </div>
              <div style="border-left: 2px solid #00ffff; padding-left: 8px;">
                <strong style="color: #ffffff;">REF-04 : Deep Cosmic Dispersion</strong><br>
                <span>N-body Gravity, Prismatic Refraction, Volumetric Drift</span>
              </div>
              <div style="border-left: 2px solid #ffaa00; padding-left: 8px;">
                <strong style="color: #ffffff;">REF-05 : Silicon Yield & Wafer HUD</strong><br>
                <span>Die Defect Poisson Process, Microchip Vector Lattices</span>
              </div>
            </div>
          </div>

          <!-- 2. Mathematical Kernels -->
          <div class="tree-node-card">
            <div class="tree-node-header" style="color: #ff2a55;">02. MATHEMATICAL ENCODING</div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 11px; font-family: var(--font-code);">
              <div style="background: #040608; border: 1px solid var(--dna-border); padding: 8px;">
                <strong style="color: #ffffff;">Navier-Stokes Equation</strong><br>
                <span style="color: #00e5ff;">∂u/∂t + (u·∇)u = -(1/ρ)∇p + ν∇²u + f</span>
              </div>
              <div style="background: #040608; border: 1px solid var(--dna-border); padding: 8px;">
                <strong style="color: #ffffff;">Hopf Fibration Projection</strong><br>
                <span style="color: #00e5ff;">S³ → S² : (2Re(z₀z̄₁), 2Im(z₀z̄₁), |z₀|² - |z₁|²)</span>
              </div>
              <div style="background: #040608; border: 1px solid var(--dna-border); padding: 8px;">
                <strong style="color: #ffffff;">3D Simplex Gradient Noise</strong><br>
                <span style="color: #00e5ff;">N(p) = ∑ w_i (g_i · d_i), w_i = max(0, 0.6 - |d_i|²)⁴</span>
              </div>
              <div style="background: #040608; border: 1px solid var(--dna-border); padding: 8px;">
                <strong style="color: #ffffff;">Fast Fourier Transform (FFT)</strong><br>
                <span style="color: #00e5ff;">X_k = ∑ x_n e^{-i 2π k n / N}</span>
              </div>
            </div>
          </div>

          <!-- 3. Active Colorways Chromosomes -->
          <div class="tree-node-card">
            <div class="tree-node-header" style="color: #00e5ff;">03. COLORWAY CHROMOSOMES</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${Object.values(COLORWAYS)
                .map(
                  (cw) => `
                <div style="border: 1px solid var(--dna-border); padding: 8px; background: rgba(0,0,0,0.3);">
                  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                    <strong style="color: ${cw.primary};">${cw.name}</strong>
                    <span style="color: var(--dna-text-muted); font-size: 10px;">${cw.id}</span>
                  </div>
                  <div style="display: flex; height: 16px; border: 1px solid #1a2634;">
                    ${cw.spectrum
                      .map(
                        (col) => `
                      <div style="flex: 1; background: ${col};" title="${col}"></div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- 4. Living Artworks Links -->
          <div class="tree-node-card">
            <div class="tree-node-header" style="color: #ffaa00;">04. LINKED GENERATIVE ARTWORKS</div>
            <div style="display: flex; flex-direction: column; gap: 6px; max-height: 380px; overflow-y: auto;">
              ${PROJECTS.map(
                (p) => `
                <div class="map-artwork-node" data-id="${p.id}" style="border: 1px solid var(--dna-border); padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.15s;">
                  <span style="font-size: 12px; color: #ffffff;">${p.name}</span>
                  <span style="font-size: 10px; color: var(--dna-primary);">${p.category}</span>
                </div>
              `
              ).join("")}
            </div>
          </div>
        </div>
      </section>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll(".map-artwork-node").forEach((node) => {
      node.addEventListener("mouseenter", () => {
        node.style.borderColor = "var(--dna-primary)";
        node.style.background = "rgba(0, 240, 160, 0.08)";
      });
      node.addEventListener("mouseleave", () => {
        node.style.borderColor = "var(--dna-border)";
        node.style.background = "transparent";
      });
      node.addEventListener("click", () => {
        const id = node.getAttribute("data-id");
        const p = PROJECTS.find((item) => item.id === id);
        if (p && this.options.onLaunchStudio) {
          this.options.onLaunchStudio(p);
        }
      });
    });
  }

  show() {
    const el = document.getElementById("dnaMapView");
    if (el) el.classList.add("active");
  }

  hide() {
    const el = document.getElementById("dnaMapView");
    if (el) el.classList.remove("active");
  }
}

/**
 * CreativeCode.my — Architectural Methodology Manifesto Component
 */

export class ManifestoModalComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <section class="dna-map-view" id="manifestoView">
        <div style="max-width: 1000px; margin: 0 auto; border: 1px solid var(--dna-border); background: var(--dna-bg-subtle); padding: 30px;">
          <h2 style="font-family: var(--font-display); font-size: 38px; color: #ffffff; letter-spacing: 0.12em; margin-bottom: 12px;">
            CREATIVECODE.MY ARCHITECTURAL PHILOSOPHY
          </h2>
          <div style="font-size: 14px; color: var(--dna-primary); letter-spacing: 0.15em; margin-bottom: 24px; border-bottom: 1px solid var(--dna-border); padding-bottom: 12px;">
            THE LIVING TASTE ENGINE METHODOLOGY
          </div>

          <div style="display: flex; flex-direction: column; gap: 20px; font-size: 13px; line-height: 1.6;">
            <div>
              <strong style="color: #ffffff; font-size: 16px;">01. COLLECT</strong>
              <p style="color: var(--dna-text-muted);">
                Scan and ingest raw visual archetypes across computing history: retro-futuristic CRT neurology HUDs, 1984 raster displays, arcade coin-op vector icons, semiconductor wafer yield matrices, and astronomical spectrograms.
              </p>
            </div>

            <div>
              <strong style="color: #ffffff; font-size: 16px;">02. MEASURE</strong>
              <p style="color: var(--dna-text-muted);">
                Deconstruct raw visual artifacts into quantifiable metrics: color palettes (HSL/Hex), phosphor scanline densities, RGB chromatic fringe delta, aspect ratios, typography tracking, and grid subdivision pitches.
              </p>
            </div>

            <div>
              <strong style="color: #ffffff; font-size: 16px;">03. MAP</strong>
              <p style="color: var(--dna-text-muted);">
                Formalize empirical measurements into strict JSON Visual DNA schemas (<code>/dna/schemas/visual-dna.schema.json</code>) and canonical reference manifests (<code>/dna/references/</code>).
              </p>
            </div>

            <div>
              <strong style="color: #ffffff; font-size: 16px;">04. GENERATE</strong>
              <p style="color: var(--dna-text-muted);">
                Bind Visual DNA definitions to real-time interactive canvas engines, WebGL fragment shaders, Three.js 3D manifolds, Navier-Stokes fluid simulations, and Web Audio procedural synthesizers.
              </p>
            </div>

            <div>
              <strong style="color: #ffffff; font-size: 16px;">05. MUTATE</strong>
              <p style="color: var(--dna-text-muted);">
                Expose live chromosome parameters to real-time stochastic variation, deterministic seed hashing (<code>0xHEX</code>), and genetic cross-breeding across disparate generative artworks.
              </p>
            </div>

            <div>
              <strong style="color: #ffffff; font-size: 16px;">06. CRITIQUE</strong>
              <p style="color: var(--dna-text-muted);">
                Audit generated forms for typographic balance, visual tension, 60 FPS GPU performance, and phosphor bloom resonance.
              </p>
            </div>

            <div>
              <strong style="color: #ffffff; font-size: 16px;">07. ENCODE</strong>
              <p style="color: var(--dna-text-muted);">
                Serialize optimal generative states into versioned, shareable Visual DNA chromosome JSON bundles for instant replay and distribution.
              </p>
            </div>

            <div>
              <strong style="color: #ffffff; font-size: 16px;">08. REPEAT</strong>
              <p style="color: var(--dna-text-muted);">
                The generative archive lives as an eternal feedback loop between archival taste and synthetic algorithmic evolution.
              </p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  show() {
    const el = document.getElementById("manifestoView");
    if (el) el.classList.add("active");
  }

  hide() {
    const el = document.getElementById("manifestoView");
    if (el) el.classList.remove("active");
  }
}

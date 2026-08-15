/**
 * CreativeCode.my — Fullscreen Studio Viewport & Hot Mutation Drawer Component
 */
import { crtEngine } from "../../dna/engine/CrtPostProcess.js";
import { soundSynth } from "../../dna/engine/SoundSynth.js";
import { PROJECTS } from "../../projects/index.js";

export class StudioViewportComponent {
  constructor(container, dnaEngine, options = {}) {
    this.container = container;
    this.dnaEngine = dnaEngine;
    this.options = options;
    this.currentProject = null;
    this.currentParameters = {};
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="studio-modal" id="studioModal">
        <!-- Studio Header -->
        <header class="studio-header">
          <div class="studio-title-block">
            <button class="btn-secondary" id="closeStudioBtn">&larr; BACK TO GALLERY</button>
            <div class="studio-title" id="studioProjectTitle">PROJECT LAB</div>
            <span class="dna-badge" id="studioCategoryBadge">CRT TELEMETRY</span>
          </div>

          <div class="studio-actions">
            <button class="btn-secondary" id="crossBreedBtn">&#9858; CROSS-BREED DNA</button>
            <button class="btn-primary" id="mutateDnaBtn">&#9889; MUTATE SEED</button>
            <button class="btn-secondary" id="snapshotBtn">&#128247; SNAPSHOT</button>
            <button class="btn-secondary" id="copyDnaBtn">&#128203; COPY DNA</button>
          </div>
        </header>

        <!-- Studio Body -->
        <div class="studio-body">
          <!-- Canvas Viewport -->
          <div class="studio-viewport-area" id="studioViewportArea">
            <div class="crt-vignette"></div>
            <iframe class="studio-iframe" id="studioIframe" sandbox="allow-scripts allow-same-origin allow-downloads"></iframe>
            
            <div class="studio-telemetry-hud-overlay">
              <div>GEN: <span id="studioGenCount" style="color: var(--dna-primary);">1</span></div>
              <div>SEED: <span id="studioSeedVal" style="color: var(--dna-secondary);">0x4F8A91B2</span></div>
              <div>REF: <span id="studioRefVal" style="color: var(--dna-accent);">ref-01</span></div>
            </div>
          </div>

          <!-- Mutation Drawer -->
          <aside class="studio-drawer">
            <!-- Section 1: Dynamic DNA Parameters -->
            <div class="drawer-section">
              <div class="drawer-section-title">
                <span>DNA CHROMOSOMES</span>
                <span style="font-size: 10px; color: var(--dna-text-muted);">HOT-RELOAD</span>
              </div>
              <div id="paramSlidersContainer">
                <!-- Dynamically populated -->
              </div>
            </div>

            <!-- Section 2: Mathematical Foundation -->
            <div class="drawer-section">
              <div class="drawer-section-title">
                <span>MATHEMATICAL MODEL</span>
              </div>
              <div class="math-formula-box" id="studioMathBox">
                ∂u/∂t + (u·∇)u = -(1/ρ)∇p + ν∇²u + f
              </div>
            </div>

            <!-- Section 3: CRT Post-Processing Optics -->
            <div class="drawer-section">
              <div class="drawer-section-title">
                <span>CRT OPTICS STACK</span>
              </div>
              <div class="param-slider-group">
                <div class="param-label-row">
                  <span>Scanline Density</span>
                  <span id="crtScanVal">75%</span>
                </div>
                <input type="range" id="crtScanSlider" min="0" max="1" step="0.05" value="0.75" />
              </div>

              <div class="param-slider-group">
                <div class="param-label-row">
                  <span>Phosphor Bloom</span>
                  <span id="crtBloomVal">50%</span>
                </div>
                <input type="range" id="crtBloomSlider" min="0" max="1" step="0.05" value="0.5" />
              </div>

              <div class="param-slider-group">
                <div class="param-label-row">
                  <span>RGB Chromatic Shift</span>
                  <span id="crtChromaVal">35%</span>
                </div>
                <input type="range" id="crtChromaSlider" min="0" max="1" step="0.05" value="0.35" />
              </div>

              <div class="param-slider-group">
                <div class="param-label-row">
                  <span>Curved Glass Bezel</span>
                  <span id="crtCurvVal">15%</span>
                </div>
                <input type="range" id="crtCurvSlider" min="0" max="1" step="0.05" value="0.15" />
              </div>
            </div>

            <!-- Section 4: Live DNA JSON Chromosome -->
            <div class="drawer-section">
              <div class="drawer-section-title">
                <span>EXPORT MANIFEST</span>
              </div>
              <pre class="dna-code-block" id="studioDnaCode"></pre>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const modal = document.getElementById("studioModal");
    const closeBtn = document.getElementById("closeStudioBtn");
    closeBtn.addEventListener("click", () => {
      this.close();
    });

    // Mutate Seed Button
    document.getElementById("mutateDnaBtn").addEventListener("click", () => {
      if (!this.currentProject) return;
      this.currentParameters = this.dnaEngine.mutateParameters(
        this.currentProject.parameters,
        this.currentParameters,
        0.5
      );
      this.syncParametersToIframe();
      this.renderParamSliders();
      this.updateJsonBlock();
    });

    // Cross-Breed DNA
    document.getElementById("crossBreedBtn").addEventListener("click", () => {
      if (!this.currentProject) return;
      const other = PROJECTS[Math.floor(Math.random() * PROJECTS.length)];
      const blended = this.dnaEngine.crossBreed(
        this.currentParameters,
        Object.fromEntries(
          Object.entries(other.parameters).map(([k, v]) => [k, v.value])
        )
      );
      this.currentParameters = blended;
      this.syncParametersToIframe();
      this.renderParamSliders();
      this.updateJsonBlock();
    });

    // Copy DNA
    document.getElementById("copyDnaBtn").addEventListener("click", () => {
      const json = this.dnaEngine.exportDnaJson(
        this.currentProject,
        this.currentParameters
      );
      navigator.clipboard.writeText(json).then(() => {
        soundSynth.playBeep(1400, 0.08, "triangle");
        const btn = document.getElementById("copyDnaBtn");
        btn.innerText = "✓ COPIED JSON";
        setTimeout(() => (btn.innerText = "📋 COPY DNA"), 1800);
      });
    });

    // Snapshot
    document.getElementById("snapshotBtn").addEventListener("click", () => {
      soundSynth.playClick();
      alert(`SNAPSHOT RECORDED FOR [${this.currentProject.name}] WITH SEED: ${this.dnaEngine.currentSeed}`);
    });

    // CRT Optics Sliders
    const setupCrtSlider = (id, valId, key, format = (v) => `${Math.round(v * 100)}%`) => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(valId);
      el.addEventListener("input", (e) => {
        const num = parseFloat(e.target.value);
        valEl.innerText = format(num);
        crtEngine.apply(document.getElementById("studioViewportArea"), {
          [key]: num
        });
      });
    };

    setupCrtSlider("crtScanSlider", "crtScanVal", "scanlines");
    setupCrtSlider("crtBloomSlider", "crtBloomVal", "bloom");
    setupCrtSlider("crtChromaSlider", "crtChromaVal", "chromaticAberration");
    setupCrtSlider("crtCurvSlider", "crtCurvVal", "curvature");
  }

  open(project) {
    this.currentProject = project;
    this.currentParameters = Object.fromEntries(
      Object.entries(project.parameters).map(([k, v]) => [k, v.value])
    );

    document.getElementById("studioProjectTitle").innerText = project.name;
    document.getElementById("studioCategoryBadge").innerText = project.category;
    document.getElementById("studioRefVal").innerText = project.dnaRef;
    document.getElementById("studioMathBox").innerText =
      project.mathModel || "f(x, y, t) = λ * noise(x, y) + cos(ω t)";

    const iframe = document.getElementById("studioIframe");
    iframe.src = project.entry;

    this.renderParamSliders();
    this.updateTelemetryHud();
    this.updateJsonBlock();

    const modal = document.getElementById("studioModal");
    modal.classList.add("open");
    soundSynth.playBeep(720, 0.08, "triangle");
  }

  close() {
    const modal = document.getElementById("studioModal");
    modal.classList.remove("open");
    const iframe = document.getElementById("studioIframe");
    iframe.src = "about:blank";
    soundSynth.playClick();
  }

  renderParamSliders() {
    const container = document.getElementById("paramSlidersContainer");
    if (!container || !this.currentProject) return;

    container.innerHTML = Object.entries(this.currentProject.parameters)
      .map(([key, def]) => {
        const curVal =
          this.currentParameters[key] !== undefined
            ? this.currentParameters[key]
            : def.value;
        return `
        <div class="param-slider-group">
          <div class="param-label-row">
            <span>${def.label}</span>
            <span id="param_val_${key}">${curVal}</span>
          </div>
          <input 
            type="range" 
            id="param_input_${key}" 
            data-key="${key}"
            min="${def.min}" 
            max="${def.max}" 
            step="${def.step}" 
            value="${curVal}"
          />
        </div>
      `;
      })
      .join("");

    // Bind slider events
    container.querySelectorAll("input[type='range']").forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const key = slider.getAttribute("data-key");
        const val = parseFloat(e.target.value);
        this.currentParameters[key] = val;
        const valSpan = document.getElementById(`param_val_${key}`);
        if (valSpan) valSpan.innerText = val;
        this.syncParametersToIframe();
        this.updateJsonBlock();
      });
    });
  }

  syncParametersToIframe() {
    const iframe = document.getElementById("studioIframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "DNA_MUTATION",
          seed: this.dnaEngine.currentSeed,
          generation: this.dnaEngine.generation,
          parameters: this.currentParameters
        },
        "*"
      );
    }
  }

  updateTelemetryHud() {
    document.getElementById("studioGenCount").innerText = this.dnaEngine.generation;
    document.getElementById("studioSeedVal").innerText = this.dnaEngine.currentSeed;
  }

  updateJsonBlock() {
    const block = document.getElementById("studioDnaCode");
    if (block && this.currentProject) {
      block.innerText = this.dnaEngine.exportDnaJson(
        this.currentProject,
        this.currentParameters
      );
    }
    this.updateTelemetryHud();
  }
}

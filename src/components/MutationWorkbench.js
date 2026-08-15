/**
 * CreativeCode Visual DNA — Mutation Workbench Component (Universal Runner & Iframe Support)
 */
import { audioEngine } from '../engine/audio.js';

export class MutationWorkbench {
  /**
   * @param {HTMLElement} container
   * @param {Object} projectConfig
   * @param {Object} [options]
   * @param {import('../engine/runner.js').ExperimentRunner} [options.runner]
   * @param {HTMLIFrameElement} [options.iframe]
   */
  constructor(container, projectConfig, options = {}) {
    this.container = container;
    this.config = projectConfig;
    this.runner = options.runner || null;
    this.iframe = options.iframe || null;
    this.parameters = { ...this.getDefaultParameters() };
    this.seed = projectConfig.metadata?.seed || '0x4A2F8B';
    this.render();
  }

  getDefaultParameters() {
    const defaults = {};
    if (this.config.parameters) {
      for (const [key, meta] of Object.entries(this.config.parameters)) {
        defaults[key] = meta.default;
      }
    }
    return defaults;
  }

  render() {
    this.container.innerHTML = `
      <div class="drawer-block">
        <div class="drawer-block-title">
          <span>PARAM MUTATION</span>
          <span style="font-size: 9px; color: var(--muted-telemetry);">LIVE-BIND</span>
        </div>
        <div id="workbenchParamsList"></div>
      </div>

      <div class="drawer-block">
        <div class="drawer-block-title">
          <span>SEED & CHROMOSOME</span>
        </div>
        <div style="font-size: 11px; margin-bottom: 8px;">
          ACTIVE SEED: <strong id="workbenchActiveSeed" style="color: var(--phosphor-green);">${this.seed}</strong>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="sys-btn sys-btn-primary" id="btnMutateSeed">⚡ MUTATE SEED</button>
          <button class="sys-btn" id="btnResetParams">↺ RESET PARAMS</button>
          <button class="sys-btn" id="btnExportJson">📋 EXPORT JSON</button>
        </div>
      </div>

      <div class="drawer-block">
        <div class="drawer-block-title">
          <span>DNA LINEAGE</span>
        </div>
        <div style="font-size: 10px; color: var(--muted-telemetry); line-height: 1.5;">
          CHANNEL: <strong style="color: var(--phosphor-cyan);">${this.config.visualDNA_channel || 'CH-01'}</strong><br>
          LINEAGE REF: <strong style="color: var(--mono-white);">${this.config.metadata?.lineage || 'REF-001'}</strong><br>
          STATUS: <strong style="color: var(--phosphor-green);">${this.config.metadata?.status || 'OPERATIONAL'}</strong>
        </div>
      </div>
    `;

    this.renderSliders();
    this.bindButtons();
  }

  renderSliders() {
    const list = this.container.querySelector('#workbenchParamsList');
    if (!list || !this.config.parameters) return;

    list.innerHTML = Object.entries(this.config.parameters).map(([key, meta]) => {
      const currentVal = this.parameters[key] !== undefined ? this.parameters[key] : meta.default;

      if (meta.type === 'select') {
        return `
          <div class="param-row">
            <div class="param-meta">
              <span class="param-name">${key}</span>
            </div>
            <select class="param-select" data-key="${key}">
              ${meta.options.map(opt => `<option value="${opt}" ${opt === currentVal ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>
          </div>
        `;
      }

      if (meta.type === 'text') {
        return `
          <div class="param-row">
            <div class="param-meta">
              <span class="param-name">${key}</span>
            </div>
            <input 
              type="text" 
              class="param-text-input" 
              data-key="${key}"
              value="${currentVal}"
              placeholder="Enter custom word..."
              style="background: var(--void-black); border: 1px solid var(--border-wire); color: var(--phosphor-green); font-family: var(--font-mono); font-size: 11px; padding: 5px 8px; outline: none; width: 100%;"
            />
          </div>
        `;
      }

      return `
        <div class="param-row">
          <div class="param-meta">
            <span class="param-name">${key}</span>
            <span class="param-num" id="val_disp_${key}">${currentVal}</span>
          </div>
          <input 
            type="range" 
            class="param-slider" 
            data-key="${key}"
            min="${meta.min}" 
            max="${meta.max}" 
            step="${meta.step}" 
            value="${currentVal}"
          />
        </div>
      `;
    }).join('');

    // Event binding
    list.querySelectorAll('.param-text-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const key = input.getAttribute('data-key');
        this.parameters[key] = e.target.value;
        this.syncParameters();
        audioEngine.playHover();
      });
    });

    list.querySelectorAll('.param-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const key = slider.getAttribute('data-key');
        const num = parseFloat(e.target.value);
        this.parameters[key] = num;
        this.syncParameters();
        const disp = this.container.querySelector(`#val_disp_${key}`);
        if (disp) disp.innerText = num;
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 1;
        audioEngine.playSlider((num - min) / (max - min || 1));
      });
    });

    list.querySelectorAll('.param-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const key = select.getAttribute('data-key');
        this.parameters[key] = e.target.value;
        this.syncParameters();
        audioEngine.playSelect();
      });
    });
  }

  syncParameters() {
    if (this.runner) {
      this.runner.setParameters(this.parameters);
    }
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage({
        type: 'DNA_MUTATION',
        seed: this.seed,
        parameters: this.parameters
      }, '*');
    }
  }

  bindButtons() {
    const mutateBtn = this.container.querySelector('#btnMutateSeed');
    mutateBtn.addEventListener('mouseenter', () => audioEngine.playHover());
    mutateBtn.addEventListener('click', () => {
      audioEngine.playClick();
      this.seed = '0x' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
      if (this.runner) {
        this.runner.setSeed(this.seed);
      }
      this.syncParameters();
      const seedEl = this.container.querySelector('#workbenchActiveSeed');
      if (seedEl) seedEl.innerText = this.seed;
    });

    const resetBtn = this.container.querySelector('#btnResetParams');
    resetBtn.addEventListener('mouseenter', () => audioEngine.playHover());
    resetBtn.addEventListener('click', () => {
      audioEngine.playClick();
      this.parameters = this.getDefaultParameters();
      if (this.runner) {
        this.runner.setParameters(this.parameters);
      }
      this.syncParameters();
      this.renderSliders();
    });

    const exportBtn = this.container.querySelector('#btnExportJson');
    exportBtn.addEventListener('mouseenter', () => audioEngine.playHover());
    exportBtn.addEventListener('click', () => {
      audioEngine.playSelect();
      const payload = {
        experiment: this.config.id,
        slug: this.config.slug,
        seed: this.seed,
        parameters: this.parameters,
        timestamp: new Date().toISOString()
      };
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
        exportBtn.innerText = '✓ COPIED';
        setTimeout(() => (exportBtn.innerText = '📋 EXPORT JSON'), 1800);
      });
    });
  }
}

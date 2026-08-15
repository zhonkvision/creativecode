/**
 * CreativeCode Visual DNA — Mutation Workbench Component (Universal Runner & Iframe Support)
 * Featuring Individual Illuminated Mechanical Circuit Switches for Every Parameter (OFF by default)
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
    this.paramToggles = { ...this.getDefaultToggles() };
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

  getDefaultToggles() {
    const toggles = {};
    if (this.config.parameters) {
      for (const key of Object.keys(this.config.parameters)) {
        toggles[key] = false; // All parameters OFF by default
      }
    }
    return toggles;
  }

  render() {
    this.container.innerHTML = `
      <div class="drawer-block">
        <div class="drawer-block-title">
          <span>PARAM MUTATION & TOGGLES</span>
          <div style="display: flex; gap: 4px;">
            <button class="bulk-switch-btn" id="btnEngageAll" title="Enable all parameter toggles">⚡ ENGAGE ALL</button>
            <button class="bulk-switch-btn" id="btnBypassAll" title="Bypass all parameter toggles">✕ BYPASS ALL</button>
          </div>
        </div>
        <div id="workbenchParamsList"></div>
      </div>

      <div class="drawer-block">
        <div class="drawer-block-title">
          <span>SEED & CHROMOSOME</span>
        </div>
        <div style="font-size: 11px; margin-bottom: 8px;">
          ACTIVE SEED: <strong id="workbenchActiveSeed" style="color: var(--signal-red);">${this.seed}</strong>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="sys-btn sys-btn-primary" id="btnMutateSeed">⚡ MUTATE SEED</button>
          <button class="sys-btn" id="btnResetParams">↺ RESET PARAMS</button>
          <button class="sys-btn" id="btnExportJson">📋 EXPORT JSON</button>
        </div>
      </div>

      <div class="drawer-block">
        <div class="drawer-block-title">
          <span>ENGINE & DNA LINEAGE</span>
        </div>
        <div style="font-size: 10px; color: var(--muted-telemetry); line-height: 1.6;">
          ENGINE: <strong style="color: var(--mono-white);">${this.config.technology || 'WebGL / Canvas / Interactive'}</strong><br>
          YEAR: <strong style="color: var(--mono-white);">${this.config.year || '2026'}</strong><br>
          RENDER: <strong style="color: var(--mono-white);">60 FPS (HW ACCEL)</strong><br>
          CHANNEL: <strong style="color: var(--signal-red);">${this.config.visualDNA_channel || 'CH-01'}</strong><br>
          LINEAGE REF: <strong style="color: var(--mono-white);">${this.config.metadata?.lineage || 'REF-001'}</strong><br>
          STATUS: <strong style="color: var(--signal-red);">${this.config.metadata?.status || 'OPERATIONAL'}</strong>
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
      const isToggled = !!this.paramToggles[key];

      if (meta.type === 'select') {
        return `
          <div class="param-row ${isToggled ? 'param-active' : 'param-bypassed'}" id="paramRow_${key}">
            <div class="param-meta">
              <div class="param-name-cluster">
                <span class="param-name" title="${key}">${meta.label || key}</span>
              </div>
              <button class="param-toggle-node ${isToggled ? 'node-on' : 'node-off'}" data-key="${key}" title="Toggle ${key} ON/OFF">
                <span class="node-led"></span>
                <span class="node-state">${isToggled ? '[ ON ]' : '[ OFF ]'}</span>
              </button>
            </div>
            <div class="param-input-wrap ${isToggled ? '' : 'is-bypassed'}">
              <select class="param-select" data-key="${key}">
                ${meta.options.map(opt => `<option value="${opt}" ${opt === currentVal ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
            </div>
          </div>
        `;
      }

      if (meta.type === 'text' || meta.type === 'string') {
        return `
          <div class="param-row ${isToggled ? 'param-active' : 'param-bypassed'}" id="paramRow_${key}">
            <div class="param-meta">
              <div class="param-name-cluster">
                <span class="param-name" title="${key}">${meta.label || key}</span>
              </div>
              <button class="param-toggle-node ${isToggled ? 'node-on' : 'node-off'}" data-key="${key}" title="Toggle ${key} ON/OFF">
                <span class="node-led"></span>
                <span class="node-state">${isToggled ? '[ ON ]' : '[ OFF ]'}</span>
              </button>
            </div>
            <div class="param-input-wrap ${isToggled ? '' : 'is-bypassed'}">
              <input 
                type="text" 
                class="param-text-input" 
                data-key="${key}"
                value="${currentVal}"
                placeholder="Enter custom word..."
                style="background: var(--void-black); border: 1px solid var(--border-wire); color: var(--mono-white); font-family: var(--font-mono); font-size: 11px; padding: 5px 8px; outline: none; width: 100%;"
              />
            </div>
          </div>
        `;
      }

      return `
        <div class="param-row ${isToggled ? 'param-active' : 'param-bypassed'}" id="paramRow_${key}">
          <div class="param-meta">
            <div class="param-name-cluster">
              <span class="param-name" title="${key}">${meta.label || key}</span>
            </div>
            <button class="param-toggle-node ${isToggled ? 'node-on' : 'node-off'}" data-key="${key}" title="Toggle ${key} ON/OFF">
              <span class="node-led"></span>
              <span class="node-state">${isToggled ? '[ ON ]' : '[ OFF ]'}</span>
            </button>
            <span class="param-num" id="val_disp_${key}">${currentVal}</span>
          </div>
          <div class="param-input-wrap ${isToggled ? '' : 'is-bypassed'}">
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
        </div>
      `;
    }).join('');

    // Toggle Button Event Bindings
    list.querySelectorAll('.param-toggle-node').forEach(toggleBtn => {
      toggleBtn.addEventListener('mouseenter', () => audioEngine.playHover());
      toggleBtn.addEventListener('click', () => {
        const key = toggleBtn.getAttribute('data-key');
        const newState = !this.paramToggles[key];
        this.paramToggles[key] = newState;

        if (newState) {
          audioEngine.playSelect();
        } else {
          audioEngine.playClick();
        }

        // Update Row UI
        const row = this.container.querySelector(`#paramRow_${key}`);
        if (row) {
          row.classList.toggle('param-active', newState);
          row.classList.toggle('param-bypassed', !newState);
          
          toggleBtn.classList.toggle('node-on', newState);
          toggleBtn.classList.toggle('node-off', !newState);
          const stateSpan = toggleBtn.querySelector('.node-state');
          if (stateSpan) stateSpan.innerText = newState ? '[ ON ]' : '[ OFF ]';

          const inputWrap = row.querySelector('.param-input-wrap');
          if (inputWrap) inputWrap.classList.toggle('is-bypassed', !newState);
        }

        this.syncParameters();
      });
    });

    // Input Event Bindings
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
      this.runner.setParameters(this.parameters, this.paramToggles);
    }
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage({
        type: 'DNA_MUTATION',
        seed: this.seed,
        parameters: this.parameters,
        toggles: this.paramToggles,
        enabled: this.paramToggles
      }, '*');
    }
  }

  bindButtons() {
    // Bulk Switch: Engage All
    const btnEngageAll = this.container.querySelector('#btnEngageAll');
    if (btnEngageAll) {
      btnEngageAll.addEventListener('click', () => {
        audioEngine.playSelect();
        for (const key of Object.keys(this.paramToggles)) {
          this.paramToggles[key] = true;
        }
        this.renderSliders();
        this.syncParameters();
      });
    }

    // Bulk Switch: Bypass All
    const btnBypassAll = this.container.querySelector('#btnBypassAll');
    if (btnBypassAll) {
      btnBypassAll.addEventListener('click', () => {
        audioEngine.playClick();
        for (const key of Object.keys(this.paramToggles)) {
          this.paramToggles[key] = false;
        }
        this.renderSliders();
        this.syncParameters();
      });
    }

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
      this.paramToggles = this.getDefaultToggles(); // Reset all toggles to OFF
      if (this.runner) {
        this.runner.setParameters(this.parameters, this.paramToggles);
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
        toggles: this.paramToggles,
        timestamp: new Date().toISOString()
      };
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
        exportBtn.innerText = '✓ COPIED';
        setTimeout(() => (exportBtn.innerText = '📋 EXPORT JSON'), 1800);
      });
    });
  }
}

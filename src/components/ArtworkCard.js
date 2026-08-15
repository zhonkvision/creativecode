/**
 * CreativeCode Visual DNA — Artwork Specimen Card Component (Universal Module & HTML/WebGL Support)
 */
import { gpuManager } from '../engine/gpu-manager.js';

export class ArtworkCard {
  /**
   * @param {Object} projectConfig
   * @param {Function} onInspect
   */
  constructor(projectConfig, onInspect) {
    this.config = projectConfig;
    this.onInspect = onInspect;
    this.element = null;
    this.runner = null;
    this.canvas = null;
    this.iframe = null;
  }

  async render() {
    this.element = document.createElement('article');
    this.element.className = 'specimen-card';
    this.element.setAttribute('data-id', this.config.id);
    this.element.setAttribute('data-channel', this.config.visualDNA_channel || '');
    this.element.setAttribute('data-category', this.config.category || '');

    const isModule = this.config.entryType === 'module';
    const videoSrc = this.config.metadata?.video || (this.config.slug === 'chromarad-isotope-matrix' ? '/projects/chromarad-isotope-matrix/assets/tcozVqT9HvYsu.mp4' : null);
    const previewSrc = this.config.metadata?.preview ? this.config.metadata.preview.replace(/^\.\//, '/') : '';
    const entrySrc = this.config.entryPoint.replace(/^\.\//, '/');

    this.element.innerHTML = `
      <div class="card-viewport-stage">
        ${videoSrc
          ? `<video class="card-canvas card-video-preview" src="${videoSrc.replace(/^\.\//, '/')}" autoplay loop muted playsinline poster="${previewSrc}" style="width:100%; height:100%; object-fit:cover; border:none;"></video>`
          : (isModule 
            ? `<canvas class="card-canvas"></canvas>` 
            : `<iframe class="card-canvas" src="${entrySrc}" loading="lazy" sandbox="allow-scripts allow-same-origin" style="border:none; pointer-events:none;"></iframe>`
          )
        }
        <div class="card-telemetry-badge-strip">
          <span class="tech-tag">${this.config.technology || 'Procedural'}</span>
          <span class="dna-channel-tag">${this.config.visualDNA_channel || 'CH-01'}</span>
        </div>
      </div>

      <div class="card-body">
        <div class="card-header-row">
          <h2 class="card-title">${this.config.title}</h2>
          <span class="card-id-stamp">${this.config.id}</span>
        </div>
        <p class="card-desc">${this.config.metadata?.description || ''}</p>
      </div>

      <div class="card-footer-strip">
        <span style="color: var(--muted-telemetry);">SEED: ${this.config.metadata?.seed || '0x4A2F8B'}</span>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="card-share-btn" title="Copy Shareable Link" style="background:transparent; border:1px solid var(--border-wire); color:var(--mono-white); font-size:10px; padding:2px 6px; cursor:pointer;">🔗</button>
          <button class="inspect-btn">INSPECT &gt;</button>
        </div>
      </div>
    `;

    if (isModule) {
      this.canvas = this.element.querySelector('.card-canvas');
      try {
        const module = await import(`../../${this.config.entryPoint}`);
        const ExperimentClass = module.default;
        this.runner = new ExperimentClass(this.canvas, this.config);
        this.runner.start();
        gpuManager.register(this.canvas, this.runner);
      } catch (err) {
        console.warn(`Could not mount module experiment for ${this.config.id}:`, err);
      }
    }

    // Share link button click
    const shareBtn = this.element.querySelector('.card-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/experiment/${this.config.slug}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url);
          const original = shareBtn.innerText;
          shareBtn.innerText = '✓';
          shareBtn.style.color = 'var(--signal-red)';
          setTimeout(() => { shareBtn.innerText = original; shareBtn.style.color = 'var(--mono-white)'; }, 1500);
        } else {
          prompt('Copy experiment URL:', url);
        }
      });
    }

    // Click handler to open inspection modal
    this.element.addEventListener('click', () => {
      if (this.onInspect) this.onInspect(this.config);
    });

    return this.element;
  }

  destroy() {
    if (this.canvas) {
      gpuManager.unregister(this.canvas);
    }
    if (this.runner) {
      this.runner.destroy();
      this.runner = null;
    }
  }
}

/**
 * CreativeCode.my — Curated Featured Specimens Hero Slider
 * Exact Sequence:
 * 1. ZHONK (retro-noise) [Default Active Slide]
 * 2. Chromarad // Isotope Matrix (chromarad-isotope-matrix)
 * 3. Echo Of Aria (echo-of-aria)
 * 4. CPFP // Cyberpunk Reticle PFP Studio (cpfp)
 */
import { audioEngine } from '../engine/audio.js';

export class FeaturedSlider {
  /**
   * @param {HTMLElement} mountEl
   * @param {Array<Object>} allProjects
   * @param {Function} onInspect
   */
  constructor(mountEl, allProjects, onInspect) {
    this.mountEl = mountEl;
    this.allProjects = allProjects;
    this.onInspect = onInspect;
    this.currentIndex = 0; // Starts at 0 (ZHONK)
    this.timer = null;
    this.container = null;

    // Exact Curated Order Required:
    this.featuredSlugs = [
      'retro-noise',               // 1. ZHONK (Default active slide)
      'chromarad-isotope-matrix', // 2. Chromarad // Isotope Matrix
      'echo-of-aria',              // 3. Echo Of Aria
      'cpfp'                       // 4. CPFP // Cyberpunk Reticle PFP Studio
    ];

    this.items = this.getFeaturedItems();
    this.render();
  }

  getFeaturedItems() {
    const list = [];
    for (const slug of this.featuredSlugs) {
      let found = this.allProjects.find(p => p.slug === slug);
      if (found) {
        list.push(found);
      }
    }
    return list.length ? list : this.allProjects.slice(0, 4);
  }

  render() {
    this.container = document.createElement('section');
    this.container.className = 'featured-slider-container';

    this.container.innerHTML = `
      <div class="featured-slider-header">
        <div class="slider-header-left">
          <span class="curated-badge">&#9670; FEATURED SPECIMEN</span>
          <span class="slider-counter" id="sliderCounterDisplay">01 / ${String(this.items.length).padStart(2, '0')}</span>
        </div>
        <div class="slider-nav-controls">
          <button class="sys-btn slider-arrow-btn" id="btnSlidePrev" title="Previous Specimen">&larr; PREV</button>
          <div class="slider-pips" id="sliderPips"></div>
          <button class="sys-btn slider-arrow-btn" id="btnSlideNext" title="Next Specimen">NEXT &rarr;</button>
        </div>
      </div>

      <div class="featured-hero-stage" id="featuredHeroStage">
        <!-- Injected dynamically on slide change -->
      </div>
    `;

    this.mountEl.appendChild(this.container);
    this.bindEvents();
    this.showSlide(0); // ZHONK is the initial active slide
    this.startAutoPlay();
  }

  showSlide(index) {
    if (!this.items.length) return;
    this.currentIndex = (index + this.items.length) % this.items.length;
    const current = this.items[this.currentIndex];

    // Update Counter
    const counter = this.container.querySelector('#sliderCounterDisplay');
    if (counter) counter.innerText = `${String(this.currentIndex + 1).padStart(2, '0')} / ${String(this.items.length).padStart(2, '0')}`;

    // Update Pips
    const pips = this.container.querySelector('#sliderPips');
    if (pips) {
      pips.innerHTML = this.items.map((_, i) => `
        <span class="slider-pip ${i === this.currentIndex ? 'active' : ''}" data-idx="${i}" title="Slide ${i + 1}"></span>
      `).join('');

      pips.querySelectorAll('.slider-pip').forEach(pip => {
        pip.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.idx);
          audioEngine.playClick();
          this.showSlide(idx);
        });
      });
    }

    // Render Stage Content
    const stage = this.container.querySelector('#featuredHeroStage');
    const isModule = current.entryType === 'module';
    const videoSrc = current.metadata?.video || (current.slug === 'chromarad-isotope-matrix' ? '/projects/chromarad-isotope-matrix/assets/tcozVqT9HvYsu.mp4' : null);
    const previewSrc = current.metadata?.preview ? current.metadata.preview.replace(/^\.\//, '/') : '';

    const entryPath = (isModule
      ? current.entryPoint.replace('/experiment.js', '/index.html')
      : current.entryPoint).replace(/^\.\//, '/');

    stage.innerHTML = `
      <div class="featured-preview-pane" style="cursor: pointer;">
        ${videoSrc 
          ? `<video class="featured-iframe" src="${videoSrc.replace(/^\.\//, '/')}" autoplay loop muted playsinline poster="${previewSrc}" style="object-fit: cover; width: 100%; height: 100%;"></video>`
          : (previewSrc
            ? `<img class="featured-iframe" src="${previewSrc}" alt="${current.title}" style="object-fit: cover; width: 100%; height: 100%; display:block;" />`
            : `<iframe class="featured-iframe" src="${entryPath}" loading="lazy" sandbox="allow-scripts allow-same-origin"></iframe>`
          )
        }
        <div class="featured-corner-tl"></div>
        <div class="featured-corner-br"></div>
      </div>

      <div class="featured-meta-pane">
        <div class="featured-tag-strip">
          <span class="spec-badge active-coral">${current.visualDNA_channel || 'CH-04'}</span>
          <span class="spec-badge">${current.technology || 'Procedural'}</span>
          <span class="spec-badge" style="color: var(--muted-telemetry);">LINEAGE: ${current.metadata?.lineage || 'REF-001'}</span>
        </div>

        <h2 class="featured-title">${current.title}</h2>

        <p class="featured-desc">${current.metadata?.description || 'Experimental digital specimen with real-time procedural generation and parameter mutation.'}</p>

        <div class="featured-stats-row">
          <div>ID: <strong style="color: var(--mono-white);">${current.id}</strong></div>
          <div>SEED: <strong style="color: var(--mono-white);">${current.metadata?.seed || '0x453EA6'}</strong></div>
          <div>STATUS: <strong style="color: var(--signal-red);">${current.metadata?.status || 'OPERATIONAL'}</strong></div>
        </div>

        <div class="featured-action-deck">
          <button class="hero-inspect-action-btn" id="btnHeroInspect">
            <span class="action-led"></span>
            <span class="action-label">INSPECT SPECIMEN</span>
            <span class="action-glyph">⚡ ↗</span>
          </button>
          <button class="hero-share-action-btn" id="btnHeroShare" title="Copy Experiment URL">
            <span style="font-size: 11px;">🔗</span>
            <span>SHARE</span>
          </button>
        </div>
      </div>
    `;

    const heroInspect = stage.querySelector('#btnHeroInspect');
    if (heroInspect) {
      heroInspect.addEventListener('mouseenter', () => audioEngine.playHover());
      heroInspect.addEventListener('click', () => {
        audioEngine.playSelect();
        if (this.onInspect) this.onInspect(current);
      });
    }

    const heroShare = stage.querySelector('#btnHeroShare');
    if (heroShare) {
      heroShare.addEventListener('mouseenter', () => audioEngine.playHover());
      heroShare.addEventListener('click', () => {
        audioEngine.playClick();
        const url = `${window.location.origin}/experiment/${current.slug}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url);
          const orig = heroShare.innerText;
          heroShare.innerText = '✓ COPIED LINK';
          heroShare.style.color = 'var(--signal-red)';
          setTimeout(() => { heroShare.innerText = orig; heroShare.style.color = 'var(--mono-white)'; }, 2000);
        } else {
          prompt('Copy experiment URL:', url);
        }
      });
    }
  }

  bindEvents() {
    const prev = this.container.querySelector('#btnSlidePrev');
    const next = this.container.querySelector('#btnSlideNext');

    prev.addEventListener('click', () => {
      audioEngine.playClick();
      this.showSlide(this.currentIndex - 1);
    });

    next.addEventListener('click', () => {
      audioEngine.playClick();
      this.showSlide(this.currentIndex + 1);
    });

    prev.addEventListener('mouseenter', () => audioEngine.playHover());
    next.addEventListener('mouseenter', () => audioEngine.playHover());

    this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
    this.container.addEventListener('mouseleave', () => this.startAutoPlay());
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.timer = setInterval(() => {
      this.showSlide(this.currentIndex + 1);
    }, 7500);
  }

  stopAutoPlay() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

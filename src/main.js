/**
 * CreativeCode Visual DNA — Master Application Coordinator
 * With Cyberpunk Preloader, ASCII Ambigram, Procedural Audio, and Featured Slider
 */
import { ArtworkCard } from './components/ArtworkCard.js';
import { DetailModal } from './components/DetailModal.js';
import { AtlasView } from './components/AtlasView.js';
import { RetroCRTOverlay } from './components/RetroCRTOverlay.js';
import { Preloader } from './components/Preloader.js';
import { FeaturedSlider } from './components/FeaturedSlider.js';
import { audioEngine } from './engine/audio.js';

// Import Canonical DNA Database manifests
import manifestData from '../dna/manifest.json' with { type: 'json' };
import channelsData from '../dna/channels.json' with { type: 'json' };

class App {
  constructor() {
    this.projects = [];
    this.activeTab = 'specimens'; // 'specimens' | 'atlas'
    this.activeChannel = 'ALL';
    this.searchQuery = '';
    this.crtOverlay = null;
    this.modal = null;
    this.atlas = null;
    this.preloader = null;
    this.featuredSlider = null;
    this.cards = [];
    this.init();
  }

  async init() {
    // 1. Initialize CRT Overlay
    this.crtOverlay = new RetroCRTOverlay();

    // 2. Initialize Detail Modal
    const modalMount = document.getElementById('modal-mount');
    this.modal = new DetailModal(modalMount);

    // 3. Dynamically discover and load all projects
    await this.loadProjects();

    // 4. Mount Cyberpunk Preloader & ASCII Ambigram
    const preloaderMount = document.getElementById('preloader-mount');
    if (preloaderMount) {
      this.preloader = new Preloader(preloaderMount, () => {
        console.log('[PLAYGROUND] Laboratory initialized.');
      });
    }

    // 5. Mount Curated Featured Specimens Hero Slider
    const sliderMount = document.getElementById('featured-slider-mount');
    if (sliderMount) {
      this.featuredSlider = new FeaturedSlider(sliderMount, this.projects, (config) => {
        this.modal.open(config);
      });
    }

    // 6. Initialize Atlas View
    const atlasMount = document.getElementById('atlas-mount');
    this.atlas = new AtlasView(
      atlasMount,
      manifestData,
      channelsData,
      this.projects,
      (slug) => {
        const item = this.projects.find(p => p.slug === slug);
        if (item) {
          audioEngine.playSelect();
          this.setTab('specimens');
          this.modal.open(item);
        }
      }
    );

    // 7. Render Specimen Cards
    await this.renderCards();

    // 8. Bind Global System Events & UI Audio
    this.bindHeaderEvents();
    this.bindToolbarEvents();
    this.startClock();
    this.initAudioControls();
    this.bindGlobalAudioDelegation();

    // 9. Check Deep Link Route (/experiment/:slug)
    this.checkInitialRoute();
  }

  checkInitialRoute() {
    let targetSlug = window.__INITIAL_SPECIMEN_SLUG__;

    if (!targetSlug) {
      const pathMatch = window.location.pathname.match(/^\/(?:experiment|specimen)\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) targetSlug = pathMatch[1];
    }

    if (!targetSlug) {
      const hashMatch = window.location.hash.match(/^(?:#\/experiment\/|#\/specimen\/|#)([a-zA-Z0-9_-]+)/);
      if (hashMatch) targetSlug = hashMatch[1];
    }

    if (targetSlug) {
      const normalizedSlug = targetSlug.toLowerCase();
      const SLUG_ALIASES = {
        'zhonkcrt': 'cyberpunk-retro-crt',
        'grainrad-bulk': 'chromarad-isotope-matrix',
        'grainrad': 'chromarad-isotope-matrix',
        'chromarad': 'chromarad-isotope-matrix',
        'zhonk': 'retro-noise'
      };
      const actualSlug = SLUG_ALIASES[normalizedSlug] || normalizedSlug;

      const project = this.projects.find(p => p.slug.toLowerCase() === actualSlug || p.id.toLowerCase() === actualSlug);
      if (project) {
        console.log(`[ROUTER] Auto-launching deep-linked specimen: ${project.title} (${project.slug})`);
        this.setTab('specimens');
        this.modal.open(project, false);
      }
    }

    // Handle browser back/forward history navigation
    window.addEventListener('popstate', () => {
      const pathMatch = window.location.pathname.match(/^\/(?:experiment|specimen)\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) {
        const slug = pathMatch[1].toLowerCase();
        const project = this.projects.find(p => p.slug.toLowerCase() === slug);
        if (project) {
          this.setTab('specimens');
          this.modal.open(project, false);
        }
      } else {
        if (this.modal && this.modal.modalEl.classList.contains('open')) {
          this.modal.close(false);
        }
      }
    });
  }

  bindGlobalAudioDelegation() {
    // Delegated hover sound on all interactive UI components
    let lastTarget = null;
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('button, a, input, select, .specimen-card, .slider-nav-btn, .channel-pill, .filter-btn, .nav-tab-btn, .workbench-action-btn, .modal-tab-btn, .ascii-enter-btn, .featured-slide-card, .audio-track-field, .param-row, .atlas-node');
      if (target && target !== lastTarget) {
        lastTarget = target;
        audioEngine.playHover();
      }
    });

    // Delegated click sound on interactive elements
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, select, .filter-btn, .nav-tab-btn, .workbench-action-btn, .modal-tab-btn, .audio-track-field');
      if (target) {
        audioEngine.playClick();
      }
    });

    // Bridge for iframes/specimens to trigger parent sound system
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'UI_HOVER') {
        audioEngine.playHover();
      } else if (e.data && e.data.type === 'UI_CLICK') {
        audioEngine.playClick();
      } else if (e.data && e.data.type === 'UI_SELECT') {
        audioEngine.playSelect();
      }
    });
  }

  async loadProjects() {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        this.projects = await res.json();
        console.log(`[DISCOVERY] Loaded ${this.projects.length} projects from /api/projects`);
        return;
      }
    } catch (e) {
      console.warn('[DISCOVERY] /api/projects unavailable, falling back to static projects.json');
    }

    try {
      const res = await fetch('./projects/projects.json');
      if (res.ok) {
        this.projects = await res.json();
        console.log(`[DISCOVERY] Loaded ${this.projects.length} projects from static catalog`);
      }
    } catch (err) {
      console.error('[DISCOVERY] Failed to load projects manifest:', err);
    }
  }

  async renderCards() {
    const grid = document.getElementById('specimensGrid');
    grid.innerHTML = '';
    this.cards.forEach(card => card.destroy());
    this.cards = [];

    const filtered = this.projects.filter((config) => {
      const matchChannel = this.activeChannel === 'ALL' || config.visualDNA_channel === this.activeChannel;
      const matchSearch = !this.searchQuery || 
        config.title.toLowerCase().includes(this.searchQuery) ||
        config.category.toLowerCase().includes(this.searchQuery) ||
        (config.metadata?.description || '').toLowerCase().includes(this.searchQuery);
      return matchChannel && matchSearch;
    });

    for (const config of filtered) {
      const card = new ArtworkCard(config, (cfg) => {
        audioEngine.playSelect();
        this.modal.open(cfg);
      });
      this.cards.push(card);
      const cardEl = await card.render();

      cardEl.addEventListener('mouseenter', () => audioEngine.playHover());
      grid.appendChild(cardEl);
    }
  }

  initAudioControls() {
    const audioBtn = document.getElementById('btnAudioToggle');
    const trackNameEl = document.getElementById('audioTrackName');
    const trackField = document.getElementById('audioTrackField');

    const updateTrackLabel = () => {
      if (trackNameEl && audioEngine.currentTrack) {
        trackNameEl.innerText = audioEngine.currentTrack.title;
      }
    };
    updateTrackLabel();

    if (trackField) {
      trackField.addEventListener('mouseenter', () => audioEngine.playHover());
      trackField.addEventListener('click', () => {
        audioEngine.playSelect();
        audioEngine.fadeOutMusic(() => {
          audioEngine.selectRandomTrack();
          updateTrackLabel();
          audioEngine.startAmbient();
        });
      });
    }

    if (audioBtn) {
      const updateLabel = () => {
        audioBtn.innerText = audioEngine.isMuted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
        if (audioEngine.isMuted) {
          audioBtn.classList.remove('sys-btn-primary');
        } else {
          audioBtn.classList.add('sys-btn-primary');
        }
      };
      updateLabel();

      audioBtn.addEventListener('mouseenter', () => audioEngine.playHover());
      audioBtn.addEventListener('click', () => {
        audioEngine.toggleMute();
        audioEngine.playClick();
        updateLabel();
      });
    }
  }

  bindHeaderEvents() {
    // Nav Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => audioEngine.playHover());
      btn.addEventListener('click', () => {
        audioEngine.playClick();
        const tab = btn.getAttribute('data-tab');
        this.setTab(tab);
      });
    });

    // CRT Toggle
    const crtBtn = document.getElementById('btnCrtToggle');
    if (crtBtn) {
      crtBtn.addEventListener('mouseenter', () => audioEngine.playHover());
      crtBtn.addEventListener('click', () => {
        audioEngine.playClick();
        const isOn = this.crtOverlay.toggle();
        crtBtn.innerText = isOn ? 'CRT ON' : 'CRT OFF';
      });
    }
  }

  bindToolbarEvents() {
    // Channel filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => audioEngine.playHover());
      btn.addEventListener('click', () => {
        audioEngine.playClick();
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeChannel = btn.getAttribute('data-channel');
        this.renderCards();
      });
    });

    // Search input
    const search = document.getElementById('archiveSearchInput');
    if (search) {
      search.addEventListener('input', (e) => {
        audioEngine.playHover();
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCards();
      });
    }
  }

  setTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    const specimenView = document.getElementById('specimensSection');
    const featuredSlider = document.getElementById('featured-slider-mount');

    if (tab === 'specimens') {
      specimenView.style.display = 'block';
      if (featuredSlider) featuredSlider.style.display = 'block';
      this.atlas.hide();
    } else if (tab === 'atlas') {
      specimenView.style.display = 'none';
      if (featuredSlider) featuredSlider.style.display = 'none';
      this.atlas.show();
    }
  }

  startClock() {
    const clockEl = document.getElementById('systemClockVal');
    const update = () => {
      const d = new Date();
      const s = String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0');
      if (clockEl) clockEl.innerText = s;
    };
    setInterval(update, 1000);
    update();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

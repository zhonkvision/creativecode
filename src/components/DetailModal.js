import { MutationWorkbench } from './MutationWorkbench.js';
import { audioEngine } from '../engine/audio.js';
import { CanvasGifEncoder } from '../engine/gif-encoder.js';

export class DetailModal {
  constructor(container) {
    this.container = container;
    this.modalEl = null;
    this.activeRunner = null;
    this.workbench = null;
    this.isDrawerOpen = false;
    this.currentProject = null;
    this.defaultTitle = document.title;
    this.wasMusicPlayingBeforeOpen = false;
    this.isRecording = false;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="detail-modal-overlay" id="globalDetailModal" role="dialog" aria-modal="true" aria-hidden="true">
        <header class="modal-header">
          <div class="modal-breadcrumbs">
            <button class="sys-btn" id="modalCloseBtn">&larr; ESC / GALLERY</button>
            <span style="color: var(--muted-telemetry);">//</span>
            <strong id="modalTitle">SPECIMEN INSPECTOR</strong>
            <span class="spec-badge" id="modalChannelBadge">CH-01</span>
          </div>
          <div class="modal-actions" style="display: flex; align-items: center; gap: 8px;">
            <button class="sys-btn sys-btn-cyan" id="modalAudioToggleBtn">🔇 MUSIC: OFF</button>
            <button class="sys-btn sys-btn-amber" id="modalShareBtn">🔗 SHARE</button>
            <button class="sys-btn sys-btn-primary" id="modalToggleDrawerBtn">◨ SHOW PARAMS</button>
          </div>
        </header>

        <!-- Toast Feedback Notification -->
        <div id="modalShareToast" style="display:none; position:absolute; top:54px; right:20px; z-index:999; background:var(--surface-elevated); border:1px solid var(--phosphor-green); color:var(--phosphor-green); padding:6px 14px; font-size:11px; letter-spacing:0.08em; box-shadow:0 0 16px rgba(37,232,110,0.3);">
          ✓ COPIED EXPERIMENT URL TO CLIPBOARD
        </div>

        <div class="modal-body-layout">
          <div class="modal-viewport-pane" id="modalViewportContainer">
            <!-- Canvas or Iframe injected dynamically -->
          </div>

          <aside class="mutation-drawer drawer-closed" id="modalWorkbenchMount">
            <div class="drawer-header-strip">
              <span>PARAMETERS & MUTATION</span>
              <button class="drawer-close-x-btn" id="drawerCloseXBtn" title="Close Parameters Panel">&times;</button>
            </div>
            <div id="drawerContentBody"></div>
          </aside>
        </div>
      </div>
    `;

    this.modalEl = this.container.querySelector('#globalDetailModal');
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#modalCloseBtn');
    closeBtn.addEventListener('click', () => this.close());

    // Audio / Music Toggle in Modal Header
    const audioToggleBtn = this.container.querySelector('#modalAudioToggleBtn');
    const updateAudioButtonUi = () => {
      const isPlaying = audioEngine.isMusicPlaying && !audioEngine.isMuted;
      audioToggleBtn.innerHTML = isPlaying ? '🔊 MUSIC: ON' : '🔇 MUSIC: OFF';
      audioToggleBtn.style.color = isPlaying ? 'var(--phosphor-green)' : 'var(--muted-telemetry)';
      audioToggleBtn.style.borderColor = isPlaying ? 'var(--phosphor-green)' : 'var(--border-wire)';
    };

    audioToggleBtn.addEventListener('click', () => {
      audioEngine.toggleMusic();
      updateAudioButtonUi();
    });

    // Toggle Drawer Button
    const toggleDrawerBtn = this.container.querySelector('#modalToggleDrawerBtn');
    const drawer = this.container.querySelector('#modalWorkbenchMount');
    const drawerCloseX = this.container.querySelector('#drawerCloseXBtn');

    const toggleDrawer = () => {
      this.isDrawerOpen = !this.isDrawerOpen;
      drawer.classList.toggle('drawer-closed', !this.isDrawerOpen);
      toggleDrawerBtn.innerText = this.isDrawerOpen ? '◧ HIDE PARAMS' : '◨ SHOW PARAMS';
      if (this.isDrawerOpen) {
        toggleDrawerBtn.classList.remove('sys-btn-primary');
      } else {
        toggleDrawerBtn.classList.add('sys-btn-primary');
      }
    };

    toggleDrawerBtn.addEventListener('click', toggleDrawer);
    drawerCloseX.addEventListener('click', toggleDrawer);

    // Share Specimen URL
    const shareBtn = this.container.querySelector('#modalShareBtn');
    const shareToast = this.container.querySelector('#modalShareToast');

    shareBtn.addEventListener('click', () => {
      if (!this.currentProject) return;
      const url = `${window.location.origin}/experiment/${this.currentProject.slug}`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          shareToast.innerText = `✓ COPIED: /experiment/${this.currentProject.slug}`;
          shareToast.style.display = 'block';
          setTimeout(() => { shareToast.style.display = 'none'; }, 2400);
        }).catch(() => {
          prompt('Copy custom experiment URL:', url);
        });
      } else {
        prompt('Copy custom experiment URL:', url);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl.classList.contains('open')) {
        this.close();
      }
    });
  }

  // Retrieve active viewport canvas element
  getActiveCanvas() {
    const directCanvas = this.container.querySelector('#modalCanvas');
    if (directCanvas) return directCanvas;

    const iframe = this.container.querySelector('#modalIframe');
    if (iframe && iframe.contentDocument) {
      const iframeCanvas = iframe.contentDocument.querySelector('canvas');
      if (iframeCanvas) return iframeCanvas;
    }
    return null;
  }

  // Render instantaneous frame of active viewport to offscreen canvas
  async captureFrameToCanvas(targetCanvas) {
    const activeCanvas = this.getActiveCanvas();
    if (activeCanvas) {
      targetCanvas.width = activeCanvas.width || activeCanvas.clientWidth || 800;
      targetCanvas.height = activeCanvas.height || activeCanvas.clientHeight || 600;
      const ctx = targetCanvas.getContext('2d');
      ctx.drawImage(activeCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
      return true;
    }

    // If SVG or HTML in iframe
    const iframe = this.container.querySelector('#modalIframe');
    if (iframe && iframe.contentDocument) {
      const svg = iframe.contentDocument.querySelector('svg');
      if (svg) {
        const cloned = svg.cloneNode(true);
        const style = iframe.contentDocument.querySelector('style, link[rel="stylesheet"]');
        if (style) cloned.insertBefore(style.cloneNode(true), cloned.firstChild);

        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(cloned);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        await new Promise((resolve) => {
          img.onload = () => {
            targetCanvas.width = 640;
            targetCanvas.height = 400;
            const ctx = targetCanvas.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
            ctx.drawImage(img, 0, 0, targetCanvas.width, targetCanvas.height);
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
        return true;
      }
    }
    return false;
  }

  // Export clean viewport image (PNG / JPG)
  async exportSnapshot(format = 'png') {
    const offscreen = document.createElement('canvas');
    const success = await this.captureFrameToCanvas(offscreen);
    if (!success) {
      alert('Active specimen viewport not available for direct capture.');
      return;
    }
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const url = offscreen.toDataURL(mime, 0.95);
    const a = document.createElement('a');
    a.download = `creativecode-${this.currentProject ? this.currentProject.slug : 'specimen'}-${Date.now()}.${ext}`;
    a.href = url;
    a.click();
  }

  // Record clean viewport stream to MP4 video (at 60 FPS)
  async recordViewportMp4(buttonEl) {
    if (this.isRecording) return;
    const activeCanvas = this.getActiveCanvas();
    if (!activeCanvas) {
      alert('Viewport canvas not detected for hardware stream recording.');
      return;
    }

    this.isRecording = true;
    const originalText = buttonEl.innerText;
    buttonEl.disabled = true;

    try {
      const stream = activeCanvas.captureStream(60);
      let mimeType = 'video/mp4;codecs=avc1.42E01E';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 16000000
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const durationSec = 4.0;
      const startTime = performance.now();

      const progressInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        const pct = Math.min(100, Math.round((elapsed / durationSec) * 100));
        buttonEl.innerText = `🔴 REC ${elapsed.toFixed(1)}s / ${durationSec.toFixed(1)}s (${pct}%)...`;
      }, 100);

      recorder.onstop = () => {
        clearInterval(progressInterval);
        buttonEl.innerText = '⚙️ PACKAGING MP4...';
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `creativecode-${this.currentProject ? this.currentProject.slug : 'specimen'}-${Date.now()}.${ext}`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
        buttonEl.innerText = '✓ SAVED';
        this.isRecording = false;
        setTimeout(() => {
          buttonEl.innerText = originalText;
          buttonEl.disabled = false;
        }, 2000);
      };

      recorder.start(50);
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, durationSec * 1000);

    } catch (err) {
      console.error('MP4 recording failed:', err);
      buttonEl.innerText = '❌ REC FAILED';
      this.isRecording = false;
      setTimeout(() => {
        buttonEl.innerText = originalText;
        buttonEl.disabled = false;
      }, 2000);
    }
  }

  // Record clean viewport loop to animated GIF
  async recordViewportGif(buttonEl) {
    if (this.isRecording) return;
    this.isRecording = true;
    const originalText = buttonEl.innerText;
    buttonEl.disabled = true;

    try {
      const sampleCanvas = document.createElement('canvas');
      const totalFrames = 30;
      const delayMs = 40; // 25 FPS
      let encoder = null;

      for (let f = 0; f < totalFrames; f++) {
        await this.captureFrameToCanvas(sampleCanvas);
        if (!encoder) {
          encoder = new CanvasGifEncoder(sampleCanvas.width, sampleCanvas.height, delayMs);
        }
        encoder.addFrame(sampleCanvas);
        buttonEl.innerText = `🎞️ ${f + 1}/${totalFrames} (${Math.round(((f + 1) / totalFrames) * 100)}%)...`;
        await new Promise(r => setTimeout(r, delayMs));
      }

      buttonEl.innerText = '⚙️ ENCODING GIF...';
      await new Promise(r => setTimeout(r, 60));
      const gifBlob = encoder.encode();
      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement('a');
      a.download = `creativecode-${this.currentProject ? this.currentProject.slug : 'specimen'}-${Date.now()}.gif`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);

      buttonEl.innerText = '✓ SAVED';
      this.isRecording = false;
      setTimeout(() => {
        buttonEl.innerText = originalText;
        buttonEl.disabled = false;
      }, 2000);

    } catch (err) {
      console.error('GIF recording failed:', err);
      buttonEl.innerText = '❌ GIF FAILED';
      this.isRecording = false;
      setTimeout(() => {
        buttonEl.innerText = originalText;
        buttonEl.disabled = false;
      }, 2000);
    }
  }

  async open(projectConfig, updateHistory = true) {
    this.currentProject = projectConfig;
    this.modalEl.classList.add('open');
    this.modalEl.setAttribute('aria-hidden', 'false');

    // Keep audio playing uninterrupted unless the user explicitly toggles it off
    const audioToggleBtn = this.container.querySelector('#modalAudioToggleBtn');
    if (audioToggleBtn) {
      const isPlaying = audioEngine.isMusicPlaying && !audioEngine.isMuted;
      audioToggleBtn.innerHTML = isPlaying ? '🔊 MUSIC: ON' : '🔇 MUSIC: OFF';
      audioToggleBtn.style.color = isPlaying ? 'var(--phosphor-green)' : 'var(--muted-telemetry)';
      audioToggleBtn.style.borderColor = isPlaying ? 'var(--phosphor-green)' : 'var(--border-wire)';
    }

    // Always hide Parameters & Mutation drawer by default on open
    this.isDrawerOpen = false;
    const drawer = this.container.querySelector('#modalWorkbenchMount');
    const toggleDrawerBtn = this.container.querySelector('#modalToggleDrawerBtn');
    if (drawer) drawer.classList.add('drawer-closed');
    if (toggleDrawerBtn) {
      toggleDrawerBtn.innerText = '◨ SHOW PARAMS';
      toggleDrawerBtn.classList.add('sys-btn-primary');
    }

    this.container.querySelector('#modalTitle').innerText = projectConfig.title;
    this.container.querySelector('#modalChannelBadge').innerText = projectConfig.visualDNA_channel || 'CH-01';

    // Deep Linking URL and Page Title Update
    if (updateHistory) {
      const targetUrl = `/experiment/${projectConfig.slug}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ slug: projectConfig.slug }, '', targetUrl);
      }
      document.title = `${projectConfig.title} // CreativeCode.my`;
    }

    const viewportContainer = this.container.querySelector('#modalViewportContainer');
    const existingTarget = viewportContainer.querySelector('#modalCanvas, #modalIframe');
    if (existingTarget) existingTarget.remove();

    if (this.activeRunner) {
      this.activeRunner.destroy();
      this.activeRunner = null;
    }

    const isModule = projectConfig.entryType === 'module';

    if (isModule) {
      const canvas = document.createElement('canvas');
      canvas.className = 'modal-canvas';
      canvas.id = 'modalCanvas';
      viewportContainer.insertBefore(canvas, viewportContainer.firstChild);

      try {
        const module = await import(`../../${projectConfig.entryPoint}`);
        const ExperimentClass = module.default;
        this.activeRunner = new ExperimentClass(canvas, projectConfig);
        this.activeRunner.start();

        const mount = this.container.querySelector('#drawerContentBody');
        this.workbench = new MutationWorkbench(mount, projectConfig, { runner: this.activeRunner });
      } catch (e) {
        console.error('Error loading experiment module:', e);
      }
    } else {
      const iframe = document.createElement('iframe');
      iframe.className = 'modal-canvas';
      iframe.id = 'modalIframe';
      const cleanPath = projectConfig.entryPoint.replace(/^\.\//, '/');
      iframe.src = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
      iframe.style.border = 'none';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.sandbox = 'allow-scripts allow-same-origin allow-downloads';
      viewportContainer.insertBefore(iframe, viewportContainer.firstChild);

      const mount = this.container.querySelector('#drawerContentBody');
      this.workbench = new MutationWorkbench(mount, projectConfig, { iframe });
    }
  }

  close(updateHistory = true) {
    this.modalEl.classList.remove('open');
    this.modalEl.setAttribute('aria-hidden', 'true');
    if (this.activeRunner) {
      this.activeRunner.destroy();
      this.activeRunner = null;
    }
    const iframe = this.container.querySelector('#modalIframe');
    if (iframe) iframe.src = 'about:blank';

    if (updateHistory && window.location.pathname.startsWith('/experiment/')) {
      window.history.pushState(null, '', '/');
      document.title = this.defaultTitle;
    }
    this.currentProject = null;
  }
}

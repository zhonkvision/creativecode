/**
 * CreativeCode Visual DNA — Base Experiment Runner Engine
 */

export class ExperimentRunner {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} projectConfig
   * @param {Object} [initialParams]
   */
  constructor(canvas, projectConfig, initialParams = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = projectConfig;
    this.parameters = { ...this.getDefaultParameters(), ...initialParams };
    this.seed = projectConfig.metadata?.seed || '0x4A2F8B';
    
    this.isRunning = false;
    this.rafId = null;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.time = 0;
    this.lastTimestamp = performance.now();

    this.resizeObserver = null;
    this.initLifecycle();
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

  initLifecycle() {
    this.handleResize();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas);
  }

  handleResize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.0); // Strict DPR Clamping
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.floor(rect.width || 320);
    this.height = Math.floor(rect.height || 220);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);
    }
    this.onResize(this.width, this.height);
  }

  setParameters(newParams) {
    this.parameters = { ...this.parameters, ...newParams };
    this.onParameterChange(this.parameters);
  }

  setSeed(hexSeed) {
    this.seed = hexSeed;
    this.onSeedChange(hexSeed);
  }

  /**
   * Deterministic PRNG based on Mulberry32
   */
  getPrng(seedStr = this.seed) {
    let s = parseInt(seedStr.replace(/^0x/, ''), 16) || 1234567;
    return function () {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    this.start();
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const delta = Math.min((currentTime - this.lastTimestamp) / 1000, 0.1);
    this.time += delta;
    this.lastTimestamp = currentTime;

    this.render(this.ctx, this.width, this.height, this.time, delta);
    this.rafId = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.pause();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.onDestroy();
  }

  // Hook methods for experiment subclasses
  onResize(w, h) {}
  onParameterChange(params) {}
  onSeedChange(seed) {}
  render(ctx, width, height, time, delta) {}
  onDestroy() {}
}

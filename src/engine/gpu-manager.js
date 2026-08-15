/**
 * CreativeCode Visual DNA — GPU & Lifecycle Manager
 */

class GPUManager {
  constructor() {
    this.instances = new Map(); // canvasElement -> ExperimentRunner
    this.observer = null;
    this.initObserver();
  }

  initObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const runner = this.instances.get(entry.target);
        if (!runner) return;

        if (entry.isIntersecting) {
          runner.resume();
        } else {
          runner.pause();
        }
      });
    }, {
      rootMargin: '100px 0px',
      threshold: 0.05
    });
  }

  register(canvasElement, runnerInstance) {
    this.instances.set(canvasElement, runnerInstance);
    if (this.observer) {
      this.observer.observe(canvasElement);
    }
  }

  unregister(canvasElement) {
    const runner = this.instances.get(canvasElement);
    if (runner) {
      runner.destroy();
      this.instances.delete(canvasElement);
    }
    if (this.observer) {
      this.observer.unobserve(canvasElement);
    }
  }

  disposeAll() {
    for (const [canvas, runner] of this.instances.entries()) {
      runner.destroy();
      if (this.observer) this.observer.unobserve(canvas);
    }
    this.instances.clear();
  }
}

export const gpuManager = new GPUManager();

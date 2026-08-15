/**
 * CreativeCode.my — Real-Time Telemetry & Frame Rate Profiler
 */

class TelemetryStats {
  constructor() {
    this.fps = 60;
    this.frameTime = 16.6;
    this.frames = 0;
    this.lastTime = performance.now();
    this.history = [];
    this.subscribers = new Set();

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loop(currentTime) {
    this.frames++;
    const delta = currentTime - this.lastTime;

    if (delta >= 500) {
      this.fps = Math.round((this.frames * 1000) / delta);
      this.frameTime = parseFloat((delta / this.frames).toFixed(1));
      this.frames = 0;
      this.lastTime = currentTime;
      this.notify();
    }

    requestAnimationFrame(this.loop);
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  notify() {
    for (const fn of this.subscribers) {
      fn({ fps: this.fps, frameTime: this.frameTime });
    }
  }
}

export const stats = new TelemetryStats();

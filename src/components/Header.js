/**
 * CreativeCode.my — System Telemetry Header Component
 */
import { stats } from "../utils/stats.js";
import { soundSynth } from "../../dna/engine/SoundSynth.js";

export class HeaderComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.isCrtOn = true;
    this.isAudioOn = false;
    this.activeMode = "gallery";
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <header class="hud-header">
        <div class="hud-brand-wrap">
          <div class="hud-logo" id="headerLogo">
            CREATIVE<span>CODE</span>.MY
          </div>
          <div class="hud-canonical-tag">CC-VISUAL-DNA // v2.4</div>
        </div>

        <nav class="hud-nav">
          <button class="hud-nav-btn active" data-mode="gallery" id="navGalleryBtn">Living Gallery</button>
          <button class="hud-nav-btn" data-mode="taste-map" id="navMapBtn">DNA Taste Map</button>
          <button class="hud-nav-btn" data-mode="manifesto" id="navManifestoBtn">Methodology</button>
        </nav>

        <div class="hud-telemetry-cluster">
          <canvas class="mini-oscilloscope" id="headerOscCanvas" width="90" height="24"></canvas>
          <div class="telemetry-item">
            <span class="telemetry-label">FPS / LATENCY</span>
            <span class="telemetry-val" id="headerFps">60 FPS · 16ms</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">SYSTEM CLOCK</span>
            <span class="telemetry-val" id="headerClock">--:--:--</span>
          </div>
        </div>

        <div class="hud-controls-cluster">
          <button class="icon-btn" id="audioToggleBtn" title="Toggle Generative Ambient Drone">
            <span>&#128266; SOUND OFF</span>
          </button>
          <button class="icon-btn on" id="crtToggleBtn" title="Toggle CRT Scanline Optics">
            <span>CRT ON</span>
          </button>
        </div>
      </header>
    `;

    this.bindEvents();
    this.startClock();
    this.startOscilloscope();

    stats.subscribe(({ fps, frameTime }) => {
      const el = document.getElementById("headerFps");
      if (el) el.innerText = `${fps} FPS · ${frameTime}ms`;
    });
  }

  bindEvents() {
    // Mode Switchers
    const btns = this.container.querySelectorAll(".hud-nav-btn");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        this.setMode(mode);
        soundSynth.playClick();
      });
    });

    // Sound Toggle
    const audioBtn = document.getElementById("audioToggleBtn");
    audioBtn.addEventListener("click", () => {
      this.isAudioOn = soundSynth.toggleAmbientDrone();
      if (this.isAudioOn) {
        audioBtn.classList.add("on");
        audioBtn.innerHTML = `<span>&#128266; SOUND ON</span>`;
      } else {
        audioBtn.classList.remove("on");
        audioBtn.innerHTML = `<span>&#128263; SOUND OFF</span>`;
      }
    });

    // CRT Toggle
    const crtBtn = document.getElementById("crtToggleBtn");
    crtBtn.addEventListener("click", () => {
      this.isCrtOn = !this.isCrtOn;
      const overlay = document.querySelector(".crt-overlay");
      if (overlay) {
        overlay.style.display = this.isCrtOn ? "block" : "none";
      }
      if (this.isCrtOn) {
        crtBtn.classList.add("on");
        crtBtn.innerText = "CRT ON";
      } else {
        crtBtn.classList.remove("on");
        crtBtn.innerText = "CRT OFF";
      }
      soundSynth.playClick();
    });

    // Brand Logo Click resets to gallery
    document.getElementById("headerLogo").addEventListener("click", () => {
      this.setMode("gallery");
      soundSynth.playClick();
    });
  }

  setMode(mode) {
    this.activeMode = mode;
    this.container.querySelectorAll(".hud-nav-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-mode") === mode);
    });
    if (this.options.onModeChange) {
      this.options.onModeChange(mode);
    }
  }

  startClock() {
    const update = () => {
      const now = new Date();
      const s = String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0") + ":" +
        String(now.getSeconds()).padStart(2, "0");
      const el = document.getElementById("headerClock");
      if (el) el.innerText = s;
    };
    setInterval(update, 1000);
    update();
  }

  startOscilloscope() {
    const canvas = document.getElementById("headerOscCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.05;

      const freqData = soundSynth.getFrequencyData();
      const hasAudio = soundSynth.isDronePlaying;

      ctx.beginPath();
      ctx.strokeStyle = "#00f0a0";
      ctx.lineWidth = 1.2;

      for (let x = 0; x < canvas.width; x++) {
        let y = canvas.height / 2;
        if (hasAudio && freqData.length > 0) {
          const index = Math.floor((x / canvas.width) * (freqData.length / 2));
          const val = (freqData[index] || 0) / 255;
          y += (Math.sin(x * 0.2 + t * 2) * val - 0.5 * val) * (canvas.height * 0.8);
        } else {
          y += Math.sin(x * 0.15 + t) * (Math.cos(x * 0.05 - t * 0.5) * 4);
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      requestAnimationFrame(render);
    };
    render();
  }
}

/**
 * CreativeCode.my — CRT Post-Processing & Screen Optics Engine
 */

/**
 * @typedef {Object} CrtSettings
 * @property {number} scanlines
 * @property {number} bloom
 * @property {number} chromaticAberration
 * @property {number} curvature
 * @property {number} flicker
 * @property {string} tint
 */

export const defaultCrtSettings = {
  scanlines: 0.75,
  bloom: 0.5,
  chromaticAberration: 0.35,
  curvature: 0.15,
  flicker: 0.1,
  tint: "default"
};

export class CrtPostProcessEngine {
  constructor() {
    this.settings = { ...defaultCrtSettings };
  }

  apply(containerElement, settings = {}) {
    this.settings = { ...this.settings, ...settings };
    if (!containerElement) return;

    // Apply CSS variables to container
    containerElement.style.setProperty("--crt-scanline-opacity", (this.settings.scanlines * 0.45).toString());
    containerElement.style.setProperty("--crt-bloom-spread", `${(this.settings.bloom * 16).toFixed(1)}px`);
    containerElement.style.setProperty("--crt-chroma-offset", `${(this.settings.chromaticAberration * 4).toFixed(1)}px`);
    containerElement.style.setProperty("--crt-flicker-amp", (this.settings.flicker * 0.05).toString());

    if (this.settings.curvature > 0.05) {
      containerElement.classList.add("crt-barrel-curved");
    } else {
      containerElement.classList.remove("crt-barrel-curved");
    }
  }
}

export const crtEngine = new CrtPostProcessEngine();

/**
 * CreativeCode Visual DNA — Retro CRT Scanlines & Phosphor Overlay Wrapper
 */

export class RetroCRTOverlay {
  constructor() {
    this.isEnabled = true;
    this.element = null;
    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'crt-scanline-layer crt-flicker';
    this.element.id = 'retroCrtOverlay';
    document.body.appendChild(this.element);
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    this.element.style.display = this.isEnabled ? 'block' : 'none';
    return this.isEnabled;
  }

  setOpacity(val) {
    document.documentElement.style.setProperty('--scanline-opacity', val.toString());
  }
}

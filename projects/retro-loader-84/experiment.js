/**
 * CreativeCode Visual DNA — Retro Loader 84 Stepped Raster Display
 */
import { ExperimentRunner } from '../../src/engine/runner.js';

export default class RetroLoaderExperiment extends ExperimentRunner {
  render(ctx, width, height, time) {
    ctx.fillStyle = '#050709';
    ctx.fillRect(0, 0, width, height);

    const slats = Math.round(this.parameters.slatCount || 16);
    const chroma = this.parameters.chromaOffset || 3.0;
    const waveSpeed = this.parameters.waveSpeed || 1.2;
    const loadSpeed = this.parameters.loadSpeed || 0.8;

    const cx = width / 2;
    const cy = height * 0.45;

    // 4 Sliced Quadrant Panes
    const quadrants = [
      { ox: -48, oy: -42, color: '#FF2A42', skew: -0.18 }, // Red
      { ox: 48, oy: -35, color: '#00F0FF', skew: -0.18 },  // Cyan
      { ox: -54, oy: 42, color: '#25E86E', skew: -0.18 },  // Green
      { ox: 42, oy: 48, color: '#FFB000', skew: -0.18 }   // Amber
    ];

    const slatH = 3.5;
    const slatGap = 2.5;
    const paneW = 75;

    quadrants.forEach((quad) => {
      for (let i = 0; i < slats; i++) {
        const slatY = (i - slats / 2) * (slatH + slatGap);
        const wave = Math.sin(time * waveSpeed + i * 0.35 + quad.ox * 0.05) * 3.5;
        const px = cx + quad.ox + slatY * quad.skew + wave;
        const py = cy + quad.oy + slatY;

        // RGB Chromatic Aberration Passes
        ctx.fillStyle = 'rgba(255, 42, 66, 0.35)';
        ctx.fillRect(px - paneW / 2 - chroma, py, paneW, slatH);

        ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.fillRect(px - paneW / 2 + chroma, py, paneW, slatH);

        // Core Phosphor Bar
        ctx.fillStyle = quad.color;
        ctx.fillRect(px - paneW / 2, py, paneW, slatH);
      }
    });

    // Sub-Brand Text
    ctx.font = '12px "VT323", monospace';
    ctx.fillStyle = '#25E86E';
    ctx.textAlign = 'center';
    ctx.fillText('MICROSOFT WINDOWS 84 // アメリカ製1984年', cx, cy + 90);

    // Segmented Progress Bar at Bottom
    const barW = Math.min(width * 0.7, 240);
    const barH = 12;
    const barX = cx - barW / 2;
    const barY = height - 32;

    ctx.strokeStyle = '#1E293B';
    ctx.strokeRect(barX, barY, barW, barH);

    const segments = 16;
    const activeSegs = Math.floor(((time * loadSpeed) % 1) * (segments + 1));
    const segW = (barW - 4) / segments;

    for (let s = 0; s < segments; s++) {
      if (s < activeSegs) {
        ctx.fillStyle = '#25E86E';
        ctx.fillRect(barX + 2 + s * segW + 0.5, barY + 2, segW - 1, barH - 4);
      }
    }

    ctx.textAlign = 'left';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText('> LOADING CH-04...', barX, barY - 6);
  }
}

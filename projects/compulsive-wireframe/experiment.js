/**
 * CreativeCode Visual DNA — Compulsive Dual-Tone Wireframe HUD
 */
import { ExperimentRunner } from '../../src/engine/runner.js';

export default class CompulsiveWireframeExperiment extends ExperimentRunner {
  constructor(canvas, config, initialParams) {
    super(canvas, config, initialParams);
    this.rotY = 0;
  }

  render(ctx, width, height, time, delta) {
    ctx.fillStyle = '#050709';
    ctx.fillRect(0, 0, width, height);

    const speed = this.parameters.rotationRate || 1.2;
    const density = Math.round(this.parameters.wireDensity || 20);
    const splitGap = this.parameters.splitGap || 30;
    const waveFreq = this.parameters.waveFrequency || 4.5;

    this.rotY += delta * speed;

    const cx = width * 0.45;
    const cy = height * 0.48;
    const scale = Math.min(width, height) * 0.32;
    const focalDepth = 450;

    // 1. Dual-Tone 3D Wireframe Cranial Mesh (Red Front, Green Back)
    for (let i = 0; i <= density; i++) {
      const phi = (i / density) * Math.PI - Math.PI / 2;
      const rFactor = 1.0 - 0.28 * Math.pow(Math.sin(phi), 2);

      // Red Segment (Front Mask)
      ctx.beginPath();
      ctx.strokeStyle = '#FF2A42';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(255, 42, 66, 0.4)';
      ctx.shadowBlur = 4;

      for (let j = 0; j <= density / 2; j++) {
        const theta = (j / (density / 2)) * Math.PI - Math.PI / 2 + this.rotY;
        let r = scale * rFactor;
        if (phi > -0.3 && phi < 0.2 && Math.cos(theta) > 0.4) r *= 1.14; // Nose bridge

        const x3d = r * Math.cos(phi) * Math.sin(theta) - splitGap / 2;
        const y3d = -r * Math.sin(phi);
        const z3d = r * Math.cos(phi) * Math.cos(theta);

        const pers = focalDepth / (focalDepth + z3d);
        const px = cx + x3d * pers;
        const py = cy + y3d * pers;

        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Green Segment (Back Cranium Shell)
      ctx.beginPath();
      ctx.strokeStyle = '#25E86E';
      ctx.shadowColor = 'rgba(37, 232, 110, 0.4)';

      for (let j = density / 2; j <= density; j++) {
        const theta = (j / density) * Math.PI * 2 + this.rotY;
        const r = scale * rFactor * 0.98;

        const x3d = r * Math.cos(phi) * Math.sin(theta) + splitGap / 2;
        const y3d = -r * Math.sin(phi);
        const z3d = r * Math.cos(phi) * Math.cos(theta);

        const pers = focalDepth / (focalDepth + z3d);
        const px = cx + x3d * pers;
        const py = cy + y3d * pers;

        if (j === density / 2) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // 2. Waveform Oscilloscope Ribbon at Bottom
    const oscY = height - 38;
    const oscH = 26;
    ctx.strokeStyle = '#1E293B';
    ctx.strokeRect(10, oscY - 6, width - 20, oscH + 8);

    ctx.beginPath();
    ctx.strokeStyle = '#25E86E';
    ctx.lineWidth = 1.2;

    for (let x = 12; x < width - 12; x += 2) {
      const nx = (x - 12) / (width - 24);
      const envelope = Math.sin(nx * Math.PI);
      const y = oscY + Math.sin(nx * waveFreq * 10 + time * 6) * (oscH * 0.4) * envelope;

      if (x === 12) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 3. Telemetry Tags
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FF2A42';
    ctx.fillText('DISP: FUSION // TGT: HOPE', 10, 16);
    ctx.fillStyle = '#25E86E';
    ctx.fillText('STATUS: SEG -6 // OK', width - 140, 16);
  }
}

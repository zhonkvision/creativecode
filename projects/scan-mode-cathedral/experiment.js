/**
 * CreativeCode Visual DNA — Scan-Mode Vector Architectural Cathedral
 */
import { ExperimentRunner } from '../../src/engine/runner.js';

export default class CathedralExperiment extends ExperimentRunner {
  constructor(canvas, config, initialParams) {
    super(canvas, config, initialParams);
    this.sweepAngle = 0;
  }

  render(ctx, width, height, time, delta) {
    ctx.fillStyle = '#050709';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.65;
    const focalDepth = 400;

    const pillars = Math.round(this.parameters.archPillars || 12);
    const vaultH = this.parameters.vaultHeight || 220;
    const speed = this.parameters.sweepVelocity || 1.0;
    const glow = this.parameters.wireframeGlow || 0.65;

    this.sweepAngle += delta * speed * 2.0;

    // Vector Cathedral Wireframe Construction
    ctx.strokeStyle = '#25E86E';
    ctx.lineWidth = 1.0;
    ctx.shadowColor = 'rgba(37, 232, 110, 0.4)';
    ctx.shadowBlur = Math.round(glow * 8);

    const aisleW = 180;
    const zStep = 75;

    // Longitudinal Floor Grid Rails
    for (let side of [-1, 1]) {
      ctx.beginPath();
      for (let i = 0; i < pillars; i++) {
        const z = 50 + i * zStep;
        const pScale = focalDepth / (focalDepth + z);
        const px = cx + side * aisleW * pScale;
        const py = cy + 60 * pScale;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Nave Ribbed Vault Arches
    for (let i = 0; i < pillars; i++) {
      const z = 50 + i * zStep;
      const pScale = focalDepth / (focalDepth + z);
      
      const leftX = cx - aisleW * pScale;
      const rightX = cx + aisleW * pScale;
      const floorY = cy + 60 * pScale;
      const springY = cy - 20 * pScale;
      const apexY = cy - vaultH * pScale;

      // Calculate distance to radar sweep for illumination
      const sweepDiff = Math.abs(Math.sin(this.sweepAngle - i * 0.25));
      const lineAlpha = 0.2 + sweepDiff * 0.8;

      ctx.strokeStyle = `rgba(37, 232, 110, ${lineAlpha.toFixed(2)})`;
      ctx.beginPath();

      // Left Pillar
      ctx.moveTo(leftX, floorY);
      ctx.lineTo(leftX, springY);

      // Gothic Pointed Arch
      ctx.quadraticCurveTo(leftX, apexY, cx, apexY);
      ctx.quadraticCurveTo(rightX, apexY, rightX, springY);

      // Right Pillar
      ctx.lineTo(rightX, floorY);

      // Transverse Floor Tie
      ctx.lineTo(leftX, floorY);
      ctx.stroke();

      // Cross Ribs
      if (i < pillars - 1) {
        const nextZ = 50 + (i + 1) * zStep;
        const nextPScale = focalDepth / (focalDepth + nextZ);
        const nextLeftX = cx - aisleW * nextPScale;
        const nextRightX = cx + aisleW * nextPScale;
        const nextApexY = cy - vaultH * nextPScale;

        ctx.strokeStyle = `rgba(37, 232, 110, ${(lineAlpha * 0.4).toFixed(2)})`;
        ctx.beginPath();
        ctx.moveTo(leftX, springY);
        ctx.lineTo(nextApexY ? cx : nextLeftX, nextApexY);
        ctx.lineTo(rightX, springY);
        ctx.stroke();
      }
    }

    // Perspective Central Vanishing Point Horizon
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    // Radar Azimuth Sweep Angle Telemetry
    const deg = Math.round(((this.sweepAngle % (Math.PI * 2)) / (Math.PI * 2)) * 360);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#25E86E';
    ctx.fillText(`AZIMUTH: ${deg.toString().padStart(3, '0')}° // NAVE-DEPTH: ${pillars * zStep}m`, 10, 16);
    ctx.fillStyle = '#64748B';
    ctx.fillText(`STRESS TENSOR: NORMAL // CH-03`, 10, 30);
  }
}

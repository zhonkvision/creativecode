/**
 * CreativeCode Visual DNA — IC Wafer Yield Analysis Engine
 */
import { ExperimentRunner } from '../../src/engine/runner.js';

export default class ICWaferExperiment extends ExperimentRunner {
  constructor(canvas, config, initialParams) {
    super(canvas, config, initialParams);
    this.dieMatrix = [];
    this.rebuildMatrix();
  }

  onSeedChange() {
    this.rebuildMatrix();
  }

  onParameterChange() {
    this.rebuildMatrix();
  }

  rebuildMatrix() {
    const prng = this.getPrng();
    const size = Math.round(this.parameters.gridSize || 20);
    const defectRate = this.parameters.defectRate || 0.12;

    this.dieMatrix = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        // Distance from center normalized [-1, 1]
        const nx = (c - size / 2 + 0.5) / (size / 2);
        const ny = (r - size / 2 + 0.5) / (size / 2);
        const dist = Math.sqrt(nx * nx + ny * ny);

        const insideWafer = dist <= 0.95;
        // Edge degradation factor increases defect probability near wafer perimeter
        const edgeFactor = Math.pow(dist, 3) * 0.4;
        const isDefect = insideWafer && (prng() < (defectRate + edgeFactor));
        const yieldMetric = insideWafer ? (isDefect ? prng() * 0.4 : 0.7 + prng() * 0.3) : 0;

        row.push({
          insideWafer,
          isDefect,
          yieldMetric,
          r,
          c
        });
      }
      this.dieMatrix.push(row);
    }
  }

  render(ctx, width, height, time) {
    ctx.fillStyle = '#050709';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const waferRadius = Math.min(width, height) * 0.42;

    // 1. Draw Silicon Wafer Circular Substrate
    ctx.beginPath();
    ctx.arc(cx, cy, waferRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0C1015';
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wafer Alignment Notch at bottom
    ctx.beginPath();
    ctx.arc(cx, cy + waferRadius, 6, Math.PI, 0);
    ctx.fillStyle = '#050709';
    ctx.fill();
    ctx.stroke();

    const size = this.dieMatrix.length;
    if (size === 0) return;

    const cellSize = (waferRadius * 1.85) / size;
    const startX = cx - (size * cellSize) / 2;
    const startY = cy - (size * cellSize) / 2;

    const mode = this.parameters.colorMode || 'HEAT_MAP';
    const scanSpeed = this.parameters.scanSpeed || 1.5;
    const scanY = (time * scanSpeed * 60) % (size * cellSize);

    let totalDies = 0;
    let passingDies = 0;

    // 2. Render Rectilinear Die Cells
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const die = this.dieMatrix[r][c];
        if (!die.insideWafer) continue;

        totalDies++;
        if (!die.isDefect) passingDies++;

        const dx = startX + c * cellSize;
        const dy = startY + r * cellSize;

        // Color computation
        let fill = '#1E293B';
        if (mode === 'HEAT_MAP') {
          if (die.isDefect) {
            fill = '#FF2A42'; // Signal Red
          } else {
            const g = Math.floor(die.yieldMetric * 232);
            fill = `rgb(37, ${g}, 110)`; // Phosphor gradient
          }
        } else if (mode === 'PHOSPHOR_GREEN') {
          fill = die.isDefect ? '#0C1015' : '#25E86E';
        } else if (mode === 'RAW_AMBER') {
          fill = die.isDefect ? '#FF2A42' : '#FFB000';
        }

        ctx.fillStyle = fill;
        ctx.fillRect(dx + 0.5, dy + 0.5, cellSize - 1, cellSize - 1);

        // Die Border
        ctx.strokeStyle = '#050709';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(dx, dy, cellSize, cellSize);
      }
    }

    // 3. Laser Inspection Sweep Beam
    const laserY = startY + scanY;
    if (laserY >= startY && laserY <= startY + size * cellSize) {
      ctx.beginPath();
      ctx.moveTo(cx - waferRadius, laserY);
      ctx.lineTo(cx + waferRadius, laserY);
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Laser glow
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(cx - waferRadius, laserY - 4, waferRadius * 2, 8);
    }

    // 4. Telemetry Readouts
    const yieldPct = totalDies > 0 ? ((passingDies / totalDies) * 100).toFixed(1) : '100.0';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`WAFER: FAB-26 // DIE-COUNT: ${totalDies}`, 10, 16);
    ctx.fillText(`YIELD: `, 10, 30);
    ctx.fillStyle = parseFloat(yieldPct) > 85 ? '#25E86E' : '#FF2A42';
    ctx.fillText(`${yieldPct}%`, 52, 30);

    ctx.fillStyle = '#64748B';
    ctx.fillText(`SEED: ${this.seed}`, width - 110, 16);
  }
}

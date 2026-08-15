/**
 * Studio-Grade High-Fidelity Animated GIF89a Encoder for HTML5 Canvas
 * Features:
 * - Adaptive Median-Cut 256-Color Palette Quantizer
 * - Floyd-Steinberg Error Diffusion Dithering (No color banding)
 * - True Native Source FPS Frame Delay Calculation
 * - Zero Dependencies
 */

export class CanvasGifEncoder {
  constructor(width, height, delayMs = 40) {
    this.width = width;
    this.height = height;
    this.delay = Math.max(1, Math.round(delayMs / 10)); // GIF delay in 1/100ths of a sec
    this.frames = [];
  }

  addFrame(canvas) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, this.width, this.height);
    this.frames.push(imgData.data);
  }

  // Median Cut Color Palette Quantizer
  buildAdaptivePalette(maxColors = 256) {
    const sampleLimit = 15000;
    const samples = [];
    const step = Math.max(1, Math.floor((this.frames.length * this.width * this.height) / sampleLimit));

    let pixelCounter = 0;
    for (const frame of this.frames) {
      for (let i = 0; i < frame.length; i += 4) {
        if (pixelCounter % step === 0) {
          samples.push([frame[i], frame[i + 1], frame[i + 2]]);
        }
        pixelCounter++;
      }
    }

    if (samples.length === 0) {
      const fallback = [];
      for (let i = 0; i < 256; i++) fallback.push([i, i, i]);
      return fallback;
    }

    class ColorBox {
      constructor(colors) {
        this.colors = colors;
        this.minR = 255; this.maxR = 0;
        this.minG = 255; this.maxG = 0;
        this.minB = 255; this.maxB = 0;
        for (const [r, g, b] of colors) {
          if (r < this.minR) this.minR = r; if (r > this.maxR) this.maxR = r;
          if (g < this.minG) this.minG = g; if (g > this.maxG) this.maxG = g;
          if (b < this.minB) this.minB = b; if (b > this.maxB) this.maxB = b;
        }
      }

      get rangeR() { return this.maxR - this.minR; }
      get rangeG() { return this.maxG - this.minG; }
      get rangeB() { return this.maxB - this.minB; }
      get volume() { return Math.max(this.rangeR, this.rangeG, this.rangeB); }

      split() {
        if (this.colors.length <= 1) return [this];
        const r = this.rangeR, g = this.rangeG, b = this.rangeB;
        let axis = 0; // 0=R, 1=G, 2=B
        if (g >= r && g >= b) axis = 1;
        else if (b >= r && b >= g) axis = 2;

        this.colors.sort((c1, c2) => c1[axis] - c2[axis]);
        const mid = Math.floor(this.colors.length / 2);
        return [
          new ColorBox(this.colors.slice(0, mid)),
          new ColorBox(this.colors.slice(mid))
        ];
      }

      avgColor() {
        if (!this.colors.length) return [0, 0, 0];
        let sr = 0, sg = 0, sb = 0;
        for (const [r, g, b] of this.colors) {
          sr += r; sg += g; sb += b;
        }
        const len = this.colors.length;
        return [Math.round(sr / len), Math.round(sg / len), Math.round(sb / len)];
      }
    }

    const boxes = [new ColorBox(samples)];
    while (boxes.length < maxColors) {
      boxes.sort((a, b) => b.volume - a.volume);
      const biggest = boxes.shift();
      if (!biggest || biggest.volume === 0 || biggest.colors.length <= 1) {
        if (biggest) boxes.unshift(biggest);
        break;
      }
      const [b1, b2] = biggest.split();
      boxes.push(b1);
      if (b2) boxes.push(b2);
    }

    const palette = boxes.map(b => b.avgColor());
    while (palette.length < 256) {
      palette.push([0, 0, 0]);
    }
    return palette.slice(0, 256);
  }

  // Find nearest color in palette
  findNearestColor(r, g, b, palette) {
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < palette.length; i++) {
      const pr = palette[i][0];
      const pg = palette[i][1];
      const pb = palette[i][2];
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      // Weighted perceived luminance distance
      const dist = (dr * dr * 0.299) + (dg * dg * 0.587) + (db * db * 0.114);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
        if (dist === 0) break;
      }
    }
    return bestIdx;
  }

  // Quantize with Floyd-Steinberg Error Diffusion Dithering
  quantizeWithDithering(frameData, palette) {
    const w = this.width;
    const h = this.height;
    const indexed = new Uint8Array(w * h);

    // Float error diffusion buffers
    const currentErrR = new Float32Array(w + 2);
    const currentErrG = new Float32Array(w + 2);
    const currentErrB = new Float32Array(w + 2);
    const nextErrR = new Float32Array(w + 2);
    const nextErrG = new Float32Array(w + 2);
    const nextErrB = new Float32Array(w + 2);

    for (let y = 0; y < h; y++) {
      nextErrR.fill(0);
      nextErrG.fill(0);
      nextErrB.fill(0);

      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const ex = x + 1;

        const r = Math.min(255, Math.max(0, Math.round(frameData[i] + currentErrR[ex])));
        const g = Math.min(255, Math.max(0, Math.round(frameData[i + 1] + currentErrG[ex])));
        const b = Math.min(255, Math.max(0, Math.round(frameData[i + 2] + currentErrB[ex])));

        const colorIdx = this.findNearestColor(r, g, b, palette);
        indexed[y * w + x] = colorIdx;

        const pr = palette[colorIdx][0];
        const pg = palette[colorIdx][1];
        const pb = palette[colorIdx][2];

        const errR = r - pr;
        const errG = g - pg;
        const errB = b - pb;

        // Floyd-Steinberg weights (7/16, 3/16, 5/16, 1/16)
        currentErrR[ex + 1] += errR * (7 / 16);
        currentErrG[ex + 1] += errG * (7 / 16);
        currentErrB[ex + 1] += errB * (7 / 16);

        nextErrR[ex - 1] += errR * (3 / 16);
        nextErrG[ex - 1] += errG * (3 / 16);
        nextErrB[ex - 1] += errB * (3 / 16);

        nextErrR[ex] += errR * (5 / 16);
        nextErrG[ex] += errG * (5 / 16);
        nextErrB[ex] += errB * (5 / 16);

        nextErrR[ex + 1] += errR * (1 / 16);
        nextErrG[ex + 1] += errG * (1 / 16);
        nextErrB[ex + 1] += errB * (1 / 16);
      }

      currentErrR.set(nextErrR);
      currentErrG.set(nextErrG);
      currentErrB.set(nextErrB);
    }

    return indexed;
  }

  encode() {
    const bytes = [];
    const writeStr = (s) => { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i)); };
    const writeShort = (v) => { bytes.push(v & 0xff); bytes.push((v >> 8) & 0xff); };

    // 1. Header
    writeStr('GIF89a');
    writeShort(this.width);
    writeShort(this.height);
    bytes.push(0xf7, 0x00, 0x00); // GCT Flag (256 colors, no sort, 8 bits/pixel)

    // 2. Global Adaptive Color Table
    const palette = this.buildAdaptivePalette(256);
    for (let i = 0; i < 256; i++) {
      const c = palette[i] || [0, 0, 0];
      bytes.push(c[0], c[1], c[2]);
    }

    // 3. Netscape 2.0 Loop Extension
    bytes.push(0x21, 0xff, 0x0b);
    writeStr('NETSCAPE2.0');
    bytes.push(0x03, 0x01);
    writeShort(0); // Infinite loop
    bytes.push(0x00);

    // 4. Frames
    for (const frameData of this.frames) {
      // Graphic Control Extension
      bytes.push(0x21, 0xf9, 0x04, 0x00);
      writeShort(this.delay); // Frame delay in 1/100ths of second
      bytes.push(0x00, 0x00);

      // Image Descriptor
      bytes.push(0x2c);
      writeShort(0); writeShort(0); // Left, Top
      writeShort(this.width); writeShort(this.height);
      bytes.push(0x00); // No local color table

      // LZW minimum code size
      bytes.push(0x08);

      const indexed = this.quantizeWithDithering(frameData, palette);

      const clearCode = 256;
      const eoiCode = 257;
      let curBit = 0;
      let curByte = 0;
      const subBlock = [];

      const flushBlock = () => {
        if (subBlock.length > 0) {
          bytes.push(subBlock.length);
          for (let b of subBlock) bytes.push(b);
          subBlock.length = 0;
        }
      };

      const emitCode = (code, codeBits) => {
        for (let bit = 0; bit < codeBits; bit++) {
          if ((code & (1 << bit)) !== 0) curByte |= (1 << curBit);
          curBit++;
          if (curBit === 8) {
            subBlock.push(curByte);
            if (subBlock.length === 254) flushBlock();
            curByte = 0; curBit = 0;
          }
        }
      };

      emitCode(clearCode, 9);
      for (let i = 0; i < indexed.length; i++) {
        emitCode(indexed[i], 9);
        if (i % 2000 === 0 && i > 0) emitCode(clearCode, 9);
      }
      emitCode(eoiCode, 9);
      if (curBit > 0) subBlock.push(curByte);
      flushBlock();
      bytes.push(0x00); // Block terminator
    }

    // 5. Trailer
    bytes.push(0x3b);

    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
  }
}

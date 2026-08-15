let f = 0;
let waves = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  background(0, 0, 0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  waves.push({
    x: mouseX,
    y: mouseY,
    startFrame: frameCount,
    hue: random(360),
    maxRadius: max(width, height) * 0.85,
    duration: 120
  });
}

function touchStarted() {
  waves.push({
    x: mouseX,
    y: mouseY,
    startFrame: frameCount,
    hue: random(360),
    maxRadius: max(width, height) * 0.85,
    duration: 120
  });
  return false;
}

function draw() {
  background(0, 0, 0, 25);
  noStroke();
  let size = min(width, height) / 15;
  let cols = ceil(width / size) + 2;
  let rows = ceil(height / size) + 2;
  waves = waves.filter(w => frameCount - w.startFrame <= w.duration);

  for (let x = -1; x < cols; x++) {
    for (let y = -1; y < rows; y++) {
      let baseX = x * size;
      let baseY = y * size;
      let wave1 = sin(x * 0.3 + f / 30) * size * 0.3;
      let wave2 = cos(y * 0.3 + f / 40) * size * 0.3;
      let diagWave = sin((x + y) * 0.4 + f / 50) * size * 0.4;
      let posX = baseX + wave1 + diagWave;
      let posY = baseY + wave2 + diagWave;
      let baseSize = size * 0.5 * (1 + 0.3 * sin(x * 0.5 + y * 0.5 + f / 20));
      let rotation = sin((x + y) * 0.2 + f / 30) * PI / 4;
      let baseColor = color(0, 0, 100, 100);
      let calculatedColor = baseColor;
      let maxInfluence = 0;
      let dispX = 0;
      let dispY = 0;
      let waveHue = 0;
      let cellCenterX = baseX + size / 2;
      let cellCenterY = baseY + size / 2;

      waves.forEach(wave => {
        let frameDiff = frameCount - wave.startFrame;
        let progress = frameDiff / wave.duration;
        let currentRadius = progress * wave.maxRadius;
        let waveThickness = size * 5;
        let distanceToWave = dist(cellCenterX, cellCenterY, wave.x, wave.y);
        let distFromRing = abs(distanceToWave - currentRadius);
        let currentInfluence = 0;

        if (distFromRing < waveThickness / 2) {
          let ringInfluence = 1 - distFromRing / (waveThickness / 2);
          let fadeInfluence = pow(1 - progress, 0.5);
          currentInfluence = pow(ringInfluence * fadeInfluence, 1.5);
          currentInfluence = max(0, currentInfluence);
        }

        if (currentInfluence > maxInfluence) {
          maxInfluence = currentInfluence;
          waveHue = wave.hue;
          let waveColorTarget = color(wave.hue, 95, 100);
          calculatedColor = lerpColor(baseColor, waveColorTarget, maxInfluence);
          let angle = atan2(cellCenterY - wave.y, cellCenterX - wave.x);
          let displacementStrength = maxInfluence * size * 0.3;
          dispX = cos(angle) * displacementStrength;
          dispY = sin(angle) * displacementStrength;
        }
      });

      let sizeMultiplier = 1 + maxInfluence * 0.5;
      let finalSize = baseSize * sizeMultiplier;
      let h = hue(calculatedColor);
      let s_ = saturation(calculatedColor);
      let b = brightness(calculatedColor);
      let a = alpha(calculatedColor);
      let brightnessBoost = maxInfluence * 40;
      let finalBrightness = min(b + brightnessBoost, 100);
      let finalColor = color(h, s_, finalBrightness, a);
      let finalDrawX = posX + dispX;
      let finalDrawY = posY + dispY;

      push();
      translate(finalDrawX, finalDrawY);
      rotate(rotation);

      if (maxInfluence > 0.05) {
        let glowSat = 90;
        let glowBrightness = 100;
        let glowAlpha1 = maxInfluence * 25;
        let glowSize1 = finalSize * 1.4;
        fill(waveHue, glowSat, glowBrightness, glowAlpha1);
        rect(-glowSize1 / 2, -glowSize1 / 2, glowSize1, glowSize1);
        let glowAlpha2 = maxInfluence * 15;
        let glowSize2 = finalSize * 1.8;
        fill(waveHue, glowSat, glowBrightness, glowAlpha2);
        rect(-glowSize2 / 2, -glowSize2 / 2, glowSize2, glowSize2);
      }

      fill(finalColor);
      rect(-finalSize / 2, -finalSize / 2, finalSize, finalSize);
      pop();
    }
  }

  f++;
}
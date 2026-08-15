const canvas = document.getElementById('shaderCanvas');
const gl = canvas.getContext('webgl');
if (!gl) {
  const errorBox = document.createElement('div');
  errorBox.style.position = 'absolute';
  errorBox.style.top = '10px';
  errorBox.style.left = '10px';
  errorBox.style.padding = '10px';
  errorBox.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  errorBox.style.color = 'white';
  errorBox.style.fontFamily = 'sans-serif';
  errorBox.style.borderRadius = '5px';
  errorBox.textContent = 'Error: WebGL is not supported or enabled in your browser.';
  document.body.appendChild(errorBox);
  throw new Error('WebGL not supported');
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const shaderType = type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
    console.error(`Shader compile error (${shaderType}):`, gl.getShaderInfoLog(shader));
    console.error("Shader source:\n", source);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec2 mouse;
  uniform vec2 rippleCenter;
  uniform float rippleTime;
  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }
  vec2 rotate(vec2 uv, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c) * uv;
  }
  float neonStreakPattern(vec2 uv, float time, out float diagCoord) {
    float speed1 = 0.8;
    float speed2 = -0.6;
    float scale1 = 5.0;
    float scale2 = 8.0;
    float diag1 = uv.x + uv.y;
    float lines1 = fract(diag1 * scale1 - time * speed1);
    float streaks1 = smoothstep(0.0, 0.015, lines1) - smoothstep(0.04, 0.055, lines1);
    float diag2 = uv.x - uv.y;
    float lines2 = fract(diag2 * scale2 + time * speed2);
    float streaks2 = smoothstep(0.0, 0.01, lines2) - smoothstep(0.03, 0.04, lines2);
    diagCoord = (streaks1 > streaks2) ? diag1 : diag2;
    return max(streaks1, streaks2);
  }
  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;
    vec2 m = (mouse - 0.5 * resolution.xy) / resolution.y;
    if (mouse.x < 0.0 || mouse.y < 0.0) {
      m = vec2(1000.0, 1000.0);
    }
    vec2 uv_background = uv;
    float distMouseBG = length(uv_background - m);
    float swirl = 0.0;
    if (distMouseBG < 2.0) {
      swirl = sin(distMouseBG * 10.0 - time * 3.0);
      if (distMouseBG > 0.001) {
        uv_background += normalize(uv_background - m) * swirl * 0.1;
      }
    }
    float r = length(uv_background);
    float angle = atan(uv_background.y, uv_background.x);
    angle += sin(r * 8.0 - time * 2.0) * 0.3;
    vec2 uvSwirl = vec2(cos(angle), sin(angle)) * r;
    float plasma = sin(uvSwirl.x * 3.0 + time)
                  + sin(uvSwirl.y * 3.0 + time)
                  + sin((uvSwirl.x + uvSwirl.y) * 3.0 + time);
    plasma = plasma / 3.0;
    float modPattern = sin(r * 10.0 - time * 2.0);
    plasma += modPattern * 0.3;
    vec2 rc = (rippleCenter - 0.5 * resolution.xy) / resolution.y;
    float rippleDist = length(uv_background - rc);
    float ripple = 0.0;
    vec2 rippleGradient = vec2(0.0);
    if (rippleTime > 0.0 && rippleTime < 3.0) {
      float rippleWave = sin(20.0 * (rippleDist - rippleTime)) * exp(-pow(rippleDist - rippleTime, 2.0) * 3.0);
      float rippleIntensity = smoothstep(0.0, 0.3, rippleTime) * smoothstep(3.0, 2.5, rippleTime);
      ripple = rippleWave * rippleIntensity;
      if (rippleDist > 0.001) {
        rippleGradient = normalize(uv_background - rc);
      }
    }
    float backgroundPattern = plasma + ripple;
    vec3 backgroundColor = palette(backgroundPattern,
                                    vec3(0.2, 0.0, 0.3),
                                    vec3(0.8, 1.2, 1.0),
                                    vec3(1.0, 1.0, 1.0),
                                    vec3(0.1, 0.2, 0.3));
    backgroundColor = pow(backgroundColor, vec3(0.8, 1.0, 1.2));
    vec2 uv_streaks = uv;
    float distMouseStreaks = length(uv_streaks - m);
    float mousePushFactor = smoothstep(0.3, 0.0, distMouseStreaks) * 0.05;
    if (distMouseStreaks > 0.001) {
      uv_streaks += normalize(uv_streaks - m) * mousePushFactor;
    }
    float rippleDistortionStrength = 0.1;
    uv_streaks += rippleGradient * ripple * rippleDistortionStrength;
    float streakDiagCoord;
    float streakMask = neonStreakPattern(uv_streaks * 1.5, time, streakDiagCoord);
    float colorPhase = fract(streakDiagCoord * 0.3 - time * 0.4);
    vec3 dynamicStreakColor = palette(colorPhase,
                                      vec3(0.5, 0.5, 0.5),
                                      vec3(0.6, 0.6, 0.6),
                                      vec3(1.0, 1.0, 1.0),
                                      vec3(0.0, 0.33, 0.67));
    vec3 finalColor = backgroundColor + dynamicStreakColor * streakMask * 2.0;
    finalColor = clamp(finalColor, 0.0, 1.0);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
if (!vertexShader || !fragmentShader) {
  const errorBox = document.createElement('div');
  errorBox.style.position = 'absolute';
  errorBox.textContent = 'Error: Shader compilation failed. Check console.';
  document.body.appendChild(errorBox);
  throw new Error('Shader creation failed');
}

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error('Program link error:', gl.getProgramInfoLog(program));
  const errorBox = document.createElement('div');
  errorBox.style.position = 'absolute';
  errorBox.textContent = 'Error: Shader program linking failed. Check console.';
  document.body.appendChild(errorBox);
  throw new Error('Program link failed');
}
gl.useProgram(program);

const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
const positionLocation = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const resolutionLocation = gl.getUniformLocation(program, 'resolution');
const timeLocation = gl.getUniformLocation(program, 'time');
const mouseLocation = gl.getUniformLocation(program, 'mouse');
const rippleCenterLocation = gl.getUniformLocation(program, 'rippleCenter');
const rippleTimeLocation = gl.getUniformLocation(program, 'rippleTime');

let mousePos = { x: -1000 * window.devicePixelRatio, y: -1000 * window.devicePixelRatio };
let targetMouse = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };
const smoothing = 0.1;

function updateMouseSmooth() {
  const targetX_scaled = targetMouse.x * window.devicePixelRatio;
  const targetY_scaled = targetMouse.y * window.devicePixelRatio;
  mousePos.x += (targetX_scaled - mousePos.x) * smoothing;
  mousePos.y += (targetY_scaled - mousePos.y) * smoothing;
}

canvas.addEventListener('mousemove', (e) => {
  targetMouse = { x: e.clientX, y: canvas.clientHeight - e.clientY };
});
canvas.addEventListener('mouseout', () => {
  targetMouse = { x: -1000, y: -1000 };
  mousePos = { x: -1000 * window.devicePixelRatio, y: -1000 * window.devicePixelRatio };
});
canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    targetMouse = { x: e.touches[0].clientX, y: canvas.clientHeight - e.touches[0].clientY };
  }
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchend', () => {
  targetMouse = { x: -1000, y: -1000 };
  mousePos = { x: -1000 * window.devicePixelRatio, y: -1000 * window.devicePixelRatio };
});

let ripple = {
  active: false,
  center: { x: (canvas.clientWidth / 2) * window.devicePixelRatio, y: (canvas.clientHeight / 2) * window.devicePixelRatio },
  startTime: 0,
  duration: 3.0
};

function triggerRipple(clientX, clientY) {
  ripple.center = {
    x: clientX * window.devicePixelRatio,
    y: (canvas.clientHeight - clientY) * window.devicePixelRatio
  };
  ripple.startTime = performance.now() * 0.001;
  ripple.active = true;
}

canvas.addEventListener('click', (e) => { triggerRipple(e.clientX, e.clientY); });
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) { triggerRipple(e.touches[0].clientX, e.touches[0].clientY); }
  e.preventDefault();
}, { passive: false });

function resize() {
  const displayWidth = Math.floor(canvas.clientWidth * window.devicePixelRatio);
  const displayHeight = Math.floor(canvas.clientHeight * window.devicePixelRatio);
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    console.log(`Canvas resized to: ${canvas.width}x${canvas.height} (DPR: ${window.devicePixelRatio})`);
  }
}
window.addEventListener('resize', resize);
resize();

function render(time) {
  time *= 0.001;
  updateMouseSmooth();
  let currentRippleTime = -1.0;
  if (ripple.active) {
    currentRippleTime = time - ripple.startTime;
    if (currentRippleTime > ripple.duration) {
      ripple.active = false;
      currentRippleTime = -1.0;
    }
  }
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform1f(timeLocation, time);
  gl.uniform2f(mouseLocation, mousePos.x, mousePos.y);
  gl.uniform2f(rippleCenterLocation, ripple.center.x, ripple.center.y);
  gl.uniform1f(rippleTimeLocation, currentRippleTime);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

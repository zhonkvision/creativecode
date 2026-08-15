/** Bump when FRAG/COMMON change so the live renderer recompiles (HMR-safe). */
export const SHADER_REV = 6

export const VERT = `#version 300 es
layout(location=0) in vec2 a_pos;
out vec2 v_uv;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

// Uniforms + the ink model itself, shared by the composite and separation passes.
const COMMON = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

#define MAXL 6

uniform sampler2D u_img;
uniform vec2 u_imgRes;
uniform int u_count;
uniform int u_only;      // -1 = print every drum; otherwise isolate this one
uniform vec3 u_paper;
uniform float u_paperTex;       // user intensity of stock tooth/fiber
uniform vec4 u_paperMat;        // fiberScale, fiberAniso, fleck, warmth
uniform float u_paperTooth;     // stock default roughness
uniform float u_paperCalender;  // stock smoothness (kills micro-tooth)
uniform float u_bleed;
uniform float u_roller;
uniform float u_grain;
uniform float u_wear; // edge falloff + drum streaks + hickeys
uniform float u_bright;
uniform float u_contrast;
uniform float u_sat;

uniform vec3 u_ink[MAXL];
uniform float u_density[MAXL];
uniform float u_lcon[MAXL];
uniform int u_sep[MAXL];
uniform int u_tex[MAXL];
uniform float u_scale[MAXL];
uniform float u_angle[MAXL];
uniform vec2 u_off[MAXL];
uniform float u_rot[MAXL];
uniform float u_seed[MAXL];

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i), hash12(i + vec2(1, 0)), f.x),
    mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 4; i++){ v += a * vnoise(p); p = p * 2.03 + 11.3; a *= 0.5; }
  return v;
}
vec2 rot2(vec2 p, float a){
  float s = sin(a), c = cos(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

vec3 adjust(vec3 c){
  c += u_bright;
  c = (c - 0.5) * u_contrast + 0.5;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, u_sat);
  return clamp(c, 0.0, 1.0);
}

float separate(vec3 c, int mode){
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  float k = 1.0 - max(c.r, max(c.g, c.b));
  float d = max(1.0 - k, 1e-4);
  if(mode == 0) return 1.0 - lum;
  if(mode == 1) return (1.0 - c.r - k) / d;
  if(mode == 2) return (1.0 - c.g - k) / d;
  if(mode == 3) return (1.0 - c.b - k) / d;
  if(mode == 4) return k;
  if(mode == 5) return clamp((c.r - (c.g + c.b) * 0.5) * 1.6, 0.0, 1.0);
  if(mode == 6) return clamp((c.g - (c.r + c.b) * 0.5) * 1.6, 0.0, 1.0);
  if(mode == 7) return clamp((c.b - (c.r + c.g) * 0.5) * 1.6, 0.0, 1.0);
  if(mode == 8) return smoothstep(0.65, 0.10, lum);
  if(mode == 9) return 1.0 - smoothstep(0.0, 0.45, abs(lum - 0.45));
  if(mode == 10) return smoothstep(0.35, 0.95, lum);
  return 1.0;
}

// How much ink this drum asks for at this point, before it meets a screen.
float coverage(int i, vec2 uv){
  vec3 c = adjust(texture(u_img, uv).rgb);
  float cov = separate(c, u_sep[i]);
  cov = clamp((cov - 0.5) * u_lcon[i] + 0.5, 0.0, 1.0);
  return clamp(cov * u_density[i], 0.0, 1.0);
}

// Lay the ink down through a screen. p is in image pixels (registered space).
float screenInk(float cov, vec2 p, int mode, float sc, float ang, float seed){
  cov = clamp(cov, 0.0, 1.0);
  // below this the stencil simply isn't burned — keeps highlights paper-clean
  float open = smoothstep(0.008, 0.06, cov);
  float gain = 1.0 + u_bleed * 0.35;         // dot gain: ink spreads
  float soft = mix(0.03, 0.22, u_bleed);      // edge softness: ink wicks into paper

  if(mode == 6){ // flat wash — still slightly mottled, riso can't do true flat
    float m = vnoise(p / 90.0 + seed) * 0.5 + vnoise(p / 14.0 + seed) * 0.5;
    return open * clamp(cov * gain * (0.92 + 0.16 * m), 0.0, 1.0);
  }
  if(mode == 3){ // halftone dot
    vec2 q = rot2(p, ang) / max(sc, 1.0);
    vec2 cell = floor(q) + 0.5;
    vec2 j = (vec2(hash12(cell + seed), hash12(cell + seed + 7.13)) - 0.5) * 0.24;
    float d = length(q - cell - j);
    float r = sqrt(cov) * 0.75 * gain;
    return open * smoothstep(r + soft, r - soft, d);
  }
  if(mode == 4){ // line screen
    vec2 q = rot2(p, ang) / max(sc, 1.0);
    float s = abs(fract(q.y + (hash12(vec2(floor(q.y), seed)) - 0.5) * 0.1) - 0.5) * 2.0;
    return open * smoothstep(cov * gain + soft, cov * gain - soft, s);
  }
  if(mode == 5){ // diffusion — coverage pushed around by cloudy noise
    float n = fbm(p / max(sc * 2.5, 2.0) + seed * 3.1);
    return open * smoothstep(0.5 - soft - 0.06, 0.5 + soft + 0.06, cov * gain + (n - 0.5) * 0.85);
  }

  // stochastic grains
  float n;
  if(mode == 0){        // fine — sharp per-speck
    n = hash12(floor(p / max(sc * 0.4, 1.0)) + floor(seed * 91.0));
  } else if(mode == 1){ // rough — chunkier clusters
    n = vnoise(p / max(sc, 1.0) + seed * 13.7) * 0.72 + hash12(floor(p / max(sc * 0.5, 1.0)) + seed) * 0.28;
  } else {              // dirty — clumpy blotches
    n = fbm(p / max(sc * 2.2, 2.0) + seed * 5.3) * 0.8 + hash12(floor(p / 2.0) + seed) * 0.2;
  }
  float g = mix(0.06, 0.3, u_bleed);
  return open * smoothstep(n - g, n + g, cov * gain);
}
`

// Composite pass — the proof on the press bed. With u_only >= 0 it prints a
// single drum on bare paper, which is what a proof separation is.
export const FRAG =
  COMMON +
  `
void main(){
  vec2 P = v_uv * u_imgRes;

  // Normalize paper feature size to a 1600px visual edge — same idea as
  // screen resolutionScale — so preview and high-res export keep the same
  // fiber frequency instead of stretching source-pixel noise.
  float paperScale = max(u_imgRes.x, u_imgRes.y) / 1600.0;
  vec2 Pp = P / max(paperScale, 1e-4);

  float fiberScale = u_paperMat.x;
  float fiberAniso = u_paperMat.y;
  float fleckAmt = u_paperMat.z;
  float warmthAmt = u_paperMat.w;
  // Stock character × user intensity. At 0 the sheet is almost flat; at 1
  // the stock's baked tooth reads fully.
  float amp = clamp(u_paperTooth * mix(0.12, 1.2, u_paperTex), 0.0, 1.25);
  float fineGain = 1.0 - u_paperCalender * 0.78;
  // Higher fiberScale = coarser pulp = lower spatial frequency.
  float freq = mix(1.45, 0.52, fiberScale);

  // Machine-direction stretch: newsprint pulls hard along the feed.
  vec2 aniso = vec2(mix(1.0, 0.32, fiberAniso), mix(1.0, 2.9, fiberAniso));
  vec2 anisoCross = vec2(mix(1.0, 2.4, fiberAniso), mix(1.0, 0.4, fiberAniso));

  // --- multi-scale paper stock ---
  float coarse = fbm(Pp * vec2(0.017, 0.105) * freq * aniso);
  float mid =
    fbm(Pp * vec2(0.085, 0.032) * freq * aniso) * 0.55 +
    fbm(Pp * vec2(0.038, 0.11) * freq * anisoCross) * 0.45;
  float fine =
    vnoise(Pp * mix(2.4, 0.95, u_paperCalender) * freq + 3.1) * 0.55 +
    vnoise(Pp * mix(6.2, 2.4, u_paperCalender) * freq + 19.7) * 0.45;

  float fib = coarse * 0.38 + mid * 0.37 + fine * fineGain * 0.25;
  float fiberMod = (fib - 0.5) * 2.0;
  float albedoAmp = amp * mix(0.055, 0.145, 1.0 - u_paperCalender);
  vec3 paper = u_paper * (1.0 - albedoAmp * fiberMod);

  // Warm/cool pulp mottling — cream/kraft lean warm, dove gray stays cool.
  float warmN = fbm(Pp * 0.028 * freq + 41.2);
  paper += vec3(0.045, 0.012, -0.028) * warmthAmt * amp * (warmN - 0.5) * 2.0;

  // Soft pulp flecks (no binary 2px cells — those read as grit when upscaled).
  float cell = mix(4.2, 2.6, fleckAmt);
  vec2 fc = floor(Pp / cell);
  vec2 ff = fract(Pp / cell);
  float fh = hash12(fc + 3.7);
  float fleckGate = smoothstep(0.993 - fleckAmt * 0.045, 0.999, fh);
  vec2 fJitter = (vec2(hash12(fc + 1.3), hash12(fc + 8.9)) - 0.5) * 0.35;
  float fleckBlob = 1.0 - smoothstep(0.12, 0.48, length(ff - 0.5 + fJitter));
  float flecks = fleckGate * fleckBlob * fleckAmt;
  paper = mix(paper, paper * mix(0.7, 0.86, u_paperCalender), flecks * amp);
  paper = clamp(paper, 0.0, 1.0);

  vec3 col = paper;

  // --- ink drums, printed one pass at a time ---
  for(int i = 0; i < MAXL; i++){
    if(i >= u_count) break;
    if(u_only >= 0 && i != u_only) continue;
    // registration: each pass lands slightly differently
    vec2 uv = rot2(v_uv - 0.5, u_rot[i]) + 0.5 + u_off[i] / u_imgRes;
    if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) continue;

    float cov = coverage(i, uv);

    // uneven roller pressure — soft vertical banding along the feed
    float band = fbm(vec2(uv.y * 2.2, uv.x * 0.9) + u_seed[i]);
    cov *= 1.0 - u_roller * 0.55 * band;

    // --- press wear (edge falloff + drum streaks + hickeys) ---
    // Slider is remapped so former ~40% intensity reads as 100%.
    float w = clamp(u_wear, 0.0, 1.0) * 0.4;

    // Hard edge / lead-edge starve — at full wear the margins go nearly bare.
    float edgeX = smoothstep(0.0, 0.22, uv.x) * smoothstep(1.0, 0.78, uv.x);
    float edgeY = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y);
    float lead = smoothstep(0.0, 0.35, uv.y);
    float edgeMask = edgeX * edgeY * mix(1.0, lead, 0.65);
    cov *= mix(1.0, edgeMask * (0.55 + 0.45 * fbm(uv * 2.4 + u_seed[i])), w);

    // Drum streaks — thick vertical wear bands (paper-pixel space).
    float streakPitch = 18.0;
    float streakX = abs(mod(Pp.x + u_seed[i] * 7.0, streakPitch) - streakPitch * 0.5);
    float streakBand = 1.0 - smoothstep(1.2, 4.5, streakX);
    float streakBreak = smoothstep(0.2, 0.8, vnoise(vec2(Pp.x * 0.04, Pp.y / 28.0 + u_seed[i])));
    float streakPick = step(0.35, hash12(vec2(floor((Pp.x + u_seed[i] * 7.0) / streakPitch), u_seed[i] + 3.1)));
    cov *= 1.0 - w * streakBand * streakBreak * streakPick * 0.92;

    // Treat screen scale as a visual size rather than a raw source-pixel size.
    // This keeps grain and dots proportionate on typical uploads and makes a
    // high-resolution export match the preview instead of becoming finer.
    float resolutionScale = max(u_imgRes.x, u_imgRes.y) / 1600.0;
    float visualScale = max(1.0, u_scale[i] * resolutionScale);
    float a = screenInk(cov, uv * u_imgRes, u_tex[i], visualScale, u_angle[i], u_seed[i]);

    // Tooth resists ink on raised mid/fine fibers — calendered stocks bite less.
    float resist = mid * 0.42 + fine * 0.58;
    a *= 1.0 - amp * 0.34 * fineGain * smoothstep(0.38, 0.88, resist);

    // Hickeys — sparse press dirt / lint voids. Organic shapes, not a stamp grid:
    // warped ellipses, soft noisy rims, occasional doughnut rings, rare clusters.
    float hCellPx = 54.0;
    vec2 hOff = vec2(u_seed[i] * 13.7, u_seed[i] * 5.3);
    vec2 hCell = floor(Pp / hCellPx + hOff);
    float hRoll = hash12(hCell + u_seed[i] * 2.1);
    // Sparse: only a few cells fire, with a soft probability ramp (no hard pop).
    float hChance = mix(0.0, 0.16, w) * mix(0.55, 1.45, hash12(hCell + 0.7));
    float hGate = smoothstep(1.0 - hChance, 1.0 - hChance * 0.35, hRoll);
    if(hGate > 0.001){
      vec2 hLocal = (fract(Pp / hCellPx + hOff) - 0.5) * hCellPx;
      // Random center jitter + feed-direction smear.
      vec2 hJ = (vec2(hash12(hCell + 1.3), hash12(hCell + 2.9)) - 0.5) * hCellPx * 0.62;
      hLocal -= hJ;
      float ang = hash12(hCell + 6.2) * 6.28318;
      float ca = cos(ang), sa = sin(ang);
      hLocal = vec2(ca * hLocal.x - sa * hLocal.y, sa * hLocal.x + ca * hLocal.y);
      // Stretch into an irregular blot / smear.
      vec2 hStretch = vec2(mix(0.65, 1.35, hash12(hCell + 3.4)), mix(0.55, 1.5, hash12(hCell + 4.1)));
      hLocal *= hStretch;
      // Warp the silhouette so it isn't a clean ellipse.
      float hWarp = vnoise(hLocal * 0.11 + hCell * 1.7) * 2.8
                  + vnoise(hLocal * 0.28 + 19.0) * 1.1;
      float hD = length(hLocal) + hWarp;
      float hRad = mix(3.2, 9.5, hash12(hCell + 5.5));
      float hKind = hash12(hCell + 8.8);
      // Soft, uneven edge — rim noise breaks the digital falloff.
      float hEdge = hRad * mix(0.55, 1.15, vnoise(hLocal * 0.22 + hCell));
      float voidBody = 1.0 - smoothstep(hRad * 0.15, hEdge, hD);
      // Classic lint doughnut: thin ring of ink around a paper hole.
      float ring = smoothstep(hRad * 0.35, hRad * 0.7, hD) * (1.0 - smoothstep(hRad * 0.85, hRad * 1.35, hD));
      float voidH = mix(voidBody, voidBody * 0.85 + ring * 0.2, step(0.55, hKind));
      // Partial thin-spots (ink starved, not fully open) feel less stamped.
      voidH *= mix(0.45, 1.0, hash12(hCell + 9.3));
      // Occasional satellite speck nearby — cluster of dirt, not one perfect hit.
      float sat = 0.0;
      if(hash12(hCell + 11.0) > 0.72){
        vec2 sLoc = hLocal - vec2(mix(-6.0, 6.0, hash12(hCell + 12.0)), mix(-5.0, 5.0, hash12(hCell + 13.0)));
        float sD = length(sLoc) + vnoise(sLoc * 0.3) * 1.2;
        sat = (1.0 - smoothstep(1.2, 3.8, sD)) * 0.7;
      }
      float inInk = smoothstep(0.02, 0.14, a);
      a *= 1.0 - hGate * max(voidH, sat) * w * inInk;
      // Tiny ink buildup on the dirty side of some hickeys.
      float dirt = (1.0 - smoothstep(hRad * 0.1, hRad * 0.55, hD)) * step(hKind, 0.28);
      a = min(1.0, a + hGate * dirt * w * 0.55 * inInk);
    }

    // translucent soy ink multiplies over what's beneath
    col *= mix(vec3(1.0), u_ink[i], clamp(a, 0.0, 1.0));
  }

  // --- finishing scuff — abrasion on the sheet, readable at a glance ---
  float g1 = vnoise(Pp / 5.5 + 17.31);
  float g2 = vnoise(Pp / 2.2 + 51.7);
  float g3 = vnoise(Pp * 0.9 + 8.3);
  float g4 = fbm(Pp / 18.0 + 63.0);
  // Soft luminance abrasion + coarser rub that actually shifts the print.
  float scuff = (g1 - 0.5) * 0.22 + (g2 - 0.5) * 0.16 + (g3 - 0.5) * 0.1 * fineGain;
  col += scuff * u_grain;
  col *= 1.0 - u_grain * 0.12 * (g4 - 0.35);
  // A little high-frequency pepper so it doesn't read as a flat fog.
  col += (hash12(floor(Pp) + 29.0) - 0.5) * u_grain * 0.06;

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

// Master pass — the plate you actually burn a stencil from: continuous-tone
// black on white, no screen (the Risograph rules its own), no simulated
// misregistration (the real press supplies plenty), no paper, no scuff.
export const MASTER_FRAG =
  COMMON +
  `
void main(){
  float cov = coverage(u_only, v_uv);
  outColor = vec4(vec3(1.0 - cov), 1.0);
}`

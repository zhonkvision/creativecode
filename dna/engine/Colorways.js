/**
 * CreativeCode.my — Visual DNA Colorway Registry & Interpolator
 */

/**
 * @typedef {Object} Colorway
 * @property {string} id
 * @property {string} name
 * @property {string} primary
 * @property {string} secondary
 * @property {string} background
 * @property {string} accent
 * @property {string} glow
 * @property {string[]} spectrum
 */

export const COLORWAYS = {
  phosphor_amber: {
    id: "phosphor_amber",
    name: "Phosphor Amber 84",
    primary: "#FFB000",
    secondary: "#CC8800",
    background: "#0D0900",
    accent: "#FFE580",
    glow: "rgba(255, 176, 0, 0.45)",
    spectrum: ["#FFB000", "#FF8800", "#FF5500", "#CC3300", "#991100"]
  },
  crt_green: {
    id: "crt_green",
    name: "Monochrome CRT Green",
    primary: "#00FF66",
    secondary: "#009933",
    background: "#020D04",
    accent: "#80FFB3",
    glow: "rgba(0, 255, 102, 0.4)",
    spectrum: ["#00FF66", "#00DD55", "#00AA44", "#007733", "#004422"]
  },
  cyber_neon: {
    id: "cyber_neon",
    name: "Compulsive Cyber Red/Green",
    primary: "#FF2A55",
    secondary: "#00F0A0",
    background: "#080B0E",
    accent: "#FFFFFF",
    glow: "rgba(255, 42, 85, 0.45)",
    spectrum: ["#FF2A55", "#FF6B8B", "#00F0A0", "#38EF7D", "#11E8B0"]
  },
  atari_spectrum: {
    id: "atari_spectrum",
    name: "Atari Rainbow Prismatic",
    primary: "#FF0033",
    secondary: "#00D4FF",
    background: "#08080C",
    accent: "#FFE600",
    glow: "rgba(0, 212, 255, 0.4)",
    spectrum: ["#FF0033", "#FF6B00", "#FFE600", "#00FF66", "#00D4FF", "#7928CA", "#FF0080"]
  },
  cosmic_void: {
    id: "cosmic_void",
    name: "Deep Cosmic Spectral Void",
    primary: "#8A2BE2",
    secondary: "#00FFFF",
    background: "#030208",
    accent: "#FF77A8",
    glow: "rgba(138, 43, 226, 0.45)",
    spectrum: ["#8A2BE2", "#4B0082", "#00FFFF", "#FF1493", "#FFD700", "#FF4500"]
  },
  wafer_silicon: {
    id: "wafer_silicon",
    name: "Wafer Yield Defect Infrared",
    primary: "#00E5FF",
    secondary: "#FF3366",
    background: "#060A10",
    accent: "#FFCC00",
    glow: "rgba(0, 229, 255, 0.35)",
    spectrum: ["#00E5FF", "#0088FF", "#FF3366", "#FF9900", "#7700FF"]
  }
};

export function applyColorwayToDom(colorwayId) {
  const cw = COLORWAYS[colorwayId] || COLORWAYS.cyber_neon;
  const root = document.documentElement;
  root.style.setProperty("--dna-primary", cw.primary);
  root.style.setProperty("--dna-secondary", cw.secondary);
  root.style.setProperty("--dna-bg", cw.background);
  root.style.setProperty("--dna-accent", cw.accent);
  root.style.setProperty("--dna-glow", cw.glow);
  return cw;
}

export function hexToRgb(hex) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function lerpColor(hexA, hexB, t) {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * t);
  const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * t);
  const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

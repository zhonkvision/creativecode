import { makeLayer, type StudioState } from './types'

// Real Risograph ink colors (Riso Kagaku standard + fluoro drums)
export interface Ink {
  id: string
  name: string
  hex: string
  fluoro?: boolean
}

export const INKS: Ink[] = [
  { id: 'black', name: 'BLACK', hex: '#1A1A1A' },
  { id: 'blue', name: 'BLUE', hex: '#0078BF' },
  { id: 'mediumblue', name: 'MEDIUM BLUE', hex: '#3255A4' },
  { id: 'federal', name: 'FEDERAL BLUE', hex: '#3D5588' },
  { id: 'cornflower', name: 'CORNFLOWER', hex: '#62A8E5' },
  { id: 'skyblue', name: 'SKY BLUE', hex: '#4982CF' },
  { id: 'aqua', name: 'AQUA', hex: '#5EC8E5' },
  { id: 'teal', name: 'TEAL', hex: '#00838A' },
  { id: 'turquoise', name: 'TURQUOISE', hex: '#00AA93' },
  { id: 'mint', name: 'MINT', hex: '#82D8D5' },
  { id: 'green', name: 'GREEN', hex: '#00A95C' },
  { id: 'kelly', name: 'KELLY GREEN', hex: '#67B346' },
  { id: 'hunter', name: 'HUNTER GREEN', hex: '#407060' },
  { id: 'fluogreen', name: 'FLUO GREEN', hex: '#44D62C', fluoro: true },
  { id: 'yellow', name: 'YELLOW', hex: '#FFE800' },
  { id: 'fluoyellow', name: 'FLUO YELLOW', hex: '#FFE900', fluoro: true },
  { id: 'sunflower', name: 'SUNFLOWER', hex: '#FFB511' },
  { id: 'flatgold', name: 'FLAT GOLD', hex: '#BB8B41' },
  { id: 'metgold', name: 'METALLIC GOLD', hex: '#AC936E' },
  { id: 'orange', name: 'ORANGE', hex: '#FF6C2F' },
  { id: 'fluoorange', name: 'FLUO ORANGE', hex: '#FF7477', fluoro: true },
  { id: 'paprika', name: 'PAPRIKA', hex: '#EE7F4B' },
  { id: 'brightred', name: 'BRIGHT RED', hex: '#F15060' },
  { id: 'red', name: 'RED', hex: '#FF665E' },
  { id: 'scarlet', name: 'SCARLET', hex: '#F65058' },
  { id: 'fluored', name: 'FLUO RED', hex: '#FF4C65', fluoro: true },
  { id: 'fluopink', name: 'FLUO PINK', hex: '#FF48B0', fluoro: true },
  { id: 'bubblegum', name: 'BUBBLE GUM', hex: '#F984CA' },
  { id: 'cranberry', name: 'CRANBERRY', hex: '#D1517A' },
  { id: 'burgundy', name: 'BURGUNDY', hex: '#914E72' },
  { id: 'maroon', name: 'MAROON', hex: '#9E4C6E' },
  { id: 'brown', name: 'BROWN', hex: '#925F52' },
  { id: 'purple', name: 'PURPLE', hex: '#765BA7' },
  { id: 'violet', name: 'VIOLET', hex: '#9D7AD2' },
  { id: 'orchid', name: 'ORCHID', hex: '#AA60BF' },
  { id: 'indigo', name: 'INDIGO', hex: '#484D7A' },
  { id: 'midnight', name: 'MIDNIGHT', hex: '#435060' },
  { id: 'charcoal', name: 'CHARCOAL', hex: '#70747C' },
  { id: 'lightgray', name: 'LIGHT GRAY', hex: '#88898A' },
  { id: 'granite', name: 'GRANITE', hex: '#A5AAA8' },
]

export const inkById = (id: string): Ink => INKS.find((i) => i.id === id) ?? INKS[0]

/** Procedural surface params for a named paper stock. All fields are 0..1. */
export interface Paper {
  id: string
  name: string
  hex: string
  desc: string
  /** Coarseness of the pulp lay (0 = fine bond, 1 = coarse newsprint). */
  fiberScale: number
  /** Machine-direction stretch (0 = isotropic, 1 = strongly laid). */
  fiberAniso: number
  /** Stock roughness / ink bite — character, scaled by paperTex. */
  tooth: number
  /** Pulp speck density. */
  fleck: number
  /** Local warm/cool mottling in the sheet. */
  warmth: number
  /** Smoothness from calendering (1 = polished, kills micro-tooth). */
  calender: number
}

export const PAPERS: Paper[] = [
  {
    id: 'white',
    name: 'BRIGHT WHITE',
    hex: '#FAFAF6',
    desc: 'Fine calendered bond',
    fiberScale: 0.22,
    fiberAniso: 0.22,
    tooth: 0.28,
    fleck: 0.08,
    warmth: 0.08,
    calender: 0.88,
  },
  {
    id: 'cream',
    name: 'CREAM',
    hex: '#F5EEDC',
    desc: 'Soft laid fiber, warm',
    fiberScale: 0.42,
    fiberAniso: 0.4,
    tooth: 0.48,
    fleck: 0.28,
    warmth: 0.55,
    calender: 0.52,
  },
  {
    id: 'natural',
    name: 'NATURAL',
    hex: '#EFE5CB',
    desc: 'Unbleached soft pulp',
    fiberScale: 0.5,
    fiberAniso: 0.45,
    tooth: 0.52,
    fleck: 0.4,
    warmth: 0.68,
    calender: 0.38,
  },
  {
    id: 'newsprint',
    name: 'NEWSPRINT',
    hex: '#E3DFD1',
    desc: 'Coarse anisotropic pulp',
    fiberScale: 0.88,
    fiberAniso: 0.92,
    tooth: 0.72,
    fleck: 0.86,
    warmth: 0.32,
    calender: 0.12,
  },
  {
    id: 'gray',
    name: 'DOVE GRAY',
    hex: '#D6D4CC',
    desc: 'Fine cool fiber',
    fiberScale: 0.3,
    fiberAniso: 0.28,
    tooth: 0.36,
    fleck: 0.18,
    warmth: 0.06,
    calender: 0.72,
  },
  {
    id: 'kraft',
    name: 'KRAFT',
    hex: '#C29A64',
    desc: 'Rough warm stock',
    fiberScale: 0.78,
    fiberAniso: 0.55,
    tooth: 0.88,
    fleck: 0.78,
    warmth: 0.82,
    calender: 0.1,
  },
  {
    id: 'blush',
    name: 'BLUSH',
    hex: '#F4DCD4',
    desc: 'Soft fine tooth',
    fiberScale: 0.34,
    fiberAniso: 0.32,
    tooth: 0.4,
    fleck: 0.18,
    warmth: 0.48,
    calender: 0.62,
  },
  {
    id: 'custom',
    name: 'CUSTOM',
    hex: '#FFFFFF',
    desc: 'Neutral bond',
    fiberScale: 0.4,
    fiberAniso: 0.35,
    tooth: 0.42,
    fleck: 0.24,
    warmth: 0.28,
    calender: 0.55,
  },
]

export const paperById = (id: string): Paper => PAPERS.find((p) => p.id === id) ?? PAPERS[1]

export const paperHex = (s: Pick<StudioState, 'paperId' | 'paperColor'>): string =>
  s.paperId === 'custom' ? s.paperColor : paperById(s.paperId).hex

/** Material uniforms for the composite shader — color is separate via paperHex. */
export interface PaperProfile {
  fiberScale: number
  fiberAniso: number
  tooth: number
  fleck: number
  warmth: number
  calender: number
}

export const paperProfile = (s: Pick<StudioState, 'paperId'>): PaperProfile => {
  const p = paperById(s.paperId === 'custom' ? 'custom' : s.paperId)
  return {
    fiberScale: p.fiberScale,
    fiberAniso: p.fiberAniso,
    tooth: p.tooth,
    fleck: p.fleck,
    warmth: p.warmth,
    calender: p.calender,
  }
}

export interface Preset {
  id: string
  name: string
  desc: string
  build: () => Partial<StudioState>
}

export const PRESETS: Preset[] = [
  {
    id: 'zine',
    name: 'ZINE CLASSIC',
    desc: 'Fluo pink + blue duotone',
    build: () => ({
      paperId: 'cream',
      paperTex: 0.5,
      bleed: 0.35,
      roller: 0.2,
      grain: 0.25,
      wear: 0.34,
      layers: [
        makeLayer('blue', { sep: 0, tex: 0, scale: 2.5, density: 1.05, contrast: 1.15, angle: 15, offX: 2, offY: -1.5, rot: 0.15 }),
        makeLayer('fluopink', { sep: 2, tex: 0, scale: 2.5, density: 1.25, contrast: 1.1, angle: 75, offX: -2.5, offY: 2, rot: -0.2 }),
      ],
    }),
  },
  {
    id: 'process',
    name: 'FULL PROCESS',
    desc: '4-drum CMYK halftone',
    build: () => ({
      paperId: 'white',
      paperTex: 0.4,
      bleed: 0.55,
      roller: 0,
      grain: 0.1,
      wear: 0.1,
      layers: [
        makeLayer('yellow', { sep: 3, tex: 3, scale: 3, angle: 0, density: 1.1, offX: 1.5, offY: 1 }),
        makeLayer('fluopink', { sep: 2, tex: 3, scale: 3, angle: 75, density: 1.0, offX: -2, offY: 1.5, rot: 0.15 }),
        makeLayer('blue', { sep: 1, tex: 3, scale: 3, angle: 15, density: 1.0, offX: 2, offY: -2, rot: -0.1 }),
        makeLayer('black', { sep: 4, tex: 3, scale: 3, angle: 45, density: 0.5, offX: -1, offY: -1 }),
      ],
    }),
  },
  {
    id: 'neon',
    name: 'NEON DUSK',
    desc: 'Fluo orange + purple + teal',
    build: () => ({
      paperId: 'white',
      paperTex: 0.4,
      bleed: 0.3,
      roller: 0.14,
      grain: 0.18,
      wear: 0.25,
      layers: [
        makeLayer('fluoorange', { sep: 10, tex: 1, scale: 2.2, density: 1.15, contrast: 1.15, angle: 30, offX: 1.5, offY: -1, rot: 0.1 }),
        makeLayer('teal', { sep: 7, tex: 3, scale: 2.8, density: 0.85, contrast: 1.15, angle: 15, offX: 0.5, offY: 1.5, rot: -0.08 }),
        makeLayer('purple', { sep: 0, tex: 0, scale: 2, density: 1.05, contrast: 1.3, angle: 70, offX: -1, offY: 1 }),
      ],
    }),
  },
  {
    id: 'newsprint',
    name: 'DAILY BULLETIN',
    desc: 'Coarse black halftone on newsprint',
    build: () => ({
      paperId: 'newsprint',
      paperTex: 0.45,
      bleed: 0.45,
      roller: 0.3,
      grain: 0.35,
      wear: 0.5,
      layers: [
        makeLayer('black', { sep: 0, tex: 3, scale: 3.5, angle: 45, density: 1.05, contrast: 1.2, offX: 1, offY: 1 }),
        makeLayer('brightred', { sep: 5, tex: 3, scale: 3.5, angle: 75, density: 1.3, offX: -3, offY: 2, rot: 0.3 }),
      ],
    }),
  },
  {
    id: 'forest',
    name: 'FIELD NOTES',
    desc: 'Hunter green + gold on natural',
    build: () => ({
      paperId: 'natural',
      paperTex: 0.42,
      bleed: 0.25,
      roller: 0.12,
      grain: 0.16,
      wear: 0.29,
      layers: [
        makeLayer('flatgold', {
          sep: 10,
          tex: 3,
          scale: 2.6,
          density: 1.1,
          contrast: 1.15,
          angle: 75,
          offX: -1,
          offY: 1,
          rot: 0.08,
        }),
        makeLayer('hunter', {
          sep: 0,
          tex: 0,
          scale: 2,
          density: 1.15,
          contrast: 1.3,
          angle: 15,
          offX: 1,
          offY: -0.5,
          rot: -0.06,
        }),
      ],
    }),
  },
  {
    id: 'blueprint',
    name: 'BLUEPRINT',
    desc: 'Single-drum medium blue',
    build: () => ({
      paperId: 'white',
      paperTex: 0.42,
      bleed: 0.3,
      roller: 0.2,
      grain: 0.2,
      wear: 0.27,
      layers: [
        makeLayer('mediumblue', { sep: 0, tex: 5, scale: 2.5, density: 1.2, contrast: 1.35, angle: 45 }),
      ],
    }),
  },
  {
    id: 'sunburn',
    name: 'SUNBURN',
    desc: 'Red + yellow line screens',
    build: () => ({
      paperId: 'natural',
      paperTex: 0.45,
      bleed: 0.5,
      roller: 0.25,
      grain: 0.3,
      wear: 0.42,
      layers: [
        makeLayer('yellow', { sep: 10, tex: 6, density: 1.5, angle: 0 }),
        makeLayer('brightred', { sep: 0, tex: 4, scale: 2.8, density: 1.1, contrast: 1.2, angle: 23, offX: -2.5, offY: 1.5, rot: 0.3 }),
      ],
    }),
  },
  {
    id: 'nightmarket',
    name: 'NIGHT MARKET',
    desc: 'Midnight + fluo orange + aqua',
    build: () => ({
      paperId: 'white',
      paperTex: 0.42,
      bleed: 0.4,
      roller: 0.2,
      grain: 0.25,
      wear: 0.32,
      layers: [
        makeLayer('aqua', { sep: 10, tex: 1, scale: 2.2, density: 1.15, contrast: 1.1, angle: 10, offX: 2, offY: -1 }),
        makeLayer('fluoorange', { sep: 2, tex: 0, scale: 2, density: 1.15, contrast: 1.15, angle: 75, offX: -2, offY: 2, rot: 0.18 }),
        makeLayer('midnight', { sep: 0, tex: 3, scale: 2.8, density: 1.1, contrast: 1.2, angle: 45, offX: 0.5, offY: -1 }),
      ],
    }),
  },
  {
    id: 'plumjam',
    name: 'PLUM JAM',
    desc: 'Purple + pink + sunflower',
    build: () => ({
      paperId: 'cream',
      paperTex: 0.5,
      bleed: 0.35,
      roller: 0.2,
      grain: 0.25,
      wear: 0.34,
      layers: [
        makeLayer('sunflower', { sep: 10, tex: 1, scale: 2.2, density: 1.3, contrast: 1.05, angle: 0, offX: 1, offY: 1 }),
        makeLayer('fluopink', { sep: 2, tex: 0, scale: 2, density: 1.05, contrast: 1.1, angle: 75, offX: -2, offY: 1.5 }),
        makeLayer('purple', { sep: 0, tex: 3, scale: 2.8, density: 1.05, contrast: 1.2, angle: 15, offX: 1.5, offY: -2, rot: -0.15 }),
      ],
    }),
  },
  {
    id: 'seaglass',
    name: 'SEA GLASS',
    desc: 'Federal blue + mint duotone',
    build: () => ({
      paperId: 'natural',
      paperTex: 0.45,
      bleed: 0.35,
      roller: 0.2,
      grain: 0.2,
      wear: 0.32,
      layers: [
        makeLayer('mint', { sep: 10, tex: 1, scale: 2.2, density: 1.25, contrast: 1.05, angle: 75, offX: -1.5, offY: 1 }),
        makeLayer('federal', { sep: 0, tex: 0, scale: 2, density: 1.15, contrast: 1.2, angle: 15, offX: 2, offY: -1.5, rot: 0.15 }),
      ],
    }),
  },
  {
    id: 'tomatopress',
    name: 'TOMATO PRESS',
    desc: 'Scarlet + medium blue + yellow',
    build: () => ({
      paperId: 'white',
      paperTex: 0.4,
      bleed: 0.28,
      roller: 0.14,
      grain: 0.18,
      wear: 0.25,
      layers: [
        makeLayer('yellow', { sep: 10, tex: 6, density: 1.3, contrast: 1.05, angle: 0, offX: 1, offY: 1 }),
        makeLayer('scarlet', { sep: 5, tex: 1, scale: 2.2, density: 1.05, contrast: 1.15, angle: 75, offX: -1, offY: 1 }),
        makeLayer('mediumblue', { sep: 0, tex: 3, scale: 2.8, density: 1, contrast: 1.25, angle: 15, offX: 1, offY: -1, rot: -0.08 }),
      ],
    }),
  },
  {
    id: 'orchard',
    name: 'ORCHARD',
    desc: 'Hunter green + paprika + gold',
    build: () => ({
      paperId: 'cream',
      paperTex: 0.48,
      bleed: 0.28,
      roller: 0.14,
      grain: 0.18,
      wear: 0.29,
      layers: [
        makeLayer('flatgold', { sep: 10, tex: 3, scale: 2.8, density: 1.1, contrast: 1.1, angle: 45, offX: 0.5, offY: 0.5 }),
        makeLayer('paprika', { sep: 5, tex: 1, scale: 2.2, density: 1, contrast: 1.15, angle: 75, offX: -1, offY: 1 }),
        makeLayer('hunter', { sep: 0, tex: 0, scale: 2, density: 1.1, contrast: 1.3, angle: 15, offX: 1, offY: -1, rot: 0.08 }),
      ],
    }),
  },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const vary = (value: number, amount: number) => value + (Math.random() * 2 - 1) * amount

/**
 * A random run starts from a press-tested house recipe. Randomness is limited
 * to registration, texture scale, and small density shifts so the palette,
 * stock, separations, and tonal roles always remain intentional.
 */
export function randomRun(): Partial<StudioState> {
  const recipe = PRESETS[Math.floor(Math.random() * PRESETS.length)].build()
  const layers = (recipe.layers ?? []).map((layer) => ({
    ...layer,
    density: clamp(vary(layer.density, 0.08), 0.8, 1.5),
    contrast: clamp(vary(layer.contrast, 0.06), 0.9, 1.4),
    scale: clamp(vary(layer.scale, 0.25), 1.5, 5),
    angle: layer.tex === 3 || layer.tex === 4 ? vary(layer.angle, 2) : layer.angle,
    offX: vary(layer.offX, 1.25),
    offY: vary(layer.offY, 1.25),
    rot: clamp(vary(layer.rot, 0.12), -0.45, 0.45),
    seed: Math.random() * 100,
  }))

  return {
    ...recipe,
    layers,
    paperTex: clamp(vary(recipe.paperTex ?? 0.4, 0.05), 0.2, 0.75),
    bleed: clamp(vary(recipe.bleed ?? 0.55, 0.05), 0.2, 0.7),
    roller: clamp(vary(recipe.roller ?? 0, 0.05), 0, 0.4),
    grain: clamp(vary(recipe.grain ?? 0.1, 0.05), 0.05, 0.4),
    wear: clamp(vary(recipe.wear ?? 0.1, 0.05), 0.05, 0.55),
  }
}

export function defaultState(): StudioState {
  const preset = (PRESETS.find((recipe) => recipe.id === 'process') ?? PRESETS[0]).build()
  const base: StudioState = {
    layers: [],
    selectedId: null,
    paperId: 'cream',
    paperColor: '#F5EEDC',
    paperTex: 0.5,
    bleed: 0.55,
    roller: 0,
    grain: 0.1,
    wear: 0.1,
    bright: 0,
    contrast: 1,
    sat: 1,
    marks: true,
  }
  const merged = { ...base, ...preset }
  merged.selectedId = merged.layers[0]?.id ?? null
  return merged
}

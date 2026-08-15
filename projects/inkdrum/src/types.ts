export const MAX_LAYERS = 6

// Separation sources — how much of this ink the image asks for
export const SEP_MODES = [
  { id: 0, name: 'DARKNESS', short: 'DRK' },
  { id: 1, name: 'CYAN PLATE', short: 'CYN' },
  { id: 2, name: 'MAGENTA PLATE', short: 'MAG' },
  { id: 3, name: 'YELLOW PLATE', short: 'YEL' },
  { id: 4, name: 'BLACK PLATE (K)', short: 'BLK' },
  { id: 5, name: 'REDS ONLY', short: 'RED' },
  { id: 6, name: 'GREENS ONLY', short: 'GRN' },
  { id: 7, name: 'BLUES ONLY', short: 'BLU' },
  { id: 8, name: 'SHADOWS', short: 'SHD' },
  { id: 9, name: 'MIDTONES', short: 'MID' },
  { id: 10, name: 'HIGHLIGHTS', short: 'HI' },
  { id: 11, name: 'FLOOD (SOLID)', short: 'FLD' },
] as const

// Screening — how the ink is laid down
export const TEX_MODES = [
  { id: 0, name: 'GRAIN · FINE' },
  { id: 1, name: 'GRAIN · ROUGH' },
  { id: 2, name: 'GRAIN · DIRTY' },
  { id: 3, name: 'HALFTONE DOT' },
  { id: 4, name: 'LINE SCREEN' },
  { id: 5, name: 'DIFFUSION' },
  { id: 6, name: 'FLAT WASH' },
] as const

export interface InkLayer {
  id: string
  inkId: string
  enabled: boolean
  sep: number
  density: number // 0..2
  contrast: number // 0.2..2.5
  tex: number
  scale: number // visual screen/grain size, normalized to a 1600px source edge
  angle: number // degrees
  offX: number // registration offset, px
  offY: number
  rot: number // registration rotation, degrees
  seed: number
}

export interface StudioState {
  layers: InkLayer[]
  selectedId: string | null
  paperId: string
  paperColor: string // hex, used when paperId === 'custom'
  paperTex: number // 0..1 intensity of the selected stock's tooth/fiber character
  bleed: number // 0..1 ink spread / dot gain
  roller: number // 0..1 uneven ink coverage
  grain: number // 0..1 overall scuff
  wear: number // 0..1 press wear: edge falloff + drum streaks + hickeys
  bright: number // -0.5..0.5
  contrast: number // 0.4..2
  sat: number // 0..2
  marks: boolean // crop + registration marks on separation exports
}

let counter = 0
export const uid = () => `L${Date.now().toString(36)}${(counter++).toString(36)}`

export function makeLayer(inkId: string, partial: Partial<InkLayer> = {}): InkLayer {
  return {
    id: uid(),
    inkId,
    enabled: true,
    sep: 0,
    density: 1,
    contrast: 1,
    tex: 0,
    scale: 2.5,
    angle: 45,
    offX: 0,
    offY: 0,
    rot: 0,
    seed: Math.random() * 100,
    ...partial,
  }
}

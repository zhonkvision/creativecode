import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from 'react'
import { RisoRenderer, pressLayers, SHADER_REV } from './gl/renderer'
import { makeDemoImage } from './demoImage'
import { INKS, PAPERS, PRESETS, defaultState, inkById, paperById, paperHex, randomRun } from './inks'
import { MAX_LAYERS, SEP_MODES, TEX_MODES, makeLayer, uid, type InkLayer, type StudioState } from './types'
import { Section, Select, Slider } from './components/controls'
import {
  addTrimMarks,
  canvasToBlob,
  download,
  jobSheet,
  plateFile,
  slug,
  type SepMode,
} from './separations'
import { makeZip, type ZipEntry } from './zip'
import { readSessionImage, readSessionMeta, writeSessionImage, writeSessionMeta } from './session'

const PREVIEW_MAX = 2048
const EXPORT_MAX = 4200

function fitInto(w: number, h: number, max: number) {
  const s = Math.min(1, max / Math.max(w, h))
  return { w: Math.round(w * s), h: Math.round(h * s) }
}

function downscale(src: CanvasImageSource, sw: number, sh: number, max: number): HTMLCanvasElement {
  const { w, h } = fitInto(sw, sh, max)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, w, h)
  return c
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const round = (v: number, digits: number) => {
  const f = 10 ** digits
  return Math.round(v * f) / f
}

const REG_LIMIT = 20
const SKEW_LIMIT = 2
const DRAG_SLOP = 4
/** Thumbnail edges for the Y light-table — bookends, hero drums, channel strip, wipe. */
/** Compact reference thumbs (original / print) above the contribution grid. */
const PLATES_REF = 180
const PLATES_DRUM = 360
const PLATES_CHANNEL = 140
const PLATES_WIPE = 960
const PLATES_ISO = 640
/** Plates catch on true registration so a drag can find it exactly. */
const magnet = (v: number, pull: number) => (Math.abs(v) < pull ? 0 : v)
const signed = (v: number, digits = 1) => `${v > 0 ? '+' : ''}${v.toFixed(digits)}`

const HISTORY_LIMIT = 60
const HISTORY_COALESCE_MS = 400

function cloneState(s: StudioState): StudioState {
  return { ...s, layers: s.layers.map((layer) => ({ ...layer })) }
}

/** Accent chips for the channel tiles on the plates board. */
const CHANNEL_ACCENT: Record<number, string> = {
  0: '#211f1c',
  1: '#0078bf',
  2: '#ff48b0',
  3: '#ffe800',
  4: '#211f1c',
  5: '#f15060',
  6: '#00a95c',
  7: '#0078bf',
  8: '#5c574d',
  9: '#88898a',
  10: '#c9c3b4',
  11: '#ff6c2f',
}


function stampCanvas(src: HTMLCanvasElement, dest: HTMLCanvasElement | undefined) {
  if (!dest) return
  if (dest.width !== src.width || dest.height !== src.height) {
    dest.width = src.width
    dest.height = src.height
  }
  const ctx = dest.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, dest.width, dest.height)
  ctx.drawImage(src, 0, 0)
}

/** Ping-pong buffers for mip-style preview downsamples (avoids CSS moiré on screens). */
let proofScratchA: HTMLCanvasElement | null = null
let proofScratchB: HTMLCanvasElement | null = null

function proofScratch(which: 'a' | 'b') {
  if (which === 'a') {
    if (!proofScratchA) proofScratchA = document.createElement('canvas')
    return proofScratchA
  }
  if (!proofScratchB) proofScratchB = document.createElement('canvas')
  return proofScratchB
}

/**
 * Stamp the proof sheet for on-screen display only.
 * GL stays at full preview res; when zoomed out we mip-downsample into a
 * DPR-sized backing store so dense halftones don't moiré under CSS shrink.
 */
function stampProofDisplay(
  src: HTMLCanvasElement,
  dest: HTMLCanvasElement | undefined,
  cssW: number,
  cssH: number,
) {
  if (!dest) return
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
  const tw = Math.max(1, Math.round(Math.min(src.width, cssW * dpr)))
  const th = Math.max(1, Math.round(Math.min(src.height, cssH * dpr)))

  if (tw >= src.width && th >= src.height) {
    stampCanvas(src, dest)
    return
  }

  let cur: CanvasImageSource = src
  let cw = src.width
  let ch = src.height
  let ping = 0

  while (cw / 2 >= tw && ch / 2 >= th) {
    const nw = Math.max(tw, Math.floor(cw / 2))
    const nh = Math.max(th, Math.floor(ch / 2))
    const tmp = proofScratch(ping % 2 === 0 ? 'a' : 'b')
    if (tmp.width !== nw || tmp.height !== nh) {
      tmp.width = nw
      tmp.height = nh
    }
    const tctx = tmp.getContext('2d')!
    tctx.imageSmoothingEnabled = true
    tctx.imageSmoothingQuality = 'high'
    tctx.clearRect(0, 0, nw, nh)
    tctx.drawImage(cur, 0, 0, nw, nh)
    cur = tmp
    cw = nw
    ch = nh
    ping++
  }

  if (dest.width !== tw || dest.height !== th) {
    dest.width = tw
    dest.height = th
  }
  const ctx = dest.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.clearRect(0, 0, tw, th)
  ctx.drawImage(cur, 0, 0, tw, th)
}

function proofCssSize(pw: number, ph: number, zoom: 'fit' | number, viewport: { w: number; h: number }) {
  const fitScale = Math.min((viewport.w - 64) / pw, (viewport.h - 64) / ph, 3)
  const scale = zoom === 'fit' ? fitScale : zoom
  return {
    scale,
    cssW: Math.max(40, pw * scale),
    cssH: Math.max(40, ph * scale),
  }
}

function drawSourceThumb(src: HTMLCanvasElement, dest: HTMLCanvasElement | undefined, max: number) {
  if (!dest) return
  const { w, h } = fitInto(src.width, src.height, max)
  if (dest.width !== w || dest.height !== h) {
    dest.width = w
    dest.height = h
  }
  const ctx = dest.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(src, 0, 0, w, h)
}

/** A one-drum probe so channel / muted-plate masters can be pulled without mutating the job. */
function probeState(state: StudioState, layer: InkLayer): StudioState {
  return { ...state, layers: [{ ...layer, enabled: true }], selectedId: layer.id }
}

function channelProbe(state: StudioState, sep: number): StudioState {
  return probeState(state, {
    id: `ch-${sep}`,
    inkId: 'black',
    enabled: true,
    sep,
    density: 1,
    contrast: 1,
    tex: 6,
    scale: 2.5,
    angle: 0,
    offX: 0,
    offY: 0,
    rot: 0,
    seed: 0,
  })
}

const RECIPES_KEY = 'inkdrum-custom-recipes-v1'

/** True only for fields where letter/space keys should type, not run studio shortcuts. */
function isTextEntryTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  if (t.isContentEditable) return true
  if (t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return true
  if (!(t instanceof HTMLInputElement)) return false
  return !['range', 'checkbox', 'radio', 'button', 'submit', 'reset', 'color', 'file'].includes(t.type)
}

interface SavedRecipe {
  id: string
  name: string
  state: StudioState
}

type RegDragMode = 'slide' | 'twist'

interface RegDrag {
  id: string
  mode: RegDragMode
  /** False until the press travels far enough to count as a drag, not a click. */
  moved: boolean
  /** Pointer origin and the plate's registration when the grab started. */
  x: number
  y: number
  offX: number
  offY: number
  rot: number
}

interface PanDrag {
  x: number
  y: number
  scrollLeft: number
  scrollTop: number
  /** False until the press travels far enough to count as a pan, not a click. */
  moved: boolean
  /** When set, a no-travel release on the proof cycles the selected drum. */
  cycleOnClick: boolean
}

function mergeRecipe(state: StudioState, recipe: Partial<StudioState>): StudioState {
  const legacy = recipe as Partial<StudioState> & {
    edge?: number
    streaks?: number
    hickeys?: number
  }
  const wear =
    legacy.wear ??
    (legacy.edge != null || legacy.streaks != null || legacy.hickeys != null
      ? Math.max(legacy.edge ?? 0, legacy.streaks ?? 0, legacy.hickeys ?? 0)
      : undefined)
  const merged = { ...state, ...recipe, ...(wear != null ? { wear } : {}) }
  merged.selectedId = merged.layers[0]?.id ?? null
  return merged
}

function restoreRecipes(): SavedRecipe[] {
  try {
    const raw = localStorage.getItem(RECIPES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedRecipe[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (recipe) =>
        typeof recipe?.id === 'string' &&
        typeof recipe.name === 'string' &&
        recipe.state &&
        Array.isArray(recipe.state.layers),
    )
  } catch {
    return []
  }
}

/** Two plates landing out of true — what shaking the press does to them. */
function ShakeIcon() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" aria-hidden="true">
      <rect
        x="1.6"
        y="1.6"
        width="7.2"
        height="7.2"
        strokeWidth="1.4"
        opacity="0.5"
        transform="rotate(-8 5.2 5.2)"
      />
      <rect x="5.2" y="5.2" width="7.2" height="7.2" strokeWidth="1.4" />
    </svg>
  )
}

/** The printer's registration target the plates line up on. */
function AlignIcon() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="7" cy="7" r="3.3" strokeWidth="1.4" />
      <path d="M7 0.7V3.7M7 10.3v3M0.7 7h3M10.3 7h3" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** Drum visibility — open eye when printing, struck through when muted. */
function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        d="M1.4 7s2.1-3.6 5.6-3.6S12.6 7 12.6 7s-2.1 3.6-5.6 3.6S1.4 7 1.4 7z"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {open ? (
        <circle cx="7" cy="7" r="1.7" strokeWidth="1.4" />
      ) : (
        <path d="M2.2 11.8L11.8 2.2" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  )
}

export default function App() {
  const bootSession = useMemo(() => readSessionMeta(), [])
  const [state, setState] = useState<StudioState>(() => bootSession?.state ?? defaultState())
  const [customRecipes, setCustomRecipes] = useState<SavedRecipe[]>(restoreRecipes)
  const [recipeName, setRecipeName] = useState('')
  const [glError, setGlError] = useState<string | null>(null)
  const [imgName, setImgName] = useState(bootSession?.imgName ?? 'SAMPLE — SUNSET.TEST')
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState<'fit' | number>(() => bootSession?.zoom ?? 'fit')
  const restoreImageRef = useRef(!!bootSession)
  const stateRef = useRef(state)
  stateRef.current = state
  const pastRef = useRef<StudioState[]>([])
  const futureRef = useRef<StudioState[]>([])
  const historyCoalesceRef = useRef(false)
  const historyCoalesceTimer = useRef(0)

  /** Open an undo point; rapid edits (slider / drag) share one step. */
  const beginHistory = useCallback(() => {
    if (!historyCoalesceRef.current) {
      historyCoalesceRef.current = true
      pastRef.current.push(cloneState(stateRef.current))
      if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift()
      futureRef.current = []
    }
    window.clearTimeout(historyCoalesceTimer.current)
    historyCoalesceTimer.current = window.setTimeout(() => {
      historyCoalesceRef.current = false
    }, HISTORY_COALESCE_MS)
  }, [])

  const commit = useCallback(
    (updater: SetStateAction<StudioState>) => {
      beginHistory()
      setState(updater)
    },
    [beginHistory],
  )

  const undo = useCallback(() => {
    historyCoalesceRef.current = false
    window.clearTimeout(historyCoalesceTimer.current)
    setState((prev) => {
      const snap = pastRef.current.pop()
      if (!snap) return prev
      futureRef.current.push(cloneState(prev))
      return snap
    })
  }, [])

  const redo = useCallback(() => {
    historyCoalesceRef.current = false
    window.clearTimeout(historyCoalesceTimer.current)
    setState((prev) => {
      const snap = futureRef.current.pop()
      if (!snap) return prev
      pastRef.current.push(cloneState(prev))
      return snap
    })
  }, [])

  useEffect(() => () => window.clearTimeout(historyCoalesceTimer.current), [])

  const [busy, setBusy] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [layerPreview, setLayerPreview] = useState<{ id: string; patch: Partial<InkLayer> } | null>(null)
  const [fx, setFx] = useState<{ kind: 'shake' | 'align'; n: number } | null>(null)
  const [dragMode, setDragMode] = useState<RegDragMode | null>(null)
  const [panning, setPanning] = useState(false)
  const [plateFlash, setPlateFlash] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  /** Y — light table: original, each drum’s channel→pass, and the composite. */
  const [platesOpen, setPlatesOpen] = useState(false)
  /** From the light table: wipe compare between original art and the print. */
  const [wipeOpen, setWipeOpen] = useState(false)
  /** 0 = all print, 1 = all original — fraction revealed from the left. */
  const [wipe, setWipe] = useState(0.5)
  /** From the light table: isolate one drum to tune its channel + pass. */
  const [isolateId, setIsolateId] = useState<string | null>(null)
  /** While isolated: snap to the composite print, then back to the channel. */
  const [isoPeekPrint, setIsoPeekPrint] = useState(false)

  const rendererRef = useRef<RisoRenderer | null>(null)
  const previewRef = useRef<HTMLCanvasElement | null>(null) // downscaled source
  const fullRef = useRef<HTMLCanvasElement | null>(null) // full-res source
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragRef = useRef<RegDrag | null>(null)
  const panRef = useRef<PanDrag | null>(null)
  const helpRef = useRef<HTMLDivElement | null>(null)
  const plateEls = useRef(new Map<string, HTMLCanvasElement>())
  const wipeFrameRef = useRef<HTMLDivElement | null>(null)
  const wipeDrag = useRef(false)
  const flashTimer = useRef(0)
  const [viewport, setViewport] = useState({ w: 800, h: 600 })

  const closePlates = useCallback(() => {
    setPlatesOpen(false)
    setWipeOpen(false)
    setWipe(0.5)
    setIsolateId(null)
    setIsoPeekPrint(false)
  }, [])

  const exitIsolate = useCallback(() => {
    setIsolateId(null)
    setIsoPeekPrint(false)
  }, [])

  const enterIsolate = useCallback((id: string) => {
    setWipeOpen(false)
    setWipe(0.5)
    setIsoPeekPrint(false)
    setIsolateId(id)
    setState((s) => (s.selectedId === id ? s : { ...s, selectedId: id }))
  }, [])

  // if the isolated drum was ejected elsewhere, drop back to the light table
  useEffect(() => {
    if (isolateId && !state.layers.some((l) => l.id === isolateId)) {
      setIsolateId(null)
      setIsoPeekPrint(false)
    }
  }, [isolateId, state.layers])

  const setWipeFromClientX = useCallback((clientX: number) => {
    const frame = wipeFrameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    if (rect.width <= 0) return
    setWipe(clamp((clientX - rect.left) / rect.width, 0, 1))
  }, [])

  const bindPlate = useCallback(
    (key: string) => (el: HTMLCanvasElement | null) => {
      if (el) plateEls.current.set(key, el)
      else plateEls.current.delete(key)
    },
    [],
  )

  const loadSource = useCallback((src: CanvasImageSource, w: number, h: number) => {
    const full = downscale(src, w, h, EXPORT_MAX)
    const preview = downscale(full, full.width, full.height, PREVIEW_MAX)
    fullRef.current = full
    previewRef.current = preview
    rendererRef.current?.setImage(preview)
    setImgDims({ w: full.width, h: full.height })
    void writeSessionImage(full)
  }, [])

  const glCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasRef = useCallback(
    (el: HTMLCanvasElement | null) => {
      glCanvasRef.current = el
      if (el && !rendererRef.current) {
        try {
          rendererRef.current = new RisoRenderer(el)
        } catch {
          setGlError('THIS PRESS NEEDS WEBGL2 — TRY A CURRENT BROWSER.')
          return
        }
        void (async () => {
          if (restoreImageRef.current) {
            restoreImageRef.current = false
            try {
              const blob = await readSessionImage()
              if (blob) {
                const bmp = await createImageBitmap(blob)
                loadSource(bmp, bmp.width, bmp.height)
                bmp.close()
                return
              }
            } catch {
              // fall through to demo
            }
          }
          const demo = makeDemoImage()
          loadSource(demo, demo.width, demo.height)
        })()
      }
    },
    [loadSource],
  )

  // WebGL programs are compiled once — HMR of shader.ts leaves a stale program
  // that ignores new uniforms like u_wear. Rebuild from the current module class
  // whenever the shader rev bumps (same canvas / GL context is reused).
  useEffect(() => {
    const el = glCanvasRef.current
    if (!el || !rendererRef.current) return
    const prev = previewRef.current
    try {
      rendererRef.current = new RisoRenderer(el)
      if (prev) rendererRef.current.setImage(prev)
    } catch {
      // context already established by the first mount
    }
  }, [SHADER_REV])

  useEffect(() => {
    try {
      localStorage.setItem(RECIPES_KEY, JSON.stringify(customRecipes))
    } catch {
      // storage full/blocked — custom recipes remain available this session
    }
  }, [customRecipes])

  // Survive accidental refresh — drums/settings in sessionStorage, art in IndexedDB.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeSessionMeta({ state, imgName, zoom })
    }, 200)
    return () => window.clearTimeout(timer)
  }, [state, imgName, zoom])

  const loadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      try {
        const bmp = await createImageBitmap(file)
        loadSource(bmp, bmp.width, bmp.height)
        setImgName(file.name.toUpperCase())
        const process = PRESETS.find((preset) => preset.id === 'process')
        if (process) {
          commit((studio) =>
            mergeRecipe(studio, {
              ...process.build(),
              bright: 0,
              contrast: 1,
              sat: 1,
            }),
          )
        }
        bmp.close()
      } catch {
        // unreadable file — ignore
      }
    },
    [loadSource, commit],
  )

  const renderState = useMemo<StudioState>(() => {
    if (!layerPreview) return state
    return {
      ...state,
      layers: state.layers.map((layer) =>
        layer.id === layerPreview.id ? { ...layer, ...layerPreview.patch } : layer,
      ),
    }
  }, [state, layerPreview])

  // ---- render loop (rAF-throttled) ----
  // GL canvas stays parked offscreen; we stamp into the proof sheet or plates board.
  const frameReq = useRef(0)
  useEffect(() => {
    cancelAnimationFrame(frameReq.current)
    // Exports own the GL context while busy — don't fight them mid-pull.
    if (busy) return
    frameReq.current = requestAnimationFrame(() => {
      const r = rendererRef.current
      const p = previewRef.current
      if (!r || !p) return

      if (!platesOpen) {
        // Full preview render stays authoritative; only the sheet stamp is display-sized.
        r.render(renderState, p.width, p.height)
        const { cssW, cssH } = proofCssSize(p.width, p.height, zoom, viewport)
        stampProofDisplay(r.canvas, plateEls.current.get('proof'), cssW, cssH)
        return
      }

      if (wipeOpen) {
        const wipeMax = Math.min(PLATES_WIPE, Math.max(420, viewport.w - 96))
        drawSourceThumb(p, plateEls.current.get('wipe-original'), wipeMax)
        const { w, h } = fitInto(p.width, p.height, wipeMax)
        r.render(renderState, w, h)
        stampCanvas(r.canvas, plateEls.current.get('wipe-print'))
        return
      }

      if (isolateId) {
        const layer = renderState.layers.find((l) => l.id === isolateId)
        if (layer) {
          if (isoPeekPrint) {
            const peekMax = Math.min(PLATES_WIPE, Math.max(420, viewport.w - 96))
            const { w, h } = fitInto(p.width, p.height, peekMax)
            r.render(renderState, w, h)
            stampCanvas(r.canvas, plateEls.current.get('iso-print'))
          } else {
            const isoMax = Math.min(PLATES_ISO, Math.max(320, Math.floor((viewport.w - 120) / 2)))
            const { w, h } = fitInto(p.width, p.height, isoMax)
            r.renderSeparation(channelProbe(renderState, layer.sep), 0, 'master', w, h)
            stampCanvas(r.canvas, plateEls.current.get('iso-channel'))
            r.renderSeparation(probeState(renderState, layer), 0, 'proof', w, h)
            stampCanvas(r.canvas, plateEls.current.get('iso-pass'))
          }
        }
        return
      }

      // Light table: compact original/print refs + contribution grid.
      drawSourceThumb(p, plateEls.current.get('original'), PLATES_REF)

      {
        const { w, h } = fitInto(p.width, p.height, PLATES_REF)
        r.render(renderState, w, h)
        stampCanvas(r.canvas, plateEls.current.get('print'))
      }

      const drumSize = fitInto(p.width, p.height, PLATES_DRUM)
      const chSize = fitInto(p.width, p.height, PLATES_CHANNEL)
      for (const layer of renderState.layers) {
        r.renderSeparation(channelProbe(renderState, layer.sep), 0, 'master', chSize.w, chSize.h)
        stampCanvas(r.canvas, plateEls.current.get(`ch-${layer.id}`))

        r.renderSeparation(probeState(renderState, layer), 0, 'proof', drumSize.w, drumSize.h)
        stampCanvas(r.canvas, plateEls.current.get(`drum-${layer.id}`))
      }
    })
    return () => cancelAnimationFrame(frameReq.current)
  }, [renderState, imgDims, platesOpen, wipeOpen, isolateId, isoPeekPrint, viewport, zoom, busy])

  // ---- viewport tracking ----
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setViewport({ w: e.contentRect.width, h: e.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ---- help panel dismissal ----
  useEffect(() => {
    if (!helpOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (!helpRef.current?.contains(e.target as Node)) setHelpOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelpOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [helpOpen])

  // ---- paste to load ----
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = e.clipboardData?.files?.[0]
      if (f) loadFile(f)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [loadFile])

  const pw = previewRef.current?.width ?? 1
  const ph = previewRef.current?.height ?? 1
  const { scale, cssW: displayW } = proofCssSize(pw, ph, zoom, viewport)
  const fitScale = Math.min((viewport.w - 64) / pw, (viewport.h - 64) / ph, 3)
  const zoomPct = Math.round(scale * 100)

  const selected = state.layers.find((l) => l.id === state.selectedId) ?? null

  const set = (patch: Partial<StudioState>) => commit((s) => ({ ...s, ...patch }))
  const setLayer = (id: string, patch: Partial<InkLayer>) =>
    commit((s) => ({
      ...s,
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))

  const addLayer = () => {
    commit((s) => {
      if (s.layers.length >= MAX_LAYERS) return s
      const used = new Set(s.layers.map((l) => l.inkId))
      const ink = INKS.find((i) => !used.has(i.id)) ?? INKS[0]
      const layer = makeLayer(ink.id, {
        sep: 9,
        angle: [15, 75, 0, 45, 30, 60][s.layers.length % 6],
        offX: rand(-3, 3),
        offY: rand(-3, 3),
        rot: rand(-0.3, 0.3),
      })
      return { ...s, layers: [...s.layers, layer], selectedId: layer.id }
    })
  }

  const removeLayer = (id: string) => {
    if (isolateId === id) {
      const i = state.layers.findIndex((l) => l.id === id)
      const fallback = state.layers[i + 1] ?? state.layers[i - 1] ?? null
      if (fallback) {
        setIsolateId(fallback.id)
      } else {
        exitIsolate()
      }
    }
    commit((s) => {
      const layers = s.layers.filter((l) => l.id !== id)
      return { ...s, layers, selectedId: s.selectedId === id ? (layers[0]?.id ?? null) : s.selectedId }
    })
  }

  const moveLayer = (id: string, dir: -1 | 1) =>
    commit((s) => {
      const i = s.layers.findIndex((l) => l.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= s.layers.length) return s
      const layers = [...s.layers]
      ;[layers[i], layers[j]] = [layers[j], layers[i]]
      return { ...s, layers }
    })

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)
    if (!p) return
    commit((s) => mergeRecipe(s, p.build()))
  }

  const saveCustomRecipe = () => {
    const fallbackName = `CUSTOM ${String(customRecipes.length + 1).padStart(2, '0')}`
    const name = recipeName.trim().toUpperCase() || fallbackName
    const snapshot: StudioState = {
      ...state,
      layers: state.layers.map((layer) => ({ ...layer })),
    }
    setCustomRecipes((recipes) => [{ id: `R${Date.now().toString(36)}`, name, state: snapshot }, ...recipes])
    setRecipeName('')
  }

  const applyCustomRecipe = (recipe: SavedRecipe) => {
    const layers = recipe.state.layers.map((layer) => ({ ...layer, id: uid() }))
    commit((s) => mergeRecipe(s, { ...recipe.state, layers }))
  }

  const removeCustomRecipe = (id: string) => {
    setCustomRecipes((recipes) => recipes.filter((recipe) => recipe.id !== id))
  }

  const randomize = () => {
    commit((s) => mergeRecipe(s, randomRun()))
  }

  /** Replays the paper animation even when the same jolt fires twice in a row. */
  const jolt = useCallback(
    (kind: 'shake' | 'align') => setFx((f) => ({ kind, n: (f?.n ?? 0) + 1 })),
    [],
  )

  const shakeAll = useCallback(() => {
    commit((s) => ({
      ...s,
      layers: s.layers.map((l) => ({
        ...l,
        offX: rand(-5, 5),
        offY: rand(-5, 5),
        rot: rand(-0.6, 0.6),
        seed: Math.random() * 100,
      })),
    }))
    jolt('shake')
  }, [commit, jolt])

  const alignAll = useCallback(() => {
    commit((s) => ({ ...s, layers: s.layers.map((l) => ({ ...l, offX: 0, offY: 0, rot: 0 })) }))
    jolt('align')
  }, [commit, jolt])

  const misregistered = state.layers.some((l) => l.offX !== 0 || l.offY !== 0 || l.rot !== 0)
  const plateOffTrue = !!selected && (!!selected.offX || !!selected.offY || !!selected.rot)

  /** Names the live plate on the sheet for a beat, then gets out of the way. */
  const flashPlate = useCallback(() => {
    setPlateFlash(true)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setPlateFlash(false), 1300)
  }, [])

  useEffect(() => {
    if (state.selectedId) flashPlate()
  }, [state.selectedId, flashPlate])

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const cycleDrum = useCallback((dir: 1 | -1) => {
    setState((s) => {
      if (!s.layers.length) return s
      const i = s.layers.findIndex((l) => l.id === s.selectedId)
      if (i < 0) return { ...s, selectedId: s.layers[0].id }
      return { ...s, selectedId: s.layers[(i + dir + s.layers.length) % s.layers.length].id }
    })
  }, [])

  // ---- plain drag pans the bed; ⌘/ctrl-drag registers the selected plate ----
  const startPan = (
    e: React.PointerEvent<HTMLElement>,
    opts: { cycleOnClick?: boolean } = {},
  ) => {
    const sc = scrollRef.current
    if (!sc || e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    panRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: sc.scrollLeft,
      scrollTop: sc.scrollTop,
      moved: false,
      cycleOnClick: !!opts.cycleOnClick,
    }
    setPanning(true)
  }

  const movePan = (e: React.PointerEvent<HTMLElement>) => {
    const p = panRef.current
    const sc = scrollRef.current
    if (!p || !sc) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (!p.moved) {
      if (Math.hypot(dx, dy) < DRAG_SLOP) return
      p.moved = true
      // re-anchor so the first real pan step doesn't jump by the slop distance
      p.x = e.clientX
      p.y = e.clientY
      p.scrollLeft = sc.scrollLeft
      p.scrollTop = sc.scrollTop
      return
    }
    sc.scrollLeft = p.scrollLeft - (e.clientX - p.x)
    sc.scrollTop = p.scrollTop - (e.clientY - p.y)
  }

  const endPan = (e?: React.PointerEvent<HTMLElement>) => {
    const p = panRef.current
    if (!p) return
    panRef.current = null
    setPanning(false)
    // a press that never travelled on the proof is a click: walk to the next drum
    if (e && p.cycleOnClick && !p.moved) {
      cycleDrum(e.shiftKey ? -1 : 1)
      flashPlate()
    }
  }

  const startRegDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    // ⌘/ctrl-drag slides (or skews) the plate; plain drag pans the bed
    if ((e.metaKey || e.ctrlKey) && selected) {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      const mode = e.shiftKey ? 'twist' : 'slide'
      dragRef.current = {
        id: selected.id,
        mode,
        moved: false,
        x: e.clientX,
        y: e.clientY,
        offX: selected.offX,
        offY: selected.offY,
        rot: selected.rot,
      }
      setDragMode(mode)
      return
    }
    startPan(e, { cycleOnClick: true })
  }

  const moveRegDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (panRef.current) {
      movePan(e)
      return
    }
    const d = dragRef.current
    if (!d) return
    let dx = e.clientX - d.x
    let dy = e.clientY - d.y
    if (!d.moved) {
      // hold the plate still until the press clearly isn't a click, then take
      // the crossing point as the new origin so the ink doesn't jump
      if (Math.hypot(dx, dy) < DRAG_SLOP) return
      d.moved = true
      d.x = e.clientX
      d.y = e.clientY
      dx = 0
      dy = 0
    }
    if (d.mode === 'twist') {
      setLayer(d.id, {
        rot: magnet(clamp(round(d.rot + dx * 0.01, 2), -SKEW_LIMIT, SKEW_LIMIT), 0.06),
      })
    } else {
      setLayer(d.id, {
        offX: magnet(clamp(round(d.offX + dx / scale, 1), -REG_LIMIT, REG_LIMIT), 0.7),
        offY: magnet(clamp(round(d.offY + dy / scale, 1), -REG_LIMIT, REG_LIMIT), 0.7),
      })
    }
  }

  const endRegDrag = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (panRef.current) {
      endPan(e)
      return
    }
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    setDragMode(null)
    // ⌘-click with no travel still cycles drums
    if (e && !d.moved) {
      cycleDrum(e.shiftKey ? -1 : 1)
      flashPlate()
    }
  }

  // ---- studio keys: Y plates, Space zoom, S/A shake/align, arrows cycle drums ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      // Range/color/checkbox focus must not block Space/Y — only real text entry.
      const typing = isTextEntryTarget(t)

      const takeStudioKey = () => {
        e.preventDefault()
        // Sliders keep focus after drag; blur so the next key isn't eaten by the control.
        if (t && !typing && typeof t.blur === 'function') t.blur()
      }

      // ⌘/Ctrl+Z undo, ⌘/Ctrl+Shift+Z redo (Ctrl+Y redo on non-Mac)
      if ((e.metaKey || e.ctrlKey) && !typing) {
        const key = e.key.toLowerCase()
        if (key === 'z') {
          e.preventDefault()
          if (e.shiftKey) redo()
          else undo()
          return
        }
        if (key === 'y' && e.ctrlKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault()
          redo()
          return
        }
      }

      // Y — light table (plain key; ⌘Y steals browser history/redo)
      if (
        e.key.toLowerCase() === 'y' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !typing
      ) {
        takeStudioKey()
        if (platesOpen) closePlates()
        else setPlatesOpen(true)
        return
      }

      if (e.key === 'Escape' && platesOpen) {
        e.preventDefault()
        if (wipeOpen) {
          setWipeOpen(false)
          setWipe(0.5)
        } else if (isolateId && isoPeekPrint) {
          setIsoPeekPrint(false)
        } else if (isolateId) {
          exitIsolate()
        } else {
          closePlates()
        }
        return
      }

      // Space is a studio shortcut even when a rail slider still has focus.
      if (e.code === 'Space' && !typing) {
        if (platesOpen) {
          if (isolateId) {
            takeStudioKey()
            setIsoPeekPrint((peek) => !peek)
          }
          return
        }
        takeStudioKey()
        setZoom((z) => (z === 'fit' ? 1 : 'fit'))
        return
      }

      // S / A — shake & align on the press bed (same gating as the HUD buttons)
      if (
        !typing &&
        !platesOpen &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'a')
      ) {
        if (e.key.toLowerCase() === 's') {
          if (!state.layers.length) return
          takeStudioKey()
          shakeAll()
          return
        }
        if (!state.layers.some((l) => l.offX !== 0 || l.offY !== 0 || l.rot !== 0)) return
        takeStudioKey()
        alignAll()
        return
      }

      // Arrows cycle drums / channels. Leave range inputs alone so sliders
      // can still be nudged with the keyboard while focused.
      const onRange = t instanceof HTMLInputElement && t.type === 'range'
      if (
        !typing &&
        !onRange &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        (e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown')
      ) {
        if (!state.layers.length) return
        if (platesOpen && (wipeOpen || !isolateId)) return
        const dir: 1 | -1 = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
        takeStudioKey()
        if (platesOpen && isolateId) {
          const i = state.layers.findIndex((l) => l.id === isolateId)
          if (i >= 0 && state.layers.length > 1) {
            const next = state.layers[(i + dir + state.layers.length) % state.layers.length]
            setIsoPeekPrint(false)
            setIsolateId(next.id)
            set({ selectedId: next.id })
          }
          return
        }
        cycleDrum(dir)
        flashPlate()
        return
      }

      // leave the rails alone so remaining keys don't fight focused controls
      if (typing || (t && t.closest('.rail'))) return
      if (platesOpen) return
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    platesOpen,
    wipeOpen,
    isolateId,
    isoPeekPrint,
    closePlates,
    exitIsolate,
    state.layers,
    shakeAll,
    alignAll,
    cycleDrum,
    flashPlate,
    undo,
    redo,
  ])

  /** Swap in the full-res source, run `job`, then restore the preview. */
  const onPress = async (label: string, job: (r: RisoRenderer, full: HTMLCanvasElement) => Promise<void>) => {
    const r = rendererRef.current
    const full = fullRef.current
    const preview = previewRef.current
    if (!r || !full || !preview || busy) return
    setBusy(label)
    await new Promise((res) => setTimeout(res, 30)) // let the button state paint
    try {
      r.setImage(full)
      await job(r, full)
    } finally {
      r.setImage(preview)
      r.render(state, preview.width, preview.height)
      const { cssW, cssH } = proofCssSize(preview.width, preview.height, zoom, viewport)
      stampProofDisplay(r.canvas, plateEls.current.get('proof'), cssW, cssH)
      setBusy(null)
    }
  }

  const exportPng = (mult: number) =>
    onPress('PRINTING…', async (r, full) => {
      const { w, h } = fitInto(full.width * mult, full.height * mult, EXPORT_MAX * 2)
      r.render(state, w, h)
      const blob = await canvasToBlob(r.canvas)
      if (blob) download(blob, `inkdrum-print-${Date.now().toString(36)}.png`)
    })

  const exportSeparations = (mode: SepMode) =>
    onPress(mode === 'master' ? 'PULLING PLATES…' : 'PULLING PASSES…', async (r, full) => {
      const layers = pressLayers(state)
      if (!layers.length) return
      const bg = mode === 'master' ? '#ffffff' : paperHex(state)
      const entries: ZipEntry[] = []

      for (let i = 0; i < layers.length; i++) {
        r.renderSeparation(state, i, mode, full.width, full.height)
        const ink = inkById(layers[i].inkId)
        const label = `${String(i + 1).padStart(2, '0')} / ${layers.length}  ${ink.name}  ${ink.hex.toUpperCase()}  ${
          SEP_MODES[layers[i].sep]?.name ?? ''
        }`
        const out = state.marks ? addTrimMarks(r.canvas, bg, label) : r.canvas
        const blob = await canvasToBlob(out)
        if (blob) {
          entries.push({
            name: plateFile(i, layers[i], mode),
            data: new Uint8Array(await blob.arrayBuffer()),
          })
        }
      }

      const sheet = jobSheet(state, layers, mode, {
        source: imgName,
        w: full.width,
        h: full.height,
      })
      entries.push({ name: 'JOB-SHEET.txt', data: new TextEncoder().encode(sheet) })
      download(makeZip(entries), `inkdrum-${slug(imgName)}-${mode}s.zip`)
    })

  const inkCount = state.layers.filter((l) => l.enabled).length
  const paperName = PAPERS.find((p) => p.id === state.paperId)?.name ?? 'CUSTOM'
  const jobTicket = useMemo(
    () => `${inkCount} COLOR${inkCount === 1 ? '' : 'S'} / ${paperName}`,
    [inkCount, paperName],
  )
  const isolateLayer = isolateId ? (state.layers.find((l) => l.id === isolateId) ?? null) : null
  const isolateIndex = isolateLayer ? state.layers.findIndex((l) => l.id === isolateLayer.id) : -1
  const isolateInk = isolateLayer ? inkById(isolateLayer.inkId) : null
  const isolateSep = isolateLayer ? SEP_MODES[isolateLayer.sep] : null

  return (
    <div
      className="app"
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={(e) => {
        if (e.target === e.currentTarget) setDragOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) loadFile(f)
      }}
    >
      {dragOver && (
        <div className="drop-veil">
          <div className="drop-veil-card">FEED THE MACHINE ↓</div>
        </div>
      )}

      <header className="masthead">
        <div className="brand">
          <h1>
            <img className="brand-logo" src="/logo.png" alt="inkdrum" width={176} height={28} />
          </h1>
        </div>
        <div className="masthead-actions">
          <button className="btn btn-yellow" onClick={randomize}>
            ⚄ RANDOM RUN
          </button>
          <button className="btn btn-pink" disabled={!!busy} onClick={() => exportPng(1)}>
            {busy ?? '⇩ EXPORT PRINT'}
          </button>
        </div>
      </header>

      <div className="workbench">
        {/* ---------------- LEFT ---------------- */}
        <aside className="rail rail-left">
          <Section num="01" title="ORIGINAL" accent="var(--riso-yellow)">
            <button
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
              title="Load an image"
            >
              <span className="dz-icon">⎙</span>
              <span className="dz-label">DROP / CLICK / PASTE</span>
              <span className="dz-hint">PNG · JPG · WEBP</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) loadFile(f)
                e.target.value = ''
              }}
            />
            <div className="file-readout">
              <span className="file-name" title={imgName}>
                {imgName}
              </span>
              <span className="file-dims">
                {imgDims.w}×{imgDims.h}
              </span>
            </div>
          </Section>

          <Section num="02" title="INK DRUMS" accent="var(--riso-pink)">
            <ol className="drum-list">
              {state.layers.map((l, i) => {
                const ink = inkById(l.inkId)
                return (
                  <li
                    key={l.id}
                    className={`drum ${l.id === state.selectedId ? 'is-selected' : ''} ${l.enabled ? '' : 'is-off'}`}
                  >
                    <button className="drum-main" onClick={() => set({ selectedId: l.id })} title="Select drum">
                      <span className="drum-chip" style={{ background: ink.hex }} />
                      <span className="drum-name">
                        {ink.name}
                        {ink.fluoro && <em className="fluoro-tag">FLUO</em>}
                      </span>
                      <span className="drum-sep">{SEP_MODES[l.sep]?.short}</span>
                    </button>
                    <div className="drum-tools">
                      <button title="Move up" disabled={i === 0} onClick={() => moveLayer(l.id, -1)}>
                        ↑
                      </button>
                      <button
                        title="Move down"
                        disabled={i === state.layers.length - 1}
                        onClick={() => moveLayer(l.id, 1)}
                      >
                        ↓
                      </button>
                      <button
                        title={l.enabled ? 'Hide drum' : 'Show drum'}
                        className={`drum-vis ${l.enabled ? 'is-on' : 'is-off'}`}
                        aria-pressed={l.enabled}
                        onClick={() => setLayer(l.id, { enabled: !l.enabled })}
                      >
                        <EyeIcon open={l.enabled} />
                      </button>
                      <button
                        title={`Eject ${ink.name}`}
                        className="drum-eject"
                        aria-label={`Eject ${ink.name}`}
                        onClick={() => removeLayer(l.id)}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                )
              })}
            </ol>
            <button
              className="btn btn-block btn-outline"
              disabled={state.layers.length >= MAX_LAYERS}
              onClick={addLayer}
            >
              + LOAD DRUM ({state.layers.length}/{MAX_LAYERS})
            </button>
          </Section>

          <Section num="03" title="HOUSE RECIPES" accent="var(--riso-blue)" defaultOpen={false}>
            <div className="preset-list">
              {PRESETS.map((p) => (
                <button key={p.id} className="preset" onClick={() => applyPreset(p.id)}>
                  <span className="preset-name">{p.name}</span>
                  <span className="preset-desc">{p.desc}</span>
                </button>
              ))}
            </div>
            <div className="custom-recipes">
              <div className="custom-recipes-head">CUSTOM RECIPES</div>
              <form
                className="recipe-save"
                onSubmit={(event) => {
                  event.preventDefault()
                  saveCustomRecipe()
                }}
              >
                <input
                  type="text"
                  value={recipeName}
                  maxLength={28}
                  placeholder={`CUSTOM ${String(customRecipes.length + 1).padStart(2, '0')}`}
                  aria-label="Custom recipe name"
                  onChange={(event) => setRecipeName(event.target.value)}
                />
                <button className="btn btn-mini btn-yellow" type="submit" disabled={state.layers.length === 0}>
                  SAVE
                </button>
              </form>
              {customRecipes.length > 0 ? (
                <div className="preset-list custom-recipe-list">
                  {customRecipes.map((recipe) => (
                    <div className="custom-recipe" key={recipe.id}>
                      <button className="preset custom-recipe-main" onClick={() => applyCustomRecipe(recipe)}>
                        <span className="preset-name">{recipe.name}</span>
                        <span className="preset-desc">
                          {recipe.state.layers.length} DRUM{recipe.state.layers.length === 1 ? '' : 'S'} ·{' '}
                          {PAPERS.find((paper) => paper.id === recipe.state.paperId)?.name ?? 'CUSTOM STOCK'}
                        </span>
                      </button>
                      <button
                        className="custom-recipe-delete"
                        title={`Delete ${recipe.name}`}
                        aria-label={`Delete ${recipe.name}`}
                        onClick={() => removeCustomRecipe(recipe.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="custom-recipes-empty">SAVE THE CURRENT PRESS SETUP FOR LATER.</p>
              )}
            </div>
          </Section>

          <footer className="rail-foot">
            100% ORGANIC SOY INK · SHAKE WELL
            <br />
            MISPRINTS ARE PART OF THE FUN!
            <br />
            <a
              className="rail-foot-link"
              href="https://x.com/jacksonfall"
              target="_blank"
              rel="noopener noreferrer"
            >
              MADE BY JACKSON GREATHOUSE FALL
            </a>
            <br />
            <a
              className="rail-foot-link"
              href="https://buymeacoffee.com/jacksonfall"
              target="_blank"
              rel="noopener noreferrer"
            >
              BUY ME A COFFEE
            </a>
          </footer>
        </aside>

        {/* ---------------- CENTER ---------------- */}
        <main
          className={`pressbed ${panning ? 'is-panning' : ''} ${platesOpen ? 'is-plates' : ''}`}
          ref={viewportRef}
        >
          {/* Keep the GL canvas mounted (and hidden in plates mode) so the renderer stays warm. */}
          <canvas ref={canvasRef} className={platesOpen ? 'gl-stage is-parked' : 'gl-stage'} />

          <div
            className="pressbed-scroll"
            ref={scrollRef}
            onPointerDown={(e) => {
              // empty bed (not the sheet) — drag pans the view
              if (e.target !== e.currentTarget) return
              startPan(e)
            }}
            onPointerMove={movePan}
            onPointerUp={(e) => endPan(e)}
            onPointerCancel={() => endPan()}
          >
            {glError ? (
              <div className="gl-error">{glError}</div>
            ) : platesOpen && isolateLayer && isolateInk ? (
              <div
                className={`plates-board is-isolate ${isoPeekPrint ? 'is-peek' : ''}`}
                aria-label={
                  isoPeekPrint
                    ? 'Composite print peek'
                    : `${isolateInk.name} channel isolation`
                }
                style={{ ['--isolate-ink' as string]: isolateInk.hex }}
              >
                <header className="plates-board-head">
                  <div className="plates-board-title">
                    <button type="button" className="plates-back" onClick={exitIsolate}>
                      ← LIGHT TABLE
                    </button>
                    <span className="plate-tile-chip" style={{ background: isolateInk.hex }} />
                    <span>
                      {String(isolateIndex + 1).padStart(2, '0')} {isolateInk.name}
                    </span>
                    <span className="plates-board-meta">
                      {isoPeekPrint
                        ? 'COMPOSITE'
                        : `${isolateSep?.name ?? '—'}${!isolateLayer.enabled ? ' · OFF' : ''}`}
                    </span>
                  </div>
                  <div className="iso-nav">
                    <button
                      type="button"
                      className={`btn btn-mini ${isoPeekPrint ? 'is-active' : ''}`}
                      title="Snap to composite print (Space)"
                      onClick={() => setIsoPeekPrint((peek) => !peek)}
                    >
                      {isoPeekPrint ? 'CHANNEL' : 'PRINT'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-mini"
                      disabled={state.layers.length < 2 || isoPeekPrint}
                      onClick={() => {
                        const prev =
                          state.layers[
                            (isolateIndex - 1 + state.layers.length) % state.layers.length
                          ]
                        enterIsolate(prev.id)
                      }}
                    >
                      ← PREV
                    </button>
                    <button
                      type="button"
                      className="btn btn-mini"
                      disabled={state.layers.length < 2 || isoPeekPrint}
                      onClick={() => {
                        const next = state.layers[(isolateIndex + 1) % state.layers.length]
                        enterIsolate(next.id)
                      }}
                    >
                      NEXT →
                    </button>
                  </div>
                </header>

                {isoPeekPrint ? (
                  <div className="iso-peek">
                    <div className="plate-tile is-print">
                      <div className="plate-tile-frame">
                        <canvas ref={bindPlate('iso-print')} />
                      </div>
                      <div className="plate-tile-meta">
                        <span className="plate-tile-chip" style={{ background: 'var(--riso-pink)' }} />
                        <span className="plate-tile-label">COMPOSITE</span>
                        <span className="plate-tile-sub">SPACE / PRINT TO RETURN</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="iso-previews">
                      <div className="plate-tile is-channel">
                        <div className="plate-tile-frame">
                          <canvas ref={bindPlate('iso-channel')} />
                        </div>
                        <div className="plate-tile-meta">
                          <span
                            className="plate-tile-chip"
                            style={{ background: CHANNEL_ACCENT[isolateLayer.sep] ?? '#211f1c' }}
                          />
                          <span className="plate-tile-label">{isolateSep?.short ?? '—'}</span>
                          <span className="plate-tile-sub">CHANNEL PULL</span>
                        </div>
                      </div>
                      <div className="plates-contrib-arrow iso-arrow" aria-hidden="true">
                        →
                      </div>
                      <div className="plate-tile is-drum">
                        <div className="plate-tile-frame">
                          <canvas ref={bindPlate('iso-pass')} />
                        </div>
                        <div className="plate-tile-meta">
                          <span className="plate-tile-chip" style={{ background: isolateInk.hex }} />
                          <span className="plate-tile-label">PASS</span>
                          <span className="plate-tile-sub">INK ON STOCK</span>
                        </div>
                      </div>
                    </div>
                    <p className="iso-hint">
                      SPACE SNAPS TO THE COMPOSITE — AGAIN RETURNS HERE. TUNE IN THE RIGHT RAIL.
                    </p>
                  </>
                )}
              </div>
            ) : platesOpen && wipeOpen ? (
              <div className="plates-board is-wipe" aria-label="Original versus print wipe">
                <header className="plates-board-head">
                  <div className="plates-board-title">
                    <button
                      type="button"
                      className="plates-back"
                      onClick={() => {
                        setWipeOpen(false)
                        setWipe(0.5)
                      }}
                    >
                      ← LIGHT TABLE
                    </button>
                    <span className="plates-board-meta">ORIGINAL ↔ PRINT</span>
                  </div>
                  <p className="plates-board-lede">DRAG THE HANDLE TO WIPE BETWEEN SOURCE AND RENDER.</p>
                </header>

                <div
                  className="wipe-frame"
                  ref={wipeFrameRef}
                  style={{ ['--wipe' as string]: `${wipe * 100}%` }}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return
                    wipeDrag.current = true
                    e.currentTarget.setPointerCapture(e.pointerId)
                    setWipeFromClientX(e.clientX)
                  }}
                  onPointerMove={(e) => {
                    if (!wipeDrag.current) return
                    setWipeFromClientX(e.clientX)
                  }}
                  onPointerUp={() => {
                    wipeDrag.current = false
                  }}
                  onPointerCancel={() => {
                    wipeDrag.current = false
                  }}
                >
                  <canvas ref={bindPlate('wipe-print')} className="wipe-layer wipe-print" />
                  <canvas
                    ref={bindPlate('wipe-original')}
                    className="wipe-layer wipe-original"
                    style={{ clipPath: `inset(0 ${((1 - wipe) * 100).toFixed(2)}% 0 0)` }}
                  />
                  <div className="wipe-handle" aria-hidden="true">
                    <i />
                  </div>
                  <div className="wipe-tags" aria-hidden="true">
                    <span>ORIGINAL</span>
                    <span>PRINT</span>
                  </div>
                </div>

                <label className="wipe-slider">
                  <span className="wipe-slider-label">SPLIT</span>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    value={Math.round(wipe * 1000)}
                    aria-label="Wipe between original and print"
                    onChange={(e) => setWipe(parseInt(e.target.value, 10) / 1000)}
                  />
                </label>
              </div>
            ) : platesOpen ? (
              <div className="plates-board" aria-label="Separations light table">
                <header className="plates-board-head">
                  <div className="plates-board-title">
                    <span>LIGHT TABLE</span>
                    <span className="plates-board-meta">{jobTicket}</span>
                  </div>
                  <p className="plates-board-lede">CLICK A DRUM TO ISOLATE — SPACE SNAPS TO THE PRINT WHILE YOU WORK.</p>
                </header>

                <div className="plates-refs" aria-label="Reference sheets">
                  <button
                    type="button"
                    className="plate-tile is-original is-ref"
                    onClick={() => {
                      setWipe(0.5)
                      setWipeOpen(true)
                    }}
                    title="Wipe compare original vs print"
                  >
                    <div className="plate-tile-frame">
                      <canvas ref={bindPlate('original')} />
                    </div>
                    <div className="plate-tile-meta">
                      <span className="plate-tile-label">ORIGINAL</span>
                      <span className="plate-tile-sub">WIPE COMPARE</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="plate-tile is-print is-ref"
                    onClick={closePlates}
                    title="Open the live press proof"
                  >
                    <div className="plate-tile-frame">
                      <canvas ref={bindPlate('print')} />
                    </div>
                    <div className="plate-tile-meta">
                      <span className="plate-tile-chip" style={{ background: 'var(--riso-pink)' }} />
                      <span className="plate-tile-label">PRINT</span>
                      <span className="plate-tile-sub">OPEN PROOF</span>
                    </div>
                  </button>
                </div>

                <section className="plates-stage is-contributions">
                  <div className="plates-stage-label">
                    <span>CONTRIBUTIONS</span>
                    <span className="plates-stage-meta">CHANNEL → INK PASS</span>
                  </div>
                  {state.layers.length > 0 ? (
                    <div className="plates-contrib-grid">
                      {state.layers.map((layer, i) => {
                        const ink = inkById(layer.inkId)
                        const sep = SEP_MODES[layer.sep]
                        return (
                          <button
                            type="button"
                            key={layer.id}
                            className={`plates-contrib ${
                              layer.id === state.selectedId ? 'is-selected' : ''
                            } ${layer.enabled ? '' : 'is-muted'}`}
                            onClick={() => enterIsolate(layer.id)}
                            title={`Isolate ${ink.name} — pulls from ${sep?.name ?? '—'}`}
                            style={{ ['--contrib-ink' as string]: ink.hex }}
                          >
                            <div className="plates-contrib-head">
                              <span className="plate-tile-chip" style={{ background: ink.hex }} />
                              <span className="plates-contrib-name">
                                {String(i + 1).padStart(2, '0')} {ink.name}
                                {!layer.enabled ? ' · OFF' : ''}
                              </span>
                              <span className="plates-contrib-action">ISOLATE</span>
                            </div>
                            <div className="plates-contrib-body">
                              <div className="plate-tile is-channel">
                                <div className="plate-tile-frame">
                                  <canvas ref={bindPlate(`ch-${layer.id}`)} />
                                </div>
                                <div className="plate-tile-meta">
                                  <span
                                    className="plate-tile-chip"
                                    style={{ background: CHANNEL_ACCENT[layer.sep] ?? '#211f1c' }}
                                  />
                                  <span className="plate-tile-label">{sep?.short ?? '—'}</span>
                                  <span className="plate-tile-sub">PULLS</span>
                                </div>
                              </div>
                              <div className="plates-contrib-arrow" aria-hidden="true">
                                →
                              </div>
                              <div className="plate-tile is-drum">
                                <div className="plate-tile-frame">
                                  <canvas ref={bindPlate(`drum-${layer.id}`)} />
                                </div>
                                <div className="plate-tile-meta">
                                  <span className="plate-tile-chip" style={{ background: ink.hex }} />
                                  <span className="plate-tile-label">PASS</span>
                                  <span className="plate-tile-sub">INK ON STOCK</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="plates-empty">NO DRUMS LOADED.</p>
                  )}
                </section>
              </div>
            ) : (
              <div
                className={[
                  'print',
                  'can-pan',
                  dragMode ? 'is-registering' : '',
                  panning ? 'is-panning' : '',
                  fx ? `fx-${fx.kind}-${fx.n % 2 ? 'a' : 'b'}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ width: displayW }}
                onPointerDown={startRegDrag}
                onPointerMove={moveRegDrag}
                onPointerUp={endRegDrag}
                onPointerCancel={() => endRegDrag()}
                onAnimationEnd={(e) => {
                  if (e.target === e.currentTarget) setFx(null)
                }}
              >
                <canvas ref={bindPlate('proof')} />
                {fx?.kind === 'align' && (
                  <div className="reg-marks" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* pinned to the bed, not the sheet, so zoom and scroll can't hide it */}
          {!platesOpen && selected && (
            <div className={`reg-live ${dragMode ? 'is-live' : plateFlash ? 'is-flash' : ''}`}>
              <span className="reg-live-chip" style={{ background: inkById(selected.inkId).hex }} />
              {inkById(selected.inkId).name} PLATE
              {(dragMode || plateOffTrue) && (
                <span className="reg-live-val">
                  {dragMode === 'twist'
                    ? `SKEW ${signed(selected.rot, 2)}°`
                    : `X ${signed(selected.offX)} Y ${signed(selected.offY)}`}
                </span>
              )}
            </div>
          )}

          {platesOpen && (
            <div className="plates-banner" aria-hidden="true">
              {wipeOpen
                ? 'WIPE · ESC BACK · Y EXIT'
                : isolateId
                  ? isoPeekPrint
                    ? 'PRINT PEEK · SPACE BACK TO CHANNEL'
                    : 'ISOLATE · SPACE = PRINT · ESC = TABLE'
                  : 'LIGHT TABLE · Y TO EXIT'}
            </div>
          )}

          <div className="pressbed-hud">
            <div className="hud-pill">
              <button
                className="hud-btn"
                disabled={platesOpen}
                onClick={() => setZoom(Math.max(0.1, (zoom === 'fit' ? fitScale : zoom) / 1.25))}
              >
                −
              </button>
              <button
                className="hud-zoom"
                disabled={platesOpen}
                onClick={() => setZoom('fit')}
                title="Fit to bed"
              >
                {platesOpen ? 'BOARD' : `${zoomPct}%`}
              </button>
              <button
                className="hud-btn"
                disabled={platesOpen}
                onClick={() => setZoom(Math.min(4, (zoom === 'fit' ? fitScale : zoom) * 1.25))}
              >
                +
              </button>
              <span className="hud-sep" />
              <button
                className={`hud-btn hud-wide ${!platesOpen && zoom === 'fit' ? 'is-active' : ''}`}
                disabled={platesOpen}
                title="Fit in view (Space)"
                onClick={() => setZoom('fit')}
              >
                FIT
              </button>
              <button
                className={`hud-btn hud-wide ${!platesOpen && zoom === 1 ? 'is-active' : ''}`}
                disabled={platesOpen}
                title="Actual pixels (Space)"
                onClick={() => setZoom(1)}
              >
                1:1
              </button>
            </div>

            <div className="hud-pill">
              <button
                className="hud-btn hud-wide"
                disabled={!state.layers.length || platesOpen}
                title="Knock every drum out of true (S)"
                onClick={shakeAll}
              >
                <ShakeIcon />
                SHAKE
              </button>
              <button
                className="hud-btn hud-wide"
                disabled={!misregistered || platesOpen}
                title="Bring every drum back onto the registration mark (A)"
                onClick={alignAll}
              >
                <AlignIcon />
                ALIGN
              </button>
            </div>
          </div>

          <div className="pressbed-help" ref={helpRef}>
            {helpOpen && (
              <div className="help-pop">
                <div className="help-head">
                  {platesOpen
                    ? wipeOpen
                      ? 'WIPE COMPARE'
                      : isolateId
                        ? 'CHANNEL ISOLATE'
                        : 'LIGHT TABLE'
                    : 'REGISTRATION'}
                </div>
                <p className="help-lede">
                  {platesOpen
                    ? wipeOpen
                      ? 'DRAG THE HANDLE LEFT AND RIGHT TO COMPARE THE SOURCE ART WITH THE RISOGRAPH RENDER.'
                      : isolateId
                        ? isoPeekPrint
                          ? 'COMPOSITE SNAP — SPACE RETURNS TO THE CHANNEL YOU WERE TUNING.'
                          : 'CHANNEL SOLO. SPACE SNAPS TO THE COMPOSITE PRINT, SPACE AGAIN RETURNS HERE. EDIT IN THE RIGHT RAIL.'
                        : 'CONTRIBUTIONS FIRST — CLICK A DRUM TO ISOLATE. ORIGINAL AND PRINT STAY AS SMALL REFERENCES UP TOP.'
                    : ''}
                </p>
                <dl className="help-keys">
                  {platesOpen ? (
                    wipeOpen ? (
                      <>
                        <dt>DRAG / SLIDER</dt>
                        <dd>WIPE ORIGINAL ↔ PRINT</dd>
                        <dt>ESC</dt>
                        <dd>BACK TO LIGHT TABLE</dd>
                        <dt>Y</dt>
                        <dd>EXIT</dd>
                      </>
                    ) : isolateId ? (
                      <>
                        <dt>SPACE</dt>
                        <dd>SNAP TO PRINT / BACK</dd>
                        <dt>←→↑↓</dt>
                        <dd>PREV / NEXT CHANNEL</dd>
                        <dt>ESC</dt>
                        <dd>BACK TO LIGHT TABLE</dd>
                        <dt>Y</dt>
                        <dd>EXIT</dd>
                      </>
                    ) : (
                      <>
                        <dt>Y</dt>
                        <dd>TOGGLE THIS BOARD</dd>
                        <dt>CLICK A DRUM</dt>
                        <dd>ISOLATE THAT CHANNEL</dd>
                        <dt>CLICK ORIGINAL</dt>
                        <dd>WIPE VS PRINT</dd>
                        <dt>CLICK PRINT</dt>
                        <dd>OPEN LIVE PROOF</dd>
                        <dt>ESC</dt>
                        <dd>EXIT</dd>
                      </>
                    )
                  ) : (
                    <>
                      <dt>SPACE</dt>
                      <dd>FIT ↔ 1:1</dd>
                      <dt>Y</dt>
                      <dd>LIGHT TABLE</dd>
                      <dt>S</dt>
                      <dd>SHAKE</dd>
                      <dt>A</dt>
                      <dd>ALIGN</dd>
                      <dt>⌘Z</dt>
                      <dd>UNDO</dd>
                      <dt>⌘⇧Z</dt>
                      <dd>REDO</dd>
                      <dt>←→↑↓</dt>
                      <dd>PREV / NEXT DRUM</dd>
                      <dt>CLICK PROOF</dt>
                      <dd>NEXT DRUM (SHIFT: BACK)</dd>
                      <dt>DRAG PROOF</dt>
                      <dd>PAN THE BED</dd>
                      <dt>⌘-DRAG</dt>
                      <dd>SLIDE THIS PLATE</dd>
                      <dt>⌘-SHIFT-DRAG</dt>
                      <dd>SKEW THIS PLATE</dd>
                      <dt>NEAR TRUE</dt>
                      <dd>THE PLATE SNAPS BACK</dd>
                    </>
                  )}
                </dl>
              </div>
            )}
            <button
              className={`help-btn ${helpOpen ? 'is-active' : ''}`}
              aria-expanded={helpOpen}
              aria-haspopup="dialog"
              aria-label="How registration works"
              title="How registration works"
              onClick={() => setHelpOpen((open) => !open)}
            >
              ?
            </button>
          </div>
        </main>

        {/* ---------------- RIGHT ---------------- */}
        <aside className="rail rail-right">
          {selected ? (
            <Section num="04" title="DRUM SETTINGS" accent={inkById(selected.inkId).hex}>
              <div className="swatch-grid" role="listbox" aria-label="Riso ink">
                {INKS.map((ink) => (
                  <button
                    key={ink.id}
                    className={`swatch ${ink.id === selected.inkId ? 'is-active' : ''}`}
                    style={{ background: ink.hex }}
                    data-tip={ink.name + (ink.fluoro ? ' · FLUO' : '')}
                    aria-label={ink.name + (ink.fluoro ? ' (fluorescent)' : '')}
                    onClick={() => setLayer(selected.id, { inkId: ink.id })}
                  />
                ))}
              </div>
              <div className="ink-readout">
                <b>{inkById(selected.inkId).name}</b>
                <span>{inkById(selected.inkId).hex.toUpperCase()}</span>
              </div>

              <Select
                label="PULLS FROM"
                value={selected.sep}
                options={SEP_MODES.map((m) => ({ value: m.id, label: m.name }))}
                onChange={(v) => setLayer(selected.id, { sep: parseInt(v) })}
                onPreview={(v) =>
                  setLayerPreview(v === null ? null : { id: selected.id, patch: { sep: parseInt(v) } })
                }
              />
              <Slider
                label="INK DENSITY"
                value={selected.density}
                min={0}
                max={2}
                fmt={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => setLayer(selected.id, { density: v })}
              />
              <Slider
                label="PLATE CONTRAST"
                value={selected.contrast}
                min={0.2}
                max={2.5}
                onChange={(v) => setLayer(selected.id, { contrast: v })}
              />

              <Select
                label="SCREEN"
                value={selected.tex}
                options={TEX_MODES.map((m) => ({ value: m.id, label: m.name }))}
                onChange={(v) => setLayer(selected.id, { tex: parseInt(v) })}
                onPreview={(v) =>
                  setLayerPreview(v === null ? null : { id: selected.id, patch: { tex: parseInt(v) } })
                }
              />
              {selected.tex !== 6 && (
                <Slider
                  label={selected.tex === 3 || selected.tex === 4 ? 'SCREEN PITCH' : 'GRAIN SIZE'}
                  value={selected.scale}
                  min={1.5}
                  max={20}
                  step={0.1}
                  fmt={(v) => v.toFixed(1)}
                  onChange={(v) => setLayer(selected.id, { scale: v })}
                />
              )}
              {(selected.tex === 3 || selected.tex === 4) && (
                <Slider
                  label="SCREEN ANGLE"
                  value={selected.angle}
                  min={0}
                  max={90}
                  step={1}
                  fmt={(v) => `${v.toFixed(0)}°`}
                  onChange={(v) => setLayer(selected.id, { angle: v })}
                />
              )}

              <button className="btn btn-block btn-danger" onClick={() => removeLayer(selected.id)}>
                ✕ EJECT DRUM
              </button>
            </Section>
          ) : (
            <Section num="04" title="DRUM SETTINGS">
              <p className="empty-note">NO DRUM LOADED — ADD ONE ON THE LEFT.</p>
            </Section>
          )}

          <Section num="05" title="PAPER STOCK" accent="var(--riso-teal)" defaultOpen={false}>
            <div className="paper-grid">
              {PAPERS.filter((p) => p.id !== 'custom').map((p) => (
                <button
                  key={p.id}
                  className={`paper-chip ${state.paperId === p.id ? 'is-active' : ''}`}
                  onClick={() => set({ paperId: p.id })}
                >
                  <span className="paper-chip-color" style={{ background: p.hex }} />
                  {p.name}
                </button>
              ))}
              <label className={`paper-chip paper-custom ${state.paperId === 'custom' ? 'is-active' : ''}`}>
                <input
                  type="color"
                  value={state.paperColor}
                  onChange={(e) => set({ paperId: 'custom', paperColor: e.target.value })}
                />
                <span className="paper-chip-color" style={{ background: state.paperColor }} />
                CUSTOM
              </label>
            </div>
            <p className="paper-stock-hint">{paperById(state.paperId).desc}</p>
            <Slider
              label="PAPER TOOTH"
              value={state.paperTex}
              min={0}
              max={1}
              fmt={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => set({ paperTex: v })}
            />
          </Section>

          <Section num="06" title="PRESS CONDITION" accent="var(--riso-orange)" defaultOpen={false}>
            <Slider
              label="INK SPREAD"
              value={state.bleed}
              min={0}
              max={1}
              fmt={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => set({ bleed: v })}
            />
            <Slider
              label="ROLLER WOBBLE"
              value={state.roller}
              min={0}
              max={1}
              fmt={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => set({ roller: v })}
            />
            <Slider
              label="PRESS WEAR"
              value={state.wear ?? 0}
              min={0}
              max={1}
              fmt={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => set({ wear: v })}
            />
            <Slider
              label="SCUFF + GRAIN"
              value={state.grain}
              min={0}
              max={1}
              fmt={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => set({ grain: v })}
            />
          </Section>

          <Section num="07" title="ORIGINAL ADJUST" accent="var(--riso-purple)" defaultOpen={false}>
            <Slider
              label="BRIGHTNESS"
              value={state.bright}
              min={-0.5}
              max={0.5}
              fmt={(v) => `${v > 0 ? '+' : ''}${Math.round(v * 200)}`}
              onChange={(v) => set({ bright: v })}
            />
            <Slider label="CONTRAST" value={state.contrast} min={0.4} max={2} onChange={(v) => set({ contrast: v })} />
            <Slider label="SATURATION" value={state.sat} min={0} max={2} onChange={(v) => set({ sat: v })} />
          </Section>

          <Section num="08" title="PRINT + SHIP" accent="var(--riso-green)" defaultOpen={false}>
            <div className="export-row">
              <button className="btn btn-block btn-pink" disabled={!!busy} onClick={() => exportPng(1)}>
                {busy ?? 'PNG · FULL SIZE'}
              </button>
              <button className="btn btn-block btn-outline" disabled={!!busy} onClick={() => exportPng(2)}>
                PNG · 2× POSTER
              </button>
            </div>

            <div className="sep-block">
              <div className="sep-head">
                <span>SEPARATIONS</span>
                <span className="sep-count">
                  {inkCount} PLATE{inkCount === 1 ? '' : 'S'}
                </span>
              </div>
              <button
                className="btn btn-block btn-outline"
                disabled={!!busy || inkCount === 0}
                onClick={() => exportSeparations('master')}
              >
                ZIP · PRESS MASTERS
              </button>
              <p className="sep-note">
                GRAYSCALE, UNSCREENED — BURN STENCILS FROM THESE.
              </p>
              <button
                className="btn btn-block btn-outline"
                disabled={!!busy || inkCount === 0}
                onClick={() => exportSeparations('proof')}
              >
                ZIP · PROOF PASSES
              </button>
              <p className="sep-note">EACH DRUM IN INK ON STOCK, SCREEN AND ALL.</p>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={state.marks}
                  onChange={(e) => set({ marks: e.target.checked })}
                />
                <span className="toggle-box">{state.marks ? '✕' : ''}</span>
                CROP + REGISTRATION MARKS
              </label>
            </div>

            <p className="export-note">SCREENS RE-RENDER AT EXPORT SIZE — DOTS STAY SHARP.</p>
          </Section>
        </aside>
      </div>
    </div>
  )
}

import { defaultState } from './inks'
import { MAX_LAYERS, type InkLayer, type StudioState } from './types'

const META_KEY = 'inkdrum-session-meta-v1'
const DB_NAME = 'inkdrum-session'
const DB_STORE = 'files'
const IMAGE_KEY = 'source'
const META_VERSION = 1 as const

export interface SessionMeta {
  v: typeof META_VERSION
  state: StudioState
  imgName: string
  zoom: 'fit' | number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
  })
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('indexedDB request failed'))
  })
}

function sanitizeLayer(raw: unknown): InkLayer | null {
  if (!raw || typeof raw !== 'object') return null
  const l = raw as Partial<InkLayer>
  if (typeof l.id !== 'string' || typeof l.inkId !== 'string') return null
  return {
    id: l.id,
    inkId: l.inkId,
    enabled: l.enabled !== false,
    sep: typeof l.sep === 'number' ? l.sep : 0,
    density: typeof l.density === 'number' ? l.density : 1,
    contrast: typeof l.contrast === 'number' ? l.contrast : 1,
    tex: typeof l.tex === 'number' ? l.tex : 0,
    scale: typeof l.scale === 'number' ? l.scale : 2.5,
    angle: typeof l.angle === 'number' ? l.angle : 45,
    offX: typeof l.offX === 'number' ? l.offX : 0,
    offY: typeof l.offY === 'number' ? l.offY : 0,
    rot: typeof l.rot === 'number' ? l.rot : 0,
    seed: typeof l.seed === 'number' ? l.seed : Math.random() * 100,
  }
}

/** Merge a saved payload onto current defaults so older sessions stay valid. */
export function sanitizeState(raw: unknown): StudioState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<StudioState>
  if (!Array.isArray(s.layers)) return null
  const base = defaultState()
  const layers = s.layers
    .map(sanitizeLayer)
    .filter((layer): layer is InkLayer => !!layer)
    .slice(0, MAX_LAYERS)
  if (!layers.length) return null

  const legacy = s as Partial<StudioState> & {
    edge?: number
    streaks?: number
    hickeys?: number
  }
  const wear =
    typeof legacy.wear === 'number'
      ? legacy.wear
      : legacy.edge != null || legacy.streaks != null || legacy.hickeys != null
        ? Math.max(legacy.edge ?? 0, legacy.streaks ?? 0, legacy.hickeys ?? 0)
        : base.wear

  return {
    ...base,
    ...s,
    layers,
    selectedId: layers.find((layer) => layer.id === s.selectedId)?.id ?? layers[0]?.id ?? null,
    paperId: typeof s.paperId === 'string' ? s.paperId : base.paperId,
    paperColor: typeof s.paperColor === 'string' ? s.paperColor : base.paperColor,
    paperTex: typeof s.paperTex === 'number' ? s.paperTex : base.paperTex,
    bleed: typeof s.bleed === 'number' ? s.bleed : base.bleed,
    roller: typeof s.roller === 'number' ? s.roller : base.roller,
    grain: typeof s.grain === 'number' ? s.grain : base.grain,
    wear,
    bright: typeof s.bright === 'number' ? s.bright : base.bright,
    contrast: typeof s.contrast === 'number' ? s.contrast : base.contrast,
    sat: typeof s.sat === 'number' ? s.sat : base.sat,
    marks: typeof s.marks === 'boolean' ? s.marks : base.marks,
  }
}

export function readSessionMeta(): SessionMeta | null {
  try {
    const raw = sessionStorage.getItem(META_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SessionMeta>
    const state = sanitizeState(parsed.state)
    if (!state) return null
    const zoom =
      parsed.zoom === 'fit' || (typeof parsed.zoom === 'number' && Number.isFinite(parsed.zoom))
        ? parsed.zoom
        : 'fit'
    return {
      v: META_VERSION,
      state,
      imgName: typeof parsed.imgName === 'string' && parsed.imgName ? parsed.imgName : 'RESTORED SESSION',
      zoom,
    }
  } catch {
    return null
  }
}

export function writeSessionMeta(meta: Omit<SessionMeta, 'v'>): void {
  try {
    const payload: SessionMeta = { v: META_VERSION, ...meta }
    sessionStorage.setItem(META_KEY, JSON.stringify(payload))
  } catch {
    // quota / private mode — keep working without persistence
  }
}

export async function writeSessionImage(canvas: HTMLCanvasElement): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
  })
  if (!blob) return
  try {
    const db = await openDb()
    try {
      const tx = db.transaction(DB_STORE, 'readwrite')
      await idbRequest(tx.objectStore(DB_STORE).put(blob, IMAGE_KEY))
    } finally {
      db.close()
    }
  } catch {
    // IDB unavailable — meta still restores drums/settings
  }
}

export async function readSessionImage(): Promise<Blob | null> {
  try {
    const db = await openDb()
    try {
      const tx = db.transaction(DB_STORE, 'readonly')
      const value = await idbRequest(tx.objectStore(DB_STORE).get(IMAGE_KEY))
      return value instanceof Blob ? value : null
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

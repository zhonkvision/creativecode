import { inkById, paperHex, PAPERS } from './inks'
import { SEP_MODES, TEX_MODES, type InkLayer, type StudioState } from './types'

export type SepMode = 'master' | 'proof'

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const plateFile = (i: number, l: InkLayer, mode: SepMode) =>
  `${String(i + 1).padStart(2, '0')}-${slug(inkById(l.inkId).name)}-${mode}.png`

export function canvasToBlob(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((res) => c.toBlob(res, 'image/png'))
}

export function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

/**
 * Wrap a rendered plate in a trim margin carrying crop marks, registration
 * targets and a plate label — the things you need to line four passes up by
 * hand. Everything lives outside the image, so it trims away.
 */
export function addTrimMarks(src: HTMLCanvasElement, bg: string, label: string): HTMLCanvasElement {
  const m = Math.max(48, Math.round(Math.max(src.width, src.height) * 0.045))
  const w = src.width
  const h = src.height

  const c = document.createElement('canvas')
  c.width = w + m * 2
  c.height = h + m * 2
  const ctx = c.getContext('2d')!

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(src, m, m)

  ctx.strokeStyle = '#111'
  ctx.fillStyle = '#111'
  ctx.lineWidth = Math.max(1, Math.round(m * 0.028))
  ctx.lineCap = 'butt'

  // crop marks: L pairs just outside each corner of the trim box
  const gap = m * 0.2
  const arm = m * 0.5
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  for (const [cx, cy, sx, sy] of [
    [m, m, -1, -1],
    [m + w, m, 1, -1],
    [m, m + h, -1, 1],
    [m + w, m + h, 1, 1],
  ] as const) {
    line(cx + sx * gap, cy, cx + sx * (gap + arm), cy)
    line(cx, cy + sy * gap, cx, cy + sy * (gap + arm))
  }

  // registration targets centred on each edge of the trim box
  const r = m * 0.2
  for (const [tx, ty] of [
    [m + w / 2, m / 2],
    [m + w / 2, m + h + m / 2],
    [m / 2, m + h / 2],
    [m + w + m / 2, m + h / 2],
  ] as const) {
    ctx.beginPath()
    ctx.arc(tx, ty, r, 0, Math.PI * 2)
    ctx.stroke()
    line(tx - r * 1.7, ty, tx + r * 1.7, ty)
    line(tx, ty - r * 1.7, tx, ty + r * 1.7)
  }

  // Plate label in the bottom margin, indented clear of the corner crop mark
  // and shrunk to stop short of the centre registration target.
  const labelX = m + m * 0.18
  const room = m + w / 2 - r * 2.2 - labelX
  ctx.textBaseline = 'middle'
  let fs = Math.round(m * 0.3)
  do {
    ctx.font = `700 ${fs}px ui-monospace, "SF Mono", Menlo, monospace`
    if (ctx.measureText(label).width <= room) break
    fs -= 1
  } while (fs > 6)
  ctx.fillText(label, labelX, m + h + m * 0.5)

  return c
}

const pad = (s: string, n: number) => s.padEnd(n, ' ')

export function jobSheet(
  state: StudioState,
  layers: InkLayer[],
  mode: SepMode,
  meta: { source: string; w: number; h: number },
): string {
  const paper = PAPERS.find((p) => p.id === state.paperId)
  const paperLabel = `${paper?.name ?? 'CUSTOM'}  ${paperHex(state).toUpperCase()}`
  const now = new Date()
  const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`

  const L: string[] = []
  L.push('INKDRUM — SEPARATION JOB SHEET')
  L.push('='.repeat(46))
  L.push('')
  L.push(`${pad('GENERATED', 12)}${stamp}`)
  L.push(`${pad('SOURCE', 12)}${meta.source}`)
  L.push(`${pad('PLATE SIZE', 12)}${meta.w} × ${meta.h} px`)
  L.push(`${pad('PAPER', 12)}${paperLabel}`)
  L.push(`${pad('PLATES', 12)}${layers.length}`)
  L.push(
    `${pad('MODE', 12)}${
      mode === 'master'
        ? 'PRESS MASTERS — continuous tone, unscreened'
        : 'PROOF PASSES — screened, in ink colour on stock'
    }`,
  )
  L.push('')
  L.push('PRINT ORDER — first pass at the top')
  L.push('-'.repeat(46))

  layers.forEach((l, i) => {
    const ink = inkById(l.inkId)
    const screen = TEX_MODES[l.tex]?.name ?? '—'
    const pitch = l.tex === 6 ? '' : ` @ ${l.scale.toFixed(1)}px`
    const ang = l.tex === 3 || l.tex === 4 ? ` / ${l.angle.toFixed(0)}°` : ''
    L.push('')
    L.push(`  ${i + 1}  ${ink.name}  ${ink.hex.toUpperCase()}${ink.fluoro ? '  (FLUORESCENT)' : ''}`)
    L.push(`     ${pad('pulls from', 13)}${SEP_MODES[l.sep]?.name ?? '—'}`)
    L.push(`     ${pad('density', 13)}${Math.round(l.density * 100)}%`)
    L.push(`     ${pad('plate contr.', 13)}${l.contrast.toFixed(2)}`)
    L.push(`     ${pad('screen', 13)}${screen}${pitch}${ang}`)
    L.push(
      `     ${pad('registration', 13)}${l.offX >= 0 ? '+' : ''}${l.offX.toFixed(1)}, ${
        l.offY >= 0 ? '+' : ''
      }${l.offY.toFixed(1)} px  skew ${l.rot.toFixed(2)}°`,
    )
    L.push(`     ${pad('file', 13)}${plateFile(i, l, mode)}`)
  })

  L.push('')
  L.push('NOTES')
  L.push('-'.repeat(46))
  if (mode === 'master') {
    L.push('  · These are continuous-tone masters. Let the Risograph do its')
    L.push('    own halftoning — pre-screened art run through the machine')
    L.push('    screen gives you moiré.')
    L.push('  · Screen and registration figures above are recorded for')
    L.push('    reference only; they shape the on-screen proof, not these')
    L.push('    plates. Masters are dead square so the press can misbehave')
    L.push('    on its own terms.')
    L.push('  · Ink density is baked in. Riso ink builds up darker than the')
    L.push('    proof suggests — pull a test print before committing paper.')
  } else {
    L.push('  · These are proof passes: each drum printed alone on the')
    L.push('    stock, with its screen, registration offset and press wear')
    L.push('    baked in. They show what each pass puts on paper.')
    L.push('  · They are pictures of passes, not stackable layers — every')
    L.push('    one already includes the paper, so multiplying them back')
    L.push('    together will over-darken. Use the full-size PNG export for')
    L.push('    the combined print.')
    L.push('  · Do not burn stencils from these — export PRESS MASTERS for')
    L.push('    that.')
  }
  L.push('  · Crop marks and registration targets sit in the trim margin.')
  L.push('')

  return L.join('\n')
}

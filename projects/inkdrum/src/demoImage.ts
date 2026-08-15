// Procedural sample image so the press is never empty — a graphic sunset
// test print with a full tonal range for the separations to chew on.
export function makeDemoImage(): HTMLCanvasElement {
  const W = 1200
  const H = 1500
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.78)
  sky.addColorStop(0, '#2b2d64')
  sky.addColorStop(0.45, '#c94f7c')
  sky.addColorStop(0.8, '#ff9e5e')
  sky.addColorStop(1, '#ffd971')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // sun with banded rings
  const cx = W * 0.5
  const cy = H * 0.46
  for (let i = 7; i >= 0; i--) {
    const r = 90 + i * 48
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, ${170 + i * 10}, ${60 + i * 22}, ${0.16 + (7 - i) * 0.02})`
    ctx.fill()
  }
  const sun = ctx.createRadialGradient(cx, cy - 30, 20, cx, cy, 190)
  sun.addColorStop(0, '#fff7d8')
  sun.addColorStop(0.6, '#ffd23e')
  sun.addColorStop(1, '#ff8e42')
  ctx.fillStyle = sun
  ctx.beginPath()
  ctx.arc(cx, cy, 185, 0, Math.PI * 2)
  ctx.fill()

  // horizontal cut lines through the sun (classic riso sun)
  ctx.fillStyle = 'rgba(201, 79, 124, 0.9)'
  for (let i = 0; i < 6; i++) {
    const y = cy + 20 + i * 30
    ctx.fillRect(cx - 200, y, 400, 6 + i * 2)
  }

  // clouds
  ctx.fillStyle = 'rgba(255, 236, 214, 0.75)'
  const cloud = (x: number, y: number, s: number) => {
    for (const [dx, dy, r] of [[0, 0, 46], [40, 8, 34], [-42, 10, 30], [16, -18, 32]] as const) {
      ctx.beginPath()
      ctx.ellipse(x + dx * s, y + dy * s, r * s, r * 0.62 * s, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  cloud(W * 0.2, H * 0.2, 1.1)
  cloud(W * 0.78, H * 0.14, 0.9)
  cloud(W * 0.68, H * 0.34, 0.7)

  // mountain layers
  const ridge = (base: number, amp: number, seedOffset: number, color: string) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let x = 0; x <= W; x += 12) {
      const t = x / W
      const y = base
        + Math.sin(t * 5.1 + seedOffset) * amp
        + Math.sin(t * 11.7 + seedOffset * 2.3) * amp * 0.45
        + Math.sin(t * 23.1 + seedOffset * 4.1) * amp * 0.18
      ctx.lineTo(x, y)
    }
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.fill()
  }
  ridge(H * 0.62, 70, 1.7, '#6c4d7e')
  ridge(H * 0.7, 55, 4.2, '#474072')
  ridge(H * 0.78, 40, 8.9, '#2c2a52')

  // water with sun reflection
  ctx.fillStyle = '#22224a'
  ctx.fillRect(0, H * 0.82, W, H * 0.18)
  for (let i = 0; i < 26; i++) {
    const y = H * 0.83 + i * 9
    const w = 190 - i * 6 + Math.sin(i * 1.7) * 40
    ctx.fillStyle = `rgba(255, 170, 90, ${0.55 - i * 0.02})`
    ctx.fillRect(cx - w / 2 + Math.sin(i * 2.9) * 26, y, w, 4)
  }

  // birds
  ctx.strokeStyle = '#2c2a52'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  const bird = (x: number, y: number, s: number) => {
    ctx.beginPath()
    ctx.arc(x - 14 * s, y, 14 * s, Math.PI * 1.15, Math.PI * 1.85)
    ctx.arc(x + 14 * s, y, 14 * s, Math.PI * 1.15, Math.PI * 1.85)
    ctx.stroke()
  }
  bird(W * 0.3, H * 0.3, 1)
  bird(W * 0.38, H * 0.26, 0.7)
  bird(W * 0.25, H * 0.35, 0.55)

  return c
}

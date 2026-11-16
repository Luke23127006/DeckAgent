import { type Env, type Scene, TAU, angleDiff, at, prepare, rnd, smooth } from './background-kit.ts'

/** Koi pond: drifting light on the water, koi that swim and turn, lily pads and flowers. */

type RGB = readonly [number, number, number]
const water: Record<'day' | 'night', { deep: RGB; shallow: RGB; light: RGB; dim: number }> = {
  day: { deep: [34, 118, 122], shallow: [104, 190, 180], light: [222, 252, 240], dim: 0 },
  night: { deep: [5, 22, 42], shallow: [18, 64, 88], light: [104, 186, 200], dim: 0.24 },
}

interface Cell {
  bx: number
  by: number
  ph: number
  ph2: number
  sp: number
  tone: number
  /** Position at the current time, set by `place` once per frame. */
  x: number
  y: number
}

function makeLayer(count: number, speed: number): Cell[] {
  return Array.from({ length: count }, () => ({
    bx: Math.random(),
    by: Math.random(),
    ph: rnd(0, 6.3),
    ph2: rnd(0, 6.3),
    sp: speed * rnd(0.7, 1.3),
    tone: rnd(-1, 1),
    x: 0,
    y: 0,
  }))
}

/** Moves every cell to where it is at `time`. Done once per frame, not once per pixel. */
function place(layer: readonly Cell[], aspect: number, time: number): void {
  for (const cell of layer) {
    cell.x = cell.bx * aspect + 0.05 * Math.cos(time * 0.2 * cell.sp + cell.ph)
    cell.y = cell.by + 0.05 * Math.sin(time * 0.17 * cell.sp + cell.ph2)
  }
}

/** Distance gap between the nearest two cell centres (small on a cell edge) and the tone of the nearest cell. */
function worley(layer: readonly Cell[], u: number, v: number, out: [number, number]): void {
  let first = 9
  let second = 9
  let tone = 0
  for (const cell of layer) {
    const dx = u - cell.x
    const dy = v - cell.y
    const d = dx * dx + dy * dy
    if (d < first) {
      second = first
      first = d
      tone = cell.tone
    } else if (d < second) second = d
  }
  out[0] = Math.sqrt(second) - Math.sqrt(first)
  out[1] = tone
}

type KoiKind = 'kohaku' | 'sanke' | 'ogon' | 'orange' | 'platinum'
const kinds: Record<KoiKind, { base: string; fin: string; patches: ReadonlyArray<readonly [string, number]> }> = {
  kohaku: {
    base: '#fbf6ee',
    fin: 'rgba(255,248,240,.72)',
    patches: [
      ['#e4481c', 3],
      ['#ea5a22', 2],
    ],
  },
  sanke: {
    base: '#faf5ec',
    fin: 'rgba(255,248,240,.72)',
    patches: [
      ['#e5501f', 2],
      ['#1d1f22', 3],
    ],
  },
  ogon: {
    base: '#f1b32a',
    fin: 'rgba(255,214,110,.7)',
    patches: [
      ['#ffd566', 3],
      ['#e29a18', 2],
    ],
  },
  orange: {
    base: '#f08a2c',
    fin: 'rgba(255,170,90,.7)',
    patches: [
      ['#fbf2e6', 2],
      ['#e56a1a', 2],
    ],
  },
  platinum: {
    base: '#eef2f0',
    fin: 'rgba(255,255,255,.7)',
    patches: [
      ['#cfd8d6', 3],
      ['#fafcfb', 2],
    ],
  },
}

interface Point {
  x: number
  y: number
}
interface Patch {
  t: number
  off: number
  rx: number
  ry: number
  c: string
  r: number
}
interface Koi {
  kind: KoiKind
  scale: number
  angle: number
  x: number
  y: number
  speed: number
  phase: number
  wander: number
  swim: number
  boost: number
  spine: Point[]
  patches: Patch[]
}
interface Segment extends Point {
  tx: number
  ty: number
  nx: number
  ny: number
  w: number
}

const SEGMENTS = 14
const WIDTH = [0.55, 0.8, 0.95, 1, 0.95, 0.85, 0.7, 0.55, 0.42, 0.32, 0.24, 0.18, 0.12, 0.08]
const LENGTH = 0.125

function makePatches(kind: KoiKind): Patch[] {
  const out: Patch[] = []
  for (const [c, count] of kinds[kind].patches)
    for (let j = 0; j < count; j++)
      out.push({
        t: rnd(0.08, 0.82),
        off: rnd(-0.55, 0.55),
        rx: rnd(1.3, 3.1),
        ry: rnd(0.45, 0.95),
        c,
        r: rnd(-0.5, 0.5),
      })
  return out
}

/** Closed curve through the midpoints of the points, so the outline has no corners. */
function smoothClosed(ctx: CanvasRenderingContext2D, points: readonly Point[]): void {
  const n = points.length
  const last = at(points, n - 1)
  const first = at(points, 0)
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2)
  for (let i = 0; i < n; i++) {
    const a = at(points, i)
    const b = at(points, (i + 1) % n)
    ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2)
  }
  ctx.closePath()
}

interface Pad {
  fx: number
  fy: number
  r: number
  rot: number
  flower: boolean
  ph: number
}
interface Ripple {
  x: number
  y: number
  r: number
  max: number
}

export function koiScene(env: Env): Scene {
  const { ctx } = env
  const canvas = document.createElement('canvas')
  const smallContext = canvas.getContext('2d')
  if (!smallContext) throw new Error('CANVAS_UNAVAILABLE')
  const small: CanvasRenderingContext2D = smallContext
  let image: ImageData | null = null
  let units = { w: 1, h: 1 }
  let cols = 0
  let rows = 0
  const layerA = makeLayer(22, 0.6)
  const layerB = makeLayer(13, 0.9)
  const fish: Koi[] = []
  const ripples: Ripple[] = []
  const pads: Pad[] = [
    { fx: 0.07, fy: 0.62, r: 0.075, rot: 0.6, flower: false },
    { fx: 0.93, fy: 0.08, r: 0.06, rot: 2.4, flower: true },
    { fx: 0.78, fy: 0.3, r: 0.05, rot: 4, flower: false },
    { fx: 0.4, fy: 0.8, r: 0.058, rot: 1.7, flower: true },
    { fx: 0.95, fy: 0.9, r: 0.07, rot: 3.3, flower: false },
    { fx: 0.2, fy: 0.07, r: 0.045, rot: 5.2, flower: false },
    { fx: 0.62, fy: 0.97, r: 0.05, rot: 0.2, flower: false },
  ].map((pad, i) => ({ ...pad, ph: i * 1.7 }))
  let first = true
  const edge: [number, number] = [0, 0]
  const edgeB: [number, number] = [0, 0]

  function spawn(): void {
    fish.length = 0
    const order: KoiKind[] = ['kohaku', 'sanke', 'ogon', 'orange', 'kohaku', 'platinum', 'sanke']
    for (const kind of order) {
      const angle = rnd(0, TAU)
      const scale = rnd(0.82, 1.18)
      const x = rnd(0.15, units.w - 0.15)
      const y = rnd(0.15, units.h - 0.15)
      const seg = (LENGTH * scale) / (SEGMENTS - 1)
      fish.push({
        kind,
        scale,
        angle,
        x,
        y,
        speed: rnd(0.8, 1.2),
        phase: rnd(0, TAU),
        wander: rnd(0, 50),
        swim: rnd(0, 6),
        boost: 0,
        spine: Array.from({ length: SEGMENTS }, (_, i) => ({
          x: x - Math.cos(angle) * i * seg,
          y: y - Math.sin(angle) * i * seg,
        })),
        patches: makePatches(kind),
      })
    }
  }

  function renderWater(): void {
    if (!image) return
    const palette = water[env.mode]
    const [dr, dg, db] = palette.deep
    const [sr, sg, sb] = palette.shallow
    const [lr, lg, lb] = palette.light
    const aspect = env.w / env.h
    const data = image.data
    place(layerA, aspect, env.t)
    place(layerB, aspect, env.t * 0.8 + 9)
    let k = 0
    for (let y = 0; y < rows; y++) {
      const v = y / rows
      for (let x = 0; x < cols; x++) {
        const u = (x / cols) * aspect
        worley(layerA, u, v, edge)
        worley(layerB, u * 0.9 + 0.2, v * 0.9 + 0.1, edgeB)
        const lineA = 1 - smooth(edge[0] / 0.075)
        const lineB = 1 - smooth(edgeB[0] / 0.11)
        const g = 0.25 + 0.6 * (0.55 * (1 - v) + 0.45 * (x / cols))
        const tone = 1 + edge[1] * 0.05 + edgeB[1] * 0.03
        const line = lineA * 0.34 + lineB * 0.14
        const r = (dr + (sr - dr) * g) * tone
        const gr = (dg + (sg - dg) * g) * tone
        const b = (db + (sb - db) * g) * tone
        data[k] = r + (lr - r) * line
        data[k + 1] = gr + (lg - gr) * line
        data[k + 2] = b + (lb - b) * line
        data[k + 3] = 255
        k += 4
      }
    }
    small.putImageData(image, 0, 0)
  }

  function update(dt: number): void {
    for (const k of fish) {
      const seg = (LENGTH * k.scale) / (SEGMENTS - 1)
      k.wander += dt
      let steer = (Math.sin(k.wander * 0.7 + k.phase) * 0.9 + Math.sin(k.wander * 1.9 + k.phase * 2) * 0.5) * 0.55
      const margin = 0.14
      let tx = 0
      let ty = 0
      if (k.x < margin) tx += 1
      if (k.x > units.w - margin) tx -= 1
      if (k.y < margin) ty += 1
      if (k.y > units.h - margin) ty -= 1
      if (tx || ty) steer = -angleDiff(k.angle, Math.atan2(ty, tx)) * 2.4
      k.angle += steer * dt
      k.boost *= 0.25 ** dt
      const speed = 0.075 * k.speed * (1 + k.boost * 1.6)
      k.x += Math.cos(k.angle) * speed * dt
      k.y += Math.sin(k.angle) * speed * dt
      const head = at(k.spine, 0)
      head.x = k.x
      head.y = k.y
      for (let i = 1; i < SEGMENTS; i++) {
        const ahead = at(k.spine, i - 1)
        const part = at(k.spine, i)
        const dx = ahead.x - part.x
        const dy = ahead.y - part.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6
        part.x = ahead.x - (dx / dist) * seg
        part.y = ahead.y - (dy / dist) * seg
      }
      k.swim += dt * (4.2 + speed * 34)
    }
  }

  function drawFish(k: Koi): void {
    const s = env.s
    const seg = ((LENGTH * k.scale) / (SEGMENTS - 1)) * s
    const len = LENGTH * k.scale * s
    const maxW = len * 0.125
    const body: Segment[] = []
    for (let i = 0; i < SEGMENTS; i++) {
      const a = at(k.spine, Math.max(0, i - 1))
      const b = at(k.spine, Math.min(SEGMENTS - 1, i + 1))
      let tx = a.x - b.x
      let ty = a.y - b.y
      const tl = Math.sqrt(tx * tx + ty * ty) || 1
      tx /= tl
      ty /= tl
      const nx = -ty
      const ny = tx
      const wiggle = Math.sin(k.swim - i * 0.55) * seg * 1.05 * (i / (SEGMENTS - 1)) ** 1.3
      const p = at(k.spine, i)
      body.push({ x: p.x * s + nx * wiggle, y: p.y * s + ny * wiggle, tx, ty, nx, ny, w: at(WIDTH, i) * maxW })
    }
    const kind = kinds[k.kind]
    const left = body.map(q => ({ x: q.x + q.nx * q.w, y: q.y + q.ny * q.w }))
    const right = body.map(q => ({ x: q.x - q.nx * q.w, y: q.y - q.ny * q.w }))
    const head = at(body, 0)
    const nose = { x: head.x + head.tx * head.w * 0.9, y: head.y + head.ty * head.w * 0.9 }
    const outline = [nose, ...left, ...right.slice().reverse()]

    // Tail fin
    const end = at(body, SEGMENTS - 1)
    const prev = at(body, SEGMENTS - 2)
    let bx = end.x - prev.x
    let by = end.y - prev.y
    const bl = Math.sqrt(bx * bx + by * by) || 1
    bx /= bl
    by /= bl
    const tailLen = len * 0.24
    const wave = Math.sin(k.swim - SEGMENTS * 0.55) * tailLen * 0.35
    const tnx = -by
    const tny = bx
    const tail = (): void => {
      const ex = end.x + bx * tailLen
      const ey = end.y + by * tailLen
      const t1x = ex + tnx * (tailLen * 0.5 + wave)
      const t1y = ey + tny * (tailLen * 0.5 + wave)
      const t2x = ex - tnx * (tailLen * 0.5 - wave)
      const t2y = ey - tny * (tailLen * 0.5 - wave)
      ctx.beginPath()
      ctx.moveTo(end.x + tnx * end.w, end.y + tny * end.w)
      ctx.quadraticCurveTo(
        end.x + bx * tailLen * 0.55 + tnx * tailLen * 0.55,
        end.y + by * tailLen * 0.55 + tny * tailLen * 0.55 + wave * 0.3,
        t1x,
        t1y,
      )
      ctx.quadraticCurveTo(
        ex - bx * tailLen * 0.05 + tnx * wave * 0.2,
        ey - by * tailLen * 0.05 + tny * wave * 0.2,
        (t1x + t2x) / 2 - bx * tailLen * 0.12,
        (t1y + t2y) / 2 - by * tailLen * 0.12,
      )
      ctx.quadraticCurveTo(
        ex - bx * tailLen * 0.05 - tnx * wave * 0.2,
        ey - by * tailLen * 0.05 - tny * wave * 0.2,
        t2x,
        t2y,
      )
      ctx.quadraticCurveTo(
        end.x + bx * tailLen * 0.55 - tnx * tailLen * 0.55,
        end.y + by * tailLen * 0.55 - tny * tailLen * 0.55 + wave * 0.3,
        end.x - tnx * end.w,
        end.y - tny * end.w,
      )
      ctx.closePath()
    }

    // Shadow on the pond floor: the outline moved down and right. `shadowBlur` is far slower, and the glass blurs it anyway.
    ctx.save()
    ctx.translate(len * 0.04, len * 0.11)
    ctx.fillStyle = 'rgba(0,40,50,.22)'
    ctx.beginPath()
    smoothClosed(ctx, outline)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = kind.base
    ctx.beginPath()
    smoothClosed(ctx, outline)
    ctx.fill()

    // Pectoral fins
    ctx.fillStyle = kind.fin
    const flap = Math.sin(k.swim * 1.2) * 0.25
    const fin = at(body, 3)
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(
        fin.x + fin.nx * side * (fin.w * 1.02) - fin.tx * len * 0.03,
        fin.y + fin.ny * side * (fin.w * 1.02) - fin.ty * len * 0.03,
        len * 0.075,
        len * 0.028,
        Math.atan2(-fin.ty, -fin.tx) + side * (0.75 + flap),
        0,
        TAU,
      )
      ctx.fill()
    }
    ctx.fillStyle = kind.fin
    tail()
    ctx.fill()

    // Body with its patches
    ctx.save()
    ctx.beginPath()
    smoothClosed(ctx, outline)
    ctx.clip()
    ctx.fillStyle = kind.base
    ctx.fillRect(head.x - len, head.y - len, len * 2.4, len * 2.4)
    for (const patch of k.patches) {
      const position = patch.t * (SEGMENTS - 1)
      const index = Math.floor(position)
      const fraction = position - index
      const a = at(body, index)
      const b = at(body, Math.min(SEGMENTS - 1, index + 1))
      ctx.fillStyle = patch.c
      ctx.beginPath()
      ctx.ellipse(
        a.x + (b.x - a.x) * fraction + a.nx * patch.off * a.w,
        a.y + (b.y - a.y) * fraction + a.ny * patch.off * a.w,
        patch.rx * seg * 0.9,
        patch.ry * a.w,
        Math.atan2(a.ty, a.tx) + patch.r,
        0,
        TAU,
      )
      ctx.fill()
    }
    const mid = at(body, 4)
    const shade = ctx.createLinearGradient(
      mid.x + mid.nx * maxW,
      mid.y + mid.ny * maxW,
      mid.x - mid.nx * maxW,
      mid.y - mid.ny * maxW,
    )
    shade.addColorStop(0, 'rgba(255,255,255,.18)')
    shade.addColorStop(0.5, 'rgba(255,255,255,0)')
    shade.addColorStop(1, 'rgba(0,30,40,.14)')
    ctx.fillStyle = shade
    ctx.fillRect(head.x - len, head.y - len, len * 2.4, len * 2.4)
    ctx.restore()

    // Eyes
    const eyes = at(body, 1)
    ctx.fillStyle = '#14181a'
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(eyes.x + eyes.nx * side * eyes.w * 0.72, eyes.y + eyes.ny * side * eyes.w * 0.72, len * 0.014, 0, TAU)
      ctx.fill()
    }
  }

  function drawPad(pad: Pad): void {
    const t = env.t
    const x = pad.fx * env.w + Math.sin(t * 0.4 + pad.ph) * 1.6
    const y = pad.fy * env.h + Math.cos(t * 0.33 + pad.ph) * 1.6
    const radius = pad.r * env.s
    const day = env.mode === 'day'
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(pad.rot + Math.sin(t * 0.2 + pad.ph) * 0.03)
    ctx.save()
    ctx.fillStyle = 'rgba(0,40,40,.2)'
    ctx.beginPath()
    ctx.arc(0, radius * 0.14, radius, 0.16, TAU - 0.16)
    ctx.lineTo(0, radius * 0.14)
    ctx.closePath()
    ctx.fill()
    const leaf = ctx.createRadialGradient(-radius * 0.2, -radius * 0.25, radius * 0.1, 0, 0, radius)
    leaf.addColorStop(0, day ? '#9bd078' : '#3c7f58')
    leaf.addColorStop(1, day ? '#5aa65a' : '#1f5a46')
    ctx.fillStyle = leaf
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0.16, TAU - 0.16)
    ctx.lineTo(0, 0)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,.22)'
    ctx.lineWidth = 1
    for (let i = 0; i < 9; i++) {
      const a = 0.5 + (i * (TAU - 1)) / 8
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(a) * radius * 0.92, Math.sin(a) * radius * 0.92)
      ctx.stroke()
    }
    ctx.restore()
    if (!pad.flower) return
    ctx.save()
    ctx.translate(x + radius * 0.05, y - radius * 0.05)
    const petal = radius * 0.62
    const tints = day ? ['#f7b3cf', '#ffd9e8'] : ['#c98aa9', '#e6bfd1']
    for (let ring = 0; ring < 2; ring++) {
      const count = ring ? 6 : 9
      const size = petal * (ring ? 0.62 : 1)
      const offset = ring ? 0.2 : 0
      for (let j = 0; j < count; j++) {
        ctx.save()
        ctx.rotate((j * TAU) / count + ring * 0.35 + Math.sin(t * 0.3 + pad.ph) * 0.04)
        const gradient = ctx.createLinearGradient(0, 0, size, 0)
        gradient.addColorStop(0, '#fff1f6')
        gradient.addColorStop(1, at(tints, ring))
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.ellipse(size * 0.52 + offset * petal, 0, size * 0.5, size * 0.2, 0, 0, TAU)
        ctx.fill()
        ctx.restore()
      }
    }
    ctx.fillStyle = '#ffd45a'
    ctx.beginPath()
    ctx.arc(0, 0, petal * 0.15, 0, TAU)
    ctx.fill()
    ctx.restore()
  }

  function drawRipples(dt: number): void {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = at(ripples, i)
      ripple.r += dt * 0.1
      if (ripple.r >= ripple.max) {
        ripples.splice(i, 1)
        continue
      }
      const fade = 1 - ripple.r / ripple.max
      for (let k = 0; k < 3; k++) {
        const radius = (ripple.r - k * 0.012) * env.s
        if (radius <= 0) continue
        ctx.strokeStyle = `rgba(255,255,255,${(0.5 * fade * (1 - k * 0.3)).toFixed(3)})`
        ctx.lineWidth = 1.6 - k * 0.4
        ctx.beginPath()
        ctx.arc(ripple.x * env.s, ripple.y * env.s, radius, 0, TAU)
        ctx.stroke()
      }
    }
  }

  return {
    resize() {
      units = { w: env.w / env.s, h: env.h / env.s }
      cols = Math.max(80, Math.round(env.w / 10))
      rows = Math.max(60, Math.round((cols * env.h) / env.w))
      canvas.width = cols
      canvas.height = rows
      image = small.createImageData(cols, rows)
      if (fish.length === 0) spawn()
      first = true
    },
    update,
    click(x, y) {
      const u = x / env.s
      const v = y / env.s
      ripples.push({ x: u, y: v, r: 0, max: 0.16 + Math.random() * 0.06 })
      for (const k of fish) {
        const dx = k.x - u
        const dy = k.y - v
        if (Math.sqrt(dx * dx + dy * dy) < 0.3) {
          k.boost = Math.max(k.boost, 2.2)
          k.angle += angleDiff(Math.atan2(dy, dx), k.angle) * 0.7
        }
      }
    },
    draw(dt, force) {
      if (force || first || env.frame % 3 === 0) {
        renderWater()
        first = false
      }
      prepare(env)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(canvas, 0, 0, env.w, env.h)
      const vignette = ctx.createRadialGradient(
        env.w / 2,
        env.h / 2,
        Math.min(env.w, env.h) * 0.35,
        env.w / 2,
        env.h / 2,
        Math.max(env.w, env.h) * 0.75,
      )
      vignette.addColorStop(0, 'rgba(0,30,40,0)')
      vignette.addColorStop(1, 'rgba(0,30,40,.22)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, env.w, env.h)
      for (const k of fish) drawFish(k)
      for (const pad of pads) drawPad(pad)
      drawRipples(dt)
      const dim = water[env.mode].dim
      if (dim) {
        ctx.fillStyle = `rgba(2,12,30,${dim})`
        ctx.fillRect(0, 0, env.w, env.h)
      }
    },
  }
}

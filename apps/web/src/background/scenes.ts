import { type Env, type Scene, TAU, at, fillVertical, prepare, rgba, rnd } from './kit.ts'

/** Rain on a window: streaks, city bokeh and drops that slide down the glass. */
export function rainScene(env: Env): Scene {
  const { ctx } = env
  interface Streak {
    x: number
    y: number
    l: number
    sp: number
  }
  interface Bokeh {
    x: number
    y: number
    r: number
    c: number
    ph: number
    sp: number
  }
  interface Drop {
    x: number
    y: number
    r: number
    v: number
    wait: number
    trail: number
    run: number
  }
  const colors = {
    night: ['#ffb25e', '#ff6b8a', '#6fb4ff', '#ffe27a', '#7be3c4'],
    day: ['#ffffff', '#eaf2ff', '#fff4e0', '#dfeaf5', '#ffffff'],
  }
  const streaks: Streak[] = Array.from({ length: 150 }, () => ({
    x: Math.random(),
    y: Math.random(),
    l: rnd(0.03, 0.09),
    sp: rnd(0.9, 1.5),
  }))
  const bokeh: Bokeh[] = Array.from({ length: 16 }, (_, i) => ({
    x: Math.random(),
    y: rnd(0.42, 1),
    r: rnd(0.025, 0.07),
    c: i % 5,
    ph: rnd(0, 6.3),
    sp: rnd(0.4, 1),
  }))
  const drops: Drop[] = []
  const addDrop = (x: number, y: number, r: number, wait: number): void => {
    drops.push({ x, y, r, v: 0, wait, trail: 0, run: 0 })
  }
  for (let i = 0; i < 34; i++) addDrop(Math.random(), Math.random(), rnd(0.004, 0.012), rnd(1, 9))

  return {
    resize() {},
    update(dt) {
      for (const s of streaks) {
        s.y += s.sp * dt
        s.x -= s.sp * dt * 0.1
        if (s.y > 1.1) {
          s.y = -0.1
          s.x = Math.random() * 1.1
        }
        if (s.x < -0.1) s.x = 1.05
      }
      for (const d of drops) {
        if (d.run > 0) {
          d.v = Math.min(d.v + dt * 1.1, 0.26)
          d.y += d.v * dt
          d.trail += d.v * dt
          d.run -= dt
          if (d.run <= 0) d.v = 0
        } else {
          d.trail *= 0.45 ** dt
          d.wait -= dt
          if (d.wait <= 0) {
            d.run = rnd(0.4, 1.4)
            d.wait = rnd(4, 12)
          }
        }
        if (d.y > 1.04) {
          d.y = rnd(-0.02, 0.25)
          d.x = Math.random()
          d.trail = 0
          d.v = 0
          d.run = 0
        }
      }
    },
    click(x, y) {
      for (let k = 0; k < 6; k++)
        addDrop(x / env.w + rnd(-0.035, 0.035), y / env.h + rnd(-0.035, 0.035), rnd(0.005, 0.012), rnd(0.1, 1.2))
      if (drops.length > 80) drops.splice(0, drops.length - 80)
    },
    draw() {
      prepare(env)
      const night = env.mode === 'night'
      const palette = colors[env.mode]
      if (night)
        fillVertical(env, [
          [0, '#080c1a'],
          [0.6, '#141d38'],
          [1, '#22304f'],
        ])
      else
        fillVertical(env, [
          [0, '#aebdcc'],
          [0.6, '#cdd8e2'],
          [1, '#e6ecf1'],
        ])
      for (const b of bokeh) {
        const x = b.x * env.w
        const y = b.y * env.h
        const radius = b.r * env.s
        const pulse = 0.75 + 0.25 * Math.sin(env.t * b.sp + b.ph)
        const color = at(palette, b.c)
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
        g.addColorStop(0, rgba(color, (night ? 0.6 : 0.55) * pulse))
        g.addColorStop(0.7, rgba(color, (night ? 0.35 : 0.3) * pulse))
        g.addColorStop(1, rgba(color, 0))
        ctx.fillStyle = g
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
      }
      ctx.lineWidth = 1
      ctx.strokeStyle = night ? 'rgba(190,212,255,.3)' : 'rgba(70,100,130,.3)'
      ctx.beginPath()
      for (const s of streaks) {
        const sx = s.x * env.w
        const sy = s.y * env.h
        const l = s.l * env.h
        ctx.moveTo(sx, sy)
        ctx.lineTo(sx - l * 0.1, sy + l)
      }
      ctx.stroke()
      for (const d of drops) {
        const dx = d.x * env.w
        const dy = d.y * env.h
        const r = d.r * env.s
        if (d.trail > 0.004) {
          ctx.strokeStyle = night ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.4)'
          ctx.lineWidth = Math.max(1, r * 0.55)
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(dx, dy - d.trail * env.h)
          ctx.lineTo(dx, dy)
          ctx.stroke()
        }
        const g = ctx.createRadialGradient(dx, dy, r * 0.2, dx, dy, r * 1.25)
        g.addColorStop(0, 'rgba(255,255,255,.03)')
        g.addColorStop(1, night ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.7)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(dx, dy, r, r * 1.25, 0, 0, TAU)
        ctx.fill()
        ctx.strokeStyle = night ? 'rgba(255,255,255,.28)' : 'rgba(80,110,140,.3)'
        ctx.lineWidth = 0.8
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,.85)'
        ctx.beginPath()
        ctx.arc(dx - r * 0.35, dy - r * 0.5, Math.max(0.8, r * 0.2), 0, TAU)
        ctx.fill()
      }
    },
  }
}

/** Forest: layered hills and mist; fireflies at night, drifting light in the morning. */
export function forestScene(env: Env): Scene {
  const { ctx } = env
  interface Fly {
    x: number
    y: number
    ph: number
    sp: number
    bl: number
  }
  interface Layer {
    y: number
    a: number
    f: number
    ph: number
    sp: number
    c: { day: string; night: string }
  }
  const flies: Fly[] = Array.from({ length: 46 }, () => ({
    x: Math.random(),
    y: rnd(0.28, 1),
    ph: rnd(0, 6.3),
    sp: rnd(0.2, 0.5),
    bl: rnd(0.6, 1.6),
  }))
  const pines = Array.from({ length: 18 }, () => ({ x: Math.random(), h: rnd(0.07, 0.15) }))
  const layers: Layer[] = [
    { y: 0.56, a: 0.045, f: 5, ph: 1, sp: 0.03, c: { night: '#0c3a2d', day: '#b9dcb4' } },
    { y: 0.69, a: 0.055, f: 3.5, ph: 3, sp: 0.04, c: { night: '#082a21', day: '#9ccb9d' } },
    { y: 0.83, a: 0.045, f: 4.2, ph: 5, sp: 0.05, c: { night: '#041a14', day: '#7fb584' } },
  ]
  const hillY = (l: Layer, xn: number): number =>
    l.y + l.a * Math.sin(xn * l.f + l.ph + env.t * l.sp) + l.a * 0.5 * Math.sin(xn * l.f * 2.3 + l.ph * 2)
  function pine(x: number, y: number, h: number, color: string): void {
    ctx.fillStyle = color
    for (let k = 0; k < 3; k++) {
      const w = h * (0.36 - k * 0.07)
      const top = y - h * (1 - k * 0.27)
      const bottom = y - h * (0.62 - k * 0.27) + h * 0.06
      ctx.beginPath()
      ctx.moveTo(x, top)
      ctx.lineTo(x + w, bottom)
      ctx.lineTo(x - w, bottom)
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillRect(x - h * 0.025, y - h * 0.1, h * 0.05, h * 0.14)
  }

  return {
    resize() {},
    update() {},
    click(x, y) {
      for (let k = 0; k < 7; k++)
        flies.push({
          x: x / env.w + rnd(-0.05, 0.05),
          y: y / env.h + rnd(-0.05, 0.05),
          ph: rnd(0, 6.3),
          sp: rnd(0.25, 0.6),
          bl: rnd(0.8, 1.8),
        })
      if (flies.length > 90) flies.splice(0, flies.length - 90)
    },
    draw() {
      prepare(env)
      const night = env.mode === 'night'
      const { w, h, s, t } = env
      if (night)
        fillVertical(env, [
          [0, '#061827'],
          [0.5, '#0b3a33'],
          [1, '#134d3c'],
        ])
      else
        fillVertical(env, [
          [0, '#d6efe0'],
          [0.5, '#f2f8d9'],
          [1, '#fff3c9'],
        ])
      if (night) {
        const moon = ctx.createRadialGradient(w * 0.75, h * 0.16, 0, w * 0.75, h * 0.16, s * 0.4)
        moon.addColorStop(0, 'rgba(200,255,230,.22)')
        moon.addColorStop(1, 'rgba(200,255,230,0)')
        ctx.fillStyle = moon
        ctx.fillRect(0, 0, w, h)
      } else {
        ctx.globalCompositeOperation = 'lighter'
        for (let k = 0; k < 4; k++) {
          const x0 = w * (0.1 + k * 0.17) + Math.sin(t * 0.15 + k) * w * 0.02
          const shaft = ctx.createLinearGradient(x0, 0, x0 + w * 0.2, h * 0.8)
          shaft.addColorStop(0, 'rgba(255,248,210,.3)')
          shaft.addColorStop(1, 'rgba(255,248,210,0)')
          ctx.fillStyle = shaft
          ctx.beginPath()
          ctx.moveTo(x0 - w * 0.02, 0)
          ctx.lineTo(x0 + w * 0.05, 0)
          ctx.lineTo(x0 + w * 0.32, h * 0.9)
          ctx.lineTo(x0 + w * 0.12, h * 0.9)
          ctx.closePath()
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
      }
      layers.forEach((layer, i) => {
        const color = layer.c[env.mode]
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w + 10; x += 10) ctx.lineTo(x, hillY(layer, x / w) * h)
        ctx.lineTo(w, h)
        ctx.closePath()
        ctx.fill()
        if (i === 2) for (const p of pines) pine(p.x * w, hillY(layer, p.x) * h + 4, p.h * s, color)
        if (i < 2) {
          const fy = (layer.y + 0.06) * h
          const mist = ctx.createLinearGradient(0, fy - h * 0.12, 0, fy + h * 0.1)
          mist.addColorStop(0, 'rgba(220,255,240,0)')
          mist.addColorStop(0.5, night ? 'rgba(170,230,210,.16)' : 'rgba(255,255,255,.4)')
          mist.addColorStop(1, 'rgba(220,255,240,0)')
          const shift = ((t * 0.012 * (i + 1)) % 1) * w
          ctx.fillStyle = mist
          ctx.fillRect(-shift, fy - h * 0.12, w * 2, h * 0.22)
          ctx.fillRect(w * 2 - shift, fy - h * 0.12, w * 2, h * 0.22)
        }
      })
      ctx.globalCompositeOperation = 'lighter'
      const radius = s * (night ? 0.02 : 0.014)
      for (const f of flies) {
        const x = (f.x + 0.04 * Math.sin(t * f.sp + f.ph)) * w
        const y = (f.y + 0.05 * Math.cos(t * f.sp * 0.8 + f.ph * 2)) * h
        const blink = 0.5 + 0.5 * Math.sin(t * f.bl + f.ph)
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius)
        glow.addColorStop(
          0,
          night ? `rgba(214,255,120,${blink.toFixed(3)})` : `rgba(255,238,160,${(blink * 0.8).toFixed(3)})`,
        )
        glow.addColorStop(1, 'rgba(214,255,120,0)')
        ctx.fillStyle = glow
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
        ctx.fillStyle = night
          ? `rgba(255,255,210,${blink.toFixed(3)})`
          : `rgba(255,255,255,${(blink * 0.9).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, TAU)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}

/** Starry sky: deep night with a moon and meteors; a separate twilight design in light mode. */
export function starsScene(env: Env): Scene {
  const { ctx } = env
  interface Star {
    x: number
    y: number
    r: number
    ph: number
    sp: number
  }
  interface Meteor {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    max: number
  }
  interface Cloud {
    x: number
    y: number
    w: number
    sp: number
  }
  const stars: Star[] = Array.from({ length: 230 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.9,
    r: rnd(0.4, 1.7),
    ph: rnd(0, 6.3),
    sp: rnd(0.6, 2.2),
  }))
  const clouds: Cloud[] = Array.from({ length: 6 }, () => ({
    x: Math.random(),
    y: rnd(0.12, 0.7),
    w: rnd(0.14, 0.26),
    sp: rnd(0.004, 0.01),
  }))
  const meteors: Meteor[] = []
  let timer = 2
  const meteor = (x: number, y: number): void => {
    const a = rnd(0.45, 0.75)
    meteors.push({ x, y, vx: Math.cos(a) * env.s * 0.9, vy: Math.sin(a) * env.s * 0.9, life: 0, max: rnd(0.7, 1.1) })
  }
  function sparkle(x: number, y: number, size: number): void {
    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.quadraticCurveTo(x, y, x + size, y)
    ctx.quadraticCurveTo(x, y, x, y + size)
    ctx.quadraticCurveTo(x, y, x - size, y)
    ctx.quadraticCurveTo(x, y, x, y - size)
    ctx.closePath()
    ctx.fill()
  }

  return {
    resize() {},
    update(dt) {
      timer -= dt
      if (timer <= 0) {
        timer = rnd(3, 7)
        meteor(rnd(0.1, 0.9) * env.w, rnd(0, 0.35) * env.h)
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = at(meteors, i)
        m.life += dt
        m.x += m.vx * dt
        m.y += m.vy * dt
        if (m.life > m.max) meteors.splice(i, 1)
      }
      for (const c of clouds) {
        c.x += c.sp * dt
        if (c.x > 1.3) c.x = -0.3
      }
    },
    click: meteor,
    draw() {
      prepare(env)
      const night = env.mode === 'night'
      const { w, h, s, t } = env
      if (night)
        fillVertical(env, [
          [0, '#040816'],
          [0.55, '#141238'],
          [1, '#2d1f5c'],
        ])
      else
        fillVertical(env, [
          [0, '#7f8ff0'],
          [0.5, '#d9bdf0'],
          [1, '#ffd7b3'],
        ])
      const nebulae: ReadonlyArray<readonly [number, number, string, number]> = night
        ? [
            [0.25, 0.3, '#5b3bd6', 0.28],
            [0.75, 0.55, '#c0306a', 0.28],
            [0.5, 0.8, '#2358e0', 0.28],
          ]
        : [
            [0.2, 0.25, '#ffffff', 0.3],
            [0.78, 0.4, '#ffc6e0', 0.35],
          ]
      for (const [fx, fy, color, alpha] of nebulae) {
        const x = fx * w
        const y = fy * h
        const radius = s * 0.5
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
        g.addColorStop(0, rgba(color, alpha))
        g.addColorStop(1, rgba(color, 0))
        ctx.fillStyle = g
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
      }
      if (night) {
        for (const star of stars) {
          ctx.fillStyle = `rgba(255,255,255,${(0.45 + 0.55 * Math.sin(t * star.sp + star.ph)).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(star.x * w, star.y * h, star.r, 0, TAU)
          ctx.fill()
        }
        const mx = w * 0.82
        const my = h * 0.17
        const mr = s * 0.05
        ctx.shadowColor = 'rgba(255,244,200,.8)'
        ctx.shadowBlur = mr * 1.2
        const moon = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr)
        moon.addColorStop(0, '#fffbe8')
        moon.addColorStop(1, '#e8dca8')
        ctx.fillStyle = moon
        ctx.beginPath()
        ctx.arc(mx, my, mr, 0, TAU)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(150,135,90,.25)'
        for (const [cx, cy, cr] of [
          [-0.3, -0.1, 0.2],
          [0.25, 0.2, 0.16],
          [0.05, -0.4, 0.1],
        ] as const) {
          ctx.beginPath()
          ctx.arc(mx + cx * mr, my + cy * mr, cr * mr, 0, TAU)
          ctx.fill()
        }
      } else {
        const sx = w * 0.2
        const sy = h * 1.02
        const reach = s * 0.75
        const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, reach)
        sun.addColorStop(0, 'rgba(255,240,190,.95)')
        sun.addColorStop(0.4, 'rgba(255,196,150,.45)')
        sun.addColorStop(1, 'rgba(255,196,150,0)')
        ctx.fillStyle = sun
        ctx.fillRect(0, 0, w, h)
        ctx.shadowColor = 'rgba(255,230,170,.95)'
        ctx.shadowBlur = 7
        ctx.fillStyle = '#fffaf0'
        for (const star of stars) {
          if (star.y > 0.7) continue
          ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * star.sp * 0.8 + star.ph))
          if (star.r > 1.15) sparkle(star.x * w, star.y * h, star.r * 3.4)
          else {
            ctx.beginPath()
            ctx.arc(star.x * w, star.y * h, star.r * 0.9, 0, TAU)
            ctx.fill()
          }
        }
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
        const cx = w * 0.82
        const cy = h * 0.17
        const cr = s * 0.052
        ctx.shadowColor = 'rgba(255,255,255,.9)'
        ctx.shadowBlur = cr * 0.9
        ctx.fillStyle = '#fffdf6'
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, TAU)
        ctx.arc(cx + cr * 0.5, cy - cr * 0.12, cr * 0.86, 0, TAU, true)
        ctx.fill('evenodd')
        ctx.shadowBlur = 0
        for (const cloud of clouds) {
          const cxx = cloud.x * w
          const cyy = cloud.y * h
          const cw = cloud.w * s
          for (let q = 0; q < 3; q++) {
            const qx = cxx + (q - 1) * cw * 0.45
            const qy = cyy + (q === 1 ? -cw * 0.08 : 0)
            const qr = cw * (q === 1 ? 0.5 : 0.4)
            const g = ctx.createRadialGradient(qx, qy, 0, qx, qy, qr)
            g.addColorStop(0, 'rgba(255,255,255,.5)')
            g.addColorStop(1, 'rgba(255,255,255,0)')
            ctx.fillStyle = g
            ctx.fillRect(qx - qr, qy - qr, qr * 2, qr * 2)
          }
        }
      }
      for (const m of meteors) {
        const k = 1 - m.life / m.max
        const tail = 0.14
        const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail)
        g.addColorStop(0, `rgba(255,255,255,${(0.95 * k).toFixed(3)})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.strokeStyle = g
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(m.x, m.y)
        ctx.lineTo(m.x - m.vx * tail, m.y - m.vy * tail)
        ctx.stroke()
      }
    },
  }
}

/** Cherry blossom: falling petals and a branch; a click blows a gust. */
export function sakuraScene(env: Env): Scene {
  const { ctx } = env
  interface Petal {
    x: number
    y: number
    s: number
    rot: number
    vr: number
    vy: number
    sw: number
    sa: number
  }
  const petals: Petal[] = Array.from({ length: 44 }, () => ({
    x: Math.random(),
    y: Math.random(),
    s: rnd(5, 11),
    rot: rnd(0, 6.3),
    vr: rnd(-1.2, 1.2),
    vy: rnd(0.035, 0.08),
    sw: rnd(0, 6),
    sa: rnd(0.012, 0.04),
  }))
  const bokeh = Array.from({ length: 10 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: rnd(0.03, 0.09),
    ph: rnd(0, 6.3),
  }))
  const blossoms = [0.08, 0.2, 0.33, 0.47, 0.6, 0.76, 0.9]
  let gust = 0
  // Cubic curve of the branch in window fractions.
  function branch(u: number): [number, number] {
    const v = 1 - u
    return [
      v * v * v * 1.02 + 3 * v * v * u * 0.8 + 3 * v * u * u * 0.7 + u * u * u * 0.5,
      v * v * v * 0.05 + 3 * v * v * u * 0.14 + 3 * v * u * u * 0.03 + u * u * u * 0.13,
    ]
  }
  function flower(x: number, y: number, size: number, rotation: number, night: boolean): void {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    for (let k = 0; k < 5; k++) {
      ctx.save()
      ctx.rotate(k * 1.2566)
      const g = ctx.createRadialGradient(0, -size * 0.7, 0, 0, -size * 0.7, size * 0.8)
      g.addColorStop(0, night ? '#ffd3e2' : '#fff3f7')
      g.addColorStop(1, night ? '#e889ae' : '#f7a6c3')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, -size * 0.62, size * 0.5, 0, TAU)
      ctx.fill()
      ctx.restore()
    }
    ctx.fillStyle = '#e8456f'
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.18, 0, TAU)
    ctx.fill()
    ctx.restore()
  }

  return {
    resize() {},
    update(dt) {
      gust *= 0.35 ** dt
      for (const p of petals) {
        p.y += (p.vy + gust * 0.05) * dt
        p.x += (0.012 + gust * 0.22) * dt
        p.rot += p.vr * dt * (1 + gust * 2)
        if (p.y > 1.05) {
          p.y = -0.05
          p.x = Math.random()
        }
        if (p.x > 1.05) p.x = -0.05
      }
    },
    click() {
      gust = 1.6
    },
    draw() {
      prepare(env)
      const night = env.mode === 'night'
      const { w, h, s, t } = env
      if (night)
        fillVertical(env, [
          [0, '#1a0f2e'],
          [0.55, '#3a1a44'],
          [1, '#5a2250'],
        ])
      else
        fillVertical(env, [
          [0, '#fff3f6'],
          [0.5, '#ffd8e4'],
          [1, '#e6d3ff'],
        ])
      for (const b of bokeh) {
        const x = (b.x + 0.02 * Math.sin(t * 0.12 + b.ph)) * w
        const y = (b.y + 0.02 * Math.cos(t * 0.1 + b.ph)) * h
        const radius = b.r * s
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
        g.addColorStop(0, night ? 'rgba(255,150,190,.2)' : 'rgba(255,255,255,.55)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
      }
      ctx.strokeStyle = night ? '#1b0f18' : '#6a4638'
      ctx.lineWidth = s * 0.013
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(w * 1.02, h * 0.05)
      ctx.bezierCurveTo(w * 0.8, h * 0.14, w * 0.7, h * 0.03, w * 0.5, h * 0.13)
      ctx.stroke()
      blossoms.forEach((u, f) => {
        const [bx, by] = branch(u)
        flower(bx * w, by * h + s * 0.012, s * (0.028 + 0.006 * (f % 3)), f * 0.9 + Math.sin(t * 0.4 + f) * 0.06, night)
      })
      for (const p of petals) {
        ctx.save()
        ctx.translate((p.x + Math.sin(t * 0.8 + p.sw) * p.sa) * w, p.y * h)
        ctx.rotate(p.rot)
        const g = ctx.createLinearGradient(-p.s, 0, p.s, 0)
        g.addColorStop(0, night ? '#ff9fc0' : '#ffb3cb')
        g.addColorStop(1, night ? '#ffd8e6' : '#fff0f5')
        ctx.fillStyle = g
        ctx.globalAlpha = 0.92
        ctx.beginPath()
        ctx.ellipse(0, 0, p.s, p.s * 0.58, 0, 0, TAU)
        ctx.fill()
        ctx.restore()
      }
      ctx.globalAlpha = 1
    },
  }
}

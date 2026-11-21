import type { BackgroundId } from '@deckagent/host-api'
import type { Env, Mode, Scene, SceneFactory } from './background-kit.ts'
import { koiScene } from './background-koi.ts'
import { forestScene, rainScene, sakuraScene, starsScene } from './background-scenes.ts'

/**
 * Backdrop drawn behind the glass window. Choosing `none` keeps the static gradient of the style sheet:
 * no canvas work and no animation loop run. Everything is drawn in code; no file or network request is used.
 */

type Animated = Exclude<BackgroundId, 'none'>

const scenes: Record<Animated, SceneFactory> = {
  koi: koiScene,
  rain: rainScene,
  forest: forestScene,
  stars: starsScene,
  sakura: sakuraScene,
}

/** Name and swatch colours of every choice, in the order the picker shows them. */
export const backgroundChoices: ReadonlyArray<readonly [BackgroundId, string, readonly [string, string, string]]> = [
  ['none', 'Mặc định', ['#ff9fbf', '#b9a2ff', '#7cc4ff']],
  ['koi', 'Ao cá koi', ['#5fb8b0', '#e4481c', '#fbf6ee']],
  ['rain', 'Mưa đêm', ['#0b1020', '#e8a45a', '#6fb4ff']],
  ['forest', 'Rừng đom đóm', ['#0b3a33', '#d6ff78', '#04100d']],
  ['stars', 'Bầu trời sao', ['#040816', '#7f8ff0', '#fffbe8']],
  ['sakura', 'Hoa anh đào', ['#fff3f6', '#ffb3cb', '#6a4638']],
]

export function backgroundGradient(colors: readonly [string, string, string]): string {
  return `linear-gradient(135deg,${colors[0]},${colors[1]} 60%,${colors[2]})`
}

const logoColors: Readonly<Record<BackgroundId, Readonly<Record<Mode, readonly [string, string]>>>> = {
  none: { night: ['#F5A9E8', '#88C7FF'], day: ['#A73398', '#2465C6'] },
  koi: { night: ['#9DE4C4', '#FF9677'], day: ['#237D65', '#C6462B'] },
  rain: { night: ['#FFC17D', '#83C8FF'], day: ['#A65A17', '#286AAB'] },
  forest: { night: ['#98E6A1', '#D9F581'], day: ['#237747', '#668C19'] },
  stars: { night: ['#A8B5FF', '#E1D8FF'], day: ['#4053B3', '#7951A6'] },
  sakura: { night: ['#FFD0E3', '#FF9FC3'], day: ['#AE386F', '#C64E78'] },
}

/** The choice named by the page before first paint, or `none` for anything else. */
export function backgroundFrom(value: string | undefined): BackgroundId {
  for (const [id] of backgroundChoices) if (id === value) return id
  return 'none'
}

export interface Backdrop {
  set(id: BackgroundId): void
}

const FRAME_MS = 33

/** Elements whose clicks belong to the interface, never to the backdrop. */
const interactive = 'button,a,input,select,textarea,label,dialog,iframe,summary,[role=menu],[contenteditable]'

export function createBackdrop(): Backdrop {
  const canvas = document.createElement('canvas')
  canvas.id = 'backdrop'
  canvas.setAttribute('aria-hidden', 'true')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { set() {} }
  document.body.prepend(canvas)

  const env: Env = { ctx, w: 1, h: 1, s: 1, dpr: 1, mode: 'day', t: 0, frame: 0 }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const prefersDark = matchMedia('(prefers-color-scheme: dark)')
  const cache = new Map<Animated, Scene>()
  let scene: Scene | null = null
  let selectedBackground: BackgroundId = 'none'
  let frameRequest = 0
  let lastTick = 0
  let lastDraw = 0

  const animating = (): boolean => scene !== null && !reduceMotion.matches && !document.hidden

  function resolveMode(): Mode {
    const theme = document.documentElement.dataset.theme
    if (theme === 'dark') return 'night'
    if (theme === 'light') return 'day'
    return prefersDark.matches ? 'night' : 'day'
  }

  function recolorLogo(): void {
    const [start, end] = logoColors[selectedBackground][resolveMode()]
    document.documentElement.style.setProperty('--logo-gradient', `linear-gradient(135deg,${start},${end})`)
  }

  function stop(): void {
    if (frameRequest) cancelAnimationFrame(frameRequest)
    frameRequest = 0
  }

  function frame(time: number): void {
    frameRequest = 0
    if (!scene) return
    // About 30 frames a second: every frame makes the browser blur the whole window again.
    if (time - lastDraw < FRAME_MS - 1) {
      frameRequest = requestAnimationFrame(frame)
      return
    }
    const dt = lastTick ? Math.min(0.05, (time - lastTick) / 1000) : FRAME_MS / 1000
    lastTick = time
    lastDraw = time
    env.t += dt
    env.frame++
    scene.update(dt)
    scene.draw(dt, false)
    frameRequest = requestAnimationFrame(frame)
  }

  /** Runs the loop, or draws one still frame when motion is reduced or the tab is hidden. */
  function refresh(): void {
    stop()
    if (!scene) return
    if (animating()) {
      lastTick = 0
      frameRequest = requestAnimationFrame(frame)
    } else if (!document.hidden) scene.draw(0, true)
  }

  function resize(): void {
    env.dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    env.w = Math.max(1, window.innerWidth)
    env.h = Math.max(1, window.innerHeight)
    env.s = Math.min(env.w, env.h * 1.5)
    canvas.width = Math.round(env.w * env.dpr)
    canvas.height = Math.round(env.h * env.dpr)
    scene?.resize()
  }

  window.addEventListener('resize', () => {
    if (!scene) return
    resize()
    if (!animating()) scene.draw(0, true)
  })
  document.addEventListener('visibilitychange', refresh)
  reduceMotion.addEventListener('change', refresh)
  const recolor = (): void => {
    env.mode = resolveMode()
    recolorLogo()
    if (scene && !animating()) scene.draw(0, true)
  }
  prefersDark.addEventListener('change', recolor)
  new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  document.addEventListener('pointerdown', event => {
    const target = event.target
    if (!scene?.click || !animating() || !(target instanceof Element) || target.closest(interactive)) return
    scene.click(event.clientX, event.clientY)
  })

  return {
    set(id) {
      selectedBackground = id
      recolorLogo()
      if (id === 'none') {
        stop()
        scene = null
        delete document.documentElement.dataset.background
        return
      }
      document.documentElement.dataset.background = id
      let next = cache.get(id)
      if (!next) {
        next = scenes[id](env)
        cache.set(id, next)
      }
      scene = next
      env.mode = resolveMode()
      resize()
      // Let the scene settle, so a still frame already looks alive.
      for (let i = 0; i < 24; i++) next.update(0.05)
      refresh()
    },
  }
}

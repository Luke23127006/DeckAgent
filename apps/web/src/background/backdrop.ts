import type { BackgroundId } from '@deckagent/host-contracts'
import type { Env, Mode, Scene, SceneFactory } from './kit.ts'
import { koiScene } from './koi.ts'
import { forestScene, rainScene, sakuraScene, starsScene } from './scenes.ts'

/**
 * The backdrop drawn behind the glass window. The choice `none` keeps the static gradient of the style sheet:
 * no canvas work and no animation loop run. Everything is drawn in code; no file or network request is used.
 */

type Animated = Exclude<BackgroundId, 'none'>

const scenes: Readonly<Record<Animated, SceneFactory>> = {
  koi: koiScene,
  rain: rainScene,
  forest: forestScene,
  stars: starsScene,
  sakura: sakuraScene,
}

/** The swatch colors of each choice, in the order that the picker shows them. */
export const backgroundSwatches: readonly (readonly [BackgroundId, readonly [string, string, string]])[] = [
  ['none', ['#ff9fbf', '#b9a2ff', '#7cc4ff']],
  ['koi', ['#5fb8b0', '#e4481c', '#fbf6ee']],
  ['rain', ['#0b1020', '#e8a45a', '#6fb4ff']],
  ['forest', ['#0b3a33', '#d6ff78', '#04100d']],
  ['stars', ['#040816', '#7f8ff0', '#fffbe8']],
  ['sakura', ['#fff3f6', '#ffb3cb', '#6a4638']],
]

export function backgroundGradient(colors: readonly [string, string, string]): string {
  return `linear-gradient(135deg,${colors[0]},${colors[1]} 60%,${colors[2]})`
}

export interface Backdrop {
  set(id: BackgroundId): void
  dispose(): void
}

const frameMs = 33

/** Elements whose clicks belong to the interface and never to the backdrop. */
const interactive = 'button,a,input,select,textarea,label,dialog,iframe,summary,[role=menu],[contenteditable]'

/** Draws the chosen scene on `canvas`. It pauses when the tab is hidden and draws one still frame for reduced motion. */
export function createBackdrop(canvas: HTMLCanvasElement): Backdrop {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { set() {}, dispose() {} }

  const root = document.documentElement
  const env: Env = { ctx, w: 1, h: 1, s: 1, dpr: 1, mode: 'day', t: 0, frame: 0 }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const cache = new Map<Animated, Scene>()
  const control = new AbortController()
  const { signal } = control
  let scene: Scene | null = null
  let frameRequest = 0
  let lastTick = 0
  let lastDraw = 0

  const animating = (): boolean => scene !== null && !reduceMotion.matches && !document.hidden
  // The Browser resolves the theme `system` into the class `dark`, so the class alone gives the mode.
  const resolveMode = (): Mode => (root.classList.contains('dark') ? 'night' : 'day')

  function stop(): void {
    if (frameRequest) cancelAnimationFrame(frameRequest)
    frameRequest = 0
  }

  function frame(time: number): void {
    frameRequest = 0
    if (!scene) return
    // About 30 frames a second: each frame makes the browser blur the whole window again.
    if (time - lastDraw < frameMs - 1) {
      frameRequest = requestAnimationFrame(frame)
      return
    }
    const dt = lastTick ? Math.min(0.05, (time - lastTick) / 1000) : frameMs / 1000
    lastTick = time
    lastDraw = time
    env.t += dt
    env.frame++
    scene.update(dt)
    scene.draw(dt, false)
    frameRequest = requestAnimationFrame(frame)
  }

  /** Runs the loop, or draws one still frame when motion is reduced. A hidden tab draws nothing. */
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

  function recolor(): void {
    env.mode = resolveMode()
    if (scene && !animating()) scene.draw(0, true)
  }

  window.addEventListener(
    'resize',
    () => {
      if (!scene) return
      resize()
      if (!animating()) scene.draw(0, true)
    },
    { signal },
  )
  document.addEventListener('visibilitychange', refresh, { signal })
  reduceMotion.addEventListener('change', refresh, { signal })
  document.addEventListener(
    'pointerdown',
    event => {
      const target = event.target
      if (!scene?.click || !animating() || !(target instanceof Element) || target.closest(interactive)) return
      scene.click(event.clientX, event.clientY)
    },
    { signal },
  )
  const themeObserver = new MutationObserver(recolor)
  themeObserver.observe(root, { attributes: true, attributeFilter: ['class'] })

  return {
    set(id) {
      if (id === 'none') {
        stop()
        scene = null
        delete root.dataset.background
        return
      }
      root.dataset.background = id
      let next = cache.get(id)
      if (!next) {
        next = scenes[id](env)
        cache.set(id, next)
      }
      scene = next
      env.mode = resolveMode()
      resize()
      // The scene settles first, so a still frame already looks alive.
      for (let i = 0; i < 24; i++) next.update(0.05)
      refresh()
    },
    dispose() {
      stop()
      scene = null
      control.abort()
      themeObserver.disconnect()
    },
  }
}

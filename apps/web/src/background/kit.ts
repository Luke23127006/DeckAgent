/** Shared types and helpers for the animated backdrops. Everything here is drawing code only: no network, no storage. */

export type Mode = 'day' | 'night'

/** Drawing surface shared by every backdrop. `s` is the unit the scenes scale by, in CSS pixels. */
export interface Env {
  readonly ctx: CanvasRenderingContext2D
  w: number
  h: number
  s: number
  dpr: number
  mode: Mode
  /** Seconds since the backdrop started. */
  t: number
  /** Frames drawn so far. */
  frame: number
}

export interface Scene {
  resize(): void
  update(dt: number): void
  /** `force` redraws everything, also work that is normally skipped between frames. */
  draw(dt: number, force: boolean): void
  /** Optional reaction to a click on empty glass, in CSS pixels from the top-left of the window. */
  click?(x: number, y: number): void
}

export type SceneFactory = (env: Env) => Scene

export const TAU = Math.PI * 2

export function rnd(low: number, high: number): number {
  return low + Math.random() * (high - low)
}

export function angleDiff(a: number, b: number): number {
  let d = a - b
  while (d > Math.PI) d -= TAU
  while (d < -Math.PI) d += TAU
  return d
}

export function smooth(x: number): number {
  const c = x < 0 ? 0 : x > 1 ? 1 : x
  return c * c * (3 - 2 * c)
}

/** The item at an index that is in range by construction. */
export function at<T>(items: readonly T[], index: number): T {
  const item = items[index]
  if (item === undefined) throw new RangeError(`Index ${index} is outside the list.`)
  return item
}

/** `#rrggbb` and an alpha as a CSS colour. */
export function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/** Resets the canvas state a previous scene may have left behind. */
export function prepare(env: Env): void {
  const { ctx } = env
  ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

/** Vertical gradient over the whole canvas. */
export function fillVertical(env: Env, stops: ReadonlyArray<readonly [number, string]>): void {
  const gradient = env.ctx.createLinearGradient(0, 0, 0, env.h)
  for (const [offset, color] of stops) gradient.addColorStop(offset, color)
  env.ctx.fillStyle = gradient
  env.ctx.fillRect(0, 0, env.w, env.h)
}

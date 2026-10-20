import type { Context } from '@deepseek-ai/cordis'
import type {} from './index.ts'

export const inject = ['foundationGreeting', 'foundationProbe']

export function apply(ctx: Context) {
  ctx.foundationProbe.record(`consumer:${ctx.foundationGreeting.greet('DeckAgent')}`)
  ctx.provide('foundationReady', true)
  const probe = ctx.foundationProbe
  ctx.fiber.effect(() => () => { probe.record('consumer:cleanup') })
}

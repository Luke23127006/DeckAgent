import type { Context } from '@deepseek-ai/cordis'
import type {} from './index.ts'

export const inject = ['cordisSmokeGreeting', 'cordisSmokeProbe']

export function apply(ctx: Context) {
  ctx.cordisSmokeProbe.record(`consumer:${ctx.cordisSmokeGreeting.greet('DeckAgent')}`)
  ctx.provide('cordisSmokeReady', true)
  const probe = ctx.cordisSmokeProbe
  ctx.fiber.effect(() => () => { probe.record('consumer:cleanup') })
}

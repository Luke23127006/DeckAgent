import type { Context } from '@deepseek-ai/cordis'

export interface CordisSmokeProbe {
  record(event: string): void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    cordisSmokeProbe: CordisSmokeProbe
    cordisSmokeGreeting: { greet(name: string): string }
    cordisSmokeReady: boolean
  }
}

export const inject = ['cordisSmokeProbe']

export function apply(ctx: Context) {
  ctx.provide('cordisSmokeGreeting', { greet: (name: string) => `Hello, ${name}` })
  ctx.cordisSmokeProbe.record('provider:ready')
  const probe = ctx.cordisSmokeProbe
  ctx.fiber.effect(() => () => { probe.record('provider:cleanup') })
}

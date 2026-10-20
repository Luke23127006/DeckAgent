import type { Context } from '@deepseek-ai/cordis'

export interface FoundationProbe {
  record(event: string): void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    foundationProbe: FoundationProbe
    foundationGreeting: { greet(name: string): string }
    foundationReady: boolean
  }
}

export const inject = ['foundationProbe']

export function apply(ctx: Context) {
  ctx.provide('foundationGreeting', { greet: (name: string) => `Hello, ${name}` })
  ctx.foundationProbe.record('provider:ready')
  const probe = ctx.foundationProbe
  ctx.fiber.effect(() => () => { probe.record('provider:cleanup') })
}

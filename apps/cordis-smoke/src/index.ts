import { Context } from '@deepseek-ai/cordis'
import * as provider from '@deckagent/cordis-fixture'
import * as consumer from '@deckagent/cordis-fixture/consumer'
import type { CordisSmokeProbe } from '@deckagent/cordis-fixture'

export async function startCordisSmoke(
  probe: CordisSmokeProbe,
  options: { withProvider?: boolean } = {},
) {
  const ctx = new Context()
  try {
    ctx.provide('cordisSmokeProbe', probe)
    if (options.withProvider !== false) await ctx.plugin(provider)
    await ctx.plugin(consumer)
    if (!ctx.get('cordisSmokeGreeting') || ctx.get('cordisSmokeReady') !== true) {
      throw new Error('cordis-smoke consumer did not activate: required fixture services are unavailable')
    }
    return ctx
  } catch (error) {
    await ctx.fiber.dispose()
    throw error
  }
}

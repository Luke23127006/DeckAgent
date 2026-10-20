import { Context } from '@deepseek-ai/cordis'
import * as provider from '@deckagent/foundation-fixture'
import * as consumer from '@deckagent/foundation-fixture/consumer'
import type { FoundationProbe } from '@deckagent/foundation-fixture'

export async function startFoundation(
  probe: FoundationProbe,
  options: { withProvider?: boolean } = {},
) {
  const ctx = new Context()
  try {
    ctx.provide('foundationProbe', probe)
    if (options.withProvider !== false) await ctx.plugin(provider)
    await ctx.plugin(consumer)
    if (!ctx.get('foundationGreeting') || ctx.get('foundationReady') !== true) {
      throw new Error('foundation-consumer did not activate: required fixture services are unavailable')
    }
    return ctx
  } catch (error) {
    await ctx.fiber.dispose()
    throw error
  }
}

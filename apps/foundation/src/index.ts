import { fileURLToPath } from 'node:url'
import { boot } from '@deepseek-ai/dsh-app-boot'
import type { FoundationProbe } from '@deckagent/foundation-fixture'

export async function startFoundation(
  probe: FoundationProbe,
  configPath = fileURLToPath(new URL('../cordis.yml', import.meta.url)),
) {
  const ctx = await boot(
    'deckagent-foundation',
    configPath,
    undefined,
    (ctx) => { ctx.provide('foundationProbe', probe) },
  )
  // Upstream warns for optional entries. This assembly requires both fixture
  // services, so a pending or failed consumer must fail the foundation smoke.
  if (!ctx.get('foundationGreeting') || ctx.get('foundationReady') !== true) {
    await ctx.fiber.dispose()
    throw new Error('foundation-consumer did not activate: required fixture services are unavailable')
  }
  return ctx
}

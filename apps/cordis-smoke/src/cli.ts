import { startCordisSmoke } from './index.ts'

const ctx = await startCordisSmoke({ record: (event) => console.log(event) })
try {
  console.log(ctx.cordisSmokeGreeting.greet('DeckAgent'))
} finally {
  await ctx.fiber.dispose()
}

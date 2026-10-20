import { startFoundation } from './index.ts'

const ctx = await startFoundation({ record: (event) => console.log(event) })
try {
  console.log(ctx.foundationGreeting.greet('DeckAgent'))
} finally {
  await ctx.fiber.dispose()
}

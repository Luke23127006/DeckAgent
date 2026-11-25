import { setImmediate } from 'node:timers/promises'

export async function waitFor(check, timeoutMs = 10000) {
  let rejectTimeout
  const timeoutPromise = new Promise((_, reject) => {
    rejectTimeout = reject
  })
  const watchdog = setTimeout(() => {
    rejectTimeout(new Error('Timed out waiting'))
  }, timeoutMs)
  try {
    for (;;) {
      const pending = Promise.resolve().then(check)
      pending.catch(() => {})
      const value = await Promise.race([pending, timeoutPromise])
      if (value) return value
      await Promise.race([setImmediate(), timeoutPromise])
    }
  } finally {
    clearTimeout(watchdog)
  }
}

export function isRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
export function fetchAuthorized(origin, token, path, init = {}) {
  return fetch(`${origin}${path}`, {
    ...init,
    credentials: 'omit',
    redirect: 'error',
    headers: { ...init.headers, authorization: `Bearer ${token}` },
  })
}
export async function readJsonError(response, allowedCodes, fallbackCode, options) {
  const data = await response.json().catch(() => undefined)
  const error = isRecord(data) && isRecord(data.error) ? data.error : undefined
  const known = error && typeof error.code === 'string' && allowedCodes.includes(error.code) ? error.code : undefined
  const detail = {}
  if (options?.includeDetail && known && error && isRecord(error.detail))
    for (const [key, item] of Object.entries(error.detail))
      if (typeof item === 'string' || typeof item === 'boolean') detail[key] = item
  const code = known ?? (options?.fallback401 && response.status === 401 ? 'AUTH_REQUIRED' : fallbackCode)
  return { code, detail }
}
export async function* readSseFrames(response, options) {
  if (!response.body || !response.headers.get('content-type')?.startsWith('text/event-stream'))
    throw new Error(options.invalidError)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const eventLine = `event: ${options.eventName}`
  let buffer = ''
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) throw new Error(options.lostError)
      buffer += decoder.decode(part.value, { stream: true }).replace(/\r\n/g, '\n')
      if (buffer.length > options.maxBufferBytes) throw new Error(options.invalidError)
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const matched =
          options.matchMode === 'line' ? frame.split('\n').includes(eventLine) : frame.startsWith(`${eventLine}\n`)
        if (matched)
          yield frame
            .split('\n')
            .filter(line => line.startsWith('data: '))
            .map(line => line.slice(6))
            .join('\n')
        boundary = buffer.indexOf('\n\n')
      }
    }
  } finally {
    // Cancelling a read-only stream cannot change the Host-owned outcome.
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

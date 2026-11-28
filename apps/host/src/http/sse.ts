import type { ServerResponse } from 'node:http'
import { HttpError } from './http-error.ts'

export function openSseStream(res: ServerResponse, streams: Set<ServerResponse>, onClose: () => void): void {
  if (streams.size >= 64) throw new HttpError(429, 'TOO_MANY_STREAMS')
  res.writeHead(200, { 'content-type': 'text/event-stream', 'x-accel-buffering': 'no' })
  streams.add(res)
  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.write(': heartbeat\n\n')) res.end()
  }, 15000)
  res.once('close', () => {
    clearInterval(heartbeat)
    onClose()
    streams.delete(res)
  })
}

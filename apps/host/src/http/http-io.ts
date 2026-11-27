import type { IncomingMessage, ServerResponse } from 'node:http'
import { decodeAgentRequest, RequestValidationError } from '@deckagent/host-contracts'
import type { AgentRequest } from '@deckagent/host-contracts'
import { HttpError } from './http-error.ts'

export function json(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(value))
}

export async function readJson(req: IncomingMessage): Promise<unknown> {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new HttpError(415, 'JSON_REQUIRED')
  let bytes = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    bytes += chunk.length
    if (bytes > 256 * 1024) throw new HttpError(413, 'REQUEST_TOO_LARGE')
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'INVALID_REQUEST')
  }
}

/** Last-Event-ID is the reconnect cursor: the stream resumes after it with no gap and no repeat. */
export function parseCursor(req: IncomingMessage): number {
  const raw = req.headers['last-event-id']
  if (raw === undefined) return 0
  if (typeof raw !== 'string' || !/^\d{1,15}$/.test(raw)) throw new HttpError(400, 'INVALID_REQUEST')
  return Number(raw)
}

export async function readAgentRequest(req: IncomingMessage, maxAttachments: number): Promise<AgentRequest> {
  const value = await readJson(req)
  try {
    return decodeAgentRequest(value, maxAttachments)
  } catch (error) {
    if (error instanceof RequestValidationError) {
      throw new HttpError(error.code === 'REQUEST_TEXT_TOO_LONG' ? 413 : 400, error.code)
    }
    throw error
  }
}

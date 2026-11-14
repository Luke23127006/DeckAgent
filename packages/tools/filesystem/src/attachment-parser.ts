import { fork } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { attachmentLimits } from './attachment-contracts.ts'
import type { AttachmentParseInput, ParsedAttachment } from './attachment-contracts.ts'
import { SourceError } from './contracts.ts'

interface Waiter {
  readonly signal: AbortSignal
  readonly abort: () => void
  readonly resolve: () => void
  readonly reject: (error: unknown) => void
}

/** Two isolated parsers per Host; queue cancellation never waits for non-cooperative parsing. */
export class AttachmentParser {
  private active = 0
  private closed = false
  private readonly queue: Waiter[] = []
  private readonly jobs = new Map<AbortController, Promise<ParsedAttachment>>()

  parse(input: AttachmentParseInput): Promise<ParsedAttachment> {
    if (this.closed) return Promise.reject(new SourceError('PARSER_CLOSED'))
    const cancel = new AbortController()
    const signal = AbortSignal.any([input.signal, cancel.signal])
    const work = this.run({ ...input, signal })
    this.jobs.set(cancel, work)
    const remove = () => this.jobs.delete(cancel)
    void work.then(remove, remove)
    return work
  }

  async close(): Promise<void> {
    this.closed = true
    const work = [...this.jobs.values()]
    for (const cancel of this.jobs.keys()) cancel.abort()
    await Promise.allSettled(work)
  }

  private async acquire(signal: AbortSignal): Promise<void> {
    signal.throwIfAborted()
    if (this.active < 2) {
      this.active++
      return
    }
    if (this.queue.length >= 16) throw new SourceError('HOST_BUSY')
    await new Promise<void>((resolve, reject) => {
      const waiter: Waiter = {
        signal,
        resolve,
        reject,
        abort: () => {
          const index = this.queue.indexOf(waiter)
          if (index >= 0) this.queue.splice(index, 1)
          reject(signal.reason)
        },
      }
      this.queue.push(waiter)
      signal.addEventListener('abort', waiter.abort, { once: true })
    })
  }

  private release(): void {
    this.active--
    const next = this.queue.shift()
    if (next) {
      next.signal.removeEventListener('abort', next.abort)
      this.active++
      next.resolve()
    }
  }

  private async run(input: AttachmentParseInput): Promise<ParsedAttachment> {
    if (input.bytes.byteLength > attachmentLimits.bytes) throw new SourceError('ATTACHMENT_TOO_LARGE')
    await this.acquire(input.signal)
    try {
      input.signal.throwIfAborted()
      return await new Promise<ParsedAttachment>((resolve, reject) => {
        let child: ChildProcess
        try {
          const env: NodeJS.ProcessEnv = {}
          for (const key of ['SystemRoot', 'SYSTEMROOT', 'PATH', 'Path', 'TEMP', 'TMP'])
            if (process.env[key]) env[key] = process.env[key]
          child = fork(new URL('./parser-worker.js', import.meta.url), [], {
            execArgv: ['--max-old-space-size=256'],
            env,
            serialization: 'advanced',
            stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
            windowsHide: true,
          })
        } catch {
          reject(new SourceError('ATTACHMENT_UNREADABLE'))
          return
        }
        let result: ParsedAttachment | undefined
        let failure: unknown
        const abort = () => {
          failure = input.signal.reason
          child.kill()
        }
        const timer = setTimeout(() => {
          failure = new SourceError('PARSING_LIMIT_EXCEEDED')
          child.kill()
        }, attachmentLimits.preparationMs)
        input.signal.addEventListener('abort', abort, { once: true })
        child.once('error', () => {
          failure = new SourceError('ATTACHMENT_UNREADABLE')
        })
        child.once('message', (message: unknown) => {
          if (isParsedAttachment(message)) result = message
          else if (
            message &&
            typeof message === 'object' &&
            'error' in message &&
            typeof message.error === 'string' &&
            /^[A-Z_]{1,64}$/.test(message.error)
          )
            failure = new SourceError(message.error)
          else failure = new SourceError('ATTACHMENT_UNREADABLE')
          child.kill()
        })
        child.once('close', () => {
          clearTimeout(timer)
          input.signal.removeEventListener('abort', abort)
          if (input.signal.aborted) reject(input.signal.reason)
          else if (failure !== undefined) reject(failure)
          else if (result) resolve(result)
          else reject(new SourceError('ATTACHMENT_UNREADABLE'))
        })
        if (input.signal.aborted) abort()
        else
          child.send({ name: input.name, bytes: input.bytes }, error => {
            if (error) {
              failure = new SourceError('ATTACHMENT_UNREADABLE')
              child.kill()
            }
          })
      })
    } finally {
      this.release()
    }
  }
}

export function isParsedAttachment(value: unknown): value is ParsedAttachment {
  if (!value || typeof value !== 'object') return false
  if (
    !('mediaType' in value) ||
    typeof value.mediaType !== 'string' ||
    !('parserVersion' in value) ||
    typeof value.parserVersion !== 'string'
  )
    return false
  if (
    !('capabilities' in value) ||
    !Array.isArray(value.capabilities) ||
    !value.capabilities.every(item => typeof item === 'string')
  )
    return false
  if (!('completeness' in value) || !['complete', 'partial'].includes(String(value.completeness))) return false
  if (
    !('omitted' in value) ||
    !Array.isArray(value.omitted) ||
    !value.omitted.every(item => item && typeof item === 'object' && typeof item.code === 'string')
  )
    return false
  if (!('parts' in value) || !Array.isArray(value.parts)) return false
  return value.parts.every((part: unknown) => {
    if (
      !part ||
      typeof part !== 'object' ||
      !('location' in part) ||
      !part.location ||
      typeof part.location !== 'object' ||
      !('kind' in part.location)
    )
      return false
    if (!['lines', 'page', 'slide', 'image'].includes(String(part.location.kind)) || !('type' in part)) return false
    return part.type === 'text'
      ? 'text' in part && typeof part.text === 'string'
      : part.type === 'image' &&
          'data' in part &&
          typeof part.data === 'string' &&
          'mimeType' in part &&
          part.mimeType === 'image/png' &&
          'width' in part &&
          typeof part.width === 'number' &&
          'height' in part &&
          typeof part.height === 'number'
  })
}

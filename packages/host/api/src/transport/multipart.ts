import busboy from 'busboy'
import type { IncomingMessage } from 'node:http'
import type { AttachmentManagement } from './contracts.ts'
import { HttpError } from './http-error.ts'

/** Revision precedes the streamed file; no unbounded whole-body buffering. */
export async function receiveAttachment(req: IncomingMessage, sessionId: string, attachments: AttachmentManagement) {
  const abort = new AbortController()
  let work: ReturnType<AttachmentManagement['upload']> | undefined
  const onAbort = () => abort.abort()
  req.once('aborted', onAbort)
  try {
    const parser = busboy({
      headers: req.headers,
      defParamCharset: 'utf8',
      limits: { fields: 1, files: 1, parts: 3, fieldSize: 32, fileSize: attachments.maxBytes + 1, headerPairs: 20 },
    })
    let revision: number | undefined
    let failure: unknown
    let bodyBytes = 0
    let completeUpload: () => void = () => {}
    let rejectUpload: (error: unknown) => void = () => {}
    const complete = new Promise<void>((resolve, reject) => {
      completeUpload = resolve
      rejectUpload = reject
    })
    void complete.catch(() => {})
    const invalid = (error: unknown = new HttpError(400, 'INVALID_REQUEST')) => {
      failure ??= error
      abort.abort()
      rejectUpload(error)
      // A rejected async iterator may destroy its file stream before Busboy sees EOF.
      // End the parser explicitly instead of waiting forever for that file's end event.
      req.unpipe(parser)
      parser.destroy()
      req.resume()
    }
    parser.on('field', (name, value, info) => {
      if (name !== 'expectedRevision' || revision !== undefined || info.valueTruncated || !/^\d{1,15}$/.test(value))
        invalid()
      else revision = Number(value)
    })
    parser.on('file', (field, file, info) => {
      // Async-iterator teardown can emit AbortError before upload() reports its precise storage failure.
      // Its rejection handler owns that outcome; premature replacement would hide a size-limit error.
      file.on('error', () => {
        if (!work) invalid()
      })
      if (field !== 'file' || revision === undefined || work || !info.filename || abort.signal.aborted) {
        file.resume()
        invalid()
        return
      }
      const bytes = (async function* () {
        for await (const chunk of file) {
          abort.signal.throwIfAborted()
          yield chunk
        }
        if (file.truncated) throw new HttpError(413, 'ATTACHMENT_TOO_LARGE')
      })()
      work = attachments.upload({
        sessionId,
        name: info.filename,
        expectedRevision: revision,
        bytes,
        signal: abort.signal,
        complete,
      })
      void work.catch(error => {
        invalid(error)
        file.resume()
      })
    })
    parser.on('filesLimit', () => invalid())
    parser.on('fieldsLimit', () => invalid())
    parser.on('partsLimit', () => invalid())
    const finished = new Promise<void>((resolve, reject) => {
      parser.once('close', () => {
        if (!failure) completeUpload()
        resolve()
      })
      parser.once('error', () => {
        invalid()
        reject(failure)
      })
      req.once('error', () => {
        invalid()
        parser.destroy()
        reject(new HttpError(400, 'UPLOAD_CANCELLED'))
      })
      req.on('data', chunk => {
        bodyBytes += chunk.length
        if (bodyBytes > attachments.maxBytes + 64 * 1024) {
          invalid(new HttpError(413, 'ATTACHMENT_TOO_LARGE'))
          req.unpipe(parser)
          parser.destroy()
          req.resume()
          reject(failure)
        }
      })
    })
    req.pipe(parser)
    await finished
    if (failure) {
      await work?.catch(() => {})
      throw failure
    }
    if (!work) throw new HttpError(400, 'INVALID_REQUEST')
    return await work
  } catch (error) {
    abort.abort()
    await work?.catch(() => {})
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'INVALID_REQUEST')
  } finally {
    req.removeListener('aborted', onAbort)
  }
}

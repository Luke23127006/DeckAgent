import { HttpError, json, param, params, readJson, receiveAttachment, route } from '@deckagent/host-api'
import { RequestValidationError, decodeAttachmentRemoveBody, decodeDraftSaveBody } from '@deckagent/host-contracts'
import { Router } from 'express'
import type { AttachmentOperations } from './attachments.service.ts'

const WORD_ID = /^[\w-]{1,100}$/

function parseBody<T>(decode: (value: unknown) => T, value: unknown): T {
  try {
    return decode(value)
  } catch (error) {
    if (error instanceof RequestValidationError) throw new HttpError(400, error.code)
    throw error
  }
}

export function createAttachmentRoutes(attachments: AttachmentOperations): Router {
  const router = Router({ caseSensitive: true, strict: true })
  const session = params({ sessionId: WORD_ID })
  const ids = params({ sessionId: WORD_ID, attachmentId: WORD_ID })
  router.get(
    '/api/sessions/:sessionId/draft',
    session,
    route(async (req, res) => {
      json(res, 200, await attachments.draft(param(req, 'sessionId')))
    }),
  )
  router.put(
    '/api/sessions/:sessionId/draft',
    session,
    route(async (req, res) => {
      json(
        res,
        200,
        await attachments.save(param(req, 'sessionId'), parseBody(decodeDraftSaveBody, await readJson(req))),
      )
    }),
  )
  router.post(
    '/api/sessions/:sessionId/attachments',
    session,
    route(async (req, res) => {
      json(res, 202, await receiveAttachment(req, param(req, 'sessionId'), attachments))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/attachments/:attachmentId',
    ids,
    route(async (req, res) => {
      json(res, 200, await attachments.get(param(req, 'sessionId'), param(req, 'attachmentId')))
    }),
  )
  router.delete(
    '/api/sessions/:sessionId/attachments/:attachmentId',
    ids,
    route(async (req, res) => {
      const body = parseBody(decodeAttachmentRemoveBody, await readJson(req))
      json(
        res,
        200,
        await attachments.remove(param(req, 'sessionId'), param(req, 'attachmentId'), body.expectedRevision),
      )
    }),
  )
  router.get(
    '/api/sessions/:sessionId/attachments/:attachmentId/preview',
    ids,
    route(async (req, res) => {
      const abort = new AbortController()
      res.once('close', () => abort.abort())
      const result = await attachments.preview(param(req, 'sessionId'), param(req, 'attachmentId'), abort.signal)
      res.setHeader('content-security-policy', "sandbox; default-src 'none'; frame-ancestors 'none'")
      res.writeHead(200, { 'content-type': result.contentType, 'content-length': result.body.length })
      res.end(result.body)
    }),
  )
  return router
}

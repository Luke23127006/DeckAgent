import type { Router } from 'express'
import type { HostMessage, HostOptions } from './contracts.ts'
import { json } from './http-io.ts'
import { param, params, route, WORD_ID } from './route-params.ts'

function projectHistoryMessage(message: HostMessage) {
  return {
    role: message.role,
    content: message.content,
    ...(message.role === 'user' && message.attachments
      ? {
          attachments: message.attachments.map(item => ({
            attachmentId: item.attachmentId,
            name: item.name,
            state: item.state,
            byteSize: item.byteSize,
            ...(item.detectedType ? { detectedType: item.detectedType } : {}),
            ...(item.rejectionCode ? { rejectionCode: item.rejectionCode } : {}),
            ...(item.preparation ? { preparation: item.preparation } : {}),
            ...(item.source
              ? {
                  source: {
                    sourceId: item.source.sourceId,
                    version: item.source.version,
                    kind: item.source.kind,
                    label: item.source.label,
                  },
                }
              : {}),
          })),
        }
      : {}),
    ...(message.role === 'assistant' && message.interrupted ? { interrupted: true } : {}),
    ...(message.role === 'tool'
      ? { toolCallId: message.toolCallId, name: message.name, isError: message.isError === true }
      : {}),
  }
}

export function registerSessionRoutes(router: Router, options: HostOptions): void {
  const session = params({ sessionId: WORD_ID })
  router.get(
    '/api/sessions/:sessionId/history',
    session,
    route(async (req, res) => {
      const messages = await options.readHistory(param(req, 'sessionId'))
      json(res, 200, messages.filter(message => message.role !== 'system').map(projectHistoryMessage))
    }),
  )
}

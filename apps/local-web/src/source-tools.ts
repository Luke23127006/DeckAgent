import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { createSourceAccess, SourceError, attachmentLimits } from '@deckagent/file-tools'
import type { PreparedTools, ToolSchema, ToolResult } from '@deckagent/host-api'
import { HttpError } from '@deckagent/host-api'
import { SessionError } from '@deckagent/session-persistence'
import type { SqliteSessionStore, AttachmentRecord } from '@deckagent/session-persistence'
import type { ParsedAttachment } from '@deckagent/file-tools'
import type { WorkspaceRegistry } from '@deckagent/workspace-registry'
import type { ManagedAttachments } from './managed-attachments.ts'

const schema = (name: string, description: string, property: string, required: boolean): ToolSchema => ({
  name,
  description,
  inputSchema: {
    type: 'object',
    properties: { [property]: { type: 'string' } },
    required: required ? [property] : [],
    additionalProperties: false,
  },
})

const schemas = [
  schema(
    'list_sources',
    'List project files in a relative directory, with a bounded result. Empty path lists the project root.',
    'path',
    false,
  ),
  schema('read_source', 'Read one UTF-8 project source by relative path. No writes.', 'path', true),
  schema(
    'read_external',
    'Read one UTF-8 local file by full path. Outside scope requires one-step Host approval. Never access another Chat or secrets.',
    'path',
    true,
  ),
  {
    name: 'read_attachment',
    description:
      'Read one bounded part of a ready attachment admitted to this Chat. Use nextCursor to continue. Includes real locations, omissions and typed images; does not run OCR.',
    inputSchema: {
      type: 'object',
      properties: { attachmentId: { type: 'string' }, cursor: { type: 'string' } },
      required: ['attachmentId'],
      additionalProperties: false,
    },
  },
] as const

/** Composition resolves the real Chat/Workspace; model arguments never choose identity or policy. */
export async function prepareSourceTools(options: {
  readonly sessionId: string
  readonly store: SqliteSessionStore
  readonly registry: WorkspaceRegistry
  readonly dataRoot: string
  readonly home: string
  readonly attachments: ManagedAttachments
  readonly attachmentIds?: readonly string[]
}): Promise<PreparedTools> {
  const { sessionId, store, registry } = options
  const chat = await store.getInfo(sessionId)
  if (!chat) throw new HttpError(404, 'SESSION_NOT_FOUND')
  const workspace = chat.workspaceId ? await registry.get(chat.workspaceId) : undefined
  const root = workspace?.folderStatus === 'available' ? (workspace.folder ?? undefined) : undefined
  const denied = () => [
    options.dataRoot,
    ...['.ssh', '.aws', '.gnupg', '.kube', '.docker'].map(name => join(options.home, name)),
    ...(process.platform === 'win32' ? ['C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)'] : []),
    ...registry.folders().filter(folder => folder !== root),
  ]
  const access = await createSourceAccess({
    ...(root ? { root } : {}),
    deniedRoots: denied,
    validate: async () => {
      const current = await store.getInfo(sessionId)
      if (!current || current.workspaceId !== chat.workspaceId) throw new SourceError('SOURCE_CHANGED')
      if (
        root &&
        (!current.workspaceId ||
          (await registry.get(current.workspaceId)).folderStatus !== 'available' ||
          (await registry.get(current.workspaceId)).folder !== root)
      )
        throw new SourceError('SOURCE_CHANGED')
    },
  })
  let attachments: readonly AttachmentRecord[]
  try {
    attachments = [
      ...store.attachments.sent(sessionId),
      ...(options.attachmentIds ?? []).map(id => store.attachments.get(sessionId, id)),
    ]
  } catch (error) {
    if (error instanceof SessionError && error.code === 'ATTACHMENT_NOT_FOUND')
      throw new HttpError(404, 'ATTACHMENT_NOT_FOUND')
    throw error
  }
  const sourceCatalogue = store.requests.sourceCatalogue(sessionId)
  const manifest = JSON.stringify({
    projectSources: !!root,
    sources: sourceCatalogue,
    attachments: attachments.map(item => ({
      attachmentId: item.attachmentId,
      name: item.name,
      type: item.detectedType,
      preparation: item.preparation,
    })),
  })
  return {
    context: createHash('sha256')
      .update(
        JSON.stringify([
          sessionId,
          chat.workspaceId,
          access.context,
          attachments.map(item => [item.attachmentId, item.fingerprint, item.parsedFingerprint, item.preparation]),
          sourceCatalogue,
          'read-only-v2',
          'no-research',
        ]),
      )
      .digest('hex'),
    manifest,
    schemas,
    async execute(name, args, context) {
      if (context.sessionId !== sessionId) throw new SourceError('SOURCE_ACCESS_DENIED')
      if (!args || typeof args !== 'object' || Array.isArray(args)) throw new SourceError('SOURCE_ARGUMENTS_INVALID')
      const value = args as Record<string, unknown>
      const field = name === 'read_attachment' ? 'attachmentId' : 'path'
      if (
        Object.keys(value).some(key => key !== field && !(name === 'read_attachment' && key === 'cursor')) ||
        (name === 'read_attachment' &&
          value.cursor !== undefined &&
          (typeof value.cursor !== 'string' || !/^\d{1,5}:\d{1,7}$/.test(value.cursor))) ||
        (value[field] !== undefined && typeof value[field] !== 'string') ||
        (name !== 'list_sources' && (typeof value[field] !== 'string' || !String(value[field]).trim()))
      )
        throw new SourceError('SOURCE_ARGUMENTS_INVALID')
      const text = (result: unknown) => ({
        isError: false,
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      })
      context.signal.throwIfAborted()
      if (name === 'list_sources') return text(await access.list(String(value.path ?? ''), context.signal))
      if (name === 'read_attachment') {
        const item = attachments.find(item => item.attachmentId === value.attachmentId)
        if (!item || item.state !== 'ready' || !item.source) throw new SourceError('SOURCE_NOT_FOUND')
        let prepared: ParsedAttachment
        try {
          if (item.preparation)
            prepared = await options.attachments.prepared(sessionId, item.attachmentId, context.signal)
          else {
            if (item.detectedType !== 'text/plain' && item.detectedType !== 'text/markdown')
              throw new SourceError('SOURCE_UNREADABLE')
            const bytes = await options.attachments.read(sessionId, item.attachmentId, context.signal)
            prepared = {
              mediaType: item.detectedType,
              parserVersion: 'legacy-text-v1',
              capabilities: ['utf8-lines'],
              completeness: 'complete',
              omitted: [],
              parts: [
                {
                  type: 'text',
                  text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
                  location: { kind: 'lines', start: 1 },
                },
              ],
            }
          }
        } catch {
          context.signal.throwIfAborted()
          throw new SourceError('SOURCE_UNREADABLE')
        }
        context.signal.throwIfAborted()
        const [index = 0, offset = 0] = String(value.cursor ?? '0:0')
          .split(':')
          .map(Number)
        const part = prepared.parts[index]
        if (
          part?.type === 'text' &&
          offset > 0 &&
          /[\uDC00-\uDFFF]/.test(part.text[offset] ?? '') &&
          /[\uD800-\uDBFF]/.test(part.text[offset - 1] ?? '')
        )
          throw new SourceError('SOURCE_ARGUMENTS_INVALID')
        if (!part || (part.type === 'image' && offset !== 0) || (part.type === 'text' && offset >= part.text.length))
          throw new SourceError('SOURCE_ARGUMENTS_INVALID')
        let nextCursor = index + 1 < prepared.parts.length ? `${index + 1}:0` : undefined
        const base = {
          source: item.source,
          parserVersion: prepared.parserVersion,
          capabilities: prepared.capabilities,
          omitted: prepared.omitted,
        }
        if (part.type === 'image') {
          if (Buffer.byteLength(part.data, 'base64') > attachmentLimits.imageBytes)
            throw new SourceError('IMAGE_INPUT_UNAVAILABLE')
          const result: ToolResult = {
            isError: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...base,
                  location: part.location,
                  completeness: prepared.parts.length === 1 ? prepared.completeness : 'partial',
                  width: part.width,
                  height: part.height,
                  ...(nextCursor ? { nextCursor } : {}),
                }),
              },
              { type: 'image', data: part.data, mimeType: part.mimeType },
            ],
          }
          return result
        }
        let end = Math.min(part.text.length, offset + 16_384)
        if (end < part.text.length && /[\uD800-\uDBFF]/.test(part.text[end - 1]!)) end--
        if (end < part.text.length) nextCursor = `${index}:${end}`
        const content = part.text.slice(offset, end)
        const location =
          part.location.kind === 'lines'
            ? {
                ...part.location,
                start: part.text.slice(0, offset).split('\n').length,
                end: part.text.slice(0, end).split('\n').length,
              }
            : part.location
        return text({
          ...base,
          text: content,
          location,
          completeness:
            offset === 0 && end === part.text.length && prepared.parts.length === 1 ? prepared.completeness : 'partial',
          ...(nextCursor ? { nextCursor } : {}),
        })
      }
      if (name !== 'read_source' && name !== 'read_external') throw new SourceError('SOURCE_ACCESS_DENIED')
      const plan = await access.planRead(String(value.path), name === 'read_external', context.signal)
      if (
        plan.decision === 'ask' &&
        !(await context.approve({
          key: plan.key,
          operation: 'read-file',
          target: plan.target,
          reason: 'Đọc file nằm ngoài project folder của chat này.',
        }))
      )
        return { isError: true, content: [{ type: 'text', text: 'STEP_REFUSED' }] }
      context.signal.throwIfAborted()
      const read = await plan.read(context.signal)
      context.signal.throwIfAborted()
      const source = store.requests.recordSourceRead(context.requestId, {
        origin: plan.origin,
        label: plan.target,
        fingerprint: read.fingerprint,
        lineCount: read.lineCount,
        kind: plan.decision === 'allow' ? 'project-file' : 'approved-file',
      })
      return text({ source, text: read.text, completeness: 'complete' })
    },
  }
}

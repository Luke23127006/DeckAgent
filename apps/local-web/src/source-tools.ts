import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { createSourceAccess, SourceError } from '@deckagent/file-tools'
import type { PreparedTools, ToolSchema } from '@deckagent/host-api'
import { HttpError } from '@deckagent/host-api'
import type { SqliteSessionStore } from '@deckagent/session-persistence'
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
  schema(
    'read_attachment',
    'Read a sent, ready text attachment of this Chat by attachmentId. Drafts and unsupported formats are unavailable.',
    'attachmentId',
    true,
  ),
] as const

/** Composition resolves the real Chat/Workspace; model arguments never choose identity or policy. */
export async function prepareSourceTools(options: {
  readonly sessionId: string
  readonly store: SqliteSessionStore
  readonly registry: WorkspaceRegistry
  readonly dataRoot: string
  readonly home: string
  readonly attachments: ManagedAttachments
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
  const attachments = store.attachments.sent(sessionId)
  const sourceCatalogue = store.requests.sourceCatalogue(sessionId)
  const manifest = JSON.stringify({
    projectSources: !!root,
    sources: sourceCatalogue,
    attachments: attachments.map(item => ({
      attachmentId: item.attachmentId,
      name: item.name,
      type: item.detectedType,
    })),
  })
  return {
    context: createHash('sha256')
      .update(
        JSON.stringify([
          sessionId,
          chat.workspaceId,
          access.context,
          attachments.map(item => [item.attachmentId, item.fingerprint]),
          sourceCatalogue,
          'read-only-v1',
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
        Object.keys(value).some(key => key !== field) ||
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
        if (item.detectedType !== 'text/plain' && item.detectedType !== 'text/markdown')
          throw new SourceError('SOURCE_UNREADABLE')
        const bytes = await options.attachments.read(sessionId, item.attachmentId, context.signal)
        let content: string
        try {
          content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
        } catch {
          throw new SourceError('SOURCE_UNREADABLE')
        }
        context.signal.throwIfAborted()
        return text({ source: item.source, text: content, completeness: 'complete' })
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

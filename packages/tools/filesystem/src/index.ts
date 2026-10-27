import { open } from 'node:fs/promises'
import { isAbsolute, relative } from 'node:path'
import type { ToolRegistry } from '@deckagent/agent-runtime'

import { createWorkspaceAccess } from './workspace.ts'
import type { DirectoryIdentity } from './workspace.ts'

export type { DirectoryIdentity } from './workspace.ts'

export interface FileToolOptions {
  /** Application-owned private work root for one Chat/request. */
  readonly root: string
  /** User-owned project folder. Only read_file with scope=source can reach it. */
  readonly sourceRoot?: string
  /** Registry identity of the folder the user selected, before this request. */
  readonly sourceIdentity?: DirectoryIdentity
}

/** Read-only public seam; shares all file-tool grant and size restrictions. */
export async function createWorkspaceReader(options: { readonly root: string }) {
  return (await createWorkspaceAccess(options)).read
}

const MAX_BYTES = 256 * 1024

/** Host grants a fixed directory. No shell, absolute paths, links, or permission escalation. */
export async function registerFileTools(registry: ToolRegistry, options: FileToolOptions) {
  const access = await createWorkspaceAccess(options)
  const { resolvePath, read, verifyOpenFile } = access
  let readSource: typeof read | undefined
  if (options.sourceRoot) {
    const source = await createWorkspaceAccess({
      root: options.sourceRoot,
      ...(options.sourceIdentity ? { identity: options.sourceIdentity } : {}),
    })
    const overlap = (from: string, to: string) => {
      const path = relative(from, to)
      return path === '' || (path !== '..' && !path.startsWith('../') && !path.startsWith('..\\') && !isAbsolute(path))
    }
    if (overlap(access.root, source.root) || overlap(source.root, access.root))
      throw new Error('Work and source roots must be separate')
    readSource = source.read
  }
  const unregister: (() => void)[] = []
  try {
    unregister.push(
      registry.register({
        name: 'write_file',
        description:
          'Create a UTF-8 draft in the workspace. Existing files are never overwritten. Parent directories must exist.',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string' }, content: { type: 'string' } },
          required: ['path', 'content'],
          additionalProperties: false,
        },
        async execute(args, { signal }) {
          signal.throwIfAborted()
          const content = String(args.content)
          if (Buffer.byteLength(content) > MAX_BYTES) throw new Error('File too large')
          const path = await resolvePath(args.path)
          signal.throwIfAborted()
          // Exclusive creation also rejects an existing symlink/hardlink at the leaf.
          const file = await open(path, 'wx')
          try {
            await verifyOpenFile(args.path, await file.stat())
            signal.throwIfAborted()
            await file.writeFile(content, { encoding: 'utf8', signal })
          } finally {
            await file.close()
          }
          return 'File created in workspace'
        },
      }),
    )
    unregister.push(
      registry.register({
        name: 'read_file',
        description:
          'Read a UTF-8 file (maximum 256 KiB). scope=work reads private drafts; scope=source reads the read-only project folder when available.',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string' }, scope: { type: 'string' } },
          required: ['path'],
          additionalProperties: false,
        },
        async execute(args, { signal }) {
          if (args.scope !== undefined && args.scope !== 'work' && args.scope !== 'source')
            throw new Error('Unknown file scope')
          if (args.scope === 'source') {
            if (!readSource) throw new Error('Project folder unavailable')
            return readSource(args.path, signal)
          }
          return read(args.path, signal)
        },
      }),
    )
    return {
      names: ['write_file', 'read_file'] as readonly string[],
      dispose: () => {
        for (const remove of unregister) remove()
      },
    }
  } catch (error) {
    for (const remove of unregister) remove()
    throw error
  }
}

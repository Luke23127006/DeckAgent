import { open } from 'node:fs/promises'
import type { ToolRegistry } from '@deckagent/agent-runtime'

import { createWorkspaceAccess } from './workspace.ts'

/** Read-only public seam; shares all file-tool grant and size restrictions. */
export async function createWorkspaceReader(options: { readonly root: string }) {
  return (await createWorkspaceAccess(options)).read
}

const MAX_BYTES = 256 * 1024

/** Host grants a fixed directory. No shell, absolute paths, links, or permission escalation. */
export async function registerFileTools(registry: ToolRegistry, options: { readonly root: string }) {
  const { resolvePath, read } = await createWorkspaceAccess(options)
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
        description: 'Read a UTF-8 file in the workspace (maximum 256 KiB).',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string' } },
          required: ['path'],
          additionalProperties: false,
        },
        async execute(args, { signal }) {
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

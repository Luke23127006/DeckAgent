import { constants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import { isAbsolute, join, relative, win32 } from 'node:path'
import type { ToolRegistry } from '@deckagent/agent-runtime'

const MAX_BYTES = 256 * 1024

/** Host grants a fixed directory. No shell, absolute paths, links, or permission escalation. */
export async function registerFileTools(registry: ToolRegistry, options: { readonly root: string }) {
  const root = await realpath(options.root)
  if (!(await lstat(root)).isDirectory()) throw new Error('Workspace must be a directory')
  const resolvePath = async (value: unknown) => {
    if (typeof value !== 'string' || !value || value.length > 512 || isAbsolute(value) || win32.isAbsolute(value)) {
      throw new Error('Workspace-relative path required')
    }
    const parts = value.split(/[\\/]/)
    // Reject Windows aliases, streams and device names even when tests run elsewhere.
    if (
      parts.some(
        part =>
          !part ||
          part === '.' ||
          part === '..' ||
          /[<>:"|?*]/.test(part) ||
          [...part].some(char => char.charCodeAt(0) < 32) ||
          /[. ]$/.test(part) ||
          /^(con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i.test(part),
      )
    ) {
      throw new Error('Unsafe workspace path')
    }
    if ((await realpath(options.root)) !== root) throw new Error('Workspace changed')
    let current = root
    for (let i = 0; i < parts.length; i++) {
      current = join(current, parts[i]!)
      try {
        const stat = await lstat(current)
        if (
          stat.isSymbolicLink() ||
          (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile()) ||
          (stat.isFile() && stat.nlink !== 1)
        )
          throw new Error('Unsupported workspace entry')
        const resolved = await realpath(current)
        const inside = relative(root, resolved)
        if (inside.startsWith('..') || isAbsolute(inside)) throw new Error('Outside workspace')
      } catch (error) {
        if (
          !(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT' && i === parts.length - 1)
        )
          throw error
      }
    }
    return current
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
          signal.throwIfAborted()
          const path = await resolvePath(args.path)
          const file = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
          try {
            const stat = await file.stat()
            if (!stat.isFile() || stat.nlink !== 1 || stat.size > MAX_BYTES) throw new Error('Unsupported file')
            const bytes = Buffer.alloc(MAX_BYTES + 1)
            const { bytesRead } = await file.read(bytes, 0, bytes.length, 0)
            signal.throwIfAborted()
            if (bytesRead > MAX_BYTES) throw new Error('File too large')
            return bytes.subarray(0, bytesRead).toString('utf8')
          } finally {
            await file.close()
          }
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

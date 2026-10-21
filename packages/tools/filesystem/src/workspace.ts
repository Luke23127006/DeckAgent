import { constants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import { isAbsolute, join, relative, win32 } from 'node:path'

const MAX_BYTES = 256 * 1024

/** Internal shared workspace access for file and publication tools. */
export async function createWorkspaceAccess(options: { readonly root: string }) {
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
  return {
    resolvePath,
    async read(value: unknown, signal: AbortSignal): Promise<string> {
      signal.throwIfAborted()
      const path = await resolvePath(value)
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
  }
}

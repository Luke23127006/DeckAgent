import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, open, opendir, realpath } from 'node:fs/promises'
import { basename, isAbsolute, join, parse, relative, resolve, sep, win32 } from 'node:path'
import { SourceError } from './contracts.ts'
import type { SourceAccess, SourceAccessOptions, SourceReadPlan } from './contracts.ts'

// Technical read/list budgets, not attachment admission values or product limits.
const readBudget = 256 * 1024
const entryBudget = 200
const inside = (root: string, path: string) => {
  const value = relative(root, path)
  return value === '' || (!isAbsolute(value) && value !== '..' && !value.startsWith(`..${sep}`))
}
const identity = (stat: { dev: bigint; ino: bigint }) => `${stat.dev}:${stat.ino}`
const fileIdentity = (stat: { dev: bigint; ino: bigint; size: bigint; mtimeNs: bigint; ctimeNs: bigint }) =>
  `${identity(stat)}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`

/** Inspect names/identity only until the Host has authorized the actual read. */
export async function createSourceAccess(options: SourceAccessOptions): Promise<SourceAccess> {
  const getRoots = () =>
    (typeof options.deniedRoots === 'function' ? options.deniedRoots() : options.deniedRoots).map(root => resolve(root))
  const roots = getRoots()
  let root: string | undefined
  let rootIdentity: string | undefined
  if (options.root) {
    try {
      root = await realpath(options.root)
      const info = await lstat(root, { bigint: true })
      if (!info.isDirectory() || info.isSymbolicLink()) throw new SourceError('SOURCE_UNAVAILABLE')
      rootIdentity = identity(info)
    } catch {
      throw new SourceError('SOURCE_UNAVAILABLE')
    }
  }

  const denied = (path: string) => getRoots().some(item => inside(item, path))
  const check = async (signal: AbortSignal) => {
    signal.throwIfAborted()
    await options.validate?.()
    if (root) {
      const info = await lstat(root, { bigint: true }).catch(() => {
        throw new SourceError('SOURCE_CHANGED')
      })
      if (
        !info.isDirectory() ||
        info.isSymbolicLink() ||
        identity(info) !== rootIdentity ||
        (await realpath(root)) !== root
      )
        throw new SourceError('SOURCE_CHANGED')
    }
    signal.throwIfAborted()
  }

  const inspect = async (value: string, external: boolean, directory: boolean, signal: AbortSignal) => {
    await check(signal)
    if (
      typeof value !== 'string' ||
      value.length > 4096 ||
      [...value].some(char => char.charCodeAt(0) < 32) ||
      value.startsWith('\\\\') ||
      value.startsWith('//')
    )
      throw new SourceError('SOURCE_ACCESS_DENIED')
    if (!external && !root) throw new SourceError('SOURCE_UNAVAILABLE')
    if ((external && !isAbsolute(value)) || (!external && (isAbsolute(value) || win32.isAbsolute(value))))
      throw new SourceError('SOURCE_ACCESS_DENIED')
    const path = external ? resolve(value) : resolve(root!, value)
    if ((!external && !inside(root!, path)) || denied(path)) throw new SourceError('SOURCE_ACCESS_DENIED')
    const parts = relative(parse(path).root, path).split(sep).filter(Boolean)
    if (
      value.split(/[\\/]/).includes('..') ||
      parts.some(
        part =>
          /[<>:"|?*]/.test(part) ||
          /[. ]$/.test(part) ||
          /^(con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i.test(part),
      )
    )
      throw new SourceError('SOURCE_ACCESS_DENIED')
    let current = parse(path).root
    for (const part of parts) {
      current = join(current, part)
      const stat = await lstat(current, { bigint: true }).catch(() => {
        throw new SourceError('SOURCE_UNAVAILABLE')
      })
      if (stat.isSymbolicLink() || (stat.isFile() && stat.nlink !== 1n)) throw new SourceError('SOURCE_ACCESS_DENIED')
      if (current !== path && !stat.isDirectory()) throw new SourceError('SOURCE_UNAVAILABLE')
    }
    const canonical = await realpath(path).catch(() => {
      throw new SourceError('SOURCE_UNAVAILABLE')
    })
    if (denied(canonical) || (!external && !inside(root!, canonical))) throw new SourceError('SOURCE_ACCESS_DENIED')
    const stat = await lstat(canonical, { bigint: true })
    if (directory ? !stat.isDirectory() : !stat.isFile()) throw new SourceError('SOURCE_UNAVAILABLE')
    signal.throwIfAborted()
    return { path: canonical, stat }
  }

  return {
    context: createHash('sha256')
      .update(JSON.stringify([root ?? null, rootIdentity ?? null, roots]))
      .digest('hex'),
    async planRead(value, external, signal): Promise<SourceReadPlan> {
      const before = await inspect(value, external, false, signal)
      const pinned = fileIdentity(before.stat)
      const allowed = root !== undefined && inside(root, before.path)
      return {
        origin: before.path,
        decision: allowed ? 'allow' : 'ask',
        key: createHash('sha256').update(`read:${before.path}:${pinned}`).digest('hex'),
        target: allowed ? relative(root!, before.path) : before.path,
        identity: pinned,
        async read(readSignal) {
          const now = await inspect(value, external, false, readSignal)
          if (fileIdentity(now.stat) !== pinned) throw new SourceError('SOURCE_CHANGED')
          if (now.stat.size > BigInt(readBudget)) throw new SourceError('SOURCE_TOO_LARGE')
          const file = await open(now.path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
          try {
            if (fileIdentity(await file.stat({ bigint: true })) !== pinned) throw new SourceError('SOURCE_CHANGED')
            const bytes = Buffer.alloc(readBudget + 1)
            let count = 0
            while (count < bytes.length) {
              readSignal.throwIfAborted()
              const result = await file.read(bytes, count, bytes.length - count, count)
              if (!result.bytesRead) break
              count += result.bytesRead
            }
            await check(readSignal)
            if (fileIdentity(await file.stat({ bigint: true })) !== pinned) throw new SourceError('SOURCE_CHANGED')
            if (count > readBudget) throw new SourceError('SOURCE_TOO_LARGE')
            const content = bytes.subarray(0, count)
            let text: string
            try {
              text = new TextDecoder('utf-8', { fatal: true }).decode(content)
            } catch {
              throw new SourceError('SOURCE_UNREADABLE')
            }
            if (text.includes('\0')) throw new SourceError('SOURCE_UNREADABLE')
            return {
              text,
              fingerprint: createHash('sha256').update(content).digest('hex'),
              lineCount: text.split('\n').length,
            }
          } finally {
            await file.close()
          }
        },
      }
    },
    async list(value, signal) {
      const before = await inspect(value, false, true, signal)
      const entries: { name: string; kind: 'file' | 'directory' }[] = []
      let truncated = false
      const directory = await opendir(before.path)
      try {
        while (true) {
          signal.throwIfAborted()
          const entry = await directory.read()
          if (!entry) break
          if (entries.length >= entryBudget) {
            truncated = true
            break
          }
          const path = join(before.path, entry.name)
          if (denied(path) || entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile())) continue
          entries.push({ name: basename(entry.name), kind: entry.isDirectory() ? 'directory' : 'file' })
        }
      } finally {
        await directory.close()
      }
      await check(signal)
      if (identity((await inspect(value, false, true, signal)).stat) !== identity(before.stat))
        throw new SourceError('SOURCE_CHANGED')
      return { entries, truncated }
    },
  }
}

import { lstat, realpath, open } from 'node:fs/promises'
import { constants } from 'node:fs'
import { basename, dirname, isAbsolute, join, parse, relative, resolve } from 'node:path'
import { createWorkspaceAccess } from './workspace.ts'
import { ToolFailure } from '@deckagent/agent-runtime'

export function containsPath(root: string, target: string): boolean {
  const part = relative(root, target)
  return part === '' || (part !== '..' && !part.startsWith('../') && !part.startsWith('..\\') && !isAbsolute(part))
}

/** Resolve a local file without following a directory alias before asking for approval. */
export async function readApprovedFile(
  value: unknown,
  signal: AbortSignal,
  blockedRoots: readonly string[],
  authorize: (target: string, signal: AbortSignal) => Promise<void>,
): Promise<string> {
  const prepared = await approvedTarget(value, signal, blockedRoots, authorize)
  return prepared.access.read(basename(prepared.canonical), signal)
}

async function approvedTarget(value: unknown, signal: AbortSignal, blockedRoots: readonly string[], authorize: (target: string, signal: AbortSignal) => Promise<void>) {
  if (typeof value !== 'string' || !isAbsolute(value) || value.length > 4096 || /^[/\\]{2}/.test(value))
    throw new Error('Absolute local file path required')
  const target = resolve(value)
  if (blockedRoots.some(root => containsPath(root, target))) throw new ToolFailure('PERMISSION_BOUNDARY')
  let current = parse(target).root
  for (const part of target.slice(current.length).split(/[/\\]/)) {
    if (!part || /[<>:"|?*]/.test(part) || /[. ]$/.test(part)) throw new Error('Unsupported path')
    current = join(current, part)
    const stat = await lstat(current)
    if (stat.isSymbolicLink() || (current !== target && !stat.isDirectory()))
      throw new ToolFailure('PERMISSION_BOUNDARY')
  }
  const canonical = await realpath(target)
  if (blockedRoots.some(root => containsPath(root, canonical))) throw new ToolFailure('PERMISSION_BOUNDARY')
  const expected = await lstat(canonical)
  if (!expected.isFile() || expected.nlink !== 1) throw new Error('Unsupported file')
  const access = await createWorkspaceAccess({ root: dirname(canonical) })
  await authorize(canonical, signal)
  signal.throwIfAborted()
  await access.verifyOpenFile(basename(canonical), expected)
  return { access, canonical, expected }
}

/** Binary material reads keep the same approval/alias/identity boundary as text reads. */
export async function readApprovedBytes(value: unknown, signal: AbortSignal, blockedRoots: readonly string[], authorize: (target: string, signal: AbortSignal) => Promise<void>, maxBytes: number): Promise<Uint8Array> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 20 * 1024 * 1024) throw new Error('Invalid read bound')
  const { canonical, expected } = await approvedTarget(value, signal, blockedRoots, authorize)
  const file = await open(canonical, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    const before = await file.stat()
    if (!before.isFile() || before.nlink !== 1 || before.dev !== expected.dev || before.ino !== expected.ino) throw new ToolFailure('PERMISSION_BOUNDARY')
    if (before.size > maxBytes) throw new ToolFailure('MATERIAL_READ_LIMIT')
    const parts: Buffer[] = []
    let total = 0
    for (;;) {
      signal.throwIfAborted()
      const buffer = Buffer.alloc(64 * 1024)
      const { bytesRead } = await file.read(buffer)
      if (!bytesRead) break
      total += bytesRead
      if (total > maxBytes) throw new Error('Material read limit')
      parts.push(buffer.subarray(0, bytesRead))
    }
    const after = await file.stat()
    if (after.nlink !== 1 || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) throw new ToolFailure('PERMISSION_BOUNDARY')
    signal.throwIfAborted()
    return Buffer.concat(parts, total)
  } finally { await file.close() }
}

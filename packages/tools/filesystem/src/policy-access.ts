import { lstat, realpath } from 'node:fs/promises'
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
  return access.read(basename(canonical), signal)
}

import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { pinnedVersion } from './config.ts'

function hasCode(value: unknown): value is { readonly code?: unknown } {
  return typeof value === 'object' && value !== null && 'code' in value
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** Absent resources allow the workspace dependency; present but invalid resources never fall back. */
export async function resourceExecutable(root: string): Promise<{ present: boolean; executable?: string }> {
  try {
    await stat(root)
  } catch (error) {
    return { present: !hasCode(error) || error.code !== 'ENOENT' }
  }
  try {
    if (process.platform !== 'win32' || process.arch !== 'x64') return { present: true }
    const manifest = join(root, 'manifest.json')
    if ((await stat(manifest)).size > 4096) return { present: true }
    const value: unknown = JSON.parse(await readFile(manifest, 'utf8'))
    if (!record(value)) return { present: true }
    if (
      value.version !== pinnedVersion ||
      value.platform !== process.platform ||
      value.arch !== process.arch ||
      value.package !== 'opencode-windows-x64' ||
      value.binary !== 'bin/opencode.exe' ||
      typeof value.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(value.sha256)
    )
      return { present: true }
    const executable = join(root, 'bin', 'opencode.exe')
    const hash = createHash('sha256')
    for await (const bytes of createReadStream(executable)) hash.update(bytes)
    return hash.digest('hex') === value.sha256 ? { present: true, executable } : { present: true }
  } catch {
    return { present: true }
  }
}

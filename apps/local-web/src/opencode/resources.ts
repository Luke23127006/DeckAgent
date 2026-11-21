import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { pinnedVersion } from './config.ts'

/** Absent resources allow the workspace dependency; present but invalid resources never fall back. */
export async function resourceExecutable(root: string): Promise<{ present: boolean; executable?: string }> {
  try {
    await stat(root)
  } catch (error) {
    return { present: (error as NodeJS.ErrnoException).code !== 'ENOENT' }
  }
  try {
    if (process.platform !== 'win32' || process.arch !== 'x64') return { present: true }
    const manifest = join(root, 'manifest.json')
    if ((await stat(manifest)).size > 4096) return { present: true }
    const value: unknown = JSON.parse(await readFile(manifest, 'utf8'))
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { present: true }
    const entry = value as Record<string, unknown>
    if (
      entry.version !== pinnedVersion ||
      entry.platform !== process.platform ||
      entry.arch !== process.arch ||
      entry.package !== 'opencode-windows-x64' ||
      entry.binary !== 'bin/opencode.exe' ||
      typeof entry.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)
    )
      return { present: true }
    const executable = join(root, 'bin', 'opencode.exe')
    const hash = createHash('sha256')
    for await (const bytes of createReadStream(executable)) hash.update(bytes)
    return hash.digest('hex') === entry.sha256 ? { present: true, executable } : { present: true }
  } catch {
    return { present: true }
  }
}

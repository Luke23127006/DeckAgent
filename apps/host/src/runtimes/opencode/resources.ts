import { createHash } from 'node:crypto'
import { createReadStream, constants } from 'node:fs'
import { access, readFile, stat } from 'node:fs/promises'
import { delimiter, isAbsolute, join } from 'node:path'
import { createRequire } from 'node:module'
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

export async function findExecutable(
  configured: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
  resourceDir?: string,
): Promise<string | undefined> {
  if (!configured && resourceDir) {
    const bundled = await resourceExecutable(resourceDir)
    if (bundled.present) return bundled.executable
  }

  let installed: string | undefined

  if (!configured && process.platform === 'win32' && process.arch === 'x64') {
    try {
      installed = createRequire(import.meta.url).resolve('opencode-windows-x64/bin/opencode.exe')
    } catch {
      // Optional platform packages can be omitted; startup reports the missing runtime.
    }
  }

  const candidates = configured
    ? [configured]
    : [
        ...(installed ? [installed] : []),
        ...(env.PATH ?? env.Path ?? '')
          .split(delimiter)
          .filter(Boolean)
          .map(folder => join(folder, process.platform === 'win32' ? 'opencode.exe' : 'opencode')),
      ]

  for (const candidate of candidates) {
    if (!isAbsolute(candidate)) continue
    try {
      if (!(await stat(candidate)).isFile()) continue
      if (process.platform !== 'win32') await access(candidate, constants.X_OK)
      return candidate
    } catch {
      /* Next candidate. */
    }
  }

  return undefined
}

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { RuntimeError } from '@deckagent/agent-runtime'

export async function readLocal(path: string): Promise<Buffer | undefined> {
  try { return await readFile(path) }
  catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return undefined
    throw new RuntimeError('CLI_STORAGE', 'Cannot read local chat settings or credentials. Check file permissions')
  }
}

export async function writeLocal(path: string, content: string | Buffer): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`
  try {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 })
    await writeFile(temporary, content, { flag: 'wx', mode: 0o600 })
    await rename(temporary, path)
  } catch { throw new RuntimeError('CLI_STORAGE', 'Cannot save local chat settings or credentials. Check directory permissions') }
  finally { await rm(temporary, { force: true }).catch(() => {}) }
}

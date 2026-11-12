import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Where DeckAgent keeps provider keys (ADR-0006, NFR-006). SQLite keeps only an opaque reference.
 * The Host reads a key back for a run; the browser never can.
 */
export interface CredentialStore {
  /** False when this computer offers no protected store: saving a key is refused, never written in plain text. */
  readonly persistent: boolean
  /** Saves the key under a new reference and returns it. */
  save(secret: string): Promise<string>
  /** Throws `CredentialError('CREDENTIAL_UNAVAILABLE')` when the key cannot be read on this account. */
  read(reference: string): Promise<string>
  remove(reference: string): Promise<void>
}

export type CredentialErrorCode = 'CREDENTIAL_STORE_UNAVAILABLE' | 'CREDENTIAL_UNAVAILABLE' | 'CREDENTIAL_NOT_SAVED'

/** The message never holds a key, a path or a system error text. */
export class CredentialError extends Error {
  constructor(readonly code: CredentialErrorCode) {
    super(code === 'CREDENTIAL_STORE_UNAVAILABLE' ? 'This computer has no supported protected key store'
      : code === 'CREDENTIAL_UNAVAILABLE' ? 'The saved key cannot be read on this computer account'
        : 'The key could not be saved')
    this.name = 'CredentialError'
  }
}

const reference = /^cred-[0-9a-f-]{36}$/

/** Windows CurrentUser DPAPI. Secret bytes travel on stdin, never in command arguments, and no output is kept. */
export function windowsDataProtection(operation: 'Protect' | 'Unprotect', bytes: Buffer): Promise<Buffer> {
  const script = `$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$bytes = [Convert]::FromBase64String([Console]::In.ReadToEnd())
$result = [Security.Cryptography.ProtectedData]::${operation}($bytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
[Console]::Write([Convert]::ToBase64String($result))`
  const deadline = AbortSignal.timeout(30_000)
  const system = process.env.SystemRoot ?? 'C:\\Windows'
  return new Promise((resolve, reject) => {
    const child = execFile(
      join(system, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
      { windowsHide: true, signal: deadline, maxBuffer: 65536, encoding: 'utf8' },
      (error, stdout) => {
        if (error) { reject(new CredentialError(operation === 'Protect' ? 'CREDENTIAL_NOT_SAVED' : 'CREDENTIAL_UNAVAILABLE')); return }
        const encoded = stdout.trim()
        const result = Buffer.from(encoded, 'base64')
        if (!result.length || result.toString('base64') !== encoded)
          reject(new CredentialError(operation === 'Protect' ? 'CREDENTIAL_NOT_SAVED' : 'CREDENTIAL_UNAVAILABLE'))
        else resolve(result)
      },
    )
    // Pipe diagnostics could echo the input; they are ignored.
    child.stdin?.on('error', () => {})
    child.stdin?.end(bytes.toString('base64'))
  })
}

/**
 * One file per key in the `credentials` folder of Application Storage, holding only protected bytes.
 * The folder is never a project folder, a chat artifact or an export.
 */
export class ProtectedFileCredentialStore implements CredentialStore {
  readonly persistent = true

  constructor(
    private readonly folder: string,
    private readonly protect: (bytes: Buffer) => Promise<Buffer>,
    private readonly unprotect: (bytes: Buffer) => Promise<Buffer>,
  ) {}

  async save(secret: string): Promise<string> {
    const name = `cred-${randomUUID()}`
    const protectedBytes = await this.protect(Buffer.from(secret, 'utf8'))
    try {
      await mkdir(this.folder, { recursive: true, mode: 0o700 })
      const temporary = join(this.folder, `${name}.tmp`)
      await writeFile(temporary, protectedBytes.toString('base64'), { flag: 'wx', mode: 0o600 })
      await rename(temporary, join(this.folder, `${name}.key`))
    } catch {
      await rm(join(this.folder, `${name}.tmp`), { force: true }).catch(() => {})
      throw new CredentialError('CREDENTIAL_NOT_SAVED')
    }
    return name
  }

  /** Keeps protected bytes produced by an earlier version unchanged (no plain key is ever handled here). */
  async adopt(protectedBase64: string): Promise<string> {
    const name = `cred-${randomUUID()}`
    await mkdir(this.folder, { recursive: true, mode: 0o700 })
    await writeFile(join(this.folder, `${name}.key`), protectedBase64, { flag: 'wx', mode: 0o600 })
    return name
  }

  async read(name: string): Promise<string> {
    if (!reference.test(name)) throw new CredentialError('CREDENTIAL_UNAVAILABLE')
    let stored: string
    try {
      stored = (await readFile(join(this.folder, `${name}.key`), 'utf8')).trim()
    } catch {
      throw new CredentialError('CREDENTIAL_UNAVAILABLE')
    }
    const bytes = Buffer.from(stored, 'base64')
    if (!bytes.length || bytes.toString('base64') !== stored) throw new CredentialError('CREDENTIAL_UNAVAILABLE')
    const secret = (await this.unprotect(bytes)).toString('utf8')
    if (!secret) throw new CredentialError('CREDENTIAL_UNAVAILABLE')
    return secret
  }

  async remove(name: string): Promise<void> {
    if (!reference.test(name)) return
    await rm(join(this.folder, `${name}.key`), { force: true })
  }
}

/** No protected store on this computer: keys are refused instead of kept in plain text. */
export class UnavailableCredentialStore implements CredentialStore {
  readonly persistent = false
  async save(): Promise<string> { throw new CredentialError('CREDENTIAL_STORE_UNAVAILABLE') }
  async read(): Promise<string> { throw new CredentialError('CREDENTIAL_UNAVAILABLE') }
  async remove(): Promise<void> {}
}

/**
 * The supported store of this OS. Windows: DPAPI (CurrentUser) files under Application Storage.
 * Other systems are not supported yet (B08 ships only platforms with evidence), so their keys are refused.
 */
export function defaultCredentialStore(root: string, platform: NodeJS.Platform = process.platform): CredentialStore {
  if (platform === 'win32')
    return new ProtectedFileCredentialStore(join(root, 'credentials'),
      bytes => windowsDataProtection('Protect', bytes), bytes => windowsDataProtection('Unprotect', bytes))
  return new UnavailableCredentialStore()
}

import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { RuntimeError } from '@deckagent/agent-runtime'
import type { ModelConnection } from '@deckagent/model-providers'
import { readLocal, writeLocal } from './local-files.ts'

export interface CredentialVault {
  readonly available: boolean
  read(connection: ModelConnection): Promise<string | undefined>
  write(connection: ModelConnection, credential: string): Promise<void>
}

/** Credentials are encrypted for this Windows user. No plaintext fallback on other OSes. */
export class WindowsCredentialVault implements CredentialVault {
  readonly available = process.platform === 'win32'
  constructor(private readonly dataDir: string) {}

  async read(connection: ModelConnection): Promise<string | undefined> {
    if (!this.available) return undefined
    const bytes = await readLocal(this.path(connection))
    if (!bytes) return undefined
    return (await this.transform('Unprotect', bytes)).toString('utf8')
  }

  async write(connection: ModelConnection, credential: string): Promise<void> {
    if (!this.available) throw new RuntimeError('CLI_CREDENTIALS', 'Persistent credentials are currently supported on Windows only. Use environment variables or enter the key for this run')
    const encrypted = await this.transform('Protect', Buffer.from(credential, 'utf8'))
    await writeLocal(this.path(connection), encrypted)
  }

  private path(connection: ModelConnection): string {
    const identity = JSON.stringify([connection.id, connection.protocol, connection.baseUrl.replace(/\/+$/, ''), connection.apiKeyEnv ?? null])
    return join(this.dataDir, 'credentials', createHash('sha256').update(identity).digest('hex') + '.dpapi')
  }

  private transform(operation: 'Protect' | 'Unprotect', bytes: Buffer): Promise<Buffer> {
    // The encoded script is constant; the credential travels on stdin, never in process arguments.
    const script = `$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$bytes = [Convert]::FromBase64String([Console]::In.ReadToEnd())
$result = [Security.Cryptography.ProtectedData]::${operation}($bytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
[Console]::Write([Convert]::ToBase64String($result))`
    return new Promise((resolve, reject) => {
      const child = execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {
        windowsHide: true, timeout: 10000, maxBuffer: 65536, encoding: 'utf8',
      }, (error, stdout) => {
        if (error) reject(new RuntimeError('CLI_CREDENTIALS', 'Cannot access saved Windows credentials. Enter the key again or check Windows DPAPI availability'))
        else resolve(Buffer.from(stdout.trim(), 'base64'))
      })
      child.stdin?.on('error', () => {}) // Process errors are reported by execFile without exposing input.
      child.stdin?.end(bytes.toString('base64'))
    })
  }
}

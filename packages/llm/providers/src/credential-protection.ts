import { execFile } from 'node:child_process'
import { RuntimeError } from '@deckagent/agent-runtime'

/** Windows CurrentUser DPAPI. Secret bytes travel on stdin, never command arguments. */
export function transformCredential(operation: 'Protect' | 'Unprotect', bytes: Buffer): Promise<Buffer> {
  if (process.platform !== 'win32')
    throw new RuntimeError('PROVIDER_CREDENTIALS', 'Persistent keys require Windows DPAPI')
  const script = `$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$bytes = [Convert]::FromBase64String([Console]::In.ReadToEnd())
$result = [Security.Cryptography.ProtectedData]::${operation}($bytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
[Console]::Write([Convert]::ToBase64String($result))`
  return new Promise((resolve, reject) => {
    const child = execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
      {
        windowsHide: true,
        timeout: 10000,
        maxBuffer: 65536,
        encoding: 'utf8',
      },
      (error, stdout) => {
        if (error) reject(new RuntimeError('PROVIDER_CREDENTIALS', 'Cannot access Windows encrypted credentials'))
        else resolve(Buffer.from(stdout.trim(), 'base64'))
      },
    )
    // execFile reports process failure; never publish pipe diagnostics containing input.
    child.stdin?.on('error', () => {})
    child.stdin?.end(bytes.toString('base64'))
  })
}

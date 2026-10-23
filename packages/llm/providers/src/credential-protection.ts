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
  // Include cold PowerShell/.NET startup, while bounding hung credential operations.
  const deadline = AbortSignal.timeout(30_000)
  return new Promise((resolve, reject) => {
    const child = execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
      {
        windowsHide: true,
        signal: deadline,
        maxBuffer: 65536,
        encoding: 'utf8',
      },
      (error, stdout) => {
        if (error) reject(new RuntimeError('PROVIDER_CREDENTIALS', deadline.aborted
          ? 'Windows credential operation timed out after 30 seconds'
          : 'Cannot access Windows encrypted credentials'))
        else {
          const encoded = stdout.trim()
          const result = Buffer.from(encoded, 'base64')
          if (!result.length || result.toString('base64') !== encoded)
            reject(new RuntimeError('PROVIDER_CREDENTIALS', 'Windows credential operation returned invalid output'))
          else resolve(result)
        }
      },
    )
    // execFile reports process failure; never publish pipe diagnostics containing input.
    child.stdin?.on('error', () => {})
    child.stdin?.end(bytes.toString('base64'))
  })
}

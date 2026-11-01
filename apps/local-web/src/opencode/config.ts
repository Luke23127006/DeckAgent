import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { isDeepStrictEqual } from 'node:util'

export function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** No inherited credentials, provider overrides, plugins or user/project settings. */
export async function isolatedEnvironment(root: string, key: string): Promise<NodeJS.ProcessEnv> {
  const env: NodeJS.ProcessEnv = {}
  for (const name of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'PATH'])
    if (process.env[name]) env[name] = process.env[name]
  for (const [index, name] of [
    'HOME',
    'USERPROFILE',
    'XDG_CONFIG_HOME',
    'XDG_DATA_HOME',
    'XDG_STATE_HOME',
    'XDG_CACHE_HOME',
    'OPENCODE_CONFIG_DIR',
  ].entries()) {
    env[name] = join(root, String(index))
    await mkdir(env[name], { recursive: true })
  }
  return Object.assign(env, {
    OPENCODE_DISABLE_PROJECT_CONFIG: 'true',
    OPENCODE_DISABLE_AUTOUPDATE: 'true',
    OPENCODE_DISABLE_DEFAULT_PLUGINS: 'true',
    DECKAGENT_REQUEST_KEY: key,
  })
}

export function toolPermissions(allowed: readonly string[]) {
  return Object.fromEntries([['*', 'deny'], ...allowed.map(name => [`deckagent_${name}`, 'allow'])])
}

/** The pinned CLI redacts MCP authorization in debug config. Never persist that output. */
export function safeConfiguration(
  resolved: unknown,
  expected: {
    readonly permission: Readonly<Record<string, string>>
    readonly mcp: { readonly deckagent: Readonly<Record<string, unknown>> }
  },
): boolean {
  const mcp = { deckagent: { ...expected.mcp.deckagent, headers: { Authorization: '***' } } }
  return (
    object(resolved) &&
    isDeepStrictEqual(resolved.permission, expected.permission) &&
    isDeepStrictEqual(resolved.mcp, mcp) &&
    Array.isArray(resolved.plugin) &&
    resolved.plugin.length === 0 &&
    object(resolved.agent) &&
    Object.keys(resolved.agent).join() === 'deckagent' &&
    object(resolved.agent.deckagent) &&
    isDeepStrictEqual(resolved.agent.deckagent.permission, expected.permission)
  )
}

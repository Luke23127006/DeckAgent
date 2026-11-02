import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { isDeepStrictEqual } from 'node:util'

/** The CLI substitutes file/env references before JSON parsing. Keep every value literal. */
export function encodeConfiguration(value: unknown): string {
  const text = JSON.stringify(value)
  if (typeof text !== 'string') throw new Error('OpenCode configuration is unavailable')
  return text.replace(/\{(?=(?:file|env):)/g, '\\u007b')
}

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
    readonly enabled_providers?: readonly string[]
    readonly small_model?: string
    readonly compaction?: Readonly<Record<string, boolean>>
    readonly provider?: Readonly<Record<string, unknown>>
  },
): boolean {
  const mcp = { deckagent: { ...expected.mcp.deckagent, headers: { Authorization: '***' } } }
  const withoutKeys = (value: unknown) => {
    if (!object(value)) return value
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => {
        if (!object(item) || !object(item.options)) return [name, item]
        const { apiKey: _redacted, ...options } = item.options
        return [name, { ...item, options }]
      }),
    )
  }
  return (
    object(resolved) &&
    isDeepStrictEqual(resolved.permission, expected.permission) &&
    isDeepStrictEqual(resolved.mcp, mcp) &&
    Array.isArray(resolved.plugin) &&
    resolved.plugin.length === 0 &&
    object(resolved.agent) &&
    Object.keys(resolved.agent).join() === 'deckagent' &&
    object(resolved.agent.deckagent) &&
    isDeepStrictEqual(resolved.agent.deckagent.permission, expected.permission) &&
    (expected.enabled_providers === undefined ||
      isDeepStrictEqual(resolved.enabled_providers, expected.enabled_providers)) &&
    (expected.small_model === undefined || resolved.small_model === expected.small_model) &&
    (expected.compaction === undefined || isDeepStrictEqual(resolved.compaction, expected.compaction)) &&
    (expected.provider === undefined ||
      isDeepStrictEqual(withoutKeys(resolved.provider), withoutKeys(expected.provider)))
  )
}

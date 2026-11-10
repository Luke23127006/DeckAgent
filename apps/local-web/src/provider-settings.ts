import type { DatabaseSync } from 'node:sqlite'
import { ModelProviders, transformCredential } from '@deckagent/model-providers'
import type { ModelConnection } from '@deckagent/model-providers'
import type { ModelSelection } from '@deckagent/session-persistence'
import { HttpError } from '@deckagent/host-api'
import type { ProviderSettings, WebSettings } from '@deckagent/host-api'
import { record } from './web-state.ts'
import { builtInProviders } from './built-in-providers.ts'

interface SavedProvider {
  readonly connection: ModelConnection
  readonly displayName: string
  readonly models: readonly string[]
  readonly encryptedKey?: string
}

function parseProvider(id: string, value: unknown): { saved: SavedProvider; key?: string } {
  if (
    !record(value) ||
    Object.keys(value).some(key => !['displayName', 'protocol', 'baseUrl', 'models', 'key'].includes(key)) ||
    !/^[\w.-]{1,100}$/.test(id) ||
    typeof value.displayName !== 'string' ||
    !value.displayName.trim() ||
    value.displayName.length > 100 ||
    (value.protocol !== 'gemini' && value.protocol !== 'chat-completions' && value.protocol !== 'anthropic-messages') ||
    typeof value.baseUrl !== 'string' ||
    value.baseUrl.length > 2048 ||
    !Array.isArray(value.models) ||
    value.models.length > 100 ||
    value.models.some(model => typeof model !== 'string' || !/^[\x21-\x7e]{1,200}$/.test(model)) ||
    new Set(value.models).size !== value.models.length ||
    (value.key !== undefined &&
      (typeof value.key !== 'string' || (value.key !== '' && !/^[\x21-\x7e]{1,4096}$/.test(value.key))))
  ) {
    throw new HttpError(400, 'INVALID_PROVIDER')
  }
  const connection: ModelConnection = { id, protocol: value.protocol, baseUrl: value.baseUrl }
  const builtIn = builtInProviders.find(provider => provider.id === id)
  if (builtIn && (connection.protocol !== builtIn.protocol || connection.baseUrl !== builtIn.baseUrl))
    throw new HttpError(400, 'INVALID_PROVIDER')
  try {
    new ModelProviders([connection])
  } catch {
    throw new HttpError(400, 'INVALID_PROVIDER')
  }
  // Array entries were checked above; copy through a narrowing map rather than trust incoming objects.
  const models = value.models.map(model => {
    if (typeof model !== 'string') throw new HttpError(400, 'INVALID_PROVIDER')
    return model
  })
  if (connection.protocol === 'gemini' && models.some(model => !/^[A-Za-z0-9._-]+$/.test(model)))
    throw new HttpError(400, 'INVALID_PROVIDER')
  return {
    saved: { connection, displayName: value.displayName.trim(), models },
    ...(typeof value.key === 'string' ? { key: value.key } : {}),
  }
}

/** Owns provider settings and credential snapshots. Requests capture settings at admission (B02). */
export class ProviderStore {
  private readonly providers = new Map<string, SavedProvider>()
  private readonly keys = new Map<string, string>()
  private readonly deleted = new Set<string>()
  private mutation: Promise<void> = Promise.resolve()
  private readonly catalogAbort = new AbortController()

  constructor(private readonly db: DatabaseSync) {}

  async load(connections: readonly ModelConnection[] = [], initial?: ModelSelection): Promise<void> {
    for (const row of this.db.prepare('SELECT id, payload FROM providers').all()) {
      const data: unknown = JSON.parse(String(row.payload))
      if (record(data) && data.deleted === true && Object.keys(data).length === 1) {
        this.deleted.add(String(row.id))
        continue
      }
      if (!record(data) || !record(data.connection)) throw new HttpError(500, 'SETTINGS_STORAGE')
      const parsed = parseProvider(String(row.id), {
        displayName: data.displayName,
        protocol: data.connection.protocol,
        baseUrl: data.connection.baseUrl,
        models: data.models,
      })
      const encryptedKey = typeof data.encryptedKey === 'string' ? data.encryptedKey : undefined
      const saved = { ...parsed.saved, ...(encryptedKey ? { encryptedKey } : {}) }
      this.providers.set(String(row.id), saved)
      if (encryptedKey) {
        try {
          this.keys.set(
            String(row.id),
            (await transformCredential('Unprotect', Buffer.from(encryptedKey, 'base64'))).toString('utf8'),
          )
        } catch {
          // Preserve the encrypted value and let Settings repair an unavailable key (e.g. another Windows user).
          this.keys.delete(String(row.id))
        }
      }
    }
    // Explicit CLI bootstrap is compatible with TASK-003; saved Settings take precedence.
    if (initial && !this.providers.has(initial.provider) && !this.deleted.has(initial.provider)) {
      const connection = connections.find(value => value.id === initial.provider)
      if (connection) {
        new ModelProviders([connection])
        const saved = { connection: structuredClone(connection), displayName: connection.id, models: [initial.model] }
        this.providers.set(connection.id, saved)
        const key = connection.apiKeyEnv ? process.env[connection.apiKeyEnv] : undefined
        if (key) this.keys.set(connection.id, key)
      }
    }
  }

  snapshot(): WebSettings {
    const providers: ProviderSettings[] = [...this.providers.values()].map(value => ({
      id: value.connection.id,
      displayName: value.displayName,
      protocol: value.connection.protocol,
      baseUrl: value.connection.baseUrl,
      models: [...value.models],
      hasKey: !!value.encryptedKey || this.keys.has(value.connection.id),
      keyAvailable: this.keys.has(value.connection.id),
    }))
    return { providers, persistentKeys: process.platform === 'win32', builtIns: builtInProviders }
  }

  save(id: string, value: unknown): Promise<void> {
    return this.serialize(async () => {
      const { saved, key } = parseProvider(id, value)
      const previous = this.providers.get(id)
      if ([...this.providers].some(([other, provider]) => other !== id && provider.displayName === saved.displayName))
        throw new HttpError(409, 'PROVIDER_NAME_EXISTS')
      if (previous && previous.connection.protocol !== saved.connection.protocol)
        throw new HttpError(409, 'PROTOCOL_IMMUTABLE')
      if (
        previous &&
        previous.connection.baseUrl !== saved.connection.baseUrl &&
        key === undefined &&
        (this.keys.has(id) || !!previous.encryptedKey)
      )
        throw new HttpError(409, 'NEW_ENDPOINT_REQUIRES_KEY')
      const credential = key === undefined ? this.keys.get(id) : key || undefined
      if (builtInProviders.some(provider => provider.id === id) && !credential)
        throw new HttpError(400, 'PROVIDER_CREDENTIALS')
      const encryptedKey = credential
        ? (await transformCredential('Protect', Buffer.from(credential))).toString('base64')
        : key === undefined
          ? previous?.encryptedKey
          : undefined
      const stored: SavedProvider = { ...saved, ...(encryptedKey ? { encryptedKey } : {}) }
      this.db
        .prepare(
          'INSERT INTO providers(id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
        )
        .run(id, JSON.stringify(stored))
      this.providers.set(id, stored)
      this.deleted.delete(id)
      if (credential) this.keys.set(id, credential)
      else this.keys.delete(id)
    })
  }

  remove(id: string): Promise<void> {
    return this.serialize(async () => {
      if (!this.providers.has(id)) throw new HttpError(404, 'PROVIDER_NOT_FOUND')
      // A tombstone prevents old CLI bootstrap flags from resurrecting a deleted configuration.
      this.db
        .prepare(
          'INSERT INTO providers(id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
        )
        .run(id, JSON.stringify({ deleted: true }))
      this.providers.delete(id)
      this.deleted.add(id)
      this.keys.delete(id)
    })
  }

  async catalog(id: string): Promise<readonly string[]> {
    const saved = this.providers.get(id)
    if (!saved) throw new HttpError(404, 'PROVIDER_NOT_FOUND')
    const key = this.keys.get(id)
    const connection = {
      ...saved.connection,
      ...(key || saved.encryptedKey || saved.connection.apiKeyEnv ? { apiKeyEnv: 'CATALOG_KEY' } : {}),
    }
    try {
      return await new ModelProviders([connection], { environment: { CATALOG_KEY: key } }).listModels(
        id,
        this.catalogAbort.signal,
      )
    } catch {
      throw new HttpError(502, 'CATALOG_UNAVAILABLE')
    }
  }

  private serialize(operation: () => Promise<void>): Promise<void> {
    const work = this.mutation.then(operation)
    // The caller receives failure; the queue remains usable for the next settings change.
    this.mutation = work.catch(() => {})
    return work
  }

  async close(): Promise<void> {
    this.catalogAbort.abort()
    await this.mutation
    this.keys.clear()
  }
}

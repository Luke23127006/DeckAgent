import type { DatabaseSync } from 'node:sqlite'
import { ModelProviders, transformCredential } from '@deckagent/model-providers'
import type { ModelConnection } from '@deckagent/model-providers'
import type { ModelAdapter, ModelSelection } from '@deckagent/agent-runtime'
import { HttpError } from '@deckagent/host-api'
import type { ModelDescriptor, ProviderSettings, WebSettings } from '@deckagent/host-api'
import { record } from './web-state.ts'
import { builtInProviders } from './built-in-providers.ts'

interface SavedProvider {
  readonly connection: ModelConnection
  readonly displayName: string
  readonly models: readonly string[]
  readonly modelMetadata: readonly ModelDescriptor[]
  readonly encryptedKey?: string
}

function parseProvider(id: string, value: unknown): { saved: SavedProvider; key?: string } {
  if (
    !record(value) ||
    Object.keys(value).some(key => !['displayName', 'protocol', 'baseUrl', 'models', 'modelMetadata', 'key'].includes(key)) ||
    !/^[\w.-]{1,100}$/.test(id) ||
    typeof value.displayName !== 'string' ||
    !value.displayName.trim() ||
    value.displayName.length > 100 ||
    (value.protocol !== 'gemini' && value.protocol !== 'chat-completions' && value.protocol !== 'responses' && value.protocol !== 'anthropic-messages') ||
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
  const rawMetadata = value.modelMetadata ?? []
  if (!Array.isArray(rawMetadata) || rawMetadata.length > models.length) throw new HttpError(400, 'INVALID_MODEL_METADATA')
  const seen = new Set<string>()
  const modelMetadata: ModelDescriptor[] = rawMetadata.map((item: unknown) => {
    if (!record(item) || Object.keys(item).some(key => !['provider', 'model', 'displayName', 'contextWindow', 'maxOutputTokens', 'inputModalities', 'reasoningOptions'].includes(key)) ||
      item.provider !== id || typeof item.model !== 'string' || !models.includes(item.model) || seen.has(item.model) ||
      (item.displayName !== undefined && (typeof item.displayName !== 'string' || !item.displayName.trim() || item.displayName.length > 100)) ||
      (item.contextWindow !== undefined && (!Number.isSafeInteger(item.contextWindow) || Number(item.contextWindow) < 1 || Number(item.contextWindow) > 2_147_483_647)) ||
      (item.maxOutputTokens !== undefined && (!Number.isSafeInteger(item.maxOutputTokens) || Number(item.maxOutputTokens) < 1 || Number(item.maxOutputTokens) > 2_147_483_647)) ||
      (item.inputModalities !== undefined && (!Array.isArray(item.inputModalities) || new Set(item.inputModalities).size !== item.inputModalities.length || item.inputModalities.some(value => !['text', 'image', 'audio', 'video'].includes(value)))) ||
      (item.reasoningOptions !== undefined && (!Array.isArray(item.reasoningOptions) || connection.protocol !== 'responses' || item.reasoningOptions.length > 20 || item.reasoningOptions.some(option => !record(option) || Object.keys(option).some(key => !['label', 'apiValue'].includes(key)) || typeof option.label !== 'string' || !option.label.trim() || option.label.length > 100 || typeof option.apiValue !== 'string' || !/^[a-z][a-z0-9_-]{0,50}$/.test(option.apiValue)))))
      throw new HttpError(400, 'INVALID_MODEL_METADATA')
    seen.add(item.model)
    const descriptor: ModelDescriptor = { provider: id, model: item.model,
      ...(typeof item.displayName === 'string' ? { displayName: item.displayName.trim() } : {}),
      ...(typeof item.contextWindow === 'number' ? { contextWindow: item.contextWindow } : {}),
      ...(typeof item.maxOutputTokens === 'number' ? { maxOutputTokens: item.maxOutputTokens } : {}),
      ...(Array.isArray(item.inputModalities) ? { inputModalities: item.inputModalities.map((value: unknown) => {
        if (value === 'text' || value === 'image' || value === 'audio' || value === 'video') return value
        throw new HttpError(400, 'INVALID_MODEL_METADATA')
      }) } : {}),
      ...(Array.isArray(item.reasoningOptions) ? { reasoningOptions: item.reasoningOptions.map((option: unknown) => {
        if (!record(option) || typeof option.label !== 'string' || typeof option.apiValue !== 'string')
          throw new HttpError(400, 'INVALID_MODEL_METADATA')
        return { label: option.label, apiValue: option.apiValue }
      }) } : {}),
    }
    return descriptor
  })
  for (const metadata of modelMetadata) {
    if (metadata.maxOutputTokens && metadata.contextWindow && metadata.maxOutputTokens > metadata.contextWindow)
      throw new HttpError(400, 'INVALID_MODEL_METADATA')
    if (metadata.reasoningOptions && (new Set(metadata.reasoningOptions.map(option => option.label)).size !== metadata.reasoningOptions.length ||
      new Set(metadata.reasoningOptions.map(option => option.apiValue)).size !== metadata.reasoningOptions.length))
      throw new HttpError(400, 'INVALID_MODEL_METADATA')
  }
  return {
    saved: { connection, displayName: value.displayName.trim(), models, modelMetadata },
    ...(typeof value.key === 'string' ? { key: value.key } : {}),
  }
}

/** Owns settings and credential snapshots; a request releases its provider lease after disposal. */
export class ProviderStore {
  private readonly providers = new Map<string, SavedProvider>()
  private readonly keys = new Map<string, string>()
  private readonly active = new Map<string, number>()
  private readonly deleted = new Set<string>()
  private mutation: Promise<void> = Promise.resolve()
  private readonly catalogAbort = new AbortController()

  constructor(
    private readonly db: DatabaseSync,
    private readonly fixture?: { model: ModelAdapter; selection: ModelSelection },
  ) {}

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
        modelMetadata: data.modelMetadata,
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
        const saved = { connection: structuredClone(connection), displayName: connection.id, models: [initial.model], modelMetadata: [] }
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
      modelMetadata: structuredClone(value.modelMetadata),
      hasKey: !!value.encryptedKey || this.keys.has(value.connection.id),
      keyAvailable: this.keys.has(value.connection.id),
    }))
    if (this.fixture && !providers.some(provider => provider.id === this.fixture!.selection.provider))
      providers.push({
        id: this.fixture.selection.provider,
        displayName: this.fixture.selection.provider,
        protocol: 'chat-completions',
        baseUrl: 'http://127.0.0.1',
        models: [this.fixture.selection.model],
        modelMetadata: [],
        hasKey: false,
        keyAvailable: false,
      })
    return { providers, persistentKeys: process.platform === 'win32', builtIns: builtInProviders }
  }

  save(id: string, value: unknown): Promise<void> {
    return this.serialize(async () => {
      let { saved, key } = parseProvider(id, value)
      const previous = this.providers.get(id)
      if (record(value) && value.modelMetadata === undefined && previous)
        saved = { ...saved, modelMetadata: previous.modelMetadata.filter(item => saved.models.includes(item.model)) }
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
      if (this.active.get(id)) throw new HttpError(409, 'PROVIDER_BUSY')
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

  capture(chosen: ModelSelection): { model: ModelAdapter; release: () => void } {
    let model: ModelAdapter
    if (
      this.fixture &&
      chosen.provider === this.fixture.selection.provider &&
      chosen.model === this.fixture.selection.model
    )
      model = this.fixture.model
    else {
      const saved = this.providers.get(chosen.provider)
      if (!saved?.models.includes(chosen.model)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
      const key = this.keys.get(chosen.provider)
      const metadata = saved.modelMetadata.find(item => item.model === chosen.model)
      const connection = {
        ...saved.connection,
        ...(key || saved.encryptedKey || saved.connection.apiKeyEnv ? { apiKeyEnv: 'REQUEST_KEY' } : {}),
        ...(metadata?.maxOutputTokens ? { maxOutputTokens: metadata.maxOutputTokens } : {}),
        ...(metadata?.reasoningOptions ? { reasoningOptions: metadata.reasoningOptions } : {}),
      }
      const adapter = new ModelProviders([connection], { environment: { REQUEST_KEY: key } })
      adapter.validateSelection(chosen)
      model = adapter
    }
    this.active.set(chosen.provider, (this.active.get(chosen.provider) ?? 0) + 1)
    let released = false
    return {
      model,
      release: () => {
        if (released) return
        released = true
        const count = (this.active.get(chosen.provider) ?? 1) - 1
        if (count) this.active.set(chosen.provider, count)
        else this.active.delete(chosen.provider)
      },
    }
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

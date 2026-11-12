import type { DatabaseSync } from 'node:sqlite'
import { HttpError } from '@deckagent/host-api'
import type { ModelSelection, ProviderProtocol, ProviderSettings, ProviderTemplate } from '@deckagent/host-api'
import { builtInProviders } from './built-in-providers.ts'
import { CredentialError, ProtectedFileCredentialStore } from './credential-store.ts'
import type { CredentialStore } from './credential-store.ts'
import { ProviderCheckError, listModels, validBaseUrl } from './provider-catalog.ts'
import type { ProviderEndpoint } from './provider-catalog.ts'

export const protocols: readonly ProviderProtocol[] = ['chat-completions', 'responses', 'anthropic-messages', 'gemini']

/** A connection given at startup (CLI flags); its key stays in the environment and is never saved. */
export interface ProviderConnection {
  readonly id: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  /** Name of an environment variable, never the key itself. */
  readonly apiKeyEnv?: string
}

/** The provider settings a request runs with, frozen at admission (FR-042). Host-only: it holds the key. */
export interface ProviderRunSettings {
  readonly provider: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  readonly model: string
  readonly key?: string
}

interface SavedProvider {
  readonly id: string
  readonly displayName: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  readonly models: readonly string[]
  /** Opaque reference into the credential store; SQLite never holds key bytes. */
  readonly credentialRef?: string
  /** Given at startup, kept in memory only. */
  readonly bootstrap?: true
}

interface ProviderInput {
  readonly displayName: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  readonly models: readonly string[]
  /** `undefined` keeps the saved key; `''` removes it (custom model API only). */
  readonly key?: string
  readonly isNew: boolean
}

export interface ProviderStoreOptions {
  /** The connection and key check before saving (FR-041). Tests replace it; it never runs a model. */
  readonly check?: (endpoint: ProviderEndpoint, key: string | undefined) => Promise<void>
  readonly catalog?: (endpoint: ProviderEndpoint, key: string | undefined, signal: AbortSignal) => Promise<readonly string[]>
  /** Chats that selected a removed model lose the selection (FR-065). `undefined` means every model of the provider. */
  readonly modelsRemoved?: (provider: string, models: readonly string[] | undefined) => Promise<void>
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const providerId = /^[\w.-]{1,100}$/
const modelId = /^[\x21-\x7e]{1,200}$/
const keyText = /^[\x21-\x7e]{1,4096}$/

function parse(id: string, value: unknown): ProviderInput {
  if (!record(value) || Object.keys(value).some(key => !['displayName', 'protocol', 'baseUrl', 'models', 'key', 'new'].includes(key)) ||
    !providerId.test(id) || typeof value.displayName !== 'string' || !value.displayName.trim() || value.displayName.length > 100 ||
    !protocols.includes(value.protocol as ProviderProtocol) || typeof value.baseUrl !== 'string' ||
    !Array.isArray(value.models) || value.models.length > 100 ||
    value.models.some(model => typeof model !== 'string' || !modelId.test(model)) || new Set(value.models).size !== value.models.length ||
    (value.key !== undefined && (typeof value.key !== 'string' || (value.key !== '' && !keyText.test(value.key)))) ||
    (value.new !== undefined && typeof value.new !== 'boolean'))
    throw new HttpError(400, 'INVALID_PROVIDER')
  if (!validBaseUrl(value.baseUrl)) throw new HttpError(400, 'INVALID_PROVIDER', { field: 'baseUrl' })
  const protocol = value.protocol as ProviderProtocol
  const models = value.models.map(model => String(model))
  if (protocol === 'gemini' && models.some(model => !/^[A-Za-z0-9._-]+$/.test(model))) throw new HttpError(400, 'INVALID_PROVIDER', { field: 'models' })
  return {
    displayName: value.displayName.trim(), protocol, baseUrl: value.baseUrl, models,
    ...(typeof value.key === 'string' ? { key: value.key } : {}), isNew: value.new === true,
  }
}

/** Failed checks save nothing and say which kind of refusal it was; no provider text is passed on. */
function checkFailure(error: unknown): HttpError {
  if (error instanceof ProviderCheckError) {
    if (error.code === 'PROVIDER_REFUSED_KEY') return new HttpError(422, 'PROVIDER_KEY_REFUSED')
    if (error.code === 'PROVIDER_NO_ANSWER') return new HttpError(504, 'PROVIDER_NO_ANSWER')
    if (error.code === 'PROVIDER_TLS') return new HttpError(504, 'PROVIDER_NO_ANSWER', { reason: 'certificate' })
    if (error.code === 'PROVIDER_RATE_LIMIT') return new HttpError(422, 'PROVIDER_CHECK_FAILED', { reason: 'rate-limit' })
    if (error.code === 'PROVIDER_HTTP') return new HttpError(422, 'PROVIDER_CHECK_FAILED', { reason: `http-${error.status ?? 0}` })
    return new HttpError(422, 'PROVIDER_CHECK_FAILED', { reason: 'protocol' })
  }
  return new HttpError(504, 'PROVIDER_NO_ANSWER')
}

/**
 * Provider configurations and added models (BR-005, BR-008). SQLite keeps non-secret metadata and a credential
 * reference; the credential store keeps the key. Changes apply to requests that start later (FR-042).
 */
export class ProviderStore {
  private readonly providers = new Map<string, SavedProvider>()
  /** Keys read for this Host process. Never returned to the browser, never persisted elsewhere. */
  private readonly keys = new Map<string, string>()
  private readonly deleted = new Set<string>()
  private mutation: Promise<void> = Promise.resolve()
  private readonly catalogAbort = new AbortController()

  constructor(private readonly db: DatabaseSync, private readonly credentials: CredentialStore, private readonly options: ProviderStoreOptions = {}) {}

  async load(connections: readonly ProviderConnection[] = [], initial?: ModelSelection): Promise<void> {
    const reads: Promise<void>[] = []
    for (const row of this.db.prepare('SELECT id, payload FROM providers').all()) {
      const id = String(row.id)
      const data: unknown = JSON.parse(String(row.payload))
      if (record(data) && data.deleted === true && Object.keys(data).length === 1) { this.deleted.add(id); continue }
      if (!record(data)) throw new HttpError(500, 'SETTINGS_STORAGE')
      // Older files kept the protected key inside the provider row (B01). It moves to the credential store unchanged.
      let credentialRef = typeof data.credentialRef === 'string' ? data.credentialRef : undefined
      if (typeof data.encryptedKey === 'string' && this.credentials instanceof ProtectedFileCredentialStore) {
        credentialRef = await this.credentials.adopt(data.encryptedKey)
      }
      const connection = record(data.connection) ? data.connection : data
      const parsed = parse(id, { displayName: data.displayName, protocol: connection.protocol, baseUrl: connection.baseUrl, models: data.models })
      const saved: SavedProvider = { id, displayName: parsed.displayName, protocol: parsed.protocol, baseUrl: parsed.baseUrl, models: parsed.models,
        ...(credentialRef ? { credentialRef } : {}) }
      if (typeof data.encryptedKey === 'string' || record(data.connection)) this.write(saved)
      this.providers.set(id, saved)
      const reference = credentialRef
      if (reference) reads.push(this.credentials.read(reference).then(key => { this.keys.set(id, key) }, () => {
        // Kept as saved: Settings shows the key is unavailable on this account and lets the user replace it.
      }))
    }
    await Promise.all(reads)
    // Explicit CLI bootstrap: saved Settings take precedence; a deleted configuration stays deleted.
    if (initial && !this.providers.has(initial.provider) && !this.deleted.has(initial.provider)) {
      const connection = connections.find(value => value.id === initial.provider)
      if (connection && protocols.includes(connection.protocol) && validBaseUrl(connection.baseUrl) && providerId.test(connection.id)) {
        this.providers.set(connection.id, { id: connection.id, displayName: connection.id, protocol: connection.protocol, baseUrl: connection.baseUrl,
          models: [initial.model], bootstrap: true })
        const key = connection.apiKeyEnv ? process.env[connection.apiKeyEnv] : undefined
        if (key && keyText.test(key)) this.keys.set(connection.id, key)
      }
    }
  }

  providerSettings(): readonly ProviderSettings[] {
    return [...this.providers.values()].map(value => ({
      id: value.id, displayName: value.displayName, protocol: value.protocol, baseUrl: value.baseUrl, models: [...value.models],
      hasKey: !!value.credentialRef || this.keys.has(value.id), keyAvailable: this.keys.has(value.id),
      builtIn: builtInProviders.some(template => template.id === value.id),
    }))
  }

  get persistentKeys(): boolean { return this.credentials.persistent }
  get builtIns(): readonly ProviderTemplate[] { return builtInProviders }

  /** A selectable model is an added model of a saved provider configuration (BR-005 V-3). */
  selectable(selection: ModelSelection | undefined): boolean {
    return !!selection && !!this.providers.get(selection.provider)?.models.includes(selection.model)
  }

  /** Capture the settings of one request; later changes do not reach it (FR-042). */
  runSettings(selection: ModelSelection): ProviderRunSettings {
    const saved = this.providers.get(selection.provider)
    if (!saved || !saved.models.includes(selection.model)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
    const key = this.keys.get(saved.id)
    if (saved.credentialRef && !key) throw new HttpError(409, 'PROVIDER_KEY_UNAVAILABLE')
    return { provider: saved.id, protocol: saved.protocol, baseUrl: saved.baseUrl, model: selection.model, ...(key ? { key } : {}) }
  }

  save(id: string, value: unknown): Promise<void> {
    return this.serialize(async () => {
      const input = parse(id, value)
      const previous = this.providers.get(id)
      const template = builtInProviders.find(provider => provider.id === id)
      // BR-008: one saved configuration per provider ID; built-in IDs are reserved even before they are saved.
      if (input.isNew && previous) throw new HttpError(409, 'PROVIDER_ID_TAKEN', { provider: previous.displayName })
      if (template && (input.protocol !== template.protocol || input.baseUrl !== template.baseUrl))
        throw new HttpError(409, 'PROVIDER_ID_TAKEN', { provider: template.displayName, builtIn: true })
      if ([...this.providers.values()].some(other => other.id !== id && other.displayName === input.displayName))
        throw new HttpError(409, 'PROVIDER_NAME_EXISTS')
      if (previous && previous.protocol !== input.protocol) throw new HttpError(409, 'PROTOCOL_IMMUTABLE')
      const hadKey = !!previous && (!!previous.credentialRef || this.keys.has(id))
      const endpointChanged = !!previous && previous.baseUrl !== input.baseUrl
      // A saved key is never sent to a new endpoint the user did not give a key for.
      if (endpointChanged && hadKey && input.key === undefined) throw new HttpError(409, 'NEW_ENDPOINT_REQUIRES_KEY')
      if (template && input.key === '') throw new HttpError(400, 'PROVIDER_KEY_REQUIRED', { missing: 'key' })
      const key = input.key === undefined ? this.keys.get(id) : input.key || undefined
      if (template && !key) throw new HttpError(400, 'PROVIDER_KEY_REQUIRED', { missing: 'key' })
      if (input.key && !this.credentials.persistent) throw new HttpError(422, 'CREDENTIAL_STORE_UNAVAILABLE')
      if (!previous || endpointChanged || input.key !== undefined) {
        const endpoint = { protocol: input.protocol, baseUrl: input.baseUrl }
        try {
          if (this.options.check) await this.options.check(endpoint, key)
          else await listModels(endpoint, key, { pages: 1, signal: this.catalogAbort.signal })
        } catch (error) {
          throw checkFailure(error)
        }
      }
      let credentialRef = previous?.credentialRef
      let created: string | undefined
      if (input.key) {
        try {
          created = await this.credentials.save(input.key)
        } catch (error) {
          throw new HttpError(error instanceof CredentialError && error.code === 'CREDENTIAL_STORE_UNAVAILABLE' ? 422 : 500,
            error instanceof CredentialError ? error.code : 'CREDENTIAL_NOT_SAVED')
        }
        credentialRef = created
      } else if (input.key === '') credentialRef = undefined
      const saved: SavedProvider = { id, displayName: input.displayName, protocol: input.protocol, baseUrl: input.baseUrl, models: input.models,
        ...(credentialRef ? { credentialRef } : {}) }
      try {
        this.write(saved)
      } catch {
        if (created) await this.credentials.remove(created).catch(() => {})
        throw new HttpError(500, 'SETTINGS_STORAGE')
      }
      this.providers.set(id, saved)
      this.deleted.delete(id)
      if (input.key) this.keys.set(id, input.key)
      else if (input.key === '') this.keys.delete(id)
      if (previous?.credentialRef && previous.credentialRef !== credentialRef) await this.credentials.remove(previous.credentialRef).catch(() => {})
      const removed = previous?.models.filter(model => !input.models.includes(model)) ?? []
      if (removed.length) await this.options.modelsRemoved?.(id, removed)
    })
  }

  /** Deletes the configuration, its added models and its key from DeckAgent only (FR-063). */
  remove(id: string): Promise<void> {
    return this.serialize(async () => {
      const previous = this.providers.get(id)
      if (!previous) throw new HttpError(404, 'PROVIDER_NOT_FOUND')
      // A tombstone keeps a startup flag from bringing a deleted configuration back.
      this.db.prepare('INSERT INTO providers(id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload')
        .run(id, JSON.stringify({ deleted: true }))
      this.providers.delete(id)
      this.deleted.add(id)
      this.keys.delete(id)
      if (previous.credentialRef) await this.credentials.remove(previous.credentialRef).catch(() => {})
      await this.options.modelsRemoved?.(id, undefined)
    })
  }

  /** The provider's model catalog (FR-058). Changes no added model. */
  async catalog(id: string): Promise<readonly string[]> {
    const saved = this.providers.get(id)
    if (!saved) throw new HttpError(404, 'PROVIDER_NOT_FOUND')
    const endpoint = { protocol: saved.protocol, baseUrl: saved.baseUrl }
    const key = this.keys.get(id)
    try {
      return this.options.catalog ? await this.options.catalog(endpoint, key, this.catalogAbort.signal)
        : await listModels(endpoint, key, { signal: this.catalogAbort.signal, timeoutMs: 30_000 })
    } catch (error) {
      const reason = error instanceof ProviderCheckError ? error.code === 'PROVIDER_REFUSED_KEY' ? 'refused'
        : error.code === 'PROVIDER_NO_ANSWER' || error.code === 'PROVIDER_TLS' ? 'no-answer' : 'unusable' : 'no-answer'
      throw new HttpError(502, 'CATALOG_UNAVAILABLE', { reason })
    }
  }

  async close(): Promise<void> {
    this.catalogAbort.abort()
    await this.mutation
    this.keys.clear()
  }

  private write(saved: SavedProvider): void {
    if (saved.bootstrap) return
    const { id, bootstrap: _bootstrap, ...payload } = saved
    this.db.prepare('INSERT INTO providers(id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload')
      .run(id, JSON.stringify(payload))
  }

  private serialize(operation: () => Promise<void>): Promise<void> {
    const work = this.mutation.then(operation)
    // The caller receives failure; the queue remains usable for the next settings change.
    this.mutation = work.catch(() => {})
    return work
  }
}

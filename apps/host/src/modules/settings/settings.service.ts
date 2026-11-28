import type { ModelSelection, WebPreferences, WebSettings } from '@deckagent/host-contracts'
import type { RuntimeAvailability } from '../../runs/ports.ts'
import type { SqliteSettingsStore } from './settings.store.ts'

export interface SettingsProviders {
  selectable(value: ModelSelection): boolean
  providerSettings(): WebSettings['providers']
  version(): number
  readonly persistentKeys: boolean
  readonly builtIns: WebSettings['builtIns']
}

export interface SettingsServiceDependencies {
  readonly providers: SettingsProviders
  readResearch(): NonNullable<WebSettings['research']>
  runtimeAvailability(): Promise<RuntimeAvailability>
}

/** Owns Host settings projection, Browser preferences and last selectable model choice. */
export class SettingsService {
  constructor(
    private readonly store: SqliteSettingsStore,
    private readonly deps: SettingsServiceDependencies,
  ) {}

  preferencesVersion(): number {
    return this.store.preferencesVersion()
  }

  preferences(): WebPreferences {
    return this.store.preferences()
  }

  savePreferences(theme: WebPreferences['theme'], expectedVersion: number): WebPreferences {
    return this.store.savePreferences(theme, expectedVersion)
  }

  rememberSelection(value: ModelSelection): void {
    this.store.rememberSelection(value)
  }

  /** The most recent choice when it is still selectable; otherwise none. No earlier choice is tried. */
  lastSelection(): ModelSelection | undefined {
    const value = this.store.readLastSelection()
    return value && this.selectable(value) ? value : undefined
  }

  selectable(value: ModelSelection | undefined): boolean {
    return !!value && this.deps.providers.selectable(value)
  }

  async read(): Promise<WebSettings> {
    const availability = await this.deps.runtimeAvailability()
    return {
      research: this.deps.readResearch(),
      providers: this.deps.providers.providerSettings(),
      providersVersion: this.deps.providers.version(),
      preferencesVersion: this.store.preferencesVersion(),
      persistentKeys: this.deps.providers.persistentKeys,
      builtIns: this.deps.providers.builtIns,
      runtime: availability.available ? { available: true } : { available: false, reason: availability.code },
    }
  }
}

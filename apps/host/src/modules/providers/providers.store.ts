import type { DatabaseSync } from 'node:sqlite'

export interface ProviderRow {
  readonly id: string
  readonly payload: string
}

export class SqliteProviderStore {
  constructor(private readonly db: DatabaseSync) {}

  rows(): readonly ProviderRow[] {
    return this.db
      .prepare('SELECT id, payload FROM providers')
      .all()
      .map(row => ({ id: String(row.id), payload: String(row.payload) }))
  }

  version(): number {
    const row = this.db.prepare("SELECT version FROM change_versions WHERE topic = 'providers' AND key = 'host'").get()
    return row ? Number(row.version) : 0
  }

  /** Writes the row and increases the providers version in one transaction. Returns the new version. */
  put(row: ProviderRow): number {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      this.upsert(row)
      this.db
        .prepare("UPDATE change_versions SET version = version + 1 WHERE topic = 'providers' AND key = 'host'")
        .run()
      const version = this.version()
      this.db.exec('COMMIT')
      return version
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }

  /** Writes the row without a version change; used when `load` rewrites an older row. */
  upgrade(row: ProviderRow): void {
    this.upsert(row)
  }

  private upsert(row: ProviderRow): void {
    this.db
      .prepare(
        'INSERT INTO providers(id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
      )
      .run(row.id, row.payload)
  }
}

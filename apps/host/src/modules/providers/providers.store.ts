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

  put(row: ProviderRow): void {
    this.db
      .prepare(
        'INSERT INTO providers(id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
      )
      .run(row.id, row.payload)
  }
}

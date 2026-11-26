import type { DatabaseSync } from 'node:sqlite'

export class SqliteResearchStore {
  constructor(private readonly db: DatabaseSync) {}

  read(): string | undefined {
    const row = this.db.prepare("SELECT value FROM preferences WHERE key = 'research'").get()
    return row ? String(row.value) : undefined
  }

  version(): number {
    const row = this.db
      .prepare("SELECT version FROM change_versions WHERE topic = 'preferences' AND key = 'host'")
      .get()
    return row ? Number(row.version) : 0
  }

  put(payload: string, expectedVersion: number): number | undefined {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      if (this.version() !== expectedVersion) {
        this.db.exec('ROLLBACK')
        return undefined
      }
      this.db
        .prepare(
          "INSERT INTO preferences (key, value) VALUES ('research', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run(payload)
      this.db
        .prepare("UPDATE change_versions SET version = version + 1 WHERE topic = 'preferences' AND key = 'host'")
        .run()
      const version = this.version()
      this.db.exec('COMMIT')
      return version
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }
}

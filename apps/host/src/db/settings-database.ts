import { DatabaseSync } from 'node:sqlite'
import { migrateSettingsDatabase } from './settings.migrations.ts'

/** Shared SQLite connection for `web.sqlite` used by providers, research and settings stores. */
export class SettingsDatabase {
  readonly db: DatabaseSync

  constructor(path: string) {
    this.db = new DatabaseSync(path)
    try {
      migrateSettingsDatabase(this.db)
    } catch (error) {
      this.db.close()
      throw error
    }
  }

  close(): void {
    this.db.close()
  }
}

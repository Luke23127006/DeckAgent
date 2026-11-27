import type { DatabaseSync } from 'node:sqlite'
import { DatabaseError } from './records.ts'

const applicationId = 1145132866
const schemaVersion = 3

const changeVersionsTable = `
  CREATE TABLE change_versions (
    topic TEXT NOT NULL,
    key TEXT NOT NULL,
    version INTEGER NOT NULL CHECK (version >= 0),
    PRIMARY KEY (topic, key)
  ) STRICT;
  INSERT INTO change_versions (topic, key, version) VALUES ('providers', 'host', 0);
  INSERT INTO change_versions (topic, key, version) VALUES ('preferences', 'host', 0);
`

export function migrateSettingsDatabase(db: DatabaseSync): void {
  const ownerRow = db.prepare('PRAGMA application_id').get()
  const versionRow = db.prepare('PRAGMA user_version').get()
  if (!ownerRow || !versionRow) throw new DatabaseError('SETTINGS_SCHEMA', 'Settings database metadata is missing')
  const owner = Number(ownerRow.application_id)
  const version = Number(versionRow.user_version)
  const fresh =
    owner === 0 &&
    version === 0 &&
    !db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()
  if (!fresh && (owner !== applicationId || (version !== 1 && version !== 2 && version !== schemaVersion)))
    throw new DatabaseError('SETTINGS_SCHEMA', 'Unsupported settings database format')
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE;')
  try {
    // Requests and activities moved to chat persistence (B02); older files keep their unused tables unchanged.
    if (fresh)
      db.exec(`
        CREATE TABLE providers (id TEXT PRIMARY KEY, payload TEXT NOT NULL) STRICT;
        ${changeVersionsTable}
        PRAGMA application_id=${applicationId}; PRAGMA user_version=${schemaVersion};`)
    else if (version === 1)
      db.exec(`
        ${changeVersionsTable}
        PRAGMA user_version=${schemaVersion};`)
    else if (version === 2)
      db.exec(`
        INSERT OR IGNORE INTO change_versions (topic, key, version) VALUES ('preferences', 'host', 0);
        PRAGMA user_version=${schemaVersion};`)
    // Added after schema version 1 shipped: created on demand so existing data files keep working.
    db.exec('CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT')
    db.prepare('SELECT id, payload FROM providers LIMIT 0').all()
    db.prepare('SELECT topic, key, version FROM change_versions LIMIT 0').all()
    if (db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok')
      throw new DatabaseError('SETTINGS_STORAGE', 'Settings database failed its integrity check')
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

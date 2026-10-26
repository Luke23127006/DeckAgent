import type { DatabaseSync } from 'node:sqlite'
import { RuntimeError } from '@deckagent/agent-runtime'

const applicationId = 0x44414754 // DAGT; distinguishes this file from another application's SQLite database.
const schemaVersion = 1

export function initialize(db: DatabaseSync): void {
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; BEGIN IMMEDIATE;')
  try {
    const version = Number(db.prepare('PRAGMA user_version').get()!.user_version)
    const owner = Number(db.prepare('PRAGMA application_id').get()!.application_id)
    if (version === 0 && owner === 0 && !db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()) {
      db.exec(`
        CREATE TABLE sessions (
          id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          provider TEXT, model TEXT,
          CHECK ((provider IS NULL AND model IS NULL) OR (provider IS NOT NULL AND model IS NOT NULL))
        ) STRICT;
        CREATE TABLE messages (
          session_id TEXT NOT NULL REFERENCES sessions(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
          payload TEXT NOT NULL, PRIMARY KEY (session_id, sequence)
        ) STRICT;
        PRAGMA application_id = ${applicationId};
        PRAGMA user_version = ${schemaVersion};
      `)
    } else if (version !== schemaVersion || owner !== applicationId) {
      throw new RuntimeError('SESSION_SCHEMA', 'Unsupported Session database format. Keep the file and use a compatible version or another data directory')
    }
    // Catch damaged files or incomplete schemas before accepting requests. Never reset them.
    if (db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok' || db.prepare('PRAGMA foreign_key_check').get()) {
      throw new RuntimeError('SESSION_CORRUPT', 'Session database failed its integrity check')
    }
    db.prepare('SELECT id, created_at, updated_at, provider, model FROM sessions LIMIT 0').all()
    db.prepare('SELECT session_id, sequence, payload FROM messages LIMIT 0').all()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;')
}

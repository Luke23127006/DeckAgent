import type { DatabaseSync } from 'node:sqlite'
import { DeckError } from './contracts.ts'

export function initialize(db: DatabaseSync): void {
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE')
  try {
    const owner = Number(db.prepare('PRAGMA application_id').get()!.application_id)
    const version = Number(db.prepare('PRAGMA user_version').get()!.user_version)
    if (
      !owner &&
      !version &&
      !db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()
    ) {
      db.exec(`
        CREATE TABLE decks(session_id TEXT PRIMARY KEY, outline_id TEXT NOT NULL, plan TEXT NOT NULL,
          version INTEGER NOT NULL CHECK(version>0)) STRICT;
        CREATE TABLE slides(session_id TEXT NOT NULL REFERENCES decks(session_id), slide_id TEXT NOT NULL,
          title TEXT NOT NULL, position INTEGER NOT NULL, revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
          PRIMARY KEY(session_id,slide_id), UNIQUE(session_id,position)) STRICT;
        CREATE TABLE revisions(session_id TEXT NOT NULL, slide_id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision>0),
          html TEXT NOT NULL, PRIMARY KEY(session_id,slide_id,revision),
          FOREIGN KEY(session_id,slide_id) REFERENCES slides(session_id,slide_id)) STRICT;
        CREATE TABLE publications(session_id TEXT NOT NULL REFERENCES decks(session_id), publication_id TEXT NOT NULL,
          fingerprint TEXT NOT NULL, receipt TEXT NOT NULL, PRIMARY KEY(session_id,publication_id)) STRICT;
        PRAGMA application_id=1145128004;
        PRAGMA user_version=1;
      `)
    } else if (owner !== 1145128004 || version !== 1) throw new DeckError('DECK_SCHEMA')
    if (db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok' || db.prepare('PRAGMA foreign_key_check').get())
      throw new DeckError('DECK_CORRUPT')
    db.prepare('SELECT session_id,outline_id,plan,version FROM decks LIMIT 0').all()
    db.prepare('SELECT session_id,slide_id,title,position,revision FROM slides LIMIT 0').all()
    db.prepare('SELECT session_id,slide_id,revision,html FROM revisions LIMIT 0').all()
    db.prepare('SELECT session_id,publication_id,fingerprint,receipt FROM publications LIMIT 0').all()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL')
}

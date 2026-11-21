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
    } else if (owner !== 1145128004 || ![1, 2, 3, 4, 5, 6, 7, 8].includes(version)) throw new DeckError('DECK_SCHEMA')
    if (version < 2) {
      db.exec(`
        CREATE TABLE outline_heads(session_id TEXT PRIMARY KEY,version INTEGER NOT NULL,
          current_id TEXT,confirmed_id TEXT) STRICT;
        CREATE TABLE outline_proposals(session_id TEXT NOT NULL,outline_id TEXT NOT NULL,version INTEGER NOT NULL,
          request_id TEXT NOT NULL,response_index INTEGER NOT NULL,payload TEXT NOT NULL,cancelled INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY(session_id,outline_id),UNIQUE(session_id,version),UNIQUE(session_id,request_id)) STRICT;
        PRAGMA user_version=2;
      `)
    }
    if (version < 3)
      db.exec(`
      CREATE TABLE brief_heads(session_id TEXT PRIMARY KEY, brief_id TEXT NOT NULL UNIQUE, version INTEGER NOT NULL CHECK(version>0)) STRICT;
      CREATE TABLE brief_versions(brief_id TEXT NOT NULL REFERENCES brief_heads(brief_id), version INTEGER NOT NULL CHECK(version>0),
        session_id TEXT NOT NULL, payload TEXT NOT NULL, design TEXT, created_at TEXT NOT NULL, PRIMARY KEY(brief_id,version)) STRICT;
      PRAGMA user_version=3;
    `)
    if (version < 4)
      db.exec(`
      CREATE TABLE outline_details(session_id TEXT NOT NULL,outline_id TEXT NOT NULL,payload TEXT NOT NULL,
        PRIMARY KEY(session_id,outline_id),FOREIGN KEY(session_id,outline_id) REFERENCES outline_proposals(session_id,outline_id)) STRICT;
      CREATE TABLE brief_request_receipts(request_id TEXT PRIMARY KEY,session_id TEXT NOT NULL,brief_id TEXT NOT NULL,version INTEGER NOT NULL,fingerprint TEXT NOT NULL,
        FOREIGN KEY(brief_id,version) REFERENCES brief_versions(brief_id,version)) STRICT;
      PRAGMA user_version=4;
    `)
    if (version < 5)
      db.exec(`
      CREATE TABLE generation_intents(session_id TEXT PRIMARY KEY REFERENCES decks(session_id),intent_id TEXT NOT NULL UNIQUE,
        request_id TEXT NOT NULL UNIQUE,state TEXT NOT NULL CHECK(state IN ('pending','admitted','generating','generated','incomplete')),started_at TEXT,payload TEXT NOT NULL) STRICT;
      PRAGMA user_version=5;
    `)
    if (version < 6)
      db.exec(`
      CREATE TABLE artifact_revisions(session_id TEXT NOT NULL,slide_id TEXT NOT NULL,revision INTEGER NOT NULL,
        artifact_id TEXT NOT NULL UNIQUE,digest TEXT NOT NULL,manifest TEXT NOT NULL,
        PRIMARY KEY(session_id,slide_id,revision),FOREIGN KEY(session_id,slide_id,revision) REFERENCES revisions(session_id,slide_id,revision)) STRICT;
      PRAGMA user_version=6;
    `)
    // Version 7 records a continuation's active request in the generation payload; older readers must refuse it.
    if (version < 7) db.exec('PRAGMA user_version=7')
    if (version < 8)
      db.exec(`CREATE TABLE prepared_images(session_id TEXT NOT NULL,outline_id TEXT NOT NULL,query TEXT NOT NULL,payload TEXT NOT NULL,
      PRIMARY KEY(session_id,outline_id,query),FOREIGN KEY(session_id,outline_id) REFERENCES outline_proposals(session_id,outline_id)) STRICT;
      PRAGMA user_version=8;`)
    if (db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok' || db.prepare('PRAGMA foreign_key_check').get())
      throw new DeckError('DECK_CORRUPT')
    db.prepare('SELECT session_id,outline_id,plan,version FROM decks LIMIT 0').all()
    db.prepare('SELECT session_id,slide_id,title,position,revision FROM slides LIMIT 0').all()
    db.prepare('SELECT session_id,slide_id,revision,html FROM revisions LIMIT 0').all()
    db.prepare('SELECT session_id,publication_id,fingerprint,receipt FROM publications LIMIT 0').all()
    db.prepare('SELECT session_id,version,current_id,confirmed_id FROM outline_heads LIMIT 0').all()
    db.prepare(
      'SELECT session_id,outline_id,version,request_id,response_index,payload,cancelled FROM outline_proposals LIMIT 0',
    ).all()
    db.prepare('SELECT session_id,brief_id,version FROM brief_heads LIMIT 0').all()
    db.prepare('SELECT brief_id,version,session_id,payload,design,created_at FROM brief_versions LIMIT 0').all()
    db.prepare('SELECT session_id,outline_id,payload FROM outline_details LIMIT 0').all()
    db.prepare('SELECT request_id,session_id,brief_id,version,fingerprint FROM brief_request_receipts LIMIT 0').all()
    db.prepare('SELECT session_id,intent_id,request_id,state,started_at,payload FROM generation_intents LIMIT 0').all()
    db.prepare('SELECT session_id,slide_id,revision,artifact_id,digest,manifest FROM artifact_revisions LIMIT 0').all()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL')
}

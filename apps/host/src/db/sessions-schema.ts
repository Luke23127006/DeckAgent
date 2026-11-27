import type { DatabaseSync } from 'node:sqlite'
import { SessionError } from './contracts.ts'

const applicationId = 0x44414754 // DAGT; distinguishes this file from another application's SQLite database.
const schemaVersion = 9
const researchTables = `
  CREATE TABLE request_research (
    request_id TEXT PRIMARY KEY REFERENCES requests(id), selected INTEGER NOT NULL CHECK(selected IN (0,1)),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3)
  ) STRICT;
  CREATE TABLE research_sources (
    id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id),
    session_id TEXT NOT NULL REFERENCES sessions(id), payload TEXT NOT NULL
  ) STRICT;
  CREATE INDEX research_sources_chat ON research_sources(session_id);
`
/** One version for the chat list of the Host (ADR-004). It starts at 0 on a new file and on an upgrade. */
const changeVersionsTable = `
  CREATE TABLE change_versions (
    topic TEXT NOT NULL, key TEXT NOT NULL, version INTEGER NOT NULL CHECK (version >= 0), PRIMARY KEY (topic, key)
  ) STRICT;
  INSERT INTO change_versions (topic, key, version) VALUES ('chats', 'host', 0);
`
/** Chats saved before workspaces existed belong to the default workspace. */
export const defaultWorkspaceId = 'default'

/** Legacy v3-v8 request tables used during incremental migration before rebuilding to schema v9. */
const requestTablesV8 = `
  CREATE TABLE requests (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id),
    status TEXT NOT NULL CHECK (status IN ('active','waiting_approval','completed','failed','stopped','interrupted')),
    provider TEXT NOT NULL, model TEXT NOT NULL, history_start INTEGER NOT NULL CHECK (history_start >= 0),
    started_at TEXT NOT NULL, ended_at TEXT, error_code TEXT
  ) STRICT;
  CREATE INDEX requests_session ON requests(session_id);
  CREATE UNIQUE INDEX requests_one_active ON requests(session_id) WHERE status IN ('active','waiting_approval');
  CREATE TABLE request_events (
    request_id TEXT NOT NULL REFERENCES requests(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
    created_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (request_id, sequence)
  ) STRICT;
  CREATE TABLE runtime_bindings (
    session_id TEXT PRIMARY KEY REFERENCES sessions(id), native_session_id TEXT NOT NULL,
    provider TEXT NOT NULL, model TEXT NOT NULL, context TEXT NOT NULL, last_request_id TEXT NOT NULL, updated_at TEXT NOT NULL
  ) STRICT;
  ALTER TABLE sessions ADD COLUMN removed_provider TEXT;
  ALTER TABLE sessions ADD COLUMN removed_model TEXT;
`

/** Requests, their ordered events and native session bindings keyed by run owner (schema v9, ADR-001). */
const requestTablesV9 = `
  CREATE TABLE requests (
    id TEXT PRIMARY KEY, owner_kind TEXT NOT NULL, owner_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active','waiting_approval','completed','failed','stopped','interrupted')),
    provider TEXT NOT NULL, model TEXT NOT NULL, history_start INTEGER NOT NULL CHECK (history_start >= 0),
    started_at TEXT NOT NULL, ended_at TEXT, error_code TEXT
  ) STRICT;
  CREATE INDEX requests_owner ON requests(owner_kind, owner_id);
  CREATE UNIQUE INDEX requests_one_active ON requests(owner_kind, owner_id) WHERE status IN ('active','waiting_approval');
  CREATE TABLE request_events (
    request_id TEXT NOT NULL REFERENCES requests(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
    created_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (request_id, sequence)
  ) STRICT;
  CREATE TABLE runtime_bindings (
    owner_key TEXT PRIMARY KEY, native_session_id TEXT NOT NULL,
    provider TEXT NOT NULL, model TEXT NOT NULL, context TEXT NOT NULL, last_request_id TEXT NOT NULL, updated_at TEXT NOT NULL
  ) STRICT;
  ALTER TABLE sessions ADD COLUMN removed_provider TEXT;
  ALTER TABLE sessions ADD COLUMN removed_model TEXT;
`

const migrateRequestsV8ToV9 = `
  CREATE TABLE requests_v9 (
    id TEXT PRIMARY KEY, owner_kind TEXT NOT NULL, owner_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active','waiting_approval','completed','failed','stopped','interrupted')),
    provider TEXT NOT NULL, model TEXT NOT NULL, history_start INTEGER NOT NULL CHECK (history_start >= 0),
    started_at TEXT NOT NULL, ended_at TEXT, error_code TEXT
  ) STRICT;
  INSERT INTO requests_v9 (id, owner_kind, owner_id, status, provider, model, history_start, started_at, ended_at, error_code)
  SELECT id, 'chat', session_id, status, provider, model, history_start, started_at, ended_at, error_code FROM requests;
  DROP TABLE requests;
  ALTER TABLE requests_v9 RENAME TO requests;
  CREATE INDEX requests_owner ON requests(owner_kind, owner_id);
  CREATE UNIQUE INDEX requests_one_active ON requests(owner_kind, owner_id) WHERE status IN ('active','waiting_approval');
`

const migrateRuntimeBindingsV8ToV9 = `
  CREATE TABLE runtime_bindings_v9 (
    owner_key TEXT PRIMARY KEY, native_session_id TEXT NOT NULL,
    provider TEXT NOT NULL, model TEXT NOT NULL, context TEXT NOT NULL, last_request_id TEXT NOT NULL, updated_at TEXT NOT NULL
  ) STRICT;
  INSERT INTO runtime_bindings_v9 (owner_key, native_session_id, provider, model, context, last_request_id, updated_at)
  SELECT 'chat:' || session_id, native_session_id, provider, model, context, last_request_id, updated_at FROM runtime_bindings;
  DROP TABLE runtime_bindings;
  ALTER TABLE runtime_bindings_v9 RENAME TO runtime_bindings;
`

function hasColumn(db: DatabaseSync, table: 'requests' | 'runtime_bindings', column: string): boolean {
  return db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .some(row => row.name === column)
}

const attachmentTables = `
  CREATE TABLE attachments (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), name TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('preparing','ready','rejected')),
    byte_size INTEGER NOT NULL DEFAULT 0 CHECK (byte_size >= 0), fingerprint TEXT,
    detected_type TEXT, rejection_code TEXT,
    request_id TEXT REFERENCES requests(id), message_sequence INTEGER,
    FOREIGN KEY (session_id, message_sequence) REFERENCES messages(session_id, sequence)
  ) STRICT;
  CREATE INDEX attachments_session ON attachments(session_id);
  CREATE TABLE sources (
    id TEXT NOT NULL, version INTEGER NOT NULL CHECK (version > 0),
    session_id TEXT NOT NULL REFERENCES sessions(id), attachment_id TEXT NOT NULL REFERENCES attachments(id),
    fingerprint TEXT NOT NULL, label TEXT NOT NULL,
    PRIMARY KEY (id, version), UNIQUE (attachment_id)
  ) STRICT;
`

const approvalTables = `
  CREATE TABLE request_approvals (
    id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id), step_key TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation = 'read-file'), target TEXT NOT NULL, reason TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('pending','allowed','refused','cancelled'))
  ) STRICT;
  CREATE UNIQUE INDEX approvals_one_pending ON request_approvals(request_id) WHERE state = 'pending';
  CREATE INDEX approvals_refused ON request_approvals(request_id, step_key, state);
  CREATE TABLE source_reads (
    source_id TEXT NOT NULL, version INTEGER NOT NULL, session_id TEXT NOT NULL REFERENCES sessions(id),
    origin TEXT NOT NULL, label TEXT NOT NULL, fingerprint TEXT NOT NULL, line_count INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('project-file','approved-file')), request_id TEXT NOT NULL REFERENCES requests(id),
    PRIMARY KEY (source_id, version), UNIQUE (session_id, origin, version)
  ) STRICT;
`

const preparationColumns = `
  ALTER TABLE attachments ADD COLUMN preparation TEXT;
  ALTER TABLE attachments ADD COLUMN parsed_fingerprint TEXT;
`

export function initialize(db: DatabaseSync): void {
  db.exec('PRAGMA foreign_keys = OFF; PRAGMA busy_timeout = 5000; BEGIN IMMEDIATE;')
  try {
    const version = Number(db.prepare('PRAGMA user_version').get()!.user_version)
    const owner = Number(db.prepare('PRAGMA application_id').get()!.application_id)
    if (
      version === 0 &&
      owner === 0 &&
      !db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()
    ) {
      db.exec(`
        CREATE TABLE sessions (
          id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          provider TEXT, model TEXT, workspace_id TEXT,
          CHECK ((provider IS NULL AND model IS NULL) OR (provider IS NOT NULL AND model IS NOT NULL))
        ) STRICT;
        CREATE TABLE messages (
          session_id TEXT NOT NULL REFERENCES sessions(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
          payload TEXT NOT NULL, PRIMARY KEY (session_id, sequence)
        ) STRICT;
        CREATE INDEX sessions_workspace ON sessions(workspace_id);
        ${requestTablesV9}
        ${attachmentTables}
        ${approvalTables}
        ${preparationColumns}
        ${researchTables}
        ${changeVersionsTable}
        PRAGMA application_id = ${applicationId};
        PRAGMA user_version = ${schemaVersion};
      `)
    } else if (version >= 1 && version <= 8 && owner === applicationId) {
      if (version === 1)
        db.exec(`
        ALTER TABLE sessions ADD COLUMN workspace_id TEXT;
        UPDATE sessions SET workspace_id = '${defaultWorkspaceId}';
        CREATE INDEX sessions_workspace ON sessions(workspace_id);
      `)
      if (version < 3) db.exec(requestTablesV8)
      if (version < 4) db.exec(attachmentTables)
      if (version < 5) db.exec(approvalTables)
      if (version < 6) db.exec(preparationColumns)
      if (version < 7) db.exec(researchTables)
      if (version < 8) db.exec(changeVersionsTable)
      if (hasColumn(db, 'requests', 'session_id')) db.exec(migrateRequestsV8ToV9)
      if (hasColumn(db, 'runtime_bindings', 'session_id')) db.exec(migrateRuntimeBindingsV8ToV9)
      db.exec(`PRAGMA user_version = ${schemaVersion};`)
    } else if (version !== schemaVersion || owner !== applicationId) {
      throw new SessionError(
        'SESSION_SCHEMA',
        'Unsupported Session database format. Keep the file and use a compatible version or another data directory',
      )
    }
    // Catch damaged files or incomplete schemas before accepting requests. Never reset them.
    if (db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok' || db.prepare('PRAGMA foreign_key_check').get()) {
      throw new SessionError('SESSION_CORRUPT', 'Session database failed its integrity check')
    }
    db.prepare(
      'SELECT id, created_at, updated_at, provider, model, workspace_id, removed_provider, removed_model FROM sessions LIMIT 0',
    ).all()
    db.prepare('SELECT session_id, sequence, payload FROM messages LIMIT 0').all()
    db.prepare(
      'SELECT id, owner_kind, owner_id, status, provider, model, history_start, started_at, ended_at, error_code FROM requests LIMIT 0',
    ).all()
    db.prepare('SELECT request_id, sequence, created_at, payload FROM request_events LIMIT 0').all()
    db.prepare(
      'SELECT owner_key, native_session_id, provider, model, context, last_request_id, updated_at FROM runtime_bindings LIMIT 0',
    ).all()
    db.prepare(
      'SELECT id, session_id, name, state, byte_size, fingerprint, detected_type, rejection_code, request_id, message_sequence, preparation, parsed_fingerprint FROM attachments LIMIT 0',
    ).all()
    db.prepare('SELECT id, version, session_id, attachment_id, fingerprint, label FROM sources LIMIT 0').all()
    db.prepare('SELECT request_id, selected, attempts FROM request_research LIMIT 0').all()
    db.prepare('SELECT id, request_id, session_id, payload FROM research_sources LIMIT 0').all()
    db.prepare('SELECT id, request_id, step_key, operation, target, reason, state FROM request_approvals LIMIT 0').all()
    db.prepare(
      'SELECT source_id, version, session_id, origin, label, fingerprint, line_count, kind, request_id FROM source_reads LIMIT 0',
    ).all()
    db.prepare('SELECT topic, key, version FROM change_versions LIMIT 0').all()
    if (!db.prepare("SELECT version FROM change_versions WHERE topic = 'chats' AND key = 'host'").get())
      throw new SessionError('SESSION_CORRUPT', 'Session database has no chats version row')
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    db.exec('PRAGMA foreign_keys = ON;')
    throw error
  }
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;')
}

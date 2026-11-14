import type { DatabaseSync } from 'node:sqlite'
import { SessionError } from './contracts.ts'

const applicationId = 0x44414754 // DAGT; distinguishes this file from another application's SQLite database.
const schemaVersion = 6
/** Chats saved before workspaces existed belong to the default workspace. */
export const defaultWorkspaceId = 'default'

/** Requests, their ordered events and the native session binding of each chat (schema v3, B02). */
const requestTables = `
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
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; BEGIN IMMEDIATE;')
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
        ${requestTables}
        ${attachmentTables}
        ${approvalTables}
        ${preparationColumns}
        PRAGMA application_id = ${applicationId};
        PRAGMA user_version = ${schemaVersion};
      `)
    } else if (version >= 1 && version <= 5 && owner === applicationId) {
      // v1 -> v2: chats gain a workspace. v2 -> v3: requests, events and native session bindings. Rows are kept; none is reset.
      if (version === 1)
        db.exec(`
        ALTER TABLE sessions ADD COLUMN workspace_id TEXT;
        UPDATE sessions SET workspace_id = '${defaultWorkspaceId}';
        CREATE INDEX sessions_workspace ON sessions(workspace_id);
      `)
      if (version < 3) db.exec(requestTables)
      if (version < 4) db.exec(attachmentTables)
      if (version < 5) db.exec(approvalTables)
      db.exec(`${preparationColumns} PRAGMA user_version = ${schemaVersion};`)
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
      'SELECT id, session_id, status, provider, model, history_start, started_at, ended_at, error_code FROM requests LIMIT 0',
    ).all()
    db.prepare('SELECT request_id, sequence, created_at, payload FROM request_events LIMIT 0').all()
    db.prepare(
      'SELECT session_id, native_session_id, provider, model, context, last_request_id, updated_at FROM runtime_bindings LIMIT 0',
    ).all()
    db.prepare(
      'SELECT id, session_id, name, state, byte_size, fingerprint, detected_type, rejection_code, request_id, message_sequence, preparation, parsed_fingerprint FROM attachments LIMIT 0',
    ).all()
    db.prepare('SELECT id, version, session_id, attachment_id, fingerprint, label FROM sources LIMIT 0').all()
    db.prepare('SELECT id, request_id, step_key, operation, target, reason, state FROM request_approvals LIMIT 0').all()
    db.prepare(
      'SELECT source_id, version, session_id, origin, label, fingerprint, line_count, kind, request_id FROM source_reads LIMIT 0',
    ).all()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;')
}

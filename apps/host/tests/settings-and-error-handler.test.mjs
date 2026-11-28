/**
 * Tests: Settings persistence and optimistic concurrency (`SettingsService`, `SqliteSettingsStore`, `mapSettingsError`),
 * HTTP `writeRouteError` mapping of `RunFailure` statuses and details, corrupt-chat error translation (`CHAT_UNREADABLE`
 * HTTP 409) across `ChatService`, `ChatRequestService`, `ResearchService` and `AttachmentService`, and `RunController`
 * admission error allowlist.
 * Environment: real SQLite `SettingsDatabase`, `ChatDatabase`, `SqliteChatStore`, `SqliteAttachmentStore`,
 * `SqliteRunStore`, `SqliteResearchStore`, and `MemoryDraftStore` in temporary directories;
 * fake boundary ports only for external provider/runtime/HTTP response and workspace-selection boundaries.
 * Run: node --test --test-reporter=tap apps/host/tests/settings-and-error-handler.test.mjs
 * Expected values source: docs/UCs/settings.md, docs/UCs/requests.md, docs/UCs/chats.md,
 * docs/conventions/code.md#đặt-tên-error, and docs/conventions/project-structure.md#dependency-rules.
 * Fault checks (each mutant caused this file to exit 1 before restore):
 * - Mutating `HOST_BUSY: 429` -> `500` in `apps/host/src/http/error-handler.ts` failed the `writeRouteError` test.
 * - Mutating `PREFERENCES_STALE: 409` -> `400` in `apps/host/src/modules/settings/settings.errors.ts` failed the settings test.
 * - Removing `this.selectable(value)` in `apps/host/src/modules/settings/settings.service.ts` failed the settings test.
 * - Removing `SESSION_CORRUPT` translation in `apps/host/src/modules/chats/chats.service.ts`, `chat-requests.service.ts`,
 *   `research.service.ts`, and `attachments.service.ts` failed the corrupt-chat translation test.
 * - Removing `'DRAFT_CONFLICT'` from `admitPassthroughCodes` in `apps/host/src/runs/lifecycle/run-controller.ts` failed the admission test.
 */
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ChatDatabase, DatabaseError, SettingsDatabase, SqliteRunStore } from '../lib/types/db/index.js'
import { writeRouteError } from '../lib/types/http/error-handler.js'
import {
  AttachmentService,
  MemoryDraftStore,
  SqliteAttachmentStore,
  mapAttachmentError,
} from '../lib/types/modules/attachments/index.js'
import { ChatRequestService, ChatService, SqliteChatStore, mapChatError } from '../lib/types/modules/chats/index.js'
import { ResearchService, SqliteResearchStore, mapResearchError } from '../lib/types/modules/research/index.js'
import { SettingsService, SqliteSettingsStore, mapSettingsError } from '../lib/types/modules/settings/index.js'
import { RunController } from '../lib/types/runs/index.js'
import { RunFailure } from '../lib/types/runs/ports.js'

function captureRouteError(error) {
  let status
  let body
  const res = {
    headersSent: false,
    writeHead(code) {
      status = code
    },
    end(payload) {
      body = JSON.parse(payload)
    },
    destroy() {},
  }
  writeRouteError(res, error, {})
  return { status, body }
}

test('SettingsService persists preferences, maps stale writes to 409, and filters lastSelection by selectability', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-settings-'))
  const db = new SettingsDatabase(join(dir, 'web.sqlite'))
  t.after(async () => {
    db.close()
    await rm(dir, { recursive: true, force: true })
  })
  const notices = []
  const store = new SqliteSettingsStore(db.db, version => notices.push(version))
  let selectable = true
  const service = new SettingsService(store, {
    providers: {
      selectable: () => selectable,
      providerSettings: () => [],
      version: () => 2,
      persistentKeys: true,
      builtIns: [],
    },
    readResearch: () => ({ provider: 'tavily', configured: false, environmentKey: false, freeOnly: true }),
    runtimeAvailability: async () => ({ available: true }),
  })

  assert.deepEqual(service.preferences(), { theme: 'system', version: 0 })
  assert.deepEqual(service.savePreferences('dark', 0), { theme: 'dark', version: 1 })
  assert.deepEqual(notices, [1])

  let staleError
  try {
    service.savePreferences('light', 0)
  } catch (error) {
    staleError = error
  }
  assert.deepEqual(mapSettingsError(staleError), { status: 409, code: 'PREFERENCES_STALE' })
  assert.equal(mapSettingsError(new Error('other')), undefined)

  service.rememberSelection({ provider: 'openai', model: 'gpt-4.1' })
  assert.deepEqual(service.lastSelection(), { provider: 'openai', model: 'gpt-4.1' })
  selectable = false
  assert.equal(service.lastSelection(), undefined)

  const settings = await service.read()
  assert.equal(settings.preferencesVersion, 1)
  assert.equal(settings.providersVersion, 2)
  assert.deepEqual(settings.runtime, { available: true })
})

test('writeRouteError maps RunFailure statuses, preserves detail, and defaults unknown RunFailure codes to 500', () => {
  const expected = {
    HOST_CLOSED: 503,
    HOST_BUSY: 429,
    RUNTIME_UNAVAILABLE: 503,
    RUNTIME_VERSION_UNSUPPORTED: 503,
    REQUEST_NOT_FOUND: 404,
    APPROVAL_NOT_FOUND: 404,
    SESSION_NOT_FOUND: 404,
    RUN_OWNER_BUSY: 409,
    SESSION_BUSY: 409,
    GENERATION_LINK_CONFLICT: 409,
    APPROVAL_CONFLICT: 409,
    REQUEST_CLOSED: 409,
    DRAFT_CONFLICT: 409,
    ATTACHMENT_REJECTED: 409,
    ATTACHMENT_NOT_READY: 409,
    ATTACHMENT_COUNT_EXCEEDED: 413,
    REQUEST_EMPTY: 400,
    REQUEST_NOT_SAVED: 500,
    GENERATION_LINK_FAILED: 500,
  }
  for (const [code, status] of Object.entries(expected)) {
    const out = captureRouteError(new RunFailure(code))
    assert.equal(out.status, status)
    assert.equal(out.body.error.code, code)
  }
  const withDetail = captureRouteError(new RunFailure('RUNTIME_VERSION_UNSUPPORTED', { version: '1.19.5' }))
  assert.equal(withDetail.status, 503)
  assert.equal(withDetail.body.error.code, 'RUNTIME_VERSION_UNSUPPORTED')
  assert.deepEqual(withDetail.body.error.detail, { version: '1.19.5' })

  const unknownRunCode = captureRouteError(new RunFailure('UNKNOWN_RUN_CODE'))
  assert.equal(unknownRunCode.status, 500)
  assert.equal(unknownRunCode.body.error.code, 'UNKNOWN_RUN_CODE')
})

test('ChatService, ChatRequestService, ResearchService and AttachmentService translate corrupt SQLite rows to HTTP 409 CHAT_UNREADABLE', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-corrupt-'))
  const chatDb = new ChatDatabase(join(dir, 'sessions.sqlite'))
  const settingsDb = new SettingsDatabase(join(dir, 'web.sqlite'))
  t.after(async () => {
    chatDb.close()
    settingsDb.close()
    await rm(dir, { recursive: true, force: true })
  })

  const chatStore = new SqliteChatStore(chatDb)
  const attachmentStore = new SqliteAttachmentStore(chatDb)
  const runStore = new SqliteRunStore(chatDb)
  const drafts = new MemoryDraftStore()
  const settings = new SettingsService(new SqliteSettingsStore(settingsDb.db), {
    providers: {
      selectable: () => true,
      providerSettings: () => [{ id: 'openai', models: ['gpt-4.1'] }],
      version: () => 0,
      persistentKeys: true,
      builtIns: [],
    },
    readResearch: () => ({ provider: 'tavily', configured: false, environmentKey: false, freeOnly: true }),
    runtimeAvailability: async () => ({ available: true }),
  })
  const chats = new ChatService(
    chatStore,
    runStore,
    { selectedId: () => 'default', get: () => undefined, folders: () => [] },
    settings,
    { hasSlides: () => false, hasDraft: () => false },
  )
  const controller = new RunController({
    store: runStore,
    runtime: {
      name: 'fake',
      availability: async () => ({ available: true }),
      run: async () => ({ status: 'completed', usage: { modelCalls: 0 } }),
    },
    providers: {
      resolve: async selected => ({ ...selected, protocol: 'chat-completions', baseUrl: 'http://127.0.0.1' }),
    },
  })
  const requests = new ChatRequestService({
    chats: chatStore,
    providers: {
      providerSettings: () => [{ models: ['gpt-4.1'] }],
      selectable: () => true,
    },
    runs: controller,
    deckPlanner: {
      prepare: async () => {
        throw new Error('unused')
      },
    },
    preflightResearch: async () => {},
  })
  const research = new ResearchService(
    new SqliteResearchStore(settingsDb.db),
    {
      persistent: true,
      save: async () => 'cred-00000000-0000-0000-0000-000000000000',
      read: async () => 'secret',
      remove: async () => {},
    },
    chats,
    runStore,
    undefined,
    {
      check: async () => {},
      search: async () => ({ results: [] }),
      images: async () => [],
    },
  )
  const attachments = new AttachmentService(
    chats,
    attachmentStore,
    drafts,
    {
      receive: async () => {
        throw new Error('unused')
      },
      read: async () => new Uint8Array(),
      savePrepared: async () => '',
      prepared: async () => {
        throw new Error('unused')
      },
      remove: async () => {},
      discardUnsent: async () => {},
    },
    {
      parse: async () => {
        throw new Error('unused')
      },
      close: async () => {},
    },
    { files: 10, bytes: 1024 },
  )

  const created = await chats.create({ provider: 'openai', model: 'gpt-4.1' })
  const sessionId = created.sessionId

  let missingErr
  try {
    await chats.history('missing-chat')
  } catch (error) {
    missingErr = error
  }
  assert.deepEqual(mapChatError(missingErr), { status: 404, code: 'SESSION_NOT_FOUND' })

  // Corrupt a saved message row for ChatService.history.
  chatDb.db.prepare('INSERT INTO messages (session_id, sequence, payload) VALUES (?, 1, ?)').run(sessionId, '{bad-json')
  let corruptHistoryErr
  try {
    await chats.history(sessionId)
  } catch (error) {
    corruptHistoryErr = error
  }
  assert.deepEqual(mapChatError(corruptHistoryErr), { status: 409, code: 'CHAT_UNREADABLE' })

  // Corrupt a saved request row for ChatRequestService.get/events/stop.
  chatDb.db
    .prepare(
      `INSERT INTO requests (id, owner_kind, owner_id, status, provider, model, history_start, started_at)
       VALUES ('req-bad', 'other', ?, 'completed', 'openai', 'gpt-4.1', 0, '2026-11-28T00:00:00.000Z')`,
    )
    .run(sessionId)
  for (const call of [
    () => requests.get('req-bad'),
    () => requests.events('req-bad', 0),
    () => requests.stop('req-bad'),
  ]) {
    let err
    try {
      call()
    } catch (error) {
      err = error
    }
    assert.deepEqual(mapChatError(err), { status: 409, code: 'CHAT_UNREADABLE' })
  }

  // Corrupt a research_sources row for ResearchService.sources.
  chatDb.db
    .prepare(
      `INSERT INTO requests (id, owner_kind, owner_id, status, provider, model, history_start, started_at)
       VALUES ('req-ok', 'chat', ?, 'completed', 'openai', 'gpt-4.1', 0, '2026-11-28T00:00:00.000Z')`,
    )
    .run(sessionId)
  chatDb.db
    .prepare(
      "INSERT INTO research_sources (id, request_id, session_id, payload) VALUES ('src-bad', 'req-ok', ?, '{bad')",
    )
    .run(sessionId)
  let corruptResearchErr
  try {
    await research.sources(sessionId)
  } catch (error) {
    corruptResearchErr = error
  }
  assert.deepEqual(mapResearchError(corruptResearchErr), { status: 409, code: 'CHAT_UNREADABLE' })

  // Corrupt an attachment preparation JSON row for AttachmentService.draft.
  const att = attachmentStore.create(sessionId, 'note.txt')
  drafts.save(sessionId, { text: '', attachmentIds: [att.attachmentId] }, 0)
  chatDb.db.prepare("UPDATE attachments SET preparation = '{bad-json' WHERE id = ?").run(att.attachmentId)
  let corruptDraftErr
  try {
    await attachments.draft(sessionId)
  } catch (error) {
    corruptDraftErr = error
  }
  assert.deepEqual(mapAttachmentError(corruptDraftErr), { status: 409, code: 'CHAT_UNREADABLE' })
})

test('RunController passes through allowed admission codes and masks storage errors as REQUEST_NOT_SAVED', async () => {
  const makeController = errorToThrow =>
    new RunController({
      store: {
        admit() {
          throw errorToThrow
        },
        append() {
          throw new Error('unused')
        },
        finish() {
          return undefined
        },
        get() {
          return undefined
        },
        events() {
          return []
        },
        text() {
          return ''
        },
        activeFor() {
          return undefined
        },
      },
      runtime: {
        name: 'fake',
        availability: async () => ({ available: true }),
        run: async () => ({ status: 'completed', usage: { modelCalls: 0 } }),
      },
      providers: {
        resolve: async selected => ({ ...selected, protocol: 'chat-completions', baseUrl: 'http://127.0.0.1' }),
      },
    })

  const plan = {
    owner: { kind: 'chat', id: 'chat-1' },
    input: 'hello',
    selection: { provider: 'openai', model: 'gpt-4.1' },
    grants: { publicResearch: false, sourceKinds: [] },
    stepLimit: 1,
    contributions: [],
  }

  await assert.rejects(
    makeController(new DatabaseError('DRAFT_CONFLICT', 'stale')).start(plan),
    error => error instanceof RunFailure && error.code === 'DRAFT_CONFLICT',
  )
  await assert.rejects(
    makeController(new DatabaseError('SESSION_STORAGE', 'disk failed')).start(plan),
    error => error instanceof RunFailure && error.code === 'REQUEST_NOT_SAVED',
  )
})

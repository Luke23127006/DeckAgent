# Task 07: Separate Request Lifecycle errors from HTTP

Read this file to learn the steps that separate request lifecycle errors from http.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `packages/host/api/src/request-controller.ts (lines 1-399)`.
- `packages/host/api/src/index.ts (lines 229-320)`.
- `packages/host/api/src/http-error.ts`.
- `apps/local-web/src/attachment-service.ts (lines 233-265)`.
- `tests/request-lifecycle.test.mjs (lines 1-340)`.
- `tests/attachment-admission.test.mjs`.
- `.agents/skills/tdd/SKILL.md`.
- `.agents/skills/codebase-design/SKILL.md`.

**Files:**

- Create: packages/host/api/src/request-failure.ts.
- Create: packages/host/api/tests/request-failure.test.mjs.
- Change: packages/host/api/src/request-controller.ts and index.ts.
- Change: apps/local-web/src/attachment-service.ts, in requestStore().admit only.
- Change: tests/request-lifecycle.test.mjs, for direct error assertions only.

**Interfaces:**

- Produces: class RequestFailure extends Error, with readonly code: string and constructor(code: string).
- Preserves: RequestController constructor and public methods submit, get, decide, events, active, stop, subscribe, close.
- Produces: requestFailureResponse(error: RequestFailure): { readonly status: number, readonly code: string }, private to Host transport.
- Uses: SessionError for draft and attachment admission preconditions. No HTTP status crosses the persistence or Lifecycle boundary.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A request error code changes.
- Cancellation, approval settlement, event order, or admission order changes.
- A code has no row in the HTTP mapping table.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [x] **Step 1: Add a focused public-operation test**

Add this complete test file:

```js
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { SqliteSessionStore } from '@deckagent/session-persistence'
import { RequestController, RequestFailure } from '../lib/index.js'

test('closed Request Lifecycle refuses work with an operation error', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-request-failure-'))
  const store = new SqliteSessionStore(join(dir, 'sessions.sqlite'))
  t.after(async () => {
    store.close()
    await rm(dir, { recursive: true, force: true })
  })
  const chat = await store.create('default', { provider: 'fixture', model: 'fixture-model' })
  let prepares = 0
  const runtime = {
    async prepare() {
      prepares++
      return {
        selection: { provider: 'fixture', model: 'fixture-model' },
        async start() { return { status: 'completed' } },
      }
    },
  }
  const controller = new RequestController(store.requests, runtime)
  await controller.close()
  await assert.rejects(
    controller.submit({ sessionId: chat.sessionId, input: 'hello' }),
    error => {
      assert.equal(error instanceof RequestFailure, true)
      assert.equal(error.code, 'HOST_CLOSED')
      return true
    },
  )
  assert.equal(prepares, 0)
  assert.deepEqual(store.requests.list(chat.sessionId), [])
})
```

Add the test-file header required by Testware.
The real Session store supplies persistence. The fake replaces only the runtime boundary.

Run `corepack pnpm@11.28.5 build`.
Run `node --test --test-reporter=tap packages/host/api/tests/request-failure.test.mjs`.
Expected: build exits with code 0. The test fails because `RequestFailure` does not exist.
Do not count an unrelated setup failure as the expected failure.

- [x] **Step 2: Separate operation errors**

Replace RequestController's constructed `HttpError` values with `RequestFailure`.
Remove its HTTP error import and re-export.
Export `RequestFailure` through Host API for the transport consumer.

Change only admission precondition throws in `AttachmentService.requestStore()` to `SessionError`.
Preserve each code and message.
RequestController converts these admitted codes to `RequestFailure`:
`DRAFT_CONFLICT`, `ATTACHMENT_COUNT_EXCEEDED`, `ATTACHMENT_REJECTED`, `ATTACHMENT_NOT_READY`, and `REQUEST_EMPTY`.
Retain existing conversion of Session absence, active-request conflicts, and failed writes.
Propagate runtime preparation failures to the transport without reading their HTTP fields.

- [x] **Step 3: Keep HTTP mapping in transport**

Apply this table in Host transport:

| Code | HTTP status |
| --- | --- |
| HOST_CLOSED | 503 |
| HOST_BUSY | 429 |
| REQUEST_NOT_FOUND, APPROVAL_NOT_FOUND, SESSION_NOT_FOUND | 404 |
| SESSION_BUSY, GENERATION_LINK_CONFLICT, APPROVAL_CONFLICT, REQUEST_CLOSED | 409 |
| DRAFT_CONFLICT, ATTACHMENT_REJECTED, ATTACHMENT_NOT_READY | 409 |
| ATTACHMENT_COUNT_EXCEEDED | 413 |
| REQUEST_EMPTY | 400 |
| REQUEST_NOT_SAVED, GENERATION_LINK_FAILED | 500 |
| No row matches | Add the item to the report. Do not change it. |

Do not change the existing wire payload or user messages.

- [x] **Step 4: Check public behavior**

Run `corepack pnpm@11.28.5 build`.
Run `node --test --test-reporter=tap packages/host/api/tests/request-failure.test.mjs tests/request-lifecycle.test.mjs tests/attachment-admission.test.mjs tests/step-approval.test.mjs`.
Expected: build exits with code 0. Tests print `# fail 0`.
Run `rg -n "HttpError|http-error" packages/host/api/src/request-controller.ts`.
Expected: exit code 1 with no matches.
Keep existing HTTP tests. The new direct test does not prove HTTP compatibility.

- [x] **Final step: Report and stop**

Send this report in the conversation:

- Files changed, including moves.
- Commands run, exit codes, and the last 20 output lines.
- Test and skip counts.
- Items that a decision table sends to the report.
- Existing failures and unresolved decisions.
- What the commands do not prove.

Mark steps complete only after their Expected results occur.
Do not start another task until the task owner accepts this report.

## References

1. <a id="ref-1"></a>[Project Structure](../../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Coding Guidelines](../../../../conventions/code.md)
3. <a id="ref-3"></a>[Testware](../../../../conventions/testware.md)

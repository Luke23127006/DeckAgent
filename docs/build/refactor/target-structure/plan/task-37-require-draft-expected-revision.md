# Task 37: Require expectedRevision with Zod decoders on draft and attachment writes

Read this file to learn the steps of Task 37, which decodes draft save and attachment removal bodies with Zod schemas and requires `expectedRevision` on `PUT /api/sessions/:sessionId/draft`.

**Type:** Code

After this task, `PUT /api/sessions/:sessionId/draft` and `DELETE /api/sessions/:sessionId/attachments/:attachmentId` decode their JSON bodies with Zod schemas in `@deckagent/host-contracts`. Both routes require a non-negative safe integer `expectedRevision` (`400 INVALID_REQUEST` when missing or malformed). `decodeDraftSaveBody` does not cap `text` length, so a draft above 16000 code points still gets `413 DRAFT_TOO_LARGE` from `MemoryDraftStore`. The Browser client always sends `expectedRevision`.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `packages/host/contracts/src/provider-validation.ts` and `workspace-validation.ts`
- `packages/host/contracts/src/index.ts` and `packages/host/contracts/tests/validation.test.mjs`
- `apps/host/src/modules/attachments/attachments.routes.ts` and `attachments.service.ts` (the method `save`)
- `apps/web/src/browser/transport/management-client.ts` (the method `saveDraftState`)
- `apps/web/src/browser/draft-sync.ts` (the method `flushDraft`)
- `e2e/local-foundation.test.mjs` and `e2e/model-requests.test.mjs`

**Files:**

- Create: `packages/host/contracts/src/attachment-validation.ts`
- Change: `packages/host/contracts/src/index.ts`
- Change: `apps/host/src/modules/attachments/attachments.routes.ts`, `attachments.service.ts`
- Change: `apps/web/src/browser/transport/management-client.ts`, `apps/web/src/browser/draft-sync.ts`
- Test: `packages/host/contracts/tests/validation.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/model-requests.test.mjs`

**Interfaces:**

- Produces, in `packages/host/contracts/src/attachment-validation.ts` (exported from `packages/host/contracts/src/index.ts`):
  - `export interface DraftSaveBody { readonly text: string; readonly expectedRevision: number; readonly attachmentIds?: readonly string[] }`
  - `export function decodeDraftSaveBody(value: unknown): DraftSaveBody`
    - Strict object (`z.strictObject`): `text` is a well-formed string (`z.string().refine(s => s.isWellFormed())`, no length cap), `expectedRevision` is `nonNegativeInt`, optional `attachmentIds` is `z.array(z.string()).refine(items => new Set(items).size === items.length)`.
    - Throws `new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')` on failure.
  - `export function decodeAttachmentRemoveBody(value: unknown): { readonly expectedRevision: number }`
    - Strict object (`z.strictObject({ expectedRevision: nonNegativeInt })`).
    - Throws `new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')` on failure.
- In `apps/host/src/modules/attachments/attachments.routes.ts`:
  - Add `parseBody` (same as `providers.routes.ts`: catches `RequestValidationError` and throws `new HttpError(400, error.code)`).
  - `PUT /api/sessions/:sessionId/draft` calls `parseBody(decodeDraftSaveBody, await readJson(req))` and passes it to `attachments.save(sessionId, body)`.
  - `DELETE /api/sessions/:sessionId/attachments/:attachmentId` calls `parseBody(decodeAttachmentRemoveBody, await readJson(req))` and passes `body.expectedRevision` to `attachments.remove(...)`.
- In `apps/host/src/modules/attachments/attachments.service.ts`:
  - `save(id: string, input: DraftSaveBody): Promise<ChatDraft>` checks `await this.chat(id)`, then checks `input.expectedRevision !== current.revision` (`DRAFT_CONFLICT`), then checks `attachmentIds` membership (`ATTACHMENT_NOT_FOUND`), cancels removed items, saves and discards unsent files.
- In `apps/web/src/browser/transport/management-client.ts` and `draft-sync.ts`:
  - `saveDraftState(id: string, text: string, expectedRevision: number): Promise<ChatDraft>` always sends `{ text, expectedRevision }`.
  - In `flushDraft`: read `const revision = this.draftStates.get(id)?.revision`. When `revision === undefined`, throw `new ManagementError('DRAFT_CONFLICT')`. Pass `revision` to `saveDraftState`.

**STOP when:** a test of Step 2 passes before Step 3.

**Forbidden:** add a length limit on `text` inside `decodeDraftSaveBody`.

## Test write rules

| File | Rule |
| --- | --- |
| `e2e/local-foundation.test.mjs` | Update each `PUT` to `/draft` that omits `expectedRevision` to send the current revision (`0` on a fresh chat, `1` after the first save on chat `a`). Keep the `16001`-char test (`413`) and the `extra: 1` test (`400`). |
| `e2e/model-requests.test.mjs` | Update the `PUT` to `/draft` on the bare chat to send `expectedRevision: 0`. |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 36 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write the failing tests**

Add this test at the end of `packages/host/contracts/tests/validation.test.mjs` (import `decodeAttachmentRemoveBody` and `decodeDraftSaveBody` from `../lib/index.js`):

```js
test('draft save and attachment remove decoders require expectedRevision and keep draft length checks for the store', () => {
  assert.deepEqual(decodeDraftSaveBody({ text: 'x'.repeat(16001), expectedRevision: 0 }), {
    text: 'x'.repeat(16001),
    expectedRevision: 0,
  })
  assert.deepEqual(decodeDraftSaveBody({ text: 'ok', expectedRevision: 2, attachmentIds: [attachmentOne] }), {
    text: 'ok',
    expectedRevision: 2,
    attachmentIds: [attachmentOne],
  })
  assert.deepEqual(decodeAttachmentRemoveBody({ expectedRevision: 1 }), { expectedRevision: 1 })
  const invalid = error => error instanceof RequestValidationError && error.code === 'INVALID_REQUEST'
  for (const value of [
    undefined,
    null,
    { text: 'ok' },
    { text: 'ok', expectedRevision: -1 },
    { text: 'ok', expectedRevision: 1.5 },
    { text: 'ok', expectedRevision: '0' },
    { text: 'ok', expectedRevision: 0, extra: true },
    { text: 'ok', expectedRevision: 0, attachmentIds: ['a', 'a'] },
    { text: '\uD800', expectedRevision: 0 },
  ])
    assert.throws(() => decodeDraftSaveBody(value), invalid)
  for (const value of [undefined, {}, { expectedRevision: -1 }, { expectedRevision: 0, extra: true }])
    assert.throws(() => decodeAttachmentRemoveBody(value), invalid)
})
```

Add this test at the end of `e2e/attachment-admission.test.mjs`:

```js
test('draft save and attachment removal require a non-negative integer expectedRevision', async t => {
  const { api, id } = await fixture(t)
  for (const body of [{ text: 'no revision' }, { text: 'neg', expectedRevision: -1 }, { text: 'str', expectedRevision: '0' }]) {
    const res = await api(`sessions/${id}/draft`, 'PUT', body)
    assert.deepEqual([res.status, res.data.error.code], [400, 'INVALID_REQUEST'])
  }
  const tooLong = await api(`sessions/${id}/draft`, 'PUT', { text: 'x'.repeat(16001), expectedRevision: 0 })
  assert.deepEqual([tooLong.status, tooLong.data.error.code], [413, 'DRAFT_TOO_LARGE'])
  const badRemove = await api(`sessions/${id}/attachments/att-11111111-1111-4111-8111-111111111111`, 'DELETE', {})
  assert.deepEqual([badRemove.status, badRemove.data.error.code], [400, 'INVALID_REQUEST'])
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test packages/host/contracts/tests/validation.test.mjs e2e/attachment-admission.test.mjs`

Expected: FAIL. The output contains `# fail 2`.

- [x] **Step 3: Write the code and update test writes**

Do the changes of the section `Interfaces` and the table `Test write rules`.

Run: `git grep -n -E "/draft', 'PUT'|/draft\`, 'PUT'" -- e2e apps/host/tests`

Expected: PASS. Each matching line sends `expectedRevision`.

Run: `corepack pnpm@11.28.5 build`, then `node --test packages/host/contracts/tests/validation.test.mjs e2e/attachment-admission.test.mjs e2e/local-foundation.test.mjs`

Expected: PASS. The output contains `# fail 0`.

- [x] **Step 4: Break the code and make sure that the tests fail**

In `packages/host/contracts/src/attachment-validation.ts`, make `expectedRevision` optional on `draftSaveBodySchema`. Build and run `node --test packages/host/contracts/tests/validation.test.mjs e2e/attachment-admission.test.mjs`. Expected: FAIL. `# fail 2`. Undo the change.

- [x] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [x] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: the Browser still shows the generic draft save failure text on `DRAFT_CONFLICT` inside `flushDraft`. Task 38 fixes it.
- `CHANGELOG.md` line: ``- Add Zod decoders `decodeDraftSaveBody` and `decodeAttachmentRemoveBody` in `@deckagent/host-contracts` and require `expectedRevision` on `PUT /api/sessions/:sessionId/draft`. Task 37 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: require expectedRevision on draft and attachment writes`

# Task 3: Add chat and approval body decoders to host contracts

Read this file to learn the steps of Task 3, which adds chat and approval body decoders in `@deckagent/host-contracts`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `packages/host/contracts/src/request-validation.ts` (the type `RequestValidationCode` and the class `RequestValidationError`)
- `packages/host/contracts/src/workspace-validation.ts`
- `packages/host/contracts/src/index.ts`
- `packages/host/contracts/tests/validation.test.mjs`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Create: `packages/host/contracts/src/chat-validation.ts`
- Change: `packages/host/contracts/src/request-validation.ts` (`RequestValidationCode`, add `decodeApprovalDecisionBody`)
- Change: `packages/host/contracts/src/index.ts` (export the four new decoders)
- Test: `packages/host/contracts/tests/validation.test.mjs`

**Interfaces:**
- Produces: `export type RequestValidationCode = 'INVALID_REQUEST' | 'INVALID_SESSION' | 'INVALID_SELECTION' | 'REQUEST_EMPTY' | 'REQUEST_TEXT_TOO_LONG'` in `packages/host/contracts/src/request-validation.ts`.
- Produces: `export function decodeApprovalDecisionBody(value: unknown): { readonly decision: 'allow-once' | 'refuse' }` in `packages/host/contracts/src/request-validation.ts`.
- Produces: `export function decodeModelSelection(value: unknown): ModelSelection`, `export function decodeChatCreateBody(value: unknown): { readonly selection?: ModelSelection }` and `export function decodeChatSearchBody(value: unknown): { readonly words: string }` in `packages/host/contracts/src/chat-validation.ts`.
- Produces: re-exports of those four functions from `packages/host/contracts/src/index.ts`.

**STOP when:** Task protocol only

**Forbidden:** Task protocol only

- [x] **Step 1: Write the failing test**

In `packages/host/contracts/tests/validation.test.mjs`, import `decodeApprovalDecisionBody`, `decodeChatCreateBody`, `decodeChatSearchBody` and `decodeModelSelection` from `'../lib/index.js'`. Add this test at the end of the file:

```js
test('chat and approval body decoders validate wire shapes and throw the expected validation codes', () => {
  assert.deepEqual(decodeModelSelection({ provider: 'openai', model: 'gpt-4o' }), {
    provider: 'openai',
    model: 'gpt-4o',
  })
  assert.deepEqual(decodeChatCreateBody({}), {})
  assert.deepEqual(decodeChatCreateBody({ selection: { provider: 'openai', model: 'gpt-4o' } }), {
    selection: { provider: 'openai', model: 'gpt-4o' },
  })
  assert.deepEqual(decodeChatSearchBody({ words: '' }), { words: '' })
  assert.deepEqual(decodeChatSearchBody({ words: 'x'.repeat(500) }), { words: 'x'.repeat(500) })
  assert.deepEqual(decodeApprovalDecisionBody({ decision: 'allow-once' }), { decision: 'allow-once' })
  assert.deepEqual(decodeApprovalDecisionBody({ decision: 'refuse' }), { decision: 'refuse' })

  const hasCode = code => error => error instanceof RequestValidationError && error.code === code
  for (const bad of [undefined, null, [], 'text', { extra: 1 }, { selection: { provider: 'p', model: 'm' }, extra: 1 }])
    assert.throws(() => decodeChatCreateBody(bad), hasCode('INVALID_SESSION'))
  for (const bad of [
    null,
    [],
    {},
    { provider: 'bad space', model: 'm' },
    { provider: 'p'.repeat(101), model: 'm' },
    { provider: 'p', model: '   ' },
    { provider: 'p', model: 'm'.repeat(201) },
    { provider: 'p', model: 'm', extra: 1 },
  ]) {
    assert.throws(() => decodeModelSelection(bad), hasCode('INVALID_SELECTION'))
    assert.throws(() => decodeChatCreateBody({ selection: bad }), hasCode('INVALID_SELECTION'))
  }
  for (const bad of [undefined, null, [], {}, { words: 123 }, { words: 'x'.repeat(501) }, { words: 'ok', extra: 1 }])
    assert.throws(() => decodeChatSearchBody(bad), hasCode('INVALID_REQUEST'))
  for (const bad of [undefined, null, [], {}, { decision: 'allow' }, { decision: 'refuse', extra: 1 }])
    assert.throws(() => decodeApprovalDecisionBody(bad), hasCode('INVALID_REQUEST'))
})
```

- [x] **Step 2: Run the test and make sure that it fails**

Run: `node --test --test-reporter=tap packages/host/contracts/tests/validation.test.mjs`
Expected: FAIL. Node exits with a non-zero code because `decodeChatCreateBody` does not exist in `../lib/index.js`.

- [x] **Step 3: Implement the decoders and export them**

In `packages/host/contracts/src/request-validation.ts`:
- Expand `RequestValidationCode` to `'INVALID_REQUEST' | 'INVALID_SESSION' | 'INVALID_SELECTION' | 'REQUEST_EMPTY' | 'REQUEST_TEXT_TOO_LONG'`.
- Add `approvalDecisionBodySchema = z.strictObject({ decision: z.enum(['allow-once', 'refuse']) })`.
- Export `decodeApprovalDecisionBody(value: unknown): { readonly decision: 'allow-once' | 'refuse' }`. On failure, throw `new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')`.

Create `packages/host/contracts/src/chat-validation.ts`:
- `modelSelectionSchema = z.strictObject({ provider: z.string().regex(/^[\w.-]{1,100}$/), model: z.string().max(200).refine(value => value.trim().length > 0) })`.
- `chatCreateBodySchema = z.strictObject({ selection: z.unknown().optional() })`.
- `chatSearchBodySchema = z.strictObject({ words: z.string().max(500) })`.
- `decodeModelSelection(value: unknown): ModelSelection`: parse with `modelSelectionSchema.safeParse(value)`. On failure, throw `new RequestValidationError('INVALID_SELECTION', 'Model selection payload is invalid')`.
- `decodeChatCreateBody(value: unknown): { readonly selection?: ModelSelection }`: parse with `chatCreateBodySchema.safeParse(value)`. On failure, throw `new RequestValidationError('INVALID_SESSION', 'Chat create payload is invalid')`. If `parsed.data.selection === undefined`, return `{}`. Otherwise return `{ selection: decodeModelSelection(parsed.data.selection) }`.
- `decodeChatSearchBody(value: unknown): { readonly words: string }`: parse with `chatSearchBodySchema.safeParse(value)`. On failure, throw `new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')`.

In `packages/host/contracts/src/index.ts`, export `decodeApprovalDecisionBody` from `./request-validation.ts` and export `decodeChatCreateBody`, `decodeChatSearchBody` and `decodeModelSelection` from `./chat-validation.ts`.

- [x] **Step 4: Build, run the tests and run the checks**

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

Run: `node --test --test-reporter=tap packages/host/contracts/tests/validation.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [x] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

# Task 4: Split message validation into Zod schema and chat text helpers

Read this file to learn the steps of Task 4, which adds Zod to `apps/host`, splits `message.ts` into `message-validation.ts` and `chat-text.ts`, and updates `SqliteChatStore`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `apps/host/package.json`
- `apps/host/src/modules/chats/message.ts`
- `apps/host/src/modules/chats/chats.store.ts`
- `apps/host/tests/session-persistence.test.mjs`
- `apps/host/tests/chat-persistence.test.mjs`
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Change: `apps/host/package.json` (add `"zod": "4.6.7"` in `dependencies`)
- Change: `pnpm-lock.yaml` (updated by `corepack pnpm@11.28.5 install --offline`)
- Create: `apps/host/src/modules/chats/message-validation.ts`
- Create: `apps/host/src/modules/chats/chat-text.ts`
- Remove: `apps/host/src/modules/chats/message.ts`
- Change: `apps/host/src/modules/chats/chats.store.ts` (imports, `validateMessage`, `admitUserMessageInTx`, `insertMessages`, `messages`)
- Test: `apps/host/tests/session-persistence.test.mjs`

**Interfaces:**
- Produces: `export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }`, `export const messageSchema`, `export type Message = z.infer<typeof messageSchema>` and `export function decodeMessage(value: unknown): Message` in `apps/host/src/modules/chats/message-validation.ts`.
- Produces: `export function chatTitle(messages: readonly TextMessage[]): string`, `export function searchWords(value: string): readonly string[]` and `export function chatMatches(title: string, messages: readonly TextMessage[], words: readonly string[]): boolean` in `apps/host/src/modules/chats/chat-text.ts`.

**STOP when:** `corepack pnpm@11.28.5 install --offline` fails because `zod@4.6.7` is absent from the offline store.

**Forbidden:** Do not import `../../db/` from `message-validation.ts` or `chat-text.ts`. Do not define a `record()` or `isRecord()` helper.

- [x] **Step 1: Add characterization tests for message validation edge cases**

In `apps/host/tests/session-persistence.test.mjs`, add this test at the end of the file:

```js
test('message validation rejects unknown fields, explicit undefined, cycles, symbol keys and invalid attachments', async t => {
  const store = openSessionStore(await database(t))
  try {
    await store.open('strict-msg')
    const cyclic = {}
    cyclic.self = cyclic
    const withSymbol = { role: 'user', content: 'hi', [Symbol('tag')]: 1 }
    const nonPlain = Object.assign(Object.create({ inherited: true }), { role: 'user', content: 'hi' })
    for (const bad of [
      { role: 'system', content: 'ok', extra: 1 },
      { role: 'user', content: 'ok', extra: 1 },
      { role: 'assistant', content: 'ok', interrupted: false },
      { role: 'assistant', content: 'ok', interrupted: undefined },
      { role: 'assistant', content: 'ok', toolCalls: undefined },
      { role: 'assistant', content: 'ok', providerState: undefined },
      { role: 'assistant', content: 'ok', providerState: { provider: 'p', model: 'm', data: cyclic } },
      { role: 'tool', content: 'ok', toolCallId: '  ', name: 'read', isError: false },
      { role: 'tool', content: 'ok', toolCallId: 'id-1', name: '  ', isError: false },
      withSymbol,
      nonPlain,
    ]) {
      await assert.rejects(store.append('strict-msg', [bad]), { code: 'SESSION_MESSAGE' })
    }
    assert.throws(
      () =>
        store.chatStore.admitUserMessageInTx('strict-msg', 'hello', [
          {
            attachmentId: 'bad-id',
            name: 'note.txt',
            state: 'preparing',
            byteSize: 10,
          },
        ]),
      { code: 'SESSION_MESSAGE' },
    )
    assert.deepEqual(await store.read('strict-msg'), [])
  } finally {
    store.close()
  }
})
```

Run: `node --test --test-reporter=tap apps/host/tests/session-persistence.test.mjs`
Expected: PASS. The output contains `# fail 0`.

- [x] **Step 2: Add Zod 4.6.7 to `apps/host/package.json`**

Add `"zod": "4.6.7"` to `dependencies` in `apps/host/package.json`.

Run: `corepack pnpm@11.28.5 install --offline`
Expected: exit code 0.

- [x] **Step 3: Create `message-validation.ts` and `chat-text.ts`, and remove `message.ts`**

Create `apps/host/src/modules/chats/chat-text.ts` with `TextMessage`, `titleLength = 64`, `chatTitle`, `searchWords` and `chatMatches` moved unchanged from `message.ts`.

Create `apps/host/src/modules/chats/message-validation.ts`:
- Export `JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }`.
- Write `isJsonValue(value: unknown, parents = new Set<object>()): value is JsonValue` with the exact checks from `json()` in `message.ts`: finite numbers, dense arrays, plain object prototypes (`Object.prototype` or `null`), no symbols, no cycles and no `undefined` values.
- Write `isJsonRecord(value: unknown): value is Record<string, JsonValue>` checking `value !== null && typeof value === 'object' && !Array.isArray(value) && isJsonValue(value)`.
- Define `jsonValueSchema = z.custom<JsonValue>(isJsonValue)` and `jsonRecordSchema = z.custom<Record<string, JsonValue>>(isJsonRecord)`.
- Build `messageSchema = z.discriminatedUnion('role', [systemMessageSchema, userMessageSchema, assistantMessageSchema, toolMessageSchema])` using `z.strictObject` for every object and `.exactOptional()` for every optional property (`attachments`, `preparation`, `parsedFingerprint`, `omitted[i].entry`, `toolCalls`, `interrupted`, `providerState`). Preserve every regex and length cap from `message.ts`.
- Export `type Message = z.infer<typeof messageSchema>`.
- Export `decodeMessage(value: unknown): Message`: if `!isJsonValue(value)`, throw `new Error('INVALID_MESSAGE')`. Run `messageSchema.safeParse(value)`. If `!parsed.success`, throw `new Error('INVALID_MESSAGE')`. Return `parsed.data`.

Remove `apps/host/src/modules/chats/message.ts`.

- [x] **Step 4: Update `chats.store.ts`**

In `apps/host/src/modules/chats/chats.store.ts`:
- Remove `Message` from the import from `'../../db/index.ts'`.
- Import `chatMatches`, `chatTitle`, `searchWords` from `'./chat-text.ts'`.
- Import `decodeMessage` and `type Message` from `'./message-validation.ts'`.
- Replace `validateMessage` with `function validateMessage(value: unknown): Message` that returns `decodeMessage(value)` and catches errors to throw `new SessionError('SESSION_MESSAGE', 'Message does not match the supported Session format')`.
- In `admitUserMessageInTx`, build `const message = validateMessage({ role: 'user', content: input, ...(attachments.length ? { attachments } : {}) })` and pass `[message]` to `this.insertMessages`.
- In `insertMessages`, assign `const validated = validateMessage(message)` and store `JSON.stringify(validated)`.
- In `messages`, return `decodeMessage(JSON.parse(String(row.payload)))` inside the existing `try`/`catch`.

- [x] **Step 5: Build, run tests and run checks**

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

Run: `node --test --test-reporter=tap apps/host/tests/session-persistence.test.mjs apps/host/tests/chat-persistence.test.mjs`
Expected: exit code 0 and `# fail 0`.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

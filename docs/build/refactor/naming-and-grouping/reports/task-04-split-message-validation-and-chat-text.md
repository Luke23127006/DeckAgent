# Task 4 Report: Split message validation into Zod schema and chat text helpers

Read this file to know how Task 4 replaced `message.ts` with `message-validation.ts` and `chat-text.ts` and which checks passed.

## Files changed

- `apps/host/package.json`: added `"zod": "4.6.7"` to `dependencies`.
- `apps/host/src/modules/chats/message-validation.ts`: created `JsonValue`, `messageSchema`, `Message` (`z.infer`) and `decodeMessage` using Zod 4 `.exactOptional()` and raw-input `isJsonValue`.
- `apps/host/src/modules/chats/chat-text.ts`: moved `TextMessage`, `chatTitle`, `searchWords` and `chatMatches` from `message.ts`.
- `apps/host/src/modules/chats/message.ts`: removed.
- `apps/host/src/modules/chats/chats.store.ts`: switched to `decodeMessage`, `Message` from `./message-validation.ts` and text helpers from `./chat-text.ts`.
- `apps/host/tests/session-persistence.test.mjs`: added `message validation rejects unknown fields, explicit undefined, cycles, symbol keys and invalid attachments`.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap apps/host/tests/session-persistence.test.mjs` (Step 1) | 0 | `# pass 8`, `# fail 0` |
| `corepack pnpm@11.28.5 install --offline` | 0 | Linked `zod@4.6.7` into `apps/host/node_modules/zod` |
| `corepack pnpm@11.28.5 build` | 0 | `tsc -b` and all workspace bundles succeeded |
| `node --test --test-reporter=tap apps/host/tests/session-persistence.test.mjs apps/host/tests/chat-persistence.test.mjs` | 0 | `# pass 19`, `# fail 0` |
| `corepack pnpm@11.28.5 lint` | 0 | `Found 0 warnings and 0 errors.` |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |

## STOP and retry

none

## What the commands do not prove

- Full e2e attachment admission flows wait for Task 7 (the Phase 2 exit check).

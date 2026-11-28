# Task 51: Implement the AgentRuntime port, usage tracking and error categories in apps/host/src/runtimes/opencode

Read this file to learn the steps of Task 51, which implements `AgentRuntime`, `RunUsage` tracking and `RunErrorCategory` mapping in `apps/host/src/runtimes/opencode/`.

**Type:** Code

After this task, `apps/host/src/runtimes/opencode/` parses optional `tokens` on `step_finish`, classifies every provider and adapter failure into the `RunErrorCategory` table of `docs/architecture/10-agent-core.md`, reports incremental `RunUsage` (`modelCalls` and optional `inputTokens`/`outputTokens`), and exports `OpenCodeAgentRuntime` implementing `AgentRuntime`. The existing `OpenCodeRuntime` keeps its behavior unchanged until Revision 4b switches `runs/lifecycle/` to `OpenCodeAgentRuntime`.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/architecture/10-agent-core.md` (sections `### Port AgentRuntime` and `## Map từ code lỗi sang category`)
- `apps/host/src/runs/ports.ts` (`AgentRuntime`, `RunInput`, `RunSink`, `RunUsage`, `RunError`, `RunErrorCategory`, `RunResult`, `RuntimeAvailability`, `ConversationMessage`, `runOwnerKey`)
- `apps/host/src/runtimes/opencode/events.ts`, `stream-tracker.ts`, `config.ts`, `history.ts`, `runtime.ts`, `index.ts`
- `apps/host/tests/opencode-adapter.test.mjs` and `apps/host/tests/fixtures/fake-opencode.mjs`

**Files:**

- Create: `apps/host/src/runtimes/opencode/agent-runtime.ts`
- Change: `apps/host/src/runtimes/opencode/events.ts`, `apps/host/src/runtimes/opencode/stream-tracker.ts`, `apps/host/src/runtimes/opencode/config.ts`, `apps/host/src/runtimes/opencode/history.ts`, `apps/host/src/runtimes/opencode/index.ts`
- Test: `apps/host/tests/opencode-adapter.test.mjs`

**Interfaces:**

- Produces, in `apps/host/src/runtimes/opencode/events.ts`:
  - `step_finish` event adds optional `readonly tokens?: { readonly input?: number; readonly output?: number }`
  - `export function classifyProviderError(event: Extract<OpenCodeEvent, { type: 'error' }>): RunError`
- Produces, in `apps/host/src/runtimes/opencode/history.ts`:
  - `export function seedConversationPrompt(messages: readonly ConversationMessage[], input: string): string`
- Changes, in `apps/host/src/runtimes/opencode/config.ts`:
  - `runtimeConfiguration(settings: ProviderRunSettings, bridge?: { readonly url: string; readonly names: readonly string[] }, instructions?: string, stepLimit?: number | 'none')`
- Produces, in `apps/host/src/runtimes/opencode/agent-runtime.ts` (exported from `apps/host/src/runtimes/opencode/index.ts`):
  - `export interface OwnerRuntimeBinding { readonly ownerKey: string; readonly nativeSessionId: string; readonly selection: { readonly provider: string; readonly model: string }; readonly context: string; readonly lastRequestId: string }`
  - `export interface OwnerBindingStore { binding(ownerKey: string): OwnerRuntimeBinding | undefined; bind(binding: OwnerRuntimeBinding): void; unbind(ownerKey: string): void; lastCompletedRequestId(ownerKey: string, currentRequestId: string): string | undefined }`
  - `export class OpenCodeAgentRuntime implements AgentRuntime` with `readonly name = 'opencode'`, `availability(): Promise<RuntimeAvailability>` and `run(input: RunInput, sink: RunSink): Promise<RunResult>`

**STOP when:** any error code in `apps/host/src/runtimes/opencode/events.ts` or `stream-tracker.ts` maps to a category different from `docs/architecture/10-agent-core.md`, or an existing `test:model-requests` assertion fails.

**Forbidden:** change any existing error code string on the HTTP wire. Import any module from `apps/host/src/modules/` inside `apps/host/src/runtimes/opencode/`.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 50 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write failing tests in `apps/host/tests/opencode-adapter.test.mjs`**

Add tests in `apps/host/tests/opencode-adapter.test.mjs` covering:

1. `parseEvent` reads non-negative finite `part.tokens.input` and `part.tokens.output` on `step_finish`, and omits invalid or absent token fields.
2. `classifyProviderError` maps all seven provider conditions (`401`/`403`/`ProviderAuthError` -> `provider-auth`, `429` -> `provider-rate-limit`, `404` -> `provider-model`, `500` -> `provider-other`/`PROVIDER_HTTP`, no-status error -> `provider-other`/`RUNTIME_FAILED`, `ContextOverflowError` -> `context-limit`, image refusal -> `input-unsupported`).
3. `runtimeConfiguration` sets `agent.deckagent.steps` from `stepLimit` when provided (`4` sets `steps: 4`, `'none'` omits `steps`).
4. `OpenCodeAgentRuntime` (running `fake-opencode.mjs`) implements `AgentRuntime`:
   - `availability()` returns `{ available: true }` for a matching version, `{ available: false, code: 'RUNTIME_UNAVAILABLE' }` when missing, and `{ available: false, code: 'RUNTIME_VERSION_UNSUPPORTED' }` on version mismatch.
   - `run(input, sink)` emits `activity`/`text` events, reports incremental `sink.usage(...)` with `modelCalls >= 1`, seeds from `RunResource` (`kind: 'conversation'`), keys its folder and `OwnerBindingStore` by `runOwnerKey(input.owner)`, and returns `{ status: 'completed', usage, commit }`.
   - `run(input, sink)` returns categorized `RunError` values for `runtime-unavailable` (missing executable), `runtime-config` (`PROVIDER_UNSUPPORTED`), `timeout` (`REQUEST_TIMEOUT`), `stopped` (`STOPPED`) and `content-blocked` (`CONTEXT_SUMMARY_FAILED` with `content-filter`).

- [x] **Step 3: Run the adapter test and check that it fails**

Run: `node --test apps/host/tests/opencode-adapter.test.mjs`

Expected: FAIL. New exports (`classifyProviderError`, `OpenCodeAgentRuntime`) do not exist yet.

- [x] **Step 4: Implement `events.ts`, `stream-tracker.ts`, `config.ts`, `history.ts` and `agent-runtime.ts`**

1. In `events.ts`, parse optional `tokens` on `step_finish` and add `classifyProviderError`. Make `errorCode(event)` return `classifyProviderError(event).code`.
2. In `stream-tracker.ts`, track `modelCalls` (from `modelSteps`) and optional cumulative `inputTokens`/`outputTokens`, notify an optional `onUsage?: (usage: RunUsage) => void` callback on each `step_finish`, and track `RunError` (`category` + `code`) for every condition in `docs/architecture/10-agent-core.md` (`content-blocked` for summary `content-filter`, `context-limit` for summary `error`/overflow/unclosed, `stopped`, `timeout`, `runtime-unavailable`, `runtime-protocol`, `runtime-failed`, `runtime-incomplete`). Expose `runResult: RunResult` on `AttemptResult` alongside `outcome` so existing `OpenCodeRuntime` stays intact.
3. In `config.ts`, accept optional `stepLimit?: number | 'none'` on `runtimeConfiguration` and keep the existing default when `stepLimit` is `undefined`.
4. In `history.ts`, extract `seedConversationPrompt(messages, input)` for `ConversationMessage` and have `seedPrompt` delegate to it.
5. Create `apps/host/src/runtimes/opencode/agent-runtime.ts` implementing `OpenCodeAgentRuntime` (`AgentRuntime`), reusing `runtimeConfiguration`, `encodeConfiguration`, `isolatedEnvironment`, `safeConfiguration`, `openToolBridge`, `runProcess`, `seedConversationPrompt`, `createAttemptTimer` and `createStreamTracker`. Export `OpenCodeAgentRuntime`, `OwnerRuntimeBinding` and `OwnerBindingStore` from `apps/host/src/runtimes/opencode/index.ts`.

- [x] **Step 5: Format, build and check**

Remove `apps/host/lib` first. Do the step `Format, build and check` of the Task protocol. Run `node --test apps/host/tests/opencode-adapter.test.mjs tests/oxlint-boundaries.test.mjs`.

Expected: PASS. Output contains `# fail 0`.

- [x] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add a table `Error category coverage` with columns `Code | Category | Covered by test`.

- What the commands do not prove: live OpenCode 1.19.5 token fields on `step_finish` remain unmeasured (`inputTokens` and `outputTokens` stay optional). `server.ts` still wires `OpenCodeRuntime` until Revision 4b moves `runs/lifecycle/`.
- `CHANGELOG.md` line: ``- Implement `OpenCodeAgentRuntime` (`AgentRuntime` port), `RunUsage` tracking and `RunErrorCategory` classification in `apps/host/src/runtimes/opencode/`. Task 51 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: implement AgentRuntime port, usage tracking and error categories in OpenCode adapter`

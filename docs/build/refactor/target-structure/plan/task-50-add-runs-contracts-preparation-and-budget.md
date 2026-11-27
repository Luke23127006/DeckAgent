# Task 50: Add apps/host/src/runs contracts, preparation composer, budget monitor and boundary rules

Read this file to learn the steps of Task 50, which creates `apps/host/src/runs/ports.ts`, `runs/preparation/`, `runs/budget/` and their folder-level boundary rules.

**Type:** Code

After this task, `apps/host/src/runs/` defines the Phase 1 contracts of `docs/architecture/10-agent-core.md`, composes `RunContribution` parts into `RunInput`, tracks `RunUsage` budgets and owns `ProviderRunSettings`. `apps/host/src/runtimes/opencode/` imports `ProviderRunSettings` from `../../runs/ports.ts`, and `.oxlintrc.json` blocks `modules/` inside both `runs/` and `runtimes/`. No file in `apps/host/src/runs/` contains `sessionId:` or imports a module, Express, SQLite or a runtime adapter.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/ste-vi/SKILL.md`
- `docs/architecture/10-agent-core.md` (section `## Contract`)
- `apps/host/src/modules/providers/provider-catalog.ts` and `index.ts`
- `apps/host/src/runtimes/opencode/config.ts`, `contracts.ts`, `provider.ts`, `runtime.ts`
- `.oxlintrc.json`, `tests/oxlint-boundaries.test.mjs`, `package.json`, `docs/conventions/project-structure.md`

**Files:**

- Create: `apps/host/src/runs/ports.ts`, `apps/host/src/runs/preparation/index.ts`, `apps/host/src/runs/budget/index.ts`, `apps/host/src/runs/index.ts`
- Change: `apps/host/src/modules/providers/provider-catalog.ts`, `apps/host/src/modules/providers/index.ts`, `apps/host/src/runtimes/opencode/config.ts`, `apps/host/src/runtimes/opencode/contracts.ts`, `apps/host/src/runtimes/opencode/provider.ts`, `apps/host/src/runtimes/opencode/runtime.ts`, `.oxlintrc.json`, `package.json`, `docs/conventions/project-structure.md`
- Test: `apps/host/tests/runs-preparation.test.mjs` (create), `tests/oxlint-boundaries.test.mjs`

**Interfaces:**

- Produces, in `apps/host/src/runs/ports.ts`:
  - `RunOwnerKind = 'chat'`, `RunOwner`, `runOwnerKey(owner: RunOwner): string`, `SourceKind = 'workspace-files' | 'attachments' | 'research'`, `RunGrants`, `RunPlan`
  - `PreparationContext`, `RunContribution`, `RunParts`, `ConversationMessage`, `RunResource`
  - `ApprovalStep`, `ToolSchema`, `ToolResult`, `ToolContext`, `ToolExecutor`, `ToolSet`, `RunTools`
  - `ProviderRunSettings`, `ProviderResolver`
  - `RunInput`, `RunEvent`, `RunUsage`, `RunSink`, `RunErrorCategory`, `RunError`, `RunResult`, `RuntimeAvailability`, `AgentRuntime`
  - `RunBudgetLimits`, `RunBudgetTracker`, `RunRecord`, `RunStore` (using `owner: RunOwner`, no `sessionId` field), `RunFailure` (`class RunFailure extends Error { constructor(readonly code: string) }`)
- Produces, in `apps/host/src/runs/preparation/index.ts`:
  - `export async function prepareRunInput(options: { readonly plan: RunPlan; readonly requestId: string; readonly signal: AbortSignal; readonly registered: readonly RunContribution[]; readonly providers: ProviderResolver; readonly approve: (step: ApprovalStep) => Promise<boolean>; readonly onApprovalWait: (listener: (waiting: boolean) => void) => () => void }): Promise<RunInput>`
- Produces, in `apps/host/src/runs/budget/index.ts`:
  - `export function createRunBudget(limits?: RunBudgetLimits, onExceeded?: (reason: 'model-calls' | 'input-tokens' | 'output-tokens') => void): RunBudgetTracker` (`record(total: RunUsage): void`, `latest(): RunUsage`, `exceeded(): 'model-calls' | 'input-tokens' | 'output-tokens' | undefined`)
- Produces, in `apps/host/src/runs/index.ts`: re-exports all public symbols and types from `./ports.ts`, `./preparation/index.ts` and `./budget/index.ts`.

**STOP when:** a contract field in `apps/host/src/runs/ports.ts` differs from `docs/architecture/10-agent-core.md`, or `git grep "sessionId:" apps/host/src/runs/` prints any line.

**Forbidden:** import any module, Express, `node:http`, `node:https`, `node:sqlite`, `@deckagent/session-persistence`, `@deckagent/deck` or `runtimes/` inside `apps/host/src/runs/`. Put a `sessionId` field on any contract type in `apps/host/src/runs/ports.ts`.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 49 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Write the failing test `apps/host/tests/runs-preparation.test.mjs`**

Create `apps/host/tests/runs-preparation.test.mjs` with tests covering:

1. `prepareRunInput` calls registered contributions in registration order, then `plan.contributions` in plan order. It concatenates `instructions` and `resources` in that exact order. It merges distinct `ToolSet` schemas and routes `tools.call(name, args)` to the matching executor with the bound `ToolContext`. It rejects unknown tool names with `TOOL_NOT_ALLOWED` and resolves provider settings through `ProviderResolver`.
2. `prepareRunInput` rejects duplicate tool names across contributions with `RunFailure` (`code === 'TOOL_NAME_CONFLICT'`).
3. `createRunBudget` tracks the latest `RunUsage`. It does not fire when no limits exist. It fires `onExceeded` once with `'model-calls'`, `'input-tokens'` or `'output-tokens'` when usage exceeds a limit.

Add `apps/host/tests/runs-preparation.test.mjs` to `test:model-requests` in `package.json`.

- [ ] **Step 3: Run the new test and check that it fails**

Run: `node --test apps/host/tests/runs-preparation.test.mjs`

Expected: FAIL. Module import fails because `apps/host/lib/types/runs/index.js` does not exist yet.

- [ ] **Step 4: Implement `apps/host/src/runs/` and move `ProviderRunSettings`**

1. Create `apps/host/src/runs/ports.ts` matching `docs/architecture/10-agent-core.md` (`## Contract`) word for word, importing types only from `@deckagent/host-contracts`.
2. Implement `apps/host/src/runs/preparation/index.ts`. Call `registered` and then `plan.contributions`, and concatenate instructions and resources. Merge `ToolSet` values by hashing each `context` with sha256 and joining non-empty `manifest` strings with `'\n\n'`. Reject duplicate schema names with `new RunFailure('TOOL_NAME_CONFLICT')`. Bind `ToolContext` into `RunTools`, resolve `ProviderRunSettings` via `providers.resolve(plan.selection)` and return `RunInput`.
3. Implement `apps/host/src/runs/budget/index.ts` (`createRunBudget`) and `apps/host/src/runs/index.ts`.
4. Move the `ProviderRunSettings` declaration out of `apps/host/src/modules/providers/provider-catalog.ts` into `apps/host/src/runs/ports.ts`. Re-export `type ProviderRunSettings` from `modules/providers/provider-catalog.ts` and `modules/providers/index.ts` for existing callers. Change `apps/host/src/runtimes/opencode/{config,contracts,provider,runtime}.ts` to import `type { ProviderRunSettings }` from `../../runs/ports.ts`.

- [ ] **Step 5: Add oxlint boundary rules and negative fixtures**

1. In `.oxlintrc.json`, add `../runs/**` to `http/**`, add `../../modules/**` to `runtimes/**`, and add an override for `**/apps/host/src/runs/**/*.{ts,tsx,mts,cts,js,mjs,cjs}` blocking private package imports plus `../modules/**`, `../../modules/**`, `../runtimes/**`, `../../runtimes/**`, `../tools/**`, `../../tools/**`, `../http/**`, `../../http/**`, `../local-transport.ts`, `express`, `express/*`, `node:http`, `node:https`, `node:sqlite`, `@deckagent/session-persistence`, `@deckagent/deck` and `@deckagent/deck/*` with message `Agent core runs/ must not import modules, HTTP, SQL, tools or concrete runtimes.`.
2. In `tests/oxlint-boundaries.test.mjs`, add tests proving `apps/host/src/runs/preparation/index.ts` rejects `../../modules/chats/index.ts`, `../../runtimes/opencode/index.ts`, `express`, `node:sqlite`, `node:http` and `@deckagent/session-persistence`, and proving `apps/host/src/runtimes/opencode/provider.ts` rejects `../../modules/providers/index.ts` and accepts `../../runs/ports.ts`.
3. Update `docs/conventions/project-structure.md` (`## Enforcement`) to record the new `apps/host/src/runs/` and `apps/host/src/runtimes/` oxlint rules in `Chặn bởi`.

- [ ] **Step 6: Check `sessionId` absence, format, build and run tests**

Run: `git grep --untracked -n "sessionId:" -- apps/host/src/runs`

Expected: PASS. No line.

Remove `apps/host/lib` first. Do the step `Format, build and check` of the Task protocol. Run `node --test apps/host/tests/runs-preparation.test.mjs tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`.

Expected: PASS. Output contains `# fail 0`.

- [ ] **Step 7: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 8: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: `runs/lifecycle/` is not yet wired to `server.ts`. That wiring happens in Revision 4b.
- `CHANGELOG.md` line: ``- Add `apps/host/src/runs/` contracts (`ports.ts`), contribution preparation composer, budget monitor and folder-level oxlint rules, and move `ProviderRunSettings` into `runs/ports.ts`. Task 50 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: add runs contracts, preparation composer, budget monitor and boundary rules`

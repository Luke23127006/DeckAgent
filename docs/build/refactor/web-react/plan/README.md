# Browser in React Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of the Browser in React workstream.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `../reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Phase 1 adds the folder rules of the Browser and writes the Browser rules into the conventions.

**Approach:** One revision for each phase of the Browser in React workstream. The planner did the diagnosis of the phase, and the decisions below record the answers. The folder rules come first, so that the conventions name only checks that exist.

**Tech stack:** Node.js 22.19.0, pnpm 11.28.5 through `corepack pnpm@11.28.5`, TypeScript 6.0.3, `node:test`, oxlint 1.94.0.

**Spec:** [Browser in React](../README.md), [Browser Rules](../web-rules.md), [Browser Problems](../problems.md).

## Revision 1: Phase 1, decisions, conventions and checks

### Decisions

| Topic | Decision |
| --- | --- |
| Stack | React with Vite, React Router in declarative mode, TanStack Query, Tailwind CSS 4 with shadcn/ui, Vitest with jsdom and Testing Library, MSW. Phase 1 installs no library. Phase 2 installs them and sets each version in AGENTS.md |
| Layout | `apps/web/src/` has `main.tsx`, `routes.tsx`, `text.ts`, `pages/<page>/`, `components/`, `components/ui/`, `layouts/`, `hooks/`, `api/`, `contexts/`, `editor/` and `styles/`. `apps/web/mocks/` holds the development mocks |
| Tool for the folder rules | oxlint `eslint/no-restricted-imports` overrides in `.oxlintrc.json`, with fixtures in `tests/oxlint-boundaries.test.mjs`. `check:boundaries` does not change in Phase 1, because no file exists in the new folders |
| Workspace imports of new Browser code | The pattern group `["@deckagent/*", "!@deckagent/host-contracts"]`. The pattern names the current package name. The contracts move to `packages/contracts/` changes the name |
| Deck decoders (WB-03) | The contracts package exports a decoder for each deck payload that the Browser reads. The decoder calls the decoder of `@deckagent/presentation-document`. Phase 6 or Phase 7 does the code change. Phase 1 writes only the rule |
| File names | Kebab case for every file in `apps/web/src/` and `apps/web/mocks/`, also for components. oxlint `unicorn/filename-case` with `{ "case": "kebabCase" }` |
| HTML injection | oxlint `react/no-danger` for `apps/web/src/` and `apps/web/mocks/` |
| Route parameter of a chat | `/chats/:sessionId`, because the Coding Guidelines forbid a mix of `chatId` and `sessionId` before Phase 8 of the Naming and Grouping Refactor |
| Language of the conventions | Vietnamese, with the skill `ste-vi` in light mode |
| Out of Phase 1 | Any production code, any library install, any change to `scripts/check-boundaries.mjs` |

### Global Constraints

- Shell: Git Bash on Windows. Run each command from the repository root `C:\Users\Duy\Desktop\DeckAgent`.
- Package manager: `corepack pnpm@11.28.5`. Do not call `pnpm` directly.
- Documents in `docs/conventions/` and `AGENTS.md` are in Vietnamese. Documents in `docs/build/` are in English. Keep technical terms in English.
- A message of a check is English text that an agent reads. Write it in Simplified Technical English: short sentences, active voice, and a sentence that tells the fix.
- Do not change production code in `apps/` or `packages/`.
- Do not run the full set of test suites in a task. A task runs only the tests that its `Files` block changes or that test the changed code. Only a phase exit task runs all non-live test suites, to find defects and fix them.

### Task protocol

Each task obeys this protocol. A task file adds only its special conditions and actions.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in the task.
- The task needs a decision that the task does not contain.
- The same step failed two times.

**Forbidden:**

- Change a file that is not in the `Files` block of the task.
- Remove, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

**Files of each task:** in addition to the `Files` block, each task changes `plan/README.md`, its own task file and `../reports/README.md`, and it creates `../reports/task-NN-<slug>.md`.

**Step `Write the report file and stop`:**

1. Mark the other steps as `- [x]` in the task file. Change the row of the task in this file to `Done` and link `../reports/task-NN-<slug>.md`.
2. Create `../reports/task-NN-<slug>.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output of each command
   - The tables that the task asks for
   - Items that a decision table sent to the report
   - Each STOP and each retry, with the step and the cause. Write `none` when no STOP or retry occurred.
   - What the commands do not prove
3. Add a row for the task in `../reports/README.md` and run `corepack pnpm@11.28.5 check:docs`.
4. Mark this step as `- [x]`, stop, and send the report summary.

### Review Focus

- A page imports `src/api/` through the alias `@/api/...`, and the rule finds only relative paths. Test: `browser pages reject src/api, Node modules, domain packages and mocks` in [Task 1](task-01-add-browser-folder-rules.md).
- The negated pattern `!@deckagent/host-contracts` also lets another package through. Test: `browser pages reject src/api, Node modules, domain packages and mocks` in [Task 1](task-01-add-browser-folder-rules.md).
- An override for one folder replaces the base patterns, so that the folder loses the Node rule. Test: `browser api rejects React, TanStack Query, UI code and Node modules` in [Task 1](task-01-add-browser-folder-rules.md).
- `src/main.tsx` cannot start the mocks, because the mock rule also applies to it. Test: `browser folders accept the allowed data flow and main.tsx accepts mocks` in [Task 1](task-01-add-browser-folder-rules.md).
- The conventions name a check that does not exist, or keep the feature layout for `apps/web/`. Owner: [Task 2](task-02-write-browser-rules-into-conventions.md), Step 6.

### Tasks

| Task | Status | File |
| --- | --- | --- |
| 1 | Done | [Add the Browser folder rules](task-01-add-browser-folder-rules.md) ([report](../reports/task-01-add-browser-folder-rules.md)) |
| 2 | Done | [Write the Browser rules into the conventions](task-02-write-browser-rules-into-conventions.md) ([report](../reports/task-02-write-browser-rules-into-conventions.md)) |
| 3 | Done | [Phase 1 exit check](task-03-phase-1-exit-check.md) ([report](../reports/task-03-phase-1-exit-check.md)) |

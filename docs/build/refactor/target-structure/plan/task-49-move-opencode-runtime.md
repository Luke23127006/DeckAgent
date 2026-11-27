# Task 49: Move the OpenCode integration into apps/host/src/runtimes/opencode

Read this file to learn the steps of Task 49, which moves `apps/host/src/integrations/opencode/` into `apps/host/src/runtimes/opencode/` and adds runtime boundary rules.

**Type:** Move or rename

After this task, `apps/host/src/runtimes/opencode/` holds all eleven OpenCode adapter files, and `apps/host/src/integrations/` no longer exists. `scripts/check-boundaries.mjs` blocks private imports into `apps/host/src/runtimes/<name>/`. `.oxlintrc.json` blocks Express, `node:sqlite`, `http/` and `tools/` inside `apps/host/src/runtimes/`, and blocks `runtimes/` inside `http/` and `modules/`. Runtime behavior and the HTTP contract stay unchanged.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/ste-vi/SKILL.md`
- `apps/host/src/integrations/opencode/index.ts`, `contracts.ts`, `runtime.ts`
- `apps/host/src/server.ts` and `apps/host/src/features/requests/prepare-runtime.ts`
- `apps/host/tests/fixtures/b02-helpers.mjs`, `apps/host/tests/mcp-bridge.test.mjs`, `apps/host/tests/opencode-adapter.test.mjs`
- `.oxlintrc.json`, `scripts/check-boundaries.mjs`, `tests/oxlint-boundaries.test.mjs`, `tests/check-boundaries.test.mjs`
- `docs/conventions/project-structure.md` (sections `## Trong lúc chuyển` and `## Enforcement`)

**Files:**

- Move into `apps/host/src/runtimes/opencode/`: all 11 files of `apps/host/src/integrations/opencode/`
- Remove: `apps/host/src/integrations/`
- Change: `apps/host/src/server.ts`, `apps/host/src/features/requests/prepare-runtime.ts`, `.oxlintrc.json`, `scripts/check-boundaries.mjs`, `docs/conventions/project-structure.md`
- Test: `apps/host/tests/fixtures/b02-helpers.mjs`, `apps/host/tests/mcp-bridge.test.mjs`, `apps/host/tests/opencode-adapter.test.mjs`, `tests/oxlint-boundaries.test.mjs`, `tests/check-boundaries.test.mjs`

**Interfaces:**

- Keeps all existing exports of `apps/host/src/runtimes/opencode/index.ts`: `pinnedVersion`, `OpenCodeError`, `OpenCodeExecutor`, `openToolBridge`, `OpenCodeRuntime`, `findExecutable` and `OpenCodeOptions`.

**STOP when:** the build reports an error outside the tables `Mapping` and `Move rules`.

**Forbidden:** change OpenCode runtime behavior, CLI flags, event parsing or HTTP responses. Leave `apps/host/src/integrations/` on disk.

## Mapping

| Old | New |
| --- | --- |
| `apps/host/src/integrations/opencode/*.ts` (all 11 files) | `apps/host/src/runtimes/opencode/*.ts` (same file names) |

## Move rules

| Item | Rule |
| --- | --- |
| `apps/host/src/server.ts` | Change `./integrations/opencode/index.ts` to `./runtimes/opencode/index.ts`. |
| `apps/host/src/features/requests/prepare-runtime.ts` | Change `../../integrations/opencode/index.ts` to `../../runtimes/opencode/index.ts`. |
| `apps/host/tests/fixtures/b02-helpers.mjs`, `mcp-bridge.test.mjs`, `opencode-adapter.test.mjs` | Change `lib/types/integrations/opencode/` to `lib/types/runtimes/opencode/`. |
| `scripts/check-boundaries.mjs` | Add `runtimeOfPath` matching `/^apps\/host\/src\/runtimes\/([^/]+)\//`. Add the rule `runtime-private-import`: production code outside `apps/host/src/runtimes/<name>/` may import only `apps/host/src/runtimes/<name>/index`. Keep `integration-private-import` so existing unit tests stay valid. |
| `tests/check-boundaries.test.mjs` | Add one test that rejects a private import into `apps/host/src/runtimes/opencode/runtime.ts` with `runtime-private-import` and accepts `apps/host/src/runtimes/opencode/index.ts`. |
| `.oxlintrc.json` | Add `../runtimes/**` to the `http/**` override. Add `../../runtimes/**` and `../../../runtimes/**` to every `modules/**` override. Add an override for `**/apps/host/src/runtimes/**/*.{ts,tsx,mts,cts,js,mjs,cjs}` that blocks private package imports plus `express`, `express/*`, `node:sqlite`, `../../http/**`, `../../local-transport.ts` and `../../tools/**` with message `A runtime adapter must not import Express, SQL, HTTP edge or Host tools directly.`. Note: a later task adds `../../modules/**` to this override after `ProviderRunSettings` moves to `runs/ports.ts`. |
| `tests/oxlint-boundaries.test.mjs` | Add one test that `apps/host/src/runtimes/opencode/runtime.ts` rejects `express`, `node:sqlite`, `../../http/app.ts` and `../../tools/index.ts`. Add one test that `apps/host/src/http/app.ts` and `apps/host/src/modules/workspaces/index.ts` reject `../runtimes/opencode/index.ts` and `../../runtimes/opencode/index.ts`. |
| `docs/conventions/project-structure.md` | Remove the `apps/host/src/integrations/opencode/` and `apps/host/src/integrations/{images,...}/` rows from `## Trong lúc chuyển`. Add `runtime-private-import` and the `apps/host/src/runtimes/` oxlint rule to `## Enforcement`. |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 48 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Move the files and change the wiring**

Run `git mv` for all eleven files in `apps/host/src/integrations/opencode/` into `apps/host/src/runtimes/opencode/`. Remove the empty folder `apps/host/src/integrations/`. Apply all rows of `Move rules`.

- [ ] **Step 3: Check that no old path stays**

Run: `git grep --untracked -n "integrations/opencode" -- apps packages e2e scripts`

Expected: PASS. Only `scripts/scan-module-design.mjs` matches, or no line.

- [ ] **Step 4: Format, build and check**

Remove `apps/host/lib` first. Do the step `Format, build and check` of the Task protocol. Run `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`.

Expected: PASS. Output contains `# fail 0`.

- [ ] **Step 5: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Moved files` with the columns `Old path | New path`.

- What the commands do not prove: `apps/host/src/runtimes/opencode/` still imports the type `ProviderRunSettings` from `../../modules/providers/index.ts` until a later task moves that type to `apps/host/src/runs/ports.ts`.
- `CHANGELOG.md` line: ``- Move `apps/host/src/integrations/opencode/` into `apps/host/src/runtimes/opencode/` and enforce runtime adapter boundaries with `check:boundaries` and oxlint. Task 49 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: move OpenCode integration into apps/host/src/runtimes/opencode`

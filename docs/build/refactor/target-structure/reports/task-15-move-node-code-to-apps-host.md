# Task 15: Move the Node code of the web app into apps/host report

Read this file to learn which files moved to apps/host, which callers changed and the result of each check after the move.

## Files moved

The move used `git mv`, so Git records 74 renames.

| Group | From | To |
| --- | --- | --- |
| Composition root | `apps/web/src/index.ts` | `apps/host/src/server.ts` |
| Host source files | `apps/web/src/{cli.ts,draft-store.ts,local-transport.ts,storage-root.ts,web-state.ts}` | `apps/host/src/` |
| Feature and integration folders | `apps/web/src/features/`, `apps/web/src/integrations/` | `apps/host/src/` with the same names |
| Asset loader | `apps/web/src/ui-assets.ts` | `apps/web/src/index.ts` |
| License | `apps/web/OPENCODE-LICENSE` | `apps/host/OPENCODE-LICENSE` |
| Host tests | `apps/web/tests/{brief-host,commons-images,draft-store,image-research,mcp-bridge,opencode-adapter,opencode-resources,research,research-image-generation,wait-for,web-management}.test.mjs` | `apps/host/tests/` |
| Host fixtures | `apps/web/tests/fixtures/{b02-helpers,fake-opencode,wait-for}.mjs` | `apps/host/tests/fixtures/` |

## Files created

- `apps/host/package.json`: the workspace package `@deckagent/host`, with the entry `lib/server.js` and the extra bundle entry `lib/cli.js`.
- `apps/host/tsconfig.json`: the TypeScript project of the new application.

## Files changed

- `apps/host/src/server.ts`: reads `loadWebAssets` from `@deckagent/local-web` and drops the `clientDir` argument.
- `apps/host/src/cli.ts`: imports `./server.ts` in place of `./index.ts`.
- `apps/web/src/index.ts`: `loadWebAssets` reads the `browser` folder next to its own file.
- `apps/web/package.json`: keeps only `@deckagent/host-contracts` and `@deckagent/presentation-document`.
- `apps/web/tsconfig.json`: keeps only the references to `packages/host/contracts` and `tsconfig.browser.json`.
- `package.json`: adds the scripts `@deckagent/host`, the dependency `@deckagent/host` and the start path `apps/host/lib/cli.js`.
- `pnpm-lock.yaml`: changes the `importers` entries of `.`, `apps/host` and `apps/web` only.
- `tsconfig.json`: adds the project reference `apps/host`.
- `.gitignore`: names `/apps/host/resources/opencode/`.
- `scripts/build-workspace.mjs`: the extra entry and the main entry now belong to `@deckagent/host`.
- `scripts/package-opencode.mjs`: the default folder is `apps/host/`.
- `scripts/check-boundaries.mjs`: the feature and integration rules name `apps/host/src/`.
- `tests/check-boundaries.test.mjs`: adds the package `@deckagent/host` and moves the fixture paths.
- The 11 moved test files: import `../lib/server.js`, and the fixture paths point to `apps/web/tests/fixtures/`.
- `apps/host/tests/fixtures/b02-helpers.mjs`: imports `../../lib/server.js` and reads `browser-driver.mjs` from `apps/web/tests/fixtures/`.
- The 24 e2e files with a change: `artifact-rendering`, `attachment-admission`, `attachment-storage`, `browser-smoke`, `confirmation-host`, `deck-pipeline`, `env-startup`, `generation-bridge`, `generation-continuation-http`, `http-edge`, `image-recovery-http`, `interview-workflow`, `layout-review-browser`, `layout-review-http`, `local-foundation`, `local-web`, `model-requests`, `opencode-brief-live`, `opencode-generation-live`, `opencode-live`, `opencode-source-live`, `portable-generation-http`, `research-live` and `source-requests`.
- `docs/conventions/project-structure.md`: the mapping table of `## Trong lúc chuyển` names the new paths.
- `docs/architecture/10-agent-core.md`: the code paths point to `apps/host/src/`.
- `docs/build/refactor/target-structure/plan/README.md`: the Task 15 row is `Done`.
- `docs/build/refactor/target-structure/plan/task-15-move-node-code-to-apps-host.md`: the task file shows Steps 1 to 9 as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the index row of this report.
- `docs/build/refactor/target-structure/reports/task-15-move-node-code-to-apps-host.md`: this report.

## Commands run

Git Bash is not installed on this machine. Every command ran in PowerShell 5.1 from the repository root. `git mv` replaces the move loop, `Remove-Item -Recurse` replaces `rm -rf`, and `Select-String` replaces `grep`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | The first call printed 6 lines: the uncommitted work of Tasks 13 and 14. A person committed it. The second call printed no line. |
| 1 | `wc -l` of the four files, in PowerShell | 0 | `391`, `309`, `32`, `93` |
| 1 | Count of e2e files that name `@deckagent/local-web` | 0 | `12` |
| 2 | `git mv` for 1 root file, 7 source paths, 1 license, 11 tests and 3 fixtures | 0 | No output |
| 2 | `git status --short \| grep -c "^R"` | 0 | `74` |
| 3 | Create `apps/host/package.json` and `apps/host/tsconfig.json` | 0 | No output |
| 4 | `ls e2e/*.mjs \| node deckagent-move-edits.mjs` | 0 | `move-edits: 27 e2e files checked, 0 failures` |
| 4 | Search of `e2e/` and `apps/host/tests/` for the old package and fixture paths | 1 | No match, which is the expected result |
| 4 | `grep -c "apps/web/lib/cli.js" package.json` | 1 | `0` |
| 5 | `corepack pnpm@11.28.5 install --offline` | 0 | `+ @deckagent/host 0.0.0 <- apps\host` |
| 5 | `git diff --stat pnpm-lock.yaml` | 0 | `pnpm-lock.yaml \| 25 ++++++++++++++++++++-----` |
| 6 | `rm -rf apps/web/lib apps/host/lib` and `corepack pnpm@11.28.5 build` | 1 | `[UNRESOLVED_ENTRY] Cannot resolve entry module lib/browser-types/boot.js` |
| 6 | The same command after the removal of the stale `*.tsbuildinfo` files | 0 | The workspace builds complete |
| 6 | `ls apps/host/lib/server.js apps/host/lib/cli.js apps/web/lib/index.js apps/web/lib/browser/boot.js` | 0 | The four files exist |
| 6 | `corepack pnpm@11.28.5 lint` | 0 | No output |
| 6 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| 6 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# pass 35`, `# fail 0` |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 199 file(s) checked, 0 error(s) in 0 file(s)` |
| 7 | The 19 suites of the table below | 0 | Every suite matches its expected count |
| 8 | `git status --short` without the `apps/`, `e2e/` and plan folders | 0 | The 10 expected paths |
| 8 | `ls apps/web/src` | 0 | `browser` and `index.ts` |
| 9 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 200 file(s) checked, 0 error(s) in 0 file(s)` |

### Deviations in the run

The first build at Step 6 failed. A stale `apps/web/tsconfig.browser.tsbuildinfo` made `tsc -b` skip the Browser project, so `apps/web/lib/browser-types/boot.js` was absent. The bundle step then stopped with `[UNRESOLVED_ENTRY]`. `*.tsbuildinfo` is local build state and `.gitignore` names it. The removal of the 13 `*.tsbuildinfo` files made the same command pass.

30 of the 53 files that the edit script reads had CRLF line endings in the working tree. The repository stores LF (`.gitattributes`: `* text=auto eol=lf`). The edit script matches exact text with `\n`, so I wrote the 30 files with LF before Step 4. The conversion changes no stored content. After Step 4, `git status --short` lists `e2e/portable-generation.test.mjs`, `e2e/request-lifecycle.test.mjs` and `e2e/step-approval.test.mjs` as changed. `git diff` and `git hash-object` show no content change for these three files. The status entry comes from the line ending conversion and clears at the next `git add`.

## Suites of Step 7

| Suite | Exit code | `# pass` | `# fail` | Expected |
| --- | --- | --- | --- | --- |
| `test:http-edge` | 0 | 12 | 0 | 12 |
| `test:tools-browser` | 0 | 14 | 0 | 14 |
| `test:local-web` | 0 | 8 | 0 | 8 |
| `test:local-foundation` | 0 | 43 | 0 | 43 |
| `test:model-requests` | 0 | 29 | 0 | 29 |
| `test:source-permissions` | 0 | 11 | 0 | 11 |
| `test:attachments` | 0 | 29 | 0 | 29 |
| `test:research` | 0 | 5 | 0 | 5 |
| `test:images` | 0 | 39 | 0 | 39 |
| `test:outline-workflow` | 0 | 6 | 0 | 6 |
| `test:brief-foundation` | 0 | 15 | 0 | 15 |
| `test:deck-review` | 0 | 21 | 0 | 21 |
| `test:generation-publication` | 0 | 72 | 0 | 72 |
| `test:slide-pipeline` | 0 | 7 | 0 | 7 |
| `test:session-persistence` | 0 | 7 | 0 | 7 |
| `test:opencode-resources` | 0 | 3 | 0 | 3 |
| `test:layouts` | 0 | 10 | 0 | 10 |
| `test:browser-smoke` | 0 | 13 | 0 | 13 |
| `test:env-startup` | 0 | 2 | 0 | 2 |

Every suite passed on the first run.

## Paths that still name the old place

- `scripts/scan-module-design.mjs` keeps the path groups `apps/web/src/features/` and `apps/web/src/integrations/`. Task 15 forbids a change to this file.
- `tests/scan-module-design.test.mjs` and `tests/oxlint-boundaries.test.mjs` use paths under `apps/web/src/` as fixture text. Task 15 does not list them in its `Files` block.
- The plan and research files in `docs/build/` keep the old paths as history. The plan README, the task files `task-01` to `task-13`, the reports of Tasks 2 to 13, `agent-load-axes.md`, `criteria.md`, `current-gap.md`, `libraries.md`, `target-layout.md` and `docs/build/refactor/target-structure/README.md` are in this group. The plan files of `docs/build/refactor/boundaries/` are in this group too.

## What the commands do not prove

The suites prove the same behavior through the tests that exist. They do not prove a behavior that no test covers.

`start:local` and `package:opencode` did not run. Their scripts name the new path, but no check starts the command line or packs OpenCode.

A path that the code builds at run time can still point to `apps/web/`. The two steps that read files at run time are the asset loader and the OpenCode resource folder. The check at Step 6 proves the four entry files only, and the suites exercise the asset loader through `test:local-web` and `test:browser-smoke`.

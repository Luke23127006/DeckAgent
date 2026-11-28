# Task 40: Upgrade web.sqlite to schema 3 and add preferences version and notices report

Read this file to learn the changes and check results for Task 40.

## Files changed

- `packages/host/contracts/src/management.ts`: add `preferencesVersion` and preferences `version`.
- `apps/host/src/web-state.ts`: migrate schema 1 and schema 2 to schema 3, and version theme writes in transactions.
- `apps/host/src/modules/research/research.store.ts`: version research writes in transactions.
- `apps/host/src/modules/research/research.service.ts`: publish the committed research version before credential cleanup.
- `apps/host/src/server.ts`: connect both callbacks to ChangeFeed, expose the version, and register the initial topic.
- `apps/web/src/browser/transport/management-decoders.ts`: check preferences versions and expose `decodePreferences`.
- `apps/web/src/browser/chat-navigation.ts`: initialize the preferences version to zero.
- `apps/host/tests/web-management.test.mjs`: include the version in expected preferences replies.
- `e2e/local-foundation.test.mjs`: test theme and research versions, notices, reopen behavior, and schema upgrades.
- `docs/architecture/10-agent-core.md`: update the current preferences row.
- The task file, plan index, report index, and `CHANGELOG.md`: record completion.

## Commands run

Commands ran from the repository root in PowerShell.
Every package command uses `corepack pnpm@11.28.5`.
The evidence folder is `C:/Users/Duy/AppData/Local/Temp/deckagent-task40-8424bb7df580442ca11001be7999eca2`.
It contains baseline copies, command logs, mutation logs, and the review prompt.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` before changes | 0 | Approved Task 39 changes |
| `git grep -n "^| 39 | Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One row |
| `build` before implementation | 0 | Build complete |
| `node --test e2e/local-foundation.test.mjs` before implementation | 1 | Pass 14, fail 1, cancelled 1 |
| `build` after implementation | 0 | Build complete |
| `node --test apps/host/tests/web-management.test.mjs e2e/local-foundation.test.mjs` after implementation | 0 | Pass 23, fail 0, cancelled 0 |
| `build` with the exact research callback mutation | 1 | TS6133: unused version |
| `build` with the adjusted research mutation | 0 | Build complete |
| Isolated notice test with the adjusted research mutation | 1 | Missing notice caused timeout, cancelled 1 |
| `build` with the exact theme callback mutation | 1 | TS6138: unused callback property |
| `build` with the adjusted theme mutation | 0 | Build complete |
| Isolated notice test with the adjusted theme mutation | 1 | Missing notice caused timeout, cancelled 1 |
| `exec biome format --write` on the changed code and test files | 0 | Formatted eight included files |
| `exec biome format` on the same files | 0 | No fixes applied |
| Final `build` | 0 | Build complete |
| Isolated notice test after source restoration | 0 | Pass 1, fail 0, cancelled 0, about 3 seconds |
| `lint` | 0 | No error |
| `check:boundaries` | 0 | 0 violation(s) |
| `check:docs` before this report | 0 | 250 files, 0 error(s) |
| Final `check:docs` | 0 | 251 files, 0 error(s) |
| `build` with a schema-2 migration mutant that deletes providers | 0 | Build complete |
| Schema-2 migration test with that mutant | 1 | Pass 0, fail 1 on the retained provider assertion |
| Biome on the E2E path alone | 1 | Existing config excludes E2E paths |
| Biome through stdin with `--stdin-file-path=apps/host/tests/local-foundation.test.mjs` | 0 | Second pass unchanged |
| `exec tsc -b --force`, then `build` | 0 | Restored source compiled |
| Targeted notice and schema-2 tests after review fixes | 0 | Pass 2, fail 0, cancelled 0 |

The isolated mutation command was:

```text
node --test --test-timeout=15000 --test-name-pattern="preferences and research writes" e2e/local-foundation.test.mjs
```

## Suites

All 19 required suites passed. The generation-publication suite needed one unchanged retry.

| Command | Exit code | Pass | Fail |
| --- | --- | --- | --- |
| `corepack pnpm@11.28.5 test:http-edge` | 0 | 12 | 0 |
| `corepack pnpm@11.28.5 test:tools-browser` | 0 | 22 | 0 |
| `corepack pnpm@11.28.5 test:local-web` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:local-foundation` | 0 | 56 | 0 |
| `corepack pnpm@11.28.5 test:model-requests` | 0 | 29 | 0 |
| `corepack pnpm@11.28.5 test:source-permissions` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:attachments` | 0 | 31 | 0 |
| `corepack pnpm@11.28.5 test:research` | 0 | 5 | 0 |
| `corepack pnpm@11.28.5 test:images` | 0 | 39 | 0 |
| `corepack pnpm@11.28.5 test:outline-workflow` | 0 | 6 | 0 |
| `corepack pnpm@11.28.5 test:brief-foundation` | 0 | 15 | 0 |
| `corepack pnpm@11.28.5 test:deck-review` | 0 | 21 | 0 |
| `corepack pnpm@11.28.5 test:generation-publication` | 1 | 71 | 1 |
| `corepack pnpm@11.28.5 test:generation-publication` (retry) | 0 | 72 | 0 |
| `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | 7 | 0 |
| `corepack pnpm@11.28.5 test:session-persistence` | 0 | 7 | 0 |
| `corepack pnpm@11.28.5 test:opencode-resources` | 0 | 3 | 0 |
| `corepack pnpm@11.28.5 test:layouts` | 0 | 10 | 0 |
| `corepack pnpm@11.28.5 test:browser-smoke` | 0 | 19 | 0 |
| `corepack pnpm@11.28.5 test:env-startup` | 0 | 2 | 0 |

## Retries and deviations

- The approved baseline contains Task 39 changes. The user excluded commit and push from this execution.
- The final workspace therefore contains changes for review. Neither commit nor push ran.
- The red run reported fail 1 and cancelled 1, rather than the planned fail 2.
- The notice test waited for the absent preferences topic. Node classified its timeout as a cancellation.
- The migration test failed because the preferences version was absent.
- The orchestrator approved this red evidence. Neither new test passed before implementation.
- The exact callback mutations failed TypeScript unused checks.
- The orchestrator approved compile adjustments for temporary mutants only.
- The research mutant used `void version`. The theme mutant used `void this.onPreferencesChanged`.
- Both adjusted mutants compiled. The isolated notice test then detected each missing notice.
- The executor restored both exact green sources before the final build and checks.
- The initial unadjusted mutation commands also ran tests after their failed builds. Those test results are not mutation evidence.
- The initial research mutation command used the full file with a 15-second timeout. It timed out before the target test.
- The adjusted commands selected only the target test to exclude that unrelated timeout.
- An edit script could not match Vietnamese text through the PowerShell pipe. A Unicode-safe edit applied the planned row change.
- Vietnamese lint reports one pre-existing long sentence at architecture line 3. The changed preferences row has zero findings.
- The first `generation-publication` run reported pass 71 and fail 1.
- Its v3 portable-generation HTTP case failed in cleanup with `EBUSY` on a Chromium journal file.
- The orchestrator approved one retry of the unchanged suite. No hook or assertion changed.
- The retry passed all 72 tests.
- A report edit could not read the UTF-16 suite summary as UTF-8. The retry used UTF-16.
- The docs check before report indexing failed because the new report had no index link yet.
- The first provider-mutant restoration preserved an old source timestamp through `Copy-Item`.
- The incremental build therefore retained the mutant JavaScript, and the first restored migration test failed.
- The executor refreshed the source timestamp and forced TypeScript compilation.
- The resulting JavaScript contains no provider-deletion mutant. Both targeted tests passed.
- Biome excludes E2E paths in the existing config. The original format command checked eight files.
- The executor formatted the E2E file through stdin with an included test path. A second pass produced identical text.
- No unresolved STOP condition remains.
- No decision-table item required a new design decision.

## Review

An independent agent found no production defect and reported three test findings.
The notice test title claimed post-commit order and process restart beyond its assertions.
The executor changed the title to notices and same-process reopen.
The schema-2 test title claimed provider retention without checking provider content.
The executor added a literal assertion for the saved provider ID, display name, protocol, URL, and models.
A migration mutant deleted providers. The added assertion failed on that mutant.
The executor restored the source. Both targeted tests passed after a forced rebuild.
These corrections concern the task tests. They add no rule or Lesson Learned.
The reviewer checked callback ordering in source: callbacks follow SQL commit.
The reviewer then checked the three corrections and found no remaining issue.

## What the commands do not prove

Research and preferences writes do not require `expectedVersion` yet. The Browser does not react to preferences notices yet.
The reopen checks create another Host in the same process. They do not prove behavior after a new operating-system process starts.
The notice tests observe notices after HTTP replies. Code review checks that callbacks follow SQL commit.



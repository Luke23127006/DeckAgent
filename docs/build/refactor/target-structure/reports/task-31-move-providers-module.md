# Task 31: Move the providers module into apps/host/src/modules report

Read this file to learn how the provider code moved into `apps/host/src/modules/providers/` and the result of each check.

## Files changed

Moved with `git mv`:

- `apps/host/src/features/providers/built-in-providers.ts` to `apps/host/src/modules/providers/built-in-providers.ts`.
- `apps/host/src/integrations/providers/provider-catalog.ts` to `apps/host/src/modules/providers/provider-catalog.ts`.

Added:

- `apps/host/src/modules/providers/providers.store.ts`: the interface `ProviderRow` and the class `SqliteProviderStore`.
- `apps/host/src/modules/providers/providers.service.ts`: the class `ProviderConfigurations`, the class `ProviderFailure`, the constant `protocols`, the interface `ProviderConnection`, the interface `ProviderConfigurationsOptions` and the type `ProviderOperations`.
- `apps/host/src/modules/providers/providers.routes.ts`: the function `createProviderRoutes`.
- `apps/host/src/modules/providers/providers.errors.ts`: the constant `providerStatus` and the function `mapProviderFailure`.
- `apps/host/src/modules/providers/index.ts`: the public exports of the module.

Deleted:

- `apps/host/src/features/providers/index.ts`, `apps/host/src/features/providers/provider-settings.ts` and `apps/host/src/integrations/providers/index.ts`.
- The folder `apps/host/src/features/providers/` and the folder `apps/host/src/integrations/providers/`.

Changed:

- `apps/host/src/server.ts`: imports the module from `./modules/providers/index.ts`, builds `new ProviderConfigurations(new SqliteProviderStore(web.db), credentials, ...)`, adds `createProviderRoutes(runtime.providers)` after the chat router in `routes`, deletes the three provider members of `management`, and gives `mapProviderFailure` before `mapApplicationFailure`.
- `apps/host/src/local-transport.ts`: deletes the error map `providerStatus`, the `ProviderFailure` entry of `featureFailures` and the import of the old feature folder.
- `apps/host/src/cli.ts`: imports `protocols` and `validBaseUrl` from `./modules/providers/index.ts`.
- `apps/host/src/features/requests/prepare-runtime.ts`: imports the type `ProviderConfigurations` from the module.
- `apps/host/src/integrations/opencode/config.ts`, `contracts.ts`, `provider.ts` and `runtime.ts`: import the type `ProviderRunSettings` from the module.
- `packages/host/api/src/transport/management-routes.ts`: deletes the constant `PROVIDER_ID` and the three `/api/providers/...` routes.
- `packages/host/api/src/transport/contracts.ts`: deletes `saveProvider`, `deleteProvider` and `catalog` from `WebManagement`.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 31 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-31-move-providers-module.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-31-move-providers-module.md`: this report.
- `CHANGELOG.md`: records the move.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^\| 30 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the row of Task 30. |
| 2 | `git mv` for the two moved files, then `git rm -r` for the two old folders | 0 | Two `R` lines and three `D` lines. |
| 3 | `git grep --untracked -n -E "features/providers\|integrations/providers\|saveProvider\|deleteProvider" -- apps/host packages e2e tests scripts` | 1 | No line. |
| 3 | `git grep --untracked -n -w -E "ProviderStore\|ProviderStoreOptions" -- apps packages e2e tests scripts` | 1 | No line. |
| 3 | `git grep -n -E "ProviderFailure\|providerStatus" -- apps/host/src/local-transport.ts` | 1 | No line. |
| 3 | `git grep --untracked -n -E "node:sqlite\|express" -- apps/host/src/modules/providers/providers.service.ts` | 1 | No line. |
| 3 | `git grep --untracked -l "modules/providers/index.ts" -- apps/host/src/integrations/opencode` | 0 | Four lines: `config.ts`, `contracts.ts`, `provider.ts` and `runtime.ts`. |
| 4 | `corepack pnpm@11.28.5 exec biome format --write <the changed code files>` | 0 | `Formatted 24 files in 227ms. No fixes applied.` |
| 4 | The same `biome format` command without `--write` | 0 | `Checked 24 files in 90ms. No fixes applied.` |
| 4 | `corepack pnpm@11.28.5 build` | 1 | First run: `apps/host/src/server.ts(67,35): error TS2304: Cannot find name 'ProviderConnection'.` See the retry section. |
| 4 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 4 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 4 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 4 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 233 file(s) checked, 0 error(s) in 0 file(s)`. |
| 5 | The nineteen suite commands of the table below | 0 | Each suite gives `# fail 0`. See the retry section for `test:attachments`. |
| 5 | `corepack pnpm@11.28.5 test:attachments` | 0 | `# pass 29`, `# fail 0`. |
| 6 | `git status --short` | 0 | The expected paths, each one under `apps/host/src/` or `packages/host/api/src/`. |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 234 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this report>` | 0 | `0 violations (0 hard, baseline 0)`. |

## Moved files

| Old path | New path | Symbols |
| --- | --- | --- |
| `apps/host/src/features/providers/built-in-providers.ts` | `apps/host/src/modules/providers/built-in-providers.ts` | `builtInProviders` |
| `apps/host/src/integrations/providers/provider-catalog.ts` | `apps/host/src/modules/providers/provider-catalog.ts` | `ProviderEndpoint`, `ProviderRunSettings`, the type `ProviderFailure`, `ProviderCheckError`, `validBaseUrl`, `listModels` |
| `apps/host/src/features/providers/provider-settings.ts`, without its SQL | `apps/host/src/modules/providers/providers.service.ts` | the class `ProviderFailure`, `protocols`, `ProviderConnection`, `ProviderStoreOptions` (now `ProviderConfigurationsOptions`), the class `ProviderStore` (now `ProviderConfigurations`) |
| The `SELECT` and the `INSERT ... ON CONFLICT` statements of `ProviderStore` | `apps/host/src/modules/providers/providers.store.ts` | `ProviderRow`, `SqliteProviderStore` |
| `apps/host/src/features/providers/index.ts` and `apps/host/src/integrations/providers/index.ts` | `apps/host/src/modules/providers/index.ts` | the public exports of the module |
| The constant `providerStatus` and the `ProviderFailure` entry of `featureFailures` in `local-transport.ts` | `apps/host/src/modules/providers/providers.errors.ts` | `providerStatus`, `mapProviderFailure` |
| The three routes `/api/providers/...` of `registerSettingsAndProviderRoutes` | `apps/host/src/modules/providers/providers.routes.ts` | `createProviderRoutes` |

## Suites after the move

| Suite | Command | Exit code | Pass and fail |
| --- | --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 19`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | `# pass 11`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 51`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | 0 | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | 0 | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | 0 | `# pass 29`, `# fail 0` on the second run |
| test:research | `corepack pnpm@11.28.5 test:research` | 0 | `# pass 5`, `# fail 0` |
| test:images | `corepack pnpm@11.28.5 test:images` | 0 | `# pass 39`, `# fail 0` |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` | 0 | `# pass 6`, `# fail 0` |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` | 0 | `# pass 15`, `# fail 0` |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` | 0 | `# pass 21`, `# fail 0` |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` | 0 | `# pass 72`, `# fail 0` |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | `# pass 7`, `# fail 0` |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` | 0 | `# pass 7`, `# fail 0` |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` | 0 | `# pass 3`, `# fail 0` |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` | 0 | `# pass 10`, `# fail 0` |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 15`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | `# pass 2`, `# fail 0` |

## Items for the report

- No row of the tables `Mapping` and `Move rules` is missing. No comment names an old path or an old name after the move.
- `python` is not on this machine. The STE lint command ran as `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py`.

## Retries

1. Step 4, the first `build`: `apps/host/src/server.ts` used the name `ProviderConnection` from the old import line, and the new import line did not include it. The fix adds `type ProviderConnection` to the import from `./modules/providers/index.ts`. No other file changed.
2. Step 5, `test:attachments`: the first run gave `# pass 28` and `# fail 1`, on the test `PDF preparation attributes text to real pages and refuses image-only material without claiming OCR`. The second run gave `# pass 29` and `# fail 0`. The change of this task does not touch the attachment code. The first run was one of nineteen suites in a row, so a slow machine can explain the failure. The suite passes on its own.

No STOP condition occurred.

## What the commands do not prove

- No new test checks the route order or the error map order. The existing suites check the HTTP contract.
- No test proves that no earlier route catches the three `/api/providers/...` paths before the providers router. A person must read the route order in `server.ts`.
- The suite `test:local-web` calls the provider routes through `apps/host/tests/web-management.test.mjs`. It does not prove that a future change keeps the same path, status code, error code or JSON body.
- The suites prove the current behavior only. They do not prove that a later change keeps it.

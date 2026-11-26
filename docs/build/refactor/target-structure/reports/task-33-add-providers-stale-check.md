# Task 33: Add the providers stale check report

Read this file to learn how the provider writes check `expectedVersion`, and the result of each check.

## Files changed

- `packages/host/contracts/src/provider-validation.ts`: new file. It gives the decoders `decodeProviderSaveBody` and `decodeProviderRemoveBody`.
- `packages/host/contracts/src/index.ts`: exports the two decoders.
- `apps/host/src/modules/providers/providers.routes.ts`: adds the function `parseBody`, decodes both bodies and gives `body.provider` and `body.expectedVersion` to the service.
- `apps/host/src/modules/providers/providers.service.ts`: `save` and `remove` take `expectedVersion`. The first statement of each function checks the version against `this.store.version()`.
- `apps/host/src/modules/providers/providers.errors.ts`: adds `PROVIDERS_STALE: 409` to `providerStatus`.
- `apps/web/src/browser/transport/management-client.ts`: `save` and `remove` take `expectedVersion` and send it in the body. The list `allowedCodes` now holds `PROVIDERS_STALE`.
- `apps/web/src/browser/features/providers/settings-panel.ts`: `PanelState` holds `providersVersion`, with the start value `0`. `refresh` sets it from the settings reply. `submitProvider` and `removeProvider` give it to `client.save` and `client.remove`.
- `packages/host/contracts/tests/validation.test.mjs`: adds the test of the two decoders.
- `e2e/local-foundation.test.mjs`: adds the test of a stale write. Each provider write in this file sends `expectedVersion`.
- `apps/host/tests/brief-host.test.mjs`, `apps/host/tests/research-image-generation.test.mjs`, `apps/host/tests/research.test.mjs`, `apps/host/tests/web-management.test.mjs`: each provider write sends `expectedVersion`.
- `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/generation-continuation-http.test.mjs`, `e2e/image-recovery-http.test.mjs`, `e2e/interview-workflow.test.mjs`, `e2e/layout-review-http.test.mjs`, `e2e/model-requests.test.mjs`, `e2e/portable-generation-http.test.mjs`, `e2e/source-requests.test.mjs`: each provider write sends `expectedVersion`.
- `e2e/opencode-brief-live.test.mjs`, `e2e/opencode-generation-live.test.mjs`, `e2e/opencode-live.test.mjs`, `e2e/opencode-source-live.test.mjs`, `e2e/research-live.test.mjs`: each provider write sends `expectedVersion`. These suites did not run.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 33 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-33-add-providers-stale-check.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-33-add-providers-stale-check.md`: this report.
- `CHANGELOG.md`: records the change.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^\| 32 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the row of Task 32. |
| 2 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 2 | `node --test packages/host/contracts/tests/validation.test.mjs e2e/local-foundation.test.mjs` | 1 | `# tests 15`, `# pass 13`, `# fail 2`. The import of the two decoders fails and the new test fails. See the deviation section. |
| 3 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 3 | `node --test packages/host/contracts/tests/validation.test.mjs e2e/local-foundation.test.mjs` | 1 | `# tests 21`, `# pass 18`, `# fail 3`. The three failed tests are the two tests of Task 32 and the test of the model choice. See the deviation section. |
| 4 | `git grep -n -E "providers/.*(PUT\|DELETE)" -- e2e apps/host/tests` | 0 | 61 lines in 22 files. |
| 4 | `git grep -n -E "fetch\(.*api/providers/" -- e2e apps/host/tests` | 0 | 2 lines. |
| 4 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 4 | `node --test packages/host/contracts/tests/validation.test.mjs e2e/local-foundation.test.mjs` | 0 | `# tests 21`, `# pass 21`, `# fail 0`. |
| 5 | `corepack pnpm@11.28.5 build` and `node --test e2e/local-foundation.test.mjs`, with the version check moved after the provider check | 1 | `# tests 14`, `# pass 13`, `# fail 1`. The change is undone. |
| 6 | `corepack pnpm@11.28.5 exec biome format --write <each changed file>` | 0 | `Formatted 12 files in 21ms. Fixed 3 files.` Biome checks no file of `e2e/`, because `biome.json` includes `apps`, `packages`, `scripts` and `tests` only. |
| 6 | The same `biome format` command without `--write` | 0 | `Checked 12 files in 40ms. No fixes applied.` |
| 6 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 6 | `corepack pnpm@11.28.5 lint` | 0 | The command prints the `oxlint` line only. No finding. |
| 6 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 235 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | The nineteen suite commands of the table below | 0 | Every suite gives `# fail 0` after the retry of the second section. |
| 7 | `corepack pnpm@11.28.5 test:images` | 0 | `# pass 39`, `# fail 0` on the second run. |
| 8 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 236 file(s) checked, 0 error(s) in 0 file(s)`. |
| 8 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this report>` | 0 | `0 violations (0 hard, baseline 0)`. |

## Test writes

The rows `1` to `6` are the rows of the table `Test write rules` in the task file.

| File | Line | Rule row |
| --- | --- | --- |
| `apps/host/tests/brief-host.test.mjs` | 79 | 3, helper with `{ status, data }` |
| `apps/host/tests/brief-host.test.mjs` | 133 | 3 |
| `apps/host/tests/research-image-generation.test.mjs` | 69 | 3 |
| `apps/host/tests/research.test.mjs` | 160 | 3 |
| `apps/host/tests/research.test.mjs` | 259 | 3 |
| `apps/host/tests/web-management.test.mjs` | 123 | 5, `fetch` `DELETE` for `providers/seeded` |
| `apps/host/tests/web-management.test.mjs` | 180 | 3 |
| `apps/host/tests/web-management.test.mjs` | 191 | 3 |
| `apps/host/tests/web-management.test.mjs` | 202 | 3 |
| `apps/host/tests/web-management.test.mjs` | 211 | 3 |
| `apps/host/tests/web-management.test.mjs` | 221 | 3 |
| `apps/host/tests/web-management.test.mjs` | 236 | 3 |
| `apps/host/tests/web-management.test.mjs` | 268 | 3 |
| `apps/host/tests/web-management.test.mjs` | 280 | 3, `DELETE` |
| `e2e/artifact-rendering.test.mjs` | 146 | 3 |
| `e2e/attachment-admission.test.mjs` | 171 | 3 |
| `e2e/attachment-admission.test.mjs` | 215 | 3 |
| `e2e/generation-bridge.test.mjs` | 32 | 3 |
| `e2e/generation-continuation-http.test.mjs` | 32 | 3 |
| `e2e/image-recovery-http.test.mjs` | 110 | 3 |
| `e2e/interview-workflow.test.mjs` | 26 | 3 |
| `e2e/interview-workflow.test.mjs` | 84 | 3 |
| `e2e/layout-review-http.test.mjs` | 38 | 3 |
| `e2e/local-foundation.test.mjs` | 319 | 3, `DELETE` |
| `e2e/local-foundation.test.mjs` | 503 | 1, first `PUT` of the test |
| `e2e/local-foundation.test.mjs` | 509 | 1, second `PUT` |
| `e2e/local-foundation.test.mjs` | 513 | 1, `PUT` with `INVALID_PROVIDER` |
| `e2e/local-foundation.test.mjs` | 520 | 1, `DELETE` |
| `e2e/local-foundation.test.mjs` | 535 | 1, `providers/kept` |
| `e2e/local-foundation.test.mjs` | 537 | 1, `providers/gone` |
| `e2e/local-foundation.test.mjs` | 538 | 1, `DELETE` |
| `e2e/local-foundation.test.mjs` | 579 | 7, the new test of Step 2 |
| `e2e/local-foundation.test.mjs` | 582 | 7, the stale `PUT` |
| `e2e/local-foundation.test.mjs` | 586 | 7, the stale `DELETE` |
| `e2e/local-foundation.test.mjs` | 593 | 7, the two `PUT` calls with an invalid body |
| `e2e/local-foundation.test.mjs` | 599 | 7, the last `DELETE` |
| `e2e/model-requests.test.mjs` | 41 | 3 |
| `e2e/model-requests.test.mjs` | 73 | 3 |
| `e2e/model-requests.test.mjs` | 86 | 3 |
| `e2e/model-requests.test.mjs` | 95 | 3 |
| `e2e/model-requests.test.mjs` | 109 | 3 |
| `e2e/model-requests.test.mjs` | 119 | 3 |
| `e2e/model-requests.test.mjs` | 140 | 3 |
| `e2e/model-requests.test.mjs` | 154 | 3 |
| `e2e/model-requests.test.mjs` | 168 | 3 |
| `e2e/model-requests.test.mjs` | 183 | 3 |
| `e2e/model-requests.test.mjs` | 192 | 3, `DELETE` |
| `e2e/model-requests.test.mjs` | 556 | 3 |
| `e2e/model-requests.test.mjs` | 640 | 3, `DELETE` |
| `e2e/model-requests.test.mjs` | 658 | 3 |
| `e2e/model-requests.test.mjs` | 670 | 3 |
| `e2e/opencode-brief-live.test.mjs` | 161 | 4, helper with the parsed body |
| `e2e/opencode-generation-live.test.mjs` | 148 | 4 |
| `e2e/opencode-live.test.mjs` | 134 | 3 |
| `e2e/opencode-live.test.mjs` | 235 | 6, `fetch` `PUT` for `api/providers/live` |
| `e2e/opencode-source-live.test.mjs` | 92 | 4 |
| `e2e/opencode-source-live.test.mjs` | 244 | 4 |
| `e2e/portable-generation-http.test.mjs` | 90 | 3 |
| `e2e/research-live.test.mjs` | 81 | 4 |
| `e2e/source-requests.test.mjs` | 30 | 3 |

Row 2 keeps the call of `ManagementClient.save` at `apps/host/tests/web-management.test.mjs:28`. The client refuses the ID before it sends the request, so the call needs no `expectedVersion`.

## Suites after the change

| Suite | Exit code | Pass and fail |
| --- | --- | --- |
| test:http-edge | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | 0 | `# pass 20`, `# fail 0` |
| test:local-web | 0 | `# pass 11`, `# fail 0` |
| test:local-foundation | 0 | `# pass 54`, `# fail 0` |
| test:model-requests | 0 | `# pass 29`, `# fail 0` |
| test:source-permissions | 0 | `# pass 11`, `# fail 0` |
| test:attachments | 0 | `# pass 29`, `# fail 0` |
| test:research | 0 | `# pass 5`, `# fail 0` |
| test:images | 0 | `# pass 39`, `# fail 0` on the second run |
| test:outline-workflow | 0 | `# pass 6`, `# fail 0` |
| test:brief-foundation | 0 | `# pass 15`, `# fail 0` |
| test:deck-review | 0 | `# pass 21`, `# fail 0` |
| test:generation-publication | 0 | `# pass 72`, `# fail 0` |
| test:slide-pipeline | 0 | `# pass 7`, `# fail 0` |
| test:session-persistence | 0 | `# pass 7`, `# fail 0` |
| test:opencode-resources | 0 | `# pass 3`, `# fail 0` |
| test:layouts | 0 | `# pass 10`, `# fail 0` |
| test:browser-smoke | 0 | `# pass 15`, `# fail 0` |
| test:env-startup | 0 | `# pass 2`, `# fail 0` |

## Deviations and retries

1. Step 2, `node --test packages/host/contracts/tests/validation.test.mjs e2e/local-foundation.test.mjs`: the number `# fail 2` matches the task. The new test fails at its first assertion and not at the stale save. The current service refuses the unknown key `expectedVersion` with `400 INVALID_PROVIDER`, so `saved.status` is `400` instead of `200`. The task expects `200` at the stale save. The output still gives `not ok` for the two expected tests.
2. Step 3: the task expects `# fail 2` and the output gives `# fail 3`. The third test is `a new chat gets the most recent model choice of any chat while it is selectable, and otherwise none`. It writes `providers/fixture` with a `DELETE` and no `expectedVersion`, so it gets `400 INVALID_REQUEST`. The search of Step 4 finds this write, and row 3 of the task table gives its change. No new decision was necessary.
3. Step 7, first run, `test:images`: `# pass 38`, `# fail 1`. The test `Create deck prepares images, then MCP templates v3 publish all seven layouts through the real local renderer` fails in its `after` hook with `EBUSY: resource busy or locked, unlink ...\Cookies-journal`. A Chromium process keeps a file of the temporary renderer profile open while the hook clears the folder. No production file is in the stack, and this file has no relation to the provider change. The second run gives `# pass 39`, `# fail 0`.

No STOP condition occurred. Every suite passes. The failure of the first `test:images` run comes from a Windows file lock in a temporary renderer folder.

`python` is not on this machine. The STE lint command ran with `python3.12`.

## What the commands do not prove

- The live suites (`e2e/*-live.test.mjs`) got the new field but did not run. They need a real provider or a live OpenCode CLI.
- The Browser shows the generic save failure for `PROVIDERS_STALE` until Task 34. No handler reads the code `PROVIDERS_STALE` on its own yet.
- The provider wizard tests of `test:browser-smoke` are the only check that the Browser sends the right version. The green suite shows that the wizard still saves and removes a provider with the version of the last settings reply.
- The suites prove the current behavior only. They do not prove that a later change keeps it.

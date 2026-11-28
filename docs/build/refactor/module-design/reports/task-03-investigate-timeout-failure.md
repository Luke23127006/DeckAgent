# Task 3: Portable Generation HTTP Timeout Diagnosis Report

Read this file to review the measured timings, code-path audit, and root-cause classification for the `#60 REQUEST_TIMEOUT` baseline failure in `e2e/portable-generation-http.test.mjs` [[1]](#ref-1).

## Scope and commands run

Task 3 ran read-only diagnosis without modifying production or test source code [[1]](#ref-1) [[2]](#ref-2).

- `corepack pnpm@11.28.5 build` (outside sandbox) — exit code `0`. (In-sandbox run failed with `Access is denied` writing `packages/presentation/design/lib/index.js`.)
- `node --test --test-reporter=tap e2e/portable-generation-http.test.mjs` (Isolated #1, outside sandbox) — exit code `1` (`# tests 2`, `# pass 0`, `# fail 2`, `duration_ms 78374.9674`).
- `node --test --test-reporter=tap e2e/portable-generation-http.test.mjs` (Isolated #2, outside sandbox) — exit code `1` (`# tests 2`, `# pass 0`, `# fail 2`, `duration_ms 79593.4788`).
- `corepack pnpm@11.28.5 test:images` (outside sandbox) — exit code `1` (`# tests 39`, `# pass 37`, `# fail 2`, `# skipped 0`, `duration_ms 135738.5556`).
- `corepack pnpm@11.28.5 test:generation-publication` (outside sandbox) — exit code `1` (`# tests 69`, `# pass 67`, `# fail 2`, `# skipped 0`, `duration_ms 201129.8178`).
- `git status --short` — exit code `0`, no unexpected production or test modifications.

Note on sandbox behavior: inside the Windows sandbox, `artifactRenderer` is blocked from spawning the local headless browser and fails early with `ARTIFACT_RENDERER_FAILED`. Running outside the sandbox reproduces the baseline `REQUEST_TIMEOUT` behavior.

## Timing table

| Run | Exit code | `v2` status & `duration_ms` | `v3` status & `duration_ms` | Failing `errorCode` |
| --- | --- | --- | --- | --- |
| Isolated #1 | `1` | `fail` (`39468.9632`, 5/7 slides) | `fail` (`37642.0868`, 7/7 slides) | `REQUEST_TIMEOUT` (`v2`, `v3`) |
| Isolated #2 | `1` | `fail` (`39110.2089`) | `fail` (`38367.8414`, 2/7 slides) | `REQUEST_TIMEOUT` (`v2`, `v3`) |
| `test:images` | `1` | `fail` (#32, `35976.652`, 6/7 slides) | `fail` (#33, `36025.3491`, 6/7 slides) | `REQUEST_TIMEOUT` (#32, #33) |
| `test:generation-publication` | `1` | `fail` (#40, `35516.2588`, 6/7 slides) | `fail` (#41, `37291.7984`, 5/7 slides) | `REQUEST_TIMEOUT` (#40, #41) |

Zero tests outside `e2e/portable-generation-http.test.mjs` failed in either suite.

## Timeout budget audit

1. **Production default `timeoutMs`:** `600_000` ms (`10` minutes) in `apps/web/src/integrations/opencode/runtime.ts` (line 252).
2. **Test fixture default `timeoutMs`:** `30000` ms (`30` seconds) in `apps/web/tests/fixtures/b02-helpers.mjs` (line 72). `e2e/portable-generation-http.test.mjs` (lines 19-77) does not override `openCode.timeoutMs` (line 12 only sets `node:test` runner `timeout: 180000`).
3. **Per-slide renderer timeout and concurrency cap:** `running >= 2` (`ARTIFACT_RENDERER_BUSY`) and `AbortSignal.timeout(15000)` per render in `apps/web/src/integrations/rendering/artifact-renderer.ts` (lines 104-106).
4. **Browser spawn count and cleanup:** `artifact-renderer.ts` (line 122) spawns 1 fresh headless browser process per `artifactRenderer` call (`validate_slide` and `publish_slide` per slide = 14 cold browser spawns per 7-slide deck). The `finally` block (lines 258-270) removes the abort listener, calls `Browser.close` when not aborted, closes the WebSocket, kills any live child process, removes the temp `render-*` folder, and decrements `running--`.

## Root-cause classification

- **Classification:** Fixture timeout budget exhaustion (`b02-helpers.mjs` sets `openCode.timeoutMs: 30000` for 7-slide decks that perform 14 cold browser renders at ~2-4 seconds each).
- **Unmatched decision-table nuance:** Row 1 of the [Root-cause decision table](../plan/task-03-investigate-timeout-failure.md#root-cause-decision-table) assumes isolated runs pass near or below `30000` ms while suite runs fail. On this Windows machine, both isolated runs and both suite runs exceeded `30000` ms (`35516`-`39469` ms) and failed with `REQUEST_TIMEOUT` after publishing slides steadily without stalling or emitting `ARTIFACT_RENDERER_BUSY` / `ARTIFACT_RENDERER_FAILED`.
- **Options for Revision 1b:** Raise fixture `openCode.timeoutMs` in `e2e/portable-generation-http.test.mjs`, or evaluate browser reuse in `apps/web/src/integrations/rendering/artifact-renderer.ts`.

## Measurement limits

Local timings on one Windows machine using `fake-opencode.mjs` do not measure CI runner load margins or live OpenCode model latency.

## References

1. <a id="ref-1"></a>[Task 3: Investigate portable-generation-http REQUEST_TIMEOUT baseline failure](../plan/task-03-investigate-timeout-failure.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)

# Task 24: Managed Browser Reuse in the Artifact Renderer Report

Read this file to review the managed incognito browser reuse in `artifact-renderer.ts`, the CDP and DOM validation extraction, the wired `close()` in `apps/web/src/index.ts`, and the reuse and cleanup check [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/integrations/rendering/dom-validation.ts` (79 lines) — `buildValidationExpression` (39 lines) and `assertValidationReport` (23 lines). The in-page script and the six allowed codes are unchanged.
- `apps/web/src/integrations/rendering/cdp-browser.ts` (256 lines) — `CdpConnection`, `ManagedBrowser`, `executable`, `rendererEnvironment`, `verifySafeRoot`, `connectBrowser` (67 lines), `launchManagedBrowser` (47 lines), `disposeManagedBrowser`, `devtoolsPort`, `waitForExit`, `removeFolder`.

Modified:

- `apps/web/src/integrations/rendering/artifact-renderer.ts` (272 → 172 lines) — `ArtifactRenderer`, `ManagedRenderer`, and the `artifactRenderer(root, options)` factory. The class keeps the per-instance browser, launch promise, in-flight count, idle timer, closed flag, disposal chain, and generation counter. The process-wide `activeRenders` cap stays at module scope. `runIsolatedRender` is 64 lines.
- `apps/web/src/integrations/rendering/index.ts` — also exports `type ArtifactRenderer`.
- `apps/web/src/index.ts` — builds one renderer after `commonsImages`, passes `renderer.render` as `renderCheck`, and awaits `renderer.close()` in `close()` and in the startup `catch`.
- `e2e/artifact-rendering.test.mjs` — imports `readdir` and adds the reuse and shutdown cleanup test.
- `docs/build/refactor/module-design/plan/README.md` — Task 24 is `Done`.
- `docs/build/refactor/module-design/plan/task-24-refactor-artifact-renderer-managed-browser-reuse.md` — Steps 1 to 7 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 24 row.

## Module responsibilities

| Module | Owns |
| --- | --- |
| `dom-validation.ts` | The in-page visibility and layout script, and the mapping from a report to a validated slide or a refusal |
| `cdp-browser.ts` | Local Chromium discovery, isolated environment, safe root check, one browser process, the multiplexed CDP socket, and disposal |
| `artifact-renderer.ts` | Per-instance browser lifecycle, the 60-second idle recycle, the 2-render cap, one incognito context per render, and poisoning after a failed cleanup |

## Metrics

`scripts/scan-module-design.mjs --json` and the Step 6 AST sweep report these counts for `apps/web/src/integrations/rendering/`:

| Metric | Before | After |
| --- | --- | --- |
| `files` | 2 | 4 |
| `lines` | 273 | 509 |
| `filesOver400` | 0 | 0 |
| `functionsOver80` | 2 | 0 |
| `typeAssertions` | 0 | 0 |
| `nonNullTotal` | 0 | 0 |

`artifact-renderer.ts` falls from 272 to 172 lines. The longest functions are `connectBrowser` (67), `runIsolatedRender` (64), `launchManagedBrowser` (47), and `buildValidationExpression` (39). The task limits hold: 75 lines in `dom-validation.ts` and `cdp-browser.ts`, 70 lines for every renderer helper.

## Behaviour preservation

- The root check still walks to the nearest existing parent, rejects a symbolic link or a non-canonical path with `ARTIFACT_RENDERER_UNAVAILABLE`, and creates the root only after the check.
- The browser flags, the filtered `rendererEnvironment()`, `--user-data-dir`, and the `about:blank` argument are unchanged.
- The 25 ms port poll reads only a `/^\d{1,5}$/` port, and a port is accepted only when `/json/version` answers with a `ws://127.0.0.1:${port}/devtools/browser/` URL.
- Each render keeps the `1280x720` viewport, `Network.enable`, the same six blocked URL schemes, `Page.getFrameTree`, `Page.setDocumentContent`, and the awaited `Runtime.evaluate` with `returnByValue`.
- The 15-second per-render timeout and the 2-render process cap are unchanged. `ARTIFACT_RENDERER_BUSY` still comes from the process-wide counter.
- `ARTIFACT_RENDERER_UNAVAILABLE`, `ARTIFACT_RENDERER_FAILED`, and every validation code (`ARTIFACT_IMAGE_UNREADABLE`, `ARTIFACT_EMPTY`, `ARTIFACT_REQUIRED_CONTENT_MISSING`, `ARTIFACT_UNREADABLE`, `ARTIFACT_OVERFLOW`, `ARTIFACT_LAYOUT_GEOMETRY`) keep the same mapping, including the `path` limit of 130 and the `expected` limit of 250.
- A profile directory is removed only when it is under the checked root and the root is still canonical.
- No product behaviour, database schema, wire payload, or error code changed.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `node --test e2e/artifact-rendering.test.mjs` (before the fix) | `1` | `# tests 3`, `# pass 2`, `# fail 1`; the new test saw `0` profile directories instead of `1` |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | oxlint reported no diagnostics |
| `npx biome format --write apps/web/src/integrations/rendering/ apps/web/src/index.ts e2e/artifact-rendering.test.mjs` | `0` | final check: `Checked 5 files`, `No fixes applied` |
| Step 6 AST sweep on `apps/web/src/integrations/rendering/` | `0` | `over400: false`, `longFn: 0`, `as: 0`, `nn: 0` on every file |
| `node --test e2e/artifact-rendering.test.mjs` | `0` | `# tests 3`, `# pass 3`, `# fail 0`, `# skipped 0` |
| `node --test e2e/portable-generation-http.test.mjs` | `0` | `# tests 2`, `# pass 2`, `# fail 0`, `# skipped 0`; `duration_ms` 36,959.7 |
| `corepack pnpm@11.28.5 test:generation-publication` | `0` | `# tests 72`, `# pass 72`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `0 error(s)` |

The measured `e2e/portable-generation-http.test.mjs` run takes 36.96 seconds in total: 16.93 seconds for the v2 seven-slide deck and 18.40 seconds for the v3 seven-slide deck. The Task 3 baseline was 35.5 to 39.5 seconds for one seven-slide deck with 14 cold spawns. The total wall time is near the old single-deck cost because the second deck no longer pays for browser startup.

One earlier run of the same file failed once: `publish_slide` on slide 7 failed 10.4 seconds after it started, and the request ended with `RUNTIME_FAILED`. The next two runs passed with no change (`# fail 0`). The 10.4-second stall is near the MCP bridge's 10-second request timeout, but this report does not prove the cause. No test failed twice.

## What the commands do not prove

- The 60-second idle recycle is not exercised; every test closes the app before the timer fires. The idle timer is `unref()`ed, so its effect on process exit is also not asserted.
- The poisoning path (a failed `Target.closeTarget` or `Target.disposeBrowserContext`), crash recycling through `onExit`, and the `ARTIFACT_RENDERER_BUSY` refusal with two concurrent renders have no dedicated test.
- The measured duration covers local Chrome and one Windows machine. It does not measure other Chromium builds, other platforms, or a loaded host.
- The single 10.4-second `publish_slide` failure described above has no proven root cause.
- The root symlink guard, the `removeFolder` boundary check, and the 2-second `Browser.close` and exit waits are covered by the code path only; no test forces a failure in them.
- `check:docs` verifies structure, purpose lines, and links only; it does not verify that the report numbers match a later rescan.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 24 Plan](../plan/task-24-refactor-artifact-renderer-managed-browser-reuse.md)

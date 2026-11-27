# Task 8 Report: Serve apps/web/dist with SPA fallback and remove loadWebAssets

Read this file to know which files Task 8 added, changed or removed, which commands ran, how the plan defects were handled, and what those checks do not prove.

## Files changed

- Create `apps/host/src/http/web-assets.ts`: `themeBootstrap` returns the `.dark` class script for `dark`, `light` and `system`; `loadWebDistAssets` reads the Vite output once, maps `index.html` to `/`, sets the content type by extension, marks `/samples/*.html` as sandboxed, and defines the dynamic `/theme.js` getter.
- Create `apps/host/tests/web-assets.test.mjs`: the task test, with the header comment that `docs/conventions/testware.md` requires.
- Change `apps/host/src/http/contracts.ts`: `HostOptions.spaFallback` and `body: string | Buffer` on an asset entry.
- Change `apps/host/src/http/app.ts`: `serveAsset` serves only `GET`, falls back to `/` when `spaFallback` is on and `isSpaRoutePath` is true, and keeps `404 NOT_FOUND` for file paths, reserved prefixes and other methods. `isSpaRoutePath` compares `/api/`, `/assets/` and `/samples/` in lowercase, so `/API/sessions` still gets the `404 NOT_FOUND` JSON body that `e2e/http-edge.test.mjs` requires.
- Change `apps/host/src/server.ts`: imports `loadWebDistAssets`, resolves `../../web/dist` from `import.meta.url`, sets `spaFallback: true` in `createHostOptions`.
- Change `apps/host/package.json`: removes the `@deckagent/local-web` dependency.
- Change `scripts/build-workspace.mjs`: runs the Vite build for `@deckagent/local-web` with `--configLoader native`, throws on a non-zero exit, and skips `tsdown` for that package.
- Change `apps/web/tsconfig.json`: `types` is `["vite/client"]`, `emitDeclarationOnly` is true, and `rewriteRelativeImportExtensions` is false. The last option is a plan-defect retry: `src/browser` belongs to both `apps/web/tsconfig.json` and the referenced `tsconfig.browser.json`, and the other output folders make the extension rewrite unsafe (TS2878). The browser project keeps the inherited `true`, so `lib/browser-types` still gets runnable JavaScript for the existing `node:test` suites.
- Change `apps/web/package.json`: removes `main`, `types` and `exports`.
- Remove `apps/web/src/index.ts`: the page, the CSS strings, `themeBootstrap` and `loadWebAssets` are gone from `apps/web/`.
- Change `apps/host/tests/web-management.test.mjs`: the `/theme.js` assertions use the `.dark` class script for `system` and `dark`.
- Change `e2e/local-web.test.mjs`: the page contains `/assets/.*\.js` instead of `/client/boot.js`.
- Change `e2e/browser-smoke.test.mjs`: the dark theme check reads `classList.contains('dark')`.
- Change `docs/build/refactor/web-react/plan/task-08-serve-web-dist-and-remove-load-web-assets.md`, `plan/README.md` and `reports/README.md`.

## Commands

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap apps/host/tests/web-assets.test.mjs` (Step 2) | 1 | `ERR_MODULE_NOT_FOUND` for `lib/types/http/web-assets.js`; `# fail 1` |
| `corepack pnpm@11.28.5 build` (first run after Step 3) | 1 | `error TS2878: This import path is unsafe to rewrite...`; `ELIFECYCLE` |
| `corepack pnpm@11.28.5 exec tsc -p apps/web/tsconfig.json --noEmit` before `rewriteRelativeImportExtensions: false` | 1 | `error TS2878` |
| Same command after `rewriteRelativeImportExtensions: false` | 0 | no output |
| `corepack pnpm@11.28.5 exec tsc -p apps/host/tsconfig.json --noEmit` after removing the stale `apps/host/lib/tsconfig.tsbuildinfo` | 0 | no output |
| `corepack pnpm@11.28.5 build` | 0 | `343 modules transformed.`, `dist/index.html 0.44 kB`, `dist/assets/index-*.js 613.77 kB`; Vite reports a chunk over 500 kB |
| `corepack pnpm@11.28.5 lint` with `apps/web/dist` present | 1 | Errors only in `apps/web/dist/assets/index-*.js`, for example `eslint(no-underscore-dangle)` and `eslint(no-unused-expressions)` |
| `Remove-Item -Recurse -Force apps/web/dist` then `corepack pnpm@11.28.5 lint` | 0 | no output |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 build` (rebuild the dist folder for the tests) | 0 | `dist/index.html 0.44 kB`, `dist/assets/index-*.js 613.77 kB` |
| `node --test --test-reporter=tap apps/host/tests/web-assets.test.mjs apps/host/tests/web-management.test.mjs e2e/local-web.test.mjs e2e/http-edge.test.mjs` | 0 | `# tests 24`, `# pass 24`, `# fail 0` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 338 file(s) checked, 0 error(s) in 0 file(s)` |

The Step 4 command has one deliberate deviation: `apps/web/dist` is removed before `lint`, then the build runs again before the tests. The user approved this option after the lint failure. The reason is the plan defect in the row below. `apps/web/dist` is generated output, is not in the `Files` block, and is not committed.

## STOP and retry

- Step 2 failed as the task expects. It is not a STOP.
- Step 4, retry 1: `tsc -b` stopped with `TS2878` in the `apps/web` project. The cause is the state that Task 7 left: `apps/web/tsconfig.json` includes `src/browser`, and it also references `tsconfig.browser.json`, which owns the same files with the output folder `lib/browser-types`. `rewriteRelativeImportExtensions` cannot map a relative `.ts` import between the two output folders. I set `rewriteRelativeImportExtensions: false` in `apps/web/tsconfig.json`. That project now emits declarations only; the browser project still emits runnable JavaScript with the inherited `true`.
- Step 4, retry 2: `tsc -b` replayed errors from the committed `HEAD` source in the `apps/host` project (`ProviderFailure`, `protocols`, `mapProviderFailure` and an implicit `any` in `cli.ts`). The working source does not contain those names. The stale `apps/host/lib/tsconfig.tsbuildinfo` caused the replay. I removed the ignored build-state file and `tsc -p apps/host/tsconfig.json --noEmit` passed with no output. No source file changed for this retry.
- Step 4, retry 3: a Vite build stopped with `Found another Vite build process for this project (PID 29668)`, and `apps/web/dist` disappeared between commands. A concurrent process in the same workspace ran `test:tools-browser` and then `test:browser-smoke`. I verified that the PID was gone, rebuilt, and the build passed. This is an environment conflict, not a source defect.
- Step 4, retry 4: `lint` with `apps/web/dist` present failed with errors only in the build output. `apps/web/dist` is in neither `.gitignore` nor the oxlint ignore list. That is the plan defect that the Task 7 report already records. Per the user's decision, I removed `dist`, ran `lint` (exit 0), and rebuilt `dist` before the tests. The defect stays in the plan: Task 9 runs `build && lint` and will see the same failure unless a later change adds the build output to the ignore lists.
- Step 4, retry 5: `e2e/http-edge.test.mjs` test `Path matching is exact: a trailing slash or other letter case gets 404 NOT_FOUND as JSON` failed because `/API/sessions` got `200` with the root document. The literal predicate in the task excludes only lowercase `/api/`. The existing HTTP contract requires the `404 NOT_FOUND` JSON body. I changed `isSpaRoutePath` to compare the three reserved prefixes in lowercase. No `/api/*` path, status code or body changed.
- No other STOP occurred.

## What the commands do not prove

- `apps/host/tests/web-assets.test.mjs` serves a hand-written folder, not the real `apps/web/dist`. `e2e/local-web.test.mjs` uses the real build, but it fetches only `/` and `/slide.html`. No test fetches the hashed `.js` or `.css` files of the real build over HTTP.
- The content types for `.mjs`, `.css`, `.svg`, `.png`, `.json`, `.ico` and `.woff2` have no test. The task test covers only `.html` and `.js`.
- The light theme script is compared with `themeBootstrap('light')`, which is the function under test. A wrong light script still passes that assertion. The `dark` script has an independent literal assertion in `web-management.test.mjs`, and `system` has an independent literal assertion in both files.
- The SPA predicate is covered by `/`, `/chats/chat-1`, `/settings`, `/slide.html` and `/assets/missing.js`. It is not exercised for a path with a trailing dot, a percent escape inside a deeper segment, or an uppercase `/ASSETS/` path.
- `loadWebDistAssets` throws `ENOENT` when the dist folder is absent. No test asserts a clear startup error for a source checkout without a build. The current Host fails at startup in that case.
- No browser ran in this task. The `.dark` assertion change in `e2e/browser-smoke.test.mjs` is not verified here; the phase exit check runs that suite.
- The Vite build leaves one 613.77 kB chunk and a size warning. No chunk split is part of this task.
- The asset map is read once at startup. The tests do not prove that a new Vite build needs a Host restart, or that a missing file after startup still returns `404`.
- `apps/web/dist` is not in `.gitignore`, so `git status` lists the build output as untracked files. The task does not change the ignore lists; the lint defect and this untracked output need one follow-up change.

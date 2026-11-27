# Task 7 Report: Add React shell, routes, main.tsx and legacy mount

Read this file to know which files Task 7 added or changed, which commands ran, their results, the defects found in the task fixture, and what those checks do not prove.

## Files changed

- Create `apps/web/src/layouts/app-shell.tsx`: `AppShell` calls `useHostConnection` and `useChangeFeed`, and renders the route `Outlet` in a full-height `div`.
- Create `apps/web/src/components/legacy-browser-mount.tsx`: `LegacyBrowserMount` renders `<main id="app">`, mounts `mountLegacyBrowser` in `useEffect` and returns its cleanup.
- Create `apps/web/src/pages/home/home-page.tsx`: `HomePage` shows `appText.missingChat` when the router state has `missingChat: true`, then mounts the legacy screens.
- Create `apps/web/src/pages/chat/chat-page.tsx`: `ChatPage` passes `sessionId` to the mount and replaces the route with `/` and `{ missingChat: true }` when the chat is absent.
- Create `apps/web/src/pages/settings/settings-page.tsx`: `SettingsPage` mounts the legacy screens with `openSettings`.
- Create `apps/web/src/routes.tsx`: `AppRoutes` declares the pathless `AppShell` layout, the index route, `/chats/:sessionId`, `/settings` and the `*` redirect.
- Create `apps/web/src/main.tsx`: reads the hash token once, configures the API client, creates the `QueryClient`, and renders `StrictMode`, `QueryClientProvider`, `BrowserRouter` and `AppRoutes` on `#root`.
- Create `apps/web/tests/app-shell-routes.test.tsx`: the task test with the header comment that `docs/conventions/testware.md` requires.
- Change `apps/web/src/browser/shell-dom.ts`: `ShellDom` and `createShellDom` take `root` and `changed`; the constructor clears the root; the document keydown, document pointerdown and compact-navigation listeners are stored and removed in `dispose`.
- Change `apps/web/src/browser/theme.ts`: the control toggles the `.dark` class and no longer writes `dataset.theme`; it listens to `prefers-color-scheme: dark` while the choice is `system`, and `dispose` removes that listener.
- Change `apps/web/src/browser/boot.ts`: exports `LegacyBrowserOptions` and `mountLegacyBrowser(root, options)`; no boot code runs at module top level; the cleanup removes the `pagehide` and `pageshow` listeners, disposes the controllers, stops the streams and clears the root.
- Change `apps/web/tsconfig.json`: removes `exclude: ["src/browser/**"]` and adds the `packages/presentation/document` reference.
- Change `docs/build/refactor/web-react/plan/task-07-add-react-shell-routes-and-legacy-mount.md`, `plan/README.md` and `reports/README.md`.

The task test changed in two places relative to the task file, and each change is recorded in "STOP and retry" below. The assertion set is the same.

## Commands

| Command | Exit code | Key output |
| --- | --- | --- |
| `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/app-shell-routes.test.tsx` (Step 2) | 1 | `Failed to resolve import "../src/routes.tsx"`, `Tests no tests` |
| Same command, first run after Step 4 | 1 | `Unable to find an element with the text: Không tìm thấy chat này...`; a probe showed `management.workspaces()` rejected with `INVALID_RESPONSE` |
| Same command, after the workspace fixture fix | 0 | `Test Files 1 passed (1)`, `Tests 1 passed (1)` |
| Same command, 12 consecutive runs after the wait fixes | 0 | `passed 1` to `passed 12`, `failures=0` |
| Same command, final run | 0 | `Test Files 1 passed (1)`, `Tests 1 passed (1)` |
| `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vite build --configLoader native` | 0 | `343 modules transformed`, `dist/index.html 0.44 kB`, `dist/assets/index-CX10jVPq.js 613.77 kB` |
| `Test-Path apps/web/dist/index.html` and `Test-Path apps/web/dist/samples/1.html` | 0 | `True`, `True` |
| `corepack pnpm@11.28.5 lint` (first run, with `apps/web/dist` present) | 1 | Many errors, all in `apps/web/dist/assets/index-CX10jVPq.js` |
| `corepack pnpm@11.28.5 lint` (after removing the build output) | 0 | no output |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 exec biome format --write <the 11 source files of the task>` | 0 | `Formatted 11 files in 123ms. Fixed 4 files.` |
| `corepack pnpm@11.28.5 typecheck` (extra check) | 1 | `error TS2878` in the `apps/web` project, and `apps/host/src/server.ts(426,3): error TS6133: 'drafts' is declared but its value is never read` |
| `corepack pnpm@11.28.5 exec tsc -p apps/web/tsconfig.json` (extra check, with the `tsconfig.browser.json` reference removed for the test only) | 0 | no output; the reference was restored immediately |
| `corepack pnpm@11.28.5 check:docs` (after this report) | 0 | `check-docs: 334 file(s) checked, 0 error(s) in 0 file(s)` |

## STOP and retry

- Step 5, retry 1: the first test run after Step 4 failed. The boot hung on `navigation.refresh()` and never showed the notice. A temporary probe in `start` showed `PROBES [ 'ok', 'ok', 'Error: INVALID_RESPONSE' ]`, so `decodeWorkspaceList` rejected the fixture that the task file gives. The decoder and `WorkspaceView` in `packages/host/contracts/src/management.ts` require `folder`, `isDefault` and `folderStatus`; the task fixture has `default` and `status`. I changed the fixture to `{ id: 'default', name: 'Mặc định', folder: null, isDefault: true, folderStatus: 'none' }`. The test file is in the `Files` block, and the assertion did not change.
- Step 5, retry 2: the test was intermittent. Two defects appeared. First, the default 1 s `waitFor` timed out on a cold run, because the first boot load took more than 1 s in this environment. Second, the `#app .chat-navigation` assertion ran in the same tick that the notice appeared, before the home page `useEffect` mounted the legacy shell. I kept the assertions and changed the test to `waitFor(..., { timeout: 5000 })` for the notice and to `waitFor` for the shell. 12 consecutive runs then passed.
- Step 5, retry 3: `corepack pnpm@11.28.5 lint` failed with errors only in `apps/web/dist/assets/index-CX10jVPq.js`. `apps/web/dist` is not in `.gitignore` or in an oxlint ignore list, so the command lints the build output. I verified that `dist/index.html` and `dist/samples/1.html` exist, then removed `apps/web/dist` and ran `lint` again. The lint result then covers source files only. This is a plan defect: a later task must add the build output to the ignore lists.
- Extra check, not in Step 5: `typecheck` reports `TS2878` for the `apps/web` project. I reproduced the cause: `apps/web/tsconfig.json` now includes `src/browser`, and it also references `apps/web/tsconfig.browser.json`, which owns the same files. With `rewriteRelativeImportExtensions`, the relative `.ts` imports inside `src/browser` resolve to the other project, and the two projects have different `rootDir`/`outDir` pairs. `tsc -p apps/web/tsconfig.json` passes when the `tsconfig.browser.json` reference is absent; I restored the reference because the task keeps the browser project until Phase 7. The second error, `apps/host/src/server.ts(426,3) 'drafts' is declared but its value is never read`, is in another application and is not caused by this task. `typecheck` is not a check of Task 7, so this did not stop the task.
- No other STOP occurred.

## What the commands do not prove

- The found-chat branch has no test. The test covers only `initialSessionId` that the session list does not contain.
- The settings route has no test. Nothing proves that `settingsUI.open()` runs after the start sequence, or that the route renders without an error.
- The theme has no test. The `matchMedia` stub returns `matches: false`, and the preferences reply is `system`, so nothing asserts the `.dark` class, the system change listener or `themeUI.dispose`.
- The shell cleanup has no assertion. The test unmounts the tree, and the run does not throw, but no test proves that the keydown, pointerdown, compact-navigation or system listeners stop.
- The test does not use `StrictMode`. It does not prove that the double mount of `LegacyBrowserMount` is safe. The production entry uses `StrictMode`.
- The test does not prove the real Host contract for every fixture. The fixtures are hand-written MSW replies; the task fixture already disagreed with one decoder.
- The Vite build proves only that the modules resolve and bundle. No Host serves `apps/web/dist` until Task 8, and no browser ran.
- The build leaves a chunk of 613.77 kB and a Vite warning about the size. The task does not set a chunk split.
- `lint` and `check:boundaries` did not run with `apps/web/dist` present, because the build output is not ignored.

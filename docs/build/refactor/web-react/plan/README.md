# Browser in React Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of the Browser in React workstream.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `../reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Phase 2 builds `apps/web/` with Vite, serves `apps/web/dist/` from the Host, adds the React shell, and mounts the legacy screens.

**Approach:** One revision for each phase of the Browser in React workstream. The planner completed the diagnosis for Phase 2 and installed all Phase 2 libraries with pinned versions. Each task builds one vertical slice and runs only related tests until the phase exit check.

**Tech stack:** Node.js 22.19.0, pnpm 11.28.5 (`corepack pnpm@11.28.5`), TypeScript 6.0.3, React 19.3.1, Vite 8.4.0 and React Router 8.5.3. Uses TanStack Query 5.108.4, Tailwind CSS 4.3.5, shadcn/ui, Vitest 5.1.2, MSW 3.0.8 and oxlint 1.94.0.

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

## Revision 2: Phase 2, React shell

### Revision 2 Decisions

| Topic | Decision |
| --- | --- |
| Library setup | `apps/web/package.json` holds all Phase 2 packages with pinned versions in `AGENTS.md`. `apps/web/components.json` and `apps/web/vitest.config.ts` exist |
| Build pipeline | `apps/web/vite.config.ts` builds `apps/web/dist/` with `@vitejs/plugin-react`, `@tailwindcss/vite` and `@` alias to `src`. `scripts/build-workspace.mjs` runs Vite for `@deckagent/local-web` instead of `tsdown`. `tsconfig.browser.json` stays until Phase 7 for existing `node:test` suites |
| Mock build guard | A Vite `generateBundle` plugin `forbidMocksInBuild` in `apps/web/vite.config.ts` fails a production build when any chunk includes `mocks/` or `msw`. `tests/vite-build-mocks.test.mjs` proves the guard fails on a mock import |
| Host static serving | `apps/host/src/http/web-assets.ts` loads `apps/web/dist/` into the fixed `assets` map, marks `/samples/*.html` as `sandboxed: true`, and serves dynamic `/theme.js`. Task 8 removes `apps/web/src/index.ts` and the `@deckagent/local-web` dependency in `apps/host/package.json` (WB-02, WB-05) |
| SPA fallback | `apps/host/src/http/app.ts` falls back to `/` only when `options.spaFallback` is true, `req.method === 'GET'`, the path does not start with `/api/`, `/assets/` or `/samples/`, contains no `%`, and its last segment contains no `.`. Paths like `/slide.html` still return `404 NOT_FOUND` |
| Theme script and CSS | `/theme.js` sets or removes the `.dark` class on `document.documentElement` and checks `prefers-color-scheme:dark` for `system`. `apps/web/src/styles/app.css` imports Tailwind and defines shadcn/ui theme variables under `:root` and `.dark`. Legacy CSS lives in `apps/web/src/styles/legacy.css` inside `@layer base` and `@layer components` with `--legacy-accent` so Tailwind utilities win |
| Sample slides | Move `/samples/1.html`, `/samples/2.html` and `/samples/3.html` from `apps/web/src/index.ts` into `apps/web/public/samples/`. Vite copies them into `apps/web/dist/samples/` |
| API client and errors | `apps/web/src/api/client.ts` stores `{ origin, token }` from `main.tsx`, sends bearer headers, decodes JSON responses and throws typed `ApiClientError` with union `ClientErrorCode`. `apps/web/src/text.ts` maps every `ClientErrorCode` with `Readonly<Record<ClientErrorCode, string>>` |
| Change feed hook | `apps/web/src/api/changes.ts` streams `/api/changes` and `/api/sessions/:sessionId/changes` with `decodeChangeNotice`. `apps/web/src/hooks/use-change-feed.ts` invalidates TanStack Query prefixes without writing cache data, stops on `AUTH_REQUIRED` and aborts on unmount |
| Routing and shell | `apps/web/src/routes.tsx` declares `AppShell` with `/` (`HomePage`), `/chats/:sessionId` (`ChatPage`), `/settings` (`SettingsPage`) and `*` redirect to `/`. `main.tsx` reads `#token=` once and renders `QueryClientProvider` and `BrowserRouter` |
| Legacy screen mount | Refactor `apps/web/src/browser/boot.ts` to export `mountLegacyBrowser(root, options): () => void`. `apps/web/src/components/legacy-browser-mount.tsx` mounts it into a `<main id="app" ref={...} />` and cleans up on unmount. `hooks/use-host-connection.ts` supplies `{ origin, token }` so `components/` does not import `api/` |
| CSS import boundary | `apps/web/src/main.tsx` imports `@/styles/app.css` through the `@` alias so `check:boundaries` does not flag a relative `.css` import |
| Deliberate test updates | `e2e/local-web.test.mjs` matches `/assets/.*\.js` instead of `/client/boot.js` (WB-02). `apps/host/tests/web-management.test.mjs` and `e2e/browser-smoke.test.mjs` check `.dark` class instead of `dataset.theme` (`web-rules.md`). All `/api/*` HTTP expectations stay unchanged |

### Revision 2 Global Constraints

- Shell: Git Bash on Windows. Run each command from the repository root `C:\Users\Duy\Desktop\DeckAgent`.
- Package manager: `corepack pnpm@11.28.5`. Do not call `pnpm` directly.
- Invoke Vite and Vitest with `--configLoader native` so Node loads `.ts` configs without writing inside `node_modules/`.
- Relative imports between `.ts` and `.tsx` files in `apps/web/src/` must include the file extension (`.ts` or `.tsx`) to pass `check:boundaries`. Path alias imports (`@/...`) omit extensions.
- Obey every oxlint Browser folder rule. Do not import `api/` in `pages/`, `components/`, `layouts/` or `contexts/`. Keep JSX out of `hooks/`, React out of `api/`, and `dangerouslySetInnerHTML` and `enum` out of all files. Use kebab-case file names.
- User-visible text in new React code lives in `apps/web/src/text.ts`.
- Do not install, remove or upgrade npm packages. All Phase 2 libraries are already installed.
- Do not run the full set of test suites in a task. A task runs only the tests that its `Files` block changes or that test the changed code. Only a phase exit task runs all non-live test suites, to find defects and fix them.

### Revision 2 Review Focus

- A production Vite build bundles a file from `mocks/` or `msw`. Test: `forbidMocksInBuild rejects chunks that include mocks or msw` in [Task 4](task-04-configure-vite-tailwind-and-shadcn.md).
- `apiJson` drops `Authorization`, misclassifies 401 or lets invalid JSON pass without `INVALID_RESPONSE`. Test: `apiJson attaches bearer token, decodes errors and rejects malformed JSON` in [Task 5](task-05-add-api-client-changes-and-text.md).
- `useChangeFeed` writes into cache instead of invalidating prefixes, keeps reconnecting after `AUTH_REQUIRED` or leaks an open stream on unmount. Test: `useChangeFeed invalidates query prefixes, stops on AUTH_REQUIRED and aborts on unmount` in [Task 6](task-06-add-change-feed-and-connection-hooks.md).
- React StrictMode double-mounts `LegacyBrowserMount`, or navigating to an unknown `sessionId` fails to show the missing-chat notice. Test: `AppRoutes renders shell routes and shows missing chat notice` in [Task 7](task-07-add-react-shell-routes-and-legacy-mount.md).
- Host SPA fallback returns `index.html` for `/slide.html`, `/assets/missing.js` or `HEAD /`, or strips sandbox CSP from `/samples/2.html`. Test: `loadWebDistAssets and Host SPA fallback enforce static, sandbox and 404 boundaries` in [Task 8](task-08-serve-web-dist-and-remove-load-web-assets.md).

### Revision 2 Tasks

| Task | Status | File |
| --- | --- | --- |
| 4 | Pending | [Configure Vite, Tailwind, shadcn/ui and DESIGN.md](task-04-configure-vite-tailwind-and-shadcn.md) |
| 5 | Pending | [Add api/client.ts, api/changes.ts and text.ts](task-05-add-api-client-changes-and-text.md) |
| 6 | Pending | [Add change feed and host connection hooks](task-06-add-change-feed-and-connection-hooks.md) |
| 7 | Pending | [Add React shell, routes, main.tsx and legacy mount](task-07-add-react-shell-routes-and-legacy-mount.md) |
| 8 | Pending | [Serve apps/web/dist with SPA fallback and remove loadWebAssets](task-08-serve-web-dist-and-remove-load-web-assets.md) |
| 9 | Pending | [Phase 2 exit check](task-09-phase-2-exit-check.md) |

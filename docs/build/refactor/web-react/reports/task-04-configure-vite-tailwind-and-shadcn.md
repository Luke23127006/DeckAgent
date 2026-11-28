# Task 4 Report: Configure Vite, Tailwind, shadcn/ui and DESIGN.md

Read this file to know which files Task 4 added, which commands ran, their results and what the checks do not prove.

## Files changed

- Create `apps/web/index.html`: the `lang="vi"` entry with `/theme.js`, `#root` and `/src/main.tsx`.
- Create `apps/web/vite.config.ts`: the React and Tailwind plugins, the `@` alias, `outDir: 'dist'` and `forbidMocksInBuild`.
- Create `apps/web/public/samples/1.html`, `2.html`, `3.html`: the three `sampleAssets` bodies.
- Create `apps/web/src/styles/app.css`: Tailwind import, `@custom-variant dark`, the `@theme inline` mapping, and the `:root` and `.dark` shadcn/ui variables.
- Create `apps/web/src/styles/legacy.css`: the nine legacy style blocks inside `@layer base` and `@layer components`, with `:root.dark` and `var(--legacy-accent)`.
- Create `apps/web/src/components/ui/cn.ts` and `apps/web/src/components/ui/button.tsx`.
- Create `apps/web/tests/button.test.tsx` and `tests/vite-build-mocks.test.mjs`.
- Change `apps/web/tsconfig.json`: adds `jsx`, `lib`, `types` and `paths`. It keeps `exclude: ["src/browser/**"]`.
- Change `apps/web/DESIGN.md`: the `.dark` statement and the shadcn/ui token table.
- Change `package.json`: the `test:web` script.
- Change `docs/build/refactor/web-react/plan/README.md`, `plan/task-04-configure-vite-tailwind-and-shadcn.md` and `reports/README.md`.

## Commands

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap tests/vite-build-mocks.test.mjs` (Step 2, before the plugin) | 1 | `Cannot find module '...\apps\web\vite.config.ts'` |
| `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/button.test.tsx` (Step 2) | 1 | `Failed to resolve import "../src/components/ui/cn.ts"` |
| `node --test --test-reporter=tap tests/vite-build-mocks.test.mjs` (Step 5, first attempt) | 1 | `Missing expected rejection` |
| `node --test --test-reporter=tap tests/vite-build-mocks.test.mjs` (after the plugin change) | 0 | `# pass 1`, `# fail 0` |
| `corepack pnpm@11.28.5 test:web` | 1 | `ERR_PNPM_BAD_PM_VERSION`, `Your current pnpm is v12.21.0` |
| `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native` | 0 | `Test Files 1 passed (1)`, `Tests 1 passed (1)` |
| `pnpm test:web` (local pnpm 11.28.5 launcher) | 0 | `Test Files 1 passed (1)`, `Tests 1 passed (1)` |
| `corepack pnpm@11.28.5 lint` | 0 | no output |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` (after this report) | 0 | `check-docs: 322 file(s) checked, 0 error(s) in 0 file(s)` |
| `corepack pnpm@11.28.5 typecheck` (extra check) | 0 | no output |
| `corepack pnpm@11.28.5 format:check` (extra check, before one fix) | 1 | 22 errors. 21 errors name files that this task does not change and that keep CRLF line endings. The other error was `apps/web/vite.config.ts` |
| `corepack pnpm@11.28.5 exec biome format <new files>` (extra check, after the fix) | 0 | `Checked 5 files`, no error |
| `@tailwindcss/node` compile of `apps/web/src/styles/app.css` (extra check, script outside the repository) | 0 | `bg-primary` gives `background-color: var(--primary)`, `dark:bg-card` gives `background-color: var(--card)`, 74,754 bytes |

The final runs used Git Bash from the repository root. An earlier `test:web` run in PowerShell gave the same result.

## STOP and retry

- Step 5, retry 1: the first guard passed the build with `Missing expected rejection`. Vite 8 (Rolldown) inlines the tree-shaken `mocks/browser.js` and removes it from `output.moduleIds`. The plugin now also records each matching module id in `moduleParsed`, and it scans `output.moduleIds` and `output.modules` in `generateBundle`. The next run failed the build with `forbidden mock module`.
- Step 5, retry 2: `corepack pnpm@11.28.5 test:web` exits 1 before Vitest starts. Under corepack, the nested `pnpm` on `PATH` is the standalone launcher at `C:\dev_env\nodejs\node_modules\pnpm` (package version 12.21.0). That launcher refuses the `packageManager` pin 11.28.5. The same command that the script runs passes under corepack, and `pnpm test:web` with the local 11.28.5 launcher passes. No repository file changed for this cause.
- No STOP occurred.

## What the commands do not prove

- No production `vite build` of `apps/web` ran. `src/main.tsx` arrives in Task 7, so the `index.html` entry cannot build yet. The Tailwind compile used one CSS file and five test classes. It does not prove plugin order, the `@` alias or the `dist/` layout.
- The mock guard test proves the rejection for a chunk that imports `mocks/`. It does not prove the `node_modules/*/msw/` pattern, because the test build imports no `msw` module.
- No test guards the legacy rule copy. A script outside the repository compared the 460 rule strings of `apps/web/src/index.ts` with `apps/web/src/styles/legacy.css`: 0 missing, 0 extra and 0 remaining `var(--accent)`.
- `/theme.js` and the `.dark` class are not exercised. The Host serves `/theme.js` in Task 8, and no browser ran in this task.
- No visual check of the light or dark theme ran.

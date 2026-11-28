# Code Layout Refactor

Read this file to learn the problems of blank lines and statement order in DeckAgent code, and the scope and phases of the refactor.

The refactor changes only the layout of the code: blank lines between declarations, between class members and between the steps of a function body. It does not change behavior, names or the order of statements. The [implementation plan](plan/README.md) has the tasks.

## Problems

The values in this section come from a scan of 237 production files (`.ts` and `.tsx` in `apps/host/src/`, `apps/web/src/` and `packages/*/*/src/`, approximately 33,000 lines) on 2026-11-28, at commit `c6fb219`.

| Problem | Measurement | Example |
| --- | --- | --- |
| Few blank lines | 6.3% of all lines are blank | `packages/presentation/deck/src/artifact-store.ts` has 332 lines without a blank line, of 363 lines |
| Top-level declarations without a blank line | 90 declarations start on the line after the `}` of the previous declaration | `packages/presentation/deck/src/generation-contracts.ts` (16), `packages/host/contracts/src/index.ts` (10) |
| Class members without a blank line | Fields, `constructor` and methods follow each other without a blank line | `ArtifactStorage` in `artifact-store.ts`, `ImageReviewRun` in `apps/host/src/modules/deck/images/image-review-run.ts`, `StreamTracking` in `apps/host/src/runtimes/opencode/stream-tracker.ts` |
| Function bodies without steps | 249 function bodies have 6 or more statements, 12 or more lines and no blank line | `ImageReviewRun.search` mixes guards, state changes, the I/O call and the result handling in one block. `ProviderForm` in `apps/web/src/pages/settings/components/provider-form.tsx` puts state, hooks, effects and JSX in one block |
| Files that Biome does not accept | `biome format` reports 24 files, some with CRLF line endings | `packages/presentation/pptx/src/index.ts`, `apps/web/src/hooks/use-workspaces.ts` |

### Why the formatter does not fix it

Biome keeps the blank lines that a file already has and replaces two or more blank lines with one. It does not add a blank line. So `corepack pnpm@11.28.5 format` cannot fix the problems in the table. oxlint has no rule for blank lines between statements or class members.

### Why the refactor does not move declarations to the top of a function

With `const` and `let`, the scope of a variable is the block that declares it. A declaration near its first use keeps the scope small, and a guard can return before the code computes values that it does not need. A list of declarations at the top of a function is a rule of C89 and of `var` in JavaScript. React hooks are an exception: the Rules of Hooks require that a component calls its hooks before any condition.

## Scope

| In scope | Out of scope |
| --- | --- |
| Blank lines in production code and test code under `apps/`, `packages/`, `scripts/` and `tests/` (the files that Biome formats) | `e2e/`, because Biome does not format it |
| One Biome pass over the files that Biome does not accept | Changes to the Biome configuration |
| A script that adds blank lines and reports missing blank lines, and a post-edit hook that reports them | ESLint or `@stylistic`: a second linter next to oxlint for two rules |
| Steps in dense function bodies of production code, added by hand | Moving, merging or splitting statements |
| A section `Bố cục` in `docs/conventions/code.md` | Named constants for numbers in conditions, for example `4`, `2` and `500` in `ImageReviewRun`. A later refactor can do this |

## Phases

| Phase | Result | Tasks |
| --- | --- | --- |
| 1. Tool | `scripts/format-layout.mjs` adds the blank lines that a machine can find, and lists dense function bodies | 1, 2 |
| 2. Mechanical pass | Biome accepts each file. Each file has the blank lines that the script requires | 3, 4 |
| 3. Enforcement | `format`, `format:check` and the post-edit hook run the script. `code.md` has the layout rules | 5, 6 |
| 4. Function bodies | Dense function bodies of production code have blank lines between their steps | 7 to 11 |
| 5. Exit | `.git-blame-ignore-revs` lists the style commits. All checks pass | 12 |

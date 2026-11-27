# Task 2 Report: Write the Browser rules into the conventions

Read this file to know what Task 2 changed, which commands it ran and what the commands do not prove.

## Files changed

- `docs/conventions/project-structure.md`: the `apps/web/` part of the target tree, the table `apps/web/` with one row for each folder, paragraphs for page colocation, routes and the editor core, the row `contracts/` (deck decoders), the `apps/web/` rows of the table `Runtime`, the right column of the `apps/web/src/browser/**` row in `Trong lúc chuyển`, and the Browser rows of `Enforcement`.
- `docs/conventions/code.md`: the new section `Browser` with the subsections `File và tên`, `Server state và UI state`, `Style`, `Văn bản và lỗi` and `Preview`.
- `docs/conventions/testware.md`: two items for Vitest, jsdom, Testing Library, MSW and `apps/web/mocks/`.
- `AGENTS.md`: the Browser stack bullet and the Vitest exception in the `node:test` bullet.
- `docs/build/refactor/target-structure/target-layout.md`: the `apps/web/src/` tree lines and the rows for the canvas and a settings screen.
- `docs/build/refactor/target-structure/criteria.md`: the check column of TS-06 and TS-07.
- `docs/build/refactor/target-structure/README.md`: the TanStack Query sentence of `Phase 5: Browser in React`.
- `docs/build/refactor/web-react/web-rules.md`: the purpose paragraph and the table `Enforcement`.

## Commands

| Command | Exit code | Key output |
| --- | --- | --- |
| `corepack pnpm@11.28.5 check:docs` | 0 | `0 error(s)` |
| `uv run python -I "$HOME/.agents/skills/asd-ste100/scripts/ste-lint-vi.py"` on `project-structure.md` | 1 | One `HARD` finding on line 3, the purpose line. Line 3 is the same at `HEAD`, so Task 2 did not add it |
| The same linter on `code.md` and `testware.md` | 0 | `OK: 0 findings.` |
| `git grep -n -E "features/<name>\|features/canvas\|chia theo feature" -- docs/conventions AGENTS.md docs/build/refactor/target-structure/target-layout.md` | 0 | One line: `project-structure.md`, rule 2 of `Trong lúc chuyển`, the branch "Khi `apps/host/` chưa có" |

## Items for the report

| Item | Reason |
| --- | --- |
| Rule 2 of `Trong lúc chuyển` still names `apps/web/src/features/<name>/` | The branch is for the time before `apps/host/` existed, and it is about Host code, not the Browser layout. `apps/host/` exists, so the branch has no effect. The task forbids a change to a rule about `apps/host/`. After Task 2, the PO removed the branch. Rule 2 now puts new Host code in `apps/host/src/modules/<name>/` |
| `testware.md` says that tests do not import the handlers of `apps/web/mocks/` | `web-rules.md` says that test handlers stay in `apps/web/tests/`. The sentence states the same boundary from the side of the mocks |

## STOP and retry

- Step 6: the search found one line, so the output did not match `Expected`. See the first row of [Items for the report](#items-for-the-report).
- Step 4: the first write of the table `Enforcement` in `web-rules.md` went through a shell command that removed the backticks. The second write used a script file. `check:docs` passed after it.

## What the commands do not prove

- `check:docs` checks links, anchors and the purpose line. It does not check that the conventions agree with `web-rules.md`.
- The `(review)` marks have no check. Only review finds a violation of them.

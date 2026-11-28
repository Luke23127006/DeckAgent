# Task 2: Write the Browser rules into the conventions

Read this file to learn the steps of Task 2, which writes the Browser rules into the conventions, AGENTS.md and the target structure research files.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `docs/build/refactor/web-react/web-rules.md` (all sections)
- `docs/conventions/project-structure.md` (the sections `Cấu trúc đích`, `apps/web/`, `packages/`, `Dependency rules`, `Trong lúc chuyển` and `Enforcement`)
- `docs/conventions/code.md` (the sections `Naming`, `Validation` and `Error handling`)
- `docs/conventions/testware.md`
- `AGENTS.md` (the section `Tech Stack`)
- `docs/build/refactor/target-structure/target-layout.md` (each line that names `apps/web`)
- `docs/build/refactor/target-structure/criteria.md` (the rows TS-06 and TS-07)
- `docs/build/refactor/target-structure/README.md` (the section `Phase 5: Browser in React`)
- `.oxlintrc.json` (the overrides for `**/apps/web/src/`)
- `.agents/skills/ste-vi/SKILL.md`
- `docs/conventions/docs.md`

**Files:**
- Change: `docs/conventions/project-structure.md`
- Change: `docs/conventions/code.md`
- Change: `docs/conventions/testware.md`
- Change: `AGENTS.md` (the section `Tech Stack`)
- Change: `docs/build/refactor/target-structure/target-layout.md`
- Change: `docs/build/refactor/target-structure/criteria.md`
- Change: `docs/build/refactor/target-structure/README.md` (the section `Phase 5: Browser in React`)
- Change: `docs/build/refactor/web-react/web-rules.md` (the purpose paragraph and the table `Enforcement`)

**Interfaces:**
- Uses: the oxlint overrides for `apps/web/src/{pages,components,layouts,contexts,hooks,api,editor,styles}/`, `apps/web/src/{routes,text}.*`, `apps/web/src/main.tsx` and `apps/web/mocks/` in `.oxlintrc.json`.

**STOP when:** A section that this task names does not exist in the file.

**Forbidden:** Do not change a rule about `apps/host/` or `packages/`, except the row `contracts/` in the table `packages/`.

## Changes

| File | Section | Change |
| --- | --- | --- |
| `project-structure.md` | `Cấu trúc đích` | Replace the `apps/web/` lines of the tree with the layout of `web-rules.md#layout`. Keep `apps/web/tests/` |
| `project-structure.md` | `apps/web/` | Replace the table with one row for each folder of the table in `web-rules.md#layout`, with the columns `Path`, `Câu hỏi`, `Sở hữu` and `Không sở hữu`. Add one paragraph for page colocation, one for the routes in `web-rules.md#routing`, and one for the editor core |
| `project-structure.md` | `packages/` | In the row `contracts/`, add to `Sở hữu`: a decoder for each deck payload that the Browser reads, which calls the decoder of `presentation/document/` |
| `project-structure.md` | `Dependency rules` | Replace the row `apps/web/` of the table `Runtime` with one row for each folder: what it can import and what it cannot import, from the overrides in `.oxlintrc.json` |
| `project-structure.md` | `Trong lúc chuyển` | Change the right column of the row `apps/web/src/browser/**, apps/web/src/index.ts` to the folders of the table `apps/web/` |
| `project-structure.md` | `Enforcement` | Add one row for each override in `.oxlintrc.json` for `apps/web/src/` and `apps/web/mocks/`, with the tool `oxlint (no-restricted-imports)`, `oxlint (react/no-danger)` or `oxlint (unicorn/filename-case)`. Change the row "`apps/web/` chỉ import `packages/contracts/`": the target check is `check:boundaries` (`browser-node-import`) for all of `apps/web/src/`, after Phase 7 removes `apps/web/src/index.ts` |
| `code.md` | New section `Browser` after `State, async và side effect` | The rules of `web-rules.md#data-flow`, `#role-files-and-names`, `#styles`, `#text-and-errors` and `#preview-security`. Each rule ends with its tool in parentheses: `(lint: oxlint <rule>)` only for a rule that an override checks, else `(review)` |
| `testware.md` | End of the list | One item: tests of `apps/web/` run with Vitest, a component test uses jsdom, Testing Library and MSW in Node, and the handlers and fixtures stay in `apps/web/tests/`. One item: `apps/web/mocks/` is development code, not testware |
| `AGENTS.md` | `Tech Stack` | Replace the bullet "Thư viện đích đã chọn, chưa cài" with the stack of `web-rules.md#stack`. Keep the sentence that the phase that installs a library sets its version. Change the bullet `node:test cho test` to say that `apps/web/` uses Vitest |
| `target-layout.md` | Each `apps/web` line | Replace `chia theo feature` and `features/<name>/` with the layer layout, and `features/canvas/` with `src/editor/` and `pages/deck/`. Add a link to `../web-react/web-rules.md` |
| `criteria.md` | TS-06, TS-07 | Add to the check column: the oxlint overrides for `apps/web/src/` (TS-06) and the end of hand-built DOM in Phase 7 of `../web-react/README.md` (TS-07) |
| `target-structure/README.md` | `Phase 5: Browser in React` | Replace "Add TanStack Query only for server state that more than one screen reads" with: TanStack Query owns server state, as `../web-react/web-rules.md` gives |
| `web-rules.md` | Purpose paragraph | Say that Phase 1 wrote the rules into the Project Structure, the Coding Guidelines and the Testware |
| `web-rules.md` | `Enforcement` | Change the status of each rule that an override checks to `Exists` |

- [x] **Step 1: Change `docs/conventions/project-structure.md`**

Do the rows for `project-structure.md` in the table [Changes](#changes).

- [x] **Step 2: Change `docs/conventions/code.md` and `docs/conventions/testware.md`**

Do the rows for `code.md` and `testware.md` in the table [Changes](#changes).

- [x] **Step 3: Change `AGENTS.md`**

Do the row for `AGENTS.md` in the table [Changes](#changes).

- [x] **Step 4: Change the files in `docs/build/refactor/`**

Do the rows for `target-layout.md`, `criteria.md`, `target-structure/README.md` and `web-rules.md` in the table [Changes](#changes).

- [x] **Step 5: Run the checks**

Run: `corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

Run: `uv run python -I "$HOME/.agents/skills/asd-ste100/scripts/ste-lint-vi.py" docs/conventions/project-structure.md docs/conventions/code.md docs/conventions/testware.md`
Expected: no `hard` violation.

- [x] **Step 6: Check the conventions against the checks**

Run: `git grep -n -E "features/<name>|features/canvas|chia theo feature" -- docs/conventions AGENTS.md docs/build/refactor/target-structure/target-layout.md`
Expected: no line.

Read each `(lint: ...)` mark that this task added. Each mark names a rule that an override in `.oxlintrc.json` turns on for the folder of the rule.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

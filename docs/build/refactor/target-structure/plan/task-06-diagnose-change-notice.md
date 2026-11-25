# Task 6: Diagnose the change notice and version

Read this file to learn the steps of Task 6, which records the tables, the writes and the deck notice pattern and then stops.

In the target layout, every store increases a `version` after each write and sends a change notice with the `version`. A write sends the `version` that it read, and the store rejects the write when the `version` is old. Today only the deck has a `version` and the `deck-changed` notice. This task collects the facts for the change notice contract. It does not design the contract.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `packages/presentation/deck/src/deck-contracts.ts` (65 lines)
- `packages/presentation/deck/src/deck-reads.ts` (145 lines)
- `packages/presentation/deck/src/deck-store.ts` (lines 300-320)
- `packages/host/api/src/transport/deck-routes.ts` (37 lines)
- `packages/host/api/src/transport/sse.ts` (16 lines)
- `apps/web/src/browser/transport/deck-client.ts` (lines 160-183)
- `apps/web/src/draft-store.ts` (71 lines)
- `packages/presentation/deck/src/schema.ts` (113 lines)
- `packages/session/persistence/src/schema.ts` (160 lines)
- `packages/workspace/registry/src/schema.ts` (60 lines)
- `apps/web/src/web-state.ts` (137 lines)
- `apps/web/src/features/providers/provider-settings.ts` (378 lines)
- `docs/open-questions.md` (row OQ-061)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-06-diagnose-change-notice.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-06-diagnose-change-notice.md`

**Interfaces:**

- Uses: `DeckChange` and `DeckReader.subscribe(sessionId: string, listener: (change: DeckChange) => void): () => void` in `packages/presentation/deck/src/deck-contracts.ts`.
- Uses: `routeDeck` in `packages/host/api/src/transport/deck-routes.ts`.
- Uses: `MemoryDraftStore` and the error code `DRAFT_CONFLICT` in `apps/web/src/draft-store.ts`.
- Produces: a report with one row for each table, with IDs `CN1`, `CN2`, and so on, and a class from the [Table decision table](#table-decision-table) for each row.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `git status --short` shows a change outside the four files in `Files`.

**Forbidden:**

- Change a file that is not in the `Files` block. This task does not change code.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Propose a type shape, an interface or a file name for the new contract.

## Table decision table

Apply the rows from top to bottom to each table. Use the first row that matches.

| Signal | Action |
| --- | --- |
| The table has a `version` column, or a write to the table increases a `version` value that a notice or a read returns | Class `versioned`. Record the column or the value, and the notice that sends it. |
| A Browser screen shows rows of the table through an HTTP route, and the Browser can change the rows through an HTTP route | Class `user-visible-write`. Record the read route and the write route. |
| A Browser screen shows rows of the table, but only the Host or the agent writes the rows | Class `user-visible-read`. Record the read route and the code that writes. |
| The Browser does not show the rows of the table | Class `internal`. Record the owner that reads the rows. |
| No row matches | Class `unclassified`. Add the item to the report. Do not change it. |

- [ ] **Step 1: List the files that run SQL and the tables**

Run: `git ls-files 'apps/web/src/*.ts' 'apps/web/src/**/*.ts' 'packages/*/*/src/*.ts' | xargs grep -lE "\.(prepare|exec)\(\s*['\`]" | wc -l && git ls-files 'apps/web/src/*.ts' 'apps/web/src/**/*.ts' 'packages/*/*/src/*.ts' | xargs grep -n "CREATE TABLE" | wc -l`

Expected: PASS. The output is two lines: `23` and `29`. FAIL: any other number.

Run: `git ls-files 'apps/web/src/*.ts' 'apps/web/src/**/*.ts' 'packages/*/*/src/*.ts' | xargs grep -n "CREATE TABLE"`

Expected: PASS. The output has 29 lines in 4 files: `apps/web/src/web-state.ts`, `packages/presentation/deck/src/schema.ts`, `packages/session/persistence/src/schema.ts` and `packages/workspace/registry/src/schema.ts`.

- [ ] **Step 2: Classify each table**

For each of the 29 tables, find the code that writes the table and the HTTP route that reads it. Use `grep -rn "<table name>" apps/web/src packages --include=*.ts` and exclude paths with `/lib/`. Apply the [Table decision table](#table-decision-table). Write one row in the report table `ID | Table | Schema (file:line) | Write sites (file:line) | Read route | Class | Record`.

- [ ] **Step 3: Record the deck pattern and the other conflict checks**

Record these facts in the report, with file and line:

1. The `DeckChange` fields, the place that increases the deck `version`, and the place that calls the listeners of `DeckReader.subscribe`.
2. The SSE route path in `deck-routes.ts`, the event name, and the first notice that the route sends after it subscribes.
3. How `apps/web/src/browser/transport/deck-client.ts` reacts to a `deck-changed` notice: it reads the deck again, or it uses the notice data.
4. Whether a deck write takes an expected `version` and rejects an old one. Record the error code when it rejects.
5. How `MemoryDraftStore` in `apps/web/src/draft-store.ts` decides to return `DRAFT_CONFLICT`. This is a second conflict check that is not a `version` in a store.
6. Each other SSE route in `packages/host/api/src/transport/`, with its path and its event names.

- [ ] **Step 4: Check that no code changed**

Run: `git status --short`

Expected: PASS. No path under `apps/`, `packages/`, `e2e/`, `tests/`, `scripts/` or `docs/conventions/` is in the output.

- [ ] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file. Change the Task 6 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-06-diagnose-change-notice.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-06-diagnose-change-notice.md` with:
   - H1 `# Task 6: Diagnose the change notice and version report` and the purpose line `Read this file to learn which tables have a version, which tables the user can change, and how the deck change notice works.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - The table from Step 2, with 29 rows.
   - A count of rows for each class.
   - The six facts from Step 3.
   - Items with class `unclassified`.
   - What the commands do not prove: the search finds tables from `CREATE TABLE` statements only. State in memory, for example the draft store, is in the report only through Step 3.
3. Add a row for Task 6 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Mark Step 5 as `- [x]`.

**STOP** and send the report summary. Revision 1b starts after a person approves the reports of Tasks 3 to 6.

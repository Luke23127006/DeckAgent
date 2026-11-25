# Task 13: Record the Phase 2 structure decisions in Project Structure

Read this file to learn the steps of Task 13, which writes three Phase 2 decisions into Project Structure.

Phase 2 moves all Node code of `apps/web/src/` to `apps/host/src/` in one revision. The move keeps the names of the files and of the folders `features/` and `integrations/`, and Phases 3 and 4 move these folders a second time. Rule 3 of `## Trong lúc chuyển` allows only one move of an old folder, so this task adds the exception. This task also closes the `Open` point about the error map, and points the row of `apps/web/src/local-transport.ts` to the decision. It does not change the mapping table for the moved paths. The move task changes those rows in the same revision as the code.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/conventions/docs.md`
- `.agents/skills/ste-vi/SKILL.md`
- `docs/conventions/project-structure.md` (237 lines, lines 133-209)

**Files:**

- Change: `docs/conventions/project-structure.md` (lines 171, 182 and 200)
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-13-record-phase-2-structure-decisions.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-13-record-phase-2-structure-decisions.md`

**Interfaces:**

- Uses: the anchors `#dependency-rules` and `#trong-lúc-chuyển` in `docs/conventions/project-structure.md`, and the link `[Coding Guidelines](code.md#error-handling)`.
- Produces: in `docs/conventions/project-structure.md`, a decided error map rule in `## Dependency rules`, a changed mapping row for `apps/web/src/local-transport.ts`, and an exception sentence in rule 3 of `## Trong lúc chuyển`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line in Step 1 has other text.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `check:docs` reports an error in a file that this task did not change.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Change the words of the new text in Steps 2 to 4. Only fix a link or an anchor that `check:docs` reports, and write each fix in the report.
- Change another row of the mapping table in `## Trong lúc chuyển`.

- [x] **Step 1: Check the start state**

Run: `wc -l docs/conventions/project-structure.md && grep -n "^\`Open\`: bảng ánh xạ\|^| \`apps/web/src/local-transport.ts\`\|^3\. Chỉ một revision" docs/conventions/project-structure.md | cut -c1-12`

Expected: PASS. The output is four lines: `237 docs/conventions/project-structure.md`, then three lines that start with `171:`, `182:` and `200:`.

- [x] **Step 2: Replace the error map paragraph (line 171)**

Replace the complete line 171 with the line below. Do not copy the outer fence.

```markdown
Bảng ánh xạ lỗi sang HTTP status chia theo owner của lỗi. Error handler chung trong `http/` ánh xạ `HttpError`, `RequestFailure` của `runs/` và lỗi không có trong bảng nào (`500 HOST_ERROR`). Mỗi module sở hữu bảng ánh xạ cho error class của module đó. `server.ts` đăng ký bảng của từng module với error handler. `http/` không import error class của module. Lỗi thuộc component phát hiện ra nó. Cách biểu diễn và chuyển lỗi qua các boundary nằm trong [Coding Guidelines](code.md#error-handling).
```

- [x] **Step 3: Replace the mapping row of `apps/web/src/local-transport.ts` (line 182)**

Replace the complete line 182 with the line below.

```markdown
| `apps/web/src/local-transport.ts` | Error handler trong `apps/host/src/http/` và bảng ánh xạ lỗi của từng module, xem [Dependency rules](#dependency-rules) |
```

- [x] **Step 4: Add the exception to rule 3 (line 200)**

Replace the complete line 200 with the line below.

```markdown
3. Chỉ một revision trong plan của Target Structure Refactor chuyển folder cũ, hoặc tạo folder đích cho một khu vực đã có code cũ *(review)*. Ngoại lệ duy nhất: revision của Phase 2 chuyển toàn bộ Node code trong `apps/web/src/` sang `apps/host/src/` và giữ tên file và tên folder (`features/`, `integrations/`). Phase 3 và Phase 4 chuyển các folder đó một lần nữa, sang folder đích trong bảng trên.
```

- [x] **Step 5: Check the changed lines**

Run: `wc -l docs/conventions/project-structure.md && grep -c "Open\`: bảng ánh xạ\|Ngoại lệ duy nhất: revision của Phase 2\|bảng ánh xạ lỗi của từng module, xem" docs/conventions/project-structure.md`

Expected: PASS. The output is `237 docs/conventions/project-structure.md` and then `2`. FAIL: the second line is `3`, because the old `Open` paragraph is still in the file, or `1` or `0`, because a new line is missing.

Run: `git diff --stat`

Expected: PASS. The output names `docs/conventions/project-structure.md` with `3 insertions(+), 3 deletions(-)`, and other files only in `docs/build/refactor/target-structure/`.

- [x] **Step 6: Run the docs check**

Run: `corepack pnpm@11.28.5 check:docs`

Expected: PASS. The output contains `0 error(s)`.

- [x] **Step 7: Write the report file and stop**

1. Mark Steps 1 to 6 as `- [x]` in this file. Change the Task 13 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-13-record-phase-2-structure-decisions.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-13-record-phase-2-structure-decisions.md` with:
   - H1 `# Task 13: Record the Phase 2 structure decisions report` and the purpose line `Read this file to learn which Phase 2 decisions Project Structure now states.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - Each link or anchor fix from the Forbidden list, or `None`.
   - What the commands do not prove: `check:docs` checks links and structure only. No check enforces the error map rule yet. The mapping table still names `apps/web/src/` paths until the move task changes them.
3. Add a row for Task 13 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-13-record-phase-2-structure-decisions.md`. Expected: the output contains `0 violations`.
5. Mark Step 7 as `- [x]`.

**STOP** and send the report summary. Do not start Task 14 until a person approves the report.

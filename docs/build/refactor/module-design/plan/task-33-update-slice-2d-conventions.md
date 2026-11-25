# Task 33: Update Project Structure conventions for Slice 2D

Read this file to record the approved Slice 2D browser transport error rule (`BB9`, `BD7`) in `docs/conventions/project-structure.md` [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/ste-vi/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/project-structure.md` (lines 78-90)

**Files:**

- Change: `docs/conventions/project-structure.md` (line 84)
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-33-update-slice-2d-conventions.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-33-update-slice-2d-conventions.md`

**Interfaces:**

- Uses: `docs/conventions/project-structure.md` section `### apps/web/`.
- Produces: updated Vietnamese ownership text on line 84 assigning HTTP/SSE error code mapping to `src/browser/transport/` and user-facing UI error copy to `src/browser/` or `src/browser/features/`.

**STOP when:**

- The output of a command does not match `Expected`.
- `docs/conventions/project-structure.md` line 84 differs from the text in Step 1.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files`.
- Remove, skip, or weaken any test or check.
- Add a comment, a lint-disable directive, or `@ts-expect-error`.
- Commit or push before Step 3 checks pass.

- [x] **Step 1: Update the `src/browser/transport/` row in `docs/conventions/project-structure.md`**

In `docs/conventions/project-structure.md`, find line 84:

```markdown
| `src/browser/transport/` | Browser gọi Local Host thế nào? | HTTP/SSE client, serialize request, decode response, error hiển thị cho Browser | Permission policy, Request Lifecycle, domain state transition |
```

Replace line 84 with:

```markdown
| `src/browser/transport/` | Browser gọi Local Host thế nào? | HTTP/SSE client, serialize request, decode response, ánh xạ lỗi HTTP/SSE sang mã lỗi typed của client. Thông báo lỗi cho người dùng thuộc `src/browser/` hoặc `src/browser/features/` | Permission policy, Request Lifecycle, domain state transition, bảng văn bản lỗi UI |
```

- [x] **Step 2: Run documentation and STE checks**

Run:

```bash
corepack pnpm@11.28.5 check:docs
```

Expected: PASS. Exit code `0` and output contains `0 error(s) in 0 file(s)`.

Run:

```bash
uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py --baseline 5 docs/conventions/project-structure.md
```

Expected: PASS. Exit code `0` with no new hard violation on line 84. The `--baseline 5` covers the 5 hard violations that already existed in `docs/conventions/project-structure.md` before this task.

- [x] **Step 3: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 and 2 as `- [x]` in this file. Change the Task 33 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-33-update-slice-2d-conventions.md`.
2. Create `docs/build/refactor/module-design/reports/task-33-update-slice-2d-conventions.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Before and after table for `docs/conventions/project-structure.md` line 84 (`BB9`, `BD7`).
   - Exact command outputs and exit codes for `check:docs` and `ste-lint.py`.
   - What the commands do not prove.
3. Add a Task 33 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 3 as `- [x]` in this file.
5. Run `git status --short` and check that only the five files in `Files` changed. Stage only those five files, commit with `docs(conventions): record Slice 2D browser transport error rule`, and run `git push`.

**STOP** and send the Task 33 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Task 30 Report](../reports/task-30-diagnose-browser-boot-shell-and-transport.md)

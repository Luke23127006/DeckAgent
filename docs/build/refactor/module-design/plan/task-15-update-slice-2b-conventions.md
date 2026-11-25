# Task 15: Update Project Structure conventions for Slice 2B

Read this file to record the approved Slice 2B contract-parity rule (`D8`, `D14`) in `docs/conventions/project-structure.md` [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/ste-vi/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/project-structure.md` (lines 91-145)

**Files:**

- Change: `docs/conventions/project-structure.md` (lines 106-112)
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-15-update-slice-2b-conventions.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-15-update-slice-2b-conventions.md`

**Interfaces:**

- Uses: `docs/conventions/project-structure.md` section `### packages/`.
- Produces: updated Vietnamese rule text in `docs/conventions/project-structure.md` covering independent wire DTO copies across `host/contracts/`, `session/persistence/`, `presentation/deck/`, and `presentation/design/`, guarded by `tsc -b` in `host/api/`.

**STOP when:**

- The output of a command does not match `Expected`.
- `docs/conventions/project-structure.md` lines 106-112 differ from the description in Step 1.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files`.
- Delete, skip, or weaken any test or check.
- Add a comment, a lint-disable directive, or `@ts-expect-error`.
- Commit or push before Step 3 checks pass.

- [x] **Step 1: Update the independent contract-copy rule in `docs/conventions/project-structure.md`**

In `docs/conventions/project-structure.md`, find line 106 (`Ba điểm dễ sai trong các package trên:`) and line 111:

```markdown
- `host/contracts/` và `session/persistence/` giữ hai bản sao độc lập của các type request dùng chung vì Browser import `host/contracts/` và không được phụ thuộc `session/persistence/`. `host/api/` giữ kiểm tra tương đương ở mức type lúc compile (`tsc -b`) để chặn lệch contract.
```

Replace line 106 with `Bốn điểm dễ sai trong các package trên:` and replace line 111 with:

```markdown
- `host/contracts/` giữ bản sao độc lập của các wire DTO dùng chung với `session/persistence/`, `presentation/deck/` và `presentation/design/`. Browser import `host/contracts/` và không được phụ thuộc runtime của các domain package đó. `host/api/` giữ kiểm tra tương đương ở mức type lúc compile (`tsc -b`) trong `contract-sync.ts` để chặn lệch contract.
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

Expected: PASS. Exit code `0` with no hard violation on the edited lines. The `--baseline 5` covers the 5 hard violations that already existed in `docs/conventions/project-structure.md` before this task.

- [x] **Step 3: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 and 2 as `- [x]` in this file. Update the Task 15 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-15-update-slice-2b-conventions.md`.
2. Create `docs/build/refactor/module-design/reports/task-15-update-slice-2b-conventions.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Table of updated lines in `docs/conventions/project-structure.md` (`D8`, `D14`).
   - Exact command outputs and exit codes for `check:docs` and `ste-lint.py`.
3. Add a Task 15 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 3 as `- [x]` in this file.
5. Run `git status --short` and check that only the five files listed in `Files` changed. Stage only those five files, commit with a conventional commit message (example: `docs(conventions): record Slice 2B contract-parity rule`), and run `git push`.

**STOP** and send the Task 15 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Task 13 Report](../reports/task-13-diagnose-deck-core-and-surface.md)

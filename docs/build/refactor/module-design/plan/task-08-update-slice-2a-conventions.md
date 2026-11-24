# Task 8: Update Project Structure Conventions for Slice 2A

Read this file to record the four owner-approved Slice 2A ownership and dependency rules in `docs/conventions/project-structure.md` [[1]](#ref-1) [[2]](#ref-2).

**Goal:** Update `docs/conventions/project-structure.md` for findings F15, F16, P8, and P9 without modifying production or test code.

**Scope:** Documentation only. Apply the four approved rules from the Task 6 and Task 7 reports [[3]](#ref-3) [[4]](#ref-4).

## Files

- Modify: `docs/conventions/project-structure.md`
- Modify: `docs/build/refactor/module-design/plan/README.md`
- Modify: `docs/build/refactor/module-design/plan/task-08-update-slice-2a-conventions.md`
- Modify: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-08-update-slice-2a-conventions.md`

## Steps

- [x] **Step 1: Read the target sections of Project Structure**

  Read `docs/conventions/project-structure.md` lines 91 to 145. Check that the table rows `host/api/`, `host/contracts/`, `session/persistence/`, and `Local Host transport` match the Task 6 and Task 7 reports.

  **STOP** if the table structure differs from lines 91 to 145.

- [x] **Step 2: Apply the four approved convention updates in Vietnamese**

  Update `docs/conventions/project-structure.md` in Vietnamese matching Documentation Conventions [[5]](#ref-5):

  1. In `### packages/`, row `host/api/`:
     - Update column `Sở hữu` to: `Local HTTP/SSE transport và HTTP framing (readJson, giới hạn kích thước body, multipart, header, xác thực, ánh xạ HTTP status), route dispatch, Request Lifecycle, request event, approval coordination`.
     - Append to column `Không sở hữu`: `, decode payload wire JSON thuần (thuộc host/contracts/), runtime của domain package (chỉ import type-level reader port)`.
  2. In `### packages/`, row `host/contracts/`:
     - Update column `Sở hữu` to: `Wire DTO, event envelope, protocol error payload, bộ decode và kiểm tra wire payload thuần cho cả request (như decodeAgentRequest) và response tại runtime boundary`.
     - Keep column `Không sở hữu` unchanged.
  3. In `### packages/`, row `session/persistence/`:
     - Keep column `Sở hữu` unchanged.
     - Append to column `Không sở hữu`: `, trạng thái draft tạm trong bộ nhớ (thuộc apps/web/)`.
  4. In the bullet list below `### packages/` (lines 106 to 111), add this P8 bullet:
     - `host/contracts/ và session/persistence/ giữ hai bản sao độc lập của các type request dùng chung vì Browser import host/contracts/ và không được phụ thuộc session/persistence/. host/api/ giữ kiểm tra tương đương ở mức type lúc compile (tsc -b) để chặn lệch contract.`
  5. In `### Runtime` (under `## Dependency rules`), row `Local Host transport`:
     - Append to column `Được phụ thuộc`: `, type-level reader port của domain package (như DeckReader, OutlineReader)`.
     - Append to column `Không được phụ thuộc`: `, runtime class hoặc hàm của domain package`.

- [x] **Step 3: Check documentation rules**

  Run:

  ```bash
  corepack pnpm@11.28.5 check:docs
  ```

  Expected: `0 error(s) in 0 file(s)` and exit code `0`.

  Run:

  ```bash
  git diff -- docs/conventions/project-structure.md
  ```

  Check that the diff modifies only the five items from Step 2.

- [x] **Step 4: Mark task done, write the report, and commit and push**

  1. Mark Steps 1 to 3 as `- [x]` in this file. Update the Task 8 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` with a link to `../reports/task-08-update-slice-2a-conventions.md`.
  2. Create `docs/build/refactor/module-design/reports/task-08-update-slice-2a-conventions.md` with:
     - One-sentence purpose line after H1 (`Read this file to ...`).
     - Summary table mapping F15, F16, P8, and P9 to exact line numbers in `docs/conventions/project-structure.md`.
     - Exact command output and exit code for `corepack pnpm@11.28.5 check:docs`.
  3. Add Task 8 to the table in `docs/build/refactor/module-design/reports/README.md` and update its purpose sentence to cover Phase 1 and Phase 2 reports.
  4. Re-run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` with `0 error(s)`.
  5. Mark Step 4 as `- [x]` in this file.
  6. Stage only the files listed in `Files`, commit with a conventional commit message (example: `docs(conventions): record Slice 2A ownership and boundary rules`), and run `git push`.

  **STOP** and send the Task 8 report with the commit hash. Do not start Task 9 until the owner approves the report.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Project Structure](../../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Task 6 Report](../reports/task-06-diagnose-host-contracts-and-api.md)
4. <a id="ref-4"></a>[Task 7 Report](../reports/task-07-diagnose-session-persistence.md)
5. <a id="ref-5"></a>[Documentation Conventions](../../../../conventions/docs.md)

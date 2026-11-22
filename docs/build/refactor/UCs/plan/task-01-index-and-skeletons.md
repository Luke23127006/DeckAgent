# Task 1: Use case index and file skeletons

Read this file to learn the steps of Task 1, which writes the index and the skeletons of `docs/UCs/`.

**Read first:**
- [Global Constraints](README.md#global-constraints) and [Owner map](README.md#owner-map) in `README.md`
- `docs/conventions/docs.md`
- `docs/conventions/use-cases.md`
- `.agents/skills/write-use-case/SKILL.md` (the method. Obey [Method](README.md#method) for the steps that change)
- `docs/conventions/mermaid.md`
- `docs/00-old/spec/_STYLE.md` (lines 40-124, the glossary)
- `docs/UCs/README.md`
- `docs/open-questions.md`

**Files:**
- Change: `docs/UCs/README.md`
- Create: `docs/UCs/requests.md`, `docs/UCs/deck.md`, `docs/UCs/providers.md`, `docs/UCs/chats.md`, `docs/UCs/design-systems.md`, `docs/UCs/workspaces.md`
- Change: `docs/open-questions.md`

**Interfaces:**
- Produces: the six file paths above.
- Produces: the term table in `docs/UCs/README.md` under the heading `## Thuật ngữ`.
- Produces: the open question `OQ-001` with the anchor `#oq-001`.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in the task.
- The task needs a decision that the task does not contain.
- The same step failed two times.
- `docs/open-questions.md` already contains `OQ-001`.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Write rules, flows or diagrams in the six area files. Tasks 2 to 7 write them.

- [x] **Step 1: Create the six skeleton files**

Each file has two lines only: a level-1 heading and one purpose sentence. Use these exact texts:

| File | Line 1 | Line 3 |
| --- | --- | --- |
| `docs/UCs/requests.md` | `# Gửi request` | `Đọc file này để biết người dùng gửi request, theo dõi và dừng công việc của request như thế nào, và hệ thống phản hồi ra sao.` |
| `docs/UCs/deck.md` | `# Deck` | `Đọc file này để biết người dùng tạo bản nháp deck đầu tiên, sửa deck bằng request tiếp theo và hỏi về deck mà không sửa nó như thế nào.` |
| `docs/UCs/providers.md` | `# Provider và model` | `Đọc file này để biết người dùng thiết lập provider, key và model mà DeckAgent dùng như thế nào.` |
| `docs/UCs/chats.md` | `# Chat` | `Đọc file này để biết người dùng mở lại chat cũ và bắt đầu chat mới như thế nào.` |
| `docs/UCs/design-systems.md` | `# Design system` | `Đọc file này để biết người dùng thiết lập design system cho các deck như thế nào.` |
| `docs/UCs/workspaces.md` | `# Workspace` | `Đọc file này để biết người dùng giữ công việc với deck trong workspace gắn với thư mục của mình như thế nào.` |

- [x] **Step 2: Write `docs/UCs/README.md`**

Keep line 1 and line 3 as they are. Add these sections in this order:

1. `## Actor`: write this table.

| Actor | Mục tiêu |
| --- | --- |
| Người dùng | Tạo và sửa deck từ tài liệu của mình |
| Provider | Chạy model cho DeckAgent qua tài khoản của người dùng |
| Dịch vụ bên ngoài | Public research và tạo ảnh, theo các loại dịch vụ bên ngoài (BR-016) |

2. `## Use case map`: a `flowchart LR` with the node `Người dùng` and one node for each use case: `Tạo bản nháp deck đầu tiên (UC-001)`, `Sửa deck bằng request tiếp theo (UC-002)`, `Gửi request và chờ công việc (UC-003)`, `Thiết lập provider bằng key của mình (UC-005)`, `Mở lại chat cũ (UC-006)`, `Hỏi về deck mà không sửa (UC-009)`, `Thiết lập design system (UC-010)`, `Bắt đầu chat mới (UC-012)`, `Giữ công việc trong workspace (UC-013)`. At most 10 nodes.
3. `## File`: a table `File | Nội dung` with one row for each of the six files of Step 1, with a relative link (`[requests.md](requests.md)`) and the purpose of the file.
4. `## Tiền tố ID`: write this table.

| Tiền tố | Nhóm | Nguồn |
| --- | --- | --- |
| `UC` | Use case | Section use case của file vùng chức năng |
| `FR` | Functional requirement | Bảng rule của file vùng chức năng |
| `BR` | Business rule. Giá trị của rule có ID dạng `BR-nnn.Vn` | Bảng rule của file vùng chức năng |
| `NFR` | Quality requirement | `quality-attributes.md` |
| `A` | Luồng thay thế và luồng ngoại lệ, đánh số riêng trong từng use case. ID dạng `UC-nnn.An` | Bảng luồng của section use case |

5. `## Thuật ngữ`: a table `Thuật ngữ | Nghĩa`. One row for each row of the glossary in `docs/00-old/spec/_STYLE.md`. Translate the meaning. Write the term in Vietnamese, or keep the English term when the Global Constraints keep it. Each term has one name only.

- [x] **Step 3: Add `OQ-001` to `docs/open-questions.md`**

Add the section `## Use cases` before `## Resolved & Dropped`. The section has the table `ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn` with one row:

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-001"></a>OQ-001 | Baseline độc lập nào dùng cho gap analysis của từng file trong `docs/UCs/`? | Các use case hiện có chỉ được so với sản phẩm khác (open-design, Napkin AI), không với chuẩn ngành hay bộ use case viết độc lập. | Gap analysis của mọi file trong `docs/UCs/` | High | `LESSONS.md` LL-001 |

- [x] **Step 4: Run the documentation check**

Run: `corepack pnpm@11.28.5 check:docs`
Expected: PASS. The command exits with code 0. FAIL: the output contains a line with `docs/UCs/` or `docs/open-questions.md`.

- [x] **Step 5: Report and stop**

Send this report:
- Files changed: <list>
- Commands run, with the last 20 lines of output of each command
- Glossary terms for which you kept the English term
- What the commands do not prove: the check does not prove that the translation keeps the meaning of the glossary.

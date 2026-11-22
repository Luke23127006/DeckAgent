# Task 2: Make the documents obey check-docs

Read this file to learn the steps of Task 2, which makes the documents obey the documentation check.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/conventions/docs.md`
- `.agents/skills/ste-vi/SKILL.md`
- The output of Task 1, Step 6.

**Files:**
- Change: `docs/conventions/docs.md`
- Change: `docs/conventions/code.md`
- Change: `docs/conventions/use-cases.md`
- Change: `docs/conventions/knowledge.md`
- Change: `AGENTS.md`

**Interfaces:**
- Uses: the CLI `node scripts/check-docs.mjs` from Task 1.
- Produces: no code interface.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- `check-docs` reports a failure in a file that is not in the `Files` block.
- The same step failed two times.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Change `scripts/check-docs.mjs` or its tests.
- Change the meaning of a rule in a document, except the changes that this task gives.
- Commit or push.

- [x] **Step 1: Change the citation rule in `docs/conventions/docs.md`**

In section `## Trích dẫn nguồn`, replace the first bullet (the line that starts with `- Trong văn bản, viết`) with this text:

```markdown
- Trong văn bản, chỉ viết số: `[[n]](#ref-n)`. Không ghi vị trí trong file nguồn. Mỗi file nguồn có đúng một số. Khi câu cần chỉ tới một heading cụ thể, viết link tới heading đó trong câu, không dùng trích dẫn *(check-docs)*.
```

In the same section, replace the code block example line `File tải lên vượt dung lượng tối đa bị từ chối [[1, §4]](#ref-1) [[2, Tải file]](#ref-2).` with `File tải lên vượt dung lượng tối đa bị từ chối [[1]](#ref-1) [[2]](#ref-2).`

Find the second bullet (the line that starts with `` - `## References` là section cuối``) and the third bullet (the line that starts with `- Mọi link tương đối`). At the end of each bullet, add ` *(check-docs)*` before the final period.

- [x] **Step 2: Add the language rule for plans and the check markers in `docs/conventions/docs.md`**

In section `## Cấu trúc file`, rule 1, replace `bắt đầu bằng "Đọc file này để biết …", "Đọc file này để …" hoặc "Đọc file này giúp …".` with `bắt đầu bằng "Đọc file này để biết …", "Đọc file này để …" hoặc "Đọc file này giúp …". File viết bằng tiếng Anh bắt đầu bằng "Read this file to …" *(check-docs)*.`

In section `## Ngôn ngữ và văn phong`, rule 1, replace `Ngoại lệ: mọi file trong `.agents/` và `.claude/` viết hoàn toàn bằng tiếng Anh.` with `Ngoại lệ: mọi file trong `.agents/`, `.claude/` và `docs/build/` viết hoàn toàn bằng tiếng Anh.`

After the paragraph that starts with `Quy tắc ở đây áp dụng cho mọi tài liệu trong`, add this paragraph:

```markdown
Quy tắc được `corepack pnpm@11.28.5 check:docs` kiểm được đánh dấu *(check-docs)*. Phạm vi của check: mọi file `.md` trong `docs/` (trừ `docs/00-old/`), `AGENTS.md` và `LESSONS.md`. Mỗi file trong `docs/` (trừ `README.md`) phải có link từ `README.md` gần nhất *(check-docs)*.
```

- [x] **Step 3: Delete locations from citations**

Make these exact replacements:

| File | Replace | With |
| --- | --- | --- |
| `docs/conventions/code.md` | `[[1, Tech Stack]](#ref-1)` | `[[1]](#ref-1)` |
| `docs/conventions/use-cases.md` | `[[2, §3.8]](#ref-2)` | `[[2]](#ref-2)` |
| `docs/conventions/use-cases.md` | `[[2, §3.5]](#ref-2)` (both places) | `[[2]](#ref-2)` |
| `docs/conventions/knowledge.md` | `[[1, Các tầng]](#ref-1)` | `[[1]](#ref-1)` |

Run: `grep -rnE '\[\[[0-9]+, ' docs/conventions AGENTS.md LESSONS.md; echo "exit=$?"`
Expected: the output is only `exit=1`.

- [x] **Step 4: Add the purpose line to `AGENTS.md`**

After line 1 (`# Project: DeckAgent`), add an empty line and this line:

```markdown
Đọc file này để biết agent đọc tài liệu nào, chạy lệnh nào và tuân theo quy tắc nào khi làm việc trong DeckAgent.
```

- [x] **Step 5: Run the check**

Run: `node scripts/check-docs.mjs; echo "exit=$?"`
Expected: the output contains `check-docs: 0 error(s) in 0 file(s)` and `exit=0`.

- [x] **Step 6: Report and stop**

Send this report:
- Files changed, with the changed lines.
- The complete output of Step 3 and Step 5.
- What the commands do not prove: only the executor read the new Vietnamese text against `ste-vi`.

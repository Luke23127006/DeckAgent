# Task 9: Propose the missing values

Read this file to learn the steps of Task 9, which proposes the values that the old spec does not give.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `LESSONS.md` (lesson LL-002)
- `docs/conventions/docs.md` (section `Giá trị cụ thể có nguồn`)
- Each file in `docs/00-old/spec/03-requirements/nfr/` with a name that starts with `NFR-`
- The `Vague quantity` lists of the reports of Tasks 2 to 7. A person gives you these lists with this task.

**Files:**
- Change: none. The result is the report only. Do not create a Markdown file.

**Interfaces:**
- Uses: the IDs `NFR-001`, `NFR-002`, `NFR-003`, `NFR-004`, `NFR-006`, `NFR-007`, `NFR-008`, `NFR-009`, `NFR-010`, `NFR-011`, `NFR-012`, and each ID of the `Vague quantity` lists.
- Produces: the report table in Step 2.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in the task.
- The task needs a decision that the task does not contain.
- The same step failed two times.
- A person did not give you the `Vague quantity` lists of Tasks 2 to 7.

**Forbidden:**
- Change a file that is not in the `Files` block. This task changes no file.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Write a proposed value into a file in `docs/`.
- Put two proposed values in one row of the report table.
- Give a standard as a source without its exact section number from the original text of the standard.

- [x] **Step 1: List the items that need a value**

Run: `grep -lE "soon|robust|a lot|quickly|few" docs/00-old/spec/03-requirements/nfr/NFR-*.md`
Expected: a list of file paths. Add each ID of the `Vague quantity` lists of Tasks 2 to 7.

For each item, use this table:

| Signal | Action |
| --- | --- |
| The statement has a quantity word ("soon", "quickly", "a lot", "few") | Write one row in Step 2 for each quantity |
| The statement has no quantity, for example "never reaches the data of another chat" (NFR-003) | Write one row with `Đề xuất` = `— (không có đại lượng)` and give the measure in `Đo tại` |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 2: Write one row for each value**

Write the table `ID | Câu gốc | Nguồn hiện có | Đề xuất | Đo tại | Lý do | Khác nguồn ở đâu` with these rules:

- `Câu gốc`: the old sentence, word for word.
- `Nguồn hiện có`: the value that the old spec gives. Write `Không có số` when it gives no number.
- `Đề xuất`: one number and its unit, with the source in parentheses: `requirement`, `chuẩn ngành <name> <section number>`, `mặc định của <library> <version>`, or `agent đề xuất`.
- `Đo tại`: the start point and the end point of the measurement, or the place where a tester sees the value.
- `Lý do`: why this value, in one sentence.
- `Khác nguồn ở đâu`: what changes compared with the old sentence. Say when the proposal counts or measures a different thing.

- [x] **Step 3: Report and STOP**

Send the table of Step 2. Then STOP. Do not write `docs/UCs/quality-attributes.md`. Do not change a rule row. The product owner approves or changes each row of the table one by one. The next revision of the plan writes the approved values.

# Task 8: Check the migration

Read this file to learn the steps of Task 8, which checks the IDs and the values in `docs/UCs/`.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/conventions/use-cases.md` (section `Rule có số đo`)

**Files:**
- Change: none. This task reads files only.

**Interfaces:**
- Uses: the files `docs/UCs/requests.md`, `docs/UCs/deck.md`, `docs/UCs/providers.md`, `docs/UCs/chats.md`, `docs/UCs/design-systems.md`, `docs/UCs/workspaces.md`. A rule row starts with `| <ID> |`, where `<ID>` is `FR-nnn`, `FR-nnn.b`, `BR-nnn` or `BR-nnn.Vn`.
- Produces: the report only.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in the task.
- The task needs a decision that the task does not contain.
- The same step failed two times.

**Forbidden:**
- Change a file. Send each problem in the report.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Make sure that each old ID has rows in exactly one file**

Run:

```bash
for f in docs/00-old/spec/03-requirements/fr/FR-*.md docs/00-old/spec/04-business-rules/BR-*.md; do i=$(basename "$f" .md); n=$(grep -lE "^\| $i(\.[A-Za-z0-9]+)? \|" docs/UCs/*.md | wc -l); [ "$n" -eq 1 ] || echo "BAD $i files=$n"; done; grep -lE "^\| NFR-[0-9]{3}" docs/UCs/*.md | sed 's/^/NFR-ROW /'; echo DONE
```

Expected: PASS. The output is `DONE` only. FAIL: the output contains `BAD` or `NFR-ROW`.

- [x] **Step 2: List each number in a rule row**

Run:

```bash
grep -hE "^\| (FR|BR)-[0-9]{3}[^|]* \|" docs/UCs/*.md | awk -F'|' '$4 ~ /[0-9]/ {gsub(/^ +| +$/, "", $2); gsub(/^ +| +$/, "", $4); print $2 " => " $4}'
```

Expected: one line for each row whose `Giá trị` cell has a digit. For each line, open the old file of the ID in `docs/00-old/spec/` and use this table:

| Signal | Action |
| --- | --- |
| The ID is `BR-nnn.Vn`, and the old `### V-n` value has the same number and the same unit | PASS for this line |
| The ID is `BR-nnn.Vn`, and the number or the unit is different from the old `### V-n` value | Add the line to the report list `Value mismatch` |
| The ID is `FR-nnn`, and the old `FR-nnn.md` file states the same number | PASS for this line |
| The number is in no old file of the ID | Add the line to the report list `Value without source` |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 3: Run the documentation check**

Run: `corepack pnpm@11.28.5 check:docs`
Expected: PASS. The command exits with code 0.

- [x] **Step 4: Report and stop**

Send this report:
- Commands run, with the last 20 lines of output of each command
- `Value mismatch` and `Value without source` lists. Write `none` for an empty list
- What the commands do not prove: they do not prove that a rule without a number keeps the meaning of the old text.

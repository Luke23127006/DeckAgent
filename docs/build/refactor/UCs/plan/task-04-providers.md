# Task 4: Providers

Read this file to learn the steps of Task 4, which writes `docs/UCs/providers.md` from the old use cases UC-005.

**Read first:**
- [Global Constraints](README.md#global-constraints) and [Decisions](README.md#decisions) in `README.md`
- `docs/conventions/docs.md`
- `docs/conventions/use-cases.md`
- `.agents/skills/write-use-case/SKILL.md` (the method. Obey [Method](README.md#method) for the steps that change)
- `docs/conventions/mermaid.md`
- `.agents/skills/mermaid-markdown/SKILL.md`
- `docs/UCs/README.md` (the sections `## Tiền tố ID` and `## Thuật ngữ`)
- `docs/UCs/providers.md`
- `docs/00-old/spec/02-use-cases/UC-005.md`
- Each owned item:
  - `docs/00-old/spec/04-business-rules/BR-005.md`
  - `docs/00-old/spec/04-business-rules/BR-006.md`
  - `docs/00-old/spec/04-business-rules/BR-008.md`
  - `docs/00-old/spec/04-business-rules/BR-016.md`
  - `docs/00-old/spec/03-requirements/fr/FR-039.md`
  - `docs/00-old/spec/03-requirements/fr/FR-040.md`
  - `docs/00-old/spec/03-requirements/fr/FR-041.md`
  - `docs/00-old/spec/03-requirements/fr/FR-043.md`
  - `docs/00-old/spec/03-requirements/fr/FR-044.md`
  - `docs/00-old/spec/03-requirements/fr/FR-045.md`
  - `docs/00-old/spec/03-requirements/fr/FR-055.md`
  - `docs/00-old/spec/03-requirements/fr/FR-058.md`
  - `docs/00-old/spec/03-requirements/fr/FR-059.md`
  - `docs/00-old/spec/03-requirements/fr/FR-063.md`
  - `docs/00-old/spec/03-requirements/fr/FR-065.md`
  - `docs/00-old/spec/03-requirements/fr/FR-133.md`
- Each parked item:
  - `docs/00-old/spec/05-backlog/UC-005-A18.md`
  - `docs/00-old/spec/05-backlog/FR-062.md`
  - `docs/00-old/spec/05-backlog/FR-081.md`

**Files:**
- Change: `docs/UCs/providers.md`
- Change: `docs/open-questions.md` (add rows only)

**Interfaces:**
- Uses: the six area files in `docs/UCs/`. They exist. Some of them contain only a heading and a purpose line. Uses the anchor `../open-questions.md#oq-001`.
- Produces: in `docs/UCs/providers.md`, at least one rule row for each ID in this list: `BR-005 BR-006 BR-008 BR-016 FR-039 FR-040 FR-041 FR-043 FR-044 FR-045 FR-055 FR-058 FR-059 FR-063 FR-065 FR-133`.
- Produces: one section `## <Tên use case> (<UC ID>)` for each of: `UC-005`.

**Owner of other IDs:** each `FR` and `BR` ID has its rows in one file only. The table gives the owner file. This file can cite an ID that it does not own. Then write a content phrase with the ID in parentheses. Cite the owner file with `[[n]](#ref-n)`. Add the owner file to `## References`.

| Owner file | IDs |
| --- | --- |
| `requests.md` | `BR-001 BR-002 FR-012 FR-013 FR-014 FR-015 FR-016 FR-017 FR-018 FR-019 FR-038 FR-042 FR-046 FR-067 FR-068 FR-070 FR-076 FR-077 FR-079 FR-087` |
| `deck.md` | `BR-003 BR-011 BR-013 BR-014 BR-015 BR-018 FR-001 FR-003 FR-005 FR-007 FR-008 FR-009 FR-010 FR-011 FR-021 FR-022 FR-023 FR-024 FR-025 FR-027 FR-028 FR-029 FR-031 FR-036 FR-037 FR-066 FR-069 FR-088 FR-089 FR-090 FR-091 FR-092 FR-093 FR-107 FR-113 FR-116 FR-117 FR-124 FR-125 FR-126 FR-127 FR-128 FR-129 FR-130 FR-131 FR-132 FR-136 FR-137 FR-138 FR-139 FR-140` |
| `providers.md` | `BR-005 BR-006 BR-008 BR-016 FR-039 FR-040 FR-041 FR-043 FR-044 FR-045 FR-055 FR-058 FR-059 FR-063 FR-065 FR-133` |
| `chats.md` | `BR-004 FR-048 FR-049 FR-050 FR-053 FR-134` |
| `design-systems.md` | `BR-017 FR-096 FR-097 FR-098 FR-099 FR-106 FR-112 FR-135` |
| `workspaces.md` | `BR-019 BR-020 FR-071 FR-072 FR-073 FR-074 FR-083 FR-084 FR-141 FR-142 FR-143` |
| none in this revision | each `NFR-nnn`. Write a content phrase and the ID, with no citation. Example: "phản hồi sau khi gửi request (NFR-001)" |

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in the task.
- The task needs a decision that the task does not contain.
- The same step failed two times.
- An old file in the `Read first` block does not exist.
- An old use case cites an `FR` or `BR` ID that is in no row of the owner table.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Write a number in a `Giá trị` cell that the old file of that ID does not state.
- Write a rule row for an ID that `docs/UCs/providers.md` does not own.

**Mapping of old content:**

| Signal in the old file | Action |
| --- | --- |
| `## Situation and goal` of a use case | Two or three sentences at the start of its section |
| `## Trigger and precondition` | The lines `**Trigger:**` and `**Precondition:**` of its section |
| `## Outcome and minimal guarantee` | The lines `**Kết quả khi thành công:**` and `**Kết quả khi thất bại:**` |
| A `[Sn]` message or note in `## Interaction diagram` | One numbered step of the main flow, and one message of the `sequenceDiagram`. The participants are `Người dùng` and `DeckAgent` only |
| A flow `### An · <title>` | One row of the flow table. The columns are `ID \| Điều kiện \| Phản hồi người dùng thấy \| Nguồn \| Trạng thái`. The ID is `<UC ID>.An`. `Điều kiện` holds the `At`, `When` and `Ends` fields. `Nguồn` is `Product owner` |
| An owned `FR-nnn` | One row of the rule table `ID \| Rule \| Giá trị \| Đo tại \| Nguồn \| Trạng thái`. A statement that says two things becomes the rows `FR-nnn`, `FR-nnn.b`, `FR-nnn.c`. `Nguồn` is `Product owner` |
| An owned `BR-nnn` | One row `BR-nnn` for its statement, and one row `BR-nnn.Vn` for each `### V-n` value, with the number and the unit. `Nguồn` is `Product owner` |
| An owned item that two or more use cases of this file cite | Its row goes in `## Quy tắc dùng chung` |
| A `Next free flow ID` line, or a line that says which `V-n` numbers are not used | Leave it out |
| A line of `## Notes` that a user or a tester can see | One sentence in the section of its use case |
| A line about the model, code, theme, storage or the layout that the code selects | Add the line to the report list `Architecture facts`. Do not write it |
| `## Product evidence` | Leave it out |
| A parked item | One bullet in the out-of-scope list of `## Tổng quan`: its title as a content phrase, with the ID |
| A vague quantity word | Obey the Global Constraints rule for vague quantity words |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Write `## Tổng quan`**

Write the actors, the scope, the out-of-scope list with each parked item, and a `flowchart` from the actor `Người dùng` to each use case of this file. Link the prefix table: `[Tiền tố ID](README.md#tiền-tố-id)`. Do not write a second prefix table.

- [ ] **Step 2: Write `## Quy tắc dùng chung`**

Write this section only when two or more use cases of this file cite an owned item. Use the rule table.

- [ ] **Step 3: Write one section for each use case**

For each of `UC-005`, in this order, write the section with the mapping table. The section has these parts: goal, trigger, precondition, outcomes, numbered main flow, `sequenceDiagram` and flow table. It also has the rule table of the owned items that only this use case cites.

- [ ] **Step 4: Find the exception flows step by step**

Do step 5 of the skill `write-use-case`. For each step of each main flow, ask each question of the skill list:

  - The input is empty, wrong or too long, or the input is at a limit.
  - A provider or an external service does not answer, or gives an error.
  - The user does the same action again.
  - Time passes during the flow.
  - The action was already done.
  - A second interface shows the same chat.
  - The user leaves the flow and comes back.

For each object that has a lifecycle (an attachment, a request, a deck, a workspace), draw a `stateDiagram-v2` in the section of its use case. Each transition label is a content phrase with the ID of the rule that gives the transition.

Some answers change what the user sees, but no old file gives the result. Do not write a flow row for such an answer, because the old files do not give its behavior. Do Step 7 for it: it is an item with no decision.

- [ ] **Step 5: Write `## Gap analysis` and `## References`**

`## Gap analysis` has this sentence: `Chưa có baseline độc lập cho file này [[n]](#ref-n).` Then the table `ID | Gap | Baseline | Quyết định | Trạng thái` with one row: `GAP-01 | Chưa đối chiếu với baseline độc lập | — | [Baseline độc lập cho gap analysis (OQ-001)](../open-questions.md#oq-001) | Open`. In `## References`, the citation number `n` points to `../open-questions.md`.

- [ ] **Step 6: Make sure that each owned ID has a row**

Run:

```bash
for i in BR-005 BR-006 BR-008 BR-016 FR-039 FR-040 FR-041 FR-043 FR-044 FR-045 FR-055 FR-058 FR-059 FR-063 FR-065 FR-133; do grep -qE "^\| $i(\.[A-Za-z0-9]+)? \|" docs/UCs/providers.md || echo "MISSING $i"; done; echo DONE
```

Expected: PASS. The output is `DONE` only. FAIL: the output contains `MISSING`.

- [ ] **Step 7: Review the file for open questions**

Read the old files of the `Read first` block again, and read the area file that you wrote. Find each item that has no decision. These are the types of item:

  - A `pending` mark or an `Open` finding in an old file.
  - Two rows, two flows, or a row and an outcome line, that give different results for the same condition. Compare the rows of this file, and the rows of the owner files that this file cites.
  - A condition that a user can cause, but no flow or rule gives the result for it. Examples: two events at the same time, a failure during a flow, and the state after a failure.
  - A word in a rule that a tester cannot check without a decision. Example: "no longer applies", when no rule tells when this occurs.
  - A sentence that you translated in two possible ways, and the old text does not tell which way is correct.

Write the rule as the old file states it. Do not change a rule to solve the question. Do not include a vague quantity word, because Task 9 proposes those values. Do not include an item of a parked file. For each item, search `docs/open-questions.md`, `docs/architecture/` and `docs/knowledge/` for an answer or for the same question. When you find no answer and no question, add one row to the `## Use cases` table of `docs/open-questions.md`. Use the next free ID `OQ-nnn` and the anchor `<a id="oq-nnn"></a>`. In the `Nguồn` cell, write a link to the area file. Example: `[Gửi request](UCs/requests.md)`. Some items have an effect that a user or a tester can see. For each of these items, add one sentence to the section of its use case. The sentence links to the question. Example: `[Điểm bắt đầu tóm tắt hội thoại (OQ-002)](../open-questions.md#oq-002)`. Do not link from `docs/UCs/` to a question about an architecture fact.

- [ ] **Step 8: Run the documentation check**

Run: `corepack pnpm@11.28.5 check:docs`
Expected: PASS. The command exits with code 0. FAIL: the output contains a line with `docs/UCs/providers.md`.

- [ ] **Step 9: Report and stop**

Send this report:
- Files changed: <list>
- Commands run, with the last 20 lines of output of each command
- `Vague quantity`: each ID, the old words and the Vietnamese rule that you wrote
- `Architecture facts`: each line, with its old file
- Each `FR` that you split, with the new row IDs
- Items that the mapping table sent to the report
- The commit of `docs/00-old/spec/` that you read (`git log -1 --format=%h -- docs/00-old/spec`)
- Each lifecycle diagram that you drew, and each transition that has no rule
- Each open question that you added, with its ID, and each item that you did not add, with the reason
- What the commands do not prove: they do not prove that the translation keeps the meaning, or that each row says one thing only.

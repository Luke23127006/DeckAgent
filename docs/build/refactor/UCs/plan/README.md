# Use Case Migration Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of the migration of the old spec into `docs/UCs/`.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Move the use cases, functional requirements and business rules of `docs/00-old/spec/` into use case files in `docs/UCs/` that obey `docs/conventions/use-cases.md`, with no value that has no source.

**Approach:** One file for each feature area. Each old ID stays the same, because the code in `apps/local-web/src/` cites the old IDs. Each functional requirement and each business rule has one owner file. A file that needs an item of another file cites the owner file. Values that the old spec does not give as a number go to an investigation task. That task ends with STOP, and the product owner approves each proposed value one by one.

**Tech stack:** Markdown, Mermaid, `node scripts/check-docs.mjs` (run as `corepack pnpm@11.28.5 check:docs`).

**Spec:** `docs/00-old/spec/` (the source content), `docs/conventions/use-cases.md` and `docs/conventions/docs.md` (the target format), lesson LL-002 in `LESSONS.md` (values that an agent proposes).

## Decisions

| Topic | Decision |
| --- | --- |
| IDs | Keep each old ID: `UC-nnn`, `FR-nnn`, `BR-nnn`, `NFR-nnn`. The code in `apps/local-web/src/` cites `FR-079`, `BR-019`, `UC-013`, `FR-019`, `FR-142` and other old IDs. The rule in `docs/conventions/docs.md` lets a prefix change only when nothing points to the ID. |
| Value IDs | A business rule value `V-n` becomes the rule row ID `BR-nnn.Vn`. Example: `BR-002` value `V-1` becomes `BR-002.V1`. The statement of the business rule becomes the row `BR-nnn`. |
| Flow IDs | A flow `An` of a use case becomes the flow row ID `UC-nnn.An`. Example: flow `A9` of `UC-001` becomes `UC-001.A9`. |
| Files | One file for each feature area. See [Owner map](#owner-map). |
| Owner | Each `FR` and each `BR` has its row in one file only. See [Owner map](#owner-map). |
| Quality requirements | The `NFR` items go to `docs/UCs/quality-attributes.md` in the next revision. The 11 old `NFR` items give no number. An example is "soon". Task 9 proposes each value. |
| Status | An old `BR` with `Status: confirmed` gets `Confirmed`. An old `FR` or flow gets `Confirmed`, because the product owner owns the old spec. An item whose evidence tag is `[assumed...]` gets `Proposed`. An item whose evidence tag is `[inferred...]` gets `Inferred`. |
| Backlog | `docs/00-old/spec/05-backlog/` is not migrated. Each area file names its parked items in the out-of-scope list of `## Tổng quan`. |
| Product evidence | The `## Product evidence` sections (open-design, Napkin AI) are not migrated in this revision. They are product research, not behavior. |
| Old files | `docs/00-old/spec/` stays unchanged. |
| Method | Tasks 1 to 7 obey the skill `write-use-case`. The project decisions of this plan replace these parts of the skill. Step 1: the source is `docs/00-old/spec/`. Step 6: a vague word stays without a number, and Task 9 proposes the value. Step 8: the gap analysis has one `Open` row that links to `OQ-001`. |
| Independence | The files in `docs/UCs/` and `docs/open-questions.md` do not refer to `docs/00-old/` or to the old spec. The product owner deletes `docs/00-old/` after Task 9. The old IDs stay the same, so Task 8 and Task 9 find each item in the old files by its ID. The `Nguồn` cell of a `Confirmed` row is `Product owner`. The `Nguồn` cell of a `Proposed` or `Inferred` row gives the evidence in words, with no old file path. |
| Gap analysis | No independent baseline exists yet. Task 1 adds the open question `OQ-001` to `docs/open-questions.md`. Each area file has one gap row with status `Open` that links to `../open-questions.md#oq-001`. |

## Method

The [Decisions](#decisions) row `Method` gives the parts of the skill `write-use-case` that this plan replaces.

## Owner map

| File | Title | Use cases | Owned items | Parked items (out of scope) |
| --- | --- | --- | --- | --- |
| `docs/UCs/requests.md` | Gửi request | `UC-003` | `BR-001 BR-002 FR-012 FR-013 FR-014 FR-015 FR-016 FR-017 FR-018 FR-019 FR-038 FR-042 FR-046 FR-067 FR-068 FR-070 FR-076 FR-077 FR-079 FR-087` | `FR-078` |
| `docs/UCs/deck.md` | Deck | `UC-001 UC-002 UC-009` | `BR-003 BR-011 BR-013 BR-014 BR-015 BR-018 FR-001 FR-003 FR-005 FR-007 FR-008 FR-009 FR-010 FR-011 FR-021 FR-022 FR-023 FR-024 FR-025 FR-027 FR-028 FR-029 FR-031 FR-036 FR-037 FR-066 FR-069 FR-088 FR-089 FR-090 FR-091 FR-092 FR-093 FR-107 FR-113 FR-116 FR-117 FR-124 FR-125 FR-126 FR-127 FR-128 FR-129 FR-130 FR-131 FR-132 FR-136 FR-137 FR-138 FR-139 FR-140` | `UC-004 UC-007 UC-008 UC-019 FR-085` |
| `docs/UCs/providers.md` | Provider và model | `UC-005` | `BR-005 BR-006 BR-008 BR-016 FR-039 FR-040 FR-041 FR-043 FR-044 FR-045 FR-055 FR-058 FR-059 FR-063 FR-065 FR-133` | `UC-005-A18 FR-062 FR-081` |
| `docs/UCs/chats.md` | Chat | `UC-006 UC-012` | `BR-004 FR-048 FR-049 FR-050 FR-053 FR-134` | `UC-016 UC-018` |
| `docs/UCs/design-systems.md` | Design system | `UC-010` | `BR-017 FR-096 FR-097 FR-098 FR-099 FR-106 FR-112 FR-135` | none |
| `docs/UCs/workspaces.md` | Workspace | `UC-013` | `BR-019 BR-020 FR-071 FR-072 FR-073 FR-074 FR-083 FR-084 FR-141 FR-142 FR-143` | none |

## Global Constraints

- Shell: Git Bash on Windows. Run each command from `C:/Users/Duy/Desktop/DeckAgent`.
- Package manager: `corepack pnpm@11.28.5`. Do not use the `pnpm` command directly.
- Language: files in `docs/UCs/` and `docs/open-questions.md` are in Vietnamese. Keep English technical terms when they are common or more exact (request, deck, slide, outline, provider, model, workspace, chat). Translate the old English text. Keep the meaning of each sentence. Do not add a fact that the old file does not state.
- Glossary: use one Vietnamese term for each term of the glossary in `docs/00-old/spec/_STYLE.md` (lines 40-120). Task 1 writes the term table in `docs/UCs/README.md`. Tasks 2 to 7 use the terms of that table only.
- Format of a use case file: `docs/conventions/use-cases.md`. Format of each document: `docs/conventions/docs.md`. Diagrams: `docs/conventions/mermaid.md`.
- Before each mention of an ID, write a content phrase. Put the ID in parentheses after the phrase. Example: "độ dài tối đa của nội dung request (BR-002.V1)". The ID column of a table is an exception.
- Values (lesson LL-002): write only a value that the old file states, with its unit. The `Nguồn` column of that row is `Product owner`. Do not write a number that the old file does not state. Do not change what a value counts or measures.
- Vague quantity words in the old text are "soon", "a lot", "few", "some" and "quickly". Do not invent a number for them. Write the rule without a number, write `—` in `Giá trị` and `Đo tại`, and add the ID to the report list `Vague quantity`. Do not use the forbidden words of `docs/conventions/use-cases.md` (section `Rule có số đo`) in the `Rule` column.
- Boundary test: some facts are not visible to a user or a tester from outside the system. Examples are the model, code, theme code, layout selection by code, storage and protocols inside DeckAgent. These facts do not go into `docs/UCs/`. Add the fact and its old file to the report list `Architecture facts`.
- Open questions: after you write an area file, review it for items that have no decision. Add each new question to `docs/open-questions.md`. The task file gives the steps.
- History: do not write where text came from ("chuyển từ", "merged from"), dates of decisions, or who decided.
- Do not change files in `docs/00-old/`.
- Do not create a Markdown file that the task does not name.
- Do not commit. Do not push.

## Review Focus

1. An old ID that has no row, or has rows in two files, breaks the code that cites it. Test: [Task 8](task-08-verify-migration.md), Step 1.
2. A number in a rule row that the old spec does not state is a value with no source (LL-002). Test: [Task 8](task-08-verify-migration.md), Step 2.
3. A vague word ("soon") that becomes a number without approval. Test: [Task 8](task-08-verify-migration.md), Step 2, and the `Vague quantity` lists of Tasks 2 to 7.
4. A citation or a link that points to a file or a heading that does not exist. Test: `corepack pnpm@11.28.5 check:docs` in each task.
5. An internal fact (model, theme code) in a use case file. Test: the `Architecture facts` lists of Tasks 2 to 7.

## Tasks

| Task | File |
| --- | --- |
| 1 | [Use case index and file skeletons](task-01-index-and-skeletons.md) |
| 2 | [Requests](task-02-requests.md) |
| 3 | [Deck](task-03-deck.md) |
| 4 | [Providers](task-04-providers.md) |
| 5 | [Chats](task-05-chats.md) |
| 6 | [Design systems](task-06-design-systems.md) |
| 7 | [Workspaces](task-07-workspaces.md) |
| 8 | [Check the migration](task-08-verify-migration.md) |
| 9 | [Propose the missing values](task-09-propose-values.md) |

## Next revision

- Write `docs/UCs/quality-attributes.md` from the 11 old `NFR` items with the values that the product owner approves from the Task 9 report.
- Add the vague-quantity values that the product owner approves from the Task 9 report to the rule rows of Tasks 2 to 7.
- Move the facts of the `Architecture facts` lists of Tasks 2 to 7 to `docs/architecture/`.
- Run the gap analysis against an independent baseline, and close `OQ-001`.

# Task 10: Write the approved values

Read this file to learn the steps of Task 10, which writes the values that the product owner approved from the Task 9 report.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `LESSONS.md` (lesson LL-002)
- `docs/conventions/use-cases.md` and `docs/conventions/docs.md`
- The skill `write-use-case`, the part about `docs/UCs/quality-attributes.md`
- Each file in `docs/00-old/spec/03-requirements/nfr/` with a name that starts with `NFR-`

**Files:**
- Create: `docs/UCs/quality-attributes.md`
- Change: `docs/UCs/requests.md`, `docs/UCs/deck.md`, `docs/UCs/README.md` (the file list only)

**Interfaces:**
- Uses: the tables in [Approved values](#approved-values), [Approved environments](#approved-environments) and [Approved sources](#approved-sources). Do not use other values.
- Produces: one quality attribute scenario for each of the 11 old `NFR` IDs, and a value in each rule row of the `a lot` group.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in the task.
- The task needs a decision that the task does not contain.
- The same step failed two times.
- A value, an environment or a source that you need is not in the tables of this file.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Write a value, an environment or a source that is not in the tables of this file.
- Write a model name, a library name or other internal fact in `docs/UCs/`. The approved model goes to the test environment in a later task.
- Use ISO/IEC 25010 as a source. The text of the standard was not available. You can use the name of a characteristic as a category only.
- Change a value from `agent đề xuất` to a standard source.
- Delete, skip or weaken a test or a docs command.
- Commit or push.

## Approved values

The `Nguồn` cell of each row in `docs/UCs/` is `Product owner`. The column `Origin` below is for the reviewer only. Do not write it in `docs/UCs/`.

| ID | Value | Measure | Origin |
| --- | --- | --- | --- |
| NFR-001 | 1 s | From the time the user sends the request to the time the first sign of receipt shows | agent đề xuất |
| NFR-002 | 60 s | From the time the user confirms the outline to the time the first finished slide shows in the deck canvas. End to end | agent đề xuất |
| NFR-011 | 1 s | From the time the user stops the request to the time the system shows that the stop took effect | agent đề xuất |
| NFR-012 | 30 s | From the time the user sends a clear follow-up request to the time the changed slide shows in the deck canvas. End to end | agent đề xuất |
| NFR-010 | — | Withdrawn. The rule BR-001.V3 in `docs/UCs/requests.md` already gives the maximum size of one attachment. The scenario links to that rule. A limit for compressed files is a gap of `requests.md` | — |
| FR-011 | 1 slide | The number of planned slides whose main message changes because of the disagreement | agent đề xuất |
| FR-067 | 1 slide | The number of slides that are lost or change their main message because of the missing part | agent đề xuất |
| FR-089 | 1 slide | The number of slides that do not have a required fact (BR-015) because of the gap | agent đề xuất |
| UC-001.A23 | 1 slide | The number of slides in the outline that differ between the two meanings of the message | agent đề xuất |
| UC-001.A33 | 1 slide | Same measure as FR-011 | agent đề xuất |
| UC-001.A52 | 1 slide | Same measure as FR-089, on the outline | agent đề xuất |
| UC-003.A43 | 1 slide | Same measure as FR-067 | agent đề xuất |

After Task 10, the product owner changed these rows. `NFR-002` and `NFR-012` have the status `Dropped`, because the time depends on the model and the provider, and the project does not measure it. The rows of the `1 slide` value have no value now. Each rule states the condition in words: a change to the main point of any planned slide. `FR-089.b` and `UC-001.A52` ask the user only when the system cannot write the main point of a planned slide. For missing content of a sourced type, the system writes a placeholder (FR-010).

The items `NFR-003`, `NFR-004`, `NFR-006`, `NFR-007`, `NFR-008` and `NFR-009` have no quantity. Write `—` in `Giá trị`. Write the test in [Approved environments](#approved-environments) as the response measure.

## Approved environments

| ID | Environment | Response measure when the item has no quantity |
| --- | --- | --- |
| NFR-001 | Normal operation | — |
| NFR-002 | The selected model of the chat. The outline has the number of slides that the user agreed with the agent. Normal network, with no simulated fault. Record the wait time of the provider separately | — |
| NFR-003 | Two chats with markers. A folder outside the project folder. A model service that asks for forbidden steps on purpose | 0 accesses to data of another chat, and 0 changes, moves or deletes of a user file |
| NFR-004 | Deck content that holds a script | The script cannot read a key or data of DeckAgent, and cannot open a network connection |
| NFR-006 | A saved sample key | 0 matches of the sample key in a conversation, a deck, an error record, or a file outside the key store |
| NFR-007 | Capture of all outside traffic during a request | Only requests to the provider of the selected model, or to an outside service that the user set up, carry user content |
| NFR-008 | DeckAgent ends by a process kill after the last save | Each chat opens in its last saved state and accepts a new request |
| NFR-009 | The deck language that the user chose in the interview. Test with Vietnamese, and with one language that is different from the language of the chat | Each finished slide shows in full, with no cut text, no text outside the slide, no covered content, and correct characters |
| NFR-010 | Added files that are damaged, of a wrong type, or larger than the value | The interface keeps responding, and each added file ends as ready or as rejected |
| NFR-011 | The provider sends nothing | — |
| NFR-012 | The selected model of the chat. The follow-up request changes 1 slide. Normal network, with no simulated fault. Record the wait time of the provider separately | — |

The word "clear" in NFR-012 depends on the open question OQ-053. Link the scenario to `../open-questions.md#oq-053`.

## Approved sources

The product owner approved ASVS level L1 for all items, plus the L2 items in this table. Task 9 read the text of these items from the original files at tag `v5.0.0` of `OWASP/ASVS` and from `genai.owasp.org`. Cite the ID and the level. Do not cite an item that is not in this table.

| ID | Standard item | Level |
| --- | --- | --- |
| NFR-003 | OWASP Top 10 for LLM Applications 2025: LLM01:2025 items 4, 6, 7. LLM06:2025 items 1 to 7 | — |
| NFR-003 | OWASP ASVS 5.0.0: 5.3.2 | L1 |
| NFR-004 | OWASP Top 10 for LLM Applications 2025: LLM05:2025 items 3, 6 | — |
| NFR-004 | OWASP ASVS 5.0.0: 3.2.1, 1.3.1 | L1 |
| NFR-004 | OWASP ASVS 5.0.0: 3.4.3, 1.3.4, 1.3.5 | L2 |
| NFR-006 | OWASP ASVS 5.0.0: 16.2.5, 16.5.1 | L2 |
| NFR-010 | OWASP ASVS 5.0.0: 5.2.1, 5.2.2 | L1 |
| NFR-010 | OWASP ASVS 5.0.0: 5.1.1, 5.2.3 | L2 |
| NFR-001 to NFR-012 | SEI CMU/SEI-2003-TR-016, section 3.8 (the six parts of a scenario) | — |

ASVS 13.3.1 (the key store) is an architecture fact. Do not cite it in `docs/UCs/`. Add it to the report list `Architecture facts`.

## Steps

- [x] **Step 1: Write the quality attribute file**

Create `docs/UCs/quality-attributes.md`. Write one scenario for each of the 11 old `NFR` IDs. Keep each old ID. Each scenario has the six parts of SEI section 3.8: source of stimulus, stimulus, environment, artifact, response, response measure. Translate the old statement into Vietnamese. Keep the meaning of each sentence. Use the values of [Approved values](#approved-values) and the environments of [Approved environments](#approved-environments).

Run: `corepack pnpm@11.28.5 check:docs`
Expected: `0 error(s)`

- [x] **Step 2: Write the values of the `a lot` group**

In `docs/UCs/deck.md` and `docs/UCs/requests.md`, find the rule rows and flow rows of `FR-011`, `FR-067`, `FR-089`, `UC-001.A23`, `UC-001.A33`, `UC-001.A52` and `UC-003.A43`. Delete the words "nhiều" and "đáng kể" from each `Rule` cell. Write the measure from [Approved values](#approved-values) as the condition. Write `1 slide` in `Giá trị`. Write the measure in `Đo tại`.

Run: `grep -nE "thay đổi nhiều|đáng kể" docs/UCs/deck.md docs/UCs/requests.md`
Expected: no output

Run: `corepack pnpm@11.28.5 check:docs`
Expected: `0 error(s)`

- [x] **Step 3: Add the file to the index**

Add `quality-attributes.md` to the file list of `docs/UCs/README.md`.

Run: `corepack pnpm@11.28.5 check:docs`
Expected: `0 error(s)`

- [x] **Step 4: Report and STOP**

Send this report. Then STOP.
- Each changed row, with its ID.
- `Architecture facts`: each fact that you did not write, and the reason.
- Each STOP condition that occurred.

## Out of scope

These items of the [Next revision](README.md#next-revision) list are not in this task:
- Move the `Architecture facts` of Tasks 2 to 7 to `docs/architecture/`. The lists are in the chat reports of Tasks 2 to 7 only.
- Compare each area file with its baseline file and replace the row `GAP-01` (OQ-060).

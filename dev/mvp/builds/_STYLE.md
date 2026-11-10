# Build files — style guide

**Read this file before writing** or editing any file in `dev/mvp/builds/`: research checklist, traceability matrix, test analysis, testing plan, test design and its technique evidence files, acceptance criteria, test implementation, implementation plan, as-built record, eval runs. The **templates** in `dev/mvp/templates/` fix **the headings**; this file fixes **how the text reads**.

## Language

1. Write **prose in Vietnamese**. Keep in **English**: **technical terms** a developer searches for (workspace, folder, draft, request, junction, fixture), **IDs** (FR-071, AC-3, DEC-012), **code names** (functions, fields, files), and the **template's headings and field labels** (`At a glance`, `Given`, `When`, `Then`, `Check`, `Tier`).

2. **Pick one word per concept** and **keep it** through the file. Do not switch between a Vietnamese and an English word for the same thing (for example **"folder"** in one line and **"thư mục"** in the next).

## Clarity

3. **One relation per clause.** Do not put **two different relations under one verb**. Write "folder **thuộc** một protected folder (chính nó là protected folder, hoặc nằm bên trong một protected folder)", **not** "folder **là hoặc nằm trong** X, Y hay Z".

4. **The scope of "hoặc" is clear.** Do not stack **"hoặc … hoặc … hay"** in one clause. When a list follows "hoặc", **split it** into separate clauses or into a list.

5. **One term, one meaning.** When a word **can mean two things**, **define two terms first** and use each one **only in its own meaning**. Example: **protected folder** (a folder BR-019 guards) and **refused folder** (a folder DeckAgent does not take as a project folder).

6. **Name the axis of a split.** When you split a rule into cases, **say what the split is by** ("chia theo **vị trí** so với protected folder: **thuộc** hay **bao quanh**") before the cases.

7. **Each example and each exception sits inside its own case**, never as a late negation after another case.

8. **Read each rule-like sentence once more** before saving: can it be **read two ways**? If yes, **rewrite it**.

## Sentences

9. **Write sentences, not fragments.** Each check has **a subject and a verb**: "Default workspace **không có project folder**", **not** "không folder". The reader **never guesses** what a word refers to.

10. **No arrow for a relation.** Do not write "A → B" in prose or in a table cell; write the relation as a verb: "**khi** A, DeckAgent **phải** B", "A **dẫn tới** B", "đổi A **thành** B". An arrow **hides which relation** it means.

11. **Each situation names its action.** A "Khi" or `Given`/`When` text says **who does what**: "DeckAgent **khởi động lần đầu**, data folder **rỗng**", **not** only "data folder rỗng".

12. **A defect names its actor.** A `Catches` line or a "lỗi test bắt được" cell **starts with "DeckAgent"** and **lists every defect** the test catches, one sentence each, so it **does not read as expected behavior**.

13. **One cell, one kind of content.** Do not compress a whole `Given`/`When`/`Then` into one cell of comma-separated pieces. **Split it** into a "Khi" cell and a "DeckAgent phải" cell, **one sentence per check**.

## Content

14. **Write the outcome, not the conversation.** Before a sentence or a section, ask: **does the person who designs, writes or runs the tests act on it?** If not, **leave it out**. A decision reads as its **result**: "Item **deferred, build 3**: cần request", "**Đọc là:** tên so theo NFC", **not** "PO đã ruling (09-11-2026): …". **Never name who decided or when**; write **`pending`** while a decision is open. **Do not restate** a rule of `dev/development/test-strategy.md` as a caveat, and **do not keep** a table that only records **a review** or **a check whose result changed nothing**.

## Form

15. Follow AGENTS.md "Writing Markdown": **one line per paragraph or list item**, and **bold the keywords** of each sentence. **One `Then` line holds one checkable thing.**

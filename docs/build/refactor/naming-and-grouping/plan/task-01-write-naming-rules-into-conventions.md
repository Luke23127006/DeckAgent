# Task 1: Write the naming rules into the conventions

Read this file to learn the steps of Task 1, which writes the naming rules into the Coding Guidelines and the Project Structure.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `docs/build/refactor/naming-and-grouping/naming-rules.md`
- `docs/conventions/code.md`
- `docs/conventions/project-structure.md` (the sections `Cấu trúc đích`, `apps/host/` and `Hình dạng module`)
- `docs/conventions/docs.md`
- `.agents/skills/ste-vi/SKILL.md`

**Files:**
- Change: `docs/conventions/code.md` (the sections `Naming`, `TypeScript`, `Contract`, `Validation` and `Error handling`)
- Change: `docs/conventions/project-structure.md` (the text block in `Cấu trúc đích`, the row `src/db/` in `apps/host/`, and the section `Hình dạng module`)
- Change: `docs/build/refactor/target-structure/README.md` (the first row of the table `Carried items`)

**Interfaces:**
- Uses: the rule IDs `typescript-enum` and `role-file-symbol` of `check:boundaries`, and the oxlint rule `oxc/no-const-enum`. Task 2 adds them.

**STOP when:** Task protocol only

**Forbidden:** Do not change the sections of `code.md` and `project-structure.md` that the `Files` block does not name.

- [x] **Step 1: Change the section `Naming` of `docs/conventions/code.md`**

Keep the first four bullets. Replace the fifth bullet with a bullet that has these rules:

- Do not use `data`, `manager`, `handler` or `coordinator` when the name does not tell the responsibility.
- Use the suffixes `Controller` and `Repository` only when the suffix tells the role.
- Use the suffixes `Service` and `Store` only on the main class of a role file.

Tag the bullet *(review, check-boundaries `role-file-symbol` for the modules in the list of the check)*.

Add the subsection `### File vai trò và symbol`. It has the table of [Role files and symbols](../naming-rules.md#role-files-and-symbols) in Vietnamese, with the rows `<name>.service.ts`, `<name>.store.ts`, `<name>.routes.ts`, `<name>.errors.ts`, `<name>.run-contribution.ts` and `<name>.migrations.ts`. Under the table, add two rules:

- Symbols use the singular domain noun. Folders use the plural. Example: `modules/chats/` exports `ChatService`.
- A module has one service. A second `<topic>.service.ts` is necessary only when two groups of use cases have different dependencies.

Add the subsection `### Tên cho khái niệm kỹ thuật`. Its first sentence says that names in code follow the glossary in `docs/UCs/README.md` (section `Thuật ngữ`). Then add the table of [One name for each concept](../naming-rules.md#one-name-for-each-concept) in Vietnamese, with the columns `Khái niệm | Tên trong code | Không dùng | Quy tắc`.

- [x] **Step 2: Change the sections `TypeScript`, `Contract` and `Validation` of `docs/conventions/code.md`**

`TypeScript`: add two bullets.

- Do not use `enum` or `const enum`. Use a union. When code needs the list at runtime, use an `as const` array and get the type from it. Tag: *(check-boundaries `typescript-enum`, lint: oxlint `oxc/no-const-enum`)*.
- Do not use the `I` prefix on an interface. Do not use the `_` suffix. Tag: *(review)*.

`Contract`: add one bullet for ports. Tag it *(review)*.

- An interface that a module declares for an operation of another owner has the name `<Consumer><Provider>`, for example `WorkspaceChats`.
- Use the suffix `Port` only when the plain name is the name of the class that implements the interface.
- The service of the owner implements the interface. `server.ts` does not build an adapter that joins the stores of several owners.

`Validation`: add one paragraph. Tag it *(review)*.

- Validation at a boundary uses Zod in the form of the contracts package. The file `<topic>-validation.ts` has a schema `<thing>Schema` and an exported function `decode<Thing>(value: unknown)`.
- A route reads a body only through a `decode*` function.
- Do not copy a type guard such as `record()` into a file.

- [x] **Step 3: Change the section `Error handling` of `docs/conventions/code.md`**

Add the subsection `### Đặt tên error` after `### Biểu diễn`. It has the rules of [Errors](../naming-rules.md#errors) in Vietnamese. Tag each rule *(review)*.

- One class `<Name>Error` for each module, in `<name>.errors.ts`, with `code` as a union.
- The exception `DeckWorkflowError`, because `@deckagent/deck` exports `DeckError`.
- An integration client keeps its own error.
- The status table has the type `Readonly<Record<<Name>ErrorCode, number>>`.

- [x] **Step 4: Change `docs/conventions/project-structure.md` and the carried item**

- The text block in `Cấu trúc đích`: the line of `modules/<name>/` lists `<name>.routes.ts, <name>.service.ts, <name>.store.ts, <name>.errors.ts`. The line of `db/` says `connection, migration, persistence adapter cho port của runs/`.
- The row `src/db/`: `Sở hữu` is "Connection, migration, persistence adapter cho port của `runs/` (`SqliteRunStore` và các file query của nó)". `Không sở hữu` is "SQL của module, HTTP status".
- The section `Hình dạng module`: the module starts with four files. Add `<name>.errors.ts` (error class và bảng status HTTP của module, mà `server.ts` đăng ký với error handler). In the next paragraph, name the file `<name>.run-contribution.ts` for a run contribution. Name the file `<name>.migrations.ts` for a database schema. Add one sentence: tên symbol chính của mỗi file nằm trong `code.md#file-vai-trò-và-symbol`.
- `docs/build/refactor/target-structure/README.md`, table `Carried items`, first row: change "rename `*Service` symbols". The new text is "rename symbols to the role file table in the Coding Guidelines (the Naming and Grouping Refactor does this for `apps/host/`)".

- [x] **Step 5: Run the checks**

Run: `corepack pnpm@11.28.5 check:docs`
Expected: exit code 0 and `0 error(s)`.

Run: `uv run python -I "$USERPROFILE/.agents/skills/asd-ste100/scripts/ste-lint-vi.py" docs/conventions/code.md docs/conventions/project-structure.md`
Expected: no violation on a line that this task added.

Run: `git grep -n -E "typescript-enum|role-file-symbol|no-const-enum" -- docs/conventions`
Expected: each line is in `docs/conventions/code.md`.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

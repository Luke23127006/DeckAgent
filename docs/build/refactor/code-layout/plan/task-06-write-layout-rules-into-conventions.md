# Task 6: Write the layout rules into the conventions

Read this file to learn the steps of Task 6, which adds the section `Bố cục` to `docs/conventions/code.md`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `docs/conventions/code.md` (the first paragraph, the sections `TypeScript` and `Comments`)
- `docs/conventions/docs.md`
- `.agents/skills/ste-vi/SKILL.md`

**Files:**
- Change: `docs/conventions/code.md` (the first paragraph, and a new section `Bố cục`)

**Interfaces:**
- Uses: the command `node scripts/format-layout.mjs --dense <path>`, which lists function bodies with 6 or more direct statements, 12 or more lines and no blank line.
- Uses: the rules `layout-after-imports`, `layout-between-declarations` and `layout-between-members` of `scripts/format-layout.mjs`, which `format`, `format:check` and the post-edit hook in `.claude/settings.json` run.

**STOP when:** `docs/conventions/code.md` already has a section `Bố cục`.

**Forbidden:** Do not change other sections of `docs/conventions/code.md`.

- [x] **Step 1: Change the first paragraph**

In the first paragraph of `docs/conventions/code.md`, change `naming, TypeScript, comment, validation, state và error handling` to `naming, TypeScript, bố cục, comment, validation, state và error handling`.

- [x] **Step 2: Add the section `Bố cục`**

Add this section after the section `TypeScript` and before the section `Comments`:

```markdown
## Bố cục

Biome quyết định indent, độ dài dòng và dấu câu *(format: Biome)*. Biome giữ dòng trống có sẵn nhưng không thêm dòng trống. Mục này quy định dòng trống và thứ tự câu lệnh.

- Một dòng trống sau block import ở đầu file *(format, hook post-edit: `format-layout` rule `layout-after-imports`)*.
- Một dòng trống giữa hai khai báo top-level khi một trong hai khai báo dài hơn một dòng. Các khai báo một dòng liền nhau là một nhóm, không cách dòng. Các overload của một function không cách dòng *(format, hook post-edit: `format-layout` rule `layout-between-declarations`)*.
- Member của class theo cùng quy tắc: field một dòng liền nhau là một nhóm, `constructor` và method nhiều dòng cách member bên cạnh một dòng trống *(format, hook post-edit: `format-layout` rule `layout-between-members`)*.
- Thân hàm chia thành đoạn theo bước: kiểm precondition, đổi state, side effect, trả kết quả. Các đoạn cách nhau một dòng trống. Trong React component và hook, các lệnh gọi hook là một đoạn, giá trị tính từ hook là đoạn sau, `return` là đoạn cuối. Lệnh `node scripts/format-layout.mjs --dense <path>` liệt kê thân hàm có từ 6 câu lệnh và 12 dòng trở lên mà không có dòng trống *(review)*.
- Khai báo biến ở đoạn dùng biến đó lần đầu. Không gom khai báo lên đầu hàm, vì `const` và `let` có scope là block. Ngoại lệ: React component gọi mọi hook trước điều kiện đầu tiên, theo Rules of Hooks *(review)*.
```

- [x] **Step 3: Run the checks**

Run: `corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

Run: `git grep -n "format-layout" -- docs/conventions/code.md`
Expected: each line is in the section `Bố cục`.

- [x] **Step 4: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

# Task 11: Add steps in the other packages

Read this file to learn the steps of Task 11, which adds steps to the dense function bodies in the other packages.

**Type:** Move or rename

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `scripts/format-layout.mjs` (the mode `--dense`)
- `docs/conventions/code.md` (the section `Bố cục`)

**Files:**
- Change: the files that `--dense` lists in Step 2. These files are under `packages/host/contracts/src`, `packages/presentation/design/src`, `packages/presentation/document/src`, `packages/presentation/html/src` and `packages/presentation/pptx/src`.

**Interfaces:**
- Uses: the command `node scripts/format-layout.mjs --dense <path ...>`. It prints `<path>:<line> <name> <statements> statements` for each dense function body. A dense body has 6 or more direct statements and 12 or more lines from `{` to `}`. It has no blank line between two direct statements. The last line is `format-layout: <n> dense function bodies`.

**STOP when:**
- Before Step 1, `git status --porcelain -- apps packages scripts tests` prints a line.
- The list of Step 2 has more than 90 bodies.

**Forbidden:**
- Change a line that is not blank. Do not move, merge, split, rename or reformat a statement.
- Add a blank line as the first or the last line inside a block, or two blank lines next to each other.
- Change a function body that Step 2 does not list.

- [x] **Step 1: Make sure that the working tree has no code change**

Run: `git status --porcelain -- apps packages scripts tests`
Expected: no line.

- [x] **Step 2: List the dense bodies**

Run: `node scripts/format-layout.mjs --dense packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src > /tmp/dense-before.txt; tail -n 1 /tmp/dense-before.txt`
Expected: one line that matches `format-layout: <n> dense function bodies`. Write `<n>` in the report.

- [x] **Step 3: Add blank lines to each listed body**

Open each body in the list of Step 2. Read only the direct statements of the body, not the statements inside nested blocks. Use this table. One statement can match more than one row. Do each row that matches.

| Signal | Action |
| --- | --- |
| A guard is an `if` statement with no `else` whose branch is only a `throw` or a `return`, or a call statement whose callee ends with `throwIfAborted`. A group of one or more guards ends, and the next statement is not a guard | Add one blank line after the last guard of the group |
| The statement is a `try`, `for`, `for...of`, `for...in`, `while`, `do` or `switch` statement, an `if` statement that spans 3 or more lines, or an expression statement that spans 3 or more lines. It is not the first statement of the body | Add one blank line before it. Exception: the statement before it is a one-line `const` or `let` declaration, and the first line of the statement uses the declared name. Then add the blank line before that declaration |
| The statement matches the row above and is not the last statement of the body | Add one blank line after it |
| The last statement is a `return`. Before it, back to the previous blank line or the start of the body, there are 3 or more one-line statements | Add one blank line before the `return` |
| The body is a React component or a hook. A component is a function in a `.tsx` file with a name that starts with an uppercase letter. A hook has a name that matches `^use[A-Z]`. The statement calls a hook (`use[A-Z]\w*(`), and the next statement does not call a hook | Add one blank line after the statement |
| The body is a React component, and the last statement is a `return` with JSX | Add one blank line before the `return` |
| A one-line `const` or `let` declaration, and the first use of its name is 10 or more lines below the declaration | Do not move it. Add `<path>:<line> <name>` to the table `Far declarations` in the report |
| After the rows above, the body has no blank line | Add `<path>:<line> <name>` to the table `Unchanged bodies` in the report |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 4: Prove that the diff adds only blank lines**

Run: `git diff -U0 --ignore-blank-lines -- packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src | grep -E '^@@'`
Expected: no line.

Run: `git diff -U0 -- packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src | grep -E '^-' | grep -v -E '^---'`
Expected: no line.

Run: `git diff -U0 -- packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src | grep -E '^\+.*[^[:space:]]' | grep -v -E '^\+\+\+'`
Expected: no line.

Run: `git diff --name-only`
Expected: each line starts with `packages/host/contracts/src`, `packages/presentation/design/src`, `packages/presentation/document/src`, `packages/presentation/html/src` or `packages/presentation/pptx/src` or `docs/build/refactor/code-layout/`.

- [x] **Step 5: Run the checks**

Run: `node scripts/format-layout.mjs --dense packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src | tail -n 1`
Expected: `format-layout: <n> dense function bodies`, where `<n>` is the number of rows in the table `Unchanged bodies`.

Run: `corepack pnpm@11.28.5 format:check`
Expected: exit code 0.

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. The report has the tables `Far declarations` and `Unchanged bodies`, with the columns `Location | Name`.

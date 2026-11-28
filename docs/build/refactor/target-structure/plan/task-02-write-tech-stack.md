# Task 2: Write the Tech Stack section of AGENTS.md

Read this file to learn the steps of Task 2, which writes the tools and the target libraries in the Tech Stack section of `AGENTS.md`.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `AGENTS.md` (lines 1-10)
- `package.json` (lines 1-70)
- `docs/build/refactor/target-structure/libraries.md`
- `.agents/skills/ste-vi/SKILL.md`
- `docs/conventions/docs.md`

**Files:**

- Change: `AGENTS.md` (lines 5-6, the `## Tech Stack` heading and the empty line after it)
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-02-write-tech-stack.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-02-write-tech-stack.md`

**Interfaces:**

- Uses: none.
- Produces: a `## Tech Stack` section in `AGENTS.md` with one bullet list. The `## Commands` heading stays empty and stays directly after the section.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, `AGENTS.md` line 5 is not `## Tech Stack`, or the `## Tech Stack` section already has content.
- A version in Step 1 is different from `Expected`.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Change a line of `AGENTS.md` outside the `## Tech Stack` section.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Change the words of the text in Step 2.

- [x] **Step 1: Check the versions in the repository**

Run: `sed -n 5,7p AGENTS.md && grep -n '"node": \|"@biomejs/biome"\|"oxlint"\|"typescript"\|"packageManager"' package.json && grep -n '"zod"' packages/host/contracts/package.json && grep -n "pinnedVersion = " apps/web/src/integrations/opencode/config.ts`

Expected: PASS. The output contains these lines, in this order:

```text
## Tech Stack

## Commands
    "node": "^22.19.0 || >=24.0.0"
    "@biomejs/biome": "^2.5.15",
    "oxlint": "1.94.0",
    "typescript": "^6.0.3"
  "packageManager": "pnpm@11.28.5",
    "zod": "4.6.7"
export const pinnedVersion = '1.19.5'
```

Each `grep` line starts with its line number and a colon. Ignore the line numbers when you compare. FAIL: a line is missing or a version is different.

- [x] **Step 2: Write the section**

In `AGENTS.md`, replace the two lines `## Tech Stack` and the empty line after it with the text below. Keep one empty line before `## Commands`. Do not copy the outer fence.

```markdown
## Tech Stack

- Node.js `^22.19.0 || >=24.0.0` (`engines` trong `package.json`). `start:local` chạy Node 22.19.0.
- pnpm 11.28.5. Luôn gọi qua `corepack pnpm@11.28.5`.
- TypeScript 6.0.3, build bằng `tsc -b`.
- Zod 4.6.7 cho validation tại boundary.
- `node:sqlite` với SQL viết tay.
- OpenCode 1.19.5 làm agent runtime.
- `node:test` cho test.
- oxlint 1.94.0 cho lint, Biome 2.5.15 cho format.
- Thư viện đích đã chọn, chưa cài: Express 5 với `multer` và `helmet` cho Local Host, React với Vite cho Browser, TanStack Query cho server state ở Browser. Phase cài thư viện nào thì chốt version của thư viện đó. Drizzle chưa được chọn.
```

- [x] **Step 3: Check the section**

Run: `sed -n 5p AGENTS.md | tr -d '\r' && sed -n 5,17p AGENTS.md | grep -c "^- " && grep -n "^## Commands" AGENTS.md | tr -d '\r'`

Expected: PASS. The output is `## Tech Stack`, then `9`, then `17:## Commands`. FAIL: any other output. `AGENTS.md` uses CRLF line endings. Keep CRLF line endings in the new lines.

- [x] **Step 4: Run the docs check**

Run: `corepack pnpm@11.28.5 check:docs`

Expected: PASS. The output contains `0 error(s)`. FAIL: the output contains `error(s)` with a number above 0.

- [x] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file. Change the Task 2 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-02-write-tech-stack.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-02-write-tech-stack.md` with:
   - H1 `# Task 2: Write the Tech Stack section report` and the purpose line `Read this file to learn the result of Task 2, which wrote the Tech Stack section of AGENTS.md.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - What the commands do not prove: the commands compare versions with `package.json` and the OpenCode config only. They do not prove that the installed packages in `node_modules` have the same versions.
3. Add a row for Task 2 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Mark Step 5 as `- [x]`, stop, and send the report summary.

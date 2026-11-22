# Task 12: Format the files with Biome

Read this file to learn the steps of Task 12, which formats the files that Biome reports with the repository formatter.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `biome.json`

**Files:**
- Change: each file that Step 2 lists. The list comes from Biome. Biome changes only the layout of the code: spaces, line breaks, quotes and commas.

**Interfaces:**
- Uses: the scripts `format` and `format:check` of `package.json`.
- Produces: nothing. The behavior of the code does not change.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The number of files that Step 2 lists is not between 30 and 60.

**Forbidden:**
- Change a file that Biome does not list in Step 2.
- Change a file in `docs/`.
- Delete, skip or weaken a test or a check.
- Delete or change a comment. Biome keeps the comments.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Record the test baseline**

Run: `node --test --test-reporter=tap tests/check-docs.test.mjs tests/check-no-comments.test.mjs tests/post-edit-hook.test.mjs tests/design-catalog.test.mjs tests/local-foundation.test.mjs tests/workspace-registry.test.mjs tests/model-requests.test.mjs tests/bound-outline.test.mjs tests/web-management.test.mjs tests/browser-runtime.test.mjs > /tmp/refactor-01/tests-before-task-12.txt 2>&1; grep -E '^# (pass|fail)' /tmp/refactor-01/tests-before-task-12.txt`
Expected: two lines, `# pass <P>` and `# fail <F>`. Write down P and F. Step 4 compares with them.

- [x] **Step 2: Count the files that Biome reports**

The working tree on Windows uses CRLF line endings, so each Biome command in this task uses `--line-ending=crlf`.

Run: `corepack pnpm@11.28.5 exec biome format --line-ending=crlf --max-diagnostics=none > /tmp/refactor-01/biome-before-task-12.txt 2>&1; grep -E 'Checked|Found' /tmp/refactor-01/biome-before-task-12.txt`
Expected: a line `Checked <N> files` and a line `Found <M> errors`, where M is between 30 and 60.

- [x] **Step 3: Format the files**

Run: `corepack pnpm@11.28.5 exec biome format --write --line-ending=crlf > /tmp/refactor-01/biome-write-task-12.txt 2>&1; echo "exit=$?"`
Expected: the output is `exit=0`.

Run: `corepack pnpm@11.28.5 exec biome format --line-ending=crlf > /tmp/refactor-01/biome-after-task-12.txt 2>&1; code=$?; tail -n 2 /tmp/refactor-01/biome-after-task-12.txt; echo "exit=$code"`
Expected: the last line is `exit=0`.

- [x] **Step 4: Check that the behavior did not change**

Run: `corepack pnpm@11.28.5 run build; echo "exit=$?"`
Expected: the last line is `exit=0`.

Run: `corepack pnpm@11.28.5 run lint; echo "exit=$?"`
Expected: the last line is `exit=0`.

Run: `node --test --test-reporter=tap tests/check-docs.test.mjs tests/check-no-comments.test.mjs tests/post-edit-hook.test.mjs tests/design-catalog.test.mjs tests/local-foundation.test.mjs tests/workspace-registry.test.mjs tests/model-requests.test.mjs tests/bound-outline.test.mjs tests/web-management.test.mjs tests/browser-runtime.test.mjs > /tmp/refactor-01/tests-after-task-12.txt 2>&1; grep -E '^# (pass|fail)' /tmp/refactor-01/tests-after-task-12.txt`
Expected: the same P and F as in Step 1.

Run: `node scripts/check-no-comments.mjs --report | tail -n 1`
Expected: the output is `total: 678 comment(s) in 122 file(s)`. The number of comments does not change.

- [x] **Step 5: Report and stop**

Send this report:
- The output of Step 2, Step 3 and Step 4, and the numbers P and F of Step 1.
- The output of `git diff --shortstat`.
- What the commands do not prove: the tests that run offline do not cover the tests that need a network or a browser. Without the option `--line-ending=crlf`, Biome reports each file on Windows. A CI run on Linux was not made.

# Task 4: Apply the layout script to the repository

Read this file to learn the steps of Task 4, which runs `scripts/format-layout.mjs --write` on the repository and proves that the diff adds only blank lines.

**Type:** Move or rename

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `scripts/format-layout.mjs` (the command and its modes)

**Files:**
- Change: each file under `apps/`, `packages/`, `scripts/` and `tests/` that `node scripts/format-layout.mjs --write` changes

**Interfaces:**
- Uses: the command `node scripts/format-layout.mjs <--check|--write|--dense> [path ...]`. Without a path, it reads `apps`, `packages`, `scripts` and `tests`. `--check` prints `<path>:<line> <rule> Add one blank line before this line.` for each finding and the last line `format-layout: <n> finding(s)`. `--write` prints `format-layout: <n> file(s) changed`.

**STOP when:**
- Before Step 1, `git status --porcelain -- apps packages scripts tests` prints a line.
- `git diff -U0` shows a removed line or a changed line that is not blank.

**Forbidden:**
- Change a file by hand.
- Change `scripts/format-layout.mjs` or `tests/format-layout.test.mjs`. If the script is wrong, STOP.

- [x] **Step 1: Make sure that the working tree has no code change**

Run: `git status --porcelain -- apps packages scripts tests`
Expected: no line.

- [x] **Step 2: Record the findings before the change**

Run: `node scripts/format-layout.mjs --check > /tmp/layout-before.txt; tail -n 1 /tmp/layout-before.txt`
Expected: one line that matches `format-layout: <n> finding(s)`.

Write the table `Findings by rule` with the columns `Rule | Count`. Get the counts from `/tmp/layout-before.txt` with `grep -c " <rule> " /tmp/layout-before.txt` for each of `layout-after-imports`, `layout-between-declarations` and `layout-between-members`.

- [x] **Step 3: Run the script**

Run: `node scripts/format-layout.mjs --write`
Expected: exit code 0 and one line that matches `format-layout: <n> file(s) changed`.

Run: `node scripts/format-layout.mjs --write`
Expected: exit code 0 and `format-layout: 0 file(s) changed`.

- [x] **Step 4: Prove that the diff adds only blank lines**

Run: `git diff -U0 --ignore-blank-lines -- apps packages scripts tests | grep -E '^@@'`
Expected: no line.

Run: `git diff -U0 -- apps packages scripts tests | grep -E '^-' | grep -v -E '^---'`
Expected: no line.

Run: `git diff -U0 -- apps packages scripts tests | grep -E '^\+.*[^[:space:]]' | grep -v -E '^\+\+\+'`
Expected: no line. Each added line is blank.

- [x] **Step 5: Run the checks**

Run: `node scripts/format-layout.mjs --check`
Expected: exit code 0 and `format-layout: 0 finding(s)`.

Run: `corepack pnpm@11.28.5 format:check`
Expected: exit code 0.

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

Run: `corepack pnpm@11.28.5 lint`
Expected: exit code 0.

Run: `node scripts/format-layout.mjs --dense apps/host/src apps/web/src packages/*/*/src | tail -n 1`
Expected: one line that matches `format-layout: <n> dense function bodies`. Write `<n>` in the report.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

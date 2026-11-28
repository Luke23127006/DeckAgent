# Task 12: Record the style commits and run the exit checks

Read this file to learn the steps of Task 12, which records the style commits in `.git-blame-ignore-revs` and runs the exit checks.

**Type:** Move or rename

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `package.json` (the scripts `build`, `lint`, `check:boundaries`, `check:docs`, `format:check` and `test:web`)

**Files:**
- Create: `.git-blame-ignore-revs`

**Interfaces:**
- Uses: the commit subjects `style(format): apply biome format` (one commit) and `style(layout): <text>` (six commits).
- Uses: the command `node scripts/format-layout.mjs <--check|--write|--dense> [path ...]`. `--dense` prints the last line `format-layout: <n> dense function bodies`.

**STOP when:**
- Before Step 1, `git status --porcelain -- apps packages scripts tests` prints a line.
- Step 2 does not find 7 commits.

**Forbidden:**
- Change `git config`. Tell the person the command in the report.
- Change a file under `apps/`, `packages/`, `scripts/` or `tests/`. If a check fails, STOP.

- [x] **Step 1: Make sure that the working tree has no code change**

Run: `git status --porcelain -- apps packages scripts tests`
Expected: no line.

- [x] **Step 2: Find the style commits**

Run: `git log --reverse -E --grep='^style\((format|layout)\):' --format='%H %s'`
Expected: 7 lines. The first line contains `style(format): apply biome format`. Each other line contains `style(layout):`.

- [x] **Step 3: Create `.git-blame-ignore-revs`**

Create `.git-blame-ignore-revs`. The first line is `# Code Layout Refactor: commits that change only formatting and blank lines.` After it, write two lines for each commit of Step 2, in the same order. The first line is `# <subject>`. The second line is the full hash.

Run: `grep -c -E '^[0-9a-f]{40}$' .git-blame-ignore-revs`
Expected: `7`.

Run: `git blame --ignore-revs-file .git-blame-ignore-revs -- package.json > /dev/null`
Expected: exit code 0.

- [x] **Step 4: Prove that each layout commit adds only blank lines in code**

Run: `for h in $(git log -E --grep='^style\(layout\):' --format=%H); do git show -U0 --ignore-blank-lines --format= "$h" -- apps packages scripts tests | grep -E '^@@'; done`
Expected: no line.

- [x] **Step 5: Run the exit checks**

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

Run: `corepack pnpm@11.28.5 lint`
Expected: exit code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

Run: `corepack pnpm@11.28.5 format:check`
Expected: exit code 0. The output contains `format-layout: 0 finding(s)`.

Run: `node --test --test-reporter=tap tests/format-layout.test.mjs tests/post-edit-hook.test.mjs tests/check-docs.test.mjs`
Expected: `# fail 0`.

Run: `corepack pnpm@11.28.5 test:web`
Expected: exit code 0.

Run: `node scripts/format-layout.mjs --dense apps/host/src apps/web/src packages/*/*/src | tail -n 1`
Expected: one line that matches `format-layout: <n> dense function bodies`. Write `<n>` in the report.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. In the report:

- Write the table `Style commits` with the columns `Hash | Subject`.
- Collect the rows of the tables `Far declarations` and `Unchanged bodies` from the reports of Tasks 7 to 11 in `../reports/`, and write their counts.
- Tell the person to run `git config blame.ignoreRevsFile .git-blame-ignore-revs` in each clone.

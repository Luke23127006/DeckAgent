# Task 3: Apply Biome to the repository

Read this file to learn the steps of Task 3, which runs the Biome formatter on the files that Biome does not accept.

**Type:** Move or rename

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `biome.json`

**Files:**
- Change: each file under `apps/`, `packages/`, `scripts/` and `tests/` that `biome format --write` changes

**Interfaces:**
- Uses: the script `format` in `package.json`, which runs `biome format --write`.

**STOP when:**
- Before Step 1, `git status --porcelain -- apps packages scripts tests` prints a line.
- `biome format --write` changes a file outside `apps/`, `packages/`, `scripts/` and `tests/`.

**Forbidden:**
- Change `biome.json`.
- Change a file by hand.

- [ ] **Step 1: Make sure that the working tree has no code change**

Run: `git status --porcelain -- apps packages scripts tests`
Expected: no line.

- [ ] **Step 2: Run Biome**

Run: `corepack pnpm@11.28.5 format`
Expected: exit code 0.

- [ ] **Step 3: Record the changed files**

Run: `git diff --name-only`
Expected: each line starts with `apps/`, `packages/`, `scripts/`, `tests/` or `docs/build/refactor/code-layout/`.

Write the table `Changed files` with the columns `File | Added lines | Removed lines`. Get the numbers from `git diff --numstat`.

- [ ] **Step 4: Run the checks**

Run: `corepack pnpm@11.28.5 format:check`
Expected: exit code 0.

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

Run: `corepack pnpm@11.28.5 lint`
Expected: exit code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [ ] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. In the report, tell the person to commit the diff with the subject `style(format): apply biome format`.

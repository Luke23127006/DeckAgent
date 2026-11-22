# Task 11: Switch the lint command from Biome to oxlint

Read this file to learn the steps of Task 11, which makes oxlint the linter of the repository and turns off the Biome linter.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- [Decisions](README.md#decisions) in `README.md`
- `biome.json`
- `.github/workflows/workspace.yml` (lines 54-58 and 170-175)

**Files:**
- Change: `package.json` (the `scripts` object)
- Change: `biome.json` (the `linter` object)
- Change: `.github/workflows/workspace.yml` (lines 56 and 173)

**Interfaces:**
- Uses: the script `lint:oxlint` and the file `.oxlintrc.json` from Task 8.
- Produces: the script `lint`, which runs oxlint. The formatter scripts `format` and `format:check` do not change.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit tool does not find the `old` text of an edit. Do not try another text.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Change the `formatter` object or the `javascript` object of `biome.json`.
- Remove the dependency `@biomejs/biome` from `package.json`.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Change `package.json`**

Make these two edits with the edit tool.

Edit 1. Old:

```text
    "lint": "biome lint",
    "lint:oxlint": "oxlint -c .oxlintrc.json apps packages scripts tests",
```

New:

```text
    "lint": "oxlint -c .oxlintrc.json apps packages scripts tests",
```

Run: `node -e "const s=JSON.parse(require('fs').readFileSync('package.json','utf8')).scripts;console.log(s.lint);console.log(s['lint:oxlint'])"`
Expected: two lines. The first line is `oxlint -c .oxlintrc.json apps packages scripts tests`. The second line is `undefined`.

- [x] **Step 2: Turn off the Biome linter in `biome.json`**

Edit 2. File `biome.json`. Old:

```text
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended",
      "complexity": {
        "useOptionalChain": "off"
      },
      "style": {
        "noNonNullAssertion": "off",
        "useTemplate": "off"
      }
    }
  }
```

New:

```text
  "linter": {
    "enabled": false
  }
```

Run: `node -e "JSON.parse(require('fs').readFileSync('biome.json','utf8'))" && echo valid`
Expected: the output is `valid`.

- [x] **Step 3: Change the CI workflow**

Edit 3. File `.github/workflows/workspace.yml`. Old:

```text
      - name: Lint (Biome)
```

New:

```text
      - name: Lint (oxlint)
```

Edit 4. File `.github/workflows/workspace.yml`. Old:

```text
          - Lint (Biome): $env:LINT_RESULT
```

New:

```text
          - Lint (oxlint): $env:LINT_RESULT
```

Run: `grep -c 'Biome' .github/workflows/workspace.yml`
Expected: the output is `0`.

- [x] **Step 4: Run the lint command and the format command**

Run: `corepack pnpm@11.28.5 run lint > /tmp/refactor-01/lint-after-task-11.txt 2>&1; echo "exit=$?"; grep -c 'problems' /tmp/refactor-01/lint-after-task-11.txt`
Expected: the output is `exit=0`, then `0`.

Run: `corepack pnpm@11.28.5 run format:check > /tmp/refactor-01/format-after-task-11.txt 2>&1; grep -E 'Checked|Found' /tmp/refactor-01/format-after-task-11.txt`
Expected: a line `Checked <N> files`. Biome still reports format errors. Task 12 fixes them. The output must not contain a line about a `lint/` rule.

- [x] **Step 5: Report and stop**

Send this report:
- Files changed.
- The output of Step 4.
- What the commands do not prove: the CI workflow is not run. The step `Lint (oxlint)` runs the script `lint` after `pnpm install --frozen-lockfile`, and the lockfile has the dependency `oxlint` from Task 8.

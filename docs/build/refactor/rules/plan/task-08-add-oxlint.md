# Task 8: Add oxlint beside Biome

Read this file to learn the steps of Task 8, which adds oxlint with the selected rule set and a script that runs it.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- [Decisions](README.md#decisions) in `README.md`
- `package.json` (the `scripts` and `devDependencies` objects)

**Files:**
- Create: `.oxlintrc.json`
- Change: `package.json` (the `scripts` and `devDependencies` objects)
- Change: `pnpm-lock.yaml` (only through the install command of Step 3)

**Interfaces:**
- Uses: nothing.
- Produces: the script `lint:oxlint` and the file `.oxlintrc.json`. Task 11 changes the script name.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The install command fails because the network is not available.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Change the script `lint` in `package.json`. Task 11 changes it.
- Add a dependency other than `oxlint` at the version `1.94.0`.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Create `.oxlintrc.json`**

Create `.oxlintrc.json` in the repository root with this content:

```json
{
  "categories": {
    "correctness": "error",
    "suspicious": "error"
  },
  "rules": {
    "eslint/no-shadow": "off",
    "unicorn/consistent-function-scoping": "off",
    "unicorn/prefer-add-event-listener": "off"
  }
}
```

- [x] **Step 2: Add the script and the dependency to `package.json`**

In the `scripts` object, after the line `"lint": "biome lint",`, add this line:

```json
    "lint:oxlint": "oxlint -c .oxlintrc.json apps packages scripts tests",
```

In the `devDependencies` object, after the line `"@types/node": "^22.20.1",`, add this line:

```json
    "oxlint": "1.94.0",
```

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" && echo valid`
Expected: the output is `valid`.

- [x] **Step 3: Install the dependency**

Run: `corepack pnpm@11.28.5 install; echo "exit=$?"`
Expected: the last line is `exit=0`.

- [x] **Step 4: Run oxlint with the new configuration**

Run: `corepack pnpm@11.28.5 run lint:oxlint > /tmp/refactor-01/lint-after-task-08.txt 2>&1; code=$?; tail -n 3 /tmp/refactor-01/lint-after-task-08.txt; echo "exit=$code"`
Expected: the output contains the line `32 problems` and the last line is `exit=1`.

- [x] **Step 5: Report and stop**

Send this report:
- Files changed.
- The output of Step 4.
- What the commands do not prove: the 32 problems remain. Task 9 and Task 10 fix them. The script `lint` still runs Biome.

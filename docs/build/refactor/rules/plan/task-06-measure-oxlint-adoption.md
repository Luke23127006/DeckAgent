# Task 6: Measure the cost of the oxlint rule set

Read this file to learn the steps of Task 6, which counts the findings that oxlint reports with the selected rule set.

This task is an investigation. It changes no file in the repository.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `biome.json`
- `package.json` (the `scripts` object)

**Files:**
- None.

**Interfaces:**
- Uses: nothing.
- Produces: the report. The next revision of this plan uses the report.

**STOP when:**
- A command fails because the network is not available.
- The output of a command does not have the form that `Expected` gives.
- The same step failed two times.

**Forbidden:**
- Change, create or delete a file in the repository. Write temporary files only below `/tmp/refactor-01/`.
- Add a dependency to `package.json`.
- Commit or push.

- [x] **Step 1: Count the Biome findings**

Run: `corepack pnpm@11.28.5 exec biome lint --max-diagnostics=none --reporter=summary > /tmp/refactor-01/biome-summary.txt 2>&1; echo "exit=$?"; tail -n 20 /tmp/refactor-01/biome-summary.txt`
Expected: an `exit=` line. The last lines of the output contain `Checked <N> files` and either `Found <M> warning` or no `Found` line. Copy the output into the report.

- [x] **Step 2: Count the oxlint findings with the default rules**

Run: `npx --yes oxlint@1.94.0 -f unix apps packages scripts tests > /tmp/refactor-01/ox-default.txt; echo "exit=$?"; tail -n 5 /tmp/refactor-01/ox-default.txt`
Expected: an `exit=` line and the last lines of the output. The last line before `exit=` has the form `<N> problems` or the output has no problem line. Copy the output into the report.

- [x] **Step 3: Count the oxlint findings with the selected rule set**

Run: `npx --yes oxlint@1.94.0 -D correctness -D suspicious -f unix apps packages scripts tests > /tmp/refactor-01/ox-selected.txt; echo "exit=$?"; tail -n 3 /tmp/refactor-01/ox-selected.txt`
Expected: an `exit=` line and the last lines of the output, with the line `<N> problems`. Copy the output into the report.

Run: `grep -oE '\[[^]]+\]$' /tmp/refactor-01/ox-selected.txt | sort | uniq -c | sort -rn`
Expected: one line for each rule, of the form `<count> [<severity>/<rule>]`. Copy the output into the report.

Run: `cut -d: -f1 /tmp/refactor-01/ox-selected.txt | grep -E '^(apps|packages|scripts|tests)' | cut -d/ -f1-2 | sort | uniq -c | sort -rn`
Expected: one line for each path group with findings. Copy the output into the report.

- [x] **Step 4: Report and stop**

Send this report:
- The output of Step 1, Step 2 and Step 3.
- What the commands do not prove: the repository passes Biome now, so the Biome count shows only the current state. It does not show which defects Biome would catch in new code that oxlint misses. The counts of Step 3 do not show which findings are defects and which findings the repository can turn off.

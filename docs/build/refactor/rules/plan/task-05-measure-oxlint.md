# Task 5: Measure oxlint and oxfmt

Read this file to learn the steps of Task 5, which measures oxlint and oxfmt.

This task is an investigation. It changes no file in the repository.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `biome.json`
- `package.json` (the `scripts` object)
- [Decisions](README.md#decisions) in `README.md`.

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

- [x] **Step 1: Record the versions**

Run: `mkdir -p /tmp/refactor-01 && npm view oxlint version && npm view oxfmt version && npm view oxfmt dist-tags --json`
Expected: two version numbers and a JSON object. Copy the output into the report.

Apply this table to the oxfmt version:

| Signal | Result |
| --- | --- |
| The major version of oxfmt is 1 or more, and the `latest` dist-tag equals that version | `oxfmt: stable` |
| The major version of oxfmt is 0 | `oxfmt: not stable` |
| No row matches | `oxfmt: unknown`, add the output to the report |

- [x] **Step 2: Record the plugin and type-aware support**

Run: `npx --yes oxlint@<oxlint version from Step 1> --help > /tmp/refactor-01/help.txt; grep -nE 'type-aware|js-plugins|jsPlugins|--format' /tmp/refactor-01/help.txt`
Expected: zero or more matching lines. Copy the output into the report. Write `type-aware flag: present` or `type-aware flag: absent`, and `js plugins in help: present` or `js plugins in help: absent`.

- [x] **Step 3: Count the findings with all categories**

Run: `npx --yes oxlint@<oxlint version from Step 1> -W correctness -W suspicious -W pedantic -W perf -W style -W restriction -W nursery -f unix apps packages scripts tests > /tmp/refactor-01/oxlint.txt; echo "exit=$?"; tail -n 3 /tmp/refactor-01/oxlint.txt`
Expected: an `exit=` line and the last lines of the output.

Run: `grep -oE '\[[^]]+\]$' /tmp/refactor-01/oxlint.txt | sort | uniq -c | sort -rn | head -40`
Expected: up to 40 lines of the form `<count> [<severity>/<rule>]`. Copy the output into the report.

Run: `cut -d: -f1 /tmp/refactor-01/oxlint.txt | grep -E '^(apps|packages)/' | cut -d/ -f1-2 | sort | uniq -c | sort -rn`
Expected: one line for each package with findings. Copy the output into the report.

- [x] **Step 4: Report and stop**

Send this report:
- The versions and the results of the tables in Step 1 and Step 2.
- The output of Step 3.
- What the commands do not prove: the help text does not prove that JS plugins work. The counts include rules that the repository can turn off later.

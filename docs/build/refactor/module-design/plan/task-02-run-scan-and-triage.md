# Task 2: Run quantitative scan and draft 14-area triage table

Read this file to run the Phase 1 scan and draft the 14-area triage table for owner approval.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/build/refactor/module-design/README.md` (lines 19-97)

**Files:**

- Change: this task file, for completion checkboxes only. This is a read-only measurement and triage task.

**Interfaces:**

- Uses: `corepack pnpm@11.28.5 scan:module-design` (`scripts/scan-module-design.mjs`).
- Produces: quantitative Before metrics, testware baseline summary, and proposed 14-area triage classification in the conversation report.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The scan reports fewer than 14 or more than 14 production areas.

**Forbidden:**

- Change any file outside `Files` (do not edit `docs/build/refactor/module-design/README.md` or source code).
- Delete, skip, or weaken any test or check.
- Commit or push.

## Triage decision table

Apply this table in top-to-bottom order to every one of the 14 production areas:

| Signal | Action |
| --- | --- |
| `filesOver400 >= 1` and `lines >= 1000` | Propose `Tier 1 (deep refactor)` |
| `filesOver400 >= 1` and `lines < 1000` | Propose `Tier 2 (inspect large file)` |
| `filesOver400 === 0` and (`functionsOver80 > 0` or `typeAssertions > 0` or `serviceSymbols > 0` or `smallNonBarrelFiles > 0`) | Propose `Tier 2 (hygiene only)` |
| `filesOver400 === 0`, `functionsOver80 === 0`, `typeAssertions === 0`, `serviceSymbols === 0`, and `smallNonBarrelFiles === 0` | Propose `Skip (untouched unless defect appears)` |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Run the Markdown quantitative scan**

Run: `corepack pnpm@11.28.5 scan:module-design`
Expected: PASS. The command exits with code 0 and prints `# Module Design Quantitative Scan` with all 14 production areas, testware counts, and co-change clusters.

- [ ] **Step 2: Run the JSON quantitative scan and check area count**

Run: `corepack pnpm@11.28.5 scan:module-design --json | node -e "const fs=require('node:fs'); const d=JSON.parse(fs.readFileSync(0,'utf8')); if(d.areas.length!==14) process.exit(1); console.log(JSON.stringify({areaCount:d.areas.length, prodFiles:d.files.length, testFiles:d.tests.length, coChangePairs:d.coChanges.length}))"`
Expected: PASS. The command exits with code 0 and prints `"areaCount":14`.

- [ ] **Step 3: Classify all 14 areas and compare with the initial table**

Apply the [Triage decision table](#triage-decision-table) to all 14 areas from Step 1.
Compare each proposed tier against `docs/build/refactor/module-design/README.md` (lines 35-50).
List every area whose computed tier differs from the initial table, with the exact metric values that triggered the difference.

- [ ] **Step 4: Check that no repository files changed outside checkboxes**

Run: `git status --short`
Expected: PASS. No tracked source file or `docs/build/refactor/module-design/README.md` shows new modifications from this task.

- [ ] **Step 5: Report and stop**

Send this report and STOP for owner approval of the 14-area triage table:
- Files changed: `docs/build/refactor/module-design/plan/task-02-run-scan-and-triage.md` (checkboxes only)
- Commands run, with exit codes and the last 20 lines of output of each command
- Full 14-area table: `Area | Files | Lines | >400 | Fn>80 | <30 non-barrel | Assertions | *Service | Max exports | Computed tier | Differs from README?`
- Testware baseline summary: total test files per group, missing top-header count, fixed `setTimeout` file list, and `scripts/lib/` importer list
- Top 10 co-change pairs from the scan output
- Items that a decision table sent to the report
- What the commands do not prove: static metrics measure structural symptoms only and do not evaluate domain ownership or runtime correctness

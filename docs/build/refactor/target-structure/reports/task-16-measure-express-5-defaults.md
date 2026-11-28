# Task 16: Measure the Express 5 defaults report

Read this file to learn how Express 5.2.1 behaves for each default that can change the HTTP contract of the Local Host.

## Files changed

- `docs/build/refactor/target-structure/plan/README.md`: changed Task 16 to `Done` and added the report link.
- `docs/build/refactor/target-structure/plan/task-16-measure-express-5-defaults.md`: marked Steps 1 to 6 as done.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index row.
- `docs/build/refactor/target-structure/reports/task-16-measure-express-5-defaults.md`: added this report.
- Outside the repository: `C:\Users\Duy\AppData\Local\Temp\express-spike-c66784f2e23f46afb9bb7b59c9646a07`, with `package.json`, `node_modules/` and `spike.mjs`.

## Commands run

Git Bash is not installed on this machine. Every command ran in PowerShell 5.1. Step 2 uses `New-Item` and `[System.IO.File]::WriteAllText` in place of `mktemp -d` and `printf`. Step 4 uses `2>$null` in place of `2>/dev/null`. PowerShell has no `python` command, so the linter at Step 6 runs with `python3` from WSL.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` and `node --version` | 0 | No line from `git status --short`. `v22.23.5`. |
| 2 | `New-Item -ItemType Directory` for the temporary folder, write `package.json`, then `corepack pnpm@11.28.5 add express@5.2.1` | 1, then 0 | First call: `Invalid package.json in package.json`. Second call: `+ express 5.2.1 (5.3.0 is available)` and `Done in 4.9s using pnpm v11.28.5`. |
| 2 | `Get-Content node_modules/express/package.json` | 0 | `version` = `5.2.1` |
| 3 | Write `spike.mjs` | 0 | No output |
| 4 | `node spike.mjs 2>$null` | 0 | 17 lines, from `E1` to `C4`, in the order of the task |
| 5 | `git status --short` | 0 | No line |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 201 file(s) checked, 0 error(s) in 0 file(s)` |
| 6 | `wsl python3 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-16-measure-express-5-defaults.md` | 0 | `0 violations (0 hard, baseline 0)` |

The first call at Step 2 failed. `-Encoding utf8` in PowerShell 5.1 writes a byte order mark, and pnpm rejects the file. The second call writes `package.json` with `[System.IO.File]::WriteAllText`, which adds no byte order mark. The install then succeeded.

The temporary folder is `C:\Users\Duy\AppData\Local\Temp\express-spike-c66784f2e23f46afb9bb7b59c9646a07`. It is outside `C:/Users/Duy/Desktop/DeckAgent`.

## Output of Step 4

```text
E1 x-powered-by=Express
E2 etag=present
E3 HEAD status=200
E4 /API/sessions status=200
E4 /api/sessions/ status=200
E5 status=404 type=text/html; charset=utf-8 body-has-Cannot-GET=true
E6 status=500 type=text/html; charset=utf-8
E7 %20 status=200 body={"id":"a b"}
E7 101 chars status=200
E8 query body={"a":["1","2"],"b[c]":"1"}
E9 status=200 allow=GET, HEAD
E10 status=503 body={"caught":"spike failure"}
E11 inline parameter pattern=rejected (PathError)
C1 x-powered-by=absent
C2 etag=absent
C3 /API/sessions status=404
C4 /api/sessions/ status=404
```

## Planner expectations against the observed lines

| ID | Planner expectation | Observed line | Match |
| --- | --- | --- | --- |
| E1 | `E1 x-powered-by=Express` | `E1 x-powered-by=Express` | yes |
| E2 | `E2 etag=present` | `E2 etag=present` | yes |
| E3 | `E3 HEAD status=200` | `E3 HEAD status=200` | yes |
| E4 | `E4 /API/sessions status=200` and `E4 /api/sessions/ status=200` | `E4 /API/sessions status=200` and `E4 /api/sessions/ status=200` | yes |
| E5 | `E5 status=404 type=text/html; charset=utf-8 body-has-Cannot-GET=true` | `E5 status=404 type=text/html; charset=utf-8 body-has-Cannot-GET=true` | yes |
| E6 | `E6 status=500 type=text/html; charset=utf-8` | `E6 status=500 type=text/html; charset=utf-8` | yes |
| E7 | `E7 %20 status=200 body={"id":"a b"}` and `E7 101 chars status=200` | `E7 %20 status=200 body={"id":"a b"}` and `E7 101 chars status=200` | yes |
| E8 | `E8 query body={"a":["1","2"],"b[c]":"1"}` | `E8 query body={"a":["1","2"],"b[c]":"1"}` | yes |
| E9 | `E9 status=200 allow=GET, HEAD` | `E9 status=200 allow=GET, HEAD` | yes |
| E10 | `E10 status=503 body={"caught":"spike failure"}` | `E10 status=503 body={"caught":"spike failure"}` | yes |
| E11 | `E11 inline parameter pattern=rejected (PathError)` | `E11 inline parameter pattern=rejected (PathError)` | yes |
| C1 | `C1 x-powered-by=absent` | `C1 x-powered-by=absent` | yes |
| C2 | `C2 etag=absent` | `C2 etag=absent` | yes |
| C3 | `C3 /API/sessions status=404` | `C3 /API/sessions status=404` | yes |
| C4 | `C4 /api/sessions/ status=404` | `C4 /api/sessions/ status=404` | yes |

The 17 observed lines match 17 of the 17 lines of the planner expectations. No row has `Match` = `no`.

The four lines C1 to C4 come from one app with four settings: `x-powered-by` off, `etag` off, `case sensitive routing` on and `strict routing` on. The lines show that these four settings give the HTTP contract that Phase 2 needs. This contract has no `X-Powered-By` header, no `ETag` header, exact letter case and no trailing slash.

## What the commands do not prove

The script runs one request for each default on Express 5.2.1 with no middleware. A later version of Express can behave differently. The script does not run the Local Host. The script does not prove that the current Local Host keeps its HTTP contract after the move to Express. The script proves only the Express 5.2.1 baseline that the Express settings of Revision 2c start from.

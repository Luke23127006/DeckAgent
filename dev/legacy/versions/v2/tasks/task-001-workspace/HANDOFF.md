# TASK-001 — Implementation and manual acceptance

Candidate: `feature/v2-task-001-workspace`, based on `7713d7811ea361fbf45edd78c70b16f0f8a33d48`, with uncommitted changes. Owner requested TASK-001 on 27-10-2026. Other V2 groups remain unstarted. This record does not declare all proposed V2 flows accepted or V2 active.

## Delivered

- A: profile default resolves to `~/.deckagent`, independent of the working directory. Workspace setup persists separately from user folders. Session schema 2 stores ownership and migrates V1 records to Default Workspace.
- B: Workspace selection, grouped Chats, Ungrouped history, add/repoint folder dialog, removal confirmation and missing-folder guidance.
- C: separate read-only source and private per-Chat/request work grants, with source identity and link/path checks. Publication reads only that request's drafts.
- Explicit offline legacy import creates a backup, copies to staging, validates SQLite identity/integrity, then installs by rename. Existing targets are refused; a completed marker makes repetition idempotent.

Final interfaces are recorded in the [group contract](README.md). GitHub Issue links remain pending publication authorization. No issue, commit, push or real-user migration was performed.

## Verification — 27-10-2026

Environment: Windows, Node 22.19.0 from the existing local toolchain, pnpm 11.28.5, installed Chrome. All model calls used deterministic fixtures and temporary storage.

| Check | Result | Limit |
|---|---|---|
| `pnpm.cmd build` | PASS | Typecheck and bundle, not live model quality |
| `pnpm.cmd lint` | PASS | Source lint only |
| Combined affected Node suites and Chrome browser smoke | 101/101 PASS, 0 skipped | Fixture providers; no live-model manual acceptance |
| New Workspace, isolation and import suites | 17 cases included in the combined run; import suite expanded afterward and passed 5/5 | 102 distinct passing cases overall; no actual user profile imported |
| Chrome smoke | 6 cases included in the combined run | Includes ownership, missing folder, invalid/repoint recovery, cancelled removal and Ungrouped history |
| `pnpm.cmd test:workspace` after expanding import coverage | 18/18 PASS, 0 skipped | Includes provider/activity/deck import round trip |
| New-file formatting, local documentation links, workflow `actionlint`, `git diff --check` | PASS | Hosted CI and manual acceptance remain pending |

The combined run used `node --test` with these files under `tests/`: `session-persistence`, `web-session`, `web-management`, `file-tools`, `host-api`, `browser-runtime`, `local-web`, `deck-service`, `publish-slide`, `deck-pipeline`, `deck-model`, `deck-client`, `outline-state`, `outline-workflow`, `outline-client`, `recovery-editing`, `v2-workspace`, `v2-workspace-isolation`, `v2-legacy-import` and `browser-smoke` (each ending `.test.mjs`). These map to the existing check scripts plus the new `test:workspace` script.

Local logs: `.local-only/v2-task001-build.log`, `.local-only/v2-task001-lint.log`, `.local-only/v2-task001-integration-final.log`. These are ignored local evidence, not durable Issue attachments.

Failures found and resolved:

- Workspace API tracer failed with 404 before implementation; it passes after integration.
- Initial combined regression: 70 PASS / 21 FAIL. Old assertions expected shared draft paths. Assertions now inspect private paths and recursively check for forbidden files, preserving expected content/count and collision protection.
- Initial legacy corruption case exposed an overly broad error code; it now reports `LEGACY_DATABASE_INVALID` and verifies original/backup preservation.
- Browser fixture initialization needed to await the owned Chat. Existing tool-output fixtures now use a request-private file while retaining output-safety assertions.
- Sandbox blocked Node/Chrome child processes with `spawn EPERM`. Final combined checks ran with approved process execution. No checks were disabled.
- The added import round-trip fixture initially recorded a failed request before import. The corrected fixture emits an explicit model finish event and saves its custom provider after that request. Provider settings, request/activity records and saved deck work reopen together after import; the five import tests pass.

Final focused reruns after private-directory mode and Workspace navigation adjustments: Workspace suites 18/18 PASS; Chrome smoke 6/6 PASS; build/lint PASS. Selecting a different Workspace preserves the previous Chat's draft and disables sending into that Chat until the user chooses the intended Chat. Logs: `.local-only/v2-task001-workspace-final.log` and `.local-only/v2-task001-browser-final.log`.

`test:workspace` is also included in Workspace CI. That workflow change has not run on a hosted runner.

## Manual G-001 — not yet run

Use a new test profile and two disposable project folders outside that profile. Keep any existing Host profile untouched.

```powershell
pnpm.cmd build
pnpm.cmd start:local-web --data-dir .deckagent/v2-task001-manual
```

1. Configure a usable model. Create two Workspaces by entering their absolute project-folder paths. Add a Chat in each. Selecting the same folder returns the same Workspace.
2. Create a three-slide presentation through normal outline proposal and confirmation. Check Canvas publication. Record Chat/Workspace IDs, slide revisions and source-folder file names/hashes.
3. Stop an active request; verify saved slides remain. In separate runs, attempt to remove/repoint the Workspace during running work and while awaiting clarification. Both attempts must refuse without stopping work.
4. Restart Host with the same command. Reopen both Chats, conversation, outline and deck. IDs and ownership must persist; interrupted work must not replay.
5. Move a disposable project folder. Reload: a missing-folder notice appears, but saved Chat/deck data remains readable. Repoint to its new absolute path; identity and saved work stay intact.
6. Cancel Workspace removal, then confirm it. The first action changes nothing; the second leaves Chats in Ungrouped, with their work and model. Default Workspace cannot be removed.
7. Recheck source-folder names/hashes, including hidden entries. No generated file or `.deckagent` folder may appear there.

Run the [G-001 checklist](../../PROGRESS.md#g-001--workspace-and-storage) and record tester, candidate, provider/model, results and safe evidence in PROGRESS. Keep G-001 NOT VERIFIED until the manual observations pass.

## Offline migration trial

Use a **copy** of a stopped V1 profile and a target that does not exist. Never use the only original for a trial. Stop CLI/Host writers first.

```powershell
pnpm.cmd start:local-web --import-legacy <absolute-v1-profile-copy> --data-dir <absolute-new-target>
```

Verify conversation/model, requests/activities, outlines and published deck content after import. Keep the sibling `.<target-name>-backup-<uuid>` and original copy. Retry the same import: it must preserve the current target. An unrelated existing target must be refused. Do not delete SQLite sidecars to bypass the offline check; close/recover the old profile with its original application.

To return to V1, stop the candidate and run V1 against the original profile or backup. V1 cannot open session schema 2. Imported shared draft files are retained as archives, but are not exposed to every Chat.

## Remaining limits

- Live-model/manual G-001 and hosted CI remain NOT VERIFIED. Historical V1 Gates 004–007 are not closed by these tests.
- Native folder picker is not implemented; the dialog requires an absolute local path.
- Portable Node filesystem checks reject detected identity/link changes. They do not prove atomic protection against every directory swap by another OS process.
- Import requires stopped writers. Sidecar rejection and before/after source hashes detect observable writes; they cannot prove that an unrelated process has no dormant connection.

# TASK-004 implementation and G-004 manual acceptance

Candidate: `feature/v2-task-004-permissions`, based on `17ad50f` (merged provider/model work). The owner confirmed all G-003 gates passed on 28-10-2026 and requested this group. No exact manual-run SHA or separate artifact was supplied for that acceptance.

## Delivered behavior and contracts

- A Chat defaults to Workspace Access. Settings can save Provided Materials Only as the default for new Chats; existing Chats keep their preset. Composer permission details save the current Chat's preset, list exact-file continuing scopes and revoke them.
- A request captures its preset and current grants before work starts. Preset changes and revocation affect later requests. An explicit approval can authorize its named read once, or persist that exact file's scope for the same Chat. No folder-wide grant is silently created.
- Host API exports `ChatPermission`, `PermissionGrant`, `ApprovalDraft`, `StepApproval`, `ApprovalReply` and `RequestApproval`. `openAgent` receives the trusted approval callback as its fourth argument; existing implementations that ignore that argument remain valid. Clarification and approval both use `awaiting_user`, with distinct mutually exclusive payloads and reply endpoints.
- `PermissionStore` adds four app-local tables to `web.sqlite`, preserving existing provider, request and activity data. Existing Chats without a permission record use Workspace Access. Session schema stays 3. Pending approval metadata is part of the durable request record; answers and continuing grants are saved transactionally before tool execution resumes.
- File tools support `read_file` with `scope: "external"` and an absolute local file path only when Host authorization is injected. Source reads use the same callback. Validation rejects links, hardlinks, private application roots and changed file identities before content is returned. Writes remain restricted to exclusive creation inside the request's private work root; no approval expands that boundary.
- Denial produces the fixed `PERMISSION_DENIED` diagnostic and suppresses another ask for the same canonical file in that request. The model can continue with allowed material and must explain what remains unavailable. No answer leaves the tool and request waiting. Stop cancels the wait; Host restart preserves uncertainty and performs no replay.
- The browser restores approvals after reload, retains unsent drafts, shows a pending approval indicator in the sidebar and keeps controls bound to their original Chat. A detached old approval control cannot answer another Chat's request. Failed/stale submissions do not optimistically create a client-side grant.

The [Host and filesystem integration proposal](../../../../adr/0003-chat-step-approval-boundary.md) records the boundary without declaring final architecture approval. Named references and attachments remain in the following group; the restricted preset currently grants no unnamed source-file reads. Public research tools are not added here.

## Verification evidence

Windows, Node 22.19.0, pnpm 11.28.5; synthetic temporary profiles, local fixture files and Chrome. No real profile or model key was used.

| Check | Result | Evidence |
|---|---|---|
| `pnpm.cmd build` | PASS | TypeScript project checks and all bundles |
| `pnpm.cmd lint` | PASS | 126 owned files |
| Targeted `format:check` on nine new files; `git diff --check` | PASS | Formatting and whitespace; whole-repository formatting remains outside this change |
| `actionlint` on Workspace CI; 31 local documentation links | PASS | New CI step and handoff navigation |
| `pnpm.cmd test:permissions` | 7/7 PASS | Presets/defaults, request snapshot, versioned approval, once/deny, grants/revocation, isolation, replacement race and killed-Host recovery |
| `pnpm.cmd test:browser-smoke` | 8/8 PASS | Approval navigation/reload/draft, continuing grant and revoke; earlier Chat/model/deck cases |
| `pnpm.cmd test:tools-browser`, `pnpm.cmd test:local-web`, `pnpm.cmd test:agent-runtime` | 16/16, 9/9, 35/35 PASS | Existing tool, API/client, Settings and runtime behavior |
| `pnpm.cmd test:slide-pipeline`, `pnpm.cmd test:outline-workflow` | 9/9, 19/19 PASS | Private drafts, slide publication and outline confirmation |
| `pnpm.cmd test:workspace`, `pnpm.cmd test:chat-lifecycle` | 19/19, 3/3 PASS | Prior storage/import/isolation and concurrent request gates |

The first preset test failed with HTTP 404 before implementation. The new browser fixture initially queried the approval element before the reload DOM existed; waiting for the element fixed that test timing failure. The first CI lint check found an incorrectly indented result environment variable; correcting the indentation restored `actionlint` PASS. No security assertion or earlier test was removed. New tests run through `test:permissions` and the Windows CI workflow. Hosted CI has not run on this local candidate.

## Negative access matrix

The hosted browser run later exposed a fixture path comparison failure: Windows TEMP used `RUNNER~1` while the approval used canonical `runneradmin`. Lowercase TEMP reproduced the same string mismatch locally. Expected approval and grant paths now use `realpath()` without relaxing exact equality or changing runtime policy. The default-TEMP browser suite passed 8/8; browser and permission suites together passed 15/15 with lowercase TEMP. Hosted CI rerun remains pending.

| Attempt | Result |
|---|---|
| Current private draft read/write | Allowed under existing root checks; writes never overwrite |
| Workspace source read with captured Workspace Access | Allowed, read-only |
| Unnamed source read with Provided Materials Only | Waits for explicit approval |
| Outside local regular file | Waits for approval; once covers one tool invocation |
| Other Chat or active profile storage through absolute path, symlink/junction or hardlink | Rejected without offering approval |
| Traversal or absolute original-file write | Rejected; original remains unchanged |
| File replaced while approval waits | Rejected without returning substituted content |
| Wrong Chat, stale version or ordinary clarification reply | Cannot authorize the blocked read |
| Killed Host with pending approval | Durable status becomes unknown; no grant and no model/tool replay |

Portable Node filesystem checks do not establish a kernel-level atomic guarantee against every parent-directory race. The checks are applied before and after opening the file; the deterministic link, substitution and root-isolation tests pass. Continuing scope is the named canonical file path. Provider behavior after denial is covered by fixed tool diagnostics and still requires live-model judgment.

## Fast manual G-004

Stop the current Host, build and restart with the same `--data-dir` and previous `--workspace` override if any. Reuse the configured provider. Create test Chats X/Y, a Workspace source file and a separate disposable text file outside both the project folder and DeckAgent storage. Record the candidate commit, model/provider, tester and date without sharing keys or private content.

1. Open X's permission details. Confirm Workspace Access and its plain-language scope. Change it to Provided Materials Only; your conversation and unsent draft must stay intact. Reload and confirm the saved preset.
2. With Workspace Access selected, ask the model to read the test project file using `read_file` with `scope: "source"`. It should read without approval. With Provided Materials Only selected for the next request, ask again; it must wait for approval before reading.
3. Ask for the disposable outside file using `read_file` with `scope: "external"` and its absolute path. Check the exact file/reason shown. Leave it unanswered and switch to Y; X must remain pending and Y must not inherit its control. Return to X and reload; the approval and unsent draft should return.
4. Choose Allow once, then request the same outside file in a later tool step/request. A new approval must appear. Deny it; the model must explain that the file was not read, continue only with allowed work and stop asking for that refused file in the same request.
5. In another request, explicitly allow that exact file in X until revoked. Restart Host; a later X request may read it without asking. Y must still ask. Revoke X's scope in permission details; the next X request must ask again.
6. While a long request runs, change the selected preset or revoke a prior grant. The active request retains its captured permission; a later request uses the change. No request starts or stops merely because the selection changes.
7. Try to read another Chat's private file and to write a file in the project folder. Neither may offer an approval that grants access. Confirm originals and the other Chat are unchanged. The synthetic test matrix above exercises malicious aliases without needing real user data.
8. Stop a request while it awaits approval. Its controls become stale and no file read follows. Reopen an earlier outline/deck, generate a small deck and confirm private draft/publication still works.

G-004 stays `NOT VERIFIED` until manual observations pass. Issue publication and hosted CI evidence remain pending. Later material/reference, research and compaction groups are unchanged.

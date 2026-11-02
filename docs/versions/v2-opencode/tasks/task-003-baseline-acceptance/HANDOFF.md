# TASK-003 — Handoff record

Independent regression preparation has run. G-003: NOT VERIFIED.
Inherited behavior remains as recorded in [the audit](../../BASELINE-AUDIT.md).

| Item | Record |
|---|---|
| Candidate SHA / dirty changes | `7796d3e8cdd506061f1b46cdaa69270486518793` plus source hashes in evidence.json |
| Named A / B / C / integrator | Codex for all lanes, 2 November 2026 |
| Contract and exact file ownership | Recorded below |
| Producers/consumers and compatibility | Existing interfaces, schema and default backend unchanged |
| Automated commands/results/artifacts | Recorded below and in evidence.json |
| Live model/protocol/CLI/OS/Node/tester | Gemini / 1.19.5 / Windows / Node 22.19.0 / Codex |
| Manual and negative scenarios | Owner-confirmed six-case smoke PASS; broader matrix pending |
| Data/profile and preservation checks | Test-owned temporary profiles and canaries only |
| Lane A / B / C | IN PROGRESS / Gemini smoke PASS, extended pending / IN PROGRESS |
| Integration G-003 | NOT VERIFIED |
| Failures/limits/retest owner | Codex and owner; see below |
| Next action / downstream consumer | Finish bounded live/manual checks; G-002 and G-003 still gate downstream integration |
| GitHub Issue | Unpublished; authorization required |

Append dated results and retests without deleting failures. Never include credentials or private user material.

## Contracts and ownership

G-001 is PASS. G-002 remains NOT VERIFIED. The owner's Task 003 request authorizes independent regression preparation.
These checks do not waive entry gates, change scope or rewrite historical acceptance.

| Boundary | Existing symbols / data | Checks and compatibility |
| --- | --- | --- |
| Host admission and termination | `startLocalWeb`, `HostClient.send/watch/snapshot/stop`, `RequestController` | Same Chat refuses `SESSION_BUSY`; another Chat continues; admission is reused after Stop |
| Permission | `openWebRequest.authorizeRead`, versioned approval API | `once`, `deny`, `scope`; wrong Chat/stale approval returns 409; revoke affects later requests |
| MCP execution | `openToolBridge`, `ToolRegistry.execute`, `SessionStore.append` | Persist call before execution; revoke/abort checked before queued work; close waits for execution |
| Confirmation | `reviewAction`, `DeckService.currentOutline/confirmOutline` | `OUTLINE_STALE` before confirmation; `OUTLINE_ALREADY_CONFIRMED` afterward |
| Publication | `registerPublishSlide`, `DeckService.publish`, `DeckClient.snapshot/content` | Host-bound Chat and slide IDs; expectedRevision; exact publicationId retry is idempotent |
| Files | `registerFileTools`, `readApprovedFile` | Sibling roots, aliases/hardlinks and source writes refused; changed target identity after approval refused |
| Browser | Existing views and smoke tests | OpenCode completion/Stop/reload; broader inherited browser suite still uses its existing fixture backend |

A owns `package.json`, `scripts/test-opencode.mjs` and progress/handoff records.
C owns `tests/opencode-baseline.test.mjs`, `tests/opencode-baseline-security.test.mjs`, `tests/opencode-baseline-live.test.mjs`.
B owns `MANUAL-ACCEPTANCE.md`. Existing client views and browser tests stay unchanged.
No production source, package interface, database schema, dependency, lockfile or business rule changes.
Legacy runtime stays the default. No backend retry or new runtime framework is added.

## Commands and environment

Use supported Node and build first. This workspace uses `.local-only/task-001-toolchain/node_modules/node/bin/node.exe` (22.19.0).
The CLI is the existing OpenCode Windows x64 1.19.5 binary, SHA256
`d7b473388cb62555970e400ce54cdfb6d6573608beea6f8fdf382cd1a698a3fa`.
Browser: Chrome 156.0.8078.80. Fixtures use `mkdtemp`, new databases and test canaries.
Cleanup removes only test-owned temporary roots. Original profiles and user data are untouched.

```powershell
pnpm.cmd build
pnpm.cmd test:opencode:baseline
pnpm.cmd test:opencode:baseline:live
pnpm.cmd test:browser-smoke
```

The baseline command uses real CLI/MCP/Host/browser with a loopback provider and no cloud credentials.
The live command explicitly loads optional `.env` and requires Gemini. Missing keys fail before tests start.
It accepts `DECKAGENT_GEMINI_MODEL`; credentials never appear in test arguments or evidence.

## Results

| Check | Result | Scope |
| --- | --- | --- |
| Direct Node typecheck/build | PASS | `tsc -b` and workspace bundling |
| Baseline CLI/Host/browser | 6 PASS | Three Host cases, two MCP cases, one real-browser case |
| Expanded MCP security suite | 4 PASS | Includes the two MCP cases above plus roots and substitution |
| Inherited regression selection | 72 PASS | Workspace/import/chat/permission/outline/publication/recovery on the existing fixture backend |
| Inherited browser suite | 9 PASS | Existing browser behavior; not full OpenCode browser qualification |
| Gemini live permission suite | 1 PASS on final retest | Once/deny/grant, grant after restart, isolation, revoke and Stop in approval |
| Gemini live presentation suite | 1 FAIL | First outline request ended `OPENCODE_FAILED`; later presentation steps were not reached |
| Lint / changed-file format | PASS | Biome lint and four changed JavaScript files |
| Owner manual smoke | PASS, owner-confirmed 2 November 2026 | Six supplied chat cases; broader manual matrix pending |

Commands, source/log hashes and sanitized summaries are in `evidence.json`.
The baseline command ran before the last two security cases were added; the expanded security suite ran afterward.
Do not sum overlapping runs. The current runner has eight distinct baseline cases.

Initial fixture failures were corrected without production changes:

- Version zero is invalid input, not stale confirmation. Use a positive wrong version before confirmation.
- An already confirmed outline returns `OUTLINE_ALREADY_CONFIRMED`; the stale case runs separately before confirmation.
- Bridge close can terminate HTTP responses after execution drains. Response delivery is not a cancellation contract.
- Tool schemas must be closed objects; the storage-failure fixture now declares `additionalProperties: false`.

The sandbox first refused Node subprocesses with `spawn EPERM`; permitted runs then executed normally.
The PowerShell `pnpm.cmd build` wrapper reported NativeCommandError for its command echo despite completed bundling.
Direct `node node_modules/typescript/bin/tsc -b` and `node scripts/build-workspace.mjs` both returned zero.
No application check was disabled or weakened.

## Live evidence

The initial Gemini permission attempt confirmed once and deny, then completed without a new tool call before the grant scenario.
The complete attempt is FAIL; this is not a permission bypass and does not prove grant behavior.
The retest uses separate Chats for independent decisions and explicitly asks for a new read.
It also asserts a new tool result after restart instead of accepting a reply from history.
Final live results are recorded in `evidence.json`. Earlier failures remain recorded.
The second attempt reached once/deny/grant and grant after restart, but incorrectly expected Stop acknowledgment to be terminal.
The final test waits through `HostClient.watch` for cancellation, as the existing asynchronous API requires.
That final live permission run passed in 88 seconds. No production change or permission relaxation was needed.

The separate presentation run failed in 150 seconds on its first outline request.
Execution metadata records exit code 1, one step, model stage, no provider status, no abort and no DeckAgent deadline.
The cause remains unresolved. This evidence does not establish a bad API key, a permission bypass or a provider outage.
Do not replace the failed current run with historical presentation PASS results.

## Remaining acceptance and limits

A is IN PROGRESS, B Gemini smoke PASS with extended acceptance pending, C IN PROGRESS. G-003 stays NOT VERIFIED.

- Resolve G-002's missing Chat Completions, Responses and Anthropic live coverage and extended selection/effort acceptance.
- Complete the extended owner checklist with candidate, browser, model and per-case outcomes.
- Qualify killed-Host recovery while the OpenCode-backed Host awaits approval and during tool/publication work.
  Legacy Host crash and adapter-level unpaired-call recovery do not prove that complete combined path.
- Qualify Stop at publication and before spawn with explicit Host admission/drain evidence.
  Bridge tests prove rejection/drain; bounded observation is not a global safety proof.
- The queued-call fixture allows queue rejection or HTTP rejection after revoke; it does not instrument queue entry.
- A failed call append prevents execution. A failed result save after a committed tool cannot undo that side effect.
- Keep the inherited conservative Vietnamese scope refusal. No business-rule change is approved here.
- Application allowlisting is not an OS sandbox. Only the pinned Windows binary is qualified.

Next action: finish live/manual evidence and close only gates whose dependencies pass.
Downstream integration remains gated by G-003. No commit, push or external publication occurred.

## Owner smoke update — 2 November 2026

The owner reported that all supplied Task 003 smoke cases passed before committing this change.
Accepted scope: outline before confirmation, two-slide generation, slide-two-only edit,
Chat isolation, Stop, and reload/restart without replay.
This supersedes the outstanding six-case smoke requirement and records a successful manual presentation run.
It does not erase the earlier failed automated presentation run or establish its root cause was fixed.
No exact manual SHA, browser version, selected model ID, itemized output or API HTML/revision comparison was supplied.
Do not infer killed-Host recovery, exact publication-boundary cancellation, the broader manual matrix,
remaining G-002 protocol qualification, or new automated command results from this confirmation.
The bounded smoke/test change is ready for the owner to commit. G-003 remains NOT VERIFIED.

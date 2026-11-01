# TASK-001 — Handoff

Updated 2 November 2026. Codex executed A/B/C as one editor and integrator.
Acceptance owner: repository owner, confirmed in this conversation. A PASS; B PASS; C PASS.
G-001: **PASS / COMPLETE**, based on automated evidence and owner-confirmed manual smoke PASS on 2 November 2026.
Earlier pending/failure notes below are historical; the closure record at the end states the current status.

## Candidate and scope

Starting branch: feat/v2-opencode, HEAD 4511be5a2ea42ad46aaa0d74c1dee64fd8d31c21; initially clean.
Candidate: that commit plus the uncommitted files identified by hashes in [evidence.json](evidence.json).
POC source: poc/opencode-integration at 092b799. Its V1/V2 documentation edits were excluded.
The owner authorized the bounded opt-in port through existing public interfaces.
Permanent package boundaries, distribution and default-backend changes remain proposals or later work.
No commit, push, shared-data change or Issue publication occurred. Historical V1/V2 records remain unchanged.

## Ownership and contracts

One editor executed all lanes; no concurrent file owners.

| Lane | Files |
|---|---|
| A | apps/local-web/src/opencode/{agent,config,mcp-bridge,process}.ts; apps/local-web/src/{web-request,index,cli,provider-settings}.ts; apps/local-web/package.json; package.json; pnpm-lock.yaml; scripts/test-opencode.mjs; docs/development/opencode.md |
| B | tests/opencode-client-contract.test.mjs; tests/opencode-browser.test.mjs; manual checklist below |
| C | tests/opencode-agent.test.mjs; tests/opencode-process.test.mjs; tests/opencode-tool-isolation.test.mjs; tests/opencode-integration.test.mjs; tests/fixtures/opencode-phase-tools.mjs |
| Integrator | Group README, subtask status, handoff, evidence; version README, DECISIONS and PROGRESS |

LocalWebOptions.openCode = { executable } and --opencode-executable explicitly select OpenCode.
Omitting them keeps the custom runtime. Unsupported selections fail admission without another backend attempt.
Only the pinned Windows x64 CLI and Gemini path are qualified.

Public AgentHandle, SendOptions, TurnResult, ToolRegistry and SessionStore contracts do not change.
OpenCodeAgentHandle.open checks binary hash, tool schemas and session.
send admits one turn, records ordinary input once and respects continuation and Host working context.
history reads DeckAgent history; dispose aborts and awaits active work.
Each send uses a fresh native session and private configuration. Native IDs identify executions, not Chats.

Host still owns outline confirmation, permission approval and presentation staging.
DeckService still checks publication scope and revisions.
Only the legacy branch loads the custom runtime plugin; Cordis remains installed.
No browser source, Host routes, DeckService, business rules or database schemas changed.

MCP uses existing primitive-argument schemas, serialized dispatch and sanitized failures.
Example: probe arguments {"value":"fail"} return isError with stable TOOL_FAILED.
The live model then calls {"value":"recover"} and receives RECOVERY_RESULT_CONFIRMED.
Invalid types, unexpected fields and denied tools cannot execute their handlers.
Wrong/cross-request tokens and revoked admission return HTTP 403.
Stop revokes admission, aborts handlers and drains the bridge before disposal completes.

## Phase fixtures

Independent fixture: tests/fixtures/opencode-phase-tools.mjs.
Actual Host/CLI provider declarations were captured for each row; all names have deckagent_ prefix.

| Phase | Tools |
|---|---|
| Ordinary conversation | read_file, write_file, propose_outline, ask_clarification |
| Outline proposal | read_file, propose_outline, ask_clarification |
| Scoped publication | read_file, write_file, read_slide, publish_slide |
| Unresolved edit scope | read_file, read_slide, ask_clarification, resolve_slide_scope |

Probe capture contains exactly deckagent_probe for the target model; the auxiliary request contains no tools.
Capture endpoints intentionally reject inference. This proves declarations, not model behavior.
Existing-proposal review and every blocked-scope variant were not individually captured.

## Verification

Windows x64; Node 22.19.0; pnpm 11.28.5; installed Chrome headless.
OpenCode 1.19.5 SHA256: d7b473388cb62555970e400ce54cdfb6d6573608beea6f8fdf382cd1a698a3fa.
MCP SDK 1.26.0; real model google/gemini-3.1-flash-lite.
Credentials came from optional .env, never copied into fixtures or evidence.
All new application/browser profiles belong to tests. Existing user profiles and project files were not used.

| Check | Result and limit |
|---|---|
| Build, typecheck, lint | PASS |
| Format | 12 new source/test files PASS; four edited legacy files still fail full-file format checks; HEAD formatter comparison confirms existing drift |
| Offline frozen lockfile validation | PASS with --lockfile-only; not a fresh install |
| test:opencode | 11 PASS, 4 intentionally skipped CLI tests; no cloud inference |
| test:opencode:cli | 16 PASS, zero skips, including the four Host-phase captures |
| test:opencode:live | 3 PASS, zero skips: MCP error/recovery, active Stop, full presentation flow |
| Affected legacy suites | 173 PASS, zero skips; full command in evidence |
| Existing browser smoke | 8 PASS with legacy fixtures |
| OpenCode browser smoke | PASS: real CLI/provider fixture, Send, completion, Stop, reload, no duplicate or inference replay |
| Native-tool isolation | PASS for tested application config: actual provider requests contain only granted tools |
| Configuration bypass | PASS: real CLI ignores hostile project config/plugin; preflight rejects extra MCP/plugin/agent-permission mutations |
| Stop | PASS: live tool abort, zero mutations, late admission denied; runner kills parent/child; no late revision in 2 seconds |
| Session/persistence | PASS for POC subset: separate Chats, unique native sessions, saved history/deck after restart |
| Owner manual smoke | Owner-confirmed PASS on 2 November 2026; no itemized steps, browser version or exact manual SHA supplied |

Legacy checks cover custom runtime/Cordis, providers/catalog/switching, sessions, files, Host/client,
outlines, deck publication/recovery/editing, workspace/import, concurrency and permissions.
Existing SQLite experimental and vendor dependency-cycle warnings remain.

## Failures and retests

1. Sandbox tests failed with spawn EPERM. Authorized execution outside that restriction passed.
2. Offline frozen install refused module-directory removal without a TTY.
   Existing dependencies built successfully; frozen lockfile-only validation passed.
   A fresh checkout install is unverified. No module directory was forcibly purged.
3. New regression: POC revocation during activity persistence could still dispatch a tool.
   Added admission checks before append and dispatch; regression PASS.
4. Tentative __proto__ rejection assertion was incorrect: MCP SDK normalizes that key before dispatch.
   Replaced it with an unexpected ordinary field that reaches ToolRegistry and must fail closed-schema validation.
   Argument conversion preserves own entries. No raw special-key protocol-error guarantee is claimed.
5. Browser fixtures initially omitted model selection/input events and did not submit work.
   Corrected fixtures follow the current UI; retests PASS without UI changes.
6. Client assertions initially expected an unknown error code and activity from immediate provider rejection.
   Tests now check HTTP errors separately and use a streaming provider fixture for activities.
7. Replaced the POC SDK transport cast with typed public Transport callbacks.
   Strict optional-property checks remain enabled; CLI/live retests PASS.
8. Full-file format checks fail for cli.ts, index.ts, provider-settings.ts and web-request.ts.
   Each HEAD version also changes under the same formatter, after newline normalization.
   Their existing layout was retained to keep the selective port reviewable; new modules/tests pass formatting.

## Limits and next owner

Application permissions are not an OS sandbox. CLI and MCP implementations remain trusted executables.
Extra MCP/plugin/agent mutations are validator negatives; project config/plugin canary is a real CLI test.
Exhaustive malicious executable, detached-process and future-version containment is not certified.
Tool capture, provider fixtures and live-model evidence remain separate.
Only Windows x64 and Gemini without unmapped settings are qualified.
Other protocols, native resume, long contexts and the full inherited acceptance matrix remain unverified.

The existing client turns OPENCODE_UNSUPPORTED_PROVIDER into HOST_REQUEST_FAILED.
Provider parity work must decide an actionable message without weakening admission.
Native directories stay private; archive sanitized summaries, not entire native logs/databases.
Tests retain disposable artifacts under .local-only. No cleanup or data migration was added.
Central version pointer and historical progress remain unchanged. GitHub Issue remains unpublished.

Acceptance owner uses a separate profile and records browser version, tester, date and candidate hashes:

- [ ] Browser/model: propose two slides; verify none exist before confirmation.
- [ ] Confirm and publish both; edit only slide two; compare slide-one HTML/revision and slide-two changes.
- [ ] Check activity states and request controls; Stop active work and verify no subsequent tool/revision.
- [ ] Switch Chats, reload and restart; verify isolation, history/deck and no inference replay.
- [ ] Review the proposed production seam; record owner acceptance.

At this earlier checkpoint, B was AWAITING MANUAL and G-001 was NOT VERIFIED; the closure record below supersedes that status.
Provider/session parity is the next implementation group after acceptance.
Independent preparation can use these contracts now; its integrated gate still depends on G-001.

## Manual-test launcher follow-up

The owner requested simpler repeat testing. Added scripts/start-opencode.mjs and package command start:opencode;
updated the runtime guide. It builds with supported Node, selects the existing binary and keeps the manual profile.
--fresh selects another profile without deleting earlier work. --check and --help never start inference.
Prerequisite checks select local Node 22.19.0; fresh/default profile selection, help, lint and format pass.
Sandbox Node-version subprocess probes initially failed with EPERM; the launcher now reports that restriction explicitly.
Normal authorized subprocess checks passed. Full interactive launch and Ctrl+C are not requalified by this follow-up.
The earlier source hashes describe the qualification candidate before this helper; evidence followUps records later file hashes.
G-001 remains NOT VERIFIED.

## User manual report: scope refusal and unassigned tools

The user reported successful outline/confirmation messages, followed by refusal to edit slide two.
The exact browser version and acceptance candidate were not supplied; this is not a complete manual acceptance record.
The supplied test prompt contained "thêm dòng chữ" and "Không tạo thêm slide".
The existing editingScopeBlocked guard rejects either keyword anywhere, leaving no authorized slide IDs
and withholding resolve_slide_scope. Deterministic reproduction returns blocked=true and scope=[].
The prompt "Chỉ sửa slide 2: hiển thị dòng chữ TEST_SLIDE_2." selects only slide two.
The assistant's additional screenshot/API-comparison instructions were for the tester, not part of the Agent prompt.
The guard was not relaxed in this adapter fix. The addition/negation false positive remains unresolved.

A read-only check of the manual profile found five tool results matching bare Activity IDs,
and zero matching the client's required tool-prefixed IDs. A regression test failed with
"Tool activity must match the existing client history join" before the adapter fix.
The bridge now emits tool-<call-id> for running and terminal activities, retaining call IDs in tool history.
No UI, business rule, schema or saved manual data changed. Old orphaned activities are not retroactively rewritten.

Build, lint, changed-file formatting and default regression passed; CLI qualification passed 16/16.
CLI phase fixtures now include the supported Vietnamese edit and the existing blocked-prompt behavior.
The live presentation test now uses a Vietnamese edit and checks every tool Activity/history association.
New model retest results and file hashes are recorded in evidence.json, separate from earlier qualification.
Manual retest requires restarting Host with the rebuilt adapter. Use --fresh for a clean acceptance run;
reusing the previous profile keeps its old unassigned tool outputs. At that checkpoint G-001 was NOT VERIFIED.

## Owner acceptance and closure — 2 November 2026

The owner confirmed in this conversation: "ok đã pass smoke test, đánh dấu là hoàn thành đi".
Record this as owner-confirmed manual smoke PASS, together with the existing automated and live-model evidence.
TASK-001 A/B/C: PASS / COMPLETE. G-001: PASS. TASK-002 provider/session parity is unblocked.

The owner did not supply itemized manual outcomes, browser version or an exact manual candidate SHA.
Do not convert this confirmation into invented per-case test evidence or retrospective architecture approval.
The accepted scope remains the opt-in adapter and tested runtime baseline.
The scope guard's addition/negation limitation remains unresolved and goes to inherited baseline acceptance review.
Old saved Activity IDs were preserved; clean-install, other-provider and full compatibility checks remain outstanding.
No default-backend switch, Cordis removal, production migration, commit, push or Issue publication is included.

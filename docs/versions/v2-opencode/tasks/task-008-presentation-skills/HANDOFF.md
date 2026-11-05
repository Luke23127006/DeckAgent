# TASK-008 — Handoff record

Implementation checkpoint: 5 November 2026. G-008: NOT VERIFIED.
Inherited behavior remains as recorded in [the audit](../../BASELINE-AUDIT.md).

| Item | Record |
|---|---|
| Candidate SHA / dirty changes | Clean base 7403c90ff15f7343cba47f0cf4ae6125639a568d; uncommitted candidate, no commit/push |
| Named A / B / C / integrator | Codex, sequential implementation |
| Contract and exact file ownership | [CONTRACT.md](CONTRACT.md) |
| Producers/consumers and compatibility | New standalone entries and product Skill; existing Web/public domain contracts unchanged |
| Automated commands/results/artifacts | Stdio MCP, clean install and 30 affected regressions PASS; evidence.json records final results |
| Live model/protocol/CLI/OS/Node/tester | Gemini gemini-3.1-flash-lite, native Gemini, OpenCode 1.19.5, Windows x64, Node 22.19.0, Codex |
| Manual and negative scenarios | Automated confirmation/scope/session/revision/unknown-tool denials PASS; owner manual pending |
| Data/profile and preservation checks | Temporary dedicated profiles; no user data/source changes |
| Lane A / B / C | Implemented; focused checks PASS; full acceptance pending |
| Integration G-008 | NOT VERIFIED |
| Failures/limits/retest owner | Initial full live timeout retained; focused edit and later full retest PASS. Owner manual pending. |
| Next action / downstream consumer | [Manual acceptance](MANUAL-ACCEPTANCE.md), extended qualification and earlier gates |
| GitHub Issue | Unpublished; authorization required |

Append dated results and retests without deleting failures. Never include credentials or private user material.

## Delivered behavior

The owner selected standalone OpenCode CLI. [ADR 0008](../../../../adr/0008-external-presentation-skill.md)
records the bounded integration; permanent distribution and other host/provider decisions remain open.
Product SKILL.md and installation guide live outside repository coding skills.
The existing app package builds external-cli.js and external-host.js. No new dependency, package, schema or agent loop is added.

external-cli runs inspect, operator confirm or stdio MCP. The profile/Chat/version/slide grant comes from operator arguments.
Model tools cannot confirm or choose a different Chat. Before confirmation, only state/read/proposal tools exist.
After confirmation and explicit grants, existing domain publication and controlled patch operations execute.
Proposals persist as drafts immediately; they do not imply completed model work or user confirmation.
The separate operator command confirms an exact outline ID/version through DeckService.

external-host launches pinned OpenCode directly, without Web Host or OpenCodeAgentHandle.
It reuses isolatedEnvironment, providerConfiguration and runOpenCode for settings, provider and process-tree cancellation.
It installs only the product Skill into a fresh configuration directory, checks native version and resolved configuration,
and denies native tools except the named read-only Skill loader. Existing production runtime permissions are unchanged.
Native shell/files/network, inherited plugins, extra MCPs/agents and project settings are unavailable.
The host checks starting authority before model invocation. JSON events stream; failures emit only static stage diagnostics.
No raw provider stderr/configuration is logged. The known key is redacted from events.

## Qualification and preserved failures

Real stdio MCP tests cover tool discovery, publication before confirmation, absent confirmation tool,
operator confirmation, scoped publication/editing, duplicate receipts, stale edits and cross-Chat argument denial.
Slide-one HTML/revision and the other Chat remain unchanged. Thirty affected regressions pass.

Clean installation copied 192 source files into a fresh local directory, excluding .env, profiles and node_modules.
An offline frozen-lockfile install with install scripts disabled succeeded, followed by build and MCP acceptance
against that installation's executable/dependencies. This is a cached offline installation test, not a public registry release or fresh-network download proof.

The initial full live test loaded the Skill, proposed an outline, confirmed it through the operator command and published two slides.
Its editing phase did not complete within the host deadline. That full test remains FAIL in task008-live.log.
The underlying cause was not established; no claim of a provider/key defect follows.
Streaming/static stage diagnostics were added to preserve progress on later failures.
A focused actual OpenCode/Gemini edit of a seeded deck passed in task008-edit-live.log:
native skill, presentation_state, read_slide and patch_slide completed; slide-two heading changed, slide one stayed byte/revision-identical.
This focused result does not erase the failed full scenario.
The later full retest passed in task008-full-retest.log in about 65 seconds.
It loaded the Skill on all three sends, proposed/confirmed/published two slides and patched slide two while preserving slide one.
No automatic retry was added. The initial timeout remains a reliability observation with unconfirmed cause.

The live Skill load is an actual native skill activity, not merely a config/file audit or injected system prompt.
Live tool-execution observations contain only skill and the bound MCP names.
Provider-declaration capture for the additional native Skill-loader exception was not performed in this task;
config audit and executed-tool observations do not replace that wider isolation evidence.
Application controls are not an OS sandbox. The raw stdio entrypoint assumes an operator-controlled, appropriately restricted host.

## Limits and next acceptance

- Dedicated external profiles only. There is no Web admission coordinator; concurrent use of the same Web Chat is not qualified.
- The external contract covers outline, confirmation, publication and text/layout edits. Materials/image acquisition/PDF/Web history are not exposed.
- Existing image/export features remain in the app; this Skill does not grant their absent tools or fabricate results.
- The standalone convenience host currently configures Gemini only. Other hosts/providers/OSs are unqualified.
- Native session history is execution-local. Deck/outlines persist; no Web history or context checkpoint is synthesized.
- Stop reuses the earlier process-tree helper; a fresh external cancellation/adversarial campaign is still required for extended acceptance.
- Ready receipts are authoritative; process exit alone does not prove that the requested slide work completed.
- Skill instructions grant no authority. Do not enable unrestricted native tools to make a missing capability work.
- Entry gates G-003/G-004/G-006/G-007 and owner manual/extended acceptance remain as recorded, not automatically PASS.

Run the product guide/manual checklist on a dedicated profile. Record exact candidate, host/model versions and itemized results.
Do not publish an Issue, switch default runtime, delete legacy dependencies or commit/push without a separate instruction.

## Owner-requested agent smoke

Agent-executed smoke PASS on 5 November 2026, at the owner request. Both pnpm test:presentation-skills and pnpm test:presentation-skills:live passed with zero skipped cases. Real OpenCode 1.19.5/Gemini loaded the Skill, proposed an outline, accepted operator confirmation, published two slides and patched only slide two. Slide-one HTML/revision remained identical. Stdio negative checks also passed. This is agent-run functional smoke, not owner UX acceptance or complete G-008 qualification.

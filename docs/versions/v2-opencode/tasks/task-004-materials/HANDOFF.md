# TASK-004 — Handoff record

Opt-in implementation is in place. G-004: NOT VERIFIED; latest source-generation live run FAIL.
Inherited behavior remains as recorded in [the audit](../../BASELINE-AUDIT.md).

| Item | Record |
|---|---|
| Candidate SHA / dirty changes | `36335d9c6177f62869ade9dceafcd5913d97d68d` plus uncommitted source fingerprints in evidence.json |
| Named A / B / C / integrator | Codex; no parallel agents |
| Contract and exact file ownership | Separate-store A approved by owner; implementation contract in CONTRACT-PROPOSAL.md |
| Producers/consumers and compatibility | Host types/routes, app, client, tools and tests updated together; old text requests retained |
| Automated commands/results/artifacts | Latest material acceptance 24 PASS; other bounded results below |
| Live model/protocol/CLI/OS/Node/tester | Gemini 3.1 Flash Lite / native Gemini / OpenCode 1.19.5 / Windows x64 / Node 22.19.0 / Codex |
| Manual and negative scenarios | Automated negatives pass; owner manual acceptance NOT RUN |
| Data/profile and preservation checks | Temporary profiles only; old history and foreign-schema preservation tested |
| Lane A / B / C | Implemented opt-in / browser PASS, manual pending / fixtures and vision PASS, source-generation live FAIL |
| Integration G-004 | NOT VERIFIED |
| Failures/limits/retest owner | Unresolved OPENCODE_FAILED during confirmed generation; limits not approved as defaults |
| Next action / downstream consumer | Review bounded change, investigate/retest generation failure, owner manual acceptance and limit selection; G-003 still pending |
| GitHub Issue | Unpublished; authorization required |

Append dated results and retests without deleting failures. Never include credentials or private user material.

## Kickoff findings — 2 November 2026

The existing Host rejects unknown request fields and empty text; its 20 KiB JSON reader cannot carry uploads.
No delivered attachment store, material snapshots or parser modules were found. The Composer attachment action is disabled.
Old V2 source/attachment contracts and new package paths are proposals, not existing public APIs.
The canonical attachment rule leaves count and per-file size unset.

The proposed ADR keeps material modules app-local, adds separate profile storage and optional Host routes/contracts,
preserves Chat permission and filesystem identity checks, and qualifies image delivery before enabling it.
Task 004-A explicitly requires agreement on recoverable schema/API changes first.
Root AGENTS.md requires unapproved cross-component design choices to remain proposals recorded in docs/adr/.
An owner decision was requested in chat; no dependent production implementation proceeds without that decision.

The initial parser review cites upstream licenses and interfaces; exact versions, transitive dependencies,
resource bounds and model-visible image delivery remain unverified. No library was installed.
G-003 remains NOT VERIFIED; no scope waiver, new product limit, schema migration, commit or push is inferred.

## Implementation checkpoint — 3 November 2026

The kickoff record above is historical. The owner subsequently chose separate-store option A.
Implemented app-local material storage, authenticated streamed uploads, request-bound material snapshots,
workspace identity references, seven-format worker parsing, MCP read_material and Composer interaction.
No existing database schema, DeckService business rule or runtime default changed.
Intake stays disabled without explicit trial bounds. Native Gemini image input also requires saved image capability.

The Host exports optional MaterialOperations, MaterialInfo and MaterialLimits. AgentRequest adds optional attachmentIds/referenceIds.
MaterialInfo list projections include sent status. New-attachment count excludes material already sent earlier.
Unsent metadata can restore a draft without tab cache; interrupted client preparation stays rejected until removed.
Browser bytes never enter tab storage. Sent material cannot be removed through the unsent-material endpoint.
Discarded/orphan bytes are retained; no garbage collector is implemented.

References store identities rather than copies. Reads recheck the actual project root and target around approval.
Folder listing returns direct names only under Workspace Access; Provided Materials Only requires an exact file.
No folder grant or recursive implicit read is added. Upload count does not count references; reference reads use a separate safety bound.
PNG/JPEG bytes use Host-generated request-private CLI paths. The pinned CLI's effective tools remain MCP-only.
Other image protocols, unknown capabilities and legacy image input fail closed instead of switching models.

| Verification | Result / scope |
| --- | --- |
| Latest material acceptance | 24 PASS: storage, parsers, protected/blank PDF, resource negatives, identity races, drafts/browser, old profile and unsent ID isolation |
| Material image wire | PASS: exact PNG/JPEG payload hashes and only granted MCP tool declarations |
| Inherited regression selection | 116 PASS, 14 SKIP; skipped CLI/provider cases are not qualification |
| Inherited browser | 9 PASS; later targeted browser follow-up 2 PASS |
| CLI/MCP/process baseline | 13 PASS before final draft/count refinements |
| Direct contract follow-up | See evidence.json for exact final counts |
| First combined live run | PASS: Vietnamese/English source-to-slides and PNG/JPEG; source identifier was included in that earlier prompt |
| Stricter source live run | FAIL: identifier absent from prompt; Vietnamese DOCX outline and actual read succeeded, then confirmation/generation returned OPENCODE_FAILED; later language/image steps not reached |
| Independent live image run | PASS: PNG/JPEG interpretation with neutral filenames and no color in prompt |
| Resource benchmark | 20 synthetic cases; ten new small files accepted; 20 MiB text rejected by 1 MiB extraction bound |

Current commands: test:materials, test:materials:browser, test:materials:cli, test:materials:live.
The live runner separates source generation and image cases; it does not retry the failed generation automatically.
Manual instructions are in MANUAL-ACCEPTANCE.md. All model calls used environment/optional .env credentials; no key values are recorded.

Initial RED cases exposed missing upload routes, ZIP truncation/CRC acceptance, deep root replacement during approval,
draft loss without tab cache and counting previously sent attachments as new. Their fixes have passing acceptance coverage.
Worker entry placement and the first fixture's model request shape also required correction.
Keep the historical failures in evidence; do not present the first broad live PASS as final source-generation acceptance.

Build/typecheck and lint passed at recorded checkpoints. Existing large-file formatting drift was not rewritten.
Installed parser pins/licenses and exact technical limits are recorded in PARSER-REVIEW.md.
pnpm's automatically added release-age exception was removed; repository policy is unchanged.

Remaining: unresolved live generation error, owner manual acceptance, representative document/resource corpus,
approved product attachment limits, and entry gate G-003. Exact Stop during material publication and broader prompt-injection behavior
are not established by parser cancellation or the small source fixtures alone. This is application isolation, not an OS sandbox.
No commit, push, Issue publication or migration to the default runtime occurred.

## Manual follow-up — 3 November 2026

The owner confirmed manual smoke cases 1–4 PASS: source-to-outline/slides, attachment-only send,
rejected-file/draft behavior and Chat isolation. No exact manual SHA, browser/model details or itemized artifacts were supplied.
This records a later manual generation success; it does not erase the failed automated generation attempt.
Case 5 is not accepted: the owner saw a rejected reference before any approval.
A browser reproduction confirmed that MATERIAL_REFERENCE_UNAVAILABLE incorrectly showed generic file-corruption wording.
The client now explains project-folder/reference lookup failure and asks the user to check the workspace/path and re-add the reference.
Targeted browser RED then GREEN passed; naming an existing reference remained ready without starting inference.
No permission or filesystem guard was relaxed. The actual manual workspace path/file identity still needs confirmation;
the suggested example D:\DeckAgentManual\source did not exist when checked. No source contents were read.
Rebuild/restart the same profile to load the updated client assets. G-004 remains NOT VERIFIED.

Further reference diagnosis: read-only metadata showed that the default manual profile has no project workspace,
while the earlier fresh profile holds the owner's source workspace. The file exists directly under that source root;
adding the root directory name again refers to a nonexistent nested file. No source contents were read or profiles edited.
The launcher now accepts explicit --data-dir and refuses combining it with --fresh.
Reference creation now reports MATERIAL_REFERENCE_WORKSPACE_REQUIRED when a Chat has no available project folder;
the client gives a specific action instead of a generic update failure. Permission checks are unchanged.
Targeted API/browser checks PASS 2/2; launcher --check selects the earlier fresh profile without starting Host/model work.
The restart guide is corrected: omitting --fresh alone does not select the previous generated profile.
# Matching file-reference path follow-up (2026-11-03)

The owner reported `MATERIAL_UNAVAILABLE` for a ready file reference. Read-only
request metadata confirmed that the model supplied both a valid material ID and
the same project-relative file path. The file-reference reader rejected any path
before reaching approval. No source contents were read during diagnosis.

The reader now accepts an optional path only when its validated relative segments
match the stored reference. The target still comes from the stored reference;
ownership, request membership, identity checks and file approval remain required.
The tool description tells the model to omit path for file references.

The targeted pinned-CLI/Host/MCP regression failed before the change and passed
after it: deny prevents content access, allow-once permits the selected file, and
a different path stays denied. This uses a local provider fixture, not a live
model. Logs: `.local-only/task004-reference-path-red.log` and
`.local-only/task004-reference-path-green.log`. TypeScript and bundle builds pass.
Manual case 5 still needs a retry; G004 remains NOT VERIFIED.

Owner subsequently confirmed reference/permission case 5 PASS on 3 November 2026 after restarting with the matching-path fix. This supersedes the pending manual retry above. No new automated runs or manual artifacts were supplied. Remaining manual coverage and G-004 are unchanged.

Owner confirmed the image-reading manual smoke PASS on 3 November 2026. The tested format was not supplied, so separate PNG and JPEG manual PASS is not claimed. Restart and Stop manual checks remain unconfirmed; G-004 and its prerequisites remain unchanged. No automated tests were rerun for this status update.

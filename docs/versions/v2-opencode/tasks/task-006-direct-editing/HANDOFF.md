# TASK-006 — Handoff record

Implementation checkpoint: 4 November 2026. Code and automated subset complete;
owner manual pending. G-006: NOT VERIFIED. G-003 remains pending.
Inherited behavior remains as recorded in [the audit](../../BASELINE-AUDIT.md).

| Item | Record |
|---|---|
| Candidate SHA / dirty changes | 114dfd6 plus local implementation; fingerprints in evidence.json |
| Named A / B / C / integrator | Codex, one implementer across responsibility lanes |
| Contract and exact file ownership | CONTRACT.md; accepted ADR 0006, owner option A |
| Producers/consumers and compatibility | DeckEditor, optional Host routes, canvas editor and MCP tool updated together; existing HTML/revisions/schema retained |
| Automated commands/results/artifacts | Domain/Host, browser, pinned CLI and affected regression pass; details below |
| Live model/protocol/CLI/OS/Node/tester | Gemini gemini-3.1-flash-lite, native Gemini protocol; Windows x64 OpenCode 1.19.5; Node 22.19.0; Codex |
| Manual and negative scenarios | Owner NOT RUN; automated stale/scope/injection/idle/sandbox checks PASS |
| Data/profile and preservation checks | Disposable synthetic profiles only; no original user data or project writes |
| Lane A / B / C | IMPLEMENTED / AWAITING MANUAL / AUTOMATED AND LIVE SUBSET PASS |
| Integration G-006 | NOT VERIFIED |
| Failures/limits/retest owner | Initial live single-revision assumption failed; retest below. Owner/integrator to accept manual and pending entry gate |
| Next action / downstream consumer | Manual smoke; image/export and Skills can reuse the public patch contract |
| GitHub Issue | Unpublished; authorization required |

Append dated results and retests without deleting failures. Never include credentials or private user material.

## Delivered behavior

HTML is canonical. DeckService derives plain-text leaf descriptors from parse5
source locations, then applies bounded text/layout edits to the exact immutable
base. Other HTML ranges keep their bytes. A targeted style attribute may be
requoted/escaped while preserving its original declarations and appending approved
overrides. No whole-document serialization or automatic legacy conversion occurs.

editSlide reuses publish: confirmed outline/slide identity, expected revision,
transaction, safe HTML policy, immutable history, idempotent edit ID and invalidation
notices. Retry uses the original immutable base before the publication receipt
check, so an identical completed command stays idempotent. Another command with
the same ID conflicts. Cancellation is checked through the existing publication
path. Direct Host save also shares synchronous Chat admission; running/awaiting
work refuses it without blocking another Chat. Preview creates no revision.

Canvas adds an element selector, plain-text editor, numeric/layout controls,
sandboxed draft preview, explicit save and actionable conflicts. It keeps unsaved
drafts per Chat/slide in memory and never replaces them after an SSE conflict.
Discard/reload is explicit. Saved content survives reload/reopen. The preview
keeps empty sandbox, opaque origin and restrictive CSP. Original HTML is not
inserted into the application DOM. Test-only DevTools attaches to Chrome's
out-of-process iframe targets to measure actual computed layout.

MCP patch_slide uses the same domain method with Host-captured allowedSlideIds.
read_slide provides revision/hash/node metadata. Scope, invalid edit, unsupported
HTML and stale revision failures return fixed ToolFailure diagnostics. The existing
full-HTML write/publish path stays for generation and requests outside patch
operations. The prompt prefers patches for eligible text/layout changes. Byte
preservation within a slide is guaranteed by patches, not arbitrary replacement.

## Verification and evidence

Logs are under .local-only and contain synthetic data or fixed safe metadata only.
No API key is included. Counts overlap across suites and follow-ups.

| Check | Result | Evidence |
| --- | --- | --- |
| First public-interface test before implementation | RED: editableSlide missing | task006-patch-red.log |
| First patch slice | 1 PASS | task006-patch-green.log |
| Domain and authenticated/idle Host scenarios | 3 PASS | task006-domain-host.log |
| Deck/publication/client/model/Host/recovery/outline/context regression | 53 PASS, zero skipped | task006-regression.log |
| Direct editor and existing material browser interactions | 3 PASS | task006-browser-final.log |
| Pinned CLI direct -> MCP -> direct, wrong scope/stale base | 1 PASS | task006-cli.log |
| Final domain/Host/browser checkpoint | 4 PASS | task006-final-domain-browser.log |
| Explicit CLI command and retained full-HTML workflow | 1 PASS each | task006-final-cli.log, task006-baseline-cli.log |
| Initial real Gemini attempt | FAIL: expected one new revision, observed two | task006-live.log |
| Real Gemini follow-up | PASS: read_slide + successful patch_slide; exact other bytes preserved; direct edit again and restart | task006-live-followup.log |
| TypeScript/bundle, lint and explicit formatting | PASS at recorded checkpoint | evidence.json |

The live test initially assumed exactly one AI publication. The contract permits
multiple valid patch transactions. The test now requires every new revision to
have a successful patch receipt, deduplicates identical receipts, forbids
write_file/publish_slide for this specific text-change scenario, and compares exact
final HTML to the independently expected replacement. Idempotent same-ID behavior
remains a separate domain assertion. No safety or byte-preservation check was
removed. The follow-up actually used one patch; the initial extra revision's cause
was not captured and remains unconfirmed. It is not labeled a provider/key failure.

The browser fixture initially looked for opaque frames in the parent frame tree.
Chrome exposes them as separate targets. Test-only target sessions fixed that
inspection; no application CSP or sandbox flag was changed. Earlier fixture
syntax/inspection failures remain recorded here. Final computed style was 28px
and centered. A canary CSS URL received zero requests in original and draft frames.

The live deck plan and starting HTML were trusted synthetic fixtures, not a new
live outline-generation qualification. This test covers actual selected-model
editing and persistence; it does not close historical source/outline failures.

## Files, dependency and compatibility

Added slide-edit.ts in the existing deck package, slide-editor.ts in the client,
patch-slide.ts in presentation tools, four direct-edit test files and task/decision
documents. Updated deck contracts/service/manifest, Host contracts/routes/admission,
client deck-client/canvas, presentation read tool, app wiring/edit prompt, fixed
tool errors, root test scripts/lockfile and the shared browser fixture's optional
DevTools session support. See evidence.json for exact source fingerprints.

parse5 8.0.0 is MIT; entities 6.0.1 is BSD-2-Clause. Both are lockfile-pinned. parse5 is a
server dependency; the browser imports only public deck types. Installed package
metadata has no install hook. No supply-chain/build-policy exception was added.
The existing 24 deprecated review-tool subdependencies were left unchanged.
Dependency API reference: [source location and scripting options](https://parse5.js.org/interfaces/parse5.ParserOptions.html).

No existing database schema or runtime default changed. Legacy HTML remains
viewable; unsupported editor blocks are explicit. Both legacy and OpenCode paths
remain available. No Cordis removal, shared-data mutation, commit, push or issue
publication occurred.

## Limits and next action

- Owner manual has not run. G-006 remains NOT VERIFIED, including its G-003 entry
  dependency. Use MANUAL-ACCEPTANCE.md; do not infer acceptance from fixture PASS.
- Only eligible plain-text leaf blocks are editable. Rich inline markup, foreign
  content and ambiguous parser recovery are not normalized into a new format.
- Layout overrides obey existing CSS flow. Complex/inline/positioned elements may
  not show every margin/alignment effect. Preview is explicit; no free drag/drop.
- Original selected style declarations remain, followed by new overrides. Repeated
  layout edits can grow that attribute up to the existing HTML size limit.
- Unsaved drafts are in memory only. Reload drops them; saved revisions persist.
- No exhaustive provider, renderer, prompt-injection or OS sandbox proof is claimed.
  Full-HTML generative edits retain their earlier semantic-preservation limits.
- Undo/design systems/collaboration, image assets and export are not implemented by
  this change. Future consumers reuse the public DeckEditor contract.

Owner acceptance checkpoint (4 November 2026): the supplied three-step basic manual smoke is PASS: direct text/layout editing and save, reload, then AI patching of slide two while preserving visible layout and slide one. This supersedes the earlier pending basic-smoke status. It is aggregate owner confirmation without separate manual HTML/revision artifacts or exact candidate/browser/model. Optional conflict/busy manual checks and G-003 remain pending; G-006 stays NOT VERIFIED. Earlier live failures and automated retests remain recorded. No production code changed or tests reran for this status update.

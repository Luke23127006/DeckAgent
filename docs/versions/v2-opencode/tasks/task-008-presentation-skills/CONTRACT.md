# External presentation contract 1

The owner selected standalone OpenCode CLI. Codex is the single implementer across A/B/C; no parallel file ownership.
Decision: [external presentation Skill](../../../../adr/0008-external-presentation-skill.md).

| Lane | Files | Responsibility |
| --- | --- | --- |
| A | apps/local-web/src/external-presentation.ts | Registry, fixed Chat/scope, domain calls |
| A | apps/local-web/src/external-cli.ts | stdio MCP, operator inspect/confirm, lifecycle |
| A | apps/local-web/src/external-host.ts | Isolated standalone OpenCode launcher; no agent loop |
| A | scripts/build-workspace.mjs, package.json, scripts/test-opencode.mjs | Entrypoints and commands |
| B | product-skills/deckagent-presentation/SKILL.md, README.md | Product instructions and installation |
| C | tests/presentation-skills-integration.test.mjs, presentation-skills-live.test.mjs | Protocol negatives and real host/model evidence |
| A | task documents, version progress/decisions, ADR | Decision and handoff records |

No new package, dependency, database schema or Web behavior change.
The profile is an explicit application data root, not a project directory exposed to tools.

## Transport and authority

stdio MCP starts with `--profile ABSOLUTE --session ID --action serve --version N --slides ID,ID`.
The deck version must match at admission. Slide IDs must exist in the bound deck.
The registry never accepts a caller-selected profile/session. The operator-controlled process is the transport authority.
An unrestricted host with native filesystem access cannot claim equivalent isolation.

The operator separately runs inspect, reads the proposal, then confirms exact outline ID/version.
No confirmation tool exists. Model text never grants writes. Stop/restart is required to change the captured grant.
Dedicated external profiles avoid competing with the Web admission controller.

| MCP tool | Input | Result / checks |
| --- | --- | --- |
| presentation_state | `{}` | `{contractVersion:1,outline,deck,authorizedSlideIds}` |
| read_slide | `{slideId}` | Existing EditableSlide with revision/baseHash/nodes; bound Chat only |
| propose_outline | `{proposal:"JSON"}` | Validated OutlineProposal with IDs/version; no deck publication |
| publish_slide | `{publication:"JSON"}` | Existing PublishedSlide receipt; confirmed outline, granted ID, revision, HTML policy and publication identity |
| patch_slide | `{edit:"JSON"}` | Existing patch handler and receipt; scope, baseHash/revision and edit identity |

Proposal JSON: `{overview,slides:[{title,content}]}`.
Publication JSON: `{outlineId,slideId,expectedRevision,publicationId,html}`.
Patch JSON remains the public DeckService SlideEdit contract. Wrong scope returns SLIDE_SCOPE_DENIED;
stale patches return SLIDE_REVISION_CONFLICT. Unknown/invalid calls use ToolRegistry's static sanitized failures.
The outer objects are closed and primitive-valued. Tool discovery excludes writes before confirmation and without a grant.

Proposals save immediately as drafts. This differs from the Web request-finalization staging boundary;
the external contract makes no claim that a saved proposal means a completed model response or user confirmation.
No external conversation history or Web request activity is synthesized.

The standalone host copies only the product Skill into its fresh config directory.
Native permission defaults deny; only the named Skill loader and presentation MCP names are allowed.
Config audit checks permissions, exact MCP, plugins and agent names before model invocation.
Version pin: OpenCode 1.19.5. Gemini credentials use the existing provider configuration and never enter Skill files.
JSON events stream to the caller; errors show only static stage diagnostics and the known key is redacted.
Stop reuses the existing process-tree cancellation helper. Already committed revisions remain saved.

The contract deliberately exposes creation and scoped text/layout edits only.
Materials, image import, PDF, Web history/context/admission and other hosts are not part of this first external interface.
No silent native fallback or automatic retry is provided.

# V2 OpenCode ? Scope

## Authority and outcome

The approved thesis proposal, `.local-only/??-c??ng-?ATN.pdf`, sections 2.2?2.5, is the product-scope authority.
The file was present and its pages 4?8 were read for this plan. It is local-only, not a distributed repository artifact.
Before team execution, the owner must provide an accessible approved copy or controlled reference. Do not invent missing requirements.
V1/V2 are implementation history. Their exclusion of direct editing and export does not exclude those thesis deliverables here.

The team has selected OpenCode in place of custom AgentRuntime/Cordis, as instructed by the owner.
This is a runtime change within the existing application. The POC is a technical starting point, not production acceptance.

## Selected deliverables

| Requirement from proposal | Existing foundation | Delivery task / gate |
|---|---|---|
| Clarify missing/conflicting instructions; expose assumptions (2.2, p4) | Outline interaction and clarification | TASK-003 / G-003; quality evaluation in TASK-010 |
| User confirms outline before slide generation (2.2, p4) | Host confirmation and immutable outline identity | TASK-001 and TASK-003 |
| Generate from text and TXT, MD, PDF, DOCX, PNG, JPEG, PPTX (2.3.2, p5) | Text prompts and restricted UTF-8 reads only | TASK-004 / G-004 |
| Preview, controlled conversational editing, preserve unrelated content (2.2?2.3, pp4?5) | DeckService, canvas and scoped publication | TASK-003; TASK-006 strengthens direct/conversational consistency |
| Direct slide editing (2.2?2.4, pp4?6) | Preview only; no delivered visual editor | TASK-006 / G-006 |
| Local save, reopen and export (2.5, p8) | Persistent history, outline and deck; export absent | TASK-003 and TASK-007 |
| User-selected existing models and BYOK (2.2?2.3, pp4?5) | Four protocol adapters and saved settings | TASK-002 / G-002 |
| Images from Internet OR AI image services (2.3.3, p5) | No accepted acquisition workflow | TASK-007; choose one validated route, not both by default |
| Reusable Agent Skills and execution tools outside DeckAgent UI (2.2, 2.5, pp4,8) | Presentation tools; repository coding skills are not this deliverable | TASK-008 / G-008 |
| Context, state and error control (2.2, p4) | Host lifecycle and durable stores | TASK-002, TASK-003 and TASK-005 |
| Technical docs and measured evaluation (2.5, p8) | Existing specs/tests | TASK-010 / G-010 |

All selected deliverables above are required for this plan's final completion.
They are not made optional merely because old plans omitted them.
Vietnamese and English cases are required. One Chat owns one presentation.
Local data storage and explicit BYOK service use remain the operating model.

## Inherited commitments

Keep workspaces, private work roots, concurrent chat navigation, model selection, captured request settings, permission presets and step approval.
Keep Host APIs, ToolRegistry validation, DeckService identity/revision checks, outline confirmation and durable conversation records through the runtime transition.
Changes required by new direct editing, materials or export need explicit contracts and compatibility tests; this plan is not a ban on those necessary extensions.

V2 context projection/manual compaction remains selected as bounded completion work.
General-purpose public web search/fetch and a separate research settings product are deferred: they are not a prerequisite for materials, editing, Skills or export.
A narrow network adapter can be selected for images in TASK-007. Its authorization and privacy checks remain mandatory.
Default model IDs and attachment limits are not invented here. Existing unresolved product values remain unresolved.

## Exclusions and decisions still needed

The proposal explicitly excludes undo, a separate design-system feature and multi-user collaboration (p5).
No model training, cloud-hosted account platform, full OpenDesign daemon import or replacement UI framework is selected.
OpenDesign is an architectural reference (p6), not a required fork or a standalone runtime dependency.
The output format is not specified in the proposal: TASK-007 selects and validates a minimum export format before implementation.
Both PDF and editable PPTX are not automatically required. Direct editing must be usable and measured; its supported operations are settled in TASK-006.

Production OS coverage, binary distribution, provider compatibility and Skills target hosts need decisions in [DECISIONS.md](DECISIONS.md).
No missing deadline is inferred from the proposal's schedule. The plan uses dependency gates rather than invented calendar dates.

## Completion

G-001 through G-010 must pass with the evidence required by their tasks.
Functional implementation, historical acceptance, POC evidence and new migration verification are separate facts.
Fixture results do not replace live model runs. A green runtime smoke does not prove thesis quality or Skills portability.

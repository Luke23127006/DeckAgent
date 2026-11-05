# TASK-008 — Package reusable presentation Agent Skills

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-001 and G-003 for prototype; G-004, G-006 and G-007 for final gate**. Gate: **G-008**. Work status: AWAITING MANUAL; automated and full live retest PASS.

## Contract handshake

Product Skills include instructions and necessary execution tools using shared validated operations. Define versioned external contract, session/workspace authorization and host requirements. Repository coding skills are not the deliverable.

A records exact symbols, input/result/error samples and file ownership before parallel implementation.
B and C can prepare independent fixtures together. Integration waits for entry gates.
Proposed product, representation or package choices need a recorded decision before dependent code starts.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-008-A](TASK-008-A.md) | A | Reusable external tool access |
| [TASK-008-B](TASK-008-B.md) | B | Product Skill package and instructions |
| [TASK-008-C](TASK-008-C.md) | C | External integration qualification |

## G-008 acceptance

Install in at least one named compatible agent host outside DeckAgent UI. Real model creates and performs scoped editing with documented confirmation/authorization. Clean installation reproduces results without private developer paths; denied calls and non-target preservation verified.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.

## Implementation checkpoint

The owner selected standalone OpenCode CLI. Product instructions live in product-skills/deckagent-presentation.
The app-local stdio entrypoint uses DeckService and ToolRegistry without starting Web Host or a custom agent loop.
Confirmation is operator-only; Chat identity, admission version and slide grants are fixed at process start.
See [the contract](CONTRACT.md), [handoff](HANDOFF.md) and [manual checklist](MANUAL-ACCEPTANCE.md).
G-008 remains NOT VERIFIED; earlier gates and owner/extended acceptance remain open.

## Owner-requested agent smoke

Agent-executed smoke PASS on 5 November 2026, at the owner request. Both pnpm test:presentation-skills and pnpm test:presentation-skills:live passed with zero skipped cases. Real OpenCode 1.19.5/Gemini loaded the Skill, proposed an outline, accepted operator confirmation, published two slides and patched only slide two. Slide-one HTML/revision remained identical. Stdio negative checks also passed. This is agent-run functional smoke, not owner UX acceptance or complete G-008 qualification.

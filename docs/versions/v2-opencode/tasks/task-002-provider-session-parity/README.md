# TASK-002 — Restore provider and session compatibility

Integrator and implementation owner: Codex (A/B/C). Manual smoke acceptance: owner-confirmed PASS on 2 November 2026.
Entry dependency: **G-001 PASS**. Gate: **G-002 NOT VERIFIED**.
Work status: BLOCKED for final acceptance. Implementation and automated wire/session checks are complete;
Gemini manual smoke is owner-confirmed PASS. Live qualification for three other protocol families and extended effort/model-switch acceptance remain outstanding.
See [compatibility](COMPATIBILITY.md), [handoff](HANDOFF.md) and [evidence](evidence.json).
Use [the manual acceptance cases](MANUAL-ACCEPTANCE.md) for the remaining owner checks.

## Contract handshake

Capture provider/model/options/credentials once per request. Preserve saved IDs, selection and messages. DeckAgent session/request/execution/native IDs remain distinct. Fresh native sessions receive controlled history, never blind providerState replay.

A records exact symbols, input/result/error samples and file ownership before parallel implementation.
B and C can prepare independent fixtures together. Integration waits for entry gates.
Proposed product, representation or package choices need a recorded decision before dependent code starts.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-002-A](TASK-002-A.md) | A | Provider capture and history contract |
| [TASK-002-B](TASK-002-B.md) | B | Provider compatibility interaction |
| [TASK-002-C](TASK-002-C.md) | C | Protocol and long-history qualification |

## G-002 acceptance

Four protocol families have wire coverage and an explicit compatibility matrix; live runs cover each claimed release protocol. Unsupported options fail before work. Old history continues safely across model switches. Missing credentials leave relevant acceptance NOT VERIFIED.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.

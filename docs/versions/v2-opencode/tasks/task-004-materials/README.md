# TASK-004 — Complete source-to-presentation input

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-003**. Gate: **G-004**. Work status: IMPLEMENTED OPT-IN; acceptance pending.

Kickoff on committed Task 003 baseline `36335d9`; working tree was clean.
G-003 remains NOT VERIFIED; independent preparation does not close the entry gate.
Read the [contract proposal](CONTRACT-PROPOSAL.md) and [initial parser review](PARSER-REVIEW.md).
The owner selected separate-store option A on 2 November 2026. Storage, upload/reference APIs,
request snapshots, worker parsers, MCP projection and Composer interaction are now implemented.
Existing databases and runtime default stay unchanged. Intake requires explicit trial bounds;
no product defaults are invented. See [manual acceptance](MANUAL-ACCEPTANCE.md) and [handoff](HANDOFF.md).

## Contract handshake

Attachments are durable Chat-owned material; references retain source identity and are revalidated. Browser paths/document content grant no permission. Extraction returns provenance, warnings and bounded errors.

A records exact symbols, input/result/error samples and file ownership before parallel implementation.
B and C can prepare independent fixtures together. Integration waits for entry gates.
Proposed product, representation or package choices need a recorded decision before dependent code starts.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-004-A](TASK-004-A.md) | A | Material storage and request API |
| [TASK-004-B](TASK-004-B.md) | B | Attachment and reference interaction |
| [TASK-004-C](TASK-004-C.md) | C | Parsers and material projection |

## G-004 acceptance

TXT/MD/PDF/DOCX/PNG/JPEG/PPTX known-content cases pass ingestion. Live source -> outline -> confirm -> slides uses supplied facts in Vietnamese/English. Restart and cross-chat rejection pass. Corrupt/protected/partial inputs are explicit. Size/count limits need measured owner approval.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.

Manual checkpoint (3 November 2026): owner-confirmed smoke cases 1?5 PASS, including reference/permission after the matching-path fix. Other manual cases and gate prerequisites remain unverified; G-004 is not closed.

Owner confirmed the image-reading manual smoke PASS on 3 November 2026. The tested format was not supplied, so separate PNG and JPEG manual PASS is not claimed. Restart and Stop manual checks remain unconfirmed; G-004 and its prerequisites remain unchanged. No automated tests were rerun for this status update.

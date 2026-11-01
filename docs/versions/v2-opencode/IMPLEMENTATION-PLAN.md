# V2 OpenCode — Implementation plan

Scope: [SCOPE.md](SCOPE.md). Inherited work: [BASELINE-AUDIT.md](BASELINE-AUDIT.md).
Technical choices: [DECISIONS.md](DECISIONS.md). State: [PROGRESS.md](PROGRESS.md).
This plan does not execute migration or authorize publication.

## Ownership

A owns Platform/Host, shared contracts, storage/domain changes, application wiring and root manifests.
B owns Client/UX and user guides. C owns tools/provider adapters, security fixtures and evaluation.
These follow the V2 lanes. Names and Issue links are assigned later.
Each group has A/B/C tasks and a handoff. A resolves exact file ownership at kickoff.
Independent fixture work can start together after contract agreement. Integration waits for actual dependency gates.

## Delivery groups

| Group | Result | Dependencies | Gate |
|---|---|---|---|
| [TASK-001](tasks/task-001-runtime-foundation/README.md) | Port and qualify the OpenCode adapter | Recorded dev/POC baseline; production seam proposal reviewed | G-001 |
| [TASK-002](tasks/task-002-provider-session-parity/README.md) | Restore provider and session compatibility | G-001 | G-002 |
| [TASK-003](tasks/task-003-baseline-acceptance/README.md) | Accept inherited V1/V2 behavior on OpenCode | G-001 and G-002 | G-003 |
| [TASK-004](tasks/task-004-materials/README.md) | Complete source-to-presentation input | G-003 | G-004 |
| [TASK-005](tasks/task-005-context/README.md) | Complete bounded context and manual compaction | G-002 and G-004 | G-005 |
| [TASK-006](tasks/task-006-direct-editing/README.md) | Add direct editing with controlled revisions | G-003 | G-006 |
| [TASK-007](tasks/task-007-images-export/README.md) | Deliver images and usable export | G-003; G-006 before final artifact integration | G-007 |
| [TASK-008](tasks/task-008-presentation-skills/README.md) | Package reusable presentation Agent Skills | G-001 and G-003 for prototype; G-004, G-006 and G-007 for final gate | G-008 |
| [TASK-009](tasks/task-009-runtime-retirement/README.md) | Switch default and retire legacy dependencies | G-001, G-002 and G-003 | G-009 |
| [TASK-010](tasks/task-010-thesis-acceptance/README.md) | Evaluate and hand over the thesis product | G-001 through G-009; protocol preparation starts after scope review | G-010 |

## Order and parallel work

1. TASK-001 ports and qualifies POC code/tests, without copying its old-version documentation edits.
2. TASK-002 fills provider/session gaps. TASK-003 accepts inherited functions and pending permission behavior.
3. After G-003, materials (004), direct editing (006), image/export preparation (007), Skills prototype (008) and retirement (009) can progress where ownership permits.
4. Context (005) follows materials because checkpoints must represent source-backed requests. General web research is not a prerequisite.
5. Final image/export acceptance uses the direct-edit representation. Final Skills acceptance uses material, editing and asset/export contracts.
6. TASK-010 prepares the evaluation protocol early and accepts the whole product after all required gates.

This is a dependency graph, not ten mandatory serial sprints.
Avoid parallel edits to shared Host/client entry files. Qualify historical task IDs with V1 or V2.
The same numbers in this folder belong to V2 OpenCode.

## Migration controls

Keep OpenCode opt-in until baseline parity. Host retains Stop, sessions, approval, model capture and outline confirmation.
Only TASK-009 switches default and retires the old backend. Never silently repeat a failed request on another backend.
Use copies for data migration tests. Any schema change requires producer/consumer updates and recovery evidence.
Keep public package interfaces initially. Package moves, editor representation and external Skills entrypoint remain proposals until recorded.

POC dependency: MCP SDK 1.26.0. Reproduction pin: OpenCode Windows x64 1.19.5.
Executable SHA256: `d7b473388cb62555970e400ce54cdfb6d6573608beea6f8fdf382cd1a698a3fa`.
TASK-009 decides production distribution/platforms. Any changed pin needs isolation and cancellation requalification.

## Acceptance and handoffs

Use [task evidence rules](tasks/README.md) and group HANDOFF.md files.
Separate automated/manual results. A/B/C completion alone cannot pass integration.
Historical owner acceptance stays attributed, including missing manual SHA.
Publish Issues and update central version/ADR/spec pointers only in a later authorized change.

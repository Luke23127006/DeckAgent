# Materials kickoff: contract proposal

Candidate: `36335d9` (committed Task 003), clean working tree at kickoff on 2 November 2026.
Owner/integrator: Codex. The owner selected option A on 2 November 2026; the bounded implementation is now in place.
G-003 remains NOT VERIFIED despite owner-confirmed smoke PASS. G-004 is NOT VERIFIED.

## Decisions ready for review

The proposed cross-component decision is [Chat-owned material ingestion and source references](../../../../adr/0004-chat-materials-ingestion.md).
It is based on the actual Host request parser, Local Web composition, disabled Composer attachment action,
accepted storage separation, source permission checks and the old V2 attachment proposal.
It does not treat old proposed interfaces as delivered code.

| Choice | Recommendation | Why |
| --- | --- | --- |
| Storage/module placement | App-local materials modules, separate `materials.sqlite` and blobs | No new package; existing databases stay unchanged; old profiles open without conversion |
| Upload and send | Authenticated streamed upload; send only Chat-owned IDs and snapshot them | Current 20 KiB JSON route cannot carry documents; IDs do not grant authority |
| Source references | Persist identity/path metadata, read through current approval checks | Do not copy project files or grant permissions merely by naming them |
| Text extraction | Request-authorized `read_material` through existing ToolRegistry/MCP | Preserve the Host boundary instead of adding a second agent loop |
| Images | Qualify Host-controlled image copies via pinned CLI `--file` first | CLI flag is confirmed; vision delivery, model compatibility and isolation are not yet proven |
| Limits | Benchmark 10/request and 20 MiB/file before owner selects values | Both values remain unset in the product rule; no arbitrary release defaults |

## Proposed file ownership

Codex is the sole editor; A/B/C are responsibility lanes, not parallel agents.

- A: `apps/local-web/src/materials/` storage/reference/snapshot modules; Local Web composition;
  Host material contracts/routes/request validation; root test commands.
- B: client attachment/reference views, Composer integration, material client validation and browser tests.
- C: parser/worker modules within the app-local materials directory, parser/resource fixtures,
  request-local MCP projection and pinned CLI image qualification tests.
- Integrator: dependency/lockfile changes only after library/version/license review, evidence and handoff.

No dependency or production code changed during the original kickoff. Later implementation pins are in PARSER-REVIEW.md.
Folder references, corrupted/protected input, attachment-only send, restart, wrong-Chat IDs and Stop remain acceptance requirements.

## Next action

Owner agreement on separate storage is recorded in accepted ADR 0004.
Finish manual acceptance and resource/default selection after the bounded qualification below.
Keep G-003/G-004 open until their dependencies and full acceptance evidence exist.

## Implemented contract

`MaterialInfo`, `MaterialLimits` and optional `MaterialOperations` are exported by the Host package.
`MaterialInfo` uses `materialId`, `sessionId`, `originalName`, `kind`, `mediaType`, `sizeBytes`,
`status: preparing|ready|rejected`, `warnings` and optional `reason`.
`AgentRequest` adds optional `attachmentIds` and `referenceIds`; old text requests remain valid.
List returns `{enabled,limits?,items}`. Raw upload uses `Content-Type: application/octet-stream`
and a percent-encoded `X-File-Name`. No browser path selects a Host upload destination.

The request tool is `read_material({materialId,path?})`. The optional path names an exact child of a folder reference.
Workspace Access can list up to 100 direct names; Provided Materials Only requires an exact filename and existing file approval.
No folder grant or recursive implicit read is introduced. Reads recheck the actual project-root identity and target identity.

New attachments are checked against the explicit trial count. References use a separate metadata/read safety bound.
Previously sent Chat material remains available to later requests; unsent draft IDs are not available to an active request.
Snapshots commit only after Agent preparation succeeds, before execution. Sent material cannot be removed through the draft endpoint.
Removal unlinks unsent metadata; bytes remain until an explicit garbage-collection policy exists.

Only declared image-capable native-Gemini OpenCode requests can use uploaded PNG/JPEG bytes.
Reference images return an explicit text-tool limitation; upload the image for the qualified vision path.
Unknown capability, legacy backend or another protocol rejects image admission before inference.
Older Hosts reject the new request fields; there is no silent text-only downgrade or backend retry.

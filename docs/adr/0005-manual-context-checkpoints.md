---
status: accepted
---

# Manual context checkpoints at the OpenCode seam

## Verified starting point

DeckAgent keeps readable messages in SqliteSessionStore. OpenCode starts a fresh
native session per send. Its adapter accepts a Host-supplied promptContext without
replacing durable messages. Configuration sets compaction.auto and prune to false
and audits the resolved configuration before model work. No durable checkpoint or
manual compact operation exists.

## Owner decision

The owner selected option A on 3 November 2026. The common behavior below is the
implementation contract. Option B is recorded only as a rejected alternative.

Option A, recommended: the local application owns a separate context.sqlite in
the profile. Existing session, Web, deck and material schemas remain unchanged.
The application verifies Chat existence and checkpoint ownership. The store uses
an application ID, a schema version, integrity checks and atomic replacement.
Older executables ignore checkpoints and use full history. They cannot promise
the same model context; rollback never removes the checkpoint or messages.

Option B: add checkpoint tables through a SessionStore schema migration and expose
them through that package's public interface. Ownership is closer to messages,
but older executables reject the upgraded session schema. Rollback needs a
compatible executable or a pre-upgrade profile copy. Neither option deletes data.

The separate store also keeps byte-count observations of the last prepared system
prompt and tool schemas, scoped to Chat, selection and authoritative state digest.
These contain counts, not source text. They enable a labeled estimate; stale or
missing observations make total usage unknown. They never authorize a model call.

## Proposed behavior common to both options

- Only an explicit user action starts compact. Reject active or awaiting Chats;
  do not queue compact. Reserve admission for this Chat until finalization.
- Use the captured selected model through the existing OpenCodeAgentHandle, an
  ephemeral SessionStore and an empty ToolRegistry. No new inference loop.
- A compact request has a normal request ID, activities and cancellation. Reuse
  the existing Stop and process-tree drain. Keep other Chats usable.
- Read the previously projected context. Preserve instructions, source provenance,
  decisions, unresolved work and tool success/failure distinctions in the summary.
  Source text and historical calls remain quoted data, not permission grants.
- Commit only after success and cancellation checks, while the same Chat is still
  reserved. Compare the captured history digest, selection and checkpoint revision.
  Reject stale results. Failures, Stop and shutdown keep the previous checkpoint.
- The checkpoint records Chat, selection, covered message boundary, history digest,
  summary, revision and timestamp. Never append the summary as a user message or
  replace full history. Treat stored summary as quoted conversation data.
- Future requests use the summary plus newer messages. Keep the newest unresolved
  tool call/result group together; do not manufacture orphan results.
- Rebuild outline confirmation, current deck revisions, edit scope and material
  identities from authoritative Host stores. A summary cannot grant any permission.
- Model changes invalidate the active selection-specific projection; use full
  history until that selection has a valid checkpoint. Never reuse provider state.
- Show estimates as estimates. Provider token reports describe a completed model
  call, not current prompt occupancy. Missing capacity means no percentage.
- Include draft text and attachment contributions where measurable. Unmeasurable
  image/tool/system costs make the total incomplete; do not claim an exact total.
- Suggest compact at the existing 85 percent threshold only for a calculable
  estimate. A suggestion never starts model work.
- Keep native automatic compaction and pruning disabled. Qualify the pinned CLI
  overflow path with a loopback provider before claiming this behavior verified.

## Compatibility

Add optional Host contracts and client capability detection. Old Hosts keep text
and presentation requests usable and expose no Compact action. OpenCode stays
opt-in; legacy runtime behavior and package responsibilities remain unchanged.
No dependency, model, runtime default, attachment limit or permission preset changes
are proposed. These decisions do not establish token-accurate accounting or an OS
sandbox. Summary fidelity requires live evaluation as well as deterministic tests.

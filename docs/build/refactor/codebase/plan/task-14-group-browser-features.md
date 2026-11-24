# Task 14: Separate Browser transport from UI features

Read this file to learn the steps that separate browser transport from ui features.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `apps/web/src/browser/boot.ts (lines 1-1260)`.
- `apps/web/src/browser/index.ts`.
- `apps/web/src/browser/conversation-view.ts`.
- `apps/web/src/browser/deck-workflow-view.ts`.
- `apps/web/src/browser/host-client.ts`.
- `apps/web/src/browser/management-client.ts`.
- `apps/web/src/browser/deck-client.ts`.
- `apps/web/tsconfig.browser.json`.

**Files:**

- Move: each Browser file in the Placement table.
- Create: apps/web/src/browser/transport/index.ts.
- Create: apps/web/src/browser/features/{chats,deck,attachments,providers,research,workspaces,requests}/index.ts.
- Change: apps/web/src/browser/boot.ts and index.ts.
- Change: scripts/build-workspace.mjs, for Browser output entry paths.
- Change: tests/*.test.mjs, for moved Browser module imports only.

**Interfaces:**

- Preserves: HostClient, HostRequestError, ManagementClient, ManagementError, DeckClient, OutlineClient, BriefClient, ConfirmationClient, and current UI operations.
- Transport index exports only clients, transport errors, and wire decoding operations used by UI.
- Feature index exports only views and state operations used by boot or another feature.
- Preserves: the current generation counter, abort ownership, request reconnect cursor, draft queues, and confirmation identities.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A UI feature needs another feature's private module.
- A moved decoder accesses DOM or fetch.
- The feature graph develops a cycle.
- Extracting boot state needs a choice outside the Placement table.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [x] **Step 1: Move transport files**

Move these files from `apps/web/src/browser/` to `apps/web/src/browser/transport/`:
`host-client.ts`, `management-client.ts`, `deck-client.ts`, `outline-client.ts`,
`brief-client.ts`, `confirmation-client.ts`, `image-review-client.ts`, and `bound-outline-decoder.ts`.
Keep the remaining boundary decoder code in transport.
The pure extracted wire validators remain in host/contracts.

- [x] **Step 2: Move UI files**

Use this table. All paths are relative to `apps/web/src/browser/`.

| Source | Destination |
| --- | --- |
| conversation-view.ts | features/chats/conversation-view.ts |
| message-content.ts | features/chats/message-content.ts |
| brief-view.ts | features/deck/brief-view.ts |
| outline-view.ts | features/deck/outline-view.ts |
| deck-workflow-view.ts | features/deck/deck-workflow-view.ts |
| deck-canvas.ts | features/deck/deck-canvas.ts |
| deck-model.ts | features/deck/deck-model.ts |
| deck-tab.ts | features/deck/deck-tab.ts |
| deck-resizer.ts | features/deck/deck-resizer.ts |
| attachment-view.ts | features/attachments/attachment-view.ts |
| model-picker.ts | features/providers/model-picker.ts |
| settings-panel.ts | features/providers/settings-panel.ts |
| research-view.ts | features/research/research-view.ts |
| workspace-view.ts | features/workspaces/workspace-view.ts |
| request-feedback.ts | features/requests/request-feedback.ts |

Keep `boot.ts`, `dom.ts`, `layout.ts`, `motion.ts`, and `theme.ts` at Browser root.
These files own Browser assembly, DOM construction, and shell behavior.
Do not add a shared or common folder.

- [x] **Step 3: Update imports and output**

Use feature entry points for imports between features.
Conversation UI can use Deck view operations.
Deck views cannot import conversation implementation.
Every feature can use Browser transport and root DOM helpers.
Transport cannot import UI features.

Keep boot's mutable state and function bodies unchanged during this move.
Do not extract a new global store.
Retain the existing compiled asset URLs through bundling.
The root Browser index remains only until its test consumers move.

- [x] **Step 4: Check Browser behavior**

Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 test:tools-browser`.
Run `corepack pnpm@11.28.5 test:outline-workflow`.
Run `corepack pnpm@11.28.5 test:browser-smoke`.
Expected: build exits with code 0. Suites print `# fail 0`.
Inspect reconnect, failed-history opening, draft switching, outline confirmation, and deck selection assertions.
A file move does not prove that boot's remaining state coordination is fully separated.

- [x] **Final step: Report and stop**

Send this report in the conversation:

- Files changed, including moves.
- Commands run, exit codes, and the last 20 output lines.
- Test and skip counts.
- Items that a decision table sends to the report.
- Existing failures and unresolved decisions.
- What the commands do not prove.

Mark steps complete only after their Expected results occur.
Do not start another task until the task owner accepts this report.

## References

1. <a id="ref-1"></a>[Project Structure](../../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Coding Guidelines](../../../../conventions/code.md)
3. <a id="ref-3"></a>[Testware](../../../../conventions/testware.md)

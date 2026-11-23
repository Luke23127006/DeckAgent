# Task 02: Extract browser-safe wire contracts

Read this file to learn the steps that extract browser-safe wire contracts.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `packages/host/api/src/contracts.ts (lines 1-435)`.
- `packages/host/api/src/tool-contracts.ts (lines 1-69)`.
- `packages/host/api/src/index.ts (lines 1-64)`.
- `packages/client/runtime/src/host-client.ts (lines 1-220)`.
- `packages/client/runtime/src/management-client.ts (lines 1-145 and 541-562)`.
- `packages/client/runtime/src/deck-client.ts`.
- `packages/client/runtime/src/brief-client.ts`.
- `packages/client/runtime/src/bound-outline-decoder.ts`.
- `packages/client/runtime/src/confirmation-client.ts`.
- `.agents/skills/codebase-design/SKILL.md`.
- `.agents/skills/tdd/SKILL.md`.

**Files:**

- Create: packages/host/contracts/package.json.
- Create: packages/host/contracts/tsconfig.json.
- Create: packages/host/contracts/src/{index,requests,management,deck,brief,validation,brief-validation}.ts.
- Change: packages/host/api/src/{contracts,tool-contracts,index}.ts.
- Change: packages/client/runtime/src/*.ts, for imports and decoder extraction only.
- Change: packages/host/api/package.json and tsconfig.json.
- Change: packages/client/runtime/package.json and tsconfig.json.
- Change: tsconfig.json, tsconfig.base.json, pnpm-lock.yaml, scripts/build-workspace.mjs.
- Test: tests/{browser-runtime,brief-client,deck-client,outline-client,deck-brief}.test.mjs, for public import paths only.

**Interfaces:**

- Produces: package @deckagent/host-contracts, with the root export only.
- Produces wire types with their existing field names:

```text
ModelSelection
AgentRequest
DeckRequest
AttachmentView
ApprovalView
RequestStatus
ActivityStatus
TerminalStatus
RequestEventBody
RequestEvent
RequestSnapshot
StoredRequest
StoredActivity
HistoryMessage
ConfirmationResult
BriefView
ProviderProtocol
ProviderSettings
ProviderTemplate
WebSettings
WebSession
WorkspaceFolderStatus
WorkspaceView
WorkspaceList
ChatDraft
WebPreferences
```
- Produces these wire DTOs in deck.ts and brief.ts:

```text
DeckSnapshot, DeckSlide, DeckChange, SlideContent
OutlineProposal, OutlineSnapshot, OutlineTarget, OutlineChanges
BriefDraft, BriefSourceRef, BriefRecord, BriefSnapshot, InterviewState, InterviewTopic
ConfirmationTarget, ConfirmationReceipt, GenerationSnapshot
DesignSnapshot, CatalogRef, ThemeValues, ContentBlock
ImageCredit, ImageSelection, ImageAttempt, ImageSourceCheck, OutlineImageReview
```

- Retain each DTO's existing public fields. Exclude grants, stage authority, and storage operations.
- Produces the existing exported decoders: decodeAttachment(value: unknown): AttachmentView and requestEvent(value: unknown): RequestEvent.
- Produces: decodeBriefView(value: unknown, sessionId: string): BriefView. Preserve its current validation and error behavior.
- Produces the existing decoders decodeBoundProposal, decodeGeneration, decodeImageReview, and isDesignSnapshot with their current signatures.
- Produces private isWireBriefDraft(value: unknown): value is BriefDraft in brief-validation.ts.
- Uses: existing decoder helpers. Move each decoder with its private helper closure. Keep fetch and SSE operations in Browser transport.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A decoder imports a Node builtin, storage owner, HTTP server, process, or credential store.
- A DTO requires a callback, capability, AbortSignal, or private storage field.
- A decoder move changes accepted payloads or error messages.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Create the package**

Use `@deckagent/host-contracts` as its name and `0.0.0` as its version.
Use the existing ESM manifest and declaration layout.
Export only `.` through `lib/index.js` and `lib/types/index.d.ts`.
Add project references and workspace dependencies for Host API and Browser.
Use `corepack pnpm@11.28.5 install --lockfile-only --offline` to update workspace links.
Expected: exit code 0. Preserve all external dependency versions.

- [ ] **Step 2: Separate wire data from Host operations**

Move the wire types listed in Interfaces.
Keep `HostOptions`, `HostMessage`, `WebManagement`, `WorkspaceManagement`, `AttachmentManagement`, and `BriefManagement` in Host API.
Keep `RequestStore`, `RequestRuntime`, `PreparedRequest`, `RequestRun`, `RuntimeOutcome`, and `RequestAdmission` outside the wire package.
Keep `ApprovalStep`, `PreparedTools`, `RequestTools`, `ToolContext`, `ToolSchema`, and `ToolResult` outside the wire package.

Copy Browser-used Deck and Brief data shapes into wire DTO declarations.
Do not import `@deckagent/deck` into the wire package.
Preserve domain declarations in their owner packages.
Identical representations need no runtime mapper.

- [ ] **Step 3: Move boundary validation**

Move the listed decoders and their private helpers into `validation.ts`.
Keep existing exported names available through the Browser entry during migration.
Change Browser type imports to `@deckagent/host-contracts`.
Route Browser access to the pure portable-document decoders through explicit wire-package exports.
The wire package can depend on the public portable-document package.
Reuse the already locked zod version 4.6.7 for Brief wire validation.
Copy the current Brief payload checks into the private wire validator.
Keep domain Brief validation and domain errors in Deck.
Replace Browser's decodeBriefDraft import with the private wire validator through decodeBriefView.
Do not import DeckError or @deckagent/deck/brief into the wire package.
Do not move generation tools, grants, or domain operations into wire contracts.
It cannot depend on Deck, Host API, Session, or application implementation.

- [ ] **Step 4: Check compatibility**

Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 lint`.
Run `node --test --test-reporter=tap tests/browser-runtime.test.mjs tests/brief-client.test.mjs tests/deck-client.test.mjs tests/outline-client.test.mjs tests/deck-brief.test.mjs`.
Expected: build and lint exit with code 0. Tests print `# fail 0`.
Compare exported decoder behavior with the unchanged malformed-payload assertions.
Do not remove a decoder export solely because its tests use that export.
A production Browser consumer must use the extracted decoder.

- [ ] **Final step: Report and stop**

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

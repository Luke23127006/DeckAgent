# Direct editing contract

Owner selected HTML patches on 4 November 2026. Baseline: clean `114dfd6`
(Task 005 committed). G-003 remains NOT VERIFIED; implementation at the owner's
request does not reset historical acceptance or close that prerequisite.
Decision: [controlled HTML patches](../../../../adr/0006-controlled-slide-html-patches.md).

## Delivered public contract

- EditableSlide extends immutable SlideContent with outlineId, baseHash, editable
  node descriptors and an optional fixed unsupported reason.
- SlideEdit contains outlineId, slideId, expectedRevision, baseHash, editId and
  operations. Each operation names nodeId and optional text/layout. Duplicate or
  overlapping targets and unknown fields fail closed.
- DeckEditor exposes editableSlide, previewSlideEdit and editSlide. DeckService
  owns implementation; public exports come from @deckagent/deck.
- HostOptions.slideEditor is optional. GET the slide editor, POST a preview and
  POST an edit under /api/sessions/:id/deck/slides/:slideId/. All routes retain
  authentication/origin checks. Save reserves this idle Chat synchronously.
- The client uses an element list, plain-text/layout controls and sandboxed draft
  preview. It never grants slide content access to the application DOM.
- The request-local MCP patch_slide tool takes a serialized edit command. Host
  allowedSlideIds remains authoritative. read_slide can include editable metadata.
  Existing generation/publication tools and legacy runtime remain available.

## Exact ownership

Single implementer across A/B/C responsibility lanes; no parallel editors.

| Lane | Files | Responsibility |
| --- | --- | --- |
| A | packages/presentation/deck/src/contracts.ts, index.ts, slide-edit.ts; package.json | Parser, descriptor, bounded patch and existing revision publication |
| A | packages/host/api/src/contracts.ts, index.ts, request-controller.ts; apps/local-web/src/index.ts | Optional HTTP routes and idle save admission |
| B | packages/client/runtime/src/slide-editor.ts, deck-client.ts, deck-canvas.ts | Editing and preserved draft/conflict feedback |
| C | packages/tools/presentation/src/patch-slide.ts, index.ts; apps/local-web/src/web-request.ts, editing-workflow.ts | Same patch capability through MCP with captured scope |
| C | tests/direct-editing.test.mjs, direct-editing-browser.test.mjs, direct-editing-opencode.test.mjs, direct-editing-live.test.mjs | Preservation, safety, concurrency and integration evidence |
| A | package.json, pnpm-lock.yaml, scripts/test-opencode.mjs; task docs | Commands, dependency pin and evidence |

No existing database schema changes or new runtime loop are needed.

Routes: `GET .../editor`, `POST .../preview`, `POST .../edit`, under the slide path
above. POST uses a SlideEdit object; its slideId must equal the route slide ID.
The edit body has a separate 256 KiB safety bound. Other JSON routes retain 20 KiB.
Successful save returns the existing PublishedSlide receipt. Preview returns
SlideContent without publication. GET returns EditableSlide with original HTML.

The editable set is bounded to 1,000 plain-text leaf elements, traversal to 20,000
nodes/depth 100, edits to 100 unique node IDs, and replacement text to 16,000
characters per operation. HTML retains its existing 256 KiB publication bound.
Node IDs are source offsets and are valid only for the exact baseHash/revision.

Font size accepts integer 8..144; margins -1000..1000; alignment left/center/right.
Layout appends validated inline overrides with !important. An existing style
attribute can be requoted/escaped; other attributes/nodes retain exact bytes.
Text-only changes replace only that element's text range. Original inline styles
must have closed declaration boundaries before layout is allowed. Mixed markup,
foreign/template content and ambiguous parser recovery do not become editable
plain-text containers. Legacy preview remains unchanged.

Errors: DECK_INVALID_EDIT (400), DECK_EDIT_UNSUPPORTED/DECK_UNSAFE_HTML (422),
DECK_CONFLICT/DECK_PUBLICATION_CONFLICT/DECK_OUTLINE_MISMATCH (409), missing slide
content (404), SESSION_BUSY (409), and existing auth/origin failures. Stable
ToolFailure diagnostics cover invalid/unsupported edits, scope and revision errors.

Idempotency reuses the existing publication receipt keyed by editId. A retry of
the same command returns its receipt, even after the base is no longer current.
A different command reusing that ID conflicts. No automatic save, rebase or retry.

Dependency: parse5 8.0.0 (MIT), server-side @deckagent/deck only; transitive entities
6.0.1 (BSD-2-Clause). Installed package metadata has no install script. Source locations and
scripting options are documented by [parse5](https://parse5.js.org/interfaces/parse5.ParserOptions.html).
No minimum-release-age or build-script policy exception was added. Existing review
tool dependency deprecation warnings were reported and left unchanged.

## Acceptance slices

1. Direct patch preserves non-target bytes and other slides; save/reopen and
   idempotent retry keep expected revisions. Reject stale bases without overwrite.
2. Legacy eligible HTML works; ambiguous/malformed/foreign structures stay viewable
   with an explicit unsupported editor result. Text is escaped; no CSS/URL injection.
3. Authenticated Host preview is read-only. Save is idle-only; another Chat remains
   usable. Conflicts and model activity leave the user's draft intact.
4. Browser selects a block, edits Vietnamese/English text and layout, previews,
   explicitly saves and reopens. No scripts or network privileges in either frame.
5. Alternate direct and MCP patch edits. Compare same-slide non-target ranges and
   slide-one HTML/revision while editing slide two. Preserve unknown/failed outcomes.
6. Real model evidence is separate from deterministic fixtures. No mock PASS can
   close G-006; record limits and pending entry gates.

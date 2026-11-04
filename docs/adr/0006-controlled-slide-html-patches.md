---
status: accepted
---

# Controlled slide HTML patches

The owner selected option A on 4 November 2026: retain HTML and add controlled
text/layout edits. A new JSON slide format and compulsory legacy conversion were
not selected. This decision extends DeckService without changing its storage
schema, package responsibilities, preview sandbox or runtime default.

## Contract

Use a source-location HTML parser on the Host. Identify editable plain-text leaf
elements by offsets in an immutable published revision. Return revision, HTML hash
and node IDs to the editor. Never use client selectors or client HTML as authority.

An edit names the confirmed outline, slide, expected revision, base HTML hash,
stable edit ID and bounded operations. Each operation changes plain text or a
closed set of layout values: font size, alignment, top margin and left margin.
Escape replacement text. Layout accepts only validated numbers/enumerations, never
raw CSS, URLs or HTML. Keep every byte outside the selected text/style ranges.

Apply patches to the exact immutable base, then reuse publication validation,
revision comparison, transaction, idempotency receipt and invalidation notices.
Direct and AI patch edits use this same path. A stale edit never overwrites a newer
revision. The Host refuses direct saves while its Chat is running or awaiting a
request. Other Chats remain usable.

Keep the current full-HTML publication path for generation and existing AI work.
Offer the patch tool for text/layout changes. Byte preservation inside a slide is
guaranteed for the patch path; unrestricted whole-HTML generation remains a
separate path whose semantic fidelity needs model evaluation.

## Client and compatibility

Select a text block in an editor panel, change its text/layout and inspect a draft
preview before explicit save. Keyboard access is required. This is not unrestricted
drag/drop or a design-system editor. Preview stays in an opaque-origin iframe with
an empty sandbox and restrictive CSP; no slide scripts enter the application DOM.

Unparseable, ambiguous or unsupported HTML remains viewable. Eligible leaf blocks
can be edited without rewriting the whole document. Unsupported content is never
silently normalized or converted. Unsaved work stays available on save conflict;
the user explicitly discards it before loading a new base. Save/reopen uses the
existing immutable revision store. No schema migration or user project write.

Use parse5 with source locations and scripting disabled. It parses text only,
performs no network fetch and executes no JavaScript. Review and pin the dependency
before installation. Parsing, element counts, operation counts and text/layout
values have safety bounds. These are technical limits, not new product defaults.

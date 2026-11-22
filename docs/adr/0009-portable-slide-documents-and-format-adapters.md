---
status: accepted
---

# Portable slide documents and executable format templates

Keep generated slide content independently of its native artifact. Use a versioned SlideDocument for actual text, structured blocks, prepared image identities, origins, notes and layout intent. Keep HTML/CSS in the HTML representation. This extends the [publication contract](0006-generated-artifact-publication.md) and [initial catalog](0004-initial-visual-catalog.md); it does not settle unrelated system architecture.

## Ownership and execution

A small presentation-document package owns browser-safe content and format contracts. The design package owns visual roles and catalog metadata. Format packages consume these contracts; they do not own requests, confirmations or revision pointers. The Deck domain validates grants and commits content with the first native artifact atomically. Application composition selects the available adapters and retains OpenCode as its runtime. A compatibility HTML default keeps existing library callers and historical artifacts readable.

An adapter prepares a native draft context, validates the draft and materializes an artifact. The artifact descriptor records format, media type, extension, content version, template and policy; storage records the native checksum alongside it. A later format consumes the same SlideDocument rather than parsing HTML. HTML templates supply executable skeletons, shared CSS and declared capabilities. Model output remains source authored against that template. Template changes create a new version. The built-in HTML template gains a two-image layout without changing the interface layout or theme.

Store actual generated content before publication, with stable node identities and origins. A successful native render must contain the recorded content. General content and format-specific extensions are distinct; an unsupported extension produces an explicit capability error. A native PPTX proof uses editable text and image objects, not screenshots of whole slides. It is not a released PPTX workflow.

## Assets and validation

Prepare public images under the explicit source choice before confirmation of a new execution plan. Persist normalized bytes and immutable source/author/licence metadata. Missing essential images block confirmation and expose a resolution path through Outline revision; optional omissions remain recorded. Stage layout retries reuse prepared images without another external search. Stop and source grants still apply around asynchronous work. No generated-image service or provider/model substitution is introduced.

Use one browser-safe schema for each shared content contract. Tool descriptions and decoders consume those contracts. Validation returns stable codes, field or element locations and safe repair information. Validation does not publish. Publication rechecks the exact staged bytes and content digest. Bounded correction never weakens checks, truncates content or discards a required image silently.

## Compatibility and alternatives

Existing published bytes, revisions, Outline confirmations and visual snapshots remain unchanged. Historical artifacts without a SlideDocument remain explicitly legacy; do not invent structured content by extracting it from HTML. New database versions preserve old rows and older binaries refuse newer schemas. Deploy producers, Host and browser consumers together. An incomplete legacy Deck retains its pinned execution contract; changing its template or essential image policy requires an explicit new reviewed plan.

Keep source generation against executable templates instead of unconstrained HTML with growing prompt exceptions. A JSON-only renderer was considered but would remove the existing custom-source path. Separate native adapters preserve that path while giving other formats a content contract independent of HTML. Detailed implementation work and verification evidence belong in the corresponding issue, not in this record.

## Implementation reference

The [controlled HTML layout decision](0012-controlled-html-layouts.md) narrows source authoring for HTML Basic version 3 while retaining the earlier native source paths and portable content contract.

The [request-to-Preview diagram](../development/generation-and-publication.md#request-to-preview) shows Brief collection, Outline review, confirmation and generation. The [per-slide template sequence](../development/portable-slide-content.md#per-slide-template-sequence) shows how the model, Host, HTML adapter and browser check turn confirmed content into a saved slide.

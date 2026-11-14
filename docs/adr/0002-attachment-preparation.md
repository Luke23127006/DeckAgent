---
status: accepted
---

# Bounded attachment preparation

Attachment preparation follows the [input rules](../spec/04-business-rules/BR-001.md), [text rule](../spec/04-business-rules/BR-002.md) and [source contracts](0001-source-request-contracts.md). The [parser experiment](../research/deckagent.md) provides initial measurements, not an optimal capacity claim. The initial values are adjustable; the [reassessment issue](https://github.com/Luke23127006/DeckAgent/issues/89) preserves the follow-up after real-document use.

Filesystem owns decoding and extraction. Host owns admission and draft revisions; persistence and managed storage retain immutable original bytes, parsed content, parser version, capabilities and real locations. Changing the parser never silently upgrades historical content. Existing package responsibilities stay unchanged.

Use PDF.js for PDF text, strict zip.js with CRC checks for containers, a DTD-free XML parser for Office text, and sharp for image validation and normalized images. No separate OCR engine or service is enabled. Image-only PDFs are unreadable; mixed documents report omitted visual material. DOCX text and table cells retain part and extracted-line locations, without invented page numbers. PPTX follows presentation relationships and records slide numbers; visual content and notes not extracted remain explicit omissions. Images use typed MCP image content with a checked CLI transport; an unsupported transport/model reports unavailable. Preview success alone proves no model access.

ZIP entries retain parent source identity and entry names. Unknown entries and nested ZIPs are omitted explicitly; no usable entry means rejection. Unsafe paths, links, encryption, corrupt containers and exceeded safety budgets reject the whole upload. Containers never extract into user folders. XML never loads external entities or links.

The shared budget of one original upload is 64 MiB expanded bytes, 16 MiB per entry and 200 entries, including Office containers inside ZIP. PDF has at most 200 pages, PPTX at most 200 slides, and images at most 16,000,000 input pixels. Normalized images have at most 1,600 pixels on either side. Parsed text keeps at most 2 MiB per original upload, with omitted content reported as partial. Safety-budget failures reject the input rather than silently reading its first pages.

Normalized PNG parts have a technical 256 KiB encoded-file budget so their base64 tool events fit the pinned CLI's existing line/output guards. Less-compressible images shrink further when needed; actual dimensions and the omission record state the reduction. Historical oversized image parts report unavailable instead of bypassing transport bounds or silently replacing a saved preparation. This output budget does not lower the accepted original-file or input-pixel limits.

Preparation runs outside the Host event loop in at most two child processes, with a finite queue, a 30-second work deadline and 256 MiB V8 old space per process. The heap setting is not a total RSS limit or an OS sandbox. Byte, pixel, entry and output budgets remain required. Cancellation kills non-cooperative work and prevents late results from becoming ready. Parser/provider errors, credentials and managed paths never enter public metadata.

Legacy text-only requests remain valid when a draft has no attachments. New clients submit a draft revision and exact attachment membership. Admission rechecks the revision after asynchronous preparation, saves message/request associations atomically, and clears only the admitted revision. Invalid or failed admission preserves the draft. Text counts Unicode code points, including whitespace and line endings; JSON transport bounds are separate from the product text maximum.

Multipart sends its revision field before the streamed file so admission allocates metadata against a known draft without buffering an entire upload. Parsing starts only after the multipart envelope is complete and valid. Schema v6 adds preparation receipts and parsed fingerprints to shipped v5 tables without replacing history; older binaries refuse the newer database. The typed-image tool boundary invalidates older native bindings. CLI transport permission permits attempting an image request, not claiming model vision; a provider refusal becomes a safe actionable error.

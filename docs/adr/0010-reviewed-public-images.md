---
status: accepted
---

# Select public images against slide intent before confirmation

Reviewed decks search for image candidates through Tavily by default, using the configured research credential and existing free-account checks. Commons remains an explicit alternative. The [portable content decision](0009-portable-slide-documents-and-format-adapters.md) still owns prepared assets and native adapters; this decision replaces the first-downloadable-image approach for collecting/reviewing, while preserving pinned legacy generation.

An image need identifies one position, its slide text, subject, role, constraints and preferred aspect. A query is a search strategy, not an asset identity. The selected model receives bounded candidate descriptions inside the active review request and selects an opaque candidate ID with a reason. Metadata selection is explicitly labelled; it does not claim visual verification. The Host never substitutes another candidate after a failed selection. Duplicate URLs or normalized bytes cannot fill two positions on the same slide.

The image permission does not grant text research or general model knowledge. Image source selection is admitted by the Host and cannot be changed through a staged Brief or Outline. Each request permits five attempted image searches, including failures, with at most five candidates per search, two searches and two selection attempts per position. Attempts persist across restart and are separate from the three text-search attempts. Both Tavily paths serialize free-account checks. There is no paid or automatic source fallback.

Only the licences in the [public-image licence rule](../spec/04-business-rules/BR-014.md) are accepted for newly reviewed images. Commons metadata must identify the selected file. Other pages must contain recognized, matching ImageObject licence metadata; a page-wide licence or a model claim is insufficient. An unknown licence leaves the position unresolved. Public HTTPS downloads pin DNS addresses, reject private and special networks, recheck redirects and enforce time, type and byte limits. Metadata remains untrusted data. Search discovers images across public sites; it does not guarantee a usable licence for every result.

The Host prepares immutable local PNG assets before saving the reviewed proposal. The Outline shows the retained thumbnail, credit, selection reason and unresolved positions. Required positions block confirmation; optional omissions remain visible. Unchanged reviewed needs reuse checked local bytes. Replacement excludes earlier URLs and bytes; changed slide intent invalidates a previous choice. Stage retries and Preview use only prepared bytes.

Deck schema 9 renames the prepared-image key and adds durable image-search attempts without rewriting prior payloads, assets, receipts or visual snapshots. Old query-keyed rows remain readable. Restoring a reviewed selection reuses its exact local asset; missing evidence requires review rather than a fresh silent search. Older binaries refuse the newer database. Host contracts, generated Brief schema, browser decoders and tools must deploy together. The [public-image reference](../development/portable-slide-content.md#public-image-preparation) describes the current limits and verification scope.

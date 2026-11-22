---
status: proposed
---

# Generation continuation, content origins and web images

This proposal extends the [artifact publication contract](0006-generated-artifact-publication.md) with explicit continuation, saved content origins, presenter notes and public web images. The implementation is available for review. The Wikimedia Commons service choice remains a proposal; it does not settle the wider system architecture. [Generated images](https://github.com/Luke23127006/DeckAgent/issues/106) remain a separate requirement.

## Continuation and reporting

A new user request with `continueDeck: true` continues only missing slides on an incomplete Deck. It retains the confirmed Outline, original confirmation receipt, first-start timestamp and visual snapshot. The active attempt has its own request ID and selected model. Restart reconciles state without scheduling work. Published slides cannot be opened again through the continuation capability.

Closing reports read committed revision metadata. They count saved slides, name actual content origins and locations, list assumptions, placeholders and image omissions, and warn that partially saved slides have not been checked for consistency. Citation metadata records an origin; it does not prove that a claim is true.

## Content origins and presenter notes

Generation records content as a fact, wording or placeholder before publication. Facts require a request-local evidence ID and an exact quotation returned by an admitted source read. The Host supplies source identity, version, label and location. The model cannot assign its own source receipt. General wording and unknown placeholders remain explicitly classified. These checks do not detect every unreported factual claim or prove semantic agreement with a quotation.

The immutable revision manifest keeps content origins and optional presenter notes. Notes are required when the confirmed Brief requests them. Notes stay separate from audience HTML. Both are covered by the publication fingerprint and authenticated content API.

## Web images

An explicit public-image choice permits planned `web-image` queries. The application searches Wikimedia Commons through its [search API](https://www.mediawiki.org/wiki/API:Search) and reads [image metadata](https://www.mediawiki.org/wiki/API:Imageinfo). It sends the confirmed image query, not an automatic copy of project files. This permission does not enable text research, Tavily or model knowledge. No additional API key or model change is required.

Requests use fixed HTTPS Commons metadata and Wikimedia upload/thumbnail hosts, reject redirects, and have byte, time and attempt bounds. Accept public domain, CC0 and CC BY. Reject known incompatible licences. Missing licence metadata remains explicitly unknown. Prefer accepted metadata over unknown metadata. Licence metadata comes from the public source and is not independent legal verification.

The application normalizes downloaded PNG/JPEG images and copies local PNG assets into the existing immutable publication store. Assets retain source identity, byte digests, source-page URL, author, licence and retrieval time. Required images must appear in the published HTML; optional omitted images retain their query in the report. Preview makes no network image requests. Stop revokes writes after asynchronous work, and reopening saved slides does not search or download again.

## Compatibility

Deck schema v7 accepts v1 through v6 and preserves existing revisions and confirmation payloads. An absent active attempt ID refers to the original confirmation request. Historical revisions without origins, notes or image credits remain explicitly missing. Session schema stays v7. Older binaries refuse the newer Deck schema; downgrade requires a pre-upgrade backup.

Deploy Host, Deck contracts and browser decoders together. Older decoders do not understand the new image mode or content block. Generic Chat inputs remain compatible; continuation is optional. Existing HTML validation, normalized asset limits and last-good revision guarantees still apply.

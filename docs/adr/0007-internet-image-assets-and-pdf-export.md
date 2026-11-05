---
status: accepted
---

# Internet image assets and frozen PDF export

The owner selected Internet images and PDF on 4 November 2026. This extends
existing HTML presentations and controlled edits; no runtime default is changed.

## Image assets

The user explicitly imports a public HTTPS PNG/JPEG URL. Only that URL is sent to
the image server: no prompt, source text, credentials, cookies or referrer. Native
network tools remain denied. Agent tools can list/use already imported Chat-owned
assets, but cannot construct arbitrary fetch URLs from private conversation data.

An application-owned assets.sqlite and UUID-named files store verified images,
hash, dimensions, ownership and original/final source URL. Existing database
schemas remain unchanged. Validate every DNS result and redirect; pin the checked
IP to the connection. Reject credentials, private/reserved addresses, non-HTTPS,
unsafe ports, non-image formats and oversized/decompression-heavy images. Imports
publish atomically after validation; failures never mutate the deck.

Published HTML contains inert img elements with data-deckagent-asset IDs, never a
remote src. DeckService checks ownership through an injected asset authority.
Preview/export replace those markers only with verified PNG/JPEG data URLs in a
separate rendering projection. Canonical HTML and direct-edit revision checks stay
unchanged. Original slide scripts never enter the application DOM.

## PDF

Export freezes a complete set of committed revisions in one DeckService read
transaction. It does not call a model, regenerate slides, save unsaved editor work
or block later AI/direct edits. Missing/pending slides/assets fail explicitly.

Use installed Chromium through pinned playwright-core, with browser sandbox
enabled, document JavaScript disabled, restrictive CSP and all network requests
blocked. Render each isolated slide at a fixed 1280 by 720 CSS-pixel viewport and
merge trusted browser-generated pages through pdf-lib. Preserve text/fonts/images;
do not convert the whole slide to a bitmap. Reject pagination/overflow rather than
silently losing content. The browser download is the destination; no project path
or arbitrary output filename is accepted from the model/client.

Cancellation closes/drains browser work and removes only application-owned
temporary outputs. No partial PDF is delivered as success. Browser absence or
unsupported rendering is an explicit unavailable/error state, never an unsafe
sandbox/network fallback. These controls do not establish a general OS sandbox
guarantee or an exhaustive renderer/model fidelity claim.

The renderer/export contract has resource/concurrency bounds. Source provenance
does not assert an unknown image license. Unused ready assets are retained; no
automatic deletion of published asset bytes is introduced.

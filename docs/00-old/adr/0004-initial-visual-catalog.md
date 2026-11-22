---
status: accepted
---

# Initial visual catalog

The [portable content decision](0009-portable-slide-documents-and-format-adapters.md) adds executable HTML Basic version 2 with a two-image layout. Existing version 1 snapshots retain the values recorded here.

Use one neutral built-in design system and one HTML template to establish a complete local generation path. The [decision record](https://github.com/Luke23127006/DeckAgent/issues/92) holds the approval and reviewed alternatives. The canonical product values live in the [default design system rule](../spec/04-business-rules/BR-003.md), [theme role rule](../spec/04-business-rules/BR-017.md) and [template rule](../spec/04-business-rules/BR-018.md). This decision is not evidence that generation is implemented.

## Initial values

The initial `deckagent-neutral@1` snapshot uses the following values. The HTML render reference is 1280 × 720 at 16:9; Preview scales the result rather than changing the layout viewport.

| Role | Initial value |
|---|---|
| color.background | #FFFFFF |
| color.surface | #F1F5F9 |
| color.text | #0F172A |
| color.muted | #475569 |
| color.accent | #2563EB |
| color.onAccent | #FFFFFF |
| color.border | #CBD5E1 |
| font.heading | system-ui, sans-serif |
| font.body | system-ui, sans-serif |
| type.display | 48 px |
| type.heading | 36 px |
| type.body | 24 px |
| type.caption | 16 px |
| space.unit | 8 px |
| type.lineHeight | 1.35 |

There is no default logo or downloaded font. System fonts work offline, but metrics and glyph coverage need checks on each supported OS. Readability, little decoration and deliberate accent use are rules in words. Code writes the theme; model content cannot invent hidden theme roles. User colour/font overrides bind to named roles and are shown in the Brief. Unavailable fonts or unclear values require clarification, not a silent download or replacement.

The initial `html-basic@1` layout capacities count Unicode code points. They are candidate-selection bounds, not permission to truncate content or limit the product's slide count.

| Layout | Initial capacity |
|---|---|
| cover | Title 80; subtitle 160 |
| section | Heading 80; lead 240 |
| title-body | Heading 80; 1–5 bullets of 140 each |
| two-column | Heading 80; two groups, each 1–3 bullets of 120 each |
| key-figures | Heading 80; 1–3 metrics, value 24 and label 80 each; source note 160 |
| image-text | Heading 80; one attached image; 1–3 bullets of 140 each; caption 160 |

Host derives content kinds/counts from validated structured blocks and supplies compatible candidates. The model chooses among them. A new geometry is allowed only when no candidate fits, under the same theme and publication checks. An output that still does not fit remains unfinished. A 3–5 slide smoke deck is a verification sample, not a product cap.

## Consequences and change

The design package owns the role schema, catalog and theme translation; it does not know UI or OpenCode. A Deck keeps its effective theme and template version instead of following a mutable catalog. No custom design system editor or additional format is required for this initial catalog.

These capacities and defaults need measurement with rendered decks; the [reassessment issue](https://github.com/Luke23127006/DeckAgent/issues/102) retains that work. Keep this record as the initial decision. A later change records its reason and compatibility, updates the canonical rule/catalog and producer/consumer tests, and preserves existing Deck snapshots. Changed shipped catalog values receive a new version. Do not rewrite old snapshots to make them appear to use a newer catalog.

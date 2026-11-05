---
id: DEC-007
title: "How the template and the design system bound the model, and a colour or font the user asks for"
date: 05-11-2026
status: open
research: "dev/research/open-design-design-systems.md items 3, 5 and 7; owner ruling after the UC-010 check, 05-11-2026"
affects: "FR-022, FR-092, FR-093, FR-107, UC-002 A8, A19 and A21, glossary (template, theme), DEC-005 setting C2"
---

## Question

DEC-005 chose option C: the model writes the deck source from a prebuilt template, code
translates the design system into a theme, and code checks each write. It bundled two
parts. The theme and the checks keep colours and fonts inside the design system, and code
checks them. Setting C2 also limits the model to the layouts of the template; no check
enforces it, and DeckAgent has few templates, so it limits the deck without a guarantee in
return.

FR-092 also counts every colour or font outside the theme as a fault, so a colour the user
asks for is refused (UC-002 A19). A later change by hand (legacy UC-007) meets the same
rule.

Two questions:

1. What role does the template play when the model builds or changes a slide?
2. What does the system do when the user asks for a colour or a font that the theme of the
   deck does not hold?

A goal of the project bounds both answers: a weak model gives a result close to a strong
model. A decision that code or a prebuilt asset takes does not depend on the model.

Owner ruling of 05-11-2026: 1B and 2C. The Choice and the Why are left to the PO.

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| 1A · Template layouts only (DEC-005 C2) | The model uses only the layouts of the template, with local changes of size, spacing and position | FR-022, FR-107 | The most even look across decks. Few templates make it narrow, and no check enforces it |
| 1B · Template first, a new layout when none fits | Each layout of a template declares the kinds of content it serves and how much it holds. Code picks the layouts that fit the planned content of a slide, and the model chooses among them and fills the slots. Only when code finds none that fits does the model make a new layout, within the theme and checked like every slide | FR-022, FR-092, FR-107 | The choice of a layout is mostly made by code, so a weak model mostly fills slots. A new layout is still model judgment. How a layout declares its kinds of content and its capacity is not set |
| 1C · No template; rules and sample slides | The model builds each slide from the rules of the design system, with a few sample slides as examples. Code checks each write | FR-092, FR-107 | The most freedom, and a new generation format needs only rules, a theme translator and checks. The whole design depends on the model, so the gap between a weak and a strong model grows; not measured |
| 2A · Apply it, then offer to add it | The system uses the colour or font where the user asked, says that it is outside the design system, and offers to add it to the theme of the deck | FR-092, FR-107 | The user's choice wins at once. Every such choice is kept apart from the theme |
| 2B · Always add it to the theme | The system adds the colour or font to the theme of the deck and uses it | FR-092, FR-093 | Simple. A colour used once grows the theme |
| 2C · Ask, with suggested answers | The system makes the rest of the change, then asks one question at the end with suggested answers, such as "only here" or "add it to the theme of the deck". The question ends the request (FR-014); choosing an answer sends it as a new request | FR-014, FR-031, FR-092, FR-107 | The user decides each time, as in other agent systems. The colour appears only after a second request |

In 2A, 2B and 2C a colour or font the user chose is never a fault of the check (FR-092).
Only what the model chooses by itself must come from the theme.

## Choice

<!-- Left to the PO. -->

## Why

<!-- Left to the PO. -->

## Rejected options and why

<!-- Left to the PO. -->

## Consequences

<!-- Left to the PO. -->

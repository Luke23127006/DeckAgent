---
id: DEC-007
title: "How the template and the design system bound the model, and a colour or font the user asks for"
date: 05-11-2026
status: decided
research: "dev/mvp/research/open-design-design-systems.md items 3, 5 and 7; owner ruling after the UC-010 check, 05-11-2026"
affects: "FR-022, FR-092, FR-093, FR-097, FR-107, BR-017, UC-002 A8, A19 and A21, glossary (template, theme), DEC-005 setting C2"
---

## Question

**DEC-005 chose option C**: the **model writes the deck source from a prebuilt template**, **code translates the design system into a theme**, and **code checks each write**. It **bundled two parts**. The **theme and the checks keep colours and fonts inside the design system**, and code checks them. **Setting C2 also limits the model to the layouts of the template**; **no check enforces it**, and DeckAgent has **few templates**, so it **limits the deck without a guarantee in return**.

**FR-092 also counts every colour or font outside the theme as a fault**, so a **colour the user asks for is refused** (UC-002 A19). A **later change by hand** (legacy UC-007) **meets the same rule**.

**Two questions**:

1. **What role does the template play** when the model builds or changes a slide?
2. **What does the system do** when the user asks for a **colour or a font that the theme of the deck does not hold**?

A **goal of the project bounds both answers**: a **weak model gives a result close to a strong model**. A **decision that code or a prebuilt asset takes does not depend on the model**.

**Owner ruling of 05-11-2026: 1B and 2C**. The **Choice and the Why are left to the PO**.

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| 1A · Template layouts only (DEC-005 C2) | The model uses only the layouts of the template, with local changes of size, spacing and position | FR-022, FR-107 | The most even look across decks. Few templates make it narrow, and no check enforces it |
| 1B · Template first, a new layout when none fits | Each layout of a template declares the kinds of content it serves and how much it holds. Code picks the layouts that fit the planned content of a slide, and the model chooses among them and fills the slots. Only when code finds none that fits does the model make a new layout, within the theme and checked like every slide | FR-022, FR-092, FR-107 | The choice of a layout is mostly made by code, so a weak model mostly fills slots. A new layout is still model judgment. How a layout declares its kinds of content and its capacity is not set |
| 1C · No template; rules and sample slides | The model builds each slide from the rules of the design system, with a few sample slides as examples. Code checks each write | FR-092, FR-107 | The most freedom, and a new generation format needs only rules, a theme translator and checks. The whole design depends on the model, so the gap between a weak and a strong model grows; not measured |
| 2A · Apply it, then offer to add it | The system uses the colour or font where the user asked, says that it is outside the design system, and offers to add it to the theme of the deck | FR-092, FR-107 | The user's choice wins at once. Every such choice is kept apart from the theme |
| 2B · Always add it to the theme | The system adds the colour or font to the theme of the deck and uses it | FR-092, FR-093 | Simple. A colour used once grows the theme |
| 2C · Ask, with suggested answers | The system makes the rest of the change, then asks one question at the end with suggested answers, such as "only here" or "add it to the theme of the deck". The question ends the request (FR-014); choosing an answer sends it as a new request | FR-014, FR-031, FR-092, FR-107 | The user decides each time, as in other agent systems. The colour appears only after a second request |

In 2A, 2B and 2C a **colour or font the user chose is never a fault** of the check (FR-092). **Only what the model chooses by itself must come from the theme**.

## Choice

**Option 1B and option 2C**:

- 1B: each layout of a template **states the kinds of content it serves** and **how much it holds**. **Code picks the layouts that fit** the planned content of a slide; the **model chooses among them** and **fills the slots**. **Only when none fits** does the **model make a new layout**, **within the theme** and **checked like every slide**. A request is allowed to **ask for another layout** of a slide.
- 2C: for a **colour or a font the theme of the deck does not hold**, the system **makes the rest of the change**, then **asks at the end** whether to **use it only where the request names it** or to **add it to the theme** of the deck, with **both as suggested answers**. **Choosing an answer sends it as a new request**. A **colour or a font the user chose is never a fault** of the check (FR-092).
- A colour or a font added this way **goes into the theme of the deck only**; the **design system stays as it was** (it changes in UC-010). It is **kept when the deck changes its design system** (FR-093).

## Why

**PO rulings of 05-11-2026**, in the discussion after the UC-010 check:

- **Setting C2 of DEC-005 limited the model** to the layouts of the template, but **no check enforces it**. DeckAgent has **no ecosystem of templates** like open-design, so **few templates would make every deck narrow**, with **no guarantee in return**.
- A goal of the project is a **result close between a weak and a strong model**; the user **brings their own model** (BYOK). **Starting from a template keeps a floor of quality** for any model, and **letting code pick the layouts that fit** **moves the hardest design choice out of the model**. **1C would put the whole design on the model** and **widen that gap**.
- A **new layout when none fits** **keeps the freedom the model needs**, as open-design does: its rule "don't write slides from scratch" is **guidance to the agent**, with **no check after the write**.
- The **colour or font of a slide is the user's choice**. **Refusing it** (UC-002 A19) was **too strict**, and a later change by hand (legacy UC-007) would be **hard to manage** under a rule that **counts the user's choice as a fault**. The **model's own choices stay inside the theme**, so the **deck keeps its design system**.
- The system **asks as other agent systems do**: a **question with suggested answers ends the request**, and the **chosen answer is a new request** (FR-014, FR-031).
- Written by the agent at the PO's request on 05-11-2026, from the PO's rulings 1B and 2C and the follow-up rulings in the same discussion.

## Rejected options and why

- 1A: the **most even look**, but it **limits the model to few layouts** with **no check behind the limit**.
- 1C: the **most freedom**, but the **whole design depends on the model**, which **widens the gap** between a weak and a strong model; **not measured**.
- 2A: **applies the colour at once** but **decides for the user** whether it joins the theme.
- 2B: **every colour used once grows the theme** of the deck.

## Consequences

- **DEC-005 setting C2 no longer holds**; it is **replaced by 1B**. **Setting C3 widens**: the theme of a deck also changes when the user adds a colour or a font to it.
- FR-022, FR-092, FR-093 and FR-107, UC-002 A8, A19 and A21, and the glossary terms "template" and "theme" are **written from this decision**.
- **How a layout states its kinds of content and its capacity**, and **whether the outline records the kind of content of each slide**, are **set in Phase 1 research or the Phase 3 plan** of the first build.
- The **Phase 1 spike of DEC-005** also **counts the slides for which no layout fits**, and **compares a weak and a strong model**.
- The review of legacy UC-007 **applies the same rule to a change by hand**: the **user's choice is never a fault**.
- **Amended on 05-11-2026** by the PO in the review of legacy UC-017 (ruling 7A): the second suggested answer of 2C **no longer adds the colour or font beside the theme values**. It **puts it in the theme of the deck in place of the theme value whose role it fits best**, such as the accent colour, and **names that role**. **Every theme value keeps a role**, so the **model knows what each one is for**, and a design system made from the theme of a deck **takes the current values**. A value put in place this way is **not kept when the deck changes its design system** (ruling 8A, FR-093): the **new design system replaces it** and the **system names it**. A **colour or font the user chose for a part of a slide is still kept**.
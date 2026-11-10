---
id: DEC-005
title: "The model writes the deck source within a template; code makes the theme and checks"
date: 04-11-2026
status: decided
research: "dev/mvp/research/open-design-design-systems.md; teacher feedback of 23-10-2026 in dev/meetings/"
affects: "FR-022, FR-092, FR-093, FR-107, FR-131, BR-003, NFR-009; replaces DEC-002"
---

## Question

**Who writes the source of a deck** (the HTML, Markdown or other file the user sees and exports), and **how does a design system bound it**, when DeckAgent offers **several generation formats**? The answer constrains the first draft (FR-022), design changes and changes to a marked part of a slide in a follow-up request (FR-107, FR-131), changes by hand (legacy UC-007), design systems (legacy UC-010, UC-017) and export (legacy UC-004).

**DEC-002 chose code to render the slides** from content data. It gave **no way to make a free design change** such as "make the title bigger", it **lost changes by hand** when code rendered a slide again, and **each new generation format needed a full renderer**.

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · Code renders the slides (DEC-002) | The model writes content and the kind of slide as data. Code applies the design system and a prebuilt layout and writes the source | FR-022, FR-093, NFR-009 | Same look every time; CI compares exact output. No free design change, no marked-part change; a change by hand is lost when code renders again; a full renderer per generation format |
| B · The model writes freely | The design system is given to the model as instructions. The model writes the whole source; nothing checks it | FR-107, FR-131 | Every change is possible and a new format costs only instructions. The model can use a colour or font outside the design system and nobody sees it; the look changes from run to run; CI checks little |
| C · The model writes within a template; code makes the theme and checks | Code translates the design system into a theme of the generation format (named values such as `--accent`), which the model does not edit. The model writes the source from a prebuilt template of that format and refers to the theme by name. Code checks each write | FR-022, FR-092, FR-093, FR-107, FR-131, NFR-009 | Free changes, marked-part changes and changes by hand keep working; colours and fonts stay in the design system; CI checks invariants. Each format needs a template and a theme translator; the model can break the rules and must then correct its work; the layout is model judgment inside the template |
| D · Mixed | The first draft as A; in a follow-up request the model patches the source | FR-022, FR-107 | Free changes after the first draft, but code and the model write the same file: the next render by code loses or conflicts with the patch |

## Choice

Option C, with **three settings**:

- C1: when the **check finds a fault**, the **model corrects it within the request**; when it cannot, the **request ends unfinished** (FR-092). **Code fixes nothing by itself**.
- C2: the model **uses the layouts of the template** and is **allowed local changes of size, spacing and position**. It **does not make new layouts**.
- C3: the **theme is written only by code**, and **only when the design system of the deck changes**. The **model does not edit it**.

## Why

After **comparing the options with open-design**:

- **Free design changes in a follow-up request**, like open-design and Claude slide design: "make the title bigger" and a change to a marked part of a slide (FR-107, FR-131).
- **Several generation formats**, as the teacher asked on 23-10-2026: a **new format needs a template and a theme translator**, **not a full renderer**.
- The **teacher edits the Markdown source by hand**. The **system and the user change the same files** of the deck source, so a **change by hand is never overwritten by code**.
- The **look stays consistent** across slides and decks, as the teacher asked: **colours and fonts come only from the theme**, and **changing the design system changes the theme in one place**.
- **CI still blocks merges**: the checks are **invariants** (slides outside the scope unchanged, no colour or font outside the theme, no text cut off), **not judged output**.
- **C is the only option that drops none of these needs**.

## Rejected options and why

- A: **no free design change**, **no marked-part change**, **changes by hand are lost**, and **each generation format needs a full renderer**.
- B: **nothing keeps the deck inside its design system**, and **CI can check little**.
- D: **code and the model write the same file**, so a **render by code loses or conflicts with a patch by the model**.

## Consequences

- **DEC-002 is superseded** by this decision.
- Glossary: "**design system**" holds the **look and its rules, not layouts**; new terms "**template**" (the prebuilt layouts of one generation format) and "**theme**" (the design system translated into one generation format).
- A **deck uses one design system**. **Changing it makes code write a new theme**; the **local changes of the model stay**, and the **slides are checked again** (FR-093).
- **Runtime research in Phase 1** of the first build **tries one HTML template and one theme**: a first draft and three follow-up requests, **counting the faults the check finds**. If the **rate is not acceptable**, the **PO reopens this decision**.
- The **Phase 3 LLM boundary table** of each build **lists the templates, theme translators and checks** it uses.
- **Open** with the review of legacy UC-007: whether the **check also applies to a change by hand**, such as a colour outside the theme.
- **Amended on 05-11-2026** by [DEC-007](DEC-007-how-a-design-system-bounds-the-deck.md): **setting C2 is replaced by DEC-007 option 1B** (a layout of the template that code finds fitting, or a new one when none fits); **setting C3 widens** (the theme of a deck also changes when the user adds a colour or a font to it); **C1 no longer counts a colour or a font the user chose as a fault**. **Option C stays**.

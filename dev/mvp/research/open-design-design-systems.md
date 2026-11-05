# Design systems and design edits in open-design

Question: **what is a design system in open-design**, **who applies it to a deck**, and **how does a user change the design of a deck that already exists**? Checked on 04-11-2026 from the **published docs** of `https://github.com/nexu-io/open-design`. **No product was run**; **source code was not read**.

1. Why check this? **DEC-002 let code apply the design system and the layout**, and the **model write only content**. In the UC-002 review, a follow-up request such as "make the title of slide 3 bigger" **had no way through under DEC-002**. The **PO asked how open-design does it**.

2. **What is a design system in open-design?**
   - Observation: **a folder, not one file**: "Each subfolder is a portable design-system package." The **minimum** is `manifest.json`, `DESIGN.md` and `tokens.css` (`design-systems/README.md`).
   - Observation: `DESIGN.md` "is the **canonical design prose for agents**". It has **no fixed template**; the authoring guide suggests visual theme, colour roles, typography, spacing and layout, components, motion, accessibility and anti-patterns.
   - Observation: `tokens.css` "is the **canonical compiled semantic-token stylesheet**", for example `--accent: #625df5;` in `:root`, with component CSS that uses `var(--accent)`. A **token** is a **named value**, such as a colour, **that other CSS refers to by name**.
   - Observation: `manifest.json` holds the **name, category, description and source**. **Optional files**: `USAGE.md`, `components.html`, `design-tokens.json`, previews, fonts.
   - Observation: "The bundled catalog currently contains **151 packages**", many **inspired by brands** (apple, stripe, linear) and some by **style families** (minimal, editorial).
   - => A design system **holds the look**: colours, fonts, spacing and the prose rules. It **holds no slide layout**.

3. **Who applies it when a deck is made?**
   - Observation: "the daemon **composes the available package material directly into the system prompt**": `USAGE.md`, the full `DESIGN.md`, `tokens.css`, components, then the skill or template body (`docs/skills-protocol.md`).
   - Observation: the deck template `design-templates/guizang-ppt` **gives the layout**: "**10 ready-made layout skeletons**", "**5 curated theme presets**" and a seed file `assets/template.html` with its CSS and JS. Its skill says "**Don't write slides from scratch**" and "**template.html is the single source of class names**".
   - Observation: **universal rules live in `craft/`**. "**Brand tokens in DESIGN.md win on conflict.**"
   - Observation: the **agent writes the deck file into the project**; "a previewable file becomes the rendered deliverable" (`docs/architecture.md`).
   - => The **model writes the deck source**. It **starts from a prebuilt template** and **uses the tokens of the design system**. **Code does not render the slides from data**.
   - **Not found**: **any check after the agent writes** that the deck uses only the tokens.

4. **How does the user choose a design system?**
   - Observation: a **picker in the Deck tab** when a project is made (`docs/modes.md`). "Selecting one ... **composes its design context into the agent prompt**."
   - Observation: the user can **import one from a local folder, GitHub or shadcn** (`docs/design-systems.md`).
   - **Not found**: a **default design system**, or the **agent asking which one to use**.

5. **How does the user change the design of an existing deck?**
   - Observation: the refine skill makes "**the smallest useful patch**" and says "**Do not introduce a new design language** unless the user explicitly asks for one" (`plugins/_official/scenarios/od-design-refine/SKILL.md`).
   - Observation: in guizang-ppt, "**90% of adjustments are changing inline styles**" (font size, height, gap). A **colour outside the theme is refused**: "Custom hex values are not allowed"; "**A deck uses only one theme**, don't change colors midway."
   - Observation: an **optional tweaks wrapper adds 3 to 5 knobs** (accent from curated swatches, type scale, density, light or dark, motion). A knob **changes a CSS variable in the browser** and is **kept in `localStorage`**; the **agent is not called** (`design-templates/tweaks/SKILL.md`).
   - Observation: the preview has bridges "for **inspection, comment selection, palette/edit/tweak** behavior" (`docs/architecture.md` section 3.6).
   - **Not found**: **what the agent receives** when the user **selects or comments on a part of the preview**.
   - => A **design edit is a small patch of the deck source by the agent**. **Free sizes and spacing are allowed**; **colours stay inside the theme**.

6. **What does this mean for DeckAgent?**
   - Inference: open-design **keeps a deck consistent through a prebuilt template and the tokens**, **not through code that renders the slides**.
   - Proposal: the **model writes the deck source from a prebuilt template** of the generation format; **code translates the design system into a theme** of that format, which the **model does not edit**; **code checks each write**. **Recorded as DEC-005**, which **replaces DEC-002**.
   - Proposal: a **design change in a follow-up request** **patches only the slides in its scope**, with **colours and fonts from the theme**.

7. **How does a user make, change or remove a design system?** (checked 05-11-2026 for the review of legacy UC-010, from `docs/design-systems.md` and `design-systems/README.md`)
   - Observation: "The product exposes **local-folder, GitHub, and shadcn import flows** in both the UI and the `od design-systems import-*` CLI." Importers "**write the package contract** rather than a standalone `DESIGN.md`."
   - Observation: **optional `assets/`** ("optional static assets") and **`fonts/`** ("optional webfonts"), declared in the manifest fields `assetsDir` and `fonts`.
   - Observation: **repository guards check** "required A1, A2, and B-slot tokens, default parity, fixture synchronization, and unknown-token allowlists"; `DESIGN.md` needs "**at least seven substantive H2 sections**".
   - Observation: after a package changes, "**refresh the Design System surface**"; a user `metadata.json` **overrides title, category and surface**.
   - **Not found**: making a design system **from words, a brand guide or a website**; making one **from a deck**; **removing one**; **changing a bundled one** in the product; a **default design system**; **Required or Preferred rules**; a **check of an imported package at import time**.
   - => A design system is **imported as files**, **not made with the agent**. It holds **named values, rules in words, and optional fonts and assets**.

8. **Is there a visual style apart from the design system**, and **how is a template chosen**? (checked 05-11-2026 for the review of legacy UC-017, from `README.md`, `docs/modes.md` and `docs/skills-protocol.md`)
   - Observation: **no visual style apart from the design system is documented**. **Style families** such as minimal and editorial **are design system packages** (item 2).
   - Observation: the user chooses "**a design system, and optionally a rendering template** from `/api/design-templates`"; a **selected template** "**replaces the tab's default skill** as the project's primary `skillId`" (`docs/modes.md`). The README counts "**15 deck templates and 36 themes** under `design-templates/html-ppt-*/`".
   - Observation: "No brand? **Pick from 5 curated directions**"; the roadmap names a "5-direction picker" (`README.md`). **What a direction holds is not documented**.
   - Observation: "The **Template tab lists templates the user previously saved** through Share" (`docs/modes.md`). The roadmap names a "**Brand-backed Design System**" made from a screenshot or URL, **not yet released** (`README.md`).
   - **Not found**: making a design system or a template **from a deck or a presentation file**; **several built design options shown before the slides**; a **conflict rule between a template and a design system** (only "Brand tokens in DESIGN.md win on conflict" over craft rules, `docs/skills-protocol.md` section 5.5).
   - => The **look is the design system** and the **layouts are the template**, **chosen separately**. There is **no third set of design rules**.

9. **Limits of this check.**
   - The **guizang-ppt reference files** (`layouts.md`, `themes.md`) and `template.html` were **not read**.
   - The **payload of a comment or selection in the preview** is **not documented** in the pages read.
   - The **marking of a part of a slide as the target of a request** comes from a **report of the PO about Claude slide design**; it is **not recorded in a research item**.

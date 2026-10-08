# User dimensions

Catalog of the dimensions that may change how a person uses DeckAgent. Format and rules: `_CRITERIA.md` (U-03, U-10). Purpose: help detect use cases and special requirements. This file does not decide scope; `02-use-cases/` does.

**Status: Draft.** Every "What changes" entry and every baseline is `[assumed]` until a recording or a use case confirms it. Dimensions are added or removed as evidence appears.

**Gap check last run:** after USR-001 to USR-009 (all Draft, all imagined people, all `[assumed]`).

How to read the table:
- **Baseline** is the value the product can assume without special handling. Segments do not list it, and it needs no coverage. It is not always at one end: stakes, time pressure, domain knowledge, craft, AI literacy and budget have a middle baseline between the two extremes. A dash means the dimension is categorical and has no baseline.
- **Bold** values are the extremes of a spectrum. A *(categorical)* dimension has no spectrum, so every listed value counts as an extreme and none is bold.
- "What changes" names the kind of use case or requirement the dimension affects. It is a pointer for discovery, not a requirement.
- "Covered by" is written `value: USR-xxx`, one entry per non-baseline value that a segment claims in its frontmatter (or, for knowledge, in its Knowledge section).
- "Gap note" lists the non-baseline values no segment claims yet, and what kind of person would hold them. A gap is a discovery task, not a decision to exclude anyone.

| Group | Dimension | Baseline | Values | What changes | Covered by | Gap note |
|---|---|---|---|---|---|---|
| Need | Purpose *(categorical)* | - | be assessed (exam, defense) · persuade or sell · report or decide · inform or teach · keep for self | Structure and tone of generated content; what counts as a good result (rubric, narrative, evidence); which clarifying questions are worth asking | be assessed: USR-001; persuade or sell: USR-002, USR-005, USR-009; report or decide: USR-004, USR-007; inform or teach: USR-003, USR-006; keep for self: USR-008 | |
| Need | Stakes | moderate | **low** (informal, internal, disposable) ↔ **high** (client, funding, grade, public) | Review effort before use; preview fidelity; tolerance for AI mistakes; need for undo, history and reliable export | low: USR-003; high: USR-001, USR-002, USR-004, USR-005, USR-009 | |
| Need | Recurrence | one-off | **recurring** (monthly report, weekly lecture) | Reusing a past deck or template; reopening and duplicating; keeping structure and brand consistent across decks | recurring: USR-002, USR-003, USR-004, USR-005, USR-006 | |
| Need | Source material *(categorical)* | - | none (idea only) · pasted text · one document · many or large documents · data or tables · existing deck | Entry paths (prompt, document, import); accepted types and size limits; fidelity to sources; handling of numbers | none (idea only): USR-009; pasted text: USR-003, USR-005, USR-007; one document: USR-001, USR-006, USR-008; many or large documents: USR-004; data or tables: USR-004; existing deck: USR-002, USR-005 | |
| Need | Time pressure | same day (hours) | **minutes** ↔ **days** | Waiting tolerance; progress and stopping; patience for clarifying questions; one-shot vs iterative work | minutes: USR-002; days: USR-001 | |
| Knowledge | Domain knowledge (the topic) | working | **none** ↔ **expert** | None: AI supplies content, so marking AI-added content and fact checking matter. Expert: fidelity to sources, no invented numbers, control of terminology | none: USR-008; expert: USR-001, USR-002, USR-004, USR-006 | |
| Knowledge | Presentation craft | basic | **none** ↔ **expert** (designer) | None: good defaults and guidance without choices. Expert: fine control, direct editing, brand fidelity | none: USR-003; expert: USR-005 | |
| Knowledge | AI and tool literacy | basic | **none** (has never prompted an AI) ↔ **expert** | None: discoverability, example prompts, clarifying questions, plain error wording. Expert: precise steering, scoped edits, iteration speed | none: USR-003; expert: USR-005 | |
| Knowledge | Language *(categorical)* | native, single language | works in a non-native language · deck language differs from UI language · multilingual audience · non-Latin or right-to-left script | Translation; font coverage; text length changes and overflow; language of AI replies; date and number formats | works in a non-native language: USR-001; deck language differs from UI language: USR-003; multilingual audience: USR-004; non-Latin or right-to-left script: USR-003 | |
| Context | Device and input | desktop with keyboard and mouse | **phone or tablet, touch only** | Which flows are possible at all (upload, edit, export); preview layout; control size | phone or tablet, touch only: USR-003 | Input method (voice, one-handed, switch) is not described by this dimension; see finding 3 |
| Context | Connectivity | fast and stable | **slow or intermittent** | Surviving a dropped connection during a long generation; resuming; upload and download size | slow or intermittent: USR-003 | |
| Context | How the deck is consumed *(categorical)* | - | presented live · read alone or sent as a file · shared by link · printed | Export formats; preview fidelity to the final medium; text density; present mode; print-safe colors | presented live: USR-001, USR-002, USR-006, USR-007, USR-009; read alone or sent as a file: USR-002, USR-003, USR-004, USR-008, USR-009; shared by link: USR-005; printed: USR-003 | |
| Context | Collaboration | solo | **team with review or approval** | Sharing; comments; history and restore; concurrent edits; ownership | team with review or approval: USR-002, USR-005 | |
| Constraint | Data sensitivity | public or harmless | **confidential or regulated** | Where data is processed and kept; deleting uploads; training opt-out; retention; logging | confidential or regulated: USR-002 | |
| Constraint | Brand and format rules | none | **strict** (corporate template, school format) | Importing a theme or template; locked elements; brand checks; page size and format | strict: USR-002, USR-005 | |
| Constraint | Budget | individual, may pay a small amount | **free only** ↔ **organization pays** | Usage limits and quotas; behavior when a limit is hit; cost of retries | free only: USR-001, USR-003; organization pays: USR-002 | |
| Constraint | Accessibility needs of the user | none | permanent (vision, hearing, motor, cognitive) · temporary · situational | Accessible interface (keyboard only, screen reader, contrast, text size); pacing and time limits | permanent: USR-006; temporary: USR-007; situational: USR-003 | |
| Constraint | Accessibility needs of the audience | none | permanent (same kinds) · temporary · situational | Accessible output (alt text, contrast, reading order, minimum text size, captions) | permanent: USR-003, USR-006; situational: USR-001, USR-003 | No segment yet: temporary (for example an audience member recovering from an injury or surgery). The need is unannounced and short-lived, so it may be better handled as a hypothesis once use cases exist than as a segment |

## Gap check findings (after USR-001 to USR-009)

Of 43 non-baseline values, 42 have at least one segment and 1 does not: **accessibility needs of the audience, temporary** (`No segment yet`, logged in the table). USR-007's earlier claim for it was removed because it was added only to cover the value.

1. **The remaining gap may not need a segment.** A temporary audience need (for example someone recovering from surgery who cannot read small text) is unannounced and short-lived. Its requirements look like the permanent audience needs already carried by USR-003 and USR-006. Decide once use cases exist whether it adds anything of its own.
2. **Coverage is by existence, not by robustness.** 26 of the 42 covered values rest on a single segment, and every segment is one imagined person. The table shows what has been imagined, not what exists. Evidence from recordings and interviews is what will test it.
3. **A dimension is missing: input method.** One-handed, dictated, voice or switch input is not a device and not a spectrum on "Device and input", so USR-007 carries it through accessibility. If input method changes flows on its own (typing effort, error tolerance), it deserves its own dimension. Open decision.
4. **Baselines are assumptions too.** The baselines chosen here (for example "individual, may pay a small amount" for budget, "basic" for AI literacy) decide which values need coverage, so a wrong baseline hides a gap. Review them against evidence.
5. **Distinctness (U-07) holds** for all 36 segment pairs: each pair differs on at least one listed dimension. The closest pairs are USR-003 and USR-006 (differ on accessibility of the user and on device), USR-005 and USR-009 (differ on source material, craft and AI literacy), and USR-001 and USR-008 (differ on purpose, domain knowledge and audience).
6. **Format risk, not a gap.** USR-008 (newcomer) may be better served by something other than a slide deck. The segment is kept because its needs surface use cases either way.

## Proxies, not dimensions

Age, job and similar facts describe people, but they do not change a flow by themselves. Use them to *suggest* dimension values, then confirm the value with evidence. Never assign a value from a proxy alone.

| Proxy | May hint at | Caution |
|---|---|---|
| Age | AI and tool literacy; device; budget; accessibility needs; time pressure | Wide spread inside any age band; hints only |
| Job or role | Purpose; domain knowledge; presentation craft; brand rules; collaboration; data sensitivity | Same title, very different needs across organizations |
| Field of study or work | Domain knowledge; language; purpose (assessment) | Does not predict presentation craft |
| Region or country | Language; connectivity; data rules; budget | Says nothing about the individual |
| Organization type and size | Brand rules; data sensitivity; collaboration; budget | Individuals may use the product outside organization rules |

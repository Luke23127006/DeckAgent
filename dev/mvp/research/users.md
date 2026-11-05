# Users

Who might use DeckAgent, and what changes from one person to another. Compacted on 05-11-2026 from the legacy segments USR-001 to USR-009 and `dimensions.md` (written 08-10-2026 to 10-10-2026; full files on the `docs/spec` branch at `71ff143`, path `docs/spec/02-users/`). Every person below is imagined and every claim is `[assumed]`: no interview or recording backs them yet. The legacy files also mapped each need to legacy use cases; those links are dropped because the use cases changed.

Use: seeds for eval cases (Phase 2) and input for the vision. A teacher is one of nine people, not the user profile.

1. What changes how a person uses DeckAgent? The legacy work listed dimensions. A baseline is the value the product may assume without special handling.

   | Dimension | Baseline | Values that need handling | Persons |
   |---|---|---|---|
   | Purpose | — | be assessed · persuade or sell · report or decide · inform or teach · keep for self | 1 · 2, 5, 9 · 4, 7 · 3, 6 · 8 |
   | Stakes | moderate | low · high | 3 · 1, 2, 4, 5, 9 |
   | Recurrence | one-off | recurring | 2, 3, 4, 5, 6 |
   | Source material | — | none · pasted text · one document · many documents or data · existing deck | 9 · 3, 5, 7 · 1, 6, 8 · 4 · 2, 5 |
   | Time pressure | same day | minutes · days | 2 · 1 |
   | Domain knowledge | working | none · expert | 8 · 1, 2, 4, 6 |
   | Presentation craft | basic | none · expert | 3 · 5 |
   | AI literacy | basic | none · expert | 3 · 5 |
   | Language | native, one language | non-native · deck language differs from request language · multilingual audience · non-Latin script | 1 · 3 · 4 · 3 |
   | Device | desktop, keyboard and mouse | phone or tablet only | 3 |
   | Connection | fast and stable | slow or dropping | 3 |
   | How the deck is used | — | presented live · read alone or sent · shared by link · printed | 1, 2, 6, 7, 9 · 2, 3, 4, 8, 9 · 5 · 3 |
   | Collaboration | solo | team review or approval | 2, 5 |
   | Data sensitivity | public | confidential | 2 |
   | Brand rules | none | strict | 2, 5 |
   | Budget | may pay a little | free only · organization pays | 1, 3 · 2 |
   | Accessibility of the user | none | permanent · temporary · situational | 6 · 7 · 3 |
   | Accessibility of the audience | none | permanent · situational | 3, 6 · 1, 3 |

   - Findings of the legacy gap check: most values rest on one imagined person; input method (one hand, dictation, voice) may deserve its own dimension; the baselines are assumptions too. Age, job or country only hint at a value; never assign a value from them alone.

2. Person 1 (USR-001): a final-year student defends an 80-page thesis in English, a second language, in three days, with no budget and no slide experience.
   - Needs: fit the thesis into 20 minutes; answer any question about a number on a slide; words simple enough to say aloud; slides that open on an unknown computer; nothing to pay.
   - Cases worth testing: a long document with a fixed talk length; every figure traced to the thesis and added content marked; request language differs from deck language; a usage limit reached the night before keeps the work.

3. Person 2 (USR-002): a sales manager has 90 minutes to pitch a client, starting from last quarter's deck for another client, under company brand, wording and data rules.
   - Needs: a client-ready deck fast; brand and approved wording unchanged; client data only where the company allows; a director's quick sign-off; notes kept out of the sent file.
   - Cases worth testing: leftover names and figures of the previous client; approved text that a change must not touch; a usable partial result and a safe stop in a short window.

4. Person 3 (USR-003): a rural secondary-school teacher prepares weekly lessons on a phone with a dropping connection, in a non-Latin script, and shares them on paper or in a messaging group.
   - Needs: a weekly lesson without formatting work; work that survives a dropped connection; text readable from the back and in black-and-white print; correct letters of the script; last week's structure reused; almost no cost.
   - Cases worth testing: broken glyphs from missing font coverage; print without colour; a minimum text size and contrast whatever the amount of content.

5. Person 4 (USR-004): a research analyst turns a spreadsheet and about 40 papers into a quarterly briefing that a multilingual committee reads before meeting.
   - Needs: data shown without distortion; key findings across many sources; the source of every claim; next quarter rebuilt from new data; the same meaning in every language.
   - Cases worth testing: numbers, units and rounding carried over exactly; input larger than one prompt, with what was read and skipped said plainly; tables too wide for a slide.

6. Person 5 (USR-005): a freelance designer builds client pitch decks, steers AI tools expertly and expects control over every element.
   - Needs: several visual directions fast; hand-set details kept when something else changes; the client's brand book matched exactly; client review by version; an editable handover.
   - Cases worth testing: hand-set spacing and type surviving a later request; brand deviations flagged; messy and contradictory client notes surfaced, not silently resolved; every automatic decision visible.

7. Person 6 (USR-006): a lecturer with low vision prepares lectures each term with a screen reader and magnification, for students who also rely on accessible material.
   - Needs: prepare slides alone; know what the tool is doing at every moment; slides that work with assistive technology; no time-outs.
   - Cases worth testing: every step by keyboard and announced by a screen reader, including long work; structure checked through text (reading order, headings, text alternatives, contrast); accessible output without being asked; 400% zoom.

8. Person 7 (USR-007): an office worker with a broken dominant wrist prepares a team update this week with one hand, maybe with dictation, and no assistive setup.
   - Needs: finish with little typing; no special setup; fix a small mistake without redoing the rest.
   - Cases worth testing: a usable result from short input with dictation errors; one small correction that touches nothing else.

9. Person 8 (USR-008): a new hire turns an onboarding handbook into slides to study from, and cannot judge whether the content is right.
   - Needs: understand the area by next week; know what matters most; find own misunderstandings; terms explained where they appear; add to the deck over weeks.
   - Cases worth testing: source content told apart from added content; dense study material instead of sparse presentation slides; jargon explained or flagged.
   - Open: a deck may not be the right format for this person.

10. Person 9 (USR-009): a first-time founder builds an investor pitch from a vague idea, with no document, in two weeks.
    - Needs: a story investors can follow; holes in the idea found first; a credible look without a designer; quick changes after feedback; one version to read and one to present; no claim that cannot be backed up.
    - Cases worth testing: no source document, so the idea is drawn out by questions; assumptions and placeholders marked instead of invented market numbers; a conventional pitch structure offered with room to depart from it.

11. What was rejected in the legacy spec? Sharing by link, comments between people and approval between people (persons 2 and 5). The product has none of them.

12. Open questions from the personas, all to be settled by interviews: how strictly committees constrain slides; which approvals companies need; whether phone-only use is typical for teachers; which scripts matter first; how large an analyst's source set is; whether designers finish inside the tool; which assistive technologies and which accessibility standard matter; whether founders worry about sharing an idea with an outside service.

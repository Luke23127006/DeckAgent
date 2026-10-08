# Spec style: plain English

Applies to every file in `docs/spec/`. Research cards in `docs/research/` are raw notes and are exempt. Rules 5 and 7 apply to the `System` and `When` fields of use cases. In user segments, hedge words such as "may" are allowed when they state real uncertainty.

**Why:** most readers are not native English speakers. A System response becomes a functional requirement, so it must have one meaning. Plain words give both.

## Rules

| # | Rule | Not this | Write this |
|---|---|---|---|
| 1 | **One thing, one name.** Use the terms in the table below. Never swap in a synonym. | "request area" and "request box" for the same thing | "request box" for the text field, "request area" for the box plus file cards and controls |
| 2 | **Use ordinary words.** show, keep, use, start, end, earlier, next, to | display, render, retain, utilize, initiate, terminate, prior, subsequent, in order to | "The system shows the outline." |
| 3 | **No idioms or phrasal verbs.** | "folded into the same deck", "kicks off", "falls back" | "added to the same deck", "starts", "uses the default" |
| 4 | **No vague verbs.** Banned: handle, manage, support, process, ensure, properly, gracefully, appropriate. The name of a UI part is not a violation ("**Manage skills**") | "The system handles the failure gracefully." | "The system says the outline could not be drafted and keeps the request." |
| 5 | **No may, might, should, could in a System response.** Say what the system does. Use **can** only for what the user is allowed to do. | "The system may show a notice." | "The system shows a notice." |
| 6 | **Short, active sentences.** At most 20 words. Subject first. One action per sentence. Citations such as `[BR-xxx]` do not count. | "A notice is shown that the work was stopped and how many slides were made." | "The system shows a notice that it stopped. The notice gives the number of slides made." |
| 7 | **Conditions go in the When field.** A System response has no "if". When behavior differs by step or moment, start the bullet with a plain label: "At S3:", "Connection returns:". | "If the file is too large, the system rejects it." | When: "A file is over the size limit [BR-?]." System: "Shows the reason on the file card." |
| 8 | **One action per bullet. At most 7 bullets per field.** More than 7 means split the step or flow. | One 110-word table cell | One bullet per thing the user can see |
| 9 | **Bold sparingly.** Bold a UI part or a state, on its first use in a bullet only. At most 2 per bullet. | Bold on whole phrases | "Shows the **deck canvas**." |
| 10 | **Evidence on its own line.** One tag per claim. Never inside a sentence. | "…the view stays on the first slide `[observed: …]`, and adding slides is not offered." | `- **Evidence:** [observed: claude-report (view stays on the first slide)]` |

Rules 4 to 7 keep a response testable. Rules 1 to 3 and 6 keep it easy to read.

## Evidence tags

Same tags as `01-users` and `02-use-cases` (U-06, UCG-08):

- `[observed: <source> (<what it showed>)]` seen in a recording or product
- `[inferred: <source>]` reasoned from observed facts
- `[assumed]` or `[assumed: <what>]` no evidence yet

In a list (context of use, knowledge, and so on), the last bullet can be one `- **Evidence:** [assumed]`. It counts for every item above that has no `Evidence` line of its own.

## Terms

Use these words for these things. Add a row when a new term is needed. Do not add a synonym.

| Term | Means |
|---|---|
| **request** | What the user sends: text, files, or both |
| **request box** | The text field where the user types |
| **request area** | The request box, the file cards and the controls around it |
| **conversation** | The list of messages in the chat |
| **outline** | The list of slide titles and points the system drafts before any slide exists |
| **confirmed outline** | An outline the user has confirmed. It is read-only |
| **deck** | All slides of the presentation |
| **slide** | One page of the deck |
| **deck canvas** | The large view that shows slides |
| **thumbnail strip** | The row of small slide previews |
| **file card** | The card for one attached file, with its name, type and state |
| **notice** | A short message the system shows about what happened |
| **overlay** | A window that opens over the chat with the same solid background. The chat stays underneath |
| **stop control** | The control that stops the system while it works |
| **send control** | The control that sends the request |
| **microphone control** | The control that starts voice input |
| **cancel control**, **confirm control** | The two controls that replace the microphone and send controls during voice input |
| **+ menu** | The menu in the request area that adds files, photos or connectors |
| **status message** | The text in the conversation that says what the system is doing now |
| **placeholder** | Text the system wrote because the user gave none |
| **default design system** | The look the system uses when the user chose none |

## How to check

No tooling exists yet, so review does it. The check is `grep -nEi '\b(handl(e|es|ed|ing)|manag(e|es|ed|ing)|support(s|ed)?|process(es|ed|ing)?|ensur(e|es|ed)|properly|gracefully|appropriate(ly)?|may|might|should|could)\b'` on the **System** and **When** fields and on **Situation and goal**. Each hit is fixed or has a stated reason.

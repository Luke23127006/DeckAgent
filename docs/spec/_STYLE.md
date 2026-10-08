# Spec style: plain English

Applies to every file in `docs/spec/`. Research cards in `docs/research/` are raw notes and are exempt. Rules 5 and 7 apply to the `System` and `When` fields of use cases. Rule 11 applies to every use case, whole. In user segments, hedge words such as "may" are allowed when they state real uncertainty, and the person's devices and input methods may be named, because they describe the person and not the product.

**Why:** most readers are not native English speakers. A System response becomes a functional requirement, so it must have one meaning. Plain words give both.

## Rules

| # | Rule | Not this | Write this |
|---|---|---|---|
| 1 | **One thing, one name.** Use the terms in the table below. Never swap in a synonym. | "request area" and "request zone" for the same thing | "request area" every time |
| 2 | **Use ordinary words.** show, keep, use, start, end, earlier, next, to | display, render, retain, utilize, initiate, terminate, prior, subsequent, in order to | "The system shows the outline." |
| 3 | **No idioms or phrasal verbs.** | "folded into the same deck", "kicks off", "falls back" | "added to the same deck", "starts", "uses the default" |
| 4 | **No vague verbs.** Banned: handle, manage, support, process, ensure, properly, gracefully, appropriate. A use case names no interface label, so there is no exemption (rule 11) | "The system handles the failure gracefully." | "The system says the outline could not be drafted and keeps the request." |
| 5 | **No may, might, should, could in a System response.** Say what the system does. Use **can** only for what the user is allowed to do. | "The system may show a notice." | "The system shows a notice." |
| 6 | **Short, active sentences.** At most 20 words. Subject first. One action per sentence. Citations such as `[BR-xxx]` do not count. | "A notice is shown that the work was stopped and how many slides were made." | "The system shows a notice that it stopped. The notice gives the number of slides made." |
| 7 | **Conditions go in the When field.** A System response has no "if". When behavior differs by step or moment, start the bullet with a plain label: "At S3:", "Connection returns:". | "If the file is too large, the system rejects it." | When: "A file is over the size limit [BR-?]." System: "Shows the reason on the file card." |
| 8 | **One action per bullet. At most 7 bullets per field.** More than 7 means split the step or flow. | One 110-word table cell | One bullet per thing the user can see |
| 9 | **Bold sparingly.** Bold a defined term from the table, on its first use in a bullet only. At most 2 per bullet. | Bold on whole phrases | "Shows the **deck canvas**." |
| 10 | **Evidence on its own line.** One tag per claim. Never inside a sentence. | "…the view stays on the first slide `[observed: …]`, and adding slides is not offered." | `- **Evidence:** [observed: claude-report (view stays on the first slide)]` |
| 11 | **Intent and response, not interface.** The user side says what the user wants to do. The system side says what the system tells, keeps, changes or builds. Never name a widget, a gesture, a position, a look or a label. Name a place only by its zone (see Zones). If a UI detail carries a requirement, write the requirement. | "The user opens the + menu and chooses a skill." "Opens the dashboard as an overlay at the bottom right." "Shows a card with a Retry button." | "The user chooses a skill." "Opens the dashboard. The conversation, the request text and the attachments stay as they were." "Lets the user try again." |

Rules 4 to 7 keep a response testable. Rules 1 to 3 and 6 keep it easy to read. Rule 11 keeps the spec true when the design changes.

## Evidence tags

Same tags as `01-users` and `02-use-cases` (U-06, UCG-08):

- `[observed: <source> (<what it showed>)]` seen in a recording or product
- `[inferred: <source>]` reasoned from observed facts
- `[assumed]` or `[assumed: <what>]` no evidence yet

In a list (context of use, knowledge, and so on), the last bullet can be one `- **Evidence:** [assumed]`. It counts for every item above that has no `Evidence` line of its own.

## Zones

A zone is a named place where a kind of information lives. It is defined by what it holds, never by where it sits or how it looks. The list is closed:

- **request area**: what the user is preparing to send.
- **conversation**: what the user and the system have said to each other.
- **deck canvas**: the slides of the deck.

A use case may say that something is shown, kept or changed in a zone. It may not say how the zone is laid out or reached. To add a zone, add a row to the term table and say what it holds.

## Terms

Use these words for these things. Add a row when a new term is needed. Do not add a synonym. A term never names a widget, a gesture, a position or a look.

| Term | Means |
|---|---|
| **request** | What the user sends: text, files, or both |
| **request area** | The zone for the request the user is preparing: the request text and the attachments |
| **request text** | The words of a request, typed, pasted or spoken |
| **attachment** | One file or photo added to a request, with its name or preview, its type and its state |
| **conversation** | The zone that holds the messages between the user and the system, in order |
| **outline** | The list of slide titles and points the system drafts before any slide exists |
| **confirmed outline** | An outline the user has confirmed. It is read-only |
| **deck** | All slides of the presentation |
| **slide** | One part of the deck that the audience sees at a time |
| **deck canvas** | The zone where the system shows the slides |
| **notice** | A short message the system gives about what happened |
| **status message** | The text in the conversation that says what the system is doing now |
| **placeholder** | Text the system wrote because the user gave none |
| **default design system** | The look the system uses when the user chose none |
| **dashboard** | A place where the user sets up skills or models. Opening it keeps the conversation, the request text and the attachments as they were |
| **try again** | The user asks the system to repeat the work that stopped: draft the outline again, or build the slides again from the confirmed outline |
| **edit the request** | The user takes the sent request back into the request area, changes it, and sends it again |

## How to check

No tooling exists yet, so review does it. There are two checks.

**Words.** Run this on the **System** and **When** fields and on **Situation and goal**. Each hit is fixed or has a stated reason.

```
grep -nEi '(handl(e|es|ed|ing)|manag(e|es|ed|ing)|support(s|ed)?|process(es|ed|ing)?|ensur(e|es|ed)|properly|gracefully|appropriate(ly)?|may|might|should|could)'
```

**Interface (rule 11).** Run this on the whole use case, except the frontmatter, the generated block and the `Research card` line. Each hit is rewritten as an intent or a response. A hit that is not interface language (for example "right" in "right-to-left script") has a stated reason.

```
grep -nEi '(button|click(s|ed)?|tap(s|ped)?|press(es|ed)?|hover(s|ed)?|drag(s|ged)?|swipe|scroll(s|ed|ing)?|menu|dropdown|drop-down|picker|dialog|modal|pop-?up|overlay|window|tab|toolbar|sidebar|panel|strip|thumbnail|card|pill|icon|toggle|checkbox|controls?|selector|screen|page|dimm?(ed)?|highlight(ed)?|grey|gray|red|green|bottom|top|left|right|above|below|corner|box|field|label)'
```

Then apply the **swap test** to each sentence: picture the same product with another interface, such as touch only, voice only, or a different layout. If the sentence is still true, it passes. If it is not, it describes the interface and is rewritten.

# Spec writing rules

Applies to every file in `dev/spec/`. Rules 5 and 7 apply to the `System` and `When`
fields of a use case. Rule 11 applies to the whole use case.

**Why:** each sentence must have one meaning, so one system response becomes one
testable requirement. Everyday words do both.

## Rules

| # | Rule | Don't write | Write |
|---|---|---|---|
| 1 | **One thing, one name.** Use the exact word from the glossary. Never swap in a synonym. | "progress" and "listening position" for the same thing | "progress" everywhere |
| 2 | **Use plain words.** show, keep, use, start, end, before, after | display, maintain, initialize, terminate, prior, subsequent | "The system plays audio." |
| 3 | **No idioms or flowery phrases.** | "green-light", "seal the deal", "U-turn" | "agree", "end", "change its mind" |
| 4 | **No vague verbs.** Banned: handle, manage, support, ensure, process, carry out, appropriate, properly, smoothly. | "The system handles errors smoothly." | "The system reports it could not fetch the content and keeps the link the user entered." |
| 5 | **No "can", "should", "might", "may" in a system response.** State what the system does. Use **"is allowed to"** only for a user permission. | "The system can show a message." | "The system shows a message." |
| 6 | **Short, active sentences.** One action per sentence. A `[BR-xxx]` citation does not count. | "A message is shown that the job has stopped and how many chapters are done." | "The system shows a message that it has stopped. The message states how many chapters were done." |
| 7 | **Conditions go in the When field.** A system response has no "if". When behavior differs by step, open with a label: "At S3:", "On reconnect:". | "If the link is invalid, the system rejects it." | When: "The link does not match a source [BR-?]." System: "State the reason." |
| 8 | **One action per line. At most 7 lines per field.** | One cell of 110 words | One line per thing the user can observe |
| 9 | **Minimal bold.** Bold one glossary word on its first use in a line. At most 2 per line. | Bold a whole phrase | "Play **audio**." |
| 10 | **Evidence on its own line.** One tag per claim. Never mid-sentence. | "…the screen stays on the first chapter `[observed: …]`, and does not offer the next chapter." | `- **Evidence:** [observed: claude-report (screen stays on first chapter)]` |
| 11 | **Intent and response, not interface.** The user side says what the user wants. The system side says what the system reports, keeps, changes, or creates. Never name a widget, gesture, position, style, or label. Name a place only by region (see Regions). If an interface detail carries a requirement, write the requirement. | "The user opens the menu and picks a story." "Open the listening view in the bottom corner." "Show a card with a replay button." | "The user picks a story." "Open the listening view. The saved progress and the current audio stay unchanged." "Let the user replay." |

Rules 4 to 7 keep a response testable. Rules 1 to 3 and 6 keep it readable. Rule 11
keeps the spec correct when the design changes.

## Evidence tags

One tag per claim. Keys stay in English so they are greppable; the source content is
written in prose:

- `[observed: <source> (<what it shows>)]` — seen in a transcript or product
- `[inferred: <source>]` — inferred from observed facts
- `[assumed]` or `[assumed: <what>]` — no evidence yet

In a list (usage context, knowledge, …), the last line can be a single
`- **Evidence:** [assumed]`. It counts for every item above it without its own Evidence
line.

## Regions

A region is a place that holds one kind of information. It is defined by what it holds,
never by where it is or what it looks like. The list is closed; each product declares
its own regions in the glossary. The project has no settled regions yet.
A use case may say something is shown, kept, or changed in a region. It must not say how
a region is laid out or navigated to. To add a region, add a row to the glossary and say
what it holds.

## Glossary

Use these words for these things. Add a row when a new word is needed. Do not add a
synonym. A word never names a widget, gesture, position, or style. This table starts
empty; each project declares its own terms and adds to them as it learns.

| Term | Meaning |
|---|---|
| **account** | The user's identity for access and for keeping their own data |
| **chat** | One line of work with the system. It holds one conversation and at most one deck |
| **conversation** | Region. Holds the requests of a chat and the responses of the system, in order |
| **deck canvas** | Region. Holds the slides of the deck of a chat |
| **interface** | The part of DeckAgent the user sees and uses. Reloading or closing it does not stop DeckAgent |
| **request** | One message the user sends, with its material, and the work the system does for it until that work ends |
| **active request** | A request whose work has not ended. A chat has at most one |
| **draft** | The request text and attachments a user prepared in a chat and has not sent yet |
| **attachment** | A file the user adds to the draft. It is being prepared, ready, or rejected with a reason |
| **status message** | The response that says, while a request is active, what the system is doing and how long it has worked |
| **activity** | One thing the system did or does for a request, such as reading a file or building a slide, with its state |
| **selected model** | The model of a chat that runs its next request |
| **material** | What the user gives for a deck: request text, attached files and named references |
| **interview** | The questions the system asks before the first outline, about the topics the request does not answer |
| **suggested answer** | An answer the system offers for the user to choose instead of typing one |
| **suggested revision** | A change to the current outline that the system offers for the user to choose instead of typing one |
| **source** | Where the content of a deck comes from: the user's material, the model's general knowledge, or public research |
| **outside service** | A service other than the provider of the selected model, such as a search or image service, that the user set up with their own account or key |
| **public research** | A search for public information through an outside service |
| **brief** | What the first outline is drafted from: the interview answers, the assumption for each skipped question, the sources, the generation format and the design system |
| **presenter notes** | Text for the presenter that belongs to one slide and is not shown to the audience |
| **outline** | The plan of a deck: the planned slides and the planned content of each one |
| **current outline** | The outline proposal in the latest outline response of the conversation |
| **confirmed outline** | The current outline after the user confirms it. It does not change |
| **deck** | The slides of a chat |
| **follow-up request** | A request in a chat that has a confirmed outline or a deck with slides |
| **generation format** | The kind of source the deck is built in, such as HTML or Markdown. One deck has one |
| **deck source** | The working files of the deck in its generation format. The system and the user change the same files |
| **design system** | A saved set of design rules for the look of slides: colours, fonts, spacing and the rules for using them. Built-in or made by the user. It holds no layout |
| **theme** | A design system written in the terms of one generation format, as named values the deck source refers to. Only the system writes it |
| **template** | The prebuilt layouts of one generation format that the system builds slides from |
| **marked part** | A part of a slide that the user points to as the target of a request |
| **closing message** | The response that ends the work on slides of a request and tells what was made or changed |
| **placeholder** | Text that stands in for a fact no source gives |
| _(add a row)_ | _(describe the meaning, do not name a widget or position)_ |

## How to check

There is no tool yet, so review does this. There are two groups of checks.

**Wording.** Run on the `System` and `When` fields, and on `Situation and goal`. Each
hit is fixed or given a recorded reason.

```
handle|manage|support|ensure|process|carry out|appropriate|properly|smoothly|can|could|should|might|may
```

**Interface (rule 11).** Run on the whole use case, except the frontmatter, the
generated block, and the `Research link` line. Each hit is rewritten as intent or
response. A hit that is not interface language (e.g. "right" in "right-to-left text")
gets a recorded reason.

```
button|click|tap|swipe|scroll|menu|dropdown|dialog|popup|tab|sidebar|toolbar|card|chip|icon|toggle|checkbox|screen|page|corner|above|below|left|right|label|input field
```

Then apply the **swap test** to each sentence: imagine the same product with a different
interface, e.g. touch-only or voice-only. If the sentence is still true, it passes. If
not, it describes the interface and is rewritten.

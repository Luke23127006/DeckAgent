# Spec writing rules

Applies to **every file** in `docs/spec/`. Rules 5 and 7 apply to the **`System` and `When` fields** of a use case; the **System text of a step** is its `Note over U,S` line in the interaction diagram. Rule 11 applies to the **whole use case**. Rule 12 applies to **every file**.

**Why:** each sentence must have **one meaning**, so **one system response becomes one testable requirement**. **Everyday words do both**.

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
| 9 | **Bold the keywords.** In each sentence, bold the few words or short phrases that carry its meaning, about one per clause. **Headings, code, paths and field labels** such as `**Statement:**` stay as they are; in a **table**, bold is **optional**. Reading only the bold gives the meaning. Never bold a whole sentence. | "**The system keeps the draft when the user leaves the chat.**" or no bold at all | "The system **keeps the draft** when the user **leaves the chat**." |
| 10 | **Evidence on its own line.** One tag per claim. Never mid-sentence. | "…the screen stays on the first chapter `[observed: …]`, and does not offer the next chapter." | `- **Evidence:** [observed: claude-report (screen stays on first chapter)]` |
| 11 | **Intent and response, not interface.** The user side says what the user wants. The system side says what the system reports, keeps, changes, or creates. Never name a widget, gesture, position, style, or label. Name a place only by region (see Regions). If an interface detail carries a requirement, write the requirement. | "The user opens the menu and picks a story." "Open the listening view in the bottom corner." "Show a card with a replay button." | "The user picks a story." "Open the listening view. The saved progress and the current audio stay unchanged." "Let the user replay." |
| 12 | **Current state only, no history.** A file says what is true now. No change log, no "changed vs", "merged from", "rewritten from", "retired", no ruling date and no who decided. No `updated` date. A `Why` gives the reason, not the meeting. History lives in git and `CHANGELOG.md`; a design choice with its options lives in a decision record in `docs/adr/`. | "Legacy FR-020 is dropped. The owner ruled on 04-11-2026 that a reply is a new request." | "A question ends its request; the reply is a new request." |

Rules 4 to 7 keep a response **testable**. Rules 1 to 3 and 6 keep it **readable**. Rule 11 keeps the spec **correct when the design changes**. Rule 12 keeps it **cheap to maintain**.

## Evidence tags

**One tag per claim**. **Keys stay in English** so they are **greppable**; the **source content is written in prose**:

- `[observed: <source> (<what it shows>)]` — seen in a transcript or product
- `[inferred: <source>]` — inferred from observed facts
- `[assumed]` or `[assumed: <what>]` — no evidence yet

In a list (usage context, knowledge, …), the **last line can be a single** `- **Evidence:** [assumed]`. It **counts for every item above it** without its own Evidence line.

## Regions

A **region** is a **place that holds one kind of information**. It is **defined by what it holds**, **never by where it is or what it looks like**. The **list is closed**; each product **declares its own regions in the glossary**. The project has **no settled regions yet**. A use case may say something is **shown, kept, or changed in a region**. It **must not say how a region is laid out** or navigated to. To **add a region**, **add a row to the glossary** and **say what it holds**.

## Glossary

**Use these words for these things**. **Add a row** when a new word is needed. **Do not add a synonym**. A word **never names a widget, gesture, position, or style**. This table **starts empty**; each project **declares its own terms** and adds to them as it learns.

| Term | Meaning |
|---|---|
| **account** | The user's identity for access and for keeping their own data |
| **chat** | One line of work with the system. It holds one conversation and at most one deck |
| **current chat** | The chat the user works in now |
| **earlier chat** | A chat the system keeps as earlier work, other than the current chat, that the user is allowed to open again |
| **conversation** | Region. Holds the requests of a chat and the responses of the system, in order |
| **deck canvas** | Region. Holds the slides of the deck of a chat |
| **interface** | The part of DeckAgent the user sees and uses. Reloading or closing it does not stop DeckAgent |
| **request** | One message the user sends, with its material, and the work the system does for it until that work ends |
| **active request** | A request whose work has not ended. A chat has at most one |
| **draft** | The request text and attachments a user prepared in a chat and has not sent yet |
| **attachment** | A file the user adds to the draft. It is being prepared, ready, or rejected with a reason |
| **status message** | The response that says, while a request is active, what the system is doing and how long it has worked |
| **activity** | One thing the system did or does for a request, such as reading a file or building a slide, with its state |
| **agent** | The part of the system that does the work of a request with the selected model, such as reading files, writing the work of the chat and using outside services |
| **approval** | The user's answer to a step of a request that goes beyond what the agent of the chat reaches without asking: allow it once, or refuse it |
| **selected model** | The model of a chat that runs its next request |
| **context** | What the selected model reads for a request. Each model reads a context only up to its own size |
| **conversation summary** | A shorter text the system writes in place of the earlier conversation of a chat, for the selected model to read. The user still reads the whole conversation |
| **provider** | A model service that runs models for DeckAgent through the user's own account |
| **provider configuration** | One saved connection to a provider: its provider ID, what the provider needs such as a key, and its added models |
| **provider ID** | The name that tells which provider a provider configuration connects to. It never changes after saving |
| **built-in provider** | A provider DeckAgent knows in advance, with a fixed provider ID |
| **custom model API** | A provider the user describes with a provider ID, a base URL and an API protocol |
| **key** | The secret of the user's own account that a provider or an outside service asks for |
| **model catalog** | The list of models a provider reports. It adds no model by itself |
| **added model** | A model the user added to a provider configuration |
| **selectable model** | An added model of a saved provider configuration, which a chat is allowed to select |
| **reasoning level** | How much the selected model reasons for a request, among the levels that model has |
| **material** | What the user gives for a deck: request text, attached files and the files of the project folder that a request reads, named or not |
| **workspace** | A group of chats with a name. Each workspace other than the default workspace has one project folder, and no two workspaces have the same one |
| **project folder** | The folder on the user's computer that the user chose for a workspace. It holds the user's files |
| **workspace in use** | The workspace whose chats the system shows as earlier chats and that a new chat joins |
| **default workspace** | The workspace with no project folder that exists from the first start. It is never removed |
| **ungrouped chat** | A chat whose workspace was removed. It belongs to no workspace and has no project folder |
| **interview** | The questions the system asks before the first outline, about the topics the request does not answer |
| **suggested answer** | An answer the system offers for the user to choose instead of typing one |
| **suggested revision** | A change to the current outline that the system offers for the user to choose instead of typing one |
| **source** | Where the content of a deck comes from: the user's material, the model's general knowledge, or public research |
| **outside service** | A service other than the provider of the selected model, such as a search or image service, that the user set up with their own account or key |
| **public research** | A search for public information through an outside service |
| **brief** | What the first outline is drafted from: the interview answers, the assumption for each skipped question, the sources, the generation format, the template and the design system |
| **presenter notes** | Text for the presenter that belongs to one slide and is not shown to the audience |
| **outline** | The plan of a deck: the planned slides and the planned content of each one |
| **current outline** | The outline proposal in the latest outline response of the conversation |
| **confirmed outline** | The current outline after the user confirms it. It does not change |
| **deck** | The slides of a chat |
| **follow-up request** | A request in a chat that has a confirmed outline or a deck with slides |
| **generation format** | The kind of source the deck is built in, such as HTML or Markdown. One deck has one |
| **deck source** | The working files of the deck in its generation format. The system and the user change the same files |
| **design system** | A saved set of design rules for the look of slides: its theme values, rules in words for using them, and brand files such as a logo. A built-in design system or a custom design system. It holds no layout |
| **built-in design system** | A design system that comes with DeckAgent. The system never changes or removes it |
| **custom design system** | A design system the user saved. The user is allowed to change and remove it |
| **theme value** | A named value of a design system, such as a colour, a font or a spacing |
| **brand file** | A file that gives the look of a brand, such as a brand guide, a presentation, a logo, a font file or a design system package of another product |
| **sample slide** | A slide made with a proposed design system to show it. It belongs to no deck |
| **theme** | A design system written in the terms of one generation format: its theme values, with each value the user put in place of one for the deck, as named values the deck source refers to. Only the system writes it |
| **template** | A prebuilt set of layouts of one generation format that the system builds slides from. Each generation format has one or more built-in templates, one of them its default template; the user chooses one in the interview. Each layout states the kinds of content it serves and how much it holds |
| **marked part** | A part of a slide that the user points to as the target of a request |
| **closing message** | The response that ends the work on slides of a request and tells what was made or changed |
| **placeholder** | Text that stands in for a fact no source gives |
| _(add a row)_ | _(describe the meaning, do not name a widget or position)_ |

## How to check

There is **no tool yet**, so **review does this**. There are **two groups of checks**.

**Wording.** Run on the `System` and `When` fields, and on `Situation and goal`. Each hit is **fixed or given a recorded reason**.

```
handle|manage|support|ensure|process|carry out|appropriate|properly|smoothly|can|could|should|might|may
```

**Interface (rule 11).** Run on the **whole use case**, except the frontmatter. Each hit is **rewritten as intent or response**. A hit that is **not interface language** (e.g. "right" in "right-to-left text") gets a **recorded reason**.

```
button|click|tap|swipe|scroll|menu|dropdown|dialog|popup|tab|sidebar|toolbar|card|chip|icon|toggle|checkbox|screen|page|corner|above|below|left|right|label|input field
```

Then apply the **swap test** to each sentence: imagine the **same product with a different interface**, e.g. touch-only or voice-only. If the sentence is **still true, it passes**. If not, it **describes the interface** and is **rewritten**.

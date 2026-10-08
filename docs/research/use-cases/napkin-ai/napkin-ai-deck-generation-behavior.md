---
product: Napkin AI
flow: "Generate an initial draft deck from the Slides start screen"
status: Recorded
recorded_on: "2026-10-08"
account_or_plan: ""    # not recorded
media: [NP-01-happy-path.mp4, NP-01-upload-pptagent-paper.mp4, NP-01-upload-back-image.mp4, NP-01-upload-tu-vi-image.mp4]   # the videos are inside ui/media/napkin-ai-deck-generation-behavior.zip (names unchanged)
---

# Napkin AI: how it generates an initial draft deck

This report is evidence of what the product showed. It names no use case, requirement or rule; those cite this report. It describes behavior, not speed. Exact wording is quoted; "…" inside a quote is the product's own truncation. Very small text on screen may contain misread letters.

Reading guide: "Common behaviors" says what holds in every flow. "Flows" only says what differs. A flow that does not mention a behavior behaves as the common behavior says.

The product is built around a guided sequence: it proposes an outline and waits for approval, then asks for a brand style, then asks for a layout per slide, and only then fills the canvas. Some recordings stop partway through this sequence; for those, the report says where the recording ends and does not describe what came after.

## Inputs used

| Input | What was entered | The user's choices along the way |
|---|---|---|
| Typed notes | A full request for a 5-slide internship report with five bullet notes, pasted into the request box | Outline: "Add more technical detail", then "Looks good, build it". Style: "Spectrum Lines". Layouts: "Pick the rest for me" |
| Document | A research-paper PDF attached, plus a request for a 5-slide summary "based strictly on the attached document" | Outline: "Focus more on PPTEVAL" (third of four buttons), then "Looks good, build it". Style: "Slate Brief". Photos: "Use my photos" |
| Solid-black picture | One `.webp` picture, solid black, no text (the file was named "Solid_black.svg.webp") | Topic typed ("education"); audience "Students or parents"; purpose "School orientation"; length "Short (5–6 slides)"; outline: "Add a slide for school safety", then "Looks good, build it"; style "Pastel Field"; layouts picked by hand for slides 1–6 and "Pick for me" for slide 7 |
| Chart picture | One `.png` photo of a table-like astrology chart, no text (the person's name is written `[name]` here) | Audience "Personal deep-dive"; length "Detailed (12+ slides)"; outline: "Focus more on career", then "Looks good, build it"; style "Verdant Blend"; layouts "Pick the rest for me" |

## Common behaviors

### Entry and request screen

- The recording starts on a screen with the headline "What do you want to create today?" and two cards: "Visuals" ("Turn any text into a visual.") and "Slides" with a small badge "BETA" ("Build a full presentation."). Choosing "Slides" opens the request screen. How this screen is reached from the editor (for example from "New Napkin +") was not recorded.
- Request screen: a banner card "Create your presentation" / "Turn your content into a polished presentation with on-brand visuals. Present live or export to PowerPoint.", a small "Back" button, a request box with the placeholder "Paste your text, describe your idea or drop a source file (Word, Excel...)", a `+` button at its bottom left and a light-grey send arrow at its bottom right. Under the box, four grey links: "Lesson on photosynthesis", "Investor pitch for a note-taking app", "Training deck on objection handling", "Go-to-market strategy for a new product". None was used. The "Visuals" card has its own page with the same kind of links, a "Back" button and a "×".
- **Not offered** on this screen or on the chat that follows: a design-system dropdown, a microphone, a waveform or voice control, a model name, an effort label, a permission mode, a line like "AI can make mistakes", an empty-state message.
- The `+` button shows the tooltip "Attach files" and opens the device's file picker straight away; there is no menu. The picker's file-type filter reads "Custom Files (*.csv;*.docx;*.htm…" and is cut off, so the whole list is unknown; a `.png` could be picked.
- The send arrow is light grey with an empty box and dark once the box holds text or a ready file.

### What happens on send

1. The banner and the links collapse upward, the box moves to the bottom, and the page becomes one centred chat column. There is no canvas, no artifact card, no spinner.
2. The request appears as a grey bubble at the top right. An attached file shows as a small pill with the file name and no thumbnail, at the bottom right of the bubble (or alone when no text was sent).
3. Under it, at the left, "Thinking" with two dots.
4. The box now reads "Send a message…". A cyan glow surrounds it while the product works and is off while it waits for the user. The send arrow stays light grey while the product works.
5. **There is no stop control** in any recording, at any step, and the box has no other control for interrupting a run.

The send was probably the Enter key in the typed-notes run (the pointer was not on the arrow); this was not verified.

### Status line

While the product works, one line in the chat names the phase and shows an elapsed-time counter in seconds that restarts at each user action: "Thinking", "Propose outline", "Create deck metadata", "Generating slides", "Generating previews", and once "Checking slide IDs for placement". No percentage, step count or tips are shown. Nothing says what the product is reading, including when a picture or a document was attached.

Once per run, around the end of generation, a full-page dim with a white box "Finishing…" and one coloured dot covers the page for a moment, and the page address (`app.napkin.ai/page/…`) changes to another id around it. No message explains it.

### Decision steps with buttons

Every question from the product is a chat message with a small label (for example "OUTLINE OK?"), a sentence, and buttons.

- **A button sends its own text** as a user message at once; the user's bubble shows the button text and the buttons disappear. The question and its answer stay in the chat. Exception: a button ending in "…" with a small chevron, such as "Create a deck about…", puts its words in the box without sending, so the user finishes the sentence. The other "…" buttons ("For…", "Focus on…", "Make it…", "Adjust the…", "Add detail about…") were not pressed.
- The buttons are written for the content: each outline and each question offers a different set.
- The user can also type a reply instead of pressing a button (done once, for the topic).
- No "Skip" control was seen on any question.

### Questions before the outline

Asked only when the message has a picture and no text. One question at a time, each after the previous answer, each repeating the earlier answer in its wording:

- Solid-black picture: four questions, labelled "TOPIC", "AUDIENCE", "PURPOSE", "LENGTH". The first reads "I see you've shared an image — what would you like to build a presentation about?" with the single button "Create a deck about…". The picture is never described in later text.
- Chart picture: two questions, "AUDIENCE" and "LENGTH". The first reads "I've got the astrological chart for [name]. Who is this presentation for?" with "Personal deep-dive", "Family or friends", "Professional consultation" and "For…". It already names the kind of picture and the person's name; whether these were read from the picture or from the file name is not shown.

The number of questions therefore depends on the input. The typed-notes and document runs asked none.

### Outline

- The first answer to a request is an outline, not slides. It shows a one-sentence summary of the deck, a link "Expand All", and collapsed rows, each with a triangle, a numbered title and a one-line subtitle. Opening a row shows its bullets. "Expand All" opens every row and a link "Collapse All" appears.
- Under the rows: the label "OUTLINE OK?", a sentence ("I've drafted a 5-slide technical report … Does this flow work for your lead?"), and four buttons. The first is always "Looks good, build it". The others change with the content, for example "Add more technical detail", "Make it more concise", "Adjust the…"; "Focus more on the UI", "Focus more on the backend", "Add detail about…"; "Add a slide for school safety", "Focus more on extracurriculars".
- Pressing a revision button produces a new outline message with a new summary sentence and a new button set. The first outline and its question stay above in the chat.
- A revision can change more than the message says. After "Focus more on career" on a 13-row outline, the revised outline also had 13 rows: three career rows were new and three other rows were gone, and the message mentioned only the career expansion. After "Add a slide for school safety" the new slide was inserted as row 3 of 7, not at the end, and later rows were renumbered.
- No control for editing the outline text directly was seen; changes go through the buttons or a typed reply.
- Accepting ("Looks good, build it") sends that text as a bubble and the product continues.

### Brand style step

- After the outline is accepted the product writes a sentence tailored to the deck ("For a technical report to a lead, I've picked a few professional and clean brand styles. Which one fits the Edtronaut vibe?") and shows six style cards in a 3 × 2 grid. The cards are drawn one by one (some show three loading dots first). Each card has a title, three small tiles, and an "Edit Colors" button with a chevron; a link "More" sits under the grid.
- Hovering a card shows other layouts in it. "Edit Colors" opens a list of five named palettes, each with a swatch; choosing one redraws the card. "More" doubles the grid to 12 cards.
- The style names differ from run to run (for example "Deep Teal", "Blueprint Sketch", "Slate Brief", "Spectrum Lines", "Night Spectrum", "Soft Spectrum", "Quiet Accent", "Pure Outline", "Boardroom Calm", "Warm Ledger", "Pastel Field", "Sunlit Layers", "Verdant Blend"), and so does the introducing sentence.
- Picking a card puts a right-aligned card with the picture of that style in the chat, and the work continues. A dropdown for a design system does not exist; this step is the only place a look is chosen. Typing a style instead of picking was not tried.

### Question about a document's pictures

Seen only with an attached document that has pictures: label "USE DOCUMENT PHOTOS?", "I found several images in your document, including architecture diagrams and scoring examples. Would you like me to use those in the deck, or should I generate new pictures instead?" with buttons "Use my photos" and "Generate pictures instead". No such question appeared for picture-only messages or typed notes.

### Layout step and the editor

- After generating, the product shows, for slide 1, the title of the slide (for example "1. Final Internship Report"), the line "Hover to preview. Click to insert.", one white tile with loading dots, and two buttons "Pick for me" and "Pick the rest for me". About then the page turns into an editor: a top bar with a logo and chevron, a black "New Napkin +" button, "Undo", and at the right "Present", "Export", "Share", "Agent", "Brand Studio" and a round avatar. The chat becomes a narrower panel at the right with a `»` control; the left side is an empty canvas in the colour of the chosen style (once with the text "Pick a slide design here →").
- Six layout tiles for the slide are shown. Hovering a tile previews that layout as the slide on the canvas. Clicking one inserts it ("Inserting visual…", then "Visual inserted.").
- A second level can open after a click: a link "< Back" above six more tiles (first with loading dots, then with pictures such as a desk with two monitors), and a link "… More" under them.
- "Pick for me" picks for the current slide. "Pick the rest for me" picks for this slide and every later slide: the line "Auto-generating the best slides for you." shows, and for each next slide a list of tiles appears with the first tile used, then "Generating previews". For the last slide only "Pick for me" is shown.
- Slides stack in one vertical column on the canvas, with a dashed empty frame under the last one. A strip of numbered thumbnails appears at the left: filled for slides made, empty frames for the rest. The canvas scrolls by itself to follow the newest slide. A column of seven unlabelled icons (palette, `A` with a plus, sparkles, two cycling arrows, `T`, pencil, shapes) shows at the right of a slide.
- Both ways were observed: choosing a tile by hand for every slide, and "Pick the rest for me". With "Pick the rest for me" the first tile was used each time in the frames read; whether it would match the user's hand choices is not known.

### Closing message

After the last slide, a message with a bold label, one sentence and four buttons. It contains no summary of the slides, no note about placeholders, no list of wording added beyond the user's material, no statement about checking the layout, and no mention of speaker notes.

- Typed notes: label "NEXT STEPS", "How does the report look to you?", buttons "Export the deck", "It's perfect", "Make it more formal", "Add more technical detail".
- Solid-black picture: label "ORIENTATION DECK READY", "The orientation deck is ready, including the new slide on school safety. How would you like to proceed?", buttons "Export the deck", "Add more slides", "Change the brand style", "Apply a visual effect".
- None of these buttons was pressed.

A pop-up appears over the lower canvas before the closing message: "How would you rate Napkin Slides so far?" with five round faces from an angry face to a heart-eyes face, a "×" and a link "Don't ask me again". It was not used.

### Content of the slides

- The numbers in the user's notes stay unchanged on the slides.
- After "Add more technical detail" the slides contain statements the notes do not make ("Refactored monolithic endpoints into modular, testable route handlers", "Implemented standardized middleware for authentication and error handling", "Complete comprehensive API documentation using Swagger/OpenAPI standards", "Finalize unit and integration test coverage for the migrated services"). The product did not say it had added them.
- Slide titles can differ from the outline row they came from ("Commitment to School Safety" became "School Safety Commitment"; "Beyond the Classroom" became "Student Life Opportunities" with a 2 × 2 grid whose cells are not the outline's bullets; "The Self Element and Inner Strength" became "Core Identity Analysis"). A slide label "Eyebrow" showed twice on one slide, although the outline had no such word. The product did not flag any of this.
- Most slides have a picture or a diagram; where the pictures come from (generated or stock) is not shown. The cover for the chart picture showed a drawn picture of a round chart on a table; the outline had said "I'll use your uploaded chart image on the cover", and whether the uploaded file is that picture was not compared.
- No slide for the solid-black picture shows or mentions the picture. No slide showed a footer or page number.
- Speaker notes were never shown.

## Flows

### Typed notes (full request)

The request goes straight to a first outline of five slides (no question first). The user asked for more technical detail and got a revised outline, accepted it, picked a style, let the product pick every layout, and watched slides 2–5 fill in one after another, with the canvas following the newest one. The deck has five slides, as asked; the first outline stayed closer to the notes than the slides did. The closing message and pop-up are as in "Common behaviors".

### Document attached

- The attached file is a pill in the box with its name (no thumbnail, page count or size) and a grey status text: "Uploading", then "Processing", then no status. The send arrow stays light grey until the status text disappears. A "×" on the pill was not pressed. No progress bar or percentage shows. The attach step itself is not in the recording.
- After the send the bubble shows the typed text and, at its bottom right, a small label with the file name.
- The product read the file before the first outline: the outline sections come from the paper's content. The request had asked for "a title slide, problem statement, key features, architecture overview, and conclusion", but no outline row was called "problem statement" or "conclusion", before or after the revision, and the first outline's sentence said "as requested".
- The outline was revised once by a button ("Focus more on PPTEVAL"), then accepted. The style step followed, then the question "USE DOCUMENT PHOTOS?", answered "Use my photos".
- The recording of this run ends while "Generating slides" was running. The layout step, the slides and the closing message were not recorded, so what the product did with the document's pictures is not known.

### Picture attached, no text

- The file pill shows the file name and no thumbnail. For the chart picture the pill's status stayed "Uploading" until it disappeared, with no "Processing" step (the document had both); the arrow turned dark when it disappeared. No size, type or preview message showed for either picture.
- The product asked its picture-only questions (see "Questions before the outline"), then an outline, a style, and the layout step.
- **Solid-black picture (recorded to the end).** Seven questions and choices before the layouts. The deck has seven slides about a school orientation, a topic the user typed; it came from the user's answers, not from the picture. The closing message is the one in "Common behaviors".
- **Chart picture (recorded up to the first slides).** The outline had 13 rows built from the chart's house names, with the sentence "I'll use your uploaded chart image on the cover." The user pressed "Focus more on career" and got a revised 13-row outline with the message "I've expanded the career section to three slides, covering your professional blueprint, ideal paths, and how to handle challenges. Does this revised flow look right?" The deck text is English with the chart's Vietnamese house names in brackets. The recording ends after the fourth slide; the rest of the deck and the closing message were not recorded.

### Other flows not recorded

The recordings do not include, and the product's behavior is therefore unknown for: a vague typed request ("generate deck"), a request in Vietnamese or another script, a very long text, an empty request, a very large file, several files at once, an unsupported file type, a stop (no control exists), a page reload, a lost connection, a second message sent during a run, "Undo", the Agent panel on an existing deck, "Export", "Present", and "Brand Studio".

A static screenshot ([start.png](ui/images/start.png)) shows the editor with a filled slide 1, an empty slide 2, a dashed empty frame under it, a column of seven unlabelled icons at the right of the slide, and an Agent panel with the greeting "I can help inspect and update visuals on this page. Try one of these to get started." and three chips: "Which visual is in view?", "Make text more formal", "Make text more impactful". This is the state of an existing deck, not an empty presentation; how that deck was made is not shown. A second static screenshot ([attach-files.png](ui/images/attach-files.png)) shows the file picker with the cut-off filter text above.

## Messages shown (exact wording)

| Where | Wording |
|---|---|
| Request box before the first send | "Paste your text, describe your idea or drop a source file (Word, Excel...)" |
| Request box after the first send | "Send a message…" |
| Tooltip on `+` | "Attach files" |
| File pill status | "Uploading", then "Processing" |
| Status line | "Thinking", "Propose outline", "Create deck metadata", "Generating slides", "Generating previews", "Checking slide IDs for placement" |
| Full-page box | "Finishing…" |
| Labels above questions | "TOPIC", "AUDIENCE", "PURPOSE", "LENGTH", "OUTLINE OK?", "USE DOCUMENT PHOTOS?" |
| Line above layout tiles | "Hover to preview. Click to insert." / "Inserting visual…" / "Visual inserted." / "Auto-generating the best slides for you." |
| Rating pop-up | "How would you rate Napkin Slides so far?" / "Don't ask me again" |
| Closing message | "NEXT STEPS" / "How does the report look to you?"; "ORIENTATION DECK READY" / "The orientation deck is ready, including the new slide on school safety. How would you like to proceed?" |

No file-size, file-type, request-length, error, warning or offline message appeared in any recording.

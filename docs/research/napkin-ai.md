# Napkin AI

Napkin AI (`app.napkin.ai`) turns text into visuals, and its Slides mode (marked "BETA") builds a presentation through a chat beside an editor. Recorded on 08-10-2026 by running the product: 4 screen recordings of making a first draft deck from the Slides start screen, kept in [napkin-ai-deck-generation-behavior.zip](evidence/napkin-ai/napkin-ai-deck-generation-behavior.zip), plus static screenshots of later tests with a deck file and of follow-up requests (date not recorded). The account plan was not recorded. The items describe behavior, not speed. Product wording is quoted exactly; "…" inside a quote is the product's own truncation. Very small text on screen may contain misread letters.

1. Which inputs were used?

   | Input | What was entered | The user's choices along the way |
   |---|---|---|
   | Typed notes | A full request for a 5-slide internship report with five bullet notes, pasted into the request box | Outline: "Add more technical detail", then "Looks good, build it". Style: "Spectrum Lines". Layouts: "Pick the rest for me" |
   | Document | A research-paper PDF attached, plus a request for a 5-slide summary "based strictly on the attached document" | Outline: "Focus more on PPTEVAL" (third of four buttons), then "Looks good, build it". Style: "Slate Brief". Photos: "Use my photos" |
   | Solid-black picture | One `.webp` picture, solid black, no text (named "Solid_black.svg.webp") | Topic typed ("education"); audience "Students or parents"; purpose "School orientation"; length "Short (5–6 slides)"; outline: "Add a slide for school safety", then "Looks good, build it"; style "Pastel Field"; layouts picked by hand for slides 1 to 6 and "Pick for me" for slide 7 |
   | Chart picture | One `.png` photo of a table-like astrology chart, no text (the person's name is written `[name]` here) | Audience "Personal deep-dive"; length "Detailed (12+ slides)"; outline: "Focus more on career", then "Looks good, build it"; style "Verdant Blend"; layouts "Pick the rest for me" |
   | Deck file | One `.pptx` file of 4 slides, [test_deck.pptx](evidence/napkin-ai/test_deck.pptx): text and a picture; a chart; unusual fonts and speaker notes; special characters. Sent alone, with no text | Audience "Internal team review"; length "4 slides (match source)" |

2. What is the overall sequence?
   - The product proposes an outline and waits for approval, then asks for a brand style, then asks for a layout per slide, and only then fills the canvas.
   - => Every design choice is a step the user answers before the slides exist, unlike a product that builds first and reports its assumptions after.

## What holds in every run

Items 3 to 13 hold in every run. Items 14 to 21 say only what differs.

3. What do the entry and request screens show?
   - The first screen has the headline "What do you want to create today?" and two cards: "Visuals" ("Turn any text into a visual.") and "Slides" with a badge "BETA" ("Build a full presentation."). Choosing "Slides" opens the request screen. How this screen is reached from the editor (for example from "New Napkin +") was not recorded.
   - The request screen has a banner "Create your presentation" / "Turn your content into a polished presentation with on-brand visuals. Present live or export to PowerPoint.", a "Back" button, a request box with the placeholder "Paste your text, describe your idea or drop a source file (Word, Excel...)", a `+` button at its bottom left and a light-grey send arrow at its bottom right. Under the box, four example links: "Lesson on photosynthesis", "Investor pitch for a note-taking app", "Training deck on objection handling", "Go-to-market strategy for a new product". None was used.
   - Not offered on this screen or the chat after it: a design-system dropdown, a microphone, a voice control, a model name, an effort label, a permission mode, a line like "AI can make mistakes", an empty-state message.
   - The `+` button shows the tooltip "Attach files" and opens the device's file picker straight away; there is no menu. The picker's file-type filter reads "Custom Files (*.csv;*.docx;*.htm…" and is cut off, so the whole list is unknown; a `.png` could be picked ([attach-files.png](evidence/napkin-ai/attach-files.png)).
   - The send arrow is light grey with an empty box and dark once the box holds text or a ready file.

4. What happens on send?
   - The banner and the links collapse upward, the box moves to the bottom, and the page becomes one centred chat column. There is no canvas, no artifact card, no spinner.
   - The request appears as a grey bubble at the top right. An attached file shows as a small pill with the file name and no thumbnail, at the bottom right of the bubble (or alone when no text was sent).
   - Under it, at the left, "Thinking" with two dots.
   - The box now reads "Send a message…". A cyan glow surrounds it while the product works and is off while it waits for the user. The send arrow stays light grey while the product works.
   - There is no stop control in any recording, at any step.

5. What does the status line show?
   - While the product works, one line in the chat names the phase and shows an elapsed-time counter in seconds that restarts at each user action: "Thinking", "Propose outline", "Create deck metadata", "Generating slides", "Generating previews", and once "Checking slide IDs for placement".
   - No percentage, step count or tips are shown. Nothing says what the product is reading, also when a picture or a document was attached.
   - Once per run, around the end of generation, a full-page dim with a white box "Finishing…" and one coloured dot covers the page for a moment, and the page address (`app.napkin.ai/page/…`) changes to another id around it. No message explains it.

6. How does the product ask a question?
   - Every question is a chat message with a small label (for example "OUTLINE OK?"), a sentence, and buttons.
   - A button sends its own text as a user message at once; the user's bubble shows the button text and the buttons disappear. The question and its answer stay in the chat.
   - Exception: a button ending in "…" with a small chevron, such as "Create a deck about…", puts its words in the box without sending, so the user finishes the sentence. The other "…" buttons ("For…", "Focus on…", "Make it…", "Adjust the…", "Add detail about…") were not pressed.
   - The buttons are written for the content: each outline and each question offers a different set. The user can also type a reply instead (done once, for the topic). No "Skip" control was seen.

7. When does it ask before the outline?
   - Only when the message has a picture or a deck file and no text. One question at a time, each after the previous answer, each repeating the earlier answer in its wording.
   - Solid-black picture: four questions, labelled "TOPIC", "AUDIENCE", "PURPOSE", "LENGTH". The first reads "I see you've shared an image — what would you like to build a presentation about?" with the single button "Create a deck about…". The picture is never described in later text.
   - Chart picture: two questions, "AUDIENCE" and "LENGTH". The first reads "I've got the astrological chart for [name]. Who is this presentation for?" with "Personal deep-dive", "Family or friends", "Professional consultation" and "For…". It already names the kind of picture and the person's name; whether these were read from the picture or from the file name is not shown.
   - The typed-notes and document runs asked none.
   - => The number of questions depends on what the input lacks.

8. How does the outline work?
   - The first answer to a request is an outline, not slides. It shows a one-sentence summary of the deck, a link "Expand All", and collapsed rows, each with a triangle, a numbered title and a one-line subtitle. Opening a row shows its bullets. "Expand All" opens every row and a link "Collapse All" appears.
   - Under the rows: the label "OUTLINE OK?", a sentence ("I've drafted a 5-slide technical report … Does this flow work for your lead?"), and four buttons. The first is always "Looks good, build it". The others change with the content, for example "Add more technical detail", "Make it more concise", "Adjust the…"; "Focus more on the UI", "Focus more on the backend", "Add detail about…"; "Add a slide for school safety", "Focus more on extracurriculars".
   - Pressing a revision button produces a new outline message with a new summary sentence and a new button set. The first outline and its question stay above in the chat.
   - A revision can change more than the message says. After "Focus more on career" on a 13-row outline, the revised outline also had 13 rows: three career rows were new and three other rows were gone, and the message mentioned only the career expansion. After "Add a slide for school safety" the new slide was inserted as row 3 of 7, not at the end, and later rows were renumbered.
   - No control for editing the outline text directly was seen; changes go through the buttons or a typed reply.
   - Accepting ("Looks good, build it") sends that text as a bubble and the product continues.

9. How is the look chosen?
   - After the outline is accepted the product writes a sentence tailored to the deck ("For a technical report to a lead, I've picked a few professional and clean brand styles. Which one fits the Edtronaut vibe?") and shows six style cards in a 3 × 2 grid, drawn one by one. Each card has a title, three small tiles, and an "Edit Colors" button; a link "More" sits under the grid.
   - Hovering a card shows other layouts in it. "Edit Colors" opens a list of five named palettes, each with a swatch; choosing one redraws the card. "More" doubles the grid to 12 cards.
   - The style names differ from run to run (for example "Deep Teal", "Blueprint Sketch", "Slate Brief", "Spectrum Lines", "Night Spectrum", "Soft Spectrum", "Quiet Accent", "Pure Outline", "Boardroom Calm", "Warm Ledger", "Pastel Field", "Sunlit Layers", "Verdant Blend"), and so does the introducing sentence.
   - Picking a card puts a card with the picture of that style in the chat, and the work continues. There is no design-system dropdown; this step is the only place a look is chosen.
   - Not checked: typing a style instead of picking one.

10. Does it ask about the pictures of a document?
    - Only with an attached document that has pictures: label "USE DOCUMENT PHOTOS?", "I found several images in your document, including architecture diagrams and scoring examples. Would you like me to use those in the deck, or should I generate new pictures instead?" with buttons "Use my photos" and "Generate pictures instead".
    - No such question appeared for picture-only messages or typed notes.

11. How are layouts chosen, and what does the editor look like?
    - After generating, the product shows, for slide 1, the slide title (for example "1. Final Internship Report"), the line "Hover to preview. Click to insert.", one tile with loading dots, and two buttons "Pick for me" and "Pick the rest for me".
    - About then the page turns into an editor: a top bar with a logo, a "New Napkin +" button, "Undo", and at the right "Present", "Export", "Share", "Agent", "Brand Studio" and an avatar. The chat becomes a narrower panel at the right with a `»` control; the left side is an empty canvas in the colour of the chosen style (once with the text "Pick a slide design here →").
    - Six layout tiles are shown for the slide. Hovering a tile previews that layout on the canvas. Clicking one inserts it ("Inserting visual…", then "Visual inserted."). A second level can open after a click: "< Back" above six more tiles and "… More" under them.
    - "Pick for me" picks for the current slide. "Pick the rest for me" picks for this slide and every later slide: "Auto-generating the best slides for you." shows, and for each next slide a list of tiles appears with the first tile used, then "Generating previews". For the last slide only "Pick for me" is shown.
    - Slides stack in one vertical column on the canvas, with a dashed empty frame under the last one. A strip of numbered thumbnails appears at the left: filled for slides made, empty frames for the rest. The canvas scrolls by itself to follow the newest slide. A column of seven unlabelled icons (palette, `A` with a plus, sparkles, two cycling arrows, `T`, pencil, shapes) shows at the right of a slide.
    - Both ways were observed: choosing a tile by hand for every slide, and "Pick the rest for me". With "Pick the rest for me" the first tile was used each time in the frames read.

12. What does the closing message say?
    - After the last slide, a message with a bold label, one sentence and four buttons. It contains no summary of the slides, no note about placeholders, no list of added wording, no statement about checking the layout, and no mention of speaker notes.
    - Typed notes: label "NEXT STEPS", "How does the report look to you?", buttons "Export the deck", "It's perfect", "Make it more formal", "Add more technical detail".
    - Solid-black picture: label "ORIENTATION DECK READY", "The orientation deck is ready, including the new slide on school safety. How would you like to proceed?", buttons "Export the deck", "Add more slides", "Change the brand style", "Apply a visual effect".
    - A pop-up appears over the lower canvas before the closing message: "How would you rate Napkin Slides so far?" with five faces, a "×" and "Don't ask me again". It was not used.
    - None of the closing buttons was pressed.

13. What is in the slides?
    - The numbers in the user's notes stay unchanged.
    - After "Add more technical detail" the slides contain statements the notes do not make ("Refactored monolithic endpoints into modular, testable route handlers", "Implemented standardized middleware for authentication and error handling", "Complete comprehensive API documentation using Swagger/OpenAPI standards", "Finalize unit and integration test coverage for the migrated services"). The product did not say it had added them.
    - Slide titles can differ from the outline row they came from ("Commitment to School Safety" became "School Safety Commitment"; "Beyond the Classroom" became "Student Life Opportunities" with a 2 × 2 grid whose cells are not the outline's bullets; "The Self Element and Inner Strength" became "Core Identity Analysis"). A slide label "Eyebrow" showed twice on one slide, although the outline had no such word. The product did not flag any of this.
    - Most slides have a picture or a diagram; where the pictures come from (generated or stock) is not shown.
    - No slide for the solid-black picture shows or mentions the picture. No slide showed a footer or page number. Speaker notes were never shown.
    - => An approved outline does not bind the slides: titles, content and added statements can drift from it without notice.

## Runs

14. Typed notes (full request)
    - The request goes straight to a first outline of five slides. The user asked for more technical detail, got a revised outline, accepted it, picked a style, let the product pick every layout, and watched slides 2 to 5 fill in one after another.
    - The deck has five slides, as asked. The first outline stayed closer to the notes than the slides did.

15. Document attached
    - The file is a pill in the box with its name (no thumbnail, page count or size) and a grey status text: "Uploading", then "Processing", then no status. The send arrow stays light grey until the status disappears. No progress bar or percentage.
    - After the send the bubble shows the typed text and a small label with the file name.
    - The product read the file before the first outline: the outline sections come from the paper. The request asked for "a title slide, problem statement, key features, architecture overview, and conclusion", but no outline row was called "problem statement" or "conclusion", before or after the revision, and the first outline's sentence said "as requested".
    - The outline was revised once ("Focus more on PPTEVAL"), then accepted. The style step followed, then "USE DOCUMENT PHOTOS?", answered "Use my photos".
    - Not checked: the layout step, the slides and the closing message; the recording ends while "Generating slides" was running, so what the product did with the document's pictures is not known.

16. Picture attached, no text
    - The file pill shows the name and no thumbnail. For the chart picture the status stayed "Uploading" until it disappeared, with no "Processing" step. No size, type or preview message showed.
    - Solid-black picture (recorded to the end): seven questions and choices before the layouts. The deck has seven slides about a school orientation, a topic the user typed; it came from the answers, not from the picture.
    - Chart picture (recorded up to the fourth slide): the outline had 13 rows built from the chart's house names, with "I'll use your uploaded chart image on the cover." After "Focus more on career" the revised 13-row outline came with "I've expanded the career section to three slides, covering your professional blueprint, ideal paths, and how to handle challenges. Does this revised flow look right?" The deck text is English with the chart's Vietnamese house names in brackets. The cover showed a drawn picture of a round chart on a table; whether it is the uploaded file was not compared.

17. Deck file sent with no text ([upload-test-deck.png](evidence/napkin-ai/upload-test-deck.png); the screen recording of this test is not kept)
    - The message is the file alone, "test_deck.pptx". The product accepted it and treated it as source material. It did not ask what the file was for and did not offer to bring the deck in as it was.
    - It asked two questions, one at a time: "AUDIENCE": "I've read your test report — who is the audience for this presentation?" (answered "Internal team review"), and "LENGTH": "How many slides should we aim for to cover this system test report?" (answered "4 slides (match source)"). It asked no "TOPIC" question.
    - The outline summary reads "A concise system test report for internal team review, following the structure of your original document." It has 4 rows, the same number and order as the source deck. Row titles are the source titles or close to them: the third row, "Kiểm tra Font và Ghi chú", rewords "Font lạ và ghi chú"; the fourth differs only in capital letters. The one-line subtitles are the product's own wording; none is a sentence from the source, which was checked against the file.
    - The outline question reads "OUTLINE OK?" / "I've drafted the 4 slides based on your document. Shall we proceed with this outline?" with "Looks good, build it", "Add more detail to data slide", "Change the tone to formal" and "Adjust…".
    - Not checked: whether the chart, the picture, the speaker notes, the unusual fonts or the special characters reached the slides.

18. The same deck file sent again into a chat that has a deck ([before-test-case-2-upload-pptx.png](evidence/napkin-ai/before-test-case-2-upload-pptx.png), [after-test-case-2-upload-pptx.png](evidence/napkin-ai/after-test-case-2-upload-pptx.png))
    - Before: the chat holds the deck of the previous test, with the closing message "NEXT STEPS" / "What would you like to do with your deck?" and "Present full screen", "Export to PowerPoint", "Review the slides", "Change the brand style", "Apply a visual effect".
    - After: the message is the same file alone. The reply, "REVIEW DECK": "Your 4-slide system test report is ready in Vietnamese. How would you like to proceed?" with "Present full screen", "Export to PowerPoint", "Edit slide text", "Change brand style", "Apply visual effect".
    - No question stands between the message and the reply. The product did not offer to replace the deck or to add slides, and did not ask what the file was for.
    - Not checked: whether the deck canvas changed; the images show the chat only.

19. A deck file with a request for new slides ([after-test-case-3-upload-pptx.png](evidence/napkin-ai/after-test-case-3-upload-pptx.png); whether this is the chat of item 18 is not shown)
    - The message holds the file and "Sử dụng nội dung trong file này làm tài liệu tham khảo để tạo thêm 2 slide mới về chủ đề Kỹ năng mềm" (use this file as reference material to create 2 more slides on soft skills).
    - The reply, in Vietnamese: "Dạ, tôi rất sẵn lòng hỗ trợ bạn. Tuy nhiên, hiện tại tôi không thể tạo thêm slide mới vào bản thuyết trình này. Tôi có thể giúp bạn chỉnh sửa nội dung, thay đổi phong cách thương hiệu (brand style) hoặc áp dụng các hiệu ứng hình ảnh cho 4 slide hiện có về báo cáo kiểm thử hệ thống. Bạn có muốn tôi điều chỉnh nội dung nào trên các slide hiện tại không?" It says it cannot add new slides now, and offers to edit content, change the brand style or apply visual effects to the 4 existing slides.
    - The product built no new slide. The reply language follows the request.
    - In another deck (item 21) the same product offered to create a new slide. Why it refused here is not known.

20. A protected deck file ([after-test-case-4-upload-pptx.png](evidence/napkin-ai/after-test-case-4-upload-pptx.png); `password_protected_test.pptx`, an encrypted fixture whose first bytes are those of a compound file, not a zip; not stored in this repository)
    - The pill in the request box reads "This file could not be uploaded." with a "×", in an error style. The `+` button is still there. No crash is visible.
    - The product rejected the file when it was attached, before any send. The message does not say that the file is protected.
    - Not checked: whether a rejected file blocks sending, and what "×" does.

21. Follow-up requests after the deck is ready ([prompt-scoped-change.png](evidence/napkin-ai/prompt-scoped-change.png), [proposed-approachs-after-prompt-global-follows-up.png](evidence/napkin-ai/proposed-approachs-after-prompt-global-follows-up.png); a finished six-slide deck about study habits, whose making was not recorded)
    - Change to one named slide: after the closing message "DECK READY" / "Your guide to study skills is ready. How would you like to proceed?", the user asked: "Update Slide 3 ("Time Management Strategies") to specifically include the Pomodoro Technique as a practical example. Do not change any other slides." The reply, "SLIDE UPDATED": "I've updated the "Time Management Strategies" slide to include the Pomodoro Technique details. What would you like to do next?" with "Export the deck", "Edit another slide", "Try a different brand style", "Add more slides". Slide 3 shows three cards: "The Pomodoro Technique: Study for 25 minutes, then take a 5-minute break.", "Time Blocking: …" and "Eat the Frog: …". No outline and no question came between the request and the reply.
    - Whole-deck change plus a new slide: "Make the tone of the entire presentation more playful and energetic, and add one new slide at the very end about "Forming Study Groups"." The reply, "TONE UPDATED": "I've updated the deck's tone to be more playful and energetic. Should I regenerate the existing slides to match this new vibe, or just create the new "Forming Study Groups" slide?" with "Regenerate all slides", "Just create the new slide", "Keep the change, don't regenerate now".
    - => A change to one named slide runs at once; a change to the whole deck asks how far to apply it.
    - Not checked: whether the other five slides stayed unchanged (no earlier state is shown), what each button does, and whether the canvas had changed when the question appeared.

22. Which messages never appeared?
    - No file-size, file-type, request-length, error, warning or offline message appeared in any recording.

23. What was not observed?
    - A vague typed request, a request in Vietnamese or another script, a very long text, an empty request, a very large file, several files at once, an unsupported file type, a stop (no control exists), a page reload, a lost connection, a second message sent during a run, "Undo", "Export", "Present" and "Brand Studio".
    - A damaged deck file.
    - The Agent panel was seen only in a static screenshot of an existing deck ([start.png](evidence/napkin-ai/start.png)): the greeting "I can help inspect and update visuals on this page. Try one of these to get started." and three chips "Which visual is in view?", "Make text more formal", "Make text more impactful". How that deck was made is not shown.

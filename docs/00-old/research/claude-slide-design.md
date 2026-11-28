# Claude Slide Design

Claude Slide Design is the slides chat of Claude (claude.ai): the user asks for a deck in chat and the slides appear on a canvas beside it. Recorded on 07-10-2026 by running the product: 13 screen recordings of making a first draft deck from the start screen, kept in [claude-deck-generation-behavior.zip](evidence/claude-slide-design/claude-deck-generation-behavior.zip), plus static screenshots. The account plan was not recorded, so limits may differ by plan. The items describe behavior, not speed. Product wording is quoted exactly; "…" inside a quote is the product's own truncation. A line marked "(reported)" was reported by the person who recorded and was not seen on screen.

1. Which inputs were used?

   | Input | What was entered |
   |---|---|
   | Typed notes | A full request for a 5-slide internship report with five bullet notes, nothing attached, no design system chosen |
   | Document | A research-paper PDF plus a request for a 5-slide summary "based strictly on the attached document" |
   | Near-black picture | One `.avif` picture, almost black, no text |
   | Chart photo | One photo of a table-like astrology chart (personal details are not reproduced here), no text |
   | Vague request | The two words "generate deck", nothing attached |
   | Dictated request | A Vietnamese request about an education slide, spoken with the microphone |
   | Short typed requests | "generate education slide" (stop and reload tests), "Generate Deck" (offline test), then "add 1 slides to the end" as a second message |
   | Large file | A 1.1 GB text file named "1000mb.txt" |
   | Six files | `.exe`, `.md`, `.zip`, `.xlsx`, `.docx`, `.pptx` attached together (static image only) |

## What holds in every run

Items 2 to 9 hold in every run. Items 10 to 24 say only what differs in one run.

2. What does the start screen show? ([start.png](evidence/claude-slide-design/start.png), and the start of every recording)
   - Headline "Paste your ideas and turn them into slides". A dropdown "Choose design system…" with nothing selected. The line "Claude is AI and can make mistakes." above the request box.
   - A request box with the placeholder "Reply" and a send control. Under it: `+`, a microphone and a chevron. At the right: "Sonnet 5.5", "High", "Manual". A static screenshot also lists a waveform control with a chevron; the recordings of the slides chat do not show it (item 15).
   - Canvas empty state: "This presentation has no slides yet. Add one, or let Claude add some." and an "Add slide" button.
   - The `+` menu ([add-files-connectors-and-more.png](evidence/claude-slide-design/add-files-connectors-and-more.png)), opened upward: "Add files or photos" (shortcut "Ctrl+U"), "Skills", "Connectors", "Design system", "Plugins", "Research". All but the first and the last have a chevron.
   - With no text and no file the send arrow is light grey; with text or a file card it is dark.

3. What happens on send?
   - The box empties and a small spinner replaces the send control. The headline, dropdown and disclaimer disappear.
   - An artifact card appears at the top of the chat: "Untitled" / "Claude Slides · Only you", with a share icon and a "Hide" button. A small red dot shows at the left of the chat.
   - The request appears as a chat bubble. Attached files appear right-aligned under the card. When only a file was sent there is no bubble.
   - The line "Getting set up for this session" appears with animated dots, and the spinner becomes a stop control (a circle with a square or dot).
   - The canvas leaves its empty state. Usually a grey, slide-shaped blank appears with a brown pill "Claude is working…" in its middle and one grey placeholder thumbnail under it. In the document run no blank slide appeared: the pill moved around an otherwise empty canvas, with "Add slide" below it.
   - The product names the chat on its own, replacing "Untitled presentation" (for example "Software engineering internship presentation", "PPTAgent presentation slides", "Greeting", "Generate deck", "Education slide"). The canvas title changes from "Untitled" to a name later, and the browser tab title follows.

4. What does the user see while waiting?
   - One progress line in the chat that changes while the work goes on, collapsed, with ">" at its right. Examples: "Getting set up for this session", "Using artifacts", "Reading a file, using artifacts", "Choosing colors, fonts, and slide layout for the report", "Designing the cover slide layout and section cards", "Checking vertical spacing and heights across each slide", "Creating a file", and summaries such as "Created 2 files, updated tasks, used artifacts" or "Created 6 files, read a file, and 11 more steps". Long lines are cut with "…".
   - Between concrete lines it shows single words ("Fathoming", "Musing", "Sifting", "Mulling", "Untangling", "Weighing", "Reckoning", "Figuring", "Sleuthing", "Pondering", "Cogitating", "Crystallizing", "Triangulating", "Picturing").
   - An elapsed-time counter in seconds, then minutes and seconds, sits at the end of the line a few seconds after the send. Earlier lines collapse into a summary line above the live one.
   - When a picture is attached, small thumbnails of the pictures the product reads appear at the right end of the progress line. Selecting one opens a full-screen viewer with a caption ("Read bg.png", "Read enh.png") and a counter ("2 of 2"). Progress lines name the work, for example "Inspecting a mostly black image for hidden detail", "Decoding a very dark image's faint symmetry", "Transcribing the chart's palace details carefully".
   - The grey blank slide and the pill stay until the first slide exists. In most runs the pill shows tips one at a time and repeats them: "Double-click any text on a slide to edit it." / "Comment on any slide, and Claude can revise it." / "Invite people to view, comment, or edit." / "Use @ in a comment to mention someone." / "Drag an image from your computer onto a slide." / "Every edit saves automatically." / "People you share with see your changes live." / "Drag a slide thumbnail to change the order." / "Select anything on a slide to comment on it." In the document run and the near-black picture run the pill kept the same text.
   - The stop control stays in the box for the whole run.
   - Not shown: a percentage, a step count or an estimate of time left.

5. How do the slides arrive?
   - The cover comes first. In some runs a dark blank slide with a small brown "Claude" cursor label shows first and the cover fills in; in others the cover appears with its content at once. A chat message may say "Cover is in. Now the other four slides." (or similar), and a second artifact card appears under the progress line.
   - A strip of thumbnails sits under the canvas. Slides not yet made are grey placeholder tiles; a small "Claude" tag marks the next tile to be filled.
   - The remaining slides appear in groups, not one by one (for example 2 to 4 together, then the last). The big canvas stays on the first slide while the strip fills. The user opens a later slide by selecting its thumbnail.
   - In some runs a bar with an info icon sits above the slide: "Claude is still adding slides (1 of 5 so far)." then "(4 of 5 so far)." It disappears when the last slide arrives, and the zoom label changes (for example from "51%" to "56%"). In the chart-photo and vague-request runs the bar was not seen.
   - A longer run can show a chat message in the middle, while slides are still being added.
   - A "…" menu on a thumbnail lists "Duplicate slide", "Copy slide", "Delete slide", "Skip slide", "Set as thumbnail", then "Add slide after", "Move left", "Move right". No entry was clicked.

6. What does the closing message say?
   - When the last slide is in, the stop control turns back into a grey send arrow and the final chat message streams in.
   - In every completed run the message says the deck is in the open Slides artifact and lists what each slide holds.
   - It describes the look in words (palette and fonts), and says that each slide has speaker notes. The notes were never opened in any recording.
   - It says it did not open or render the deck to check the layout ("I haven't opened it to check the layout, so it's worth a quick look.").
   - It names what is placeholder, what goes beyond the user's material, and what it assumed or left out.
   - It ends with an offer or an invitation, never a question. Five small icons follow (copy, speaker, thumbs up, thumbs down, retry; their labels were not shown).
   - No question or choice was offered in any run except the vague request (item 13).
   - => The product reports its own gaps (placeholders, added wording, unchecked layout) in the closing message instead of asking before it builds.

7. How are attached files shown?
   - In the box a file is a card at the top left. A document shows a first-page thumbnail and a small label ("PDF"). A picture the product can preview shows a thumbnail with no name or label. A picture it cannot preview (`.avif`) shows its name in two lines and a badge ("AVIF") with no thumbnail. Text-like files show a name, optionally a line count, and a badge ("TEXT", "MD", "ZIP", "XLSX", "DOCX", "PPTX").
   - No card showed a size, a page count, a progress bar or a remove control until the pointer was on it, when a small "×" appeared.
   - Selecting a card opens a preview over the page: a large picture with the file name as caption, or, for a type it cannot preview, a dialog with the file name as title and "File previews are not supported for this file type".
   - A request with only a file and no text can be sent. After the send the card moves to the chat, right-aligned under the artifact card.
   - The reply language follows the content: English for the near-black picture, Vietnamese for the chart photo and for the dictated Vietnamese request, while the interface stays English.

8. How does a clarifying question appear?
   - Only when the request lacks a topic (item 13). A panel replaces the request box; it is not a chat message. In the chat an orange tag "Asking a question" replaces the progress line.

9. What does an interruption look like?
   - A bordered notice with an info icon: "Claude's response was interrupted." with two buttons, "Edit prompt" and "Try again", above the five small icons. It appears after a stop, and briefly after a reload (items 19 and 20).
   - Not checked: what the two buttons do; neither was clicked.

## Runs

10. Typed notes (full request)
    - Result: five slides, as asked. No question was asked and no choice offered. The numbers in the notes (12 weeks, 3 legacy APIs, 250ms, 30%) appear unchanged on the slides.
    - Slides carry text that is not in the notes ("A full development sprint from start to finish.", "Package the project in containers.", "Thank you", "Questions and feedback welcome"). The closing message names only one of them as added wording ("Package the project in containers.").
    - The cover has a bracketed placeholder, "[Your name]", and the closing message lists it under "Before presenting:" with the added wording and with speaker notes that tell the user to add their own specifics.

11. Document attached
    - The PDF appears as a card with a first-page thumbnail and the label "PDF"; its name, size and page count are never shown. No upload or parsing indicator was visible on the card.
    - The progress line says "Reading a file, using artifacts". No clarifying question.
    - Slides arrive in three steps: the cover alone, then slides 2 to 4 together, then slide 5. The bar "Claude is still adding slides (N of 5 so far)." shows between the cover and the last slide.
    - Slides 2 to 5 carry a footer "Source: PPTAgent paper, …" with section, table or figure references, and a page number "n / 5". The cover has neither.
    - The closing message says it checked every figure against the paper's text and tables, that it did not look at the slides rendered, and states a content decision the user did not ask for: "I left out the paper's percentage-improvement claims. The percentages in the text don't match Table 3, so I used the table values instead."
    - => With a source document, the product cites the source on each slide and says where it departed from it.

12. Picture attached, no text
    - No error, warning or question came before or after the send, for either picture. The product built a deck from a picture-only request.
    - Near-black picture: the product showed the two pictures it had read. Before any slide it wrote: "Your image came through as a very dark, near-black geometric texture (checked with three different decoders). I'm putting it to work as the backdrop on the cover and closing slides of your empty deck, with placeholder text for now, since you didn't say what the deck is about." It built a five-slide "starter deck" whose text is all bracketed placeholder ("[Deck title goes here]", "[One-line subtitle] · [Presenter] · [Date]", "[SECTION LABEL]", "[Closing line or question]"). The closing message says the picture is the full-bleed backdrop, that it is too dark to read as visible shapes, and invites the user to say what the deck is about or send a brighter file. The five slides appeared together.
    - Chart photo: the product read the text in the picture and answered in Vietnamese. It built 17 slides of real content (overview, main houses, life cycles, a year outlook, advice) and chose that number itself. A second chat message in the middle restated its assumption ("Vì bạn chưa ghi yêu cầu cụ thể, mình tạm hiểu là cần bộ slide luận giải lá số bằng tiếng Việt."). The closing message lists limits of the picture ("Ảnh không cho biết vị trí Tuần và Triệt, nên mình không luận hai yếu tố này."), says it did not render the layout, and states its assumption ("Bạn chưa ghi rõ muốn gì, nên mình tự hiểu là cần một bộ luận giải tổng quan. Nếu bạn muốn hướng khác … mình sửa lại được."). The person's name from the chart went onto the cover and into the canvas title.
    - The chat title and canvas title are set from what the product read ("Greeting", "Starter deck"; "Tử Vi reading" and a Vietnamese title).
    - => With no text, the product assumes a purpose, builds, and states the assumption; it does not ask first.

13. Vague one-line request ("generate deck", nothing attached, no design system chosen)
    - Some work runs first (artifact card, progress lines, grey blank slide with the pill). Then a panel replaces the request box, with a title, a counter ("1 of 2", then "2 of 2"), "<", ">" and "×" controls, numbered options each with a title and a grey line, a row "Something else" with a pencil icon, a button "Skip", and a box "Or reply directly…". Option 1 is outlined and has a return-arrow icon.
    - First question: "What should the deck be about?" with "Project / product pitch" ("Problem, solution, traction, ask"), "Quarterly business update" ("Metrics, wins, risks, next steps"), "Technical overview" ("Architecture, decisions, roadmap"), "Sample deck to try the format" ("Generic draft with [placeholders] I can edit"). Second question: "Use your existing Design System for the look?" with "Yes, use my Design System" ("Apply its colors, type and tokens") and "No, pick a fresh look" ("I'll choose typefaces and a palette that fit the topic").
    - Another run used different wording for the same two questions ("Pick a kind below, or choose Other and type your topic, audience and rough length."; "Should I use your Design System for the look and feel?"), and a third run asked three questions (topic, design system, deck length).
    - While a question is open the canvas goes back to its empty state, the stop control leaves the box, the progress line does not change, and the elapsed counter keeps counting.
    - After the answers the panel is gone, the box reads "Reply" again and the disclaimer is back. The chat shows a bordered card with each question and the chosen option, and no bubble from the user. The tag becomes a plain line "Asking a question" with the counter. The grey blank slide, the pill and the stop control return.
    - Result: 12 slides in groups of three, every name, figure and claim a bracketed placeholder ("[Product name]", "[$X million]", "[N hours]"), a "[Product screenshot]" box, and icons where headshots would go. A mid-run message said "Continuing with the next three slides: how it works, the product, and the market." The closing message states: "You didn't give a topic, so every name, figure and claim is a bracketed placeholder … I didn't invent any statistics." and "You didn't pick your existing Design System, so I didn't use it.", and ends with an offer to replace the placeholders, adjust the slide count or restyle.
    - Not checked: what "Skip" and "×" do; the dropdown "Choose design system…" was not touched.

14. Voice dictation (microphone)
    - The microphone fills the request box with text; no separate voice screen opens.
    - Pressing the microphone replaces the placeholder "Reply" with "Connecting…" and the send arrow with two buttons, "×" and a check mark (no text labels). The microphone icon under the box disappears.
    - The placeholder becomes "Listening…" in italics, with a row of dots left of the buttons that turns into vertical bars of changing height (an unlabelled level meter).
    - Words appear in the box as the user speaks, in grey italic lower case with no punctuation. Earlier words change while later ones arrive. The box grows with the text.
    - Pressing the check mark turns the words into normal dark text with capital letters and full stops, removes "×" and the check mark, and brings back the microphone icon and the send arrow. The text is in the box, not sent. The words differ between the live version and the final one. Filler such as "uh" and English words inside the Vietnamese sentence were kept.
    - The text was then sent with the send arrow (tooltip "Send message" and "Enter"). It was accepted with no error and a deck with a Vietnamese cover was produced; that deck was not read in detail.
    - Not checked: what "×" does, and a request that is spoken and never confirmed.

15. Voice Mode (reported)
    - The waveform icon starts "Voice Mode", a separate conversational voice interface, different from the microphone ("Dictate"). It was not pressed in any recording.
    - A plain chat page opened by "Create with Claude" shows both a microphone and a waveform with a chevron; the slides chat shows only the microphone and a chevron.

16. File over the size limit (1.1 GB text file through `+` > "Add files or photos", a normal file picker)
    - The product did not accept the file. Right after the picker closed, a card appeared in the box: "1000mb.txt" with a small "×" and, in red at its bottom, "Too large to send". An amber toast with a warning-triangle icon and an "×" appeared at the bottom right over the canvas: "“1000mb.txt” is 1.1 GB, over the 400 MB limit. Choose a smaller file."
    - No progress bar, percentage or spinner showed first, so the rejection came before any visible upload. The page stayed responsive.
    - The card stayed in the box until the user pressed its "×". The toast disappeared at about the same time; whether it closed by itself or because of the removal is not known.
    - The send arrow turned dark while the card was there.
    - Not checked: whether send works with a rejected card present.

17. Several files of unusual types ([upload-exe-zip-md-xlsx-docx-pptx.png](evidence/claude-slide-design/upload-exe-zip-md-xlsx-docx-pptx.png), static image, nothing sent)
    - Six files of six types were accepted together with no error: the cards stand in one row, equal in size. The row is wider than the box, the sixth card is cut off, and a horizontal scroll bar with an arrow at each end sits under the row.
    - No unsupported-type error was shown for `.exe` or `.zip`. The `.exe` card shows "19,785 lines" and the badge "TEXT" (not "EXE"); the `.md` card shows "98 lines" and "MD". The `.zip`, `.xlsx`, `.docx` and `.pptx` cards show only a badge. No card has a thumbnail, remove control or warning.
    - A limit of 20 files per request (reported, from official documentation; never seen on screen).

18. Empty request, very long text, other languages (reported)
    - With nothing typed and no file the send control stays disabled (dimmed). In a recording the empty box shows a light-grey arrow.
    - A very long pasted text behaved like a normal request; no limit, counter or message is known, and no text length was recorded.
    - Non-Latin scripts and other languages are accepted without a UI error; success depends on the model's language ability. A Vietnamese request was accepted (item 14).

19. Stop during the wait ("generate education slide", stop pressed while the grey blank slide and the tip pill showed)
    - The stop control turned into a small spinner for a moment. Then, in one step, the progress line was replaced by the product's last line ("I'll start by reading your new Slides artifact to get its instructions.") and a collapsed "Read Untitled" line, with the interruption notice below and the five small icons. The spinner became the grey send arrow, the box read "Reply" and the disclaimer returned.
    - The user's bubble and the artifact card stayed. No toast, dialog or confirmation appeared.
    - The canvas stayed on the blank slide and the pill for a short while, then fell back to its empty state, with no pill and no placeholder thumbnail.
    - Hovering the stop control shows the tooltip "Stop response" with a shortcut hint that was not read with certainty.
    - Not checked: a stop when slides already exist; no slide had been created.

20. Reload during the wait
    - The old page stayed drawn briefly, then went blank white, then a grey loading skeleton showed with the left side empty.
    - The chat came back from history: the user's bubble, a card with the earlier answers, a generic artifact card "Untitled artifact" / "Artifact", the product's last line, and the interruption notice with "Edit prompt" and "Try again". The box showed a send arrow, not the stop control, and the right panel was blank under the title "Artifacts". This stopped-looking state stayed on screen for a moment only.
    - Then the notice was replaced by the live progress lines, the artifact card became "Untitled" / "Claude Slides · Only you", the canvas showed a spinner on white, and later the grey blank slide, the pill and the stop control came back. The run continued.
    - The elapsed counter was never reset: it kept the value it would have had without the reload.
    - => A reload in the middle of a run does not cancel it; the page reconnects to the running work.
    - Not checked: the finished deck; the recording ends with the run still going.

21. Connection lost during the wait (Wi-Fi off mid-run, after two questions had been answered, then on again; nothing typed, stop not pressed)
    - The run was not interrupted. After a short delay (not at the moment the connection dropped) an amber rounded bar with a warning-triangle icon appeared directly above the request box: "You're offline. Check your connection." It has no button and no "×".
    - Until the notice appeared, and while it was shown, nothing else changed: the stop control stayed, the blank slide and rotating tips stayed on the canvas, the elapsed counter kept counting, and the progress line showed only single words ("Weighing", "Contemplating").
    - When the connection returned the notice faded. No "reconnecting" text, banner, toast, dialog or "interrupted" notice appeared. The progress line then showed concrete lines again ("Choosing fonts, colors, and slide-by-slide deck structure"). The run was still going at the end of the recording.
    - Not checked: typing, sending or stopping while offline, and an offline period long enough to end the run.

22. Second message during the wait ("add 1 slides to the end", sent while the first run was going)
    - The stop control became a send arrow while the user typed, and returned once the message was sent. The message was accepted at once: the box emptied and the message showed as a right-aligned bubble under a new artifact card.
    - Under the bubble a small grey label read "Send now" with key hints "Ctrl" and a return-arrow symbol. It was not clicked. It faded after the first run's work finished and the second message began to be handled.
    - No error, warning or toast appeared, and no limit on queued messages was shown.
    - The first run kept going on its own, with the older deck's card button changing from "Hide" to "Open". When the first run's file creation ended, the product started on the second message ("Musing", "Editing a file"). The cover subtitle first said "10 slides" and changed to "11 slides" once the product had taken the second message into account. A mid-run message said: "Cover is live. I'm adding the 11th slide (a closing recap) as you asked, and I'm now writing the method slides."
    - The final deck had 11 slides, the last being the requested recap. The closing message said so, and also: "The habits slide is based on Dunlosky et al. (2013), and that citation comes from my memory rather than a lookup. The spaced-repetition schedule (Day 1, 2, 7, 21) is an illustrative example I made up, not research-backed intervals." and "You didn't specify a style, so I picked my own look rather than your saved "Design System"." and "The deck is private until you share it from the page's Share menu."
    - => A message sent during a run is queued and handled after the current work, and folded into the same deck.

23. Skills, Plugins, Connectors and other menu entries (opened and read; nothing turned on or off, added, uploaded, created or used, and no request sent)
    - Skills submenu (from `+`): a list of nine skill names, each with a small scroll icon and no toggle. Hovering a row shows a tooltip with the skill's description. Under a divider: "Manage skills" and "Browse skills".
    - Plugins submenu: one entry, "Engineering" (with a chevron, not opened), then "Manage plugins" and "Browse plugins".
    - Connectors submenu ([connectors.png](evidence/claude-slide-design/connectors.png)): "Add connector" (opens "Browse connectors" and "Add custom connector"), "Manage connectors", three connected services each with an on/off switch (Atlassian Rovo, Google Drive, Claude in Chrome), "Add from Atlassian Rovo", "Add from Google Drive", "Tool access".
    - The management window (from "Manage skills" or "Manage plugins") is a large window over the dimmed chat with a left list (Settings, Customize with Skills / Connectors / Plugins, Platform with API keys), tabs "Yours" and "Discover", a search box, filter and sort icons, and a "+ Add" button. "Yours" in Skills lists 3 skills "Created by you" and 16 "From Anthropic & Partners", each with tag chips, a description start and a date; a "Turn off" button shows on hover. "Discover" shows a banner, a "For you" row, "New …", "Most installed …" and "Categories" ("Show all 55") with install counts; the Skills and Plugins Discover pages show the same cards and counts.
    - "+ Add" in Skills offers "Upload skill", "Create a skill", "Create with Claude"; in Plugins "Add marketplace", "Upload plugin", "Create a plugin", "Create with Claude". "Upload a skill" says "Add a skill to your workspace. A security scan runs when you upload." "Upload a plugin" shows a red box: "Make sure you trust a plugin before installing or using it. Uploaded plugins are not controlled by Anthropic, and Anthropic cannot verify that they will work as intended. See each plugin's homepage for more information." A plugin page lists the connectors and tools it can use, with the line "Can send data to other services".
    - "Create with Claude" leaves the slides chat: in the same browser tab it opens a plain chat page with an unsent prefilled prompt ("Let's create a skill together using your skill-creator skill. First ask me what the skill should do.").
    - Not checked: the Research entry, the Design system submenu and dropdown (seen only closed), and whether a skill, plugin or Research changes the first draft.

24. Permission mode and model controls
    - A menu headed "Permission mode" ([permission-mode.png](evidence/claude-slide-design/permission-mode.png)) has two options: "Manual" (checked): "Claude asks before using new tools or opening new sites." and "Auto": "Claude runs on its own and pauses to ask if anything looks unsafe." How the menu opens is not shown (presumably the "Manual" label under the request box). "Auto" was never chosen.
    - Another dropdown selects the underlying AI model (reported). What "High" controls is not known.

25. Which messages never appeared?
    - No quota, rate-limit, file-type, page-count, token, parsing or request-length message appeared in any recording. The only size limit seen is the 400 MB file limit (item 16).

26. What was not observed?
    - A failure of the generating service, and any "interrupted" cause other than a stop or a reload.
    - What "Edit prompt", "Try again", "Skip", "×" on the question panel and "Send now" do.
    - The content of speaker notes.
    - The attach step itself (menu click and file picker) for the document and the pictures; the recordings start with the file already in the box.

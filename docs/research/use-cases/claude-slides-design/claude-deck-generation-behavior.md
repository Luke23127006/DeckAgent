---
product: Claude Slide Design
flow: "Generate an initial draft deck from the start screen"
status: Recorded
recorded_on: "2026-10-07"
account_or_plan: ""    # not recorded; limits may differ by plan
media: [CS-01-happy-path.mp4, CS-01-attach-PPTAgent-paper.mp4, CS-01-upload-1000MB-file.mp4, CS-01-use-micro.mp4, CS-01-attach-black-photo.mp4, CS-01-attach-photo-tu-vi.mp4.mp4, CS-01-simple-prompt-generate-deck.mp4, CS-01-stop-during-wait.mp4, CS-01-reload-mid-wait.mp4, CS-01-second-message-during-wait.mp4, CS-01-disconnect-wifi.mp4, CS-01-skills.mp4, CS-01-plugins.mp4]   # the videos are inside ui/media/claude-deck-generation-behavior.zip (names unchanged)
---

# Claude Slide Design: how it generates an initial draft deck

This report is evidence of what the product showed. It names no use case, requirement or rule; those cite this report. It describes behavior, not speed. Exact wording is quoted; "…" inside a quote is the product's own truncation. Anything reported by the user and not recorded is marked *(reported)*.

Reading guide: "Common behaviors" says what holds in every flow. "Flows" only says what differs. A flow that does not mention a behavior behaves as the common behavior says.

## Inputs used

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

## Common behaviors

### Start screen

Seen in a static screenshot ([start.png](ui/images/start.png)) and at the start of every recording.

- Headline "Paste your ideas and turn them into slides". A dropdown "Choose design system…" with nothing selected. The line "Claude is AI and can make mistakes." above the request box.
- Request box with the placeholder "Reply" and a send control. Under it: `+`, a microphone, and a chevron. A static screenshot also lists a waveform control with a chevron; the recordings of the slides chat do not show it (see "Voice Mode"). At the right: "Sonnet 5.5", "High", "Manual".
- Canvas empty state: "This presentation has no slides yet. Add one, or let Claude add some." and an "Add slide" button.
- `+` menu ([add-files-connectors-and-more.png](ui/images/add-files-connectors-and-more.png)), opened upward: "Add files or photos" (shortcut "Ctrl+U"), "Skills", "Connectors", "Design system", "Plugins", "Research". All but the first and the last have a chevron.
- With no text and no file, the send arrow is light grey; with text or a file card it is dark.

### What happens on send

1. The box empties and a small spinner replaces the send control. The headline, dropdown and disclaimer disappear.
2. An artifact card appears at the top of the chat: "Untitled" / "Claude Slides · Only you", with a share icon and a "Hide" button. A small red dot shows at the left of the chat.
3. The request appears as a chat bubble. Attached files appear right-aligned under the card. When only a file was sent there is no bubble.
4. The line "Getting set up for this session" appears with animated dots.
5. The spinner becomes a stop control (a circle with a square or dot).
6. The canvas leaves its empty state. Usually a grey, slide-shaped blank appears with a brown pill "Claude is working…" in its middle and one grey placeholder thumbnail under it. In the document run no blank slide appeared: the pill moved around an otherwise empty canvas, with "Add slide" below it.
7. The product names the chat on its own, replacing "Untitled presentation" (for example "Software engineering internship presentation", "PPTAgent presentation slides", "Greeting", "Generate deck", "Education slide"). The canvas title changes from "Untitled" to a name later, and the browser tab title follows.

### Waiting display

- **Chat progress line.** One line of text that changes while the work goes on, collapsed, with an arrow ">" at its right. Examples: "Getting set up for this session", "Using artifacts", "Reading a file, using artifacts", "Choosing colors, fonts, and slide layout for the report", "Designing the cover slide layout and section cards", "Checking vertical spacing and heights across each slide", "Creating a file", and summaries such as "Created 2 files, updated tasks, used artifacts" or "Created 6 files, read a file, and 11 more steps". Long lines are cut with "…". Between concrete lines it shows single words ("Fathoming", "Musing", "Sifting", "Mulling", "Untangling", "Weighing", "Reckoning", "Figuring", "Sleuthing", "Pondering", "Cogitating", "Crystallizing", "Triangulating", "Picturing"). An elapsed-time counter in seconds, then minutes and seconds, sits at the end of the line a few seconds after the send. Earlier lines collapse into a summary line above the live one.
- **Reading pictures.** When a picture is attached, small thumbnails of the pictures the product reads appear at the right end of the progress line. Selecting one opens a full-screen viewer with a caption ("Read bg.png", "Read enh.png") and a counter ("2 of 2"). Progress lines name the work, for example "Inspecting a mostly black image for hidden detail", "Decoding a very dark image's faint symmetry", "Transcribing the chart's palace details carefully".
- **Canvas.** The grey blank slide and the pill stay until the first slide exists. In most runs the pill shows tips one at a time and then repeats them: "Double-click any text on a slide to edit it." / "Comment on any slide, and Claude can revise it." / "Invite people to view, comment, or edit." / "Use @ in a comment to mention someone." / "Drag an image from your computer onto a slide." / "Every edit saves automatically." / "People you share with see your changes live." / "Drag a slide thumbnail to change the order." / "Select anything on a slide to comment on it." In the document run and the near-black picture run the pill kept the same text.
- **Stop control.** It stays in the box for the whole run.
- **Not shown.** No percentage, no step count, no estimate of time left.

### How slides arrive

- The cover comes first. In some runs a dark blank slide with a small brown "Claude" cursor label shows first and the cover fills in; in others the cover appears with its content at once. A chat message may say "Cover is in. Now the other four slides." (or similar), and a second artifact card appears under the progress line.
- A strip of thumbnails sits under the canvas. Slides not yet made are grey placeholder tiles; a small "Claude" tag marks the next tile to be filled.
- The remaining slides appear in groups, not one by one (for example 2–4 together, then the last). The big canvas stays on the first slide while the strip fills. The user opens a later slide by selecting its thumbnail.
- In some runs a bar with an info icon sits above the slide: "Claude is still adding slides (1 of 5 so far)." then "(4 of 5 so far)." It disappears when the last slide arrives, and the zoom label changes (for example from "51%" to "56%"). In the chart-photo and vague-request runs the bar was not seen.
- A longer run can show a chat message in the middle, while slides are still being added.
- A per-slide "…" menu on a thumbnail lists "Duplicate slide", "Copy slide", "Delete slide", "Skip slide", "Set as thumbnail", then "Add slide after", "Move left", "Move right". No entry was clicked in the recordings.

### Closing message

When the last slide is in, the stop control turns back into a grey send arrow and the final chat message streams in. In every completed run the message:

- says the deck is in the open Slides artifact and lists what each slide holds;
- says the look in words (palette and fonts), and that each slide has speaker notes (the notes were never opened in any recording);
- says it did not open or render the deck to check the layout ("I haven't opened it to check the layout, so it's worth a quick look.");
- names what is placeholder, what goes beyond the user's material, and what it assumed or left out;
- ends with an offer or an invitation, never a question;
- is followed by five small icons (copy, speaker, thumbs up, thumbs down, retry; their labels were not shown).

No question or choice was offered in any run except the vague request.

### Attached files in the request box and in the chat

- In the box a file is a card at the top left. A document shows a first-page thumbnail and a small label ("PDF"). A picture the product can preview shows a thumbnail with no name or label. A picture it cannot preview (`.avif`) shows its name in two lines and a badge ("AVIF") with no thumbnail. Text-like files show a name, optionally a line count, and a badge ("TEXT", "MD", "ZIP", "XLSX", "DOCX", "PPTX"). No card showed a size, a page count, a progress bar or a remove control until the pointer was on it, when a small "×" appeared.
- Selecting a card opens a preview over the page: a large picture with the file name as caption, or, for a type it cannot preview, a dialog with the file name as title and the text "File previews are not supported for this file type".
- A request with only a file and no text can be sent. After the send the card moves to the chat, right-aligned under the artifact card.
- The reply language follows the content: English for the near-black picture, Vietnamese for the chart photo and for the dictated Vietnamese request, while the interface stays English.

### Clarifying-question panel

Appears only when the request lacks a topic (see "Vague request"). It replaces the request box; it is not a chat message. In the chat an orange tag "Asking a question" replaces the progress line.

### Interruption notice

A bordered notice with an info icon: **"Claude's response was interrupted."** with two buttons, "Edit prompt" and "Try again", above the five small icons. It appears after a stop, and briefly after a reload (see those flows). Neither button was clicked in any recording, so what they do is not known.

## Flows

### Typed notes (full request)

- Result: five slides, as asked. No question was asked and no choice offered. The numbers in the notes (12 weeks, 3 legacy APIs, 250ms, 30%) appear unchanged on the slides.
- Slides carry text that is not in the notes ("A full development sprint from start to finish.", "Package the project in containers.", "Thank you", "Questions and feedback welcome"). The closing message names only one of them as added wording ("Package the project in containers.").
- The cover has a bracketed placeholder, "[Your name]", and the closing message lists it under "Before presenting:" with the added wording and with speaker notes that tell the user to add their own specifics.
- The closing message also says: "Your 5-slide report is now in the open Slides artifact. I haven't opened it to check the layout, so it's worth a quick look."

### Document attached

- The attached PDF appears as a card with a first-page thumbnail and the label "PDF"; its name, size and page count are never shown. No upload or parsing indicator was visible on the card.
- The progress line says "Reading a file, using artifacts". No clarifying question.
- Slides arrive in three steps: the cover alone, then slides 2–4 together, then slide 5. The bar "Claude is still adding slides (N of 5 so far)." shows between the cover and the last slide.
- Slides 2–5 carry a footer "Source: PPTAgent paper, …" with section, table or figure references, and a page number "n / 5". The cover has neither.
- The closing message says it checked every figure against the paper's text and tables, that it did not look at the slides rendered, and states a content decision the user did not ask for: "I left out the paper's percentage-improvement claims. The percentages in the text don't match Table 3, so I used the table values instead."

### Picture attached, no text

- No error, warning or question came before or after the send, for either picture. The product built a deck from a picture-only request.
- **Near-black picture.** The product showed the two pictures it had read (see "Reading pictures"). Before any slide it wrote: "Your image came through as a very dark, near-black geometric texture (checked with three different decoders). I'm putting it to work as the backdrop on the cover and closing slides of your empty deck, with placeholder text for now, since you didn't say what the deck is about." It built a five-slide "starter deck" whose text is all bracketed placeholder ("[Deck title goes here]", "[One-line subtitle] · [Presenter] · [Date]", "[SECTION LABEL]", "[Closing line or question]"). The closing message says the picture is the full-bleed backdrop, that it is too dark to read as visible shapes, and invites the user to say what the deck is about or send a brighter file. The bar "Claude is still adding slides (1 of 5 so far)." showed and the five slides appeared together.
- **Chart photo.** The product read the text in the picture and answered in Vietnamese. It built 17 slides of real content (overview, main houses, life cycles, a year outlook, advice) and chose that number itself. Its first chat line was a short statement of what it would do. A second chat message in the middle said how many slides were in and what came next, and restated its assumption ("Vì bạn chưa ghi yêu cầu cụ thể, mình tạm hiểu là cần bộ slide luận giải lá số bằng tiếng Việt."). The closing message lists limits of the picture ("Ảnh không cho biết vị trí Tuần và Triệt, nên mình không luận hai yếu tố này."), says it did not render the layout, and states its assumption ("Bạn chưa ghi rõ muốn gì, nên mình tự hiểu là cần một bộ luận giải tổng quan. Nếu bạn muốn hướng khác … mình sửa lại được."). The person's name from the chart went onto the cover and into the canvas title.
- The chat title and canvas title are set from what the product read ("Greeting", "Starter deck"; "Tử Vi reading" and a Vietnamese title).

### Vague one-line request

Typed "generate deck", nothing attached, no design system chosen.

- Some work runs first (artifact card, progress lines, grey blank slide with the pill). Then the panel replaces the request box, with a title, a counter ("1 of 2", then "2 of 2"), "<", ">" and "×" controls, numbered options each with a title and a grey line, a row "Something else" with a pencil icon, a button "Skip", and a box "Or reply directly…". Option 1 is outlined and has a return-arrow icon.
- First question: "What should the deck be about?" with "Project / product pitch" ("Problem, solution, traction, ask"), "Quarterly business update" ("Metrics, wins, risks, next steps"), "Technical overview" ("Architecture, decisions, roadmap"), "Sample deck to try the format" ("Generic draft with [placeholders] I can edit"). Second question: "Use your existing Design System for the look?" with "Yes, use my Design System" ("Apply its colors, type and tokens") and "No, pick a fresh look" ("I'll choose typefaces and a palette that fit the topic"). Another run used different wording for the same two questions ("Pick a kind below, or choose Other and type your topic, audience and rough length."; "Should I use your Design System for the look and feel?"), and a third run asked three questions (topic, design system, deck length).
- While a question is open the canvas goes back to its empty state, the stop control leaves the box, the progress line does not change, and the elapsed counter keeps counting.
- After the answers the panel is gone, the box reads "Reply" again and the disclaimer is back. The chat shows a bordered card with each question and the chosen option, and no bubble from the user. The tag becomes a plain line "Asking a question" with the counter. The grey blank slide, the pill and the stop control return.
- "Skip" and "×" were visible and not used, so what they do is not known. The dropdown "Choose design system…" was not touched.
- Result: 12 slides in groups of three, every name, figure and claim a bracketed placeholder ("[Product name]", "[$X million]", "[N hours]"), a "[Product screenshot]" box, and icons where headshots would go. A mid-run message said "Continuing with the next three slides: how it works, the product, and the market." The closing message states: "You didn't give a topic, so every name, figure and claim is a bracketed placeholder … I didn't invent any statistics." and "You didn't pick your existing Design System, so I didn't use it." and ends with an offer to replace the placeholders, adjust the slide count or restyle.

### Voice dictation (microphone)

*Recorded.* The microphone fills the request box with text; no separate voice screen opens.

1. Pressing the microphone replaces the placeholder "Reply" with "Connecting…" and replaces the send arrow by two buttons, "×" and a check mark (no text labels). The microphone icon under the box disappears.
2. The placeholder becomes "Listening…" in italics, with a row of dots left of the buttons that turns into vertical bars of changing height (a level meter; not labelled).
3. Words appear in the box as the user speaks, in grey italic lower case with no punctuation. Earlier words change while later ones arrive. The box grows with the text.
4. Pressing the check mark turns the words into normal dark text with capital letters and full stops, removes "×" and the check mark, and brings back the microphone icon and the send arrow. The text is in the box, not sent. The words differ between the live version and the final one. Filler such as "uh" and English words inside the Vietnamese sentence were kept.
5. The user then sent the text with the send arrow (tooltip "Send message" and "Enter"). It was accepted with no error and a deck with a Vietnamese cover was produced; that generation was not read in detail.

"×" was never pressed, so what it does is not known. A request that is only spoken and never confirmed was not tried.

### Voice Mode *(reported)*

The user reports that the waveform icon starts "Voice Mode", a separate conversational voice interface, different from the microphone ("Dictate"). It was not pressed in any recording. A plain chat page opened by "Create with Claude" shows both a microphone and a waveform with a chevron; the slides chat shows only the microphone and a chevron.

### File over the size limit

A 1.1 GB text file was attached through `+` > "Add files or photos" (a normal file picker opened).

- **The product did not accept the file.** Right after the picker closed, a card appeared in the box: "1000mb.txt" with a small "×" and, in red at its bottom, "Too large to send". An amber toast with a warning-triangle icon and an "×" appeared at the bottom right over the canvas: "“1000mb.txt” is 1.1 GB, over the 400 MB limit. Choose a smaller file."
- No progress bar, percentage or spinner showed first, so the rejection came before any visible upload. The page stayed responsive.
- The card stayed in the box until the user pressed its "×". The toast disappeared at about the same time; whether it closed by itself or because of the removal is not known.
- The send arrow turned dark while the card was there. Whether send works with a rejected card present was not tried.

### Several files and conventionally unsupported types

Static image only ([upload-exe-zip-md-xlsx-docx-pptx.png](ui/images/upload-exe-zip-md-xlsx-docx-pptx.png)); nothing was sent.

- Six files of six types were accepted together with no error: the cards stand in one row, equal in size. The row is wider than the box, the sixth card is cut off, and a horizontal scroll bar with an arrow at each end sits under the row.
- No unsupported-type error was shown for `.exe` or `.zip`. The `.exe` card shows "19,785 lines" and the badge "TEXT" (not "EXE"); the `.md` card shows "98 lines" and "MD". The `.zip`, `.xlsx`, `.docx` and `.pptx` cards show only a badge and no other metric. No card has a thumbnail, remove control or warning.
- A limit of 20 files per request *(reported, from official documentation and the user; never seen on screen)*.

### Empty request, very long text, other languages *(reported)*

- With nothing typed and no file the send control stays disabled (dimmed). In a recording the empty box shows a light-grey arrow.
- A very long pasted text behaved like a normal request; no limit, counter or message is known, and no text length was recorded.
- Non-Latin scripts and other languages are accepted without a UI error; success depends on the model's language ability. A Vietnamese request was accepted (see the dictation flow).

### Stop during the wait

Typed "generate education slide", then pressed the stop control while the grey blank slide and the tip pill were showing.

- The stop control turned into a small spinner for a moment (no tooltip seen). Then, in one step, the progress line was replaced by the product's last line ("I'll start by reading your new Slides artifact to get its instructions.") and a collapsed "Read Untitled" line, with the interruption notice below and the five small icons. The spinner became the grey send arrow, the box read "Reply" and the disclaimer returned.
- The user's bubble and the artifact card stayed. No toast, dialog or confirmation appeared.
- The canvas stayed on the blank slide and the pill for a short while, then fell back to its empty state ("This presentation has no slides yet. Add one, or let Claude add some." and "Add slide"), with no pill and no placeholder thumbnail.
- No slide had been created, so what a stop does when slides already exist was not recorded. "Edit prompt" and "Try again" were not clicked.
- Hovering the stop control shows the tooltip "Stop response" with a shortcut hint that was not read with certainty.

### Reload during the wait

*(Matches the user's report: reloading mid-wait does not cancel the generation.)* The page was reloaded in the middle of a run that was already showing progress.

- The old page stayed drawn briefly, then went blank white, then a grey loading skeleton showed with the left side empty.
- The chat came back from history: the user's bubble, a card with the earlier answers, a generic artifact card "Untitled artifact" / "Artifact", the product's last line, and the interruption notice "Claude's response was interrupted." with "Edit prompt" and "Try again". The box showed a send arrow, not the stop control, and the right panel was blank under the title "Artifacts". This stopped-looking state stayed on screen for a moment only.
- Then the notice was replaced by the live progress lines, the artifact card became "Untitled" / "Claude Slides · Only you", the canvas showed a spinner on white, and later the grey blank slide, the pill and the stop control came back. The run continued.
- The elapsed counter was never reset: it kept the value it would have had without the reload.
- The recording ends with the run still going, so what the finished deck looked like was not recorded.

### Connection lost during the wait

Wi-Fi was turned off mid-run (after two questions had been answered), then turned on again after a short while. Nothing was typed and stop was not pressed.

- The run was not interrupted. After a short delay (not at the moment the connection dropped) an amber rounded bar with a warning-triangle icon appeared directly above the request box: **"You're offline. Check your connection."** It has no button and no "×".
- Until the notice appeared, and while it was shown, nothing else changed: the stop control stayed, the blank slide and rotating tips stayed on the canvas, the elapsed counter kept counting, and the progress line showed only single words ("Weighing", "Contemplating") with its dots.
- When the connection returned the notice faded and was gone shortly after. No "reconnecting" text, banner, toast, dialog or "interrupted" notice appeared. The progress line then showed concrete lines again ("Choosing fonts, colors, and slide-by-slide deck structure"). The run was still going at the end of the recording.
- Not tested: typing or sending while offline, stop while offline, an offline period long enough to end the run.

### Second message during the wait

A second request ("add 1 slides to the end") was typed and sent while the first run was going.

- The stop control became a send arrow while the user typed, and the stop control returned once the message was sent. The message was accepted at once: the box emptied and the message showed as a right-aligned bubble under a new artifact card.
- Directly under the bubble a small grey label read **"Send now"** followed by key hints "Ctrl" and a return-arrow symbol. Whether it is a button is not shown; it was not clicked. It faded after the first run's work finished and the second message began to be handled.
- No error, warning or toast appeared and no limit on queued messages was shown.
- The first run kept going on its own, with the older deck's card button changing from "Hide" to "Open". When the first run's file creation ended, the product started on the second message ("Musing", "Editing a file"). The cover subtitle first said "10 slides" and changed to "11 slides" once the product had taken the second message into account. A mid-run message said: "Cover is live. I'm adding the 11th slide (a closing recap) as you asked, and I'm now writing the method slides."
- The final deck had 11 slides, the last being the requested recap. The closing message said so, and also: "The habits slide is based on Dunlosky et al. (2013), and that citation comes from my memory rather than a lookup. The spaced-repetition schedule (Day 1, 2, 7, 21) is an illustrative example I made up, not research-backed intervals." and "You didn't specify a style, so I picked my own look rather than your saved "Design System"." and "The deck is private until you share it from the page's Share menu."

### Skills, Plugins, Connectors and other menu entries

Opened and read; nothing was turned on or off, added, uploaded, created or used, and no request was sent in these recordings. Whether a skill, plugin or Research changes the first draft is therefore not known.

- **Skills submenu (from `+`).** A list of nine skill names, each with a small scroll icon and no toggle: decision-table, deep-research, docs, google-workspace, import-memory, morning, sentence-chunking, skill-creator, youtube-summary. Hovering a row shows a dark tooltip with the skill's description. Under a divider: "Manage skills" and "Browse skills".
- **Plugins submenu.** One entry, "Engineering" (with a chevron, not opened), then "Manage plugins" and "Browse plugins".
- **Connectors submenu** (static screenshot, [connectors.png](ui/images/connectors.png)): "Add connector" (opens "Browse connectors" and "Add custom connector"), "Manage connectors", three connected services each with an on/off switch (Atlassian Rovo, Google Drive, Claude in Chrome), "Add from Atlassian Rovo", "Add from Google Drive", "Tool access".
- **Research** and **Design system** entries were never opened. The design-system dropdown above the box is only seen closed.
- **Management window** (from "Manage skills" or "Manage plugins"): a large window over the dimmed chat, with a left list (Settings, Customize with Skills / Connectors / Plugins, Platform with API keys), the title, tabs "Yours" and "Discover", a search box, a filter icon, a sort icon, and a black "+ Add" button.
  - "Yours" in Skills lists 3 skills "Created by you" and 16 "From Anthropic & Partners", each with tag chips, a description start and a date. A "Turn off" button shows on hover on one row (not pressed). In Plugins it lists one, "Engineering".
  - "Discover" shows a banner, a "For you" row of six cards (each with a "Try" and a "+" button), "New …", "Most installed …" and "Categories" ("Show all 55") with install counts. Opening a category lists rows with "Try in chat" and "Add" buttons. The Skills and Plugins Discover pages show the same cards and counts.
  - "+ Add" in Skills: "Upload skill", "Create a skill", "Create with Claude". In Plugins: "Add marketplace", "Upload plugin", "Create a plugin", "Create with Claude".
  - "Upload a skill": "Add a skill to your workspace. A security scan runs when you upload." with a dashed drop area, notes on accepted content, a "Security scan" row ("Runs when you upload"), a grey "Upload" button and "Choose a file to continue." No file was chosen.
  - "Upload a plugin" shows a red box: "Make sure you trust a plugin before installing or using it. Uploaded plugins are not controlled by Anthropic, and Anthropic cannot verify that they will work as intended. See each plugin's homepage for more information." "Add from a repository" shows a similar red box and a field "Select a repository" ("A GitHub owner/repo or a Git repository URL."). A plugin page lists the connectors and tools it can use, with the line "Can send data to other services".
  - "Create a skill" and "Create a plugin" open dialogs with name, description and an editor; nothing was typed or saved.
  - "Create with Claude" leaves the slides chat: in the same browser tab it opens a plain chat page with an unsent prefilled prompt ("Let's create a skill together using your skill-creator skill. First ask me what the skill should do.").

### Permission mode and model controls

- A screenshot ([permission-mode.png](ui/images/permission-mode.png)) of a menu headed "Permission mode" shows two options: "Manual" (checked): "Claude asks before using new tools or opening new sites." and "Auto": "Claude runs on its own and pauses to ask if anything looks unsafe." How the menu opens is not shown (presumably the "Manual" label under the request box). "Auto" was never chosen in a recording.
- The user states *(reported)* that another dropdown selects the underlying AI model. What "High" controls is not known.

## Messages shown (exact wording)

| Where | Wording |
|---|---|
| Above the request box on the start screen | "Claude is AI and can make mistakes." |
| File card in the box (file too large) | "Too large to send" |
| Toast (file too large) | "“1000mb.txt” is 1.1 GB, over the 400 MB limit. Choose a smaller file." |
| Preview dialog for a type it cannot preview | "File previews are not supported for this file type" |
| Bar above the slide while slides are added | "Claude is still adding slides (1 of 5 so far)." / "(4 of 5 so far)." |
| Notice after a stop or a reload | "Claude's response was interrupted." with "Edit prompt" and "Try again" |
| Notice above the box while offline | "You're offline. Check your connection." |
| Label under a second message sent during a run | "Send now" with "Ctrl" and a return arrow |
| Tooltip on the stop control | "Stop response" |
| Clarifying-question panel | titles, options, "Something else", "Skip", "Or reply directly…" as in "Vague one-line request" |

No quota, rate-limit, file-type, page-count, token, parsing or request-length message appeared in any recording. The only size limit seen is the file size limit above.

## Not observed

- A failure of the generating service, and any "interrupted" cause other than a stop or a reload.
- A stop pressed after slides already exist, and what "Edit prompt", "Try again", "Skip", "×" on the question panel and "Send now" do.
- Sending with a rejected file card present.
- Typing, sending or stopping while offline; an offline period long enough to end the run.
- The Research entry, the Design system submenu and dropdown, Voice Mode, the "Auto" permission mode, and any run with a skill or plugin on or off.
- The content of speaker notes.
- The attach step itself (menu click and file picker) for the document and the pictures; the recordings start with the file already in the box.

# Changelog

Notable changes to this repository. The newest changes are at the top.

## [Unreleased]

### Changed
- A new chat is made at the first character of its draft, like ChatGPT: `Chat mới`, `Ctrl+Shift+O`, the start of the interface and the page of a workspace show a new chat that the Host has not made and the sidebar does not list
  - Choosing a model first also makes the chat, with that model; text typed while the Host makes it stays in the composer and becomes its draft
  - A new chat that waits for a workspace that is removed, or no longer in use, joins the workspace in use
  - This departs from FR-053, where a new chat exists at once with an empty draft
- Each workspace has a page, like a project page of ChatGPT: its name and folder, a `…` button for its menu, a composer for a new chat of it, and its chats with their slide state, draft and date
  - Pressing a workspace row, or setting up a workspace by name or for a folder, shows its page; pressing the row whose page shows folds or unfolds its chats
  - The page stays while the user types; opening a chat shows its conversation, and so will sending once requests are available
  - This departs from FR-071 and UC-013 A7, where adding or switching a workspace keeps the open chat on screen; that chat and its draft stay on the Host and in the sidebar
- Chats of no workspace form a sidebar section `Chat` of their own, apart from the workspaces, so folding the workspaces no longer hides them; the chats of a workspace hang from a line under its folder icon
- The header of a chat of a workspace names the workspace before the title, and the welcome of such a chat names it too
- The browser smoke test checks that a new chat is made only at its first character, the page of a workspace, and the two sidebar sections
- Local Web runs the B01 local foundation without a model or a provider key
  - App data lives in the OS app-data folder, or in the folder that `--data-dir` or `DECKAGENT_DATA_DIR` names, with databases in `db/` and files in `files/`; a damaged, unwritable or misplaced data folder stops startup with the next step to take, and nothing is reset
  - Each chat belongs to a workspace, and a chat whose workspace is removed is listed as ungrouped; the chat list has search, marks a chat that cannot be read, and the Host keeps each chat's draft until DeckAgent stops
  - The chat database moves to schema version 2 and migrates version 1 files in place
  - Send is unavailable until B02 connects OpenCode: the Host answers `503 REQUESTS_UNAVAILABLE` and the UI says why
- The workspace section of the Local Web sidebar is a list of rows with a folder icon, below the new chat button
  - Hovering a row shows a button that starts a chat in that workspace, and a menu to rename the workspace, change its folder or delete it
  - The list shows five workspaces and `Hiển thị thêm` for the rest, and always shows the workspace in use
  - The dialog that adds a workspace no longer shows the note on what DeckAgent reads and writes
  - The workspace in use carries `aria-pressed` and not `aria-current`, which marks the open chat
- The sidebar lists the chats under their own workspace, as a tree: each workspace row holds its chats, five of them and `Hiển thị thêm` for the rest, and the ungrouped chats form a group of their own
  - This departs from the chat list rule of the earlier chat use case (UC-006), which listed only the chats of the workspace in use; the workspace in use still receives a new chat
  - A click on a workspace that is not in use makes it the workspace in use and opens it; a click on the one in use folds it or unfolds it, and the folded state is kept in the browser
  - The row `Gần đây` is gone, since the tree replaces the list of earlier chats
- Adding a workspace and choosing another folder for it start in the folder dialog of Windows; the box that asks for a full path opens only when no dialog opens
- A row of the sidebar has no gray background when it is selected; the selected workspace and the open chat show in bolder text, and a row turns gray when the pointer is over it
- `Chat mới` and `Ctrl+Shift+O` start a chat that belongs to no workspace and lists under `Chat chưa nhóm`, like the new chat of ChatGPT; the button on a workspace row starts a chat in that workspace
  - This departs from the rule of the earlier chat use case (UC-012) that a new chat joins the workspace in use
- The plus of `Chat mới` and the icon of Settings show no blue circle behind them; the buttons of a workspace row belong to its own line, so hovering one of its chats no longer turns the row gray
- The browser smoke test follows the new workspace list and checks that changing the folder of a workspace keeps its ID, name and chats
- ADR-0002 and `builds/B01.md` state the draft rule of FR-038: the Host keeps drafts while DeckAgent runs, not in SQLite
- `docs/spec/` now holds the MVP spec: use cases, requirements, business rules and a backlog of behaviors left for later
  - The spec states each design choice as its result, or `pending` while it is open, and links no decision record or research note
- The `spec-authoring` skill follows the MVP use case format: the interaction diagram is the source of each step, and the Steps table holds the same steps
- `docs/AGENTS.md` drops the `Updated at` date rule and the rule that the spec holds no release, which the MVP spec replaces
- `docs/research/` holds one file per product (open-design, OpenCode, DeepSeek Harness, Claude Slide Design, Napkin AI, the legacy DeckAgent v2 code, folders on Windows), with observed conclusions only; screenshots and recordings sit under `docs/research/evidence/`
- Markdown files follow the no-hard-wrap rule in `docs/development/writing-documents.md`: each paragraph, list item and sentence sits on one line, and the named rules in `apps/local-web/DESIGN.md` are separate paragraphs

### Added
- `docs/build/rebuild/adr/` holds seven decision records for the rebuild: local storage and data ownership, chat and session history, tools and permissions, request and event lifecycle, deck artifacts and revisions, credentials and models, and the design system and templates
- `docs/build/rebuild/architecture/` states the contracts those decisions imply, one file per area: data, session, events, tools and permissions, credentials and models, and the design system and templates, with `overview.md` as the entry point
- `docs/build/rebuild/planning/` maps each product behavior family to the minimum prerequisites it needs and lists the technical gaps that no decision covers yet
  - The dependency analysis hands off to the build sequence in `implementation-plan.md`
  - The decision records, the architecture notes and the planning notes are written in Vietnamese and keep their decision and behavior IDs inside `docs/build/`, which departs from the plain-English rule in `AGENTS.md` and the no-plan-detail rule in `docs/AGENTS.md`
- `docs/build/rebuild/implementation-plan.md` and `builds/B01.md` to `builds/B08.md`: the eight rebuild builds with their developer tasks; B01 is implemented and waits for independent testing
- `docs/build/rebuild/architecture/repository-structure.md` and `deck-artifacts.md`: package ownership and dependency direction, and the deck artifact contract
- `packages/workspace/registry/`: the workspace registry, with the project-folder rules of BR-019 and the name rules of BR-020
- The `test:local-foundation` script, which runs the workspace registry, chat persistence and local foundation tests
- `commit` and `commit-push` skills, which write a conventional commit message and an entry in this file
- `docs/development/writing-documents.md`: living documents and records, outcomes and not the conversation, one line per paragraph, clickable links, no bare ID
- `docs/research/_STYLE.md`: how a research note is written
- A GitHub conventions section in `AGENTS.md`: no agent is named as author or co-author
- The interface preferences also keep the background behind the glass window: `none`, `koi`, `rain`, `forest`, `stars` or `sakura`
  - `GET` and `PUT /api/preferences` carry `background` next to `theme`; a request may send one of the two, and the other keeps its value
  - `/theme.js` sets `data-background` before the first paint; a stored value outside the list is read as `none`
  - A client that sends only `theme` keeps working
- Local Web can draw an animated background behind the glass window: koi pond, night rain, firefly forest, starry sky and cherry blossom, each with a light and a dark design
  - The Settings menu lists them under the theme switch; the default keeps the static gradient and runs no animation
  - An animated background pauses when the tab is hidden, draws one still frame when the system asks for reduced motion, and runs at about 30 frames a second
  - The glass window blurs 6 px over an animated background, so the background stays visible; menus and dialogs keep their blur
- A search icon in the sidebar header opens the chat search as a field that grows out of the icon; pressing the icon again closes it and clears the words
- Icon buttons in the sidebar show a tooltip; `Ctrl+Shift+O` starts a new chat
- The workspace registry keeps the order of the workspaces, and the Host and its client place a workspace before another one
  - `PUT /api/workspaces/order` takes `{ id, before }`, with `before` set to `null` to place the workspace last, and answers with the whole list; the default workspace is placed like any other
  - The order lives in the registry state, so the database format does not change; a workspace that was never placed comes after the placed ones, and a stored order that cannot be read counts as no order
  - This route is a proposal until a decision record approves it
- The Host opens the folder dialog of Windows for the interface: `POST /api/workspaces/pick` answers with the folder or `null` when the dialog is closed
  - Only the command line gives the Host the dialog; a caller that gives none gets `501 FOLDER_PICKER_UNAVAILABLE`, and the interface asks for the path instead
  - One dialog opens at a time (`409 FOLDER_PICKER_BUSY`), the dialog closes when the request ends, and a failure answers `502 FOLDER_PICKER_FAILED` without repeating its text
  - This route is a proposal until a decision record approves it
- The sidebar of Local Web can be dragged wider, up to a quarter of the window, and no narrower than 200 px; the arrow keys, `Home` and `End` do the same on the divider, and a double press restores the normal width
  - The width is kept in the browser, so it survives a reload and not a restart of DeckAgent, whose local port changes
- Deleting a workspace asks in a dialog that states what stays: the folder and its files, and the chats, which become ungrouped; the dialog cannot be closed while the request runs
- A workspace row is dragged, or moved with `Alt` and the up or down arrow, to place it before another one
- The plus button of the workspace list offers `Workspace mới…`, which asks for a name only, and `Thêm thư mục có sẵn…`, which opens the folder dialog; a workspace without a folder offers `Chọn thư mục` in its menu and asks for no check
- A workspace can be set up with a name and no folder: `POST /api/workspaces/named` takes `{ name }`, makes the workspace the one in use and reads and writes nothing on disk
  - A folder can be chosen for it later with the route that changes the folder of a workspace; the default workspace still takes none
  - This departs from the rule of the workspace use case (UC-013 A9) that sets up no workspace until a folder is chosen, and it is a proposal until a decision record approves it
- A chat can be created that belongs to no workspace: `POST /api/sessions` takes `ungrouped: true`, and the chat database accepts a chat without a workspace
  - Such a chat stays ungrouped after a restart; this is a proposal until a decision record approves it

### Removed
- The legacy Agent Loop in Local Web: the outline, editing and web-request workflows, the Cordis and agent-runtime dependencies of `apps/local-web`, and the `--workspace` flag
  - The tests that checked only that legacy path (`outline-workflow`, `recovery-editing`, their fixtures and the `test:recovery-editing` script and CI step); tests of behavior that B01 keeps were adapted
- `docs/build/rebuild/research/`: its conclusions now live in the decision records, the architecture notes and the implementation plan
- The product vision, the user segments, and the use cases and requirements that the MVP spec does not take
- `docs/versions/` and `docs/design/`: plans, tasks and handoffs live in GitHub Issues
  - The UX prototype regression test and its CI step, which only checked the removed prototype page
- The research report on EthanGuo2022 OpenDesign, the spec question backlog, and the research plans and handoffs
- The unused agent guides under `docs/agents/` (domain, issue tracker, triage labels, verification), with their references in `AGENTS.md` and the skill router

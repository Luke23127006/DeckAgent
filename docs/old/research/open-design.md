# open-design

open-design (`https://github.com/nexu-io/open-design`) is an open-source app that makes designs, prototypes and slide decks with a coding agent. A daemon, the local program that runs next to the web interface, starts the agent, keeps projects and serves the preview. Items 1 to 16 were checked from 04-11-2026 to 05-11-2026 from the published docs on `main` (no commit hash visible): `README.md`, `QUICKSTART.md`, `AGENTS.md`, `docs/architecture.md`, `docs/modes.md`, `docs/skills-protocol.md`, `docs/design-systems.md`, `docs/agent-adapters.md`, `docs/headless-byok.md`, `docs/install-guide.md`, `docs/spec.md`, `design-systems/README.md`, `deploy/.env.example` and the skill files named in each item. Items 17 to 19 were read from the source at commit `87a4f91` on 08-11-2026. The product was never run.

## Design systems and templates

1. What is a design system in open-design?
   - Observation: a folder, not one file: "Each subfolder is a portable design-system package." The minimum is `manifest.json`, `DESIGN.md` and `tokens.css` (`design-systems/README.md`).
   - Observation: `DESIGN.md` "is the canonical design prose for agents". It has no fixed template; the authoring guide suggests visual theme, colour roles, typography, spacing and layout, components, motion, accessibility and anti-patterns.
   - Observation: `tokens.css` "is the canonical compiled semantic-token stylesheet", for example `--accent: #625df5;` in `:root`, with component CSS that uses `var(--accent)`. A token is a named value, such as a colour, that other CSS refers to by name.
   - Observation: `manifest.json` holds the name, category, description and source. Optional files: `USAGE.md`, `components.html`, `design-tokens.json`, previews, `assets/` ("optional static assets") and `fonts/` ("optional webfonts"), declared in the manifest fields `assetsDir` and `fonts`.
   - Observation: "The bundled catalog currently contains 151 packages", many inspired by brands (apple, stripe, linear) and some by style families (minimal, editorial).
   - => A design system holds the look: colours, fonts, spacing and rules in words. It holds no slide layout.

2. Who applies the design system when a deck is made?
   - Observation: "the daemon composes the available package material directly into the system prompt": `USAGE.md`, the full `DESIGN.md`, `tokens.css`, components, then the skill or template body (`docs/skills-protocol.md`).
   - Observation: the deck template `design-templates/guizang-ppt` gives the layout: "10 ready-made layout skeletons", "5 curated theme presets" and a seed file `assets/template.html` with its CSS and JS. Its skill says "Don't write slides from scratch" and "template.html is the single source of class names".
   - Observation: universal rules live in `craft/`. "Brand tokens in DESIGN.md win on conflict."
   - Observation: the agent writes the deck file into the project; "a previewable file becomes the rendered deliverable" (`docs/architecture.md`).
   - Not found: any check after the agent writes that the deck uses only the tokens.
   - => The model writes the deck source. It starts from a prebuilt template and uses the tokens of the design system. Code does not render the slides from data, and a deck stays consistent through the template and the tokens.

3. How does the user choose a design system and a template?
   - Observation: a picker in the Deck tab when a project is made (`docs/modes.md`). "Selecting one ... composes its design context into the agent prompt."
   - Observation: the user chooses "a design system, and optionally a rendering template" from `/api/design-templates`; a selected template "replaces the tab's default skill" as the project's primary `skillId` (`docs/modes.md`). The README counts "15 deck templates and 36 themes" under `design-templates/html-ppt-*/`.
   - Observation: "No brand? Pick from 5 curated directions"; the roadmap names a "5-direction picker" (`README.md`). What a direction holds is not documented.
   - Observation: "The Template tab lists templates the user previously saved through Share" (`docs/modes.md`).
   - Observation: no visual style apart from the design system is documented. Style families such as minimal and editorial are design system packages.
   - Not found: a default design system; the agent asking which design system to use; several built design options shown before the slides; a conflict rule between a template and a design system.
   - => The look is the design system and the layouts are the template, chosen separately. There is no third set of design rules.

4. How does the user change the design of an existing deck?
   - Observation: the refine skill makes "the smallest useful patch" and says "Do not introduce a new design language unless the user explicitly asks for one" (`plugins/_official/scenarios/od-design-refine/SKILL.md`).
   - Observation: in guizang-ppt, "90% of adjustments are changing inline styles" (font size, height, gap). A colour outside the theme is refused: "Custom hex values are not allowed"; "A deck uses only one theme, don't change colors midway."
   - Observation: an optional tweaks wrapper adds 3 to 5 knobs (accent from curated swatches, type scale, density, light or dark, motion). A knob changes a CSS variable in the browser and is kept in `localStorage`; the agent is not called (`design-templates/tweaks/SKILL.md`).
   - Observation: the preview has bridges "for inspection, comment selection, palette/edit/tweak" behavior (`docs/architecture.md` section 3.6).
   - Not found: what the agent receives when the user selects or comments on a part of the preview.
   - => A design edit is a small patch of the deck source by the agent. Free sizes and spacing are allowed; colours stay inside the theme.

5. How does a user make, change or remove a design system?
   - Observation: "The product exposes local-folder, GitHub, and shadcn import flows in both the UI and the `od design-systems import-*` CLI." Importers "write the package contract rather than a standalone `DESIGN.md`" (`docs/design-systems.md`).
   - Observation: repository guards check "required A1, A2, and B-slot tokens, default parity, fixture synchronization, and unknown-token allowlists"; `DESIGN.md` needs "at least seven substantive H2 sections".
   - Observation: after a package changes, "refresh the Design System surface"; a user `metadata.json` overrides title, category and surface.
   - Observation: the roadmap names a "Brand-backed Design System" made from a screenshot or URL, not yet released (`README.md`).
   - Not found: making a design system from words, a brand guide, a website, a deck or a presentation file; removing one; changing a bundled one in the product; Required or Preferred rules; a check of an imported package at import time.
   - => A design system is imported as files, not made with the agent.

## Projects and earlier work

6. How does the user find earlier work?
   - Observation: `README.md` product tour: "All projects — revisit design systems, media, and prototypes." and "Home — start with a brief or an example."
   - Observation: `QUICKSTART.md` troubleshooting: "open the project from the OpenDesign app again instead of resuming an old terminal agent session."
   - Not found: a list of conversations, or search or filter of projects or conversations.

7. What is the unit of earlier work, and does it survive a restart?
   - Observation: `docs/architecture.md` 3.2 lists "project and conversation persistence" as a daemon task. 3.1: "Projects, conversations, messages, and project files are hydrated through the daemon APIs."
   - Observation: `docs/architecture.md`: "SQLite state and daemon-owned project files". The data folder comes from `OD_DATA_DIR`; the docs give no concrete path on purpose (`AGENTS.md`, "Daemon data directory contract"). Browser state is "not as an alternate browser-only project database".
   - Inference: a project holds its conversations and its files. That a project holds several conversations is not stated.
   - Inference: earlier work survives a restart, since the daemon keeps it in SQLite. The docs do not state it as a promise.

8. What happens to a run when the user leaves, reloads or restarts?
   - Observation: the daemon owns "run bookkeeping, cancellation, and SSE output" (`docs/architecture.md` 3.2). SSE (server-sent events) is a stream of events from the daemon to the interface.
   - Not found: whether a run goes on when the user leaves a project or reloads, or whether it resumes after the daemon restarts.

9. Can a project or conversation be renamed or deleted?
   - Not found: renaming or deleting a project or a conversation. The only deletion found removes all local app data (`docker compose down -v` in `QUICKSTART.md`).

10. Does open-design keep earlier versions of an artifact?
    - Observation: `docs/spec.md` section 5: "Artifact store — daemon-managed storage for generated files, version snapshots, and per-artifact metadata." Section 10 asks "Artifact versioning. Git, or SQLite, or both?" The file opens with a note that it is a historical baseline whose "assertions below are not a source of current behavior".
    - Observation: `docs/architecture.md` 3.2 lists "version" among the daemon routes, with no route path or behavior.
    - Not found: when a version is made, or how the user lists, opens, compares or restores one.
    - => How open-design goes back to an earlier state is unverified.

11. How does open-design keep a long conversation within the context of the model?
    - Not found: nothing is documented. open-design runs a coding agent, which likely compacts by its own rules `[assumed]`.

## Project folders

12. Does a project use a folder of the user?
    - Observation: `docs/architecture.md` section 6: "`POST /api/import/folder` creates a project rooted at a user-selected folder." Section 3.5: an imported project uses "the user-selected external `metadata.baseDir`" and is not copied "into the managed-project root".
    - Observation: the daemon "validates and bounds file operations against that selected workspace". A desktop import needs a token "minted by the trusted main process after the native folder picker succeeds".
    - Observation: other projects are kept under the data folder of the daemon.
    - => A reference product binds a project to one folder the user picks, without copying it.

13. Does the agent write into that folder?
    - Observation: the runtime is spawned "with the project workspace as its working directory"; section 7: "Imported-folder projects use their validated external root".
    - Inference: the agent of an imported project writes into the user's folder. No page states it.

14. Are projects grouped or removed?
    - Not found: a group of projects (workspace, folder or tag), removing a project, or what happens to its files.

## Agent, models and outside services

15. How does open-design run the agent, and does the user approve a step? (`docs/agent-adapters.md`, `README.md`)
    - Observation: the agent process is "spawned in the effective project cwd"; this cwd "is an execution root, not a uniform OpenDesign sandbox".
    - Observation: runs "intentionally choose non-interactive permission modes", for example `--permission-mode bypassPermissions` for Claude Code and `--dangerously-skip-permissions` for OpenCode when the CLI offers it; the daemon "must not rely on an interactive tool-approval prompt".
    - Observation: the harness "writes ordinary files in the OD project cwd".
    - Not found: any step the user approves.
    - => open-design trusts the agent fully inside the project folder.

16. How does the user set up a model, and which outside services exist?
    - Observation: two ways to run a model. Local CLI: "The daemon scans your PATH" for coding-agent CLIs (Claude Code, Codex, OpenCode and others), and each CLI uses its own login ("The daemon does not run login flows"). BYOK (bring your own key): the user gives a provider in Settings ("Models & providers").
    - Observation: BYOK fields in the REST API are `protocol`, `apiKey`, `baseUrl`, `model`, and `apiVersion` for Azure. Protocols: anthropic, openai, azure, google, ollama, senseaudio, aihubmix. "Use openai for a custom OpenAI-compatible gateway." No name field. Presets in `README.md`: OpenAI, Atlas Cloud, Anthropic, Azure OpenAI, Google Gemini, Ollama, LM Studio, vLLM, any OpenAI-compatible endpoint.
    - Observation: no key check at save is documented. In the REST API a wrong key shows only when a run fails: "A successful 202 response does not validate those upstream facts", then "upstream 401/403/404".
    - Observation: the BYOK model is "an explicit provider model ID"; a model list from a BYOK provider is not documented. CLI runtimes list models live, for example `opencode models`. The Settings picker takes a custom model ID.
    - Observation: model and reasoning choices are stored per agent; some runtimes offer thinking levels "off, minimal, low, medium, high, xhigh". "Switching agents affects only later runs."
    - Observation: `docs/agent-adapters.md` says the BYOK path runs the OpenCode CLI (`byok-opencode`); `README.md` still describes a direct BYOK proxy.
    - Observation: outside services besides the model: image generation (`gpt-image-2`, ImageRouter, a custom API), video and audio models, and connectors (Composio, GitHub OAuth). The user picks the image provider. How their keys are set up is not documented.
    - Observation: no list of approved services. `OD_ALLOWED_INTERNAL_HOSTS` is only an allow-list of internal hosts that a provider URL may resolve to; it blocks requests to private addresses (an SSRF guard). No on or off switch for search or image generation is documented.
    - Observation: a failure gives a message with the fix ("configure a BYOK runtime in Settings"); a private provider URL fails with `Internal IPs blocked`. No fallback to another service is documented.
    - Observation: "Cloud model and OpenDesign Cloud requests are sent to the corresponding services" (`README.md`). No privacy statement for image providers.
    - Not found: the Settings or "Models & providers" form; web search or web fetch; where a BYOK key is kept and whether it is shown again (`OD_API_TOKEN`, access to open-design, and `BYOK_API_KEY`, access to the provider, are separate); image licences and attribution.
    - Inference: open-design uses OpenCode for BYOK, so OpenCode likely owns the provider call and its model list there. Not checked.
    - => The user chooses each service and brings the key; no service is approved by the team on the user's behalf. A missing or failed service is reported, not swapped for another.

## Folder import in the source (commit `87a4f91`)

17. Which folders does an import refuse?
    - Observation: `apps/daemon/src/import-export-routes.ts` (`POST /api/import/folder`) runs `realpath` on the path, then refuses the root of a file system, the data folder or a folder inside it, system folders (`C:\Windows`, `C:\Program Files`, `C:\Program Files (x86)`, a folder inside or holding one, from `apps/daemon/src/linked-dirs.ts`), the user's home folder itself, and `.ssh`, `.aws`, `.gnupg`, `.kube`, `.docker` in the home folder and inside them.
    - Observation: each is a plain refusal with a reason; there is no warning to confirm.
    - Observation: a folder that holds the data folder but is not the home folder (such as `C:\Users\<name>\AppData`) is not refused.

18. In which order is an import path checked, and does changing a project's folder follow the same rules?
    - Observation: `POST /api/import/folder` (lines 383 to 478) checks in a fixed order and stops at the first failure: empty path, relative path, not found (`realpath` fails), not a directory, filesystem root, data folder or inside it, then `blockedProjectRootReason` (system, home, key folders). Each failure returns one reason.
    - Observation: the route never checks read access on its own; a folder that cannot be read fails only when `realpath` or `lstat` fails.
    - Observation: `apps/daemon/tests/security-import-folder-dotfiles.test.ts` (`must reject rebinding a project working-dir to the home root`) checks that rebinding an existing project to the home folder through `POST /api/projects/:id/working-dir` is refused like an import.
    - Inference: path errors come before refusal rules, so a folder that falls under both gets the path error.
    - Inference: changing a project's folder is subject to the same refusals as importing one.

19. How is folder import tested, and how is the test setup built?
    - Observation: `apps/daemon/tests/folder-import-route.test.ts` rejects a missing path, an empty path, a relative path, a non-existent path, a path that points at a file, and the filesystem root; it checks that a symlink is canonicalized by `realpath` at import, and that a symlink into the data folder is refused.
    - Observation: `apps/daemon/tests/linked-dirs.test.ts` uses `SystemRoot` as the blocked system folder on Windows, and a `junction` pointing to it must be refused.
    - Observation: `security-import-folder-dotfiles.test.ts` puts sentinel keys in a temporary fake home, but its home refusal test imports the real `os.homedir()`, and checks `~/.ssh` only `if (existsSync(ssh))`: on a runner without `.ssh` that check passes without running.
    - Observation: the data folder is set by `OD_DATA_DIR`; tests set it before a dynamic import of the server, because the path is read when the module loads. Each test starts the server in the same process on port 0 and shuts it down after. Unit tests stub `os.homedir()` with `vi.spyOn` to keep the real home untouched.
    - Observation: pull-request CI runs on Linux runners; Windows runs only the tools-pack payload tests and a nightly packaged smoke on `windows-latest`. The folder refusal tests do not run on Windows in pull-request CI.
    - Observation: E2E uses Playwright (`e2e/playwright.config.ts`): Chromium only, 1 retry on CI, 10 s expect timeout, an isolated runtime per worker with a reserved port, and CI-scaled timeouts. `e2e/AGENTS.md` asks to treat a pass only on retry as a signal, not flake, to wait on a side-effect-free readiness signal instead of a fixed delay, and to keep logs and scratch of a failed run.
    - Observation: a GitHub code search over the repository finds one use of `it.fails`, one of `test.fixme` and 43 of `it.skip`; the security test above says in a comment that it was red on `main` when written, and ships with its fix.
    - Not found: a test for a project folder that is moved, made unreadable or replaced after import.
    - Inference: the conditional `.ssh` check is a silent skip: a test that passes without checking anything.
    - Proposal: DeckAgent reads its data, user and key folders from configuration when it starts, not when a module loads, so a test can start it on port 0 with temporary stand-in folders.
    - Proposal: DeckAgent's E2E follows the same rules: Playwright with Chromium, an isolated data folder and port per worker, one retry on CI where a pass only on retry is reported, and waits on a readiness signal.

20. Limits of these checks.
    - `README.md` and `AGENTS.md` were read in part; the rest came from a summary of the page. Part of `docs/agent-adapters.md` was read through a summary; the quotes come from the parts read in full.
    - The guizang-ppt reference files (`layouts.md`, `themes.md`) and `template.html` were not read.
    - `docs/roadmap.md` was not read.

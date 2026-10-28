# Local development

Practical setup, configuration, and day-to-day commands for developing DeckAgent.
README.md stays small: an intro, a quick start and document pointers. This guide
owns the rest: provider configuration, the Web app walkthrough, CLI usage, session
persistence, testing, and common problems.

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | `^22.19.0` or `>=24.0.0` (CI runs `22.19.0`) |
| pnpm | `11.28.5` (pinned by `package.json` `packageManager`) |

Check:

```powershell
node --version
pnpm --version
```

If pnpm is missing, install Node first, then run
`npm install --global pnpm@11.28.5`. On Windows PowerShell the repository uses
`pnpm.cmd` to avoid the `pnpm.ps1` shim being blocked by the execution policy.

## Install, typecheck, build

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd typecheck
pnpm.cmd build
```

`typecheck` runs `tsc -b`. `build` typechecks and then bundles each workspace package
into its `lib/` output. Re-run `build` after changing source: tests and the CLI import
the built `lib/` output, not `src/`.

## Lint and format

```powershell
pnpm.cmd lint                                        # lint all owned source (CI-enforced)
pnpm.cmd format:check apps/agent-runtime/src/chat.ts # check one changed file
pnpm.cmd format apps/agent-runtime/src/chat.ts       # format one changed file
```

`lint` is enforced in Workspace CI. Always pass explicit changed-file paths to
`format` and `format:check`: without a path, `pnpm format` rewrites every file Biome
selects, and the legacy code has a large formatting drift (~31 files). Whole-workspace
`pnpm format:check` reports that pre-existing drift and is not an acceptance check.
Format only the files you changed before committing. Configuration lives in
`biome.json`.

## Run the CLI

```powershell
pnpm.cmd chat
```

On first run an interactive wizard asks for provider, model, and API key, verifies the
connection, and saves the choice. Other entry points:

```powershell
pnpm.cmd chat --setup                          # reconfigure
pnpm.cmd chat --session <id>                   # open or resume a conversation
pnpm.cmd chat --list-sessions                  # list saved sessions (no API key needed)
pnpm.cmd chat --session <id> --history         # read a session's messages (no API key needed)
pnpm.cmd chat --prompt "<one turn>"            # non-interactive single turn
pnpm.cmd chat --config <file> --provider <id> --model <id>
```

Useful flags: `--tools` enables the `noop` echo tool; `--data-dir <dir>` moves storage
(default `.deckagent`); `--session <id>` resumes a specific conversation. In chat,
`/history` prints role/content and `/exit` quits; Ctrl+C cancels the active turn, and
at idle it exits.

## Provider/model configuration and credentials

The sample configuration is
[`config/models.example.json`](../../config/models.example.json). Each connection has an
`id`, `protocol`, `baseUrl`, and `apiKeyEnv` — the name of the environment variable
that holds the key. Pass a different file with `--config`; a config file takes
precedence over the saved profile. `DECKAGENT_MODELS_CONFIG`, `DECKAGENT_PROVIDER`, and
`DECKAGENT_MODEL` are environment alternatives for non-interactive runs.

| Connection | Protocol | API key environment variable |
| --- | --- | --- |
| `google` | Gemini | `GEMINI_API_KEY` |
| `openai` | Chat Completions | `OPENAI_API_KEY` |
| `deepseek` | Chat Completions | `DEEPSEEK_API_KEY` |
| `anthropic` | Anthropic Messages | `ANTHROPIC_API_KEY` |

The wizard stores non-secret configuration in `.deckagent/profile.json`, encrypted
keys in `.deckagent/credentials/` (Windows DPAPI), and conversations in
`.deckagent/sessions.sqlite`. The whole `.deckagent/` directory is gitignored. The
environment variable is used first, then a stored encrypted key, then a hidden prompt
when both are missing.

`pnpm.cmd chat` and `pnpm.cmd start:local-web` load the optional root `.env` through
Node's native `--env-file-if-exists` flag. Direct `node apps/...` invocations do not
load it unless you pass the flag yourself. Copy [the empty template](../../.env.example)
to `.env` if it does not already exist, and fill only the provider keys you use:

```dotenv
GEMINI_API_KEY=your-key-here
```

The real `.env` is gitignored; never commit or share it. Existing terminal variables
override `.env`, even when empty. If an old terminal key is masking the file, run
`Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue`, then restart the
CLI/Host. Editing `.env` does not change an already running process. Local Web opens
Settings even without a usable key; request admission checks credentials before sending.

To set a key for the current PowerShell session without printing it:

```powershell
[Environment]::SetEnvironmentVariable('GEMINI_API_KEY', [System.Net.NetworkCredential]::new('', (Read-Host 'Gemini API key' -AsSecureString)).Password, 'Process')
```

## Session persistence

Every chat is saved to SQLite automatically. A session created without `--session`
gets a generated ID printed as `Session: chat-<id>`; resume it later with
`pnpm.cmd chat --session chat-<id>`. A session records its provider/model and refuses a
conflicting selection. Sessions are local-only — do not run two CLIs against the same
session concurrently. `--list-sessions` and `--history` read without calling a model.

## Local Web, Models Settings and File Tools

After build, start Web and configure a provider/key/model in Models & settings:

```powershell
pnpm.cmd start:local-web
```

This opens an authenticated local browser with Conversation, model selection, Settings,
History, Activity Log and a Sample Deck tab. Settings can be opened before a model is set up.
The Agent has `read_file`/`write_file` tools. The default Workspace needs no project folder.
Add another Workspace using an absolute project-folder path in the sidebar. The folder stays read-only.
Each request writes new drafts in a private work directory; writes never overwrite existing files.
Host data defaults to `~/.deckagent`, independent of the current directory: `sessions.sqlite` stores conversations; `web.sqlite`
stores Web Settings, encrypted keys and activity/request records. Web key persistence
uses Windows CurrentUser DPAPI; the UI never reads a saved key back. Models can change
within a chat; active work keeps its captured model and settings until completion.
Custom model APIs can use Chat Completions, OpenAI Responses, Anthropic Messages or Gemini.
Each added model can have its own display name, context window, maximum output, input modalities and confirmed reasoning choices.
Missing metadata stays unset. A reasoning choice appears only when it is saved for that model.
The selected model and reasoning choice belong to the Chat; changing either during a request affects the next request.

The presentation workflow once the model is ready:

1. Enter your presentation request, including the topic, language and number of
   slides, and choose **Create presentation** to start the outline workflow.
2. Read the proposed outline. Expand or collapse planned-slide details, ask for
   changes through **Revise outline**, or choose **Cancel outline**.
3. Choose **Confirm outline** on the current proposal. The confirmed outline becomes
   read-only, the Canvas opens and slides move from Pending to published as they
   finish.
4. Use **History** to reopen a chat. Reloading or restarting with the same data
   directory preserves conversations, confirmed outlines and published slides.

**Send request** stays available for ordinary chat and follow-up instructions. If a
confirmed deck still has Pending slides after an error, send a request to continue
the unfinished slides; do not confirm the same outline again.

With no storage arguments, `pnpm.cmd start:local-web` uses these paths under the user's home:

```text
~/.deckagent/
├── sessions.sqlite   # conversations
├── web.sqlite        # Web settings, requests and activities
├── decks.sqlite      # outlines, Deck metadata and published slide content/revisions
└── work/<chat-hash>/<request-id>/  # private Agent drafts
```

Workspace setup lives in `web.sqlite`. Session ownership distinguishes Default Workspace from Ungrouped Chats.
Removing a Workspace keeps its Chats and saved work. A missing project folder blocks source reads, not history or deck viewing.
Removing or repointing a Workspace is refused while its Chats have running or waiting requests.

You can open another Chat, start a new Chat or switch Workspace while a request runs or awaits an answer.
Work continues in its original Chat. Each Chat keeps its own draft, selected model and pending question.
History rows show background request outcomes and a tab-local new-result marker. Opening the Chat reads its saved work without restarting it.
Stop affects only the request shown in the current Chat. Host restart leaves interrupted work unconfirmed and never resumes it automatically.

Missing directories are created automatically; existing data is reused. To use
separate demo data and workspace, run:

```powershell
pnpm.cmd start:local-web --data-dir .deckagent/demo
```

Restart with the same arguments to reopen that demo's data. API keys, databases and
workspace files stay outside Git.

`--workspace` overrides the private work base. It is not a user project folder; register project folders in the browser.
`read_file` defaults to private work. `read_file` with `scope: "source"` reads authorized project files.
The publisher reads only private drafts. Earlier shared drafts are not granted to new requests.

### Import an earlier Local Web profile

The new default does not search for or automatically import repository-relative data.
Stop every CLI/Host writer and first test with a copy of the earlier profile.
Choose a new target directory that does not exist:

```powershell
pnpm.cmd start:local-web --import-legacy <absolute-old-profile-copy> --data-dir <absolute-new-profile>
```

Import keeps the original and a sibling backup, verifies a staged copy, then installs it.
An existing unrelated target is refused. Repeating a completed import keeps the current target.
SQLite sidecars cause refusal; close or recover the earlier profile with its original application, rather than deleting sidecars.
Saved keys remain encrypted for their original Windows user. Import does not make credentials portable to another account.
Session schema 3 stores optional reasoning choices and cannot be opened by earlier binaries. To return to the earlier application, use the original profile or backup.
Source-folder files are never copied merely by registering a Workspace.

To bootstrap the previous environment-based workflow, use
`pnpm.cmd start:local-web --provider google --model <model-id>`. This reads
`config/models.example.json` and environment credentials (including optional `.env`).
Saving that provider in Web Settings makes the saved configuration take precedence
on later starts. Web does not use the CLI's saved wizard profile/key.
Use `--help` for overrides. Do not share the browser URL. Ctrl+C drains and stops Host.
Do not run CLI and Web against the same Session concurrently.

```powershell
pnpm.cmd test:tools-browser  # File policy + API/SSE + client + SQLite integration
pnpm.cmd test:browser-smoke # installed Chrome/Edge, real DOM and reload/reconnect
pnpm.cmd test:env-startup   # dotenv, terminal precedence and repairable Web startup
pnpm.cmd test:local-web     # Settings, DPAPI, model snapshots and activities
pnpm.cmd test:workspace     # Workspace ownership, source isolation and offline import
pnpm.cmd test:chat-lifecycle # Concurrent requests, stale replies and interrupted Chat recovery
```

These checks use local fixtures and require no cloud keys. The contracts, manual
acceptance checklist and handoffs that belong to them are part of the implementation
plan of the active version, under `docs/versions/`.

## Tests

```powershell
pnpm.cmd test:cordis-smoke
pnpm.cmd test:agent-runtime
pnpm.cmd test:model-providers
pnpm.cmd test:session-persistence
pnpm.cmd test:chat-setup
pnpm.cmd start:cordis-smoke   # boot/unload the Cordis smoke CLI
```

Tests use the Node built-in `node:test` runner, temporary SQLite files, and loopback
HTTP servers; they do not need real credentials or cloud access.

## Common problems

| Symptom / error code | Fix |
| --- | --- |
| `chat` script or `src/chat.ts` missing | Check out a branch/commit that contains the code |
| `node`/`pnpm.cmd` not found, or wrong Node engine | Install the required versions and reopen the terminal |
| `lib/chat.js` or an internal package not found | Re-run `pnpm install --frozen-lockfile` and `pnpm build` |
| PowerShell blocks `pnpm.ps1` | Use `pnpm.cmd` |
| `CLI_CONFIG` / `PROVIDER_CONFIG` | Check the JSON, connection ID, model ID, and arguments; see `pnpm chat --help` |
| `CLI_CREDENTIALS` | Run in an interactive terminal to re-enter the key, or use an environment variable |
| `CLI_STORAGE` | Check read/write permission on the data directory and its files |
| `PROVIDER_CREDENTIALS` | Check the `apiKeyEnv` name and re-enter a valid key |
| `PROVIDER_TLS` | The `chat` script already enables `--use-system-ca`; if it persists, check the endpoint certificate |
| `PROVIDER_AUTH` (401/403) | Check the key and API/model access |
| `PROVIDER_RATE_LIMIT` (429) | Check the provider quota/rate limit |
| `PROVIDER_HTTP` | The model API returned a non-success response. Check the API root, model ID, and generation options |
| `PROVIDER_NETWORK` | The model API request failed at the network layer. Check endpoint reachability and connectivity |
| `PROVIDER_TIMEOUT` | Check the connection and `timeoutMs` in the connection JSON |
| `SESSION_CONFLICT` | The provider/model differs from the saved session; use a new session ID |
| `SESSION_NOT_FOUND` | Check the ID and `--data-dir`; use `--list-sessions` |
| `SESSION_SCHEMA` / `SESSION_CORRUPT` | Keep the data; check the app/file version, or try another data directory |
| `SESSION_STORAGE` | Check disk space, write permission, and whether another process holds the database |

During chat turns the CLI prints only the stable error code with a fixed message (most
provider errors show `Turn failed`). Detailed provider messages — transport phase/code
and HTTP status — appear only during the first-run setup connection check.

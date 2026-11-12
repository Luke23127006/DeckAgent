# Local development

Practical setup, configuration, and day-to-day commands for developing DeckAgent. README.md stays small: an intro, a quick start and document pointers. This guide owns the rest: provider configuration, the Web app walkthrough, CLI usage, session persistence, testing, and common problems.

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

If pnpm is missing, install Node first, then run `npm install --global pnpm@11.28.5`. On Windows PowerShell the repository uses `pnpm.cmd` to avoid the `pnpm.ps1` shim being blocked by the execution policy.

## Install, typecheck, build

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd typecheck
pnpm.cmd build
```

`typecheck` runs `tsc -b`. `build` typechecks and then bundles each workspace package into its `lib/` output. Re-run `build` after changing source: tests and the CLI import the built `lib/` output, not `src/`.

## Lint and format

```powershell
pnpm.cmd lint                                        # lint all owned source (CI-enforced)
pnpm.cmd format:check apps/agent-runtime/src/chat.ts # check one changed file
pnpm.cmd format apps/agent-runtime/src/chat.ts       # format one changed file
```

`lint` is enforced in Workspace CI. Always pass explicit changed-file paths to `format` and `format:check`: without a path, `pnpm format` rewrites every file Biome selects, and the legacy code has a large formatting drift (~31 files). Whole-workspace `pnpm format:check` reports that pre-existing drift and is not an acceptance check. Format only the files you changed before committing. Configuration lives in `biome.json`.

## Run the CLI

```powershell
pnpm.cmd chat
```

On first run an interactive wizard asks for provider, model, and API key, verifies the connection, and saves the choice. Other entry points:

```powershell
pnpm.cmd chat --setup                          # reconfigure
pnpm.cmd chat --session <id>                   # open or resume a conversation
pnpm.cmd chat --list-sessions                  # list saved sessions (no API key needed)
pnpm.cmd chat --session <id> --history         # read a session's messages (no API key needed)
pnpm.cmd chat --prompt "<one turn>"            # non-interactive single turn
pnpm.cmd chat --config <file> --provider <id> --model <id>
```

Useful flags: `--tools` enables the `noop` echo tool; `--data-dir <dir>` moves storage (default `.deckagent`); `--session <id>` resumes a specific conversation. In chat, `/history` prints role/content and `/exit` quits; Ctrl+C cancels the active turn, and at idle it exits.

## Provider/model configuration and credentials

The sample configuration is [`config/models.example.json`](../../config/models.example.json). Each connection has an `id`, `protocol`, `baseUrl`, and `apiKeyEnv` — the name of the environment variable that holds the key. Pass a different file with `--config`; a config file takes precedence over the saved profile. `DECKAGENT_MODELS_CONFIG`, `DECKAGENT_PROVIDER`, and `DECKAGENT_MODEL` are environment alternatives for non-interactive runs.

| Connection | Protocol | API key environment variable |
| --- | --- | --- |
| `google` | Gemini | `GEMINI_API_KEY` |
| `openai` | Chat Completions | `OPENAI_API_KEY` |
| `deepseek` | Chat Completions | `DEEPSEEK_API_KEY` |
| `anthropic` | Anthropic Messages | `ANTHROPIC_API_KEY` |

The wizard stores non-secret configuration in `.deckagent/profile.json`, encrypted keys in `.deckagent/credentials/` (Windows DPAPI), and conversations in `.deckagent/sessions.sqlite`. The whole `.deckagent/` directory is gitignored. The environment variable is used first, then a stored encrypted key, then a hidden prompt when both are missing.

`pnpm.cmd chat` and `pnpm.cmd start:local-web` load the optional root `.env` through Node's native `--env-file-if-exists` flag. Direct `node apps/...` invocations do not load it unless you pass the flag yourself. Copy [the empty template](../../.env.example) to `.env` if it does not already exist, and fill only the provider keys you use:

```dotenv
GEMINI_API_KEY=your-key-here
```

The real `.env` is gitignored; never commit or share it. Existing terminal variables override `.env`, even when empty. If an old terminal key is masking the file, run `Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue`, then restart the CLI/Host. Editing `.env` does not change an already running process. Local Web opens Settings even without a usable key; request admission checks credentials before sending.

To set a key for the current PowerShell session without printing it:

```powershell
[Environment]::SetEnvironmentVariable('GEMINI_API_KEY', [System.Net.NetworkCredential]::new('', (Read-Host 'Gemini API key' -AsSecureString)).Password, 'Process')
```

## Session persistence

Every chat is saved to SQLite automatically. A session created without `--session` gets a generated ID printed as `Session: chat-<id>`; resume it later with `pnpm.cmd chat --session chat-<id>`. A session records its provider/model and refuses a conflicting selection. Sessions are local-only — do not run two CLIs against the same session concurrently. `--list-sessions` and `--history` read without calling a model.

## Local Web, workspaces and chats

After build, start Web:

```powershell
pnpm.cmd start:local-web
```

This opens an authenticated local browser. No model and no API key are needed to start. You can:

- work in the default workspace, which has no project folder, or add a workspace for a folder by typing its full path;
- switch, rename, remove a workspace, or choose another folder for it. Removing a workspace keeps its chats as ungrouped chats;
- start a new chat, reopen an earlier chat, and find earlier chats by the words in their name or conversation;
- keep a draft in each chat. The Host keeps the draft while it runs, across reloads; a draft is not kept after the Host stops;
- set up providers and models in Settings. DeckAgent checks the key and the connection with the provider before it saves. A key is kept in the credential store of the data folder, encrypted with Windows CurrentUser DPAPI; SQLite keeps only a reference, and the UI never reads a saved key back. On macOS and Linux, DeckAgent has no supported key store yet, so it refuses to save a key and never keeps one in plain text; a custom model API without a key still works;
- choose a model for a chat, send a request, follow its status and activities, and stop it. A reload, or going to another chat, does not stop the request. A request that is still running when the Host stops is shown as not finished and is never started again;
- keep a long chat going. When the provider says the conversation is too long for the model, OpenCode summarizes it and the request goes on. The chat marks where the summary starts, and every earlier message stays readable. If the summary cannot be written, the request does not finish and the conversation stays as it was.

Requests run through the OpenCode CLI, version 1.19.5 (`opencode run --format json`). Install it, then point DeckAgent at the executable (on Windows, `opencode.exe`, not the `.cmd` shim):

```powershell
pnpm.cmd start:local-web --opencode C:\path\to\opencode.exe
```

Without `--opencode`, DeckAgent uses `DECKAGENT_OPENCODE`, then `opencode` on `PATH`. If it finds no executable, or the version differs, the composer says why it cannot send. Each request runs in an isolated OpenCode configuration that denies every native tool and uses only the selected provider and model. The run works in a folder under `files/runtime/opencode/`, never in a project folder. DeckAgent reads no file of a project folder when you set up a workspace, and writes nothing there.

Application Storage is chosen in this order: `--data-dir <folder>`, then the `DECKAGENT_DATA_DIR` environment variable, then the app-data folder of the OS:

| OS | Default data folder |
| --- | --- |
| Windows | `%LOCALAPPDATA%\DeckAgent` |
| macOS | `~/Library/Application Support/DeckAgent` |
| Linux | `$XDG_DATA_HOME/deckagent`, or `~/.local/share/deckagent` |

The data folder holds:

```text
<data folder>/
├── db/
│   ├── workspaces.sqlite  # workspaces, their folder references and the workspace in use
│   ├── sessions.sqlite    # chats, conversations, requests, their events and native session bindings
│   ├── decks.sqlite       # outlines, Deck metadata and published slide content/revisions
│   └── web.sqlite         # Web settings and provider configurations (no key bytes)
├── credentials/           # provider keys, one DPAPI-encrypted file each (Windows)
└── files/
    └── runtime/opencode/  # OpenCode configuration, cache, native sessions and working folders, per chat
```

Missing folders are created; existing data is reused. A data folder that is a file, cannot be written, holds a damaged database, or sits inside the project folder of a workspace stops the start with a message that says what to do; no file is reset. Data in the old `.deckagent/` layout of the repository is not moved. To use separate demo data, run:

```powershell
pnpm.cmd start:local-web --data-dir C:\Temp\deckagent-demo
```

Restart with the same arguments to reopen that demo's data. API keys and databases stay outside Git.

To bootstrap the previous environment-based workflow, use `pnpm.cmd start:local-web --provider google --model <model-id>`. This reads `config/models.example.json` and environment credentials (including optional `.env`). Saving that provider in Web Settings makes the saved configuration take precedence on later starts. Web does not use the CLI's saved wizard profile/key. Use `--help` for overrides. Do not share the browser URL. Ctrl+C drains and stops Host. Do not run CLI and Web against the same Session concurrently.

```powershell
pnpm.cmd test:local-foundation # workspaces, chats, drafts, search and Application Storage
pnpm.cmd test:model-requests # providers, requests, events, Stop, restart and resume with a fake OpenCode CLI
pnpm.cmd test:tools-browser  # File policy + API/SSE + client + SQLite integration
pnpm.cmd test:browser-smoke # installed Chrome/Edge, real DOM, workspaces, drafts and reload
pnpm.cmd test:env-startup   # dotenv, terminal precedence and repairable Web startup
pnpm.cmd test:local-web     # Settings, DPAPI, model selection and preferences
```

These checks use local fixtures and require no cloud keys. The contracts, manual acceptance checklist and handoffs that belong to them are in the GitHub Issue of the task.

The real OpenCode CLI check is opt-in. It runs the real CLI against a local Chat Completions endpoint, so it needs no provider account. It checks the run configuration, the key reference, events, native resume, Stop and the conversation summary. It also sends one real provider request when the four `DECKAGENT_LIVE_*` variables are set (base URL, protocol, model and key):

```powershell
$env:DECKAGENT_OPENCODE_LIVE = '1'; $env:DECKAGENT_OPENCODE = 'C:\path\to\opencode.exe'
pnpm.cmd test:opencode-live
```

## Tests

```powershell
pnpm.cmd test:cordis-smoke
pnpm.cmd test:agent-runtime
pnpm.cmd test:model-providers
pnpm.cmd test:session-persistence
pnpm.cmd test:chat-setup
pnpm.cmd start:cordis-smoke   # boot/unload the Cordis smoke CLI
```

Tests use the Node built-in `node:test` runner, temporary SQLite files, and loopback HTTP servers; they do not need real credentials or cloud access.

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

During chat turns the CLI prints only the stable error code with a fixed message (most provider errors show `Turn failed`). Detailed provider messages — transport phase/code and HTTP status — appear only during the first-run setup connection check.

# Local development

Practical setup, configuration, and day-to-day commands for developing DeckAgent.
This guide covers only what developers need in this repository; product capabilities
and review standards are linked from [`README.md`](../../README.md).

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
when both are missing. The CLI does not auto-load `.env`.

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

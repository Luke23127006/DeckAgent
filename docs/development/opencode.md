# Experimental OpenCode adapter

The Local Web application can run inference through a pinned OpenCode CLI.
The custom runtime remains the default. Omitting the OpenCode option selects that backend.
A failed OpenCode request never automatically selects the old backend.

## Run

For repeated manual testing on this workspace, use:

```powershell
pnpm.cmd start:opencode --check  # checks local prerequisites without inference
pnpm.cmd start:opencode          # builds, opens browser, reuses the manual profile
pnpm.cmd start:opencode --fresh  # creates another profile; keeps earlier data
```

The launcher selects supported Node from the current executable or the existing local toolchain.
It selects the qualified spike binary, loads optional root `.env` through the Host launcher,
and always builds before starting. No runtime downloads or data deletion occur.
The default profile is `.local-only/opencode-manual-g001`; stop its Host before starting it again.
Use the same command after Ctrl+C to test restart persistence.
Override the executable with `DECKAGENT_OPENCODE_EXECUTABLE` or the model with `--model <id>`.
The prerequisite check does not validate credentials or certify the executable pin; the adapter checks the pin before inference.
pnpm can warn about an older system Node while starting the wrapper.
The printed selected Node path is used for the build and Host; this workspace selects its local Node 22.19.0.

Use supported Node and pnpm versions from [local development](local-development.md).
Build the workspace before starting the application.
Use a separate test profile when trying this adapter.

```powershell
pnpm.cmd build
pnpm.cmd start:local-web --provider google --model gemini-3.1-flash-lite --data-dir .local-only/opencode-demo --opencode-executable <absolute-path-to-opencode.exe>
```

The existing launcher reads optional `.env`; the example connection uses `GEMINI_API_KEY`.
Keys can also come from the existing encrypted Web provider settings.
Do not place a key in a command argument or checked-in configuration.
The model name above is a tested example, not a permanent default or provider availability guarantee.

Only Windows x64 OpenCode **1.19.5** is qualified here.
The executable must have SHA256:

```text
d7b473388cb62555970e400ce54cdfb6d6573608beea6f8fdf382cd1a698a3fa
```

The adapter checks the absolute executable path, platform and file hash before opening its session.
It also checks CLI version and resolved permissions before inference.
Reuse the trusted binary qualified by the local feasibility spike.
This change does not install or download a runtime automatically.
MCP SDK **1.26.0** is pinned in the application manifest and lockfile.

The adapter accepts only the Gemini protocol path qualified by the POC.
Reasoning selection, output limits, temperature and other unmapped generation options are rejected at admission.
Other protocols remain available through the default backend.
An unsupported OpenCode selection returns HTTP 409 `OPENCODE_UNSUPPORTED_PROVIDER`.
The current client shows its generic request failure; select a supported configuration before retrying.

## Boundaries

`OpenCodeAgentHandle` implements the existing `send`, `history` and `dispose` interface.
Host still owns request admission, outline confirmation, permission approvals and Stop.
ToolRegistry still validates tool arguments, dispatches tools and sanitizes their failures.
DeckService still owns outline state, publication and revision checks.
Neither Host routes, browser views nor database schemas change.

Each send starts a fresh native session and isolated configuration directory.
DeckAgent keeps durable history in its existing SessionStore.
Continuation does not append another user message; Host working context replaces prompt history for that send.
Native execution IDs identify invocations, not Chats.

The request-local MCP server listens on loopback with a fresh bearer token.
It exposes only the current Host phase's tools.
Permissions use OpenCode's actual `deckagent_<tool-name>` names and deny everything else.
Project settings and default plugins are disabled; resolved extra agents, plugins or MCP servers fail preflight.
Provider-bound tool capture tests check the effective tool declarations independently of config inspection.
Denied tools need no denial event when OpenCode removes them before inference.
These controls provide application-level tool isolation, not an OS sandbox.
The CLI and MCP implementations are trusted executables with the user's OS identity.

CLI JSON events become existing model activities; MCP dispatch becomes existing tool activities.
This adapter does not add a token streaming view.
Stop revokes MCP admission, aborts active tools and awaits the CLI process tree and tool queue.
The Windows runner uses `taskkill /T /F` and reports termination failures.
Committed slide revisions stay under the existing workflow rules.

Application-owned `opencode/<execution-id>/` directories contain native runtime state.
Sanitized `preflight.json` and `execution.json` record checks and identity mapping.
They do not contain raw CLI stderr, provider responses, credentials or MCP tokens.
Treat other native runtime files as private application data; do not publish the whole directory.

## Verification commands

```powershell
pnpm.cmd test:opencode       # credential-free tests; CLI-dependent cases are skipped
pnpm.cmd test:opencode:cli   # real pinned CLI, loopback provider fixtures and Chrome/Edge
pnpm.cmd test:opencode:live  # explicitly calls Gemini, using credentials from optional .env
```

Set `DECKAGENT_OPENCODE_EXECUTABLE` to override the test binary path.
Tests otherwise reuse `.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe`.
Set `CHROME_BIN` if Chrome/Edge is installed elsewhere.
CLI and live commands fail when their required environment is unavailable.
The default tests must not be treated as live-model acceptance when those cases were skipped.

The CLI qualification captures requests at a loopback endpoint that deliberately rejects inference.
The client/browser cases use an external provider fixture.
Those results prove tool declarations and client compatibility, not model behavior.
The separate live command verifies MCP failure/recovery, active cancellation and the presentation workflow.
Other platforms, provider parity, large contexts, crash recovery and native session resume remain unqualified.

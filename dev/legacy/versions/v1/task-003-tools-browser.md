# TASK-003 — File Tools and Host–Browser connection

Updated: 21-10-2026. Task owner approved the workspace policy, HTTP JSON + SSE,
Host-owned requests, final-result/status updates and minimal browser foundation in
the implementation session. Reuse remains limited to the existing Cordis vendor
set. Older DeepSeek Host/Browser reuse descriptions in the plan are superseded for
this implementation; the milestone and Gate 003 acceptance remain unchanged.

## Ownership and entry points

| Owner | Files | Public boundary |
| --- | --- | --- |
| A | `packages/tools/filesystem`, `tests/file-tools.test.mjs` | `registerFileTools(registry, { root })` returns names and unregister/dispose |
| B | `packages/host/api`, `tests/host-api.test.mjs` | `startHost({ openAgent, readHistory, assets?, port? })`; contracts in `src/contracts.ts` |
| C | `packages/client/runtime`, browser tests | `HostClient`, `LayoutSlots`; `boot` mounts the smoke page |
| Integration | `apps/local-web`, root references/build, CI | `startLocalWeb({ model, selection, workspace, dataDir, port? })`; `close()` drains Host before Runtime/storage |

All three roles were implemented together at the task owner's request on
`feature/task-003-tools-browser`, from dev `75793de`. No PR has been created.
No Runtime, provider, Session schema or vendor source changes were needed. New
dependencies are workspace links only. Browser imports Host contract types only;
its browser bundle contains no Node/server implementation.

## Filesystem grant

Host grants a fixed workspace to `write_file(path, content)` and `read_file(path)`.
Agent allowlists still apply. Paths are relative; reject traversal, absolute/UNC
paths, alternate streams, Windows device names, symlinks/junctions and hard links.
Host data must be outside the canonical workspace. No shell or permission escalation
is exposed. An outside request is denied, never offered for approval by the model.

Files are UTF-8, at most 256 KiB. Writes create a new file exclusively; they never
overwrite. Parent directories must already exist. Reads require regular files.
Errors pass through the existing registry's fixed safe failure result. Interrupted
writes may leave a partial draft; no publication or automatic retry occurs.

This is an application filesystem policy, not an OS sandbox. Concurrent hostile
local processes replacing parent directories/links during a filesystem operation
are outside the verified threat model. Only grant a directory controlled by this
Host/user. Editing/overwrite and shell execution are not implemented by this slice.

## HTTP and SSE contract

Host listens only on `127.0.0.1`, with a random port by default. Every API request
requires `Authorization: Bearer <ephemeral-host-token>`. Host checks Host/Origin and
rejects cross-site fetches; it does not enable CORS. CLI opens the browser with the
capability in a URL fragment, which is not sent to the HTTP server; it never prints
the token. Do not share the opened browser URL. Restart rotates the token.

| Method/path | Input/output |
| --- | --- |
| `POST /api/requests` | JSON `{ sessionId, input }` → 202 `RequestSnapshot` |
| `GET /api/requests/:id` | Current `RequestSnapshot` |
| `GET /api/requests/:id/events` | SSE `event: snapshot`, JSON data; current snapshot immediately, then terminal result; stream ends at terminal state |
| `GET /api/sessions/:id/history` | Array of `{ role, content }`; excludes system prompt, tool arguments and provider protocol metadata |

`RequestSnapshot` contains `requestId`, `sessionId`, `status` and terminal `result`.
Statuses are `running`, `completed`, `failed`, `cancelled`; result uses the existing
Runtime `TurnResult`. No token/tool delta stream is introduced. Errors use fixed
`{ error: { code, message } }`; never raw exceptions. New browser code validates
wire payloads and renders history as text, never as executable HTML.

Session IDs use ASCII letters/digits/underscore/hyphen, length 1–100. Input is
nonblank, at most 16,000 characters and bounded by a 20 KiB JSON body. One active
request per Session; duplicate submission returns 409. Host retains at most 128
request records, 16 active Sessions and 64 SSE streams. Old terminal request IDs
may return 404; durable Session history remains available. Restart loses request
snapshots, not conversation history. Requests do not resume after Host restart.

Browser disconnect/reload cancels only its subscription. Host keeps the Agent
running; reconnect retrieves the latest snapshot without submitting another turn.
Browser remembers Session/request IDs in sessionStorage, with auth in the fragment.
Use the reconnect/read-history button after reopening a completed conversation.
Host shutdown cancels and drains work, including a pending Agent open, then closes
Cordis and SQLite. Default CLI and Local Web share `.deckagent/sessions.sqlite`;
do not run both against the same Session concurrently (one Host remains the scope).

## Run and verify

Use the toolchain in [local development](../development/local-development.md).

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
pnpm.cmd lint
pnpm.cmd test:tools-browser
pnpm.cmd test:browser-smoke
```

The browser test requires installed Chrome/Edge (or `CHROME_BIN`); it fails clearly
if unavailable. It uses a temporary browser profile, local fixture model and temp
workspace/database. No API keys/cloud are required. Windows CI runs both stages.

To use a real model, fill its configured API key in the root `.env` (see
[local development](../development/local-development.md)) or current terminal, then:

```powershell
pnpm.cmd start:local-web --provider google --model <model-id>
```

Defaults: config `config/models.example.json`, workspace `.deckagent/workspace`,
Host data `.deckagent`. Override with `--config`, `--workspace`, `--data-dir`, `--port`.
Model/provider also accept `DECKAGENT_MODEL`/`DECKAGENT_PROVIDER`;
`DECKAGENT_MODELS_CONFIG` overrides the default config file. This entry point uses
environment credentials, loading the optional root `.env` through the pnpm startup
script, and does not read the CLI's encrypted-key/profile wizard. Existing terminal
variables override `.env`; restart Host after edits. Missing/invalid credentials
fail before browser startup, with fixed safe guidance. This preflight does not
validate API access or quota.
Model selection/settings UI belongs to TASK-004. `--help` describes the entry point.

## Manual acceptance checklist — TASK-003

Run from the repository root on Windows with the required Node/pnpm. Record
`git rev-parse HEAD`, branch, whether source has uncommitted changes, provider/model,
Session ID, date and tester. Do not include keys or the browser URL containing its
capability token. The commands below assume default workspace/data paths; adjust
file checks and pass the same `--workspace`/`--data-dir` on restart if overridden.

### 1. Start the real-model Host

Fill `GEMINI_API_KEY` in root `.env`. Remove an old terminal override if you intend
to use the file, then build and launch:

```powershell
git rev-parse HEAD
pnpm.cmd build
Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
pnpm.cmd start:local-web --provider google --model gemini-3.1-flash-lite
```

Use an available model for your account if different. Expected: a new authenticated
browser opens; no startup credential error. Keep Host running in this terminal and
use another terminal for filesystem checks.

### 2. Create and read HTML through Agent tools

Use a fresh filename each run because `write_file` never overwrites. In the browser:

```text
Dùng write_file tạo manual-slide-002.html với nội dung
<h1>DeckAgent manual test 002</h1>.
Sau đó dùng read_file đọc lại và báo nội dung.
```

Expected: final status `completed`; history shows successful `write_file` and
`read_file`. Confirm the actual file in another PowerShell:

```powershell
Get-Content .deckagent/workspace/manual-slide-002.html
```

Expected content: `<h1>DeckAgent manual test 002</h1>`. Agent text claiming success
alone is insufficient evidence.

### 3. Deny a write outside the workspace

Choose an outside target that does not already exist. Send:

```text
Dùng write_file tạo ../manual-outside-002.html với nội dung DENIED-TEST.
```

Expected: the tool is called and returns failure; the outside file is not created:

```powershell
Test-Path .deckagent/manual-outside-002.html
```

Expected: `False`. Model refusal without a tool call does not verify filesystem
policy. The overall turn may still be `completed` if Agent explains the denial.

### 4. Reload while a request is running

Send a request to read the HTML file and explain it. While status is `running`,
reload the page. Expected: browser reconnects and receives the terminal result
without resubmitting the request. If the turn completes before reload, repeat this
step; reloading only after completion does not verify an active reconnect.

### 5. Read history after Host restart

Record the Session ID. Stop Host with Ctrl+C, restart using the same command/data
directory, then use the newly opened browser (the old Host token is no longer valid).
Enter the previous Session ID and click **Reconnect / read history**.
Expected: previous user/assistant/tool history is restored without starting new work.

### Result and failure handling

Record PASS/FAIL for each step with the tested revision and limits. If HTTP fails
after a write, inspect the file first: the side effect may already have completed.
Continue with `read_file` or use a new filename; do not blindly retry the create.
`PROVIDER_CREDENTIALS` requires checking `.env`/terminal precedence and restarting
Host. Do not publish raw provider errors or credentials.

Task owner confirmed all five manual steps PASS on 21-10-2026 in the implementation
session. Attribution is the current local candidate on `feature/task-003-tools-browser`,
base `75793de` plus uncommitted changes, rather than integrated dev. The successful
run's Session ID, exact manual toolchain and terminal artifacts were not supplied
(`UNKNOWN`); the earlier failed Session is not treated as the successful run.
Close Gate 003 only after PR/merge and acceptance evidence on the integrated dev SHA.

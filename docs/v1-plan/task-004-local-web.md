# TASK-004 — Local Web handoff

Current implementation lives on `feature/task-004-local-web`, based on dev
`049fa77d50361e768b022384637ddde108224b8b` (Gate 003). A/B/C are implemented together
by Codex at the task owner's request. PR/merge and manual Gate 004 acceptance remain
`NOT_VERIFIED`. Scope and Gate criteria stay in the
[parallel plan](deckagent-parallel-team-implementation-plan.md#6-task-004--usable-deckagent-local-web).

## Ownership and files

| Subtask | Implementation and continuation point |
| --- | --- |
| A — Host | `apps/local-web/src/index.ts`, `provider-settings.ts`, `web-state.ts`, `built-in-providers.ts`; management contracts/routes in `packages/host/api`. Owns shared wiring and layout integration. |
| B — Conversation/Settings | `packages/client/runtime/src/boot.ts`, `conversation-view.ts`, `management-client.ts`, `settings-panel.ts`; styling in `apps/local-web/src/ui-assets.ts`. |
| C — Sample Deck | `packages/client/runtime/src/deck-tab.ts`, `apps/local-web/src/sample-slides.ts`; browser acceptance in `tests/browser-smoke.test.mjs`. No Deck Service dependency. |

Supporting changes: additive `SqliteSessionStore.select()`, Runtime activity callback,
provider catalog/portable history, and shared Windows DPAPI helper. The CLI vault now
uses the same crypto helper; its file identities and fallback order stay compatible.
No production dependency, vendor source, implementation plan or product spec changed.

## Accepted behavior and contracts

The task owner approved resolving the three kickoff gaps: model selection per chat
with a request snapshot, repairable provider Settings, and real activity records.
The application uses one default workspace and a fixed Agent preset with
`read_file`/`write_file`; the grant and create-only file policy from TASK-003 still apply.

### Model and credential ownership

- A chat's selected model can change while work runs. Each admitted request captures
  its provider/model, connection settings and key until disposal; the next request
  uses the new choice. Changing Settings or selection starts no Agent request.
- `SqliteSessionStore.select()` updates Web selection without rewriting history.
  Existing CLI `bind()` still rejects a conflicting selection. Session schema v1 is
  unchanged; avoid running CLI and Web against the same Session concurrently.
- Removed models/providers leave the old selection visible as unavailable; the Host
  refuses submission and chooses no replacement. Provider deletion is refused while
  an admitted request holds its lease. A deletion marker prevents old CLI bootstrap
  flags from restoring the provider on restart; the user can add it again in Settings.
- Web Settings store keys encrypted with Windows CurrentUser DPAPI in `web.sqlite`.
  Responses expose only `hasKey`/`keyAvailable`; a saved key that cannot be decrypted
  can be replaced through Settings. No plaintext persistence fallback exists on other OSes.
- Key input is cleared after save/close. Changing a custom endpoint with an existing
  key requires explicitly entering a key or removing it, preventing implicit key transfer.
- CLI `--provider`/`--model` optionally bootstrap a connection from the existing JSON
  configuration and environment, including `.env`. Saved Web Settings take precedence.
  Without those flags, Web opens Settings without requiring a model/key. The CLI
  wizard profile is a separate setup path.
- Provider/model switches retain conversation content. Foreign signed tool turns are
  rendered as transcript context for the new provider, without foreign signatures
  or replaying calls. Matching provider/model protocol state retains native replay.
  Cross-provider compatibility is covered by local HTTP fixtures, not every live model.

### Host API additions

All API routes retain bearer authentication, exact Host/Origin checks, no CORS,
no-store responses and bounded JSON request bodies (20 KiB).

| Route | Behavior |
| --- | --- |
| `GET /api/settings` | Safe provider metadata, built-in templates and key-storage capability. |
| `PUT /api/providers/:id` | Save display name, protocol, base URL, added model IDs and optional write-only key. Omitted key keeps it; empty key explicitly removes it for a custom API. ID is the route identity; existing protocol is immutable in this implementation. |
| `DELETE /api/providers/:id` | Delete when no Agent request uses it. Keeps conversations. |
| `GET /api/providers/:id/catalog` | Explicit provider metadata lookup; never generates text or adds/selects models automatically. |
| `GET/POST /api/sessions` | List history metadata/current active request, or create an empty chat with optional selection. |
| `PUT /api/sessions/:id/selection` | Set the model for future requests. |
| `GET /api/sessions/:id/activities` | Durable, ordered activities, excluding reasoning and credentials. |
| `GET /api/sessions/:id/requests` | Durable request status, captured model and optional `historyStart` anchor in public history; error codes are fixed/safe. |

Existing submit/history/HTTP-SSE routes remain compatible. `HostOptions.openAgent`
receives an additional request ID; existing one-argument callbacks still work.
Request streaming still carries lifecycle snapshots, without token deltas. Activities
refresh separately every 750 ms while viewing an active request.

### Activity and browser behavior

- Runtime `send(..., { onActivity })` awaits the sink at actual model/tool transitions.
  A failed tool can coexist with a completed request. Planned work is never fabricated.
- `web.sqlite` v1 owns provider records, request summaries and activities, with its own
  application ID. Existing Session history stays in `sessions.sqlite`. Both files
  remain outside the Agent grant. Unsupported databases are preserved and rejected.
- A running record left by a killed Host becomes `unknown` on reopen. The UI reports
  an unconfirmed outcome and starts no work. This is activity integrity, not full
  TASK-007 deck recovery or a multi-Host concurrency guarantee.
- Conversation, Composer, grouped model selection, Settings, History and activity
  details use the Host API. Reload obtains the current request from Host metadata;
  history reads and expanding details submit no work. Drafts remain when opening Settings.
- Owner-approved layout update: Status and Activity share one collapsed inline record
  per request, after the user message. The summary shows lifecycle state and the actual
  recorded activity count; expanding it reveals activities/details. There is no separate
  Activity footer. Stable DOM nodes preserve expansion and focus during polling;
  reading details never starts work. Reload starts with records collapsed.
- New request payloads include an optional `historyStart` index, counted before the
  turn in non-system history. This positions records without guessing from message
  content or request counts. Existing JSON records without an anchor remain readable
  and appear after the messages. No Session history rewrite or schema-version change
  is required; older clients can ignore the additive field.
- Sample Deck supports navigation, width control and fullscreen. Layout uses browser
  local storage for the current origin; it is not durable deck storage. Sample HTML
  is served as fixed trusted assets in an opaque iframe (`sandbox=""`), with a
  separate restrictive CSP. Workspace HTML is never served by these routes.

## Pending product values and limits

- BR-005 still leaves default model IDs and permanent provider/protocol values pending.
  This candidate uses the existing connection IDs (`openai`, `anthropic`, `google`,
  `deepseek`) and implemented protocols as compatibility values. It does not amend BR-005.
  Default models and Restore defaults have not been invented or marked complete.
- Built-in templates use the current sample configuration endpoints and keep those
  URLs fixed. A custom API has an explicit endpoint. Built-in endpoint editing and
  default model lists still need recorded product values before claiming complete UC-005.
- Added model IDs are saved without a provider access probe. Catalog availability
  is not an access/tool-support guarantee. Limits: 100 added models/provider; catalog
  at most ten pages, 1000 unique IDs and 1 MiB/page. Custom APIs without a compatible
  catalog can use manually entered IDs.
- No live cloud request, full UC-003/UC-005 acceptance, attachments, Stop UI, Deck
  publication or full TASK-007 recovery is claimed by these checks.

Catalog implementation was checked against the official
[OpenAI model-list API](https://developers.openai.com/api/reference/resources/models/methods/list),
[Anthropic model-list API](https://platform.claude.com/docs/en/api/models/list) and
[Gemini models API](https://ai.google.dev/api/models). These describe wire formats;
they do not select DeckAgent's default models.

## Verification

Run from repository root using Node 22.19+ and the pinned pnpm:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
pnpm.cmd lint
pnpm.cmd test:local-web
pnpm.cmd test:model-providers
pnpm.cmd test:browser-smoke
pnpm.cmd test:env-startup
```

`test:local-web` covers empty setup, DPAPI persistence, model/key changes during a
request, removed selection, tool failure/cancellation and an actual killed Host.
Browser smoke covers real DOM submit/reload/history, allowed/denied file writes,
Settings/draft preservation and Deck navigation/resize/fullscreen/sandbox.
The GitHub workflow includes the new checks, using fixtures without cloud secrets.
Actual candidate results and limitations are recorded in [PROGRESS.md](PROGRESS.md).

Broader baseline verified on 21-10-2026, Windows x64, Node 22.19.0/pnpm 11.28.5: a 142-file source
copy with no initial node_modules/lib completed frozen offline install/build;
the final candidate passed 102/102 Node tests (0 skipped), UX regression 64 presets,
lint and actionlint. The initialization race and bootstrap-provider deletion
regressions were reproduced and fixed before the final run. Local logs and fixture
screenshots are ignored artifacts, not hosted CI evidence. Manual live-model
acceptance and merged-dev Gate 004 remain `NOT_VERIFIED`. After the inline Activity
update, build/lint and 10/10 focused browser/client/Web/Session tests passed. Browser
checks cover collapsed running/completed records, request positioning after reload,
activity counts, preserved expansion/focus during polling, no additional Agent work,
chat height and Composer visibility. The broader suite was not repeated for this UI change.

## Manual acceptance checklist — TASK-004

Use a separate ignored data directory to preserve earlier manual Sessions. Do not run
two Hosts against this directory. Record `git rev-parse HEAD`, branch, dirty status,
Node/pnpm versions and the resulting chat ID; never record keys or the authenticated URL.

```powershell
git rev-parse HEAD
git status --short
node --version
pnpm.cmd --version
pnpm.cmd build
pnpm.cmd start:local-web --data-dir .deckagent/task-004-manual --workspace .deckagent/task-004-manual/workspace
```

1. **Empty setup:** the browser opens even without model/key setup. Sending is disabled;
   Models & settings opens. Choose a built-in provider, enter your own key and add a
   model ID you can use. Save. To use a catalog, select the saved provider, choose
   Load model catalog → select models → Add selected models → Save provider.
   Expected: the key disappears from the input and is never displayed again.
2. **Chat and file tools:** close Settings, choose the model for this chat, then send:
   `Use write_file to create task004-manual-001.html containing <h1>DeckAgent TASK-004</h1>. Then use read_file to read it and report the result.`
   Expected: request completes, the file exists with that content, conversation and
   activity records show the result. If the name already exists, use a fresh name.
   Read the file independently with
   `Get-Content -LiteralPath .deckagent/task-004-manual/workspace/task004-manual-001.html`.
3. **Settings/model changes:** type an unsent draft, open/close Settings and verify
   the draft remains. If two usable models are configured, choose another while a
   request runs. Expected: current work continues; the choice applies to the next
   request. Selection alone adds no user message. Expand/collapse activities; work
   continues and no new request appears. Expected layout: one collapsed Status/Activity
   line after each request's user message, with a count; no Activity footer. Opening
   details while work runs keeps them open through refreshes. Closing them keeps them
   closed, including when work completes.
4. **History and reload:** create another chat, then open the first from History.
   Reload during a request if it lasts long enough. Expected: the correct chat/model
   and current state return without resubmission. A fast completed request only
   verifies completed-history restoration; record that limit.
5. **Restart:** stop Host with Ctrl+C, run the same command, use the newly opened
   browser and reopen the first chat from History. Expected: provider settings,
   selected model, messages and activity records remain. Opening history calls no model.
6. **Sample Deck:** Open sample deck → Next/Previous → adjust Deck width → Fullscreen
   → exit fullscreen. Expected: three readable sample slides, usable navigation and
   layout, with no conversation change. Reload preserves slide/width for that origin.

Report PASS/FAIL per step, tested revision and remaining limits. Gate 004 additionally
needs the accepted implementation merged into `dev` and CI/acceptance evidence on that
integrated baseline. This checklist has not yet been reported PASS by the task owner.

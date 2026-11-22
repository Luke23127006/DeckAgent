# DeckAgent v2 on OpenCode (legacy code)

The legacy DeckAgent code on the branch `feat/v2-opencode`, read at its last commit [`5bd9c17`](https://github.com/Luke23127006/DeckAgent/tree/5bd9c17) (05-11-2026) on 08-11-2026. Sources: the branch docs ([docs/versions/v2-opencode/](https://github.com/Luke23127006/DeckAgent/tree/5bd9c17/docs/versions/v2-opencode)), its 8 ADRs ([docs/adr/](https://github.com/Luke23127006/DeckAgent/tree/5bd9c17/docs/adr)), the code in `apps/` and `packages/`, `tests/` and `git log`. The code was read, not run; pass or fail results come from the branch docs. Every code path below is at `5bd9c17`. Items 9 and 10 read two earlier legacy ADRs at commit `85130c4`.

1. What is this code?
   - Observation: the branch builds on the legacy app (`apps/`, `packages/`, `vendor/`) and adds a path that runs through OpenCode. The path is on only when chosen, with the flag `--opencode-executable` ([cli.ts:67](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/cli.ts#L67)) or `pnpm.cmd start:opencode`.
   - Observation: the default runtime is still Cordis, the plugin framework the old runtime is built on. Even with OpenCode on, each request still creates a Cordis context ([web-request.ts:187](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/web-request.ts#L187)).
   - Observation: the flow of one request: web client, Host `RequestController`, presentation workflow, `OpenCodeAgentHandle`, OpenCode CLI 1.19.5, model. OpenCode calls back through an MCP bridge to `ToolRegistry` and `DeckService`. MCP is a protocol for an agent to call tools that an outside server offers.
   - Observation: the scope of the branch came from a thesis outline, a PDF kept only on a local machine, not from the current spec.
   - => This is the legacy app with an OpenCode path added, not a rebuild on OpenCode.

2. Which parts does the code have? Line counts are estimates from `Measure-Object -Line`, which skips blank lines.

   | Part | What it does | Size | Touches OpenCode? |
   |---|---|---|---|
   | `apps/local-web` | Main product: joins Host, agent, tools and the SQLite stores | ~5,400 lines | Yes: `src/opencode/` |
   | `packages/client/runtime` | Browser UI, plain TypeScript, no framework | ~4,800 lines | No |
   | `packages/host/api` | Host HTTP/SSE on loopback, `RequestController`, step approval | ~1,300 lines | No |
   | `packages/presentation/deck` | `DeckService`: slides stored as HTML by revision, outline, patch | ~1,100 lines | No |
   | `packages/llm/providers` | Adapters for 4 provider protocols, model catalog, keys encrypted with DPAPI | ~700 lines | No: old runtime only |
   | `packages/agent/runtime` | Old agent loop, `ToolRegistry`, shared contracts, Cordis plugins | ~500 lines | Indirectly: OpenCode reuses the contracts |
   | `packages/session/persistence` | Conversation storage in SQLite | ~250 lines | Indirectly |
   | `packages/tools/*` | File read/write tools and presentation tools (`publish_slide`, `patch_slide`, ...) | ~500 lines | Through the MCP bridge |

   - DPAPI is the Windows encryption service: only the same Windows account can decrypt.
   - `boot.ts` of the UI alone is 787 lines.

3. Which failures were seen with a real model?
   - Observation: three `OPENCODE_FAILED` failures of unknown cause: at the first outline step after 150 seconds with "no provider status"; at the slide-building step after confirmation, when working from a source document; and at the first outline step of the context-measuring case.
   - Observation: one slide edit gave 2 revisions instead of 1, with no cause recorded. Two runs timed out: one because of the regex in item 4, one of unknown cause.
   - Observation: failures with a known cause: Gemini returned HTTP 503 (provider down; the error label was then fixed to `PROVIDER_TIMEOUT`); Google's OpenAI-compatible endpoint returned HTTP 400 for a missing `thought_signature`, which blocks Gemini 3 on that path; an HTTP 400 caused by `store=false`, fixed.
   - Observation: only Gemini was run for real; the other 3 protocols had no key to try.
   - Inference: the end-to-end deck flow was not stable on OpenCode. The cause may lie in the adapter, in OpenCode or in the provider; the docs cannot tell them apart.
   - => These cases are inputs for regression tests: a Vietnamese sentence with "thêm" or "không", Gemini 503, a missing `thought_signature`, `store=false`, 2 revisions instead of 1, a timeout.

4. Which business logic is wrong?
   - Observation: the regex that limits the scope of an edit ([editing-workflow.ts:4-8](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/editing-workflow.ts#L4-L8)) blocks every message that contains one of `thêm`, `không`, `xóa`, `chèn`, `hoặc`, `add`, `not`, `or` and others anywhere:
     ```
     /\b(?:except|excluding|not|don't|do not|add|insert|remove|delete|or)\b|ngoại trừ|trừ slide|không|thêm|chèn|xóa|hoặc/u
     ```
     => An ordinary sentence such as "sửa slide 2, không đổi màu" is blocked. The bug was recorded and not fixed; one test prompt worked around it instead.
   - Observation: an edit scope is recognised only in fixed forms: a verb plus "toàn bộ", a slide number or range, or a title in quotes. Everything else goes to the model, unless the regex above blocked it.
   - Observation: an outline is confirmed only when the whole message matches one phrase from a list, such as `xác nhận`, `xác nhận dàn ý`, `confirm outline` ([outline-workflow.ts:5-38](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/outline-workflow.ts#L5-L38)). There is also a UI button, and a tool `review_outline` with which the model proposes and the Host checks.
     - => Safe, since nothing is confirmed by mistake, but a reply such as "ok làm đi" cannot confirm through chat.
   - Observation: saving a provider does not check the key with the provider ([provider-settings.ts:184-222](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/provider-settings.ts#L184-L222)): the key is encrypted and saved at once.
   - Observation: tool activity once used IDs that broke the client's convention. It was fixed for new runs, but stored activity was not migrated.

5. How is the code built on OpenCode?
   - Observation: two runtimes live side by side. The OpenCode code reuses the old runtime's contracts (`AgentHandle`, `ToolRegistry`, `SessionStore`). Five places still depend on Cordis, `apps/local-web` among them.
   - Observation: every send creates a new OpenCode session. The whole history is turned into JSON and put into the prompt ([history.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/history.ts)), up to 4 MB. OpenCode is only a one-turn runner; DeckAgent keeps the history itself.
     - Inference: cost and prompt length grow with the conversation, and no session feature of OpenCode is used.
   - Observation: OpenCode's own compaction is off (`compaction {auto:false, prune:false}`); DeckAgent summarises by hand instead.
   - Observation: Windows only: it checks the SHA-256 of the Windows `opencode.exe` 1.19.5, encrypts keys with DPAPI, and stops with `taskkill`.
   - Observation: it keeps keys (DPAPI) and the model catalog itself, and passes the key into the OpenCode configuration on each run. It does not use OpenCode's key storage or sessions.
   - Observation: `'*': 'deny'` turns off every built-in tool, bash included; only DeckAgent's MCP tools are open. The docs say several times "not an OS sandbox". Reading a project folder without writing is done inside DeckAgent's own tools, not by OpenCode.
   - => Many choices here are design choices of the branch, not facts about OpenCode. "A new session per send" avoids the question of how OpenCode keeps sessions; it does not answer it. The same holds for key storage and compaction.

6. Where does the code differ from the spec of 08-11-2026?

   | Area | Spec of 08-11-2026 | Code | Result |
   |---|---|---|---|
   | Design system, template, deck format | A use case sets up a design system; the user picks format and template in the interview | None. The branch scope excludes "a separate design-system feature" | missing |
   | How the model makes slides | Model writes source within a template; code checks colours and fonts outside the theme | Model writes free HTML/CSS; code only blocks dangerous tags and caps at 256 KiB ([html-policy.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/presentation/deck/src/html-policy.ts)) | differ |
   | What the agent reaches | Fixed, set by code | 2 presets the user picks | differ |
   | Approving a step | Allow once or refuse | Also a lasting grant for one file, revocable | differ |
   | Conversation summary | The system summarises when the context is full; no user command | By hand only, with a meter that suggests it at 85% | differ |
   | Interview | Fixed list of topics, asked in one message | "Ask no fixed questionnaire", at most 6 choices | differ |
   | A question from the system | Ends the request; the answer is a new request | Kept in the same request, state `awaiting_user` | differ |
   | Cancel the outline | None | Command "hủy dàn ý" | differ |
   | Brief with the outline (format, template, sources) | Yes | Outline is an overview and a slide list only | missing |
   | Adding a slide in an edit | Allowed | The prompt forbids "change slide count/order" | differ |
   | Key check before saving | Yes | No | missing |
   | Outside services (search, image generation) | Yes | None; web search deferred | missing |
   | ZIP attachment | Accepted | Refused | differ |
   | Speaker notes, source of each content, chat search, marking part of a slide | Yes | No | missing |
   | Workspaces (default, add, change folder, remove, missing folder) | Yes | Nearly the same | match |
   | Work goes on when the UI closes; after a restart it is reported unfinished, not rerun | Yes | Yes | match |

   - Observation: the code also has PDF export, manual slide editing, a context meter, hand-set model parameters, image import from an internet URL, skills run outside the app, and legacy data import.

7. Which approaches in the code are worth reading? Each is a way of doing it, not code to copy.
   - Running OpenCode safely ([opencode/agent.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/agent.ts), [opencode/config.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/config.ts), [opencode/process.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/process.ts)): configuration passed through the environment variable `OPENCODE_CONFIG_CONTENT`, with no file; a HOME folder of its own for each run; project config, auto-update and default plugins turned off; permissions `'*': 'deny'` with only the `deckagent_*` tools open; an OpenCode version check; stderr dropped because it can leak a key; the whole process tree stopped on Stop.
   - An MCP bridge per phase ([opencode/mcp-bridge.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/mcp-bridge.ts), [web-request.ts:294-309](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/web-request.ts#L294-L309)): an HTTP server on loopback only, with its own token per request; the outline phase sees only the tools that read files and propose an outline; only the slide phase sees `publish_slide`.
     - => A concrete way to limit the model by code.
   - The publish order of a slide ([deck/src/index.ts:193-270](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/presentation/deck/src/index.ts#L193-L270)): check the HTML first; write in one transaction; refuse when the revision has changed; apply a `publicationId` only once, so a repeated send makes no duplicate slide.
   - Isolated slide display ([deck-canvas.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/client/runtime/src/deck-canvas.ts)): an `iframe` with an empty `sandbox`, content through `srcdoc`, CSP `default-src 'none'; img-src data:`.
   - Workspaces ([workspace-registry.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/workspace-registry.ts)), and the ADR that keeps app data apart from the project folder ([ADR 0001](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/docs/adr/0001-application-storage-and-workspace-boundary.md)).
   - Providers: mapping of 4 protocols to the SDKs OpenCode uses ([opencode/provider.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/provider.ts)); a list of built-in providers; a model catalog with a way to type an ID by hand; a compatibility matrix that says which protocol was run for real ([COMPATIBILITY.md](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/docs/versions/v2-opencode/tasks/task-002-provider-session-parity/COMPATIBILITY.md)).
   - Restart ([web-state.ts:63-72](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/web-state.ts#L63-L72)): a running request is marked `unknown`, and "No work is replayed".
   - Reading 7 document formats in a separate worker ([materials/](https://github.com/Luke23127006/DeckAgent/tree/5bd9c17/apps/local-web/src/materials)).
   - Patching a slide by node ID, with text and a closed set of layout values ([slide-edit.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/presentation/deck/src/slide-edit.ts)).
   - Not to copy: a new chat takes the last model from the tab's `sessionStorage` ([boot.ts:130-133](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/client/runtime/src/boot.ts#L130-L133)), so it is lost when the tab closes.

8. Limits of this reading.
   - No code and no test was run.
   - Most code was read through excerpts. The regex, the outline confirmation, `html-policy`, the `'*': 'deny'` permissions and provider saving were read again directly at `5bd9c17`.
   - The thesis outline, the source of the branch scope, is not in the repository.

9. What did the legacy record on approving a step say? (ADR 0003 "Host owns step approval; file tools enforce the final target", status proposed, at commit `85130c4`)
   - Observation: the Host held the file tool at an approval boundary. An approval had its own identity and a separate endpoint, so an ordinary answer to a question could not grant access. A missing answer granted nothing.
   - Observation: path checks (canonical target, blocked app folders, links) ran right before each read, and an approval could not skip them. A continuing grant named one exact file, never a parent folder.
   - Observation: a running request kept the grants it started with; an approval extended that request only by the named read. A restart kept the stopped state and did not run the tool again.
   - => Two points hold on any runtime: an answer to a question is never an approval, and path checks run even after an approval.

10. What did the legacy record on web research say? (ADR 0002 "Separate web research tools from Search and Fetch providers", status proposed, at commit `85130c4`)
    - Observation: search and fetch were two tools the model calls, `web_search` and `web_fetch`, each behind its own provider adapter, following the DeepSeek Harness web pattern. An adapter returns sources in one shape and errors with a kind. Changing the provider does not change the tool names.
    - Observation: a missing or invalid provider does not fall back to another provider; search sends no private content from requests, conversations, attachments, project files or decks.
    - => The split into two tools behind adapters is an implementation choice, not product behavior. Check first what OpenCode already offers for web search and fetch.

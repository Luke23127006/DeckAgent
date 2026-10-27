# DeckAgent — Pre-Planning Documentation Alignment

**Execution plan for DeepSeek V4.1 Flash 1017**  
**Repository:** `Luke23127006/DeckAgent`  
**Required working branch:** `docs/versions/v2`  
**Scope:** Documentation only. Align approved product decisions before Phase 05.  
**Status:** Ready for execution after the local branch preflight.  
**Date:** 27-10-2026

> **Important:** `docs/versions/v2` in this plan is the **Git branch name**, not a request to create or edit the directory `docs/versions/v2/`. The branch was not accessible as a remote GitHub ref during plan preparation. The source used to prepare the file inventory was the previously accessible repository documentation, so **the checked-out local branch is authoritative**. Do not use `dev` as the baseline and do not guess that its file contents match the working branch.

## 1. Task and non-goals

Apply the approved decisions to the existing **ideal product documentation**. Repair obsolete open questions. Record technical decisions and UI placement in the correct documentation layer.

**Deliverables**

1. Updated Business Rules and linked FR/UC text for permissions, providers, file references, and manual compaction.
2. Updated ideal-spec design backlog: remove questions resolved by these decisions, keep genuinely unresolved questions.
3. A separate, version-independent UI Placement Review for seven feature groups, based on DeepSeek Harness UI behavior.
4. Concise Architecture Decision Records for Application Storage and provider-neutral Web Research.
5. A research/validation note for attachment limits without presenting untested values as final product limits.
6. A file-by-file change report and verification evidence.

**Do not do any of the following**

- Do **not** implement, refactor, or test application code.
- Do **not** start Phase 05 or write implementation waves, tasks, owners, or schedules.
- Do **not** change `docs/versions/v1/`, create a V2 plan, or change active-version registration.
- Do **not** change UC-001-specific Outline / Slide Generation, Design System, Visual Styles, or Deck Export behaviors.
- Do **not** introduce automatic context compaction.
- Do **not** choose a final attachment count or file-size limit before technical validation.
- Do **not** claim that a web provider has been enabled or that a service has received credentials.
- Do **not** add technical architecture, implementation details, UI controls, or widget positions to UC/FR/BR files.
- Do **not** commit, push, merge, or change branch. Leave changes as a reviewable diff.

**Language:** Write repository documentation in clear **plain English** according to `docs/spec/_STYLE.md`. Keep existing terms and IDs. Preserve existing Mermaid `sequenceDiagram` structure.

## 2. Fixed decisions — do not research or reconsider

These choices were accepted by the Product Owner. Apply them; do not independently redesign them.

| Decision | Required result |
|---|---|
| PD-01 | Two named Chat permission presets: `Workspace Access` (default) and `Provided Materials Only`. Explicit step approval may be once or a scoped grant kept for the same Chat until revoked. No Full Access preset. No access to another Chat's saved data. Never change original project/source/attachment files. |
| PD-02 | Preserve built-in provider IDs `openai`, `anthropic`, `google`, `deepseek`. Custom Model API protocols: OpenAI Chat Completions, OpenAI Responses, Anthropic Messages, Google Gemini. Model settings and reasoning capabilities belong to each model; unknown values remain unset. |
| PD-03 | Built-in default models are release-defined, not copied dynamically from provider catalogs. Specific default model IDs remain **unverified/not set** until a compatible release list exists. Do not invent them. |
| PD-04 | Web Research uses a provider-neutral **Search + Fetch capability**, based on the DeepSeek Harness separation between `web_search`, `web_fetch`, service, and interchangeable providers. Search and Fetch may have different providers. An outside research provider still needs Product Owner approval. Never send private content to it. |
| PD-05 | The closed file-type list remains TXT, MD, PDF, DOCX, PNG, JPEG, PPTX. `10 attachments/request` and `20 MiB/file` are **validation candidates only**, not confirmed values in BR-001. |
| PD-06 | A project-folder File Reference is not an Attachment and does not count toward the attachment count. The referenced file is checked when it is read. Reading must enforce safety/resource limits, but no untested numerical limit is adopted. |
| PD-07 | Context compaction is **manual only**. The user's Compact action is the confirmation: do not add a second confirmation dialog. Show a context-pressure suggestion at **85% or more only when a trustworthy percentage can be computed**. The suggestion never starts compacting by itself. |
| SD-01 | Outline/Slide Generation and Deck Export implementations remain outside the upcoming V2 scope. Documentation for their ideal product behaviors is not changed in this task. Shared infrastructure must retain compatibility. |
| UI | Reference DeepSeek placements. Keep DeckAgent's existing Conversation, Composer, Left Navigation, and Deck Canvas. Do not blindly import React-based DeepSeek UI packages. |
| Storage | Application-owned storage defaults to the user's home location, conceptually `~/.deckagent/`, **not** a per-project `.deckagent/` or a path relative to process CWD. Workspace has a stable identity and an optional project-folder reference. Chat/Deck/History remain even when the project folder is absent. Agent working files are separate from source project files. |

## 3. STEP 00 — Preflight (must execute first)

Run from the root of the local DeckAgent clone:

```sh
git rev-parse --show-toplevel
git branch --show-current
git rev-parse --short HEAD
git status --short
```

**Strict conditions**

- `git branch --show-current` **must print exactly `docs/versions/v2`**. If it prints anything else: **STOP** and report `BLOCKER: wrong branch`. Do not checkout `dev`, create a branch, or make edits.
- If any target file listed below already has uncommitted edits, **STOP** and report the conflicting paths. Do not overwrite or discard changes.
- If the directory is not the DeckAgent repository, **STOP**.
- Do not fetch or merge another branch. Do not reset the working tree.

Read these files on the currently checked-out branch, in this order:

```text
AGENTS.md
docs/AGENTS.md
docs/spec/_STYLE.md
docs/spec/03-use-cases/_CRITERIA.md
docs/spec/03-use-cases/_TEMPLATE.md
docs/spec/04-requirements/fr/_CRITERIA.md
docs/spec/04-requirements/fr/_TEMPLATE.md
docs/spec/05-business-rules/_CRITERIA.md
docs/spec/05-business-rules/_TEMPLATE.md
docs/agents/domain.md
.agents/skills/domain-modeling/ADR-FORMAT.md
```

If one instruction file is absent, follow the closest existing repository instruction; do not fabricate its content. Before creating a Business Rule or ADR, list existing IDs to confirm numbering:

```sh
find docs/spec/05-business-rules -maxdepth 1 -type f -name 'BR-*.md' | sort
find docs/adr -maxdepth 1 -type f -name '*.md' 2>/dev/null | sort
```

**Collision rule:** Steps below assume `BR-009` and `BR-010` are unused, and the first ADR is `0001`. If the checked-out branch already has these IDs, **STOP before creating the conflicting file**, report the occupied IDs, and do not overwrite or silently renumber. This is a safety condition, not permission to switch branches.

## 4. STEP 01 — Add Business Rule for Permission Presets

**Create:** `docs/spec/05-business-rules/BR-009.md` (only if unused).

Write this complete content. Set the date to `27-10-2026`, unless execution occurs on another local date; then use the actual date in `dd-mm-yyyy` format.

```md
---
id: BR-009
title: "Permission presets and approval scope"
---

## Rule

- **Statement:** This rule sets the named permissions of a chat and the default permission of a new chat. It sets the duration of an approval that reaches outside that permission.
- **Updated at:** 27-10-2026

## Values

### V-1 · Named permission presets

- **Value:** Closed list: Workspace Access and Provided Materials Only.

### V-2 · Default permission preset

- **Value:** Workspace Access.

### V-3 · Access of each preset

- **Value:** Workspace Access covers the chat's data and reading files in its workspace's project folder. Provided Materials Only covers the chat's data, attachments, and project-folder files named as references. Neither preset gives access to another chat or permission to change original user files.

### V-4 · Duration of a step approval

- **Value:** One named step once, or one named scope in the same chat until the user revokes it. A continuing scope covers only the outside file or folder access the user approved. It gives no access to another chat or to original-file changes.

## Notes

- A chat without a project folder cannot read a project folder through either preset.
- A reference does not grant permission by being named. The chosen preset and any explicit approval still limit access.
```

**Check:** No release/version field, code details, UI placement, status, source, FR or UC ID in this BR. Do not duplicate this list in another BR.

## 5. STEP 02 — Add Business Rule for Context Warning

**Create:** `docs/spec/05-business-rules/BR-010.md` (only if unused).

Write the complete content:

```md
---
id: BR-010
title: "Context usage warning threshold"
---

## Rule

- **Statement:** This rule sets the context usage percentage at which the system suggests compacting the conversation.
- **Updated at:** 27-10-2026

## Values

### V-1 · Warning threshold

- **Value:** At least 85% of the context window of the selected model, when the system can calculate that percentage.

## Notes

- This threshold does not start a compact. Only the user starts a compact.
- When the context window or usage cannot be determined, the system shows no calculated percentage as a fact.
```

**Check:** The numeric `85%` appears in this BR; FRs and UC only cite `[BR-010]` and do not repeat the number.

## 6. STEP 03 — Update Provider Business Rule

**Edit:** `docs/spec/05-business-rules/BR-005.md`.

Perform these exact, scoped edits:

1. Under `### V-4 · API protocols of a custom model API`, replace its `- **Value:** not set` and the immediately following `- **Why:** ...` with:

   ```md
   - **Value:** Closed list: OpenAI Chat Completions, OpenAI Responses, Anthropic Messages and Google Gemini.
   ```

2. Under `### V-6 · Provider ID of each built-in provider`, replace its `- **Value:** not set` and immediately following `- **Why:** ...` with:

   ```md
   - **Value:** OpenAI uses `openai`. Anthropic uses `anthropic`. Google Gemini uses `google`. DeepSeek uses `deepseek`. These IDs are fixed for built-in providers.
   ```

3. **Do not change V-5.** Specific default model IDs are still not technically verified. Keep `not set` with its one-line `Why`.
4. **Do not recreate V-7 or V-8.** The existing BR notes say these value IDs are retired. Keep that historical constraint.
5. Keep model metadata and reasoning-level API mappings pending provider/model compatibility evidence. Do not invent valid levels or numeric limits.
6. Update `- **Updated at:**` for this file only.

**Check:** `BR-008.md` already references built-in provider IDs; do not copy the four IDs into BR-008. Its reserved-IDs rule should continue to refer to BR-005 as the value owner.

## 7. STEP 04 — Align Permission Functional Requirements

**Edit exactly these files:**

```text
docs/spec/04-requirements/fr/FR-075.md
docs/spec/04-requirements/fr/FR-076.md
docs/spec/04-requirements/fr/FR-077.md
```

Do not change unrelated acceptance conditions.

### 04A. FR-075 — View and change Chat permission

- Preserve the existing Statement and AC-1 through AC-3 behavior.
- Extend the Statement with two testable sentences:

  ```text
  The system offers the named permission presets in [BR-009]. It shows each continuing approval of the chat with its named scope, and lets the user revoke it.
  ```

- Append an acceptance condition `AC-4 · Revoke a continuing approval`:

  ```md
  ### AC-4 · Revoke a continuing approval

  - **Given:** Chat X has an approved continuing read scope for an outside file. Chat Y is a different chat.
  - **When:** The user revokes that approval in Chat X.
  - **Then:**
    - Chat X no longer has that continuing read scope for future requests.
    - A later request in Chat X needs another approval to read that outside file.
    - Chat Y is unchanged.
  - **Check:** deterministic
  ```

- Replace the Note claiming that the named permissions and default permission are still open. New Note:

  ```text
  The named permissions and the default permission are defined by [BR-009]. The permission of a request is captured when that request starts [FR-042].
  ```

### 04B. FR-076 — Approve outside-permission step

- Preserve the existing distinction between a **clarifying question** and an **approval**.
- Preserve once-only approval, refusal, no-answer waiting, and the prohibition on repeating a refused step.
- Extend the Statement after its sentence about a permission that lasts with:

  ```text
  A continuing approval covers only the named scope and the same chat [BR-009]. The system keeps that approval until the user revokes it. It does not expand the permission of a different chat. No approval allows changing an original project file or reading another chat's data.
  ```

- Add `AC-6 · A continuing approval is limited to one chat`:

  ```md
  ### AC-6 · A continuing approval is limited to one chat

  - **Given:** The user approved a named outside-file read scope for Chat X. Chat Y does not have that approval.
  - **When:** A later request of Chat X reads the same outside file, and a request of Chat Y asks to read it.
  - **Then:**
    - Chat X can read the file within the saved scope.
    - Chat Y still needs its own approval.
    - Neither chat can read the saved work of the other chat.
  - **Check:** deterministic
  ```

- Replace the Notes statement that duration and grant overview are open with a reference to `[BR-009]` and `FR-075`.

### 04C. FR-077 — Default reach of a Chat

- In the Statement, explicitly connect the existing default access behavior to the default preset defined in `[BR-009]`.
- Use this sentence near the beginning:

  ```text
  A new chat uses Workspace Access by default [BR-009].
  ```

- Preserve the existing safeguards: no cross-chat data, no project-folder writing, and no automatic Full Access.
- In `AC-1`, specify that the displayed default permission is Workspace Access, citing `[BR-009]` if needed.
- Replace the Notes statement that the names/default are still open with one sentence that the values live in `[BR-009]`.

**Important interpretation:** A request still uses its starting permission snapshot. A new **once-only step approval** made during that request permits only the approved step. It is not a silent replacement of the request's original permission snapshot.

## 8. STEP 05 — Align UC-014 without inserting UI details

**Edit:** `docs/spec/03-use-cases/UC-014.md`.

Make **only** the following surgical changes:

1. Update the `Updated at:` line.
2. In `## Interactions`, add one concise line referencing `[BR-009]`: the user can choose one of the named Chat permissions; a new Chat uses the default permission.
3. In A1, keep the existing user-intent and system-response lines. Add `[BR-009]` to the line that describes choosing another permission; do not name a widget or button.
4. In A3, keep the existing continuing-permission branch. Add `[BR-009]` to the scope/duration line. Do **not** create a new approval flow: A3 already exists.
5. Replace **Note 2** (the note saying names/durations remain open) with:

   ```text
   2. The named permissions, default permission and duration of continuing approvals are defined in [BR-009]. A user can review and revoke a continuing approval through FR-075.
   ```

6. Keep every other branch and the existing cross-chat/original-file constraints unchanged.

**Verification:** UC remains intent + observable response. Do not mention `Composer`, `Sidebar`, `/permission`, dialog, popover, or technical storage in the sequence diagrams.

## 9. STEP 06 — Align File References and Attachments

### 06A. BR-001 — Attachment limits stay pending

**Edit:** `docs/spec/05-business-rules/BR-001.md`.

- **Do not change V-1**: TXT, MD, PDF, DOCX, PNG, JPEG, PPTX.
- **Do not change V-2 or V-3**: keep `- **Value:** not set` and each existing `Why` line.
- In `## Notes`, replace the sentence stating that it is unknown whether File References count against attachment limits with:

  ```text
  A file or folder named as a project-folder reference is not an attachment. It does not count toward the number of attachments in a request. Safety and resource limits for reading referenced files are checked when the file is read; those limits are not the attachment limits of this rule.
  ```

- Update the date.

### 06B. FR-082 — Reference semantics

**Edit:** `docs/spec/04-requirements/fr/FR-082.md`.

- Preserve the entire existing reference identity, workspace-folder change, no-permission-escalation, and read-time validation behavior.
- Add this sentence to the Statement immediately after `Naming a reference adds no attachment [BR-001].`:

  ```text
  A reference does not count toward the number of attachments in a request.
  ```

- Add this sentence near the read-time checks:

  ```text
  When a read exceeds a safe resource limit, the system does not read beyond that limit and says which material it could not use.
  ```

- Replace the Notes bullet saying the attachment count and size question is open with:

  ```text
  - A reference does not count toward attachment number limits [BR-001]. Safe read limits are checked when the reference is used and are separate from attachment limits.
  ```

- Keep all existing AC-1 through AC-10. Do not claim that a reference is copied into attachment storage.
- Update its date.

### 06C. Validation record; do not invent results

**Create:** `docs/research/tech/attachments-limit-validation.md`.

Use this exact skeleton, and leave results **Not run**:

```md
# Attachment limit validation

## Purpose

Choose safe numeric attachment limits without changing the accepted file types of the ideal product.

## Trial values (not approved product limits)

- Trial attachment count: 10 new attachments in one request.
- Trial file size: 20 MiB per file.
- Accepted types to test: TXT, MD, PDF, DOCX, PNG, JPEG and PPTX.
- A project-folder reference is not an attachment. Its read limit requires a separate safety measurement.

## Required evidence

- Test an individual file just below, at and just above the trial size.
- Test 9, 10 and 11 attachments in one request.
- Test every accepted type, including a valid PPTX.
- Test invalid, protected, damaged and decompression-heavy documents.
- Measure preparation, parsing, memory use and failure behavior on supported hardware.
- Verify that a rejected file keeps the draft request intact.
- Verify that reference reading checks resources at the time of use.

## Result

Not run. No numeric limit is approved by this document.

## Next decision

After technical evidence exists, propose exact values for BR-001 V-2 and V-3. Put any separate read-resource limits in their own appropriate rule or technical limit record.
```

**Do not mark the validation completed.**

## 10. STEP 07 — Align Context Usage and Compact

**Edit:**

```text
docs/spec/04-requirements/fr/FR-078.md
docs/spec/04-requirements/fr/FR-079.md
docs/spec/03-use-cases/UC-015.md
```

### 07A. FR-078 — Context usage and warning

- Preserve the existing estimate/provider-reported distinction and the rule not to invent values.
- Add to its Statement:

  ```text
  When it can calculate a context percentage that reaches the warning threshold [BR-010], the system suggests that the user compact the conversation. The suggestion starts no compact. When the percentage is unknown, the system makes no claim that a threshold was reached.
  ```

- Add `AC-4 · Suggest compact at known high usage`:

  ```md
  ### AC-4 · Suggest compact at known high usage

  - **Given:** A chat has a known context size and a computed usage percentage at or above the warning threshold [BR-010]. No request is active.
  - **When:** The user views the context usage.
  - **Then:**
    - The system suggests compacting the conversation.
    - The system starts no compact.
    - The conversation, request text and attachments are unchanged.
  - **Check:** deterministic
  ```

- Preserve Notes concerning unknown provider accuracy. Update date only if the existing file uses an `Updated at:` field.

### 07B. FR-079 — Manual compact without second confirmation

- Keep the behavior that the system explains summarization before compacting.
- Add this sentence to the Statement after its explanation sentence:

  ```text
  The user's choice to compact confirms that the summary will be used for later requests. The system asks for no second confirmation.
  ```

- Keep manual-only, no scheduling, refusal while request active, failure recovery and readable full history unchanged.
- Replace the Notes sentence describing a second confirmation and automatic compact as open questions with:

  ```text
  The user's compact choice is the confirmation. No automatic compact starts or is scheduled. A context warning is a suggestion only [BR-010].
  ```

- Do not add any new technical summary algorithm or UI component here.

### 07C. UC-015 — User-visible flow

- Preserve the existing Main Flow and A1/A2 meaning.
- Under `## Interactions`, add this intent/response-level sentence:

  ```text
  - When known context usage reaches the warning threshold [BR-010], the system suggests compacting. It starts none by itself.
  ```

- Add this Alternative Flow **only if A3 is still unused on the checked-out branch**:

  ````md
  #### A3 · Context usage reaches the warning threshold

  ```mermaid
  sequenceDiagram
      actor User
      participant DeckAgent
      Note over User,DeckAgent: A3 · Diverges at S1, when known usage reaches the warning threshold [BR-010]
      DeckAgent-->>User: Suggests compacting the conversation [FR-078]
      DeckAgent-->>User: Starts no compact and changes no work of the chat
      Note over User,DeckAgent: Returns to S1. The user chooses whether to compact
  ```
  ````

- Replace Note 3 (which calls confirmation and auto-suggestions open) with:

  ```text
  3. The user's choice to compact confirms that later requests will use the summary. A context warning follows [BR-010] and starts no compact. Provider usage accuracy remains a separate quality question.
  ```

- Update the use case date. Do not describe ring, meter, popover, button, or Composer in this UC.

## 11. STEP 08 — Clean the existing open-question documents

### 08A. `docs/research/ideal-spec-open-design-questions.md`

Make exactly these edits. **Do not remove unrelated questions.**

**Under `## Workspace and chats`: remove only bullets already resolved by existing Workspace FR/BR:**

- The bullet starting `Where the chats of a removed workspace appear.`
- The bullet starting `What the system does when the place it uses for the workspace data` (obsolete per-folder app data assumption).
- The bullet starting `Where the workspace data of the default workspace sits`.
- The bullet starting `Whether the product keeps a copy of the workspace data outside the folder` (obsolete claim that chats live in the project folder).

**Keep** unsettled workspace display names, optional non-default initial workspaces, and whether adding a removed folder rebinds earlier chats **unless the checked-out branch already settles them**.

**Under `## Permissions`: remove all three bullets that ask for named permission choices, the default permission and continuing-grant duration/revocation.** These are now specified by BR-009 and the related FRs. Remove this heading if empty.

**Under `## Keys and providers`:**

- Remove `Which API protocols a custom model API can use`.
- Remove `The provider ID strings of the built-in providers`.
- **Keep** default model IDs per release, per-model capability evidence, reasoning API values, and provider credential requirements if they remain open.

**Under `## Context and compact`:**

- Remove the question starting `Does compacting ask the user before later requests`.
- Remove the question starting `Whether the system offers compacting of its own`.
- **Keep** the question about exact provider-reported usage versus estimates.

**Under `## Awaiting technical evidence`:**

- Keep attachment number and file-size validation pending.
- Remove the question asking whether attachment limits count for references; the answer is now stated in FR-082 / BR-001.
- Do not remove other technical evidence questions.

**Do not** insert completed implementation tasks, wave numbers, or status tables into this research file.

### 08B. `docs/design/ideal-product-design-backlog.md`

- Keep the entire `## Source inspection with slide editing` section unchanged.
- Remove the complete `## Permission reuse` section and its two open-question subsections (`Duration and scope of lasting permissions` and `Review and revoke prior permission`).
- Do not add duplicates of FR-075/076 or BR-009 into this backlog. The canonical decision now lives in the spec.

## 12. STEP 09 — Record ideal-product UI placement outside docs/spec

**Create:** `docs/design/UX-design/ideal-product-ui-placement.md` **if not already present**. If a file with this exact path exists, STOP on this file and report the collision instead of overwriting.

Write the content below; no V2 task IDs, no implementation status, no version-scoped work instructions:

```md
# Ideal Product — UI Placement Reference

## Purpose

Locate product controls without putting widget, position or gesture details into the behavior specification. DeepSeek Harness is a reference, not a mandatory layout template. DeckAgent keeps its deck canvas.

## Selected placement

| Feature | Entry point | Main location | Key interaction |
|---|---|---|---|
| Workspace and Chat History | Left navigation | Workspace groups with Chat rows | A new Chat uses the selected Workspace. Running and waiting Chats show their state on their row. |
| Provider and Models | Settings / Models; model selector in request area | Settings for setup; Composer for selection | Reasoning choices follow the selected model. Changing choice does not interrupt the active request. |
| Chat Frame | Conversation Composer | Request area | Request text, attachments and file references remain together until sent. |
| Chat Lifecycle | Chat rows in left navigation | Left navigation and open Conversation | Switching Chat does not cancel a running request in another Chat. |
| Agent Permissions | Permission selector in Composer; default in Settings | Composer and Chat-scoped approval | Pending approval is presented within that Chat's Conversation/Composer. The user sees scope before choosing. |
| Request Lifecycle and Activity Log | Conversation | Inline request activity | Activities remain attached to the correct request; detail opens in context. |
| Sources and Attachments | Composer attachments and references | Request area; right-side preview when needed | File validation states stay visible. Preview does not move or send the original. |
| Web Research configuration | Settings / Tools / Web Research | Settings | Select Search and Fetch providers separately. Credentials stay hidden. |
| Context Usage and Compact | Small context indicator near/below Composer | Composer, with an on-demand detail surface | Show estimate/reported status. Compact is user-triggered and the warning does not start it. |
| Deck Canvas | Open deck in the right-side work area | Dedicated Deck Canvas | A file preview must not replace or destroy the deck state. |

## Interaction states to cover in UI design

- Idle, running, awaiting user answer, awaiting permission approval, completed, failed and cancelled request.
- Attachment preparing, ready, rejected and removed.
- Project folder missing or moved; unreadable file reference.
- Provider/model configuration missing, invalid or unavailable.
- Context percentage known, estimated or unavailable.
- Mobile/narrow layout without losing active Chat and draft data.

## Reference locations

- DeepSeek UI Workspace: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-workspace
- DeepSeek UI Model Selection: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-model-selection
- DeepSeek UI Permission Presets: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-permission-presets
- DeepSeek UI Approval: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-approval
- DeepSeek UI Attachments: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-attachment
- DeepSeek Web Search Settings: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-settings-web-search
- DeepSeek Context Meter: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/src/client/skeleton/ContextMeter.tsx

## Boundary

UI placement explains where a product behavior is reached and presented. UC and FR files remain responsible for the behavior and expected response, not layout.
```

## 13. STEP 10 — Record technical decisions (ADRs)

Use `docs/adr/`, as instructed by the repository. Do not write ADRs in `docs/spec/` or `docs/versions/`.

**Numbering:** Check existing ADRs first, as required in STEP 00. These exact filenames assume no ADR currently exists. If there is a numbering collision, STOP and report rather than reusing the number.

### 10A. Create `docs/adr/0001-application-storage-and-workspace-boundary.md`

```md
---
status: accepted
---

# Application storage is separate from project folders

DeckAgent keeps Workspace identity, Chat history, decks, outlines and internal Agent working data in application-owned storage, conceptually under `~/.deckagent/`. A Workspace refers to an optional user project folder; it is not the place where DeckAgent stores its own history. We chose this boundary so Chat and Deck data remain available when a source folder moves, and so slide generation does not create or change files in that source folder.

## Consequences

- The default storage path is stable and is not relative to the process working directory.
- Workspace ID and Chat ID identify saved work independently of the project-folder path.
- The Agent's temporary working files remain separate from user source files and from durable Chat/Deck data.
- Existing data stored under a legacy relative `.deckagent/` needs a non-destructive migration path.
- Project-folder access is read-only by default; only an explicit user export can write an output where permitted.
- This ADR does not choose a database schema or final set of storage subdirectories.
```

**Status rationale:** The Product Owner has explicitly accepted the storage separation. Do not extend `accepted` to an unapproved SQLite schema, migration mechanism, or package rewrite.

### 10B. Create `docs/adr/0002-provider-neutral-web-research.md`

```md
---
status: proposed
---

# Separate web research tools from Search and Fetch providers

DeckAgent will expose Search and Fetch as model-callable capabilities while keeping the selected provider behind a separate service boundary. This follows the DeepSeek Harness web capability pattern and avoids binding Agent Runtime to one vendor. The Product Owner approved the direction; package reuse and external service selection still need compatibility and security review.

## Consequences

- `web_search` and `web_fetch` have distinct operations and can use different providers.
- A provider adapter returns normalized sources and structured errors; replacing it does not change the Agent's tool names.
- A missing or invalid provider does not cause silent fallback to another provider.
- A public research provider is not enabled until approved for external connections.
- Search must not send private content from requests, conversations, attachments, project files or decks.
- The DeepSeek reference's option to send the original question must be disabled for DeckAgent public research.
- HTTP Fetch needs network destination restrictions, including loopback and private-network addresses.
- Direct import of DeepSeek packages remains a technical proposal until dependency and integration tests are completed.

## Reference

https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web.md
```

Do **not** mark this entire ADR `accepted`: only the high-level product direction is approved; direct package reuse, external service approval and final enforcement implementation are not.

## 14. STEP 11 — Do not add redundant changes

After applying STEP 01–10, check these existing files but leave them **unchanged unless a direct contradiction was introduced by an edit**:

```text
docs/spec/03-use-cases/UC-001.md
docs/spec/03-use-cases/UC-003.md
docs/spec/04-requirements/fr/FR-015.md
docs/spec/04-requirements/fr/FR-016.md
docs/spec/04-requirements/fr/FR-017.md
docs/spec/04-requirements/fr/FR-042.md
docs/spec/04-requirements/fr/FR-055.md
docs/spec/04-requirements/fr/FR-081.md
docs/spec/04-requirements/fr/FR-088.md
docs/spec/04-requirements/fr/FR-089.md
docs/spec/04-requirements/fr/FR-090.md
docs/spec/04-requirements/nfr/NFR-003.md
docs/spec/04-requirements/nfr/NFR-007.md
docs/spec/05-business-rules/BR-004.md
docs/spec/05-business-rules/BR-008.md
docs/versions/README.md
```

Why: these already contain the main behavior constraints. The decisions being aligned do not justify rewriting them. In particular, do not replace existing `[BR-?: reasoning levels]` markers with fictitious provider/model values; those still await provider evidence.

**Do not create a V2 `SCOPE.md` or `PROGRESS.md` here.** V2 Implementation Planning is a later phase.

## 15. STEP 12 — Verification (required)

Run these checks after edits:

```sh
git diff --check
git status --short
git diff --name-only
git diff -- docs/spec/05-business-rules/BR-001.md docs/spec/05-business-rules/BR-005.md
git diff -- docs/spec/04-requirements/fr/FR-075.md docs/spec/04-requirements/fr/FR-076.md docs/spec/04-requirements/fr/FR-077.md docs/spec/04-requirements/fr/FR-078.md docs/spec/04-requirements/fr/FR-079.md docs/spec/04-requirements/fr/FR-082.md
git diff -- docs/spec/03-use-cases/UC-014.md docs/spec/03-use-cases/UC-015.md
```

Also inspect all **new** files (untracked files do not appear in `git diff` until staged; do not stage solely to verify). Check each new file with `sed -n '1,240p' FILE` or another text viewer.

**Required manual verification checklist**

1. `git branch --show-current` is still exactly `docs/versions/v2`.
2. No application code, V1 files, V2 plan, or active-version registration changed.
3. `BR-009` and `BR-010` IDs are unique; no retired BR value ID was reused.
4. BR-001 V-2/V-3 remain `not set`; trial 10 / 20 MiB values appear only in research, not as finalized spec.
5. BR-005 V-4 and V-6 have selected values; V-5 stays `not set`; V-7/V-8 remain retired.
6. FR-075/076/077 and UC-014 reference `[BR-009]`; they never allow cross-chat access or original-file writes.
7. FR-078 and UC-015 reference `[BR-010]`; warning does not trigger automatic compaction.
8. FR-079 does not ask for a second confirmation and retains full readable conversation.
9. FR-082 and BR-001 consistently say references do **not** count as attachments.
10. Research/backlog files no longer call the now-decided questions open; unrelated open questions remain.
11. UI placements are only in the UI design document, never added as widgets/locations in UC or FR.
12. ADRs describe architecture decisions rather than required user interaction; external provider selection is not presented as approved.
13. Existing Mermaid fences and A1/A2/A3 flow identifiers remain valid; no duplicate flow IDs.
14. Verify **single source of truth**: named permissions in BR-009, threshold only in BR-010, protocol/IDs only in BR-005, file types only in BR-001.
15. Check source dates in changed files use `dd-mm-yyyy` (UC line and BR Rule line). Do not add dates to fields where the template does not have them.

If a repository documentation check script already exists, run it. Do not install dependencies or alter scripts only to run a documentation check. Record checks actually run and their output; do not claim tests passed without running them.

## 16. STOP conditions and escalation (simple rules)

**STOP immediately** and report the conflicting file/condition when:

- Wrong branch.
- A target file contains unrelated uncommitted work.
- Required BR/ADR ID or UC-015 A3 is already occupied with a different meaning.
- Existing branch content materially conflicts with the exact target snippet or a documented accepted ADR.
- A planned edit would change an unapproved product behavior or require inventing values.

Do **not** silently resolve a product question, renumber IDs, delete another person's work, or switch to `dev`. Other non-conflicting edits may remain in the working tree; explain the partial state precisely.

## 17. Final reply format (must use)

Return **exactly** this compact report; fill it with actual results:

```text
Status: COMPLETE | PARTIAL | BLOCKED
Branch: docs/versions/v2
Baseline commit: <actual short SHA>
Changed files: <count and exact paths>
Created files: <count and exact paths>
Checks: <commands run and pass/fail>
Decisions reflected: PD-01, PD-02, PD-03, PD-04, PD-05, PD-06, PD-07, SD-01
Validation still pending: attachment numeric limits; per-model capabilities/default models; external provider approval; direct DeepSeek package compatibility
Blockers: <none or exact items>
Commit: not created
Push: not performed
```

When `Status: PARTIAL` or `BLOCKED`, state which steps are completed and which are not. Do not claim documentation alignment complete until all requested files are updated and checked.

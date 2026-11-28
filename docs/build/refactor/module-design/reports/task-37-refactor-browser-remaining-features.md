# Task 37: Browser Chats, Requests, Attachments, Workspaces, and Research Refactor Report

Read this file to review the `request-row.ts` extraction, the `conversation-view.ts`, `workspace-view.ts`, and `research-view.ts` splits, the explicit `offersSettings` flag, the removed assertions, and the verification output [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/browser/features/chats/request-row.ts` (259 lines) — `ActivityRow`, `outcomes`, `activityNames`, `RequestRowHooks`, the `RequestRow` node holder, `createRequestRow`, `updateRequestActions`, `updateRequestActivities`, `updateApprovalCard`, and `updateRequestRow`.

Modified:

- `apps/web/src/browser/features/chats/conversation-view.ts` (519 → 293 lines) — delegates request row creation and updates to `request-row.ts`, replaces the two remaining non-null assertions with explicit checks, and keeps the message, outline, boundary, and scroll rendering.
- `apps/web/src/browser/features/chats/message-content.ts` (104 → 125 lines) — replaces the three raw `RegExpExecArray` helpers with `parseFence`, `parseHeading`, and `parseListItem` and removes all 12 non-null assertions.
- `apps/web/src/browser/features/requests/request-feedback.ts` (279 → 288 lines) — adds an optional third tuple element to the eight codes whose detail sends the user to model settings and replaces the `/cài đặt model/i` test in `offersSettings` with an explicit flag lookup that keeps the unknown-code fallback `true`.
- `apps/web/src/browser/features/attachments/attachment-view.ts` (78 lines) — removes the `export` modifier from `attachmentReason`.
- `apps/web/src/browser/features/workspaces/workspace-view.ts` (285 → 367 lines) — keeps `workspaceFailure`, `folderNotice`, and the style block file-local, inlines the `workspaceView` return type, and extracts `createWorkspaceDom`, `renderWorkspaceList`, `runWorkspaceChange`, `openWorkspaceDialog`, and the action wiring.
- `apps/web/src/browser/features/research/research-view.ts` (158 → 202 lines) — extracts `createResearchDialog`, `createResearchControls`, `createResearchActions`, `performResearch`, and `renderResearchSources` as file-local helpers.
- `docs/build/refactor/module-design/plan/README.md` — Task 37 is `Done`.
- `docs/build/refactor/module-design/plan/task-37-refactor-browser-remaining-features.md` — Steps 1 to 6 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 37 row.

## Module responsibilities

| Module | Owns |
| --- | --- |
| `request-row.ts` | Request record DOM, status and diagnostic copy, live reply, retry and settings actions, activity rows, and the approval card |
| `conversation-view.ts` | Conversation scroll container, message rendering, summary boundaries, outline attachment, and row placement |
| `message-content.ts` | Text-only fence, heading, list, and paragraph parsing and inline formatting |
| `request-feedback.ts` | Request status copy, failure copy, and the settings-shortcut decision |
| `workspace-view.ts` | Workspace selector DOM, list rendering, change execution, and the add, rename, relink, and remove flows |
| `research-view.ts` | Research toggle, dialog DOM, key actions, source reading, and the settings shortcut |

## Behaviour preservation

- Every Vietnamese UI string, CSS class name, inline `<style>` content, `data-*` value, and ARIA attribute moved without edits.
- `offersSettings` returns the same answer for every known code. The eight flagged codes are exactly the codes whose detail contains "cài đặt model"; unknown and missing codes still return `true` through the fallback.
- `parseFence`, `parseHeading`, and `parseListItem` keep the original regular expressions and produce the same fence closing rule, heading level, ordered-list start, and paragraph break.
- `ConversationView`, `AttachmentDraftView`, `workspaceView`, and `researchView` keep their constructor and parameter signatures. The five feature barrels are unchanged.
- `RequestRow` is still exported as a type through the class declaration; no other module imports it.

## Metrics

The AST sweep reads `scripts/scan-module-design.mjs --json` and counts non-null expressions with the TypeScript API. Task 37 owns the `attachments/`, `chats/`, `requests/`, `research/`, and `workspaces/` rows. The `providers/` rows appear because the sweep covers all six non-deck folders; Task 36 owns those files and Task 37 did not edit them.

| File | Lines | Over 400 | `as` | `!` | Exports |
| --- | --- | --- | --- | --- | --- |
| `attachments/attachment-view.ts` | 78 | false | 0 | 0 | 1 |
| `attachments/index.ts` | 1 | false | 0 | 0 | 1 |
| `chats/conversation-view.ts` | 293 | false | 0 | 0 | 1 |
| `chats/index.ts` | 1 | false | 0 | 0 | 1 |
| `chats/message-content.ts` | 125 | false | 0 | 0 | 1 |
| `chats/request-row.ts` | 259 | false | 0 | 0 | 7 |
| `providers/index.ts` | 2 | false | 0 | 0 | 2 |
| `providers/model-picker.ts` | 223 | false | 0 | 0 | 1 |
| `providers/provider-errors.ts` | 37 | false | 0 | 0 | 1 |
| `providers/provider-model-draft.ts` | 99 | false | 0 | 0 | 3 |
| `providers/settings-dom.ts` | 312 | false | 0 | 0 | 3 |
| `providers/settings-panel.ts` | 371 | false | 0 | 0 | 1 |
| `requests/index.ts` | 1 | false | 0 | 0 | 3 |
| `requests/request-feedback.ts` | 288 | false | 0 | 0 | 3 |
| `research/index.ts` | 1 | false | 0 | 0 | 1 |
| `research/research-view.ts` | 202 | false | 0 | 0 | 1 |
| `workspaces/index.ts` | 1 | false | 0 | 0 | 1 |
| `workspaces/workspace-view.ts` | 367 | false | 0 | 0 | 1 |

Every file has `longFn: 0` and `smallNonBarrel: false`. `request-row.ts` is under 260 lines, `conversation-view.ts` is under 300 lines, and every function in the five owned folders is under 65 lines except `messageContent` (67 lines, under the task limit of 75) and `render` in `conversation-view.ts` (74 lines, under 75). `attachment-view.ts` and `workspace-view.ts` each have one export.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | no diagnostics |
| `npx biome format --write apps/web/src/browser/features/chats/ apps/web/src/browser/features/requests/ apps/web/src/browser/features/attachments/ apps/web/src/browser/features/workspaces/ apps/web/src/browser/features/research/` | `0` | `Formatted 12 files`, `Fixed 4 files` |
| Step 5 AST sweep on the six non-deck feature folders | `0` | `over400: false`, `longFn: 0`, `smallNonBarrel: false`, `as: 0`, `nn: 0` on every file; `attachment-view.ts` and `workspace-view.ts` have `exports: 1` |
| `corepack pnpm@11.28.5 test:local-web` | `0` | `# tests 8`, `# pass 8`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:tools-browser` | `0` | `# tests 14`, `# pass 14`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:research` | `0` | `# tests 5`, `# pass 5`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs` reported `0 error(s)` |

## What the commands do not prove

- No new test was added. The three suites cover the session, management, and research endpoints; they do not render the conversation rows, workspace dialog, or research dialog, because those paths need a browser DOM.
- `lint` and `check:boundaries` enforce static rules only. They do not prove that the moved UI strings, DOM class names, ARIA attributes, or CSS blocks are unchanged; the diff of those moved blocks does.
- The AST sweep counts lines, function spans, type assertions, and non-null assertions. It does not run `tsc -b`, so it does not prove that the class-based `RequestRow` has no declaration-emit difference.
- `check:docs` checks the document structure, the purpose line, relative links, and citations. It does not check that this report still matches a later rescan of the folder.
- The `providers/` metric rows depend on Task 36. A later Task 36 commit can change those numbers without changing this report.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 37 Plan](../plan/task-37-refactor-browser-remaining-features.md)

# Task 36: Browser Providers Feature Refactor Report

Read this file to review the split of `settings-panel.ts` and `model-picker.ts`, the removal of dead DOM setup and assertions, and the verification output [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/browser/features/providers/provider-errors.ts` (37 lines) — `saveFailure` moved without edits from `settings-panel.ts`, plus the `ManagementError` import.
- `apps/web/src/browser/features/providers/settings-dom.ts` (312 lines) — file-local `localizedField`, the dialog shell builders, `createSettingsDom`, and the form behaviour `fillForm`, `showStep`, `setBusy`, and `lockConnection`.
- `apps/web/src/browser/features/providers/provider-model-draft.ts` (99 lines) — `createModelDraftController` with `parseModelList`, `mergeModels`, `renderModels`, `addManualModel`, `addCatalog`, and `loadCatalog`.

Modified:

- `apps/web/src/browser/features/providers/settings-panel.ts` (604 → 371 lines) — one `PanelState` object drives module-level functions for refresh, save, wizard steps, dirty checks, and the dialog lifecycle.
- `apps/web/src/browser/features/providers/model-picker.ts` (172 → 223 lines) — split into `createPickerDom`, `renderPickerOptions`, `closePicker`, `togglePicker`, `attachPickerEvents`, and a 47-line `modelPicker`.
- `docs/build/refactor/module-design/plan/README.md` — Task 36 is `Done`.
- `docs/build/refactor/module-design/plan/task-36-refactor-browser-providers-feature.md` — Steps 1 to 5 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 36 row.

`apps/web/src/browser/features/providers/index.ts` keeps its exact two exports (`modelPicker`, `settingsPanel`).

## Module responsibilities

| Module | Owns |
| --- | --- |
| `provider-errors.ts` | The Vietnamese failure copy for each management error code. Provider messages are never shown. |
| `settings-dom.ts` | Dialog, form, and step DOM: localized fields, credentials copy, button labels, step visibility, form fill, and busy state. |
| `provider-model-draft.ts` | The model ID draft in the textarea, chips, manual entry, catalog append, and catalog loading. Nothing persists until Save. |
| `settings-panel.ts` | Provider and built-in state, list rendering, dirty checks, save and delete flow, wizard transitions, and dialog open and close. |
| `model-picker.ts` | The popup trigger, provider tabs, model options, keyboard navigation, and the selected-label update. |

## Behaviour preservation

- Every Vietnamese visible label, English `aria-label`, CSS class name, dialog behaviour, and error copy moved without edits.
- The dead DOM lines are gone: the overwritten `field('Provider type', kind)` in the connection section, the first `modelSection.append` block, the post-hoc `Provider type` label removal, and the label rewrite loop.
- `localizedField` writes the English automation label to `aria-label` and the Vietnamese label to the visible `span`, so the rewrite loop is no longer needed.
- `renderStep` still unlocks the connection inputs, fills the form, then locks the inputs when the step is not step 2.
- The `as const` protocol table and the `as const` offer rows are unchanged.
- `value!.id` is replaced by an explicit `value !== undefined` check before `builtIns.some`.
- `model-picker` keeps the popup position rule, the focus rule, the `Escape` handling, and the selection dispatch.

## Metrics

The AST sweep reads `scripts/scan-module-design.mjs --json` and counts non-null expressions with the TypeScript API.

| File | Lines | Over 400 | Functions over 80 | `as` | `!` | Exports |
| --- | --- | --- | --- | --- | --- | --- |
| `index.ts` | 2 | false | 0 | 0 | 0 | 2 |
| `model-picker.ts` | 223 | false | 0 | 0 | 0 | 1 |
| `provider-errors.ts` | 37 | false | 0 | 0 | 0 | 1 |
| `provider-model-draft.ts` | 99 | false | 0 | 0 | 0 | 3 |
| `settings-dom.ts` | 312 | false | 0 | 0 | 0 | 3 |
| `settings-panel.ts` | 371 | false | 0 | 0 | 0 | 1 |

The largest functions are 51 lines in `settings-dom.ts`, 48 in `settings-panel.ts`, 56 in `model-picker.ts`, and 28 in `provider-model-draft.ts`. The task caps are 70, 70, 65, and 45 lines.

Two files exceed the task line targets: `settings-dom.ts` 312 against 200, and `settings-panel.ts` 371 against 280. The shell alone creates and configures 41 element references. The form fill and step visibility use those references, so they stay in `settings-dom.ts`. Moving them to `settings-panel.ts` would break the 400-line scanner threshold for that file. Splitting the panel logic into module-level functions keeps every function small, and each shared-state signature and `panel.` prefix adds lines.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | no diagnostics |
| `npx biome format --write apps/web/src/browser/features/providers/` | `0` | `Formatted 6 files in 36ms. Fixed 3 files.` |
| `npx biome format apps/web/src/browser/features/providers/` | `0` | `Checked 6 files in 35ms. No fixes applied.` |
| Step 4 AST sweep on `apps/web/src/browser/features/providers/` | `0` | `over400: false`, `longFn: 0`, `smallNonBarrel: false`, `as: 0`, `nn: 0` on every file |
| `corepack pnpm@11.28.5 test:local-web` | `0` | `# tests 8`, `# pass 8`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:tools-browser` | `0` | `# tests 14`, `# pass 14`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs` reported `0 error(s)` |

The first `build` run reported `conversation-view.ts(169,5): error TS2554` while an unrelated working-tree change was present in `chats/`. That file is outside this task. The rerun passed with exit code `0`.

## What the commands do not prove

- No test renders the settings dialog or the model popup. The two suites cover host management, the browser runtime, and the local web server, so step visibility, scrim and `Escape` close, focus order, and popup positioning are not proven at runtime.
- `lint` and `check:boundaries` enforce static rules only. They do not prove that the dialog behaves as before when a user edits a field, switches provider, or saves with a removed key.
- The AST sweep counts lines, function spans, type assertions, and non-null assertions. It does not prove that every visible string, ARIA attribute, and class name is unchanged. The moved blocks are copied without edits.
- `check:docs` checks document structure, the purpose line, relative links, and citations. It does not check that this report still matches a later rescan.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 36 Plan](../plan/task-36-refactor-browser-providers-feature.md)

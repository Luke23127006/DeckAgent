# Task 36: Refactor `browser/features/providers` `settings-panel` and `model-picker`

Read this file to split `settings-panel.ts` and `model-picker.ts`, remove dead DOM setup, and remove all assertions in `apps/web/src/browser/features/providers/` (`BF1`, `BF2`, `BF6`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/browser/dom.ts` (24 lines)
- `apps/web/src/browser/features/providers/index.ts` (2 lines)
- `apps/web/src/browser/features/providers/settings-panel.ts` (604 lines)
- `apps/web/src/browser/features/providers/model-picker.ts` (172 lines)

**Files:**

- Create: `apps/web/src/browser/features/providers/provider-errors.ts`
- Create: `apps/web/src/browser/features/providers/settings-dom.ts`
- Create: `apps/web/src/browser/features/providers/provider-model-draft.ts`
- Change: `apps/web/src/browser/features/providers/settings-panel.ts`
- Change: `apps/web/src/browser/features/providers/model-picker.ts`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-36-refactor-browser-providers-feature.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-36-refactor-browser-providers-feature.md`

**Interfaces:**

- Produces:
  - `apps/web/src/browser/features/providers/provider-errors.ts`: internal `saveFailure(error: unknown): string`.
  - `apps/web/src/browser/features/providers/settings-dom.ts`: internal `createSettingsDom` returning all dialog, form, heading, and button references.
  - `apps/web/src/browser/features/providers/provider-model-draft.ts`: internal `createModelDraftController`.
  - `apps/web/src/browser/features/providers/index.ts`: keeps exact two exports (`modelPicker`, `settingsPanel`) unchanged.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not touch `providers/index.ts`, `dom.ts`, or `boot.ts`).
- Change any English `aria-label`, Vietnamese visible label, CSS class name, dialog behavior, or error copy.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 5 checks pass.

- [x] **Step 1: Extract `provider-errors.ts`, `settings-dom.ts`, and `provider-model-draft.ts` (`BF1`, `BF6`)**

1. Create `apps/web/src/browser/features/providers/provider-errors.ts` (under 55 lines):
   - Move `saveFailure(error: unknown): string` verbatim from `settings-panel.ts` lines 260-293, importing `ManagementError` from `../../transport/index.ts`.
2. Create `apps/web/src/browser/features/providers/settings-dom.ts` (under 200 lines, every function under 70 lines):
   - Add file-local `localizedField(ariaLabel: string, visibleLabel: string, input: HTMLElement): HTMLLabelElement` that appends `element('span', visibleLabel)` and `input` to `element('label')` and calls `input.setAttribute('aria-label', ariaLabel)`.
   - Build the dialog shell, `providerStep`, `connection`, `credentials`, `modelSection`, `footer`, and `nav` using `localizedField` directly with the exact label pairs from `settings-panel.ts` lines 563-574.
   - Set the Vietnamese credentials paragraph directly (`'Sau khi lưu, không hiện lại bất kỳ phần nào của key. Để trống để giữ key đã lưu.'`) and button labels (`'Lấy model catalog'`, `'Thêm model đã chọn'`, `'Xóa cấu hình'`).
   - Omit the overwritten dead DOM lines (`settings-panel.ts` lines 381, 394-402, 477-478, and the post-hoc label rewrite loop at 563-583).
   - Export `createSettingsDom` returning direct `connectionHeading` and `modelHeading` `HTMLHeadingElement` references alongside the other controls so callers never query `h3` or `p` with `!`.
3. Create `apps/web/src/browser/features/providers/provider-model-draft.ts` (under 100 lines, every function under 45 lines):
   - Export `createModelDraftController` owning `parseModelList`, `renderModels`, `addManualModel`, `addCatalog`, and `loadCatalog` (`settings-panel.ts` lines 63-87 and 407-450).

- [x] **Step 2: Shrink `settings-panel.ts` under 280 lines and remove `value!.id` (`BF1`, `BF6`)**

In `apps/web/src/browser/features/providers/settings-panel.ts`:

1. Compose `createSettingsDom`, `createModelDraftController`, and `saveFailure`.
2. Replace `connection.querySelector('h3')!` and `modelSection.querySelector('h3')!` with `dom.connectionHeading.textContent` and `dom.modelHeading.textContent`.
3. Replace line 251 `builtIns.some(template => template.id === value?.id) ? value!.id : ''` with:

```ts
const isBuiltIn = value !== undefined && builtIns.some(template => template.id === value.id)
dom.kind.value = isBuiltIn ? value.id : ''
```

4. Keep `fill`, `refresh`, `perform`, `renderStep`, `requestClose`, and `settingsPanel` under 70 lines each and keep the file under 280 lines. Keep the two `as const` literals unchanged.

- [x] **Step 3: Split `model-picker.ts` and remove its `as` and `!` assertions (`BF2`, `BF6`)**

In `apps/web/src/browser/features/providers/model-picker.ts`:

1. Extract file-local `createPickerDom`, `renderPickerOptions`, and `attachPickerEvents` so every function stays under 65 lines and `modelPicker` stays under 55 lines.
2. Replace line 129 (`document.activeElement as HTMLButtonElement`) with:

```ts
const activeEl = document.activeElement
if (!(activeEl instanceof HTMLButtonElement)) return
const index = items.indexOf(activeEl)
```

3. Replace lines 154-159 (`select.selectedOptions[0]!.textContent`) with:

```ts
const selectedOption = select.selectedOptions[0]
trigger.textContent =
  selectedOption?.value && select.value !== '__settings'
    ? (selectedOption.textContent ?? '')
    : providers.some(provider => provider.models.length)
      ? 'Chọn model'
      : 'Chưa có model'
```

- [x] **Step 4: Build, check boundaries, lint, format, measure AST metrics, and run suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/browser/features/providers/
```

Run quantitative AST check on `apps/web/src/browser/features/providers/`:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.path.startsWith('apps/web/src/browser/features/providers/')).map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,smallNonBarrel:!f.isBarrel&&f.lines<30,as:f.typeAssertions.length,nn};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every file under `apps/web/src/browser/features/providers/` has `over400: false`, `longFn: 0`, `smallNonBarrel: false`, `as: 0`, and `nn: 0`.

Run web management and browser runtime suites:

```bash
corepack pnpm@11.28.5 test:local-web && corepack pnpm@11.28.5 test:tools-browser
```

Expected: PASS. Both suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [x] **Step 5: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Change the Task 36 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-36-refactor-browser-providers-feature.md`.
2. Create `docs/build/refactor/module-design/reports/task-36-refactor-browser-providers-feature.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created and changed files.
   - AST metrics table for every file in `apps/web/src/browser/features/providers/`.
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 36 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the files in `Files` changed. Stage only those files, commit with `refactor(browser): split providers settings panel and model picker`, and run `git push`.

**STOP** and send the Task 36 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)

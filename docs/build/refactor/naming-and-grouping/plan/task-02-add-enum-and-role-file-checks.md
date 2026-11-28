# Task 2: Add the enum check and the role file check

Read this file to learn the steps of Task 2, which adds the rules `typescript-enum` and `role-file-symbol` to `check:boundaries` and turns on `oxc/no-const-enum`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `scripts/check-boundaries.mjs` (the functions `extractImports`, `checkBoundaries` and `moduleOfPath`)
- `tests/check-boundaries.test.mjs` (the helper `findings`)
- `tests/oxlint-boundaries.test.mjs` (the helper `lintFixture`)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Change: `scripts/check-boundaries.mjs`
- Change: `.oxlintrc.json` (the top-level `rules`)
- Test: `tests/check-boundaries.test.mjs`
- Test: `tests/oxlint-boundaries.test.mjs`

**Interfaces:**
- Produces: `export const extractDeclarations = (filePath, sourceText) => ({ enums, classes, functions })`. Each item is `{ line, name }`. `enums` has every enum declaration. `classes` and `functions` have only top-level declarations with the `export` keyword.
- Produces: `const ROLE_FILE_MODULES = []` in `scripts/check-boundaries.mjs`. `checkBoundaries` reads `snapshot.roleFileModules ?? ROLE_FILE_MODULES`.
- Produces: the rule IDs `typescript-enum` and `role-file-symbol`.

**STOP when:** `corepack pnpm@11.28.5 check:boundaries` reports a violation of `typescript-enum` in the repository.

**Forbidden:** Task protocol only

- [x] **Step 1: Write the failing tests**

In `tests/check-boundaries.test.mjs`, change the helper to `const findings = (files, tsconfigPaths = {}, roleFileModules) => checkBoundaries({ workspaces: baseWorkspaces, files, tsconfigPaths, ...(roleFileModules ? { roleFileModules } : {}) }).map(({ path, line, rule }) => ({ path, line, rule }))`. Add these tests at the end of the file:

```js
test('checkBoundaries rejects an enum and a const enum in source and test files', () => {
  const files = [
    { path: 'apps/host/src/modules/chats/message.ts', content: "export enum Role {\n  User = 'user',\n}\n" },
    { path: 'packages/presentation/deck/src/state.ts', content: '\nconst enum Phase {\n  Draft,\n}\nexport const first = Phase.Draft\n' },
    { path: 'apps/host/tests/sample.test.ts', content: 'enum Local {\n  A,\n}\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/modules/chats/message.ts', line: 1, rule: 'typescript-enum' },
    { path: 'apps/host/tests/sample.test.ts', line: 1, rule: 'typescript-enum' },
    { path: 'packages/presentation/deck/src/state.ts', line: 2, rule: 'typescript-enum' },
  ])
})

test('checkBoundaries rejects role files without their role symbols in a listed module', () => {
  const files = [
    { path: 'apps/host/src/modules/chats/chats.service.ts', content: 'export function createChatOperations() {}\n' },
    { path: 'apps/host/src/modules/chats/chats.store.ts', content: 'export class ChatRecords {}\n' },
    { path: 'apps/host/src/modules/chats/chats.routes.ts', content: 'export function chatRouter() {}\n' },
    {
      path: 'apps/host/src/modules/chats/chats.errors.ts',
      content: 'export class ChatFailure extends Error {}\nexport function mapChatFailure() {}\n',
    },
    { path: 'apps/host/src/modules/chats/chat-text.ts', content: 'export class TitleService {}\nexport class TextStore {}\n' },
  ]
  assert.deepEqual(findings(files, {}, ['chats']), [
    { path: 'apps/host/src/modules/chats/chat-text.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chat-text.ts', line: 2, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.routes.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.store.ts', line: 1, rule: 'role-file-symbol' },
  ])
})

test('checkBoundaries accepts role symbols in a listed module and ignores modules outside the list', () => {
  const files = [
    { path: 'apps/host/src/modules/chats/chats.service.ts', content: 'export class ChatService {}\n' },
    { path: 'apps/host/src/modules/chats/chat-requests.service.ts', content: 'export class ChatRequestService {}\n' },
    { path: 'apps/host/src/modules/chats/chats.store.ts', content: 'export class SqliteChatStore {}\n' },
    { path: 'apps/host/src/modules/chats/draft.store.ts', content: 'export class MemoryDraftStore {}\n' },
    { path: 'apps/host/src/modules/chats/files.store.ts', content: 'export class ChatFileStore {}\n' },
    { path: 'apps/host/src/modules/chats/chats.routes.ts', content: 'export function createChatRoutes() {}\n' },
    {
      path: 'apps/host/src/modules/chats/chats.errors.ts',
      content: 'export class ChatError extends Error {}\nexport function mapChatError() {}\n',
    },
    { path: 'apps/host/src/modules/workspaces/workspaces.service.ts', content: 'export function createWorkspaceOperations() {}\n' },
  ]
  assert.deepEqual(findings(files, {}, ['chats']), [])
  assert.deepEqual(findings(files), [])
})
```

In `tests/oxlint-boundaries.test.mjs`, add:

```js
test('rejects a const enum', () => {
  const result = lintFixture('apps/host/src/sample.ts', 'const enum Phase {\n  Draft,\n}\nexport const first = Phase.Draft\n')
  assert.equal(result.status, 1)
  assert.deepEqual(result.diagnostics.map(d => d.code), ['oxc(no-const-enum)'])
})
```

- [x] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs`
Expected: FAIL. The three tests `checkBoundaries rejects an enum and a const enum in source and test files`, `checkBoundaries rejects role files without their role symbols in a listed module` and `rejects a const enum` fail. The test `checkBoundaries accepts role symbols in a listed module and ignores modules outside the list` passes, because no rule exists yet.

- [x] **Step 3: Implement the rules**

In `scripts/check-boundaries.mjs`, add `extractDeclarations` with the TypeScript compiler API. In `checkBoundaries`, for each file, add `typescript-enum` for each item of `enums`. For each production file in a module of `roleFileModules`:

| Signal | Violation of `role-file-symbol` |
| --- | --- |
| The file ends with `.service.ts` and no exported class matches `/^[A-Z]\w*Service$/` | Line 1: `File "<path>" must export a class with a name that ends with "Service". Rename the main export to the role of the file.` |
| The file ends with `.store.ts` and no exported class matches `/^(?:Sqlite\|Memory)[A-Z]\w*Store$\|^[A-Z]\w*FileStore$/` | Line 1: `File "<path>" must export a class "Sqlite<Name>Store", "Memory<Name>Store" or "<Name>FileStore". Rename the main export to the role of the file.` |
| The file ends with `.routes.ts` and no exported function matches `/^create[A-Z]\w*Routes$/` | Line 1: `File "<path>" must export a function "create<Name>Routes". Rename the main export to the role of the file.` |
| The file ends with `.errors.ts` and no exported class matches `/^[A-Z]\w*Error$/` | Line 1: `File "<path>" must export a class "<Name>Error". Rename the error class to the module.` |
| The file ends with `.errors.ts` and no exported function matches `/^map[A-Z]\w*Error$/` | Line 1: `File "<path>" must export a function "map<Name>Error". Rename the status map to the module.` |
| An exported class ends with `Service` and the file does not end with `.service.ts` | Line of the class: `Class "<name>" ends with "Service", but its file is not a service file. Rename the class, or move it to a "*.service.ts" file.` |
| An exported class ends with `Store` and the file does not end with `.store.ts` | Line of the class: `Class "<name>" ends with "Store", but its file is not a store file. Rename the class, or move it to a "*.store.ts" file.` |

In `.oxlintrc.json`, add `"oxc/no-const-enum": "error"` to `rules`.

- [x] **Step 4: Run the tests and the checks**

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs`
Expected: `# fail 0`.

Run: `corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

Run: `corepack pnpm@11.28.5 lint`
Expected: exit code 0.

- [x] **Step 5: Prove that each test catches a fault**

Remove the `typescript-enum` branch, run the tests, and restore the branch. Then do the same for the branch of the `Service` suffix outside a service file. Then set `ROLE_FILE_MODULES` to `['workspaces']`, run the tests, and set it back to `[]`. Add one line for each fault to the header comment of `tests/check-boundaries.test.mjs`, in the list `Faults caught during mutant verification`.

Expected: each removal makes one or more of the new tests fail.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

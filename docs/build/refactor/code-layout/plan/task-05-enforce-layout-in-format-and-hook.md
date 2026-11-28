# Task 5: Enforce the layout in format and the post-edit hook

Read this file to learn the steps of Task 5, which makes `format`, `format:check` and the post-edit hook run the layout rules.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `scripts/hooks/post-edit.mjs` (the function `runPostEdit`)
- `tests/post-edit-hook.test.mjs` (the helper `workspace`)
- `scripts/format-layout.mjs` (the exports `isLayoutTarget` and `formatLayout`)
- `package.json` (the scripts `format` and `format:check`)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Change: `package.json` (the scripts `format` and `format:check`)
- Change: `scripts/hooks/post-edit.mjs` (the function `runPostEdit`)
- Test: `tests/post-edit-hook.test.mjs`

**Interfaces:**
- Uses: `isLayoutTarget(relativePath) => boolean` and `formatLayout(filePath, sourceText) => ({ text, findings })` from `scripts/format-layout.mjs`. Each finding is `{ line, rule }`.
- Produces: `runPostEdit(input, options) => { exitCode, stderr }` with the same signature. For an existing file where `isLayoutTarget` returns `true` and `formatLayout` returns one or more findings, `exitCode` is `2` and `stderr` has one line for each finding: `<relativePath>:<line> <rule> Add one blank line before this line. Run "node scripts/format-layout.mjs --write <relativePath>".`
- Produces: `"format": "node scripts/format-layout.mjs --write && biome format --write"` and `"format:check": "node scripts/format-layout.mjs --check && biome format"` in `package.json`.

**STOP when:** Task protocol only

**Forbidden:** Do not change the behavior of `runPostEdit` for files where `isDocsTarget` returns `true`.

- [ ] **Step 1: Write the failing tests**

Add these tests to the end of `tests/post-edit-hook.test.mjs`:

```js
const sourceFile = (root, content) => {
  mkdirSync(join(root, 'apps', 'host', 'src'), { recursive: true })
  const file = join(root, 'apps', 'host', 'src', 'a.ts')
  writeFileSync(file, content)
  return file
}

test('blocks an edited source file with a missing blank line', () => {
  const root = workspace()
  const file = sourceFile(root, "import a from 'a'\nexport const b = a\n")
  const result = runPostEdit({ tool_input: { file_path: file } }, { cwd: root })
  assert.equal(result.exitCode, 2)
  assert.equal(
    result.stderr,
    'apps/host/src/a.ts:2 layout-after-imports Add one blank line before this line. Run "node scripts/format-layout.mjs --write apps/host/src/a.ts".\n',
  )
})

test('accepts an edited source file with the expected blank lines', () => {
  const root = workspace()
  const file = sourceFile(root, "import a from 'a'\n\nexport const b = a\n")
  assert.deepEqual(runPostEdit({ tool_input: { file_path: file } }, { cwd: root }), { exitCode: 0, stderr: '' })
})

test('ignores a source file in a build output folder', () => {
  const root = workspace()
  mkdirSync(join(root, 'apps', 'host', 'lib'), { recursive: true })
  const file = join(root, 'apps', 'host', 'lib', 'a.js')
  writeFileSync(file, "import a from 'a'\nexport const b = a\n")
  assert.deepEqual(runPostEdit({ tool_input: { file_path: file } }, { cwd: root }), { exitCode: 0, stderr: '' })
})
```

The file has no header comment. Add one at the start of the file that tells these items:

- The file tests `runPostEdit` of `scripts/hooks/post-edit.mjs`.
- `runPostEdit` runs `check-docs` on an edited document, and the layout rules of `scripts/format-layout.mjs` on an edited source file.
- The environment is a temporary folder with real files for each test.
- The run command is `node --test --test-reporter=tap tests/post-edit-hook.test.mjs`.
- The expected values come from `docs/build/refactor/code-layout/plan/README.md` (Decisions) and from the rule IDs of `scripts/check-docs.mjs`.

- [ ] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/post-edit-hook.test.mjs`
Expected: FAIL. The test `blocks an edited source file with a missing blank line` fails. The other tests pass.

- [ ] **Step 3: Implement the change**

In `runPostEdit`, after the existing check for an existing file, use this table:

| Signal | Action |
| --- | --- |
| `isDocsTarget(relativePath)` returns `true` | Do the existing docs check. |
| `isLayoutTarget(relativePath)` returns `true` | Run `formatLayout(relativePath, <file text>)`. With no finding, return `passed`. Else return the result of the `Interfaces` block. |
| No row matches | Return `passed`. |

In `package.json`, change the scripts `format` and `format:check` to the values in the `Interfaces` block.

- [ ] **Step 4: Run the tests and the checks**

Run: `node --test --test-reporter=tap tests/post-edit-hook.test.mjs tests/format-layout.test.mjs`
Expected: `# fail 0`.

Run: `corepack pnpm@11.28.5 format:check`
Expected: exit code 0. The output contains `format-layout: 0 finding(s)`.

Run: `corepack pnpm@11.28.5 lint`
Expected: exit code 0.

- [ ] **Step 5: Prove that the test catches a fault**

Remove the row `isLayoutTarget` of the table in Step 3 from `runPostEdit`, run `node --test --test-reporter=tap tests/post-edit-hook.test.mjs`, and restore the row.

Expected: the test `blocks an edited source file with a missing blank line` fails. Write the result in the report.

- [ ] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

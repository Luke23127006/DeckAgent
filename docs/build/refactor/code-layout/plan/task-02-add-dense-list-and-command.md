# Task 2: Add the dense body list and the command

Read this file to learn the steps of Task 2, which adds the function `listDenseBodies` and the command line of `scripts/format-layout.mjs`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `scripts/format-layout.mjs` (the functions `isLayoutTarget` and `formatLayout`)
- `tests/format-layout.test.mjs` (the header comment and the imports)
- `scripts/hooks/post-edit.mjs` (the function `main` and the last line, which runs `main` only when the file is the entry point)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Change: `scripts/format-layout.mjs`
- Test: `tests/format-layout.test.mjs`

**Interfaces:**
- Uses: `formatLayout(filePath, sourceText) => ({ text, findings })`. Each finding is `{ line, rule }`.
- Produces: `export const listDenseBodies = (filePath, sourceText) => [{ line, name, statements }]`, sorted by `line`. A dense body is the block body of a function, method, arrow function or accessor. The body has 6 or more direct statements and 12 or more lines from `{` to `}`. It has no blank line between two direct statements. Measure the gap between two statements as in `formatLayout`. `line` is the 1-based start line of the function node. `name` is the name of the declaration, the name of the variable that holds an arrow function or function expression, or `<anonymous>`. `statements` is the number of direct statements.
- Produces: the command `node scripts/format-layout.mjs <--check|--write|--dense> [path ...]`. Without a path, it reads `apps`, `packages`, `scripts` and `tests`. A path is a file or a folder. For a folder, the command reads each file under it with the extension `.ts`, `.tsx`, `.js`, `.mjs` or `.cjs`. It skips files that end with `.d.ts`, and folders with the name `node_modules`, `lib`, `dist` or `coverage`. It prints paths relative to the current folder, with `/`.

**STOP when:** Task protocol only

**Forbidden:** Do not change `formatLayout` or `isLayoutTarget`.

- [ ] **Step 1: Write the failing tests**

In `tests/format-layout.test.mjs`, change the import from `../scripts/format-layout.mjs` to `import { formatLayout, isLayoutTarget, listDenseBodies } from '../scripts/format-layout.mjs'`, and add these imports:

```js
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
```

Add these tests at the end of the file:

```js
test('listDenseBodies lists bodies with 6 statements, 12 lines and no blank line', () => {
  const body = ['  const b = a + 1', '  const c = b + 1', '  if (c > 10) {', '    return c', '  }', '  const d = c * 2']
  body.push('  const e = d * 2', '  const f = e * 2', '  const g = f * 2', '  return g', '}')
  const short = ['function short(a: number) {', '  const b = a', '  const c = b', '  const d = c', '  const e = d']
  short.push('  const f = e', '  return f', '}')
  const source = [
    'export function dense(a: number) {',
    ...body,
    '',
    'export function spaced(a: number) {',
    ...body.slice(0, 5),
    '',
    ...body.slice(5),
    '',
    'export const denseArrow = (a: number) => {',
    ...body,
    '',
    ...short,
    '',
  ].join('\n')
  assert.deepEqual(listDenseBodies('apps/host/src/sample.ts', source), [
    { line: 1, name: 'dense', statements: 8 },
    { line: 28, name: 'denseArrow', statements: 8 },
  ])
})

test('the command checks, writes and lists files in a folder', () => {
  const root = mkdtempSync(join(tmpdir(), 'format-layout-'))
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'src', 'a.ts'), "import a from 'a'\nexport const b = a\n")
  const script = resolve('scripts/format-layout.mjs')
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' })

  const before = run('--check', 'src')
  assert.equal(before.status, 1)
  assert.equal(
    before.stdout,
    'src/a.ts:2 layout-after-imports Add one blank line before this line.\nformat-layout: 1 finding(s)\n',
  )

  const write = run('--write', 'src')
  assert.equal(write.status, 0)
  assert.equal(write.stdout, 'format-layout: 1 file(s) changed\n')
  assert.equal(readFileSync(join(root, 'src', 'a.ts'), 'utf8'), "import a from 'a'\n\nexport const b = a\n")

  assert.equal(run('--check', 'src').status, 0)
  assert.equal(run('--dense', 'src').stdout, 'format-layout: 0 dense function bodies\n')
  assert.equal(run('--fix').status, 2)
})
```

Add to the header comment: the file also tests the dense body list and the command, and the command test uses a temporary folder.

- [ ] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/format-layout.test.mjs`
Expected: FAIL. The output contains `listDenseBodies`.

- [ ] **Step 3: Implement `listDenseBodies` and the command**

The command prints these lines:

| Mode | Line for each item | Last line | Exit code |
| --- | --- | --- | --- |
| `--check` | `<path>:<line> <rule> Add one blank line before this line.` | `format-layout: <n> finding(s)` | 1 when `<n>` is more than 0, else 0 |
| `--write` | none | `format-layout: <n> file(s) changed` | 0 |
| `--dense` | `<path>:<line> <name> <statements> statements` | `format-layout: <n> dense function bodies` | 0 |
| Other value | none. Print `format-layout: use --check, --write or --dense.` to stderr | none | 2 |

The command runs only when `process.argv[1]` is the script file, as in `scripts/hooks/post-edit.mjs`.

- [ ] **Step 4: Run the tests and the checks**

Run: `corepack pnpm@11.28.5 exec biome format --write scripts/format-layout.mjs tests/format-layout.test.mjs`
Expected: exit code 0.

Run: `node scripts/format-layout.mjs --check scripts/format-layout.mjs tests/format-layout.test.mjs`
Expected: exit code 0 and `format-layout: 0 finding(s)`.

Run: `node --test --test-reporter=tap tests/format-layout.test.mjs`
Expected: `# fail 0`.

Run: `corepack pnpm@11.28.5 lint`
Expected: exit code 0.

- [ ] **Step 5: Prove that the tests catch a fault**

Do each change, run `node --test --test-reporter=tap tests/format-layout.test.mjs`, and undo the change:

1. In `listDenseBodies`, remove the check for a blank line between direct statements.
2. In `--check`, always exit with code 0.

Expected: each change makes one or more tests fail. Add one line for each change to the list `Faults caught during mutant verification` in the header comment of `tests/format-layout.test.mjs`.

- [ ] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

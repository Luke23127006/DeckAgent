# Task 10: Fix the other findings of oxlint

Read this file to learn the steps of Task 10, which fixes the 11 findings of oxlint that remain after Task 9.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`

**Files:**
- Change: `packages/client/runtime/src/settings-panel.ts` (line 477)
- Change: `packages/client/runtime/src/motion.ts` (line 339)
- Change: `packages/client/runtime/src/boot.ts` (lines 573-595)
- Change: `tests/design-catalog.test.mjs` (lines 21, 22, 27 and 30)
- Change: `tests/browser-smoke.test.mjs` (lines 752-754)
- Change: `tests/browser-runtime.test.mjs` (lines 116-117)
- Change: `tests/web-management.test.mjs` (line 136)

**Interfaces:**
- Uses: nothing.
- Produces: nothing. The behavior of the code does not change. The test `tests/browser-smoke.test.mjs` adds the original error as the `cause` of the new error.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit tool does not find the `old` text of an edit. Do not try another text.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Delete or change a comment. The comment in `tests/browser-runtime.test.mjs` stays.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Record the test baseline**

Run: `node --test --test-reporter=tap tests/design-catalog.test.mjs tests/browser-runtime.test.mjs tests/web-management.test.mjs > /tmp/refactor-01/tests-before-task-10.txt 2>&1; grep -E '^# (pass|fail)' /tmp/refactor-01/tests-before-task-10.txt`
Expected: two lines, `# pass <P>` and `# fail <F>`. Write down P and F. Step 4 compares with them.

- [x] **Step 2: Make the edits**

Make each edit with the edit tool. Each `old` text occurs one time in its file. Each `new` text replaces the `old` text.

Edit 1. File `packages/client/runtime/src/settings-panel.ts`.

Old:

```text
  for (const label of [...connection.querySelectorAll('label')])
```

New:

```text
  for (const label of connection.querySelectorAll('label'))
```

Edit 2. File `packages/client/runtime/src/motion.ts`.

Old:

```text
    else for (const node of fresh) node.matches('.message.user') ? fly(root, node) : pop(node)
```

New:

```text
    else
      for (const node of fresh) {
        if (node.matches('.message.user')) fly(root, node)
        else pop(node)
      }
```

Edit 3. File `packages/client/runtime/src/boot.ts`. The function `follow` has a line `let pendingApproval: ApprovalView | null = null`. Add the function `isCurrent` after it.

Old:

```text
  let pendingApproval: ApprovalView | null = null
```

New:

```text
  let pendingApproval: ApprovalView | null = null
  const isCurrent = () => generation === expected
```

Edit 4. File `packages/client/runtime/src/boot.ts`.

Old:

```text
  while (!control.signal.aborted && generation === expected && isActive(state)) {
```

New:

```text
  while (!control.signal.aborted && isCurrent() && isActive(state)) {
```

Edit 5. File `tests/design-catalog.test.mjs`.

Old:

```text
      [{ kind: 'columns', columns: Array(2).fill({ bullets: Array(3).fill('b'.repeat(120)) }) }],
```

New:

```text
      [{ kind: 'columns', columns: Array.from({ length: 2 }, () => ({ bullets: Array(3).fill('b'.repeat(120)) })) }],
```

Edit 6. File `tests/design-catalog.test.mjs`.

Old:

```text
      [{ kind: 'columns', columns: Array(3).fill({ bullets: ['b'] }) }],
```

New:

```text
      [{ kind: 'columns', columns: Array.from({ length: 3 }, () => ({ bullets: ['b'] })) }],
```

Edit 7. File `tests/design-catalog.test.mjs`.

Old:

```text
        { kind: 'metrics', items: Array(3).fill({ value: 'v'.repeat(24), label: 'l'.repeat(80) }) },
```

New:

```text
        { kind: 'metrics', items: Array.from({ length: 3 }, () => ({ value: 'v'.repeat(24), label: 'l'.repeat(80) })) },
```

Edit 8. File `tests/design-catalog.test.mjs`.

Old:

```text
      [{ kind: 'metrics', items: Array(4).fill({ value: '1', label: 'label' }) }],
```

New:

```text
      [{ kind: 'metrics', items: Array.from({ length: 4 }, () => ({ value: '1', label: 'label' })) }],
```

Edit 9. File `tests/browser-smoke.test.mjs`. The line is the argument of `throw new Error(` in the `catch (error)` block. Add the `cause` option after it.

Old:

```text
      `${error.message}: ${await evaluate(`JSON.stringify({status:document.querySelector('.request-status')?.textContent,progress:document.querySelector('.deck-progress')?.textContent})`)}`,
```

New:

```text
      `${error.message}: ${await evaluate(`JSON.stringify({status:document.querySelector('.request-status')?.textContent,progress:document.querySelector('.deck-progress')?.textContent})`)}`,
      { cause: error },
```

Edit 10. File `tests/browser-runtime.test.mjs`.

Old:

```text
    for await (const _value of client.watch('malformed')) {
      /* Invalid wire data must reject before yielding. */
```

New:

```text
    for await (const value of client.watch('malformed')) {
      /* Invalid wire data must reject before yielding. */
      assert.fail(`Yielded before rejecting: ${JSON.stringify(value)}`)
```

Edit 11. File `tests/web-management.test.mjs`.

Old:

```text
    if (req.url === '/models' && /^Bearer fixture-key-/.test(req.headers.authorization ?? '')) {
```

New:

```text
    if (req.url === '/models' && (req.headers.authorization ?? '').startsWith('Bearer fixture-key-')) {
```

Expected: each edit reports success.

- [x] **Step 3: Check the result with oxlint and with the build**

Run: `corepack pnpm@11.28.5 run lint:oxlint > /tmp/refactor-01/lint-after-task-10.txt 2>&1; echo "exit=$?"; grep -c 'problems' /tmp/refactor-01/lint-after-task-10.txt`
Expected: the output is `exit=0`, then `0`.

Run: `corepack pnpm@11.28.5 run build; echo "exit=$?"`
Expected: the last line is `exit=0`.

- [x] **Step 4: Compare the tests with the baseline**

Run: `node --test --test-reporter=tap tests/design-catalog.test.mjs tests/browser-runtime.test.mjs tests/web-management.test.mjs > /tmp/refactor-01/tests-after-task-10.txt 2>&1; grep -E '^# (pass|fail)' /tmp/refactor-01/tests-after-task-10.txt`
Expected: the same P and F as in Step 1.

- [x] **Step 5: Report and stop**

Send this report:
- Files changed.
- The output of Step 3 and Step 4, and the numbers P and F of Step 1.
- What the commands do not prove: the build and the tests do not prove the behavior of `motion.ts`, `boot.ts` and `settings-panel.ts` in a browser. `tests/browser-smoke.test.mjs` covers them, and it needs a browser. The edit of `tests/browser-smoke.test.mjs` is not run.

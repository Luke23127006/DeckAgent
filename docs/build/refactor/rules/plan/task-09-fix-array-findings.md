# Task 9: Fix the array findings of oxlint

Read this file to learn the steps of Task 9, which replaces `sort` and `reverse` with `toSorted` and `toReversed` at 21 places.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`

**Files:**
- Change: `packages/presentation/html/src/index.ts` (line 125)
- Change: `apps/local-web/src/commons-images.ts` (line 178)
- Change: `packages/client/runtime/src/conversation-view.ts` (line 156)
- Change: `packages/presentation/deck/src/bound-outline.ts` (line 117)
- Change: `packages/tools/filesystem/src/attachment-extraction.ts` (line 90)
- Change: `scripts/build-workspace.mjs` (lines 42 and 54)
- Change: `scripts/check-no-comments.mjs` (lines 23 and 71)
- Change: `scripts/check-docs.mjs` (line 149)
- Change: `tests/opencode-generation-live.test.mjs` (lines 192 and 204)
- Change: `tests/local-foundation.test.mjs` (line 15)
- Change: `tests/workspace-registry.test.mjs` (line 15)
- Change: `tests/browser-smoke.test.mjs` (line 1648)
- Change: `tests/fixtures/fake-opencode.mjs` (line 61)
- Change: `tests/fixtures/b02-helpers.mjs` (line 89)
- Change: `tests/bound-outline.test.mjs` (line 133)
- Change: `tests/opencode-live.test.mjs` (line 51)
- Change: `tests/opencode-source-live.test.mjs` (line 178)
- Change: `tests/model-requests.test.mjs` (line 16)

**Interfaces:**
- Uses: nothing.
- Produces: nothing. The behavior of the code does not change.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- A line that Step 2 changes does not contain the text that Step 2 expects.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Delete or change a comment. A line that has a comment keeps the comment.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Record the test baseline**

Run: `node --test --test-reporter=tap tests/local-foundation.test.mjs tests/workspace-registry.test.mjs tests/model-requests.test.mjs tests/bound-outline.test.mjs tests/check-docs.test.mjs tests/check-no-comments.test.mjs > /tmp/refactor-01/tests-before-task-09.txt 2>&1; grep -E '^# (pass|fail)' /tmp/refactor-01/tests-before-task-09.txt`
Expected: two lines, `# pass <P>` and `# fail <F>`. Write down P and F. Step 4 compares with them.

- [x] **Step 2: Replace the method names**

Each pair below is `<file> <line>`. The method on that line is `sort` for the first group and `reverse` for the second group. Each replacement keeps the number of lines of the file.

Run:

```bash
replace() {
  file="$1"; line="$2"; from="$3"; to="$4"
  grep -q "$from" <(sed -n "${line}p" "$file") || { echo "MISSING $file:$line"; return 1; }
  sed -i "${line}s/${from}/${to}/" "$file"
}
while read -r file line; do replace "$file" "$line" '\.sort(' '.toSorted(' || break; done <<'EOF'
packages/presentation/html/src/index.ts 125
apps/local-web/src/commons-images.ts 178
packages/client/runtime/src/conversation-view.ts 156
packages/presentation/deck/src/bound-outline.ts 117
scripts/build-workspace.mjs 42
scripts/build-workspace.mjs 54
scripts/check-no-comments.mjs 23
scripts/check-no-comments.mjs 71
scripts/check-docs.mjs 149
tests/opencode-generation-live.test.mjs 192
tests/opencode-generation-live.test.mjs 204
tests/local-foundation.test.mjs 15
tests/workspace-registry.test.mjs 15
tests/browser-smoke.test.mjs 1648
tests/fixtures/fake-opencode.mjs 61
tests/fixtures/b02-helpers.mjs 89
EOF
while read -r file line; do replace "$file" "$line" '\.reverse()' '.toReversed()' || break; done <<'EOF'
packages/tools/filesystem/src/attachment-extraction.ts 90
tests/bound-outline.test.mjs 133
tests/opencode-live.test.mjs 51
tests/opencode-source-live.test.mjs 178
tests/model-requests.test.mjs 16
EOF
echo done
```

Expected: the last line is `done`. The output has no line that starts with `MISSING`.

- [x] **Step 3: Check the result with oxlint and with the type checker**

Run: `corepack pnpm@11.28.5 run lint:oxlint 2>&1 | grep -cE 'no-array-sort|no-array-reverse'`
Expected: the output is `0`.

Run: `corepack pnpm@11.28.5 run lint:oxlint 2>&1 | tail -n 3`
Expected: the output contains the line `11 problems`.

Run: `corepack pnpm@11.28.5 run build; echo "exit=$?"`
Expected: the last line is `exit=0`.

- [x] **Step 4: Compare the tests with the baseline**

Run: `node --test --test-reporter=tap tests/local-foundation.test.mjs tests/workspace-registry.test.mjs tests/model-requests.test.mjs tests/bound-outline.test.mjs tests/check-docs.test.mjs tests/check-no-comments.test.mjs > /tmp/refactor-01/tests-after-task-09.txt 2>&1; grep -E '^# (pass|fail)' /tmp/refactor-01/tests-after-task-09.txt`
Expected: the same P and F as in Step 1.

- [x] **Step 5: Report and stop**

Send this report:
- Files changed.
- The output of Step 3 and Step 4, and the numbers P and F of Step 1.
- Items that need a person: any `.toSorted(` or `.toReversed(` call that oxlint reports as a new problem in Step 3.
- What the commands do not prove: the tests that run offline do not cover `tests/opencode-live.test.mjs`, `tests/opencode-source-live.test.mjs`, `tests/opencode-generation-live.test.mjs` and `tests/browser-smoke.test.mjs`. These tests need a network or a browser. The build covers only the type check of the changed files in `apps/` and `packages/`.

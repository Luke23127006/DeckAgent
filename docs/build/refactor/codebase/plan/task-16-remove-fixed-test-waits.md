# Task 16: Remove constant waits from the request tests

Read this file to learn the steps that remove constant waits from the request tests.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `e2e/request-lifecycle.test.mjs (the silent-runtime Stop test)`.
- `apps/web/tests/fixtures/b02-helpers.mjs (waitFor)`.
- `e2e/attachment-admission.test.mjs (upload preparation polling)`.
- `packages/host/api/src/request-controller.ts (stop and run)`.
- `docs/UCs/quality-attributes.md (Stop scenario)`.
- `.agents/skills/tdd/SKILL.md`.

**Files:**

- Change: e2e/request-lifecycle.test.mjs, in the silent-runtime Stop test only.
- Change: e2e/attachment-admission.test.mjs, in upload preparation polling only.
- Create: apps/web/tests/fixtures/wait-for.mjs.
- Create: apps/web/tests/wait-for.test.mjs.
- Change: apps/web/tests/fixtures/b02-helpers.mjs, for the waitFor implementation and export only.
- Change: package.json, to add the new fixture test to test:model-requests.
- Transient fault only: packages/host/api/src/request-controller.ts. Restore its original bytes before the task finishes.

**Interfaces:**

- Produces: waitFor(check: () => unknown | Promise<unknown>, timeoutMs?: number): Promise<unknown>.
- Preserves waitFor's default timeout of 10000 ms from the existing fixture. This is a test watchdog, not a product timeout.
- Uses setImmediate from node:timers/promises only to yield between condition checks.
- The Stop test uses explicit reached and release promises. It contains no delay that simulates provider progress.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- The task would substitute a fake clock for a real network or browser measurement.
- Removing a wait requires changing the production timing contract.
- A test can finish without reaching its simulated late write.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Add the complete condition-wait tests**

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { waitFor } from './fixtures/wait-for.mjs'

test('waitFor returns the value that satisfies the condition', async () => {
  const values = [undefined, undefined, { state: 'ready' }]
  let calls = 0
  const value = await waitFor(() => {
    calls++
    return values.shift()
  })
  assert.deepEqual(value, { state: 'ready' })
  assert.equal(calls, 3)
})

test('waitFor propagates condition errors', async () => {
  await assert.rejects(waitFor(() => {
    throw new Error('fixture-read-failed')
  }), { message: 'fixture-read-failed' })
})
```

Run `node --test --test-reporter=tap apps/web/tests/wait-for.test.mjs`.
Expected: FAIL because `fixtures/wait-for.mjs` does not exist.

- [ ] **Step 2: Implement the condition wait**

Implement the declared signature.
Return the first truthy condition result.
Propagate a condition error.
Use a timeout watchdog with the existing `Timed out waiting` error.
Yield with setImmediate between condition checks.
Always release the watchdog resource when the wait finishes.

- [ ] **Step 3: Replace the silent-runtime delay**

Replace the runtime's fixed 300 ms wait with a release promise.
Resolve a reached promise after the first persisted text event.
Wait for reached before calling Stop.
Check the saved stopped status before releasing the simulated runtime.
Release the runtime, then assert that the late write returns `refused`.
Keep the new-request and retained-text assertions.
Keep a real elapsed-time assertion for the user-visible Stop requirement.
Do not represent a fake-clock result as an end-to-end latency measurement.

- [ ] **Step 4: Replace attachment polling delays**

Replace the fixed 30 ms polling loop with waitFor.
The condition reads the attachment endpoint and returns only a settled attachment.
Assert `state === 'ready'` after the condition returns.
Keep rejection cases and draft-preservation assertions unchanged.

- [ ] **Step 5: Prove the tests detect the intended faults**

Run the Stop test once with late-write rejection temporarily removed.
Expected: FAIL on the late-write assertion.
Restore production code before the next command.
Record the fault and failure in the required test header.
Do not change an expected value to simulate the fault.

Run `node --test --test-reporter=tap apps/web/tests/wait-for.test.mjs e2e/request-lifecycle.test.mjs e2e/attachment-admission.test.mjs`.
Expected: `# fail 0`.
Report other constant waits without changing them in this task.
Broader timing cleanup belongs to the next revision.

- [ ] **Final step: Report and stop**

Send this report in the conversation:

- Files changed, including moves.
- Commands run, exit codes, and the last 20 output lines.
- Test and skip counts.
- Items that a decision table sends to the report.
- Existing failures and unresolved decisions.
- What the commands do not prove.

Mark steps complete only after their Expected results occur.
Do not start another task until the task owner accepts this report.

## References

1. <a id="ref-1"></a>[Project Structure](../../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Coding Guidelines](../../../../conventions/code.md)
3. <a id="ref-3"></a>[Testware](../../../../conventions/testware.md)

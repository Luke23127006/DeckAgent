---
id: DEC-013
title: "Which runner the acceptance tests use: Vitest or the Node test runner"
date: 09-11-2026
status: decided
research: "Found when the test-stub tickets of the first build were written; dev/mvp/research/open-design-earlier-work.md item 13"
affects: "every CI-tier acceptance test; dev/development/test-strategy.md \"Test infrastructure rules\""
---

## Question

The testing plan, the test strategy and the workflow write each CI-tier test **before implementation** as an **expected failure** (`it.fails`): CI **stays green while the test fails** and **turns red if it passes unexpectedly**. `it.fails` is a feature of **Vitest**. The repository has **no Vitest**: the legacy tests run on **`node --test`**, which has **no expected failure**. **Which runner** do the acceptance tests use?

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · Vitest | Add Vitest **at a pinned version**, a `test:acceptance` script and a config for `tests/acceptance/`, in **its own ticket** that blocks every test ticket | The approved test strategy, WORKFLOW Phase 2 and the testing plan as written | **One new dev dependency**; `it.fails` **turns red on an unexpected pass** with no code of ours; open-design uses Vitest |
| B · `node --test` | Keep the **built-in runner** and write a **wrapper** that inverts a test's result | No new dependency | The strategy, WORKFLOW, template and plan **must change**; a home-made wrapper can **get the unexpected pass wrong**, the one case that matters |
| C · Decide in Phase 3 | Create the test-stub tickets now and **choose the runner later** | — | **No test ticket can run its test command** until then |

## Choice

**A · Vitest**, at a **pinned version**, set up by **ticket T0c**, which **blocks every other test-stub ticket** of the first build.

## Why

The PO took the **recommendation as shown**: Vitest **matches every approved document**, and its `it.fails` gives the **expected failure** the workflow needs **without code of our own**.

## Rejected options and why

- **B · `node --test`:** needs a **home-made inversion** of test results and a **change to four approved documents**.
- **C · Decide in Phase 3:** **blocks all test-stub work** while the gate of Phase 2 waits on it.

## Consequences

- **T0c** adds Vitest `4.1.12` to the root `package.json`, a **`test:acceptance` script**, and **`vitest.config.ts`** for `tests/acceptance/`.
- The **CI step** that runs `test:acceptance` stays **a separate change the PO approves**.
- Unit and integration tests of the MVP **may use the same runner**; the **implementation plan** settles it.

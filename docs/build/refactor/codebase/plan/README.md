# Codebase Refactor Implementation Plan

Read this file to learn the scope, task order, constraints, baseline, and verification gates for the DeckAgent codebase refactor.

> **For executors:** Execute one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints and the selected task file. Complete its steps in order. Mark each completed step `- [x]`. Report the result and stop. Start another task only after the task owner accepts the report.

**Goal:** Move current code toward the ownership and dependency rules without changing user-visible behavior.

**Approach:** Wave 0 installs the safety net and records the baseline before any production file moves. Waves 1 through 7 separate contracts first and move code and tests in small steps while preserving durable records, permissions, event order, and publication authority. Waves 8 and 9 extend and enable strict boundary enforcement in CI and check the structural refactor.

**Tech stack:** Windows, Node.js 22.19.0, pnpm 11.28.5 (`corepack pnpm@11.28.5`), TypeScript 6.0.3, tsdown, oxlint 1.94.0, Biome, and node:test.

**Spec:** Target ownership comes from Project Structure [[1]](#ref-1). Implementation rules come from Coding Guidelines [[2]](#ref-2) and Testware [[3]](#ref-3). Product behavior comes from Use Cases [[4]](#ref-4).

## Scope

This folder contains staged execution tasks. Each task is a separate change set, not one step in a single large patch.
Wave 0 builds the static checks and records the baseline first so every later wave can track violations with `check:boundaries:report`.
The task order below prevents a directory move from hiding a contract change.

| Wave | Result | Tasks | Status / Entry gate |
| --- | --- | --- | --- |
| 0. Safety net and baseline | Comment policy aligned, oxlint import/TS checks active, `check-boundaries.mjs` in report mode, 16-suite baseline recorded | 01–04 | Completed locally |
| 1. Contracts | Browser-safe wire data and a Session-owned persistence interface | 05–06 | Wave 0 complete |
| 2. Lifecycle | Request operation errors remain independent of HTTP | 07 | Wave 1 accepted |
| 3. Application | Local Host and Browser belong to `apps/web` | 08–09 | Wave 2 accepted |
| 4. Workflows | Startup assembles application-owned operations and integrations | 10–11 | Wave 3 accepted |
| 5. Runtime and Deck | Narrow runtime persistence access and explicit format injection | 12–13 | Wave 4 accepted |
| 6. Browser | Transport and UI features have separate owners | 14 | Wave 5 accepted |
| 7. Tests | Tests follow behavior ownership and key waits use conditions | 15–16 | Wave 6 accepted |
| 8. Enforcement | Strict boundary checks reject all migrated violations in CI | 17 | Wave 7 accepted |
| 9. Verification | Regression evidence and explicit remaining work | 18 | Wave 8 accepted |

## Decisions

Project Structure defines the ownership rules [[1]](#ref-1).
The planning agent records the approved implementation choices below.
The task owner can revise those choices before execution.
An executor must not select another design during a task.

| Topic | Decision |
| --- | --- |
| Workstream | This revision is `refactor/codebase`. It does not add deck-editing, reasoning, or custom-design-system behavior. |
| Comment policy | `docs/conventions/code.md` replaces the `No comments in code` decision in `docs/build/refactor/rules/plan/README.md`. Developers write comments only for the five reasons in `docs/conventions/code.md`. Lint-disable directives and TypeScript suppression comments (`@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`) remain forbidden. |
| Boundary enforcement tools | Use `oxlint` (`eslint/no-restricted-imports`, `typescript/ban-ts-comment`, `typescript/no-explicit-any`) and `scripts/check-boundaries.mjs` built on the installed TypeScript compiler API. Do not install `dependency-cruiser`. |
| Enforcement rollout | Tasks 01–03 install oxlint checks that pass today and `scripts/check-boundaries.mjs` with `--report` mode. Task 17 extends the checker for Browser features and integrations and removes `tsconfig.base.json` source aliases. It also enables strict `check:boundaries` in CI and updates the Enforcement table in Project Structure [[1]](#ref-1). |
| Untracked legacy directories | Five directories on disk (`apps/agent-runtime`, `packages/agent/runtime`, `packages/llm/providers`, `packages/testing/cordis-fixture`, `packages/tools/presentation`) contain only ignored build and dependency files. `scripts/check-boundaries.mjs` reads file lists from `git ls-files --cached --others --exclude-standard`, so tracked and new non-ignored files enter analysis while ignored files in those five folders do not. |
| Application directory | Move `apps/local-web` to `apps/web`. Keep the package name `@deckagent/local-web` during this revision. |
| Browser ownership | Move `packages/client/runtime` into `apps/web/src/browser`. Compile Node and Browser with separate TypeScript projects. Keep Host-served HTML/CSS string modules (`ui-assets.ts`, `*-style.ts`, `sample-slides.ts`) at `apps/web/src/`. |
| Wire package | Create `@deckagent/host-contracts`. Publish safe DTOs and boundary validators only. |
| Representation | Preserve domain and persistence types in their owners. Wire DTOs preserve current payload fields. Add no identity mapper. |
| Persistence | Session owns the `RequestStore` contract. Lifecycle uses public operations, not a SQLite handle. |
| Lifecycle | Keep `RequestController` and its authority. Move its HTTP status mapping into transport. |
| Workflow placement | Application features own orchestration. Integrations own external HTTP clients, credentials, rendering, and OpenCode process lifecycle. Entry point owns startup, shutdown, configuration, and dependency construction. |
| Integration | OpenCode owns protocol and process lifecycle. A runtime result does not write request terminal status. |
| Format | Deck uses `FormatAdapter` contracts. Startup registers the concrete HTML adapter. Preserve the legacy publication path through explicit policy injection. |
| Data | Keep existing database versions, event payloads, revision records, receipt identities, and template-version pins. |
| Test movement | Move tests by the behavior they assert. Keep mixed application/domain files in `e2e` during this revision. |
| Test changes | Mechanical moves keep assertions unchanged. Task 16 changes only the named condition waits and Stop synchronization. Full Testware rewrites belong to the next revision. |
| Dependencies | Add workspace dependencies and reuse locked `zod` 4.6.7. Add no external package or version. |
| Compatibility | Update every current consumer in the same task. Do not leave redirect directories, source aliases, or broad export bridges. |

## Global Constraints

- Run commands from the repository root in Git Bash on Windows.
- Use Node.js 22.19.0, the CI version.
- Use `corepack pnpm@11.28.5`. Do not install a different Node or package-manager version.
- On Windows, run `install --offline` and `build` outside the sandbox when `EPERM` blocks writes to `lib/`.
- On Windows, run `test:attachments` and `test:model-requests` outside the sandbox when `EPERM` or `EBUSY` blocks or hangs them.
- Preserve another person's changes. Never reset, clean, or overwrite unrelated work.
- Do not commit, push, publish, or call a real provider.
- Do not read the user's real application data, credentials, or `.env` values.
- Use temporary fixture directories for runtime tests.
- Do not add a product limit, timeout policy, source permission, or new retry rule.
- Preserve request admission, cancellation, terminal-status, and persist-before-publish ordering.
- Preserve one active request per chat and one issued grant per authorized generation operation.
- Preserve transaction boundaries. Separate databases and filesystems do not share a transaction.
- Preserve stored schemas, immutable revisions, publication receipts, and pinned template versions.
- Keep model output separate from permission and publication authority.
- Import another package only through `package.json` exports.
- Keep Node-only code outside Browser and wire contracts.
- Do not create `shared`, `common`, `utils`, or `errors` folders to bypass ownership.
- Use public owner operations. Never pass a private database handle between owners.
- Do not add classes, wrappers, repositories, or interfaces without a real consumer or protected boundary.
- Follow Coding Guidelines for comments. Follow Testware for required test headers.
- Do not add lint suppressions, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or assertions that bypass a type error.
- Do not remove, skip, weaken, or retarget a test to make the refactor pass.
- Keep test inputs and expected values independent of production constants.
- Use fake runtime and HTTP boundaries. Do not replace an application module with a mock.
- Keep suites sequential when their fixtures can share mutable state.
- Keep English plan text and tool-printed messages within the `asd-ste100` structural rules.
- Keep current user-facing Vietnamese messages unchanged during structural tasks.
- Do not edit `docs/00-old`, historical plans, product rules, open-question decisions, or skills.
- Change only the files listed in the task. Brace lists in Files expand to the named basenames.
- A source placement table expands to its source and destination paths.
- Earlier accepted tasks can change line numbers. Find the same named symbol at its planned destination.
- Stop when a named signature or source body differs beyond the predecessor changes described here.
- Build and lint pass only with exit code 0.
- Test commands must print `# fail 0`, except for the recorded baseline failure in [Wave 0 Baseline](#wave-0-baseline).
- An absence search passes with exit code 1 and no matches. Other search errors are failures.
- Report a pre-existing baseline failure separately. Do not fix an unrelated product defect during a structural move.
- Stop after two failures of the same step.
- Report test skips explicitly. A skip is not passing evidence.
- An approved refactor task does not authorize implementation of a deferred feature.

These constraints apply project rules [[1]](#ref-1) [[2]](#ref-2) [[3]](#ref-3).

## Wave 0 Baseline

Tasks 01 through 04 installed the static safety net and recorded this baseline before any production move:

| Check | Result |
| --- | --- |
| `corepack pnpm@11.28.5 build` | PASS (exit 0) |
| `corepack pnpm@11.28.5 lint` | PASS (exit 0, 193 files, 128 rules, 0 diagnostics) |
| `corepack pnpm@11.28.5 check:docs` | PASS (exit 0, 0 errors) |
| `tests/oxlint-boundaries.test.mjs` | PASS (12/12) |
| `tests/check-boundaries.test.mjs` | PASS (16/16) |
| `corepack pnpm@11.28.5 check:boundaries:report` | 153 violations: `private-package-import` 117, `browser-node-import` 33, `lifecycle-transport-import` 2, `deck-concrete-adapter` 1, all other 8 rules 0 |

Per-suite non-live CI baseline recorded in Task 04:

| Suite | Tests | Pass | Fail | Skip | Notes |
| --- | --- | --- | --- | --- | --- |
| `test:session-persistence` | 7 | 7 | 0 | 0 | PASS |
| `test:tools-browser` | 10 | 10 | 0 | 0 | PASS |
| `test:env-startup` | 2 | 2 | 0 | 0 | PASS |
| `test:local-web` | 8 | 8 | 0 | 0 | PASS |
| `test:local-foundation` | 42 | 42 | 0 | 0 | PASS |
| `test:model-requests` | 26 | 26 | 0 | 0 | PASS |
| `test:opencode-resources` | 3 | 3 | 0 | 0 | PASS |
| `test:source-permissions` | 11 | 11 | 0 | 0 | PASS |
| `test:attachments` | 29 | 29 | 0 | 0 | PASS |
| `test:research` | 5 | 5 | 0 | 0 | PASS |
| `test:slide-pipeline` | 7 | 7 | 0 | 0 | PASS |
| `test:outline-workflow` | 6 | 6 | 0 | 0 | PASS |
| `test:brief-foundation` | 15 | 15 | 0 | 0 | PASS |
| `test:deck-review` | 21 | 21 | 0 | 0 | PASS |
| `test:generation-publication` | 69 | 68 | 1 | 0 | Reproducible failure: `portable-generation-http.test.mjs` #60 `REQUEST_TIMEOUT` (48-53 s, 2/2 runs). First run also had 2 flaky 5 s timeouts in `image-research.test.mjs` #46-#47 (passed on rerun). |
| `test:browser-smoke` | 13 | 13 | 0 | 0 | PASS |

`test:layouts` (10 tests) and `test:images` are convenience subsets of files already counted in `test:deck-review` and `test:generation-publication`.

Do not fix the pre-existing `portable-generation-http.test.mjs` failure during this structural refactor.
Report it separately whenever a task runs `test:generation-publication` or `test:images`.
Stop immediately if any other test fails or if a suite count drops.

## Compatibility checkpoints

The request contract requires Host work to survive Browser disconnection [[5]](#ref-5).
The Deck contract preserves completed slides after failure [[6]](#ref-6).
These behaviors remain review gates during every move.

| Boundary | Preserve |
| --- | --- |
| Browser to Host | Localhost routes, token checks, payloads, SSE sequence and reconnect cursor |
| Host to runtime | Frozen provider snapshot, abort signal, bounded tools, no terminal-status authority |
| Lifecycle to Session | Atomic admission, durable events, approval records, one terminal transition |
| Workflow to Workspace | No project-file writes, folder identity checks, active-request guards |
| Workflow to Deck | Bound Brief/Outline binding, issued grants, retained completed slides |
| Deck to format | Explicit adapter, source validation, render check, cancellation before commit |
| Startup recovery | Interrupted requests, incomplete generation, workspace ungroup reconciliation, no automatic replay |

## Review Focus

1. An `oxlint` override on browser files enforces private-subpath and `node:*` / `node:*/*` bans together. Test: [Task 02](task-02-oxlint-import-rules.md).
2. `check-boundaries.mjs` ignores imports inside comments and strings, detects dynamic private imports, checks `tsconfig.base.json` aliases, and finds indirect cycles. Test: [Task 03](task-03-boundary-checker.md) and [Task 17](task-17-enforce-dependency-boundaries.md).
3. A stopped request rejects late output. Preserve the Stop regression in [Lifecycle errors](task-07-separate-lifecycle-errors.md). Synchronize its fault in [condition waits](task-16-remove-fixed-test-waits.md).
4. A Browser reconnect cannot create another request. Preserve the transport regressions in [wire contracts](task-05-extract-wire-contracts.md) and [Browser consolidation](task-09-consolidate-browser.md).
5. A workspace removal cannot hide saved chats after interruption. Preserve local-foundation tests in [workspace workflows](task-10-extract-chat-workspace-workflows.md).
6. A forged grant or repeated publication cannot replace an unrelated revision. Preserve publication tests in [format independence](task-13-decouple-deck-formats.md).
7. A moved test must still run and detect its fault. Compare counts in [test movement](task-15-move-tests-to-owners.md). Run negative fixtures in [dependency checks](task-17-enforce-dependency-boundaries.md).

These are preservation risks, not claims that the current tests prove every requirement.
Each relevant task names the suite or supplies its new test code.

## Tasks

| Task | Wave | Status | File |
| --- | --- | --- | --- |
| 01 | 0 | Done | [Align comment policy and enable TypeScript safety rules in oxlint](task-01-align-comment-policy.md) |
| 02 | 0 | Done | [Add oxlint import restriction rules and negative fixture tests](task-02-oxlint-import-rules.md) |
| 03 | 0 | Done | [Add boundary and dependency graph checker](task-03-boundary-checker.md) |
| 04 | 0 | Done | [Record baseline of boundaries and test suites](task-04-record-baseline.md) |
| 05 | 1 | Done | [Extract browser-safe wire contracts](task-05-extract-wire-contracts.md) |
| 06 | 1 | Done | [Put the persistence contract in Session](task-06-move-request-persistence-contract.md) |
| 07 | 2 | Pending | [Separate Request Lifecycle errors from HTTP](task-07-separate-lifecycle-errors.md) |
| 08 | 3 | Pending | [Move the local application to apps/web](task-08-move-local-application.md) |
| 09 | 3 | Pending | [Put Browser code in the application](task-09-consolidate-browser.md) |
| 10 | 4 | Pending | [Extract chat and workspace workflows](task-10-extract-chat-workspace-workflows.md) |
| 11 | 4 | Pending | [Separate application features from integrations](task-11-organize-features-integrations.md) |
| 12 | 5 | Pending | [Narrow the OpenCode runtime boundary](task-12-narrow-runtime-persistence.md) |
| 13 | 5 | Pending | [Remove concrete format dependencies from Deck](task-13-decouple-deck-formats.md) |
| 14 | 6 | Pending | [Separate Browser transport from UI features](task-14-group-browser-features.md) |
| 15 | 7 | Pending | [Move tests to the owners of their behavior](task-15-move-tests-to-owners.md) |
| 16 | 7 | Pending | [Remove constant waits from the request tests](task-16-remove-fixed-test-waits.md) |
| 17 | 8 | Pending | [Enforce imports and dependency direction](task-17-enforce-dependency-boundaries.md) |
| 18 | 9 | Pending | [Check the structural refactor](task-18-verify-structural-refactor.md) |

## Deferred behavior work

Deck changes, provider selection, and design-system setup have separate product contracts [[6]](#ref-6) [[7]](#ref-7) [[8]](#ref-8).
Do not count this table as executable feature plans.
Write those plans after the relevant decisions exist.
Open decisions remain in Open Questions [[9]](#ref-9).

| Later workstream | Behavior | Prerequisites |
| --- | --- | --- |
| feature/deck | Edit existing slides, add slides, notes-only changes, and continuation without a second Outline | Structural Deck boundary and [clear instructions](../../../../open-questions.md#oq-053) |
| feature/deck | Answer deck questions with a read-only capability | Structural capability boundary and [questions before a first slide](../../../../open-questions.md#oq-054) |
| feature/design-systems | Propose, preview, save, change, and remove custom design systems | [model selection](../../../../open-questions.md#oq-030), [name identity](../../../../open-questions.md#oq-031), and [brand-file limits](../../../../open-questions.md#oq-032) |
| feature/providers | Carry reasoning selection through chat and request snapshots | [model-switch reasoning](../../../../open-questions.md#oq-022) and [provider setup](../../../../open-questions.md#oq-020) |
| feature/deck | Align image eligibility and external image-service selection with the product rules | [unknown image licenses](../../../../open-questions.md#oq-051) and the external-service contract |
| feature/deck | Support a checked new layout when no template layout fits | Explicit format capability and publication checks |
| feature/requests | Align draft recovery, request retry, resource limits, and file-access policy | [draft recovery](../../../../open-questions.md#oq-004), [retry](../../../../open-questions.md#oq-064), [resource limits](../../../../open-questions.md#oq-069), [secrets](../../../../open-questions.md#oq-068), and [links](../../../../open-questions.md#oq-071) |

Known mismatches include Pexels eligibility, disabled v3 layout fallback, and missing existing-slide editing.
Structural regression tests can preserve those behaviors.
Passing them does not establish compliance with the new product rules.

## Next revision

- Apply Coding Guidelines [[2]](#ref-2) cleanup: remove non-`as const` type assertions, rename `*Service` symbols to operation-specific names, and audit existing comments with a KEEP/REMOVE table.
- Apply Testware [[3]](#ref-3) cleanup: rewrite test bodies for required headers, independent literals, and deterministic waits beyond Task 16. Move shared test helpers out of `scripts/lib/`.
- Decompose `boot.ts` draft, navigation, request-observation, and confirmation coordination after measuring its actual dependency graph.
- Split mixed `e2e` test files into owner tests only after their fixture dependencies are explicit.
- Review narrow runtime capabilities in `DeckService` and `ArtifactStorage` before splitting their internal storage operations.
- Investigate the pre-existing `portable-generation-http.test.mjs` timeout failure separately from structural refactoring.
- Add behavior plans from the deferred table after the relevant product decisions.
- Do not use current hardcoded values to close an open product question.

## References

1. <a id="ref-1"></a>[Project Structure](../../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Coding Guidelines](../../../../conventions/code.md)
3. <a id="ref-3"></a>[Testware](../../../../conventions/testware.md)
4. <a id="ref-4"></a>[Use Cases](../../../../UCs/README.md)
5. <a id="ref-5"></a>[Gửi request](../../../../UCs/requests.md)
6. <a id="ref-6"></a>[Deck](../../../../UCs/deck.md)
7. <a id="ref-7"></a>[Provider và model](../../../../UCs/providers.md)
8. <a id="ref-8"></a>[Design system](../../../../UCs/design-systems.md)
9. <a id="ref-9"></a>[Open Questions](../../../../open-questions.md)

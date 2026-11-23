# Codebase Refactor Implementation Plan

Read this file to learn the scope, task order, constraints, and verification gates for the DeckAgent codebase refactor.

> **For executors:** Execute one task at a time. Read Global Constraints and the selected task file. Complete its steps in order. Report the result and stop. Start another task only after the task owner accepts the report.

**Goal:** Move current code toward the ownership and dependency rules without changing user-visible behavior.

**Approach:** Separate contracts first. Move code in small steps. Preserve durable records, permissions, event order, and publication authority throughout the migration.

**Tech stack:** Windows, Node.js 22.19.0, pnpm 11.28.5, TypeScript 6.0.3, tsdown, oxlint 1.94.0, Biome, and node:test.

**Spec:** Target ownership comes from Project Structure [[1]](#ref-1). Implementation rules come from Coding Guidelines [[2]](#ref-2) and Testware [[3]](#ref-3). Product behavior comes from Use Cases [[4]](#ref-4).

## Scope

This folder contains several execution plans. Each task is a separate change set, not one step in a single large patch.
The task order below prevents a directory move from hiding a contract change.

| Wave | Result | Tasks | Entry gate |
| --- | --- | --- | --- |
| 1. Contracts | Browser-safe wire data and a Session-owned persistence interface | 01–03 | Current source and baseline report |
| 2. Lifecycle | Request operation errors remain independent of HTTP | 04 | Wave 1 accepted |
| 3. Application | Local Host and Browser belong to apps/web | 05–06 | Wave 2 accepted |
| 4. Workflows | Startup assembles application-owned operations and integrations | 07–08 | Wave 3 accepted |
| 5. Runtime and Deck | Narrow runtime persistence access and explicit format injection | 09–10 | Wave 4 accepted |
| 6. Browser | Transport and UI features have separate owners | 11 | Wave 5 accepted |
| 7. Tests | Tests follow behavior ownership and key waits use conditions | 12–13 | Wave 6 accepted |
| 8. Enforcement | Import checks reject the migrated boundary violations | 14 | Wave 7 accepted |
| 9. Verification | Regression evidence and explicit remaining work | 15 | Wave 8 accepted |

## Decisions

Project Structure defines the ownership rules [[1]](#ref-1).
The planning agent proposes the implementation choices below.
The task owner can revise those choices before execution.
An executor must not select another design during a task.

| Topic | Decision |
| --- | --- |
| Workstream | This revision is refactor/codebase. It does not add deck-editing, reasoning, or custom-design-system behavior. |
| Application directory | Move apps/local-web to apps/web. Keep the package name @deckagent/local-web during this revision. |
| Browser ownership | Move packages/client/runtime into apps/web/src/browser. Compile Node and Browser with separate TypeScript projects. |
| Wire package | Create @deckagent/host-contracts. Publish safe DTOs and boundary validators only. |
| Representation | Preserve domain and persistence types in their owners. Wire DTOs preserve current payload fields. Add no identity mapper. |
| Persistence | Session owns the RequestStore contract. Lifecycle uses public operations, not a SQLite handle. |
| Lifecycle | Keep RequestController and its authority. Move its HTTP status mapping into transport. |
| Workflow placement | Application features own orchestration. Entry point owns startup, shutdown, configuration, and dependency construction. |
| Integration | OpenCode owns protocol and process lifecycle. A runtime result does not write request terminal status. |
| Format | Deck uses FormatAdapter contracts. Startup registers the concrete HTML adapter. Preserve the existing legacy publication path through explicit policy injection. |
| Data | Keep existing database versions, event payloads, revision records, receipt identities, and template-version pins. |
| Test movement | Move tests by the behavior they assert. Keep mixed application/domain files in e2e during this revision. |
| Test changes | Mechanical moves keep assertions unchanged. The timing task changes only the named condition waits and Stop synchronization. |
| Enforcement | Reuse the existing build cycle check. Add compiler-API checks for import boundaries and feature cycles that existing tools do not cover. |
| Dependencies | Add workspace dependencies and reuse already locked zod 4.6.7. Add no external package or version. |
| Compatibility | Update every current consumer in the same task. Do not leave redirect directories, source aliases, or broad export bridges. |

## Global Constraints

- Run commands from the repository root in Git Bash on Windows.
- Use Node.js 22.19.0, the existing CI version.
- Use `corepack pnpm@11.28.5`. Do not install a different Node or package-manager version.
- Preserve another person's changes. Never reset, clean, or overwrite unrelated work.
- Do not commit, push, publish, or call a real provider.
- Do not read the user's real application data, credentials, or .env values.
- Use temporary fixture directories for runtime tests.
- Do not add a product limit, timeout policy, source permission, or new retry rule.
- Preserve request admission, cancellation, terminal-status, and persist-before-publish ordering.
- Preserve one active request per chat and one issued grant per authorized generation operation.
- Preserve transaction boundaries. Separate databases and filesystems do not share a transaction.
- Preserve stored schemas, immutable revisions, publication receipts, and pinned template versions.
- Keep model output separate from permission and publication authority.
- Import another package only through package.json exports.
- Keep Node-only code outside Browser and wire contracts.
- Do not create shared, common, utils, or errors folders to bypass ownership.
- Use public owner operations. Never pass a private database handle between owners.
- Do not add classes, wrappers, repositories, or interfaces without a real consumer or protected boundary.
- Follow Coding Guidelines for comments. Follow Testware for required test headers.
- Do not add lint suppressions, ts-ignore, ts-expect-error, or assertions that bypass a type error.
- Do not remove, skip, weaken, or retarget a test to make the refactor pass.
- Keep test inputs and expected values independent of production constants.
- Use fake runtime and HTTP boundaries. Do not replace an application module with a mock.
- Keep suites sequential when their fixtures can share mutable state.
- Keep English plan text within the asd-ste100 structural rules.
- Keep current user-facing Vietnamese messages unchanged during structural tasks.
- Do not edit docs/00-old, existing historical plans, product rules, open-question decisions, or skills.
- Change only the files listed in the task. Brace lists in Files expand to exactly the named basenames.
- A source placement table expands to exactly its source and destination paths.
- Earlier accepted tasks can change line numbers. Find the same named symbol at its planned destination.
- Stop when a named signature or source body differs beyond the predecessor changes described here.
- Build and lint pass only with exit code 0. Test commands must print `# fail 0`.
- An absence search passes with exit code 1 and no matches. Other search errors are failures.
- Report a baseline failure separately. Do not correct an unrelated product defect during a move.
- Stop after two failures of the same step.
- Report test skips explicitly. A skip is not passing evidence.
- An approved refactor task does not authorize implementation of a deferred feature.

These constraints apply project rules [[1]](#ref-1) [[2]](#ref-2) [[3]](#ref-3).
The planning session changed no production or test code.
It did not run the product baseline.
Task 01 records that baseline before implementation.

## Compatibility checkpoints

The request contract requires Host work to survive Browser disconnection [[5]](#ref-5).
The Deck contract preserves completed slides after failure [[6]](#ref-6).
These behaviors remain review gates during every move.

| Boundary | Preserve |
| --- | --- |
| Browser to Host | Existing localhost routes, token checks, payloads, SSE sequence and reconnect cursor |
| Host to runtime | Frozen provider snapshot, abort signal, bounded tools, no terminal-status authority |
| Lifecycle to Session | Atomic admission, durable events, approval records, one terminal transition |
| Workflow to Workspace | No project-file writes, folder identity checks, active-request guards |
| Workflow to Deck | Bound Brief/Outline binding, issued grants, retained completed slides |
| Deck to format | Explicit adapter, source validation, render check, cancellation before commit |
| Startup recovery | Interrupted requests, incomplete generation, workspace ungroup reconciliation, no automatic replay |

## Review Focus

1. A stopped request rejects late output. Preserve the Stop regression in [Lifecycle errors](task-04-separate-lifecycle-errors.md). Synchronize its fault in [condition waits](task-13-remove-fixed-test-waits.md).
2. A Browser reconnect cannot create another request. Preserve the transport regressions in [wire contracts](task-02-extract-wire-contracts.md) and [Browser consolidation](task-06-consolidate-browser.md).
3. A workspace removal cannot hide saved chats after interruption. Preserve local-foundation tests in [workspace workflows](task-07-extract-chat-workspace-workflows.md).
4. A forged grant or repeated publication cannot replace an unrelated revision. Preserve publication tests in [format independence](task-10-decouple-deck-formats.md).
5. A moved test must still run and detect its fault. Compare counts in [test movement](task-12-move-tests-to-owners.md). Run negative fixtures in [dependency checks](task-14-enforce-dependency-boundaries.md).

These are preservation risks, not claims that the current tests prove every requirement.
Each relevant task names the exact existing suite or supplies its new test code.

## Tasks

| Task | File |
| --- | --- |
| 01 | [Record the refactor baseline](task-01-record-baseline.md) |
| 02 | [Extract browser-safe wire contracts](task-02-extract-wire-contracts.md) |
| 03 | [Put the persistence contract in Session](task-03-move-request-persistence-contract.md) |
| 04 | [Separate Request Lifecycle errors from HTTP](task-04-separate-lifecycle-errors.md) |
| 05 | [Move the local application to apps/web](task-05-move-local-application.md) |
| 06 | [Put Browser code in the application](task-06-consolidate-browser.md) |
| 07 | [Extract chat and workspace workflows](task-07-extract-chat-workspace-workflows.md) |
| 08 | [Separate application features from integrations](task-08-organize-features-integrations.md) |
| 09 | [Narrow the OpenCode runtime boundary](task-09-narrow-runtime-persistence.md) |
| 10 | [Remove concrete format dependencies from Deck](task-10-decouple-deck-formats.md) |
| 11 | [Separate Browser transport from UI features](task-11-group-browser-features.md) |
| 12 | [Move tests to the owners of their behavior](task-12-move-tests-to-owners.md) |
| 13 | [Remove constant waits from the request tests](task-13-remove-fixed-test-waits.md) |
| 14 | [Enforce imports and dependency direction](task-14-enforce-dependency-boundaries.md) |
| 15 | [Check the structural refactor](task-15-verify-structural-refactor.md) |

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

- Decompose boot's remaining draft, navigation, request-observation, and confirmation coordination after measuring its actual dependency graph.
- Split mixed e2e test files into owner tests only after their fixture dependencies are explicit.
- Remove constant waits beyond the two bounded cases in Task 13.
- Review narrow runtime capabilities in the large DeckService and ArtifactStorage modules before splitting their internal storage operations.
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

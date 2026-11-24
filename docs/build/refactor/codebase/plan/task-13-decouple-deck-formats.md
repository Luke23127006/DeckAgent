# Task 13: Remove concrete format dependencies from Deck

Read this file to learn the steps that remove concrete format dependencies from deck.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `packages/presentation/deck/src/artifact-store.ts (lines 1-129 and 766-845)`.
- `packages/presentation/deck/src/index.ts (lines 615-742 and 829-909)`.
- `packages/presentation/deck/src/contracts.ts (lines 118-144)`.
- `packages/presentation/deck/src/html-policy.ts`.
- `packages/presentation/document/src/contracts.ts (FormatAdapter)`.
- `packages/presentation/html/src/index.ts`.
- `apps/web/src/index.ts (DeckService wiring)`.
- `tests/artifact-publication.test.mjs`.
- `tests/deck-service.test.mjs`.
- `.agents/skills/codebase-design/SKILL.md`.

**Files:**

- Create: packages/presentation/html/src/legacy-policy.ts.
- Remove: packages/presentation/deck/src/html-policy.ts after all its consumers move.
- Change: packages/presentation/html/src/index.ts.
- Change: packages/presentation/deck/src/{index,artifact-store,contracts}.ts.
- Change: packages/presentation/deck/package.json and tsconfig.json.
- Change: apps/web/src/index.ts, pnpm-lock.yaml.
- Change: tests/*.test.mjs, only at DeckService construction and format-policy imports.

**Interfaces:**

- Preserves: FormatAdapter in @deckagent/presentation-document.
- Produces: validateLegacySlideHtml(source: unknown): asserts source is string, exported by @deckagent/html-format.
- Adds: DeckOptions.legacyHtmlPolicy?: (source: unknown) => void, a compatibility dependency for the existing publish operation.
- Preserves: DeckOptions.formats?: readonly FormatAdapter[]. No formats means no registered format, not an implicit HTML adapter.
- Preserves: DeckService publication, grant, revision, receipt, and cancellation operations.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A grant becomes valid by object shape instead of issued identity.
- An adapter receives publication authority or request permission.
- A published manifest, descriptor, template pin, or receipt fingerprint changes.
- The task requires removing a stored format or a legacy revision.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Move legacy HTML policy**

Move the current legacy HTML validation algorithm into the HTML package.
Keep its byte limit and rejection conditions unchanged.
Throw FormatError with code `DECK_UNSAFE_HTML` for that legacy policy.
The Deck compatibility operation translates that code to its existing DeckError.
No other failure becomes a successful publication.

- [ ] **Step 2: Make adapter registration explicit**

Remove `HtmlFormatAdapter` imports from Deck.
Build the adapter map from `options.formats ?? []`.
Keep duplicate adapter detection.
Startup supplies `[new HtmlFormatAdapter()]` and `validateLegacySlideHtml`.
Update only the test fixtures that exercise HTML publication.
Metadata-only Deck tests need no adapter.

The legacy publish operation invokes the injected policy.
Missing legacy policy raises `DECK_CONFIG` before writing.
This compatibility dependency supports current consumers.
It does not add HTML conversion to the Deck domain.

- [ ] **Step 3: Preserve publication ownership**

Keep staging, grant identity, expected revision, and idempotent receipt checks in Deck.
Keep conversion and HTML/CSS validation inside the adapter.
Keep browser rendering checks behind the existing renderCheck callback.
Keep the cancellation check immediately before the publication transaction.
Do not collapse the filesystem and SQLite writes into a claimed shared transaction.

- [ ] **Step 4: Check current formats**

Remove the concrete HTML dependency and TypeScript reference from Deck.
Keep the application dependency on the HTML adapter.
Run `corepack pnpm@11.28.5 install --lockfile-only --offline`.
Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 test:slide-pipeline`.
Run `corepack pnpm@11.28.5 test:generation-publication`.
Expected: metadata and build commands exit with code 0. `test:slide-pipeline` prints `# fail 0`.
In `test:generation-publication`, report the recorded baseline failure in `portable-generation-http.test.mjs` (test #60, `REQUEST_TIMEOUT`) separately without fixing it. Stop on any other failure.
Run `rg -n "@deckagent/(html-format|pptx)" packages/presentation/deck/src packages/presentation/deck/package.json`.
Expected: exit code 1 with no matches.
Do not change Pexels eligibility or custom-layout behavior in this structural task.

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

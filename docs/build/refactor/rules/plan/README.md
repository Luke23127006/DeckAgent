# Refactor 01 Quality Checks Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of refactor 01.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Make machines enforce the documentation rules and the code rules of DeckAgent, so that agents get feedback when they edit a file.

**Approach:** Each rule goes to the cheapest layer that can enforce it: code structure, then static analysis, then tests, then text. This revision adds the documentation check, the edit hook and the comment scanner, and measures the oxlint migration. A later revision of this plan adds the tasks that use the measurement.

**Tech stack:** Node.js 22 (ESM `.mjs`), `node:test`, TypeScript 6 compiler API (`typescript` package), Claude Code hooks, oxlint (measurement only in this revision).

**Spec:** the [Decisions](#decisions) section of this file.

## Decisions

| Topic | Decision |
| --- | --- |
| Linter | oxlint is the only linter. Repository rules are oxlint JS plugins. |
| Formatter | Biome stays as the formatter only. Task 11 turns off the Biome linter. The result of Task 5 is `oxfmt: not stable` (version 0.79.0). Replace Biome with oxfmt when oxfmt has a major version of 1 or more. |
| Linter rule set | The categories `correctness` and `suspicious`, at level `error`. Three rules are off. `eslint/no-shadow` and `unicorn/consistent-function-scoping` are style rules with 85 of 122 findings. `unicorn/prefer-add-event-listener` has 5 findings, and 3 of them are on an MCP transport, not on a DOM object. Add each other rule one by one, with a reason. Do not enable a whole category. |
| Biome format | A clone with LF line endings shows 33 files that Biome would change. The cause is not the CRLF line endings. Task 12 formats the files. |
| Linter plugins | oxlint 1.94.0 loads a JS plugin through `jsPlugins` in `.oxlintrc.json`. A rule reads the comments with `context.sourceCode.getAllComments()`. A test used one rule on one file. No test used the whole repository or rules that need types. |
| Comments in code | No comments in code. Decisions go into code, tests and ADRs. The scope is in [Comment scope](#comment-scope). |
| Citations in documents | One number for each source file. The text shows the number only, as `[[1]](#ref-1)`. The text does not show a location in the source. |
| Purpose line | Each Markdown file in scope starts with one sentence that tells which information the file gives. |
| Plan language | Plans in `docs/build/` are in English. Other documents in `docs/` are in Vietnamese. |

## Comment scope

The comment rule applies to each file that git tracks or that is new and not ignored, in `apps/`, `packages/`, `scripts/` and `tests/`, with one of these extensions: `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`. It also applies to each `tsconfig*.json` file.

The rule does not apply to:

- Text in strings and template literals.
- The shebang line (`#!`).
- Paths that contain `/lib/`, `/dist/` or `node_modules/`.
- `docs/00-old/`.

Each comment kind is forbidden: line comments, block comments, JSDoc, `TODO`, `FIXME`, lint-disable directives, `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, triple-slash directives, bundler pragmas and code in comments.

## Global Constraints

- Shell: Git Bash on Windows. Run each command from `C:/Users/Duy/Desktop/DeckAgent`.
- Node: use the `node` command (version 22). Do not install a different Node.
- Package manager: `corepack pnpm@11.28.5`. Do not use the `pnpm` command directly.
- Module format: new scripts are ES modules with the extension `.mjs`. Use `import`, not `require`.
- Tests: run tests with `node --test --test-reporter=tap <files>`. A passing run contains `# fail 0`.
- New code files contain no comments of any kind. Names, types and tests carry the meaning.
- Text that a tool prints (error messages, check output) is in English and obeys `.agents/skills/asd-ste100/SKILL.md` in strict mode.
- Vietnamese text in `docs/conventions/` and `AGENTS.md` obeys `.agents/skills/ste-vi/SKILL.md`.
- Do not change files in `docs/00-old/`.
- Do not commit. Do not push.
- Do not add a dependency to `package.json` unless the task names the dependency and its version.

## Review Focus

1. A citation inside a fenced code block or inside inline code is an example, not a citation. The check must ignore it. Test: [Task 1](task-01-check-docs.md), `ignores citations in code`.
2. Files with Windows line endings (CRLF) must pass when their content is correct. Test: [Task 1](task-01-check-docs.md), `accepts CRLF line endings`.
3. A heading with Vietnamese letters must produce the same anchor as GitHub. Test: [Task 1](task-01-check-docs.md), `githubSlug keeps Vietnamese letters`.
4. The text `//` inside a string, a URL or a regular expression is not a comment. Test: [Task 4](task-04-comment-scanner.md), `ignores comment markers in strings and regular expressions`.
5. A comment inside JSX is a comment. Test: [Task 4](task-04-comment-scanner.md), `finds a comment inside JSX`.

## Tasks

| Task | File |
| --- | --- |
| 1 | [Documentation check library and CLI](task-01-check-docs.md) |
| 2 | [Make the documents obey check-docs](task-02-docs-obey-check.md) |
| 3 | [Claude Code edit hook](task-03-edit-hook.md) |
| 4 | [Comment scanner](task-04-comment-scanner.md) |
| 5 | [Measure oxlint and oxfmt](task-05-measure-oxlint.md) |
| 6 | [Measure the cost of the oxlint rule set](task-06-measure-oxlint-adoption.md) |
| 7 | [Measure the difference between oxfmt and Biome](task-07-measure-oxfmt-difference.md) |
| 8 | [Add oxlint beside Biome](task-08-add-oxlint.md) |
| 9 | [Replace the array methods that oxlint reports](task-09-fix-array-findings.md) |
| 10 | [Change the code for the other oxlint findings](task-10-fix-other-findings.md) |
| 11 | [Switch the lint command from Biome to oxlint](task-11-switch-lint-to-oxlint.md) |
| 12 | [Format the files with Biome](task-12-format-with-biome.md) |

## Next revision

The next revision of this plan adds these tasks. Do not start them from this revision.

- Add `noImplicitReturns` and `noPropertyAccessFromIndexSignature` to `tsconfig.base.json`.
- Add the oxlint rule `deckagent/no-comments`. Add the comment scanner to the hook and to CI.
- Remove the existing comments, one package for each task, with a decision table.
- Add dependency-cruiser and knip.
- Add the test rules:
  - No `mock.module` on app modules.
  - No app constants in tests.
  - No waits for a constant time.
  - One assertion or more in each test.
  - No negative assertions and no range assertions.
- Add the skills `review-change` and `correct`.
- Runtime verification and mutation testing get a separate plan.

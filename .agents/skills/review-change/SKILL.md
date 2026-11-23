---
name: review-change
description: >-
  Use before you report that a change is complete. Use it when the change adds or changes code, tests, or documents in docs/UCs, docs/architecture or docs/conventions. A new subagent reviews the diff against the convention files in docs/conventions. It looks only for the mistakes that `pnpm check` cannot find. Examples: a test that cannot fail, a test name that tells more than its assertions, a test that waits for real time. Examples in documents: a use case that tells a mechanism, a reference that the reader must guess. Use also when the user asks to "review this change" in this repo. Do not use to fix the findings.
---

# Review Change

The agent that made a change also believes it. A reviewer with a new context has time to check each claim. Thus, a different agent does the review. That agent sees only the diff, the standards, and this checklist.

## Steps

1. Select checks for the changed files and affected consumers using `AGENTS.md`, section `Kiểm chứng theo thay đổi`. Run those checks. Fix errors from those checks before the review. Do not run `pnpm check` unless the user explicitly requests that command. Do not replace it with all its component commands. Give the reviewer the scope and results of the selected checks.
2. Start one new subagent (Agent tool, `general-purpose`). Do not use a fork, because a fork gets your context. Give the subagent only:
   - The commands that show the change: `git diff`, `git diff --cached`, and `git status --short` for new files.
   - The standards: the convention files in `docs/conventions/` for the changed files (`code.md`, `project-structure.md`, `testware.md`, `docs.md`, `use-cases.md`, `architecture.md`, `mermaid.md`), and the lessons in `LESSONS.md` with a scope that applies.
   - The evidence that you have for your claims: commands that you ran and their results, and the faults or mutants that made a test fail. Give the facts, not your reasons for the change.
   - The checklist below, and the output format.
3. Do not change files during the review. When the subagent reports, fix each finding that it reports, or tell the user why you keep it.
4. If one finding can happen again, run the `correct` skill for its class. A check stops the next one. A comment in a review does not.

## Checklist for the reviewer

- **Tests that cannot fail.** Each new or changed test needs evidence: it failed once on a defect or a mutant of the product. A changed expected value in the test is not evidence. Report each test with no such evidence.
- **Simulations.** Each stub, mock or driver loses the state that the real event loses. The comment at the top of the test file names the fault that made a test with the double fail. Report a double with no such fault, for example a restart in the same process.
- **Expected values.** Each expected value comes from a test case or a requirement. Report a test that computes the result again with the same logic as the code, because lint cannot find this. Some statuses come from a library and not from a requirement. A test of such a status must also check the effect that the requirement gives, for example a sent email. Report a test that checks only such a status.
- **Real time and order.** Lint finds fixed waits (`testware/no-real-time-wait`). Find what lint cannot find: a timeout that is too short for a slow machine, a test that depends on a real-time timer in the product, and a test that uses mutable data that another test changes.
- **Test names and comments.** Each name and comment tells only what the assertions check.
- **Exports for tests.** Report an export of the product that only a test uses. Make the test use the public interface of the module.
- **Documents: layer and boundary.** Some facts in `docs/UCs/` are not visible from outside the system, for example a library, an endpoint or a table. Such a fact belongs in `docs/architecture/`. A fact that is in two files is a second source. One file must link to the other. A convention file that tells steps of work, or a skill that tells the format of an output, is in the wrong layer (`docs/conventions/README.md`).
- **Documents: rules.** Each rule in a rule table tells one thing that a test can check. The "Đo tại" column gives a start and an end point. Or it gives the place to read the value. A reference such as "this mechanism" or "the proposed option" names its object in the same sentence or in the sentence before it. Text near a diagram does not tell the diagram again.
- **Claims.** Find each claim about state in a test comment, a commit message or the report to the user: a version, a configuration, "verified", "ready". Each claim needs a source that the author checked: a command output, a file, a test result.

## Output format

A table with these columns: file and line, finding, evidence, severity (high, medium, low). Give "No finding" for each item of the checklist with no problem. Do not give findings about style that `pnpm check` already enforces.

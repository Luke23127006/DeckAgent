# White-box Testing: Statement and Branch Coverage

White-box testing uses the internal structure of the code. Coverage shows which parts of the code the tests executed. Coverage does not show that the tests checked the results, and it cannot show code that is missing.

## Build the model

1. **Record the code version.** A coverage result is valid only for one commit or build.
2. **Get the control flow.** Use the control flow graph, or the statement and branch list from the coverage tool. A branch is a transfer of control between statements: each outcome of an `if`, `switch`, loop condition, ternary, short-circuit operator, `try`/`catch`.
3. **Record the exclusions.** For example: generated code, type declarations, code that the test plan puts out of scope. Give the reason for each exclusion. An exclusion without a reason hides gaps.

## Coverage criteria and coverage items

| Criterion | Coverage items | Coverage |
| --- | --- | --- |
| Statement coverage | Each executable statement | Statements executed ÷ all executable statements |
| Branch coverage | Each branch (each outcome of each decision) | Branches executed ÷ all branches |

Branch coverage includes statement coverage. 100% statement coverage can miss a branch. For example, an `if` with no `else` has a false outcome that executes no statement.

## Read a coverage report

- Read branch coverage, not only line coverage.
- For each uncovered statement or branch, ask first: is this code needed? Uncovered code can be dead code, or a missing test condition. A missing test condition must go back to test design.
- Compare the coverage with the target of the test plan for the risk level of the component.

## Add tests for a gap

1. Find the input that makes the code take the uncovered branch.
2. Find the expected result from the test basis, not from the code. If the test basis says nothing about this branch, report a test basis defect.
3. Write the test with an assertion on that expected result.
4. Run the coverage again and check that the tests now execute the branch.

## Limits

- Coverage measures execution, not checking. A test with no assertion increases coverage and finds nothing.
- Coverage cannot find missing code, for example a missing validation.
- High coverage of low-risk code and low coverage of high-risk code give the same total. Report coverage for each component or each risk area.

## Anti-patterns

- A test that you write only to execute lines, with no assertion.
- A global coverage target with no link to risk.
- Exclusions that you add to reach a target.
- An expected result copied from the current output of the code.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §4.3 White-box Test Techniques (statement testing §4.3.1, branch testing §4.3.2, value of white-box testing §4.3.3).

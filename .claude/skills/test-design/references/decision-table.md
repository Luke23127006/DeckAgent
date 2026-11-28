# Decision Table Testing

A decision table shows how combinations of conditions cause actions. Use it when the result depends on more than one condition at the same time. The table finds missing rules and contradictory rules in the test basis.

## Build the model

1. **List the conditions.** A condition is an input or a state that the rule tests, for example "user is verified". Take each condition from the source.
2. **List the actions.** An action is a result that the test object produces, for example "grant access", "show error E-12".
3. **Make the table.** Rows are conditions and actions. Each column is one rule: one combination of condition values.
   - Condition values: `T` (true), `F` (false), `–` (the value has no effect on the result), `N/A` (the condition cannot occur in this combination).
   - Action values: `X` (the action occurs) or empty (the action does not occur).
   - For non-boolean conditions, use their values or their partitions, for example `<18`, `18–65`, `>65`.
4. **Start from all combinations.** With n boolean conditions there are 2^n columns. Write them all first. Then remove columns that cannot occur and merge columns.
5. **Remove infeasible columns.** A column is infeasible when its combination cannot occur. Record the reason for each removed column.
6. **Merge columns (minimize).** You can merge two columns when they have the same actions and differ in only one condition. The merged column shows `–` for that condition. Record the merge.

## Check the model

- Each combination of conditions is in exactly one column, or is removed with a recorded reason.
- No two columns have the same conditions but different actions. That is a contradiction in the test basis. Report it.
- Each column has at least one action. A column with no action is a missing rule in the test basis. Report it.
- Each condition and each action links to a source.

## Coverage criterion and coverage items

- Coverage item: each feasible column.
- Coverage: columns exercised ÷ all feasible columns.

If the table is minimized, a column with `–` covers several combinations. Record which concrete value you use for each `–` in the test case.

## Derive test cases

- One test case for each feasible column.
- Choose condition values that make the column true. Use values that are realistic for the domain.
- The expected result is the set of actions with `X` in that column.
- If the number of columns is too large for the test budget, ask the test planner. Do not drop columns without a decision. Options are: minimize further, split the table into independent tables, or use a different combinatorial criterion with a recorded reason.

## Example

Three conditions: verified (V), admin (A), account locked (L).

| | R1 | R2 | R3 | R4 |
| --- | --- | --- | --- | --- |
| V | T | T | F | – |
| A | T | F | – | – |
| L | F | F | F | T |
| Grant admin page | X | | | |
| Grant user page | | X | | |
| Ask for verification | | | X | |
| Show "locked" | | | | X |

R3 merges the 2 columns where V=F, L=F. R4 merges the 4 columns where L=T. The 4 rules cover all 8 combinations.

## Anti-patterns

- The table has fewer columns than the combinations, and there is no record of merges or infeasible columns.
- You fill an empty action with your own guess instead of a report.
- One test case for each condition instead of each column.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §4.2.3 Decision Table Testing.

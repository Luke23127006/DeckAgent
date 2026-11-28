# State Transition Testing

A state model shows the states of the test object, the events that change the state, and the result of each change. Use it when the same input gives a different result in different states.

## Build the model

1. **List the states.** A state is a condition that the test object stays in until an event occurs, for example `SignedOut`, `SignedIn`, `Locked`. Include the start state and any final states. Take each state from the source.
2. **List the events.** An event causes a transition, for example `submit valid password`, `timeout`. If an event has a condition (a guard), write it next to the event: `submit wrong password [attempts < 3]`.
3. **Make a state table.** Rows are states. Columns are events, with their guards. Each cell gives the next state and the action. An empty cell is an invalid transition: the event is not allowed in that state.
4. **Draw a state diagram if it helps review.** The table is the reference, because it shows the invalid transitions.

A state table shows invalid transitions explicitly. A state diagram shows only valid transitions.

## Check the model

- Each state and each event in the source is in the table.
- Each state can be reached from the start state. A state that cannot be reached is a defect in the model or in the test basis.
- For each guard on one event in one state, the guards do not overlap and they cover all cases.
- For each invalid transition, the source says what the test object must do: ignore the event, show an error, or other. If the source does not say, report it.
- The model uses a versioned description of the test object.

## Coverage criteria and coverage items

| Criterion | Coverage items | Notes |
| --- | --- | --- |
| All states | Each state | Weakest. Can miss transitions. |
| Valid transitions (0-switch) | Each valid transition | Includes all states. |
| All transitions | Each valid transition and each invalid transition | Strongest of the three. Use for high risk. |

Coverage = items exercised ÷ all items. Choose the criterion from the risk level in the test plan.

## Derive test cases

- For valid transitions: write paths from the start state. One test case can cover many valid transitions in sequence. Each step checks the new state and the action.
- For invalid transitions: put one invalid transition in each test case. After the first invalid event, the state can be unknown, and the rest of the test then gives no reliable result.
- Check the state, not only the visible output. Use an observable sign of the state, for example a status field, an API response or a page.
- Include the guards. For each guard, test both sides of its boundary. Use `references/equivalence-partitioning-bva.md` for that.

## Anti-patterns

- A diagram with no table, so the invalid transitions are not visible.
- Only the main path is tested, for example sign in and sign out.
- A test case that sends many invalid events in a row.
- States taken from the code instead of from the source.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §4.2.4 State Transition Testing.

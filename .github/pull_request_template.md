## Ticket

Closes #N

## Test command output

<!-- Paste the output of the ticket's test command. A PR without it is not reviewed. -->

```text

```

## Checklist

- [ ] **Only the files listed in the ticket are changed** (at most 3)
- [ ] **No locked test** (`tests/acceptance/`, `tests/eval/`) **and no spec file is changed** — or this PR is a test-stub / PO PR
- [ ] I **did not write the tests of the FR this PR implements** (not required for `build:light`)
- [ ] **No model call is added** where the ticket's LLM boundary says none
- [ ] **CI is green**

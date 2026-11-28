# Equivalence Partitioning and Boundary Value Analysis

Equivalence partitioning (EP) divides the values of a data element into partitions. The test object must process all values in one partition in the same way. Boundary value analysis (BVA) tests the edges of ordered partitions, because defects often occur at boundaries. BVA needs partitions, so build the EP model first.

## Build the model

1. **List the data elements.** Include inputs, outputs, internal values, time-related values and interface parameters. For each element, record its type and its constraints (range, length, format, set of allowed values, mandatory or optional), with a source.
2. **Divide each data element into partitions.**
   - The partitions do not overlap. Each value belongs to exactly one partition.
   - No partition is empty.
   - The partitions together cover all possible values of the element. This includes values that are not valid: wrong type, empty, null, negative, too long, wrong format.
   - Mark each partition as valid or invalid. A valid partition contains values that the test object must accept. An invalid partition contains values that it must reject or ignore.
   - Split a partition if the source says that a sub-group gets different processing. Do not split without a source.
   - Partition the outputs too, when the outputs have different processing paths.
3. **Find the boundaries of each ordered partition.** A partition is ordered when its values have an order: numbers, dates, lengths. A boundary value is the minimum or the maximum value of the partition. Take boundaries from the source, not from the code. Do not apply BVA to unordered partitions such as enumerations or booleans.

## Check the model

- No overlap, no empty partition, no missing value of the domain.
- At least one invalid partition, unless the source shows that no value is invalid.
- Each partition and each boundary links to a source.
- For each boundary, you know the smallest step of the domain. Examples: 1 for integers, 0.01 for money with 2 decimals, 1 character for lengths, 1 second for time.

## Coverage criteria and coverage items

| Criterion | Coverage items | Coverage |
| --- | --- | --- |
| EP, one set of partitions | Each partition | Partitions exercised ÷ all partitions |
| EP, many sets of partitions: Each Choice | Each partition of each set, at least once | As above, for each set |
| 2-value BVA | For each boundary: the boundary value and its closest neighbor in the adjacent partition | Values exercised ÷ all identified values |
| 3-value BVA | For each boundary: the boundary value and both of its neighbors | Values exercised ÷ all identified values |

Example. Valid length is 8 to 64 characters.

- Partitions: `< 8` (invalid), `8–64` (valid), `> 64` (invalid). Also: empty, null, wrong type, if the source defines them.
- 2-value BVA: 7, 8, 64, 65.
- 3-value BVA: 7, 8, 9, 63, 64, 65.

3-value BVA is stronger than 2-value BVA. Example: the rule is `length <= 64`, and the code has the defect `length == 64`. The 2-value tests 64 (accept) and 65 (reject) both pass. The 3-value test 63 fails, so it finds the defect.

## Derive test cases

- Each coverage item gets at least one test case.
- You can cover many valid partitions of different data elements in one test case.
- Each test case contains at most one value from an invalid partition. All its other values are valid. If a test case has two invalid values, one defect can hide the other.
- Each test case has an exact expected result from the source. If the source does not give it, mark "ORACLE NEEDED".

## Anti-patterns

- One invalid partition for "all bad input", when the source gives different error behavior for different bad input.
- Boundaries that you read from the code. The code can be wrong.
- Only the valid partition is tested.
- You combine all partitions of all elements (cross product) and call it EP. That is combinatorial testing, and it needs a different coverage criterion.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §4.2.1 Equivalence Partitioning, §4.2.2 Boundary Value Analysis.

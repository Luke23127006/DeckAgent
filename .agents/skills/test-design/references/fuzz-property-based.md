# Property-based and Fuzz Testing

An example-based test checks one input and one expected output. A property-based test checks that a rule holds for many generated inputs. A fuzz test sends many generated inputs, often malformed, and looks for crashes, hangs or broken invariants. Both find defects at inputs that nobody thought of.

ISTQB CTFL v4.0.1 does not define a model or coverage items for these techniques. This skill uses common practice. A project can replace it.

## Build the model

The model is a list of properties, and an input generator or grammar for each.

### Find properties

Each property must link to a test basis item. Common types:

| Type | Form | Example |
| --- | --- | --- |
| Invariant | A condition is always true for the output | A balance is never negative. The output list stays in order |
| Round trip | `decode(encode(x)) == x` | Parse then serialize a config |
| Idempotence | `f(f(x)) == f(x)` | Normalize an email address |
| Equivalence with a reference | `fast(x) == simple(x)` | An optimized calculation against a simple version |
| Metamorphic relation | A known change to the input gives a known change to the output | Double all prices, then a percentage result does not change |
| Determinism | Same input and seed give the same output | Two runs of a simulation give identical results |
| No crash | Any input gives a result or a defined error | A parser never throws an unhandled exception |

A metamorphic relation is useful when you cannot know the exact expected output, but you know how the output must change.

### Build generators

- Generate values over the full domain of the input, including the edges: empty, minimum, maximum, special values (NaN, infinity, negative zero for floating point), Unicode.
- Make generated inputs valid enough to reach the logic under test. Use constraints or a grammar. Inputs that the first check rejects test only that check.
- For fuzzing of a format, write a grammar, or start from a set of valid seed inputs and mutate them.

## Check the model

- Each property links to a test basis item. A property with no source is an assumption. Label it.
- A property is not a copy of the implementation. A test that computes the expected result with the same algorithm as the code finds nothing.
- The generator covers the partitions and boundaries of the input. Check its distribution of values.

## Coverage items

Each property. Result: the number of inputs generated, the run time, and the number of violations found. A run without violations does not prove the property. Report the number of inputs.

## Keep failures reproducible

- Record the random seed of each run. Print it on failure.
- Use shrinking: the tool reduces a failing input to a minimal one. Report the minimal input.
- Add each minimal failing input as a fixed example-based regression test.
- For floating-point results, compare with a tolerance that has a source. Do not use exact equality.

## Anti-patterns

- A property that only says "no exception" when a stronger property exists.
- A generator that produces almost only invalid input.
- A failure that nobody can reproduce, because the seed was not recorded.
- Expected results computed by the code under test.

## Sources

- Claessen and Hughes, QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs, ICFP 2000.
- Chen et al., Metamorphic Testing: A Review of Challenges and Opportunities, ACM Computing Surveys, 2018.

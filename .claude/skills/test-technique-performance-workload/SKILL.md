---
name: test-technique-performance-workload
description: Use when you design or review performance tests - load, stress, soak, spike, capacity, benchmark. Use also when a test condition is about response time, throughput, concurrency or resource use. Gives how to build a workload model with sourced thresholds, the checks for the model, the coverage items, and the rules for valid measurement. Not for choosing a load-testing tool.
---

# Performance Testing: Workload Model

A performance test is valid only if its workload is realistic and its thresholds have a source. The workload model states what load to apply, how long, and what result is acceptable.

ISTQB CTFL v4.0.1 does not define a model or coverage items for performance testing. This skill uses a common practice. A project can replace it.

## Build the model

1. **Select the scenarios.** A scenario is a user or system action that has a performance risk, for example "load the dashboard", "submit a report job", "sign in". Select by risk and by frequency of use.
2. **Define the workload mix.** For each scenario, give its share of the total load and a source for it. A source is production metrics, analytics, a business forecast, or a written assumption.
3. **Define the load profile.**
   - Open model: arrival rate (requests or users per second). Use this for public traffic, where new users arrive whether the system is slow or not.
   - Closed model: a fixed number of concurrent users with think time. Use this for a fixed group of users.
   - Ramp-up, steady state, ramp-down, and duration.
4. **Select the test type.**

   | Type | Question it answers | Typical profile |
   | --- | --- | --- |
   | Load | Does it meet the thresholds at the expected load? | Expected peak, steady state |
   | Stress | Where and how does it fail above the expected load? | Increase until failure |
   | Spike | Does it survive a sudden increase? | Sudden step up and down |
   | Soak | Does it degrade over time (memory leak, connection leak)? | Expected load, many hours |
   | Capacity | What is the maximum load that meets the thresholds? | Steps up, measure at each step |
   | Benchmark | Is this change faster or slower than the baseline? | Fixed, repeatable workload |

5. **Define the thresholds.** For each scenario: a percentile of response time (for example p95), throughput, error rate, and resource limits. Each threshold has a source: a requirement, a service level agreement, or an agent proposal that the owner approved. Do not use averages alone. An average hides the slow tail.
6. **Check the numbers with Little's law:** concurrency = throughput × time in the system. If the numbers in the model do not agree with this law, the model has an error.

## Check the model

- Each scenario links to a risk or a requirement.
- Each share in the workload mix and each threshold has a source or a written assumption.
- The test environment and the production environment are compared, and each difference is recorded (size, data volume, network, external services). Results from a smaller environment do not scale linearly.
- The test data volume is realistic. An empty database gives results that are too fast.

## Coverage items

Each combination of scenario × load profile in the plan. Result: the measured value against each threshold.

## Measurement rules

- Warm up before you measure. Do not measure the ramp-up.
- Repeat the run. Report the variation between runs. One run is not a result.
- Make sure that the load generator is not the bottleneck. Monitor its CPU and network.
- Record the test object version, the environment, the configuration, and the raw data.
- Monitor the server side (CPU, memory, connections, queue length, database) during the test, so that you can explain a failure.

## Anti-patterns

- A threshold with no source, for example "under 1 second" because it sounds good.
- Only average response time.
- A load test on a laptop, reported as production capacity.
- Many virtual users with no think time, called "realistic".

## Sources

- ISO/IEC 25010:2023, performance efficiency characteristic.
- ISTQB Certified Tester Performance Testing Syllabus v1.0 (workload modeling, load profiles).

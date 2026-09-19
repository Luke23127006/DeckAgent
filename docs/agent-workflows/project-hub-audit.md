# Audit Project Hub broadly

Use this workflow for project-wide inconsistency, supersession, or evidence-gap analysis.

1. Prepare the snapshot before the read-only audit: check status, sync if stale/missing, and
   validate. Synchronization writes local snapshot files. If the task explicitly prohibits file
   changes, report missing/stale snapshot state instead of synchronizing. Any review of available
   stale data must state that limitation; a missing snapshot prevents the snapshot audit.
2. Record structural validation failures separately; do not relabel them as semantic findings.
3. Scan all logical TSVs, with particular attention to Decisions, Assumptions, Constraints, Risks,
   Work, Bugs, Evidence, and Traceability.
4. Look for superseded decisions still driving active work, invalidated assumptions still in use,
   risks without mitigation/work, active requirements without work/test/evidence, and evidence that
   contradicts current status.
5. Search by terms and concepts as well as explicit IDs; modeled relationships can be incomplete.
6. Compare findings with relevant GitHub artifacts only where the audit scope calls for it.
7. Return concise findings ordered by impact. Include stable IDs, evidence paths, uncertainty, and
   the missing evidence needed to resolve each uncertain finding.

After snapshot preparation, the audit is read-only. It must not edit Project Hub, snapshots, or
GitHub artifacts.


---
name: principle-prove-it-works
description: "Apply after completing a task, before declaring done. Verify against the real artifact. Run the feature, read the actual value, or inspect the diff. Do not trust a proxy, a self-report, or a claim that it compiles."
disable-model-invocation: true
---

# Prove it works

Verify every task output by checking the real thing directly. Do not infer from proxies, self-reports, or a claim that it compiles.

**Why.** Unverified work has unknown correctness. Indirect verification takes less effort than direct observation and can be wrong. File modification times, output freshness, agent self-reports, and cached screenshots are indirect. Acting on a wrong inference costs far more than checking the source.

Check the real thing, not a proxy.

- Check process liveness directly, not through derived state.
- Read the actual value, not a cached or derived representation.
- When verification fails, suspect the observation method before the system.

## Script the check when you can

The strongest proof is a deterministic script that reruns the same comparison, not a one-time eyeball. Write the script, run it, and keep its output. A reviewer can rerun that artifact instead of trusting your word.

Keep the artifact visible for the human. Commit it only for large or complex work where the trail has to be auditable later, such as a big port or migration.

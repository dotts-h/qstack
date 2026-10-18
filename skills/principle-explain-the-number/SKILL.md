---
name: principle-explain-the-number
description: "Apply before you trust, report, or act on a number you measured. The number may be a speedup, a regression, a throughput, a latency, or an eval result. Find what limits the number, and rule out that the number measured something other than the work you think."
disable-model-invocation: true
---

# Explain the number

- **Ask "why not double?"** Name the resource or code path that bounds the result. A core, a lock, the disk, the network, or the load generator itself can be that bound. Get the limiter from a profile or from system counters taken during a run, then map it to source. A guess from reading the code is not a limiter. If you cannot say why the number is not twice as good, you do not know what you measured.
- **List what else the number could be measuring, and rule out each one with evidence.** The usual suspects include errors, skipped or cached work, and code that never ran. They also include an untuned side left on default settings, noise, and a piece too small to matter end to end.
- **Keep the evidence with the number.** Put the run count, the spread, and the limiter in the notes or a linked artifact.

For a performance number, run the full procedure in the [perf gate playbook](../qstack-mode/playbooks/perf-gate.md). For an eval result, ask the same of the trials. Did every run do the task? Does the gap hold across trials and models? Does the scenario matter?

You skipped this principle when the evidence behind a number has no run count, no spread, or no named limiter. You also skipped this principle when the time saved is larger than the time the changed piece took.

Distinct from [Prove it works](../principle-prove-it-works/SKILL.md), which checks that an output is real.

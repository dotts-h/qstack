### Perf gate

**You own the measurement comparison.** You do not change product code to improve the number.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

The two sides are a baseline and a compared side. They may be the revisions before and after a change, or two accounts or configurations on one build. A trace is one run's timing data saved to a file, such as a CPU profile, a Playwright trace, or the page's performance entries exported as JSON. A CPU profile and a Playwright trace capture the product's scripts. When the run must not capture them, export the performance entries.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Capture a baseline trace on the real UI, CLI, or service before you read the compared side. Record the baseline first.
3. Ground the hypothesis with `../how/SKILL.md`, except in a black-box run. Do not claim a ceiling you have not run.
4. Capture the compared side's trace with the same probe. Interleave baseline and compared runs so they share machine conditions.
5. Parse both artifacts into sqlite and diff them. A result you cannot query is not ready to report.
6. Read `../principle-explain-the-number/SKILL.md` before you report the number. Include the run count, the spread, and the limiter. The limiter comes from a profile or from counters taken during a run. A black-box run takes no profile, so its limiter comes from counters, such as the page's performance entries. List what else the number could be measuring and rule each one out with evidence. When the two sides are unlike scenarios, report absolute values. Do not report a ratio.
7. Separate the delay that a person sees from the time that the driver waits. When the driver waits for something that does not block the product, such as a request that fails slowly while the page keeps responding, report a delay that only automation sees. Name what the driver waits for, cite the counters that show the product kept responding, and say that a person sees no added delay.
8. Write a timing report. Give the method and the clock that timed each run, every run's numbers, the median and the range on each side, the limiter, and each explanation you ruled out.
9. Do not call the gate passed when the comparison is inconclusive or the run used the wrong UI, CLI, or service. Name which half is missing.

**Reply.** The baseline number, the compared side's number, the delta, the run count, the spread, the limiter, any delay that only automation sees, and the paths of the report and the traces. When a half is missing, say the comparison is inconclusive and name that half in the same sentence.

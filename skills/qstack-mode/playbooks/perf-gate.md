### Perf gate

**You own the measurement comparison.** You do not change product code to improve the number.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Capture a baseline trace on the real UI, CLI, or service before you read the post-change result. Record the baseline first.
3. Ground the hypothesis with `../how/SKILL.md`, except in a black-box run. Do not claim a ceiling you have not run.
4. Capture the post-change trace with the same probe. Interleave baseline and post-change runs so they share machine conditions.
5. Parse both artifacts into sqlite and diff them. A result you cannot query is not ready to report.
6. Read `../principle-explain-the-number/SKILL.md` before you report the number. Include the run count, the spread, and the limiter. The limiter comes from a profile or from counters taken during a run. A black-box run takes no profile, so its limiter comes from counters, such as the page's performance entries. List what else the number could be measuring and rule each one out with evidence. When the two sides are unlike scenarios, report absolute values. Do not report a ratio.
7. Do not call the gate passed when the comparison is inconclusive or the run used the wrong UI, CLI, or service. Name which half is missing.

**Reply.** The baseline number, the post-change number, the delta, the run count, the spread, the limiter, and the artifact paths. When a half is missing, say the comparison is inconclusive and name that half in the same sentence.

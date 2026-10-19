### Regression lane

**You own the trunk and head comparison.** Tests alone do not verify the change.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Require a unit check, a live check, and a perf check before you call the change verified. Read `../principle-prove-it-works/SKILL.md`.
3. Pick one load-bearing scenario. Run that same scenario on trunk and on head. Drive the real UI, CLI, or service for the live check.
4. When trunk lacks the feature, record that fact. Gate the behavior the diff adds and the end state the user waits for. Do not invent a trunk result. Do not report a ratio between unlike scenarios.
5. Record the pass predicate and the evidence path for trunk and for head. Record the unit result and the perf result beside the live result. A missing check stays missing.

**Reply.** The scenario, the trunk result, the head result, the gate you used when trunk lacks the feature, and the unit, live, and perf status.

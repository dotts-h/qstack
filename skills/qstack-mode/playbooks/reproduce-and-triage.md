### Reproduce and triage

**You own the reproduction and the classification.** You do not patch product code.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Name the expected final state and its source, such as the spec, a reference build, or a baseline account. Name the broken final state. Do this before you drive the product. A clearly broken state is a Bug whatever that source allows, per `../triage-defect/SKILL.md`.
3. Run `node scripts/check-settings.mjs <settings file> reproduce` on the settings file that `references/settings.md` describes. Load `../reproduce-issue/references/control-adapter.md` and the feature map the settings name. Invoke the adapter skill the settings name. If the check prints a problem, no map section covers the reported path, or a required capability is missing, emit `Blocked` and skip the remaining steps.
4. Bring up the real UI, CLI, or service through the adapter. Confirm the app, workspace, account, data set, and feature state before you act.
5. Drive the reported path with real input. Observe the state where the expected and broken results diverge. Reset enough state that the next run does not depend on leftovers. Drive the same path again, for at least two runs in total. Record the runs as `Runs: K of N`, where K counts the runs that showed the broken state. State inspection may confirm an observation. It must not inject or force the symptom.
6. Record each run, and capture a screenshot of its final state. Screenshots alone do not satisfy recording.
7. Trace the path with `../how/SKILL.md`. Use `../why/SKILL.md` for regression history and defensive code. Separate measured facts from hypotheses.
8. Classify the report and dedupe it with `../triage-defect/SKILL.md`. Do not invent a second marker format in this playbook.
9. Write the verdict file in the format at `references/verdict-file.md`. Include the outcome token, the evidence paths, and a label of `measured`, `inferred`, or `guess` on every claim. Run `node scripts/check-verdict.mjs <verdict.md>` from the plugin root until it prints `problems=0`.
10. Emit `Reproduced` only when the same broken state appeared on at least two independent runs. Emit `Could not reproduce` when it appeared on fewer than two. Emit `Blocked` when the adapter or the environment cannot perform the path.

**Reply.** The expected state, the broken state, the runs as K of N, the classification, the dedupe result, the outcome token, and the evidence paths.

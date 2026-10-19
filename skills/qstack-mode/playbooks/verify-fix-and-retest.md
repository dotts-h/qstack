### Verify fix and retest

**You own the before and after measurement.** The existing artifact owns the fix. Do not edit it. Do not open a competing pull request. Do not merge.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Qualify one artifact. Accept an open pull request with code that addresses the symptom, a merged pull request, or a merged commit with matching code and intent. A claim, a branch name, or a hypothesis without a pull request or commit is not an artifact. When several artifacts exist, choose the one linked from the report. Otherwise choose the closest match and say why.
3. Use an isolated worktree or another clean checkout. Do not overwrite user changes. Record the baseline revision, the patched revision, the artifact URL, and the build inputs shared by both revisions.
4. On the baseline, drive the reported path through the real UI, CLI, or service. Follow `../reproduce-issue/references/verify-existing-fix.md`. Observe the discriminating symptom. Reset and repeat the same path at least once. Record the runs as `Baseline runs: K of N`. Capture a recording, a screenshot, and a state check. Run the checks that cover the touched feature and note which pass. If K is below 2, do not claim the fix works. Write the verdict as `Inconclusive` and skip the patched run.
5. On the patched revision, use the same environment and data. Run the identical user path with a reset between runs. Record the runs as `Patched runs: K of N`, and keep running until N meets the patched run rule in `references/verdict-file.md`. Confirm whether the broken state is gone and whether the expected state is present. Rerun the checks that passed on the baseline. Record each one that now fails in `Pass-to-fail:`, or write `none`. Capture the same kind of evidence as the baseline.
6. A live CPU, heap, or CDP symptom goes to `diagnose-live.md`. A captured cpuprofile, trace, or heapsnapshot goes to `diagnose-trace.md`.
7. The after result comes from the running patched revision. Do not treat a compile, a unit test, or a code review as that result.
8. Write the verdict file in the format at `references/verdict-file.md`. Run `node scripts/check-verdict.mjs <verdict.md>` from the plugin root. Fix every line it prints.
9. Emit `Confirmed` when the run record meets the `Confirmed` rule in `references/verdict-file.md`. Emit `Insufficient fix` when a patched run shows the symptom or a check went from pass to fail. Emit `Inconclusive` when the baseline does not reproduce, the patched revision cannot run, or the evidence does not show the discriminating state.
10. Stop both builds and remove temporary profiles. Do not discard user work. Do not discard the evidence you cite.

**Reply.** The artifact URL, the baseline and patched runs as K of N, the pass-to-fail checks, the outcome token, and which half was missing when the token is `Inconclusive`.

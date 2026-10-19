# Verify an existing fix

Use this mode when an open pull request or merged commit plausibly fixes the report.

The existing artifact owns the fix. Verify it on the real UI or CLI. Do not edit it, author a competing patch, or open another pull request.

## Qualify the artifact

Require one concrete artifact:

- An open pull request with code changes that address the symptom
- A merged pull request
- A merged commit with matching code and intent

A thread claim, tracker status, branch name, or cause hypothesis without a pull request or commit is not enough.

When several artifacts exist, choose the one linked from the report or tracker. Otherwise choose the closest match to the affected code and state why.

## Protect the working tree

Use an isolated worktree or another clean checkout when the repository supports it. Do not overwrite user changes.

Record:

- Baseline revision
- Patched revision
- Pull request or commit URL, or the commit SHA when the commit has no URL
- Build and environment inputs shared by the baseline and patched builds

Use regular `github.com` pull request links.

## Measure the baseline

For an open pull request, use its base branch as the baseline.

For a merged fix, use the revision immediately before the fix when that revision builds and represents the old behavior.

Through the configured control adapter:

1. Bring up the baseline app.
2. Confirm the correct app and environment.
3. Run the reported path through real UI actions, or through the real CLI command when that is the user path.
4. Observe the discriminating symptom.
5. Reset and repeat it. Record the runs as `Baseline runs: K of N`, where K counts the runs that showed the symptom.
6. Capture baseline recording, screenshot, and state check.
7. Run the checks that cover the touched feature and note which pass.

If K is below 2, there is no baseline. Do not claim that the fix works.

Do not call internal state setters to force the symptom on either build.

## Measure the patched build

Build and run the pull request or fix commit with the same environment and data.

1. Run the same path.
2. Repeat it with a reset between runs until the run count meets the patched run rule in [`../../qstack-mode/references/verdict-file.md`](../../qstack-mode/references/verdict-file.md). Record the runs as `Patched runs: K of N`.
3. Confirm that the broken state is gone.
4. Confirm the expected state appears.
5. Rerun the checks that passed on the baseline. Record each one that now fails in `Pass-to-fail:`, or write `none`.
6. Capture after recording, screenshot, and the same state check.

Do not stop at compilation or tests. The after result must come from a running patched app.

## Outcomes

Return one structured result in the reproduce-issue verdict. Interactive sessions put it in the reply. An automated thread may post it only after the source preflight, and only for Confirmed or Insufficient fix.

### Confirmed

The baseline reproduces on at least two runs, every patched run passes, the patched run count is high enough, and no check went from pass to fail.

- Outcome is `Confirmed`.
- Link the artifact.
- Include the before and after result.
- Open no pull request.

### Insufficient fix

The baseline reproduces, and a patched run still shows the symptom or a check went from pass to fail.

- Outcome is `Insufficient fix`.
- Link the artifact and say it did not resolve the symptom.
- Open no competing pull request.

### Inconclusive

The baseline does not reproduce, the patched app cannot run, or the evidence does not show the discriminating state.

- Outcome is `Inconclusive`.
- Do not claim success.
- State which half could not be measured.
- Automated runs keep this result in the operations thread or run output and do not post it to the source thread unless a direct question requires an answer.

## Cleanup

Stop both builds, remove temporary profiles and captures as `control.artifact_retention_hours` allows, and return the repository to its prior state without discarding user work.

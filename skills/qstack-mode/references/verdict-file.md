# Verdict file

A verdict file records one QA outcome with the runs and artifacts behind it. `scripts/check-verdict.mjs` enforces this format. Run `node scripts/check-verdict.mjs <verdict.md>` from the plugin root. It prints one summary line, then one line for each problem. Fix the problems and run it again until the summary line ends in `problems=0`.

## Sections

Start with an H1 title. Then write these sections in this order:

1. `## Verdict` holds one outcome token and its label of `measured`, `inferred`, or `guess`.
2. `## Expected and broken state` names the expected state and the broken or observed state.
3. `## Surface and runs` holds the run record.
4. `## Evidence` cites the artifacts.

When the run also wrote a defect report with [the triage-defect skill](../../triage-defect/SKILL.md), add it as `## Triage` after `## Evidence`. Leave out the parts that the sections above already hold, such as the expected and observed states and the environment. Start each remaining part with its label, such as `Route: owner unclear`.

The outcome tokens are `Reproduced`, `Could not reproduce`, `Blocked`, `Confirmed`, `Insufficient fix`, `Inconclusive`, `PASS`, `PASS+NOTES`, `FAIL`, `Pass`, `Fail`, and `Unproven`.

The first six are the outcomes of [the reproduce-issue skill](../../reproduce-issue/SKILL.md). Each of them adds two lines under `## Verdict`:

- `Fix artifact:` holds the URL of the pull request or commit under test, or says `none`. `Confirmed` and `Insufficient fix` need the URL.
- `Missing:` names the capability or fact that the run lacked, or says `none`. `Blocked` must name it.

Outside code, use straight quotes and no long dashes.

## Run record

Write each field once, on its own line, in `## Surface and runs`.

- `Surface:` names the UI, CLI, API, browser, desktop, mobile, harness, or trace surface.
- `Environment:` names the build or revision, the platform, the data set, and the seed.
- `Order:` names the run order and the reset between runs, such as a fresh process or profile.
- `Runs: K of N` counts N runs that reached the divergence. K of them showed the broken state. A run showed it when one of its own artifacts shows it, such as its video, its screenshot, or its run log. The video alone is enough when the state was gone before the screenshot.
- `Baseline runs: K of N` and `Patched runs: K of N` replace `Runs:` when you verify a fix.
- `Pass-to-fail:` names the checks that passed on the baseline and fail on the patched revision, or says `none`.

`Blocked`, `Inconclusive`, and `Unproven` need only `Surface:` and `Environment:`. Every other outcome also needs `Order:` and at least two runs in each count.

| Outcome | Run rule |
|---|---|
| `Reproduced` | K is at least 2 |
| `Could not reproduce` | K is below 2 |
| `Confirmed` | Baseline K is at least 2, patched K is 0, patched N meets the table below, and `Pass-to-fail: none` |
| `Insufficient fix` | Baseline K is at least 2, and a patched run failed or a check went from pass to fail |
| `PASS`, `PASS+NOTES`, `Pass` | K is 0 |
| `FAIL`, `Fail` | K is at least 1 |

An intermittent bug needs more clean patched runs, because a fix with no effect can pass a few runs by chance. When every baseline run failed, 2 clean patched runs are enough. Otherwise, with a baseline of K of M, the patched N is the smallest number of at least 2 for which `(1 - K/M) ** N <= 0.05`. A fix with no effect then passes every patched run with at most a 5% chance, assuming independent runs. The checker prints the N it needs. Some examples:

| Baseline runs | Clean patched runs needed |
|---|---|
| 2 of 2 | 2 |
| 2 of 3 | 3 |
| 2 of 4 | 5 |
| 2 of 6 | 8 |
| 2 of 10 | 14 |

## Evidence

Backticks in `## Evidence` mark artifacts. Cite each artifact as a URL, an absolute path, or a path relative to the verdict file, with no spaces in the path. A path may end in a line suffix such as `:12`. Every backticked token that names a file must exist and must not be empty when the checker runs, so run the checker before cleanup. A token with a slash or a file extension counts as a file name, so keep code names such as method calls out of backticks in this section.

`Reproduced`, `Confirmed`, and `Insufficient fix` also need a recording. A recording is a video ending in `.webm`, `.mp4`, `.mov`, or `.mkv`. A trace also counts, as a `.trace` file or a `.zip` file with `trace` in its name. Screenshots alone do not count.

## Examples

### Reproduction

```markdown
# Saved filter disappears after reload

## Verdict

Reproduced. Measured.
Fix artifact: none
Missing: none

## Expected and broken state

Expected: the saved filter is still selected after a reload.
Broken: the filter list is empty after a reload.

## Surface and runs

Surface: browser UI through Playwright
Environment: build 4f2c1a9, Windows 11, Chromium 156, fixture team-small, seed 7
Order: runs 1 to 3 in sequence, fresh browser profile per run
Runs: 2 of 3 showed the broken state

## Evidence

- `captures/run-1.png`
- `captures/run-3.png`
- `captures/run-1-trace.zip`

## Triage

Classification: Bug
Duplicate: No match
Cause trace: hypothesis, the filter list renders before the saved filters load
Related: none
Route: owner unclear
```

### Fix verification

```markdown
# Verify the saved filter fix

## Verdict

Confirmed. Measured.
Fix artifact: https://github.com/OWNER/REPO/pull/123
Missing: none

## Expected and broken state

Expected: the saved filter is still selected after a reload.
Broken: the filter list is empty after a reload.

## Surface and runs

Surface: browser UI through Playwright
Environment: baseline 4f2c1a9, patched 9b7e3d0, Windows 11, Chromium 156, fixture team-small, seed 7
Order: 3 baseline runs, then 3 patched runs, fresh browser profile per run
Baseline runs: 2 of 3 showed the broken state
Patched runs: 0 of 3 showed the broken state
Pass-to-fail: none

## Evidence

- `captures/baseline-run-1.png`
- `captures/baseline-run-1.webm`
- `captures/patched-run-3.png`
- `captures/patched-run-3.webm`
```

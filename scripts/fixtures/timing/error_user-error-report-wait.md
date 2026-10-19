# error_user Each click that logs an error holds a failing error report open for about 3.4 seconds

## Verdict

Reproduced. Measured. 2 of 2 interleaved fresh-session runs showed the wait on every error click.
Fix artifact: none
Missing: none

## Expected and broken state

Expected: List Add to cart, list Remove and opening a product page take as long as for standard_user, 1369 to 1453 ms per playwright-cli click, and send no error report (standard_user baseline, measured).

Broken: each of these clicks sends an error report that stays open for seconds and fails, and the click command waits for it.

Observed: in both error_user runs each of the three clicks sent one fetch to https://submit.backtrace.io/UNIVERSE/TOKEN/json, starting 1358 to 1385 ms into the step and lasting 3399 to 3524 ms (measured). The console reported the fetch blocked by CORS policy and ending in net::ERR_FAILED (measured). The clicks took 4773 to 4908 ms against 1369 to 1453 ms for standard_user, while Back to products, which logs no error, took 1377 to 1389 ms against 1352 to 1371 ms (measured). No longtask or long-animation-frame entry fell in any step window for either account, so the page kept responding and a person sees no added delay (inferred). The delay shows in automation that waits for network quiet (measured for playwright-cli).

## Surface and runs

Surface: browser UI driven headless through playwright-cli 0.1.22, timed with the page's performance timeline (resource, longtask and long-animation-frame entries) and the CLI command durations
Timing: the page's performance timeline (resource, longtask and long-animation-frame entries) and the playwright-cli command durations
Environment: www.saucedemo.com production site on 2026-10-19, Windows 11 build 26200, Chrome 155, viewport 1280x720, accounts error_user and standard_user, no seed
Order: 4 runs at 07:47 to 07:50 UTC, interleaved with standard_user first in each pair, each in a fresh playwright-cli session with an in-memory profile that was closed after the run, with nothing else driving a browser
Runs: 2 of 2 showed the broken state

## Evidence

- `../perf/report.md` holds the method, every run's numbers, the limiter and the explanations ruled out, in the section on error_user clicks.
- `../perf/perf.sqlite` holds the runs in tables err_steps, err_tasks and err_resources.
- `../perf/errclicks/sauce-perf3-std-1-r2.json` step timings and entries, order 1.
- `../perf/errclicks/sauce-perf3-error-1-r2.json` step timings and entries, order 2.
- `../perf/errclicks/sauce-perf3-std-2-r2.json` step timings and entries, order 3.
- `../perf/errclicks/sauce-perf3-error-2-r2.json` step timings and entries, order 4.
- `../perf/errclicks/sauce-perf3-error-1-r2.log` command log with the CORS console error, order 2.
- `../perf/errclicks/sauce-perf3-error-2-r2.log` command log with the CORS console error, order 4.
- `../perf/errclicks/sauce-perf3-error-1-r2-final.png` final state, order 2.
- `../repro/error_user-list-add-three-products/run1.log` shows the same slow clicks in an earlier fresh-session run.
- `../perf3.ps1` is the probe and `../perf3db.py` loads it into sqlite.

## Triage

Classification: not chosen. The page stays responsive and only automation waits, so whether this counts as a defect is a call for a person (inferred).
Duplicate: No match. I searched only this run's notes and verdict files, since no tracker is configured (measured).
Cause trace: unavailable. The discovery rules forbid reading the site's source, and the how and why skills need repository access, so the facts below come from the page's timing entries and console only.
- Fact. The wait is one fetch to submit.backtrace.io per click that logs an error, ending in net::ERR_FAILED after a CORS block (measured).
- Fact. No main-thread long task occurs during these clicks (measured).
- Hypothesis. The UNIVERSE and TOKEN placeholders mean the error reporter was never configured (guess).
Related: error_user-detail-description-missing.md, error_user-list-add-three-products.md and error_user-list-remove-no-effect.md log the errors that trigger the report.
Route: owner unclear. routing.map_path is unset, so nothing was filed or routed.

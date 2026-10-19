# performance_glitch_user Every inventory render blocks the page for about 5 seconds

## Verdict

Reproduced. Measured. 5 of 5 interleaved fresh-session login runs showed the delay.
Fix artifact: none
Missing: none

## Expected and broken state

Expected: after the login click the inventory renders as fast as for standard_user, whose first product image request starts 26 to 40 ms after the click with no long task, and later renders of the inventory run no long task (standard_user baseline, measured).

Broken: one main-thread task blocks the page for about 5000 ms before the inventory renders, at login and on every later render of the inventory.

Observed: in 5 of 5 runs a long task of 5004 to 5008 ms started 4 to 12 ms after the login click, and the first product image request started 5028 to 5043 ms after the click, median 5035 ms, against 26 to 40 ms, median 32 ms, for standard_user (measured). Every later inventory render measured ran one long task of 4999 to 5003 ms: sort, Back to products, Continue Shopping, Cancel on the overview, All Items and browser Back, in 24 of 24 valid measurements, against none in 22 standard_user measurements (measured). Network, cache, CLI overhead, machine load and page load are ruled out in the report (measured). In the exploration run, playwright-cli's 5-second action timeout ran out on 6 of these commands although each action took effect (measured).

## Surface and runs

Surface: browser UI driven headless through playwright-cli 0.1.22, timed with the page's performance timeline (first-input, resource, longtask and long-animation-frame entries)
Timing: the page's performance timeline (first-input, resource, longtask and long-animation-frame entries)
Environment: www.saucedemo.com production site on 2026-10-19, Windows 11 build 26200, Chrome 155, viewport 1280x720, accounts performance_glitch_user and standard_user, no seed
Order: 10 login runs at 07:11 to 07:16 UTC, then 8 step runs at 07:29 to 07:37 UTC, interleaved with standard_user first in each pair, each in a fresh playwright-cli session with an in-memory profile that was closed after the run, with nothing else driving a browser
Runs: 5 of 5 showed the broken state

## Evidence

- `../perf/report.md` holds the method, every run's numbers, the limiter and the explanations ruled out.
- `../perf/perf.sqlite` holds every run (tables runs, resources, tasks, steps, step_tasks).
- `../perf/perf.summary.json` summarizes the login series.
- `../perf/runs/sauce-perf-std-1.json` raw timing entries, login run order 1.
- `../perf/runs/sauce-perf-glitch-1.json` raw timing entries, login run order 2.
- `../perf/runs/sauce-perf-std-2.json` raw timing entries, login run order 3.
- `../perf/runs/sauce-perf-glitch-2.json` raw timing entries, login run order 4.
- `../perf/runs/sauce-perf-std-3.json` raw timing entries, login run order 5.
- `../perf/runs/sauce-perf-glitch-3.json` raw timing entries, login run order 6.
- `../perf/runs/sauce-perf-std-4.json` raw timing entries, login run order 7.
- `../perf/runs/sauce-perf-glitch-4.json` raw timing entries, login run order 8.
- `../perf/runs/sauce-perf-std-5.json` raw timing entries, login run order 9.
- `../perf/runs/sauce-perf-glitch-5.json` raw timing entries, login run order 10.
- `../perf/runs/sauce-perf-glitch-1.log` command log of login run order 2.
- `../perf/runs/sauce-perf-glitch-1-final.png` final state of login run order 2.
- `../perf/steps/sauce-perf2-std-3-r2.json` step timings, step run order 5.
- `../perf/steps/sauce-perf2-glitch-3-r2.json` step timings, step run order 6.
- `../perf/steps/sauce-perf2-std-4-r2.json` step timings, step run order 7.
- `../perf/steps/sauce-perf2-glitch-4-r2.json` step timings, step run order 8.
- `../perf/steps/sauce-perf2-glitch-2-r2.json` step timings, step run order 4.
- `../paths/performance_glitch_user/transcript.log` exploration run with CLI timings.
- `../paths/standard_user/transcript.log` baseline exploration run with CLI timings.
- `../setup/probe2-performance_glitch_user.log` first timing probe.
- `../perf.ps1` and `../perf2.ps1` are the probes, and `../perfdb.py` and `../perf2db.py` load them into sqlite.

## Triage

Classification: Performance (measured).
Duplicate: No match. I searched only this run's notes and verdict files, since no tracker is configured (measured).
Cause trace: unavailable. The discovery rules forbid reading the site's source, and the how and why skills need repository access, so the facts below come from the page's timing entries only.
- Fact. One main-thread task of 4999 to 5008 ms runs on every measured inventory render (measured).
- Fact. No request other than the favicon starts during the login task, and the favicon starts as the task ends (measured).
- Hypothesis. The task is a deliberate fixed delay, since 29 task durations span only 9 ms (guess).
Related: none
Route: owner unclear. routing.map_path is unset, so nothing was filed or routed.

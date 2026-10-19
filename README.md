# qstack

qstack is a Cursor plugin for QA engineering. The version in `.cursor-plugin/plugin.json` is 0.1.0. This folder is the plugin root.

## Entry points

The entry points are `/qstack-mode` and `/setup-qstack`.

- [`/qstack-mode`](skills/qstack-mode/SKILL.md) runs a structured QA workflow.
- [`/setup-qstack`](skills/setup-qstack/SKILL.md) configures the models that the how and why skills give their subagents. The same command sets the reasoning budget.

## Playbooks

The playbooks are in `skills/qstack-mode/playbooks/`.

### Core playbooks

There are six core playbooks.

- [Explore and charter](skills/qstack-mode/playbooks/explore-and-charter.md) covers a new area or a test plan before a run.
- [Reproduce and triage](skills/qstack-mode/playbooks/reproduce-and-triage.md) reproduces a report and classifies it.
- [Verify fix and retest](skills/qstack-mode/playbooks/verify-fix-and-retest.md) measures an existing pull request or commit.
- [Regression and parity](skills/qstack-mode/playbooks/regression-and-parity.md) grades a diff for behavior and pixels.
- [Release gate](skills/qstack-mode/playbooks/release-gate.md) grades a stack before merge.
- [Automate check](skills/qstack-mode/playbooks/automate-check.md) creates, audits, or pins a verification skill.

### Focused playbooks

There are seven focused playbooks.

- [Diagnose live](skills/qstack-mode/playbooks/diagnose-live.md) diagnoses a live CPU, heap, or CDP symptom.
- [Diagnose trace](skills/qstack-mode/playbooks/diagnose-trace.md) diagnoses a captured cpuprofile, trace, or heapsnapshot.
- [Visual parity](skills/qstack-mode/playbooks/visual-parity.md) compares screenshots against a baseline, routes each visual change to a person, and sends each behavior change to reproduce and triage.
- [Characterization pin](skills/qstack-mode/playbooks/characterization-pin.md) records current behavior before structure moves.
- [Regression lane](skills/qstack-mode/playbooks/regression-lane.md) runs one load-bearing scenario on trunk and on head.
- [Flake triage](skills/qstack-mode/playbooks/flake-triage.md) classifies a red CI check before any retrigger.
- [Perf gate](skills/qstack-mode/playbooks/perf-gate.md) compares a baseline with the measurement after a change, or on another account or configuration.

## Skills

There are twelve QA skills in `skills/`. The ten principles in the next section are skills in that folder too.

- [qstack-mode](skills/qstack-mode/SKILL.md)
- [setup-qstack](skills/setup-qstack/SKILL.md)
- [reproduce-issue](skills/reproduce-issue/SKILL.md)
- [triage-defect](skills/triage-defect/SKILL.md)
- [in-your-own-words](skills/in-your-own-words/SKILL.md)
- [how](skills/how/SKILL.md)
- [why](skills/why/SKILL.md)
- [blast-radius](skills/blast-radius/SKILL.md)
- [create-verification-skill](skills/create-verification-skill/SKILL.md)
- [maintain-verification-skill](skills/maintain-verification-skill/SKILL.md)
- [regression-pin](skills/regression-pin/SKILL.md)
- [unslop](skills/unslop/SKILL.md)

## Verification principles

There are ten verification principles in `skills/`.

- [Prove it works](skills/principle-prove-it-works/SKILL.md) checks the real artifact before you call the work done.
- [Test behavior, not implementation](skills/principle-test-behavior-not-implementation/SKILL.md) asserts what users of the code can observe.
- [Fix root causes](skills/principle-fix-root-causes/SKILL.md) traces a symptom to the first wrong decision and fixes it there.
- [Attack the premise](skills/principle-attack-the-premise/SKILL.md) tests the shared premise when fixes fail the same gate.
- [Sequence work into verifiable units](skills/principle-sequence-verifiable-units/SKILL.md) checks each small unit before the next one starts.
- [Make operations idempotent](skills/principle-make-operations-idempotent/SKILL.md) keeps a repeated run on the same end state.
- [Explain the number](skills/principle-explain-the-number/SKILL.md) names the run count, the spread, and the limiter before you trust a measurement.
- [Build the lever](skills/principle-build-the-lever/SKILL.md) builds the tool that does the work or proves it.
- [Never block on the human](skills/principle-never-block-on-the-human/SKILL.md) proceeds on reversible work and shows the result.
- [Encode lessons in structure](skills/principle-encode-lessons-in-structure/SKILL.md) turns a repeated instruction into a check instead of more text.

## Host tools

These files are the host tools.

- `agents/qstack-agent.md` is the delegate for reproduction, verification, and forensic tasks.
- `scripts/log.mjs` appends one phase decision to a log file.
- `scripts/check-verdict.mjs` checks a written verdict file against `skills/qstack-mode/references/verdict-file.md`.
- `scripts/check-settings.mjs` checks a project settings file against `skills/qstack-mode/references/settings.md`.
- `scripts/check-markdown.mjs` checks every markdown file in the plugin for skill frontmatter, links, anchors, cited paths, long dashes, and curly quotes.

Run `node --test` from the plugin root to test the checkers and to run the markdown check over the plugin.

## Load it locally

Put a real copy of this folder at the local plugin path. Cursor skips a symlink there when it points elsewhere on disk.

On Windows, use `%USERPROFILE%\.cursor\plugins\local\qstack`.
On macOS or Linux, use `~/.cursor/plugins/local/qstack`.

A git worktree is a real folder that still tracks this repository. From the repository root on Windows, run this:

```powershell
git worktree add --detach "$env:USERPROFILE\.cursor\plugins\local\qstack" <branch>
```

Then run Developer: Reload Window, or restart Cursor, and check that the qstack skills appear under Customize. On Teams and Enterprise plans, the Allow Local Plugin Imports admin setting controls this folder, and it is off by default on Enterprise.

## Drive a web app

qstack drives web apps through the Playwright CLI. Install it, its agent skill, and the video encoder once:

```shell
npm install -g @playwright/cli@latest
playwright-cli install --skills -g
playwright-cli install-browser ffmpeg
```

Then write the project settings file that `skills/qstack-mode/references/settings.md` describes, or run `/setup-qstack` to write it.

## Layout

Cursor discovers a component from its default folder when `.cursor-plugin/plugin.json` does not set a path for that component. The locations below come from the [plugins reference](https://cursor.com/docs/plugins/building).

| Component | Default location |
| --- | --- |
| Skills | `skills/` |
| Rules | `rules/` |
| Agents | `agents/` |
| Commands | `commands/` |
| Hooks | `hooks/hooks.json` |
| MCP servers | `mcp.json` |

Each skill lives in `skills/<name>/SKILL.md`. Its frontmatter needs `name` and `description`.

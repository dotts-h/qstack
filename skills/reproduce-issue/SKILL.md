---
name: reproduce-issue
description: "Reproduce reported defects through the target app's real UI or CLI on at least two recorded runs, verify existing fixes against baseline and patched builds, and emit a checked verdict file. Use for /reproduce-issue."
disable-model-invocation: true
---

# Reproduce an issue

Reproduce a reported defect on the target app's real UI or CLI. Verify an existing fix when one exists. Emit one structured verdict. This skill does not author a product fix or open a pull request.

It runs in two settings.

- **Interactive.** The report is the user's message, a local description, or a tracker ticket. Return the verdict in the reply.
- **Automated thread.** A configured source thread supplies the report. Post only under that thread, and only when the rules below allow it.

Load [`references/control-adapter.md`](references/control-adapter.md) before driving the app. If the adapter, a required capability, or the completed feature map is missing, stop. Do not treat a screenshot of the wrong app, a unit test, a state mutation, or a source reading as a reproduction.

Run the verdict text through [`../unslop/SKILL.md`](../unslop/SKILL.md) before you show it or post it.

## Hard rules

- A `Reproduced` verdict needs the discriminating symptom on at least two runs through the real surface, with a state reset between runs. Count every run that reached the divergence, including the runs that did not show the symptom.
- Name the correct final state and the broken final state before you call it reproduced.
- State inspection may confirm an observation. It must not inject the symptom. Do not call internal state setters, hidden methods, storage writes, or DOM injection to create the symptom.
- An existing pull request or commit switches the run to verify mode. Follow [`references/verify-existing-fix.md`](references/verify-existing-fix.md). Do not edit that artifact or open another pull request.
- No confirmed reproduction means no claim that a fix works.
- Keep captures, recordings, logs, and tokens out of source control.
- When you cite a pull request, use its `github.com` link.

## 1. Take the report

### Interactive

Read the whole report before driving anything. Capture the action path, expected behavior, observed behavior, frequency, version, environment, platform, attachments, and any linked commit or pull request.

### Automated thread

Use this subsection only when an automation trigger supplies a source channel. Otherwise stay on the interactive path. Fail closed when the thread contract is incomplete.

1. Require the trigger channel to equal the configured source channel.
2. Set `SOURCE_THREAD_TS` to `trigger.thread_ts` when present. Otherwise use `trigger.ts`.
3. Require a nonempty `SOURCE_THREAD_TS`.
4. Store `SOURCE_CHANNEL_ID` and `SOURCE_THREAD_TS` as immutable values.
5. Read the source thread and verify its root has those coordinates.
6. Fetch the source permalink.

Never replace those values with a reply timestamp or a status-message timestamp. Never post a root message in the source channel. The coordinator is the only poster. Every child prompt forbids Slack writes, and no child receives a Slack token.

When the automation requires a triage marker, wait for the configured budget and stay silent. Accept a marker only from the configured triage identity, as a reply under `SOURCE_THREAD_TS`, containing exactly one marker. Default markers, unless config names others:

```text
[qstack:bug]
[qstack:bug] tracker=https://tracker.example/issue/123
[qstack:performance]
[qstack:performance] tracker=https://tracker.example/issue/123
[qstack:other]
```

Proceed only for `bug` or `performance`. Stop for `other`, a missing verdict, an untrusted author, conflicting markers, or a timeout.

If `slack.operations_channel_id` is configured, one root status message may exist there. Never confuse its coordinates with the source coordinates. If no operations channel is configured, keep status in the run output.

Re-read the thread before driving. If an open pull request or merged commit plausibly fixes the report, switch to verify mode. A claim without a commit or pull request is not a fix artifact. If a person is fixing it and no artifact exists yet, still reproduce, and do not start a product change.

## 2. Load the control adapter

Find the settings file that [`../qstack-mode/references/settings.md`](../qstack-mode/references/settings.md) describes. Run `node scripts/check-settings.mjs <settings file> reproduce` from the plugin root. When the file is missing or the checker prints a problem, the outcome is `Blocked`, and `Missing:` names the settings file and each problem.

Read [`references/control-adapter.md`](references/control-adapter.md) and the completed map at `control.feature_map_path`, then invoke the skill named by `control.skill_name`.

Read the feature-map section that matches the reported user path before driving. If no section covers the feature, mark the run blocked. Do not invent a path or a selector.

Require every capability in the control-adapter contract, including bring-up, real UI or CLI driving, read-only inspection, screenshots, recording, reset, and cleanup. Screenshots alone do not satisfy recording. If any required capability is missing, the outcome is `Blocked`.

## 3. Study the report

Collect the exact action path, the expected behavior, the observed behavior, the state where they diverge, the frequency, the version and platform, attachments, and error signatures.

Inspect screenshots and video. Use read-only workers for code history, blast radius, and media review when useful. Each worker gets a narrow question and no permission to post or to edit the product.

Trace the reported action with [`../how/SKILL.md`](../how/SKILL.md). Use [`../why/SKILL.md`](../why/SKILL.md) when the report looks like a regression or touches defensive code. Form competing cause hypotheses and name the evidence that would separate them. This pass prepares the reproduction. It is not a license to patch.

In a [black-box run](../qstack-mode/SKILL.md#non-negotiables), skip the code history and both traces. Form the hypotheses from the report and from what the surface shows.

## 4. Reproduce on independent runs

Bring the target up through the control adapter. Confirm the app, workspace, account, data set, and feature state from stable markers before acting.

Drive the reported path on the real surface. Use clicks, typing, keys, scrolling, drag, or navigation for a UI. Use the real command for a CLI.

Before calling it reproduced:

1. Name the correct final state.
2. Name the broken final state.
3. Reach the point where they diverge.
4. Observe the broken state.
5. Reset enough state that the next run is independent. A reload of the same dirty session does not count.
6. Repeat the same path and record whether the same broken state appeared.
7. Cross-check a real state value when one is available. Read it. Do not write it.

An expected dialog, loading state, or setup step is not the bug. Capture the final state that distinguishes correct from broken behavior.

Use the configured repro budget when one exists. Otherwise make at least two runs. Record them as `Runs: K of N`, where N counts the runs that reached the divergence and K counts the runs that showed the broken state. A run that never reached the divergence is a driving problem. Fix the drive and do not count it. If K is below 2, the outcome is `Could not reproduce`. If the environment cannot provide a required capability, the outcome is `Blocked`, and the verdict names what was missing.

Before declaring an environment block, restate the defect without platform-specific nouns and try a safe translation only when it tests the same behavior. Label translated evidence as translated. Hardware prompts, operating-system permission dialogs, device-only APIs, and unavailable account states may still be real blocks.

## 5. Capture evidence

For a confirmed reproduction:

- Record the full path through the symptom.
- Capture a screenshot of the broken final state. On a CLI, the screenshot is the terminal showing the command and the broken output.
- Save a short note with the exact steps and the observed state.
- Keep artifacts in `control.artifact_directory`.

A run whose screenshot missed the broken state can still count. The [run record](../qstack-mode/references/verdict-file.md#run-record) names the artifacts that may show it.

A read-only reviewer answers one question. Does the evidence show the discriminating broken state? If the answer is no or uncertain, the reproduction is not confirmed.

## 6. Verify an existing fix

When a fix pull request or commit exists, follow [`references/verify-existing-fix.md`](references/verify-existing-fix.md).

The baseline must show the symptom on at least two runs. The patched build must pass every run, with enough runs for the baseline rate. An intermittent baseline needs more clean patched runs. Every run uses the real surface. Do not stop at compilation or unit tests.

## 7. Emit the verdict

Write the verdict file in the format at [`../qstack-mode/references/verdict-file.md`](../qstack-mode/references/verdict-file.md), including the `Fix artifact:` and `Missing:` lines that it requires under `## Verdict`. The outcome token is `Reproduced`, `Could not reproduce`, `Blocked`, `Confirmed`, `Insufficient fix`, or `Inconclusive`. Run `node scripts/check-verdict.mjs <verdict.md>` from the plugin root until it prints `problems=0`.

Interactive runs return that verdict and post nothing.

Automated runs update the operations status first. For `Could not reproduce`, `Blocked`, or `Inconclusive`, post nothing in the source thread. For a confirmed reproduction, or for an existing fix that was measured, preflight the source parent and post at most one reply under `SOURCE_THREAD_TS`. Say the outcome, link the operations thread and tracker when they exist, and include at most three short findings. If the post cannot be verified as a reply, do not retry at the root.

## 8. Clean up

Watch a configured follow-up window only when this run is automated. Answer a direct question from evidence already gathered. Apply one concrete correction and rerun the reproduction once when it invalidates the setup. Stop when asked.

Always call the adapter's cleanup. Keep artifacts only as long as `control.artifact_retention_hours` allows. Cleanup must not delete user work.

## Stop before a product fix

A confirmed reproduction with no existing fix is the handoff. Do not implement a patch, edit product code, add a regression test as a product change, or open a draft pull request from this skill. Pinning a check is [`../regression-pin/SKILL.md`](../regression-pin/SKILL.md), and only when that skill is invoked.

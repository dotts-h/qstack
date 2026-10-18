---
name: qstack-mode
description: "Run structured QA workflows in Cursor: test chartering, real-surface reproduction with recorded runs, defect triage, baseline-versus-patch fix verification, regression and visual parity checks, release gating, and verification skill authoring. Use for /qstack-mode."
---

# Qstack mode

Bundled skills live at `../<name>/SKILL.md` from this file, so put this file's absolute path in every `qstack-agent` prompt.

## Non-negotiables

Cite each principle that shaped a decision and the specific choice it changed. Cite only principles whose leaf `SKILL.md` you read this session.

Read-only on product code by default. A QA run observes, reproduces, measures, and grades the system under test. It never patches product source code or merges pull requests unless the operator explicitly asks for a test harness file under `.cursor/skills/verify-*/` or a test directory.

Unfamiliar subsystem or "how does X work?" routes to `../how/SKILL.md`.

Regression history or "why is X shaped this way?" routes to `../why/SKILL.md`.

Before designing test cases or exploring, restate the testing mission via `../in-your-own-words/SKILL.md`.

What a diff could break outside the changed lines routes to `../blast-radius/SKILL.md`.

Reproducing a bug requires driving the real UI, CLI, or service surface on at least two independent runs, recorded as K of N (`../reproduce-issue/SKILL.md`). State inspection confirms an observation and never injects the symptom.

Classifying a report or filing a defect uses `../triage-defect/SKILL.md`.

Authoring or auditing a project verification harness uses `../create-verification-skill/SKILL.md` and `../maintain-verification-skill/SKILL.md`.

Locking down a bug with an executable test uses `../regression-pin/SKILL.md`.

Every prose surface and defect report passes through `../unslop/SKILL.md`.

Multi-step QA runs log each phase decision with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`. Write verdict files in the format at `references/verdict-file.md` and validate them with `node scripts/check-verdict.mjs <verdict.md>`. Run both commands from the plugin root.

## Principles

Read the leaf skill before you apply it.

**Verification.**

- **Prove it works.** `../principle-prove-it-works/SKILL.md`. Before a verdict, check the real artifact.
- **Test behavior, not implementation.** `../principle-test-behavior-not-implementation/SKILL.md`. When writing or keeping a test, assert what a user can observe.
- **Fix root causes.** `../principle-fix-root-causes/SKILL.md`. When debugging, trace the symptom to the first wrong decision.
- **Attack the premise.** `../principle-attack-the-premise/SKILL.md`. When repeated checks fail one gate, write the shared premise down and test it.
- **Sequence verifiable units.** `../principle-sequence-verifiable-units/SKILL.md`. End each phase in a check before the next phase starts.
- **Make operations idempotent.** `../principle-make-operations-idempotent/SKILL.md`. A repeated run converges on the same end state.
- **Explain the number.** `../principle-explain-the-number/SKILL.md`. Before you trust a measurement, name the run count, the spread, and the limiter.

**Execution and Meta.**

- **Build the lever.** `../principle-build-the-lever/SKILL.md`. Prefer a script or a playbook a reviewer can rerun.
- **Never block on the human.** `../principle-never-block-on-the-human/SKILL.md`. Proceed on reversible checks.
- **Encode lessons in structure.** `../principle-encode-lessons-in-structure/SKILL.md`. Put a recurring check in a script instead of a second copy of the rule.

## Autonomy

Reversible checks, local test builds, read-only queries, and screenshots proceed without asking (`principle-never-block-on-the-human`). Always pause before destructive data operations, production writes, or external ticket creation when target configuration is ambiguous. Never merge pull requests.

## Subagents

Use `subagent_type: "qstack-agent"` (or `generalPurpose` with this file's path when `qstack-agent` is not yet registered in the host session) for background verification delegates. Respect `how` and `why` subagent rules and `~/.cursor/rules/qstack-models.mdc` role overrides configured via `../setup-qstack/SKILL.md`.

## Writing the reply

Short declarative sentences. No long dashes. No mid-sentence colons. Frame impact for the consumer (the user or QA reviewer) and the maintainer (the engineer receiving the verdict or defect report). Every claim carries its evidence or its label (`measured`, `inferred`, or `guess`) in the same sentence.

## Playbooks

Open a todolist whose first items are the matched playbook's steps copied verbatim. A step you do not run stays in the list with `skip: <reason>`. Match the task to a playbook and open its full steps. A request that is only a focused job opens that focused playbook. Otherwise open one core playbook and follow its links.

**Core.**

- **Explore and charter.** `playbooks/explore-and-charter.md`. A new area or a test plan before a run.
- **Reproduce and triage.** `playbooks/reproduce-and-triage.md`. A report to reproduce and classify.
- **Verify fix and retest.** `playbooks/verify-fix-and-retest.md`. An existing pull request or commit to measure.
- **Regression and parity.** `playbooks/regression-and-parity.md`. A diff to grade for behavior and pixels.
- **Release gate.** `playbooks/release-gate.md`. A stack to grade before merge.
- **Automate check.** `playbooks/automate-check.md`. A verification skill to create, audit, or pin.

**Focused.**

- **Diagnose live.** `playbooks/diagnose-live.md`. A live CPU, heap, or CDP symptom.
- **Diagnose trace.** `playbooks/diagnose-trace.md`. A captured cpuprofile, trace, or heapsnapshot.
- **Visual parity.** `playbooks/visual-parity.md`. Screenshot comparison against a baseline, with a person judging each change.
- **Characterization pin.** `playbooks/characterization-pin.md`. A snapshot of current behavior before structure moves.
- **Regression lane.** `playbooks/regression-lane.md`. One load-bearing scenario on trunk and head.
- **Flake triage.** `playbooks/flake-triage.md`. A red CI check to classify before any retrigger.
- **Perf gate.** `playbooks/perf-gate.md`. A baseline and post-change measurement.

---
name: regression-pin
description: "Pin a reproduced bug or regression signal with a focused executable check that fails before the fix and passes after it, or select the closest live verification when a unit test is impractical. Use for /regression-pin."
disable-model-invocation: true
---

# Regression pin

Pin a reproduced bug with a focused executable check. The check fails before the fix and passes after it. When a unit test is impractical, select the closest live verification instead.

Do not force a test when it would be impractical. Skip a new test when it would need broad harness setup, brittle mocks, slow end-to-end infrastructure, production-only state, vague reproduction steps, or large unrelated fixture churn. Use the closest useful verification instead.

## Workflow

1. **Understand the bug.** Identify the intended behavior, the current behavior, the affected path, and the smallest observable reproduction.
2. **Choose the narrowest executable check.** Prefer the closest unit, component, integration, or regression test already used for that code path. If no practical test path is obvious, do not create one from scratch just to satisfy the workflow.
3. **Write the failing check first.** Add the smallest focused test that would have caught the bug. Encode the intended behavior. Do not mirror the current implementation, and do not assert on private helpers or the order of internal calls.
4. **Run the new check before the fix.** Confirm it fails for the intended reason. If it passes, or if it fails for an unrelated reason, correct the check or the reproduction before editing the implementation. When a fix commit or pull request already exists, run this check on the baseline revision and do not author a second product fix.
5. **Apply or select the fix.** When this run is landing the fix, make the smallest production change that satisfies the intended behavior and preserves nearby contracts. When a fix artifact already exists, use that revision and do not edit it.
6. **Rerun the same check.** Confirm it passes on the patched revision.

## When a failing test is impractical

Use the closest live verification instead. That may be a targeted script, a manual reproduction command, browser or CLI automation, a snapshot comparison, a log assertion, or a focused integration check.

Prefer no new test over a bad test. A bad test mostly exercises mocks, encodes implementation details, depends on timing or unrelated global state, needs expensive infrastructure for a small fix, or would be deleted immediately after proving the fix. A mock-heavy implementation test is a bad test. Do not add one.

## Guardrails

- Do not change tests merely to match a wrong implementation.
- Never weaken an existing assertion to make a check pass. Change an assertion only when the expected behavior changed on purpose and a person accepts the change in review.
- Keep the regression check focused on the bug. Avoid broad fixture churn or unrelated coverage expansion.
- If the bug is flaky, make the check deterministic where possible, and document the flake signal being locked down.
- If the bug exposes a broader class of failures, land the focused regression path first, then consider sibling coverage.
- Assert what a caller or a user can observe. The check should fail when that behavior breaks, and it should keep passing when only the internals change.

## Report

Report the evidence.

- Name the failing-before test or executable check, and the failure it produced.
- Name the passing-after run, and any nearby validation.
- If failing-before evidence could not be demonstrated, say why, and describe the closest regression check used instead.

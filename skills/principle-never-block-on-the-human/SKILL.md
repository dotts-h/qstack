---
name: principle-never-block-on-the-human
description: "Apply when tempted to ask 'should I do X?' on reversible work. Decide, proceed, and let the human course-correct after the fact."
disable-model-invocation: true
---

# Never block on the human

The human supervises asynchronously. Agents must stay unblocked. Make reasonable decisions, proceed, and let the human course-correct after the fact. Code changes are reversible and reviewable, so a wrong decision usually costs less than blocking.

- Proceed, then present. Do the work, and show the result. Do not ask "should I do X?" Do it, and explain why.
- Make the system self-healing. When you notice a problem, log it and fix it in the next round.
- Irreversible actions still require confirmation. A force-push, deleting production data, and sending an external message are irreversible.
- Reversible actions should proceed without blocking. Writing code, editing notes, and splitting tasks are reversible.
- Some reversible QA calls still wait for a person, because each one changes what counts as correct. Accepting a healed locator or a repaired check, updating a visual or snapshot baseline, judging an assistive-technology outcome, and setting a production blast radius are such calls. Finish the work around each call, then present it with its evidence.
- Product direction comes from the human. Execution should not block.

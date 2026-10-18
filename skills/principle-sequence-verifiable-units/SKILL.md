---
name: principle-sequence-verifiable-units
description: "Apply to multi-step work such as sweeps, migrations, and runs of similar edits, and to how you stack commits and PRs. Break work into small units that each end in a verifiable state. Check each unit before the next. Order delivery so the sequence proves itself to a reviewer."
disable-model-invocation: true
---

# Sequence work into verifiable units

Order work as a sequence of small units. Each unit ends in a state you can check. Do not advance until the current unit is green.

**Why.** A break caught at the unit that caused it is cheap to localize. A break caught after a batch is buried, and you have already built further on a broken base. Sequencing those same units into a delivery a reviewer can replay turns "trust me" into "watch it go red, then green."

**Execution.** In a sweep, migration, or any run of similar edits, verify each change before starting the next. Each unit is a before and after bracket. Start from a known-good state, make one change, run the check, then proceed. Rebase onto clean trunk first so every check measures against the real baseline. When a lever does the edits, the per-unit check is nearly free. Run it anyway.

**Delivery.** Stack commits and PRs in the order that proves the work. The canonical shape is the failing test first, then the fix on top. Other story orders are a subtraction before the reshape, a baseline capture before the treatment, and the scaffold before the feature. Each commit lands on its own, and the sequence reads as an argument.

This principle is the sequencing complement to [Prove it works](../principle-prove-it-works/SKILL.md). That principle keeps each check real. This principle is also the complement to [Build the lever](../principle-build-the-lever/SKILL.md). That principle makes the per-unit check cheap.

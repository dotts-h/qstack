---
name: principle-build-the-lever
description: "Apply to any non-trivial work, including edits, migrations, analyses, and checks. Build the tool that does the work or proves it instead of working by hand. A codemod, a script, a generator, or a skill your subagents follow can be that tool. The tool is the artifact a reviewer can rerun."
disable-model-invocation: true
---

# Build the lever

When the work is not trivial, build the tool that does it instead of doing it by hand.

A codemod, a generator, or a script does the work the same way every time and reruns for free. The tool is one artifact a reviewer can read and rerun to check the work. Hand-done changes can only be re-verified by redoing them. A deterministic script turns "trust me" into "run this".

Default to building the lever. Skip it only when the task is trivial, a couple of obvious edits you can see at a glance.

- Do the first unit by hand to learn the recipe, then build the tool. Prove the tool by rerunning it on that unit and diffing against your hand-done version. Make the lever safe to rerun.
- Use a codemod or a script for edits. Use a generator for repetitive files. Use a dump-to-sqlite query for analysis. Use a rerunnable check for verification.
- A deterministic lever beats fan-out. If the tool can process every unit in one pass, run it yourself. Do not fan out delegates to hand-apply what a script can do.
- When you fan work out to subagents, write the lever as a skill they all read. Put the recipe, the verification contract, and the do-not-touch fences in that one artifact. Keep it outside the delegates' write scope so they cannot quietly edit the contract.
- Applying this principle produces a file. If you cited this principle and the diff has no codemod, script, generator, or delegate skill, you did not apply it.
- Commit the lever when the work outlives the session.

The bar is triviality, not repetition. A one-off still earns a lever when the lever is what makes the work checkable. Build the smallest script that does or proves the job, never a framework.

Distinct from [Encode lessons in structure](../principle-encode-lessons-in-structure/SKILL.md), which makes a recurring instruction a durable guardrail. This principle is throughput and reviewability for the work in front of you. For scripting the verification itself, see [Prove it works](../principle-prove-it-works/SKILL.md).

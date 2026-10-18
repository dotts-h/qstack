### Visual parity

**You own pixel equivalence.** The baseline is the spec. Do not touch the baseline to make a diff pass.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Capture baseline screenshots across each state of the component before any change. When the change is already in the tree, capture the baseline from the parent revision. Without a baseline you have no parity claim.
3. Hold these limits. Do not modify the diff tool to force a pass. Do not edit, replace, or regenerate the baseline. Do not restructure the component to make a diff pass. If the baseline looks wrong, stop and ask. Do not edit it.
4. Run an image diff on the real UI through the control adapter at `../reproduce-issue/references/control-adapter.md`. Compare each state to its baseline. Any nonzero pixel delta is a fail.
5. Report the delta. Do not patch product code.

**Reply.** The states you captured, the baseline location, the diff result for each state, and any nonzero pixel delta.

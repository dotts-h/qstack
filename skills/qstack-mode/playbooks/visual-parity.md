### Visual parity

**You own the change report.** A pixel delta proves that a state changed. A person decides whether the change was intended. Do not touch the baseline to make a diff pass.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Capture baseline screenshots across each state of the component before any change. When the change is already in the tree, capture the baseline from the parent revision. Without a baseline you have no parity claim.
3. Capture each baseline state a second time from a fresh render. Mask the regions that differ between the two baseline captures, such as clocks, carets, animations, and live data. Log each mask and the reason for it. Masks come only from the two baseline captures. Never add a mask after you see the change capture.
4. Hold these limits. Do not modify the diff tool to force a pass. Do not edit, replace, or regenerate the baseline. Do not restructure the component to make a diff pass. If the baseline looks wrong, stop and ask. Do not edit it.
5. Capture each state on the real UI through the control adapter at `../reproduce-issue/references/control-adapter.md`. Run the image diff against the baseline outside the masks.
6. Treat a nonzero delta as a change to review. For each changed state, save the baseline, the capture, and the diff image. Hand them to a person to accept or reject. Keep capturing the other states while the person reviews.
7. Emit `Pass` when no state changed outside the masks or a person accepted every change. Emit `Fail` when a person rejected a change or a baseline state no longer renders. Emit `Unproven` while a change waits for review or when a state could not be captured. Do not patch product code.

**Reply.** The states you captured, the baseline location, each mask and its reason, each changed state with its diff image path, the person's decision on each change, and the outcome token.

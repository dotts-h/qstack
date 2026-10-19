### Regression and parity

**You own the safety fact.** Prove that fact on the real artifact, or mark the run unproven.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`. Playbooks named below sit in this folder.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Run `../blast-radius/SKILL.md`. Name the one safety fact outside the changed lines. Prove that fact on the real UI, CLI, or service.
3. Pin pre-change behavior with `characterization-pin.md` before you trust a structural diff.
4. Compare trunk and head with `regression-lane.md`.
5. When the diff changes UI styling or layout, run `visual-parity.md`.
6. Emit `Pass` only when the safety fact is proved, the lane passed, and any required visual parity run returned `Pass`. Emit `Fail` when a required check shows a break. Emit `Unproven` when a required check did not run or did not show the safety fact.

**Reply.** The safety fact, the pin evidence, the trunk and head result, the visual parity result when you ran it, and the outcome token.

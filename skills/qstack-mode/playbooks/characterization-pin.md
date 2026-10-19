### Characterization pin

**You own the behavior pin.** Later structure work has to match this pin. You do not add behavior.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Map the contract with `../how/SKILL.md`. Name what a user, caller, or downstream service can observe.
3. Before any structure move, capture a characterization snapshot or an equivalence check of that observable output. When the area has no coverage, write the pin before anyone touches structure. A type check or a lint run is not a pin.
4. Write a test file only when the operator asked for one, and only under a test directory or `.cursor/skills/verify-*/`.
5. Prove output equivalence on the real artifact. Use a diff of old and new outputs, a recorded baseline replayed on the new code, or a run on the real UI, CLI, or service. A compile is not the proof.
6. Read `../principle-prove-it-works/SKILL.md` and `../principle-test-behavior-not-implementation/SKILL.md` before you call the pin green.

**Reply.** The contract you pinned, the pin artifact path, and the equivalence result on the real artifact.

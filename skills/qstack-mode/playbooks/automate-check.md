### Automate check

**You own the verification skill.** Product source stays untouched unless the operator explicitly asked for a test file.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Check whether the project already has a verification skill.
3. When none exists, create one with `../create-verification-skill/SKILL.md`. When one exists, audit its map with `../maintain-verification-skill/SKILL.md`.
4. Pin a focused regression test with `../regression-pin/SKILL.md` only after a cheap check fails for the right reason. The right reason is a user-visible result that is wrong. A failure on a private helper, call order, or an expected value copied from the code under test is the wrong reason. Do not pin that check. Read `../principle-test-behavior-not-implementation/SKILL.md` before you add the test.
5. Repair a broken check only under the harness fix rule in `../maintain-verification-skill/SKILL.md` step 5. A person accepts each repair in review before it lands.
6. Write a test file only under `.cursor/skills/verify-*/` or a test directory, and only when the operator asked for that file.
7. Clean temporary data. Confirm every evidence path you will cite still exists after cleanup.

**Reply.** The verification skill path, whether you created it or audited it, any pin you added, the cheap check that failed first, each repair, the run that still failed on a revision with the bug for each repaired check that guards a known bug, and the evidence that survived cleanup.

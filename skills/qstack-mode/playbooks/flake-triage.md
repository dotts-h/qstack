### Flake triage

**You own the classification of a red check.** You do not merge.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Resolve the forge before you read the check. `gh` is the default. If `origin` is on PATH and Origin can resolve the repository, use `origin pr` for checks. Record a fallback to `gh`. Never require `gt`.
3. Classify the red check before any retrigger. The classes are flake, infrastructure, stale base, and a defect in the diff.
4. When the failure is in code the diff never touches, run `git merge-base --is-ancestor <trunk-sha> <head-sha>` before you call it flake. A nonzero exit means trunk is not an ancestor of the head. Report a stale base and name the rebase the owner must do. Do not spend a rebuild on that case.
5. Write the premise that the failure is flake before you rebuild. Read `../principle-attack-the-premise/SKILL.md`. A suspected flake or an infrastructure failure gets one fresh build of the whole check. Do not retry a single job in place. One fresh build only.
6. An identical second failure is a real defect. Read the child logs. Do not rebuild again.
7. A failure in the diff's own code is a product defect for the maintainer.
8. Owner approval is a wait. Do not merge. Do not treat this playbook as permission to land the pull request.

**Reply.** The classification, whether you used the one fresh build, the merge-base result when you ran it, and the defect or the rebase the owner needs. State that you did not merge.

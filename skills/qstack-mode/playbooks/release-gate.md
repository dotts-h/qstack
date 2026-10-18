### Release gate

**You own the gate.** You do not merge.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`. Playbooks named below sit in this folder.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Resolve the forge before you read pull requests. `gh` is the default. If `origin` is on PATH and Origin can resolve the repository, use `origin pr` for every pull request operation. Record a fallback to `gh`. Never require `gt`.
3. Require a user-run verdict from an agent that did not author the diff. That agent drives the real UI, CLI, or service. Put the absolute path of `../SKILL.md` in its prompt. Use subagent type `qstack-agent` when it is registered. Otherwise use `generalPurpose`. Green CI is not a verdict. An approving bot review is not a verdict.
4. When CI is red, open `flake-triage.md` before any retrigger.
5. When the diff touches a measured metric, open `perf-gate.md`.
6. Walk upward from the lowest unmerged pull request. Stop at the first pull request that lacks `PASS` or `PASS+NOTES`. A verified pull request above that stop waits.
7. A verdict covers the patch that was run. When the head SHA moved, rerun the user path before you trust the old verdict.
8. Emit `PASS`, `PASS+NOTES`, or `FAIL` for each pull request you grade. Do not merge. Do not enable auto-merge.

**Reply.** The forge you used, each graded pull request, the verdict token, the agent that produced the user-run verdict, and the first unverified pull request where you stopped. State that you did not merge.

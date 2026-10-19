### Explore and charter

**You own the charter.** The charter is a plan for what to test. It is not a code change.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Restate the testing mission with `../in-your-own-words/SKILL.md` before you design a case or explore the code.
3. Route the subsystem through `../how/SKILL.md`. When the question is history, or why the code is shaped this way, also route through `../why/SKILL.md`.
4. Write this throughput checkpoint and nothing more for throughput. `throughput checkpoint: n/a, read-only charter`
5. Produce a risk charter and the test entry points. Name the observable results, the files that own them, and the gotchas that would change a test. For each result, name the source of its expected state, such as the spec, a reference build, or a baseline account. A clearly broken state is a Bug whatever that source allows, per `../triage-defect/SKILL.md`.
6. Apply `../unslop/SKILL.md` to the charter before you reply.

**Reply.** The restated mission, the risk charter, the test entry points, and the checkpoint line. Say what the reviewer can turn into cases, and which observations are still untested.

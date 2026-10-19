### Diagnose trace

**You own the diagnosis from the captured artifact.** Do not rerun the capture. Do not patch product code.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Write this throughput checkpoint. `throughput checkpoint: n/a, read-only diagnosis`
3. Identify the format and load it. A cpuprofile or gzipped trace uses a trace parser. A spindump is text. A heapsnapshot uses heap tooling. The artifact is a fixed dataset.
4. Dump the artifact into sqlite before you read it. Use one row per sample, frame, or node. This dump is the check a reviewer reruns.
5. When the dump is large, reduce it in a fresh `qstack-agent` and keep the reduced finding in the main thread. Read `../principle-guard-the-context-window/SKILL.md`.
6. Query the hot path or the retainer chain. For a CPU trace, walk the frames that hold the most time. For a leak, follow the retainer chain from the leaked object to a garbage-collection root. For a spindump, name the thread that is on CPU or blocked and its wait reason.
7. Map the hot frame to file, symbol, and line from the symbols in the artifact. A frame with no source mapping is not a diagnosis. Resolve the symbols, or say the artifact does not carry them.
8. When a paired capture exists, diff the two artifacts. When it does not, label the finding as the strongest hypothesis the artifact supports.

**Reply.** The artifact and its format, the reduced finding, the source location, the artifact paths, and whether a paired capture confirmed the finding.

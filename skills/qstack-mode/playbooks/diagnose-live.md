### Diagnose live

**You own the diagnosis from the live process.** You do not patch product code.

Bundled skill paths are relative to `skills/qstack-mode/SKILL.md`.

1. Log each phase decision from the plugin root with `node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>`.
2. Write this throughput checkpoint. `throughput checkpoint: n/a, read-only diagnosis`
3. Capture a live signal on the real UI, CLI, or service. Use a CPU profile for a spin, a heap snapshot for a leak, or a CDP trace for a visual glitch. The artifact is the evidence.
4. Reduce a large artifact in a fresh `qstack-agent`. Keep the reduced finding in the main thread. Read `../principle-guard-the-context-window/SKILL.md` before you paste a raw profile into the main thread.
5. Prove the mechanism on the live process before you believe it. Use instrumentation on the running process. Do not inject the symptom. Do not save a product patch.
6. Map the finding to the source file, the symbol, and the line that allocates or schedules the work.
7. Hand back the diagnosis. Do not start a product fix.

**Reply.** The signal you captured, the reduced finding, how you proved the mechanism, the source file and line, and the artifact paths.

---
name: principle-encode-lessons-in-structure
description: "Apply when you catch yourself writing the same instruction a second time, or notice a recurring correction. Encode the rule as a lint, metadata flag, runtime check, or script instead of more text."
disable-model-invocation: true
---

# Encode lessons in structure

When you write the same instruction a second time, or you notice a recurring correction, encode the rule. Use a lint, a metadata flag, a runtime check, or a script. Do not add more text.

If the lesson needs judgment and cannot be encoded, make the instruction more prominent and add an example of the failure mode.

**Corollary.** If the fix is structural, use only the structural fix. The instruction is the symptom.

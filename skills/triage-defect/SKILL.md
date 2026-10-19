---
name: triage-defect
description: "Triage bug reports with bounded cause tracing, duplicate detection, bug-versus-feature classification, and self-contained defect report formatting. Use for /triage-defect."
disable-model-invocation: true
---

# Triage a defect

Triage one bug report. The report may be a local description, a tracker ticket, or a thread. Produce one self-contained defect report. Do not reproduce the product and do not fix it here.

Run the report through [`../unslop/SKILL.md`](../unslop/SKILL.md) before you show it or post it.

Prefer no ticket over a guessed or duplicate ticket.

## 1. Read the whole report

Read the description, the tracker issue, or the thread root and its replies before deciding.

Capture:

- Reporter wording
- Expected behavior
- Observed behavior
- Product version, app build, environment, and platform, or `unknown`
- Frequency and trigger
- Error text or stack signature
- Existing issue, commit, or pull request links
- Any explicit statement that someone is already fixing it

Inspect every relevant attachment. Read screenshots at full useful resolution. Review video for the state transition that separates correct and broken behavior. Read logs, traces, and crash text for concrete signatures. If an attachment cannot be read, say so. Do not invent what it shows.

Use evidence already in the report before asking for more.

## 2. Trace the cause path

In a [black-box run](../qstack-mode/SKILL.md#non-negotiables), skip this section and do not guess a code owner. Under Cause trace, write `unavailable` with the reason, then the facts that the surface showed.

Do a bounded source and history pass before choosing a destination. This pass does not need a complete root cause. It must be strong enough to avoid routing a visible symptom to the wrong owner.

Trace the path from the reported action to the observed result with [`../how/SKILL.md`](../how/SKILL.md). Use [`../why/SKILL.md`](../why/SKILL.md) when the report looks like a regression or touches defensive code.

1. Identify the likely code path from the reported action to the observed result.
2. Check whether the visible symptom belongs to that path or to a dependency below it.
3. Check recent changes when the report looks like a regression.
4. Check whether a merged commit or open pull request already addresses the same symptom.
5. Separate confirmed facts from hypotheses.

## 3. Classify

Choose one category.

### Bug

Something violates intended behavior, such as wrong output, broken state, an error, a crash, a hang, a silent no-op, or a regression.

A clearly broken state is a Bug, even when a reference build, a baseline account, or the spec text seems to allow it. Clearly broken includes a state that the user cannot leave, such as controls that stay disabled with no way back or a spinner that never ends. It also includes a product that contradicts itself, such as list buttons that still read Remove after the cart was emptied, or the same placeholder image on every product while each alt text names its product.

### Performance

The report describes measurable slowness, excess memory, battery drain, jank, or another resource problem. Treat it as a bug, and preserve measurements and profiles.

### Feature request

The current behavior appears intentional, and the reporter wants a different behavior or affordance.

### Question or feedback

The report asks how something works, states a preference without a concrete defect, or gives general feedback.

### Reroute

Cause tracing shows that another configured destination owns the issue.

### Unclassified

The line between Bug and Feature request is unclear, and the state is not clearly broken. Do not file. Ask one focused question in the report, and keep this category until a person answers.

## 4. Route

Read the optional routing map from `routing.map_path`, in the settings file that [`../qstack-mode/references/settings.md`](../qstack-mode/references/settings.md) describes. The shape is [`references/routing.example.md`](references/routing.example.md). When the settings file exists, first run `node scripts/check-settings.mjs <settings file> triage` from the plugin root. When it prints a problem, route nowhere and make no tracker write. The defect report is still written, and it names the settings file and each problem.

- Match on confirmed product area, code path, or error signature.
- A visible symptom alone is not enough when cause tracing points elsewhere.
- If no route matches, say the owner is unclear. Do not guess.
- Do not cross-post. Name the destination in the defect report.

Owner pings are off by default. A ping is allowed only when all of these hold:

1. The routing map explicitly names the owner.
2. The config allows that ping type.
3. The item is a feature request that needs owner input, or recent history identifies a likely regression author with strong evidence.
4. The owner is not a broad on-call group.

## 5. Deduplicate

Search before creating anything. When `tracker.adapter_skill_name` names a tracker adapter, search it. Also check links already in the report, prior triage notes, and repository history. Say which sources you could actually search.

Search with:

- Exact error or crash signature
- Product area
- Trigger
- Symptom
- Version or date window
- Suspected regression commit
- Source permalink, when the report has one

Choose one outcome.

- **Confident duplicate.** The same signature, or the same area, trigger, and symptom, or a confirmed shared cause.
- **Possibly related.** A shared cause is plausible and not proven.
- **Weak resemblance.** The similarity is superficial.
- **No match.**

For a confident duplicate, update the existing issue with the source permalink and one short recurrence note when the tracker adapter can do that. Do not reopen, relabel, or reassign it unless the config says to. For a possible match, link it as uncertain and create nothing.

A long-closed issue is a regression lead, not automatically a live duplicate.

If the tracker adapter is missing a required write, fail closed for that write. The defect report still gets written. Resolve team, project, status, and labels at runtime. Do not invent ids, create labels, assign owners, or set priority unless the config explicitly requires it.

## 6. Format the defect report

The report is the deliverable in every mode. Create a tracker issue only when all of these are true:

1. The classification is Bug or Performance.
2. The behavior is clearly broken.
3. The issue is still live, or it is not known to be fixed.
4. The duplicate search found no confident duplicate and no possibly related live match.
5. A tracker adapter is configured, its target fields resolved, and it can compensate if a later handoff fails.

Never create a ticket for a feature request, question, feedback item, reroute, possible duplicate, confident duplicate, or already-fixed issue.

Use this shape. The title names the area and the symptom. It does not name a guessed root cause.

```markdown
# <area and symptom>

Classification: Bug | Performance | Feature request | Question or feedback | Reroute | Unclassified
Duplicate: Confident duplicate | Possibly related | Weak resemblance | No match

## Expected

## Observed

## Version and environment

## Frequency and trigger

## Report

Quote the reporter. Link the source thread or ticket when one exists.

## Cause trace

Confirmed facts, then hypotheses labeled as hypotheses.

## Related

Existing issues, commits, or pull requests. Write `none` when the search found none.

## Route

Destination, or `owner unclear`. Include at most one allowed owner ping.
```

Inline a screenshot or a representative video frame when the report can hold it. Link remaining artifacts.

When the run also writes a verdict file, put the report in it as `## Triage`, in the shape that [the verdict file reference](../qstack-mode/references/verdict-file.md#sections) gives.

## 7. Automated thread handoff

Use this section only when the run has immutable source coordinates. Interactive triage returns the defect report and posts nothing.

Freeze coordinates before any tracker write.

1. Read `source_channel_id` from the trigger and require it to equal the configured source channel.
2. Set `SOURCE_THREAD_TS` from `trigger.thread_ts` when present, otherwise `trigger.ts`.
3. Require a nonempty `SOURCE_THREAD_TS`.
4. Store `SOURCE_CHANNEL_ID` and `SOURCE_THREAD_TS`.
5. Read the thread and verify the root has those coordinates.
6. Fetch a stable source permalink.

Never post a root message, a message in another channel, a broadcast, or a DM. Preflight the source parent before any tracker write and again immediately before the verdict post. If the parent is missing, deleted, inaccessible, or uncertain, stop with no writes.

Post exactly one reply with `channel=SOURCE_CHANNEL_ID` and `thread_ts=SOURCE_THREAD_TS`. Lead with the outcome, link the tracker issue when there is one, mention a reroute or one missing fact when needed, and end with exactly one marker.

Map the classification onto one marker. Bug uses `[qstack:bug]`. Performance uses `[qstack:performance]`. Feature request, Question or feedback, Reroute, and Unclassified use `[qstack:other]`. Add `tracker=` only when a tracker issue exists.

```text
[qstack:bug]
[qstack:bug] tracker=https://tracker.example/issue/123
[qstack:performance]
[qstack:performance] tracker=https://tracker.example/issue/123
[qstack:other]
```

Use configured marker strings when the automation names them. After posting, read the thread and verify the verdict sits under `SOURCE_THREAD_TS`. If it does not, do not retry at the root. If this run created a tracker issue and the verdict did not land, cancel, close, or delete that issue and verify the compensation. A failed compensation is reported only in the run output.

Watch the source thread for the configured follow-up window, then stop. Answer only a direct question. Apply one concrete tracker correction when it is safe. Do not emit a second marker. Stop early if someone asks the run to stop.

---
name: setup-qstack
description: 'Configure which models qstack uses per QA role and at what reasoning budget. Detects your available models and writes an always-applied rule that overrides the skill defaults. Use for /setup-qstack, "configure qstack models", "qstack budget", or changing qstack model choices.'
---

# Setup qstack

Write `~/.cursor/rules/qstack-models.mdc`, an always-applied rule that sets qstack's model per role.

## Steps

### 1. Detect available models

Enumerate the model slugs you can pass to a `Task` subagent in this session. That is the dependable source. If Cursor also exposes a models API or CLI that lists the user's entitled models, prefer it for completeness. If you cannot detect any, ask the user to paste the slugs they have access to. Never write a real slug you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even though they are not detected slugs.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in step 5 below. If `~/.cursor/rules/qstack-models.mdc` already exists, read it and treat its `# budget` line and its role values as the current choices. Otherwise start from those defaults. A line whose role is not in step 5 is from a retired role. Drop it.

### 3. Budget, map, and confirm

**(a) Ask for a budget.** Prefer AskQuestion over free text. Offer these four options with these exact labels. Name the current budget when the rule records one. With no rule, say that `large` matches the skill defaults.

- `unlimited (max reasoning)`
- `large (xhigh reasoning)`
- `medium (high reasoning)`
- `small (medium reasoning)`

**(b) Apply it.** Build the working table from the skill defaults. On a re-run, keep any role you changed by family, or that you set to `inherit-parent` or `auto`. `unlimited`, `large`, `medium`, and `small` set the effort token of every real slug to `max`, `xhigh`, `high`, or `medium`. The effort token is the last token, or the one before a trailing `fast`, on the ladder `max` > `xhigh` > `high` > `medium` > `low`. If the result is not a detected slug, use the same family's detected slug with the highest effort at or below the target. If none exists, mark the role as needing a choice. `inherit-parent` and `auto` do not change. `unlimited` turns `claude-opus-5-5-xhigh` into `claude-opus-5-5-max`. Grok slugs top out at `xhigh`. Under `unlimited` the fallback puts Grok at `xhigh` and keeps `grok-4.7-xhigh-fast`. `large` keeps the defaults. `small` turns them into `claude-opus-5-5-medium` and `grok-4.7-medium-fast`.

**(c) Show the roles and confirm.** Show every role with its model. Mark any real slug that is not in the detected set as needing a choice. Also list each line step 2 dropped. Ask whether to accept as-is or change specific roles. Offer the detected models plus `inherit-parent` and `auto`. Both mean this role runs on the parent chat model, which is how Auto users stay on Auto. Prefer AskQuestion over free text. Each role value is one slug.

### 4. Validate

Every real slug written must be in the detected set. `inherit-parent` and `auto` always pass. If a chosen real slug is not available, stop and ask again.

### 5. Write the rule

Set `alwaysApply` to true in `~/.cursor/rules/qstack-models.mdc`. Include a `# budget` line with the chosen label and its target effort. For that line, `unlimited` pairs with max, `large` with xhigh, `medium` with high, and `small` with medium. Include one line per role, using the same labels qstack-mode uses. Overwrite the whole file so re-runs stay idempotent. Shape:

```
---
description: qstack per-role model choices (overrides skill defaults)
alwaysApply: true
---
# qstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` means the role runs on the parent chat model. Omit Task `model` for that role.
# budget: large (xhigh)
reproduce-and-triage: grok-4.7-xhigh-fast
verify-fix-and-retest: grok-4.7-xhigh-fast
regression-and-parity: grok-4.7-xhigh-fast
release-gate: grok-4.7-xhigh-fast
judgment and prose: claude-opus-5-5-xhigh
hardest tasks: claude-opus-5-5-xhigh
how explorer: grok-4.7-xhigh-fast
how explainer: claude-opus-5-5-xhigh
why investigators: grok-4.7-xhigh-fast
why synthesizer: claude-opus-5-5-xhigh
verification workers: grok-4.7-xhigh-fast
```

### 6. Confirm

Tell the user the rule was written and that it applies to new sessions. Re-running this skill updates it.

### 7. Offer a verification skill

Check whether the project can drive the real app for proof. A `verify-*` skill or an existing harness counts. When neither exists, offer this once. "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill`. It resolves wherever qstack is installed, in the workspace, the user directory, or a plugin. On no, move on.

### 8. Offer project settings

Reproduction needs `.cursor/qstack/settings.json` in the workspace, as [`../qstack-mode/references/settings.md`](../qstack-mode/references/settings.md) describes. When the file is missing, offer once to write it. On yes, ask which skill drives the app, and suggest `playwright-cli` for a web app that already runs at a URL. Copy [`../reproduce-issue/references/feature-map.example.md`](../reproduce-issue/references/feature-map.example.md) to `.cursor/qstack/feature-map.md` unless that file exists, write the settings file, and run `node scripts/check-settings.mjs <settings file> reproduce` from the plugin root. Tell the user to fill in the feature map before the first reproduction. On no, move on.

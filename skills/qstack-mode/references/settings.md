# Settings file

qstack reads project settings from `.cursor/qstack/settings.json` in the workspace root, the folder that holds `.cursor`. Keep the file in the project under test, so a plugin update never overwrites it. Write it as UTF-8. Relative paths in the file resolve from the workspace root.

## Keys

| Key | Read by | Meaning |
|---|---|---|
| `control.skill_name` | reproduce-issue | Required. The skill that implements [the control-adapter contract](../../reproduce-issue/references/control-adapter.md) |
| `control.feature_map_path` | reproduce-issue | Required. The feature map that [the control-adapter contract](../../reproduce-issue/references/control-adapter.md) describes |
| `control.artifact_directory` | reproduce-issue | Where captures go. It must sit outside the repository. Without it, use a `qstack` folder in the operating system's temporary directory |
| `control.artifact_retention_hours` | reproduce-issue | How long cleanup keeps captures. Without it, cleanup deletes no capture |
| `control.recording` | reproduce-issue | Optional. `video` or `trace`, the recording a browser run makes. Without it, record a trace on Windows and a video elsewhere. Set `video` on Windows only when `video-start` opens no window there |
| `routing.map_path` | triage-defect | Optional. The completed copy of [the routing example](../../triage-defect/references/routing.example.md) |
| `tracker.adapter_skill_name` | triage-defect | Optional. The skill that searches and writes the issue tracker |
| `slack.operations_channel_id` | reproduce-issue | Optional. The channel for the one automated status message |

The checker ignores keys it does not know, so an automation can keep its own values in the same file.

## Example

For a web app that already runs at a URL:

```json
{
  "control": {
    "skill_name": "playwright-cli",
    "feature_map_path": ".cursor/qstack/feature-map.md"
  },
  "routing": {
    "map_path": ".cursor/qstack/routing.md"
  }
}
```

## Check it

Run `node scripts/check-settings.mjs <settings.json> reproduce` or `node scripts/check-settings.mjs <settings.json> triage` from the plugin root. It prints one line per problem and exits 1 when there is any.

- `reproduce` needs `control.skill_name` and `control.feature_map_path`, and the feature map must be a file that exists.
- `triage` needs no key, but a routing map it is given must be a file that exists.
- Each use checks only the keys it reads, so a bad value for one skill never blocks the other.

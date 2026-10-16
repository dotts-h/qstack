# qstack

qstack is a Cursor plugin for QA work. This folder is the plugin root. Add skills and the other components in the folders below when you are ready.

## Layout

Cursor discovers a component from its default folder when `.cursor-plugin/plugin.json` does not set a path for that component. The locations are from the [plugins reference](https://cursor.com/docs/plugins/building).

| Component | Default location |
| --- | --- |
| Skills | `skills/` |
| Rules | `rules/` |
| Agents | `agents/` |
| Commands | `commands/` |
| Hooks | `hooks/hooks.json` |
| MCP servers | `mcp.json` |

A skill is a directory under `skills/` that contains `SKILL.md`. The frontmatter needs `name` and `description`.

## Load it locally

Copy or link this folder to `%USERPROFILE%\.cursor\plugins\local\qstack`. That is the path Cursor's plugin scaffold uses when a plugin should load with no install step.

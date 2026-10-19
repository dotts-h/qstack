# Control-adapter contract

The reproduce-issue skill does not know how to start or drive every app. The user must configure one control skill or adapter that implements this contract for the target app.

Set its skill name in `control.skill_name`, in the settings file that [`settings.md`](../../qstack-mode/references/settings.md) describes.

Set the completed user-facing feature map path in `control.feature_map_path`. When the control skill is a verification skill that [`create-verification-skill`](../../create-verification-skill/SKILL.md) generated, use its `.cursor/skills/verify-<app>/features/README.md`, and read each feature file it links as a map section. Otherwise copy and fill [`feature-map.example.md`](./feature-map.example.md) outside this skill directory, for example to `.cursor/qstack/feature-map.md`, instead of editing the example.

If the settings file, the skill, the feature map, or a required capability is absent, ambiguous, or incomplete, reproduction must fail closed.

## Required capabilities

### Bring up

Start the requested app revision in the requested test environment, or open the running product at its URL.

Input:

- Repository and revision, or the URL when the product already runs
- Build or start mode, or the build to pick in a running product, such as from a build dropdown
- Workspace, account, fixture, and feature-state requirements
- Artifact directory
- Completed feature-map path

Return:

- Session identifier
- How the adapter confirmed the correct app and environment
- Stable app markers
- Running process or target details needed by later calls
- Any missing capability

The adapter must distinguish the target app from a similar window, shell, or production instance.

### Drive UI

Perform real user actions:

- Click
- Type
- Press keys
- Scroll
- Drag
- Resize
- Navigate through app controls
- Run a command when the user path is a CLI

Prefer roles, labels, and stable selectors. Use coordinates only when the surface exposes no accessibility tree, and only after a fresh screenshot. For a browser target, follow [Browser targets](#browser-targets).

Return each action and the observed state change.

Do not set internal state, call internal state setters, call hidden app methods, write directly to storage, or inject DOM changes to create the symptom. A CLI repro uses the real command. Do not print or write the broken result into place.

### Drive mapped features and states

Read the relevant feature-map section before driving the app.

The adapter must expose ways to:

- Navigate every mapped feature through the user-visible path.
- Invoke the adapter action names listed for that feature.
- Interact with default, hover, focus-visible, active, disabled, loading, empty, error, selected, open, expanded, and feature-specific states when they apply.
- Arrange a state through safe fixture data, permissions, flags, service responses, or supported test controls.
- Reset the feature between independent repro runs.
- Capture the screenshot, recording, and read-only cross-check named by the feature map.

Use roles, accessible names, ARIA relationships, stable component markers, and purpose-named data attributes. Never use generated CSS or StyleX classes, dynamic hashes, child indexes, or brittle DOM position.

Arranging a precondition is not permission to inject the reported symptom. The repro itself must still come from real user interaction.

### Inspect state

Read state to confirm what the UI shows.

Examples:

- Accessibility tree
- DOM or view hierarchy
- Process state
- Local logs
- Network request status
- App-exposed debug state

Inspection is read-only. If a query changes state, it belongs in `drive UI` and must represent a real user action.

### Screenshot

Capture the current app state to a requested path.

Return:

- File path
- Capture time
- App marker or window title
- Short description of what should be visible

The screenshot must show enough app chrome to prove that the correct app is under test.

### Recording

Start and stop a recording around the full repro path. A video counts. So does a trace that holds a screencast, such as a Playwright trace. Screenshots alone do not count. A recording must open no window on the user's desktop. For a browser, [Browser targets](#browser-targets) says which recording to make.

Return:

- File path
- Start and stop times
- Captured window or region
- Whether audio or sensitive overlays were omitted

The recording must show the discriminating final state, not only setup or a loading screen. Confirm the file exists and is not empty before you cite it.

### Cleanup

Stop processes and sessions created by the adapter.

Remove disposable:

- Browser or app profiles
- Temporary workspaces
- Test accounts or fixtures when the adapter created them
- Debug ports and tunnels
- Captures past their retention window

Return what was stopped, removed, retained, or left for a person.

Cleanup must not delete user work.

## Adapter behavior

The adapter must:

- Report capabilities before the repro starts.
- Report which feature-map sections it can drive and which are blocked.
- Use the same environment inputs for baseline and patched builds.
- Surface startup failures as failures.
- Bound retries.
- Keep secrets out of logs and artifacts.
- Keep captures outside the repository.
- Support a fresh or reset state between repro runs.
- Avoid production changes unless the user explicitly configured a safe test action.

## Browser targets

A web app adapter drives the page through the Playwright CLI, `playwright-cli`. Its agent skill, installed with `playwright-cli install --skills`, documents its commands. When the app already runs at a URL, `playwright-cli` itself can be `control.skill_name`. When the app must be built or started first, write a project adapter skill that starts it and drives it through the CLI.

- Run every `playwright-cli` command from the artifact directory. The CLI writes its output to a `.playwright-cli` folder in the directory it runs from, so a run from the workspace root leaves captures in the repository.
- Give each repro run its own named session, as in `playwright-cli -s=<run> open <url>`, and close it before the next run. A new session starts from an empty in-memory profile, which is the reset between runs.
- Act on element refs from the latest snapshot. Refs expire with the snapshot, so take a new one after the page changes.
- Never store a ref in a check or in the feature map. The CLI prints the Playwright code behind each action. Store the role, label, or test-id locator that code names.
- A click waits until its target is visible, enabled, and stable. A click that times out on a disabled control is an observation about the product. Never force a click past that wait.
- Use `eval` only to read state. Never use `run-code`, because arbitrary Playwright code can set the state under test.
- Screenshots and recordings are evidence. Do not pick an action target from a screenshot when the snapshot lists the element.
- A native dialog, such as an alert, appears in no screenshot and no video. Its evidence is the CLI's record of the dialog in the run log.
- An interactive element with no role or accessible name in the snapshot is a testability gap and a candidate accessibility defect. Record it.
- Video needs Playwright's ffmpeg build, which `playwright-cli install-browser ffmpeg` installs. After a failed `video-start`, `video-stop` still prints a file path, so check the file before you cite it.
- `control.recording` picks the recording, per [`settings.md`](../../qstack-mode/references/settings.md). With `video`, record with `video-start` and `video-stop`. With `trace`, record with `tracing-start` and `tracing-stop`. Without it, record a trace on Windows and a video elsewhere. On Windows, each `video-start` opens a visible console window for ffmpeg that stays open until `video-stop` ([microsoft/playwright#43515](https://github.com/microsoft/playwright/issues/43515)). An agent cannot see whether its CLI build hides that window, so only the operator may choose `video` there. Never start a video to learn whether a window opens.
- A trace opens no window, but it holds the page's scripts. When the run must not capture them and the recording would be a trace, record nothing. A timing verdict then cites the exported performance entries as its timing data, per [`perf-gate.md`](../../qstack-mode/playbooks/perf-gate.md). Any other run ends `Blocked`, and `Missing:` names a recording that holds no page scripts.

Do not use Cursor's built-in browser, even to explore a page. It is not headless. On Cursor 3.25.9, its coordinate click ran the click handler of a disabled button and of a disabled input, and every event it sent had `isTrusted` set to false. Its ref click rejected `<input type="button">` controls, and its snapshot omitted a value that a text field held.

## Environment translation

Before declaring an environment block, restate the defect without platform-specific nouns and ask whether the same behavior can be tested safely in the available environment.

Examples:

- A named browser may mean any external browser.
- A named key may mean the configured shortcut.
- A named remote host may mean a delayed or disconnected remote target.

Use a translated attempt only when it tests the same underlying behavior. Label it as translated evidence. Do not call it an exact repro when the missing environment is part of the defect.

Hardware prompts, operating-system permission dialogs, device-only APIs, and unavailable account states may be real blocks.

## Setup check

Before relying on the adapter, run one harmless adapter check:

1. Bring up the app.
2. Confirm the stable app marker.
3. Load one completed feature-map section.
4. Navigate to that feature through its user path.
5. Exercise one disposable state through mapped adapter actions.
6. Inspect the resulting state.
7. Capture a screenshot.
8. Make a short recording of the kind the run will cite, then confirm the file exists and is not empty. Skip this step when [Browser targets](#browser-targets) leaves the run with no recording.
9. Clean up.

Enable repro work only when every step that applies succeeds. The check itself posts nothing and changes no product data.

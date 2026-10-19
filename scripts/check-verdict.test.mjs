import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const checker = path.join(here, "check-verdict.mjs");
const reference = fs.readFileSync(
	path.join(here, "..", "skills", "qstack-mode", "references", "verdict-file.md"),
	"utf8",
);
const examples = [...reference.matchAll(/^```markdown\r?\n([\s\S]*?)^```\r?$/gm)].map(
	(match) => match[1],
);
const ORDER = "Order: fresh browser profile per run";
const FIX_URL = "https://github.com/acme/app/pull/123";
const VERDICT_LINES = {
	Blocked: ["Fix artifact: none", "Missing: a feature-map section for saved filters"],
	Confirmed: [`Fix artifact: ${FIX_URL}`, "Missing: none"],
	"Insufficient fix": [`Fix artifact: ${FIX_URL}`, "Missing: none"],
};
const verdictLines = (token) => VERDICT_LINES[token] ?? ["Fix artifact: none", "Missing: none"];

function cited(markdown) {
	return [...markdown.matchAll(/`([^`\s]+\/[^`\s]+)`/g)]
		.map((match) => match[1])
		.filter((token) => !token.includes("://"));
}

function check(markdown, artifacts = cited(markdown), content = "x") {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qstack-verdict-"));
	try {
		for (const artifact of artifacts) {
			const target = path.join(dir, artifact);
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.writeFileSync(target, content);
		}
		const file = path.join(dir, "verdict.md");
		fs.writeFileSync(file, markdown);
		const result = spawnSync(process.execPath, [checker, file], { encoding: "utf8" });
		return { status: result.status, problems: result.stderr };
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

function verdict(
	token,
	runLines,
	evidence = "- `captures/run-1.png`\n- `captures/run-1.webm`",
	verdictFields = verdictLines(token),
) {
	return [
		"# Saved filter disappears after reload",
		"",
		"## Verdict",
		"",
		`${token}. Measured.`,
		...verdictFields,
		"",
		"## Expected and broken state",
		"",
		"Expected: the saved filter is still selected after a reload.",
		"Broken: the filter list is empty after a reload.",
		"",
		"## Surface and runs",
		"",
		"Surface: browser UI through Playwright",
		"Environment: build 4f2c1a9, Windows 11, Chromium 156, fixture team-small, seed 7",
		...runLines,
		"",
		"## Evidence",
		"",
		evidence,
		"",
	].join("\n");
}

test("every example in the verdict reference passes", () => {
	assert.ok(examples.length >= 2, "reference holds a reproduction and a fix verification");
	for (const example of examples) {
		const { status, problems } = check(example);
		assert.equal(status, 0, problems);
	}
});

test("a cited evidence path must exist", () => {
	const { status, problems } = check(examples[0], []);
	assert.equal(status, 1);
	assert.match(problems, /evidence path not found: captures\/run-1\.png/);
});

test("evidence needs a backticked path or URL", () => {
	assert.equal(check(verdict("Blocked", [], "- `https://ci.example/run/7`")).status, 0);
	assert.match(check(verdict("Blocked", [], "- the screenshot")).problems, /cites no backticked path or URL/);
});

test("a reproduction or a fix verdict needs a recording", () => {
	const runs = [ORDER, "Runs: 2 of 2"];
	assert.match(
		check(verdict("Reproduced", runs, "- `captures/run-1.png`")).problems,
		/Reproduced needs a recording in Evidence/,
	);
	for (const recording of ["captures/run-1.webm", "captures/run-1.trace", "captures/run-1-trace.zip"]) {
		assert.equal(check(verdict("Reproduced", runs, `- \`${recording}\``)).status, 0, recording);
	}
	assert.equal(check(verdict("Reproduced", runs, "- `https://ci.example/run/7/video.mp4?raw=1`")).status, 0);
	assert.equal(check(verdict("Could not reproduce", [ORDER, "Runs: 1 of 2"], "- `captures/run-1.png`")).status, 0);
	const fix = [ORDER, "Baseline runs: 2 of 2", "Patched runs: 0 of 2", "Pass-to-fail: none"];
	assert.match(
		check(verdict("Confirmed", fix, "- `captures/patched-run-2.png`")).problems,
		/Confirmed needs a recording in Evidence/,
	);
});

test("an empty evidence file is not evidence", () => {
	const { status, problems } = check(verdict("Reproduced", [ORDER, "Runs: 2 of 2"]), undefined, "");
	assert.equal(status, 1);
	assert.match(problems, /evidence file is empty: captures\/run-1\.webm/);
	assert.match(problems, /Reproduced needs a recording in Evidence/);
});

test("Reproduced needs the broken state on at least two runs", () => {
	assert.equal(check(verdict("Reproduced", [ORDER, "Runs: 2 of 3"])).status, 0);
	assert.match(
		check(verdict("Reproduced", [ORDER, "Runs: 1 of 3"])).problems,
		/Reproduced needs the broken state on at least 2 runs/,
	);
});

test("one run is never enough", () => {
	assert.match(
		check(verdict("Could not reproduce", [ORDER, "Runs: 0 of 1"])).problems,
		/Runs needs at least 2 runs/,
	);
});

test("runs are counted as K of N with an order", () => {
	assert.match(check(verdict("Reproduced", [ORDER, "Runs: twice"])).problems, /must start with "K of N"/);
	assert.match(check(verdict("Reproduced", ["Runs: 2 of 2"])).problems, /lacks "Order:"/);
});

test("Confirmed needs more clean patched runs after an intermittent baseline", () => {
	const fix = (patched) =>
		verdict("Confirmed", [ORDER, "Baseline runs: 2 of 4", `Patched runs: ${patched}`, "Pass-to-fail: none"]);
	assert.match(check(fix("0 of 4")).problems, /a 2 of 4 baseline needs at least 5 patched runs/);
	assert.equal(check(fix("0 of 5")).status, 0);
});

test("each run field appears once and counts are whole numbers", () => {
	assert.match(check(verdict("PASS", [ORDER, "Runs: 5 of 5", "Runs: 0 of 2"])).problems, /Runs appears more than once/);
	assert.match(check(verdict("Reproduced", [ORDER, "Runs: 2 of 3.9"])).problems, /must start with "K of N"/);
	assert.equal(check(verdict("Reproduced", [ORDER, "Runs : 2 of 3."])).status, 0);
});

test("the verdict carries a label and the H1 comes first", () => {
	const unlabeled = verdict("Reproduced", [ORDER, "Runs: 2 of 2"]).replace("Reproduced. Measured.", "Reproduced.");
	assert.match(check(unlabeled).problems, /lacks a measured, inferred, or guess label/);
	const [title, ...rest] = verdict("Blocked", []).split("\n");
	assert.match(check([...rest, title].join("\n")).problems, /H1 title comes after the first section/);
	assert.equal(check(`\uFEFF${verdict("Blocked", [])}`).status, 0, "a byte-order mark does not hide the H1");
});

test("evidence accepts existing files with long extensions and line suffixes", () => {
	const cites = "- `trace.heapsnapshot`\n- `shot.png:12`";
	assert.equal(check(verdict("Blocked", [], cites), ["trace.heapsnapshot", "shot.png"]).status, 0);
	assert.match(check(verdict("Blocked", [], "- `shot.png:12`"), []).problems, /evidence path not found: shot\.png:12/);
});

test("Pass-to-fail takes none or check names, not a placeholder", () => {
	const lines = [ORDER, "Baseline runs: 2 of 2", "Patched runs: 0 of 2", "Pass-to-fail: n/a"];
	assert.match(check(verdict("Insufficient fix", lines)).problems, /write "none" or name the checks/);
});

test("the patched run table in the reference matches the checker", () => {
	const rows = [...reference.matchAll(/^\| (\d+) of (\d+) \| (\d+) \|\r?$/gm)];
	assert.ok(rows.length >= 3, "reference holds the patched run table");
	for (const [, failed, total, needed] of rows) {
		const fix = (patched) =>
			verdict("Confirmed", [ORDER, `Baseline runs: ${failed} of ${total}`, `Patched runs: 0 of ${patched}`, "Pass-to-fail: none"]);
		assert.equal(check(fix(needed)).status, 0, `${failed} of ${total} passes with ${needed} clean runs`);
		assert.equal(check(fix(needed - 1)).status, 1, `${failed} of ${total} fails with ${needed - 1} clean runs`);
	}
});

test("Confirmed allows no check that went from pass to fail", () => {
	const lines = [ORDER, "Baseline runs: 2 of 2", "Patched runs: 0 of 2", "Pass-to-fail: export dialog check"];
	assert.match(check(verdict("Confirmed", lines)).problems, /Confirmed needs "Pass-to-fail: none"/);
});

test("Insufficient fix needs a failing patched run or a pass-to-fail check", () => {
	const fix = (patched, passToFail) =>
		verdict("Insufficient fix", [ORDER, "Baseline runs: 2 of 2", `Patched runs: ${patched}`, `Pass-to-fail: ${passToFail}`]);
	assert.match(check(fix("0 of 5", "none")).problems, /a failing patched run or a Pass-to-fail check/);
	assert.equal(check(fix("1 of 3", "none")).status, 0);
	assert.equal(check(fix("0 of 3", "export dialog check")).status, 0);
});

test("gate verdicts follow the failing run count", () => {
	assert.match(check(verdict("PASS", [ORDER, "Runs: 1 of 3"])).problems, /a passing verdict allows no failing run/);
	assert.equal(check(verdict("FAIL", [ORDER, "Runs: 1 of 2"])).status, 0);
});

test("Blocked needs a surface and an environment but no runs", () => {
	assert.equal(check(verdict("Blocked", [])).status, 0);
	const noEnvironment = verdict("Blocked", []).replace(/^Environment:.*\n/m, "");
	assert.match(check(noEnvironment).problems, /lacks "Environment:"/);
});

test("a reproduce-issue verdict needs Fix artifact and Missing lines, a gate verdict does not", () => {
	const runs = [ORDER, "Runs: 2 of 2"];
	assert.match(check(verdict("Reproduced", runs, undefined, ["Missing: none"])).problems, /Verdict lacks "Fix artifact:"/);
	assert.match(check(verdict("Inconclusive", [], undefined, ["Fix artifact: none"])).problems, /Verdict lacks "Missing:"/);
	assert.equal(check(verdict("PASS", [ORDER, "Runs: 0 of 2"], undefined, [])).status, 0);
	assert.equal(check(verdict("Unproven", [], undefined, [])).status, 0);
});

test("Fix artifact holds a URL or none, and a fix verdict holds the URL", () => {
	const named = ["Fix artifact: PR 123", "Missing: none"];
	assert.match(check(verdict("Reproduced", [ORDER, "Runs: 2 of 2"], undefined, named)).problems, /Fix artifact: write a URL or "none"/);
	const unlinked = ["Fix artifact: none", "Missing: none"];
	const confirmed = [ORDER, "Baseline runs: 2 of 2", "Patched runs: 0 of 2", "Pass-to-fail: none"];
	assert.match(check(verdict("Confirmed", confirmed, undefined, unlinked)).problems, /a fix verdict needs a URL in "Fix artifact:"/);
	const insufficient = [ORDER, "Baseline runs: 2 of 2", "Patched runs: 1 of 3", "Pass-to-fail: none"];
	assert.match(check(verdict("Insufficient fix", insufficient, undefined, unlinked)).problems, /a fix verdict needs a URL/);
});

test("Blocked names what was missing, once", () => {
	for (const missing of ["none", "n/a"]) {
		const lines = ["Fix artifact: none", `Missing: ${missing}`];
		assert.match(check(verdict("Blocked", [], undefined, lines)).problems, /Blocked needs "Missing:" to name what was missing/);
	}
	const twice = [...verdictLines("Blocked"), "Missing: a seeded account"];
	assert.match(check(verdict("Blocked", [], undefined, twice)).problems, /Missing appears more than once/);
});

test("prose rejects long dashes", () => {
	const dashed = verdict("Blocked", []).replace("after a reload.", "after a reload \u2014 every time.");
	assert.match(check(dashed).problems, /long dash/);
});

test("the checker exits 2 without a file", () => {
	assert.equal(spawnSync(process.execPath, [checker]).status, 2);
});

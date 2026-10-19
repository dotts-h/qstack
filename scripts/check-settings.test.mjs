import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const checker = path.join(here, "check-settings.mjs");
const reference = fs.readFileSync(
	path.join(here, "..", "skills", "qstack-mode", "references", "settings.md"),
	"utf8",
);
const example = JSON.parse(reference.match(/^```json\r?\n([\s\S]*?)^```\r?$/m)[1]);
const MAP = ".cursor/qstack/feature-map.md";

function check(use, settings, files = [MAP]) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "qstack-settings-"));
	try {
		for (const name of files) {
			const target = path.join(root, name);
			fs.mkdirSync(name.endsWith("/") ? target : path.dirname(target), { recursive: true });
			if (!name.endsWith("/")) fs.writeFileSync(target, "x");
		}
		const file = path.join(root, ".cursor", "qstack", "settings.json");
		if (settings !== undefined) {
			fs.mkdirSync(path.dirname(file), { recursive: true });
			const raw = typeof settings === "string" || Buffer.isBuffer(settings);
			fs.writeFileSync(file, raw ? settings : JSON.stringify(settings));
		}
		const result = spawnSync(process.execPath, [checker, file, use], { encoding: "utf8" });
		return { status: result.status, problems: result.stderr };
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
}

const adapter = (control = {}) => ({
	control: { skill_name: "playwright-cli", feature_map_path: MAP, ...control },
});

test("the example in the settings reference passes both uses", () => {
	const files = [example.control.feature_map_path, example.routing.map_path];
	for (const use of ["reproduce", "triage"]) {
		const { status, problems } = check(use, example, files);
		assert.equal(status, 0, problems);
	}
});

test("a missing or unreadable settings file fails closed with one problem", () => {
	const json = JSON.stringify(adapter());
	for (const [settings, problem, files] of [
		[undefined, /settings file not found/],
		[undefined, /the settings path is a folder, not a file/, [MAP, ".cursor/qstack/settings.json/"]],
		["{ control: ", /not valid JSON/],
		["[]", /must be a JSON object/],
		[Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(json, "utf16le")]), /the file is UTF-16LE\. Save it as UTF-8/],
		[Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(json, "utf16le").swap16()]), /the file is UTF-16BE\. Save it as UTF-8/],
	]) {
		const { status, problems } = check("reproduce", settings, files);
		assert.equal(status, 1);
		assert.match(problems, problem);
		assert.equal(problems.trim().split("\n").length, 1, problems);
	}
	assert.equal(check("reproduce", `\uFEFF${JSON.stringify(adapter())}`).status, 0, "a byte-order mark is not a parse error");
});

test("reproduce needs the adapter skill and a feature map that exists", () => {
	assert.equal(check("reproduce", adapter()).status, 0);
	assert.match(
		check("reproduce", { control: { feature_map_path: MAP } }).problems,
		/control\.skill_name is required for reproduce/,
	);
	assert.match(check("reproduce", adapter({ skill_name: " " })).problems, /control\.skill_name must be a non-empty string/);
	assert.match(check("reproduce", adapter(), []).problems, /control\.feature_map_path not found: .*feature-map\.md/);
});

test("a map path must name a file, not a folder", () => {
	assert.match(check("reproduce", adapter(), [`${MAP}/`]).problems, /control\.feature_map_path is a folder, not a file/);
	const routing = { routing: { map_path: ".cursor/qstack/routing" } };
	assert.match(check("triage", routing, [".cursor/qstack/routing/"]).problems, /routing\.map_path is a folder, not a file/);
	assert.equal(check("triage", routing, [".cursor/qstack/routing"]).status, 0);
});

test("relative paths resolve from the folder that holds .cursor", () => {
	assert.equal(check("reproduce", adapter({ feature_map_path: "maps/app.md" }), ["maps/app.md"]).status, 0);
	assert.equal(check("reproduce", adapter({ feature_map_path: "feature-map.md" })).status, 1);
});

test("captures stay outside the repository", () => {
	assert.match(
		check("reproduce", adapter({ artifact_directory: ".cursor/qstack/captures" })).problems,
		/control\.artifact_directory is inside the workspace/,
	);
	assert.equal(check("reproduce", adapter({ artifact_directory: path.join(os.tmpdir(), "qstack") })).status, 0);
});

test("retention is a positive number of hours", () => {
	assert.equal(check("reproduce", adapter({ artifact_retention_hours: 24 })).status, 0);
	for (const hours of [0, -1, "24"]) {
		assert.match(
			check("reproduce", adapter({ artifact_retention_hours: hours })).problems,
			/positive number of hours/,
			String(hours),
		);
	}
});

test("the recording is a video or a trace", () => {
	for (const recording of ["video", "trace"]) assert.equal(check("reproduce", adapter({ recording })).status, 0, recording);
	for (const recording of ["mp4", "Video", 7, ""]) {
		assert.match(
			check("reproduce", adapter({ recording })).problems,
			/control\.recording must be "video" or "trace"/,
			String(recording),
		);
	}
	assert.equal(check("triage", adapter({ recording: "mp4" })).status, 0);
});

test("triage needs no key but checks a routing map it is given", () => {
	assert.equal(check("triage", {}).status, 0);
	assert.match(
		check("triage", { routing: { map_path: ".cursor/qstack/routing.md" } }).problems,
		/routing\.map_path not found/,
	);
	assert.match(
		check("triage", { tracker: { adapter_skill_name: 7 } }).problems,
		/tracker\.adapter_skill_name must be a non-empty string/,
	);
});

test("each use checks only the keys it reads", () => {
	const settings = { ...adapter({ artifact_retention_hours: "24" }), routing: { map_path: "missing.md" } };
	const reproduce = check("reproduce", settings).problems;
	assert.match(reproduce, /positive number of hours/);
	assert.doesNotMatch(reproduce, /routing/);
	const triage = check("triage", settings).problems;
	assert.match(triage, /routing\.map_path not found/);
	assert.doesNotMatch(triage, /hours/);
});

test("the checker exits 2 without a file or a known use", () => {
	assert.equal(spawnSync(process.execPath, [checker]).status, 2);
	for (const use of ["deploy", "constructor", "__proto__", "toString"]) {
		const result = spawnSync(process.execPath, [checker, "settings.json", use], { encoding: "utf8" });
		assert.equal(result.status, 2, use);
		assert.match(result.stderr, /^Usage: /, use);
	}
});

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const READS = {
	reproduce: {
		required: ["control.skill_name", "control.feature_map_path"],
		optional: ["control.artifact_directory", "control.artifact_retention_hours", "slack.operations_channel_id"],
	},
	triage: {
		required: [],
		optional: ["routing.map_path", "tracker.adapter_skill_name"],
	},
};
const KIND = {
	"control.skill_name": "name",
	"control.feature_map_path": "file",
	"control.artifact_directory": "outside",
	"control.artifact_retention_hours": "hours",
	"routing.map_path": "file",
	"tracker.adapter_skill_name": "name",
	"slack.operations_channel_id": "name",
};

const [file, use] = process.argv.slice(2);
if (!file || !Object.hasOwn(READS, use)) {
	console.error("Usage: node scripts/check-settings.mjs <settings.json> <reproduce|triage>");
	process.exit(2);
}

const problems = [];
const fail = (message) => problems.push(`${file}: ${message}`);

function workspaceRoot() {
	const own = path.dirname(path.resolve(file));
	for (let dir = own; ; dir = path.dirname(dir)) {
		if (path.basename(dir) === ".cursor") return path.dirname(dir);
		if (path.dirname(dir) === dir) return own;
	}
}

function read() {
	if (!fs.existsSync(file)) {
		fail("settings file not found");
		return null;
	}
	const bytes = fs.readFileSync(file);
	const utf16 = { fffe: "UTF-16LE", feff: "UTF-16BE" }[bytes.subarray(0, 2).toString("hex")];
	if (utf16) {
		fail(`the file is ${utf16}. Save it as UTF-8`);
		return null;
	}
	let settings;
	try {
		settings = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
	} catch (error) {
		fail(`not valid JSON: ${error.message}`);
		return null;
	}
	if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
		fail("settings must be a JSON object");
		return null;
	}
	return settings;
}

const lookup = (settings, key) =>
	key.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), settings);

function checkValue(key, value, root) {
	if (KIND[key] === "hours") {
		if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
			fail(`${key} must be a positive number of hours`);
		}
		return;
	}
	if (typeof value !== "string" || !value.trim()) return fail(`${key} must be a non-empty string`);
	const resolved = path.resolve(root, value);
	if (KIND[key] === "file") {
		if (!fs.existsSync(resolved)) fail(`${key} not found: ${resolved}`);
		else if (fs.statSync(resolved).isDirectory()) fail(`${key} is a folder, not a file: ${resolved}`);
	}
	if (KIND[key] === "outside") {
		const inside = path.relative(root, resolved);
		const outside = inside === ".." || inside.startsWith(`..${path.sep}`) || path.isAbsolute(inside);
		if (!outside) {
			fail(`${key} is inside the workspace at ${resolved}. Keep captures outside the repository`);
		}
	}
}

const settings = read();
if (settings) {
	const root = workspaceRoot();
	const { required, optional } = READS[use];
	for (const key of [...required, ...optional]) {
		const value = lookup(settings, key);
		if (value === undefined) {
			if (required.includes(key)) fail(`${key} is required for ${use}`);
			continue;
		}
		checkValue(key, value, root);
	}
}

console.log(`${file}: settings=${problems.length ? "invalid" : "ok"} use=${use} problems=${problems.length}`);
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);

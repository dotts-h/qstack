#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ALLOWED_VERDICTS = [
	"Reproduced",
	"Could not reproduce",
	"Blocked",
	"Confirmed",
	"Insufficient fix",
	"Inconclusive",
	"PASS",
	"PASS+NOTES",
	"FAIL",
	"Pass",
	"Fail",
	"Unproven",
];
const REQUIRED_SECTIONS = [
	"Verdict",
	"Expected and broken state",
	"Surface and runs",
	"Evidence",
];
const VERDICT_FIELDS = {
	fixArtifact: "Fix artifact",
	missing: "Missing",
};
const RUN_FIELDS = {
	surface: "Surface",
	environment: "Environment",
	order: "Order",
	runs: "Runs",
	baseline: "Baseline runs",
	patched: "Patched runs",
	passToFail: "Pass-to-fail",
	timing: "Timing",
};
const COUNT_FIELDS = ["runs", "baseline", "patched"];
const SURFACE = /\b(UI|CLI|API|service|browser|desktop|mobile|harness|trace)\b/i;
const COUNT = /^(\d+)\s+of\s+(\d+)(?!\.?\d)/i;
const NONE = /^none\.?$/i;
const PLACEHOLDER = /^(n\/?a|no|nothing|nil|null|-+)\.?$/i;
const URL_TOKEN = /^[a-z][a-z0-9+.-]*:\/\//i;
const COMMIT_SHA = /^[0-9a-f]{7,40}(?![0-9a-z])/i;
const PATH_TOKEN = /[\\/]|\.[A-Za-z][A-Za-z0-9]*$/;
const LINE_SUFFIX = /:\d+(?::\d+)?$/;
const LABEL = /\b(measured|inferred|guess)\b/i;
const RECORDING = /\.(webm|mp4|mov|mkv|trace)$|trace[^\\/]*\.zip$/i;
const TIMING_DATA = /\.(json|jsonl|csv|sqlite|db|cpuprofile)$/i;
const NEEDS_RECORDING = ["Reproduced", "Confirmed", "Insufficient fix"];
const LUCKY_PASS_RISK = 0.05;

function patchedRunsNeeded({ failed, total }) {
	if (failed >= total) return 2;
	return Math.max(2, Math.ceil(Math.log(LUCKY_PASS_RISK) / Math.log(1 - failed / total)));
}

const SINGLE = ["order", "runs"];
const PAIRED = ["order", "baseline", "patched", "passToFail"];
const passing = {
	needs: SINGLE,
	check: ({ runs }) => [runs.failed > 0 && "a passing verdict allows no failing run"],
};
const failing = {
	needs: SINGLE,
	check: ({ runs }) => [runs.failed === 0 && "a failing verdict needs at least 1 failing run"],
};
const RUN_RULES = {
	Reproduced: {
		needs: SINGLE,
		check: ({ runs }) => [
			runs.failed < 2 && "Reproduced needs the broken state on at least 2 runs",
		],
	},
	"Could not reproduce": {
		needs: SINGLE,
		check: ({ runs }) => [
			runs.failed >= 2 && "the broken state appeared on 2 or more runs, so the verdict is Reproduced",
		],
	},
	Confirmed: {
		needs: PAIRED,
		check: ({ baseline, patched, passToFail }) => {
			const needed = patchedRunsNeeded(baseline);
			return [
				baseline.failed < 2 && "Confirmed needs the broken state on at least 2 baseline runs",
				patched.failed > 0 && "Confirmed allows no failing patched run",
				patched.total < needed &&
					`a ${baseline.failed} of ${baseline.total} baseline needs at least ${needed} patched runs`,
				!NONE.test(passToFail.value) && 'Confirmed needs "Pass-to-fail: none"',
			];
		},
	},
	"Insufficient fix": {
		needs: PAIRED,
		check: ({ baseline, patched, passToFail }) => [
			baseline.failed < 2 && "Insufficient fix needs the broken state on at least 2 baseline runs",
			patched.failed === 0 &&
				NONE.test(passToFail.value) &&
				"Insufficient fix needs a failing patched run or a Pass-to-fail check",
		],
	},
	PASS: passing,
	"PASS+NOTES": passing,
	Pass: passing,
	FAIL: failing,
	Fail: failing,
};

const presenceOnly = () => [];
const namesFix = (value) => URL_TOKEN.test(value) || COMMIT_SHA.test(value);
const linksFix = ({ fixArtifact }) => [
	!namesFix(fixArtifact.value) && 'a fix verdict needs a URL or a commit SHA in "Fix artifact:"',
];
const REPRODUCE_RULES = {
	Reproduced: presenceOnly,
	"Could not reproduce": presenceOnly,
	Blocked: ({ missing }) => [
		(NONE.test(missing.value) || PLACEHOLDER.test(missing.value)) &&
			'Blocked needs "Missing:" to name what was missing',
	],
	Confirmed: linksFix,
	"Insufficient fix": linksFix,
	Inconclusive: presenceOnly,
};

const file = process.argv[2];
if (!file) {
	console.error("Usage: node scripts/check-verdict.mjs <verdict.md>");
	process.exit(2);
}

const problems = [];
const fail = (line, message) => problems.push(`${file}:${line}: ${message}`);
function report(token) {
	console.log(`${file}: verdict=${token} problems=${problems.length}`);
	for (const problem of problems) console.error(problem);
	process.exit(problems.length > 0 ? 1 : 0);
}

let bytes;
try {
	bytes = fs.readFileSync(file);
} catch (error) {
	console.error(`${file}: ${error.message}`);
	process.exit(2);
}
const utf16 = { fffe: "UTF-16LE", feff: "UTF-16BE" }[bytes.subarray(0, 2).toString("hex")];
if (utf16) {
	fail(1, `the file is ${utf16}. Save it as UTF-8`);
	report("missing");
}
const raw = bytes.toString("utf8").replace(/^\uFEFF/, "").split(/\r?\n/);

let start = 0;
if (raw[0] === "---") start = raw.indexOf("---", 1) + 1;

const lines = [];
let fence = null;
const openingFence = (text) => {
	const match = text.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
	if (!match || (match[1][0] === "`" && match[2].includes("`"))) return null;
	return { char: match[1][0], length: match[1].length };
};
const closingFence = (text, opening) => {
	const match = text.match(/^ {0,3}(`+|~+)[ \t]*$/);
	return Boolean(
		match && match[1][0] === opening.char && match[1].length >= opening.length,
	);
};
for (let i = start; i < raw.length; i++) {
	const text = raw[i];
	const n = i + 1;
	let code = Boolean(fence);
	if (fence && closingFence(text, fence)) {
		code = false;
		fence = null;
	} else if (!fence) {
		fence = openingFence(text);
		code = Boolean(fence);
	}
	lines.push({ n, text, code });
	if (code) continue;
	const prose = text
		.replace(/`[^`]*`/g, "`")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\]\([^)]*\)/g, "]");
	if (/[\u2013\u2014]/.test(prose)) fail(n, "long dash");
	if (/[\u2018\u2019\u201c\u201d]/.test(prose)) fail(n, "curly quote");
}

const sections = [];
for (const line of lines) {
	const title = !line.code && line.text.startsWith("## ") ? line.text.slice(3).trim() : null;
	if (title !== null) sections.push({ title, n: line.n, body: [] });
	else if (sections.length) sections.at(-1).body.push(line);
}
const bodyText = (section) => section.body.map((line) => line.text).join("\n");
const proseLines = (section) => section.body.filter((line) => !line.code);

function matchVerdict(text) {
	let best = null;
	for (const token of ALLOWED_VERDICTS) {
		const body = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const match = new RegExp(`(?:^|[^A-Za-z0-9_])(${body})(?![A-Za-z0-9_])`).exec(text);
		if (!match) continue;
		const at = match.index + match[0].length - match[1].length;
		if (!best || at < best.at || (at === best.at && token.length > best.token.length)) {
			best = { token, at };
		}
	}
	return best ? best.token : null;
}

function readFields(section, labels) {
	const keyByLabel = Object.fromEntries(
		Object.entries(labels).map(([key, label]) => [label.toLowerCase(), key]),
	);
	const fields = {};
	for (const line of proseLines(section)) {
		const match = line.text.match(/^\s*(?:[-*]\s+)?(\*\*|__)?([A-Za-z -]+?)\s*(?:\1\s*:|:\s*\1)\s*(.*)$/);
		const key = match && keyByLabel[match[2].replace(/\s+/g, " ").toLowerCase()];
		const value = match?.[3].trim();
		if (!key || !value) continue;
		if (fields[key]) fail(line.n, `${labels[key]} appears more than once`);
		else fields[key] = { value, n: line.n };
	}
	return fields;
}

function checkVerdictLines(section, verdict) {
	const rule = REPRODUCE_RULES[verdict];
	if (!rule) return;
	const fields = readFields(section, VERDICT_FIELDS);
	const absent = Object.keys(VERDICT_FIELDS).filter((key) => !fields[key]);
	for (const key of absent) fail(section.n, `Verdict lacks "${VERDICT_FIELDS[key]}:"`);
	if (absent.length) return;
	if (!namesFix(fields.fixArtifact.value) && !NONE.test(fields.fixArtifact.value)) {
		fail(fields.fixArtifact.n, 'Fix artifact: write a URL, a commit SHA, or "none"');
	}
	for (const message of rule(fields).filter(Boolean)) fail(section.n, message);
}

function readRunRecord(section) {
	const record = readFields(section, RUN_FIELDS);
	if (record.passToFail && PLACEHOLDER.test(record.passToFail.value)) {
		fail(record.passToFail.n, 'Pass-to-fail: write "none" or name the checks');
	}
	if (record.timing && (NONE.test(record.timing.value) || PLACEHOLDER.test(record.timing.value))) {
		fail(record.timing.n, "Timing: name the clock that timed each run, or leave the line out");
		delete record.timing;
	}
	for (const key of COUNT_FIELDS) {
		const field = record[key];
		if (!field) continue;
		record[key] = null;
		const count = field.value.match(COUNT);
		if (!count) {
			fail(field.n, `${RUN_FIELDS[key]} must start with "K of N"`);
			continue;
		}
		const failed = Number(count[1]);
		const total = Number(count[2]);
		if (failed > total) fail(field.n, `${RUN_FIELDS[key]} counts more failing runs than runs`);
		else record[key] = { failed, total, n: field.n };
	}
	return record;
}

function checkRunRecord(section, verdict, record) {
	const rule = RUN_RULES[verdict];
	const needs = ["surface", "environment", ...(rule?.needs ?? [])];
	const missing = needs.filter((key) => record[key] === undefined);
	for (const key of missing) fail(section.n, `Surface and runs lacks "${RUN_FIELDS[key]}:"`);
	if (record.surface && !SURFACE.test(record.surface.value)) {
		fail(record.surface.n, "Surface names no UI, CLI, API, service, browser, desktop, mobile, harness, or trace");
	}
	if (!rule || needs.some((key) => !record[key])) return;
	for (const key of COUNT_FIELDS) {
		if (rule.needs.includes(key) && record[key].total < 2) {
			fail(record[key].n, `${RUN_FIELDS[key]} needs at least 2 runs`);
		}
	}
	for (const message of rule.check(record).filter(Boolean)) fail(section.n, message);
}

function checkEvidence(section, verdict, timing) {
	const base = path.dirname(path.resolve(file));
	const countsAsRecording = (name) => RECORDING.test(name) || (timing && TIMING_DATA.test(name));
	let cited = 0;
	let recorded = false;
	for (const line of proseLines(section)) {
		for (const match of line.text.matchAll(/`([^`]+)`/g)) {
			const token = match[1].trim();
			if (URL_TOKEN.test(token)) {
				cited++;
				recorded ||= countsAsRecording(token.replace(/[?#].*$/, ""));
				continue;
			}
			const candidate = token.replace(LINE_SUFFIX, "");
			if (!candidate) continue;
			const target = path.resolve(base, candidate);
			const exists = fs.existsSync(target);
			if (!exists && !PATH_TOKEN.test(candidate)) continue;
			cited++;
			if (!exists) {
				fail(line.n, `evidence path not found: ${token}`);
				continue;
			}
			const stat = fs.statSync(target);
			if (stat.isFile() && stat.size === 0) fail(line.n, `evidence file is empty: ${token}`);
			else recorded ||= countsAsRecording(candidate);
		}
	}
	if (!cited) fail(section.n, "Evidence cites no backticked path or URL");
	if (NEEDS_RECORDING.includes(verdict) && !recorded) {
		const needed = timing ? "a recording or timing data in Evidence" : "a recording in Evidence, a video or a trace";
		fail(section.n, `${verdict} needs ${needed}`);
	}
}

const h1 = lines.find((line) => !line.code && line.text.startsWith("# "));
if (!h1) fail(1, "no H1 title");
else if (sections.length && h1.n > sections[0].n) fail(h1.n, "H1 title comes after the first section");

let verdict = null;
let record = {};
let previous = 0;
for (const title of REQUIRED_SECTIONS) {
	const section = sections.find((item) => item.title === title);
	if (!section) {
		fail(1, `missing "## ${title}"`);
		continue;
	}
	if (section.n < previous) fail(section.n, `"## ${title}" is out of order`);
	previous = section.n;
	const text = bodyText(section);
	if (title === "Verdict") {
		verdict = matchVerdict(text);
		if (!verdict) fail(section.n, `Verdict lacks an allowed token, one of ${ALLOWED_VERDICTS.join(", ")}`);
		if (!LABEL.test(text)) fail(section.n, "Verdict lacks a measured, inferred, or guess label");
		checkVerdictLines(section, verdict);
	} else if (title === "Expected and broken state") {
		if (!text.trim()) fail(section.n, "Expected and broken state is empty");
		else {
			if (!/expected/i.test(text)) fail(section.n, "Expected and broken state lacks expected");
			if (!/\b(broken|observed)\b/i.test(text)) {
				fail(section.n, "Expected and broken state lacks broken or observed");
			}
		}
	} else if (title === "Surface and runs") {
		record = readRunRecord(section);
		checkRunRecord(section, verdict, record);
	} else if (title === "Evidence") {
		checkEvidence(section, verdict, Boolean(record.timing));
	}
}

report(verdict ?? "missing");

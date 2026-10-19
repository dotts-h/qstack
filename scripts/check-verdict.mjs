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
const RUN_FIELDS = {
	surface: "Surface",
	environment: "Environment",
	order: "Order",
	runs: "Runs",
	baseline: "Baseline runs",
	patched: "Patched runs",
	passToFail: "Pass-to-fail",
};
const FIELD_BY_LABEL = Object.fromEntries(
	Object.entries(RUN_FIELDS).map(([key, label]) => [label.toLowerCase(), key]),
);
const COUNT_FIELDS = ["runs", "baseline", "patched"];
const SURFACE = /\b(UI|CLI|API|browser|desktop|mobile|harness|trace)\b/i;
const COUNT = /^(\d+)\s+of\s+(\d+)(?!\.?\d)/i;
const NONE = /^none\.?$/i;
const PLACEHOLDER = /^(n\/?a|no|nothing|nil|null|-+)\.?$/i;
const URL_TOKEN = /^[a-z][a-z0-9+.-]*:\/\//i;
const PATH_TOKEN = /[\\/]|\.[A-Za-z][A-Za-z0-9]*$/;
const LINE_SUFFIX = /:\d+(?::\d+)?$/;
const LABEL = /\b(measured|inferred|guess)\b/i;
const RECORDING = /\.(webm|mp4|mov|mkv|trace)$|trace[^\\/]*\.zip$/i;
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

const file = process.argv[2];
if (!file) {
	console.error("Usage: node scripts/check-verdict.mjs <verdict.md>");
	process.exit(2);
}

const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
const problems = [];
const fail = (line, message) => problems.push(`${file}:${line}: ${message}`);

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

function readRunRecord(section) {
	const record = {};
	const seen = new Set();
	for (const line of proseLines(section)) {
		const match = line.text.match(/^\s*(?:[-*]\s+)?([A-Za-z -]+?)\s*:\s*(.*)$/);
		const key = match && FIELD_BY_LABEL[match[1].replace(/\s+/g, " ").toLowerCase()];
		const value = match?.[2].trim();
		if (!key || !value) continue;
		if (seen.has(key)) {
			fail(line.n, `${RUN_FIELDS[key]} appears more than once`);
			continue;
		}
		seen.add(key);
		if (key === "passToFail" && PLACEHOLDER.test(value)) {
			fail(line.n, 'Pass-to-fail: write "none" or name the checks');
		}
		if (!COUNT_FIELDS.includes(key)) {
			record[key] = { value, n: line.n };
			continue;
		}
		const count = value.match(COUNT);
		if (!count) {
			fail(line.n, `${RUN_FIELDS[key]} must start with "K of N"`);
			continue;
		}
		const failed = Number(count[1]);
		const total = Number(count[2]);
		if (failed > total) fail(line.n, `${RUN_FIELDS[key]} counts more failing runs than runs`);
		else record[key] = { failed, total, n: line.n };
	}
	return record;
}

function checkRunRecord(section, verdict) {
	const record = readRunRecord(section);
	const rule = RUN_RULES[verdict];
	const needs = ["surface", "environment", ...(rule?.needs ?? [])];
	const missing = needs.filter((key) => !record[key]);
	for (const key of missing) fail(section.n, `Surface and runs lacks "${RUN_FIELDS[key]}:"`);
	if (record.surface && !SURFACE.test(record.surface.value)) {
		fail(record.surface.n, "Surface names no UI, CLI, API, browser, desktop, mobile, harness, or trace");
	}
	if (!rule || missing.length) return;
	for (const key of COUNT_FIELDS) {
		if (rule.needs.includes(key) && record[key].total < 2) {
			fail(record[key].n, `${RUN_FIELDS[key]} needs at least 2 runs`);
		}
	}
	for (const message of rule.check(record).filter(Boolean)) fail(section.n, message);
}

function checkEvidence(section, verdict) {
	const base = path.dirname(path.resolve(file));
	let cited = 0;
	let recorded = false;
	for (const line of proseLines(section)) {
		for (const match of line.text.matchAll(/`([^`]+)`/g)) {
			const token = match[1].trim();
			if (URL_TOKEN.test(token)) {
				cited++;
				recorded ||= RECORDING.test(token.replace(/[?#].*$/, ""));
				continue;
			}
			if (/\s/.test(token)) continue;
			const candidate = token.replace(LINE_SUFFIX, "");
			const target = path.resolve(base, candidate);
			if (!fs.existsSync(target)) {
				if (PATH_TOKEN.test(candidate)) fail(line.n, `evidence path not found: ${token}`);
				continue;
			}
			cited++;
			const stat = fs.statSync(target);
			if (stat.isFile() && stat.size === 0) fail(line.n, `evidence file is empty: ${token}`);
			else recorded ||= RECORDING.test(candidate);
		}
	}
	if (!cited) fail(section.n, "Evidence cites no backticked path or URL");
	if (NEEDS_RECORDING.includes(verdict) && !recorded) {
		fail(section.n, `${verdict} needs a recording in Evidence, a video or a trace`);
	}
}

const h1 = lines.find((line) => !line.code && line.text.startsWith("# "));
if (!h1) fail(1, "no H1 title");
else if (sections.length && h1.n > sections[0].n) fail(h1.n, "H1 title comes after the first section");

let verdict = null;
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
		if (!verdict) fail(section.n, "Verdict lacks an allowed token");
		if (!LABEL.test(text)) fail(section.n, "Verdict lacks a measured, inferred, or guess label");
	} else if (title === "Expected and broken state") {
		if (!text.trim()) fail(section.n, "Expected and broken state is empty");
		else {
			if (!/expected/i.test(text)) fail(section.n, "Expected and broken state lacks expected");
			if (!/\b(broken|observed)\b/i.test(text)) {
				fail(section.n, "Expected and broken state lacks broken or observed");
			}
		}
	} else if (title === "Surface and runs") {
		checkRunRecord(section, verdict);
	} else if (title === "Evidence") {
		checkEvidence(section, verdict);
	}
}

const token = verdict ?? "missing";
console.log(`${file}: verdict=${token} problems=${problems.length}`);
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);

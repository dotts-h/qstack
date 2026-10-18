#!/usr/bin/env node
import fs from "node:fs";
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
const SKIP_TWO_RUNS = new Set(["Blocked", "Inconclusive", "Unproven"]);
const SURFACE = /\b(UI|CLI|API|browser|desktop|mobile|harness|trace)\b/i;
const TWO_RUNS = /\b(2x|twice|two runs|2 runs|runs:\s*2)\b/i;
const BACKTICKED = /`[^`]+`/;

const file = process.argv[2];
if (!file) {
	console.error("Usage: node scripts/check-verdict.mjs <verdict.md>");
	process.exit(2);
}

const raw = fs.readFileSync(file, "utf8").split(/\r?\n/);
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

if (!lines.some((line) => !line.code && line.text.startsWith("# "))) fail(1, "no H1 title");

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
	} else if (title === "Expected and broken state") {
		if (!text.trim()) fail(section.n, "Expected and broken state is empty");
		else {
			if (!/expected/i.test(text)) fail(section.n, "Expected and broken state lacks expected");
			if (!/\b(broken|observed)\b/i.test(text)) {
				fail(section.n, "Expected and broken state lacks broken or observed");
			}
		}
	} else if (title === "Surface and runs") {
		if (!SURFACE.test(text)) fail(section.n, "Surface and runs names no surface");
		if (!SKIP_TWO_RUNS.has(verdict) && !TWO_RUNS.test(text)) {
			fail(section.n, "Surface and runs confirms fewer than two runs");
		}
	} else if (title === "Evidence") {
		if (!BACKTICKED.test(text)) fail(section.n, "Evidence lacks a backticked path");
	}
}

const token = verdict ?? "missing";
console.log(`${file}: verdict=${token} problems=${problems.length}`);
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);

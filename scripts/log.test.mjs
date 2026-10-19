import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, "log.mjs");
const HEADER = "ts\tphase\tdecision\twhy\tevidence\tresult";

function withLog(run) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "qstack-log-"));
	try {
		const logfile = path.join(root, "runs", "today", "qstack.tsv");
		const log = (...fields) => spawnSync(process.execPath, [script, logfile, ...fields], { encoding: "utf8" });
		const rows = () => fs.readFileSync(logfile, "utf8").split("\n").slice(0, -1);
		run({ logfile, log, rows });
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
}

test("the log creates its folders, writes the header once, and adds one row per call", () => {
	withLog(({ log, rows }) => {
		assert.equal(log("reproduce", "drive", "report names a page", "run-1.webm", "Reproduced").status, 0);
		assert.equal(log("triage", "file", "clearly broken", "none", "Bug").status, 0);
		const [header, ...entries] = rows();
		assert.equal(header, HEADER);
		assert.equal(entries.length, 2);
		const [ts, ...fields] = entries[1].split("\t");
		assert.match(ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
		assert.deepEqual(fields, ["triage", "file", "clearly broken", "none", "Bug"]);
	});
});

test("a cell that a spreadsheet would run as a formula is quoted", () => {
	withLog(({ log, rows }) => {
		log("=HYPERLINK(1)", "+1", "-1", "@SUM(A1)", "a=b");
		assert.deepEqual(rows()[1].split("\t").slice(1), ["'=HYPERLINK(1)", "'+1", "'-1", "'@SUM(A1)", "a=b"]);
	});
});

test("tabs and line breaks in a cell become spaces, so each row stays one line of six cells", () => {
	withLog(({ log, rows }) => {
		log("reproduce", "drive\tagain", "line one\nline two", "a\r\nb", "done");
		const lines = rows();
		assert.equal(lines.length, 2);
		assert.deepEqual(lines[1].split("\t").slice(1), ["reproduce", "drive again", "line one line two", "a  b", "done"]);
	});
});

test("a wrong argument count prints usage, exits 1, and writes nothing", () => {
	withLog(({ logfile, log }) => {
		const result = log("reproduce", "drive", "why", "evidence");
		assert.equal(result.status, 1);
		assert.match(result.stderr, /^usage: node scripts\/log\.mjs/);
		assert.equal(fs.existsSync(path.dirname(logfile)), false);
	});
});

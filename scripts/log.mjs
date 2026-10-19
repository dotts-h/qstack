#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const HEADER = ["ts", "phase", "decision", "why", "evidence", "result"].join("\t") + "\n";

// Spreadsheets execute a cell that starts with =, +, -, or @. A quote keeps a bug title as text.
function cleanCell(raw) {
	const text = raw.replace(/[\t\n\r]/g, " ");
	const lead = text[0];
	if (lead === "=" || lead === "+" || lead === "-" || lead === "@") return `'${text}`;
	return text;
}

if (process.argv.length !== 8) {
	console.error(
		"usage: node scripts/log.mjs <logfile> <phase> <decision> <why> <evidence> <result>",
	);
	process.exit(1);
}

const logfile = process.argv[2];
const fields = process.argv.slice(3);
fs.mkdirSync(path.dirname(logfile), { recursive: true });

let size = 0;
try {
	size = fs.statSync(logfile).size;
} catch (err) {
	if (err.code !== "ENOENT") throw err;
}
if (size === 0) fs.appendFileSync(logfile, HEADER);

const ts = new Date().toISOString().slice(0, 19) + "Z";
fs.appendFileSync(logfile, [ts, ...fields].map(cleanCell).join("\t") + "\n");

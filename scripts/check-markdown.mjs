#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);

const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.name === ".git") return [];
		if (entry.isDirectory()) return walk(full);
		return full.endsWith(".md") ? [full] : [];
	});
const slug = (text) => text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
const headings = (file) =>
	new Set(
		fs
			.readFileSync(file, "utf8")
			.split(/\r?\n/)
			.filter((line) => /^#{1,6} /.test(line))
			.map((line) => slug(line.replace(/^#+ /, ""))),
	);

const files = walk(root);
for (const file of files) {
	const rel = path.relative(root, file);
	const text = fs.readFileSync(file, "utf8");
	const lines = text.split(/\r?\n/);
	if (path.basename(file) === "SKILL.md") {
		const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!front || !/^name: \S/m.test(front[1]) || !/^description: \S/m.test(front[1])) {
			fail(rel, "frontmatter lacks name or description");
		}
		if (lines.length > 500) fail(rel, `${lines.length} lines`);
	}
	const skillRoot = rel.startsWith("skills") ? path.join(root, ...rel.split(path.sep).slice(0, 2)) : root;
	const bases = [path.dirname(file), skillRoot, root];
	let fence = false;
	lines.forEach((line, i) => {
		const where = `${rel}:${i + 1}`;
		if (/^ {0,3}(```|~~~)/.test(line)) {
			fence = !fence;
			return;
		}
		if (fence) return;
		const prose = line.replace(/`[^`]*`/g, "");
		if (/[\u2013\u2014]/.test(prose)) fail(where, "long dash");
		if (/[\u2018\u2019\u201c\u201d]/.test(prose)) fail(where, "curly quote");
		for (const [, target, anchor] of line.matchAll(/\]\(([^)#\s]*)(#[^)\s]*)?\)/g)) {
			if (/^[a-z]+:/i.test(target) || target === "url") continue;
			const dest = target ? path.resolve(path.dirname(file), target) : file;
			if (!fs.existsSync(dest)) fail(where, `link not found ${target}`);
			else if (anchor && dest.endsWith(".md") && !headings(dest).has(anchor.slice(1))) {
				fail(where, `anchor not found ${target}${anchor}`);
			}
		}
		for (const [, token] of line.replace(/\[`[^`]+`\]/g, "").matchAll(/`([^`\s<>*]+\.(?:md|mjs))`/g)) {
			if (token.startsWith(".cursor/")) continue;
			if (!bases.some((base) => fs.existsSync(path.resolve(base, token)))) fail(where, `path not found ${token}`);
		}
	});
}

console.log(`${root}: markdown files=${files.length} problems=${problems.length}`);
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);

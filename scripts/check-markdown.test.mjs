import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const checker = path.join(here, "check-markdown.mjs");

function check(root) {
	const result = spawnSync(process.execPath, [checker], { cwd: root, encoding: "utf8" });
	return { status: result.status, problems: result.stderr };
}

test("the plugin's markdown has no problems", () => {
	const { status, problems } = check(path.join(here, ".."));
	assert.equal(status, 0, problems);
});

test("each kind of markdown problem is reported", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "qstack-markdown-"));
	const write = (name, lines) => {
		const target = path.join(root, name);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(target, lines.join("\n"));
	};
	try {
		write("skills/demo/SKILL.md", [
			"---",
			"name: demo",
			"---",
			"",
			"# Demo",
			"",
			"Read [the guide](guide.md) and [setup](#setup).",
			"Run `scripts/missing.mjs` first.",
			"Stop \u2014 here.",
			"Say \u201cdone\u201d.",
		]);
		write("skills/long/SKILL.md", ["---", "name: long", "description: Too long.", "---", ...Array(500).fill("")]);
		const { status, problems } = check(root);
		assert.equal(status, 1);
		for (const problem of [
			/frontmatter lacks name or description/,
			/link not found guide\.md/,
			/anchor not found #setup/,
			/path not found scripts\/missing\.mjs/,
			/long dash/,
			/curly quote/,
			/SKILL\.md: 504 lines/,
		]) {
			assert.match(problems, problem);
		}
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});

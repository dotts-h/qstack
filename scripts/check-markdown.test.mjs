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

test("a file that declares a base resolves its paths from that base", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "qstack-markdown-"));
	const write = (name, lines) => {
		const target = path.join(root, name);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(target, lines.join("\n"));
	};
	const declare = "Bundled skill paths are relative to `skills/router/SKILL.md`.";
	try {
		for (const name of ["router", "other"]) write(`skills/${name}/SKILL.md`, ["---", `name: ${name}`, "description: Demo.", "---"]);
		write("skills/router/playbooks/a.md", [`${declare} Playbooks named below sit in this folder.`, "", "Use `../other/SKILL.md`, then `b.md`."]);
		write("skills/router/playbooks/b.md", [declare, "", "Use `references/x.md`."]);
		write("skills/router/references/x.md", ["# X"]);
		assert.equal(check(root).status, 0, check(root).problems);
		write("skills/router/playbooks/b.md", [declare, "", "Use `../SKILL.md`, then `a.md`."]);
		write("skills/router/playbooks/c.md", ["Paths are relative to `skills/missing/SKILL.md`."]);
		const { status, problems } = check(root);
		assert.equal(status, 1);
		assert.match(problems, /b\.md:3: path not found \.\.\/SKILL\.md relative to skills\/router\/SKILL\.md/);
		assert.match(problems, /b\.md:3: path not found a\.md relative to skills\/router\/SKILL\.md/);
		assert.match(problems, /c\.md: declared base not found skills\/missing\/SKILL\.md/);
		assert.equal(problems.trim().split("\n").length, 3, problems);
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});

test("fenced code is not checked", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "qstack-markdown-"));
	const file = path.join(root, "skills", "demo", "SKILL.md");
	const broken = ["Read [the guide](guide.md).", "Run `scripts/missing.mjs` first.", "Stop \u2014 here."];
	try {
		fs.mkdirSync(path.dirname(file), { recursive: true });
		const lines = ["---", "name: demo", "description: Demo.", "---", "```text", ...broken, "```", "~~~", ...broken, "~~~", broken[1]];
		fs.writeFileSync(file, lines.join("\n"));
		const { status, problems } = check(root);
		assert.equal(status, 1);
		assert.match(problems, /SKILL\.md:15: path not found scripts\/missing\.mjs/);
		assert.equal(problems.trim().split("\n").length, 1, problems);
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
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

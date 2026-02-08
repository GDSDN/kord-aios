#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.OMOC_BASE || "v3.3.0";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

function splitLines(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, "").trim())
    .filter(Boolean);
}

const changed = splitLines(run(`git diff --name-only ${BASE}...HEAD`));

const hookChanges = changed.filter(
  (f) => f.startsWith("src/hooks/") || f === "src/index.ts",
);

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  hookChangesCount: hookChanges.length,
  hookChanges,
};

const out = path.join("docs", "migration", "hooks-audit-report.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));

console.log("Hooks audit report:", out);
console.log("Hook related changes:", report.hookChangesCount);

#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.OMOC_BASE || "v3.3.0";
const OWNED_PREFIXES = [
  "src/cli/",
  "src/tools/",
  "src/hooks/",
  "src/features/",
  "src/shared/",
  "src/index.ts",
];

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

function splitLines(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim().length > 0);
}

const committedDiff = splitLines(
  run(`git diff --name-only ${BASE}...HEAD`),
).map((line) => line.trim());

const workingTree = splitLines(run("git status --porcelain")).map((line) =>
  line.slice(3).trim(),
);

const changed = Array.from(new Set([...committedDiff, ...workingTree])).filter(
  Boolean,
);

const engineChanges = changed.filter((f) =>
  OWNED_PREFIXES.some((p) => f === p || f.startsWith(p)),
);
const layerChanges = changed.filter(
  (f) =>
    f.startsWith("layer/aios/") ||
    f.startsWith("docs/migration/") ||
    f.startsWith("script/"),
);

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  totals: {
    changed: changed.length,
    engineChanges: engineChanges.length,
    layerChanges: layerChanges.length,
  },
  committedDiff,
  workingTree,
  engineChanges,
  layerChanges,
};

const out = path.join("docs", "migration", "omoc-drift-report.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));

console.log("Drift report written:", out);
console.log("Changed:", report.totals.changed);
console.log("Engine changes:", report.totals.engineChanges);
console.log("Layer changes:", report.totals.layerChanges);

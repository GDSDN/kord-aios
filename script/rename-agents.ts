import { readdir, stat, rename, readFile, writeFile } from "node:fs/promises";
import { join, sep } from "node:path";

const root = process.cwd();
const apply = process.argv.slice(2).includes("--apply");

const renameDirs = [
  { from: "src/agents/atlas", to: "src/agents/build" },
  { from: "src/agents/prometheus", to: "src/agents/plan" },
  { from: "src/agents/sisyphus-junior", to: "src/agents/dev-junior" },
  { from: "src/hooks/atlas", to: "src/hooks/build" },
  { from: "src/hooks/prometheus-md-only", to: "src/hooks/plan-md-only" },
  { from: "src/hooks/sisyphus-junior-notepad", to: "src/hooks/dev-notepad" },
  { from: "src/tools/call-omo-agent", to: "src/tools/call-kord-agent" },
];

const renameFiles = [
  { from: "src/agents/sisyphus.ts", to: "src/agents/kord.ts" },
  { from: "src/agents/hephaestus.ts", to: "src/agents/dev.ts" },
  { from: "src/agents/oracle.ts", to: "src/agents/architect.ts" },
  { from: "src/agents/metis.ts", to: "src/agents/analyst.ts" },
  { from: "src/agents/multimodal-looker.ts", to: "src/agents/vision.ts" },
  { from: "src/agents/momus.ts", to: "src/agents/qa.ts" },
  { from: "src/agents/momus.test.ts", to: "src/agents/qa.test.ts" },
  { from: "src/agents/prometheus-prompt.test.ts", to: "src/agents/plan-prompt.test.ts" },
];

type ReplaceRule = { find: string; replace: string };

const replaceRules: ReplaceRule[] = [
  { find: "createSisyphusJuniorAgent", replace: "createDevJuniorAgent" },
  { find: "createMultimodalLookerAgent", replace: "createVisionAgent" },
  { find: "SISYPHUS_JUNIOR", replace: "DEV_JUNIOR" },
  { find: "sisyphus-junior", replace: "dev-junior" },
  { find: "sisyphus_junior", replace: "dev_junior" },
  { find: "Sisyphus-Junior", replace: "Dev-Junior" },
  { find: "Sisyphus Junior", replace: "Dev Junior" },
  { find: "multimodal-looker", replace: "vision" },
  { find: "multimodal_looker", replace: "vision" },
  { find: "prometheus-md-only", replace: "plan-md-only" },
  { find: "prometheus_md_only", replace: "plan_md_only" },
  { find: "call_omo_agent", replace: "call_kord_agent" },
  { find: "call-omo-agent", replace: "call-kord-agent" },
  { find: "createSisyphusAgent", replace: "createKordAgent" },
  { find: "createPrometheusAgent", replace: "createPlanAgent" },
  { find: "createAtlasAgent", replace: "createBuildAgent" },
  { find: "createHephaestusAgent", replace: "createDevAgent" },
  { find: "createOracleAgent", replace: "createArchitectAgent" },
  { find: "createMetisAgent", replace: "createAnalystAgent" },
  { find: "createMomusAgent", replace: "createQaAgent" },
  { find: ".sisyphus", replace: ".kord" },
  { find: "SISYPHUS", replace: "KORD" },
  { find: "PROMETHEUS", replace: "PLAN" },
  { find: "ATLAS", replace: "BUILD" },
  { find: "HEPHAESTUS", replace: "DEV" },
  { find: "METIS", replace: "ANALYST" },
  { find: "MOMUS", replace: "QA" },
  { find: "Sisyphus", replace: "Kord" },
  { find: "Prometheus", replace: "Plan" },
  { find: "Hephaestus", replace: "Dev" },
  { find: "Metis", replace: "Analyst" },
  { find: "Momus", replace: "QA" },
];

const contextRules: ReplaceRule[] = [
  { find: "sisyphus", replace: "kord" },
  { find: "prometheus", replace: "plan" },
  { find: "atlas", replace: "build" },
  { find: "hephaestus", replace: "dev" },
  { find: "oracle", replace: "architect" },
  { find: "metis", replace: "analyst" },
  { find: "momus", replace: "qa" },
];

const skipDirs = new Set(["node_modules", "dist", ".git"]);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

const shouldReplaceInString = (content: string, find: string) => {
  return content.includes(find);
};

const replaceInString = (content: string, rule: ReplaceRule) => {
  if (!content.includes(rule.find)) {
    return content;
  }
  if (content === rule.find) {
    return rule.replace;
  }
  const escaped = escapeRegExp(rule.find);
  // camelCase boundary (e.g. sisyphusConfig → kordConfig)
  let result = content.replace(new RegExp(`(?<![a-zA-Z])${escaped}(?=[A-Z])`, "g"), rule.replace);
  // word boundary (standalone or at path/punctuation boundaries)
  result = result.replace(new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, "g"), rule.replace);
  return result;
};

const replaceInCode = (content: string, rule: ReplaceRule) => {
  // Match: word boundary + find + (word boundary OR camelCase boundary)
  // This handles both standalone "atlas" and camelCase "atlasResolution"
  const escaped = escapeRegExp(rule.find);
  // First: replace camelCase compounds (e.g. sisyphusOverride → kordOverride)
  const camelRegex = new RegExp(`\\b${escaped}(?=[A-Z])`, "g");
  let result = content.replace(camelRegex, rule.replace);
  // Then: replace standalone words (e.g. sisyphus → kord)
  const standaloneRegex = new RegExp(`\\b${escaped}\\b`, "g");
  result = result.replace(standaloneRegex, rule.replace);
  return result;
};

const transformContent = (content: string) => {
  let updated = content;
  for (const rule of replaceRules) {
    updated = updated.split(rule.find).join(rule.replace);
  }

  let output = "";
  let buffer = "";
  let i = 0;
  let state: "code" | "line" | "block" | "single" | "double" | "template" = "code";

  const flushCode = () => {
    if (buffer.length === 0) return;
    let segment = buffer;
    for (const rule of contextRules) {
      segment = replaceInCode(segment, rule);
    }
    output += segment;
    buffer = "";
  };

  const flushComment = () => {
    let segment = buffer;
    for (const rule of contextRules) {
      segment = replaceInCode(segment, rule);
    }
    output += segment;
    buffer = "";
  };

  const flushString = (quote: string) => {
    let segment = buffer;
    for (const rule of contextRules) {
      segment = replaceInString(segment, rule);
    }
    output += quote + segment + quote;
    buffer = "";
  };

  while (i < updated.length) {
    const char = updated[i];
    const next = updated[i + 1];

    if (state === "code") {
      if (char === "/" && next === "/") {
        flushCode();
        output += "//";
        i += 2;
        state = "line";
        continue;
      }
      if (char === "/" && next === "*") {
        flushCode();
        output += "/*";
        i += 2;
        state = "block";
        continue;
      }
      if (char === "'") {
        flushCode();
        i += 1;
        state = "single";
        continue;
      }
      if (char === '"') {
        flushCode();
        i += 1;
        state = "double";
        continue;
      }
      if (char === "`") {
        flushCode();
        i += 1;
        state = "template";
        continue;
      }
      buffer += char;
      i += 1;
      continue;
    }

    if (state === "line") {
      if (char === "\n") {
        flushComment();
        output += char;
        i += 1;
        state = "code";
      } else {
        buffer += char;
        i += 1;
      }
      continue;
    }

    if (state === "block") {
      if (char === "*" && next === "/") {
        flushComment();
        output += "*/";
        i += 2;
        state = "code";
      } else {
        buffer += char;
        i += 1;
      }
      continue;
    }

    if (state === "single") {
      if (char === "\\" && next !== undefined) {
        buffer += char + next;
        i += 2;
        continue;
      }
      if (char === "'") {
        flushString("'");
        i += 1;
        state = "code";
        continue;
      }
      buffer += char;
      i += 1;
      continue;
    }

    if (state === "double") {
      if (char === "\\" && next !== undefined) {
        buffer += char + next;
        i += 2;
        continue;
      }
      if (char === '"') {
        flushString('"');
        i += 1;
        state = "code";
        continue;
      }
      buffer += char;
      i += 1;
      continue;
    }

    if (state === "template") {
      if (char === "\\" && next !== undefined) {
        buffer += char + next;
        i += 2;
        continue;
      }
      if (char === "`") {
        flushString("`");
        i += 1;
        state = "code";
        continue;
      }
      buffer += char;
      i += 1;
    }
  }

  if (state === "code") {
    flushCode();
  } else if (state === "single") {
    flushString("'");
  } else if (state === "double") {
    flushString('"');
  } else if (state === "template") {
    flushString("`");
  } else {
    output += buffer;
  }

  return output;
};

const fileChanged = (before: string, after: string) => before !== after;

const renamePath = async (from: string, to: string, label: string) => {
  const fromPath = join(root, from);
  const toPath = join(root, to);
  try {
    await stat(fromPath);
  } catch {
    console.log(`[skip] ${label}: ${from}`);
    return false;
  }
  if (!apply) {
    console.log(`[dry-run] ${label}: ${from} -> ${to}`);
    return true;
  }
  await rename(fromPath, toPath);
  console.log(`[apply] ${label}: ${from} -> ${to}`);
  return true;
};

const walkFiles = async (dir: string, files: string[] = []) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) {
        continue;
      }
      await walkFiles(join(dir, entry.name), files);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const filePath = join(dir, entry.name);
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".md")) {
      continue;
    }
    files.push(filePath);
  }
  return files;
};

const applyReplacements = async () => {
  const srcRoot = join(root, "src");
  const files = await walkFiles(srcRoot);
  let changed = 0;

  for (const filePath of files) {
    const before = await readFile(filePath, "utf8");
    const after = transformContent(before);
    if (!fileChanged(before, after)) {
      continue;
    }
    changed += 1;
    const relativePath = filePath.split(sep).join("/").replace(root.split(sep).join("/") + "/", "");
    if (!apply) {
      console.log(`[dry-run] update: ${relativePath}`);
      continue;
    }
    await writeFile(filePath, after, "utf8");
    console.log(`[apply] update: ${relativePath}`);
  }

  console.log(`\nSummary: ${changed} file(s) ${apply ? "updated" : "would be updated"}.`);
};

const run = async () => {
  console.log(apply ? "[apply] rename-agents" : "[dry-run] rename-agents");
  for (const pair of renameDirs) {
    await renamePath(pair.from, pair.to, "dir");
  }
  for (const pair of renameFiles) {
    await renamePath(pair.from, pair.to, "file");
  }
  await applyReplacements();
};

run().catch((error) => {
  console.error("rename-agents failed:", error);
  process.exitCode = 1;
});

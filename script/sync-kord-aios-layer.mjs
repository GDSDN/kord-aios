#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const SRC_ROOT = process.env.KORDOS_SRC || "D:/dev/kord-aios-core";
const DEST_ROOT = process.env.KORDOS_DEST || "D:/dev/kord-aios/layer/kord-aios";

const COPY_PAIRS = [
  ["payload", "payload"],
  [".kord-core", ".kord-core"],
  ["docs/stories", "docs/stories"],
  ["apps", "apps"],
  ["installer", "installer"],
  ["scripts", "scripts"],
];

const SKIP_PATTERNS = [
  /node_modules/,
  /dist/,
  /\.backup/,
  /\.tsbuildinfo$/,
  /\.eslintcache$/,
  /coverage/,
  /nul$/i,
];

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function shouldSkip(relPath) {
  const normalized = relPath.split(path.sep).join('/');
  return SKIP_PATTERNS.some((rx) => rx.test(normalized));
}

async function copyDir(src, dst, relBase = "") {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const sp = path.join(src, e.name);
    const dp = path.join(dst, e.name);
    const rel = path.join(relBase, e.name);
    if (shouldSkip(rel)) continue;
    if (e.isDirectory()) {
      await copyDir(sp, dp, rel);
    } else if (e.isFile()) {
      await fs.mkdir(path.dirname(dp), { recursive: true });
      await fs.copyFile(sp, dp);
    }
  }
}

async function main() {
  console.log(`[sync-kord-aios-layer] source=${SRC_ROOT}`);
  console.log(`[sync-kord-aios-layer] dest=${DEST_ROOT}`);

  for (const [srcRel, dstRel] of COPY_PAIRS) {
    const src = path.join(SRC_ROOT, srcRel);
    const dst = path.join(DEST_ROOT, dstRel);
    if (!(await exists(src))) {
      console.log(`- skip missing: ${srcRel}`);
      continue;
    }
    console.log(`- copy: ${srcRel} -> ${dstRel}`);
    await copyDir(src, dst, srcRel);
  }

  console.log("[sync-kord-aios-layer] done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

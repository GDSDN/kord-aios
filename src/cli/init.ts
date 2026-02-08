import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";

export interface InitOptions {
  directory?: string;
  withApps?: boolean;
  withInstaller?: boolean;
  dryRun?: boolean;
}

const SKIP_PATTERNS = [
  /node_modules/,
  /dist/,
  /\.backup/,
  /\.tsbuildinfo$/,
  /\.eslintcache$/,
  /coverage/,
  /nul$/i,
];

const DEFAULT_COPY_MAP: Array<{
  src: string;
  dst: string;
  optional?: boolean;
}> = [
  { src: "layer/aios/payload/skills", dst: ".opencode/skills" },
  { src: "layer/aios/payload/rules", dst: ".opencode/rules" },
  { src: "layer/aios/payload/content", dst: ".aios-core" },
  { src: "layer/aios/.aios-core", dst: ".aios-core", optional: true },
  { src: "layer/aios/docs/stories", dst: "docs/stories", optional: true },
];

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function shouldSkip(relPath: string): boolean {
  const normalized = relPath.split(path.sep).join("/");
  return SKIP_PATTERNS.some((rx) => rx.test(normalized));
}

interface CopyStats {
  copied: number;
  skippedExisting: number;
}

async function copyDir(
  src: string,
  dst: string,
  relBase = "",
): Promise<CopyStats> {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  const stats: CopyStats = { copied: 0, skippedExisting: 0 };

  for (const e of entries) {
    const sp = path.join(src, e.name);
    const dp = path.join(dst, e.name);
    const rel = path.join(relBase, e.name);
    if (shouldSkip(rel)) continue;

    if (e.isDirectory()) {
      const childStats = await copyDir(sp, dp, rel);
      stats.copied += childStats.copied;
      stats.skippedExisting += childStats.skippedExisting;
    } else if (e.isFile()) {
      await fs.mkdir(path.dirname(dp), { recursive: true });
      if (await exists(dp)) {
        stats.skippedExisting++;
        continue;
      }
      await fs.copyFile(sp, dp);
      stats.copied++;
    }
  }

  return stats;
}

export async function initProject(options: InitOptions): Promise<number> {
  const projectDir = path.resolve(options.directory || process.cwd());
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, "../..");

  console.log(pc.cyan(`[open-aios init] project: ${projectDir}`));
  console.log(pc.cyan(`[open-aios init] source: ${repoRoot}`));

  let totalCopied = 0;
  let totalSkippedExisting = 0;
  for (const item of DEFAULT_COPY_MAP) {
    const src = path.join(repoRoot, item.src);
    const dst = path.join(projectDir, item.dst);

    if (!(await exists(src))) {
      if (!item.optional) {
        console.log(pc.yellow(`- missing required source: ${item.src}`));
      }
      continue;
    }

    if (options.dryRun) {
      console.log(
        pc.gray(
          `- [dry-run] sync ${item.src} -> ${item.dst} (copy missing files only)`,
        ),
      );
      continue;
    }

    console.log(pc.gray(`- sync ${item.src} -> ${item.dst} (safe merge)`));
    const stats = await copyDir(src, dst, item.src);
    totalCopied += stats.copied;
    totalSkippedExisting += stats.skippedExisting;
  }

  if (options.withApps) {
    const src = path.join(repoRoot, "layer/aios/apps");
    const dst = path.join(projectDir, "apps");
    if (await exists(src)) {
      if (options.dryRun) {
        console.log(
          pc.gray(
            `- [dry-run] sync layer/aios/apps -> apps (copy missing files only)`,
          ),
        );
      } else {
        console.log(pc.gray(`- sync layer/aios/apps -> apps (safe merge)`));
        const stats = await copyDir(src, dst, "apps");
        totalCopied += stats.copied;
        totalSkippedExisting += stats.skippedExisting;
      }
    }
  }

  if (options.withInstaller) {
    const src = path.join(repoRoot, "layer/aios/installer");
    const dst = path.join(projectDir, "tools/open-aios-installer");
    if (await exists(src)) {
      if (options.dryRun) {
        console.log(
          pc.gray(
            `- [dry-run] sync layer/aios/installer -> tools/open-aios-installer (copy missing files only)`,
          ),
        );
      } else {
        console.log(
          pc.gray(
            `- sync layer/aios/installer -> tools/open-aios-installer (safe merge)`,
          ),
        );
        const stats = await copyDir(src, dst, "installer");
        totalCopied += stats.copied;
        totalSkippedExisting += stats.skippedExisting;
      }
    }
  }

  if (options.dryRun) {
    console.log(pc.green("[open-aios init] dry-run complete"));
    return 0;
  }

  console.log(
    pc.green(
      `[open-aios init] complete. Files copied: ${totalCopied}, skipped existing: ${totalSkippedExisting}`,
    ),
  );
  return 0;
}

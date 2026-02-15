#!/usr/bin/env node
// bin/kord-aios.js
// Wrapper script that detects platform and spawns the correct binary

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { getPlatformPackage, getBinaryPath } from "./platform.js";

const require = createRequire(import.meta.url);

/**
 * Detect libc family on Linux
 * @returns {string | null} 'glibc', 'musl', or null if detection fails
 */
function getLibcFamily() {
  if (process.platform !== "linux") {
    return undefined; // Not needed on non-Linux
  }
  
  try {
    const detectLibc = require("detect-libc");
    return detectLibc.familySync();
  } catch {
    // detect-libc not available
    return null;
  }
}

function main() {
  const { platform, arch } = process;
  const libcFamily = getLibcFamily();
  
  // Get platform package name
  let pkg;
  try {
    pkg = getPlatformPackage({ platform, arch, libcFamily });
  } catch (error) {
    console.error(`\nkord-aios: ${error.message}\n`);
    process.exit(1);
  }
  
  // Resolve binary path
  const binRelPath = getBinaryPath(pkg, platform);
  
  let binPath;
  try {
    binPath = require.resolve(binRelPath);
  } catch {
    const jsFallbackPath = fileURLToPath(new URL("../dist/cli/index.js", import.meta.url));
    const localPluginPath = fileURLToPath(new URL("../dist/index.js", import.meta.url));
    if (existsSync(jsFallbackPath)) {
      console.warn(`\nkord-aios: Platform binary not installed (${pkg}).`);
      console.warn("Trying local JS fallback via Bun...\n");

      const fallback = spawnSync("bun", [jsFallbackPath, ...process.argv.slice(2)], {
        stdio: "inherit",
        env: {
          ...process.env,
          KORD_AIOS_LOCAL_PLUGIN_PATH: localPluginPath,
        },
      });

      if (!fallback.error) {
        if (fallback.signal) {
          const signalNum = fallback.signal === "SIGTERM" ? 15 :
                            fallback.signal === "SIGKILL" ? 9 :
                            fallback.signal === "SIGINT" ? 2 : 1;
          process.exit(128 + signalNum);
        }
        process.exit(fallback.status ?? 1);
      }

      console.error("kord-aios: Bun fallback failed.");
      console.error(`Error: ${fallback.error.message}`);
      console.error("Install Bun or the platform binary package below.\n");
    }

    console.error(`\nkord-aios: Platform binary not installed.`);
    console.error(`\nYour platform: ${platform}-${arch}${libcFamily === "musl" ? "-musl" : ""}`);
    console.error(`Expected package: ${pkg}`);
    console.error(`\nTo fix, run:`);
    console.error(`  npm install ${pkg}\n`);
    process.exit(1);
  }
  
  // Spawn the binary
  const result = spawnSync(binPath, process.argv.slice(2), {
    stdio: "inherit",
  });
  
  // Handle spawn errors
  if (result.error) {
    console.error(`\nkord-aios: Failed to execute binary.`);
    console.error(`Error: ${result.error.message}\n`);
    process.exit(2);
  }
  
  // Handle signals
  if (result.signal) {
    const signalNum = result.signal === "SIGTERM" ? 15 : 
                      result.signal === "SIGKILL" ? 9 :
                      result.signal === "SIGINT" ? 2 : 1;
    process.exit(128 + signalNum);
  }

  process.exit(result.status ?? 1);
}

main();

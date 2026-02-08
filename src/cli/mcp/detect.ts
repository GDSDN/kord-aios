import { detectMcpConfiguration } from "./config-detector";

export interface McpCommandOptions {
  json?: boolean;
}

function printTextResult(
  result: ReturnType<typeof detectMcpConfiguration>,
): void {
  console.log(`Configured MCP ids (${result.configuredMcpIds.length}):`);
  if (result.configuredMcpIds.length === 0) {
    console.log("  - none");
  } else {
    for (const id of result.configuredMcpIds) {
      console.log(`  - ${id}`);
    }
  }

  console.log("");
  console.log(
    `Missing recommended MCPs (${result.missingRecommendedMcpIds.length}):`,
  );
  if (result.missingRecommendedMcpIds.length === 0) {
    console.log("  - none");
  } else {
    for (const id of result.missingRecommendedMcpIds) {
      console.log(`  - ${id}`);
    }
  }

  console.log("");
  console.log("Scanned config files:");
  for (const file of result.scannedFiles) {
    if (!file.exists) {
      console.log(`  - missing: ${file.path}`);
      continue;
    }

    const ids =
      file.configuredIds.length > 0 ? file.configuredIds.join(", ") : "none";
    if (file.parseError) {
      console.log(`  - invalid: ${file.path} (${file.parseError})`);
      continue;
    }

    console.log(`  - found: ${file.path} -> ${ids}`);
  }
}

export async function detect(options: McpCommandOptions = {}): Promise<number> {
  try {
    const result = detectMcpConfiguration();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    printTextResult(result);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: Failed to detect MCP configuration: ${message}`);
    return 1;
  }
}

import { detectMcpConfiguration } from "./config-detector";
import type { McpCommandOptions } from "./detect";

export async function status(options: McpCommandOptions = {}): Promise<number> {
  try {
    const result = detectMcpConfiguration();

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            configuredMcpIds: result.configuredMcpIds,
            missingRecommendedMcpIds: result.missingRecommendedMcpIds,
            recommendedMcpIds: result.recommendedMcpIds,
            scannedFiles: result.scannedFiles,
            healthy: result.missingRecommendedMcpIds.length === 0,
          },
          null,
          2,
        ),
      );
      return 0;
    }

    console.log("MCP configuration status");
    console.log(
      `Configured MCP ids: ${result.configuredMcpIds.join(", ") || "none"}`,
    );
    console.log(
      `Missing recommended MCPs: ${result.missingRecommendedMcpIds.join(", ") || "none"}`,
    );

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: Failed to get MCP status: ${message}`);
    return 1;
  }
}

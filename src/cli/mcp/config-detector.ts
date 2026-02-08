import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { getOpenCodeConfigDir, parseJsonc } from "../../shared";

export const RECOMMENDED_MCP_IDS = [
  "playwright",
  "desktop-commander",
  "context7",
  "exa",
] as const;

interface McpConfigObject {
  mcpServers?: Record<string, unknown>;
  mcp?: {
    servers?: Record<string, unknown>;
    mcpServers?: Record<string, unknown>;
  };
}

export interface McpConfigFileScan {
  path: string;
  exists: boolean;
  configuredIds: string[];
  parseError?: string;
}

export interface McpDetectionResult {
  configuredMcpIds: string[];
  recommendedMcpIds: string[];
  missingRecommendedMcpIds: string[];
  scannedFiles: McpConfigFileScan[];
}

export interface DetectMcpConfigurationOptions {
  filePaths?: string[];
  recommendedMcpIds?: readonly string[];
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function extractMcpIds(config: unknown): string[] {
  const configObj = toRecord(config) as McpConfigObject | null;
  if (!configObj) return [];

  const ids = new Set<string>();
  const directServers = toRecord(configObj.mcpServers);
  if (directServers) {
    for (const id of Object.keys(directServers)) {
      ids.add(id);
    }
  }

  const mcpObject = toRecord(configObj.mcp);
  if (mcpObject) {
    const nestedServers = toRecord(mcpObject.servers);
    if (nestedServers) {
      for (const id of Object.keys(nestedServers)) {
        ids.add(id);
      }
    }

    const nestedMcpServers = toRecord(mcpObject.mcpServers);
    if (nestedMcpServers) {
      for (const id of Object.keys(nestedMcpServers)) {
        ids.add(id);
      }
    }
  }

  return [...ids].sort();
}

function getDefaultMcpConfigPaths(): string[] {
  const cwd = process.cwd();
  const home = homedir();
  const openCodeConfigDir = getOpenCodeConfigDir({ binary: "opencode" });

  const paths = [
    join(home, ".claude.json"),
    join(home, ".claude", ".mcp.json"),
    join(cwd, ".mcp.json"),
    join(cwd, ".claude", ".mcp.json"),
    join(cwd, "opencode.json"),
    join(cwd, "opencode.jsonc"),
    join(openCodeConfigDir, "opencode.json"),
    join(openCodeConfigDir, "opencode.jsonc"),
  ];

  return [...new Set(paths)];
}

export function detectMcpConfiguration(
  options: DetectMcpConfigurationOptions = {},
): McpDetectionResult {
  const recommendedMcpIds = [
    ...(options.recommendedMcpIds ?? RECOMMENDED_MCP_IDS),
  ].sort();
  const configPaths = options.filePaths ?? getDefaultMcpConfigPaths();
  const scannedFiles: McpConfigFileScan[] = [];
  const configuredIds = new Set<string>();

  for (const path of configPaths) {
    if (!existsSync(path)) {
      scannedFiles.push({
        path,
        exists: false,
        configuredIds: [],
      });
      continue;
    }

    try {
      const content = readFileSync(path, "utf-8");
      const parsed = parseJsonc<unknown>(content);
      const ids = extractMcpIds(parsed);
      for (const id of ids) {
        configuredIds.add(id);
      }

      scannedFiles.push({
        path,
        exists: true,
        configuredIds: ids,
      });
    } catch (error) {
      scannedFiles.push({
        path,
        exists: true,
        configuredIds: [],
        parseError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const configuredMcpIds = [...configuredIds].sort();
  const missingRecommendedMcpIds = recommendedMcpIds.filter(
    (id) => !configuredIds.has(id),
  );

  return {
    configuredMcpIds,
    recommendedMcpIds,
    missingRecommendedMcpIds,
    scannedFiles,
  };
}

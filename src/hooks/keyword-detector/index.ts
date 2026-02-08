import type { PluginInput } from "@opencode-ai/plugin";
import {
  detectKeywordsWithType,
  extractPromptText,
  removeCodeBlocks,
  detectStarCommand,
  normalizeToKebabCase,
} from "./detector";
import { isPlannerAgent } from "./constants";
import { log } from "../../shared";
import {
  hasSystemReminder,
  isSystemDirective,
  removeSystemReminders,
} from "../../shared/system-directive";
import {
  getMainSessionID,
  getSessionAgent,
  subagentSessions,
} from "../../features/claude-code-session-state";
import type { ContextCollector } from "../../features/context-injector";
import {
  resolveSkillByName,
  generateSkillExecutionMessage,
  generateSkillNotFoundMessage,
} from "./skill-resolver";
import type { LoadedSkill } from "../../features/opencode-skill-loader/types";

export * from "./detector";
export * from "./constants";
export * from "./types";

/**
 * Get cached skills for star command resolution.
 * Uses builtin skills as fallback when discovery is unavailable.
 */
async function getAvailableSkillsForResolution(): Promise<LoadedSkill[]> {
  try {
    // Dynamic import to avoid circular dependencies
    const { getAllSkills } =
      await import("../../features/opencode-skill-loader/skill-content");
    return await getAllSkills();
  } catch {
    // Fallback: return empty list, will trigger not-found path
    return [];
  }
}

export function createKeywordDetectorHook(
  ctx: PluginInput,
  collector?: ContextCollector,
) {
  return {
    "chat.message": async (
      input: {
        sessionID: string;
        agent?: string;
        model?: { providerID: string; modelID: string };
        messageID?: string;
      },
      output: {
        message: Record<string, unknown>;
        parts: Array<{ type: string; text?: string; [key: string]: unknown }>;
      },
    ): Promise<void> => {
      const promptText = extractPromptText(output.parts);

      if (isSystemDirective(promptText)) {
        log(`[keyword-detector] Skipping system directive message`, {
          sessionID: input.sessionID,
        });
        return;
      }

      const currentAgent = getSessionAgent(input.sessionID) ?? input.agent;

      // Remove system-reminder content to prevent automated system messages from triggering mode keywords
      const cleanText = removeSystemReminders(promptText);
      const modelID = input.model?.modelID;
      let detectedKeywords = detectKeywordsWithType(
        cleanText,
        currentAgent,
        modelID,
      );

      if (isPlannerAgent(currentAgent)) {
        detectedKeywords = detectedKeywords.filter(
          (k) => k.type !== "ultrawork",
        );
      }

      // Detect star commands for skill workflow routing
      const starCommand = detectStarCommand(cleanText);
      if (starCommand) {
        log(`[keyword-detector] Star command detected`, {
          sessionID: input.sessionID,
          originalCommand: starCommand.command,
          normalizedName: starCommand.normalizedName,
        });

        // TODO: Hook Limitation
        // Hooks cannot directly invoke tools. We implement deterministic message
        // transformation that provides explicit instructions for skill execution.
        // Future enhancement: Add a tool that hooks can call to trigger skill execution.

        // Resolve skill against available skills
        const availableSkills = await getAvailableSkillsForResolution();
        const resolution = resolveSkillByName(
          starCommand.normalizedName,
          availableSkills,
        );

        let advisoryMessage: string;

        if (resolution.exactMatch) {
          // Exact match found: provide deterministic execution instructions
          advisoryMessage = generateSkillExecutionMessage(resolution.skillName);
          log(`[keyword-detector] Skill resolved: ${resolution.skillName}`, {
            sessionID: input.sessionID,
          });
        } else {
          // No exact match: provide search suggestion
          advisoryMessage = generateSkillNotFoundMessage(
            starCommand.normalizedName,
            resolution.suggestion,
          );
          log(
            `[keyword-detector] Skill not found: ${starCommand.normalizedName}`,
            {
              sessionID: input.sessionID,
              suggestion: resolution.suggestion,
            },
          );
        }

        // Prepend star command advisory to the message
        const textPartIndex = output.parts.findIndex(
          (p) => p.type === "text" && p.text !== undefined,
        );
        if (textPartIndex !== -1) {
          const originalText = output.parts[textPartIndex].text ?? "";
          output.parts[textPartIndex].text =
            `${advisoryMessage}\n\n---\n\n${originalText}`;
        }
      }

      if (detectedKeywords.length === 0) {
        return;
      }

      // Skip keyword detection for background task sessions to prevent mode injection
      // (e.g., [analyze-mode]) which incorrectly triggers Prometheus restrictions
      const isBackgroundTaskSession = subagentSessions.has(input.sessionID);
      if (isBackgroundTaskSession) {
        return;
      }

      const mainSessionID = getMainSessionID();
      const isNonMainSession =
        mainSessionID && input.sessionID !== mainSessionID;

      if (isNonMainSession) {
        detectedKeywords = detectedKeywords.filter(
          (k) => k.type === "ultrawork",
        );
        if (detectedKeywords.length === 0) {
          log(
            `[keyword-detector] Skipping non-ultrawork keywords in non-main session`,
            {
              sessionID: input.sessionID,
              mainSessionID,
            },
          );
          return;
        }
      }

      const hasUltrawork = detectedKeywords.some((k) => k.type === "ultrawork");
      if (hasUltrawork) {
        log(`[keyword-detector] Ultrawork mode activated`, {
          sessionID: input.sessionID,
        });

        if (output.message.variant === undefined) {
          output.message.variant = "max";
        }

        ctx.client.tui
          .showToast({
            body: {
              title: "Ultrawork Mode Activated",
              message:
                "Maximum precision engaged. All agents at your disposal.",
              variant: "success" as const,
              duration: 3000,
            },
          })
          .catch((err) =>
            log(`[keyword-detector] Failed to show toast`, {
              error: err,
              sessionID: input.sessionID,
            }),
          );
      }

      const textPartIndex = output.parts.findIndex(
        (p) => p.type === "text" && p.text !== undefined,
      );
      if (textPartIndex === -1) {
        log(`[keyword-detector] No text part found, skipping injection`, {
          sessionID: input.sessionID,
        });
        return;
      }

      const allMessages = detectedKeywords.map((k) => k.message).join("\n\n");
      const originalText = output.parts[textPartIndex].text ?? "";

      output.parts[textPartIndex].text =
        `${allMessages}\n\n---\n\n${originalText}`;

      log(`[keyword-detector] Detected ${detectedKeywords.length} keywords`, {
        sessionID: input.sessionID,
        types: detectedKeywords.map((k) => k.type),
      });
    },
  };
}

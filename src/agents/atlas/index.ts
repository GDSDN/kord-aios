export {
  createBuildLoopAgent,
  createBuildLoopAgent as createAtlasAgent,
  buildLoopPromptMetadata,
  buildLoopPromptMetadata as atlasPromptMetadata,
  getBuildLoopPrompt,
  getBuildLoopPrompt as getAtlasPrompt,
  getBuildLoopPromptSource,
  getBuildLoopPromptSource as getAtlasPromptSource,
  isGptModel,
  ATLAS_SYSTEM_PROMPT,
  getDefaultAtlasPrompt,
  ATLAS_GPT_SYSTEM_PROMPT,
  getGptAtlasPrompt,
  getCategoryDescription,
  buildAgentSelectionSection,
  buildCategorySection,
  buildSkillsSection,
  buildDecisionMatrix,
} from "../build-loop";

export type {
  BuildLoopContext as OrchestratorContext,
  BuildLoopPromptSource as AtlasPromptSource,
} from "../build-loop";

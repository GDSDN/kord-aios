import type {
  AvailableAgent,
  AvailableCategory,
  AvailableSkill,
  AvailableTool,
} from "../dynamic-agent-prompt-builder"
import {
  buildAntiPatternsSection,
  buildArchitectSection,
  buildCategorySkillsDelegationGuide,
  buildDelegationTable,
  buildExploreSection,
  buildHardBlocksSection,
  buildKeyTriggersSection,
  buildLibrarianSection,
  buildToolSelectionTable,
  categorizeTools,
} from "../dynamic-agent-prompt-builder"

export type KordPromptSections = {
  antiPatterns: string
  architectSection: string
  categorySkillsGuide: string
  delegationTable: string
  exploreSection: string
  hardBlocks: string
  keyTriggers: string
  librarianSection: string
  toolSelection: string
}

export function buildKordPromptSections(
  availableAgents: AvailableAgent[],
  availableTools: AvailableTool[],
  availableSkills: AvailableSkill[],
  availableCategories: AvailableCategory[]
): KordPromptSections {
  return {
    keyTriggers: buildKeyTriggersSection(availableAgents, availableSkills),
    toolSelection: buildToolSelectionTable(availableAgents, availableTools, availableSkills),
    exploreSection: buildExploreSection(availableAgents),
    librarianSection: buildLibrarianSection(availableAgents),
    categorySkillsGuide: buildCategorySkillsDelegationGuide(availableCategories, availableSkills),
    delegationTable: buildDelegationTable(availableAgents),
    architectSection: buildArchitectSection(availableAgents),
    hardBlocks: buildHardBlocksSection(),
    antiPatterns: buildAntiPatternsSection(),
  }
}

export { categorizeTools }

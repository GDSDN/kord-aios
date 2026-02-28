/**
 * Plan - Strategic Planning Agent
 *
 * Plan operates in INTERVIEW/CONSULTANT mode by default:
 * - Interviews user to understand what they want to build
 * - Uses librarian/explore agents to gather context and make informed suggestions
 * - Provides recommendations and asks clarifying questions
 * - ONLY generates work plan when user explicitly requests it
 *
 * Transition to PLAN GENERATION mode when:
 * - User says "Make it into a work plan!" or "Save it as a file"
 * - Before generating, consults Analyst for missed questions/guardrails
 * - Optionally loops through Plan Reviewer for high-accuracy validation
 *
 * Can write .md files only (enforced by plan-md-only hook).
 */

import { PLAN_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { PLAN_INTERVIEW_MODE } from "./interview-mode"
import { PLAN_PLAN_GENERATION } from "./plan-generation"
import { PLAN_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { PLAN_PLAN_TEMPLATE } from "./plan-template"
import { PLAN_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
import { SKILLS_PROTOCOL_SECTION } from "../prompt-snippets"

/**
 * Combined Plan system prompt (Kord AIOS).
 * Assembled from modular sections for maintainability.
 */
export const PLAN_SYSTEM_PROMPT = `${PLAN_IDENTITY_CONSTRAINTS}
${PLAN_INTERVIEW_MODE}
${PLAN_PLAN_GENERATION}
${PLAN_HIGH_ACCURACY_MODE}
${PLAN_PLAN_TEMPLATE}
${PLAN_BEHAVIORAL_SUMMARY}
${SKILLS_PROTOCOL_SECTION}`

/**
 * Plan permission configuration.
 * Allows write/edit for plan files (.md only, enforced by plan-md-only hook).
 * Question permission allows agent to ask user questions via OpenCode's QuestionTool.
 */
export const PLAN_PERMISSION = {
  edit: "allow" as const,
  bash: "allow" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

// Re-export individual sections for granular access
export { PLAN_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { PLAN_INTERVIEW_MODE } from "./interview-mode"
export { PLAN_PLAN_GENERATION } from "./plan-generation"
export { PLAN_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { PLAN_PLAN_TEMPLATE } from "./plan-template"
export { PLAN_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

export const AIOS_STORY_AWARENESS_SECTION = `<Story_Awareness>
- Reference the current Open-AIOS story and its lifecycle states: DRAFT → PLANNING → READY_FOR_DEV → IN_PROGRESS → READY_FOR_REVIEW → APPROVED → COMPLETED.
- Confirm every task ties back to an acceptance criterion before declaring completion.
- When offering status, include the story identifier and the active phase to keep stakeholders aligned.
</Story_Awareness>`;

export const AIOS_EVIDENCE_REQUIREMENTS_SECTION = `<Evidence_Requirements>
- Document the verification steps you performed (e.g., lint, tests, typecheck) and their outcomes.
- Include a short summary of diagnostics and a pointer to any artifacts that prove completion.
- Evidence is REQUIRED before status changes: without it, the story remains IN_PROGRESS.
</Evidence_Requirements>`;

export function appendAiosSections(
  basePrompt: string,
  promptAppend?: string,
): string {
  const withSections = `${basePrompt}

${AIOS_STORY_AWARENESS_SECTION}

${AIOS_EVIDENCE_REQUIREMENTS_SECTION}`;

  if (!promptAppend) {
    return withSections;
  }

  return `${withSections}

${promptAppend}`;
}
